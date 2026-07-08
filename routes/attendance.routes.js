import { Router } from 'express';
import db, { createNotification } from '../database/db.js';
import { verifyToken } from '../middleware/auth.js';
import { authorize } from '../middleware/roleGuard.js';

const router = Router();

router.use(verifyToken);

async function initializeDayAttendance(date) {
  try {
    const query = `
      INSERT INTO attendance (user_id, attendance_date, status)
      SELECT u.id, $1::date, 
             CASE WHEN l.user_id IS NOT NULL THEN 'on_leave' ELSE 'absent' END
      FROM users u
      LEFT JOIN leave_requests l 
        ON l.user_id = u.id 
        AND l.status IN ('approved', 'pending') 
        AND l.start_date <= $1::date 
        AND l.end_date >= $1::date
      WHERE u.role = 'student' AND u.is_active = 1
      ON CONFLICT (user_id, attendance_date) DO NOTHING
    `;
    await db.query(query, [date]);
  } catch (error) {
    console.error('Failed to initialize day attendance:', error);
  }
}

// POST /api/attendance/check-in — student checks in
router.post('/check-in', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const now = new Date().toISOString();

    await initializeDayAttendance(today);

    // Check if already checked in today
    const existingRes = await db.query(
      'SELECT * FROM attendance WHERE user_id = $1 AND attendance_date = $2',
      [req.user.id, today]
    );

    let insertRes;
    if (existingRes.rows[0]) {
      const existing = existingRes.rows[0];
      if (existing.status === 'present' || existing.status === 'late') {
        return res.status(409).json({ success: false, error: 'Already checked in for today.' });
      } else {
        insertRes = await db.query(`
          UPDATE attendance SET status = 'present', check_in_time = $2 
          WHERE id = $1 RETURNING id
        `, [existing.id, now]);
      }
    } else {
      insertRes = await db.query(`
        INSERT INTO attendance (user_id, attendance_date, status, check_in_time)
        VALUES ($1, $2, 'present', $3)
        RETURNING id
      `, [req.user.id, today, now]);
    }

    const recordRes = await db.query('SELECT * FROM attendance WHERE id = $1', [insertRes.rows[0].id]);

    // Gamification: Add 5 points for checking in
    await db.query('UPDATE users SET points = COALESCE(points, 0) + 5 WHERE id = $1', [req.user.id]);

    // Send attendance confirmation notification
    try {
      await createNotification(
        req.user.id,
        'announcement',
        '✅ Attendance Marked',
        `You have been marked Present for ${new Date(today).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}.`,
        '/attendance'
      );
    } catch(e) { /* non-critical */ }

    res.status(201).json({ success: true, data: recordRes.rows[0] });
  } catch (error) {
    console.error('Check-in error:', error);
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

// POST /api/attendance/check-out — student checks out
router.post('/check-out', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const now = new Date().toISOString();

    const existingRes = await db.query(
      'SELECT * FROM attendance WHERE user_id = $1 AND attendance_date = $2',
      [req.user.id, today]
    );
    const existing = existingRes.rows[0];

    if (!existing) {
      return res.status(404).json({ success: false, error: 'No check-in record found for today. Please check in first.' });
    }

    if (existing.check_out_time) {
      return res.status(409).json({ success: false, error: 'Already checked out for today.' });
    }

    await db.query('UPDATE attendance SET check_out_time = $1 WHERE id = $2', [now, existing.id]);

    const updatedRes = await db.query('SELECT * FROM attendance WHERE id = $1', [existing.id]);

    res.json({ success: true, data: updatedRes.rows[0] });
  } catch (error) {
    console.error('Check-out error:', error);
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

// POST /api/attendance — generic create (admin or student for themselves)
router.post('/', async (req, res) => {
  try {
    const { user_id, attendance_date, status, check_in_time, check_out_time } = req.body;

    const uid = user_id || req.user.id;

    if (req.user.role !== 'admin' && String(uid) !== String(req.user.id)) {
      return res.status(403).json({ success: false, error: 'You can only record your own attendance.' });
    }

    const date = attendance_date || new Date().toISOString().split('T')[0];
    await initializeDayAttendance(date);

    const existingRes = await db.query(
      'SELECT * FROM attendance WHERE user_id = $1 AND attendance_date = $2',
      [uid, date]
    );

    const finalStatus = status || 'present';
    const cTime = check_in_time || (finalStatus === 'present' || finalStatus === 'late' ? new Date().toISOString() : null);
    const coTime = check_out_time || null;
    let insertRes;

    if (existingRes.rows[0]) {
      insertRes = await db.query(`
        UPDATE attendance 
        SET status = $1, check_in_time = COALESCE($2, check_in_time), check_out_time = COALESCE($3, check_out_time)
        WHERE id = $4
        RETURNING id
      `, [
        finalStatus,
        cTime,
        coTime,
        existingRes.rows[0].id
      ]);
    } else {
      insertRes = await db.query(`
        INSERT INTO attendance (user_id, attendance_date, status, check_in_time, check_out_time)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id
      `, [
        uid,
        date,
        finalStatus,
        cTime,
        coTime,
      ]);
    }

    const recordRes = await db.query('SELECT * FROM attendance WHERE id = $1', [insertRes.rows[0].id]);

    // Send attendance notification to the student (when admin marks)
    if (req.user.role === 'admin' && String(uid) !== String(req.user.id)) {
      const statusEmoji = finalStatus === 'present' ? '✅' : finalStatus === 'absent' ? '❌' : finalStatus === 'late' ? '⚠️' : 'ℹ️';
      const statusLabel = finalStatus.replace('_', ' ').replace(/^\w/, c => c.toUpperCase());
      const dateLabel = new Date(date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
      try {
        await createNotification(
          uid,
          'announcement',
          `${statusEmoji} Attendance: ${statusLabel}`,
          `You have been marked ${statusLabel} for ${dateLabel}.`,
          '/attendance'
        );
      } catch(e) { /* non-critical */ }
    }

    res.status(201).json({ success: true, data: recordRes.rows[0] });
  } catch (error) {
    console.error('Create attendance error:', error);
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

// PUT /api/attendance/:id — update attendance record (admin only)
router.put('/:id', authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { status, check_in_time, check_out_time } = req.body;

    const existingRes = await db.query('SELECT * FROM attendance WHERE id = $1', [id]);
    if (!existingRes.rows[0]) {
      return res.status(404).json({ success: false, error: 'Attendance record not found.' });
    }

    await db.query(`
      UPDATE attendance SET
        status = COALESCE($1, status),
        check_in_time = COALESCE($2, check_in_time),
        check_out_time = COALESCE($3, check_out_time)
      WHERE id = $4
    `, [
      status || null,
      check_in_time !== undefined ? check_in_time : null,
      check_out_time !== undefined ? check_out_time : null,
      id,
    ]);

    const updatedRes = await db.query('SELECT * FROM attendance WHERE id = $1', [id]);
    const updated = updatedRes.rows[0];

    // Send notification to the student about status change
    if (status && updated) {
      const statusEmoji = status === 'present' ? '✅' : status === 'absent' ? '❌' : status === 'late' ? '⚠️' : 'ℹ️';
      const statusLabel = status.replace('_', ' ').replace(/^\w/, c => c.toUpperCase());
      const dateLabel = new Date(updated.attendance_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
      try {
        await createNotification(
          updated.user_id,
          'announcement',
          `${statusEmoji} Attendance Updated: ${statusLabel}`,
          `Your attendance for ${dateLabel} has been updated to ${statusLabel}.`,
          '/attendance'
        );
      } catch(e) { /* non-critical */ }
    }

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Update attendance error:', error);
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

// GET /api/attendance/today — today's attendance for all students (admin)
router.get('/today', authorize('admin'), async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const attendanceRes = await db.query(`
      SELECT a.*, u.name as user_name, u.email as user_email, u.enrollment_id
      FROM attendance a
      JOIN users u ON a.user_id = u.id
      WHERE a.attendance_date = $1
      ORDER BY a.check_in_time ASC
    `, [today]);
    const attendance = attendanceRes.rows;

    const allStudentsRes = await db.query(
      "SELECT id, name, email, enrollment_id FROM users WHERE role = 'student' AND is_active = 1"
    );
    const allStudents = allStudentsRes.rows;

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

// GET /api/attendance/date/:date — attendance for a specific date
router.get('/date/:date', async (req, res) => {
  try {
    const { date } = req.params;
    const isAdminUser = req.user.role === 'admin';

    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ success: false, error: 'Invalid date format. Use YYYY-MM-DD.' });
    }

    if (isAdminUser) {
      // Admin: return all students' attendance for this date
      const attendanceRes = await db.query(`
        SELECT a.*, u.name as user_name, u.email as user_email, u.enrollment_id
        FROM attendance a
        JOIN users u ON a.user_id = u.id
        WHERE a.attendance_date = $1
        ORDER BY a.check_in_time ASC
      `, [date]);
      const attendance = attendanceRes.rows;

      const allStudentsRes = await db.query(
        "SELECT id, name, email, enrollment_id FROM users WHERE role = 'student' AND is_active = 1"
      );
      const allStudents = allStudentsRes.rows;

      const checkedInIds = new Set(attendance.map((a) => a.user_id));
      const absent = allStudents.filter((s) => !checkedInIds.has(s.id));
      const presentCount = attendance.filter(a => a.status === 'present').length;
      const lateCount = attendance.filter(a => a.status === 'late').length;
      const leaveCount = attendance.filter(a => a.status === 'on_leave').length;

      res.json({
        success: true,
        data: {
          date,
          records: attendance,
          absent,
          summary: {
            total_students: allStudents.length,
            present_count: presentCount,
            absent_count: absent.length,
            late_count: lateCount,
            leave_count: leaveCount,
          },
        },
      });
    } else {
      // Student: return only their own record for this date
      const result = await db.query(
        'SELECT * FROM attendance WHERE user_id = $1 AND attendance_date = $2',
        [req.user.id, date]
      );

      res.json({
        success: true,
        data: {
          date,
          records: result.rows,
          summary: {
            total_records: result.rows.length,
            status: result.rows[0]?.status || 'absent',
          },
        },
      });
    }
  } catch (error) {
    console.error('Date attendance error:', error);
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

// GET /api/attendance — all records for admin, own for student
router.get('/', async (req, res) => {
  try {
    const isAdminUser = req.user.role === 'admin';
    let result;

    if (isAdminUser) {
      result = await db.query(`
        SELECT a.*, u.name as user_name FROM attendance a
        JOIN users u ON a.user_id = u.id
        ORDER BY a.attendance_date DESC
      `);
    } else {
      result = await db.query(
        'SELECT * FROM attendance WHERE user_id = $1 ORDER BY attendance_date DESC',
        [req.user.id]
      );
    }

    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('List attendance error:', error);
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

// GET /api/attendance/my — current student's attendance history
router.get('/my', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM attendance WHERE user_id = $1 ORDER BY attendance_date DESC',
      [req.user.id]
    );

    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('My attendance error:', error);
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

// GET /api/attendance/report — monthly report (admin)
router.get('/report', authorize('admin'), async (req, res) => {
  try {
    const now = new Date();
    const month = req.query.month || String(now.getMonth() + 1).padStart(2, '0');
    const year = req.query.year || String(now.getFullYear());
    const paddedMonth = String(month).padStart(2, '0');

    const studentsRes = await db.query(
      "SELECT id, name, email, enrollment_id FROM users WHERE role = 'student' AND is_active = 1"
    );
    const students = studentsRes.rows;

    const report = await Promise.all(students.map(async (student) => {
      const totalRecordsRes = await db.query(`
        SELECT COUNT(*) as count FROM attendance
        WHERE user_id = $1
          AND TO_CHAR(attendance_date, 'MM') = $2
          AND TO_CHAR(attendance_date, 'YYYY') = $3
      `, [student.id, paddedMonth, year]);

      const presentDaysRes = await db.query(`
        SELECT COUNT(*) as count FROM attendance
        WHERE user_id = $1
          AND TO_CHAR(attendance_date, 'MM') = $2
          AND TO_CHAR(attendance_date, 'YYYY') = $3
          AND status IN ('present', 'late')
      `, [student.id, paddedMonth, year]);

      const lateDaysRes = await db.query(`
        SELECT COUNT(*) as count FROM attendance
        WHERE user_id = $1
          AND TO_CHAR(attendance_date, 'MM') = $2
          AND TO_CHAR(attendance_date, 'YYYY') = $3
          AND status = 'late'
      `, [student.id, paddedMonth, year]);

      const leaveDaysRes = await db.query(`
        SELECT COUNT(*) as count FROM attendance
        WHERE user_id = $1
          AND TO_CHAR(attendance_date, 'MM') = $2
          AND TO_CHAR(attendance_date, 'YYYY') = $3
          AND status = 'on_leave'
      `, [student.id, paddedMonth, year]);

      const totalRecords = parseInt(totalRecordsRes.rows[0].count, 10);
      const presentDays = parseInt(presentDaysRes.rows[0].count, 10);
      const lateDays = parseInt(lateDaysRes.rows[0].count, 10);
      const leaveDays = parseInt(leaveDaysRes.rows[0].count, 10);

      const daysInMonth = new Date(parseInt(year), parseInt(paddedMonth), 0).getDate();
      const effectiveDays = Math.max(0, totalRecords - leaveDays);
      const percentage = effectiveDays > 0 ? Math.round((presentDays / effectiveDays) * 100) : (leaveDays > 0 ? 100 : 0);

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
    }));

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
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const recordRes = await db.query('SELECT * FROM attendance WHERE id = $1', [id]);
    const record = recordRes.rows[0];
    if (!record) {
      return res.status(404).json({ success: false, error: 'Attendance record not found.' });
    }

    if (req.user.role !== 'admin' && String(record.user_id) !== String(req.user.id)) {
      return res.status(403).json({ success: false, error: 'Unauthorized to delete this record.' });
    }

    // Only allow unmarking today's attendance if they are a student
    const today = new Date().toISOString().split('T')[0];
    const recordDate = record.attendance_date instanceof Date
      ? record.attendance_date.toISOString().split('T')[0]
      : String(record.attendance_date).split('T')[0];

    if (req.user.role !== 'admin' && recordDate !== today) {
      return res.status(403).json({ success: false, error: 'You can only unmark your attendance for today.' });
    }

    await db.query('DELETE FROM attendance WHERE id = $1', [id]);

    // Deduct the 5 points if they were present
    if (record.status === 'present') {
      await db.query(
        'UPDATE users SET points = GREATEST(0, COALESCE(points, 0) - 5) WHERE id = $1',
        [record.user_id]
      );
    }

    res.json({ success: true, data: { message: 'Attendance unmarked successfully.' } });
  } catch (error) {
    console.error('Delete attendance error:', error);
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

export default router;
