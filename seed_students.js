import db from './database/db.js';
import bcrypt from 'bcryptjs';

const data = [
  { name: 'Anand', pcs: ['SISTEC/EC/COE/S. C. T/01', 'SISTEC/EC/COE/S. C. T/02', 'SISTEC/EC/COE/S. C. T/03', 'SISTEC/EC/COE/S. C. T/04'] },
  { name: 'Amit', pcs: ['SISTEC/EC/COE/S. C. T/05', 'SISTEC/EC/COE/S. C. T/06', 'SISTEC/EC/COE/S. C. T/07'] },
  { name: 'Sahil', pcs: ['SISTEC/EC/COE/S. C. T/09', 'SISTEC/EC/COE/S. C. T/10', 'SISTEC/EC/COE/S. C. T/11'] },
  { name: 'Mohammad Sharique', pcs: ['SISTEC/EC/COE/S. C. T/12', 'SISTEC/EC/COE/S. C. T/13', 'SISTEC/EC/COE/S. C. T/14', 'SISTEC/EC/COE/S. C. T/15'] },
  { name: 'Princi Sen', pcs: ['SISTEC/EC/COE/S. C. T/16', 'SISTEC/EC/COE/S. C. T/17', 'SISTEC/EC/COE/S. C. T/18', 'SISTEC/EC/COE/S. C. T/19'] },
  { name: 'Sujal Gupta', pcs: ['SISTEC/EC/COE/S. C. T/20', 'SISTEC/EC/COE/S. C. T/21', 'SISTEC/EC/COE/S. C. T/22'] },
  { name: 'Aleena Qadeer', pcs: ['SISTEC/EC/COE/S. C. T/23', 'SISTEC/EC/COE/S. C. T/24', 'SISTEC/EC/COE/S. C. T/25'] },
  { name: 'Anurag', pcs: ['SISTEC/EC/COE/S. C. T/26', 'SISTEC/EC/COE/S. C. T/27', 'SISTEC/EC/COE/S. C. T/28'] }
];

async function seed() {
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('password123', salt);

  for (const student of data) {
    const email = student.name.toLowerCase().replace(/ /g, '.') + '@c2s.edu';
    
    let userId;
    const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existingUser) {
        userId = existingUser.id;
    } else {
        const stmt = db.prepare(`INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)`);
        const result = stmt.run(student.name, email, passwordHash, 'student');
        userId = result.lastInsertRowid;
    }

    for (const pcName of student.pcs) {
      let pcId;
      const existingPc = db.prepare('SELECT id FROM pcs WHERE pc_name = ?').get(pcName);
      if (existingPc) {
        pcId = existingPc.id;
      } else {
        const pcStmt = db.prepare(`INSERT INTO pcs (pc_name, condition) VALUES (?, ?)`);
        const pcResult = pcStmt.run(pcName, 'good');
        pcId = pcResult.lastInsertRowid;
      }

      const existingAssignment = db.prepare('SELECT id FROM pc_assignments WHERE pc_id = ? AND user_id = ?').get(pcId, userId);
      if (!existingAssignment) {
        db.prepare('INSERT INTO pc_assignments (pc_id, user_id, status) VALUES (?, ?, ?)').run(pcId, userId, 'active');
      }
    }
  }
  console.log('Students and PCs seeded successfully.');
}

seed().catch(console.error);
