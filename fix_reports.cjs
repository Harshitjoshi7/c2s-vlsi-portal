const fs = require('fs');

try {
    let content = fs.readFileSync('public/js/pages/reports.js', 'utf8');

    const old_promise = `    const [students, projects, tasks, attendance, tickets, users] = await Promise.allSettled([
      api.get('users?role=student').catch(() => []),
      api.get('projects').catch(() => []),
      api.get('tasks').catch(() => []),
      api.get('attendance').catch(() => []),
      api.get('users').catch(() => []),
      api.get('public/projects').catch(() => []) // fetch project members data via public endpoint or an admin endpoint if exists
    ]);

    const val = r => r.status === 'fulfilled' ? (Array.isArray(r.value) ? r.value : (r.value?.data || [])) : [];

    const studentsData = val(students);
    const projectsData = val(projects);
    const tasksData = val(tasks);
    const attendanceData = val(attendance);
    const ticketsData = val(tickets);`;

    const new_promise = `    const [students, projects, tasks, attendance, tickets, pcs, leaves] = await Promise.allSettled([
      api.get('users?role=student').catch(() => []),
      api.get('projects').catch(() => []),
      api.get('tasks').catch(() => []),
      api.get('attendance').catch(() => []),
      api.get('tickets').catch(() => []),
      api.get('pcs').catch(() => []),
      api.get('leave-requests').catch(() => [])
    ]);

    const val = r => r.status === 'fulfilled' ? (Array.isArray(r.value) ? r.value : (r.value?.data || [])) : [];

    const studentsData = val(students);
    const projectsData = val(projects);
    const tasksData = val(tasks);
    const attendanceData = val(attendance);
    const ticketsData = val(tickets);
    const pcsData = val(pcs);
    const leavesData = val(leaves);`;

    content = content.replace(old_promise, new_promise);

    const old_curr_report = `      raw_attendance: attendanceData,
      raw_tasks: tasksData,
      raw_logs: logsData,
      raw_projects: projectsData
    };`;

    const new_curr_report = `      raw_attendance: attendanceData,
      raw_tasks: tasksData,
      raw_logs: logsData,
      raw_projects: projectsData,
      raw_tickets: ticketsData,
      raw_pcs: pcsData,
      raw_leaves: leavesData
    };`;

    content = content.replace(old_curr_report, new_curr_report);

    const old_dropdown = `              <option value="projects">Export Projects</option>
              <option value="logs">Export Daily Logs</option>
            </select>`;
            
    const new_dropdown = `              <option value="projects">Export Projects</option>
              <option value="logs">Export Daily Logs</option>
              <option value="tickets">Export Tickets</option>
              <option value="pcs">Export PCs</option>
              <option value="leaves">Export Leave Requests</option>
            </select>`;
            
    content = content.replace(old_dropdown, new_dropdown);

    const old_export = `function exportToExcel(data, type = 'all') {
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
      'Projects Count': s.projects_count,
      'Attendance %': s.attendance_pct,
      'Logs Submitted': s.logs_count,
      'Points': s.points
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(studentRows), 'Students');
  }

  if (type === 'all' || type === 'projects') {
    const projRows = data.raw_projects.map(p => ({
      'Project Name': p.name,
      'Type': p.type || 'N/A',
      'Status': p.status,
      'Progress %': p.progress_percent,
      'Members Count': p.members ? p.members.length : 0,
      'Start Date': p.start_date || '',
      'End Date': p.end_date || ''
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(projRows), 'Projects');
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

  const fileName = type === 'all' ? \`c2s_full_report_\${dateStr}.xlsx\` : \`c2s_\${type}_report_\${dateStr}.xlsx\`;
  XLSX.writeFile(wb, fileName);
}`;

    const new_export = `function exportToExcel(data, type = 'all') {
  if (!data || typeof XLSX === 'undefined') {
    showToast({ message: 'Excel export library not loaded or data missing.', type: 'error' });
    return;
  }

  const wb = XLSX.utils.book_new();
  const dateStr = new Date().toISOString().split('T')[0];

  if (type === 'all' || type === 'students') {
    const studentRows = data.students.map(s => ({
      'ID': s.id || '',
      'Name': s.name,
      'Email': s.email,
      'Role': s.role || 'student',
      'Batch': s.batch || 'N/A',
      'Enrollment ID': s.enrollment_id || '',
      'GitHub Username': s.github_username || '',
      'LinkedIn URL': s.linkedin_url || '',
      'Skills': typeof s.skills === 'string' ? s.skills : JSON.stringify(s.skills || []),
      'Points': s.points || 0,
      'Active Status': s.is_active === 1 || s.is_active === true ? 'Active' : 'Inactive',
      'Tasks Completed': s.tasks_completed,
      'Projects Count': s.projects_count,
      'Attendance %': s.attendance_pct,
      'Logs Submitted': s.logs_count,
      'Joined At': s.created_at || ''
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(studentRows), 'Students');
  }

  if (type === 'all' || type === 'projects') {
    const projRows = (data.raw_projects || []).map(p => ({
      'ID': p.id,
      'Project Name': p.name,
      'Description': p.description || '',
      'Type': p.type || 'N/A',
      'Status': p.status,
      'Progress %': p.progress_percent,
      'Members Count': p.members ? p.members.length : 0,
      'Start Date': p.start_date || '',
      'End Date': p.end_date || '',
      'GitHub Repo': p.github_repo_url || '',
      'Created At': p.created_at || ''
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(projRows), 'Projects');
  }

  if (type === 'all' || type === 'attendance') {
    const attRows = (data.raw_attendance || []).map(a => ({
      'ID': a.id,
      'Date': a.attendance_date,
      'Student ID': a.user_id,
      'Student': a.user_name || 'Unknown',
      'Status': a.status,
      'Check In': a.check_in_time || '',
      'Check Out': a.check_out_time || ''
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(attRows), 'Attendance');
  }

  if (type === 'all' || type === 'tasks') {
    const taskRows = (data.raw_tasks || []).map(t => ({
      'ID': t.id,
      'Task': t.title,
      'Description': t.description || '',
      'Assigned By': t.assigned_by_name || t.assigned_by || '',
      'Category': t.category || '',
      'Status': t.status,
      'Priority': t.priority,
      'Deadline': t.deadline || '',
      'Created At': t.created_at || '',
      'Updated At': t.updated_at || '',
      'Attachments': typeof t.attachments === 'string' ? t.attachments : JSON.stringify(t.attachments || [])
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(taskRows), 'Tasks');
  }

  if (type === 'all' || type === 'logs') {
    const logRows = (data.raw_logs || []).map(l => ({
      'ID': l.id,
      'Date': l.log_date,
      'Student ID': l.user_id,
      'Student': l.user_name || 'Unknown',
      'Work Description': l.work_description || l.description || '',
      'Category': l.category || '',
      'Tools Used': typeof l.tools_used === 'string' ? l.tools_used : JSON.stringify(l.tools_used || []),
      'Status': l.status || '',
      'Attachments': typeof l.attachments === 'string' ? l.attachments : JSON.stringify(l.attachments || []),
      'Created At': l.created_at || '',
      'Updated At': l.updated_at || ''
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(logRows), 'Daily Logs');
  }
  
  if (type === 'all' || type === 'tickets') {
    const ticketRows = (data.raw_tickets || []).map(t => ({
      'Ticket Number': t.ticket_number || '',
      'PC ID': t.pc_id || '',
      'Raised By': t.raised_by_name || t.raised_by || '',
      'Assigned Admin': t.assigned_admin_name || t.assigned_admin || '',
      'Issue Type': t.issue_type || '',
      'Priority': t.priority || '',
      'Description': t.description || '',
      'Status': t.status || '',
      'Resolution Notes': t.resolution_notes || '',
      'Created At': t.created_at || '',
      'Resolved At': t.resolved_at || ''
    }));
    if (ticketRows.length > 0) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(ticketRows), 'Tickets');
  }
  
  if (type === 'all' || type === 'pcs') {
    const pcRows = (data.raw_pcs || []).map(p => ({
      'ID': p.id,
      'PC Name': p.pc_name || '',
      'Specs': typeof p.specs === 'string' ? p.specs : JSON.stringify(p.specs || {}),
      'Installed Software': typeof p.installed_software === 'string' ? p.installed_software : JSON.stringify(p.installed_software || []),
      'Condition': p.condition || '',
      'Notes': p.notes || '',
      'Created At': p.created_at || ''
    }));
    if (pcRows.length > 0) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(pcRows), 'PCs');
  }

  if (type === 'all' || type === 'leaves') {
    const leaveRows = (data.raw_leaves || []).map(l => ({
      'ID': l.id,
      'Student': l.user_name || l.user_id || '',
      'Start Date': l.start_date || '',
      'End Date': l.end_date || '',
      'Reason': l.reason || '',
      'Status': l.status || '',
      'Approved By': l.approved_by_name || l.approved_by || '',
      'Created At': l.created_at || ''
    }));
    if (leaveRows.length > 0) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(leaveRows), 'Leave Requests');
  }

  const fileName = type === 'all' ? \`c2s_full_report_\${dateStr}.xlsx\` : \`c2s_\${type}_report_\${dateStr}.xlsx\`;
  XLSX.writeFile(wb, fileName);
}`;

    content = content.replace(old_export, new_export);

    const old_map = `        return {
          name: s.name,
          email: s.email,
          batch: s.batch,
          tasks_completed: sTasksCompleted,
          projects_count: sProjects,
          attendance_pct: sAttPct,
          logs_count: logsData.filter(l => l.user_id === s.id).length,
          points: s.points || 0
        };`;
        
    const new_map = `        return {
          id: s.id,
          name: s.name,
          email: s.email,
          role: s.role,
          batch: s.batch,
          enrollment_id: s.enrollment_id,
          github_username: s.github_username,
          linkedin_url: s.linkedin_url,
          skills: s.skills,
          is_active: s.is_active,
          created_at: s.created_at,
          tasks_completed: sTasksCompleted,
          projects_count: sProjects,
          attendance_pct: sAttPct,
          logs_count: logsData.filter(l => l.user_id === s.id).length,
          points: s.points || 0
        };`;
        
    content = content.replace(old_map, new_map);

    fs.writeFileSync('public/js/pages/reports.js', content, 'utf8');
    console.log("reports.js fixed");
} catch (e) {
    console.error(e);
}
