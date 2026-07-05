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

// Public Project API (For QR code scanning, unauthenticated)
import db from './database/db.js';
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
app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, 'public', 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      res.status(200).json({
        success: true,
        data: {
          message: 'C2S VLSI Lab Management Portal API',
          version: '1.0.0',
          endpoints: [
            '/api/auth', '/api/users', '/api/daily-logs', '/api/projects',
            '/api/tasks', '/api/pcs', '/api/tickets', '/api/attendance',
            '/api/leave-requests', '/api/announcements', '/api/notifications',
            '/api/github',
          ],
        },
      });
    }
  });
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
