import db from './database/db.js';

db.query(`
CREATE TABLE IF NOT EXISTS pc_usage_logs ( 
  id SERIAL PRIMARY KEY, 
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, 
  pc_id INTEGER NOT NULL REFERENCES pcs(id) ON DELETE CASCADE, 
  usage_date DATE NOT NULL, 
  status TEXT CHECK(status IN ('on', 'off')) DEFAULT 'off', 
  tool_used TEXT, 
  turned_on_at TIMESTAMP, 
  turned_off_at TIMESTAMP, 
  UNIQUE(user_id, pc_id, usage_date) 
);
`).then(() => {
  console.log('Migrated Supabase'); 
  process.exit(0);
}).catch(console.error);
