/* ============================================================
   C2S VLSI Lab Portal — Reports Page (Admin Only)
   Analytics dashboard with Chart.js charts
   ============================================================ */

function renderReports() {
  return `
    <div class="page-enter">
      <div class="page-header">
        <div class="page-header-left">
          <h1 class="page-title animate-slideUp">
            <i data-lucide="bar-chart-3" style="width:28px;height:28px;vertical-align:-4px;margin-right:10px;color:var(--accent-primary)"></i>
            Reports &amp; Analytics
          </h1>
          <p class="page-subtitle animate-slideUp stagger-1">Lab performance overview and trends</p>
        </div>
        <div class="page-header-actions animate-slideUp stagger-2" style="display:flex;gap:var(--space-sm);flex-wrap:wrap;width:100%">
          <div style="position:relative;flex:1;min-width:180px">
            <select class="btn btn-secondary" id="exportReportType" style="width:100%;padding-right:32px;appearance:none;background:var(--bg-glass);color:var(--text-primary);border:1px solid var(--border-color);border-radius:var(--border-radius-sm);height:36px;cursor:pointer;font-family:inherit;font-size:0.875rem">
              <option value="all">Export All (Excel)</option>
              <option value="students">Export Students</option>
              <option value="attendance">Export Attendance</option>
              <option value="tasks">Export Tasks</option>
              <option value="logs">Export Daily Logs</option>
            </select>
            <i data-lucide="download" style="position:absolute;right:10px;top:10px;width:16px;height:16px;pointer-events:none;color:var(--text-muted)"></i>
          </div>
          <button class="btn btn-primary" id="exportExcelBtn" title="Download Excel" style="flex:shrink:0">
            Go
          </button>
          <select class="form-select" id="reportMonthRange" style="flex:1;min-width:140px">
            <option value="1">Last 30 days</option>
            <option value="3" selected>Last 3 months</option>
            <option value="6">Last 6 months</option>
          </select>
        </div>
      </div>

      <!-- Summary Stats -->
      <div class="grid grid-stats" style="margin-bottom:var(--space-xl)" id="reportStats">
        <div class="stat-card animate-slideUp stagger-1">
          <div class="stat-card-icon blue"><i data-lucide="users" style="width:22px;height:22px"></i></div>
          <div class="stat-card-value" id="rTotalStudents">—</div>
          <div class="stat-card-label">Total Students</div>
        </div>
        <div class="stat-card animate-slideUp stagger-2">
          <div class="stat-card-icon purple"><i data-lucide="folder-git-2" style="width:22px;height:22px"></i></div>
          <div class="stat-card-value" id="rActiveProjects">—</div>
          <div class="stat-card-label">Active Projects</div>
        </div>
        <div class="stat-card animate-slideUp stagger-3">
          <div class="stat-card-icon green"><i data-lucide="calendar-check" style="width:22px;height:22px"></i></div>
          <div class="stat-card-value" id="rAvgAttendance">—</div>
          <div class="stat-card-label">Avg Attendance</div>
        </div>
        <div class="stat-card animate-slideUp stagger-4">
          <div class="stat-card-icon orange"><i data-lucide="list-checks" style="width:22px;height:22px"></i></div>
          <div class="stat-card-value" id="rCompletedTasks">—</div>
          <div class="stat-card-label">Tasks Completed</div>
        </div>
      </div>

      <!-- Charts Row 1 -->
      <div class="grid grid-dashboard" style="margin-bottom:var(--space-lg);gap:var(--space-lg)">
        <div class="card animate-slideUp stagger-3">
          <div class="card-header">
            <h4><i data-lucide="trending-up" style="width:18px;height:18px;vertical-align:-3px;margin-right:8px;color:var(--accent-primary)"></i>Attendance Trend</h4>
            <span style="font-size:0.78rem;color:var(--text-muted)">Daily presence rate</span>
          </div>
          <div class="card-body">
            <canvas id="attendanceTrendChart" height="200"></canvas>
          </div>
        </div>

        <div class="card animate-slideUp stagger-4">
          <div class="card-header">
            <h4><i data-lucide="list-checks" style="width:18px;height:18px;vertical-align:-3px;margin-right:8px;color:var(--warning)"></i>Task Status</h4>
          </div>
          <div class="card-body" style="display:flex;flex-direction:column;align-items:center">
            <canvas id="taskStatusChart" width="200" height="200" style="max-width:200px"></canvas>
            <div id="taskLegend" style="display:flex;flex-wrap:wrap;justify-content:center;gap:var(--space-sm);margin-top:var(--space-md)"></div>
          </div>
        </div>
      </div>

      <!-- Charts Row 2 -->
      <div class="grid grid-2" style="margin-bottom:var(--space-lg);gap:var(--space-lg)">
        <div class="card animate-slideUp stagger-5">
          <div class="card-header">
            <h4><i data-lucide="folder-git-2" style="width:18px;height:18px;vertical-align:-3px;margin-right:8px;color:var(--accent-secondary)"></i>Project Progress</h4>
          </div>
          <div class="card-body">
            <canvas id="projectProgressChart" height="220"></canvas>
          </div>
        </div>

        <div class="card animate-slideUp stagger-6">
          <div class="card-header">
            <h4><i data-lucide="ticket" style="width:18px;height:18px;vertical-align:-3px;margin-right:8px;color:var(--error)"></i>Ticket Resolution</h4>
          </div>
          <div class="card-body" style="display:flex;flex-direction:column;align-items:center">
            <canvas id="ticketStatusChart" width="200" height="200" style="max-width:200px"></canvas>
            <div id="ticketLegend" style="display:flex;flex-wrap:wrap;justify-content:center;gap:var(--space-sm);margin-top:var(--space-md)"></div>
          </div>
        </div>
      </div>

      <!-- Top Students Table -->
      <div class="card animate-slideUp stagger-5">
        <div class="card-header">
          <h4><i data-lucide="award" style="width:18px;height:18px;vertical-align:-3px;margin-right:8px;color:var(--warning)"></i>Student Activity Summary</h4>
        </div>
        <div class="card-body" style="padding:0">
          <div id="studentActivityTable">
            <div style="padding:var(--space-xl);text-align:center;color:var(--text-muted)">
              <div class="spinner" style="display:inline-block;width:24px;height:24px;margin-bottom:var(--space-sm)"></div>
              <div>Loading activity data...</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

async function initReports() {
  let chartInstances = {};
  let currentReportData = null;

  const chartDefaults = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(15,20,45,0.95)',
        borderColor: 'rgba(79,143,255,0.3)',
        borderWidth: 1,
        titleColor: '#e2e8f0',
        bodyColor: '#94a3b8',
        padding: 10,
        cornerRadius: 8,
      }
    },
    scales: {
      x: {
        grid: { color: 'rgba(255,255,255,0.04)' },
        ticks: { color: '#64748b', font: { size: 11 } }
      },
      y: {
        grid: { color: 'rgba(255,255,255,0.04)' },
        ticks: { color: '#64748b', font: { size: 11 } }
      }
    }
  };

  function destroyChart(key) {
    if (chartInstances[key]) {
      chartInstances[key].destroy();
      delete chartInstances[key];
    }
  }

  async function loadAllData() {
    const [students, projects, tasks, attendance, tickets, users] = await Promise.allSettled([
      api.get('users?role=student').catch(() => []),
      api.get('projects').catch(() => []),
      api.get('tasks').catch(() => []),
      api.get('attendance').catch(() => []),
      api.get('tickets').catch(() => []),
      api.get('users').catch(() => []),
    ]);

    const val = r => r.status === 'fulfilled' ? (Array.isArray(r.value) ? r.value : (r.value?.data || [])) : [];

    const studentsData = val(students);
    const projectsData = val(projects);
    const tasksData = val(tasks);
    const attendanceData = val(attendance);
    const ticketsData = val(tickets);
    
    // Also fetch daily logs for full export
    const logsRes = await api.get('daily-logs').catch(() => []);
    const logsData = Array.isArray(logsRes) ? logsRes : (logsRes?.data || []);

    // Summary stats
    const activeProjects = projectsData.filter(p => p.status === 'active').length;
    const completedTasks = tasksData.filter(t => t.status === 'completed').length;

    document.getElementById('rTotalStudents').textContent = studentsData.length;
    document.getElementById('rActiveProjects').textContent = activeProjects;
    document.getElementById('rCompletedTasks').textContent = completedTasks;

    const presentCount = attendanceData.filter(a => a.status === 'present' || a.status === 'late').length;
    const totalAtt = attendanceData.length;
    const avgAtt = totalAtt > 0 ? Math.round((presentCount / totalAtt) * 100) : 0;
    document.getElementById('rAvgAttendance').textContent = `${avgAtt}%`;

    // Calculate currentReportData for export
    currentReportData = {
      summary: {
        total_students: studentsData.length,
        active_projects: activeProjects,
        tasks_completed: completedTasks,
        avg_attendance_pct: avgAtt
      },
      students: studentsData.map(s => {
        const sTasks = tasksData.filter(t => t.assigned_to === s.id && t.status === 'completed').length;
        const sAtt = attendanceData.filter(a => a.user_id === s.id);
        const sPresent = sAtt.filter(a => a.status === 'present' || a.status === 'late').length;
        const sAttPct = sAtt.length > 0 ? Math.round((sPresent / sAtt.length) * 100) : 0;
        return {
          name: s.name,
          email: s.email,
          batch: s.batch,
          tasks_completed: sTasks,
          attendance_pct: sAttPct,
          logs_count: logsData.filter(l => l.user_id === s.id).length,
          points: s.points || 0
        };
      }),
      raw_attendance: attendanceData,
      raw_tasks: tasksData,
      raw_logs: logsData,
      raw_projects: projectsData
    };

    // Attendance Trend Chart
    buildAttendanceTrendChart(attendanceData);

    // Task Status Doughnut
    buildTaskStatusChart(tasksData);

    // Project Progress Bar
    buildProjectProgressChart(projectsData);

    // Ticket Status Doughnut
    buildTicketStatusChart(ticketsData);

    // Student Activity Table
    buildStudentActivityTable(studentsData, tasksData, attendanceData);
  }

  function buildAttendanceTrendChart(attendanceData) {
    destroyChart('attendance');
    const ctx = document.getElementById('attendanceTrendChart')?.getContext('2d');
    if (!ctx) return;

    const byDate = {};
    const totByDate = {};
    attendanceData.forEach(a => {
      const d = (a.attendance_date || '').slice(0, 10);
      if (!d) return;
      if (!byDate[d]) { byDate[d] = 0; totByDate[d] = 0; }
      totByDate[d]++;
      if (a.status === 'present' || a.status === 'late') byDate[d]++;
    });

    const sorted = Object.keys(totByDate).sort().slice(-30);
    const labels = sorted.map(d => {
      const date = new Date(d);
      return date.toLocaleDateString('en-US', { month:'short', day:'numeric' });
    });
    const data = sorted.map(d => totByDate[d] ? Math.round((byDate[d] / totByDate[d]) * 100) : 0);

    chartInstances.attendance = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Attendance %',
          data,
          borderColor: '#4f8fff',
          backgroundColor: 'rgba(79,143,255,0.08)',
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#4f8fff',
          pointRadius: 3,
          pointHoverRadius: 5,
        }]
      },
      options: {
        ...chartDefaults,
        plugins: {
          ...chartDefaults.plugins,
          legend: { display: false }
        },
        scales: {
          ...chartDefaults.scales,
          y: {
            ...chartDefaults.scales.y,
            min: 0, max: 100,
            ticks: { ...chartDefaults.scales.y.ticks, callback: v => v + '%' }
          }
        }
      }
    });
  }

  function buildTaskStatusChart(tasksData) {
    destroyChart('tasks');
    const ctx = document.getElementById('taskStatusChart')?.getContext('2d');
    if (!ctx) return;

    const counts = {
      assigned:     tasksData.filter(t => t.status === 'assigned').length,
      in_progress:  tasksData.filter(t => t.status === 'in_progress').length,
      under_review: tasksData.filter(t => t.status === 'under_review').length,
      completed:    tasksData.filter(t => t.status === 'completed').length,
    };

    const labels = ['Assigned', 'In Progress', 'Under Review', 'Completed'];
    const data = Object.values(counts);
    const colors = ['rgba(64,196,255,0.8)', 'rgba(255,171,64,0.8)', 'rgba(124,92,255,0.8)', 'rgba(0,230,118,0.8)'];

    chartInstances.tasks = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{ data, backgroundColor: colors, borderWidth: 0, hoverOffset: 6 }]
      },
      options: {
        ...chartDefaults,
        scales: {},
        cutout: '68%',
        plugins: { ...chartDefaults.plugins, legend: { display: false } }
      }
    });

    const legend = document.getElementById('taskLegend');
    if (legend) {
      legend.innerHTML = labels.map((l, i) => `
        <div style="display:flex;align-items:center;gap:6px;font-size:0.78rem;color:var(--text-secondary)">
          <span style="width:10px;height:10px;border-radius:50%;background:${colors[i]};flex-shrink:0"></span>
          ${l}: <strong style="color:var(--text-primary)">${data[i]}</strong>
        </div>
      `).join('');
    }
  }

  function buildProjectProgressChart(projectsData) {
    destroyChart('projects');
    const ctx = document.getElementById('projectProgressChart')?.getContext('2d');
    if (!ctx) return;

    const projects = projectsData.slice(0, 8);
    const labels = projects.map(p => p.name.length > 20 ? p.name.slice(0, 17) + '…' : p.name);
    const data = projects.map(p => p.progress_percent || 0);

    const bgColors = projects.map(p => {
      if (p.status === 'completed') return 'rgba(64,196,255,0.7)';
      if (p.status === 'on_hold') return 'rgba(255,171,64,0.7)';
      return 'rgba(79,143,255,0.7)';
    });

    chartInstances.projects = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Progress',
          data,
          backgroundColor: bgColors,
          borderRadius: 6,
          borderSkipped: false,
        }]
      },
      options: {
        ...chartDefaults,
        indexAxis: 'y',
        scales: {
          x: {
            ...chartDefaults.scales.x,
            min: 0, max: 100,
            ticks: { ...chartDefaults.scales.x.ticks, callback: v => v + '%' }
          },
          y: chartDefaults.scales.y,
        },
        plugins: { ...chartDefaults.plugins, legend: { display: false } }
      }
    });
  }

  function buildTicketStatusChart(ticketsData) {
    destroyChart('tickets');
    const ctx = document.getElementById('ticketStatusChart')?.getContext('2d');
    if (!ctx) return;

    const counts = {
      open:        ticketsData.filter(t => t.status === 'open').length,
      in_progress: ticketsData.filter(t => t.status === 'in_progress').length,
      resolved:    ticketsData.filter(t => t.status === 'resolved').length,
      closed:      ticketsData.filter(t => t.status === 'closed').length,
    };

    const labels = ['Open', 'In Progress', 'Resolved', 'Closed'];
    const data = Object.values(counts);
    const colors = ['rgba(255,82,82,0.8)', 'rgba(255,171,64,0.8)', 'rgba(0,230,118,0.8)', 'rgba(100,116,139,0.8)'];

    chartInstances.tickets = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{ data, backgroundColor: colors, borderWidth: 0, hoverOffset: 6 }]
      },
      options: {
        ...chartDefaults,
        scales: {},
        cutout: '68%',
        plugins: { ...chartDefaults.plugins, legend: { display: false } }
      }
    });

    const legend = document.getElementById('ticketLegend');
    if (legend) {
      legend.innerHTML = labels.map((l, i) => `
        <div style="display:flex;align-items:center;gap:6px;font-size:0.78rem;color:var(--text-secondary)">
          <span style="width:10px;height:10px;border-radius:50%;background:${colors[i]};flex-shrink:0"></span>
          ${l}: <strong style="color:var(--text-primary)">${data[i]}</strong>
        </div>
      `).join('');
    }
  }

  function buildStudentActivityTable(students, tasks, attendance) {
    const tableEl = document.getElementById('studentActivityTable');
    if (!tableEl) return;

    if (students.length === 0) {
      tableEl.innerHTML = `<div class="empty-state"><div class="empty-state-description">No student data found.</div></div>`;
      return;
    }

    const rows = students.map(s => {
      const stuTasks = tasks.filter(t => t.assignees?.some(a => a.id === s.id || a === s.id));
      const completedTasks = stuTasks.filter(t => t.status === 'completed').length;
      const stuAtt = attendance.filter(a => a.user_id === s.id);
      const presentAtt = stuAtt.filter(a => a.status === 'present' || a.status === 'late').length;
      const attPct = stuAtt.length ? Math.round((presentAtt / stuAtt.length) * 100) : 0;
      const initials = s.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

      return { student: s, completedTasks, totalTasks: stuTasks.length, attPct, initials };
    }).sort((a, b) => b.attPct - a.attPct);

    tableEl.innerHTML = `
      <div class="table-container" style="border:none">
        <table class="table">
          <thead>
            <tr>
              <th>Student</th>
              <th>Batch</th>
              <th>Tasks</th>
              <th>Attendance</th>
              <th>Rate</th>
            </tr>
          </thead>
          <tbody>
            ${rows.map(({ student, completedTasks, totalTasks, attPct, initials }) => `
              <tr>
                <td>
                  <div style="display:flex;align-items:center;gap:var(--space-md)">
                    <div class="avatar avatar-sm">${initials}</div>
                    <div>
                      <div class="cell-primary">${student.name}</div>
                      <div style="font-size:0.75rem;color:var(--text-muted)">${student.email}</div>
                    </div>
                  </div>
                </td>
                <td style="color:var(--text-secondary)">${student.batch || '—'}</td>
                <td>
                  <span style="color:var(--success);font-weight:600">${completedTasks}</span>
                  <span style="color:var(--text-muted)">/${totalTasks}</span>
                </td>
                <td>
                  <div style="width:80px;height:6px;background:rgba(255,255,255,0.06);border-radius:3px;overflow:hidden">
                    <div style="height:100%;width:${attPct}%;background:${attPct >= 75 ? 'var(--success)' : attPct >= 50 ? 'var(--warning)' : 'var(--error)'};border-radius:3px"></div>
                  </div>
                </td>
                <td>
                  <span style="font-weight:600;color:${attPct >= 75 ? 'var(--success)' : attPct >= 50 ? 'var(--warning)' : 'var(--error)'}">${attPct}%</span>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  await loadAllData();

  const rangeSel = document.getElementById('reportMonthRange');
  if (rangeSel) {
    rangeSel.addEventListener('change', async () => {
      await loadAllData(); // Later could filter by month
    });
  }

  const exportBtn = document.getElementById('exportExcelBtn');
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      const type = document.getElementById('exportReportType').value;
      exportToExcel(currentReportData, type);
    });
  }
}

function exportToExcel(data, type = 'all') {
  if (!data || typeof XLSX === 'undefined') {
    showToast({ message: 'Excel export library not loaded or data missing.', type: 'error' });
    return;
  }

  const wb = XLSX.utils.book_new();
  const dateStr = new Date().toISOString().split('T')[0];

  if (type === 'all' || type === 'students') {
    const studentRows = data.students.map(s => ({
      'Name': s.name,
      'Email': s.email,
      'Batch': s.batch || 'N/A',
      'Tasks Completed': s.tasks_completed,
      'Attendance %': s.attendance_pct,
      'Logs Submitted': s.logs_count,
      'Points': s.points
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(studentRows), 'Students');
  }

  if (type === 'all' || type === 'attendance') {
    const attRows = data.raw_attendance.map(a => ({
      'Date': a.attendance_date,
      'Student': a.user_name || 'Unknown',
      'Status': a.status,
      'Check In': a.check_in_time || '',
      'Check Out': a.check_out_time || '',
      'Notes': a.notes || ''
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(attRows), 'Attendance');
  }

  if (type === 'all' || type === 'tasks') {
    const taskRows = data.raw_tasks.map(t => ({
      'Task': t.title,
      'Project ID': t.project_id || '',
      'Status': t.status,
      'Priority': t.priority,
      'Due Date': t.due_date || '',
      'Created At': t.created_at
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(taskRows), 'Tasks');
  }

  if (type === 'all' || type === 'logs') {
    const logRows = data.raw_logs.map(l => ({
      'Date': l.log_date,
      'Student': l.user_name || 'Unknown',
      'Hours': l.hours_spent,
      'Category': l.category,
      'Description': l.description,
      'Tools Used': l.tools_used || ''
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(logRows), 'Daily Logs');
  }

  const fileName = type === 'all' ? `c2s_full_report_${dateStr}.xlsx` : `c2s_${type}_report_${dateStr}.xlsx`;
  XLSX.writeFile(wb, fileName);
}

window.renderReports = renderReports;
window.initReports = initReports;
