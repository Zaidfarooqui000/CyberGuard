// Writes an entry to activity_logs. Logging failures never break a request.
const pool = require('../config/db');

async function logActivity(userId, activity) {
  try {
    await pool.query('INSERT INTO activity_logs (user_id, activity) VALUES (?, ?)', [
      userId || null,
      String(activity).slice(0, 255),
    ]);
  } catch (err) {
    console.error('Could not write activity log:', err.message);
  }
}

module.exports = { logActivity };
