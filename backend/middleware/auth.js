// Authentication & authorization middleware.
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

// Verifies the "Authorization: Bearer <token>" header and loads the user.
async function authenticate(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ message: 'Please log in to continue.' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    // Re-check the database so deleted users or changed roles take effect immediately.
    const [rows] = await pool.query('SELECT id, name, email, role FROM users WHERE id = ?', [payload.id]);
    if (rows.length === 0) {
      return res.status(401).json({ message: 'Account no longer exists.' });
    }
    req.user = rows[0];
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError' || err.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Session expired. Please log in again.' });
    }
    next(err);
  }
}

// Only allows users with the admin role. Use after authenticate.
function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required.' });
  }
  next();
}

module.exports = { authenticate, requireAdmin };
