import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/c2s_vlsi',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function migrate() {
  try {
    // Add status column to task_assignments if it doesn't exist
    await pool.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'task_assignments' AND column_name = 'status'
        ) THEN
          ALTER TABLE task_assignments 
          ADD COLUMN status TEXT CHECK(status IN ('assigned', 'in_progress', 'under_review', 'completed')) DEFAULT 'assigned';
        END IF;
      END $$;
    `);
    console.log('✅ Migration: Added status column to task_assignments (if missing)');

    // Sync existing assignment statuses from the parent task
    const result = await pool.query(`
      UPDATE task_assignments ta
      SET status = t.status
      FROM tasks t
      WHERE ta.task_id = t.id
      AND (ta.status IS NULL OR ta.status = 'assigned')
      AND t.status != 'assigned'
    `);
    console.log(`✅ Synced ${result.rowCount} existing assignment statuses from tasks table`);

    console.log('✅ All migrations completed successfully!');
  } catch (err) {
    console.error('❌ Migration error:', err);
  } finally {
    await pool.end();
  }
}

migrate();
