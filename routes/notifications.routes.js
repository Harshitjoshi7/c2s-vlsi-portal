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
