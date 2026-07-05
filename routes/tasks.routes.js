import { Router } from 'express';
import db, { createNotification } from '../database/db.js';
import { verifyToken } from '../middleware/auth.js';
import { authorize } from '../middleware/roleGuard.js';

const router = Router();

router.use(verifyToken);

// Helper: attach assignees to a list of tasks
const attachAssignees = async (tasks) => {
  if (!tasks || tasks.length === 0) return tasks;
  const taskIds = tasks.map(t => t.id);
  const placeholders = taskIds.map((_, i) => `$${i + 1}`).join(',');
  const assignmentsRes = await db.query(`
    SELECT ta.task_id, u.name, u.id as user_id 
    FROM task_assignments ta 
    JOIN users u ON ta.user_id = u.id 
    WHERE ta.task_id IN (${placeholders})
  `, taskIds);

  const assigneesByTask = {};
  for (const a of assignmentsRes.rows) {
    if (!assigneesByTask[a.task_id]) assigneesByTask[a.task_id] = [];
    assigneesByTask[a.task_id].push({ id: a.user_id, name: a.name });
  }

  return tasks.map(t => ({ ...t, assignees: assigneesByTask[t.id] || [] }));
};

// GET /api/tasks — list tasks (admin: all, student: assigned only)
router.get('/', async (req, res) => {
  try {
    const { status } = req.query;

    if (req.user.role === 'admin') {
      let query = 'SELECT t.*, u.name as assigned_by_name FROM tasks t JOIN users u ON t.assigned_by = u.id';
      const params = [];

      if (status) {
        params.push(status);
        query += ` WHERE t.status = $${params.length}`;
      }

      query += ' ORDER BY t.created_at DESC';
      const result = await db.query(query, params);

      res.json({ success: true, data: await attachAssignees(result.rows) });
    } else {
      let query = `
        SELECT t.*, u.name as assigned_by_name, ta.progress_notes, ta.assigned_at, ta.completed_at
        FROM tasks t
        JOIN task_assignments ta ON t.id = ta.task_id
        JOIN users u ON t.assigned_by = u.id
        WHERE ta.user_id = $1
      `;
      const params = [req.user.id];

      if (status) {
        params.push(status);
        query += ` AND t.status = $${params.length}`;
      }

      query += ' ORDER BY t.created_at DESC';
      const result = await db.query(query, params);

      res.json({ success: true, data: await attachAssignees(result.rows) });
    }
  } catch (error) {
    console.error('List tasks error:', error);
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

// GET /api/tasks/my — student's assigned tasks
router.get('/my', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT t.*, u.name as assigned_by_name, ta.progress_notes, ta.assigned_at, ta.completed_at
      FROM tasks t
      JOIN task_assignments ta ON t.id = ta.task_id
      JOIN users u ON t.assigned_by = u.id
      WHERE ta.user_id = $1
      ORDER BY t.created_at DESC
    `, [req.user.id]);

    res.json({ success: true, data: await attachAssignees(result.rows) });
  } catch (error) {
    console.error('My tasks error:', error);
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

// GET /api/tasks/kanban — tasks in kanban column format
router.get('/kanban', async (req, res) => {
  try {
    let tasks;
    if (req.user.role === 'admin') {
      const result = await db.query(`
        SELECT t.*, u.name as assigned_by_name
        FROM tasks t JOIN users u ON t.assigned_by = u.id
        ORDER BY t.created_at DESC
      `);
      tasks = result.rows;
    } else {
      const result = await db.query(`
        SELECT t.*, u.name as assigned_by_name, ta.progress_notes
        FROM tasks t
        JOIN task_assignments ta ON t.id = ta.task_id
        JOIN users u ON t.assigned_by = u.id
        WHERE ta.user_id = $1
        ORDER BY t.created_at DESC
      `, [req.user.id]);
      tasks = result.rows;
    }

    const tasksWithAssignees = await attachAssignees(tasks);

    const kanban = {
      assigned: tasksWithAssignees.filter(t => t.status === 'assigned'),
      in_progress: tasksWithAssignees.filter(t => t.status === 'in_progress'),
      under_review: tasksWithAssignees.filter(t => t.status === 'under_review'),
      completed: tasksWithAssignees.filter(t => t.status === 'completed'),
    };

    res.json(kanban);
  } catch (error) {
    console.error('Kanban tasks error:', error);
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

// GET /api/tasks/:id — get task with assignments
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const taskRes = await db.query(`
      SELECT t.*, u.name as assigned_by_name
      FROM tasks t
      JOIN users u ON t.assigned_by = u.id
      WHERE t.id = $1
    `, [id]);
    const task = taskRes.rows[0];

    if (!task) {
      return res.status(404).json({ success: false, error: 'Task not found.' });
    }

    const assignmentsRes = await db.query(`
      SELECT ta.*, u.name as user_name, u.email as user_email
      FROM task_assignments ta
      JOIN users u ON ta.user_id = u.id
      WHERE ta.task_id = $1
    `, [id]);

    res.json({ success: true, data: { ...task, assignments: assignmentsRes.rows } });
  } catch (error) {
    console.error('Get task error:', error);
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

// POST /api/tasks — create task and assign to students (admin only)
router.post('/', authorize('admin'), async (req, res) => {
  try {
    const { title, description, priority, category, deadline, attachments, assigned_to } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, error: 'Task title is required.' });
    }

    const insertRes = await db.query(`
      INSERT INTO tasks (title, description, assigned_by, priority, category, deadline, attachments)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id
    `, [
      title,
      description || null,
      req.user.id,
      priority || 'medium',
      category || null,
      deadline || null,
      attachments ? JSON.stringify(attachments) : '[]',
    ]);

    const taskId = insertRes.rows[0].id;

    // Assign to students and notify
    if (assigned_to && Array.isArray(assigned_to) && assigned_to.length > 0) {
      for (const studentId of assigned_to) {
        await db.query('INSERT INTO task_assignments (task_id, user_id) VALUES ($1, $2)', [taskId, studentId]);
        await createNotification(
          studentId,
          'task',
          'New Task Assigned',
          `You have been assigned a new task: ${title}`,
          `/tasks/${taskId}`
        );
      }
    }

    const taskRes = await db.query('SELECT * FROM tasks WHERE id = $1', [taskId]);
    const assignmentsRes = await db.query(`
      SELECT ta.*, u.name as user_name
      FROM task_assignments ta
      JOIN users u ON ta.user_id = u.id
      WHERE ta.task_id = $1
    `, [taskId]);

    res.status(201).json({ success: true, data: { ...taskRes.rows[0], assignments: assignmentsRes.rows } });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

// PUT /api/tasks/:id — update task details (admin only)
router.put('/:id', authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, priority, status, category, deadline, attachments } = req.body;

    const taskRes = await db.query('SELECT * FROM tasks WHERE id = $1', [id]);
    if (!taskRes.rows[0]) {
      return res.status(404).json({ success: false, error: 'Task not found.' });
    }

    await db.query(`
      UPDATE tasks SET
        title = COALESCE($1, title),
        description = COALESCE($2, description),
        priority = COALESCE($3, priority),
        status = COALESCE($4, status),
        category = COALESCE($5, category),
        deadline = COALESCE($6, deadline),
        attachments = COALESCE($7, attachments),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $8
    `, [
      title || null,
      description || null,
      priority || null,
      status || null,
      category || null,
      deadline || null,
      attachments ? JSON.stringify(attachments) : null,
      id,
    ]);

    const updatedRes = await db.query('SELECT * FROM tasks WHERE id = $1', [id]);

    res.json({ success: true, data: updatedRes.rows[0] });
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

// PUT /api/tasks/:id/status — update task status (assigned student)
router.put('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, progress_notes } = req.body;

    if (!status) {
      return res.status(400).json({ success: false, error: 'Status is required.' });
    }

    const validStatuses = ['assigned', 'in_progress', 'under_review', 'completed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }

    const taskRes = await db.query('SELECT * FROM tasks WHERE id = $1', [id]);
    const task = taskRes.rows[0];
    if (!task) {
      return res.status(404).json({ success: false, error: 'Task not found.' });
    }

    // Verify the student is assigned to this task
    const assignmentRes = await db.query(
      'SELECT * FROM task_assignments WHERE task_id = $1 AND user_id = $2',
      [id, req.user.id]
    );
    const assignment = assignmentRes.rows[0];

    if (!assignment && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'You are not assigned to this task.' });
    }

    // Update task status
    await db.query('UPDATE tasks SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [status, id]);

    // Update assignment progress notes and completed_at
    if (assignment) {
      const completedAt = status === 'completed' ? new Date().toISOString() : null;
      await db.query(`
        UPDATE task_assignments SET
          progress_notes = COALESCE($1, progress_notes),
          completed_at = COALESCE($2, completed_at)
        WHERE task_id = $3 AND user_id = $4
      `, [progress_notes || null, completedAt, id, req.user.id]);
    }

    // Gamification: Add 20 points if completing for the first time
    if (status === 'completed' && task.status !== 'completed' && assignment) {
      await db.query('UPDATE users SET points = COALESCE(points, 0) + 20 WHERE id = $1', [req.user.id]);
    }

    const updatedRes = await db.query('SELECT * FROM tasks WHERE id = $1', [id]);

    res.json({ success: true, data: updatedRes.rows[0] });
  } catch (error) {
    console.error('Update task status error:', error);
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

// DELETE /api/tasks/:id — delete task (admin only)
router.delete('/:id', authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;

    const taskRes = await db.query('SELECT * FROM tasks WHERE id = $1', [id]);
    if (!taskRes.rows[0]) {
      return res.status(404).json({ success: false, error: 'Task not found.' });
    }

    await db.query('DELETE FROM tasks WHERE id = $1', [id]);

    res.json({ success: true, data: { message: 'Task deleted successfully.' } });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

export default router;
