import { Router } from 'express';
import db, { createNotification } from '../database/db.js';
import { verifyToken } from '../middleware/auth.js';
import { authorize } from '../middleware/roleGuard.js';

const router = Router();

router.use(verifyToken);

// GET /api/announcements — list all, pinned first
router.get('/', (req, res) => {
  try {
    const announcements = db.prepare(`
      SELECT a.*, u.name as created_by_name
      FROM announcements a
      JOIN users u ON a.created_by = u.id
      ORDER BY a.is_pinned DESC, a.created_at DESC
    `).all();

    res.json({ success: true, data: announcements });
  } catch (error) {
    console.error('List announcements error:', error);
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

// POST /api/announcements — create announcement (admin)
router.post('/', authorize('admin'), (req, res) => {
  try {
    const { title, content, is_pinned } = req.body;

    if (!title || !title.trim() || !content || !content.trim()) {
      return res.status(400).json({ success: false, error: 'Title and content are required.' });
    }

    const result = db.prepare(`
      INSERT INTO announcements (created_by, title, content, is_pinned)
      VALUES (?, ?, ?, ?)
    `).run(req.user.id, title, content, is_pinned ? 1 : 0);

    const announcementId = result.lastInsertRowid;

    // Notify all students
    const students = db.prepare(
      "SELECT id FROM users WHERE role = 'student' AND is_active = 1"
    ).all();

    for (const student of students) {
      createNotification(
        student.id,
        'announcement',
        'New Announcement',
        title,
        `/announcements`
      );
    }

    const announcement = db.prepare(`
      SELECT a.*, u.name as created_by_name
      FROM announcements a
      JOIN users u ON a.created_by = u.id
      WHERE a.id = ?
    `).get(announcementId);

    res.status(201).json({ success: true, data: announcement });
  } catch (error) {
    console.error('Create announcement error:', error);
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

// PUT /api/announcements/:id — update/pin/unpin (admin)
router.put('/:id', authorize('admin'), (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, is_pinned } = req.body;

    const announcement = db.prepare('SELECT * FROM announcements WHERE id = ?').get(id);
    if (!announcement) {
      return res.status(404).json({ success: false, error: 'Announcement not found.' });
    }

    db.prepare(`
      UPDATE announcements SET
        title = COALESCE(?, title),
        content = COALESCE(?, content),
        is_pinned = COALESCE(?, is_pinned)
      WHERE id = ?
    `).run(
      title || null,
      content || null,
      is_pinned !== undefined ? (is_pinned ? 1 : 0) : null,
      id
    );

    const updated = db.prepare(`
      SELECT a.*, u.name as created_by_name
      FROM announcements a
      JOIN users u ON a.created_by = u.id
      WHERE a.id = ?
    `).get(id);

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Update announcement error:', error);
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

// DELETE /api/announcements/:id — delete (admin)
router.delete('/:id', authorize('admin'), (req, res) => {
  try {
    const { id } = req.params;

    const announcement = db.prepare('SELECT * FROM announcements WHERE id = ?').get(id);
    if (!announcement) {
      return res.status(404).json({ success: false, error: 'Announcement not found.' });
    }

    db.prepare('DELETE FROM announcements WHERE id = ?').run(id);

    res.json({ success: true, data: { message: 'Announcement deleted successfully.' } });
  } catch (error) {
    console.error('Delete announcement error:', error);
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

export default router;
