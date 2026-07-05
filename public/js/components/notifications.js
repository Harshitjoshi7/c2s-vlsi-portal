/* ============================================================
   C2S VLSI Lab Portal — Notification Bell Component
   In-app notification center with unread badge + slide panel
   ============================================================ */

const NOTIF_ICONS = {
  task:         { icon: 'list-checks',    color: 'var(--warning)'          },
  ticket:       { icon: 'ticket',         color: 'var(--error)'            },
  announcement: { icon: 'megaphone',      color: 'var(--accent-secondary)' },
  leave:        { icon: 'calendar-check', color: 'var(--info)'             },
  deadline:     { icon: 'clock',          color: 'var(--error)'            },
};

let _notifPollInterval = null;

async function initNotifBell() {
  // Clean up previous poll if navigating
  if (_notifPollInterval) {
    clearInterval(_notifPollInterval);
    _notifPollInterval = null;
  }

  const bell = document.getElementById('notifBellBtn');
  const panel = document.getElementById('notifPanel');
  const overlay = document.getElementById('notifOverlay');
  const badge = document.getElementById('notifBadge');
  const markAllBtn = document.getElementById('markAllReadBtn');

  if (!bell) return;

  // Load unread count immediately and poll every 30s
  await fetchUnreadCount();
  _notifPollInterval = setInterval(fetchUnreadCount, 30000);

  async function fetchUnreadCount() {
    try {
      const res = await api.get('notifications/unread-count');
      const count = res?.data?.unread_count ?? res?.unread_count ?? 0;
      if (badge) {
        badge.textContent = count > 9 ? '9+' : count;
        badge.style.display = count > 0 ? 'flex' : 'none';
      }
    } catch(e) {
      // Silently fail — don't break the UI
    }
  }

  let isOpen = false;

  function openPanel() {
    if (!panel || !overlay) return;
    panel.style.display = 'flex';
    overlay.style.display = 'block';
    isOpen = true;
    loadNotifications();
  }

  function closePanel() {
    if (!panel || !overlay) return;
    panel.style.display = 'none';
    overlay.style.display = 'none';
    isOpen = false;
  }

  bell.addEventListener('click', (e) => {
    e.stopPropagation();
    isOpen ? closePanel() : openPanel();
  });

  overlay?.addEventListener('click', closePanel);

  markAllBtn?.addEventListener('click', async () => {
    try {
      await api.put('notifications/read-all', {});
      await fetchUnreadCount();
      loadNotifications();
      showToast({ message: 'All notifications marked as read', type: 'success' });
    } catch(e) {}
  });

  async function loadNotifications() {
    const list = document.getElementById('notifList');
    if (!list) return;

    list.innerHTML = `<div style="text-align:center;padding:var(--space-xl);color:var(--text-muted)"><div class="spinner" style="display:inline-block;width:20px;height:20px"></div></div>`;

    try {
      const res = await api.get('notifications');
      const notifications = Array.isArray(res) ? res : (res?.data || []);

      if (notifications.length === 0) {
        list.innerHTML = `
          <div style="text-align:center;padding:var(--space-xl);color:var(--text-muted)">
            <i data-lucide="bell-off" style="width:32px;height:32px;display:block;margin:0 auto var(--space-md);opacity:0.4"></i>
            <div style="font-size:0.875rem">No notifications yet</div>
          </div>
        `;
        if (window.lucide) lucide.createIcons({ nodes: [list] });
        return;
      }

      list.innerHTML = notifications.map(n => {
        const conf = NOTIF_ICONS[n.type] || { icon: 'bell', color: 'var(--text-muted)' };
        const timeStr = timeAgo(n.created_at);
        return `
          <div class="notif-item ${n.is_read ? '' : 'notif-item-unread'}" data-id="${n.id}" onclick="handleNotifClick(${n.id},'${n.link || '/dashboard'}')">
            <div class="notif-item-icon" style="background:${conf.color}18;color:${conf.color}">
              <i data-lucide="${conf.icon}" style="width:16px;height:16px"></i>
            </div>
            <div class="notif-item-body">
              <div class="notif-item-title">${n.title}</div>
              ${n.message ? `<div class="notif-item-msg">${n.message}</div>` : ''}
              <div class="notif-item-time">${timeStr}</div>
            </div>
            ${!n.is_read ? `<div class="notif-item-dot"></div>` : ''}
          </div>
        `;
      }).join('');

      if (window.lucide) lucide.createIcons({ nodes: [list] });
    } catch(e) {
      list.innerHTML = `<div style="padding:var(--space-lg);color:var(--error);font-size:0.875rem;text-align:center">Failed to load notifications.</div>`;
    }
  }

  window.handleNotifClick = async (id, link) => {
    try { await api.put(`notifications/${id}/read`, {}); } catch(e) {}
    await fetchUnreadCount();
    closePanel();
    if (link && link !== '/dashboard') {
      // The SPA router doesn't have details routes like /tickets/:id yet
      // so we navigate to the base route (e.g. /tickets)
      let cleanLink = link;
      const parts = link.split('/');
      if (parts.length > 2) {
        cleanLink = `/${parts[1]}`;
      }
      navigate(cleanLink);
    } else {
      // Refresh current page
      loadNotifications();
    }
  };
}

function timeAgo(dateStr) {
  const now = new Date();
  const date = new Date(dateStr);
  const diff = Math.floor((now - date) / 1000);
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return date.toLocaleDateString('en-US', { month:'short', day:'numeric' });
}

window.initNotifBell = initNotifBell;
window.timeAgo = timeAgo;

/* ── Push Notification Setup ───────────────────────────────── */

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)));
}

async function initPushNotifications() {
  // Only run if browser supports push
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

  // Don't re-ask if already granted/denied
  if (Notification.permission === 'denied') return;

  try {
    // 1. Get VAPID public key from server
    const keyRes = await api.get('notifications/vapid-public-key');
    const publicKey = keyRes?.data?.publicKey || keyRes?.publicKey;
    if (!publicKey) return;

    // 2. Get the active service worker registration
    const registration = await navigator.serviceWorker.ready;

    // 3. Check if already subscribed
    const existingSub = await registration.pushManager.getSubscription();
    if (existingSub) {
      // Already subscribed — re-register with server in case it expired
      await _sendSubToServer(existingSub);
      return;
    }

    // 4. Request permission (will show browser prompt)
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return;

    // 5. Subscribe via PushManager
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey)
    });

    // 6. Send subscription to server
    await _sendSubToServer(subscription);

    showToast({ message: '🔔 Push notifications enabled!', type: 'success' });
  } catch (err) {
    // Silently fail — push is non-critical
    console.warn('Push subscription setup failed:', err.message);
  }
}

async function _sendSubToServer(subscription) {
  const sub = subscription.toJSON();
  try {
    await api.post('notifications/subscribe', {
      endpoint: sub.endpoint,
      keys: { p256dh: sub.keys.p256dh, auth: sub.keys.auth }
    });
  } catch (e) {}
}

// Listen for NAVIGATE messages from service worker (push notification tap)
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('message', event => {
    if (event.data?.type === 'NAVIGATE' && event.data.link) {
      if (typeof navigate === 'function') navigate(event.data.link);
    }
  });
}

window.initPushNotifications = initPushNotifications;

