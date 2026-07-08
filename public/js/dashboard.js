/* ============================================================
   C2S VLSI Lab Portal — Dashboard
   Admin & student dashboards with stats, activity, quick actions
   ============================================================ */

function renderDashboard() {
  const user = getUser();
  if (!user) return renderLoginPage();
  return user.role === 'admin' ? renderAdminDashboard(user) : renderStudentDashboard(user);
}

// ── Admin Dashboard ──────────────────────────────────────────

function renderAdminDashboard(user) {
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
  const firstName = user.name.split(' ')[0];

  return `
    <div class="page-enter">
      <div class="page-header">
        <div class="page-header-left">
          <h1 class="page-title animate-slideUp">Welcome back, ${firstName} 👋</h1>
          <p class="page-subtitle animate-slideUp stagger-1">${today}</p>
        </div>
        <div class="page-header-actions animate-slideUp stagger-2">
          <button class="btn btn-secondary" onclick="navigate('/reports')">
            <i data-lucide="bar-chart-3" style="width:16px;height:16px"></i>
            View Reports
          </button>
        </div>
      </div>

      <!-- Stats Row -->
      <div class="grid grid-stats section" id="adminStats">
        <div class="stat-card animate-slideUp stagger-1">
          <div class="stat-card-icon blue">
            <i data-lucide="users" style="width:22px;height:22px"></i>
          </div>
          <div class="stat-card-value" id="statStudents">
            <div class="skeleton skeleton-heading" style="width:60px;height:28px;margin:0"></div>
          </div>
          <div class="stat-card-label">Total Students</div>
        </div>

        <div class="stat-card animate-slideUp stagger-2">
          <div class="stat-card-icon purple">
            <i data-lucide="folder-git-2" style="width:22px;height:22px"></i>
          </div>
          <div class="stat-card-value" id="statProjects">
            <div class="skeleton skeleton-heading" style="width:60px;height:28px;margin:0"></div>
          </div>
          <div class="stat-card-label">Active Projects</div>
        </div>

        <div class="stat-card animate-slideUp stagger-3">
          <div class="stat-card-icon orange">
            <i data-lucide="list-checks" style="width:22px;height:22px"></i>
          </div>
          <div class="stat-card-value" id="statTasks">
            <div class="skeleton skeleton-heading" style="width:60px;height:28px;margin:0"></div>
          </div>
          <div class="stat-card-label">Pending Tasks</div>
        </div>

        <div class="stat-card animate-slideUp stagger-4">
          <div class="stat-card-icon green">
            <i data-lucide="calendar-check" style="width:22px;height:22px"></i>
          </div>
          <div class="stat-card-value" id="statAttendance">
            <div class="skeleton skeleton-heading" style="width:60px;height:28px;margin:0"></div>
          </div>
          <div class="stat-card-label">Today's Attendance</div>
        </div>

        <div class="stat-card animate-slideUp stagger-5">
          <div class="stat-card-icon red">
            <i data-lucide="ticket" style="width:22px;height:22px"></i>
          </div>
          <div class="stat-card-value" id="statTickets">
            <div class="skeleton skeleton-heading" style="width:60px;height:28px;margin:0"></div>
          </div>
          <div class="stat-card-label">Open Tickets</div>
        </div>
      </div>

      <!-- Main Grid -->
      <div class="grid grid-dashboard">
        <!-- Recent Activity -->
        <div class="card animate-slideUp stagger-3">
          <div class="card-header">
            <h4><i data-lucide="activity" style="width:18px;height:18px;vertical-align:-3px;margin-right:8px;color:var(--accent-primary)"></i>Recent Activity</h4>
            <button class="btn btn-ghost btn-sm" onclick="navigate('/daily-logs')">View all</button>
          </div>
          <div class="card-body" id="recentActivity">
            <div class="skeleton skeleton-text" style="width:90%"></div>
            <div class="skeleton skeleton-text" style="width:75%"></div>
            <div class="skeleton skeleton-text" style="width:85%"></div>
            <div class="skeleton skeleton-text" style="width:60%"></div>
            <div class="skeleton skeleton-text" style="width:70%"></div>
          </div>
        </div>

        <!-- Quick Actions -->
        <div class="animate-slideUp stagger-4">
          <div class="section-header" style="margin-bottom:var(--space-md)">
            <h4 class="section-title">Quick Actions</h4>
          </div>
          <div style="display:flex;flex-direction:column;gap:var(--space-md)">
            <div class="quick-action-card" onclick="navigate('/users')">
              <div class="quick-action-icon" style="background:rgba(79,143,255,0.12);color:var(--accent-primary)">
                <i data-lucide="user-plus" style="width:22px;height:22px"></i>
              </div>
              <div>
                <div style="font-weight:600;color:var(--text-primary);font-size:0.9375rem">Add Student</div>
                <div style="font-size:0.8125rem;color:var(--text-muted)">Register a new lab member</div>
              </div>
            </div>

            <div class="quick-action-card" onclick="navigate('/tasks')">
              <div class="quick-action-icon" style="background:rgba(255,171,64,0.12);color:var(--warning)">
                <i data-lucide="plus-circle" style="width:22px;height:22px"></i>
              </div>
              <div>
                <div style="font-weight:600;color:var(--text-primary);font-size:0.9375rem">Create Task</div>
                <div style="font-size:0.8125rem;color:var(--text-muted)">Assign work to students</div>
              </div>
            </div>

            <div class="quick-action-card" onclick="navigate('/announcements')">
              <div class="quick-action-icon" style="background:rgba(124,92,255,0.12);color:var(--accent-secondary)">
                <i data-lucide="megaphone" style="width:22px;height:22px"></i>
              </div>
              <div>
                <div style="font-weight:600;color:var(--text-primary);font-size:0.9375rem">Post Announcement</div>
                <div style="font-size:0.8125rem;color:var(--text-muted)">Broadcast to all students</div>
              </div>
            </div>

            <div class="quick-action-card" onclick="navigate('/pcs')">
              <div class="quick-action-icon" style="background:rgba(0,230,118,0.12);color:var(--success)">
                <i data-lucide="monitor" style="width:22px;height:22px"></i>
              </div>
              <div>
                <div style="font-weight:600;color:var(--text-primary);font-size:0.9375rem">Manage PCs</div>
                <div style="font-size:0.8125rem;color:var(--text-muted)">Lab asset management</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

// ── Student Dashboard ────────────────────────────────────────

function renderStudentDashboard(user) {
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
  const firstName = user.name.split(' ')[0];

  return `
    <div class="page-enter">
      <div class="page-header">
        <div class="page-header-left">
          <h1 class="page-title animate-slideUp">Hey, ${firstName} 👋</h1>
          <p class="page-subtitle animate-slideUp stagger-1">${today}</p>
        </div>
      </div>

      <!-- Stats Row -->
      <div class="grid grid-stats section" id="studentStats">
        <div class="stat-card animate-slideUp stagger-1">
          <div class="stat-card-icon purple">
            <i data-lucide="folder-git-2" style="width:22px;height:22px"></i>
          </div>
          <div class="stat-card-value" id="statMyProjects">
            <div class="skeleton skeleton-heading" style="width:60px;height:28px;margin:0"></div>
          </div>
          <div class="stat-card-label">My Projects</div>
        </div>

        <div class="stat-card animate-slideUp stagger-2">
          <div class="stat-card-icon orange">
            <i data-lucide="clock" style="width:22px;height:22px"></i>
          </div>
          <div class="stat-card-value" id="statTasksDue">
            <div class="skeleton skeleton-heading" style="width:60px;height:28px;margin:0"></div>
          </div>
          <div class="stat-card-label">Tasks Due</div>
        </div>

        <div class="stat-card animate-slideUp stagger-3">
          <div class="stat-card-icon green">
            <i data-lucide="calendar-check" style="width:22px;height:22px"></i>
          </div>
          <div class="stat-card-value" id="statMyAttendance">
            <div class="skeleton skeleton-heading" style="width:60px;height:28px;margin:0"></div>
          </div>
          <div class="stat-card-label">Attendance %</div>
        </div>

        <div class="stat-card animate-slideUp stagger-4">
          <div class="stat-card-icon cyan">
            <i data-lucide="ticket" style="width:22px;height:22px"></i>
          </div>
          <div class="stat-card-value" id="statMyTickets">
            <div class="skeleton skeleton-heading" style="width:60px;height:28px;margin:0"></div>
          </div>
          <div class="stat-card-label">My Tickets</div>
        </div>
      </div>

      <!-- Quick Log CTA -->
      <div class="card animate-slideUp stagger-3" style="margin-bottom:var(--space-xl);background:linear-gradient(135deg, rgba(79,143,255,0.1) 0%, rgba(124,92,255,0.1) 100%);border-color:rgba(79,143,255,0.2);cursor:pointer" onclick="navigate('/daily-logs')">
        <div class="card-body" style="display:flex;align-items:center;gap:var(--space-lg);padding:var(--space-xl)">
          <div style="width:56px;height:56px;border-radius:var(--border-radius);background:var(--accent-gradient);display:flex;align-items:center;justify-content:center;flex-shrink:0;box-shadow:0 4px 16px rgba(79,143,255,0.25)">
            <i data-lucide="notebook-pen" style="width:26px;height:26px;color:#fff"></i>
          </div>
          <div style="flex:1">
            <h3 style="margin-bottom:4px">Log Today's Work</h3>
            <p style="margin:0;color:var(--text-muted);font-size:0.875rem">Document what you worked on today — keep your progress tracked!</p>
          </div>
          <i data-lucide="arrow-right" style="width:22px;height:22px;color:var(--accent-primary);flex-shrink:0"></i>
        </div>
      </div>

      <div class="grid grid-dashboard">
        <!-- Assigned Tasks -->
        <div class="card animate-slideUp stagger-4">
          <div class="card-header">
            <h4><i data-lucide="list-checks" style="width:18px;height:18px;vertical-align:-3px;margin-right:8px;color:var(--warning)"></i>My Tasks</h4>
            <button class="btn btn-ghost btn-sm" onclick="navigate('/tasks')">View all</button>
          </div>
          <div class="card-body" id="myTasks">
            <div class="skeleton skeleton-text" style="width:90%"></div>
            <div class="skeleton skeleton-text" style="width:75%"></div>
            <div class="skeleton skeleton-text" style="width:85%"></div>
          </div>
        </div>

        <!-- Recent Announcements & PCs -->
        <div style="display:flex;flex-direction:column;gap:var(--space-lg)">
          <div class="card animate-slideUp stagger-5">
            <div class="card-header">
              <h4><i data-lucide="megaphone" style="width:18px;height:18px;vertical-align:-3px;margin-right:8px;color:var(--accent-secondary)"></i>Announcements</h4>
            </div>
            <div class="card-body" id="recentAnnouncements">
              <div class="skeleton skeleton-text" style="width:80%"></div>
              <div class="skeleton skeleton-text" style="width:65%"></div>
            </div>
          </div>

          <div class="card animate-slideUp stagger-6">
            <div class="card-header">
              <h4><i data-lucide="monitor" style="width:18px;height:18px;vertical-align:-3px;margin-right:8px;color:var(--success)"></i>My PCs</h4>
            </div>
            <div class="card-body" id="myPCs">
              <div class="skeleton skeleton-text" style="width:70%"></div>
              <div class="skeleton skeleton-text" style="width:55%"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

// ── Initialize Dashboard (fetch data) ────────────────────────

async function initDashboard() {
  const user = getUser();
  if (!user) return;

  if (user.role === 'admin') {
    await loadAdminDashboard();
  } else {
    await loadStudentDashboard();
  }
}

async function loadAdminDashboard() {
  // Fetch all stats in parallel, gracefully handle failures
  const [students, projects, tasks, attendance, tickets, logs] = await Promise.allSettled([
    api.get('users?role=student').catch(() => []),
    api.get('projects').catch(() => []),
    api.get('tasks').catch(() => []),
    api.get('attendance/today').catch(() => null),
    api.get('tickets').catch(() => []),
    api.get('daily-logs').catch(() => []),
  ]);

  const val = (result) => result.status === 'fulfilled' ? result.value : null;
  // Extract .data from { success, data } responses, or use raw array
  const extract = (v) => {
    if (!v) return [];
    if (Array.isArray(v)) return v;
    if (v.data && Array.isArray(v.data)) return v.data;
    return [];
  };

  // Populate stats
  const studentsData = extract(val(students));
  const projectsData = extract(val(projects));
  const tasksData = extract(val(tasks));
  const attendanceRaw = val(attendance);
  const ticketsData = extract(val(tickets));
  const logsData = extract(val(logs));

  animateStat('statStudents', studentsData.length);
  animateStat('statProjects', projectsData.filter(p => p.status === 'active').length);
  const pendingTasks = tasksData.filter(t => t.status !== 'completed');
  animateStat('statTasks', pendingTasks.length);

  // attendance/today returns { data: { present: [], absent: [], summary: { present_count, absent_count, total_students } } }
  let presentCount = 0, totalCount = studentsData.length;
  if (attendanceRaw && attendanceRaw.data && attendanceRaw.data.summary) {
    presentCount = attendanceRaw.data.summary.present_count || 0;
    totalCount = attendanceRaw.data.summary.total_students || totalCount;
  } else if (attendanceRaw && attendanceRaw.data && Array.isArray(attendanceRaw.data.present)) {
    presentCount = attendanceRaw.data.present.length;
  }
  animateStat('statAttendance', `${presentCount}/${totalCount}`);

  const openTickets = ticketsData.filter(t => t.status === 'open' || t.status === 'in_progress');
  animateStat('statTickets', openTickets.length);

  // Recent activity
  const activityEl = document.getElementById('recentActivity');
  if (activityEl) {
    const logsList = logsData.slice(0, 5);
    if (logsList.length > 0) {
      activityEl.innerHTML = logsList.map(log => `
        <div class="activity-item">
          <div class="activity-dot" style="background:var(--accent-primary)"></div>
          <div class="activity-content">
            <div class="activity-text">
              <strong>${log.user_name || log.user?.name || 'Student'}</strong> logged work
              ${log.category ? `— <em>${log.category}</em>` : ''}
            </div>
            <div class="activity-time">${formatTimeAgo(log.log_date || log.created_at)}</div>
          </div>
        </div>
      `).join('');
    } else {
      activityEl.innerHTML = `
        <div class="empty-state" style="padding:var(--space-lg)">
          <div class="empty-state-icon" style="width:48px;height:48px;margin-bottom:var(--space-md)">
            <i data-lucide="inbox" style="width:24px;height:24px"></i>
          </div>
          <div class="empty-state-description">No recent activity yet</div>
        </div>
      `;
    }
    if (window.lucide) lucide.createIcons({ nodes: [activityEl] });
  }
}

async function loadStudentDashboard() {
  const user = getUser();

  const [projects, tasks, attendance, tickets, announcements, pcs] = await Promise.allSettled([
    api.get('projects/my').catch(() => []),
    api.get('tasks/my').catch(() => []),
    api.get('attendance/my').catch(() => []),
    api.get('tickets/my').catch(() => []),
    api.get('announcements').catch(() => []),
    api.get('pcs/my').catch(() => []),
  ]);

  const val = (r) => r.status === 'fulfilled' ? r.value : null;
  const extract = (v) => {
    if (!v) return [];
    if (Array.isArray(v)) return v;
    if (v.data && Array.isArray(v.data)) return v.data;
    return [];
  };

  const projectsData = extract(val(projects));
  const tasksData = extract(val(tasks));
  const attendanceList = extract(val(attendance));
  const ticketsData = extract(val(tickets));
  const announcementsData = extract(val(announcements));
  const pcsData = extract(val(pcs));

  animateStat('statMyProjects', projectsData.length);

  const dueTasks = tasksData.filter(t => t.status !== 'completed' && t.status !== 'done');
  animateStat('statTasksDue', dueTasks.length);

  // Calculate attendance percentage from records (exclude leave days)
  const totalAtt = attendanceList.filter(a => a.status !== 'on_leave').length;
  const presentAtt = attendanceList.filter(a => a.status === 'present' || a.status === 'late').length;
  const attPct = totalAtt > 0 ? Math.round((presentAtt / totalAtt) * 100) : (attendanceList.length > 0 ? 100 : 0);
  animateStat('statMyAttendance', `${attPct}%`);

  animateStat('statMyTickets', ticketsData.length);

  // My Tasks
  const tasksEl = document.getElementById('myTasks');
  if (tasksEl) {
    if (dueTasks.length > 0) {
      tasksEl.innerHTML = dueTasks.slice(0, 5).map(task => {
        const priorityClass = task.priority ? `badge-priority-${task.priority}` : 'badge-info';
        const statusBadge = getStatusBadge(task.status);
        return `
          <div class="activity-item" style="cursor:pointer" onclick="navigate('/tasks')">
            <div class="activity-dot" style="background:${getPriorityColor(task.priority)}"></div>
            <div class="activity-content">
              <div class="activity-text"><strong>${task.title || task.name || 'Task'}</strong></div>
              <div style="display:flex;gap:var(--space-sm);margin-top:4px">
                <span class="badge ${priorityClass}">${task.priority || 'normal'}</span>
                ${statusBadge}
              </div>
            </div>
          </div>
        `;
      }).join('');
    } else {
      tasksEl.innerHTML = `
        <div class="empty-state" style="padding:var(--space-md)">
          <div style="color:var(--text-muted);font-size:0.875rem">🎉 No pending tasks!</div>
        </div>
      `;
    }
  }

  // Announcements
  const annEl = document.getElementById('recentAnnouncements');
  if (annEl) {
    const annList = announcementsData.slice(0, 3);
    if (annList.length > 0) {
      annEl.innerHTML = annList.slice(0, 3).map(ann => `
        <div class="activity-item">
          <div class="activity-dot" style="background:var(--accent-secondary)"></div>
          <div class="activity-content">
            <div class="activity-text"><strong>${ann.title || 'Announcement'}</strong></div>
            <div class="activity-time">${formatTimeAgo(ann.created_at || ann.date)}</div>
          </div>
        </div>
      `).join('');
    } else {
      annEl.innerHTML = `<div style="color:var(--text-muted);font-size:0.875rem;text-align:center;padding:var(--space-md)">No announcements</div>`;
    }
  }

  // My PCs
  const pcsEl = document.getElementById('myPCs');
  if (pcsEl) {
    const pcList = pcsData;
    if (pcList.length > 0) {
      pcsEl.innerHTML = pcList.map(pc => `
        <div style="display:flex;align-items:center;gap:var(--space-md);padding:var(--space-sm) 0">
          <i data-lucide="monitor" style="width:18px;height:18px;color:var(--success)"></i>
          <div>
            <div style="font-size:0.875rem;font-weight:500;color:var(--text-primary)">${pc.pc_name || pc.name || 'PC'}</div>
            <div style="font-size:0.75rem;color:var(--text-muted)">${pc.specs || ''}</div>
          </div>
        </div>
      `).join('');
      if (window.lucide) lucide.createIcons({ nodes: [pcsEl] });
    } else {
      pcsEl.innerHTML = `<div style="color:var(--text-muted);font-size:0.875rem;text-align:center;padding:var(--space-md)">No PCs assigned</div>`;
    }
  }
}

// ── Helpers ──────────────────────────────────────────────────

function animateStat(id, value) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = value;
  el.style.animation = 'none';
  el.offsetHeight; // trigger reflow
  el.style.animation = 'slideUp 0.4s ease both';
}

function formatTimeAgo(dateStr) {
  if (!dateStr) return '';
  const now = new Date();
  const date = new Date(dateStr);
  const diff = Math.floor((now - date) / 1000);

  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getPriorityColor(priority) {
  const colors = {
    low: 'var(--priority-low)',
    medium: 'var(--priority-medium)',
    high: 'var(--priority-high)',
    critical: 'var(--priority-critical)',
  };
  return colors[priority] || 'var(--accent-primary)';
}

function getStatusBadge(status) {
  const map = {
    pending: '<span class="badge badge-warning">Pending</span>',
    'in-progress': '<span class="badge badge-info">In Progress</span>',
    'in_progress': '<span class="badge badge-info">In Progress</span>',
    review: '<span class="badge badge-purple">Review</span>',
    completed: '<span class="badge badge-success">Done</span>',
    done: '<span class="badge badge-success">Done</span>',
  };
  return map[status] || `<span class="badge badge-info">${status || 'unknown'}</span>`;
}

// ── Global ────────────────────────────────────────────────────
window.renderDashboard = renderDashboard;
window.initDashboard = initDashboard;
