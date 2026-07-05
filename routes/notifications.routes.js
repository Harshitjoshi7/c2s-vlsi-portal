import { Router } from 'express';
import db from '../database/db.js';
import { verifyToken } from '../middleware/auth.js';

const router = Router();

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

export default router;
