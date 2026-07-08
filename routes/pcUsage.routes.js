import { Router } from 'express';
import db from '../database/db.js';
import { verifyToken } from '../middleware/auth.js';

const router = Router();
router.use(verifyToken);

// GET /api/pc-usage — list usage logs (filtered by role and optional time range)
router.get('/', async (req, res) => {
  try {
    const isAdmin = req.user.role === 'admin';
    const { filter = 'daily', date = new Date().toISOString().split('T')[0] } = req.query;

    let dateCondition = "u.usage_date = $1";
    let queryParams = [date];

    if (filter === 'weekly') {
      dateCondition = "u.usage_date >= date_trunc('week', $1::date) AND u.usage_date < date_trunc('week', $1::date) + interval '1 week'";
    } else if (filter === 'monthly') {
      dateCondition = "u.usage_date >= date_trunc('month', $1::date) AND u.usage_date < date_trunc('month', $1::date) + interval '1 month'";
    }

    let query;
    if (isAdmin) {
      query = `
        SELECT p.id as pc_id, p.pc_name,
               a.user_id as assigned_user_id, s.name as user_name,
               u.id as log_id, u.usage_date, COALESCE(u.status, 'off') as status, u.tool_used, COALESCE(u.total_minutes_on, 0) as total_minutes_on
        FROM pcs p
        LEFT JOIN pc_assignments a ON p.id = a.pc_id AND a.status = 'active'
        LEFT JOIN users s ON a.user_id = s.id
        LEFT JOIN pc_usage_logs u ON p.id = u.pc_id AND ${dateCondition}
        ORDER BY p.pc_name ASC, u.usage_date DESC
      `;
    } else {
      query = `
        SELECT p.id as pc_id, p.pc_name,
               a.user_id as assigned_user_id, s.name as user_name,
               u.id as log_id, u.usage_date, COALESCE(u.status, 'off') as status, u.tool_used, COALESCE(u.total_minutes_on, 0) as total_minutes_on
        FROM pcs p
        JOIN pc_assignments a ON p.id = a.pc_id AND a.status = 'active' AND a.user_id = $2
        JOIN users s ON a.user_id = s.id
        LEFT JOIN pc_usage_logs u ON p.id = u.pc_id AND ${dateCondition}
        ORDER BY p.pc_name ASC, u.usage_date DESC
      `;
      queryParams.push(req.user.id);
    }

    const result = await db.query(query, queryParams);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('List PC usage error:', error);
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

// POST /api/pc-usage/toggle — turn PC on/off
router.post('/toggle', async (req, res) => {
  try {
    const { pc_id, status, tool_used } = req.body;
    const isAdmin = req.user.role === 'admin';
    const today = new Date().toISOString().split('T')[0];

    // 1. Verify PC assignment
    const assignmentRes = await db.query(
      "SELECT user_id FROM pc_assignments WHERE pc_id = $1 AND status = 'active'",
      [pc_id]
    );
    const assignedUserId = assignmentRes.rows[0]?.user_id;

    if (!isAdmin && assignedUserId !== req.user.id) {
      return res.status(403).json({ success: false, error: 'You are not assigned to this PC.' });
    }

    const targetUserId = assignedUserId || req.user.id;

    // 2. If student, verify attendance
    if (!isAdmin) {
      const attRes = await db.query(
        "SELECT status FROM attendance WHERE user_id = $1 AND attendance_date = $2",
        [req.user.id, today]
      );
      const attStatus = attRes.rows[0]?.status;
      if (attStatus !== 'present' && attStatus !== 'late') {
        return res.status(403).json({ success: false, error: 'You must check in for attendance before using your PC.' });
      }
    }

    // 3. Upsert usage log
    const existingRes = await db.query(
      "SELECT * FROM pc_usage_logs WHERE user_id = $1 AND pc_id = $2 AND usage_date = $3",
      [targetUserId, pc_id, today]
    );

    let result;
    if (existingRes.rows[0]) {
      const existing = existingRes.rows[0];
      
      // Calculate minutes if turning off
      let addMinutes = 0;
      if (status === 'off' && existing.status === 'on' && existing.turned_on_at) {
        // If it was already on, compute difference between now and turned_on_at
        const diffMs = new Date() - new Date(existing.turned_on_at);
        addMinutes = Math.floor(diffMs / 60000);
      }

      const updateQuery = `
        UPDATE pc_usage_logs SET
          status = $1,
          tool_used = COALESCE($2, tool_used),
          turned_on_at = CASE WHEN $1 = 'on' THEN CURRENT_TIMESTAMP ELSE turned_on_at END,
          turned_off_at = CASE WHEN $1 = 'off' THEN CURRENT_TIMESTAMP ELSE turned_off_at END,
          total_minutes_on = total_minutes_on + $3
        WHERE id = $4
        RETURNING *
      `;
      result = await db.query(updateQuery, [status, tool_used || null, addMinutes, existing.id]);
    } else {
      const insertQuery = `
        INSERT INTO pc_usage_logs (user_id, pc_id, usage_date, status, tool_used, turned_on_at, turned_off_at)
        VALUES ($1, $2, $3, $4, $5, CASE WHEN $4 = 'on' THEN CURRENT_TIMESTAMP ELSE NULL END, CASE WHEN $4 = 'off' THEN CURRENT_TIMESTAMP ELSE NULL END)
        RETURNING *
      `;
      result = await db.query(insertQuery, [targetUserId, pc_id, today, status, tool_used || null]);
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Toggle PC error:', error);
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

export default router;
