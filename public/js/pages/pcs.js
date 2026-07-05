/* ============================================================
   C2S VLSI Lab Portal — PCs & Assets Page
   Manage lab workstations, assign to students (3-4 per student)
   Schema: pcs(id, pc_name, specs JSON, installed_software JSON, condition, notes)
   ============================================================ */

function renderPCs() {
  const user = getUser();
  const isAdminUser = user && user.role === 'admin';

  return `
    <div class="page-enter">
      <div class="page-header">
        <div class="page-header-left">
          <h1 class="page-title animate-slideUp">
            <i data-lucide="monitor" style="width:28px;height:28px;vertical-align:-4px;margin-right:10px;color:var(--success)"></i>
            PCs &amp; Assets
          </h1>
          <p class="page-subtitle animate-slideUp stagger-1">
            ${isAdminUser ? 'Manage lab workstations and assignments' : 'Your assigned lab workstations'}
          </p>
        </div>
        <div class="page-header-actions animate-slideUp stagger-2">
          ${isAdminUser ? `
          <button class="btn btn-secondary" id="assignPCBtn">
            <i data-lucide="user-plus" style="width:16px;height:16px"></i>
            Assign PC
          </button>
          <button class="btn btn-primary" id="newPCBtn">
            <i data-lucide="plus" style="width:16px;height:16px"></i>
            Add PC
          </button>
          ` : ''}
        </div>
      </div>

      <!-- Stats (admin only) -->
      ${isAdminUser ? `
      <div class="grid grid-stats" style="margin-bottom:var(--space-lg)">
        <div class="stat-card animate-slideUp stagger-1">
          <div class="stat-card-icon green"><i data-lucide="monitor" style="width:22px;height:22px"></i></div>
          <div class="stat-card-value" id="pcTotal">—</div>
          <div class="stat-card-label">Total PCs</div>
        </div>
        <div class="stat-card animate-slideUp stagger-2">
          <div class="stat-card-icon blue"><i data-lucide="check-circle" style="width:22px;height:22px"></i></div>
          <div class="stat-card-value" id="pcAssigned">—</div>
          <div class="stat-card-label">Assigned</div>
        </div>
        <div class="stat-card animate-slideUp stagger-3">
          <div class="stat-card-icon orange"><i data-lucide="inbox" style="width:22px;height:22px"></i></div>
          <div class="stat-card-value" id="pcFree">—</div>
          <div class="stat-card-label">Unassigned</div>
        </div>
        <div class="stat-card animate-slideUp stagger-4">
          <div class="stat-card-icon red"><i data-lucide="alert-triangle" style="width:22px;height:22px"></i></div>
          <div class="stat-card-value" id="pcNeedsRepair">—</div>
          <div class="stat-card-label">Needs Repair</div>
        </div>
      </div>
      ` : ''}

      <!-- Filters (admin only) -->
      ${isAdminUser ? `
      <div class="card animate-slideUp stagger-2" style="margin-bottom:var(--space-lg)">
        <div class="card-body" style="padding:var(--space-md)">
          <div class="grid grid-3" style="gap:var(--space-md)">
            <div class="search-input">
              <i data-lucide="search" class="search-icon"></i>
              <input type="text" id="pcSearch" placeholder="Search by name, specs..." />
            </div>
            <select class="form-select" id="pcConditionFilter">
              <option value="">All Conditions</option>
              <option value="excellent">Excellent</option>
              <option value="good">Good</option>
              <option value="fair">Fair</option>
              <option value="needs_repair">Needs Repair</option>
            </select>
            <select class="form-select" id="pcAssignFilter">
              <option value="">All PCs</option>
              <option value="assigned">Assigned</option>
              <option value="unassigned">Unassigned</option>
            </select>
          </div>
        </div>
      </div>
      ` : ''}

      <!-- PC Grid -->
      <div id="pcsContainer">
        <div class="grid grid-auto-fit" style="gap:var(--space-lg)">
          ${[1,2,3,4].map(() => `
            <div class="card">
              <div class="card-body">
                <div class="skeleton skeleton-heading" style="width:60%;margin-bottom:12px"></div>
                <div class="skeleton skeleton-text" style="width:80%"></div>
                <div class="skeleton skeleton-text" style="width:55%;margin-top:8px"></div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>

    <!-- Add/Edit PC Modal (Admin) -->
    <div class="modal-overlay" id="pcModalOverlay" style="display:none">
      <div class="modal" style="max-width:580px">
        <div class="modal-header">
          <h3 class="modal-title" id="pcModalTitle">Add PC</h3>
          <button class="modal-close" id="pcModalClose">
            <i data-lucide="x" style="width:20px;height:20px"></i>
          </button>
        </div>
        <div class="modal-body">
          <form id="pcForm">
            <div class="grid grid-2" style="gap:var(--space-md)">
              <div class="form-group" style="grid-column:1/-1">
                <label class="form-label">PC Name / Hostname *</label>
                <input type="text" class="form-input" id="pcName" placeholder="e.g. VLSI-WS-01" required />
              </div>
              <div class="form-group" style="grid-column:1/-1">
                <label class="form-label">Specs (CPU, RAM, OS, etc.)</label>
                <input type="text" class="form-input" id="pcSpecs" placeholder="e.g. Intel i7, 32GB RAM, Ubuntu 22.04" />
              </div>
              <div class="form-group" style="grid-column:1/-1">
                <label class="form-label">Installed Software (comma separated)</label>
                <input type="text" class="form-input" id="pcSoftware" placeholder="e.g. Cadence Virtuoso, HSPICE, Vivado" />
              </div>
              <div class="form-group">
                <label class="form-label">Condition</label>
                <select class="form-select" id="pcCondition">
                  <option value="good">Good</option>
                  <option value="excellent">Excellent</option>
                  <option value="fair">Fair</option>
                  <option value="needs_repair">Needs Repair</option>
                </select>
              </div>
              <div class="form-group" style="grid-column:1/-1">
                <label class="form-label">Notes</label>
                <textarea class="form-textarea" id="pcNotes" rows="2" placeholder="Maintenance history, known issues..."></textarea>
              </div>
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" id="pcModalCancel">Cancel</button>
          <button class="btn btn-primary" id="pcSubmitBtn">
            <span id="pcSubmitText">Add PC</span>
            <div class="spinner" id="pcSubmitSpinner" style="display:none"></div>
          </button>
        </div>
      </div>
    </div>

    <!-- Assign PC Modal (Admin) -->
    <div class="modal-overlay" id="assignPCModalOverlay" style="display:none">
      <div class="modal" style="max-width:500px">
        <div class="modal-header">
          <h3 class="modal-title">Assign PC to Student</h3>
          <button class="modal-close" id="assignPCModalClose">
            <i data-lucide="x" style="width:20px;height:20px"></i>
          </button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">Select PC *</label>
            <select class="form-select" id="assignPCSelect">
              <option value="">— Select PC —</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Assign To (Student) *</label>
            <select class="form-select" id="assignStudentSelect">
              <option value="">— Select Student —</option>
            </select>
          </div>
          <div id="studentPCCountInfo" style="margin-top:var(--space-sm);font-size:0.8125rem;color:var(--text-muted)"></div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" id="assignPCCancel">Cancel</button>
          <button class="btn btn-primary" id="assignPCSubmit">
            <span id="assignPCText">Assign PC</span>
            <div class="spinner" id="assignPCSpinner" style="display:none"></div>
          </button>
        </div>
      </div>
    </div>
  `;
}

async function initPCs() {
  const user = getUser();
  const isAdminUser = user && user.role === 'admin';
  let allPCs = [];
  let allStudents = [];
  let editingPCId = null;

  const conditionConfig = {
    excellent: { label:'Excellent', color:'var(--success)',         bg:'rgba(0,230,118,0.1)'  },
    good:      { label:'Good',      color:'var(--info)',            bg:'rgba(64,196,255,0.1)' },
    fair:      { label:'Fair',      color:'var(--warning)',         bg:'rgba(255,171,64,0.1)' },
    needs_repair: { label:'Needs Repair', color:'var(--error)',    bg:'rgba(255,82,82,0.1)'  },
  };

  // Load students (admin)
  if (isAdminUser) {
    try {
      const res = await api.get('users?role=student');
      allStudents = Array.isArray(res) ? res : (res?.data || []);
    } catch(e) {}
  }

  async function loadPCs() {
    try {
      const endpoint = isAdminUser ? 'pcs' : 'pcs/my';
      const res = await api.get(endpoint);
      const raw = Array.isArray(res) ? res : (res?.data || []);
      allPCs = raw;
      if (isAdminUser) updateStats(raw);
      applyFilters();
    } catch(e) {
      renderPCGrid([]);
    }
  }

  function updateStats(pcs) {
    const total = pcs.length;
    const assigned = pcs.filter(p => p.current_assignment).length;
    const free = total - assigned;
    const repair = pcs.filter(p => p.condition === 'needs_repair').length;
    document.getElementById('pcTotal').textContent = total;
    document.getElementById('pcAssigned').textContent = assigned;
    document.getElementById('pcFree').textContent = free;
    document.getElementById('pcNeedsRepair').textContent = repair;
  }

  function parseJSON(val, fallback = []) {
    try { return JSON.parse(val || JSON.stringify(fallback)); }
    catch { return fallback; }
  }

  function renderPCGrid(pcs) {
    const container = document.getElementById('pcsContainer');
    if (!container) return;

    if (!pcs || pcs.length === 0) {
      container.innerHTML = `
        <div class="card"><div class="card-body">
          <div class="empty-state">
            <div class="empty-state-icon"><i data-lucide="monitor" style="width:28px;height:28px"></i></div>
            <div class="empty-state-title">No PCs found</div>
            <div class="empty-state-description">${isAdminUser ? 'Add the first PC to get started.' : 'No PCs have been assigned to you yet.'}</div>
          </div>
        </div></div>
      `;
      if (window.lucide) lucide.createIcons();
      return;
    }

    // For student view (pcs/my returns pc_assignments joined with pcs)
    container.innerHTML = `
      <div class="grid grid-auto-fit" style="gap:var(--space-lg)">
        ${pcs.map(pc => {
          const cond = conditionConfig[pc.condition] || conditionConfig.good;
          
          let assignee = null;
          if (isAdminUser) {
            assignee = pc.current_assignment;
          } else {
            // For students, any PC returned by the API is assigned to them
            assignee = {
              user_name: user.name,
              assigned_date: pc.assigned_at || new Date().toISOString()
            };
          }
          
          const software = parseJSON(pc.installed_software, []);
          const specsObj = parseJSON(pc.specs, {});
          const specsStr = typeof specsObj === 'string' ? specsObj : Object.entries(specsObj).map(([k,v]) => `${k}: ${v}`).join(', ');
          const pcName = pc.pc_name || pc.name || 'PC';

          return `
            <div class="card" style="transition:transform 0.2s,box-shadow 0.2s">
              <div class="card-body">
                <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:var(--space-md)">
                  <div style="width:46px;height:46px;border-radius:var(--border-radius);background:rgba(0,230,118,0.08);border:1px solid rgba(0,230,118,0.2);display:flex;align-items:center;justify-content:center;flex-shrink:0">
                    <i data-lucide="monitor" style="width:22px;height:22px;color:var(--success)"></i>
                  </div>
                  <div style="display:flex;align-items:center;gap:4px">
                    <span style="display:inline-flex;align-items:center;gap:4px;padding:3px 10px;border-radius:20px;font-size:0.72rem;font-weight:600;background:${cond.bg};color:${cond.color}">${cond.label}</span>
                    ${isAdminUser ? `
                    <button class="btn btn-ghost btn-sm" onclick="editPC(${pc.id})" title="Edit">
                      <i data-lucide="pencil" style="width:13px;height:13px"></i>
                    </button>
                    <button class="btn btn-ghost btn-sm" onclick="deletePC(${pc.id})" style="color:var(--error)" title="Delete">
                      <i data-lucide="trash-2" style="width:13px;height:13px"></i>
                    </button>` : ''}
                  </div>
                </div>

                <h4 style="margin:0 0 var(--space-sm);font-size:1rem">${pcName}</h4>

                ${specsStr ? `<div style="font-size:0.8rem;color:var(--text-muted);margin-bottom:var(--space-sm)"><i data-lucide="cpu" style="width:12px;height:12px;vertical-align:-2px;margin-right:4px"></i>${specsStr}</div>` : ''}

                ${software.length > 0 ? `
                <div class="grid" style="grid-template-columns:repeat(auto-fill, minmax(80px, 1fr)); gap:4px; margin-bottom:var(--space-sm)">
                  ${software.map(s => `<span class="tag" style="font-size:0.7rem;padding:2px 7px;text-align:center">${s}</span>`).join('')}
                </div>` : ''}

                ${assignee ? `
                <div style="display:flex;align-items:center;gap:8px;padding:var(--space-sm);background:rgba(64,196,255,0.06);border-radius:var(--border-radius-sm);border:1px solid rgba(64,196,255,0.15);margin-top:var(--space-sm)">
                  <div class="avatar avatar-sm" style="width:26px;height:26px;font-size:0.65rem">${(assignee.user_name||'?').split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2)}</div>
                  <div>
                    <div style="font-size:0.8125rem;font-weight:500;color:var(--info)">${assignee.user_name || 'Unknown'}</div>
                    <div style="font-size:0.72rem;color:var(--text-muted)">Since ${new Date(assignee.assigned_date).toLocaleDateString('en-US', {month:'short',day:'numeric',year:'numeric'})}</div>
                  </div>
                  ${isAdminUser ? `
                  <button class="btn btn-ghost btn-sm" style="margin-left:auto;color:var(--error)" onclick="unassignPC(${pc.id})" title="Unassign">
                    <i data-lucide="user-x" style="width:13px;height:13px"></i>
                  </button>` : ''}
                </div>` : `
                <div style="font-size:0.8rem;color:var(--text-muted);margin-top:var(--space-sm);font-style:italic">Unassigned</div>`}

                ${pc.notes ? `<div style="margin-top:var(--space-md);padding:var(--space-sm);background:rgba(255,255,255,0.03);border-radius:var(--border-radius-sm);border:1px solid var(--border-color);font-size:0.78rem;color:var(--text-muted);line-height:1.5">${pc.notes}</div>` : ''}

                ${!isAdminUser ? `
                <div style="margin-top:var(--space-md)">
                  <button class="btn btn-secondary btn-sm" onclick="navigate('/tickets')" style="width:100%">
                    <i data-lucide="ticket" style="width:14px;height:14px"></i>
                    Report Issue
                  </button>
                </div>` : ''}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
    if (window.lucide) lucide.createIcons();
  }

  function applyFilters() {
    if (!isAdminUser) { renderPCGrid(allPCs); return; }
    const search = document.getElementById('pcSearch')?.value.toLowerCase() || '';
    const condFilter = document.getElementById('pcConditionFilter')?.value || '';
    const assignFilter = document.getElementById('pcAssignFilter')?.value || '';

    const filtered = allPCs.filter(pc => {
      const specsStr = JSON.stringify(pc.specs || '');
      const softwareStr = JSON.stringify(pc.installed_software || '');
      const matchSearch = !search || (pc.pc_name||'').toLowerCase().includes(search) || specsStr.toLowerCase().includes(search) || softwareStr.toLowerCase().includes(search);
      const matchCond = !condFilter || pc.condition === condFilter;
      const matchAssign = !assignFilter || (assignFilter === 'assigned' ? !!pc.current_assignment : !pc.current_assignment);
      return matchSearch && matchCond && matchAssign;
    });
    renderPCGrid(filtered);
  }

  if (isAdminUser) {
    ['pcSearch','pcConditionFilter','pcAssignFilter'].forEach(id => {
      document.getElementById(id)?.addEventListener('input', applyFilters);
    });
  }

  // ── Add/Edit PC Modal ──
  const overlay = document.getElementById('pcModalOverlay');

  function openModal(pc = null) {
    editingPCId = pc ? pc.id : null;
    document.getElementById('pcModalTitle').textContent = pc ? 'Edit PC' : 'Add PC';
    document.getElementById('pcName').value = pc?.pc_name || '';
    // Parse specs
    const specsObj = pc ? (() => { try { return JSON.parse(pc.specs || '{}'); } catch { return {}; }})() : {};
    document.getElementById('pcSpecs').value = typeof specsObj === 'string' ? specsObj : Object.entries(specsObj).map(([k,v])=>`${k}: ${v}`).join(', ');
    // Parse software
    const sw = pc ? (() => { try { return JSON.parse(pc.installed_software || '[]'); } catch { return []; }})() : [];
    document.getElementById('pcSoftware').value = sw.join(', ');
    document.getElementById('pcCondition').value = pc?.condition || 'good';
    document.getElementById('pcNotes').value = pc?.notes || '';
    document.getElementById('pcSubmitText').textContent = pc ? 'Update PC' : 'Add PC';
    overlay.style.display = 'flex';
  }

  function closeModal() { overlay.style.display = 'none'; editingPCId = null; }

  document.getElementById('newPCBtn')?.addEventListener('click', () => openModal());
  document.getElementById('pcModalClose')?.addEventListener('click', closeModal);
  document.getElementById('pcModalCancel')?.addEventListener('click', closeModal);
  overlay?.addEventListener('click', e => { if (e.target === overlay) closeModal(); });

  document.getElementById('pcSubmitBtn')?.addEventListener('click', async () => {
    const pc_name = document.getElementById('pcName').value.trim();
    if (!pc_name) { showToast({ message: 'PC name is required', type: 'warning' }); return; }

    const specsRaw = document.getElementById('pcSpecs').value.trim();
    const swRaw = document.getElementById('pcSoftware').value;
    const installed_software = swRaw ? swRaw.split(',').map(s => s.trim()).filter(Boolean) : [];

    const payload = {
      pc_name,
      specs: specsRaw ? { description: specsRaw } : {},
      installed_software,
      condition: document.getElementById('pcCondition').value,
      notes: document.getElementById('pcNotes').value.trim() || null,
    };

    const btnText = document.getElementById('pcSubmitText');
    const spinner = document.getElementById('pcSubmitSpinner');
    btnText.style.display = 'none'; spinner.style.display = 'inline-block';

    try {
      if (editingPCId) {
        await api.put(`pcs/${editingPCId}`, payload);
        showToast({ message: 'PC updated!', type: 'success' });
      } else {
        await api.post('pcs', payload);
        showToast({ message: 'PC added!', type: 'success' });
      }
      closeModal();
      await loadPCs();
    } catch(err) {
      showToast({ message: err.message || 'Failed to save PC', type: 'error' });
    } finally {
      btnText.style.display = ''; spinner.style.display = 'none';
    }
  });

  // ── Assign PC Modal ──
  const assignOverlay = document.getElementById('assignPCModalOverlay');

  async function openAssignModal() {
    // Populate PC dropdown (unassigned PCs)
    const pcSel = document.getElementById('assignPCSelect');
    if (pcSel) {
      pcSel.innerHTML = '<option value="">— Select PC —</option>';
      allPCs.filter(p => !p.current_assignment).forEach(p => {
        const opt = document.createElement('option');
        opt.value = p.id;
        opt.textContent = p.pc_name;
        pcSel.appendChild(opt);
      });
    }
    // Populate student dropdown
    const stuSel = document.getElementById('assignStudentSelect');
    if (stuSel) {
      stuSel.innerHTML = '<option value="">— Select Student —</option>';
      allStudents.forEach(u => {
        const assignedCount = allPCs.filter(p => p.current_assignment?.user_id === u.id).length;
        const opt = document.createElement('option');
        opt.value = u.id;
        opt.textContent = `${u.name} (${assignedCount} PC${assignedCount !== 1 ? 's' : ''})`;
        stuSel.appendChild(opt);
      });
    }
    assignOverlay.style.display = 'flex';
  }

  // Update student PC count info
  document.getElementById('assignStudentSelect')?.addEventListener('change', function() {
    const sid = parseInt(this.value);
    if (!sid) { document.getElementById('studentPCCountInfo').textContent = ''; return; }
    const count = allPCs.filter(p => p.current_assignment?.user_id === sid).length;
    const info = document.getElementById('studentPCCountInfo');
    info.textContent = `This student currently has ${count} PC(s) assigned.`;
    info.style.color = count >= 4 ? 'var(--warning)' : 'var(--text-muted)';
  });

  document.getElementById('assignPCBtn')?.addEventListener('click', openAssignModal);
  document.getElementById('assignPCModalClose')?.addEventListener('click', () => assignOverlay.style.display = 'none');
  document.getElementById('assignPCCancel')?.addEventListener('click', () => assignOverlay.style.display = 'none');
  assignOverlay?.addEventListener('click', e => { if (e.target === assignOverlay) assignOverlay.style.display = 'none'; });

  document.getElementById('assignPCSubmit')?.addEventListener('click', async () => {
    const pcId = document.getElementById('assignPCSelect').value;
    const userId = document.getElementById('assignStudentSelect').value;
    if (!pcId || !userId) { showToast({ message: 'Select a PC and a student', type: 'warning' }); return; }

    const btnText = document.getElementById('assignPCText');
    const spinner = document.getElementById('assignPCSpinner');
    btnText.style.display = 'none'; spinner.style.display = 'inline-block';

    try {
      await api.post(`pcs/${pcId}/assign`, { user_id: parseInt(userId) });
      showToast({ message: 'PC assigned successfully!', type: 'success' });
      assignOverlay.style.display = 'none';
      await loadPCs();
    } catch(err) {
      showToast({ message: err.message || 'Failed to assign PC', type: 'error' });
    } finally {
      btnText.style.display = ''; spinner.style.display = 'none';
    }
  });

  // Globals
  window.editPC = (id) => { const pc = allPCs.find(p => p.id === id); if (pc) openModal(pc); };

  window.deletePC = async (id) => {
    if (!confirm('Remove this PC from the system?')) return;
    try {
      await api.delete(`pcs/${id}`);
      showToast({ message: 'PC removed', type: 'success' });
      await loadPCs();
    } catch(err) { showToast({ message: err.message || 'Failed to remove PC', type: 'error' }); }
  };

  window.unassignPC = async (pcId) => {
    if (!confirm('Unassign this PC?')) return;
    try {
      await api.post(`pcs/${pcId}/unassign`, {});
      showToast({ message: 'PC unassigned', type: 'success' });
      await loadPCs();
    } catch(err) { showToast({ message: err.message || 'Failed to unassign', type: 'error' }); }
  };

  await loadPCs();
}

window.renderPCs = renderPCs;
window.initPCs = initPCs;
