/* ============================================================
   C2S VLSI Lab Portal — Sidebar Navigation
   Renders sidebar with nav items, user info, active states
   ============================================================ */

function renderSidebar() {
  const user = getUser();
  const isAdminUser = user && user.role === 'admin';
  const currentPath = window.location.pathname;
  const initials = user
    ? user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : '??';

  const navItem = (icon, label, path, badge) => {
    const active = currentPath === path || (path !== '/' && currentPath.startsWith(path));
    return `
      <button class="nav-item ${active ? 'active' : ''}" onclick="navigate('${path}')">
        <i data-lucide="${icon}" class="nav-item-icon"></i>
        <span>${label}</span>
        ${badge ? `<span class="nav-item-badge">${badge}</span>` : ''}
      </button>
    `;
  };

  return `
    <!-- Mobile menu toggle -->
    <button class="menu-toggle" id="menuToggle" aria-label="Toggle navigation">
      <i data-lucide="menu" style="width:22px;height:22px"></i>
    </button>

    <!-- Sidebar overlay (mobile) -->
    <div class="sidebar-overlay" id="sidebarOverlay"></div>

    <!-- Sidebar -->
    <aside class="sidebar" id="sidebar">
      <div class="sidebar-header">
        <div class="sidebar-logo">
          <i data-lucide="cpu" style="width:22px;height:22px"></i>
        </div>
        <div class="sidebar-brand">
          <span class="sidebar-brand-name">C2S VLSI</span>
          <span class="sidebar-brand-sub">Lab Portal</span>
        </div>
      </div>

      <nav class="sidebar-nav">
        <span class="nav-section">Main</span>
        ${navItem('layout-dashboard', 'Dashboard', '/dashboard')}

        <span class="nav-section">Work</span>
        ${navItem('notebook-pen', 'Daily Logs', '/daily-logs')}
        ${navItem('folder-git-2', 'Projects', '/projects')}
        ${navItem('list-checks', 'Tasks', '/tasks')}

        <span class="nav-section">Lab</span>
        ${navItem('monitor', 'PCs & Assets', '/pcs')}
        ${navItem('ticket', 'Tickets', '/tickets')}

        <span class="nav-section">Tracking</span>
        ${navItem('calendar-check', 'Attendance', '/attendance')}

        ${isAdminUser ? `
          <span class="nav-section">Admin</span>
          ${navItem('users', 'Users', '/users')}
          ${navItem('megaphone', 'Announcements', '/announcements')}
          ${navItem('bar-chart-3', 'Reports', '/reports')}
        ` : ''}

        <span class="nav-section">Account</span>
        ${navItem('user-circle', 'My Profile', '/profile')}
      </nav>

      <div class="sidebar-footer">
        <div class="sidebar-user">
          <div class="avatar avatar-sm">${initials}</div>
          <div class="sidebar-user-info">
            <div class="sidebar-user-name">${user ? user.name : 'User'}</div>
            <div class="sidebar-user-role">${user ? user.role : ''}</div>
          </div>
          <button class="sidebar-logout" id="logoutBtn" title="Logout" aria-label="Logout">
            <i data-lucide="log-out" style="width:18px;height:18px"></i>
          </button>
        </div>
      </div>
    </aside>
  `;
}

function initSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebarOverlay');

  function openSidebar() {
    if (sidebar) sidebar.classList.add('is-open');
    if (overlay) overlay.classList.add('is-open');
  }

  function closeSidebar() {
    if (sidebar) sidebar.classList.remove('is-open');
    if (overlay) overlay.classList.remove('is-open');
  }

  // Floating toggle (fixed position, visible at 1024px+)
  const menuToggle = document.getElementById('menuToggle');
  if (menuToggle) {
    menuToggle.addEventListener('click', () => {
      sidebar.classList.contains('is-open') ? closeSidebar() : openSidebar();
    });
  }

  // Inline toggle (inside top header bar — primary on mobile)
  const menuToggleInline = document.getElementById('menuToggleInline');
  if (menuToggleInline) {
    menuToggleInline.addEventListener('click', () => {
      sidebar.classList.contains('is-open') ? closeSidebar() : openSidebar();
    });
  }

  // Close when tapping the overlay
  if (overlay) {
    overlay.addEventListener('click', closeSidebar);
  }

  // Close sidebar on nav item click (mobile UX — page changes)
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
      if (window.innerWidth <= 1024) closeSidebar();
    });
  });

  // Logout
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      clearAuth();
      navigate('/login');
      showToast({ message: 'Logged out successfully', type: 'info' });
    });
  }
}

// ── Global ────────────────────────────────────────────────────
window.renderSidebar = renderSidebar;
window.initSidebar = initSidebar;
