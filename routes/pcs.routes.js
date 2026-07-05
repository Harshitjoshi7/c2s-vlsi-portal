import { Router } from 'express';
import db from '../database/db.js';
import { verifyToken } from '../middleware/auth.js';
import { authorize } from '../middleware/roleGuard.js';

const router = Router();

router.use(verifyToken);

// GET /api/pcs — list all PCs with current assignments
router.get('/', (req, res) => {
  try {
    const pcs = db.prepare('SELECT * FROM pcs ORDER BY pc_name ASC').all();

    const pcsWithAssignments = pcs.map((pc) => {
      const currentAssignment = db.prepare(`
        SELECT pa.*, u.name as user_name, u.email as user_email
        FROM pc_assignments pa
        JOIN users u ON pa.user_id = u.id
        WHERE pa.pc_id = ? AND pa.status = 'active'
      `).get(pc.id);

      return { ...pc, current_assignment: currentAssignment || null };
    });

    res.json({ success: true, data: pcsWithAssignments });
  } catch (error) {
    console.error('List PCs error:', error);
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

// GET /api/pcs/my — list current user's assigned PCs
router.get('/my', (req, res) => {
  try {
    const assignments = db.prepare(`
      SELECT pa.*, p.pc_name, p.specs, p.installed_software, p.condition, p.notes
      FROM pc_assignments pa
      JOIN pcs p ON pa.pc_id = p.id
      WHERE pa.user_id = ? AND pa.status = 'active'
    `).all(req.user.id);

    res.json({ success: true, data: assignments });
  } catch (error) {
    console.error('Get my PCs error:', error);
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

// POST /api/pcs — add a PC (admin only)
router.post('/', authorize('admin'), (req, res) => {
  try {
    const { pc_name, specs, installed_software, condition, notes } = req.body;

    if (!pc_name || !pc_name.trim()) {
      return res.status(400).json({ success: false, error: 'PC name is required.' });
    }

    const existing = db.prepare('SELECT id FROM pcs WHERE pc_name = ?').get(pc_name);
    if (existing) {
      return res.status(409).json({ success: false, error: 'PC with this name already exists.' });
    }

    const result = db.prepare(`
      INSERT INTO pcs (pc_name, specs, installed_software, condition, notes)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      pc_name,
      specs ? JSON.stringify(specs) : '{}',
      installed_software ? JSON.stringify(installed_software) : '[]',
      condition || 'good',
      notes || null
    );

    const pc = db.prepare('SELECT * FROM pcs WHERE id = ?').get(result.lastInsertRowid);

    res.status(201).json({ success: true, data: pc });
  } catch (error) {
    console.error('Create PC error:', error);
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

// PUT /api/pcs/:id — update PC details (admin only)
router.put('/:id', authorize('admin'), (req, res) => {
  try {
    const { id } = req.params;
    const { pc_name, specs, installed_software, condition, notes } = req.body;

    const pc = db.prepare('SELECT * FROM pcs WHERE id = ?').get(id);
    if (!pc) {
      return res.status(404).json({ success: false, error: 'PC not found.' });
    }

    if (pc_name) {
      const nameExists = db.prepare('SELECT id FROM pcs WHERE pc_name = ? AND id != ?').get(pc_name, id);
      if (nameExists) {
        return res.status(409).json({ success: false, error: 'PC name already in use.' });
      }
    }

    db.prepare(`
      UPDATE pcs SET
        pc_name = COALESCE(?, pc_name),
        specs = COALESCE(?, specs),
        installed_software = COALESCE(?, installed_software),
        condition = COALESCE(?, condition),
        notes = COALESCE(?, notes)
      WHERE id = ?
    `).run(
      pc_name || null,
      specs ? JSON.stringify(specs) : null,
      installed_software ? JSON.stringify(installed_software) : null,
      condition || null,
      notes !== undefined ? notes : null,
      id
    );

    const updated = db.prepare('SELECT * FROM pcs WHERE id = ?').get(id);

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Update PC error:', error);
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

// POST /api/pcs/:id/assign — assign PC to student (admin only)
router.post('/:id/assign', authorize('admin'), (req, res) => {
  try {
    const { id } = req.params;
    const { user_id } = req.body;

    const pc = db.prepare('SELECT * FROM pcs WHERE id = ?').get(id);
    if (!pc) {
      return res.status(404).json({ success: false, error: 'PC not found.' });
    }

    if (!user_id) {
      return res.status(400).json({ success: false, error: 'user_id is required.' });
    }

    const user = db.prepare('SELECT id FROM users WHERE id = ? AND is_active = 1').get(user_id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found.' });
    }

    // Check if PC already has an active assignment
    const activeAssignment = db.prepare(
      "SELECT id FROM pc_assignments WHERE pc_id = ? AND status = 'active'"
    ).get(id);

    if (activeAssignment) {
      return res.status(409).json({ success: false, error: 'PC is already assigned. Unassign it first.' });
    }

    const result = db.prepare(`
      INSERT INTO pc_assignments (pc_id, user_id, assigned_date, status)
      VALUES (?, ?, DATE('now'), 'active')
    `).run(id, user_id);

    const assignment = db.prepare(`
      SELECT pa.*, u.name as user_name, p.pc_name
      FROM pc_assignments pa
      JOIN users u ON pa.user_id = u.id
      JOIN pcs p ON pa.pc_id = p.id
      WHERE pa.id = ?
    `).get(result.lastInsertRowid);

    res.status(201).json({ success: true, data: assignment });
  } catch (error) {
    console.error('Assign PC error:', error);
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

// POST /api/pcs/:id/unassign — unassign PC (admin only)
router.post('/:id/unassign', authorize('admin'), (req, res) => {
  try {
    const { id } = req.params;

    const pc = db.prepare('SELECT * FROM pcs WHERE id = ?').get(id);
    if (!pc) {
      return res.status(404).json({ success: false, error: 'PC not found.' });
    }

    const activeAssignment = db.prepare(
      "SELECT id FROM pc_assignments WHERE pc_id = ? AND status = 'active'"
    ).get(id);

    if (!activeAssignment) {
      return res.status(404).json({ success: false, error: 'No active assignment found for this PC.' });
    }

    db.prepare(`
      UPDATE pc_assignments SET
        status = 'transferred',
        unassigned_date = DATE('now')
      WHERE pc_id = ? AND status = 'active'
    `).run(id);

    res.json({ success: true, data: { message: 'PC unassigned successfully.' } });
  } catch (error) {
    console.error('Unassign PC error:', error);
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

// DELETE /api/pcs/:id — delete PC (admin only)
router.delete('/:id', authorize('admin'), (req, res) => {
  try {
    const { id } = req.params;

    const pc = db.prepare('SELECT * FROM pcs WHERE id = ?').get(id);
    if (!pc) {
      return res.status(404).json({ success: false, error: 'PC not found.' });
    }

    db.prepare('DELETE FROM pcs WHERE id = ?').run(id);

    res.json({ success: true, data: { message: 'PC deleted successfully.' } });
  } catch (error) {
    console.error('Delete PC error:', error);
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

export default router;
