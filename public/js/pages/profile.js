/* ============================================================
   C2S VLSI Lab Portal — Profile Page
   View and edit your own profile, change password
   ============================================================ */

function renderProfile() {
  const user = getUser();
  if (!user) return '';

  const initials = user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  return `
    <div class="page-enter">
      <div class="page-header">
        <div class="page-header-left">
          <h1 class="page-title animate-slideUp">
            <i data-lucide="user-circle" style="width:28px;height:28px;vertical-align:-4px;margin-right:10px;color:var(--accent-primary)"></i>
            My Profile
          </h1>
          <p class="page-subtitle animate-slideUp stagger-1">Your account information and settings</p>
        </div>
      </div>

      <div class="grid" style="grid-template-columns:1fr 2fr;gap:var(--space-lg);align-items:start">

        <!-- Profile Card -->
        <div style="display:flex;flex-direction:column;gap:var(--space-lg)">
          <div class="card animate-slideUp stagger-2" style="text-align:center">
            <div class="card-body" style="padding:var(--space-xl)">
              <div class="avatar avatar-xl" style="width:80px;height:80px;font-size:1.75rem;margin:0 auto var(--space-lg)">${initials}</div>
              <h3 style="margin:0 0 4px" id="profileDisplayName">${user.name}</h3>
              <div style="color:var(--text-muted);font-size:0.875rem;margin-bottom:var(--space-sm)" id="profileDisplayEmail">${user.email}</div>
              <span style="padding:4px 12px;border-radius:20px;font-size:0.78rem;font-weight:600;background:rgba(64,196,255,0.1);color:var(--info);text-transform:capitalize" id="profileDisplayRole">${user.role}</span>

              <div id="profileBadges" style="margin-top:var(--space-lg);display:flex;flex-direction:column;gap:var(--space-sm);text-align:left"></div>
            </div>
          </div>

          <!-- Stats Card -->
          <div class="card animate-slideUp stagger-3">
            <div class="card-header">
              <h4><i data-lucide="activity" style="width:16px;height:16px;vertical-align:-2px;margin-right:6px;color:var(--accent-primary)"></i>My Stats</h4>
            </div>
            <div class="card-body" id="profileStats">
              <div class="skeleton skeleton-text" style="width:80%"></div>
              <div class="skeleton skeleton-text" style="width:65%"></div>
              <div class="skeleton skeleton-text" style="width:70%"></div>
            </div>
          </div>
        </div>

        <!-- Edit Forms -->
        <div style="display:flex;flex-direction:column;gap:var(--space-lg)">

          <!-- Edit Info -->
          <div class="card animate-slideUp stagger-3">
            <div class="card-header">
              <h4><i data-lucide="pencil" style="width:16px;height:16px;vertical-align:-2px;margin-right:6px;color:var(--text-muted)"></i>Personal Information</h4>
            </div>
            <div class="card-body">
              <form id="profileInfoForm">
                <div class="grid grid-2" style="gap:var(--space-md)">
                  <div class="form-group" style="grid-column:1/-1">
                    <label class="form-label">Full Name</label>
                    <input type="text" class="form-input" id="profileName" placeholder="Your full name" />
                  </div>
                  <div class="form-group" style="grid-column:1/-1">
                    <label class="form-label">Email</label>
                    <input type="email" class="form-input" id="profileEmail" placeholder="your@email.com" />
                  </div>
                  <div class="form-group">
                    <label class="form-label">GitHub Username</label>
                    <input type="text" class="form-input" id="profileGithub" placeholder="@username" />
                  </div>
                  <div class="form-group">
                    <label class="form-label">LinkedIn URL</label>
                    <input type="url" class="form-input" id="profileLinkedin" placeholder="https://linkedin.com/in/..." />
                  </div>
                  <div class="form-group" style="grid-column:1/-1">
                    <label class="form-label">Skills (comma separated)</label>
                    <input type="text" class="form-input" id="profileSkills" placeholder="e.g. Verilog, SPICE, Cadence Virtuoso, FPGA" />
                  </div>
                  <div class="form-group" style="grid-column:1/-1">
                    <label class="form-label">Bio</label>
                    <textarea class="form-textarea" id="profileBio" rows="3" placeholder="Tell us about your research interests..."></textarea>
                  </div>
                </div>
                <div style="display:flex;justify-content:flex-end;margin-top:var(--space-md)">
                  <button type="button" class="btn btn-primary" id="saveInfoBtn">
                    <span id="saveInfoText">Save Changes</span>
                    <div class="spinner" id="saveInfoSpinner" style="display:none"></div>
                  </button>
                </div>
              </form>
            </div>
          </div>

          <!-- Change Password -->
          <div class="card animate-slideUp stagger-4">
            <div class="card-header">
              <h4><i data-lucide="lock" style="width:16px;height:16px;vertical-align:-2px;margin-right:6px;color:var(--text-muted)"></i>Change Password</h4>
            </div>
            <div class="card-body">
              <form id="profilePasswordForm">
                <div class="form-group">
                  <label class="form-label">Current Password</label>
                  <input type="password" class="form-input" id="currentPassword" placeholder="Enter current password" />
                </div>
                <div class="grid grid-2" style="gap:var(--space-md)">
                  <div class="form-group">
                    <label class="form-label">New Password</label>
                    <input type="password" class="form-input" id="newPassword" placeholder="New password" />
                  </div>
                  <div class="form-group">
                    <label class="form-label">Confirm Password</label>
                    <input type="password" class="form-input" id="confirmPassword" placeholder="Confirm new password" />
                  </div>
                </div>
                <div style="display:flex;justify-content:flex-end;margin-top:var(--space-md)">
                  <button type="button" class="btn btn-secondary" id="changePasswordBtn">
                    <span id="changePwdText">Change Password</span>
                    <div class="spinner" id="changePwdSpinner" style="display:none"></div>
                  </button>
                </div>
              </form>
            </div>
          </div>

          <!-- Danger Zone -->
          <div class="card animate-slideUp stagger-5" style="border-color:rgba(255,82,82,0.2)">
            <div class="card-header">
              <h4 style="color:var(--error)"><i data-lucide="alert-triangle" style="width:16px;height:16px;vertical-align:-2px;margin-right:6px"></i>Session</h4>
            </div>
            <div class="card-body">
              <p style="color:var(--text-muted);font-size:0.875rem;margin-bottom:var(--space-lg)">Sign out of your account on this device.</p>
              <button class="btn btn-secondary" style="border-color:rgba(255,82,82,0.3);color:var(--error)" onclick="logoutUser()">
                <i data-lucide="log-out" style="width:16px;height:16px"></i>
                Sign Out
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  `;
}

