import { Router } from 'express';
import db from '../database/db.js';
import { verifyToken } from '../middleware/auth.js';
import { authorize } from '../middleware/roleGuard.js';

const router = Router();

router.use(verifyToken);

// GET /api/projects — list all projects with optional status filter
router.get('/', async (req, res) => {
  try {
    const { status } = req.query;
    let query = `
      SELECT p.*, COUNT(pm.id) as member_count 
      FROM projects p
      LEFT JOIN project_members pm ON p.id = pm.project_id
    `;
    const params = [];

    if (status) {
      params.push(status);
      query += ` WHERE p.status = $${params.length}`;
    }

    query += ' GROUP BY p.id ORDER BY p.created_at DESC';
    const result = await db.query(query, params);

    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('List projects error:', error);
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

// GET /api/projects/my — student's own projects (they are a member)
router.get('/my', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT p.*, COUNT(pm2.id) as member_count
      FROM projects p
      JOIN project_members pm ON p.id = pm.project_id
      LEFT JOIN project_members pm2 ON p.id = pm2.project_id
      WHERE pm.user_id = $1
      GROUP BY p.id
      ORDER BY p.created_at DESC
    `, [req.user.id]);

    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('My projects error:', error);
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

// GET /api/projects/:id — get single project with members
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const projectRes = await db.query('SELECT * FROM projects WHERE id = $1', [id]);
    const project = projectRes.rows[0];

    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found.' });
    }

    const membersRes = await db.query(`
      SELECT pm.*, u.name as user_name, u.email as user_email, u.avatar_url
      FROM project_members pm
      JOIN users u ON pm.user_id = u.id
      WHERE pm.project_id = $1
    `, [id]);

    res.json({ success: true, data: { ...project, members: membersRes.rows } });
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

// POST /api/projects — create project
router.post('/', async (req, res) => {
  try {
    const { name, description, type, status, start_date, end_date, github_repo_url, member_ids } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, error: 'Project name is required.' });
    }

    const insertRes = await db.query(`
      INSERT INTO projects (name, description, type, status, start_date, end_date, github_repo_url)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id
    `, [
      name,
      description || null,
      type || null,
      status || 'active',
      start_date || null,
      end_date || null,
      github_repo_url || null,
    ]);

    const projectId = insertRes.rows[0].id;

    // Auto-add creator as project lead
    await db.query(
      "INSERT INTO project_members (project_id, user_id, role) VALUES ($1, $2, 'lead')",
      [projectId, req.user.id]
    );

    // Add other members if provided
    if (member_ids && Array.isArray(member_ids)) {
      for (const uid of member_ids) {
        if (Number(uid) !== req.user.id) {
          // Use ON CONFLICT DO NOTHING to mimic INSERT OR IGNORE
          await db.query(
            'INSERT INTO project_members (project_id, user_id, role) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
            [projectId, Number(uid), 'member']
          );
        }
      }
    }

    const projectRes = await db.query('SELECT * FROM projects WHERE id = $1', [projectId]);

    res.status(201).json({ success: true, data: projectRes.rows[0] });
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

// PUT /api/projects/:id — update project
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, type, status, progress_percent, start_date, end_date, github_repo_url, member_ids } = req.body;

    const projectRes = await db.query('SELECT * FROM projects WHERE id = $1', [id]);
    if (!projectRes.rows[0]) {
      return res.status(404).json({ success: false, error: 'Project not found.' });
    }

    if (req.user.role !== 'admin') {
      const isMemberRes = await db.query('SELECT 1 FROM project_members WHERE project_id = $1 AND user_id = $2', [id, req.user.id]);
      if (!isMemberRes.rows[0]) {
        return res.status(403).json({ success: false, error: 'You do not have permission to edit this project.' });
      }
    }

    await db.query(`
      UPDATE projects SET
        name = COALESCE($1, name),
        description = COALESCE($2, description),
        type = COALESCE($3, type),
        status = COALESCE($4, status),
        progress_percent = COALESCE($5, progress_percent),
        start_date = COALESCE($6, start_date),
        end_date = COALESCE($7, end_date),
        github_repo_url = COALESCE($8, github_repo_url)
      WHERE id = $9
    `, [
      name || null,
      description || null,
      type || null,
      status || null,
      progress_percent !== undefined ? progress_percent : null,
      start_date || null,
      end_date || null,
      github_repo_url || null,
      id,
    ]);

    // Update members if provided
    if (member_ids && Array.isArray(member_ids)) {
      // Get current leads to preserve them
      const leadsRes = await db.query("SELECT user_id FROM project_members WHERE project_id = $1 AND role = 'lead'", [id]);
      const currentLeads = leadsRes.rows.map(l => l.user_id);

      // Delete all existing members and re-insert
      await db.query('DELETE FROM project_members WHERE project_id = $1', [id]);

      const finalMembers = new Set([...member_ids.map(Number), ...currentLeads]);

      for (const uid of finalMembers) {
        const role = currentLeads.includes(uid) ? 'lead' : 'member';
        await db.query(
          'INSERT INTO project_members (project_id, user_id, role) VALUES ($1, $2, $3)',
          [id, uid, role]
        );
      }
    }

    const updatedRes = await db.query('SELECT * FROM projects WHERE id = $1', [id]);

    res.json({ success: true, data: updatedRes.rows[0] });
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

// POST /api/projects/:id/members — add member to project (admin or lead)
router.post('/:id/members', async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id, role } = req.body;

    const projectRes = await db.query('SELECT * FROM projects WHERE id = $1', [id]);
    if (!projectRes.rows[0]) {
      return res.status(404).json({ success: false, error: 'Project not found.' });
    }

    // Check if requester is admin or project lead
    if (req.user.role !== 'admin') {
      const isLeadRes = await db.query(
        "SELECT id FROM project_members WHERE project_id = $1 AND user_id = $2 AND role = 'lead'",
        [id, req.user.id]
      );
      if (!isLeadRes.rows[0]) {
        return res.status(403).json({ success: false, error: 'Only admins or project leads can add members.' });
      }
    }

    if (!user_id) {
      return res.status(400).json({ success: false, error: 'user_id is required.' });
    }

    const userRes = await db.query('SELECT id FROM users WHERE id = $1 AND is_active = 1', [user_id]);
    if (!userRes.rows[0]) {
      return res.status(404).json({ success: false, error: 'User not found.' });
    }

    const existingMemberRes = await db.query(
      'SELECT id FROM project_members WHERE project_id = $1 AND user_id = $2',
      [id, user_id]
    );
    if (existingMemberRes.rows[0]) {
      return res.status(409).json({ success: false, error: 'User is already a member of this project.' });
    }

    const insertRes = await db.query(`
      INSERT INTO project_members (project_id, user_id, role)
      VALUES ($1, $2, $3)
      RETURNING id
    `, [id, user_id, role || 'member']);

    const memberRes = await db.query(`
      SELECT pm.*, u.name as user_name, u.email as user_email
      FROM project_members pm
      JOIN users u ON pm.user_id = u.id
      WHERE pm.id = $1
    `, [insertRes.rows[0].id]);

    res.status(201).json({ success: true, data: memberRes.rows[0] });
  } catch (error) {
    console.error('Add project member error:', error);
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

// DELETE /api/projects/:id/members/:userId — remove member
router.delete('/:id/members/:userId', async (req, res) => {
  try {
    const { id, userId } = req.params;

    const membershipRes = await db.query(
      'SELECT id FROM project_members WHERE project_id = $1 AND user_id = $2',
      [id, userId]
    );
    if (!membershipRes.rows[0]) {
      return res.status(404).json({ success: false, error: 'Member not found in this project.' });
    }

    // Check if requester is admin or project lead
    if (req.user.role !== 'admin') {
      const isLeadRes = await db.query(
        "SELECT id FROM project_members WHERE project_id = $1 AND user_id = $2 AND role = 'lead'",
        [id, req.user.id]
      );
      if (!isLeadRes.rows[0]) {
        return res.status(403).json({ success: false, error: 'Only admins or project leads can remove members.' });
      }
    }

    await db.query('DELETE FROM project_members WHERE project_id = $1 AND user_id = $2', [id, userId]);

    res.json({ success: true, data: { message: 'Member removed from project.' } });
  } catch (error) {
    console.error('Remove project member error:', error);
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

// DELETE /api/projects/:id — delete project
router.delete('/:id', authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;

    const projectRes = await db.query('SELECT * FROM projects WHERE id = $1', [id]);
    if (!projectRes.rows[0]) {
      return res.status(404).json({ success: false, error: 'Project not found.' });
    }

    await db.query('DELETE FROM projects WHERE id = $1', [id]);

    res.json({ success: true, data: { message: 'Project deleted successfully.' } });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

export default router;
