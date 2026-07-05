import { Router } from 'express';
import db from '../database/db.js';
import { verifyToken } from '../middleware/auth.js';
import { authorize } from '../middleware/roleGuard.js';

const router = Router();

router.use(verifyToken);

// GET /api/pcs — list all PCs with current assignments
router.get('/', async (req, res) => {
  try {
    const pcsRes = await db.query('SELECT * FROM pcs ORDER BY pc_name ASC');
    const pcs = pcsRes.rows;

    const pcsWithAssignments = await Promise.all(
      pcs.map(async (pc) => {
        const assignmentRes = await db.query(`
          SELECT pa.*, u.name as user_name, u.email as user_email
          FROM pc_assignments pa
          JOIN users u ON pa.user_id = u.id
          WHERE pa.pc_id = $1 AND pa.status = 'active'
        `, [pc.id]);

        return { ...pc, current_assignment: assignmentRes.rows[0] || null };
      })
    );

    res.json({ success: true, data: pcsWithAssignments });
  } catch (error) {
    console.error('List PCs error:', error);
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

// GET /api/pcs/my — list current user's assigned PCs
router.get('/my', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT pa.*, p.pc_name, p.specs, p.installed_software, p.condition, p.notes
      FROM pc_assignments pa
      JOIN pcs p ON pa.pc_id = p.id
      WHERE pa.user_id = $1 AND pa.status = 'active'
    `, [req.user.id]);

    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Get my PCs error:', error);
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

// POST /api/pcs — add a PC (admin only)
router.post('/', authorize('admin'), async (req, res) => {
  try {
    const { pc_name, specs, installed_software, condition, notes } = req.body;

    if (!pc_name || !pc_name.trim()) {
      return res.status(400).json({ success: false, error: 'PC name is required.' });
    }

    const existingRes = await db.query('SELECT id FROM pcs WHERE pc_name = $1', [pc_name]);
    if (existingRes.rows[0]) {
      return res.status(409).json({ success: false, error: 'PC with this name already exists.' });
    }

    const insertRes = await db.query(`
      INSERT INTO pcs (pc_name, specs, installed_software, condition, notes)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id
    `, [
      pc_name,
      specs ? JSON.stringify(specs) : '{}',
      installed_software ? JSON.stringify(installed_software) : '[]',
      condition || 'good',
      notes || null,
    ]);

    const pcRes = await db.query('SELECT * FROM pcs WHERE id = $1', [insertRes.rows[0].id]);

    res.status(201).json({ success: true, data: pcRes.rows[0] });
  } catch (error) {
    console.error('Create PC error:', error);
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

// PUT /api/pcs/:id — update PC details (admin only)
router.put('/:id', authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { pc_name, specs, installed_software, condition, notes } = req.body;

    const pcRes = await db.query('SELECT * FROM pcs WHERE id = $1', [id]);
    if (!pcRes.rows[0]) {
      return res.status(404).json({ success: false, error: 'PC not found.' });
    }

    if (pc_name) {
      const nameExistsRes = await db.query('SELECT id FROM pcs WHERE pc_name = $1 AND id != $2', [pc_name, id]);
      if (nameExistsRes.rows[0]) {
        return res.status(409).json({ success: false, error: 'PC name already in use.' });
      }
    }

    await db.query(`
      UPDATE pcs SET
        pc_name = COALESCE($1, pc_name),
        specs = COALESCE($2, specs),
        installed_software = COALESCE($3, installed_software),
        condition = COALESCE($4, condition),
        notes = COALESCE($5, notes)
      WHERE id = $6
    `, [
      pc_name || null,
      specs ? JSON.stringify(specs) : null,
      installed_software ? JSON.stringify(installed_software) : null,
      condition || null,
      notes !== undefined ? notes : null,
      id,
    ]);

    const updatedRes = await db.query('SELECT * FROM pcs WHERE id = $1', [id]);

    res.json({ success: true, data: updatedRes.rows[0] });
  } catch (error) {
    console.error('Update PC error:', error);
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

// POST /api/pcs/:id/assign — assign PC to student (admin only)
router.post('/:id/assign', authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id } = req.body;

    const pcRes = await db.query('SELECT * FROM pcs WHERE id = $1', [id]);
    if (!pcRes.rows[0]) {
      return res.status(404).json({ success: false, error: 'PC not found.' });
    }

    if (!user_id) {
      return res.status(400).json({ success: false, error: 'user_id is required.' });
    }

    const userRes = await db.query('SELECT id FROM users WHERE id = $1 AND is_active = 1', [user_id]);
    if (!userRes.rows[0]) {
      return res.status(404).json({ success: false, error: 'User not found.' });
    }

    // Check if PC already has an active assignment
    const activeRes = await db.query(
      "SELECT id FROM pc_assignments WHERE pc_id = $1 AND status = 'active'",
      [id]
    );
    if (activeRes.rows[0]) {
      return res.status(409).json({ success: false, error: 'PC is already assigned. Unassign it first.' });
    }

    const insertRes = await db.query(`
      INSERT INTO pc_assignments (pc_id, user_id, assigned_date, status)
      VALUES ($1, $2, CURRENT_DATE, 'active')
      RETURNING id
    `, [id, user_id]);

    const assignmentRes = await db.query(`
      SELECT pa.*, u.name as user_name, p.pc_name
      FROM pc_assignments pa
      JOIN users u ON pa.user_id = u.id
      JOIN pcs p ON pa.pc_id = p.id
      WHERE pa.id = $1
    `, [insertRes.rows[0].id]);

    res.status(201).json({ success: true, data: assignmentRes.rows[0] });
  } catch (error) {
    console.error('Assign PC error:', error);
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

// POST /api/pcs/:id/unassign — unassign PC (admin only)
router.post('/:id/unassign', authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;

    const pcRes = await db.query('SELECT * FROM pcs WHERE id = $1', [id]);
    if (!pcRes.rows[0]) {
      return res.status(404).json({ success: false, error: 'PC not found.' });
    }

    const activeRes = await db.query(
      "SELECT id FROM pc_assignments WHERE pc_id = $1 AND status = 'active'",
      [id]
    );
    if (!activeRes.rows[0]) {
      return res.status(404).json({ success: false, error: 'No active assignment found for this PC.' });
    }

    await db.query(`
      UPDATE pc_assignments SET
        status = 'transferred',
        unassigned_date = CURRENT_DATE
      WHERE pc_id = $1 AND status = 'active'
    `, [id]);

    res.json({ success: true, data: { message: 'PC unassigned successfully.' } });
  } catch (error) {
    console.error('Unassign PC error:', error);
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

// DELETE /api/pcs/:id — delete PC (admin only)
router.delete('/:id', authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;

    const pcRes = await db.query('SELECT * FROM pcs WHERE id = $1', [id]);
    if (!pcRes.rows[0]) {
      return res.status(404).json({ success: false, error: 'PC not found.' });
    }

    await db.query('DELETE FROM pcs WHERE id = $1', [id]);

    res.json({ success: true, data: { message: 'PC deleted successfully.' } });
  } catch (error) {
    console.error('Delete PC error:', error);
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

export default router;
