const fs = require('fs');

try {
    let content = fs.readFileSync('public/js/pages/attendance.js', 'utf8');

    const working_days_code = `function getWorkingDays(startDateStr, endDateStr) {
  if (!startDateStr || !endDateStr) return 0;
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);
  if (isNaN(start) || isNaN(end)) return 0;
  start.setHours(0,0,0,0);
  end.setHours(0,0,0,0);
  
  let count = 0;
  let cur = new Date(start);
  while(cur <= end) {
    const day = cur.getDay();
    if (day !== 0 && day !== 6) count++;
    cur.setDate(cur.getDate() + 1);
  }
  return count;
}

function renderAttendance() {`;

    content = content.replace("function renderAttendance() {", working_days_code);

    const old_stats = `  function updateStats() {
    const present = allAttendance.filter(a => a.status === 'present').length;
    const absent = allAttendance.filter(a => a.status === 'absent').length;
    const late = allAttendance.filter(a => a.status === 'late').length;
    const total = allAttendance.length;
    const pct = total > 0 ? Math.round(((present + late) / total) * 100) : 0;

    document.getElementById('attPresent').textContent = present;
    document.getElementById('attAbsent').textContent = absent;
    document.getElementById('attLate').textContent = late;
    document.getElementById('attPct').textContent = \`\${pct}%\`;
  }`;

    const new_stats = `  function updateStats() {
    const present = allAttendance.filter(a => a.status === 'present').length;
    let absent = allAttendance.filter(a => a.status === 'absent').length;
    const late = allAttendance.filter(a => a.status === 'late').length;
    const total = allAttendance.length;
    
    let expectedDays = total;
    if (isAdminUser && studentsList && studentsList.length > 0) {
      expectedDays = studentsList.reduce((acc, u) => acc + getWorkingDays(u.created_at || new Date(), new Date()), 0);
    } else if (!isAdminUser && user && user.created_at) {
      expectedDays = getWorkingDays(user.created_at, new Date());
    }
    
    expectedDays = Math.max(expectedDays, total);
    const missingDays = expectedDays > total ? expectedDays - total : 0;
    absent += missingDays;

    const pct = expectedDays > 0 ? Math.round(((present + late) / expectedDays) * 100) : 0;

    document.getElementById('attPresent').textContent = present;
    document.getElementById('attAbsent').textContent = absent;
    document.getElementById('attLate').textContent = late;
    document.getElementById('attPct').textContent = \`\${pct}%\`;
  }`;

    content = content.replace(old_stats, new_stats);

    fs.writeFileSync('public/js/pages/attendance.js', content, 'utf8');
    console.log("attendance.js fixed");
} catch (e) {
    console.error(e);
}
