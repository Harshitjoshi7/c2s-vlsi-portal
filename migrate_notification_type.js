import dotenv from 'dotenv';
dotenv.config();

import db from './database/db.js';

async function migrate() {
  try {
    console.log('Migrating notification type check constraint...');

    // Drop the constraint if it exists (assuming it is named notifications_type_check)
    try {
      await db.query(`ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check`);
      console.log('Dropped old constraint (if existed).');
    } catch (e) {
      console.log('Could not drop constraint (might have a different name):', e.message);
    }

    // Attempt to drop any constraints on the 'type' column that might have a dynamic name
    try {
        const constraintsRes = await db.query(`
          SELECT conname 
          FROM pg_constraint 
          WHERE conrelid = 'notifications'::regclass AND contype = 'c';
        `);
        for (const row of constraintsRes.rows) {
            await db.query(`ALTER TABLE notifications DROP CONSTRAINT IF EXISTS ${row.conname}`);
            console.log(`Dropped constraint: ${row.conname}`);
        }
    } catch (e) {
        console.log('Could not query/drop dynamic constraints:', e.message);
    }

    // Add the new check constraint
    await db.query(`
      ALTER TABLE notifications 
      ADD CONSTRAINT notifications_type_check 
      CHECK(type IN ('task', 'ticket', 'announcement', 'leave', 'deadline', 'attendance'))
    `);
    
    console.log('Added new constraint allowing "attendance" type.');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    process.exit();
  }
}

migrate();
