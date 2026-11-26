// Admin-only features: statistics, user management, all scans, activity logs.
const pool = require('../config/db');
const { logActivity } = require('../utils/activityLogger');
const { levelCounts, dailyActivity } = require('./scanController');

// GET /api/admin/stats
async function getStats(req, res) {
  const [url, email, daily] = await Promise.all([
    levelCounts('url_scans'),
    levelCounts('email_scans'),
    dailyActivity(14),
  ]);
  const [[users]] = await pool.query(
    `SELECT COUNT(*) AS total,
            SUM(role = 'admin') AS admins,
            SUM(created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)) AS newThisWeek
     FROM users`
  );
  const [[logs]] = await pool.query(
    'SELECT COUNT(*) AS today FROM activity_logs WHERE created_at >= CURDATE()'
  );
  const [topUsers] = await pool.query(
    `SELECT u.id, u.name,
            (SELECT COUNT(*) FROM url_scans s WHERE s.user_id = u.id) +
            (SELECT COUNT(*) FROM email_scans e WHERE e.user_id = u.id) AS scans
     FROM users u ORDER BY scans DESC LIMIT 5`
  );

  res.json({
    users: { total: Number(users.total), admins: Number(users.admins || 0), newThisWeek: Number(users.newThisWeek || 0) },
    url,
    email,
    totalScans: url.total + email.total,
    threats: url.SUSPICIOUS + url['HIGH RISK'] + email.SUSPICIOUS + email['HIGH RISK'],
    activityToday: Number(logs.today),
    daily,
    topUsers: topUsers.map((u) => ({ ...u, scans: Number(u.scans) })),
  });
}

// GET /api/admin/users
async function listUsers(req, res) {
  const [rows] = await pool.query(
    `SELECT u.id, u.name, u.email, u.role, u.created_at,
            (SELECT COUNT(*) FROM url_scans s WHERE s.user_id = u.id) AS url_scans,
            (SELECT COUNT(*) FROM email_scans e WHERE e.user_id = u.id) AS email_scans
     FROM users u ORDER BY u.created_at DESC`
  );
  res.json({ users: rows.map((r) => ({ ...r, url_scans: Number(r.url_scans), email_scans: Number(r.email_scans) })) });
}

// PUT /api/admin/users/:id/role
async function updateUserRole(req, res) {
  const { id } = req.params;
  const { role } = req.body;
  if (id === req.user.id) {
    return res.status(400).json({ message: 'You cannot change your own role.' });
  }
  const [result] = await pool.query('UPDATE users SET role = ? WHERE id = ?', [role, id]);
  if (result.affectedRows === 0) return res.status(404).json({ message: 'User not found.' });
  await logActivity(req.user.id, `Changed role of user #${id} to ${role}`);
  res.json({ message: `User role updated to ${role}.` });
}

// DELETE /api/admin/users/:id   (their scans are removed by ON DELETE CASCADE)
async function deleteUser(req, res) {
  const { id } = req.params;
  if (id === req.user.id) {
    return res.status(400).json({ message: 'You cannot delete your own account.' });
  }
  const [rows] = await pool.query('SELECT email FROM users WHERE id = ?', [id]);
  if (rows.length === 0) return res.status(404).json({ message: 'User not found.' });
  await pool.query('DELETE FROM users WHERE id = ?', [id]);
  await logActivity(req.user.id, `Deleted user #${id} (${rows[0].email})`);
  res.json({ message: 'User deleted.' });
}

// GET /api/admin/scans?type=url|email&level=...
async function listScans(req, res) {
  const type = req.query.type === 'email' ? 'email' : 'url';
  const level = ['SAFE', 'SUSPICIOUS', 'HIGH RISK'].includes(req.query.level) ? req.query.level : null;
  const table = type === 'url' ? 'url_scans' : 'email_scans';
  const target = type === 'url' ? 's.submitted_url' : "JSON_UNQUOTE(JSON_EXTRACT(s.scan_details, '$.meta.excerpt'))";
  const [rows] = await pool.query(
    `SELECT s.id, ${target} AS target, s.risk_score, s.risk_level, s.scanned_at, u.name AS user_name, u.email AS user_email
     FROM ${table} s JOIN users u ON u.id = s.user_id
     ${level ? 'WHERE s.risk_level = ?' : ''}
     ORDER BY s.scanned_at DESC LIMIT 300`,
    level ? [level] : []
  );
  res.json({ type, scans: rows });
}

// GET /api/admin/logs?search=
async function listLogs(req, res) {
  const search = typeof req.query.search === 'string' ? req.query.search.trim().slice(0, 100) : '';
  const params = [];
  let where = '';
  if (search) {
    where = 'WHERE l.activity LIKE ? OR u.name LIKE ? OR u.email LIKE ?';
    const like = `%${search}%`;
    params.push(like, like, like);
  }
  const [rows] = await pool.query(
    `SELECT l.id, l.activity, l.created_at, l.user_id, u.name AS user_name, u.email AS user_email
     FROM activity_logs l LEFT JOIN users u ON u.id = l.user_id
     ${where}
     ORDER BY l.created_at DESC, l.id DESC LIMIT 300`,
    params
  );
  res.json({ logs: rows });
}

module.exports = { getStats, listUsers, updateUserRole, deleteUser, listScans, listLogs };
