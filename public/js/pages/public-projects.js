function renderPublicProjects() {
  return `
    <div style="min-height: 100vh; background: var(--bg-body); padding: var(--space-xl) var(--space-md);">
      <div style="max-width: 1000px; margin: 0 auto;">
        
        <div style="text-align:center; margin-bottom: var(--space-2xl)">
          <div style="display:inline-flex;align-items:center;justify-content:center;width:64px;height:64px;border-radius:16px;background:rgba(79, 143, 255, 0.1);color:var(--accent-primary);margin-bottom:var(--space-md)">
            <i data-lucide="cpu" style="width:32px;height:32px"></i>
          </div>
          <h1 style="margin:0 0 var(--space-xs) 0;font-size:2rem;color:var(--text-primary)">C2S VLSI Lab Portfolio</h1>
          <p style="color:var(--text-muted);font-size:1.1rem">Showcasing the latest projects and research from our students.</p>
        </div>

        <div style="display:flex; justify-content:center; gap: var(--space-sm); margin-bottom: var(--space-xl); flex-wrap: wrap;" id="publicProjectFilters">
          <button class="btn btn-primary" data-status="all">All Projects</button>
          <button class="btn btn-secondary" data-status="active">Active</button>
          <button class="btn btn-secondary" data-status="completed">Completed</button>
        </div>

        <div class="grid grid-2" id="publicProjectsGrid" style="gap: var(--space-lg)">
          <div style="grid-column: 1/-1; text-align:center; padding: var(--space-2xl);">
            <div class="spinner"></div>
            <p style="margin-top:var(--space-md);color:var(--text-muted)">Loading lab projects...</p>
          </div>
        </div>
        
        <div style="text-align:center;margin-top:var(--space-2xl);padding-top:var(--space-xl);border-top:1px solid var(--border-color)">
          <p style="font-size:0.875rem;color:var(--text-muted)">© ${new Date().getFullYear()} C2S VLSI Lab. All rights reserved.</p>
        </div>
      </div>
    </div>
  `;
}

let allPublicProjects = [];

async function initPublicProjects() {
  if (window.lucide) lucide.createIcons();
  
  try {
    const res = await fetch('/api/public/projects');
    const data = await res.json();
    
    if (data.success) {
      allPublicProjects = data.data;
      renderPublicProjectsGrid('all');
    } else {
      throw new Error(data.error);
    }
  } catch (e) {
    document.getElementById('publicProjectsGrid').innerHTML = `
      <div style="grid-column: 1/-1; text-align:center; color:var(--error); padding: var(--space-xl);">
        <i data-lucide="alert-circle" style="width:48px;height:48px;margin-bottom:var(--space-md)"></i>
        <h2>Failed to load projects</h2>
        <p>Please try again later.</p>
      </div>
    `;
    if (window.lucide) lucide.createIcons();
  }

  // Set up filter buttons
  document.querySelectorAll('#publicProjectFilters button').forEach(btn => {
    btn.addEventListener('click', (e) => {
      // Update active state
      document.querySelectorAll('#publicProjectFilters button').forEach(b => {
        b.className = 'btn btn-secondary';
      });
      e.target.className = 'btn btn-primary';
      
      renderPublicProjectsGrid(e.target.dataset.status);
    });
  });
}

