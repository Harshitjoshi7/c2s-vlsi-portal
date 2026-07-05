/* ============================================================
   C2S VLSI Lab Portal — Modal Component
   Reusable glassmorphic modal with animations
   ============================================================ */

let currentModal = null;

/**
 * Open a modal dialog.
 * @param {Object} opts
 * @param {string} opts.title        — Modal title
 * @param {string} opts.content      — HTML string for body
 * @param {string} [opts.size='md']  — 'sm' | 'md' | 'lg'
 * @param {Function} [opts.onClose]  — Callback on close
 * @param {Array}  [opts.actions]    — [{ text, class, onClick }]
 */
function openModal({ title, content, size = 'md', onClose, actions = [] }) {
  // Close existing modal first
  if (currentModal) {
    closeModal();
  }

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal modal-${size}">
      <div class="modal-header">
        <h3>${title}</h3>
        <button class="modal-close" aria-label="Close modal">
          <i data-lucide="x" style="width:18px;height:18px"></i>
        </button>
      </div>
      <div class="modal-body">
        ${content}
      </div>
      ${actions.length > 0 ? `
        <div class="modal-footer" id="modal-actions"></div>
      ` : ''}
    </div>
  `;

  document.body.appendChild(overlay);
  currentModal = { overlay, onClose };

  // Render action buttons
  if (actions.length > 0) {
    const footer = overlay.querySelector('#modal-actions');
    actions.forEach((action) => {
      const btn = document.createElement('button');
      btn.className = action.class || 'btn btn-secondary';
      btn.textContent = action.text;
      btn.addEventListener('click', () => {
        if (action.onClick) action.onClick();
      });
      footer.appendChild(btn);
    });
  }

  // Close handlers
  overlay.querySelector('.modal-close').addEventListener('click', closeModal);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal();
  });

  // ESC key
  const escHandler = (e) => {
    if (e.key === 'Escape') {
      closeModal();
      document.removeEventListener('keydown', escHandler);
    }
  };
  document.addEventListener('keydown', escHandler);
  currentModal.escHandler = escHandler;

  // Prevent body scroll
  document.body.style.overflow = 'hidden';

  // Initialize Lucide icons
  if (window.lucide) {
    lucide.createIcons({ nodes: [overlay] });
  }

  return overlay;
}

function closeModal() {
  if (!currentModal) return;

  const { overlay, onClose, escHandler } = currentModal;

  if (escHandler) {
    document.removeEventListener('keydown', escHandler);
  }

  // Animate out
  const modal = overlay.querySelector('.modal');
  if (modal) modal.style.animation = 'scaleOut 0.15s ease forwards';
  overlay.style.animation = 'fadeOut 0.15s ease forwards';

  setTimeout(() => {
    overlay.remove();
    document.body.style.overflow = '';
    if (onClose) onClose();
    currentModal = null;
  }, 150);
}

// ── Global ────────────────────────────────────────────────────
window.openModal = openModal;
window.closeModal = closeModal;
