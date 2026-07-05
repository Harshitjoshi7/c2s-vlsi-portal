/* ============================================================
   C2S VLSI Lab Portal — Projects Page
   View, create and manage VLSI lab projects
   ============================================================ */

function renderProjects() {
  const user = getUser();
  const isAdminUser = user && user.role === 'admin';

  return `
    <div class="page-enter">
      <div class="page-header">
        <div class="page-header-left">
          <h1 class="page-title animate-slideUp">
            <i data-lucide="folder-git-2" style="width:28px;height:28px;vertical-align:-4px;margin-right:10px;color:var(--accent-secondary)"></i>
            Projects
          </h1>
          <p class="page-subtitle animate-slideUp stagger-1">Manage VLSI lab research projects</p>
        </div>
        <div class="page-header-actions animate-slideUp stagger-2">
          <button class="btn btn-primary" id="newProjectBtn">
            <i data-lucide="plus" style="width:16px;height:16px"></i>
            New Project
          </button>
        </div>
      </div>

      <!-- Filters -->
      <div class="card animate-slideUp stagger-2" style="margin-bottom:var(--space-lg)">
        <div class="card-body" style="padding:var(--space-md)">
          <div style="display:flex;gap:var(--space-md);flex-wrap:wrap;align-items:center">
            <div class="search-input" style="flex:1;min-width:200px">
              <i data-lucide="search" class="search-icon"></i>
              <input type="text" id="projSearch" placeholder="Search projects..." />
            </div>
            <select class="form-select" id="projStatusFilter" style="width:auto">
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="on_hold">On Hold</option>
              <option value="completed">Completed</option>
            </select>
            <select class="form-select" id="projTypeFilter" style="width:auto">
              <option value="">All Types</option>
              <option value="ASIC">ASIC</option>
              <option value="FPGA">FPGA</option>
              <option value="Analog">Analog</option>
              <option value="Digital">Digital</option>
              <option value="Mixed-Signal">Mixed-Signal</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Projects Grid -->
      <div id="projectsContainer">
        <div class="grid" style="grid-template-columns:repeat(auto-fill,minmax(340px,1fr));gap:var(--space-lg)">
          ${[1,2,3].map(() => `
            <div class="card">
              <div class="card-body">
                <div class="skeleton skeleton-heading" style="width:70%;margin-bottom:12px"></div>
                <div class="skeleton skeleton-text" style="width:90%"></div>
                <div class="skeleton skeleton-text" style="width:75%"></div>
                <div class="skeleton skeleton-text" style="width:40%;margin-top:12px"></div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>

    <!-- Project Modal -->
    <div class="modal-overlay" id="projectModalOverlay" style="display:none">
      <div class="modal" style="max-width:640px">
        <div class="modal-header">
          <h3 class="modal-title" id="projectModalTitle">New Project</h3>
          <button class="modal-close" id="projectModalClose">
            <i data-lucide="x" style="width:20px;height:20px"></i>
          </button>
        </div>
        <div class="modal-body">
          <form id="projectForm">
            <div class="form-group">
              <label class="form-label">Project Name *</label>
              <input type="text" class="form-input" id="projName" placeholder="e.g. 8-bit RISC CPU Design" required />
            </div>
            <div class="form-group">
              <label class="form-label">Description</label>
              <textarea class="form-textarea" id="projDesc" rows="3" placeholder="Brief description of the project..."></textarea>
            </div>
            <div class="grid grid-2" style="gap:var(--space-md)">
              <div class="form-group">
                <label class="form-label">Type</label>
                <select class="form-select" id="projType">
                  <option value="">Select type</option>
                  <option value="ASIC">ASIC</option>
                  <option value="FPGA">FPGA</option>
                  <option value="Analog">Analog</option>
                  <option value="Digital">Digital</option>
                  <option value="Mixed-Signal">Mixed-Signal</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Status</label>
                <select class="form-select" id="projStatus">
                  <option value="active">Active</option>
                  <option value="on_hold">On Hold</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Start Date</label>
                <input type="date" class="form-input" id="projStartDate" />
              </div>
              <div class="form-group">
                <label class="form-label">End Date</label>
                <input type="date" class="form-input" id="projEndDate" />
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">GitHub Repository URL</label>
              <input type="url" class="form-input" id="projGithub" placeholder="https://github.com/..." />
            </div>
            <div class="form-group">
              <label class="form-label">Team Members</label>
              <select class="form-select" id="projMembers" multiple style="height:auto;min-height:80px">
                <!-- populated by JS -->
              </select>
              <div style="font-size:0.75rem;color:var(--text-muted);margin-top:4px">Hold Ctrl/Cmd to select multiple members</div>
            </div>
            <div class="form-group">
              <label class="form-label">Progress (%)</label>
              <input type="number" class="form-input" id="projProgress" min="0" max="100" value="0" />
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" id="projectModalCancel">Cancel</button>
          <button class="btn btn-primary" id="projectSubmitBtn">
            <span id="projSubmitText">Create Project</span>
            <div class="spinner" id="projSubmitSpinner" style="display:none"></div>
          </button>
        </div>
      </div>
    </div>

    <!-- Project Detail Modal -->
    <div class="modal-overlay" id="projectDetailOverlay" style="display:none">
      <div class="modal" style="max-width:700px">
        <div class="modal-header">
          <h3 class="modal-title" id="detailProjectName">Project Details</h3>
          <button class="modal-close" id="projectDetailClose">
            <i data-lucide="x" style="width:20px;height:20px"></i>
          </button>
        </div>
        <div class="modal-body" id="projectDetailContent">
        </div>
        <div class="modal-footer" id="projectDetailFooter">
          <button class="btn btn-secondary" id="projectDetailCloseBtn">Close</button>
        </div>
      </div>
    </div>
  `;
}

async function initProjects() {
  const user = getUser();
  const isAdminUser = user && user.role === 'admin';
  let allProjects = [];
  let allStudents = [];
  let editingProjectId = null;

  // Load students for the multi-select
  try {
    const res = await api.get('users?role=student');
    allStudents = Array.isArray(res) ? res : (res?.data || []);
  } catch(e) {
    console.error('Failed to load students');
  }

  // Load projects
  async function loadProjects() {
    try {
      const endpoint = isAdminUser ? 'projects' : 'projects/my';
      const res = await api.get(endpoint);
      allProjects = Array.isArray(res) ? res : (res?.data || []);
      renderProjects(allProjects);
    } catch(e) {
      renderProjects([]);
    }
  }

  const typeColors = {
    'ASIC': '#4f8fff', 'FPGA': '#7c5cff', 'Analog': '#ff6e40',
    'Digital': '#00e676', 'Mixed-Signal': '#ffab40'
  };

  function renderProjects(projects) {
    const container = document.getElementById('projectsContainer');
    if (!container) return;

    if (!projects || projects.length === 0) {
      container.innerHTML = `
        <div class="card"><div class="card-body">
          <div class="empty-state">
            <div class="empty-state-icon"><i data-lucide="folder-open" style="width:28px;height:28px"></i></div>
            <div class="empty-state-title">No projects found</div>
            <div class="empty-state-description">
              ${isAdminUser ? 'Create your first project to get started.' : 'Create a project or wait to be added to one.'}
            </div>
            <button class="btn btn-primary" onclick="document.getElementById('newProjectBtn').click()">
              <i data-lucide="plus" style="width:16px;height:16px"></i> New Project
            </button>
          </div>
        </div></div>
      `;
      if (window.lucide) lucide.createIcons();
      return;
    }

    const statusMap = {
      'active': { label:'Active', color:'var(--success)', bg:'rgba(0,230,118,0.1)' },
      'on_hold': { label:'On Hold', color:'var(--warning)', bg:'rgba(255,171,64,0.1)' },
      'completed': { label:'Completed', color:'var(--info)', bg:'rgba(64,196,255,0.1)' },
    };

    container.innerHTML = `
      <div class="grid" style="grid-template-columns:repeat(auto-fill,minmax(340px,1fr));gap:var(--space-lg)">
        ${projects.map(proj => {
          const status = statusMap[proj.status] || statusMap['active'];
          const typeColor = typeColors[proj.type] || '#4f8fff';
          const progress = proj.progress_percent || 0;
          const memberCount = proj.member_count || 0;

          return `
            <div class="card" style="cursor:pointer;transition:all 0.2s" onclick="viewProject(${proj.id})">
              <div class="card-body">
                <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:var(--space-md)">
                  <div style="flex:1">
                    <div style="display:flex;align-items:center;gap:var(--space-sm);margin-bottom:6px;flex-wrap:wrap">
                      ${proj.type ? `<span class="badge" style="background:${typeColor}20;color:${typeColor}">${proj.type}</span>` : ''}
                      <span style="padding:3px 10px;border-radius:20px;font-size:0.75rem;font-weight:600;background:${status.bg};color:${status.color}">${status.label}</span>
                    </div>
                    <h4 style="margin:0;font-size:1rem;color:var(--text-primary)">${proj.name}</h4>
                  </div>
                  <div style="display:flex;gap:4px" onclick="event.stopPropagation()">
                    <button class="btn btn-ghost btn-sm" onclick="editProject(${proj.id})" title="Edit">
                      <i data-lucide="pencil" style="width:14px;height:14px"></i>
                    </button>
                    ${isAdminUser ? `
                    <button class="btn btn-ghost btn-sm" onclick="deleteProject(${proj.id})" title="Delete" style="color:var(--error)">
                      <i data-lucide="trash-2" style="width:14px;height:14px"></i>
                    </button>
                    ` : ''}
                  </div>
                </div>
                ${proj.description ? `<p style="color:var(--text-muted);font-size:0.8375rem;margin-bottom:var(--space-md);line-height:1.6;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">${proj.description}</p>` : ''}
                
                <!-- Progress bar -->
                <div style="margin-bottom:var(--space-md)">
                  <div style="display:flex;justify-content:space-between;margin-bottom:6px">
                    <span style="font-size:0.75rem;color:var(--text-muted)">Progress</span>
                    <span style="font-size:0.75rem;font-weight:600;color:var(--text-primary)">${progress}%</span>
                  </div>
                  <div style="height:6px;background:rgba(255,255,255,0.06);border-radius:3px;overflow:hidden">
                    <div style="height:100%;width:${progress}%;background:var(--accent-gradient);border-radius:3px;transition:width 0.4s ease"></div>
                  </div>
                </div>

                <div style="display:flex;align-items:center;justify-content:space-between;color:var(--text-muted);font-size:0.8rem">
                  <div style="display:flex;align-items:center;gap:4px">
                    <i data-lucide="users" style="width:14px;height:14px"></i>
                    <span>${memberCount} member${memberCount !== 1 ? 's' : ''}</span>
                  </div>
                  ${proj.github_repo_url ? `
                  <a href="${proj.github_repo_url}" target="_blank" onclick="event.stopPropagation()" style="display:flex;align-items:center;gap:4px;color:var(--accent-primary)">
                    <i data-lucide="github" style="width:14px;height:14px"></i>
                    <span>Repo</span>
                  </a>` : ''}
                </div>
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
    const search = document.getElementById('projSearch')?.value.toLowerCase() || '';
    const statusFilter = document.getElementById('projStatusFilter')?.value || '';
    const typeFilter = document.getElementById('projTypeFilter')?.value || '';

    const filtered = allProjects.filter(p => {
      const matchSearch = !search || (p.name || '').toLowerCase().includes(search) || (p.description || '').toLowerCase().includes(search);
      const matchStatus = !statusFilter || p.status === statusFilter;
      const matchType = !typeFilter || p.type === typeFilter;
      return matchSearch && matchStatus && matchType;
    });
    renderProjects(filtered);
  }

  ['projSearch','projStatusFilter','projTypeFilter'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', applyFilters);
  });

  // Modal
  const overlay = document.getElementById('projectModalOverlay');
  const detailOverlay = document.getElementById('projectDetailOverlay');

  function openModal(proj = null) {
    editingProjectId = proj ? proj.id : null;
    document.getElementById('projectModalTitle').textContent = proj ? 'Edit Project' : 'New Project';
    document.getElementById('projName').value = proj?.name || '';
    document.getElementById('projDesc').value = proj?.description || '';
    document.getElementById('projType').value = proj?.type || '';
    document.getElementById('projStatus').value = proj?.status || 'active';
    document.getElementById('projStartDate').value = proj?.start_date || '';
    document.getElementById('projEndDate').value = proj?.end_date || '';
    document.getElementById('projGithub').value = proj?.github_repo_url || '';
    document.getElementById('projProgress').value = proj?.progress_percent || 0;
    
    // Populate Team Members
    const membersSelect = document.getElementById('projMembers');
    if (membersSelect) {
      const projMemberIds = proj?.members ? proj.members.map(m => m.user_id) : [];
      membersSelect.innerHTML = allStudents.map(s => {
        const selected = projMemberIds.includes(s.id) ? 'selected' : '';
        return `<option value="${s.id}" ${selected}>${s.name}</option>`;
      }).join('');
    }

    document.getElementById('projSubmitText').textContent = proj ? 'Update Project' : 'Create Project';
    overlay.style.display = 'flex';
  }

  function closeModal() { overlay.style.display = 'none'; editingProjectId = null; }
  function closeDetailModal() { detailOverlay.style.display = 'none'; }

  document.getElementById('newProjectBtn')?.addEventListener('click', () => openModal());
  document.getElementById('projectModalClose')?.addEventListener('click', closeModal);
  document.getElementById('projectModalCancel')?.addEventListener('click', closeModal);
  overlay?.addEventListener('click', e => { if (e.target === overlay) closeModal(); });
  document.getElementById('projectDetailClose')?.addEventListener('click', closeDetailModal);
  document.getElementById('projectDetailCloseBtn')?.addEventListener('click', closeDetailModal);
  detailOverlay?.addEventListener('click', e => { if (e.target === detailOverlay) closeDetailModal(); });

  // Submit
  document.getElementById('projectSubmitBtn')?.addEventListener('click', async () => {
    const name = document.getElementById('projName').value.trim();
    if (!name) { showToast({ message: 'Project name is required', type: 'warning' }); return; }

    const member_ids = Array.from(document.getElementById('projMembers').selectedOptions).map(opt => parseInt(opt.value));

    const payload = {
      name,
      description: document.getElementById('projDesc').value.trim() || null,
      type: document.getElementById('projType').value || null,
      status: document.getElementById('projStatus').value,
      start_date: document.getElementById('projStartDate').value || null,
      end_date: document.getElementById('projEndDate').value || null,
      github_repo_url: document.getElementById('projGithub').value.trim() || null,
      progress_percent: parseInt(document.getElementById('projProgress').value) || 0,
      member_ids,
    };

    const btnText = document.getElementById('projSubmitText');
    const spinner = document.getElementById('projSubmitSpinner');
    btnText.style.display = 'none';
    spinner.style.display = 'inline-block';

    try {
      if (editingProjectId) {
        await api.put(`projects/${editingProjectId}`, payload);
        showToast({ message: 'Project updated!', type: 'success' });
      } else {
        await api.post('projects', payload);
        showToast({ message: 'Project created!', type: 'success' });
      }
      closeModal();
      await loadProjects();
    } catch(err) {
      showToast({ message: err.message || 'Failed to save project', type: 'error' });
    } finally {
      btnText.style.display = '';
      spinner.style.display = 'none';
    }
  });

  // View project details
  window.viewProject = async (id) => {
    let proj = allProjects.find(p => p.id === id);
    if (!proj) return;
    document.getElementById('detailProjectName').textContent = proj.name;

    // Show loading state for details
    document.getElementById('projectDetailContent').innerHTML = `
      <div style="text-align:center;padding:var(--space-xl)"><div class="spinner" style="display:inline-block;width:24px;height:24px"></div></div>
    `;
    detailOverlay.style.display = 'flex';

    // Fetch full project with members
    try {
      const res = await api.get(`projects/${id}`);
      if (res && res.data) {
        proj = res.data;
      }
    } catch (e) {
      console.error('Failed to fetch project details', e);
    }

    const status = { active:'Active', on_hold:'On Hold', completed:'Completed' }[proj.status] || proj.status;
    const typeColor = typeColors[proj.type] || '#4f8fff';
    const progress = proj.progress_percent || 0;
    
    let membersHtml = '';
    if (proj.members && proj.members.length > 0) {
      membersHtml = `
        <div style="margin-top:var(--space-lg);border-top:1px solid rgba(255,255,255,0.1);padding-top:var(--space-md)">
          <h5 style="margin:0 0 var(--space-sm) 0;font-size:0.875rem;color:var(--text-primary)">Team Members (${proj.members.length})</h5>
          <div style="display:flex;flex-direction:column;gap:8px">
            ${proj.members.map(m => `
              <div style="display:flex;align-items:center;justify-content:space-between;padding:8px;background:rgba(255,255,255,0.03);border-radius:var(--border-radius-sm)">
                <div style="display:flex;align-items:center;gap:8px">
                  <div class="avatar avatar-sm" style="width:24px;height:24px;font-size:0.6rem">${m.user_name.substring(0,2).toUpperCase()}</div>
                  <span style="font-size:0.875rem;color:var(--text-secondary)">${m.user_name}</span>
                </div>
                <span class="badge" style="background:rgba(255,255,255,0.1);color:var(--text-muted);font-size:0.7rem">${m.role}</span>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    } else {
      membersHtml = `
        <div style="margin-top:var(--space-lg);border-top:1px solid rgba(255,255,255,0.1);padding-top:var(--space-md)">
          <h5 style="margin:0 0 var(--space-sm) 0;font-size:0.875rem;color:var(--text-primary)">Team Members</h5>
          <div style="font-size:0.85rem;color:var(--text-muted)">No members assigned yet.</div>
        </div>
      `;
    }

    document.getElementById('projectDetailContent').innerHTML = `
      <div style="display:flex;flex-wrap:wrap;gap:var(--space-sm);margin-bottom:var(--space-lg)">
        ${proj.type ? `<span class="badge" style="background:${typeColor}20;color:${typeColor}">${proj.type}</span>` : ''}
        <span class="badge badge-info">${status}</span>
      </div>
      ${proj.description ? `<p style="color:var(--text-secondary);margin-bottom:var(--space-lg)">${proj.description}</p>` : ''}
      
      <div style="margin-bottom:var(--space-lg)">
        <div style="display:flex;justify-content:space-between;margin-bottom:8px">
          <span style="font-weight:600;color:var(--text-primary)">Progress</span>
          <span style="font-weight:700;color:var(--accent-primary)">${progress}%</span>
        </div>
        <div style="height:10px;background:rgba(255,255,255,0.06);border-radius:5px;overflow:hidden">
          <div style="height:100%;width:${progress}%;background:var(--accent-gradient);border-radius:5px"></div>
        </div>
      </div>
      
      <div class="grid grid-2" style="gap:var(--space-md);margin-bottom:var(--space-md)">
        ${proj.start_date ? `<div><div style="font-size:0.75rem;color:var(--text-muted);margin-bottom:4px">Start Date</div><div style="font-weight:500">${new Date(proj.start_date).toLocaleDateString()}</div></div>` : ''}
        ${proj.end_date ? `<div><div style="font-size:0.75rem;color:var(--text-muted);margin-bottom:4px">End Date</div><div style="font-weight:500">${new Date(proj.end_date).toLocaleDateString()}</div></div>` : ''}
      </div>

      ${proj.github_repo_url ? `
      <a href="${proj.github_repo_url}" target="_blank" class="btn btn-secondary" style="display:inline-flex;margin-bottom:var(--space-sm)">
        <i data-lucide="github" style="width:16px;height:16px"></i>
        View Repository
      </a>` : ''}
      
      ${membersHtml}
    `;
    detailOverlay.style.display = 'flex';
    if (window.lucide) lucide.createIcons({ nodes: [detailOverlay] });

    // Admin and members can edit from detail
    document.getElementById('projectDetailFooter').innerHTML = `
      <button class="btn btn-secondary" id="projectDetailCloseBtn2">Close</button>
      <button class="btn btn-primary" onclick="editProject(${proj.id});document.getElementById('projectDetailOverlay').style.display='none'">
        <i data-lucide="pencil" style="width:16px;height:16px"></i> Edit
      </button>
    `;
    document.getElementById('projectDetailCloseBtn2')?.addEventListener('click', closeDetailModal);
    if (window.lucide) lucide.createIcons({ nodes: [document.getElementById('projectDetailFooter')] });
  };

  window.editProject = (id) => {
    const proj = allProjects.find(p => p.id === id);
    if (proj) openModal(proj);
  };

  window.deleteProject = async (id) => {
    if (!confirm('Are you sure you want to delete this project? This cannot be undone.')) return;
    try {
      await api.delete(`projects/${id}`);
      showToast({ message: 'Project deleted successfully.', type: 'success' });
      await loadProjects();
    } catch (err) {
      showToast({ message: err.message || 'Failed to delete project.', type: 'error' });
    }
  };

  await loadProjects();
}

window.renderProjects = renderProjects;
window.initProjects = initProjects;
