import { Router } from 'express';
import db from '../database/db.js';
import { verifyToken } from '../middleware/auth.js';
import { authorize } from '../middleware/roleGuard.js';

const router = Router();

router.use(verifyToken);

// GET /api/daily-logs — admin: all logs, student: own logs
router.get('/', async (req, res) => {
  try {
    const { month, year } = req.query;
    const isAdminUser = req.user.role === 'admin';

    let query = 'SELECT dl.*, u.name as user_name FROM daily_logs dl JOIN users u ON dl.user_id = u.id';
    const params = [];

    if (!isAdminUser) {
      params.push(req.user.id);
      query += ` WHERE dl.user_id = $${params.length}`;
    } else {
      query += ' WHERE 1=1';
    }

    if (month && year) {
      params.push(String(month).padStart(2, '0'), String(year));
      query += ` AND TO_CHAR(dl.log_date, 'MM') = $${params.length - 1} AND TO_CHAR(dl.log_date, 'YYYY') = $${params.length}`;
    } else if (year) {
      params.push(String(year));
      query += ` AND TO_CHAR(dl.log_date, 'YYYY') = $${params.length}`;
    }

    query += ' ORDER BY dl.log_date DESC';
    const result = await db.query(query, params);

    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('List daily logs error:', error);
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

// GET /api/daily-logs/my — student's own logs
router.get('/my', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT dl.*, u.name as user_name FROM daily_logs dl JOIN users u ON dl.user_id = u.id WHERE dl.user_id = $1 ORDER BY dl.log_date DESC',
      [req.user.id]
    );
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('My daily logs error:', error);
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

// GET /api/daily-logs/user/:userId — list a student's logs (admin only)
router.get('/user/:userId', authorize('admin'), async (req, res) => {
  try {
    const { userId } = req.params;
    const { month, year } = req.query;

    let query = 'SELECT dl.*, u.name as user_name FROM daily_logs dl JOIN users u ON dl.user_id = u.id WHERE dl.user_id = $1';
    const params = [userId];

    if (month && year) {
      params.push(String(month).padStart(2, '0'), String(year));
      query += ` AND TO_CHAR(dl.log_date, 'MM') = $${params.length - 1} AND TO_CHAR(dl.log_date, 'YYYY') = $${params.length}`;
    } else if (year) {
      params.push(String(year));
      query += ` AND TO_CHAR(dl.log_date, 'YYYY') = $${params.length}`;
    }

    query += ' ORDER BY dl.log_date DESC';
    const result = await db.query(query, params);

    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('List user daily logs error:', error);
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

// POST /api/daily-logs — create log entry for today
router.post('/', async (req, res) => {
  try {
    const { work_description, category, tools_used, status, attachments } = req.body;

    if (!work_description || !work_description.trim()) {
      return res.status(400).json({ success: false, error: 'Work description is required.' });
    }

    const today = req.body.date || req.body.log_date || new Date().toISOString().split('T')[0];

    const existingRes = await db.query(
      'SELECT id FROM daily_logs WHERE user_id = $1 AND log_date = $2',
      [req.user.id, today]
    );

    if (existingRes.rows[0]) {
      return res.status(409).json({ success: false, error: 'Log entry already exists for today. Use PUT to update.' });
    }

    const insertRes = await db.query(`
      INSERT INTO daily_logs (user_id, log_date, work_description, category, tools_used, status, attachments)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id
    `, [
      req.user.id,
      today,
      work_description,
      category || null,
      tools_used ? (typeof tools_used === 'string' ? tools_used : JSON.stringify(tools_used)) : '[]',
      status || 'in_progress',
      attachments ? (typeof attachments === 'string' ? attachments : JSON.stringify(attachments)) : '[]',
    ]);

    const logId = insertRes.rows[0].id;
    const logRes = await db.query('SELECT * FROM daily_logs WHERE id = $1', [logId]);

    // Gamification: Add 10 points for a daily log
    await db.query('UPDATE users SET points = COALESCE(points, 0) + 10 WHERE id = $1', [req.user.id]);

    res.status(201).json({ success: true, data: logRes.rows[0] });
  } catch (error) {
    console.error('Create daily log error:', error);
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

// PUT /api/daily-logs/:id — update own log
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { work_description, category, tools_used, status, attachments } = req.body;

    const logRes = await db.query('SELECT * FROM daily_logs WHERE id = $1', [id]);
    const log = logRes.rows[0];
    if (!log) {
      return res.status(404).json({ success: false, error: 'Log entry not found.' });
    }

    if (log.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'You can only update your own logs.' });
    }

    await db.query(`
      UPDATE daily_logs SET
        work_description = COALESCE($1, work_description),
        category = COALESCE($2, category),
        tools_used = COALESCE($3, tools_used),
        status = COALESCE($4, status),
        attachments = COALESCE($5, attachments),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $6
    `, [
      work_description || null,
      category || null,
      tools_used ? (typeof tools_used === 'string' ? tools_used : JSON.stringify(tools_used)) : null,
      status || null,
      attachments ? (typeof attachments === 'string' ? attachments : JSON.stringify(attachments)) : null,
      id,
    ]);

    const updatedRes = await db.query('SELECT * FROM daily_logs WHERE id = $1', [id]);

    res.json({ success: true, data: updatedRes.rows[0] });
  } catch (error) {
    console.error('Update daily log error:', error);
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

// DELETE /api/daily-logs/:id — delete own log or admin can delete any
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const logRes = await db.query('SELECT * FROM daily_logs WHERE id = $1', [id]);
    const log = logRes.rows[0];
    if (!log) {
      return res.status(404).json({ success: false, error: 'Log entry not found.' });
    }

    if (log.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'You can only delete your own logs.' });
    }

    await db.query('DELETE FROM daily_logs WHERE id = $1', [id]);

    res.json({ success: true, data: { message: 'Log entry deleted successfully.' } });
  } catch (error) {
    console.error('Delete daily log error:', error);
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

export default router;
