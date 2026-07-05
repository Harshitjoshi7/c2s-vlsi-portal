import jwt from 'jsonwebtoken';
import db from '../database/db.js';

export async function verifyToken(req, res, next) {
  try {
    let token = null;

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }

    if (!token && req.cookies) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({ success: false, error: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userRes = await db.query('SELECT id, name, email, role, is_active FROM users WHERE id = $1', [decoded.id]);
    const user = userRes.rows[0];

    if (!user || !user.is_active) {
      return res.status(401).json({ success: false, error: 'Invalid token or user deactivated.' });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, error: 'Token expired.' });
    }
    return res.status(401).json({ success: false, error: 'Invalid token.' });
  }
}
