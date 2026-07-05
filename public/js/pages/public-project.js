function renderPublicProject() {
  return `
    <div style="min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; background: var(--bg-body); padding: var(--space-xl);">
      <div class="card animate-slideUp" style="max-width: 600px; width: 100%; box-shadow: var(--shadow-lg); border: 1px solid var(--border-color);">
        <div class="card-body" id="publicProjectContent" style="padding: var(--space-xl);">
          <div style="text-align:center;">
            <div class="spinner"></div>
            <p style="margin-top:var(--space-md);color:var(--text-muted)">Loading project details...</p>
          </div>
        </div>
      </div>
    </div>
  `;
}

async function initPublicProject() {
  const path = window.location.pathname;
  const match = path.match(/\/public\/project\/(\d+)/);
  if (!match) {
    document.getElementById('publicProjectContent').innerHTML = `
      <div style="text-align:center;color:var(--error)">
        <i data-lucide="alert-circle" style="width:48px;height:48px;margin-bottom:var(--space-md)"></i>
        <h2>Invalid Project URL</h2>
        <p>The link you followed is incorrect.</p>
      </div>
    `;
    if (window.lucide) lucide.createIcons();
    return;
  }

  const projectId = match[1];
  try {
    const res = await fetch(`/api/public/projects/${projectId}`);
    const data = await res.json();

    if (!data.success) throw new Error(data.error || 'Project not found');

    const proj = data.data;
    
    const statusMap = {
      'active': { label:'Active', color:'var(--success)', bg:'rgba(0,230,118,0.1)' },
      'on_hold': { label:'On Hold', color:'var(--warning)', bg:'rgba(255,171,64,0.1)' },
      'completed': { label:'Completed', color:'var(--info)', bg:'rgba(64,196,255,0.1)' },
    };
    const status = statusMap[proj.status] || statusMap['active'];
    const typeColor = '#4f8fff';

    document.getElementById('publicProjectContent').innerHTML = `
      <div style="text-align:center;margin-bottom:var(--space-xl)">
        <div style="display:inline-flex;align-items:center;justify-content:center;width:64px;height:64px;border-radius:16px;background:rgba(124,92,255,0.1);color:var(--accent-secondary);margin-bottom:var(--space-md)">
          <i data-lucide="folder-git-2" style="width:32px;height:32px"></i>
        </div>
        <h1 style="margin:0 0 var(--space-xs) 0;font-size:1.75rem;color:var(--text-primary)">${proj.name}</h1>
        <div style="display:flex;align-items:center;justify-content:center;gap:var(--space-sm);flex-wrap:wrap">
          ${proj.type ? `<span class="badge" style="background:${typeColor}20;color:${typeColor}">${proj.type}</span>` : ''}
          <span style="padding:3px 10px;border-radius:20px;font-size:0.75rem;font-weight:600;background:${status.bg};color:${status.color}">${status.label}</span>
        </div>
      </div>

      <div style="margin-bottom:var(--space-xl)">
        <h4 style="font-size:0.875rem;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:var(--space-sm)">Description</h4>
        <p style="color:var(--text-primary);line-height:1.6">${proj.description || 'No description provided.'}</p>
      </div>

      <div style="margin-bottom:var(--space-xl)">
        <h4 style="font-size:0.875rem;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:var(--space-sm)">Progress</h4>
        <div style="display:flex;justify-content:space-between;margin-bottom:6px">
          <span style="font-size:0.75rem;color:var(--text-muted)">Completion</span>
          <span style="font-size:0.75rem;font-weight:600;color:var(--text-primary)">${proj.progress_percent || 0}%</span>
        </div>
        <div style="height:8px;background:rgba(255,255,255,0.06);border-radius:4px;overflow:hidden">
          <div style="height:100%;width:${proj.progress_percent || 0}%;background:var(--accent-gradient);border-radius:4px;"></div>
        </div>
      </div>

      <div>
        <h4 style="font-size:0.875rem;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:var(--space-sm)">Team Members (${proj.members?.length || 0})</h4>
        ${proj.members && proj.members.length > 0 ? `
          <div style="display:flex;flex-direction:column;gap:var(--space-sm)">
            ${proj.members.map(m => {
              const initials = m.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0,2);
              return `
                <div style="display:flex;align-items:center;gap:var(--space-md);padding:var(--space-sm);background:var(--bg-glass);border-radius:var(--border-radius);border:1px solid var(--border-color)">
                  <div class="avatar avatar-sm">${initials}</div>
                  <div>
                    <div style="color:var(--text-primary);font-weight:500">${m.name}</div>
                    <div style="color:var(--text-muted);font-size:0.75rem;text-transform:capitalize">${m.role}</div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        ` : '<p style="color:var(--text-muted)">No members assigned.</p>'}
      </div>
      
      <div style="text-align:center;margin-top:var(--space-xl)">
        <p style="font-size:0.75rem;color:var(--text-muted)">Verified by C2S VLSI Lab Portal</p>
      </div>
    `;
    if (window.lucide) lucide.createIcons();
  } catch(e) {
    document.getElementById('publicProjectContent').innerHTML = `
      <div style="text-align:center;color:var(--error)">
        <i data-lucide="x-circle" style="width:48px;height:48px;margin-bottom:var(--space-md)"></i>
        <h2>Project Not Found</h2>
        <p>This project may have been deleted or doesn't exist.</p>
      </div>
    `;
    if (window.lucide) lucide.createIcons();
  }
}
