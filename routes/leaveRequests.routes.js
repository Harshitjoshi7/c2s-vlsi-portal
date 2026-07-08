import { Router } from 'express';
import db, { createNotification } from '../database/db.js';
import { verifyToken } from '../middleware/auth.js';
import { authorize } from '../middleware/roleGuard.js';

const router = Router();

router.use(verifyToken);

// GET /api/leave-requests — list leave requests (admin: all, student: own)
router.get('/', async (req, res) => {
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
      params.push(req.user.id);
      query = `
        SELECT lr.*, a.name as approved_by_name
        FROM leave_requests lr
        LEFT JOIN users a ON lr.approved_by = a.id
        WHERE lr.user_id = $${params.length}
        ORDER BY lr.created_at DESC
      `;
    }

    const result = await db.query(query, params);

    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('List leave requests error:', error);
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

// POST /api/leave-requests — submit leave request (student)
router.post('/', async (req, res) => {
  try {
    const { start_date, end_date, reason } = req.body;

    if (!start_date || !end_date) {
      return res.status(400).json({ success: false, error: 'Start date and end date are required.' });
    }

    if (new Date(start_date) > new Date(end_date)) {
      return res.status(400).json({ success: false, error: 'Start date must be before or equal to end date.' });
    }

    const insertRes = await db.query(`
      INSERT INTO leave_requests (user_id, start_date, end_date, reason)
      VALUES ($1, $2, $3, $4)
      RETURNING id
    `, [req.user.id, start_date, end_date, reason || null]);

    const requestRes = await db.query('SELECT * FROM leave_requests WHERE id = $1', [insertRes.rows[0].id]);

    res.status(201).json({ success: true, data: requestRes.rows[0] });
  } catch (error) {
    console.error('Create leave request error:', error);
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

// PUT /api/leave-requests/:id — approve/reject (admin only)
router.put('/:id', authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Status must be "approved" or "rejected".' });
    }

    const requestRes = await db.query('SELECT * FROM leave_requests WHERE id = $1', [id]);
    const request = requestRes.rows[0];
    if (!request) {
      return res.status(404).json({ success: false, error: 'Leave request not found.' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ success: false, error: 'Leave request has already been processed.' });
    }

    await db.query(
      'UPDATE leave_requests SET status = $1, approved_by = $2 WHERE id = $3',
      [status, req.user.id, id]
    );

    // We no longer pre-fill attendance using generate_series.
    // Instead, attendance initialization logic handles on_leave dynamically day-by-day.
    if (status === 'rejected') {
      await db.query(`
        UPDATE attendance
        SET status = 'absent'
        WHERE user_id = $1
          AND attendance_date >= $2::date
          AND attendance_date <= $3::date
          AND status = 'on_leave'
      `, [request.user_id, request.start_date, request.end_date]);
    }

    // Notify the student
    await createNotification(
      request.user_id,
      'leave',
      `Leave Request ${status.charAt(0).toUpperCase() + status.slice(1)}`,
      `Your leave request from ${request.start_date} to ${request.end_date} has been ${status}.`,
      '/leave-requests'
    );

    const updatedRes = await db.query(`
      SELECT lr.*, u.name as user_name, a.name as approved_by_name
      FROM leave_requests lr
      JOIN users u ON lr.user_id = u.id
      LEFT JOIN users a ON lr.approved_by = a.id
      WHERE lr.id = $1
    `, [id]);

    res.json({ success: true, data: updatedRes.rows[0] });
  } catch (error) {
    console.error('Update leave request error:', error);
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

export default router;
