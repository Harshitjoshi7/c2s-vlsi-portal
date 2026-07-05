import { Router } from 'express';
import bcrypt from 'bcryptjs';
import db from '../database/db.js';
import { verifyToken } from '../middleware/auth.js';
import { authorize } from '../middleware/roleGuard.js';
import { isValidEmail, isNotEmpty, isValidRole } from '../utils/validators.js';

const router = Router();

// All routes require authentication
router.use(verifyToken);

// GET /api/users — list all users (admin only)
router.get('/', authorize('admin'), (req, res) => {
  try {
    const { role } = req.query;
    let query = 'SELECT id, name, email, role, batch, enrollment_id, github_username, linkedin_url, avatar_url, skills, points, is_active, created_at, updated_at FROM users WHERE is_active = 1';
    const params = [];

    if (role && isValidRole(role)) {
      query += ' AND role = ?';
      params.push(role);
    }

    query += ' ORDER BY created_at DESC';
    const users = db.prepare(query).all(...params);

    res.json({ success: true, data: users });
  } catch (error) {
    console.error('List users error:', error);
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

// GET /api/users/:id — get single user with stats
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const user = db.prepare(
      'SELECT id, name, email, role, batch, enrollment_id, github_username, linkedin_url, avatar_url, skills, points, is_active, created_at, updated_at FROM users WHERE id = ?'
    ).get(id);

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found.' });
    }

    // Get project count
    const projectCount = db.prepare(
      'SELECT COUNT(*) as count FROM project_members WHERE user_id = ?'
    ).get(id).count;

    // Get logs count
    const logsCount = db.prepare(
      'SELECT COUNT(*) as count FROM daily_logs WHERE user_id = ?'
    ).get(id).count;

    // Get attendance percentage
    const totalDays = db.prepare(
      'SELECT COUNT(*) as count FROM attendance WHERE user_id = ?'
    ).get(id).count;

    const presentDays = db.prepare(
      "SELECT COUNT(*) as count FROM attendance WHERE user_id = ? AND status IN ('present', 'late')"
    ).get(id).count;

    const attendancePercentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

    res.json({
      success: true,
      data: {
        ...user,
        stats: {
          projects_count: projectCount,
          logs_count: logsCount,
          attendance_percentage: attendancePercentage,
        },
      },
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

// POST /api/users — create new user (admin only)
router.post('/', authorize('admin'), (req, res) => {
  try {
    const { name, email, password, role, batch, enrollment_id, github_username, linkedin_url, skills } = req.body;

    if (!isNotEmpty(name) || !isNotEmpty(email) || !isNotEmpty(password)) {
      return res.status(400).json({ success: false, error: 'Name, email, and password are required.' });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ success: false, error: 'Invalid email format.' });
    }

    if (role && !isValidRole(role)) {
      return res.status(400).json({ success: false, error: 'Invalid role. Must be admin or student.' });
    }

    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) {
      return res.status(409).json({ success: false, error: 'Email already exists.' });
    }

    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);

    const result = db.prepare(`
      INSERT INTO users (name, email, password_hash, role, batch, enrollment_id, github_username, linkedin_url, skills)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      name,
      email,
      passwordHash,
      role || 'student',
      batch || null,
      enrollment_id || null,
      github_username || null,
      linkedin_url || null,
      skills ? JSON.stringify(skills) : '[]'
    );

    const user = db.prepare(
      'SELECT id, name, email, role, batch, enrollment_id, github_username, linkedin_url, avatar_url, skills, points, is_active, created_at FROM users WHERE id = ?'
    ).get(result.lastInsertRowid);

    res.status(201).json({ success: true, data: user });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

// PUT /api/users/:id — update user (admin can update any user; students can update own profile)
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const isSelf = String(req.user.id) === String(id);
    const isAdminUser = req.user.role === 'admin';

    // Only admins can update other users
    if (!isSelf && !isAdminUser) {
      return res.status(403).json({ success: false, error: 'You can only update your own profile.' });
    }

    const existing = db.prepare('SELECT id FROM users WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'User not found.' });
    }

    const { name, email, role, batch, enrollment_id, github_username, linkedin_url, avatar_url, skills, points, bio } = req.body;

    if (email) {
      if (!isValidEmail(email)) {
        return res.status(400).json({ success: false, error: 'Invalid email format.' });
      }
      const emailExists = db.prepare('SELECT id FROM users WHERE email = ? AND id != ?').get(email, id);
      if (emailExists) {
        return res.status(409).json({ success: false, error: 'Email already in use by another user.' });
      }
    }

    if (isSelf && !isAdminUser) {
      // Students can only update their own profile fields (not role, points, batch, enrollment_id)
      db.prepare(`
        UPDATE users SET
          name = COALESCE(?, name),
          email = COALESCE(?, email),
          github_username = COALESCE(?, github_username),
          linkedin_url = COALESCE(?, linkedin_url),
          avatar_url = COALESCE(?, avatar_url),
          skills = COALESCE(?, skills),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(
        name || null,
        email || null,
        github_username !== undefined ? github_username : null,
        linkedin_url !== undefined ? linkedin_url : null,
        avatar_url || null,
        skills ? JSON.stringify(skills) : null,
        id
      );
    } else {
      // Admin can update all fields
      db.prepare(`
        UPDATE users SET
          name = COALESCE(?, name),
          email = COALESCE(?, email),
          role = COALESCE(?, role),
          batch = COALESCE(?, batch),
          enrollment_id = COALESCE(?, enrollment_id),
          github_username = COALESCE(?, github_username),
          linkedin_url = COALESCE(?, linkedin_url),
          avatar_url = COALESCE(?, avatar_url),
          skills = COALESCE(?, skills),
          points = COALESCE(?, points),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(
        name || null,
        email || null,
        role || null,
        batch || null,
        enrollment_id || null,
        github_username !== undefined ? github_username : null,
        linkedin_url !== undefined ? linkedin_url : null,
        avatar_url || null,
        skills ? JSON.stringify(skills) : null,
        points !== undefined ? points : null,
        id
      );
    }

    const user = db.prepare(
      'SELECT id, name, email, role, batch, enrollment_id, github_username, linkedin_url, avatar_url, skills, points, is_active, created_at, updated_at FROM users WHERE id = ?'
    ).get(id);

    res.json({ success: true, data: user });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

// DELETE /api/users/:id — soft delete (admin only)
router.delete('/:id', authorize('admin'), (req, res) => {
  try {
    const { id } = req.params;

    const existing = db.prepare('SELECT id, email FROM users WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'User not found.' });
    }

    const deletedEmail = `deleted_${Date.now()}_${existing.email}`;
    db.prepare('UPDATE users SET is_active = 0, email = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(deletedEmail, id);

    res.json({ success: true, data: { message: 'User deactivated successfully.' } });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

// POST /api/users/:id/reset-password — admin resets user password
router.post('/:id/reset-password', authorize('admin'), (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, error: 'New password must be at least 6 characters.' });
    }

    const salt = bcrypt.genSaltSync(10);
    const newHash = bcrypt.hashSync(newPassword, salt);

    const result = db.prepare('UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(newHash, id);
    if (result.changes === 0) {
      return res.status(404).json({ success: false, error: 'User not found.' });
    }

    res.json({ success: true, data: { message: 'Password reset successfully.' } });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

export default router;
