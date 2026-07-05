import { Router } from 'express';
import db, { createNotification } from '../database/db.js';
import { verifyToken } from '../middleware/auth.js';
import { authorize } from '../middleware/roleGuard.js';

const router = Router();

router.use(verifyToken);

// GET /api/announcements — list all, pinned first
router.get('/', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT a.*, u.name as created_by_name
      FROM announcements a
      JOIN users u ON a.created_by = u.id
      ORDER BY a.is_pinned DESC, a.created_at DESC
    `);

    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('List announcements error:', error);
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

// POST /api/announcements — create announcement (admin)
router.post('/', authorize('admin'), async (req, res) => {
  try {
    const { title, content, is_pinned } = req.body;

    if (!title || !title.trim() || !content || !content.trim()) {
      return res.status(400).json({ success: false, error: 'Title and content are required.' });
    }

    const insertRes = await db.query(`
      INSERT INTO announcements (created_by, title, content, is_pinned)
      VALUES ($1, $2, $3, $4)
      RETURNING id
    `, [req.user.id, title, content, is_pinned ? 1 : 0]);

    const announcementId = insertRes.rows[0].id;

    // Notify all active students
    const studentsRes = await db.query(
      "SELECT id FROM users WHERE role = 'student' AND is_active = 1"
    );

    for (const student of studentsRes.rows) {
      await createNotification(student.id, 'announcement', 'New Announcement', title, '/announcements');
    }

    const announcementRes = await db.query(`
      SELECT a.*, u.name as created_by_name
      FROM announcements a
      JOIN users u ON a.created_by = u.id
      WHERE a.id = $1
    `, [announcementId]);

    res.status(201).json({ success: true, data: announcementRes.rows[0] });
  } catch (error) {
    console.error('Create announcement error:', error);
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

// PUT /api/announcements/:id — update/pin/unpin (admin)
router.put('/:id', authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, is_pinned } = req.body;

    const existingRes = await db.query('SELECT * FROM announcements WHERE id = $1', [id]);
    if (!existingRes.rows[0]) {
      return res.status(404).json({ success: false, error: 'Announcement not found.' });
    }

    await db.query(`
      UPDATE announcements SET
        title = COALESCE($1, title),
        content = COALESCE($2, content),
        is_pinned = COALESCE($3, is_pinned)
      WHERE id = $4
    `, [
      title || null,
      content || null,
      is_pinned !== undefined ? (is_pinned ? 1 : 0) : null,
      id,
    ]);

    const updatedRes = await db.query(`
      SELECT a.*, u.name as created_by_name
      FROM announcements a
      JOIN users u ON a.created_by = u.id
      WHERE a.id = $1
    `, [id]);

    res.json({ success: true, data: updatedRes.rows[0] });
  } catch (error) {
    console.error('Update announcement error:', error);
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

// DELETE /api/announcements/:id — delete (admin)
router.delete('/:id', authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;

    const existingRes = await db.query('SELECT * FROM announcements WHERE id = $1', [id]);
    if (!existingRes.rows[0]) {
      return res.status(404).json({ success: false, error: 'Announcement not found.' });
    }

    await db.query('DELETE FROM announcements WHERE id = $1', [id]);

    res.json({ success: true, data: { message: 'Announcement deleted successfully.' } });
  } catch (error) {
    console.error('Delete announcement error:', error);
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

export default router;
