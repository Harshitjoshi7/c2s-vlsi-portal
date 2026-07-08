const pg = require('pg');
const pool = new pg.Pool();
pool.query(`
      INSERT INTO attendance (user_id, attendance_date, status)
      SELECT 1, g::date, 'on_leave'
      FROM leave_requests l
      CROSS JOIN LATERAL generate_series(l.start_date::date, l.end_date::date, '1 day'::interval) AS g
      WHERE l.status IN ('approved', 'pending')
      ON CONFLICT (user_id, attendance_date) 
      DO UPDATE SET status = 'on_leave' WHERE attendance.status = 'absent'
`).catch(console.error);
