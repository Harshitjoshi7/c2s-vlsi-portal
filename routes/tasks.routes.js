import { Router } from 'express';
import db, { createNotification, withTransaction } from '../database/db.js';
import { verifyToken } from '../middleware/auth.js';
import { authorize } from '../middleware/roleGuard.js';

const router = Router();

router.use(verifyToken);

const attachAssignees = (tasks) => {
  if (!tasks || tasks.length === 0) return tasks;
  const taskIds = tasks.map(t => t.id);
  const placeholders = taskIds.map(() => '?').join(',');
  const assignments = db.prepare(`
    SELECT ta.task_id, u.name, u.id as user_id 
    FROM task_assignments ta 
    JOIN users u ON ta.user_id = u.id 
    WHERE ta.task_id IN (${placeholders})
  `).all(...taskIds);
  
  const assigneesByTask = {};
  for (const a of assignments) {
    if (!assigneesByTask[a.task_id]) assigneesByTask[a.task_id] = [];
    assigneesByTask[a.task_id].push({ id: a.user_id, name: a.name });
  }
  
  return tasks.map(t => ({ ...t, assignees: assigneesByTask[t.id] || [] }));
};

// GET /api/tasks — list tasks (admin: all, student: assigned only)
router.get('/', (req, res) => {
  try {
    const { status } = req.query;

    if (req.user.role === 'admin') {
      let query = 'SELECT t.*, u.name as assigned_by_name FROM tasks t JOIN users u ON t.assigned_by = u.id';
      const params = [];

      if (status) {
        query += ' WHERE t.status = ?';
        params.push(status);
      }

      query += ' ORDER BY t.created_at DESC';
      const tasks = db.prepare(query).all(...params);

      res.json({ success: true, data: attachAssignees(tasks) });
    } else {
      let query = `
        SELECT t.*, u.name as assigned_by_name, ta.progress_notes, ta.assigned_at, ta.completed_at
        FROM tasks t
        JOIN task_assignments ta ON t.id = ta.task_id
        JOIN users u ON t.assigned_by = u.id
        WHERE ta.user_id = ?
      `;
      const params = [req.user.id];

      if (status) {
        query += ' AND t.status = ?';
        params.push(status);
      }

      query += ' ORDER BY t.created_at DESC';
      const tasks = db.prepare(query).all(...params);

      res.json({ success: true, data: attachAssignees(tasks) });
    }
  } catch (error) {
    console.error('List tasks error:', error);
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

// GET /api/tasks/my — student's assigned tasks
router.get('/my', (req, res) => {
  try {
    const tasks = db.prepare(`
      SELECT t.*, u.name as assigned_by_name, ta.progress_notes, ta.assigned_at, ta.completed_at
      FROM tasks t
      JOIN task_assignments ta ON t.id = ta.task_id
      JOIN users u ON t.assigned_by = u.id
      WHERE ta.user_id = ?
      ORDER BY t.created_at DESC
    `).all(req.user.id);
    res.json({ success: true, data: attachAssignees(tasks) });
  } catch (error) {
    console.error('My tasks error:', error);
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

// GET /api/tasks/kanban — tasks in kanban column format
router.get('/kanban', (req, res) => {
  try {
    let tasks;
    if (req.user.role === 'admin') {
      tasks = db.prepare(`
        SELECT t.*, u.name as assigned_by_name
        FROM tasks t JOIN users u ON t.assigned_by = u.id
        ORDER BY t.created_at DESC
      `).all();
    } else {
      tasks = db.prepare(`
        SELECT t.*, u.name as assigned_by_name, ta.progress_notes
        FROM tasks t
        JOIN task_assignments ta ON t.id = ta.task_id
        JOIN users u ON t.assigned_by = u.id
        WHERE ta.user_id = ?
        ORDER BY t.created_at DESC
      `).all(req.user.id);
    }

    const tasksWithAssignees = attachAssignees(tasks);

    // Group by status columns
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
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const task = db.prepare(`
      SELECT t.*, u.name as assigned_by_name
      FROM tasks t
      JOIN users u ON t.assigned_by = u.id
      WHERE t.id = ?
    `).get(id);

    if (!task) {
      return res.status(404).json({ success: false, error: 'Task not found.' });
    }

    const assignments = db.prepare(`
      SELECT ta.*, u.name as user_name, u.email as user_email
      FROM task_assignments ta
      JOIN users u ON ta.user_id = u.id
      WHERE ta.task_id = ?
    `).all(id);

    res.json({ success: true, data: { ...task, assignments } });
  } catch (error) {
    console.error('Get task error:', error);
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

// POST /api/tasks — create task and assign to students (admin only)
router.post('/', authorize('admin'), (req, res) => {
  try {
    const { title, description, priority, category, deadline, attachments, assigned_to } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, error: 'Task title is required.' });
    }

    const result = db.prepare(`
      INSERT INTO tasks (title, description, assigned_by, priority, category, deadline, attachments)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      title,
      description || null,
      req.user.id,
      priority || 'medium',
      category || null,
      deadline || null,
      attachments ? JSON.stringify(attachments) : '[]'
    );

    const taskId = result.lastInsertRowid;

    // Assign to students
    if (assigned_to && Array.isArray(assigned_to) && assigned_to.length > 0) {
      const insertAssignment = db.prepare(
        'INSERT INTO task_assignments (task_id, user_id) VALUES (?, ?)'
      );

      const doAssign = withTransaction((studentIds) => {
        for (const studentId of studentIds) {
          insertAssignment.run(taskId, studentId);
          createNotification(
            studentId,
            'task',
            'New Task Assigned',
            `You have been assigned a new task: ${title}`,
            `/tasks/${taskId}`
          );
        }
      });

      doAssign(assigned_to);
    }

    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId);
    const assignments = db.prepare(`
      SELECT ta.*, u.name as user_name
      FROM task_assignments ta
      JOIN users u ON ta.user_id = u.id
      WHERE ta.task_id = ?
    `).all(taskId);

    res.status(201).json({ success: true, data: { ...task, assignments } });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

// PUT /api/tasks/:id — update task details (admin only)
router.put('/:id', authorize('admin'), (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, priority, status, category, deadline, attachments } = req.body;

    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
    if (!task) {
      return res.status(404).json({ success: false, error: 'Task not found.' });
    }

    db.prepare(`
      UPDATE tasks SET
        title = COALESCE(?, title),
        description = COALESCE(?, description),
        priority = COALESCE(?, priority),
        status = COALESCE(?, status),
        category = COALESCE(?, category),
        deadline = COALESCE(?, deadline),
        attachments = COALESCE(?, attachments),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      title || null,
      description || null,
      priority || null,
      status || null,
      category || null,
      deadline || null,
      attachments ? JSON.stringify(attachments) : null,
      id
    );

    const updated = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

// PUT /api/tasks/:id/status — update task status (assigned student)
router.put('/:id/status', (req, res) => {
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

    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
    if (!task) {
      return res.status(404).json({ success: false, error: 'Task not found.' });
    }

    // Verify the student is assigned to this task
    const assignment = db.prepare(
      'SELECT * FROM task_assignments WHERE task_id = ? AND user_id = ?'
    ).get(id, req.user.id);

    if (!assignment && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'You are not assigned to this task.' });
    }

    // Update task status
    db.prepare('UPDATE tasks SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(status, id);

    // Update assignment progress notes and completed_at
    if (assignment) {
      const completedAt = status === 'completed' ? new Date().toISOString() : null;
      db.prepare(`
        UPDATE task_assignments SET
          progress_notes = COALESCE(?, progress_notes),
          completed_at = COALESCE(?, completed_at)
        WHERE task_id = ? AND user_id = ?
      `).run(progress_notes || null, completedAt, id, req.user.id);
    }

    // Gamification: Add 20 points if completing for the first time
    if (status === 'completed' && task.status !== 'completed' && assignment) {
      db.prepare('UPDATE users SET points = COALESCE(points, 0) + 20 WHERE id = ?').run(req.user.id);
    }

    const updated = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Update task status error:', error);
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

// DELETE /api/tasks/:id — delete task (admin only)
router.delete('/:id', authorize('admin'), (req, res) => {
  try {
    const { id } = req.params;

    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
    if (!task) {
      return res.status(404).json({ success: false, error: 'Task not found.' });
    }

    db.prepare('DELETE FROM tasks WHERE id = ?').run(id);

    res.json({ success: true, data: { message: 'Task deleted successfully.' } });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

export default router;
