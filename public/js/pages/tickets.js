/* ============================================================
   C2S VLSI Lab Portal — Tickets Page
   IT support tickets for hardware/software issues
   ============================================================ */

function renderTickets() {
  const user = getUser();
  const isAdminUser = user && user.role === 'admin';

  return `
    <div class="page-enter">
      <div class="page-header">
        <div class="page-header-left">
          <h1 class="page-title animate-slideUp">
            <i data-lucide="ticket" style="width:28px;height:28px;vertical-align:-4px;margin-right:10px;color:var(--info)"></i>
            Support Tickets
          </h1>
          <p class="page-subtitle animate-slideUp stagger-1">Report and track lab issues</p>
        </div>
        <div class="page-header-actions animate-slideUp stagger-2">
          <button class="btn btn-primary" id="newTicketBtn">
            <i data-lucide="plus" style="width:16px;height:16px"></i>
            New Ticket
          </button>
        </div>
      </div>

      <!-- Quick Stats -->
      <div class="grid grid-stats" style="margin-bottom:var(--space-lg)">
        <div class="stat-card animate-slideUp stagger-1">
          <div class="stat-card-icon red"><i data-lucide="alert-circle" style="width:22px;height:22px"></i></div>
          <div class="stat-card-value" id="ticketOpen">—</div>
          <div class="stat-card-label">Open</div>
        </div>
        <div class="stat-card animate-slideUp stagger-2">
          <div class="stat-card-icon orange"><i data-lucide="loader" style="width:22px;height:22px"></i></div>
          <div class="stat-card-value" id="ticketInProgress">—</div>
          <div class="stat-card-label">In Progress</div>
        </div>
        <div class="stat-card animate-slideUp stagger-3">
          <div class="stat-card-icon green"><i data-lucide="check-circle" style="width:22px;height:22px"></i></div>
          <div class="stat-card-value" id="ticketResolved">—</div>
          <div class="stat-card-label">Resolved</div>
        </div>
        <div class="stat-card animate-slideUp stagger-4">
          <div class="stat-card-icon blue"><i data-lucide="list" style="width:22px;height:22px"></i></div>
          <div class="stat-card-value" id="ticketTotal">—</div>
          <div class="stat-card-label">Total</div>
        </div>
      </div>

      <!-- Filters -->
      <div class="card animate-slideUp stagger-3" style="margin-bottom:var(--space-lg)">
        <div class="card-body" style="padding:var(--space-md)">
          <div style="display:flex;gap:var(--space-md);flex-wrap:wrap;align-items:center">
            <div class="search-input" style="flex:1;min-width:200px">
              <i data-lucide="search" class="search-icon"></i>
              <input type="text" id="ticketSearch" placeholder="Search tickets..." />
            </div>
            <select class="form-select" id="ticketStatusFilter" style="width:auto">
              <option value="">All Status</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
            <select class="form-select" id="ticketTypeFilter" style="width:auto">
              <option value="">All Types</option>
              <option value="hardware">Hardware</option>
              <option value="software">Software</option>
              <option value="network">Network</option>
              <option value="license">License</option>
              <option value="other">Other</option>
            </select>
            <select class="form-select" id="ticketPriorityFilter" style="width:auto">
              <option value="">All Priorities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Tickets -->
      <div id="ticketsContainer">
        <div style="display:flex;flex-direction:column;gap:var(--space-md)">
          ${[1,2,3].map(() => `
            <div class="card"><div class="card-body">
              <div class="skeleton skeleton-heading" style="width:50%;margin-bottom:8px"></div>
              <div class="skeleton skeleton-text" style="width:80%"></div>
            </div></div>
          `).join('')}
        </div>
      </div>
    </div>

    <!-- Ticket Modal -->
    <div class="modal-overlay" id="ticketModalOverlay" style="display:none">
      <div class="modal" style="max-width:600px">
        <div class="modal-header">
          <h3 class="modal-title" id="ticketModalTitle">New Ticket</h3>
          <button class="modal-close" id="ticketModalClose">
            <i data-lucide="x" style="width:20px;height:20px"></i>
          </button>
        </div>
        <div class="modal-body">
          <form id="ticketForm">
            <div class="form-group">
              <label class="form-label">Issue Description *</label>
              <textarea class="form-textarea" id="ticketDesc" rows="4" placeholder="Describe the issue in detail..." required style="min-height:120px"></textarea>
            </div>
            <div class="grid grid-2" style="gap:var(--space-md)">
              <div class="form-group">
                <label class="form-label">Issue Type</label>
                <select class="form-select" id="ticketType">
                  <option value="hardware">Hardware</option>
                  <option value="software">Software</option>
                  <option value="network">Network</option>
                  <option value="license">License</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Priority</label>
                <select class="form-select" id="ticketPriority">
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
            </div>
            <div class="form-group" id="ticketPCGroup" style="display:none">
              <label class="form-label">Related PC / Workstation</label>
              <select class="form-select" id="ticketPC">
                <option value="">— Select PC —</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Attach Image (optional)</label>
              <div style="display:flex;gap:var(--space-sm);align-items:center">
                <label class="btn btn-secondary btn-sm" style="cursor:pointer;margin:0">
                  <i data-lucide="image" style="width:14px;height:14px;vertical-align:-2px;margin-right:4px"></i> Choose File
                  <input type="file" id="ticketImage" accept="image/*" style="display:none" />
                </label>
                <label class="btn btn-secondary btn-sm" style="cursor:pointer;margin:0">
                  <i data-lucide="camera" style="width:14px;height:14px;vertical-align:-2px;margin-right:4px"></i> Camera
                  <input type="file" id="ticketCamera" accept="image/*" capture="environment" style="display:none" />
                </label>
              </div>
              <div id="ticketImagePreview" style="margin-top:var(--space-sm);display:none">
                <div style="position:relative;display:inline-block">
                  <img id="ticketImagePreviewImg" style="max-width:200px;max-height:150px;border-radius:var(--border-radius-sm);border:1px solid var(--border-color)" />
                  <button type="button" class="btn btn-ghost btn-sm" id="ticketImageRemove" style="position:absolute;top:4px;right:4px;background:rgba(0,0,0,0.6);border-radius:50%;padding:2px;color:#fff">
                    <i data-lucide="x" style="width:12px;height:12px"></i>
                  </button>
                </div>
              </div>
            </div>
            <div class="form-group" id="ticketAdminFields" style="display:none">
              <label class="form-label">Status</label>
              <select class="form-select" id="ticketStatus">
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </div>
            <div class="form-group" id="ticketResolutionGroup" style="display:none">
              <label class="form-label">Resolution Notes</label>
              <textarea class="form-textarea" id="ticketResolution" rows="3" placeholder="How was the issue resolved?"></textarea>
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" id="ticketModalCancel">Cancel</button>
          <button class="btn btn-primary" id="ticketSubmitBtn">
            <span id="ticketSubmitText">Submit Ticket</span>
            <div class="spinner" id="ticketSubmitSpinner" style="display:none"></div>
          </button>
        </div>
      </div>
    </div>
  `;
}

