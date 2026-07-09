import fetch from 'node-fetch';
import FormData from 'form-data';

(async () => {
  try {
    const loginRes = await fetch('https://c2s-vlsi-portal.vercel.app/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@c2s.edu', password: 'admin123' })
    });
    const loginData = await loginRes.json();
    const token = loginData.token;
    console.log("Logged in:", loginData.success);
    if (!token) return;

    const tasksRes = await fetch('https://c2s-vlsi-portal.vercel.app/api/tasks', {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    const tasksData = await tasksRes.json();
    
    let assignment;
    let task;
    for (const t of tasksData.data) {
      if (t.assignees) {
         for (const a of t.assignees) {
            if (a.name === 'Amit') {
               task = t;
               assignment = a;
               break;
            }
         }
      }
      if (task) break;
    }
    
    if (!task) {
      console.log('Task not found for Amit');
      return;
    }

    console.log("Found task assignment:", assignment.assignment_id);

    const putRes = await fetch('https://c2s-vlsi-portal.vercel.app/api/tasks/' + task.id + '/status', {
      method: 'PUT',
      headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'needs_revision', user_id: assignment.id })
    });
    const putData = await putRes.json();
    console.log("PUT status response:", putData);

    const fd = new FormData();
    fd.append('status_change', 'needs_revision');
    const postRes = await fetch('https://c2s-vlsi-portal.vercel.app/api/tasks/assignments/' + assignment.assignment_id + '/history', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + token, ...fd.getHeaders() },
      body: fd
    });
    const postData = await postRes.json();
    console.log("POST history response:", postData);
  } catch (err) {
    console.error(err);
  }
})();
