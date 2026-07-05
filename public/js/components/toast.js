/* ============================================================
   C2S VLSI Lab Portal — Toast Notification System
   Stackable, auto-dismiss toast notifications
   ============================================================ */

const TOAST_ICONS = {
  success: 'check-circle',
  error: 'x-circle',
  warning: 'alert-triangle',
  info: 'info',
};

let toastContainer = null;

function ensureToastContainer() {
  if (!toastContainer || !document.body.contains(toastContainer)) {
    toastContainer = document.createElement('div');
    toastContainer.className = 'toast-container';
    document.body.appendChild(toastContainer);
  }
  return toastContainer;
}

function showToast({ message, type = 'info', duration = 3000 }) {
  const container = ensureToastContainer();
  const iconName = TOAST_ICONS[type] || TOAST_ICONS.info;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <i data-lucide="${iconName}" class="toast-icon"></i>
    <span class="toast-message">${message}</span>
    <button class="toast-close" aria-label="Close notification">
      <i data-lucide="x" style="width:16px;height:16px"></i>
    </button>
  `;

  container.appendChild(toast);

  // Initialize Lucide icons inside the toast
  if (window.lucide) {
    lucide.createIcons({ nodes: [toast] });
  }

  // Close button handler
  const closeBtn = toast.querySelector('.toast-close');
  closeBtn.addEventListener('click', () => dismissToast(toast));

  // Auto-dismiss
  if (duration > 0) {
    setTimeout(() => dismissToast(toast), duration);
  }

  return toast;
}

function dismissToast(toast) {
  if (!toast || toast.classList.contains('toast-exit')) return;
  toast.classList.add('toast-exit');
  toast.addEventListener('animationend', () => {
    toast.remove();
  });
}

// ── Global ────────────────────────────────────────────────────
window.showToast = showToast;
