/* ============================================================
   C2S VLSI Lab Portal — SPA Router & App Controller
   Client-side routing, page rendering, auth guards
   ============================================================ */

// ── Placeholder Page Renderer ─────────────────────────────────

function renderPlaceholderPage(title, icon, description) {
  return `
    <div class="page-enter">
      <div class="page-header">
        <div class="page-header-left">
          <h1 class="page-title animate-slideUp">${title}</h1>
          <p class="page-subtitle animate-slideUp stagger-1">${description || 'This module is under development.'}</p>
        </div>
      </div>
      <div class="card animate-slideUp stagger-2">
        <div class="card-body">
          <div class="empty-state">
            <div class="empty-state-icon">
              <i data-lucide="${icon || 'construction'}" style="width:28px;height:28px"></i>
            </div>
            <div class="empty-state-title">Coming Soon</div>
            <div class="empty-state-description">
              This feature is being built and will be available shortly. Check back soon!
            </div>
            <button class="btn btn-secondary" onclick="navigate('/dashboard')">
              <i data-lucide="arrow-left" style="width:16px;height:16px"></i>
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}

// ── Route Definitions ─────────────────────────────────────────

const routes = {
  '/login':          { render: renderLoginPage,    init: initLoginPage,    auth: false },
  '/dashboard':      { render: renderDashboard,    init: initDashboard,    auth: true  },
  '/daily-logs':     { render: renderDailyLogs,    init: initDailyLogs,    auth: true  },
  '/projects':       { render: renderProjects,     init: initProjects,     auth: true  },
  '/tasks':          { render: renderTasks,        init: initTasks,        auth: true  },
  '/pcs':            { render: renderPCs,          init: initPCs,          auth: true  },
  '/attendance':     { render: renderAttendance,   init: initAttendance,   auth: true  },
  '/profile':        { render: renderProfile,      init: initProfile,      auth: true  },
  '/users':          { render: renderUsers,        init: initUsers,        auth: true, admin: true },
  '/tickets':        { render: renderTickets,      init: initTickets,      auth: true  },
  '/announcements':  { render: renderAnnouncements,init: initAnnouncements,auth: true  },
  '/reports':        { render: renderReports,      init: initReports,      auth: true, admin: true },
  '/public/projects':{ render: renderPublicProjects,init:initPublicProjects,auth: false },
  '/public/project': { render: renderPublicProject,init: initPublicProject,auth: false }
};

// ── Navigation ────────────────────────────────────────────────

function navigate(path) {
  if (window.location.pathname !== path) {
    history.pushState(null, '', path);
  }
  renderPage();
}

// ── App Layout (sidebar + content) ────────────────────────────

function renderAppLayout(contentHtml) {
  const user = getUser();
  const initials = user ? user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0,2) : '?';
  return `
    <div class="app-layout">
      ${renderSidebar()}
      <div class="main-wrapper">
        <header class="top-header">
          <div class="top-header-left">
            <button class="menu-toggle-inline" id="menuToggleInline" aria-label="Toggle menu">
              <i data-lucide="menu" style="width:20px;height:20px"></i>
            </button>
          </div>
          <div class="top-header-right">
            <button class="notif-bell" id="notifBellBtn" title="Notifications" aria-label="Notifications">
              <i data-lucide="bell" style="width:20px;height:20px"></i>
              <span class="notif-badge" id="notifBadge" style="display:none">0</span>
            </button>
            <button class="btn btn-ghost btn-sm top-profile-btn" onclick="navigate('/profile')" title="My Profile">
              <div class="avatar avatar-sm" style="width:30px;height:30px;font-size:0.7rem">${initials}</div>
            </button>
          </div>
        </header>
        <main class="main-content">
          ${contentHtml}
        </main>
      </div>
    </div>
    <!-- Notification Panel -->
    <div class="notif-panel" id="notifPanel" style="display:none">
      <div class="notif-panel-header">
        <span class="notif-panel-title">Notifications</span>
        <button class="btn btn-ghost btn-sm" id="markAllReadBtn" style="font-size:0.78rem;color:var(--accent-primary)">Mark all read</button>
      </div>
      <div class="notif-list" id="notifList">
        <div style="text-align:center;padding:var(--space-xl);color:var(--text-muted);font-size:0.875rem">Loading...</div>
      </div>
    </div>
    <div class="notif-overlay" id="notifOverlay" style="display:none"></div>
  `;
}


// ── Page Renderer ─────────────────────────────────────────────

function renderPage() {
  const app = document.getElementById('app');
  if (!app) return;

  let path = window.location.pathname;

  // Normalize path
  if (path === '/' || path === '') {
    path = isLoggedIn() ? '/dashboard' : '/login';
    history.replaceState(null, '', path);
  }

  // Match route — try exact, then try matching parameterized patterns
  let route = routes[path];
  if (!route) {
    if (path.startsWith('/profile/')) {
      route = routes['/profile'];
    } else if (path.startsWith('/public/project/')) {
      route = routes['/public/project'];
    }
  }

  // 404 fallback
  if (!route) {
    route = {
      render: () => renderPlaceholderPage('Page Not Found', 'file-question', 'The page you are looking for does not exist.'),
      init: null,
      auth: true
    };
  }

  // Auth guard
  if (route.auth && !isLoggedIn()) {
    history.replaceState(null, '', '/login');
    route = routes['/login'];
  }

  // Admin guard
  if (route.admin && !isAdmin()) {
    history.replaceState(null, '', '/dashboard');
    route = routes['/dashboard'];
  }

  // Redirect logged-in users away from login
  if (path === '/login' && isLoggedIn()) {
    history.replaceState(null, '', '/dashboard');
    route = routes['/dashboard'];
  }

  // Render
  const contentHtml = route.render();

  if (route.auth) {
    app.innerHTML = renderAppLayout(contentHtml);
    initSidebar();
    if (typeof initNotifBell === 'function') initNotifBell();
    // Kick off push setup after first render (delayed so it doesn't block)
    if (typeof initPushNotifications === 'function') {
      setTimeout(initPushNotifications, 2000);
    }
  } else {
    app.innerHTML = contentHtml;
  }

  // Initialize Lucide icons
  if (window.lucide) {
    lucide.createIcons();
  }

  // Initialize page-specific logic
  if (route.init) {
    route.init();
  }

  // Scroll to top
  window.scrollTo(0, 0);
}

// ── Event Listeners ──────────────────────────────────────────

window.addEventListener('popstate', renderPage);

document.addEventListener('DOMContentLoaded', () => {
  renderPage();
});

// ── Global Exports ───────────────────────────────────────────
window.navigate = navigate;
