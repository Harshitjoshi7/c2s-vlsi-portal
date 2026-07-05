import { Router } from 'express';
import db from '../database/db.js';
import { verifyToken } from '../middleware/auth.js';
import { authorize } from '../middleware/roleGuard.js';

const router = Router();

router.use(verifyToken);

// GET /api/daily-logs — admin: all logs, student: own logs
router.get('/', (req, res) => {
  try {
    const { month, year } = req.query;
    const isAdminUser = req.user.role === 'admin';

    let query = 'SELECT dl.*, u.name as user_name FROM daily_logs dl JOIN users u ON dl.user_id = u.id';
    const params = [];

    if (!isAdminUser) {
      query += ' WHERE dl.user_id = ?';
      params.push(req.user.id);
    } else {
      query += ' WHERE 1=1';
    }

    if (month && year) {
      query += " AND strftime('%m', dl.log_date) = ? AND strftime('%Y', dl.log_date) = ?";
      params.push(String(month).padStart(2, '0'), String(year));
    } else if (year) {
      query += " AND strftime('%Y', dl.log_date) = ?";
      params.push(String(year));
    }

    query += ' ORDER BY dl.log_date DESC';
    const logs = db.prepare(query).all(...params);

    res.json({ success: true, data: logs });
  } catch (error) {
    console.error('List daily logs error:', error);
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

// GET /api/daily-logs/my — student's own logs
router.get('/my', (req, res) => {
  try {
    const logs = db.prepare(
      'SELECT dl.*, u.name as user_name FROM daily_logs dl JOIN users u ON dl.user_id = u.id WHERE dl.user_id = ? ORDER BY dl.log_date DESC'
    ).all(req.user.id);
    res.json({ success: true, data: logs });
  } catch (error) {
    console.error('My daily logs error:', error);
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

// GET /api/daily-logs/user/:userId — list a student's logs (admin only)
router.get('/user/:userId', authorize('admin'), (req, res) => {
  try {
    const { userId } = req.params;
    const { month, year } = req.query;

    let query = 'SELECT dl.*, u.name as user_name FROM daily_logs dl JOIN users u ON dl.user_id = u.id WHERE dl.user_id = ?';
    const params = [userId];

    if (month && year) {
      query += ' AND strftime(\'%m\', dl.log_date) = ? AND strftime(\'%Y\', dl.log_date) = ?';
      params.push(String(month).padStart(2, '0'), String(year));
    } else if (year) {
      query += ' AND strftime(\'%Y\', dl.log_date) = ?';
      params.push(String(year));
    }

    query += ' ORDER BY dl.log_date DESC';
    const logs = db.prepare(query).all(...params);

    res.json({ success: true, data: logs });
  } catch (error) {
    console.error('List user daily logs error:', error);
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

// POST /api/daily-logs — create log entry for today
router.post('/', (req, res) => {
  try {
    const { work_description, category, tools_used, status, attachments } = req.body;

    if (!work_description || !work_description.trim()) {
      return res.status(400).json({ success: false, error: 'Work description is required.' });
    }

    const today = req.body.date || req.body.log_date || new Date().toISOString().split('T')[0];

    const existing = db.prepare('SELECT id FROM daily_logs WHERE user_id = ? AND log_date = ?')
      .get(req.user.id, today);

    if (existing) {
      return res.status(409).json({ success: false, error: 'Log entry already exists for today. Use PUT to update.' });
    }

    const result = db.prepare(`
      INSERT INTO daily_logs (user_id, log_date, work_description, category, tools_used, status, attachments)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      req.user.id,
      today,
      work_description,
      category || null,
      tools_used ? (typeof tools_used === 'string' ? tools_used : JSON.stringify(tools_used)) : '[]',
      status || 'in_progress',
      attachments ? (typeof attachments === 'string' ? attachments : JSON.stringify(attachments)) : '[]'
    );

    const log = db.prepare('SELECT * FROM daily_logs WHERE id = ?').get(result.lastInsertRowid);

    // Gamification: Add 10 points for a daily log
    db.prepare('UPDATE users SET points = COALESCE(points, 0) + 10 WHERE id = ?').run(req.user.id);

    res.status(201).json({ success: true, data: log });
  } catch (error) {
    console.error('Create daily log error:', error);
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

// PUT /api/daily-logs/:id — update own log
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { work_description, category, tools_used, status, attachments } = req.body;

    const log = db.prepare('SELECT * FROM daily_logs WHERE id = ?').get(id);
    if (!log) {
      return res.status(404).json({ success: false, error: 'Log entry not found.' });
    }

    if (log.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'You can only update your own logs.' });
    }

    db.prepare(`
      UPDATE daily_logs SET
        work_description = COALESCE(?, work_description),
        category = COALESCE(?, category),
        tools_used = COALESCE(?, tools_used),
        status = COALESCE(?, status),
        attachments = COALESCE(?, attachments),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      work_description || null,
      category || null,
      tools_used ? (typeof tools_used === 'string' ? tools_used : JSON.stringify(tools_used)) : null,
      status || null,
      attachments ? (typeof attachments === 'string' ? attachments : JSON.stringify(attachments)) : null,
      id
    );

    const updated = db.prepare('SELECT * FROM daily_logs WHERE id = ?').get(id);

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Update daily log error:', error);
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

// DELETE /api/daily-logs/:id — delete own log or admin can delete any
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;

    const log = db.prepare('SELECT * FROM daily_logs WHERE id = ?').get(id);
    if (!log) {
      return res.status(404).json({ success: false, error: 'Log entry not found.' });
    }

    if (log.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'You can only delete your own logs.' });
    }

    db.prepare('DELETE FROM daily_logs WHERE id = ?').run(id);

    res.json({ success: true, data: { message: 'Log entry deleted successfully.' } });
  } catch (error) {
    console.error('Delete daily log error:', error);
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

export default router;
