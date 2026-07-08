/* ============================================================
   PC Usage Page
   ============================================================ */

window.renderPcUsage = function () {
  return `
    <div class="page-header" style="margin-bottom:var(--space-xl)">
      <div class="page-header-left">
        <h1 class="page-title">
          <i data-lucide="activity" style="width:28px;height:28px;vertical-align:-4px;margin-right:12px;color:var(--accent-primary)"></i>
          PC Usage Tracking
        </h1>
        <p class="page-subtitle">Track lab PC status, tools usage, and runtime.</p>
      </div>
      <div class="page-header-actions" style="display:flex; gap:10px;">
        <select id="pcUsageTimeFilter" class="form-select" style="min-width: 150px;">
          <option value="daily">Daily (Today)</option>
          <option value="weekly">This Week</option>
          <option value="monthly">This Month</option>
        </select>
        <button class="btn btn-secondary" onclick="initPcUsage()">
          <i data-lucide="refresh-cw" style="width:16px;height:16px"></i> Refresh
        </button>
      </div>
    </div>

    <div class="card">
      <div class="card-body" style="padding:0">
        <div id="pcUsageContainer">
          <div style="padding:var(--space-xl);text-align:center;color:var(--text-muted)">
            <div class="spinner" style="display:inline-block;width:24px;height:24px;margin-bottom:var(--space-sm)"></div>
            <div>Loading PC usage data...</div>
          </div>
        </div>
      </div>
    </div>
  `;
};

window.initPcUsage = async function () {
  if (window.lucide) lucide.createIcons();
  await loadPcUsage();
  
  document.getElementById('pcUsageTimeFilter')?.addEventListener('change', loadPcUsage);
};

