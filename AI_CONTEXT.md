# C2S VLSI Lab Management Portal — Complete AI Context Document

> **Purpose:** This document is the single source of truth for any AI assistant working on this codebase. It covers every architectural decision, business rule, file, API endpoint, data model, UI pattern, deployment detail, and known gotcha. After reading this, you should be able to modify any part of the system without breaking anything else.

---

## 1. Project Identity

| Field | Value |
|---|---|
| **Name** | C2S VLSI Lab Management Portal |
| **URL** | `https://c2s-vlsi-portal.vercel.app` |
| **Repo** | `https://github.com/Harshitjoshi7/c2s-vlsi-portal` |
| **Purpose** | Manage a VLSI (Very Large Scale Integration) university lab: students, attendance, daily logs, projects, tasks, PC inventory, IT tickets, announcements, and reports. |
| **Users** | Two roles: `admin` (lab supervisor/professor) and `student` (lab members). |
| **Default Admin** | `admin@c2s.edu` / `admin123` (seeded automatically on first startup). |
| **Default Students** | All students use pattern `firstname.lastname@c2s.edu` / `password123`. |

---

## 2. Tech Stack

| Layer | Technology | Notes |
|---|---|---|
| **Runtime** | Node.js (ES Modules — `"type": "module"`) | All imports use `import/export`. |
| **Backend** | Express.js `^4.18.2` | JSON API at `/api/*`. |
| **Database** | PostgreSQL on **Supabase** | Connected via `pg` pool. Connection string in `DATABASE_URL` env var. SSL enabled in production. |
| **Auth** | JWT (`jsonwebtoken ^9.0.2`) + `bcryptjs ^2.4.3` | Token stored in `localStorage` as `c2s_token`. |
| **File Uploads** | `multer ^1.4.5-lts.1` | Available but minimally used (attachments are stored as JSON text arrays). |
| **Security** | `helmet ^7.1.0`, `cors ^2.8.5` | CSP disabled (`contentSecurityPolicy: false`) to allow CDN scripts. |
| **Push Notifications** | `web-push ^3.6.7` + Service Worker | VAPID keys required. Configurable via env vars. |
| **Frontend** | Vanilla HTML/CSS/JavaScript (NO framework) | SPA-like behavior with client-side routing via `history.pushState`. |
| **Icons** | Lucide Icons (via CDN `unpkg.com/lucide`) | Must call `lucide.createIcons()` after DOM changes. |
| **Charts** | Chart.js `^4.4.7` (via CDN) | Used on Dashboard and Reports pages. |
| **Excel Export** | SheetJS/XLSX `0.20.1` (via CDN) | Used on Reports page for multi-sheet Excel downloads. |
| **Typography** | Google Fonts — Inter (300-700) | Imported in `design-system.css`. |
| **Hosting** | Vercel (Serverless) | `server.js` runs as `@vercel/node`. Static files via `@vercel/static`. |

---

## 3. Environment Variables

Defined in `.env` (local) and Vercel Dashboard (production). Reference: `.env.example`.

| Variable | Required | Description |
|---|---|---|
| `PORT` | No | Local dev port (default `3000`). |
| `JWT_SECRET` | **Yes** | Secret key for signing JWT tokens. |
| `JWT_EXPIRES_IN` | No | Token expiry (default `24h`). |
| `DATABASE_URL` | **Yes** | Supabase PostgreSQL connection string with `?sslmode=require`. |
| `NODE_ENV` | No | Set to `production` on Vercel. Controls SSL and server startup behavior. |
| `VAPID_PUBLIC_KEY` | No | Web Push VAPID public key. Required for push notifications. |
| `VAPID_PRIVATE_KEY` | No | Web Push VAPID private key. |
| `VAPID_EMAIL` | No | Contact email for VAPID (e.g. `admin@yourdomain.com`). |

---

## 4. Directory Structure (Every File)