function renderPublicProjectsGrid(statusFilter) {
  const container = document.getElementById('publicProjectsGrid');
  
  const filtered = statusFilter === 'all' 
    ? allPublicProjects 
    : allPublicProjects.filter(p => p.status === statusFilter);

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1/-1; text-align:center; padding: var(--space-2xl);">
        <i data-lucide="folder-search" style="width:48px;height:48px;color:var(--text-muted);margin-bottom:var(--space-md)"></i>
        <h3 style="color:var(--text-primary)">No projects found</h3>
        <p style="color:var(--text-muted)">Check back later for updates.</p>
      </div>
    `;
    if (window.lucide) lucide.createIcons();
    return;
  }

  const typeColors = {
    'ASIC': '#7c5cff',
    'FPGA': '#00e676',
    'Analog': '#ffab40',
    'Digital': '#40c4ff',
    'Mixed-Signal': '#ff5252'
  };

  const statusMap = {
    'active': { label:'Active', color:'var(--success)', bg:'rgba(0,230,118,0.1)' },
    'on_hold': { label:'On Hold', color:'var(--warning)', bg:'rgba(255,171,64,0.1)' },
    'completed': { label:'Completed', color:'var(--info)', bg:'rgba(64,196,255,0.1)' },
  };

  container.innerHTML = filtered.map(proj => {
    const status = statusMap[proj.status] || statusMap['active'];
    const typeColor = typeColors[proj.type] || '#4f8fff';
    const members = proj.members || [];
    
    return `
      <div class="card animate-slideUp" style="display:flex; flex-direction:column; border:1px solid var(--border-color); cursor:pointer; transition:transform 0.2s, box-shadow 0.2s;" onmouseover="this.style.transform='translateY(-4px)';this.style.boxShadow='var(--shadow-md)'" onmouseout="this.style.transform='none';this.style.boxShadow='var(--shadow-sm)'" onclick="window.open('/public/project/${proj.id}', '_blank')">
        <div class="card-body" style="flex:1; padding: var(--space-lg);">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom: var(--space-md);">
            ${proj.type ? `<span class="badge" style="background:${typeColor}20;color:${typeColor}">${proj.type}</span>` : '<span></span>'}
            <span style="padding:3px 10px;border-radius:20px;font-size:0.75rem;font-weight:600;background:${status.bg};color:${status.color}">${status.label}</span>
          </div>
          
          <h3 style="margin:0 0 var(--space-xs) 0;font-size:1.25rem;color:var(--text-primary);line-height:1.4">${proj.name}</h3>
          
          <p style="color:var(--text-secondary);font-size:0.9rem;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;margin-bottom:var(--space-md)">
            ${proj.description || 'No description provided.'}
          </p>
          
          <div style="margin-bottom:var(--space-md)">
            <div style="display:flex;justify-content:space-between;margin-bottom:6px">
              <span style="font-size:0.75rem;color:var(--text-muted)">Progress</span>
              <span style="font-size:0.75rem;font-weight:600;color:var(--accent-primary)">${proj.progress_percent || 0}%</span>
            </div>
            <div style="height:6px;background:rgba(255,255,255,0.06);border-radius:3px;overflow:hidden">
              <div style="height:100%;width:${proj.progress_percent || 0}%;background:var(--accent-gradient);border-radius:3px;"></div>
            </div>
          </div>
          
          <div style="margin-top:auto; padding-top:var(--space-md); border-top:1px solid var(--border-color); display:flex; align-items:center; justify-content:space-between">
            <div style="font-size:0.8rem;color:var(--text-muted)">
              <i data-lucide="users" style="width:14px;height:14px;vertical-align:-2px;margin-right:4px"></i>
              ${members.length} ${members.length === 1 ? 'Member' : 'Members'}
            </div>
            <div style="display:flex; padding-left:10px">
              ${members.slice(0, 3).map((m, i) => {
                const init = m.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0,2);
                return `<div class="avatar avatar-sm" style="width:24px;height:24px;font-size:0.6rem;border:2px solid var(--bg-body);margin-left:-10px;z-index:${10-i}" title="${m.name}">${init}</div>`;
              }).join('')}
              ${members.length > 3 ? `<div class="avatar avatar-sm" style="width:24px;height:24px;font-size:0.6rem;border:2px solid var(--bg-body);margin-left:-10px;z-index:7;background:var(--bg-glass)">+${members.length-3}</div>` : ''}
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');
  
  if (window.lucide) lucide.createIcons();
}
