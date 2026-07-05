import { Router } from 'express';
import db from '../database/db.js';
import { verifyToken } from '../middleware/auth.js';
import { authorize } from '../middleware/roleGuard.js';

const router = Router();

router.use(verifyToken);

// GET /api/projects — list all projects with optional status filter
router.get('/', (req, res) => {
  try {
    const { status } = req.query;
    let query = `
      SELECT p.*, COUNT(pm.id) as member_count 
      FROM projects p
      LEFT JOIN project_members pm ON p.id = pm.project_id
    `;
    const params = [];

    if (status) {
      query += ' WHERE p.status = ?';
      params.push(status);
    }

    query += ' GROUP BY p.id ORDER BY p.created_at DESC';
    const projects = db.prepare(query).all(...params);

    res.json({ success: true, data: projects });
  } catch (error) {
    console.error('List projects error:', error);
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

// GET /api/projects/my — student's own projects (they are a member)
router.get('/my', (req, res) => {
  try {
    const projects = db.prepare(`
      SELECT p.*, COUNT(pm2.id) as member_count
      FROM projects p
      JOIN project_members pm ON p.id = pm.project_id
      LEFT JOIN project_members pm2 ON p.id = pm2.project_id
      WHERE pm.user_id = ?
      GROUP BY p.id
      ORDER BY p.created_at DESC
    `).all(req.user.id);
    res.json({ success: true, data: projects });
  } catch (error) {
    console.error('My projects error:', error);
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(id);

    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found.' });
    }

    const members = db.prepare(`
      SELECT pm.*, u.name as user_name, u.email as user_email, u.avatar_url
      FROM project_members pm
      JOIN users u ON pm.user_id = u.id
      WHERE pm.project_id = ?
    `).all(id);

    res.json({ success: true, data: { ...project, members } });
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

// POST /api/projects — create project
router.post('/', (req, res) => {
  try {
    const { name, description, type, status, start_date, end_date, github_repo_url, member_ids } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, error: 'Project name is required.' });
    }

    const result = db.prepare(`
      INSERT INTO projects (name, description, type, status, start_date, end_date, github_repo_url)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      name,
      description || null,
      type || null,
      status || 'active',
      start_date || null,
      end_date || null,
      github_repo_url || null
    );

    const projectId = result.lastInsertRowid;
    
    // Auto-add creator as project lead if they are a student (or even admin)
    db.prepare(`
      INSERT INTO project_members (project_id, user_id, role)
      VALUES (?, ?, 'lead')
    `).run(projectId, req.user.id);

    // Add other members if provided
    if (member_ids && Array.isArray(member_ids)) {
      const insertMember = db.prepare('INSERT OR IGNORE INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)');
      for (const uid of member_ids) {
        if (Number(uid) !== req.user.id) { // skip if they are already lead
          insertMember.run(projectId, Number(uid), 'member');
        }
      }
    }

    const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(projectId);

    res.status(201).json({ success: true, data: project });
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

// PUT /api/projects/:id — update project
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, type, status, progress_percent, start_date, end_date, github_repo_url, member_ids } = req.body;

    const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found.' });
    }

    if (req.user.role !== 'admin') {
      const isMember = db.prepare('SELECT 1 FROM project_members WHERE project_id = ? AND user_id = ?').get(id, req.user.id);
      if (!isMember) {
        return res.status(403).json({ success: false, error: 'You do not have permission to edit this project.' });
      }
    }

    db.prepare(`
      UPDATE projects SET
        name = COALESCE(?, name),
        description = COALESCE(?, description),
        type = COALESCE(?, type),
        status = COALESCE(?, status),
        progress_percent = COALESCE(?, progress_percent),
        start_date = COALESCE(?, start_date),
        end_date = COALESCE(?, end_date),
        github_repo_url = COALESCE(?, github_repo_url)
      WHERE id = ?
    `).run(
      name || null,
      description || null,
      type || null,
      status || null,
      progress_percent !== undefined ? progress_percent : null,
      start_date || null,
      end_date || null,
      github_repo_url || null,
      id
    );

    // Update members if provided
    if (member_ids && Array.isArray(member_ids)) {
      // First, get current leads to preserve them
      const currentLeads = db.prepare("SELECT user_id FROM project_members WHERE project_id = ? AND role = 'lead'").all(id).map(l => l.user_id);
      
      // Delete existing non-lead members (or just delete all and re-add leads)
      db.prepare('DELETE FROM project_members WHERE project_id = ?').run(id);

      // Re-insert members
      const insertMember = db.prepare('INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)');
      
      // Merge unique member_ids with current leads
      const finalMembers = new Set([...member_ids.map(Number), ...currentLeads]);
      
      for (const uid of finalMembers) {
        const role = currentLeads.includes(uid) ? 'lead' : 'member';
        insertMember.run(id, uid, role);
      }
    }

    const updated = db.prepare('SELECT * FROM projects WHERE id = ?').get(id);

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

// POST /api/projects/:id/members — add member to project (admin or lead)
router.post('/:id/members', (req, res) => {
  try {
    const { id } = req.params;
    const { user_id, role } = req.body;

    const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found.' });
    }

    // Check if requester is admin or project lead
    if (req.user.role !== 'admin') {
      const isLead = db.prepare(
        "SELECT id FROM project_members WHERE project_id = ? AND user_id = ? AND role = 'lead'"
      ).get(id, req.user.id);

      if (!isLead) {
        return res.status(403).json({ success: false, error: 'Only admins or project leads can add members.' });
      }
    }

    if (!user_id) {
      return res.status(400).json({ success: false, error: 'user_id is required.' });
    }

    const user = db.prepare('SELECT id FROM users WHERE id = ? AND is_active = 1').get(user_id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found.' });
    }

    const existingMember = db.prepare(
      'SELECT id FROM project_members WHERE project_id = ? AND user_id = ?'
    ).get(id, user_id);

    if (existingMember) {
      return res.status(409).json({ success: false, error: 'User is already a member of this project.' });
    }

    const result = db.prepare(`
      INSERT INTO project_members (project_id, user_id, role)
      VALUES (?, ?, ?)
    `).run(id, user_id, role || 'member');

    const member = db.prepare(`
      SELECT pm.*, u.name as user_name, u.email as user_email
      FROM project_members pm
      JOIN users u ON pm.user_id = u.id
      WHERE pm.id = ?
    `).get(result.lastInsertRowid);

    res.status(201).json({ success: true, data: member });
  } catch (error) {
    console.error('Add project member error:', error);
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

// DELETE /api/projects/:id/members/:userId — remove member
router.delete('/:id/members/:userId', (req, res) => {
  try {
    const { id, userId } = req.params;

    const membership = db.prepare(
      'SELECT id FROM project_members WHERE project_id = ? AND user_id = ?'
    ).get(id, userId);

    if (!membership) {
      return res.status(404).json({ success: false, error: 'Member not found in this project.' });
    }

    // Check if requester is admin or project lead
    if (req.user.role !== 'admin') {
      const isLead = db.prepare(
        "SELECT id FROM project_members WHERE project_id = ? AND user_id = ? AND role = 'lead'"
      ).get(id, req.user.id);

      if (!isLead) {
        return res.status(403).json({ success: false, error: 'Only admins or project leads can remove members.' });
      }
    }

    db.prepare('DELETE FROM project_members WHERE project_id = ? AND user_id = ?').run(id, userId);

    res.json({ success: true, data: { message: 'Member removed from project.' } });
  } catch (error) {
    console.error('Remove project member error:', error);
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

// DELETE /api/projects/:id — delete project
router.delete('/:id', authorize('admin'), (req, res) => {
  try {
    const { id } = req.params;

    const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found.' });
    }

    db.prepare('DELETE FROM projects WHERE id = ?').run(id);

    res.json({ success: true, data: { message: 'Project deleted successfully.' } });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

export default router;
