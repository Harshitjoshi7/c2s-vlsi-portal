import { Router } from 'express';
import bcrypt from 'bcryptjs';
import db from '../database/db.js';
import { verifyToken } from '../middleware/auth.js';
import { isValidEmail, isNotEmpty, isValidRole } from '../utils/validators.js';

const router = Router();

// All routes require authentication
router.use(verifyToken);

// GET /api/users — list all users (admin only)
router.get('/', async (req, res) => {
  try {
    const { role } = req.query;
    let query = 'SELECT id, name, email, role, batch, enrollment_id, github_username, linkedin_url, avatar_url, skills, points, is_active, created_at, updated_at FROM users WHERE is_active = 1';
    const params = [];

    if (role && isValidRole(role)) {
      query += ` AND role = $${params.length + 1}`;
      params.push(role);
    }

    query += ' ORDER BY created_at DESC';
    const result = await db.query(query, params);
    const users = result.rows;

    res.json({ success: true, data: users });
  } catch (error) {
    console.error('List users error:', error);
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

// GET /api/users/:id — get single user with stats
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userRes = await db.query(
      'SELECT id, name, email, role, batch, enrollment_id, github_username, linkedin_url, avatar_url, skills, points, is_active, created_at, updated_at FROM users WHERE id = $1',
      [id]
    );
    const user = userRes.rows[0];

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found.' });
    }

    // Get project count
    const projectCountRes = await db.query('SELECT COUNT(*) as count FROM project_members WHERE user_id = $1', [id]);
    const projectCount = parseInt(projectCountRes.rows[0].count, 10);

    // Get logs count
    const logsCountRes = await db.query('SELECT COUNT(*) as count FROM daily_logs WHERE user_id = $1', [id]);
    const logsCount = parseInt(logsCountRes.rows[0].count, 10);

    // Get attendance percentage (exclude leave days from denominator)
    const totalDaysRes = await db.query("SELECT COUNT(*) as count FROM attendance WHERE user_id = $1 AND status != 'on_leave'", [id]);
    const totalDays = parseInt(totalDaysRes.rows[0].count, 10);

    const presentDaysRes = await db.query(
      "SELECT COUNT(*) as count FROM attendance WHERE user_id = $1 AND status IN ('present', 'late')",
      [id]
    );
    const presentDays = parseInt(presentDaysRes.rows[0].count, 10);

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
router.post('/', async (req, res) => {
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

    const existingRes = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingRes.rows[0]) {
      return res.status(409).json({ success: false, error: 'Email already exists.' });
    }

    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);

    const insertRes = await db.query(`
      INSERT INTO users (name, email, password_hash, role, batch, enrollment_id, github_username, linkedin_url, skills)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id
    `, [
      name,
      email,
      passwordHash,
      role || 'student',
      batch || null,
      enrollment_id || null,
      github_username || null,
      linkedin_url || null,
      skills ? JSON.stringify(skills) : '[]',
    ]);

    const userId = insertRes.rows[0].id;
    const userRes = await db.query(
      'SELECT id, name, email, role, batch, enrollment_id, github_username, linkedin_url, avatar_url, skills, points, is_active, created_at FROM users WHERE id = $1',
      [userId]
    );

    res.status(201).json({ success: true, data: userRes.rows[0] });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

// PUT /api/users/:id — update user (admin can update any user; students can update own profile)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const isSelf = String(req.user.id) === String(id);
    const isAdminUser = req.user.role === 'admin';

    // Only admins can update other users
    if (!isSelf && !isAdminUser) {
      return res.status(403).json({ success: false, error: 'You can only update your own profile.' });
    }

    const existingRes = await db.query('SELECT id FROM users WHERE id = $1', [id]);
    if (!existingRes.rows[0]) {
      return res.status(404).json({ success: false, error: 'User not found.' });
    }

    const { name, email, role, batch, enrollment_id, github_username, linkedin_url, avatar_url, skills, points } = req.body;

    if (email) {
      if (!isValidEmail(email)) {
        return res.status(400).json({ success: false, error: 'Invalid email format.' });
      }
      const emailExistsRes = await db.query('SELECT id FROM users WHERE email = $1 AND id != $2', [email, id]);
      if (emailExistsRes.rows[0]) {
        return res.status(409).json({ success: false, error: 'Email already in use by another user.' });
      }
    }

    if (isSelf && !isAdminUser) {
      // Students can only update limited fields
      await db.query(`
        UPDATE users SET
          name = COALESCE($1, name),
          email = COALESCE($2, email),
          github_username = COALESCE($3, github_username),
          linkedin_url = COALESCE($4, linkedin_url),
          avatar_url = COALESCE($5, avatar_url),
          skills = COALESCE($6, skills),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $7
      `, [
        name || null,
        email || null,
        github_username !== undefined ? github_username : null,
        linkedin_url !== undefined ? linkedin_url : null,
        avatar_url || null,
        skills ? JSON.stringify(skills) : null,
        id,
      ]);
    } else {
      // Admin can update all fields
      await db.query(`
        UPDATE users SET
          name = COALESCE($1, name),
          email = COALESCE($2, email),
          role = COALESCE($3, role),
          batch = COALESCE($4, batch),
          enrollment_id = COALESCE($5, enrollment_id),
          github_username = COALESCE($6, github_username),
          linkedin_url = COALESCE($7, linkedin_url),
          avatar_url = COALESCE($8, avatar_url),
          skills = COALESCE($9, skills),
          points = COALESCE($10, points),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $11
      `, [
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
        id,
      ]);
    }

    const userRes = await db.query(
      'SELECT id, name, email, role, batch, enrollment_id, github_username, linkedin_url, avatar_url, skills, points, is_active, created_at, updated_at FROM users WHERE id = $1',
      [id]
    );

    res.json({ success: true, data: userRes.rows[0] });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

// DELETE /api/users/:id — soft delete (admin only)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const existingRes = await db.query('SELECT id, email FROM users WHERE id = $1', [id]);
    if (!existingRes.rows[0]) {
      return res.status(404).json({ success: false, error: 'User not found.' });
    }

    const deletedEmail = `deleted_${Date.now()}_${existingRes.rows[0].email}`;
    await db.query('UPDATE users SET is_active = 0, email = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [deletedEmail, id]);

    res.json({ success: true, data: { message: 'User deactivated successfully.' } });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

// POST /api/users/:id/reset-password — admin resets user password
router.post('/:id/reset-password', async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, error: 'New password must be at least 6 characters.' });
    }

    const salt = bcrypt.genSaltSync(10);
    const newHash = bcrypt.hashSync(newPassword, salt);

    const result = await db.query(
      'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [newHash, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, error: 'User not found.' });
    }

    res.json({ success: true, data: { message: 'Password reset successfully.' } });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

export default router;