```
c2s-vlsi-portal/
├── server.js                        # Express entry point, route mounting, public project API, SPA fallback
├── package.json                     # Dependencies, scripts (start, dev)
├── vercel.json                      # Vercel build config, cron jobs, URL rewrites, cache headers
├── .env / .env.example              # Environment variables
│
├── database/
│   ├── db.js                        # PostgreSQL pool, db.query(), db.prepare() (SQLite compat shim),
│   │                                # db.withTransaction(), initializeDatabase(), seedDatabase(),
│   │                                # createNotification() (in-app + web push dispatch)
│   └── schema.sql                   # DDL for all 12 tables + indexes (single source of truth)
│
├── middleware/
│   ├── auth.js                      # verifyToken() — extracts JWT from Bearer header or cookie,
│   │                                # verifies signature, fetches user from DB, attaches req.user
│   └── roleGuard.js                 # authorize('admin') — checks req.user.role against allowed roles
│
├── utils/
│   └── validators.js                # isValidEmail(), isNotEmpty(), isValidRole(), isValidPriority(), isValidStatus()
│
├── routes/                          # Each file exports an Express Router
│   ├── auth.routes.js               # POST /login, GET /me, POST /change-password
│   ├── users.routes.js              # CRUD users (admin: create/update/deactivate, any: list/get with stats)
│   ├── dailyLogs.routes.js          # CRUD daily work logs (student: own, admin: all). Unique per user+date.
│   ├── projects.routes.js           # CRUD projects + member management. Types: ASIC/FPGA/Analog/Digital/Mixed-Signal
│   ├── tasks.routes.js              # CRUD tasks + assignees. Priority/status tracking. Deadline notifications.
│   ├── pcs.routes.js                # CRUD PC inventory, specs (JSON), software list, assign/transfer PCs
│   ├── tickets.routes.js            # CRUD IT support tickets. Auto-generates ticket_number. Links to PCs.
│   ├── attendance.routes.js         # Check-in/out, admin mark, auto-absent batch, date view, monthly report
│   ├── leaveRequests.routes.js      # Submit/approve/reject. On approval, auto-creates on_leave attendance records.
│   ├── announcements.routes.js      # CRUD announcements. Admin can pin. Notifies all students on create.
│   ├── notifications.routes.js      # CRUD notifications, VAPID key endpoint, push subscribe/unsubscribe, CRON handlers
│   └── github.routes.js             # Proxy to GitHub API — fetches user repos for profile display
│
├── public/                          # Served statically by Express
│   ├── index.html                   # SPA shell: loads all CSS + JS, registers Service Worker
│   ├── manifest.json                # PWA manifest (name, icons, colors, display: standalone)
│   ├── sw.js                        # Service Worker: cache-first for assets, network-first for API,
│   │                                # push notification handler with sound playback via postMessage
│   ├── icons/                       # App icons (logo.png, icon.svg)
│   ├── css/
│   │   ├── design-system.css        # CSS custom properties (colors, spacing, shadows, typography), reset, base styles
│   │   ├── components.css           # Buttons, cards, forms, inputs, tables, badges, avatars, modals, dropdowns, tooltips
│   │   ├── layouts.css              # App layout (sidebar + main), responsive grid system, login layout, page headers
│   │   └── animations.css           # Keyframe animations (slideUp, fadeIn, scaleIn, pulse, shimmer, stagger classes)
│   └── js/
│       ├── api.js                   # Fetch wrapper: api.get/post/put/delete(), auth helpers (getToken, getUser,
│       │                            # setToken, setUser, clearAuth, isLoggedIn, isAdmin). Auto-redirects on 401.
│       ├── app.js                   # SPA router: route definitions, navigate(), renderPage(), renderAppLayout()
│       │                            # with sidebar + top header + notification panel. Auth/admin guards.
│       │                            # Service Worker message listener for notification sounds.
│       ├── auth.js                  # Login page: glassmorphic card with animated particles, form submit,
│       │                            # JWT token storage. Exports renderLoginPage() + initLoginPage().
│       ├── dashboard.js             # Admin dashboard: stat cards, recent activity, quick actions.
│       │                            # Student dashboard: personal stats, attendance, upcoming deadlines.
│       ├── components/
│       │   ├── calendar.js          # Reusable calendar component with date-click, month navigation, dot indicators
│       │   ├── modal.js             # Generic modal helpers (open/close overlay pattern)
│       │   ├── navbar.js            # Sidebar component: renderSidebar(), initSidebar() with nav links,
│       │   │                        # active state, mobile toggle, logout button
│       │   ├── notifications.js     # Notification bell: polling, panel, mark-read, clear-all,
│       │   │                        # push subscription (initPushNotifications)
│       │   └── toast.js             # showToast({ message, type }) — auto-dismiss floating notifications
│       └── pages/
│           ├── daily-logs.js        # CRUD daily logs with date picker, category filter, tools-used tags
│           ├── projects.js          # CRUD projects, member management, progress tracking, GitHub repo link
│           ├── tasks.js             # CRUD tasks, multi-assignee, status workflow, deadline tracking, drag-and-drop
│           ├── pcs.js               # PC inventory, specs editor, software list, assignment management
│           ├── tickets.js           # Ticket CRUD, priority/status badges, resolution notes
│           ├── attendance.js        # Check-in/out (student), admin mark modal, calendar view,
│           │                        # date-specific records, leave request management
│           ├── users.js             # Admin user management: create, edit, deactivate, reset password
│           ├── announcements.js     # Create/edit/delete announcements, pin/unpin
│           ├── reports.js           # Charts (attendance trend, task status, project progress, tickets),
│           │                        # Student Activity Summary table, multi-sheet Excel export
│           ├── profile.js           # User profile: edit info, skills, GitHub repos display, change password
│           ├── public-projects.js   # Public projects listing page (no auth required, for QR code scanning)
│           └── public-project.js    # Single public project detail page
│
├── seed_students.js                 # One-time script to seed 8 test students and their PC assignments
│                                    # (uses old SQLite-style db.prepare — NOT for production use with Postgres)
├── update_passwords.js              # Helper to reset student passwords
├── migrate_pg.js / .py              # One-time SQLite → PostgreSQL migration scripts
├── migrate_notification_type.js     # One-time migration to add notification types
├── migrate_task_status.js           # One-time migration to update task status enum
├── fix_attendance.cjs               # One-time attendance data fix script
├── fix_reports.cjs                  # One-time reports data fix script
├── fix_grids.py                     # One-time CSS grid fix script
└── test_login.js / test_sqlite.js   # One-time test scripts
```

