import pg from 'pg';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const { Pool } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// In production, process.env.DATABASE_URL will be provided by Supabase/Vercel
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/c2s_vlsi',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// A wrapper to mimic the interface we need, but async
const db = {
  query: (text, params) => pool.query(text, params),
  
  prepare: (queryStr) => {
    // Replace SQLite ? with Postgres $1, $2, etc.
    let pgQuery = queryStr;
    let i = 1;
    while (pgQuery.includes('?')) {
      pgQuery = pgQuery.replace('?', `$${i}`);
      i++;
    }

    const getArgs = (args) => args.length === 1 && Array.isArray(args[0]) ? args[0] : args;

    return {
      get: async (...args) => {
        const res = await pool.query(pgQuery, getArgs(args));
        return res.rows[0];
      },
      all: async (...args) => {
        const res = await pool.query(pgQuery, getArgs(args));
        return res.rows;
      },
      run: async (...args) => {
        let finalQuery = pgQuery;
        if (finalQuery.trim().toUpperCase().startsWith('INSERT') && !finalQuery.toUpperCase().includes('RETURNING')) {
          finalQuery += ' RETURNING id';
        }
        const res = await pool.query(finalQuery, getArgs(args));
        return { changes: res.rowCount, lastInsertRowid: res.rows[0]?.id || 0 };
      }
    }
  },
  
  // Transaction helper
  withTransaction: async (fn) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const result = await fn(client);
      await client.query('COMMIT');
      return result;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
};

export async function initializeDatabase() {
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf-8');
  await db.query(schema);
  console.log('PostgreSQL database initialized/verified successfully.');
}

export async function seedDatabase() {
  const adminRes = await db.query('SELECT id FROM users WHERE role = $1', ['admin']);
  
  if (adminRes.rows.length === 0) {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('admin123', salt);

    await db.query(`
      INSERT INTO users (name, email, password_hash, role)
      VALUES ($1, $2, $3, $4)
    `, ['Admin', 'admin@c2s.edu', passwordHash, 'admin']);

    console.log('Default admin user created (admin@c2s.edu / admin123).');
  }
}

export async function createNotification(userId, type, title, message, link = null) {
  return db.query(`
    INSERT INTO notifications (user_id, type, title, message, link)
    VALUES ($1, $2, $3, $4, $5)
  `, [userId, type, title, message, link]);
}

export default db;
