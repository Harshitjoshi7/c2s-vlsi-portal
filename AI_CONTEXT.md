# C2S VLSI Lab Management Portal - AI Context & Documentation

This document serves as the comprehensive "brain" of the C2S VLSI Lab Management Portal. It is written specifically so that any AI assistant injected into this repository can immediately understand the architecture, database schema, design patterns, and business logic of the system.

## 1. Project Overview
The C2S VLSI Lab Management Portal is a full-stack web application tailored for managing a VLSI (Very Large Scale Integration) academic or professional laboratory. It handles everything from student attendance and daily progress tracking to project management, hardware (PC) inventory, IT support ticketing, and lab-wide announcements.

### 1.1 Tech Stack
- **Frontend:** Vanilla HTML/CSS/JavaScript. It operates similarly to a Single Page Application (SPA), utilizing JavaScript modules (`public/js/pages/*.js`) to dynamically render UI components based on the route. It uses **Chart.js** for analytics and **Lucide Icons** for UI elements.
- **Backend:** Node.js with **Express.js** (using ES Modules).
- **Database:** **PostgreSQL** hosted on **Supabase**. Connections are managed via the standard `pg` pool library in `database/db.js`.
- **Authentication:** JWT (JSON Web Tokens) with `bcryptjs` for password hashing.
- **Notifications:** In-app notifications stored in the DB, augmented with real-time **Web Push Notifications** via a Service Worker (`public/sw.js`) and the `web-push` npm package.

---

## 2. System Architecture & Folder Structure

```text
c2s-vlsi-portal/
├── server.js                 # Entry point: Express server setup, middleware, route mounting
├── package.json              # Dependencies (express, pg, jsonwebtoken, web-push, bcryptjs)
├── database/
│   ├── db.js                 # PostgreSQL connection pool setup & global helper functions
│   └── schema.sql            # The single source of truth for the database schema
├── middleware/
│   ├── auth.js               # Verifies JWT tokens and attaches `req.user`
│   └── roleGuard.js          # Authorizes specific routes for 'admin' or 'student'
├── routes/                   # Express Routers, logically separated by domain:
│   ├── announcements.routes.js
│   ├── attendance.routes.js  # Complex attendance logic & auto-absent batch inserts
│   ├── auth.routes.js        # Login/Register endpoints
│   ├── dailyLogs.routes.js
│   ├── github.routes.js
│   ├── leaveRequests.routes.js
│   ├── notifications.routes.js
│   ├── pcs.routes.js         # PC Inventory & specs
│   ├── projects.routes.js    # VLSI Project Management
│   ├── tasks.routes.js
│   ├── tickets.routes.js     # IT/Hardware Support Tickets
│   └── users.routes.js
└── public/                   # Static files served by Express
    ├── index.html            # Main SPA container
    ├── sw.js                 # Service Worker for PWA/Push Notifications
    ├── css/                  # Custom CSS (variables, components, layouts)
    └── js/
        ├── app.js            # Core SPA router and initialization
        ├── api.js            # Fetch API wrapper for backend calls with JWT handling
        ├── components/       # Reusable UI parts (e.g., calendar.js)
        └── pages/            # View-specific render functions and logic
```

---

## 3. Database Schema Overview (PostgreSQL)

The system relies on a relational model. Below are the key tables and their relationships:

1. **`users`**: The core table. Includes `role` ('admin' or 'student'), `points` (gamification), `skills`, `github_username`, etc.
2. **`daily_logs`**: Students log their work daily. Unique constraint on `(user_id, log_date)`.
3. **`projects` & `project_members`**: Tracks VLSI projects. `type` includes 'ASIC', 'FPGA', 'Analog', 'Digital', 'Mixed-Signal'.
4. **`tasks` & `task_assignments`**: Tasks assigned by admins to students. Tracks priority and status ('assigned', 'in_progress', 'under_review', 'completed').
5. **`pcs` & `pc_assignments`**: Inventory management for Lab PCs. Tracks specifications, installed software, and who is currently assigned to a PC.
6. **`tickets`**: Support tickets raised by students (e.g., 'hardware', 'software', 'network' issues) for their assigned PCs.
7. **`attendance`**: Tracks daily presence. Unique constraint on `(user_id, attendance_date)`. Statuses: 'present', 'absent', 'late', 'on_leave'.
8. **`leave_requests`**: Students request leave; admins approve/reject. Affects the auto-attendance system.
9. **`announcements`**: Admin-created broadcasts.
10. **`notifications` & `push_subscriptions`**: Tracks unread notifications and Web Push API VAPID endpoints.

---

## 4. Key Business Logic & Behaviors

### 4.1 Automated Attendance System (CRITICAL)
Located in `routes/attendance.routes.js`.
- **Initialization:** When the first check-in or attendance modification occurs for a given date, the `initializeDayAttendance(date)` function runs.
- **Batch Processing:** It runs a Postgres `INSERT ... SELECT` query to find all active students. If a student has an `approved` or `pending` leave request covering that date, it inserts them as `on_leave`. Otherwise, it inserts them as `absent`.
- **Check-in Overwrite:** When a student subsequently clicks "Check In", their `absent` record is updated to `present`.
- **Postgres Date Casting:** Because Supabase/Postgres is strictly typed, date parameters (e.g., `$1`) must be explicitly cast to date (e.g., `$1::date`) when comparing against `start_date` and `end_date` in the leave requests `LEFT JOIN`.

### 4.2 Frontend SPA Router
- The application does not use React or Vue. Instead, `public/js/app.js` listens to URL hash changes (`#dashboard`, `#attendance`).
- It dynamically replaces the contents of the `#app-content` div by calling functions like `renderDashboard()` and then `initDashboard()` from the `public/js/pages/*.js` files.

### 4.3 Reports & Analytics
- Found in `public/js/pages/reports.js` and `routes/attendance.routes.js`.
- Calculates Attendance Rate: `(Present + Late) / (Total Working Days)`.
- Total Working Days is calculated by subtracting `on_leave` days from the total amount of tracked days in the system.
- Excel Export is supported on the frontend using `XLSX` (SheetJS).

### 4.4 Gamification
- Students are awarded `points` for completing actions (e.g., checking in gives +5 points).
- If attendance is unmarked or deleted, those points are deducted.

### 4.5 API Wrapper
- `public/js/api.js` automatically attaches the `Authorization: Bearer <token>` header to all requests.
- Intercepts `401 Unauthorized` responses to clear local storage and redirect the user back to the login screen.

---

## 5. Instructions for Future AI Assistants
When asked to modify this codebase, adhere strictly to the following rules:

1. **Do not use heavy frontend frameworks:** Stick to Vanilla JS, ES6 Modules, and the established render/init pattern in the `pages` directory.
2. **PostgreSQL Compatibility:** Always write standard ANSI SQL. Remember that dynamic string parameters representing dates often need explicit casting (e.g., `CAST($1 AS DATE)` or `$1::date`) when doing inequality comparisons.
3. **Responsive Design:** Keep adding to the existing CSS Custom Properties (variables) for theme consistency. Avoid writing ad-hoc colors or inline styles unless absolutely necessary.
4. **Security Context:** Ensure you always protect sensitive backend routes with `authorize('admin')` middleware from `roleGuard.js`.
5. **No Placeholders:** If generating HTML, include the appropriate Lucide icons (`<i data-lucide="..."></i>`) and run `lucide.createIcons()` in the initialization phase.