async function loadPcUsage() {
  const container = document.getElementById('pcUsageContainer');
  const filter = document.getElementById('pcUsageTimeFilter')?.value || 'daily';
  
  try {
    const res = await api.get(\`pc-usage?filter=\${filter}\`);
    const logs = Array.isArray(res) ? res : (res?.data || []);
    
    renderPcUsageTable(logs, filter);
  } catch (error) {
    console.error('Failed to load PC usage:', error);
    if (container) {
      container.innerHTML = \`<div class="empty-state">
        <div class="empty-state-icon"><i data-lucide="alert-triangle"></i></div>
        <div class="empty-state-title">Error</div>
        <div class="empty-state-description">Failed to load PC usage data. \${error.message || ''}</div>
      </div>\`;
    }
    if (window.lucide) lucide.createIcons();
  }
}

function renderPcUsageTable(logs, filter) {
  const container = document.getElementById('pcUsageContainer');
  if (!container) return;
  const user = getUser();
  const isAdminUser = user && user.role === 'admin';

  if (!logs || logs.length === 0) {
    container.innerHTML = \`
      <div class="empty-state">
        <div class="empty-state-icon"><i data-lucide="monitor-off" style="width:28px;height:28px"></i></div>
        <div class="empty-state-title">No Usage Found</div>
        <div class="empty-state-description">No PC usage logs found for this period.</div>
      </div>
    \`;
    if (window.lucide) lucide.createIcons();
    return;
  }

  // Aggregate logs by PC for weekly/monthly views if needed, 
  // but backend returns individual logs. Let's group them by PC for display.
  const pcMap = {};
  logs.forEach(log => {
    if (!pcMap[log.pc_id]) {
      pcMap[log.pc_id] = {
        pc_id: log.pc_id,
        pc_name: log.pc_name,
        user_name: log.user_name,
        total_minutes_on: 0,
        status: log.status, // take latest status
        tool_used: log.tool_used, // take latest tool
        usage_date: log.usage_date
      };
    }
    pcMap[log.pc_id].total_minutes_on += (log.total_minutes_on || 0);
    // If it's daily, we just show the exact row. For weekly/monthly we aggregated time.
  });

  const displayList = Object.values(pcMap);

  let html = \`
    <div style="overflow-x:auto">
      <table style="width:100%;border-collapse:collapse;text-align:left">
        <thead>
          <tr style="border-bottom:1px solid var(--border-color);background:rgba(255,255,255,0.02)">
            <th style="padding:var(--space-md);font-weight:600;font-size:0.875rem;color:var(--text-secondary)">PC Name</th>
            \${isAdminUser ? \`<th style="padding:var(--space-md);font-weight:600;font-size:0.875rem;color:var(--text-secondary)">Student</th>\` : ''}
            <th style="padding:var(--space-md);font-weight:600;font-size:0.875rem;color:var(--text-secondary)">Status</th>
            <th style="padding:var(--space-md);font-weight:600;font-size:0.875rem;color:var(--text-secondary)">Tool Used</th>
            <th style="padding:var(--space-md);font-weight:600;font-size:0.875rem;color:var(--text-secondary)">Total Runtime (\${filter})</th>
            <th style="padding:var(--space-md);font-weight:600;font-size:0.875rem;color:var(--text-secondary);text-align:right">Actions</th>
          </tr>
        </thead>
        <tbody>
  \`;

  displayList.forEach(pc => {
    const isOn = pc.status === 'on';
    const statusBadge = isOn
      ? \`<span style="display:inline-flex;align-items:center;gap:4px;padding:2px 8px;border-radius:20px;font-size:0.75rem;font-weight:600;background:rgba(0,230,118,0.1);color:var(--success)"><i data-lucide="power" style="width:12px;height:12px"></i> ON</span>\`
      : \`<span style="display:inline-flex;align-items:center;gap:4px;padding:2px 8px;border-radius:20px;font-size:0.75rem;font-weight:600;background:rgba(255,255,255,0.05);color:var(--text-muted)"><i data-lucide="power-off" style="width:12px;height:12px"></i> OFF</span>\`;

    const runtimeHours = Math.floor(pc.total_minutes_on / 60);
    const runtimeMins = pc.total_minutes_on % 60;
    const runtimeStr = \`\${runtimeHours}h \${runtimeMins}m\`;

    html += \`
      <tr style="border-bottom:1px solid var(--border-color);background:rgba(255,255,255,0.01)">
        <td style="padding:var(--space-md);font-weight:500">\${pc.pc_name}</td>
        \${isAdminUser ? \`<td style="padding:var(--space-md);color:var(--text-secondary);font-size:0.875rem">\${pc.user_name || '—'}</td>\` : ''}
        <td style="padding:var(--space-md)">\${statusBadge}</td>
        <td style="padding:var(--space-md)">
          <select id="tool-select-\${pc.pc_id}" class="form-select" style="max-width:150px;font-size:0.8rem;padding:4px;" \${isOn ? 'disabled' : ''}>
            <option value="">Select Tool</option>
            <option value="Cadence Virtuoso" \${pc.tool_used === 'Cadence Virtuoso' ? 'selected' : ''}>Cadence Virtuoso</option>
            <option value="Xcelium" \${pc.tool_used === 'Xcelium' ? 'selected' : ''}>Xcelium</option>
            <option value="Innovus" \${pc.tool_used === 'Innovus' ? 'selected' : ''}>Innovus</option>
            <option value="Synopsys" \${pc.tool_used === 'Synopsys' ? 'selected' : ''}>Synopsys</option>
            <option value="Siemens EDA" \${pc.tool_used === 'Siemens EDA' ? 'selected' : ''}>Siemens EDA</option>
            <option value="Other" \${pc.tool_used === 'Other' ? 'selected' : ''}>Other</option>
          </select>
        </td>
        <td style="padding:var(--space-md);font-family:monospace;color:var(--accent-primary)">\${runtimeStr}</td>
        <td style="padding:var(--space-md);text-align:right">
          \${isOn ? 
            \`<button class="btn btn-sm" style="background:var(--error);color:white;border:none" onclick="togglePcStatus(\${pc.pc_id}, 'off')">Turn OFF</button>\` : 
            \`<button class="btn btn-sm" style="background:var(--success);color:white;border:none" onclick="togglePcStatus(\${pc.pc_id}, 'on')">Turn ON</button>\`
          }
        </td>
      </tr>
    \`;
  });

  html += \`</tbody></table></div>\`;
  container.innerHTML = html;
  if (window.lucide) lucide.createIcons();
}

window.togglePcStatus = async function(pcId, newStatus) {
  const toolSelect = document.getElementById(\`tool-select-\${pcId}\`);
  const tool = toolSelect ? toolSelect.value : null;

  if (newStatus === 'on' && !tool) {
    showToast({ message: 'Please select a tool before turning on the PC.', type: 'warning' });
    return;
  }

  try {
    await api.post('pc-usage/toggle', { pc_id: pcId, status: newStatus, tool_used: tool });
    showToast({ message: \`PC turned \${newStatus.toUpperCase()} successfully\`, type: 'success' });
    await loadPcUsage();
  } catch (error) {
    showToast({ message: error.message || 'Failed to toggle PC', type: 'error' });
  }
};
