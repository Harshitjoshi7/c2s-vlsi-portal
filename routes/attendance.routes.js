import { Router } from 'express';
import db from '../database/db.js';
import { verifyToken } from '../middleware/auth.js';
import { authorize } from '../middleware/roleGuard.js';

const router = Router();

router.use(verifyToken);

// POST /api/attendance/check-in — student checks in
router.post('/check-in', (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const now = new Date().toISOString();

    // Check if already checked in today
    const existing = db.prepare(
      'SELECT * FROM attendance WHERE user_id = ? AND attendance_date = ?'
    ).get(req.user.id, today);

    if (existing) {
      return res.status(409).json({ success: false, error: 'Already checked in for today.' });
    }

    const result = db.prepare(`
      INSERT INTO attendance (user_id, attendance_date, status, check_in_time)
      VALUES (?, ?, 'present', ?)
    `).run(req.user.id, today, now);

    const record = db.prepare('SELECT * FROM attendance WHERE id = ?').get(result.lastInsertRowid);

    // Gamification: Add 5 points for checking in
    db.prepare('UPDATE users SET points = COALESCE(points, 0) + 5 WHERE id = ?').run(req.user.id);

    res.status(201).json({ success: true, data: record });
  } catch (error) {
    console.error('Check-in error:', error);
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

// POST /api/attendance — generic check-in or bulk mark (admin or student for themselves)
router.post('/', (req, res) => {
  try {
    const { user_id, attendance_date, status, check_in_time, check_out_time } = req.body;
    
    // Default to current user if user_id not provided
    const uid = user_id || req.user.id;

    // If not admin, can only post for themselves
    if (req.user.role !== 'admin' && String(uid) !== String(req.user.id)) {
      return res.status(403).json({ success: false, error: 'You can only record your own attendance.' });
    }
    const date = attendance_date || new Date().toISOString().split('T')[0];

    const existing = db.prepare(
      'SELECT * FROM attendance WHERE user_id = ? AND attendance_date = ?'
    ).get(uid, date);

    if (existing) {
      return res.status(409).json({ success: false, error: 'Attendance already recorded for this date.' });
    }

    const result = db.prepare(`
      INSERT INTO attendance (user_id, attendance_date, status, check_in_time, check_out_time)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      uid, 
      date, 
      status || 'present', 
      check_in_time || new Date().toISOString(), 
      check_out_time || null
    );

    const record = db.prepare('SELECT * FROM attendance WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ success: true, data: record });
  } catch (error) {
    console.error('Create attendance error:', error);
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

// POST /api/attendance/check-out — student checks out
router.post('/check-out', (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const now = new Date().toISOString();

    const existing = db.prepare(
      'SELECT * FROM attendance WHERE user_id = ? AND attendance_date = ?'
    ).get(req.user.id, today);

    if (!existing) {
      return res.status(404).json({ success: false, error: 'No check-in record found for today. Please check in first.' });
    }

    if (existing.check_out_time) {
      return res.status(409).json({ success: false, error: 'Already checked out for today.' });
    }

    db.prepare('UPDATE attendance SET check_out_time = ? WHERE id = ?').run(now, existing.id);

    const updated = db.prepare('SELECT * FROM attendance WHERE id = ?').get(existing.id);

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Check-out error:', error);
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

// PUT /api/attendance/:id — update attendance record (admin only)
router.put('/:id', authorize('admin'), (req, res) => {
  try {
    const { id } = req.params;
    const { status, check_in_time, check_out_time } = req.body;

    const existing = db.prepare('SELECT * FROM attendance WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Attendance record not found.' });
    }

    db.prepare(`
      UPDATE attendance SET
        status = COALESCE(?, status),
        check_in_time = COALESCE(?, check_in_time),
        check_out_time = COALESCE(?, check_out_time)
      WHERE id = ?
    `).run(
      status || null,
      check_in_time !== undefined ? check_in_time : null,
      check_out_time !== undefined ? check_out_time : null,
      id
    );

    const updated = db.prepare('SELECT * FROM attendance WHERE id = ?').get(id);
    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Update attendance error:', error);
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

// GET /api/attendance/today — today's attendance for all students (admin)
router.get('/today', authorize('admin'), (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const attendance = db.prepare(`
      SELECT a.*, u.name as user_name, u.email as user_email, u.enrollment_id
      FROM attendance a
      JOIN users u ON a.user_id = u.id
      WHERE a.attendance_date = ?
      ORDER BY a.check_in_time ASC
    `).all(today);

    // Also get students who haven't checked in
    const allStudents = db.prepare(
      "SELECT id, name, email, enrollment_id FROM users WHERE role = 'student' AND is_active = 1"
    ).all();

    const checkedInIds = new Set(attendance.map((a) => a.user_id));
    const absent = allStudents.filter((s) => !checkedInIds.has(s.id));

    res.json({
      success: true,
      data: {
        date: today,
        present: attendance,
        absent,
        summary: {
          total_students: allStudents.length,
          present_count: attendance.length,
          absent_count: absent.length,
        },
      },
    });
  } catch (error) {
    console.error('Today attendance error:', error);
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

// GET /api/attendance — all records for admin, own for student
router.get('/', (req, res) => {
  try {
    const isAdminUser = req.user.role === 'admin';
    let records;
    if (isAdminUser) {
      records = db.prepare(`
        SELECT a.*, u.name as user_name FROM attendance a
        JOIN users u ON a.user_id = u.id
        ORDER BY a.attendance_date DESC
      `).all();
    } else {
      records = db.prepare(`
        SELECT * FROM attendance WHERE user_id = ? ORDER BY attendance_date DESC
      `).all(req.user.id);
    }
    res.json({ success: true, data: records });
  } catch (error) {
    console.error('List attendance error:', error);
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

// GET /api/attendance/my — current student's attendance history
router.get('/my', (req, res) => {
  try {
    const records = db.prepare(`
      SELECT * FROM attendance
      WHERE user_id = ?
      ORDER BY attendance_date DESC
    `).all(req.user.id);

    res.json({ success: true, data: records });
  } catch (error) {
    console.error('My attendance error:', error);
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

// GET /api/attendance/report — monthly report (admin)
router.get('/report', authorize('admin'), (req, res) => {
  try {
    const now = new Date();
    const month = req.query.month || String(now.getMonth() + 1).padStart(2, '0');
    const year = req.query.year || String(now.getFullYear());
    const paddedMonth = String(month).padStart(2, '0');

    const students = db.prepare(
      "SELECT id, name, email, enrollment_id FROM users WHERE role = 'student' AND is_active = 1"
    ).all();

    const report = students.map((student) => {
      const totalRecords = db.prepare(`
        SELECT COUNT(*) as count FROM attendance
        WHERE user_id = ? AND strftime('%m', attendance_date) = ? AND strftime('%Y', attendance_date) = ?
      `).get(student.id, paddedMonth, year).count;

      const presentDays = db.prepare(`
        SELECT COUNT(*) as count FROM attendance
        WHERE user_id = ? AND strftime('%m', attendance_date) = ? AND strftime('%Y', attendance_date) = ?
        AND status IN ('present', 'late')
      `).get(student.id, paddedMonth, year).count;

      const lateDays = db.prepare(`
        SELECT COUNT(*) as count FROM attendance
        WHERE user_id = ? AND strftime('%m', attendance_date) = ? AND strftime('%Y', attendance_date) = ?
        AND status = 'late'
      `).get(student.id, paddedMonth, year).count;

      const leaveDays = db.prepare(`
        SELECT COUNT(*) as count FROM attendance
        WHERE user_id = ? AND strftime('%m', attendance_date) = ? AND strftime('%Y', attendance_date) = ?
        AND status = 'on_leave'
      `).get(student.id, paddedMonth, year).count;

      // Calculate working days in the month (approximate: use totalRecords or calendar days)
      const daysInMonth = new Date(parseInt(year), parseInt(paddedMonth), 0).getDate();
      const percentage = daysInMonth > 0 ? Math.round((presentDays / daysInMonth) * 100) : 0;

      return {
        student_id: student.id,
        student_name: student.name,
        email: student.email,
        enrollment_id: student.enrollment_id,
        total_records: totalRecords,
        present_days: presentDays,
        late_days: lateDays,
        leave_days: leaveDays,
        attendance_percentage: percentage,
      };
    });

    res.json({
      success: true,
      data: {
        month: paddedMonth,
        year,
        report,
      },
    });
  } catch (error) {
    console.error('Attendance report error:', error);
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});
// DELETE /api/attendance/:id — unmark attendance
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;

    const record = db.prepare('SELECT * FROM attendance WHERE id = ?').get(id);
    if (!record) {
      return res.status(404).json({ success: false, error: 'Attendance record not found.' });
    }

    // Only admins or the student who owns the record can delete it
    if (req.user.role !== 'admin' && String(record.user_id) !== String(req.user.id)) {
      return res.status(403).json({ success: false, error: 'Unauthorized to delete this record.' });
    }
    
    // Only allow unmarking today's attendance if they are a student
    const today = new Date().toISOString().split('T')[0];
    if (req.user.role !== 'admin' && record.attendance_date !== today) {
      return res.status(403).json({ success: false, error: 'You can only unmark your attendance for today.' });
    }

    db.prepare('DELETE FROM attendance WHERE id = ?').run(id);

    // Deduct the 5 points if they were present
    if (record.status === 'present') {
      db.prepare('UPDATE users SET points = MAX(0, COALESCE(points, 0) - 5) WHERE id = ?').run(record.user_id);
    }

    res.json({ success: true, data: { message: 'Attendance unmarked successfully.' } });
  } catch (error) {
    console.error('Delete attendance error:', error);
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

export default router;