---

## 5. Database Schema (12 Tables)

### 5.1 `users`
| Column | Type | Notes |
|---|---|---|
| `id` | SERIAL PK | |
| `name` | TEXT NOT NULL | |
| `email` | TEXT UNIQUE NOT NULL | Used for login (case-insensitive). Login also accepts `name`. |
| `password_hash` | TEXT NOT NULL | bcrypt hash. |
| `role` | TEXT | `'admin'` or `'student'`. |
| `batch` | TEXT | Optional academic batch identifier. |
| `enrollment_id` | TEXT | Optional student enrollment ID. |
| `github_username` | TEXT | Used to fetch repos via GitHub API proxy. |
| `linkedin_url` | TEXT | |
| `avatar_url` | TEXT | |
| `skills` | TEXT DEFAULT '[]' | JSON array of skill strings. |
| `points` | INTEGER DEFAULT 0 | Gamification points (e.g., +5 for check-in). |
| `is_active` | INTEGER DEFAULT 1 | Soft delete. `0` = deactivated. |
| `created_at`, `updated_at` | TIMESTAMP | |

### 5.2 `attendance`
| Column | Type | Notes |
|---|---|---|
| `id` | SERIAL PK | |
| `user_id` | INTEGER FK → users | |
| `attendance_date` | DATE NOT NULL | |
| `status` | TEXT | `'present'`, `'absent'`, `'late'`, `'on_leave'` |
| `check_in_time` | TIMESTAMP | |
| `check_out_time` | TIMESTAMP | |
| **UNIQUE** | `(user_id, attendance_date)` | One record per student per day. |

### 5.3 `leave_requests`
| Column | Type | Notes |
|---|---|---|
| `id` | SERIAL PK | |
| `user_id` | INTEGER FK → users | |
| `start_date`, `end_date` | DATE NOT NULL | |
| `reason` | TEXT | Optional. |
| `status` | TEXT | `'pending'`, `'approved'`, `'rejected'` |
| `approved_by` | INTEGER FK → users | Admin who approved/rejected. |
| `created_at` | TIMESTAMP | |

