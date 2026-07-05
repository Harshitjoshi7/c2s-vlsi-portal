# C2S VLSI Lab Portal — Task Breakdown

---

## Phase 1: Project Setup & Foundation
> Get the project running with database, auth, and base UI shell

- [x] **1.1** Initialize Node.js project (`package.json`, dependencies)
- [x] **1.2** Create Express server (`server.js`) with middleware setup
- [x] **1.3** Create `.env` config and environment loader
- [x] **1.4** Write SQLite database schema (`schema.sql`) — all 13 tables
- [x] **1.5** Create DB connection helper (`database/db.js`) + run schema on startup
- [x] **1.6** Seed initial admin account (admin@c2s.edu / admin123)
- [x] **1.7** Build auth middleware (JWT verify + role guard)
- [x] **1.8** Build auth routes + all 12 API route files
- [/] **1.9** Create design system CSS (variables, dark theme, typography, base components)
- [/] **1.10** Create SPA shell (`index.html`) + client-side router (`app.js`)
- [/] **1.11** Build navigation sidebar component
- [/] **1.12** Build reusable UI components (modal, toast, form helpers)
- [/] **1.13** Build login page (glassmorphic card, animated background)
- [ ] **1.14** Test: login as admin, verify JWT, verify route protection

---

## Phase 2: Student Features — Daily Logs & Projects
> Core student functionality: log daily work and track projects

- [ ] **2.1** Build daily logs API routes (CRUD + date filters)
- [ ] **2.2** Build daily log page — form with category, tools, attachments, status
- [ ] **2.3** Build daily log calendar view (view past entries by date)
- [ ] **2.4** Build projects API routes (CRUD + members)
- [ ] **2.5** Build projects page — project cards grid with filters
- [ ] **2.6** Build project detail view — members, status, progress
- [ ] **2.7** Build GitHub integration — fetch public repos via API proxy
- [ ] **2.8** Build student profile page — info, GitHub repos, LinkedIn link, project portfolio
- [ ] **2.9** Build student dashboard — today's tasks, recent logs, announcements
- [ ] **2.10** Test: student creates log, views calendar, manages projects, sees GitHub repos

---

## Phase 3: Admin Features — Users, Tasks & Assignments
> Admin control: manage students, assign tasks with Kanban board

- [ ] **3.1** Build user management API (CRUD students, create admin accounts)
- [ ] **3.2** Build user management page — student table, create/edit forms
- [ ] **3.3** Build tasks API (create, assign, update status, kanban format)
- [ ] **3.4** Build task board page — Kanban columns (To Do → In Progress → Done)
- [ ] **3.5** Build task detail modal — full info, progress notes, status update
- [ ] **3.6** Build admin dashboard — stats cards, attendance overview, activity feed
- [ ] **3.7** Build announcements API (CRUD + pin)
- [ ] **3.8** Build announcements page — notice board with pinned items
- [ ] **3.9** Test: admin creates student, assigns task, student sees task, updates status

---

## Phase 4: PC Management & Ticket System
> PC assignment (3-4 per student) and issue ticketing

- [ ] **4.1** Build PCs API (CRUD, assign, list by student)
- [ ] **4.2** Build PC management page — PC grid/table with assignment status
- [ ] **4.3** Build PC assignment flow — admin assigns 3-4 PCs to each student
- [ ] **4.4** Build tickets API (raise, list, update status, resolve)
- [ ] **4.5** Build ticket raise form — select PC/tool, issue type, priority, description
- [ ] **4.6** Build tickets dashboard — admin view (all open tickets sorted by priority)
- [ ] **4.7** Build student's "My PCs" view — see assigned PCs + raise ticket button
- [ ] **4.8** Test: admin adds PCs, assigns to student, student raises ticket, admin resolves

---

## Phase 5: Attendance & Notifications
> Check-in/out system, leave requests, and in-app notifications

- [ ] **5.1** Build attendance API (check-in, check-out, daily report, monthly report)
- [ ] **5.2** Build attendance page — check-in/out button, today's status
- [ ] **5.3** Build attendance calendar heatmap (monthly view)
- [ ] **5.4** Build leave request API (submit, approve/reject)
- [ ] **5.5** Build leave request UI — student form + admin approval panel
- [ ] **5.6** Build notifications API (create, list, read, unread count)
- [ ] **5.7** Build notification bell component — icon with unread badge + dropdown
- [ ] **5.8** Wire notifications into all features (tasks, tickets, announcements, leaves)
- [ ] **5.9** Test: student checks in/out, requests leave, receives notifications

---

## Phase 6: Polish, Reports & Final Testing
> Visual polish, analytics, export, and end-to-end testing

- [ ] **6.1** Add micro-animations (card entrances, hover effects, page transitions)
- [ ] **6.2** Build reports page — attendance reports, project reports, task analytics
- [ ] **6.3** Add CSV/PDF export for reports
- [ ] **6.4** Add leaderboard & gamification (points for logs, tasks, attendance streaks)
- [ ] **6.5** Responsive design pass — ensure all pages work on mobile/tablet
- [ ] **6.6** Security audit — input validation, XSS prevention, SQL injection check
- [ ] **6.7** End-to-end testing — full admin + student workflow
- [ ] **6.8** Create README with setup instructions

---

## Summary

| Phase | Tasks | Focus |
|---|---|---|
| **Phase 1** | 14 tasks | Foundation: server, DB, auth, UI shell, login |
| **Phase 2** | 10 tasks | Student: daily logs, projects, GitHub, profile |
| **Phase 3** | 9 tasks | Admin: users, tasks/Kanban, announcements |
| **Phase 4** | 8 tasks | PCs (3-4/student), ticket system |
| **Phase 5** | 9 tasks | Attendance, leave requests, notifications |
| **Phase 6** | 8 tasks | Polish, reports, export, testing |
| **Total** | **58 tasks** | |
