/* ============================================================
   C2S VLSI Lab Portal — Announcements Page
   Admin posts announcements; all users read them
   Schema: announcements(id, created_by, title, content, is_pinned, created_at)
   ============================================================ */

function renderAnnouncements() {
  const user = getUser();
  const isAdminUser = user && user.role === 'admin';

  return `
    <div class="page-enter">
      <div class="page-header">
        <div class="page-header-left">
          <h1 class="page-title animate-slideUp">
            <i data-lucide="megaphone" style="width:28px;height:28px;vertical-align:-4px;margin-right:10px;color:var(--accent-secondary)"></i>
            Announcements
          </h1>
          <p class="page-subtitle animate-slideUp stagger-1">Lab-wide notices and important updates</p>
        </div>
        <div class="page-header-actions animate-slideUp stagger-2">
          ${isAdminUser ? `
          <button class="btn btn-primary" id="newAnnouncementBtn">
            <i data-lucide="plus" style="width:16px;height:16px"></i>
            Post Announcement
          </button>
          ` : ''}
        </div>
      </div>

      <!-- Pinned Section -->
      <div id="pinnedContainer"></div>

      <!-- Search -->
      <div class="card animate-slideUp stagger-2" style="margin-bottom:var(--space-lg)">
        <div class="card-body" style="padding:var(--space-md)">
          <div class="search-input">
            <i data-lucide="search" class="search-icon"></i>
            <input type="text" id="annSearch" placeholder="Search announcements..." />
          </div>
        </div>
      </div>

      <!-- Announcements List -->
      <div id="announcementsContainer">
        <div style="display:flex;flex-direction:column;gap:var(--space-md)">
          ${[1,2,3].map(() => `
            <div class="card">
              <div class="card-body">
                <div class="skeleton skeleton-heading" style="width:55%;margin-bottom:10px"></div>
                <div class="skeleton skeleton-text" style="width:90%"></div>
                <div class="skeleton skeleton-text" style="width:70%"></div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>

    <!-- Announcement Modal (Admin only) -->
    <div class="modal-overlay" id="annModalOverlay" style="display:none">
      <div class="modal" style="max-width:620px">
        <div class="modal-header">
          <h3 class="modal-title" id="annModalTitle">Post Announcement</h3>
          <button class="modal-close" id="annModalClose">
            <i data-lucide="x" style="width:20px;height:20px"></i>
          </button>
        </div>
        <div class="modal-body">
          <form id="annForm">
            <div class="form-group">
              <label class="form-label">Title *</label>
              <input type="text" class="form-input" id="annTitle" placeholder="Announcement title..." required />
            </div>
            <div class="form-group">
              <label class="form-label">Content *</label>
              <textarea class="form-textarea" id="annContent" rows="6" placeholder="Write the announcement details..." required style="min-height:150px"></textarea>
            </div>
            <div class="form-group">
              <label style="display:flex;align-items:center;gap:var(--space-sm);cursor:pointer">
                <input type="checkbox" id="annPinned" style="width:16px;height:16px;accent-color:var(--accent-primary)" />
                <span class="form-label" style="margin:0">
                  <i data-lucide="pin" style="width:14px;height:14px;vertical-align:-2px;margin-right:4px;color:var(--accent-secondary)"></i>
                  Pin this announcement to top
                </span>
              </label>
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" id="annModalCancel">Cancel</button>
          <button class="btn btn-primary" id="annSubmitBtn">
            <span id="annSubmitText">Post</span>
            <div class="spinner" id="annSubmitSpinner" style="display:none"></div>
          </button>
        </div>
      </div>
    </div>
  `;
}

async function initAnnouncements() {
  const user = getUser();
  const isAdminUser = user && user.role === 'admin';
  let allAnnouncements = [];
  let editingAnnId = null;

  async function loadAnnouncements() {
    try {
      const res = await api.get('announcements');
      allAnnouncements = Array.isArray(res) ? res : (res?.data || []);
      renderPinned();
      applySearch();
    } catch(e) {
      renderList([]);
    }
  }

  function renderPinned() {
    const el = document.getElementById('pinnedContainer');
    if (!el) return;
    const pinned = allAnnouncements.filter(a => a.is_pinned);
    if (pinned.length === 0) { el.innerHTML = ''; return; }

    el.innerHTML = `
      <div style="margin-bottom:var(--space-sm)">
        <span style="font-size:0.75rem;font-weight:700;color:var(--accent-secondary);text-transform:uppercase;letter-spacing:0.06em">
          <i data-lucide="pin" style="width:12px;height:12px;vertical-align:-1px;margin-right:4px"></i>Pinned
        </span>
      </div>
      <div style="display:flex;flex-direction:column;gap:var(--space-md);margin-bottom:var(--space-xl)">
        ${pinned.map(a => renderCard(a, true)).join('')}
      </div>
    `;
    if (window.lucide) lucide.createIcons({ nodes: [el] });
  }

  function renderCard(ann, pinned = false) {
    const dateStr = new Date(ann.created_at).toLocaleDateString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
    });
    const poster = ann.created_by_name || ann.posted_by_name || '';

    return `
      <div class="card" style="${pinned
        ? 'background:linear-gradient(135deg,rgba(124,92,255,0.07),rgba(79,143,255,0.05));border-color:rgba(124,92,255,0.25)'
        : 'border-left:3px solid var(--accent-secondary)'}">
        <div class="card-body">
          <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:var(--space-md)">
            <div style="flex:1">
              ${pinned ? `<div style="display:flex;align-items:center;gap:6px;margin-bottom:6px"><i data-lucide="pin" style="width:12px;height:12px;color:var(--accent-secondary)"></i><span style="font-size:0.72rem;font-weight:700;color:var(--accent-secondary);text-transform:uppercase;letter-spacing:0.04em">Pinned</span></div>` : ''}
              <h4 style="margin:0 0 10px;font-size:0.975rem;line-height:1.4">${ann.title}</h4>
              <p style="color:var(--text-secondary);font-size:0.875rem;margin:0 0 var(--space-md);line-height:1.75;white-space:pre-wrap">${ann.content}</p>
              <div style="font-size:0.78rem;color:var(--text-muted);display:flex;align-items:center;gap:var(--space-md)">
                <span><i data-lucide="calendar" style="width:12px;height:12px;vertical-align:-2px;margin-right:3px"></i>${dateStr}</span>
                ${poster ? `<span><i data-lucide="user" style="width:12px;height:12px;vertical-align:-2px;margin-right:3px"></i>${poster}</span>` : ''}
              </div>
            </div>
            ${isAdminUser ? `
            <div style="display:flex;gap:4px;flex-shrink:0">
              <button class="btn btn-ghost btn-sm" onclick="editAnnouncement(${ann.id})" title="Edit">
                <i data-lucide="pencil" style="width:14px;height:14px"></i>
              </button>
              <button class="btn btn-ghost btn-sm" onclick="togglePinAnnouncement(${ann.id},${ann.is_pinned ? 0 : 1})" title="${ann.is_pinned ? 'Unpin' : 'Pin'}" style="color:var(--accent-secondary)">
                <i data-lucide="${ann.is_pinned ? 'pin-off' : 'pin'}" style="width:14px;height:14px"></i>
              </button>
              <button class="btn btn-ghost btn-sm" onclick="deleteAnnouncement(${ann.id})" style="color:var(--error)" title="Delete">
                <i data-lucide="trash-2" style="width:14px;height:14px"></i>
              </button>
            </div>` : ''}
          </div>
        </div>
      </div>
    `;
  }

  function renderList(anns) {
    const container = document.getElementById('announcementsContainer');
    if (!container) return;

    const unpinned = anns.filter(a => !a.is_pinned);

    if (unpinned.length === 0) {
      container.innerHTML = `
        <div class="card"><div class="card-body">
          <div class="empty-state">
            <div class="empty-state-icon"><i data-lucide="megaphone" style="width:28px;height:28px"></i></div>
            <div class="empty-state-title">No announcements yet</div>
            <div class="empty-state-description">${isAdminUser ? 'Post the first announcement for your lab.' : 'No announcements have been posted yet.'}</div>
            ${isAdminUser ? `<button class="btn btn-primary" onclick="document.getElementById('newAnnouncementBtn').click()"><i data-lucide="plus" style="width:16px;height:16px"></i> Post Announcement</button>` : ''}
          </div>
        </div></div>
      `;
      if (window.lucide) lucide.createIcons();
      return;
    }

    container.innerHTML = `<div style="display:flex;flex-direction:column;gap:var(--space-md)">${unpinned.map(a => renderCard(a, false)).join('')}</div>`;
    if (window.lucide) lucide.createIcons({ nodes: [container] });
  }

  function applySearch() {
    const q = document.getElementById('annSearch')?.value.toLowerCase() || '';
    const filtered = allAnnouncements.filter(a =>
      !q || (a.title||'').toLowerCase().includes(q) || (a.content||'').toLowerCase().includes(q)
    );
    renderPinned();
    renderList(filtered);
  }

  document.getElementById('annSearch')?.addEventListener('input', applySearch);

  // Modal
  const overlay = document.getElementById('annModalOverlay');

  function openModal(ann = null) {
    editingAnnId = ann ? ann.id : null;
    document.getElementById('annModalTitle').textContent = ann ? 'Edit Announcement' : 'Post Announcement';
    document.getElementById('annTitle').value = ann?.title || '';
    document.getElementById('annContent').value = ann?.content || '';
    document.getElementById('annPinned').checked = !!ann?.is_pinned;
    document.getElementById('annSubmitText').textContent = ann ? 'Update' : 'Post';
    overlay.style.display = 'flex';
    if (window.lucide) lucide.createIcons({ nodes: [overlay] });
  }

  function closeModal() { overlay.style.display = 'none'; editingAnnId = null; }

  document.getElementById('newAnnouncementBtn')?.addEventListener('click', () => openModal());
  document.getElementById('annModalClose')?.addEventListener('click', closeModal);
  document.getElementById('annModalCancel')?.addEventListener('click', closeModal);
  overlay?.addEventListener('click', e => { if (e.target === overlay) closeModal(); });

  document.getElementById('annSubmitBtn')?.addEventListener('click', async () => {
    const title = document.getElementById('annTitle').value.trim();
    const content = document.getElementById('annContent').value.trim();
    if (!title || !content) { showToast({ message: 'Title and content are required', type: 'warning' }); return; }

    const payload = {
      title,
      content,
      is_pinned: document.getElementById('annPinned').checked,
    };

    const btnText = document.getElementById('annSubmitText');
    const spinner = document.getElementById('annSubmitSpinner');
    btnText.style.display = 'none'; spinner.style.display = 'inline-block';

    try {
      if (editingAnnId) {
        await api.put(`announcements/${editingAnnId}`, payload);
        showToast({ message: 'Announcement updated!', type: 'success' });
      } else {
        await api.post('announcements', payload);
        showToast({ message: 'Announcement posted!', type: 'success' });
      }
      closeModal();
      await loadAnnouncements();
    } catch(err) {
      showToast({ message: err.message || 'Failed to save', type: 'error' });
    } finally {
      btnText.style.display = ''; spinner.style.display = 'none';
    }
  });

  window.editAnnouncement = (id) => {
    const ann = allAnnouncements.find(a => a.id === id);
    if (ann) openModal(ann);
  };

  window.togglePinAnnouncement = async (id, pinVal) => {
    try {
      await api.put(`announcements/${id}`, { is_pinned: !!pinVal });
      showToast({ message: pinVal ? 'Announcement pinned!' : 'Unpinned', type: 'success' });
      await loadAnnouncements();
    } catch(err) { showToast({ message: err.message || 'Failed', type: 'error' }); }
  };

  window.deleteAnnouncement = async (id) => {
    if (!confirm('Delete this announcement?')) return;
    try {
      await api.delete(`announcements/${id}`);
      showToast({ message: 'Deleted', type: 'success' });
      await loadAnnouncements();
    } catch(err) { showToast({ message: err.message || 'Failed to delete', type: 'error' }); }
  };

  await loadAnnouncements();
}

window.renderAnnouncements = renderAnnouncements;
window.initAnnouncements = initAnnouncements;
