/* ============================================================
   C2S VLSI Lab Portal — Attendance Page
   Mark attendance, view records and statistics
   ============================================================ */

function renderAttendance() {
  const user = getUser();
  const isAdminUser = user && user.role === 'admin';

  return `
    <div class="page-enter">
      <div class="page-header">
        <div class="page-header-left">
          <h1 class="page-title animate-slideUp">
            <i data-lucide="calendar-check" style="width:28px;height:28px;vertical-align:-4px;margin-right:10px;color:var(--success)"></i>
            Attendance
          </h1>
          <p class="page-subtitle animate-slideUp stagger-1">
            ${isAdminUser ? 'View and manage attendance records' : 'Track your attendance'}
          </p>
        </div>
        <div class="page-header-actions animate-slideUp stagger-2">
          ${isAdminUser ? `
          <button class="btn btn-primary" id="markAttendanceBtn">
            <i data-lucide="check-circle" style="width:16px;height:16px"></i>
            Mark Attendance
          </button>
          ` : `
          <button class="btn btn-primary" id="checkInBtn">
            <i data-lucide="log-in" style="width:16px;height:16px"></i>
            Check In Today
          </button>
          `}
        </div>
      </div>

      <!-- Stats -->
      <div class="grid grid-stats section" id="attendanceStats">
        <div class="stat-card animate-slideUp stagger-1">
          <div class="stat-card-icon green"><i data-lucide="user-check" style="width:22px;height:22px"></i></div>
          <div class="stat-card-value" id="attPresent">—</div>
          <div class="stat-card-label">${isAdminUser ? 'Present Today' : 'Status'}</div>
        </div>
        <div class="stat-card animate-slideUp stagger-2">
          <div class="stat-card-icon red"><i data-lucide="user-x" style="width:22px;height:22px"></i></div>
          <div class="stat-card-value" id="attAbsent">—</div>
          <div class="stat-card-label">${isAdminUser ? 'Absent Today' : 'Days Present'}</div>
        </div>
        <div class="stat-card animate-slideUp stagger-3">
          <div class="stat-card-icon orange"><i data-lucide="clock" style="width:22px;height:22px"></i></div>
          <div class="stat-card-value" id="attLate">—</div>
          <div class="stat-card-label">Late</div>
        </div>
        <div class="stat-card animate-slideUp stagger-4">
          <div class="stat-card-icon blue"><i data-lucide="percent" style="width:22px;height:22px"></i></div>
          <div class="stat-card-value" id="attPct">—</div>
          <div class="stat-card-label">${isAdminUser ? 'Attendance Rate' : 'Attendance Rate'}</div>
        </div>
      </div>

      <!-- Date Indicator & Filters -->
      <div class="card animate-slideUp stagger-3" style="margin-bottom:var(--space-lg)">
        <div class="card-body" style="padding:var(--space-md)">
          <div style="display:flex;gap:var(--space-md);flex-wrap:wrap;align-items:center;justify-content:space-between">
            <div style="display:flex;align-items:center;gap:var(--space-md);flex-wrap:wrap">
              <div id="dateIndicator" style="display:flex;align-items:center;gap:var(--space-sm)">
                <i data-lucide="calendar" style="width:18px;height:18px;color:var(--accent-primary)"></i>
                <span style="font-weight:600;font-size:0.95rem;color:var(--text-primary)" id="dateIndicatorText">Today</span>
              </div>
              <button class="btn btn-ghost btn-sm" id="backToTodayBtn" style="display:none;color:var(--accent-primary);font-size:0.8rem">
                <i data-lucide="arrow-left" style="width:14px;height:14px"></i>
                Back to Today
              </button>
            </div>
            <div style="display:flex;gap:var(--space-md);flex-wrap:wrap;align-items:center">
              ${isAdminUser ? `
              <select class="form-select" id="attUserFilter" style="min-width:200px">
                <option value="">All Students</option>
              </select>
              ` : ''}
              <select class="form-select" id="attStatusFilter" style="width:auto">
                <option value="">All Status</option>
                <option value="present">Present</option>
                <option value="absent">Absent</option>
                <option value="late">Late</option>
                <option value="on_leave">On Leave</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <!-- Views -->
      <div class="grid grid-dashboard">
        
        <!-- Attendance Table -->
        <div class="card animate-slideUp stagger-4">
          <div class="card-body" style="padding:0">
            <div id="attendanceContainer">
              <div style="padding:var(--space-xl)">
                ${[1,2,3,4,5].map(() => `
                  <div class="grid grid-3" style="padding:var(--space-md) 0;border-bottom:1px solid var(--border-color)">
                    <div class="skeleton skeleton-text" style="width:30%;margin:0"></div>
                    <div class="skeleton skeleton-text" style="width:20%;margin:0"></div>
                    <div class="skeleton skeleton-text" style="width:15%;margin:0"></div>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>
        </div>

        <!-- Calendar View -->
        <div>
          <div id="attendanceCalendarContainer"></div>
        </div>
      </div>

      <!-- Leave Requests Section -->
      <div style="margin-top:var(--space-xl)">
        <div class="page-header" style="margin-bottom:var(--space-lg)">
          <div class="page-header-left">
            <h2 style="font-size:1.1rem;font-weight:700;margin:0">
              <i data-lucide="calendar-off" style="width:20px;height:20px;vertical-align:-3px;margin-right:8px;color:var(--info)"></i>
              Leave Requests
            </h2>
          </div>
          <div class="page-header-actions">
            ${!isAdminUser ? `
            <button class="btn btn-secondary" id="newLeaveBtn">
              <i data-lucide="plus" style="width:16px;height:16px"></i>
              Request Leave
            </button>` : ''}
          </div>
        </div>
        <div id="leaveContainer">
          <div class="card"><div class="card-body">
            <div class="skeleton skeleton-text" style="width:60%"></div>
          </div></div>
        </div>
      </div>
    </div>

    <!-- Leave Request Modal (Student) -->
    <div class="modal-overlay" id="leaveModalOverlay" style="display:none">
      <div class="modal" style="max-width:480px">
        <div class="modal-header">
          <h3 class="modal-title">Request Leave</h3>
          <button class="modal-close" id="leaveModalClose">
            <i data-lucide="x" style="width:20px;height:20px"></i>
          </button>
        </div>
        <div class="modal-body">
          <div class="grid grid-2" style="gap:var(--space-md)">
            <div class="form-group">
              <label class="form-label">Start Date *</label>
              <input type="date" class="form-input" id="leaveStartDate" />
            </div>
            <div class="form-group">
              <label class="form-label">End Date *</label>
              <input type="date" class="form-input" id="leaveEndDate" />
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Reason</label>
            <textarea class="form-textarea" id="leaveReason" rows="3" placeholder="Reason for leave (optional)..."></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" id="leaveModalCancel">Cancel</button>
          <button class="btn btn-primary" id="leaveSubmitBtn">
            <span id="leaveSubmitText">Submit Request</span>
            <div class="spinner" id="leaveSubmitSpinner" style="display:none"></div>
          </button>
        </div>
      </div>
    </div>

    <!-- Mark Attendance Modal (Admin) -->
    <div class="modal-overlay" id="markAttModalOverlay" style="display:none">
      <div class="modal" style="max-width:600px">
        <div class="modal-header">
          <h3 class="modal-title">Mark Attendance</h3>
          <button class="modal-close" id="markAttModalClose">
            <i data-lucide="x" style="width:20px;height:20px"></i>
          </button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">Date</label>
            <input type="date" class="form-input" id="markAttDate" />
          </div>
          <div id="markAttStudentsList" style="display:flex;flex-direction:column;gap:var(--space-sm);max-height:350px;overflow-y:auto">
            <div style="color:var(--text-muted);text-align:center;padding:var(--space-lg)">Loading students...</div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" id="markAttCancel">Cancel</button>
          <button class="btn btn-primary" id="markAttSubmitBtn">
            <span>Save Attendance</span>
            <div class="spinner" id="markAttSpinner" style="display:none"></div>
          </button>
        </div>
      </div>
    </div>
  `;
}

async function initAttendance() {
  // Silently trigger the data fix in the background just in case
  api.get('fix-leaves').catch(console.error);

  const user = getUser();
  const isAdminUser = user && user.role === 'admin';
  let studentsList = [];
  let allAttendance = []; // For calendar data (all records for the month)
  let currentCalMonth = new Date().getMonth();
  let currentCalYear = new Date().getFullYear();
  
  // Selected date state — defaults to today
  const todayStr = new Date().toISOString().split('T')[0];
  let selectedDate = todayStr;

  // Load students for admin
  if (isAdminUser) {
    try {
      const res = await api.get('users?role=student');
      studentsList = Array.isArray(res) ? res : (res?.data || []);
      const sel = document.getElementById('attUserFilter');
      if (sel) {
        studentsList.forEach(u => {
          const opt = document.createElement('option');
          opt.value = u.id;
          opt.textContent = u.name;
          sel.appendChild(opt);
        });
      }
    } catch(e) {}
  }

  // ── Update date indicator ──
  function updateDateIndicator() {
    const indicatorText = document.getElementById('dateIndicatorText');
    const backBtn = document.getElementById('backToTodayBtn');
    if (!indicatorText) return;

    if (selectedDate === todayStr) {
      indicatorText.textContent = 'Today — ' + new Date(todayStr + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });
      if (backBtn) backBtn.style.display = 'none';
    } else {
      indicatorText.textContent = new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });
      if (backBtn) backBtn.style.display = 'inline-flex';
    }
  }

  // ── Load attendance for a specific date ──
  async function loadDateAttendance() {
    try {
      const res = await api.get(`attendance/date/${selectedDate}`);
      const data = res?.data || {};
      const records = data.records || [];
      const summary = data.summary || {};
      const absentList = data.absent || [];
      
      // Update stats
      if (isAdminUser) {
        const totalStudents = summary.total_students || studentsList.length || 0;
        const presentCount = summary.present_count || 0;
        const absentCount = summary.absent_count || (totalStudents - presentCount);
        const lateCount = summary.late_count || 0;
        const pct = totalStudents > 0 ? Math.round(((presentCount + lateCount) / totalStudents) * 100) : 0;

        document.getElementById('attPresent').textContent = presentCount;
        document.getElementById('attAbsent').textContent = absentCount;
        document.getElementById('attLate').textContent = lateCount;
        document.getElementById('attPct').textContent = `${pct}%`;
      } else {
        // Student view: show their status for the selected day
        const myStatus = summary.status || 'absent';
        const statusLabels = { present: '✅ Present', absent: '❌ Absent', late: '⚠️ Late', on_leave: 'ℹ️ On Leave' };
        document.getElementById('attPresent').textContent = statusLabels[myStatus] || myStatus;
        
        // Load total stats from /my endpoint for the student's overall counts
        try {
          const myRes = await api.get('attendance/my');
          const myAll = Array.isArray(myRes) ? myRes : (myRes?.data || []);
          const presentDays = myAll.filter(a => a.status === 'present' || a.status === 'late').length;
          const lateDays = myAll.filter(a => a.status === 'late').length;
          const leaveDays = myAll.filter(a => a.status === 'on_leave').length;
          // Working days = distinct dates with any record
          const workingDaySet = new Set(myAll.map(a => (a.attendance_date || '').slice(0, 10)).filter(Boolean));
          const effectiveDays = Math.max(0, workingDaySet.size - leaveDays);
          const pct = effectiveDays > 0 ? Math.round((presentDays / effectiveDays) * 100) : (leaveDays > 0 ? 100 : 0);
          
          document.getElementById('attAbsent').textContent = presentDays;
          document.getElementById('attLate').textContent = lateDays;
          document.getElementById('attPct').textContent = `${pct}%`;
        } catch(e) {}
      }

      // Apply filters to records
      const statusFilter = document.getElementById('attStatusFilter')?.value || '';
      const userFilter = document.getElementById('attUserFilter')?.value || '';

      let filtered = records;
      if (statusFilter) {
        filtered = filtered.filter(r => r.status === statusFilter);
      }
      if (userFilter) {
        filtered = filtered.filter(r => String(r.user_id) === userFilter);
      }

      renderAttendanceTable(filtered, absentList, statusFilter);
      
      // Update check-in button state for students
      if (!isAdminUser) {
        const myRecord = records.find(a => String(a.user_id) === String(user.id));
        const checkInBtn = document.getElementById('checkInBtn');
        if (checkInBtn) {
          if (myRecord) {
            checkInBtn.innerHTML = `<i data-lucide="x-circle" style="width:16px;height:16px"></i> Unmark Attendance`;
            checkInBtn.classList.remove('btn-primary');
            checkInBtn.classList.add('btn-secondary');
            checkInBtn.style.color = 'var(--error)';
            checkInBtn.style.borderColor = 'var(--error)';
            checkInBtn.dataset.recordId = myRecord.id;
          } else {
            checkInBtn.innerHTML = `<i data-lucide="log-in" style="width:16px;height:16px"></i> Check In Today`;
            checkInBtn.classList.add('btn-primary');
            checkInBtn.classList.remove('btn-secondary');
            checkInBtn.style.color = '';
            checkInBtn.style.borderColor = '';
            delete checkInBtn.dataset.recordId;
          }
          if (window.lucide) lucide.createIcons({ nodes: [checkInBtn] });
        }
      }

      updateDateIndicator();
    } catch(e) {
      console.error('Load date attendance error:', e);
      renderAttendanceTable([], [], '');
    }
  }

  // ── Load ALL attendance for calendar dots ──
  async function loadAllAttendanceForCalendar() {
    try {
      const endpoint = isAdminUser ? 'attendance' : 'attendance/my';
      const res = await api.get(endpoint);
      allAttendance = Array.isArray(res) ? res : (res?.data || []);
      updateCalendar();
    } catch(e) {
      allAttendance = [];
      updateCalendar();
    }
  }

  function renderAttendanceTable(records, absentList = [], statusFilter = '') {
    const container = document.getElementById('attendanceContainer');
    if (!container) return;

    // If showing "absent" filter, show absent students (from absentList) 
    const showAbsent = statusFilter === 'absent' && isAdminUser;

    if ((!records || records.length === 0) && (!showAbsent || absentList.length === 0)) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon"><i data-lucide="calendar" style="width:28px;height:28px"></i></div>
          <div class="empty-state-title">No records found</div>
          <div class="empty-state-description">No attendance records for this date.</div>
        </div>
      `;
      if (window.lucide) lucide.createIcons();
      return;
    }

    const statusColors = {
      present:  { color:'var(--success)', bg:'rgba(0,230,118,0.1)',  icon:'check-circle' },
      absent:   { color:'var(--error)',   bg:'rgba(255,82,82,0.1)',   icon:'x-circle'     },
      late:     { color:'var(--warning)', bg:'rgba(255,171,64,0.1)', icon:'clock'        },
      on_leave: { color:'var(--info)',    bg:'rgba(64,196,255,0.1)', icon:'plane'        },
    };

    let html = `<div style="display:flex;flex-direction:column;gap:var(--space-sm);padding:var(--space-md)">`;

    // Show present/late/on_leave records (unless filtering absent only)
    if (statusFilter !== 'absent') {
      records.forEach(rec => {
        const s = statusColors[rec.status] || statusColors.absent;
        const dateStr = new Date(rec.attendance_date).toLocaleDateString('en-US', { weekday:'short', month:'short', day:'numeric', year:'numeric' });
        const checkIn = rec.check_in_time ? new Date(rec.check_in_time).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}) : '—';
        const checkOut = rec.check_out_time ? new Date(rec.check_out_time).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}) : '—';
        const initials = rec.user_name ? rec.user_name.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2) : '??';
        html += `
          <div style="display:flex;align-items:center;gap:var(--space-md);padding:var(--space-md);background:rgba(255,255,255,0.02);border:1px solid var(--border-color);border-radius:var(--border-radius-sm)">
            ${isAdminUser ? `
            <div class="avatar avatar-sm" style="flex-shrink:0">${initials}</div>
            ` : ''}
            <div style="flex:1;min-width:0">
              <div style="display:flex;align-items:center;gap:var(--space-sm);flex-wrap:wrap;margin-bottom:4px">
                ${isAdminUser ? `<span style="font-weight:600;font-size:0.875rem;color:var(--text-primary)">${rec.user_name || '—'}</span>
                <span style="color:var(--text-muted);font-size:0.75rem">•</span>` : ''}
                <span style="font-size:0.8125rem;color:var(--text-secondary)">${dateStr}</span>
              </div>
              <div style="display:flex;align-items:center;gap:var(--space-md);flex-wrap:wrap">
                <span style="display:inline-flex;align-items:center;gap:4px;padding:2px 8px;border-radius:20px;font-size:0.7rem;font-weight:600;background:${s.bg};color:${s.color}">
                  <i data-lucide="${s.icon}" style="width:11px;height:11px"></i>
                  ${rec.status.replace('_',' ')}
                </span>
                <span style="font-size:0.75rem;color:var(--text-muted)">In: ${checkIn}</span>
                <span style="font-size:0.75rem;color:var(--text-muted)">Out: ${checkOut}</span>
              </div>
            </div>
            ${isAdminUser ? `
            <button class="btn btn-ghost btn-sm" style="color:var(--error);flex-shrink:0" onclick="unmarkAttendanceRecord(${rec.id})" title="Unmark Attendance">
              <i data-lucide="trash-2" style="width:14px;height:14px"></i>
            </button>` : ''}
          </div>`;
      });
    }

    // Show absent students (admin only, for the selected date)
    if (isAdminUser && (statusFilter === '' || statusFilter === 'absent') && absentList.length > 0) {
      const s = statusColors.absent;
      absentList.forEach(student => {
        const initials = student.name ? student.name.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2) : '??';
        html += `
          <div style="display:flex;align-items:center;gap:var(--space-md);padding:var(--space-md);background:rgba(255,82,82,0.03);border:1px solid rgba(255,82,82,0.15);border-radius:var(--border-radius-sm);opacity:0.8">
            <div class="avatar avatar-sm" style="flex-shrink:0;background:rgba(255,82,82,0.15);color:var(--error)">${initials}</div>
            <div style="flex:1;min-width:0">
              <div style="display:flex;align-items:center;gap:var(--space-sm);flex-wrap:wrap;margin-bottom:4px">
                <span style="font-weight:600;font-size:0.875rem;color:var(--text-primary)">${student.name}</span>
              </div>
              <div style="display:flex;align-items:center;gap:var(--space-md);flex-wrap:wrap">
                <span style="display:inline-flex;align-items:center;gap:4px;padding:2px 8px;border-radius:20px;font-size:0.7rem;font-weight:600;background:${s.bg};color:${s.color}">
                  <i data-lucide="${s.icon}" style="width:11px;height:11px"></i>
                  absent
                </span>
                <span style="font-size:0.75rem;color:var(--text-muted)">Not checked in</span>
              </div>
            </div>
          </div>`;
      });
    }

    html += `</div>`;
    container.innerHTML = html;
    if (window.lucide) lucide.createIcons();
  }
  
  window.unmarkAttendanceRecord = async (id) => {
    if (!confirm('Are you sure you want to unmark (delete) this attendance record?')) return;
    try {
      await api.delete(`attendance/${id}`);
      showToast({ message: 'Attendance unmarked successfully.', type: 'success' });
      await loadDateAttendance();
      await loadAllAttendanceForCalendar();
    } catch(err) {
      showToast({ message: err.message || 'Failed to unmark attendance', type: 'error' });
    }
  };

  function updateCalendar() {
    const calContainer = document.getElementById('attendanceCalendarContainer');
    if (!calContainer || !window.renderCalendar) return;

    const calData = {};
    allAttendance.forEach(att => {
      const dateStr = att.attendance_date || att.date;
      if (dateStr) {
        let color = 'var(--accent-primary)';
        if (att.status === 'present') color = 'var(--success)';
        else if (att.status === 'absent') color = 'var(--error)';
        else if (att.status === 'late') color = 'var(--warning)';
        else if (att.status === 'on_leave') color = 'var(--info)';

        // For admin, multiple students per date → use the dominant status
        if (!calData[dateStr]) {
          calData[dateStr] = { status: att.status, color, count: 1 };
        } else {
          calData[dateStr].count++;
        }
      }
    });

    calContainer.innerHTML = window.renderCalendar({
      month: currentCalMonth,
      year: currentCalYear,
      data: calData,
      id: 'attendanceCalendar'
    });

    window.initCalendar({
      id: 'attendanceCalendar',
      data: calData,
      onDateClick: (dateStr) => {
        selectedDate = dateStr;
        loadDateAttendance();
        
        // Highlight selected date in calendar
        highlightSelectedDate();
      },
      onMonthChange: (m, y) => {
        currentCalMonth = m;
        currentCalYear = y;
        updateCalendar();
      }
    });

    // Highlight currently selected date
    highlightSelectedDate();
  }

  function highlightSelectedDate() {
    // Remove previous selection
    document.querySelectorAll('.cal-day-selected').forEach(el => el.classList.remove('cal-day-selected'));
    // Add selection to current
    const selectedEl = document.querySelector(`.cal-day[data-date="${selectedDate}"]`);
    if (selectedEl) {
      selectedEl.classList.add('cal-day-selected');
    }
  }

  // ── Filter change handler ──
  ['attStatusFilter', 'attUserFilter'].forEach(id => {
    document.getElementById(id)?.addEventListener('change', () => {
      loadDateAttendance();
    });
  });

  // ── Back to Today button ──
  document.getElementById('backToTodayBtn')?.addEventListener('click', () => {
    selectedDate = todayStr;
    // Reset calendar to today's month if needed
    const todayDate = new Date();
    currentCalMonth = todayDate.getMonth();
    currentCalYear = todayDate.getFullYear();
    updateCalendar();
    loadDateAttendance();
  });

  // Student check-in / unmark
  const checkInBtn = document.getElementById('checkInBtn');
  if (checkInBtn) {
    checkInBtn.addEventListener('click', async () => {
      const today = new Date().toISOString().split('T')[0];
      
      // Check if already checked in by looking at button state
      if (checkInBtn.dataset.recordId) {
        // Unmark attendance
        try {
          checkInBtn.disabled = true;
          await api.delete(`attendance/${checkInBtn.dataset.recordId}`);
          showToast({ message: 'Attendance unmarked successfully.', type: 'success' });
          await loadDateAttendance();
          await loadAllAttendanceForCalendar();
        } catch(err) {
          showToast({ message: err.message || 'Failed to unmark attendance', type: 'error' });
        } finally {
          checkInBtn.disabled = false;
        }
      } else {
        // Check in
        try {
          checkInBtn.disabled = true;
          await api.post('attendance', {
            attendance_date: today,
            status: 'present',
            check_in_time: new Date().toISOString(),
          });
          showToast({ message: 'Checked in successfully!', type: 'success' });
          await loadDateAttendance();
          await loadAllAttendanceForCalendar();
        } catch(err) {
          showToast({ message: err.message || 'Check-in failed', type: 'error' });
        } finally {
          checkInBtn.disabled = false;
        }
      }
    });
  }

  // Admin mark attendance modal
  const markAttOverlay = document.getElementById('markAttModalOverlay');
  const markAttDate = document.getElementById('markAttDate');

  async function populateMarkAttModal() {
    const dateInput = document.getElementById('markAttDate');
    const modalDate = dateInput ? dateInput.value : new Date().toISOString().split('T')[0];

    const listEl = document.getElementById('markAttStudentsList');
    if (!listEl) return;

    if (studentsList.length === 0) {
      listEl.innerHTML = `<div style="color:var(--text-muted);text-align:center">No students found</div>`;
      return;
    }

    // Fetch existing attendance for the modal's selected date
    let existingRecords = [];
    try {
      const res = await api.get(`attendance/date/${modalDate}`);
      existingRecords = res?.data?.records || [];
    } catch(e) {}

    listEl.innerHTML = studentsList.map(u => {
      const existing = existingRecords.find(a => String(a.user_id) === String(u.id));
      const currentStatus = existing ? existing.status : 'present';

      return `
      <div style="display:flex;align-items:center;justify-content:space-between;padding:var(--space-sm) var(--space-md);background:rgba(255,255,255,0.03);border-radius:var(--border-radius-sm);border:1px solid var(--border-color)">
        <div style="display:flex;align-items:center;gap:var(--space-md)">
          <div class="avatar avatar-sm">${u.name.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2)}</div>
          <div>
            <div style="font-weight:500;font-size:0.875rem">${u.name}</div>
            <div style="font-size:0.75rem;color:var(--text-muted)">${u.batch || ''}</div>
          </div>
        </div>
        <select class="form-select" id="attStatus_${u.id}" style="width:auto;padding:5px 28px 5px 10px;font-size:0.8125rem">
          <option value="present" ${currentStatus === 'present' ? 'selected' : ''}>Present</option>
          <option value="absent" ${currentStatus === 'absent' ? 'selected' : ''}>Absent</option>
          <option value="late" ${currentStatus === 'late' ? 'selected' : ''}>Late</option>
          <option value="on_leave" ${currentStatus === 'on_leave' ? 'selected' : ''}>On Leave</option>
          <option value="unmark" style="color:var(--error)">Unmark (Delete)</option>
        </select>
      </div>
      `;
    }).join('');
    if (window.lucide) lucide.createIcons({ nodes: [listEl] });
  }

  // Re-populate modal when date changes
  markAttDate?.addEventListener('change', populateMarkAttModal);

  document.getElementById('markAttendanceBtn')?.addEventListener('click', async () => {
    const dateInput = document.getElementById('markAttDate');
    if (dateInput && !dateInput.value) {
      dateInput.value = new Date().toISOString().split('T')[0];
    }
    markAttOverlay.style.display = 'flex';
    await populateMarkAttModal();
  });
  document.getElementById('markAttModalClose')?.addEventListener('click', () => markAttOverlay.style.display = 'none');
  document.getElementById('markAttCancel')?.addEventListener('click', () => markAttOverlay.style.display = 'none');
  markAttOverlay?.addEventListener('click', e => { if (e.target === markAttOverlay) markAttOverlay.style.display = 'none'; });

  document.getElementById('markAttSubmitBtn')?.addEventListener('click', async () => {
    const date = document.getElementById('markAttDate').value;
    if (!date) { showToast({ message: 'Please select a date', type: 'warning' }); return; }

    const spinner = document.getElementById('markAttSpinner');
    const btn = document.getElementById('markAttSubmitBtn');
    btn.disabled = true;
    spinner.style.display = 'inline-block';

    // Fetch existing records for this date to find existing IDs
    let existingRecords = [];
    try {
      const res = await api.get(`attendance/date/${date}`);
      existingRecords = res?.data?.records || [];
    } catch(e) {}

    let successCount = 0;
    let failCount = 0;

    for (const u of studentsList) {
      const status = document.getElementById(`attStatus_${u.id}`)?.value || 'present';
      const existing = existingRecords.find(a => String(a.user_id) === String(u.id));

      if (status === 'unmark') {
        if (existing) {
          try {
            await api.delete(`attendance/${existing.id}`);
            successCount++;
          } catch(e) { failCount++; }
        }
        continue;
      }

      try {
        if (existing) {
          if (existing.status !== status) {
            await api.put(`attendance/${existing.id}`, { status });
            successCount++;
          }
        } else {
          await api.post('attendance', {
            user_id: u.id,
            attendance_date: date,
            status,
          });
          successCount++;
        }
      } catch(e) { failCount++; }
    }

    spinner.style.display = 'none';
    btn.disabled = false;
    markAttOverlay.style.display = 'none';

    if (successCount > 0) showToast({ message: `Attendance saved for ${successCount} students!`, type: 'success' });
    if (failCount > 0) showToast({ message: `Failed for ${failCount} entries`, type: 'error' });

    await loadDateAttendance();
    await loadAllAttendanceForCalendar();
  });

  // ── Leave Requests ──
  async function loadLeaveRequests() {
    const container = document.getElementById('leaveContainer');
    if (!container) return;
    try {
      const res = await api.get('leave-requests');
      const leaves = Array.isArray(res) ? res : (res?.data || []);

      if (leaves.length === 0) {
        container.innerHTML = `
          <div class="card"><div class="card-body">
            <div class="empty-state">
              <div class="empty-state-icon"><i data-lucide="calendar-off" style="width:24px;height:24px"></i></div>
              <div class="empty-state-title">No leave requests</div>
              <div class="empty-state-description">${isAdminUser ? 'No pending leave requests.' : 'You have not submitted any leave requests yet.'}</div>
            </div>
          </div></div>
        `;
        if (window.lucide) lucide.createIcons();
        return;
      }

      const statusConfig = {
        pending:  { color:'var(--warning)', bg:'rgba(255,171,64,0.1)',   label:'Pending'  },
        approved: { color:'var(--success)', bg:'rgba(0,230,118,0.1)',    label:'Approved' },
        rejected: { color:'var(--error)',   bg:'rgba(255,82,82,0.1)',    label:'Rejected' },
      };

      container.innerHTML = `
        <div class="table-container">
          <table class="table">
            <thead>
              <tr>
                ${isAdminUser ? '<th>Student</th>' : ''}
                <th>Start Date</th>
                <th>End Date</th>
                <th>Reason</th>
                <th>Status</th>
                ${isAdminUser ? '<th>Action</th>' : ''}
              </tr>
            </thead>
            <tbody>
              ${leaves.map(l => {
                const s = statusConfig[l.status] || statusConfig.pending;
                const startStr = new Date(l.start_date).toLocaleDateString('en-US', {month:'short',day:'numeric',year:'numeric'});
                const endStr = new Date(l.end_date).toLocaleDateString('en-US', {month:'short',day:'numeric',year:'numeric'});
                return `
                  <tr>
                    ${isAdminUser ? `<td><div class="cell-primary">${l.user_name || '—'}</div></td>` : ''}
                    <td style="color:var(--text-secondary)">${startStr}</td>
                    <td style="color:var(--text-secondary)">${endStr}</td>
                    <td style="color:var(--text-muted);max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${l.reason || '—'}</td>
                    <td><span style="display:inline-flex;align-items:center;gap:4px;padding:3px 10px;border-radius:20px;font-size:0.72rem;font-weight:600;background:${s.bg};color:${s.color}">${s.label}</span></td>
                    ${isAdminUser && l.status === 'pending' ? `
                    <td>
                      <div style="display:flex;gap:4px">
                        <button class="btn btn-ghost btn-sm" style="color:var(--success)" onclick="approveLeave(${l.id},'approved')" title="Approve">
                          <i data-lucide="check" style="width:14px;height:14px"></i> Approve
                        </button>
                        <button class="btn btn-ghost btn-sm" style="color:var(--error)" onclick="approveLeave(${l.id},'rejected')" title="Reject">
                          <i data-lucide="x" style="width:14px;height:14px"></i> Reject
                        </button>
                      </div>
                    </td>` : isAdminUser ? `<td style="color:var(--text-muted);font-size:0.8rem">${l.approved_by_name ? 'By ' + l.approved_by_name : '—'}</td>` : ''}
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      `;
      if (window.lucide) lucide.createIcons({ nodes: [container] });
    } catch(e) {
      container.innerHTML = `<div class="card"><div class="card-body"><div style="color:var(--error);font-size:0.875rem">Failed to load leave requests.</div></div></div>`;
    }
  }

  window.approveLeave = async (id, status) => {
    try {
      await api.put(`leave-requests/${id}`, { status });
      showToast({ message: `Leave request ${status}!`, type: status === 'approved' ? 'success' : 'warning' });
      await loadLeaveRequests();
    } catch(err) { showToast({ message: err.message || 'Failed', type: 'error' }); }
  };

  // Leave Request Modal (Student)
  const leaveOverlay = document.getElementById('leaveModalOverlay');

  document.getElementById('newLeaveBtn')?.addEventListener('click', () => {
    // Set default dates
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('leaveStartDate').value = today;
    document.getElementById('leaveEndDate').value = today;
    document.getElementById('leaveReason').value = '';
    leaveOverlay.style.display = 'flex';
  });

  document.getElementById('leaveModalClose')?.addEventListener('click', () => leaveOverlay.style.display = 'none');
  document.getElementById('leaveModalCancel')?.addEventListener('click', () => leaveOverlay.style.display = 'none');
  leaveOverlay?.addEventListener('click', e => { if (e.target === leaveOverlay) leaveOverlay.style.display = 'none'; });

  document.getElementById('leaveSubmitBtn')?.addEventListener('click', async () => {
    const start = document.getElementById('leaveStartDate').value;
    const end = document.getElementById('leaveEndDate').value;
    if (!start || !end) { showToast({ message: 'Start and end dates required', type: 'warning' }); return; }
    if (new Date(start) > new Date(end)) { showToast({ message: 'Start date must be before end date', type: 'warning' }); return; }

    const btnText = document.getElementById('leaveSubmitText');
    const spinner = document.getElementById('leaveSubmitSpinner');
    btnText.style.display = 'none'; spinner.style.display = 'inline-block';

    try {
      await api.post('leave-requests', {
        start_date: start,
        end_date: end,
        reason: document.getElementById('leaveReason').value.trim() || null,
      });
      showToast({ message: 'Leave request submitted!', type: 'success' });
      leaveOverlay.style.display = 'none';
      await loadLeaveRequests();
    } catch(err) {
      showToast({ message: err.message || 'Failed to submit', type: 'error' });
    } finally {
      btnText.style.display = ''; spinner.style.display = 'none';
    }
  });

  // ── Initial Load ──
  await loadDateAttendance();
  await loadAllAttendanceForCalendar();
  await loadLeaveRequests();
}

window.renderAttendance = renderAttendance;
window.initAttendance = initAttendance;
