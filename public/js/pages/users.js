/* ============================================================
   C2S VLSI Lab Portal — Users Page (Admin only)
   Manage lab members, view profiles, add/edit/deactivate
   ============================================================ */

function renderUsers() {
  return `
    <div class="page-enter">
      <div class="page-header">
        <div class="page-header-left">
          <h1 class="page-title animate-slideUp">
            <i data-lucide="users" style="width:28px;height:28px;vertical-align:-4px;margin-right:10px;color:var(--accent-primary)"></i>
            Users
          </h1>
          <p class="page-subtitle animate-slideUp stagger-1">Manage lab members and accounts</p>
        </div>
        <div class="page-header-actions animate-slideUp stagger-2">
          <button class="btn btn-primary" id="newUserBtn">
            <i data-lucide="user-plus" style="width:16px;height:16px"></i>
            Add Member
          </button>
        </div>
      </div>

      <!-- Filters & Stats -->
      <div class="grid grid-stats" style="margin-bottom:var(--space-lg)" id="userStats">
        <div class="stat-card animate-slideUp stagger-1">
          <div class="stat-card-icon blue"><i data-lucide="users" style="width:22px;height:22px"></i></div>
          <div class="stat-card-value" id="totalUsersCount">—</div>
          <div class="stat-card-label">Total Members</div>
        </div>
        <div class="stat-card animate-slideUp stagger-2">
          <div class="stat-card-icon purple"><i data-lucide="graduation-cap" style="width:22px;height:22px"></i></div>
          <div class="stat-card-value" id="studentCount">—</div>
          <div class="stat-card-label">Students</div>
        </div>
        <div class="stat-card animate-slideUp stagger-3">
          <div class="stat-card-icon orange"><i data-lucide="shield" style="width:22px;height:22px"></i></div>
          <div class="stat-card-value" id="adminCount">—</div>
          <div class="stat-card-label">Admins</div>
        </div>
      </div>

      <!-- Search & Filter -->
      <div class="card animate-slideUp stagger-3" style="margin-bottom:var(--space-lg)">
        <div class="card-body" style="padding:var(--space-md)">
          <div style="display:flex;gap:var(--space-md);flex-wrap:wrap;align-items:center">
            <div class="search-input" style="flex:1;min-width:200px">
              <i data-lucide="search" class="search-icon"></i>
              <input type="text" id="userSearch" placeholder="Search by name, email, batch..." />
            </div>
            <select class="form-select" id="userRoleFilter" style="width:auto">
              <option value="">All Roles</option>
              <option value="student">Students</option>
              <option value="admin">Admins</option>
            </select>
            <select class="form-select" id="userBatchFilter" style="width:auto">
              <option value="">All Batches</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Users Table -->
      <div class="card animate-slideUp stagger-4">
        <div class="card-body" style="padding:0">
          <div id="usersTableContainer">
            <div style="padding:var(--space-xl)">
              ${[1,2,3,4,5].map(() => `
                <div class="d-flex align-items-center gap-md py-md border-bottom">
                  <div class="skeleton" style="width:40px;height:40px;border-radius:50%"></div>
                  <div style="flex:1">
                    <div class="skeleton skeleton-text" style="width:40%;margin-bottom:6px"></div>
                    <div class="skeleton skeleton-text" style="width:60%"></div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- User Modal -->
    <div class="modal-overlay" id="userModalOverlay" style="display:none">
      <div class="modal" style="max-width:580px">
        <div class="modal-header">
          <h3 class="modal-title" id="userModalTitle">Add Member</h3>
          <button class="modal-close" id="userModalClose">
            <i data-lucide="x" style="width:20px;height:20px"></i>
          </button>
        </div>
        <div class="modal-body">
          <form id="userForm">
            <div class="grid grid-2" style="gap:var(--space-md)">
              <div class="form-group" style="grid-column:1/-1">
                <label class="form-label">Full Name *</label>
                <input type="text" class="form-input" id="userName" placeholder="Full name" required />
              </div>
              <div class="form-group" style="grid-column:1/-1">
                <label class="form-label">Email *</label>
                <input type="email" class="form-input" id="userEmail" placeholder="email@example.com" required />
              </div>
              <div class="form-group" style="grid-column:1/-1" id="passwordGroup">
                <label class="form-label">Password *</label>
                <input type="password" class="form-input" id="userPassword" placeholder="Set initial password" />
              </div>
              <div class="form-group">
                <label class="form-label">Role</label>
                <select class="form-select" id="userRole">
                  <option value="student">Student</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Batch / Cohort</label>
                <input type="text" class="form-input" id="userBatch" placeholder="e.g. 2024-B1" />
              </div>
              <div class="form-group">
                <label class="form-label">Enrollment ID</label>
                <input type="text" class="form-input" id="userEnrollment" placeholder="e.g. VL2024001" />
              </div>
              <div class="form-group">
                <label class="form-label">GitHub Username</label>
                <input type="text" class="form-input" id="userGithub" placeholder="@username" />
              </div>
              <div class="form-group" style="grid-column:1/-1">
                <label class="form-label">Skills (comma separated)</label>
                <input type="text" class="form-input" id="userSkills" placeholder="e.g. Verilog, SPICE, Cadence Virtuoso" />
              </div>
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" id="userModalCancel">Cancel</button>
          <button class="btn btn-primary" id="userSubmitBtn">
            <span id="userSubmitText">Add Member</span>
            <div class="spinner" id="userSubmitSpinner" style="display:none"></div>
          </button>
        </div>
      </div>
    </div>

    <!-- Profile Modal -->
    <div class="modal-overlay" id="profileModalOverlay" style="display:none">
      <div class="modal" style="max-width:600px; padding:0; overflow:hidden;">
        <button class="modal-close" id="profileModalClose" style="position:absolute;top:16px;right:16px;z-index:10;background:rgba(0,0,0,0.5);color:white;border:none;">
          <i data-lucide="x" style="width:20px;height:20px"></i>
        </button>
        <div id="profileModalContent"></div>
      </div>
    </div>
  `;
}

async function initUsers() {
  let allUsers = [];
  let editingUserId = null;

  async function loadUsers() {
    try {
      const res = await api.get('users');
      allUsers = Array.isArray(res) ? res : (res?.data || []);
      updateStats();
      populateBatchFilter();
      applyFilters();
    } catch(e) {
      document.getElementById('usersTableContainer').innerHTML = `
        <div class="empty-state"><div class="empty-state-description">Failed to load users.</div></div>
      `;
    }
  }

  function updateStats() {
    document.getElementById('totalUsersCount').textContent = allUsers.length;
    document.getElementById('studentCount').textContent = allUsers.filter(u => u.role === 'student').length;
    document.getElementById('adminCount').textContent = allUsers.filter(u => u.role === 'admin').length;
  }

  function populateBatchFilter() {
    const batches = [...new Set(allUsers.map(u => u.batch).filter(Boolean))];
    const sel = document.getElementById('userBatchFilter');
    if (!sel) return;
    batches.forEach(b => {
      if (!sel.querySelector(`option[value="${b}"]`)) {
        const opt = document.createElement('option');
        opt.value = b;
        opt.textContent = `Batch: ${b}`;
        sel.appendChild(opt);
      }
    });
  }

  function renderUsersTable(users) {
    const container = document.getElementById('usersTableContainer');
    if (!container) return;

    if (!users || users.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon"><i data-lucide="users" style="width:28px;height:28px"></i></div>
          <div class="empty-state-title">No users found</div>
          <div class="empty-state-description">No members match your search.</div>
        </div>
      `;
      if (window.lucide) lucide.createIcons();
      return;
    }

    container.innerHTML = `
      <div class="table-container" style="border:none">
        <table class="table">
          <thead>
            <tr>
              <th>Member</th>
              <th>Role</th>
              <th>Batch</th>
              <th>Enrollment</th>
              <th>GitHub</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${users.map(u => {
              const initials = u.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0,2);
              const roleColor = u.role === 'admin' ? 'var(--accent-secondary)' : 'var(--info)';
              const roleBg = u.role === 'admin' ? 'rgba(124,92,255,0.1)' : 'rgba(64,196,255,0.1)';
              return `
                <tr>
                  <td>
                    <div class="d-flex align-items-center gap-md">
                      <div class="avatar avatar-sm">${initials}</div>
                      <div>
                        <div class="cell-primary" style="cursor:pointer;color:var(--accent-primary)" onclick="viewUserProfile(${u.id})">${u.name}</div>
                        <div style="font-size:0.75rem;color:var(--text-muted)">${u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span style="padding:3px 10px;border-radius:20px;font-size:0.75rem;font-weight:600;background:${roleBg};color:${roleColor};text-transform:capitalize">${u.role}</span>
                  </td>
                  <td style="color:var(--text-secondary)">${u.batch || '—'}</td>
                  <td style="color:var(--text-secondary)">${u.enrollment_id || '—'}</td>
                  <td>
                    ${u.github_username ? `
                    <a href="https://github.com/${u.github_username}" target="_blank" style="display:flex;align-items:center;gap:4px;color:var(--accent-primary);font-size:0.85rem">
                      <i data-lucide="github" style="width:14px;height:14px"></i>
                      ${u.github_username}
                    </a>` : '<span style="color:var(--text-muted)">—</span>'}
                  </td>
                  <td>
                    <div style="display:flex;gap:4px">
                      <button class="btn btn-ghost btn-sm" onclick="editUser(${u.id})" title="Edit">
                        <i data-lucide="pencil" style="width:14px;height:14px"></i>
                      </button>
                      <button class="btn btn-ghost btn-sm" onclick="resetUserPassword(${u.id},'${u.name.replace(/'/g, "\\'")}')" title="Reset Password" style="color:var(--warning)">
                        <i data-lucide="key" style="width:14px;height:14px"></i>
                      </button>
                      <button class="btn btn-ghost btn-sm" onclick="deactivateUser(${u.id},'${u.name.replace(/'/g, "\\'")}')" style="color:var(--error)" title="Deactivate">
                        <i data-lucide="user-x" style="width:14px;height:14px"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;
    if (window.lucide) lucide.createIcons();
  }

  function applyFilters() {
    const search = document.getElementById('userSearch')?.value.toLowerCase() || '';
    const roleFilter = document.getElementById('userRoleFilter')?.value || '';
    const batchFilter = document.getElementById('userBatchFilter')?.value || '';

    const filtered = allUsers.filter(u => {
      const matchSearch = !search || (u.name || '').toLowerCase().includes(search) || (u.email || '').toLowerCase().includes(search) || (u.batch || '').toLowerCase().includes(search);
      const matchRole = !roleFilter || u.role === roleFilter;
      const matchBatch = !batchFilter || u.batch === batchFilter;
      return matchSearch && matchRole && matchBatch;
    });
    renderUsersTable(filtered);
  }

  ['userSearch','userRoleFilter','userBatchFilter'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', applyFilters);
  });

  // Modal
  const overlay = document.getElementById('userModalOverlay');
  function openModal(user = null) {
    editingUserId = user ? user.id : null;
    document.getElementById('userModalTitle').textContent = user ? 'Edit Member' : 'Add Member';
    document.getElementById('userName').value = user?.name || '';
    document.getElementById('userEmail').value = user?.email || '';
    document.getElementById('userRole').value = user?.role || 'student';
    document.getElementById('userBatch').value = user?.batch || '';
    document.getElementById('userEnrollment').value = user?.enrollment_id || '';
    document.getElementById('userGithub').value = user?.github_username || '';
    const skills = (() => { try { return JSON.parse(user?.skills || '[]'); } catch { return []; }})();
    document.getElementById('userSkills').value = skills.join(', ');
    document.getElementById('userSubmitText').textContent = user ? 'Update Member' : 'Add Member';
    const pwdGroup = document.getElementById('passwordGroup');
    if (pwdGroup) pwdGroup.style.display = user ? 'none' : '';
    overlay.style.display = 'flex';
  }
  function closeModal() { overlay.style.display = 'none'; editingUserId = null; }

  document.getElementById('newUserBtn')?.addEventListener('click', () => openModal());
  document.getElementById('userModalClose')?.addEventListener('click', closeModal);
  document.getElementById('userModalCancel')?.addEventListener('click', closeModal);
  overlay?.addEventListener('click', e => { if (e.target === overlay) closeModal(); });

  // Submit
  document.getElementById('userSubmitBtn')?.addEventListener('click', async () => {
    const name = document.getElementById('userName').value.trim();
    const email = document.getElementById('userEmail').value.trim();
    if (!name || !email) { showToast({ message: 'Name and email are required', type: 'warning' }); return; }

    const skillsRaw = document.getElementById('userSkills').value;
    const skills = skillsRaw ? skillsRaw.split(',').map(s => s.trim()).filter(Boolean) : [];

    const payload = {
      name,
      email,
      role: document.getElementById('userRole').value,
      batch: document.getElementById('userBatch').value.trim() || null,
      enrollment_id: document.getElementById('userEnrollment').value.trim() || null,
      github_username: document.getElementById('userGithub').value.trim() || null,
      skills,
    };

    if (!editingUserId) {
      const password = document.getElementById('userPassword').value;
      if (!password) { showToast({ message: 'Password is required for new members', type: 'warning' }); return; }
      payload.password = password;
    }

    const btnText = document.getElementById('userSubmitText');
    const spinner = document.getElementById('userSubmitSpinner');
    btnText.style.display = 'none';
    spinner.style.display = 'inline-block';

    try {
      if (editingUserId) {
        await api.put(`users/${editingUserId}`, payload);
        showToast({ message: 'Member updated!', type: 'success' });
      } else {
        await api.post('users', payload);
        showToast({ message: 'Member added!', type: 'success' });
      }
      closeModal();
      await loadUsers();
    } catch(err) {
      showToast({ message: err.message || 'Failed to save member', type: 'error' });
    } finally {
      btnText.style.display = '';
      spinner.style.display = 'none';
    }
  });

  // Profile view
  const profileOverlay = document.getElementById('profileModalOverlay');
  window.viewUserProfile = async (id) => {
    try {
      const res = await api.get(`users/${id}`);
      const u = res?.data || res;
      const skills = (() => { try { return JSON.parse(u.skills || '[]'); } catch { return []; }})();
      const initials = u.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0,2);

      document.getElementById('profileModalContent').innerHTML = `
        <div class="profile-banner"></div>
        <div class="profile-header">
          <div class="profile-avatar-large">${initials}</div>
          <div style="display:flex;gap:var(--space-sm)">
            ${u.github_username ? `<a href="https://github.com/${u.github_username}" target="_blank" class="btn btn-secondary btn-sm" style="background:var(--bg-primary);border-color:var(--border-color)"><i data-lucide="github" style="width:14px;height:14px"></i>GitHub</a>` : ''}
            ${u.linkedin_url ? `<a href="${u.linkedin_url}" target="_blank" class="btn btn-secondary btn-sm" style="background:var(--bg-primary);border-color:var(--border-color)"><i data-lucide="linkedin" style="width:14px;height:14px"></i>LinkedIn</a>` : ''}
          </div>
        </div>
        
        <div style="padding: 0 var(--space-2xl);">
          <div class="profile-name">${u.name}</div>
          <div class="profile-headline">${u.email} • ${u.role === 'admin' ? 'Administrator' : (u.batch || 'Student')}</div>
          
          <div style="display:flex;gap:12px;margin-top:12px;">
            <span style="padding:4px 12px;border-radius:20px;font-size:0.75rem;font-weight:600;background:rgba(64,196,255,0.1);color:var(--info);">
              <i data-lucide="hash" style="width:12px;height:12px;vertical-align:-2px;margin-right:4px"></i>${u.enrollment_id || 'No ID'}
            </span>
            <span style="padding:4px 12px;border-radius:20px;font-size:0.75rem;font-weight:600;background:rgba(255,171,64,0.1);color:var(--warning);">
              <i data-lucide="star" style="width:12px;height:12px;vertical-align:-2px;margin-right:4px"></i>${u.points || 0} Points
            </span>
          </div>
        </div>

        <div class="profile-stats-grid">
          <div class="profile-stat-box">
            <div class="profile-stat-value">${u.stats?.projects_count || 0}</div>
            <div class="profile-stat-label">Projects</div>
          </div>
          <div class="profile-stat-box">
            <div class="profile-stat-value">${u.stats?.logs_count || 0}</div>
            <div class="profile-stat-label">Daily Logs</div>
          </div>
          <div class="profile-stat-box">
            <div class="profile-stat-value" style="color:${(u.stats?.attendance_percentage || 0) >= 75 ? 'var(--success)' : 'var(--error)'}">${u.stats?.attendance_percentage || 0}%</div>
            <div class="profile-stat-label">Attendance</div>
          </div>
        </div>

        ${skills.length > 0 ? `
        <div class="profile-section" style="margin-top:var(--space-xl)">
          <div class="profile-section-title"><i data-lucide="cpu" style="width:16px;height:16px;color:var(--accent-primary)"></i> Core Skills</div>
          <div style="display:flex;flex-wrap:wrap;gap:8px;">
            ${skills.map(s => `<span class="tag" style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.1);padding:6px 12px;font-size:0.85rem">${s}</span>`).join('')}
          </div>
        </div>` : '<div style="height:32px"></div>'}
      `;
      profileOverlay.style.display = 'flex';
      if (window.lucide) lucide.createIcons({ nodes: [profileOverlay] });
    } catch(err) {
      showToast({ message: 'Failed to load profile', type: 'error' });
    }
  };

  document.getElementById('profileModalClose')?.addEventListener('click', () => profileOverlay.style.display = 'none');
  document.getElementById('profileModalCloseBtn')?.addEventListener('click', () => profileOverlay.style.display = 'none');
  profileOverlay?.addEventListener('click', e => { if (e.target === profileOverlay) profileOverlay.style.display = 'none'; });

  window.editUser = (id) => {
    const u = allUsers.find(u => u.id === id);
    if (u) openModal(u);
  };

  window.deactivateUser = async (id, name) => {
    if (!confirm(`Deactivate ${name}? They will no longer be able to log in.`)) return;
    try {
      await api.delete(`users/${id}`);
      showToast({ message: `${name} deactivated`, type: 'success' });
      await loadUsers();
    } catch(err) {
      showToast({ message: err.message || 'Failed to deactivate', type: 'error' });
    }
  };

  window.resetUserPassword = async (id, name) => {
    const newPassword = prompt(`Enter new password for ${name} (minimum 6 characters):`);
    if (!newPassword) return;
    if (newPassword.length < 6) {
      showToast({ message: 'Password must be at least 6 characters.', type: 'warning' });
      return;
    }
    try {
      await api.post(`users/${id}/reset-password`, { newPassword });
      showToast({ message: `Password for ${name} reset successfully!`, type: 'success' });
    } catch(err) {
      showToast({ message: err.message || 'Failed to reset password', type: 'error' });
    }
  };

  await loadUsers();
}

window.renderUsers = renderUsers;
window.initUsers = initUsers;
