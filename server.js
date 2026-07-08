import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeDatabase, seedDatabase } from './database/db.js';

// Route imports
import authRoutes from './routes/auth.routes.js';
import usersRoutes from './routes/users.routes.js';
import dailyLogsRoutes from './routes/dailyLogs.routes.js';
import projectsRoutes from './routes/projects.routes.js';
import tasksRoutes from './routes/tasks.routes.js';
import pcsRoutes from './routes/pcs.routes.js';
import pcUsageRoutes from './routes/pcUsage.routes.js';
import ticketsRoutes from './routes/tickets.routes.js';
import attendanceRoutes from './routes/attendance.routes.js';
import leaveRequestsRoutes from './routes/leaveRequests.routes.js';
import announcementsRoutes from './routes/announcements.routes.js';
import notificationsRoutes from './routes/notifications.routes.js';
import githubRoutes from './routes/github.routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/daily-logs', dailyLogsRoutes);
app.use('/api/projects', projectsRoutes);
app.use('/api/tasks', tasksRoutes);
app.use('/api/pcs', pcsRoutes);
app.use('/api/pc-usage', pcUsageRoutes);
app.use('/api/tickets', ticketsRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/leave-requests', leaveRequestsRoutes);
app.use('/api/announcements', announcementsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/github', githubRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, data: { status: 'ok', timestamp: new Date().toISOString() } });
});

app.get('/api/clean-future', async (req, res) => {
  try {
    const db = (await import('./database/db.js')).default;
    await db.query(`DELETE FROM attendance WHERE attendance_date > CURRENT_DATE`);
    res.json({ success: true, message: 'Future attendance records cleaned successfully!' });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.get('/api/migrate-pc', async (req, res) => {
  try {
    const db = (await import('./database/db.js')).default;
    await db.query(`
      CREATE TABLE IF NOT EXISTS pc_usage_logs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        pc_id INTEGER NOT NULL REFERENCES pcs(id) ON DELETE CASCADE,
        usage_date DATE NOT NULL,
        status TEXT CHECK(status IN ('on', 'off')) DEFAULT 'off',
        tool_used TEXT,
        turned_on_at TIMESTAMP,
        turned_off_at TIMESTAMP,
        total_minutes_on INTEGER DEFAULT 0,
        UNIQUE(user_id, pc_id, usage_date)
      );
    `);
    res.json({ success: true, message: 'pc_usage_logs created' });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// Public Project API (For QR code scanning, unauthenticated)
import db from './database/db.js';

app.get('/api/public/projects', async (req, res) => {
  try {
    const projectsRes = await db.query(`
      SELECT p.id, p.name, p.description, p.type, p.status, p.progress_percent,
        (
          SELECT json_agg(json_build_object('name', u.name, 'role', pm.role))
          FROM project_members pm
          JOIN users u ON pm.user_id = u.id
          WHERE pm.project_id = p.id
        ) as members
      FROM projects p
      ORDER BY p.status ASC, p.created_at DESC
    `);
    res.json({ success: true, data: projectsRes.rows });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

app.get('/api/public/projects/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const projectRes = await db.query('SELECT name, description, type, status, progress_percent FROM projects WHERE id = $1', [id]);
    const project = projectRes.rows[0];

    if (!project) return res.status(404).json({ success: false, error: 'Project not found.' });

    const membersRes = await db.query(`
      SELECT u.name, u.role
      FROM project_members pm
      JOIN users u ON pm.user_id = u.id
      WHERE pm.project_id = $1
    `, [id]);

    res.json({ success: true, data: { ...project, members: membersRes.rows } });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// SPA fallback — serve index.html for all non-API routes
// On Vercel serverless, sendFile doesn't work because public/ is deployed
// separately by @vercel/static. So we read the file at startup or fall back
// to an inline HTML shell that loads the app.
import fs from 'fs';

let indexHtml = null;
try {
  indexHtml = fs.readFileSync(path.join(__dirname, 'public', 'index.html'), 'utf8');
} catch (e) {
  // Will use inline fallback on Vercel
}

app.get('*', (req, res) => {
  // Don't intercept API routes
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ success: false, message: 'API endpoint not found' });
  }

  if (indexHtml) {
    res.set('Content-Type', 'text/html');
    return res.send(indexHtml);
  }

  // Inline fallback: a minimal HTML page that redirects to root
  // so the static index.html + SPA router can take over
  res.set('Content-Type', 'text/html');
  res.send(`<!DOCTYPE html>
<html><head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>C2S VLSI Lab Portal</title>
<script>
  // SPA fallback: redirect to root so the static server can serve index.html
  // The hash preserves the intended route for the client-side router
  if (window.location.pathname !== '/') {
    var intended = window.location.pathname + window.location.search;
    sessionStorage.setItem('c2s_redirect', intended);
    window.location.replace('/');
  }
</script>
</head>
<body style="background:#0a0e27;color:#fff;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;font-family:sans-serif">
<p>Loading...</p>
</body></html>`);
});

// Initialize database and start server (if not in serverless environment)
if (process.env.NODE_ENV !== 'production') {
  async function start() {
    try {
      await initializeDatabase();
      await seedDatabase();
      console.log('Database ready.');
      app.listen(PORT, () => {
        console.log(`C2S VLSI Portal server running on http://localhost:${PORT}`);
      });
    } catch (error) {
      console.error('Failed to start server:', error);
      process.exit(1);
    }
  }
  start();
}

// Export for Vercel
export default app;
