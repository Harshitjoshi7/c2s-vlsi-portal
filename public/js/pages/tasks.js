/* ============================================================
   C2S VLSI Lab Portal — Tasks Page (Premium Redesign)
   Kanban-style and list view task management
   ============================================================ */

function renderTasks() {
  const user = getUser();
  const isAdminUser = user && user.role === 'admin';

  return `
    <div class="page-enter">
      <div class="page-header" style="background: rgba(255, 255, 255, 0.02); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); border-radius: var(--border-radius-lg); padding: var(--space-xl); margin-bottom: var(--space-xl); border: 1px solid rgba(255, 255, 255, 0.05); box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);">
        <div class="page-header-left">
          <h1 class="page-title animate-slideUp" style="font-size: 2.2rem; font-weight: 800; background: linear-gradient(135deg, var(--warning), #ffca28); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">
            <i data-lucide="list-checks" style="width:36px;height:36px;vertical-align:-6px;margin-right:12px;color:var(--warning)"></i>
            Tasks
          </h1>
          <p class="page-subtitle animate-slideUp stagger-1" style="font-size: 1.1rem; color: var(--text-muted); margin-top: 8px;">Track, manage, and accelerate work assignments</p>
        </div>
        <div class="page-header-actions animate-slideUp stagger-2">
          <div style="display:flex;gap:var(--space-md); align-items:center;">
            <div class="btn-group" style="background: rgba(0,0,0,0.2); border-radius: var(--border-radius); padding: 4px; border: 1px solid rgba(255,255,255,0.05);">
              <button class="btn btn-ghost" id="taskViewList" title="List View" style="border-radius: var(--border-radius-sm); color: var(--text-primary); background: rgba(255,255,255,0.1);">
                <i data-lucide="list" style="width:18px;height:18px"></i>
              </button>
              <button class="btn btn-ghost" id="taskViewKanban" title="Kanban View" style="border-radius: var(--border-radius-sm); color: var(--text-muted);">
                <i data-lucide="kanban" style="width:18px;height:18px"></i>
              </button>
            </div>
            ${isAdminUser ? `
            <button class="btn btn-primary" id="newTaskBtn" style="box-shadow: 0 4px 15px rgba(79, 143, 255, 0.4); font-weight: 600; padding: 10px 20px;">
              <i data-lucide="plus" style="width:18px;height:18px; margin-right: 6px;"></i>
              New Task
            </button>
            ` : ''}
          </div>
        </div>
      </div>

      <!-- Task Stats -->
      <div class="grid grid-2 animate-slideUp stagger-2" style="gap:var(--space-md); margin-bottom:var(--space-md);">
        <div class="stat-card" style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); padding: 16px; border-radius: var(--border-radius-md);">
          <div style="font-size: 0.85rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600;">Total Tasks</div>
          <div id="statTotalTasks" style="font-size: 2rem; font-weight: 800; color: var(--text-primary);">0</div>
        </div>
        <div class="stat-card" style="background: rgba(0,230,118,0.05); border: 1px solid rgba(0,230,118,0.2); padding: 16px; border-radius: var(--border-radius-md);">
          <div style="font-size: 0.85rem; color: var(--success); text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600;">Completed Tasks</div>
          <div id="statCompletedTasks" style="font-size: 2rem; font-weight: 800; color: var(--success);">0</div>
        </div>
      </div>

      <!-- Tabs -->
      <div class="tabs-container animate-slideUp stagger-2" style="margin-bottom: var(--space-md); display: flex; gap: 10px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 8px;">
        <button class="btn btn-ghost active-tab" id="tabActiveTasks" style="border-radius: var(--border-radius-sm); font-weight: 600; color: var(--text-primary); background: rgba(255,255,255,0.1);">Active Tasks</button>
        <button class="btn btn-ghost" id="tabCompletedTasks" style="border-radius: var(--border-radius-sm); font-weight: 600; color: var(--text-muted);">Completed Tasks</button>
      </div>

      <!-- Filters -->
      <div class="card animate-slideUp stagger-2" style="margin-bottom:var(--space-xl); background: rgba(255,255,255,0.01); border: 1px solid rgba(255,255,255,0.03); backdrop-filter: blur(10px);">
        <div class="card-body" style="padding:var(--space-md) var(--space-lg)">
          <div style="display:flex;gap:var(--space-md);flex-wrap:wrap;align-items:center">
            <div class="search-input" style="flex:1;min-width:250px;">
              <i data-lucide="search" class="search-icon" style="color: var(--text-muted);"></i>
              <input type="text" id="taskSearch" placeholder="Search tasks by name or description..." style="background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.05); border-radius: var(--border-radius-sm); padding: 10px 10px 10px 40px; width: 100%; color: var(--text-primary);" />
            </div>
            <select class="form-select" id="taskStatusFilter" style="width:160px; background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.05);">
              <option value="">All Statuses</option>
              <option value="assigned">Assigned</option>
              <option value="in_progress">In Progress</option>
              <option value="under_review">Under Review</option>
              <option value="needs_revision">Needs Revision</option>
              <option value="completed">Completed</option>
            </select>
            <select class="form-select" id="taskPriorityFilter" style="width:160px; background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.05);">
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
      <div id="tasksContainer" class="animate-slideUp stagger-3">
        <div style="display:flex;flex-direction:column;gap:var(--space-md)">
          ${[1,2,3].map(() => `
            <div class="card" style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05);">
              <div class="card-body">
                <div class="skeleton skeleton-heading" style="width:40%;margin-bottom:12px; height:20px;"></div>
                <div class="skeleton skeleton-text" style="width:75%; margin-bottom:8px;"></div>
                <div class="skeleton skeleton-text" style="width:60%;"></div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>

    <!-- Task Modal (Create/Edit) -->
    <div class="modal-overlay" id="taskModalOverlay" style="display:none; backdrop-filter: blur(8px); background: rgba(0,0,0,0.6);">
      <div class="modal" style="max-width:650px; background: rgba(20, 24, 45, 0.95); border: 1px solid rgba(255,255,255,0.1); box-shadow: 0 25px 50px rgba(0,0,0,0.5);">
        <div class="modal-header" style="border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 15px;">
          <h3 class="modal-title" id="taskModalTitle" style="font-size: 1.4rem; font-weight: 700;">New Task</h3>
          <button class="modal-close" id="taskModalClose" style="background: rgba(255,255,255,0.05); border-radius: 50%; padding: 4px;">
            <i data-lucide="x" style="width:20px;height:20px"></i>
          </button>
        </div>
        <div class="modal-body" style="padding: 24px;">
          <form id="taskForm">
            <div class="form-group" style="margin-bottom: 20px;">
              <label class="form-label" style="font-weight: 600; color: var(--text-secondary);">Title *</label>
              <input type="text" class="form-input" id="taskTitle" placeholder="Enter an actionable task title..." required style="font-size: 1.1rem; padding: 12px; background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.1);" />
            </div>
            <div class="form-group" style="margin-bottom: 20px;">
              <label class="form-label" style="font-weight: 600; color: var(--text-secondary);">Description</label>
              <textarea class="form-textarea" id="taskDesc" rows="4" placeholder="Provide detailed context and acceptance criteria..." style="background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.1); padding: 12px;"></textarea>
            </div>
            <div class="grid grid-2" style="gap:var(--space-lg); margin-bottom: 20px;">
              <div class="form-group">
                <label class="form-label" style="font-weight: 600; color: var(--text-secondary);">Priority</label>
                <select class="form-select" id="taskPriority" style="background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.1);">
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label" style="font-weight: 600; color: var(--text-secondary);">Category</label>
                <input type="text" class="form-input" id="taskCategory" placeholder="e.g., Synthesis, Design" style="background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.1);" />
              </div>
              <div class="form-group">
                <label class="form-label" style="font-weight: 600; color: var(--text-secondary);">Deadline</label>
                <input type="date" class="form-input" id="taskDeadline" style="background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.1);" />
              </div>
            </div>
            <div class="form-group" id="taskAssigneeGroup">
              <label class="form-label" style="font-weight: 600; color: var(--text-secondary);">Assign To</label>
              <select class="form-select" id="taskAssignee" multiple style="height:140px; background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.1);">
              </select>
              <p class="form-hint" style="margin-top: 6px; color: var(--text-muted);"><i data-lucide="info" style="width:14px;height:14px;vertical-align:-2px;"></i> Hold Ctrl/Cmd to select multiple students</p>
            </div>
          </form>
        </div>
        <div class="modal-footer" style="border-top: 1px solid rgba(255,255,255,0.05); padding-top: 15px;">
          <button class="btn btn-secondary" id="taskModalCancel" style="background: transparent; border: 1px solid rgba(255,255,255,0.2);">Cancel</button>
          <button class="btn btn-primary" id="taskSubmitBtn" style="font-weight: 600; box-shadow: 0 4px 15px rgba(79, 143, 255, 0.4);">
            <span id="taskSubmitText">Create Task</span>
            <div class="spinner" id="taskSubmitSpinner" style="display:none; width: 16px; height: 16px;"></div>
          </button>
        </div>
      </div>
    </div>

    <!-- View Task Modal -->
    <div class="modal-overlay" id="viewTaskModalOverlay" style="display:none; backdrop-filter: blur(8px); background: rgba(0,0,0,0.6);">
      <div class="modal" style="max-width:650px; background: rgba(20, 24, 45, 0.95); border: 1px solid rgba(255,255,255,0.1); box-shadow: 0 25px 50px rgba(0,0,0,0.5);">
        <div class="modal-header" style="border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 15px; display: flex; align-items: flex-start;">
          <div style="flex:1;">
            <div style="display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap" id="viewTaskBadges"></div>
            <h3 class="modal-title" id="viewTaskTitle" style="font-size: 1.5rem; font-weight: 800; line-height: 1.3;">Task Details</h3>
          </div>
          <button class="modal-close" id="viewTaskModalClose" style="background: rgba(255,255,255,0.05); border-radius: 50%; padding: 4px; margin-left: 16px;">
            <i data-lucide="x" style="width:20px;height:20px"></i>
          </button>
        </div>
        <div class="modal-body" style="padding: 24px; padding-top: 20px;">
          <div style="background: rgba(0,0,0,0.15); border: 1px solid rgba(255,255,255,0.05); border-radius: var(--border-radius); padding: 16px; margin-bottom: 24px;">
            <p style="color:var(--text-secondary);line-height:1.7;margin:0; font-size: 0.95rem;" id="viewTaskDesc"></p>
          </div>
          <div class="grid grid-2" style="gap:var(--space-md);background:linear-gradient(145deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01));padding:var(--space-lg);border-radius:var(--border-radius);border:1px solid rgba(255,255,255,0.05); box-shadow: inset 0 2px 10px rgba(0,0,0,0.1);">
            <div>
              <div style="font-size:0.75rem;color:var(--text-muted);margin-bottom:6px; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600;">Deadline</div>
              <div style="font-weight:600; font-size: 0.95rem; display: flex; align-items: center; gap: 6px;" id="viewTaskDeadline"></div>
            </div>
            <div>
              <div style="font-size:0.75rem;color:var(--text-muted);margin-bottom:6px; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600;">Category</div>
              <div style="font-weight:600; font-size: 0.95rem;" id="viewTaskCategory"></div>
            </div>
            <div>
              <div style="font-size:0.75rem;color:var(--text-muted);margin-bottom:6px; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600;">Assigned By</div>
              <div style="font-weight:600; font-size: 0.95rem; display: flex; align-items: center; gap: 6px;" id="viewTaskAssignedBy"></div>
            </div>
            <div id="viewTaskStatusContainer">
              <div style="font-size:0.75rem;color:var(--text-muted);margin-bottom:6px; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600;">Global Status</div>
              <div style="font-weight:600; font-size: 0.95rem;" id="viewTaskStatus"></div>
            </div>
          </div>
          <div id="viewTaskAssigneesContainer" style="margin-top:24px;display:none;">
            <div style="font-size:0.85rem;font-weight:700;margin-bottom:12px; color: var(--text-primary); border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 8px;">Task Assignments</div>
            <div id="viewTaskAssignees" style="display:flex;flex-direction:column;gap:10px;"></div>
          </div>

          <!-- History Log -->
          <div style="margin-top:24px;">
            <div style="font-size:0.85rem;font-weight:700;margin-bottom:12px; color: var(--text-primary); border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 8px;">Task History & Feedback</div>
            <div id="viewTaskHistoryLog" style="display:flex;flex-direction:column;gap:12px; max-height: 250px; overflow-y:auto; padding-right:8px; margin-bottom: 16px;">
            </div>
            
            <form id="taskHistoryForm" style="display:flex; flex-direction:column; gap:12px; background: rgba(0,0,0,0.2); padding: 16px; border-radius: var(--border-radius); border: 1px solid rgba(255,255,255,0.05);">
              <textarea id="taskHistoryMessage" class="form-textarea" placeholder="Add a comment or update..." style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.1); padding: 10px; border-radius: 8px;"></textarea>
              <div style="display:flex; gap:10px; justify-content: space-between; align-items: center; flex-wrap: wrap;">
                <input type="file" id="taskHistoryImage" accept="image/*" class="form-input" style="font-size: 0.8rem; padding: 6px; max-width: 200px; background: rgba(0,0,0,0.3); border-radius: 6px;" />
                <button type="submit" class="btn btn-primary btn-sm" id="taskHistorySubmitBtn" style="font-weight:600; padding: 6px 16px;">
                  <i data-lucide="send" style="width:14px;height:14px;margin-right:6px"></i> Post Update
                </button>
              </div>
            </form>
          </div>
        </div>
        <div class="modal-footer" id="viewTaskModalFooter" style="border-top: 1px solid rgba(255,255,255,0.05); padding-top: 15px; display: flex; justify-content: space-between;">
           <div id="viewTaskActionsLeft"></div>
           <div id="viewTaskActionsRight"></div>
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
    critical: { label:'Critical', color:'var(--priority-critical)', bg:'rgba(255,82,82,0.15)' },
  };

  const statusConfig = {
    assigned:     { label:'Assigned',     color:'var(--info)',    bg:'rgba(64,196,255,0.1)'  },
    in_progress:  { label:'In Progress',  color:'var(--warning)', bg:'rgba(255,171,64,0.1)' },
    under_review: { label:'Under Review', color:'var(--accent-secondary)', bg:'rgba(124,92,255,0.1)' },
    needs_revision: { label:'Needs Revision', color:'var(--error)', bg:'rgba(255,82,82,0.15)' },
    completed:    { label:'Completed',    color:'var(--success)', bg:'rgba(0,230,118,0.1)'  },
  };

  function renderListView(tasks) {
    const container = document.getElementById('tasksContainer');
    if (!container) return;

    if (!tasks || tasks.length === 0) {
      container.innerHTML = `
        <div class="card" style="background: rgba(255,255,255,0.02); border: 1px dashed rgba(255,255,255,0.1);"><div class="card-body">
          <div class="empty-state">
            <div class="empty-state-icon" style="background: rgba(255,255,255,0.05); color: var(--text-muted);"><i data-lucide="check-square" style="width:32px;height:32px"></i></div>
            <div class="empty-state-title" style="font-size: 1.2rem; margin-top: 16px;">No tasks found</div>
            <div class="empty-state-description" style="color: var(--text-muted); margin-top: 8px;">${isAdminUser ? 'Create a task to get started.' : 'You have no assigned tasks right now.'}</div>
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
        <div class="card" style="overflow-x:auto; background: rgba(20,24,45,0.6); backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.05); border-radius: var(--border-radius-lg); box-shadow: 0 10px 30px rgba(0,0,0,0.2);">
          <table class="table" style="width:100%;text-align:left;border-collapse:collapse;min-width:700px">
            <thead>
              <tr style="border-bottom:1px solid rgba(255,255,255,0.08);background:rgba(255,255,255,0.02)">
                <th style="padding:16px;font-weight:600;font-size:0.85rem;color:var(--text-secondary); text-transform:uppercase; letter-spacing:0.05em;">Assignee</th>
                <th style="padding:16px;font-weight:600;font-size:0.85rem;color:var(--text-secondary); text-transform:uppercase; letter-spacing:0.05em;">Task Title</th>
                <th style="padding:16px;font-weight:600;font-size:0.85rem;color:var(--text-secondary); text-transform:uppercase; letter-spacing:0.05em;">Priority</th>
                <th style="padding:16px;font-weight:600;font-size:0.85rem;color:var(--text-secondary); text-transform:uppercase; letter-spacing:0.05em;">Status</th>
                <th style="padding:16px;font-weight:600;font-size:0.85rem;color:var(--text-secondary); text-transform:uppercase; letter-spacing:0.05em;">Due Date</th>
                <th style="padding:16px;font-weight:600;font-size:0.85rem;color:var(--text-secondary); text-transform:uppercase; letter-spacing:0.05em; text-align:right;">Actions</th>
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
                  <tr style="border-bottom:1px solid rgba(255,255,255,0.03); transition: background 0.3s;" class="hover-bg-glass">
                    <td style="padding:16px;vertical-align:middle">
                      ${student ? `
                        <div style="display:flex;align-items:center;gap:12px">
                          <div style="width:32px;height:32px;border-radius:50%;background: linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05)); border: 1px solid rgba(255,255,255,0.1); display:flex;align-items:center;justify-content:center;font-size:0.85rem;font-weight:700;color:var(--text-primary); box-shadow: 0 2px 5px rgba(0,0,0,0.2);">
                            ${student.name.charAt(0).toUpperCase()}
                          </div>
                          <span style="font-weight:600; font-size: 0.95rem;">${student.name}</span>
                        </div>
                      ` : '<span style="color:var(--text-muted);font-style:italic; padding: 4px 10px; background: rgba(255,255,255,0.05); border-radius: 20px; font-size: 0.8rem;">Unassigned</span>'}
                    </td>
                    <td style="padding:16px;vertical-align:middle;cursor:pointer" onclick="viewTask(${task.id})">
                      <div style="font-weight:600;color:var(--text-primary);margin-bottom:6px; font-size: 1rem;">${task.title}</div>
                      ${task.category ? `<span class="badge badge-info" style="font-size:0.7rem; padding: 2px 8px; border-radius: 12px; background: rgba(79,143,255,0.1); color: var(--info); border: 1px solid rgba(79,143,255,0.2);">${task.category}</span>` : ''}
                    </td>
                    <td style="padding:16px;vertical-align:middle">
                      <span style="padding:4px 10px;border-radius:20px;font-size:0.75rem;font-weight:700;background:${pri.bg};color:${pri.color};text-transform:uppercase; border: 1px solid ${pri.color}33; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">${pri.label}</span>
                    </td>
                    <td style="padding:16px;vertical-align:middle">
                      ${student ? `
                      <select class="form-select btn-sm" style="width:auto;padding:6px 28px 6px 12px;font-size:0.8rem;border-radius:20px;background:${st.bg};color:${st.color};border:1px solid ${st.color}44;font-weight:600; cursor: pointer; transition: all 0.2s;" onchange="updateTaskStatus(${task.id}, this.value, ${student.id})" onmouseover="this.style.boxShadow='0 2px 8px ${st.color}33'" onmouseout="this.style.boxShadow='none'">
                        <option value="assigned" ${student.status === 'assigned' ? 'selected' : ''}>Assigned</option>
                        <option value="in_progress" ${student.status === 'in_progress' ? 'selected' : ''}>In Progress</option>
                        <option value="under_review" ${student.status === 'under_review' ? 'selected' : ''}>Under Review</option>
                        <option value="needs_revision" ${student.status === 'needs_revision' ? 'selected' : ''}>Needs Revision</option>
                        <option value="completed" ${student.status === 'completed' ? 'selected' : ''}>Completed</option>
                      </select>
                      ` : `<span style="padding:6px 12px;border-radius:20px;font-size:0.8rem;font-weight:600;background:${st.bg};color:${st.color}; border: 1px solid ${st.color}44;">${st.label}</span>`}
                    </td>
                    <td style="padding:16px;vertical-align:middle">
                      ${task.deadline ? `<span style="font-size:0.85rem; font-weight: 500; color:${isOverdue ? 'var(--error)' : 'var(--text-secondary)'}; background: ${isOverdue ? 'rgba(255,82,82,0.1)' : 'rgba(255,255,255,0.03)'}; padding: 4px 8px; border-radius: 6px;">${new Date(task.deadline).toLocaleDateString()}</span>` : '<span style="color:var(--text-muted)">-</span>'}
                    </td>
                    <td style="padding:16px;vertical-align:middle; text-align: right;">
                      <div style="display:flex;gap:8px; justify-content: flex-end;">
                        <button class="btn btn-ghost btn-sm" onclick="editTask(${task.id})" title="Edit Task" style="background: rgba(255,255,255,0.05); border-radius: 8px;">
                          <i data-lucide="pencil" style="width:16px;height:16px; color: var(--text-secondary);"></i>
                        </button>
                        ${student ? `
                          <button class="btn btn-ghost btn-sm" onclick="removeAssignment(${task.id}, ${student.id})" title="Unassign Student" style="background: rgba(255,82,82,0.1); border-radius: 8px;">
                            <i data-lucide="user-minus" style="width:16px;height:16px; color: var(--error);"></i>
                          </button>
                        ` : ''}
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
      // Student View List
      container.innerHTML = `
        <div style="display:flex;flex-direction:column;gap:var(--space-lg)">
          ${tasks.map(task => {
            const pri = priorityConfig[task.priority] || priorityConfig.medium;
            const st = statusConfig[task.status] || statusConfig.assigned;
            const isOverdue = task.deadline && new Date(task.deadline) < new Date() && task.status !== 'completed';

            return `
              <div class="card hover-glow" style="background: rgba(20,24,45,0.7); backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.05); border-left: 4px solid ${pri.color}; border-radius: var(--border-radius-lg); transition: all 0.3s; cursor: pointer; box-shadow: 0 4px 20px rgba(0,0,0,0.15);" onclick="viewTask(${task.id})">
                <div class="card-body" style="padding:var(--space-xl)">
                  <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:var(--space-lg); flex-wrap: wrap;">
                    <div style="flex:1; min-width: 250px;">
                      <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:12px">
                        <span style="padding:4px 12px;border-radius:20px;font-size:0.75rem;font-weight:700;background:${pri.bg};color:${pri.color};text-transform:uppercase;letter-spacing:0.05em; border: 1px solid ${pri.color}33;">${pri.label} Priority</span>
                        ${task.category ? `<span style="padding:4px 12px;border-radius:20px;font-size:0.75rem;font-weight:600;background:rgba(79,143,255,0.1);color:var(--info); border: 1px solid rgba(79,143,255,0.2);">${task.category}</span>` : ''}
                        ${isOverdue ? `<span style="padding:4px 12px;border-radius:20px;font-size:0.75rem;font-weight:700;background:rgba(255,82,82,0.15);color:var(--error); border: 1px solid rgba(255,82,82,0.3); animation: pulse 2s infinite;">Overdue</span>` : ''}
                      </div>
                      <h4 style="margin:0 0 12px;font-size:1.25rem; font-weight: 700; color: var(--text-primary); letter-spacing: -0.01em;">${task.title}</h4>
                      ${task.description ? `<p style="color:var(--text-secondary);font-size:0.95rem;margin:0;line-height:1.6;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">${task.description}</p>` : ''}
                      <div style="display:flex;align-items:center;gap:var(--space-xl);margin-top:20px; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 16px;">
                        ${task.deadline ? `<span style="font-size:0.85rem; font-weight: 500; color:${isOverdue ? 'var(--error)' : 'var(--text-secondary)'}; display: flex; align-items: center;"><i data-lucide="calendar" style="width:16px;height:16px;margin-right:6px;"></i> Due ${new Date(task.deadline).toLocaleDateString()}</span>` : ''}
                        ${task.assigned_by_name ? `<span style="font-size:0.85rem; font-weight: 500; color:var(--text-secondary); display: flex; align-items: center;"><i data-lucide="user" style="width:16px;height:16px;margin-right:6px;"></i> From ${task.assigned_by_name}</span>` : ''}
                      </div>
                    </div>
                    <div style="display:flex; flex-direction: column; align-items: flex-end; gap: 12px;" onclick="event.stopPropagation()">
                       <span style="padding:6px 16px;border-radius:20px;font-size:0.85rem;font-weight:600;background:${st.bg};color:${st.color}; border: 1px solid ${st.color}44;">${st.label}</span>
                      ${task.status !== 'completed' ? `
                      <select class="form-select btn-sm" style="width:auto;padding:8px 32px 8px 16px;font-size:0.85rem; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; font-weight: 600;" onchange="updateTaskStatus(${task.id}, this.value)">
                        <option value="assigned" ${task.status === 'assigned' ? 'selected' : ''}>Assigned</option>
                        <option value="in_progress" ${task.status === 'in_progress' ? 'selected' : ''}>Mark In Progress</option>
                        <option value="under_review" ${task.status === 'under_review' ? 'selected' : ''}>Submit for Review</option>
                        ${task.status === 'needs_revision' ? `<option value="needs_revision" selected disabled>Needs Revision</option>` : ''}
                        <option value="completed">Complete Task</option>
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
      { key: 'needs_revision', label: 'Needs Revision', color: 'var(--error)' },
      { key: 'completed', label: 'Completed', color: 'var(--success)' },
    ];

    container.innerHTML = `
      <div class="grid grid-stats" style="overflow-x:auto;min-width:900px; gap: 24px;">
        ${columns.map(col => {
          let colTasks = [];
          if(isAdminUser) {
             // Extract assignments that match this status
             tasks.forEach(task => {
                if(task.assignees && task.assignees.length > 0) {
                   task.assignees.forEach(a => {
                      if(a.status === col.key) colTasks.push({task, student: a});
                   });
                } else if (task.status === col.key) {
                   colTasks.push({task, student: null});
                }
             });
          } else {
             colTasks = tasks.filter(t => t.status === col.key).map(task => ({task, student: null}));
          }

          return `
            <div style="background:rgba(20,24,45,0.6); backdrop-filter: blur(10px); border:1px solid rgba(255,255,255,0.05); border-top: 3px solid ${col.color}; border-radius:var(--border-radius-lg); padding:var(--space-lg); box-shadow: 0 10px 30px rgba(0,0,0,0.15); display: flex; flex-direction: column; max-height: 70vh; overflow-y: auto;" class="custom-scroll">
              <div style="display:flex;align-items:center;gap:10px;margin-bottom:var(--space-lg);padding-bottom:var(--space-md);border-bottom:1px solid rgba(255,255,255,0.05)">
                <span style="font-weight:700;font-size:1.05rem;color:var(--text-primary); letter-spacing: 0.02em;">${col.label}</span>
                <span style="margin-left:auto;background:rgba(255,255,255,0.08);color:var(--text-primary);border-radius:20px;padding:2px 10px;font-size:0.8rem;font-weight:700; border: 1px solid rgba(255,255,255,0.1);">${colTasks.length}</span>
              </div>
              <div style="display: flex; flex-direction: column; gap: var(--space-md);">
                ${colTasks.length === 0 ? `<div style="color:var(--text-muted);font-size:0.85rem;text-align:center;padding:var(--space-xl) 0; font-style: italic; background: rgba(0,0,0,0.2); border-radius: 8px; border: 1px dashed rgba(255,255,255,0.05);">No tasks</div>` : ''}
                ${colTasks.map(item => {
                  const task = item.task;
                  const student = item.student;
                  const pri = priorityConfig[task.priority] || priorityConfig.medium;
                  return `
                    <div class="card hover-glow" style="background: rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.05); border-left: 3px solid ${pri.color}; cursor:pointer; padding:var(--space-md); border-radius: var(--border-radius); transition: transform 0.2s, box-shadow 0.2s;" onclick="viewTask(${task.id})" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 5px 15px rgba(0,0,0,0.2)';" onmouseout="this.style.transform='none'; this.style.boxShadow='none';">
                      <div style="margin-bottom:10px; display: flex; justify-content: space-between; align-items: center;">
                        <span style="padding:3px 8px;border-radius:12px;font-size:0.65rem;font-weight:700;background:${pri.bg};color:${pri.color};text-transform:uppercase; border: 1px solid ${pri.color}33;">${pri.label}</span>
                        ${task.category ? `<span style="font-size: 0.7rem; color: var(--text-muted);">${task.category}</span>` : ''}
                      </div>
                      <div style="font-size:0.95rem;font-weight:600;color:var(--text-primary);margin-bottom:8px;line-height:1.4;">${task.title}</div>
                      ${task.deadline ? `<div style="font-size:0.75rem;color:var(--text-secondary); margin-bottom: 10px; display: flex; align-items: center;"><i data-lucide="clock" style="width:12px;height:12px;margin-right:4px;"></i>${new Date(task.deadline).toLocaleDateString()}</div>` : ''}
                      
                      ${student ? `
                         <div style="display:flex;align-items:center;gap:8px; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 8px; margin-top: 8px;">
                           <div style="width:20px;height:20px;border-radius:50%;background:rgba(255,255,255,0.1);display:flex;align-items:center;justify-content:center;font-size:0.65rem;font-weight:700;color:var(--text-primary);">${student.name.charAt(0).toUpperCase()}</div>
                           <span style="font-size:0.75rem; color: var(--text-secondary);">${student.name}</span>
                         </div>
                      ` : `
                         ${task.assignees && task.assignees.length > 0 ? `
                           <div style="display:flex;gap:4px;flex-wrap:wrap;border-top: 1px solid rgba(255,255,255,0.05); padding-top: 8px; margin-top: 8px;">
                             ${task.assignees.map(a => `<div style="width:20px;height:20px;border-radius:50%;background:rgba(255,255,255,0.1);display:flex;align-items:center;justify-content:center;font-size:0.65rem;font-weight:700;color:var(--text-primary);" title="${a.name}">${a.name.charAt(0).toUpperCase()}</div>`).join('')}
                           </div>
                         ` : ''}
                      `}
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

  let currentTaskTab = 'active'; // 'active' or 'completed'

  // Filters
  function applyFilters() {
    const search = document.getElementById('taskSearch')?.value.toLowerCase() || '';
    const statusFilter = document.getElementById('taskStatusFilter')?.value || '';
    const priorityFilter = document.getElementById('taskPriorityFilter')?.value || '';

    let totalTasks = allTasks.length;
    let completedTasks = allTasks.filter(t => t.status === 'completed').length;
    
    if (document.getElementById('statTotalTasks')) {
      document.getElementById('statTotalTasks').textContent = totalTasks;
    }
    if (document.getElementById('statCompletedTasks')) {
      document.getElementById('statCompletedTasks').textContent = completedTasks;
    }

    const filtered = allTasks.filter(t => {
      const matchSearch = !search || (t.title || '').toLowerCase().includes(search) || (t.description || '').toLowerCase().includes(search);
      const matchPriority = !priorityFilter || t.priority === priorityFilter;
      let matchStatus = !statusFilter || t.status === statusFilter;
      
      if (isAdminUser && statusFilter && t.assignees) {
        matchStatus = matchStatus || t.assignees.some(a => a.status === statusFilter);
      }
      
      const matchTab = currentTaskTab === 'active' ? t.status !== 'completed' : t.status === 'completed';

      return matchSearch && matchStatus && matchPriority && matchTab;
    });

    if (viewMode === 'kanban') renderKanbanView(filtered);
    else renderListView(filtered);
  }

  ['taskSearch','taskStatusFilter','taskPriorityFilter'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', applyFilters);
      el.addEventListener('change', applyFilters);
    }
  });

  // Tab toggles
  document.getElementById('tabActiveTasks')?.addEventListener('click', (e) => {
    currentTaskTab = 'active';
    e.target.classList.add('active-tab');
    e.target.style.background = 'rgba(255,255,255,0.1)';
    e.target.style.color = 'var(--text-primary)';
    const other = document.getElementById('tabCompletedTasks');
    if (other) {
      other.classList.remove('active-tab');
      other.style.background = 'transparent';
      other.style.color = 'var(--text-muted)';
    }
    applyFilters();
  });
  
  document.getElementById('tabCompletedTasks')?.addEventListener('click', (e) => {
    currentTaskTab = 'completed';
    e.target.classList.add('active-tab');
    e.target.style.background = 'rgba(255,255,255,0.1)';
    e.target.style.color = 'var(--text-primary)';
    const other = document.getElementById('tabActiveTasks');
    if (other) {
      other.classList.remove('active-tab');
      other.style.background = 'transparent';
      other.style.color = 'var(--text-muted)';
    }
    applyFilters();
  });

  // View toggles
  document.getElementById('taskViewList')?.addEventListener('click', () => {
    viewMode = 'list';
    document.getElementById('taskViewList').style.background = 'rgba(255,255,255,0.1)';
    document.getElementById('taskViewList').style.color = 'var(--text-primary)';
    document.getElementById('taskViewKanban').style.background = 'transparent';
    document.getElementById('taskViewKanban').style.color = 'var(--text-muted)';
    applyFilters();
  });
  document.getElementById('taskViewKanban')?.addEventListener('click', () => {
    viewMode = 'kanban';
    document.getElementById('taskViewKanban').style.background = 'rgba(255,255,255,0.1)';
    document.getElementById('taskViewKanban').style.color = 'var(--text-primary)';
    document.getElementById('taskViewList').style.background = 'transparent';
    document.getElementById('taskViewList').style.color = 'var(--text-muted)';
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
    document.getElementById('taskSubmitText').textContent = task ? 'Update Task' : 'Create Task';
    
    // Clear select
    const sel = document.getElementById('taskAssignee');
    if(sel) {
      Array.from(sel.options).forEach(opt => opt.selected = false);
      if (task && task.assignees) {
         task.assignees.forEach(a => {
            const opt = Array.from(sel.options).find(o => parseInt(o.value) === a.id);
            if(opt) opt.selected = true;
         });
      }
    }
    
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
    document.getElementById('viewTaskDesc').textContent = task.description || 'No detailed description provided for this task.';
    
    const pri = priorityConfig[task.priority] || priorityConfig.medium;
    const st = statusConfig[task.status] || statusConfig.assigned;
    
    let badgesHtml = `<span style="padding:4px 12px;border-radius:20px;font-size:0.75rem;font-weight:700;background:${pri.bg};color:${pri.color};text-transform:uppercase; border: 1px solid ${pri.color}33;">${pri.label}</span>`;
    if (!isAdminUser) {
      badgesHtml += `<span style="padding:4px 12px;border-radius:20px;font-size:0.75rem;font-weight:700;background:${st.bg};color:${st.color}; border: 1px solid ${st.color}33;">${st.label}</span>`;
    }
    if (task.category) {
      badgesHtml += `<span class="badge badge-info" style="font-size:0.75rem; padding: 4px 12px; border-radius: 20px; background: rgba(79,143,255,0.1); color: var(--info); border: 1px solid rgba(79,143,255,0.2);">${task.category}</span>`;
    }
    document.getElementById('viewTaskBadges').innerHTML = badgesHtml;
    
    document.getElementById('viewTaskDeadline').innerHTML = task.deadline ? `<i data-lucide="calendar" style="width:16px;height:16px;color:var(--text-muted)"></i> ${new Date(task.deadline).toLocaleDateString()}` : '-';
    document.getElementById('viewTaskCategory').textContent = task.category || '-';
    document.getElementById('viewTaskAssignedBy').innerHTML = `<i data-lucide="user" style="width:16px;height:16px;color:var(--text-muted)"></i> ${task.assigned_by_name || '-'}`;
    
    document.getElementById('viewTaskStatus').innerHTML = `
      <span style="padding:4px 10px;border-radius:6px;font-size:0.8rem;font-weight:600;background:${st.bg};color:${st.color}; border: 1px solid ${st.color}33;">${st.label}</span>
    `;

    const leftActions = document.getElementById('viewTaskActionsLeft');
    const rightActions = document.getElementById('viewTaskActionsRight');
    leftActions.innerHTML = '';
    rightActions.innerHTML = '';

    if (isAdminUser) {
      leftActions.innerHTML = `
        <button class="btn btn-ghost" onclick="deleteTask(${task.id})" style="color:var(--error); background: rgba(255,82,82,0.1); border-radius: 8px; font-weight: 600;" title="Delete Entire Task">
          <i data-lucide="trash-2" style="width:16px;height:16px;margin-right:6px"></i> Delete Task
        </button>
      `;
      rightActions.innerHTML = `
         <button class="btn btn-primary" onclick="editTask(${task.id})" style="font-weight: 600;">
          <i data-lucide="pencil" style="width:16px;height:16px;margin-right:6px"></i> Edit Details
        </button>
      `;

      const assigneesContainer = document.getElementById('viewTaskAssigneesContainer');
      const assigneesDiv = document.getElementById('viewTaskAssignees');
      if (task.assignees && task.assignees.length > 0) {
        assigneesDiv.innerHTML = task.assignees.map(a => {
          const ast = statusConfig[a.status] || statusConfig.assigned;
          return `<div style="display:flex;align-items:center;gap:12px;padding:12px 16px;border-radius:var(--border-radius);background:rgba(0,0,0,0.2);border:1px solid rgba(255,255,255,0.05); transition: background 0.2s;" class="hover-bg-glass">
            <div style="width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05)); border: 1px solid rgba(255,255,255,0.1); display:flex;align-items:center;justify-content:center;font-size:0.9rem;font-weight:700; color: var(--text-primary);">${a.name.charAt(0).toUpperCase()}</div>
            <span style="font-size:0.95rem;font-weight:600; flex: 1;">${a.name}</span>
            <select class="form-select btn-sm" style="width:auto;padding:6px 28px 6px 12px;font-size:0.8rem;border:1px solid ${ast.color}44;background:${ast.bg};color:${ast.color}; border-radius: 8px; font-weight: 600;" onchange="updateTaskStatus(${task.id}, this.value, ${a.id})">
              <option value="assigned" ${a.status === 'assigned' ? 'selected' : ''}>Assigned</option>
              <option value="in_progress" ${a.status === 'in_progress' ? 'selected' : ''}>In Progress</option>
              <option value="under_review" ${a.status === 'under_review' ? 'selected' : ''}>Under Review</option>
              <option value="needs_revision" ${a.status === 'needs_revision' ? 'selected' : ''}>Needs Revision</option>
              <option value="completed" ${a.status === 'completed' ? 'selected' : ''}>Completed</option>
            </select>
            <button class="btn btn-ghost btn-sm" onclick="removeAssignment(${task.id}, ${a.id})" title="Remove Assignment" style="color: var(--error); background: rgba(255,82,82,0.1); border-radius: 8px; padding: 6px;">
               <i data-lucide="user-minus" style="width: 16px; height: 16px;"></i>
            </button>
          </div>`;
        }).join('');
        assigneesContainer.style.display = 'block';
      } else {
        assigneesContainer.style.display = 'none';
      }
    } else {
      document.getElementById('viewTaskStatusContainer').style.display = 'none';
      
      // Student view actions
      if (task.status !== 'completed') {
         rightActions.innerHTML = `
          <select class="form-select" style="padding:10px 36px 10px 16px;font-size:0.95rem; background: var(--accent-primary); color: #fff; border: none; border-radius: 8px; font-weight: 600;" onchange="updateTaskStatus(${task.id}, this.value)">
            <option value="assigned" ${task.status === 'assigned' ? 'selected' : ''}>Assigned</option>
            <option value="in_progress" ${task.status === 'in_progress' ? 'selected' : ''}>Mark In Progress</option>
            <option value="under_review" ${task.status === 'under_review' ? 'selected' : ''}>Submit for Review</option>
            ${task.status === 'needs_revision' ? `<option value="needs_revision" selected disabled>Needs Revision</option>` : ''}
          </select>
        `;
      } else {
         rightActions.innerHTML = `
           <div style="padding: 10px 20px; background: ${st.bg}; color: ${st.color}; border: 1px solid ${st.color}44; border-radius: 8px; font-weight: 600; display: flex; align-items: center;">
             <i data-lucide="check-circle" style="width: 18px; height: 18px; margin-right: 8px;"></i> Task Completed
           </div>
         `;
      }
      document.getElementById('viewTaskAssigneesContainer').style.display = 'none';
    }
    
    viewOverlay.style.display = 'flex';
    if (window.lucide) lucide.createIcons();
  }
  function closeViewModal() { viewOverlay.style.display = 'none'; }
  document.getElementById('viewTaskModalClose')?.addEventListener('click', closeViewModal);
  viewOverlay?.addEventListener('click', e => { if (e.target === viewOverlay) closeViewModal(); });
  
  window.viewTask = (id) => {
    const task = allTasks.find(t => t.id === id);
    if (task) {
      // Render History Log
      const historyLogContainer = document.getElementById('viewTaskHistoryLog');
      let historyLog = [];
      try {
        if (task.history_log) historyLog = typeof task.history_log === 'string' ? JSON.parse(task.history_log) : task.history_log;
      } catch (e) {}
      
      if (historyLog.length > 0) {
        historyLogContainer.innerHTML = historyLog.map(h => `
          <div style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); padding: 12px; border-radius: 8px;">
            <div style="display:flex; justify-content: space-between; margin-bottom: 8px;">
              <span style="font-weight:600; font-size: 0.9rem; color: var(--text-primary);"><i data-lucide="user" style="width:14px;height:14px;margin-right:4px;"></i>${h.user}</span>
              <span style="font-size:0.75rem; color: var(--text-muted);">${new Date(h.timestamp).toLocaleString()}</span>
            </div>
            ${h.status_change ? `<div style="font-size:0.8rem; color: var(--info); margin-bottom: 6px;"><i>Changed status to <b>${h.status_change}</b></i></div>` : ''}
            ${h.message ? `<p style="font-size:0.9rem; color: var(--text-secondary); margin: 0 0 8px 0; line-height: 1.5;">${h.message}</p>` : ''}
            ${h.image_url ? `<img src="${h.image_url}" style="max-width: 100%; border-radius: 6px; border: 1px solid rgba(255,255,255,0.1); margin-top: 8px;" />` : ''}
          </div>
        `).join('');
      } else {
        historyLogContainer.innerHTML = `<div style="color:var(--text-muted); font-size: 0.85rem; font-style: italic;">No history yet.</div>`;
      }
      
      const historyForm = document.getElementById('taskHistoryForm');
      if (historyForm) {
        historyForm.dataset.taskId = id;
        document.getElementById('taskHistoryMessage').value = '';
        document.getElementById('taskHistoryImage').value = '';
      }

      openViewModal(task);
    }
  };

  // Task History Submit
  document.getElementById('taskHistoryForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const taskId = e.target.dataset.taskId;
    const message = document.getElementById('taskHistoryMessage').value.trim();
    const imageFile = document.getElementById('taskHistoryImage').files[0];
    
    if (!message && !imageFile) {
      return showToast({ message: 'Please provide a message or an image.', type: 'warning' });
    }
    
    const submitBtn = document.getElementById('taskHistorySubmitBtn');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<div class="spinner" style="width:14px;height:14px;"></div>';
    
    try {
      const formData = new FormData();
      if (message) formData.append('message', message);
      if (imageFile) formData.append('image', imageFile);
      
      await api.post(`tasks/${taskId}/history`, formData);
      showToast({ message: 'Update posted successfully.', type: 'success' });
      
      // Reload specific task if possible, or reload all
      await loadTasks();
      // Re-open view modal to see updates
      window.viewTask(parseInt(taskId));
    } catch (err) {
      showToast({ message: err.message || 'Failed to post update.', type: 'error' });
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i data-lucide="send" style="width:14px;height:14px;margin-right:6px"></i> Post Update';
      if (window.lucide) lucide.createIcons();
    }
  });

  // Submit
  document.getElementById('taskSubmitBtn')?.addEventListener('click', async (e) => {
    e.preventDefault();
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
      assigned_to: assignedTo,
    };

    const btnText = document.getElementById('taskSubmitText');
    const spinner = document.getElementById('taskSubmitSpinner');
    btnText.style.display = 'none';
    spinner.style.display = 'inline-block';

    try {
      if (editingTaskId) {
        await api.put(`tasks/${editingTaskId}`, payload);
        showToast({ message: 'Task updated gracefully!', type: 'success' });
      } else {
        await api.post('tasks', payload);
        showToast({ message: 'Task created and assigned!', type: 'success' });
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
    if (task) {
       closeViewModal();
       openModal(task);
    }
  };

  window.deleteTask = async (id) => {
    if (!confirm('Are you sure you want to delete this entire task? This will remove it for all assigned students.')) return;
    try {
      await api.delete(`tasks/${id}`);
      showToast({ message: 'Task deleted successfully', type: 'success' });
      closeViewModal();
      await loadTasks();
    } catch(err) {
      showToast({ message: err.message || 'Failed to delete task', type: 'error' });
    }
  };
  
  window.removeAssignment = async (taskId, studentId) => {
    if (!confirm('Remove this task assignment for this student?')) return;
    try {
      await api.delete(`tasks/${taskId}/assignments/${studentId}`);
      showToast({ message: 'Student assignment removed', type: 'success' });
      await loadTasks();
      
      const viewOverlay = document.getElementById('viewTaskModalOverlay');
      if (viewOverlay && viewOverlay.style.display !== 'none') {
        const task = allTasks.find(t => t.id === taskId);
        if (task) openViewModal(task);
        else closeViewModal(); // if task deleted somehow, close it
      }
    } catch(err) {
      showToast({ message: err.message || 'Failed to remove assignment', type: 'error' });
    }
  };

  window.updateTaskStatus = async (id, status, userId = null) => {
    try {
      const payload = { status };
      if (userId && isAdminUser) payload.user_id = userId;

      await api.put(`tasks/${id}/status`, payload);
      
      // Also push a history update
      const fd = new FormData();
      fd.append('status_change', status);
      await api.post(`tasks/${id}/history`, fd);
      
      showToast({ message: 'Status updated seamlessly!', type: 'success' });
      await loadTasks(); 
      
      const viewOverlay = document.getElementById('viewTaskModalOverlay');
      if (viewOverlay && viewOverlay.style.display !== 'none') {
        const task = allTasks.find(t => t.id === id);
        if (task) openViewModal(task);
      }
    } catch(err) {
      showToast({ message: err.message || 'Failed to update status', type: 'error' });
    }
  };

  await loadTasks();
}

window.renderTasks = renderTasks;
window.initTasks = initTasks;
