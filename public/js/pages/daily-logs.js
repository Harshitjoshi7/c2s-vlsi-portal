/* ============================================================
   C2S VLSI Lab Portal — Daily Logs Page
   View, submit and manage daily work logs
   ============================================================ */

function renderDailyLogs() {
  const user = getUser();
  const isAdminUser = user && user.role === 'admin';

  return `
    <div class="page-enter">
      <div class="page-header">
        <div class="page-header-left">
          <h1 class="page-title animate-slideUp">
            <i data-lucide="notebook-pen" style="width:28px;height:28px;vertical-align:-4px;margin-right:10px;color:var(--accent-primary)"></i>
            Daily Logs
          </h1>
          <p class="page-subtitle animate-slideUp stagger-1">Track your daily work and progress</p>
        </div>
        <div class="page-header-actions animate-slideUp stagger-2">
          ${!isAdminUser ? `
          <button class="btn btn-primary" id="newLogBtn">
            <i data-lucide="plus" style="width:16px;height:16px"></i>
            Log Today's Work
          </button>
          ` : ''}
        </div>
      </div>

      <!-- Filters -->
      <div class="card animate-slideUp stagger-2" style="margin-bottom:var(--space-lg)">
        <div class="card-body" style="padding:var(--space-md)">
          <div style="display:flex;gap:var(--space-md);flex-wrap:wrap;align-items:center">
            <div class="search-input" style="flex:1;min-width:200px">
              <i data-lucide="search" class="search-icon"></i>
              <input type="text" id="logSearch" placeholder="Search logs..." />
            </div>
            ${isAdminUser ? `
            <select class="form-select" id="logUserFilter" style="width:auto;min-width:160px">
              <option value="">All Students</option>
            </select>
            ` : ''}
            <select class="form-select" id="logStatusFilter" style="width:auto">
              <option value="">All Status</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="blocked">Blocked</option>
            </select>
            <input type="date" class="form-input" id="logDateFilter" style="width:auto" />
          </div>
        </div>
      </div>

      <!-- Views -->
      <div class="grid grid-dashboard">
        
        <!-- Logs List -->
        <div id="logsContainer">
          <div class="grid grid-2" style="gap:var(--space-md)">
            ${[1,2,3].map(() => `
              <div class="card">
                <div class="card-body">
                  <div class="skeleton skeleton-text" style="width:40%;margin-bottom:8px"></div>
                  <div class="skeleton skeleton-text" style="width:80%"></div>
                  <div class="skeleton skeleton-text" style="width:65%"></div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Calendar View -->
        <div>
          <div id="logsCalendarContainer"></div>
        </div>
      </div>
    </div>

    <!-- New Log Modal -->
    <div class="modal-overlay" id="logModalOverlay" style="display:none">
      <div class="modal" style="max-width:600px">
        <div class="modal-header">
          <h3 class="modal-title" id="logModalTitle">Log Today's Work</h3>
          <button class="modal-close" id="logModalClose">
            <i data-lucide="x" style="width:20px;height:20px"></i>
          </button>
        </div>
        <div class="modal-body">
          <form id="logForm">
            <div class="form-group">
              <label class="form-label">Date</label>
              <input type="date" class="form-input" id="logDate" required />
            </div>
            <div class="form-group">
              <label class="form-label">Work Description</label>
              <textarea class="form-textarea" id="logDescription" rows="4" placeholder="Describe what you worked on today..." required style="min-height:120px"></textarea>
            </div>
            <div class="grid grid-dashboard" style="gap:var(--space-lg)">
              <div class="form-group">
                <label class="form-label">Category</label>
                <select class="form-select" id="logCategory">
                  <option value="">Select category</option>
                  <option value="design">Design</option>
                  <option value="simulation">Simulation</option>
                  <option value="layout">Layout</option>
                  <option value="verification">Verification</option>
                  <option value="research">Research</option>
                  <option value="documentation">Documentation</option>
                  <option value="meeting">Meeting</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Status</label>
                <select class="form-select" id="logStatus" required>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="blocked">Blocked</option>
                </select>
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Tools Used (comma separated)</label>
              <input type="text" class="form-input" id="logTools" placeholder="e.g. Cadence Virtuoso, HSPICE, Vivado" />
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" id="logModalCancel">Cancel</button>
          <button class="btn btn-primary" id="logSubmitBtn">
            <span id="logSubmitText">Submit Log</span>
            <div class="spinner" id="logSubmitSpinner" style="display:none"></div>
          </button>
        </div>
      </div>
    </div>
  `;
}

async function initDailyLogs() {
  const user = getUser();
  const isAdminUser = user && user.role === 'admin';
  let allLogs = [];
  let editingLogId = null;
  let currentCalMonth = new Date().getMonth();
  let currentCalYear = new Date().getFullYear();

  // Set default date to today
  const dateInput = document.getElementById('logDate');
  if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];

  // Load users for admin filter
  if (isAdminUser) {
    try {
      const res = await api.get('users?role=student');
      const users = Array.isArray(res) ? res : (res?.data || []);
      const sel = document.getElementById('logUserFilter');
      if (sel) {
        users.forEach(u => {
          const opt = document.createElement('option');
          opt.value = u.id;
          opt.textContent = u.name;
          sel.appendChild(opt);
        });
      }
    } catch(e) {}
  }

  // Load logs
  async function loadLogs() {
    try {
      const endpoint = isAdminUser ? 'daily-logs' : 'daily-logs/my';
      const res = await api.get(endpoint);
      allLogs = Array.isArray(res) ? res : (res?.data || []);
      renderLogs(allLogs);
      updateCalendar();
    } catch(e) {
      document.getElementById('logsContainer').innerHTML = `
        <div class="card"><div class="card-body">
          <div class="empty-state">
            <div class="empty-state-icon"><i data-lucide="inbox" style="width:28px;height:28px"></i></div>
            <div class="empty-state-title">No logs yet</div>
            <div class="empty-state-description">Start logging your daily work to track progress.</div>
          </div>
        </div></div>
      `;
      if (window.lucide) lucide.createIcons();
    }
  }

  function renderLogs(logs) {
    const container = document.getElementById('logsContainer');
    if (!container) return;

    if (!logs || logs.length === 0) {
      container.innerHTML = `
        <div class="card"><div class="card-body">
          <div class="empty-state">
            <div class="empty-state-icon"><i data-lucide="notebook-pen" style="width:28px;height:28px"></i></div>
            <div class="empty-state-title">No logs found</div>
            <div class="empty-state-description">No work logs match your current filters.</div>
          </div>
        </div></div>
      `;
      if (window.lucide) lucide.createIcons();
      return;
    }

    container.innerHTML = `
      <div style="display:flex;flex-direction:column;gap:var(--space-md)">
        ${logs.map(log => {
          const statusColor = log.status === 'completed' ? 'var(--success)' : log.status === 'blocked' ? 'var(--error)' : 'var(--warning)';
          const statusBg = log.status === 'completed' ? 'rgba(0,230,118,0.1)' : log.status === 'blocked' ? 'rgba(255,82,82,0.1)' : 'rgba(255,171,64,0.1)';
          const tools = (() => { try { return JSON.parse(log.tools_used || '[]'); } catch { return []; } })();
          const date = new Date(log.log_date || log.date);
          const dateStr = date.toLocaleDateString('en-US', { weekday:'short', month:'short', day:'numeric', year:'numeric' });

          return `
            <div class="card log-card" style="transition:all 0.2s">
              <div class="card-body">
                <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:var(--space-md);margin-bottom:var(--space-md)">
                  <div style="flex:1">
                    <div style="display:flex;align-items:center;gap:var(--space-sm);flex-wrap:wrap;margin-bottom:6px">
                      <span style="font-size:0.8125rem;color:var(--text-muted)">${dateStr}</span>
                      ${log.category ? `<span class="badge badge-info">${log.category}</span>` : ''}
                      <span style="padding:3px 10px;border-radius:20px;font-size:0.75rem;font-weight:600;background:${statusBg};color:${statusColor}">${log.status?.replace('_',' ') || 'in progress'}</span>
                    </div>
                    ${isAdminUser && log.user_name ? `<div style="font-size:0.8125rem;color:var(--accent-primary);margin-bottom:6px">👤 ${log.user_name}</div>` : ''}
                  </div>
                  ${!isAdminUser ? `
                  <div style="display:flex;gap:var(--space-xs)">
                    <button class="btn btn-ghost btn-sm" onclick="editLog(${log.id})" title="Edit">
                      <i data-lucide="pencil" style="width:15px;height:15px"></i>
                    </button>
                    <button class="btn btn-ghost btn-sm" onclick="deleteLog(${log.id})" style="color:var(--error)" title="Delete">
                      <i data-lucide="trash-2" style="width:15px;height:15px"></i>
                    </button>
                  </div>
                  ` : ''}
                </div>
                <p style="color:var(--text-secondary);font-size:0.9rem;margin:0;line-height:1.7">${log.work_description || ''}</p>
                ${tools.length > 0 ? `
                <div style="display:flex;flex-wrap:wrap;gap:var(--space-xs);margin-top:var(--space-md)">
                  ${tools.map(t => `<span class="tag"><i data-lucide="terminal" style="width:12px;height:12px"></i>${t}</span>`).join('')}
                </div>
                ` : ''}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
    if (window.lucide) lucide.createIcons();
  }

  // Filters
  function applyFilters() {
    const search = document.getElementById('logSearch')?.value.toLowerCase() || '';
    const statusFilter = document.getElementById('logStatusFilter')?.value || '';
    const dateFilter = document.getElementById('logDateFilter')?.value || '';
    const userFilter = document.getElementById('logUserFilter')?.value || '';

    let filtered = allLogs.filter(log => {
      const desc = (log.work_description || '').toLowerCase();
      const matchSearch = !search || desc.includes(search);
      const matchStatus = !statusFilter || log.status === statusFilter;
      const matchDate = !dateFilter || (log.log_date || '').startsWith(dateFilter);
      const matchUser = !userFilter || String(log.user_id) === userFilter;
      return matchSearch && matchStatus && matchDate && matchUser;
    });
    renderLogs(filtered);
  }

  function updateCalendar() {
    const calContainer = document.getElementById('logsCalendarContainer');
    if (!calContainer || !window.renderCalendar) return;

    // Convert logs to calendar data format
    const calData = {};
    allLogs.forEach(log => {
      const dateStr = log.log_date || log.date;
      if (dateStr) {
        calData[dateStr] = {
          status: log.status,
          color: log.status === 'completed' ? 'var(--success)' : log.status === 'blocked' ? 'var(--error)' : 'var(--warning)'
        };
      }
    });

    calContainer.innerHTML = window.renderCalendar({
      month: currentCalMonth,
      year: currentCalYear,
      data: calData,
      id: 'dailyLogsCalendar'
    });

    window.initCalendar({
      id: 'dailyLogsCalendar',
      data: calData,
      onDateClick: (dateStr) => {
        const dateInput = document.getElementById('logDateFilter');
        if (dateInput) {
          dateInput.value = dateInput.value === dateStr ? '' : dateStr;
          applyFilters();
        }
      },
      onMonthChange: (m, y) => {
        currentCalMonth = m;
        currentCalYear = y;
        updateCalendar();
      }
    });
  }

  ['logSearch','logStatusFilter','logDateFilter','logUserFilter'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', applyFilters);
  });

  // Modal
  const overlay = document.getElementById('logModalOverlay');
  const closeBtn = document.getElementById('logModalClose');
  const cancelBtn = document.getElementById('logModalCancel');
  const submitBtn = document.getElementById('logSubmitBtn');
  const newLogBtn = document.getElementById('newLogBtn');

  function openModal(log = null) {
    editingLogId = log ? log.id : null;
    document.getElementById('logModalTitle').textContent = log ? 'Edit Log' : "Log Today's Work";
    document.getElementById('logDate').value = log ? (log.log_date || '') : new Date().toISOString().split('T')[0];
    document.getElementById('logDescription').value = log ? (log.work_description || '') : '';
    document.getElementById('logCategory').value = log ? (log.category || '') : '';
    document.getElementById('logStatus').value = log ? (log.status || 'in_progress') : 'in_progress';
    const tools = (() => { try { return JSON.parse(log?.tools_used || '[]'); } catch { return []; } })();
    document.getElementById('logTools').value = tools.join(', ');
    document.getElementById('logSubmitText').textContent = log ? 'Update Log' : 'Submit Log';
    overlay.style.display = 'flex';
    setTimeout(() => overlay.querySelector('.modal')?.classList.add('modal-open'), 10);
  }

  function closeModal() {
    overlay.style.display = 'none';
    editingLogId = null;
  }

  if (newLogBtn) newLogBtn.addEventListener('click', () => openModal());
  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
  overlay?.addEventListener('click', e => { if (e.target === overlay) closeModal(); });

  // Submit
  if (submitBtn) {
    submitBtn.addEventListener('click', async () => {
      const description = document.getElementById('logDescription').value.trim();
      const date = document.getElementById('logDate').value;
      const status = document.getElementById('logStatus').value;
      if (!description || !date) { showToast({ message: 'Please fill required fields', type: 'warning' }); return; }

      const toolsRaw = document.getElementById('logTools').value;
      const tools = toolsRaw ? toolsRaw.split(',').map(t => t.trim()).filter(Boolean) : [];

      const payload = {
        log_date: date,
        work_description: description,
        category: document.getElementById('logCategory').value || null,
        status,
        tools_used: JSON.stringify(tools)
      };

      document.getElementById('logSubmitText').style.display = 'none';
      document.getElementById('logSubmitSpinner').style.display = 'inline-block';
      submitBtn.disabled = true;

      try {
        if (editingLogId) {
          await api.put(`daily-logs/${editingLogId}`, payload);
          showToast({ message: 'Log updated!', type: 'success' });
        } else {
          await api.post('daily-logs', payload);
          showToast({ message: 'Log saved successfully!', type: 'success' });
        }
        closeModal();
        await loadLogs();
        updateCalendar();
      } catch(err) {
        showToast({ message: err.message || 'Failed to save log', type: 'error' });
      } finally {
        document.getElementById('logSubmitText').style.display = '';
        document.getElementById('logSubmitSpinner').style.display = 'none';
        submitBtn.disabled = false;
      }
    });
  }

  // Edit/Delete exposed globally
  window.editLog = async (id) => {
    const log = allLogs.find(l => l.id === id);
    if (log) openModal(log);
  };

  window.deleteLog = async (id) => {
    if (!confirm('Delete this log entry?')) return;
    try {
      await api.delete(`daily-logs/${id}`);
      showToast({ message: 'Log deleted.', type: 'success' });
      await loadLogs();
      updateCalendar();
    } catch(err) {
      showToast({ message: err.message || 'Failed to delete', type: 'error' });
    }
  };

  await loadLogs();
  updateCalendar();
}

window.renderDailyLogs = renderDailyLogs;
window.initDailyLogs = initDailyLogs;
