import { Router } from 'express';
import db, { createNotification } from '../database/db.js';
import { verifyToken } from '../middleware/auth.js';
import { authorize } from '../middleware/roleGuard.js';

const router = Router();

router.use(verifyToken);

// GET /api/tickets — list all tickets (admin: all, student: own)
router.get('/', (req, res) => {
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
      query = `
        SELECT t.*, u.name as raised_by_name, p.pc_name,
               a.name as assigned_admin_name
        FROM tickets t
        JOIN users u ON t.raised_by = u.id
        LEFT JOIN pcs p ON t.pc_id = p.id
        LEFT JOIN users a ON t.assigned_admin = a.id
        WHERE t.raised_by = ?
      `;
      params.push(req.user.id);
    }

    if (status) {
      query += params.length > 0 ? ' AND' : ' WHERE';
      query += ' t.status = ?';
      params.push(status);
    }

    query += ' ORDER BY t.created_at DESC';
    const tickets = db.prepare(query).all(...params);

    res.json({ success: true, data: tickets });
  } catch (error) {
    console.error('List tickets error:', error);
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

// GET /api/tickets/my — list current student's tickets
router.get('/my', (req, res) => {
  try {
    const tickets = db.prepare(`
      SELECT t.*, p.pc_name, a.name as assigned_admin_name
      FROM tickets t
      LEFT JOIN pcs p ON t.pc_id = p.id
      LEFT JOIN users a ON t.assigned_admin = a.id
      WHERE t.raised_by = ?
      ORDER BY t.created_at DESC
    `).all(req.user.id);

    res.json({ success: true, data: tickets });
  } catch (error) {
    console.error('Get my tickets error:', error);
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

// POST /api/tickets — raise a new ticket
router.post('/', (req, res) => {
  try {
    const { pc_id, issue_type, priority, description, screenshots } = req.body;

    if (!description || !description.trim()) {
      return res.status(400).json({ success: false, error: 'Description is required.' });
    }

    // Generate ticket number using a temporary placeholder, then update
    const result = db.prepare(`
      INSERT INTO tickets (ticket_number, pc_id, raised_by, issue_type, priority, description, screenshots)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      'TKT-TEMP',
      pc_id || null,
      req.user.id,
      issue_type || 'other',
      priority || 'medium',
      description,
      screenshots ? JSON.stringify(screenshots) : '[]'
    );

    const ticketId = result.lastInsertRowid;
    const ticketNumber = 'TKT-' + String(ticketId).padStart(5, '0');

    db.prepare('UPDATE tickets SET ticket_number = ? WHERE id = ?').run(ticketNumber, ticketId);

    // Notify all admins
    const admins = db.prepare("SELECT id FROM users WHERE role = 'admin' AND is_active = 1").all();
    for (const admin of admins) {
      createNotification(
        admin.id,
        'ticket',
        'New Ticket Raised',
        `Ticket ${ticketNumber} has been raised: ${description.substring(0, 100)}`,
        `/tickets/${ticketId}`
      );
    }

    const ticket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(ticketId);

    res.status(201).json({ success: true, data: ticket });
  } catch (error) {
    console.error('Create ticket error:', error);
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

// PUT /api/tickets/:id — update ticket
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { status, priority, assigned_admin, description, issue_type, resolution_notes } = req.body;

    const ticket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(id);
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
      db.prepare(`
        UPDATE tickets SET
          status = COALESCE(?, status),
          priority = COALESCE(?, priority),
          assigned_admin = COALESCE(?, assigned_admin),
          description = COALESCE(?, description),
          issue_type = COALESCE(?, issue_type),
          resolution_notes = COALESCE(?, resolution_notes)
        WHERE id = ?
      `).run(
        status || null,
        priority || null,
        assigned_admin !== undefined ? assigned_admin : null,
        description || null,
        issue_type || null,
        resolution_notes || null,
        id
      );
    } else {
      db.prepare(`
        UPDATE tickets SET
          description = COALESCE(?, description),
          issue_type = COALESCE(?, issue_type)
        WHERE id = ?
      `).run(
        description || null,
        issue_type || null,
        id
      );
    }

    const updated = db.prepare(`
      SELECT t.*, u.name as raised_by_name, p.pc_name, a.name as assigned_admin_name
      FROM tickets t
      JOIN users u ON t.raised_by = u.id
      LEFT JOIN pcs p ON t.pc_id = p.id
      LEFT JOIN users a ON t.assigned_admin = a.id
      WHERE t.id = ?
    `).get(id);

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Update ticket error:', error);
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

// PUT /api/tickets/:id/resolve — resolve ticket with resolution notes (admin)
router.put('/:id/resolve', authorize('admin'), (req, res) => {
  try {
    const { id } = req.params;
    const { resolution_notes } = req.body;

    const ticket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(id);
    if (!ticket) {
      return res.status(404).json({ success: false, error: 'Ticket not found.' });
    }

    db.prepare(`
      UPDATE tickets SET
        status = 'resolved',
        resolution_notes = ?,
        assigned_admin = COALESCE(assigned_admin, ?),
        resolved_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(resolution_notes || null, req.user.id, id);

    // Notify the student who raised the ticket
    createNotification(
      ticket.raised_by,
      'ticket',
      'Ticket Resolved',
      `Your ticket ${ticket.ticket_number} has been resolved.${resolution_notes ? ' Notes: ' + resolution_notes.substring(0, 100) : ''}`,
      `/tickets/${id}`
    );

    const updated = db.prepare('SELECT * FROM tickets WHERE id = ?').get(id);

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Resolve ticket error:', error);
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

export default router;