async function initTickets() {
  const user = getUser();
  const isAdminUser = user && user.role === 'admin';
  let allTickets = [];
  let editingTicketId = null;
  let myPCs = [];
  let ticketImageBase64 = null;

  // Load student's assigned PCs
  if (!isAdminUser) {
    try {
      const pcRes = await api.get('pcs/my');
      myPCs = Array.isArray(pcRes) ? pcRes : (pcRes?.data || []);
      const pcSelect = document.getElementById('ticketPC');
      if (pcSelect) {
        myPCs.forEach(pc => {
          const opt = document.createElement('option');
          opt.value = pc.id;
          opt.textContent = pc.pc_name || pc.name || `PC #${pc.id}`;
          pcSelect.appendChild(opt);
        });
      }
    } catch(e) {}
  }

  async function loadTickets() {
    try {
      const endpoint = isAdminUser ? 'tickets' : 'tickets/my';
      const res = await api.get(endpoint);
      allTickets = Array.isArray(res) ? res : (res?.data || []);
      updateStats();
      applyFilters();
    } catch(e) {
      renderTickets([]);
    }
  }

  function updateStats() {
    document.getElementById('ticketOpen').textContent = allTickets.filter(t => t.status === 'open').length;
    document.getElementById('ticketInProgress').textContent = allTickets.filter(t => t.status === 'in_progress').length;
    document.getElementById('ticketResolved').textContent = allTickets.filter(t => t.status === 'resolved' || t.status === 'closed').length;
    document.getElementById('ticketTotal').textContent = allTickets.length;
  }

  const priorityConfig = {
    low:      { color:'var(--priority-low)',      bg:'rgba(0,230,118,0.1)'  },
    medium:   { color:'var(--priority-medium)',   bg:'rgba(255,171,64,0.1)' },
    high:     { color:'var(--priority-high)',     bg:'rgba(255,110,64,0.1)' },
    critical: { color:'var(--priority-critical)', bg:'rgba(255,82,82,0.12)' },
  };

  const statusConfig = {
    open:        { color:'var(--error)',           bg:'rgba(255,82,82,0.1)',   label:'Open',        icon:'alert-circle' },
    in_progress: { color:'var(--warning)',         bg:'rgba(255,171,64,0.1)', label:'In Progress', icon:'loader'       },
    resolved:    { color:'var(--success)',         bg:'rgba(0,230,118,0.1)',  label:'Resolved',    icon:'check-circle' },
    closed:      { color:'var(--text-muted)',      bg:'rgba(255,255,255,0.06)', label:'Closed',    icon:'x-circle'     },
  };

  const typeIcons = {
    hardware:'cpu', software:'code', network:'wifi', license:'key', other:'help-circle'
  };

  function renderTickets(tickets) {
    const container = document.getElementById('ticketsContainer');
    if (!container) return;

    if (!tickets || tickets.length === 0) {
      container.innerHTML = `
        <div class="card"><div class="card-body">
          <div class="empty-state">
            <div class="empty-state-icon"><i data-lucide="ticket" style="width:28px;height:28px"></i></div>
            <div class="empty-state-title">No tickets found</div>
            <div class="empty-state-description">No support tickets match your filters.</div>
          </div>
        </div></div>
      `;
      if (window.lucide) lucide.createIcons();
      return;
    }

    container.innerHTML = `
      <div style="display:flex;flex-direction:column;gap:var(--space-md)">
        ${tickets.map(t => {
          const pri = priorityConfig[t.priority] || priorityConfig.medium;
          const st = statusConfig[t.status] || statusConfig.open;
          const typeIcon = typeIcons[t.issue_type] || 'help-circle';
          const dateStr = new Date(t.created_at).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' });

          return `
            <div class="card" style="border-left:3px solid ${st.color}">
              <div class="card-body">
                <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:var(--space-md)">
                  <div style="flex:1">
                    <div style="display:flex;align-items:center;gap:var(--space-sm);flex-wrap:wrap;margin-bottom:8px">
                      <span style="font-size:0.8125rem;font-weight:700;color:var(--text-muted)">${t.ticket_number || `#${t.id}`}</span>
                      <span style="display:inline-flex;align-items:center;gap:4px;padding:3px 10px;border-radius:20px;font-size:0.72rem;font-weight:600;background:${st.bg};color:${st.color}">
                        <i data-lucide="${st.icon}" style="width:11px;height:11px"></i>${st.label}
                      </span>
                      <span style="display:inline-flex;align-items:center;gap:4px;padding:3px 10px;border-radius:20px;font-size:0.72rem;font-weight:600;background:${pri.bg};color:${pri.color};text-transform:capitalize">${t.priority}</span>
                      <span class="badge badge-info" style="display:inline-flex;align-items:center;gap:4px">
                        <i data-lucide="${typeIcon}" style="width:11px;height:11px"></i>${t.issue_type || 'other'}
                      </span>
                    </div>
                    <p style="color:var(--text-secondary);font-size:0.9rem;margin:0 0 var(--space-sm);line-height:1.6;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">${t.description}</p>
                    <div style="display:flex;align-items:center;gap:var(--space-lg);color:var(--text-muted);font-size:0.8rem">
                      <span><i data-lucide="calendar" style="width:13px;height:13px;vertical-align:-2px;margin-right:3px"></i>${dateStr}</span>
                      ${isAdminUser && t.raised_by_name ? `<span><i data-lucide="user" style="width:13px;height:13px;vertical-align:-2px;margin-right:3px"></i>${t.raised_by_name}</span>` : ''}
                      ${t.resolution_notes ? `<span style="color:var(--success)"><i data-lucide="check" style="width:13px;height:13px;vertical-align:-2px;margin-right:3px"></i>Resolution noted</span>` : ''}
                    </div>
                  </div>
                  <div style="display:flex;gap:4px;flex-shrink:0">
                    ${isAdminUser ? `
                    <button class="btn btn-ghost btn-sm" onclick="editTicket(${t.id})" title="Update">
                      <i data-lucide="pencil" style="width:14px;height:14px"></i>
                    </button>
                    <button class="btn btn-ghost btn-sm" onclick="deleteTicket(${t.id})" style="color:var(--error)" title="Delete">
                      <i data-lucide="trash-2" style="width:14px;height:14px"></i>
                    </button>
                    ` : t.status === 'open' ? `
                    <button class="btn btn-ghost btn-sm" onclick="editTicket(${t.id})" title="Edit">
                      <i data-lucide="pencil" style="width:14px;height:14px"></i>
                    </button>
                    <button class="btn btn-ghost btn-sm" onclick="deleteTicket(${t.id})" style="color:var(--error)" title="Delete">
                      <i data-lucide="trash-2" style="width:14px;height:14px"></i>
                    </button>
                    ` : ''}
                  </div>
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
    if (window.lucide) lucide.createIcons();
  }

  function applyFilters() {
    const search = document.getElementById('ticketSearch')?.value.toLowerCase() || '';
    const statusFilter = document.getElementById('ticketStatusFilter')?.value || '';
    const typeFilter = document.getElementById('ticketTypeFilter')?.value || '';
    const priorityFilter = document.getElementById('ticketPriorityFilter')?.value || '';

    const filtered = allTickets.filter(t => {
      const matchSearch = !search || (t.description || '').toLowerCase().includes(search) || (t.ticket_number || '').toLowerCase().includes(search);
      const matchStatus = !statusFilter || t.status === statusFilter;
      const matchType = !typeFilter || t.issue_type === typeFilter;
      const matchPriority = !priorityFilter || t.priority === priorityFilter;
      return matchSearch && matchStatus && matchType && matchPriority;
    });
    renderTickets(filtered);
  }

  ['ticketSearch','ticketStatusFilter','ticketTypeFilter','ticketPriorityFilter'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', applyFilters);
  });

  // Modal
  const overlay = document.getElementById('ticketModalOverlay');
  const adminFields = document.getElementById('ticketAdminFields');
  const resolutionGroup = document.getElementById('ticketResolutionGroup');
  const pcGroup = document.getElementById('ticketPCGroup');

  if (adminFields && isAdminUser) adminFields.style.display = '';
  if (resolutionGroup && isAdminUser) resolutionGroup.style.display = '';

  // Show/hide PC selector based on issue type
  function updatePCVisibility() {
    const typeVal = document.getElementById('ticketType')?.value;
    if (pcGroup) {
      pcGroup.style.display = (typeVal === 'hardware' && !isAdminUser) ? '' : 'none';
    }
  }
  document.getElementById('ticketType')?.addEventListener('change', updatePCVisibility);
  updatePCVisibility();

  // Image upload handlers
  function handleImageSelect(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      showToast({ message: 'Image must be under 5MB', type: 'warning' });
      return;
    }
    const reader = new FileReader();
    reader.onload = function(ev) {
      ticketImageBase64 = ev.target.result;
      const preview = document.getElementById('ticketImagePreview');
      const previewImg = document.getElementById('ticketImagePreviewImg');
      if (preview && previewImg) {
        previewImg.src = ticketImageBase64;
        preview.style.display = '';
      }
    };
    reader.readAsDataURL(file);
  }
  document.getElementById('ticketImage')?.addEventListener('change', handleImageSelect);
  document.getElementById('ticketCamera')?.addEventListener('change', handleImageSelect);
  document.getElementById('ticketImageRemove')?.addEventListener('click', () => {
    ticketImageBase64 = null;
    const preview = document.getElementById('ticketImagePreview');
    if (preview) preview.style.display = 'none';
    const imgInput = document.getElementById('ticketImage');
    const camInput = document.getElementById('ticketCamera');
    if (imgInput) imgInput.value = '';
    if (camInput) camInput.value = '';
  });

  document.getElementById('ticketStatus')?.addEventListener('change', function() {
    if (resolutionGroup) {
      resolutionGroup.style.display = (this.value === 'resolved' || this.value === 'closed') ? '' : 'none';
    }
  });

  function openModal(ticket = null, preselectedPCId = null) {
    editingTicketId = ticket ? ticket.id : null;
    document.getElementById('ticketModalTitle').textContent = ticket ? 'Update Ticket' : 'New Ticket';
    document.getElementById('ticketDesc').value = ticket?.description || '';
    document.getElementById('ticketType').value = ticket?.issue_type || 'hardware';
    document.getElementById('ticketPriority').value = ticket?.priority || 'medium';
    // Reset image
    ticketImageBase64 = null;
    const preview = document.getElementById('ticketImagePreview');
    if (preview) preview.style.display = 'none';
    const imgInput = document.getElementById('ticketImage');
    const camInput = document.getElementById('ticketCamera');
    if (imgInput) imgInput.value = '';
    if (camInput) camInput.value = '';
    // Set PC
    const pcSelect = document.getElementById('ticketPC');
    if (pcSelect) {
      pcSelect.value = preselectedPCId || ticket?.pc_id || '';
    }
    updatePCVisibility();
    if (isAdminUser) {
      document.getElementById('ticketStatus').value = ticket?.status || 'open';
      document.getElementById('ticketResolution').value = ticket?.resolution_notes || '';
      const showRes = ticket?.status === 'resolved' || ticket?.status === 'closed';
      if (resolutionGroup) resolutionGroup.style.display = showRes ? '' : 'none';
    }
    document.getElementById('ticketSubmitText').textContent = ticket ? 'Update Ticket' : 'Submit Ticket';
    overlay.style.display = 'flex';
    if (window.lucide) lucide.createIcons();
  }
  function closeModal() { overlay.style.display = 'none'; editingTicketId = null; }

  document.getElementById('newTicketBtn')?.addEventListener('click', () => openModal());
  document.getElementById('ticketModalClose')?.addEventListener('click', closeModal);
  document.getElementById('ticketModalCancel')?.addEventListener('click', closeModal);
  overlay?.addEventListener('click', e => { if (e.target === overlay) closeModal(); });

  document.getElementById('ticketSubmitBtn')?.addEventListener('click', async () => {
    const description = document.getElementById('ticketDesc').value.trim();
    if (!description) { showToast({ message: 'Please describe the issue', type: 'warning' }); return; }

    const payload = {
      description,
      issue_type: document.getElementById('ticketType').value,
      priority: document.getElementById('ticketPriority').value,
    };

    // Add PC ID if hardware type
    const pcVal = document.getElementById('ticketPC')?.value;
    if (pcVal) payload.pc_id = parseInt(pcVal);

    // Add screenshot if attached
    if (ticketImageBase64) {
      payload.screenshots = [ticketImageBase64];
    }

    if (isAdminUser) {
      payload.status = document.getElementById('ticketStatus').value;
      payload.resolution_notes = document.getElementById('ticketResolution').value.trim() || null;
    }

    const btnText = document.getElementById('ticketSubmitText');
    const spinner = document.getElementById('ticketSubmitSpinner');
    btnText.style.display = 'none';
    spinner.style.display = 'inline-block';

    try {
      if (editingTicketId) {
        await api.put(`tickets/${editingTicketId}`, payload);
        showToast({ message: 'Ticket updated!', type: 'success' });
      } else {
        await api.post('tickets', payload);
        showToast({ message: 'Ticket submitted!', type: 'success' });
      }
      closeModal();
      await loadTickets();
    } catch(err) {
      showToast({ message: err.message || 'Failed to save ticket', type: 'error' });
    } finally {
      btnText.style.display = '';
      spinner.style.display = 'none';
    }
  });

  window.editTicket = (id) => {
    const t = allTickets.find(t => t.id === id);
    if (t) openModal(t);
  };

  window.deleteTicket = async (id) => {
    if (!confirm('Are you sure you want to delete this ticket?')) return;
    try {
      await api.delete(`tickets/${id}`);
      showToast({ message: 'Ticket deleted successfully', type: 'success' });
      await loadTickets();
    } catch(err) {
      showToast({ message: err.message || 'Failed to delete ticket', type: 'error' });
    }
  };

  // Global function so PCs page can open the ticket modal with a pre-selected PC
  window.openTicketForPC = (pcId) => {
    openModal(null, pcId);
  };

  // Check if we navigated here with a PC ID to pre-select
  const pendingPCId = sessionStorage.getItem('c2s_ticket_pc_id');
  if (pendingPCId) {
    sessionStorage.removeItem('c2s_ticket_pc_id');
    // Short delay to let the page fully render
    setTimeout(() => openModal(null, parseInt(pendingPCId)), 300);
  }

  await loadTickets();
}

window.renderTickets = renderTickets;
window.initTickets = initTickets;
