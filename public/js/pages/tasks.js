/* ============================================================
   C2S VLSI Lab Portal — Tasks Page
   Kanban-style and list view task management
   ============================================================ */

function renderTasks() {
  const user = getUser();
  const isAdminUser = user && user.role === 'admin';

  return `
    <div class="page-enter">
      <div class="page-header">
        <div class="page-header-left">
          <h1 class="page-title animate-slideUp">
            <i data-lucide="list-checks" style="width:28px;height:28px;vertical-align:-4px;margin-right:10px;color:var(--warning)"></i>
            Tasks
          </h1>
          <p class="page-subtitle animate-slideUp stagger-1">Track and manage work assignments</p>
        </div>
        <div class="page-header-actions animate-slideUp stagger-2">
          <div style="display:flex;gap:var(--space-sm)">
            <button class="btn btn-secondary" id="taskViewList" title="List View">
              <i data-lucide="list" style="width:16px;height:16px"></i>
            </button>
            <button class="btn btn-secondary" id="taskViewKanban" title="Kanban View">
              <i data-lucide="kanban" style="width:16px;height:16px"></i>
            </button>
            ${isAdminUser ? `
            <button class="btn btn-primary" id="newTaskBtn">
              <i data-lucide="plus" style="width:16px;height:16px"></i>
              New Task
            </button>
            ` : ''}
          </div>
        </div>
      </div>

      <!-- Filters -->
      <div class="card animate-slideUp stagger-2" style="margin-bottom:var(--space-lg)">
        <div class="card-body" style="padding:var(--space-md)">
          <div style="display:flex;gap:var(--space-md);flex-wrap:wrap;align-items:center">
            <div class="search-input" style="flex:1;min-width:200px">
              <i data-lucide="search" class="search-icon"></i>
              <input type="text" id="taskSearch" placeholder="Search tasks..." />
            </div>
            <select class="form-select" id="taskStatusFilter" style="width:auto">
              <option value="">All Status</option>
              <option value="assigned">Assigned</option>
              <option value="in_progress">In Progress</option>
              <option value="under_review">Under Review</option>
              <option value="completed">Completed</option>
            </select>
            <select class="form-select" id="taskPriorityFilter" style="width:auto">
              <option value="">All Priorities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Tasks Container -->
      <div id="tasksContainer">
        <div style="display:flex;flex-direction:column;gap:var(--space-md)">
          ${[1,2,3,4].map(() => `
            <div class="card">
              <div class="card-body">
                <div class="skeleton skeleton-heading" style="width:60%;margin-bottom:10px"></div>
                <div class="skeleton skeleton-text" style="width:85%"></div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>

    <!-- Task Modal -->
    <div class="modal-overlay" id="taskModalOverlay" style="display:none">
      <div class="modal" style="max-width:620px">
        <div class="modal-header">
          <h3 class="modal-title" id="taskModalTitle">New Task</h3>
          <button class="modal-close" id="taskModalClose">
            <i data-lucide="x" style="width:20px;height:20px"></i>
          </button>
        </div>
        <div class="modal-body">
          <form id="taskForm">
            <div class="form-group">
              <label class="form-label">Title *</label>
              <input type="text" class="form-input" id="taskTitle" placeholder="Task title..." required />
            </div>
            <div class="form-group">
              <label class="form-label">Description</label>
              <textarea class="form-textarea" id="taskDesc" rows="3" placeholder="Detailed description..."></textarea>
            </div>
            <div class="grid grid-2" style="gap:var(--space-md)">
              <div class="form-group">
                <label class="form-label">Priority</label>
                <select class="form-select" id="taskPriority">
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Category</label>
                <input type="text" class="form-input" id="taskCategory" placeholder="e.g. Design, Simulation" />
              </div>
              <div class="form-group">
                <label class="form-label">Deadline</label>
                <input type="date" class="form-input" id="taskDeadline" />
              </div>
              <div class="form-group">
                <label class="form-label">Status</label>
                <select class="form-select" id="taskStatus">
                  <option value="assigned">Assigned</option>
                  <option value="in_progress">In Progress</option>
                  <option value="under_review">Under Review</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>
            <div class="form-group" id="taskAssigneeGroup">
              <label class="form-label">Assign To</label>
              <select class="form-select" id="taskAssignee" multiple style="height:120px">
              </select>
              <p class="form-hint">Hold Ctrl/Cmd to select multiple</p>
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" id="taskModalCancel">Cancel</button>
          <button class="btn btn-primary" id="taskSubmitBtn">
            <span id="taskSubmitText">Create Task</span>
            <div class="spinner" id="taskSubmitSpinner" style="display:none"></div>
          </button>
        </div>
      </div>
    </div>

    <!-- View Task Modal -->
    <div class="modal-overlay" id="viewTaskModalOverlay" style="display:none">
      <div class="modal" style="max-width:600px">
        <div class="modal-header">
          <h3 class="modal-title" id="viewTaskTitle">Task Details</h3>
          <button class="modal-close" id="viewTaskModalClose">
            <i data-lucide="x" style="width:20px;height:20px"></i>
          </button>
        </div>
        <div class="modal-body" style="padding-top:0">
          <div style="display:flex;gap:8px;margin-bottom:var(--space-md);flex-wrap:wrap" id="viewTaskBadges"></div>
          <p style="color:var(--text-secondary);line-height:1.6;margin-bottom:var(--space-lg)" id="viewTaskDesc"></p>
          <div class="grid grid-2" style="gap:var(--space-md);background:rgba(255,255,255,0.02);padding:var(--space-md);border-radius:var(--border-radius);border:1px solid var(--border-color)">
            <div>
              <div style="font-size:0.75rem;color:var(--text-muted);margin-bottom:4px">Deadline</div>
              <div style="font-weight:500" id="viewTaskDeadline"></div>
            </div>
            <div>
              <div style="font-size:0.75rem;color:var(--text-muted);margin-bottom:4px">Category</div>
              <div style="font-weight:500" id="viewTaskCategory"></div>
            </div>
            <div>
              <div style="font-size:0.75rem;color:var(--text-muted);margin-bottom:4px">Assigned By</div>
              <div style="font-weight:500" id="viewTaskAssignedBy"></div>
            </div>
            <div>
              <div style="font-size:0.75rem;color:var(--text-muted);margin-bottom:4px">Status</div>
              <div style="font-weight:500" id="viewTaskStatus"></div>
            </div>
          </div>
          <div id="viewTaskAssigneesContainer" style="margin-top:var(--space-md);display:none">
            <div style="font-size:0.85rem;font-weight:600;margin-bottom:8px">Assignees</div>
            <div id="viewTaskAssignees" style="display:flex;gap:8px;flex-wrap:wrap"></div>
          </div>
        </div>
      </div>
    </div>
  `;
}

async function initTasks() {
  const user = getUser();
  const isAdminUser = user && user.role === 'admin';
  let allTasks = [];
  let editingTaskId = null;
  let viewMode = 'list'; // 'list' or 'kanban'
  let studentsList = [];

  // Load students for admin
  if (isAdminUser) {
    try {
      const res = await api.get('users?role=student');
      studentsList = Array.isArray(res) ? res : (res?.data || []);
      const sel = document.getElementById('taskAssignee');
      if (sel) {
        studentsList.forEach(u => {
          const opt = document.createElement('option');
          opt.value = u.id;
          opt.textContent = u.name;
          sel.appendChild(opt);
        });
      }
    } catch(e) {}
  } else {
    document.getElementById('taskAssigneeGroup')?.remove();
  }

  // Load tasks
  async function loadTasks() {
    try {
      const endpoint = isAdminUser ? 'tasks' : 'tasks/my';
      const res = await api.get(endpoint);
      allTasks = Array.isArray(res) ? res : (res?.data || []);
      applyFilters();
    } catch(e) {
      renderListView([]);
    }
  }

  const priorityConfig = {
    low:      { label:'Low',      color:'var(--priority-low)',      bg:'rgba(0,230,118,0.1)'  },
    medium:   { label:'Medium',   color:'var(--priority-medium)',   bg:'rgba(255,171,64,0.1)' },
    high:     { label:'High',     color:'var(--priority-high)',     bg:'rgba(255,110,64,0.1)' },
    critical: { label:'Critical', color:'var(--priority-critical)', bg:'rgba(255,82,82,0.12)' },
  };

  const statusConfig = {
    assigned:     { label:'Assigned',     color:'var(--info)',    bg:'rgba(64,196,255,0.1)'  },
    in_progress:  { label:'In Progress',  color:'var(--warning)', bg:'rgba(255,171,64,0.1)' },
    under_review: { label:'Under Review', color:'var(--accent-secondary)', bg:'rgba(124,92,255,0.1)' },
    completed:    { label:'Completed',    color:'var(--success)', bg:'rgba(0,230,118,0.1)'  },
  };
  function renderListView(tasks) {
    const container = document.getElementById('tasksContainer');
    if (!container) return;

    if (!tasks || tasks.length === 0) {
      container.innerHTML = `
        <div class="card"><div class="card-body">
          <div class="empty-state">
            <div class="empty-state-icon"><i data-lucide="check-square" style="width:28px;height:28px"></i></div>
            <div class="empty-state-title">No tasks found</div>
            <div class="empty-state-description">${isAdminUser ? 'Create the first task.' : 'No tasks assigned to you yet.'}</div>
          </div>
        </div></div>
      `;
      if (window.lucide) lucide.createIcons();
      return;
    }

    if (isAdminUser) {
      const assignments = [];
      const statusFilter = document.getElementById('taskStatusFilter')?.value || '';
      
      tasks.forEach(task => {
        if (task.assignees && task.assignees.length > 0) {
          task.assignees.forEach(a => {
            if (!statusFilter || a.status === statusFilter || task.status === statusFilter) {
              assignments.push({ task, student: a });
            }
          });
        } else {
          if (!statusFilter || task.status === statusFilter) {
            assignments.push({ task, student: null });
          }
        }
      });

      container.innerHTML = `
        <div class="card" style="overflow-x:auto">
          <table class="table" style="width:100%;text-align:left;border-collapse:collapse;min-width:600px">
            <thead>
              <tr style="border-bottom:1px solid var(--border-color);background:rgba(255,255,255,0.02)">
                <th style="padding:12px;font-weight:600;font-size:0.85rem;color:var(--text-muted)">Student</th>
                <th style="padding:12px;font-weight:600;font-size:0.85rem;color:var(--text-muted)">Task Name</th>
                <th style="padding:12px;font-weight:600;font-size:0.85rem;color:var(--text-muted)">Priority</th>
                <th style="padding:12px;font-weight:600;font-size:0.85rem;color:var(--text-muted)">Status</th>
                <th style="padding:12px;font-weight:600;font-size:0.85rem;color:var(--text-muted)">Deadline</th>
                <th style="padding:12px;font-weight:600;font-size:0.85rem;color:var(--text-muted)">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${assignments.map(item => {
                const task = item.task;
                const student = item.student;
                const pri = priorityConfig[task.priority] || priorityConfig.medium;
                const st = statusConfig[student ? student.status : task.status] || statusConfig.assigned;
                const isOverdue = task.deadline && new Date(task.deadline) < new Date() && (student ? student.status !== 'completed' : task.status !== 'completed');
                
                return `
                  <tr style="border-bottom:1px solid var(--border-color);transition:background 0.2s">
                    <td style="padding:12px;vertical-align:middle">
                      ${student ? `
                        <div style="display:flex;align-items:center;gap:8px">
                          <div style="width:28px;height:28px;border-radius:50%;background:var(--bg-card-hover);display:flex;align-items:center;justify-content:center;font-size:0.75rem;font-weight:600;color:var(--text-primary)">
                            ${student.name.charAt(0).toUpperCase()}
                          </div>
                          <span style="font-weight:500">${student.name}</span>
                        </div>
                      ` : '<span style="color:var(--text-muted);font-style:italic">Unassigned</span>'}
                    </td>
                    <td style="padding:12px;vertical-align:middle;cursor:pointer" onclick="viewTask(${task.id})">
                      <div style="font-weight:500;color:var(--text-primary);margin-bottom:4px;display:inline-block">${task.title}</div>
                      ${task.category ? `<span class="badge badge-info" style="font-size:0.65rem;margin-left:8px">${task.category}</span>` : ''}
                    </td>
                    <td style="padding:12px;vertical-align:middle">
                      <span style="padding:3px 8px;border-radius:20px;font-size:0.7rem;font-weight:700;background:${pri.bg};color:${pri.color};text-transform:uppercase">${pri.label}</span>
                    </td>
                    <td style="padding:12px;vertical-align:middle">
                      <span style="padding:3px 8px;border-radius:20px;font-size:0.7rem;font-weight:600;background:${st.bg};color:${st.color}">${st.label}</span>
                    </td>
                    <td style="padding:12px;vertical-align:middle">
                      ${task.deadline ? `<span style="font-size:0.8rem;color:${isOverdue ? 'var(--error)' : 'var(--text-muted)'}">${new Date(task.deadline).toLocaleDateString()}</span>` : '-'}
                    </td>
                    <td style="padding:12px;vertical-align:middle">
                      <div style="display:flex;gap:4px">
                        <button class="btn btn-ghost btn-sm" onclick="editTask(${task.id})" title="Edit Task">
                          <i data-lucide="pencil" style="width:14px;height:14px"></i>
                        </button>
                        <button class="btn btn-ghost btn-sm" onclick="deleteTask(${task.id})" style="color:var(--error)" title="Delete Task">
                          <i data-lucide="trash-2" style="width:14px;height:14px"></i>
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
    } else {
      container.innerHTML = `
        <div style="display:flex;flex-direction:column;gap:var(--space-md)">
          ${tasks.map(task => {
            const pri = priorityConfig[task.priority] || priorityConfig.medium;
            const st = statusConfig[task.status] || statusConfig.assigned;
            const isOverdue = task.deadline && new Date(task.deadline) < new Date() && task.status !== 'completed';

            return `
              <div class="card" style="border-left:3px solid ${pri.color};transition:all 0.2s;cursor:pointer" onclick="viewTask(${task.id})">
                <div class="card-body" style="padding:var(--space-lg)">
                  <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:var(--space-md)">
                    <div style="flex:1">
                      <div style="display:flex;align-items:center;gap:var(--space-sm);flex-wrap:wrap;margin-bottom:8px">
                        <span style="padding:3px 10px;border-radius:20px;font-size:0.72rem;font-weight:700;background:${pri.bg};color:${pri.color};text-transform:uppercase;letter-spacing:0.04em">${pri.label}</span>
                        <span style="padding:3px 10px;border-radius:20px;font-size:0.72rem;font-weight:600;background:${st.bg};color:${st.color}">${st.label}</span>
                        ${task.category ? `<span class="badge badge-info">${task.category}</span>` : ''}
                        ${isOverdue ? `<span class="badge badge-error">Overdue</span>` : ''}
                      </div>
                      <h4 style="margin:0 0 8px;font-size:0.9375rem">${task.title}</h4>
                      ${task.description ? `<p style="color:var(--text-muted);font-size:0.85rem;margin:0;line-height:1.6;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">${task.description}</p>` : ''}
                      <div style="display:flex;align-items:center;gap:var(--space-lg);margin-top:var(--space-sm)">
                        ${task.deadline ? `<span style="font-size:0.8rem;color:${isOverdue ? 'var(--error)' : 'var(--text-muted)'}"><i data-lucide="calendar" style="width:13px;height:13px;vertical-align:-2px;margin-right:4px"></i>${new Date(task.deadline).toLocaleDateString()}</span>` : ''}
                      </div>
                    </div>
                    <div style="display:flex;gap:4px;flex-shrink:0" onclick="event.stopPropagation()">
                      ${task.status !== 'completed' ? `
                      <select class="form-select btn-sm" style="width:auto;padding:5px 28px 5px 10px;font-size:0.8rem" onchange="updateTaskStatus(${task.id}, this.value)">
                        <option value="in_progress" ${task.status === 'in_progress' ? 'selected' : ''}>In Progress</option>
                        <option value="under_review" ${task.status === 'under_review' ? 'selected' : ''}>Under Review</option>
                        <option value="completed" ${task.status === 'completed' ? 'selected' : ''}>Completed</option>
                      </select>
                      ` : ''}
                    </div>
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `;
    }
    if (window.lucide) lucide.createIcons();
  }

  function renderKanbanView(tasks) {
    const container = document.getElementById('tasksContainer');
    if (!container) return;

    const columns = [
      { key: 'assigned', label: 'Assigned', color: 'var(--info)' },
      { key: 'in_progress', label: 'In Progress', color: 'var(--warning)' },
      { key: 'under_review', label: 'Under Review', color: 'var(--accent-secondary)' },
      { key: 'completed', label: 'Completed', color: 'var(--success)' },
    ];

    container.innerHTML = `
      <div class="grid grid-stats" style="overflow-x:auto;min-width:800px">
        ${columns.map(col => {
          const colTasks = tasks.filter(t => t.status === col.key);
          return `
            <div style="background:rgba(255,255,255,0.03);border:1px solid var(--border-color);border-radius:var(--border-radius);padding:var(--space-md)">
              <div style="display:flex;align-items:center;gap:8px;margin-bottom:var(--space-md);padding-bottom:var(--space-md);border-bottom:1px solid var(--border-color)">
                <div style="width:8px;height:8px;border-radius:50%;background:${col.color}"></div>
                <span style="font-weight:600;font-size:0.875rem;color:var(--text-primary)">${col.label}</span>
                <span style="margin-left:auto;background:rgba(255,255,255,0.08);color:var(--text-muted);border-radius:20px;padding:2px 8px;font-size:0.75rem;font-weight:600">${colTasks.length}</span>
              </div>
              <div class="grid grid-2" style="gap:var(--space-md)">
                ${colTasks.length === 0 ? `<div style="color:var(--text-muted);font-size:0.8rem;text-align:center;padding:var(--space-lg) 0">No tasks</div>` : ''}
                ${colTasks.map(task => {
                  const pri = priorityConfig[task.priority] || priorityConfig.medium;
                  return `
                    <div class="card" style="border:1px solid var(--border-color);cursor:pointer;padding:var(--space-md)" onclick="viewTask(${task.id})">
                      <div style="margin-bottom:6px">
                        <span style="padding:2px 8px;border-radius:20px;font-size:0.68rem;font-weight:700;background:${pri.bg};color:${pri.color};text-transform:uppercase">${pri.label}</span>
                      </div>
                      <div style="font-size:0.85rem;font-weight:500;color:var(--text-primary);margin-bottom:4px;line-height:1.4">${task.title}</div>
                      ${task.deadline ? `<div style="font-size:0.75rem;color:var(--text-muted)">${new Date(task.deadline).toLocaleDateString()}</div>` : ''}
                      ${task.assignees && task.assignees.length > 0 ? `
                        <div style="display:flex;gap:4px;flex-wrap:wrap;margin-top:8px">
                          ${task.assignees.map(a => {
                            const ast = statusConfig[a.status] || statusConfig.assigned;
                            return `<div style="font-size:0.7rem;padding:2px 6px;border-radius:12px;background:${ast.bg};color:${ast.color};display:flex;align-items:center;gap:4px;border:1px solid ${ast.color}33" title="${a.name} - ${ast.label}">
                              ${a.name ? a.name.charAt(0).toUpperCase() : '?'}
                            </div>`;
                          }).join('')}
                        </div>
                      ` : ''}
                    </div>
                  `;
                }).join('')}
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
    const search = document.getElementById('taskSearch')?.value.toLowerCase() || '';
    const statusFilter = document.getElementById('taskStatusFilter')?.value || '';
    const priorityFilter = document.getElementById('taskPriorityFilter')?.value || '';

    const filtered = allTasks.filter(t => {
      const matchSearch = !search || (t.title || '').toLowerCase().includes(search) || (t.description || '').toLowerCase().includes(search);
      const matchPriority = !priorityFilter || t.priority === priorityFilter;
      let matchStatus = !statusFilter || t.status === statusFilter;
      
      if (isAdminUser && statusFilter && t.assignees) {
        // For admin, a task matches if ANY of its assignees matches the status,
        // or the task itself matches the status
        matchStatus = matchStatus || t.assignees.some(a => a.status === statusFilter);
      }
      
      return matchSearch && matchStatus && matchPriority;
    });

    if (viewMode === 'kanban') renderKanbanView(filtered);
    else renderListView(filtered);
  }

  ['taskSearch','taskStatusFilter','taskPriorityFilter'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', applyFilters);
  });

  // View toggles
  document.getElementById('taskViewList')?.addEventListener('click', () => {
    viewMode = 'list';
    document.getElementById('taskViewList').style.borderColor = 'var(--accent-primary)';
    document.getElementById('taskViewKanban').style.borderColor = '';
    applyFilters();
  });
  document.getElementById('taskViewKanban')?.addEventListener('click', () => {
    viewMode = 'kanban';
    document.getElementById('taskViewKanban').style.borderColor = 'var(--accent-primary)';
    document.getElementById('taskViewList').style.borderColor = '';
    applyFilters();
  });

  const overlay = document.getElementById('taskModalOverlay');
  function openModal(task = null) {
    editingTaskId = task ? task.id : null;
    document.getElementById('taskModalTitle').textContent = task ? 'Edit Task' : 'New Task';
    document.getElementById('taskTitle').value = task?.title || '';
    document.getElementById('taskDesc').value = task?.description || '';
    document.getElementById('taskPriority').value = task?.priority || 'medium';
    document.getElementById('taskCategory').value = task?.category || '';
    document.getElementById('taskDeadline').value = task?.deadline || '';
    document.getElementById('taskStatus').value = task?.status || 'assigned';
    document.getElementById('taskSubmitText').textContent = task ? 'Update Task' : 'Create Task';
    overlay.style.display = 'flex';
  }
  function closeModal() { overlay.style.display = 'none'; editingTaskId = null; }

  document.getElementById('newTaskBtn')?.addEventListener('click', () => openModal());
  document.getElementById('taskModalClose')?.addEventListener('click', closeModal);
  document.getElementById('taskModalCancel')?.addEventListener('click', closeModal);
  overlay?.addEventListener('click', e => { if (e.target === overlay) closeModal(); });
  
  // View Modal
  const viewOverlay = document.getElementById('viewTaskModalOverlay');
  function openViewModal(task) {
    document.getElementById('viewTaskTitle').textContent = task.title;
    document.getElementById('viewTaskDesc').textContent = task.description || 'No description provided.';
    
    const pri = priorityConfig[task.priority] || priorityConfig.medium;
    const st = statusConfig[task.status] || statusConfig.assigned;
    
    let badgesHtml = `<span style="padding:3px 10px;border-radius:20px;font-size:0.72rem;font-weight:700;background:${pri.bg};color:${pri.color};text-transform:uppercase">${pri.label}</span>`;
    if (!isAdminUser) {
      badgesHtml += `<span style="padding:3px 10px;border-radius:20px;font-size:0.72rem;font-weight:600;background:${st.bg};color:${st.color}">${st.label}</span>`;
    }
    if (task.category) {
      badgesHtml += `<span class="badge badge-info">${task.category}</span>`;
    }
    document.getElementById('viewTaskBadges').innerHTML = badgesHtml;
    
    document.getElementById('viewTaskDeadline').textContent = task.deadline ? new Date(task.deadline).toLocaleDateString() : '-';
    document.getElementById('viewTaskCategory').textContent = task.category || '-';
    document.getElementById('viewTaskAssignedBy').textContent = task.assigned_by_name || '-';
    
    if (isAdminUser) {
      document.getElementById('viewTaskStatus').textContent = st.label;
      const assigneesContainer = document.getElementById('viewTaskAssigneesContainer');
      const assigneesDiv = document.getElementById('viewTaskAssignees');
      if (task.assignees && task.assignees.length > 0) {
        assigneesDiv.innerHTML = task.assignees.map(a => {
          const ast = statusConfig[a.status] || statusConfig.assigned;
          return `<div style="display:flex;align-items:center;gap:6px;padding:4px 8px;border-radius:12px;background:rgba(255,255,255,0.03);border:1px solid var(--border-color)">
            <div style="width:20px;height:20px;border-radius:50%;background:var(--bg-card-hover);display:flex;align-items:center;justify-content:center;font-size:0.6rem;font-weight:600">${a.name.charAt(0).toUpperCase()}</div>
            <span style="font-size:0.75rem;font-weight:500">${a.name}</span>
            <span style="font-size:0.65rem;padding:2px 6px;border-radius:10px;background:${ast.bg};color:${ast.color}">${ast.label}</span>
          </div>`;
        }).join('');
        assigneesContainer.style.display = 'block';
      } else {
        assigneesContainer.style.display = 'none';
      }
    } else {
      document.getElementById('viewTaskStatus').textContent = st.label;
      document.getElementById('viewTaskAssigneesContainer').style.display = 'none';
    }
    
    viewOverlay.style.display = 'flex';
  }
  function closeViewModal() { viewOverlay.style.display = 'none'; }
  document.getElementById('viewTaskModalClose')?.addEventListener('click', closeViewModal);
  viewOverlay?.addEventListener('click', e => { if (e.target === viewOverlay) closeViewModal(); });
  
  window.viewTask = (id) => {
    const task = allTasks.find(t => t.id === id);
    if (task) openViewModal(task);
  };

  // Submit
  document.getElementById('taskSubmitBtn')?.addEventListener('click', async () => {
    const title = document.getElementById('taskTitle').value.trim();
    if (!title) { showToast({ message: 'Task title is required', type: 'warning' }); return; }

    const assigneeSel = document.getElementById('taskAssignee');
    const assignedTo = assigneeSel ? Array.from(assigneeSel.selectedOptions).map(o => parseInt(o.value)) : [];

    const payload = {
      title,
      description: document.getElementById('taskDesc').value.trim() || null,
      priority: document.getElementById('taskPriority').value,
      category: document.getElementById('taskCategory').value.trim() || null,
      deadline: document.getElementById('taskDeadline').value || null,
      status: document.getElementById('taskStatus').value,
      assigned_to: assignedTo,
    };

    const btnText = document.getElementById('taskSubmitText');
    const spinner = document.getElementById('taskSubmitSpinner');
    btnText.style.display = 'none';
    spinner.style.display = 'inline-block';

    try {
      if (editingTaskId) {
        await api.put(`tasks/${editingTaskId}`, payload);
        showToast({ message: 'Task updated!', type: 'success' });
      } else {
        await api.post('tasks', payload);
        showToast({ message: 'Task created!', type: 'success' });
      }
      closeModal();
      await loadTasks();
    } catch(err) {
      showToast({ message: err.message || 'Failed to save task', type: 'error' });
    } finally {
      btnText.style.display = '';
      spinner.style.display = 'none';
    }
  });

  // Globals
  window.editTask = (id) => {
    const task = allTasks.find(t => t.id === id);
    if (task) openModal(task);
  };

  window.deleteTask = async (id) => {
    if (!confirm('Delete this task?')) return;
    try {
      await api.delete(`tasks/${id}`);
      showToast({ message: 'Task deleted', type: 'success' });
      await loadTasks();
    } catch(err) {
      showToast({ message: err.message || 'Failed to delete', type: 'error' });
    }
  };

  window.updateTaskStatus = async (id, status) => {
    try {
      await api.put(`tasks/${id}/status`, { status });
      showToast({ message: 'Status updated!', type: 'success' });
      const task = allTasks.find(t => t.id === id);
      if (task) task.status = status;
      applyFilters();
    } catch(err) {
      showToast({ message: err.message || 'Failed to update', type: 'error' });
    }
  };

  await loadTasks();
}

window.renderTasks = renderTasks;
window.initTasks = initTasks;
