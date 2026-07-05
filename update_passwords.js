import db from './database/db.js';
import bcrypt from 'bcryptjs';

async function updatePasswords() {
  const students = db.prepare('SELECT id, name FROM users WHERE role = ?').all('student');
  
  for (const student of students) {
    const newPassword = student.name + '_123';
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(newPassword, salt);
    
    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hash, student.id);
    console.log(`Updated ${student.name}'s password to: ${newPassword}`);
  }
}

updatePasswords().catch(console.error);