### 5.4 `daily_logs`
- **UNIQUE** on `(user_id, log_date)` — one log per student per day.
- Fields: `work_description`, `category`, `tools_used` (JSON array text), `status` (in_progress/completed/blocked), `attachments` (JSON array text).

### 5.5 `projects` & `project_members`
- **projects**: `name`, `description`, `type` (ASIC/FPGA/Analog/Digital/Mixed-Signal), `status` (active/on_hold/completed), `progress_percent`, `start_date`, `end_date`, `github_repo_url`.
- **project_members**: `project_id` FK, `user_id` FK, `role` (lead/member).

### 5.6 `tasks` & `task_assignments`
- **tasks**: `title`, `description`, `assigned_by` FK, `priority` (low/medium/high/critical), `status` (assigned/in_progress/under_review/completed), `category`, `deadline`, `attachments`.
- **task_assignments**: `task_id` FK, `user_id` FK, individual `status`, `progress_notes`, `completed_at`.

### 5.7 `pcs` & `pc_assignments`
- **pcs**: `pc_name` (UNIQUE, e.g. "SISTEC/EC/COE/S. C. T/01"), `specs` (JSON text), `installed_software` (JSON array text), `condition` (excellent/good/fair/needs_repair), `notes`.
- **pc_assignments**: `pc_id` FK, `user_id` FK, `assigned_date`, `unassigned_date`, `status` (active/transferred).

### 5.8 `tickets`
- `ticket_number` (UNIQUE, auto-generated), `pc_id` FK (optional), `raised_by` FK, `assigned_admin` FK, `issue_type` (hardware/software/network/license/other), `priority`, `description`, `screenshots` (JSON array text), `status` (open/in_progress/resolved/closed), `resolution_notes`, `resolved_at`.

### 5.9 `announcements`
- `created_by` FK, `title`, `content`, `is_pinned` (0/1).

### 5.10 `notifications` & `push_subscriptions`
- **notifications**: `user_id` FK, `type` (task/ticket/announcement/leave/deadline/attendance), `title`, `message`, `link`, `is_read` (0/1).
- **push_subscriptions**: `user_id` FK, `endpoint` (UNIQUE), `p256dh`, `auth`.

---

## 6. Critical Business Logic

### 6.1 Attendance System (MOST COMPLEX)

**File:** `routes/attendance.routes.js`

#### Auto-Absent Batch Insert (`initializeDayAttendance`)
- Triggered whenever the first check-in or admin attendance action occurs for a given date.
- Runs a batch `INSERT ... SELECT` that creates a record for every active student:
  - Students with an `approved` or `pending` leave request covering that date → `'on_leave'`.
  - Everyone else → `'absent'`.
- Uses `ON CONFLICT (user_id, attendance_date) DO NOTHING` so it's safe to call multiple times.
- **CRITICAL:** Parameters must use explicit `::date` casting (e.g., `$1::date`) because Supabase PostgreSQL is strict about type comparisons in `LEFT JOIN` conditions.

#### Student Check-In Flow
1. `POST /api/attendance/check-in` → calls `initializeDayAttendance(today)`.
2. Looks up existing record → if `absent` or `on_leave`, updates to `present`. If already `present`/`late`, returns 409.
3. Awards +5 gamification points. Sends notification.

#### Admin Mark Attendance
1. `POST /api/attendance` → accepts `user_id`, `attendance_date`, `status`.

### 3. Attendance System & Leave Logic
- **Attendance Initialization**: Attendance is primarily generated on the fly. When a user queries a date, the system fetches all actual records in the `attendance` table. Any active student *not* found in the `attendance` table for that date is dynamically rendered as `absent` by the frontend.
- **Leave Requests Auto-Marking**: 
  - To ensure attendance calculations aren't corrupted, any time a student submits a leave request (or an admin approves it), the backend uses `generate_series` in PostgreSQL to forcefully insert `on_leave` records for all days in that range into the `attendance` table.
  - It uses `ON CONFLICT ... DO UPDATE SET status = 'on_leave' WHERE attendance.status = 'absent'`. This guarantees that if a student is already marked `present`, the system respects their presence, but if they were `absent`, it overrides it to `on_leave`.
