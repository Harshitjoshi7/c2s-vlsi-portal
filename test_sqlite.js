import { DatabaseSync } from 'node:sqlite';
const db = new DatabaseSync(':memory:');
db.exec('CREATE TABLE test (id INTEGER PRIMARY KEY, name TEXT, val TEXT)');
const stmt = db.prepare('INSERT INTO test (name, val) VALUES (?, ?)');
stmt.run('hello', 'world');
stmt.run('foo', 'bar');
stmt.run('baz', 'qux');

// Test spread params with all()
const params = ['hello', 'world'];
try {
  const r1 = db.prepare('SELECT * FROM test WHERE name = ? OR val = ?').all(...params);
  console.log('Spread all:', r1);
} catch(e) {
  console.log('Spread all error:', e.message);
}

// Test with array
try {
  const r2 = db.prepare('SELECT * FROM test WHERE name = ? OR val = ?').all(params);
  console.log('Array all:', r2);
} catch(e) {
  console.log('Array all error:', e.message);
}

// Test no params
const r3 = db.prepare('SELECT * FROM test').all();
console.log('No params all count:', r3.length);

// Test lastInsertRowid on .run()
const r4 = db.prepare('INSERT INTO test (name, val) VALUES (?, ?)').run('x', 'y');
console.log('lastInsertRowid:', r4.lastInsertRowid);

// Test a single param in all()
const r5 = db.prepare('SELECT * FROM test WHERE name = ?').all('hello');
console.log('Single param all:', r5);

db.close();
