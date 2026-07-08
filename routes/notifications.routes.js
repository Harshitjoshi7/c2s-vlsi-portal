import { Router } from 'express';
import db, { createNotification } from '../database/db.js';
import { verifyToken } from '../middleware/auth.js';

const router = Router();

// GET /api/notifications/cron/daily-attendance — Cron job to notify students missing attendance
router.get('/cron/daily-attendance', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Find students who haven't marked attendance today
    const missingStudentsRes = await db.query(`
      SELECT id, name FROM users 
      WHERE role = 'student' 
      AND is_active = 1
      AND id NOT IN (
        SELECT user_id FROM attendance WHERE attendance_date = $1
      )
    `, [today]);
    
    let count = 0;
    for (const student of missingStudentsRes.rows) {
      await createNotification(
        student.id,
        'deadline', // Use deadline type for urgency
        '⏰ Attendance Reminder',
        'You have not marked your attendance today! Please check in.',
        '/attendance'
      );
      count++;
    }
    
    res.json({ success: true, notified: count, message: `Sent attendance reminder to ${count} students.` });
  } catch (error) {
    console.error('Daily attendance cron error:', error);
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

// GET /api/notifications/cron/attendance-summary — End-of-day cron: send present/absent summary to all students
router.get('/cron/attendance-summary', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const dateLabel = new Date(today + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    
    // Get all active students
    const allStudentsRes = await db.query(
      "SELECT id, name FROM users WHERE role = 'student' AND is_active = 1"
    );
    
    // Get today's attendance records
    const attendanceRes = await db.query(
      'SELECT user_id, status FROM attendance WHERE attendance_date = $1',
      [today]
    );
    const attendanceMap = {};
    attendanceRes.rows.forEach(a => { attendanceMap[a.user_id] = a.status; });
    
    let count = 0;
    for (const student of allStudentsRes.rows) {
      const status = attendanceMap[student.id];
      let emoji, title, message;
      
      if (status === 'present') {
        emoji = '✅';
        title = `${emoji} Today's Attendance: Present`;
        message = `You were marked Present for ${dateLabel}. Great job!`;
      } else if (status === 'late') {
        emoji = '⚠️';
        title = `${emoji} Today's Attendance: Late`;
        message = `You were marked Late for ${dateLabel}. Try to be on time tomorrow!`;
      } else if (status === 'on_leave') {
        emoji = 'ℹ️';
        title = `${emoji} Today's Attendance: On Leave`;
        message = `You were on leave for ${dateLabel}.`;
      } else {
        emoji = '❌';
        title = `${emoji} Today's Attendance: Absent`;
        message = `You were marked Absent for ${dateLabel}. Contact admin if this is incorrect.`;
      }
      
      await createNotification(student.id, 'deadline', title, message, '/attendance');
      count++;
    }
    
    res.json({ success: true, notified: count, message: `Sent attendance summary to ${count} students.` });
  } catch (error) {
    console.error('Attendance summary cron error:', error);
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

router.use(verifyToken);

// GET /api/notifications — get current user's notifications (newest first, limit 50)
router.get('/', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50',
      [req.user.id]
    );

    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('List notifications error:', error);
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

// GET /api/notifications/unread-count — get unread count
router.get('/unread-count', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND is_read = 0',
      [req.user.id]
    );

    res.json({ success: true, data: { unread_count: parseInt(result.rows[0].count, 10) } });
  } catch (error) {
    console.error('Unread count error:', error);
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

// PUT /api/notifications/read-all — mark all as read (must be before /:id/read)
router.put('/read-all', async (req, res) => {
  try {
    await db.query(
      'UPDATE notifications SET is_read = 1 WHERE user_id = $1 AND is_read = 0',
      [req.user.id]
    );

    res.json({ success: true, data: { message: 'All notifications marked as read.' } });
  } catch (error) {
    console.error('Mark all read error:', error);
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

// DELETE /api/notifications/clear-all — delete all notifications for the user
router.delete('/clear-all', async (req, res) => {
  try {
    await db.query(
      'DELETE FROM notifications WHERE user_id = $1',
      [req.user.id]
    );

    res.json({ success: true, data: { message: 'All notifications cleared.' } });
  } catch (error) {
    console.error('Clear all error:', error);
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

// PUT /api/notifications/:id/read — mark as read
router.put('/:id/read', async (req, res) => {
  try {
    const { id } = req.params;

    const notifRes = await db.query(
      'SELECT * FROM notifications WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );

    if (!notifRes.rows[0]) {
      return res.status(404).json({ success: false, error: 'Notification not found.' });
    }

    await db.query('UPDATE notifications SET is_read = 1 WHERE id = $1', [id]);

    res.json({ success: true, data: { message: 'Notification marked as read.' } });
  } catch (error) {
    console.error('Mark read error:', error);
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

// GET /api/notifications/vapid-public-key — send public key to frontend
router.get('/vapid-public-key', (req, res) => {
  const key = process.env.VAPID_PUBLIC_KEY;
  if (!key) {
    return res.status(503).json({ success: false, error: 'Push notifications not configured.' });
  }
  res.json({ success: true, data: { publicKey: key } });
});

// POST /api/notifications/subscribe — save a device push subscription
router.post('/subscribe', async (req, res) => {
  try {
    const { endpoint, keys } = req.body;
    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return res.status(400).json({ success: false, error: 'Invalid subscription payload.' });
    }

    // Upsert: if the same endpoint re-registers (e.g. after SW update), update keys
    await db.query(`
      INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (endpoint) DO UPDATE SET user_id = $1, p256dh = $3, auth = $4
    `, [req.user.id, endpoint, keys.p256dh, keys.auth]);

    res.json({ success: true, data: { message: 'Subscribed to push notifications.' } });
  } catch (error) {
    console.error('Subscribe error:', error);
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

// DELETE /api/notifications/unsubscribe — remove a device push subscription
router.delete('/unsubscribe', async (req, res) => {
  try {
    const { endpoint } = req.body;
    if (!endpoint) return res.status(400).json({ success: false, error: 'Endpoint required.' });

    await db.query(
      'DELETE FROM push_subscriptions WHERE user_id = $1 AND endpoint = $2',
      [req.user.id, endpoint]
    );
    res.json({ success: true, data: { message: 'Unsubscribed.' } });
  } catch (error) {
    console.error('Unsubscribe error:', error);
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

export default router;