- **Total Working Days Calculation (Crucial Bug Prevention)**:
  - Working days are dynamically calculated by counting `COUNT(DISTINCT attendance_date)` in the database.
  - **IMPORTANT**: To avoid future leave requests from inflating the `totalWorkingDays` (and mathematically destroying everyone's attendance percentage), all working day queries MUST append `AND attendance_date <= CURRENT_DATE` in SQL (or `date <= todayStr` in JS). Future dates are NEVER counted as working days.
- **Attendance Percentage Formula**:
  - `Effective Days = Total Working Days up to today - Leave Days up to today`.
  - `Percentage = Present Days / Effective Days`.
- **Inline Editing**: Admins can edit attendance statuses individually for each student via an inline `<select>` dropdown directly on the `attendance.js` view, which sends a POST request to upsert the status.

#### Leave Approval Side Effect
- **File:** `routes/leaveRequests.routes.js`, line 99-113.
- When admin approves a leave request, it loops through every date in the range and inserts `on_leave` attendance records using `ON CONFLICT DO UPDATE SET status = 'on_leave'`.
- This means approved leave OVERWRITES any existing attendance status for those dates.

#### Attendance Percentage Calculation (RECENTLY FIXED)
The formula is the same across backend and frontend:
```
workingDays = COUNT(DISTINCT attendance_date) across ALL students
effectiveDays = workingDays - student's leaveDays
percentage = presentDays / effectiveDays
```
- If `effectiveDays = 0` and `leaveDays > 0` → `100%` (student on leave, not penalized).
- If `effectiveDays = 0` and `leaveDays = 0` → `0%` (no data).
- **Key insight:** Working days is a GLOBAL count (distinct dates with any attendance record in the system), not per-student. This prevents the 100% bug that occurs when a student only has `present` records and no `absent` records.

### 6.2 Frontend SPA Router
**File:** `public/js/app.js`

- Uses `history.pushState` for navigation (real URL paths like `/dashboard`, not hash routing).
- Route table maps paths to `{ render, init, auth, admin }`.
- `renderPage()` is the central dispatcher:
  1. Checks for `sessionStorage` redirect (from Vercel SPA fallback).
  2. Matches route, applies auth guard, admin guard.
  3. Calls `render()` to get HTML string → injects into `#app`.
  4. Wraps authenticated pages in `renderAppLayout()` (sidebar + top bar).
  5. Calls `lucide.createIcons()` then `init()` for page-specific async logic.
- **Pattern:** Every page module exports two functions to `window`:
  - `renderXxx()` — returns HTML string (synchronous, no API calls).
  - `initXxx()` — runs after DOM is ready (async, binds events, fetches data).

### 6.3 Notification System
**Backend:** `database/db.js` → `createNotification(userId, type, title, message, link)`.
- Inserts in-app notification row.
- Fire-and-forget dispatches web push to all registered devices for that user.
- Handles expired/removed push subscriptions (deletes on 404/410).

**Frontend:** `public/js/components/notifications.js`.
- Polls `/api/notifications/unread-count` every 30 seconds.
- Notification bell with badge count.
- Panel shows last 50 notifications.

**Cron Jobs (Vercel):** Defined in `vercel.json`.
- `GET /api/notifications/cron/daily-attendance` — Weekdays 9:30 AM IST (04:00 UTC): reminds students who haven't checked in.
- `GET /api/notifications/cron/attendance-summary` — Weekdays 5:30 PM IST (12:00 UTC): sends end-of-day present/absent summary to all.
- These cron endpoints have NO auth middleware (they run before `router.use(verifyToken)`).

### 6.4 Gamification
- `+5 points` on check-in (`POST /check-in`).
- `-5 points` on unmark/delete attendance (only if status was `present`).
- Points stored in `users.points`.

### 6.5 Public Project Pages (No Auth)
- `GET /api/public/projects` and `GET /api/public/projects/:id` — defined directly in `server.js` (not in routes/).
- Frontend pages: `public-projects.js` and `public-project.js`.
- Intended for QR code scanning at lab events — visitors can browse projects without logging in.

### 6.6 Excel Export
- **File:** `public/js/pages/reports.js` → `exportToExcel()`.
- Uses SheetJS (`XLSX` global) to create multi-sheet workbooks.
- Supports exporting: Students, Attendance, Tasks, Projects, Daily Logs, Tickets, PCs, Leave Requests.
- Each sheet has full column headers with all relevant fields.

---

## 7. API Response Format

All API responses follow this pattern:
```json
{ "success": true, "data": <result> }
{ "success": false, "error": "<message>" }
```

The frontend `api.js` wrapper returns the full response object. Page code typically accesses:
```javascript
const res = await api.get('endpoint');
const items = Array.isArray(res) ? res : (res?.data || []);
```

---

## 8. Deployment Architecture

### Vercel Configuration (`vercel.json`)
- **Builds:** `server.js` → `@vercel/node` (serverless function). `public/**` → `@vercel/static`.
- **Rewrites:** `/api/*` → `server.js`. All other routes → `server.js` (SPA fallback).
- **Headers:** `sw.js` and `index.html` → `Cache-Control: public, max-age=0, must-revalidate` (no caching for fresh deploys).
- **Cron Jobs:** Two daily cron endpoints (attendance reminder + summary).

### SPA Fallback Mechanism
- On Vercel, non-API routes hit `server.js` which serves `index.html`.
- If the file can't be read (e.g., serverless cold start), an inline HTML page stores the intended path in `sessionStorage` and redirects to `/`.
- `app.js` checks `sessionStorage.c2s_redirect` on load and restores the intended route.

### Database Initialization
- In **development** (`NODE_ENV !== 'production'`): `server.js` calls `initializeDatabase()` (runs `schema.sql`) and `seedDatabase()` (creates default admin) on startup.
- In **production**: Schema must be initialized manually in Supabase. The seed function runs as part of the serverless cold start but only creates admin if none exists.

---

## 9. CSS Architecture

4 CSS files loaded in order:
1. **`design-system.css`** — Custom properties (`:root` variables), CSS reset, base `html`/`body` styles. Font: Inter.
2. **`components.css`** — All UI components: `.btn`, `.card`, `.form-input`, `.table`, `.badge`, `.avatar`, `.modal`, `.stat-card`, `.empty-state`, `.skeleton` (loading shimmer).
3. **`layouts.css`** — `.app-layout`, `.sidebar`, `.main-content`, `.top-header`, `.login-layout`, grid system (`.grid`, `.grid-2`, `.grid-3`, `.grid-stats`, `.grid-dashboard`), responsive breakpoints.
4. **`animations.css`** — Keyframes: `@keyframes slideUp`, `fadeIn`, `scaleIn`, `shimmer`, `pulse`. Stagger classes: `.stagger-1` through `.stagger-6`. Page enter: `.page-enter`.

**Theme:** Premium dark glassmorphic. Background `#0a0e27`, cards with `rgba()` glass effect and subtle borders. Accent blue `#4f8fff`, accent purple `#7c5cff`. Status colors: green (success), orange (warning), red (error), cyan (info).

---

## 10. Known Gotchas & Important Rules

1. **PostgreSQL Type Casting:** Always use explicit `::date` cast when comparing string parameters to DATE columns in complex queries (e.g., `$1::date`). Simple `WHERE date = $1` usually works, but `LEFT JOIN` conditions and inequalities (`<=`, `>=`) may fail silently without it on Supabase.

2. **SQLite Legacy:** The `db.prepare()` method in `database/db.js` is a SQLite compatibility shim that auto-converts `?` placeholders to `$1`, `$2`, etc. Some old scripts like `seed_students.js` still use this old pattern. New code should always use `db.query()` with `$N` placeholders directly.

3. **No Frontend Framework:** Stick to the Vanilla JS render/init pattern. Never introduce React, Vue, or any framework. Each page has `renderXxx()` (returns HTML string) and `initXxx()` (binds events, loads data).

4. **Lucide Icons:** After any DOM innerHTML update, call `lucide.createIcons()` or `lucide.createIcons({ nodes: [container] })` to render `<i data-lucide="...">` tags.

5. **Service Worker Caching:** The SW uses network-first for assets. Cache version is `CACHE_NAME = 'c2s-pwa-v12'`. Bump this version on major changes. API requests (`/api/`) are never cached.

6. **Script Cache Busting:** All `<script>` tags in `index.html` have `?v=2.3` query params. Bump this on frontend changes to force browser refresh.

7. **`is_active` is INTEGER not BOOLEAN:** PostgreSQL stores it as `1`/`0`, not `true`/`false`. Always compare with `= 1`.

8. **JSON-as-Text Columns:** `skills`, `tools_used`, `attachments`, `specs`, `installed_software`, `screenshots` are stored as TEXT containing JSON strings. Always `JSON.parse()` on read and `JSON.stringify()` on write.

9. **Notification Cron Endpoints Are Unauthenticated:** The `/api/notifications/cron/*` routes are defined BEFORE `router.use(verifyToken)` in `notifications.routes.js`, so they run without auth. This is by design (Vercel cron calls them).

10. **Leave Approval Overwrites Attendance:** When a leave is approved, it force-sets `status = 'on_leave'` via `ON CONFLICT DO UPDATE`. This means if a student was marked `present` and their leave is retroactively approved, their attendance will change to `on_leave`.

11. **Login Accepts Email OR Name:** The login query matches on both `LOWER(email)` and `LOWER(name)`, so students can log in by typing their name instead of email.

---

## 11. Current Students in the System

| Name | Email | PCs Assigned |
|---|---|---|
| Anand | anand@student.c2s.edu | S.C.T/01-04 |
| Amit | amit@student.c2s.edu | S.C.T/05-07 |
| Sahil | sahil@student.c2s.edu | S.C.T/09-11 |
| Mohammad Sharique | sharique@student.c2s.edu | S.C.T/12-15 |
| Princi Sen | princi@student.c2s.edu | S.C.T/16-19 |
| Sujal Gupta | sujal@student.c2s.edu | S.C.T/20-22 |
| Aleena Qadeer | aleena@student.c2s.edu | S.C.T/23-25 |
| Anurag | anurag@student.c2s.edu | S.C.T/26-28 |

Admin: **Harshit Joshi** (`admin@c2s.edu`).

---

## 12. Complete API Endpoint Reference

### Auth (`/api/auth`)
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/login` | No | Login with email/name + password. Returns JWT + user. |
| GET | `/me` | Yes | Get current user profile. |
| POST | `/change-password` | Yes | Change password (requires old password). |

### Users (`/api/users`)
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/` | Yes | List users. `?role=student` filter. |
| GET | `/:id` | Yes | Get user with stats (project count, task count, attendance). |
| POST | `/` | Admin | Create new user. |
| PUT | `/:id` | Admin | Update user. |
| DELETE | `/:id` | Admin | Soft-delete (set `is_active = 0`). |
| POST | `/:id/reset-password` | Admin | Reset a user's password. |

### Attendance (`/api/attendance`)
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/check-in` | Yes | Student self check-in. Triggers auto-absent. |
| POST | `/check-out` | Yes | Student self check-out. |
| POST | `/` | Yes | Create/update attendance (admin: any user, student: self only). |
| PUT | `/:id` | Admin | Update attendance record. |
| DELETE | `/:id` | Yes | Unmark attendance (student: today only, admin: any). |
| GET | `/` | Yes | All records (admin: all, student: own). |
| GET | `/my` | Yes | Current student's attendance history. |
| GET | `/today` | Admin | Today's attendance with present/absent counts. |
| GET | `/date/:date` | Yes | Attendance for specific date. Admin gets all + absent list. |
| GET | `/report` | Admin | Monthly report with per-student percentage. `?month=MM&year=YYYY`. |

### Leave Requests (`/api/leave-requests`)
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/` | Yes | List (admin: all, student: own). |
| POST | `/` | Yes | Submit leave request. |
| PUT | `/:id` | Admin | Approve/reject. Auto-creates `on_leave` attendance on approval. |

### Daily Logs (`/api/daily-logs`)
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/` | Yes | List logs (admin: all with user names, student: own). |
| POST | `/` | Yes | Create daily log. |
| PUT | `/:id` | Yes | Update own log (admin: any). |
| DELETE | `/:id` | Yes | Delete own log (admin: any). |

### Projects (`/api/projects`)
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/` | Yes | List all projects with members. |
| GET | `/:id` | Yes | Single project with members. |
| POST | `/` | Admin | Create project. |
| PUT | `/:id` | Admin | Update project. |
| DELETE | `/:id` | Admin | Delete project. |
| POST | `/:id/members` | Admin | Add member to project. |
| DELETE | `/:id/members/:userId` | Admin | Remove member. |

### Tasks (`/api/tasks`)
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/` | Yes | List tasks with assignees. Student sees assigned tasks only. |
| GET | `/:id` | Yes | Single task with assignees. |
| POST | `/` | Admin | Create task with assignees. |
| PUT | `/:id` | Yes | Update task. Student can update their assignment status. |
| DELETE | `/:id` | Admin | Delete task. |

### PCs (`/api/pcs`)
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/` | Yes | List all PCs with current assignees. |
| GET | `/:id` | Yes | Single PC with assignment history. |
| POST | `/` | Admin | Create PC. |
| PUT | `/:id` | Admin | Update PC. |
| DELETE | `/:id` | Admin | Delete PC. |
| POST | `/:id/assign` | Admin | Assign PC to user. |
| PUT | `/:id/transfer` | Admin | Transfer PC to different user. |

### Tickets (`/api/tickets`)
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/` | Yes | List tickets (admin: all, student: own). |
| GET | `/:id` | Yes | Single ticket. |
| POST | `/` | Yes | Create ticket. Auto-generates ticket number. |
| PUT | `/:id` | Yes | Update ticket (admin: full, student: limited). |
| DELETE | `/:id` | Admin | Delete ticket. |

### Announcements (`/api/announcements`)
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/` | Yes | List announcements (pinned first). |
| POST | `/` | Admin | Create announcement. Notifies all students. |
| PUT | `/:id` | Admin | Update announcement. |
| DELETE | `/:id` | Admin | Delete announcement. |

### Notifications (`/api/notifications`)
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/` | Yes | Get user's last 50 notifications. |
| GET | `/unread-count` | Yes | Get unread notification count. |
| PUT | `/read-all` | Yes | Mark all as read. |
| PUT | `/:id/read` | Yes | Mark single notification as read. |
| DELETE | `/clear-all` | Yes | Delete all user's notifications. |
| GET | `/vapid-public-key` | Yes | Get VAPID public key for push subscription. |
| POST | `/subscribe` | Yes | Register push subscription endpoint. |
| DELETE | `/unsubscribe` | Yes | Remove push subscription. |
| GET | `/cron/daily-attendance` | **No** | Cron: remind students missing attendance. |
| GET | `/cron/attendance-summary` | **No** | Cron: end-of-day attendance summary. |

### GitHub Proxy (`/api/github`)
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/:username/repos` | Yes | Fetch GitHub repos for a user (proxied to avoid CORS). |

### Public (`/api/public`) — No Auth
| Method | Path | Description |
|---|---|---|
| GET | `/projects` | List all projects with members (for public display). |
| GET | `/projects/:id` | Single project detail. |

### Health
| Method | Path | Description |
|---|---|---|
| GET | `/api/health` | Returns `{ status: 'ok', timestamp }`. |

---

## 13. Instructions for Future AI Assistants

1. **Read this file FIRST** before making any changes.
2. **No frameworks.** Vanilla JS only. Follow the `renderXxx()` + `initXxx()` pattern.
3. **Always use `$N` placeholders** with `db.query()`. Never use `?` placeholders in new code.
4. **Cast dates explicitly** (`$1::date`) in complex SQL involving date comparisons.
5. **Call `lucide.createIcons()`** after any DOM manipulation.
6. **Bump script version** in `index.html` (e.g., `?v=2.4`) after frontend changes.
7. **Bump `CACHE_NAME`** in `sw.js` after significant frontend changes.
8. **Test SQL on Supabase** — PostgreSQL is stricter than SQLite about types, NULLs, and JOINs.
9. **Use `authorize('admin')`** middleware for admin-only routes.
10. **Never cache API responses** in the Service Worker.
11. **Keep `createNotification()`** usage for all user-facing actions (attendance, tasks, leaves, etc.).
12. **Maintain the dark theme** — use CSS variables from `design-system.css`, never hardcode colors.
