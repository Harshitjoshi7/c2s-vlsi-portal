import { Router } from 'express';
import db, { createNotification } from '../database/db.js';
import { verifyToken } from '../middleware/auth.js';
import { authorize } from '../middleware/roleGuard.js';

const router = Router();

router.use(verifyToken);

// GET /api/leave-requests — list leave requests (admin: all, student: own)
router.get('/', (req, res) => {
  try {
    let query;
    const params = [];

    if (req.user.role === 'admin') {
      query = `
        SELECT lr.*, u.name as user_name, u.email as user_email,
               a.name as approved_by_name
        FROM leave_requests lr
        JOIN users u ON lr.user_id = u.id
        LEFT JOIN users a ON lr.approved_by = a.id
        ORDER BY lr.created_at DESC
      `;
    } else {
      query = `
        SELECT lr.*, a.name as approved_by_name
        FROM leave_requests lr
        LEFT JOIN users a ON lr.approved_by = a.id
        WHERE lr.user_id = ?
        ORDER BY lr.created_at DESC
      `;
      params.push(req.user.id);
    }

    const requests = db.prepare(query).all(...params);

    res.json({ success: true, data: requests });
  } catch (error) {
    console.error('List leave requests error:', error);
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

// POST /api/leave-requests — submit leave request (student)
router.post('/', (req, res) => {
  try {
    const { start_date, end_date, reason } = req.body;

    if (!start_date || !end_date) {
      return res.status(400).json({ success: false, error: 'Start date and end date are required.' });
    }

    if (new Date(start_date) > new Date(end_date)) {
      return res.status(400).json({ success: false, error: 'Start date must be before or equal to end date.' });
    }

    const result = db.prepare(`
      INSERT INTO leave_requests (user_id, start_date, end_date, reason)
      VALUES (?, ?, ?, ?)
    `).run(req.user.id, start_date, end_date, reason || null);

    const request = db.prepare('SELECT * FROM leave_requests WHERE id = ?').get(result.lastInsertRowid);

    res.status(201).json({ success: true, data: request });
  } catch (error) {
    console.error('Create leave request error:', error);
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

// PUT /api/leave-requests/:id — approve/reject (admin only)
router.put('/:id', authorize('admin'), (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Status must be "approved" or "rejected".' });
    }

    const request = db.prepare('SELECT * FROM leave_requests WHERE id = ?').get(id);
    if (!request) {
      return res.status(404).json({ success: false, error: 'Leave request not found.' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ success: false, error: 'Leave request has already been processed.' });
    }

    db.prepare(`
      UPDATE leave_requests SET status = ?, approved_by = ? WHERE id = ?
    `).run(status, req.user.id, id);

    // Notify the student
    createNotification(
      request.user_id,
      'leave',
      `Leave Request ${status.charAt(0).toUpperCase() + status.slice(1)}`,
      `Your leave request from ${request.start_date} to ${request.end_date} has been ${status}.`,
      `/leave-requests`
    );

    const updated = db.prepare(`
      SELECT lr.*, u.name as user_name, a.name as approved_by_name
      FROM leave_requests lr
      JOIN users u ON lr.user_id = u.id
      LEFT JOIN users a ON lr.approved_by = a.id
      WHERE lr.id = ?
    `).get(id);

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Update leave request error:', error);
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

export default router;
