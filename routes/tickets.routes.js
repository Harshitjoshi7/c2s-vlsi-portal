import { Router } from 'express';
import db, { createNotification } from '../database/db.js';
import { verifyToken } from '../middleware/auth.js';
import { authorize } from '../middleware/roleGuard.js';

const router = Router();

router.use(verifyToken);

// GET /api/tickets — list all tickets (admin: all, student: own)
router.get('/', async (req, res) => {
  try {
    const { status } = req.query;
    let query;
    const params = [];

    if (req.user.role === 'admin') {
      query = `
        SELECT t.*, u.name as raised_by_name, p.pc_name,
               a.name as assigned_admin_name
        FROM tickets t
        JOIN users u ON t.raised_by = u.id
        LEFT JOIN pcs p ON t.pc_id = p.id
        LEFT JOIN users a ON t.assigned_admin = a.id
      `;
    } else {
      params.push(req.user.id);
      query = `
        SELECT t.*, u.name as raised_by_name, p.pc_name,
               a.name as assigned_admin_name
        FROM tickets t
        JOIN users u ON t.raised_by = u.id
        LEFT JOIN pcs p ON t.pc_id = p.id
        LEFT JOIN users a ON t.assigned_admin = a.id
        WHERE t.raised_by = $${params.length}
      `;
    }

    if (status) {
      params.push(status);
      query += (params.length > 1 ? ' AND' : ' WHERE') + ` t.status = $${params.length}`;
    }

    query += ' ORDER BY t.created_at DESC';
    const result = await db.query(query, params);

    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('List tickets error:', error);
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

// GET /api/tickets/my — list current student's tickets
router.get('/my', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT t.*, p.pc_name, a.name as assigned_admin_name
      FROM tickets t
      LEFT JOIN pcs p ON t.pc_id = p.id
      LEFT JOIN users a ON t.assigned_admin = a.id
      WHERE t.raised_by = $1
      ORDER BY t.created_at DESC
    `, [req.user.id]);

    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Get my tickets error:', error);
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

// POST /api/tickets — raise a new ticket
router.post('/', async (req, res) => {
  try {
    const { pc_id, issue_type, priority, description, screenshots } = req.body;

    if (!description || !description.trim()) {
      return res.status(400).json({ success: false, error: 'Description is required.' });
    }

    // Insert with a temporary ticket number, then update with the real ID-based number
    const insertRes = await db.query(`
      INSERT INTO tickets (ticket_number, pc_id, raised_by, issue_type, priority, description, screenshots)
      VALUES ('TKT-TEMP', $1, $2, $3, $4, $5, $6)
      RETURNING id
    `, [
      pc_id || null,
      req.user.id,
      issue_type || 'other',
      priority || 'medium',
      description,
      screenshots ? JSON.stringify(screenshots) : '[]',
    ]);

    const ticketId = insertRes.rows[0].id;
    const ticketNumber = 'TKT-' + String(ticketId).padStart(5, '0');

    await db.query('UPDATE tickets SET ticket_number = $1 WHERE id = $2', [ticketNumber, ticketId]);

    // Notify all admins
    const adminsRes = await db.query("SELECT id FROM users WHERE role = 'admin' AND is_active = 1");
    for (const admin of adminsRes.rows) {
      await createNotification(
        admin.id,
        'ticket',
        'New Ticket Raised',
        `Ticket ${ticketNumber} has been raised: ${description.substring(0, 100)}`,
        `/tickets/${ticketId}`
      );
    }

    const ticketRes = await db.query('SELECT * FROM tickets WHERE id = $1', [ticketId]);

    res.status(201).json({ success: true, data: ticketRes.rows[0] });
  } catch (error) {
    console.error('Create ticket error:', error);
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

// PUT /api/tickets/:id — update ticket
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, priority, assigned_admin, description, issue_type, resolution_notes } = req.body;

    const ticketRes = await db.query('SELECT * FROM tickets WHERE id = $1', [id]);
    const ticket = ticketRes.rows[0];
    if (!ticket) {
      return res.status(404).json({ success: false, error: 'Ticket not found.' });
    }

    const isAdminUser = req.user.role === 'admin';
    if (!isAdminUser && ticket.raised_by !== req.user.id) {
      return res.status(403).json({ success: false, error: 'You can only update your own tickets.' });
    }

    if (!isAdminUser && ticket.status !== 'open') {
      return res.status(403).json({ success: false, error: 'You cannot edit a ticket once it is being processed.' });
    }

    if (isAdminUser) {
      await db.query(`
        UPDATE tickets SET
          status = COALESCE($1, status),
          priority = COALESCE($2, priority),
          assigned_admin = COALESCE($3, assigned_admin),
          description = COALESCE($4, description),
          issue_type = COALESCE($5, issue_type),
          resolution_notes = COALESCE($6, resolution_notes)
        WHERE id = $7
      `, [
        status || null,
        priority || null,
        assigned_admin !== undefined ? assigned_admin : null,
        description || null,
        issue_type || null,
        resolution_notes || null,
        id,
      ]);
    } else {
      await db.query(`
        UPDATE tickets SET
          description = COALESCE($1, description),
          issue_type = COALESCE($2, issue_type)
        WHERE id = $3
      `, [description || null, issue_type || null, id]);
    }

    const updatedRes = await db.query(`
      SELECT t.*, u.name as raised_by_name, p.pc_name, a.name as assigned_admin_name
      FROM tickets t
      JOIN users u ON t.raised_by = u.id
      LEFT JOIN pcs p ON t.pc_id = p.id
      LEFT JOIN users a ON t.assigned_admin = a.id
      WHERE t.id = $1
    `, [id]);

    res.json({ success: true, data: updatedRes.rows[0] });
  } catch (error) {
    console.error('Update ticket error:', error);
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

// PUT /api/tickets/:id/resolve — resolve ticket with resolution notes (admin)
router.put('/:id/resolve', authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { resolution_notes } = req.body;

    const ticketRes = await db.query('SELECT * FROM tickets WHERE id = $1', [id]);
    const ticket = ticketRes.rows[0];
    if (!ticket) {
      return res.status(404).json({ success: false, error: 'Ticket not found.' });
    }

    await db.query(`
      UPDATE tickets SET
        status = 'resolved',
        resolution_notes = $1,
        assigned_admin = COALESCE(assigned_admin, $2),
        resolved_at = CURRENT_TIMESTAMP
      WHERE id = $3
    `, [resolution_notes || null, req.user.id, id]);

    // Notify the student who raised the ticket
    await createNotification(
      ticket.raised_by,
      'ticket',
      'Ticket Resolved',
      `Your ticket ${ticket.ticket_number} has been resolved.${resolution_notes ? ' Notes: ' + resolution_notes.substring(0, 100) : ''}`,
      `/tickets/${id}`
    );

    const updatedRes = await db.query('SELECT * FROM tickets WHERE id = $1', [id]);

    res.json({ success: true, data: updatedRes.rows[0] });
  } catch (error) {
    console.error('Resolve ticket error:', error);
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

// DELETE /api/tickets/:id — delete a ticket
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const ticketRes = await db.query('SELECT * FROM tickets WHERE id = $1', [id]);
    const ticket = ticketRes.rows[0];
    if (!ticket) {
      return res.status(404).json({ success: false, error: 'Ticket not found.' });
    }

    const isAdminUser = req.user.role === 'admin';

    // Students can only delete their own tickets
    if (!isAdminUser && ticket.raised_by !== req.user.id) {
      return res.status(403).json({ success: false, error: 'You can only delete your own tickets.' });
    }

    await db.query('DELETE FROM tickets WHERE id = $1', [id]);

    res.json({ success: true, message: 'Ticket deleted successfully.' });
  } catch (error) {
    console.error('Delete ticket error:', error);
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

export default router;
