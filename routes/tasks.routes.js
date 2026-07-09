import { Router } from 'express';
import db, { createNotification } from '../database/db.js';
import { verifyToken } from '../middleware/auth.js';
import { authorize } from '../middleware/roleGuard.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Setup multer storage for task images
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'public/uploads/tasks/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'task-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

const router = Router();

router.use(verifyToken);

// Helper: attach assignees to a list of tasks
const attachAssignees = async (tasks) => {
  if (!tasks || tasks.length === 0) return tasks;
  const taskIds = tasks.map(t => t.id);
  const placeholders = taskIds.map((_, i) => `$${i + 1}`).join(',');
  const assignmentsRes = await db.query(`
    SELECT ta.task_id, ta.status as assignment_status, u.name, u.id as user_id 
    FROM task_assignments ta 
    JOIN users u ON ta.user_id = u.id 
    WHERE ta.task_id IN (${placeholders})
  `, taskIds);

  const assigneesByTask = {};
  for (const a of assignmentsRes.rows) {
    if (!assigneesByTask[a.task_id]) assigneesByTask[a.task_id] = [];
    assigneesByTask[a.task_id].push({ id: a.user_id, name: a.name, status: a.assignment_status || 'assigned' });
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
        SELECT t.*, COALESCE(ta.status, t.status) as status, u.name as assigned_by_name, ta.progress_notes, ta.assigned_at, ta.completed_at
        FROM tasks t
        JOIN task_assignments ta ON t.id = ta.task_id
        JOIN users u ON t.assigned_by = u.id
        WHERE ta.user_id = $1
      `;
      const params = [req.user.id];

      if (status) {
        params.push(status);
        query += ` AND COALESCE(ta.status, t.status) = $${params.length}`;
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
      SELECT t.*, COALESCE(ta.status, t.status) as status, u.name as assigned_by_name, ta.progress_notes, ta.assigned_at, ta.completed_at
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
        SELECT t.*, COALESCE(ta.status, t.status) as status, u.name as assigned_by_name, ta.progress_notes
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

    const tasksCreated = [];
    const assignees = (assigned_to && Array.isArray(assigned_to) && assigned_to.length > 0) ? assigned_to : [null];

    for (const studentId of assignees) {
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
      tasksCreated.push(taskId);

      // Assign to student and notify if applicable
      if (studentId) {
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

    // Return the first created task as representative for the response
    const firstTaskId = tasksCreated[0];
    const taskRes = await db.query('SELECT * FROM tasks WHERE id = $1', [firstTaskId]);
    const assignmentsRes = await db.query(`
      SELECT ta.*, u.name as user_name
      FROM task_assignments ta
      JOIN users u ON ta.user_id = u.id
      WHERE ta.task_id = $1
    `, [firstTaskId]);

    res.status(201).json({ success: true, data: { ...taskRes.rows[0], assignments: assignmentsRes.rows }, createdCount: tasksCreated.length });
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

// PUT /api/tasks/:id/status — update task status (assigned student or admin)
router.put('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    let { status, progress_notes, user_id } = req.body;

    if (!status) {
      return res.status(400).json({ success: false, error: 'Status is required.' });
    }

    const validStatuses = ['assigned', 'in_progress', 'under_review', 'needs_revision', 'completed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }

    // Intercept student 'completed' -> 'under_review'
    if (req.user.role === 'student' && status === 'completed') {
      status = 'under_review';
    }

    const taskRes = await db.query('SELECT * FROM tasks WHERE id = $1', [id]);
    const task = taskRes.rows[0];
    if (!task) {
      return res.status(404).json({ success: false, error: 'Task not found.' });
    }

    // Determine whose assignment we are updating
    const targetUserId = (req.user.role === 'admin' && user_id) ? user_id : req.user.id;

    // Find the specific student's assignment
    const assignmentRes = await db.query(
      'SELECT * FROM task_assignments WHERE task_id = $1 AND user_id = $2',
      [id, targetUserId]
    );
    const assignment = assignmentRes.rows[0];

    if (!assignment && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'You are not assigned to this task.' });
    }

    // If admin is not targeting a specific student and has no assignment, update global only
    if (req.user.role === 'admin' && !assignment && !user_id) {
      await db.query('UPDATE tasks SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [status, id]);
      const updatedRes = await db.query('SELECT * FROM tasks WHERE id = $1', [id]);
      return res.json({ success: true, data: updatedRes.rows[0] });
    }

    // Update the individual student's assignment
    if (assignment) {
      const completedAt = status === 'completed' ? new Date().toISOString() : null;
      await db.query(`
        UPDATE task_assignments SET
          status = $1,
          progress_notes = COALESCE($2, progress_notes),
          completed_at = $3
        WHERE id = $4
      `, [status, progress_notes || null, completedAt, assignment.id]);
      
      // Keep global task status in sync since it's now 1:1
      await db.query('UPDATE tasks SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [status, id]);

      // Gamification: Add 20 points if completing for the first time
      if (status === 'completed' && assignment.status !== 'completed') {
        await db.query('UPDATE users SET points = COALESCE(points, 0) + 20 WHERE id = $1', [targetUserId]);
      }

      // Notification: Student submits for review → notify all admins
      if (req.user.role === 'student' && status === 'under_review') {
        const studentName = req.user.name || 'A student';
        const adminsRes = await db.query("SELECT id FROM users WHERE role = 'admin'");
        for (const admin of adminsRes.rows) {
          await createNotification(
            admin.id,
            'task',
            'Task Review Request',
            `${studentName} has submitted "${task.title}" for review.`,
            `/tasks`
          );
        }
      }

      // Notification: Admin approves completed → notify the student
      if (req.user.role === 'admin' && status === 'completed' && assignment.status !== 'completed') {
        await createNotification(
          targetUserId,
          'task',
          'Task Approved!',
          `Your task "${task.title}" has been approved and marked as completed.`,
          `/tasks`
        );
      }
      
      // Notification: Admin sets to needs_revision → notify the student
      if (req.user.role === 'admin' && status === 'needs_revision' && assignment.status !== 'needs_revision') {
        await createNotification(
          targetUserId,
          'task',
          'Task Needs Revision',
          `Your task "${task.title}" needs revision. Please check the feedback.`,
          `/tasks`
        );
      }

      // Always recalculate the global task status from ALL assignments
      const allAssignmentsRes = await db.query('SELECT status FROM task_assignments WHERE task_id = $1', [id]);
      const allStatuses = allAssignmentsRes.rows.map(a => a.status);

      let newGlobalStatus;
      if (allStatuses.every(s => s === 'completed')) {
        newGlobalStatus = 'completed';
      } else if (allStatuses.some(s => s === 'under_review')) {
        newGlobalStatus = 'under_review';
      } else if (allStatuses.some(s => s === 'in_progress')) {
        newGlobalStatus = 'in_progress';
      } else {
        newGlobalStatus = 'assigned';
      }

      await db.query('UPDATE tasks SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [newGlobalStatus, id]);
    }

    const updatedRes = await db.query('SELECT * FROM tasks WHERE id = $1', [id]);
    res.json({ success: true, data: updatedRes.rows[0] });
  } catch (error) {
    console.error('Update task status error:', error);
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

// DELETE /api/tasks/:id/assignments/:userId — remove assignment for one student (admin only)
router.delete('/:id/assignments/:userId', authorize('admin'), async (req, res) => {
  try {
    const { id, userId } = req.params;
    
    // Check if assignment exists
    const assignmentRes = await db.query(
      'SELECT * FROM task_assignments WHERE task_id = $1 AND user_id = $2',
      [id, userId]
    );
    
    if (!assignmentRes.rows[0]) {
      return res.status(404).json({ success: false, error: 'Assignment not found.' });
    }
    
    await db.query('DELETE FROM task_assignments WHERE task_id = $1 AND user_id = $2', [id, userId]);
    
    // Optional: Check if it's the last assignment, if yes, we could delete the task or just leave it unassigned.
    // We will just leave it unassigned.
    
    // Recalculate global status
    const allAssignmentsRes = await db.query('SELECT status FROM task_assignments WHERE task_id = $1', [id]);
    const allStatuses = allAssignmentsRes.rows.map(a => a.status);
    
    let newGlobalStatus = 'assigned';
    if (allStatuses.length > 0) {
      if (allStatuses.every(s => s === 'completed')) {
        newGlobalStatus = 'completed';
      } else if (allStatuses.some(s => s === 'under_review')) {
        newGlobalStatus = 'under_review';
      } else if (allStatuses.some(s => s === 'in_progress')) {
        newGlobalStatus = 'in_progress';
      }
    }
    
    await db.query('UPDATE tasks SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [newGlobalStatus, id]);
    
    res.json({ success: true, data: { message: 'Assignment removed successfully.' } });
  } catch (error) {
    console.error('Delete assignment error:', error);
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

// POST /api/tasks/:id/history — add history note / image
router.post('/:id/history', upload.single('image'), async (req, res) => {
  try {
    const { id } = req.params;
    const { message, status_change } = req.body;
    let imageUrl = null;

    if (req.file) {
      imageUrl = '/uploads/tasks/' + req.file.filename;
    }

    if (!message && !imageUrl && !status_change) {
      return res.status(400).json({ success: false, error: 'Empty history submission.' });
    }

    const taskRes = await db.query('SELECT history_log FROM tasks WHERE id = $1', [id]);
    if (!taskRes.rows[0]) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(404).json({ success: false, error: 'Task not found.' });
    }

    let historyLog = [];
    try {
      if (taskRes.rows[0].history_log) {
        historyLog = JSON.parse(taskRes.rows[0].history_log);
      }
    } catch (e) {
      historyLog = [];
    }

    historyLog.push({
      user: req.user.name,
      message: message || '',
      image_url: imageUrl,
      status_change: status_change || null,
      timestamp: new Date().toISOString()
    });

    await db.query(`
      UPDATE tasks SET history_log = $1 WHERE id = $2
    `, [JSON.stringify(historyLog), id]);

    // Notification logic
    // If admin adds a note, notify assigned students
    if (req.user.role === 'admin' && message) {
      const assignments = await db.query('SELECT user_id FROM task_assignments WHERE task_id = $1', [id]);
      for (const a of assignments.rows) {
        await createNotification(
          a.user_id,
          'task',
          'New Task Comment',
          `${req.user.name} added a note on task #${id}.`,
          `/tasks`
        );
      }
    }

    res.json({ success: true, data: historyLog });
  } catch (error) {
    console.error('History update error:', error);
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

export default router;