async function initProfile() {
  const user = getUser();
  if (!user) return;

  // Load full profile from server
  let profileData = null;
  try {
    const res = await api.get(`users/${user.id}`);
    profileData = res?.data || res;
  } catch(e) {
    profileData = user;
  }

  if (!profileData) profileData = user;

  // Populate form fields
  document.getElementById('profileName').value = profileData.name || '';
  document.getElementById('profileEmail').value = profileData.email || '';
  document.getElementById('profileGithub').value = profileData.github_username || '';
  document.getElementById('profileLinkedin').value = profileData.linkedin_url || '';

  const skills = (() => {
    try { return JSON.parse(profileData.skills || '[]'); } catch { return []; }
  })();
  document.getElementById('profileSkills').value = skills.join(', ');
  document.getElementById('profileBio').value = profileData.bio || '';

  // Profile badges (batch, enrollment)
  const badgesEl = document.getElementById('profileBadges');
  if (badgesEl) {
    const items = [];
    if (profileData.batch) items.push(`<div style="display:flex;align-items:center;gap:8px;padding:var(--space-sm);background:rgba(255,255,255,0.03);border-radius:var(--border-radius-sm);border:1px solid var(--border-color)"><i data-lucide="graduation-cap" style="width:14px;height:14px;color:var(--accent-secondary)"></i><span style="font-size:0.8125rem;color:var(--text-secondary)">Batch: <strong>${profileData.batch}</strong></span></div>`);
    if (profileData.enrollment_id) items.push(`<div style="display:flex;align-items:center;gap:8px;padding:var(--space-sm);background:rgba(255,255,255,0.03);border-radius:var(--border-radius-sm);border:1px solid var(--border-color)"><i data-lucide="id-card" style="width:14px;height:14px;color:var(--info)"></i><span style="font-size:0.8125rem;color:var(--text-secondary)">ID: <strong>${profileData.enrollment_id}</strong></span></div>`);
    if (profileData.github_username) items.push(`<a href="https://github.com/${profileData.github_username}" target="_blank" style="display:flex;align-items:center;gap:8px;padding:var(--space-sm);background:rgba(255,255,255,0.03);border-radius:var(--border-radius-sm);border:1px solid var(--border-color);text-decoration:none"><i data-lucide="github" style="width:14px;height:14px;color:var(--text-muted)"></i><span style="font-size:0.8125rem;color:var(--accent-primary)">@${profileData.github_username}</span></a>`);
    badgesEl.innerHTML = items.join('');
    if (window.lucide) lucide.createIcons({ nodes: [badgesEl] });
  }

  // Skills display
  if (skills.length > 0) {
    // Display under name if needed — nothing extra needed
  }

  // Stats
  const statsEl = document.getElementById('profileStats');
  if (statsEl) {
    try {
      const [projRes, tasksRes, logsRes, attRes] = await Promise.allSettled([
        api.get('projects/my').catch(() => api.get('projects').catch(() => [])),
        api.get('tasks/my').catch(() => []),
        api.get('daily-logs/my').catch(() => []),
        api.get('attendance/my').catch(() => { return { percentage: 0 }; }),
      ]);

      const val = r => r.status === 'fulfilled' ? r.value : null;
      const projects = val(projRes);
      const tasks = val(tasksRes);
      const logs = val(logsRes);
      const att = val(attRes);

      const projectCount = Array.isArray(projects) ? projects.length : 0;
      const completedTasks = Array.isArray(tasks) ? tasks.filter(t => t.status === 'completed').length : 0;
      const totalTasks = Array.isArray(tasks) ? tasks.length : 0;
      const logCount = Array.isArray(logs) ? logs.length : 0;
      const attPct = att?.percentage ?? att?.percent ?? 0;

      statsEl.innerHTML = `
        <div style="display:flex;flex-direction:column;gap:var(--space-md)">
          <div style="display:flex;justify-content:space-between;align-items:center;padding:var(--space-sm) 0;border-bottom:1px solid var(--border-color)">
            <div style="display:flex;align-items:center;gap:var(--space-sm);color:var(--text-muted);font-size:0.875rem">
              <i data-lucide="folder-git-2" style="width:16px;height:16px;color:var(--accent-secondary)"></i>Projects
            </div>
            <strong style="color:var(--text-primary)">${projectCount}</strong>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;padding:var(--space-sm) 0;border-bottom:1px solid var(--border-color)">
            <div style="display:flex;align-items:center;gap:var(--space-sm);color:var(--text-muted);font-size:0.875rem">
              <i data-lucide="list-checks" style="width:16px;height:16px;color:var(--warning)"></i>Tasks Done
            </div>
            <strong style="color:var(--success)">${completedTasks}<span style="color:var(--text-muted);font-weight:400">/${totalTasks}</span></strong>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;padding:var(--space-sm) 0;border-bottom:1px solid var(--border-color)">
            <div style="display:flex;align-items:center;gap:var(--space-sm);color:var(--text-muted);font-size:0.875rem">
              <i data-lucide="notebook-pen" style="width:16px;height:16px;color:var(--accent-primary)"></i>Daily Logs
            </div>
            <strong style="color:var(--text-primary)">${logCount}</strong>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;padding:var(--space-sm) 0">
            <div style="display:flex;align-items:center;gap:var(--space-sm);color:var(--text-muted);font-size:0.875rem">
              <i data-lucide="calendar-check" style="width:16px;height:16px;color:var(--success)"></i>Attendance
            </div>
            <strong style="color:${attPct >= 75 ? 'var(--success)' : attPct >= 50 ? 'var(--warning)' : 'var(--error)'}">${Math.round(attPct)}%</strong>
          </div>
          ${skills.length > 0 ? `
          <div style="padding-top:var(--space-md);border-top:1px solid var(--border-color)">
            <div style="font-size:0.75rem;color:var(--text-muted);margin-bottom:var(--space-sm)">Skills</div>
            <div style="display:flex;flex-wrap:wrap;gap:var(--space-xs)">
              ${skills.map(s => `<span class="tag">${s}</span>`).join('')}
            </div>
          </div>` : ''}
        </div>
      `;
      if (window.lucide) lucide.createIcons({ nodes: [statsEl] });
    } catch(e) {
      statsEl.innerHTML = `<div style="color:var(--text-muted);font-size:0.875rem">Could not load stats.</div>`;
    }
  }

  // Save info
  document.getElementById('saveInfoBtn')?.addEventListener('click', async () => {
    const name = document.getElementById('profileName').value.trim();
    const email = document.getElementById('profileEmail').value.trim();
    if (!name || !email) { showToast({ message: 'Name and email are required', type: 'warning' }); return; }

    const skillsRaw = document.getElementById('profileSkills').value;
    const skills = skillsRaw ? skillsRaw.split(',').map(s => s.trim()).filter(Boolean) : [];

    const payload = {
      name,
      email,
      github_username: document.getElementById('profileGithub').value.trim() || null,
      linkedin_url: document.getElementById('profileLinkedin').value.trim() || null,
      skills,
      bio: document.getElementById('profileBio').value.trim() || null,
    };

    const btnText = document.getElementById('saveInfoText');
    const spinner = document.getElementById('saveInfoSpinner');
    btnText.style.display = 'none';
    spinner.style.display = 'inline-block';

    try {
      await api.put(`users/${user.id}`, payload);

      // Update stored user data
      const stored = getUser();
      if (stored) {
        stored.name = name;
        stored.email = email;
        localStorage.setItem('vlsi_user', JSON.stringify(stored));
      }

      // Update displayed name
      document.getElementById('profileDisplayName').textContent = name;
      document.getElementById('profileDisplayEmail').textContent = email;

      showToast({ message: 'Profile updated!', type: 'success' });
    } catch(err) {
      showToast({ message: err.message || 'Failed to update profile', type: 'error' });
    } finally {
      btnText.style.display = '';
      spinner.style.display = 'none';
    }
  });

  // Change password
  document.getElementById('changePasswordBtn')?.addEventListener('click', async () => {
    const current = document.getElementById('currentPassword').value;
    const newPwd = document.getElementById('newPassword').value;
    const confirm = document.getElementById('confirmPassword').value;

    if (!current || !newPwd) { showToast({ message: 'Please fill in all password fields', type: 'warning' }); return; }
    if (newPwd !== confirm) { showToast({ message: 'New passwords do not match', type: 'error' }); return; }
    if (newPwd.length < 6) { showToast({ message: 'Password must be at least 6 characters', type: 'warning' }); return; }

    const btnText = document.getElementById('changePwdText');
    const spinner = document.getElementById('changePwdSpinner');
    btnText.style.display = 'none';
    spinner.style.display = 'inline-block';

    try {
      await api.post('auth/change-password', { oldPassword: current, newPassword: newPwd });
      showToast({ message: 'Password changed successfully!', type: 'success' });
      document.getElementById('currentPassword').value = '';
      document.getElementById('newPassword').value = '';
      document.getElementById('confirmPassword').value = '';
    } catch(err) {
      showToast({ message: err.message || 'Failed to change password', type: 'error' });
    } finally {
      btnText.style.display = '';
      spinner.style.display = 'none';
    }
  });

  // Logout
  window.logoutUser = () => {
    clearAuth();
    navigate('/login');
    showToast({ message: 'Logged out successfully', type: 'info' });
  };
}

window.renderProfile = renderProfile;
window.initProfile = initProfile;
