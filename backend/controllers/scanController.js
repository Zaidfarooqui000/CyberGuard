// URL & email scanning, scan history, and the user's dashboard statistics.
const pool = require('../config/db');
const { analyzeUrl } = require('../detection/urlAnalyzer');
const { analyzeEmail } = require('../detection/emailAnalyzer');
const { logActivity } = require('../utils/activityLogger');

// MySQL returns JSON columns as objects; MariaDB (XAMPP) returns strings.
const parseJson = (value) => {
  if (value && typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
};

// POST /api/scans/url
async function scanUrl(req, res) {
  let result;
  try {
    result = analyzeUrl(req.body.url);
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }

  const details = {
    normalizedUrl: result.normalizedUrl,
    domain: result.domain,
    registeredDomain: result.registeredDomain,
    summary: result.summary,
    indicators: result.indicators,
    checks: result.checks,
    recommendations: result.recommendations,
    disclaimer: result.disclaimer,
    method: result.method,
  };

  const [insert] = await pool.query(
    'INSERT INTO url_scans (user_id, submitted_url, risk_score, risk_level, scan_details) VALUES (?, ?, ?, ?, ?)',
    [req.user.id, result.submittedUrl, result.riskScore, result.riskLevel, JSON.stringify(details)]
  );
  await logActivity(req.user.id, `URL scan #${insert.insertId}: ${result.riskLevel} (${result.domain})`);

  res.status(201).json({ id: insert.insertId, scannedAt: new Date(), ...result });
}

// POST /api/scans/email
async function scanEmail(req, res) {
  let result;
  try {
    result = analyzeEmail(req.body);
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }

  // Only indicators + redacted metadata are stored. The full email is NOT saved.
  const details = {
    summary: result.summary,
    indicators: result.indicators,
    checks: result.checks,
    links: result.links,
    recommendations: result.recommendations,
    disclaimer: result.disclaimer,
    method: result.method,
    meta: result.meta,
  };

  const [insert] = await pool.query(
    'INSERT INTO email_scans (user_id, risk_score, risk_level, scan_details) VALUES (?, ?, ?, ?)',
    [req.user.id, result.riskScore, result.riskLevel, JSON.stringify(details)]
  );
  await logActivity(req.user.id, `Email scan #${insert.insertId}: ${result.riskLevel}`);

  res.status(201).json({ id: insert.insertId, scannedAt: new Date(), ...result });
}

// GET /api/history?type=all|url|email&level=SAFE|SUSPICIOUS|HIGH RISK
async function getHistory(req, res) {
  const type = ['url', 'email'].includes(req.query.type) ? req.query.type : 'all';
  const level = ['SAFE', 'SUSPICIOUS', 'HIGH RISK'].includes(req.query.level) ? req.query.level : null;
  const userId = req.user.id;

  const items = [];
  if (type !== 'email') {
    const [urls] = await pool.query(
      `SELECT id, submitted_url, risk_score, risk_level, scanned_at FROM url_scans
       WHERE user_id = ? ${level ? 'AND risk_level = ?' : ''} ORDER BY scanned_at DESC LIMIT 500`,
      level ? [userId, level] : [userId]
    );
    urls.forEach((r) =>
      items.push({ type: 'url', id: r.id, target: r.submitted_url, risk_score: r.risk_score, risk_level: r.risk_level, scanned_at: r.scanned_at })
    );
  }
  if (type !== 'url') {
    const [emails] = await pool.query(
      `SELECT id, risk_score, risk_level, scan_details, scanned_at FROM email_scans
       WHERE user_id = ? ${level ? 'AND risk_level = ?' : ''} ORDER BY scanned_at DESC LIMIT 500`,
      level ? [userId, level] : [userId]
    );
    emails.forEach((r) => {
      const d = parseJson(r.scan_details);
      items.push({
        type: 'email',
        id: r.id,
        target: (d.meta && d.meta.excerpt) || 'Email content (not stored)',
        risk_score: r.risk_score,
        risk_level: r.risk_level,
        scanned_at: r.scanned_at,
      });
    });
  }
  items.sort((a, b) => new Date(b.scanned_at) - new Date(a.scanned_at));
  res.json({ items });
}

// GET /api/history/:type/:id
async function getScan(req, res) {
  const { type, id } = req.params;
  const table = type === 'url' ? 'url_scans' : 'email_scans';
  // Admins may open any scan; users only their own.
  const ownerClause = req.user.role === 'admin' ? '' : 'AND s.user_id = ?';
  const params = req.user.role === 'admin' ? [id] : [id, req.user.id];
  const [rows] = await pool.query(
    `SELECT s.*, u.name AS user_name FROM ${table} s JOIN users u ON u.id = s.user_id WHERE s.id = ? ${ownerClause}`,
    params
  );
  if (rows.length === 0) return res.status(404).json({ message: 'Scan not found.' });

  const row = rows[0];
  const details = parseJson(row.scan_details);
  res.json({
    id: row.id,
    type,
    userName: row.user_name,
    submittedUrl: row.submitted_url || null,
    riskScore: row.risk_score,
    riskLevel: row.risk_level,
    scannedAt: row.scanned_at,
    ...details,
  });
}

// DELETE /api/history/:type/:id
async function deleteScan(req, res) {
  const { type, id } = req.params;
  const table = type === 'url' ? 'url_scans' : 'email_scans';
  const [result] = await pool.query(`DELETE FROM ${table} WHERE id = ? AND user_id = ?`, [id, req.user.id]);
  if (result.affectedRows === 0) return res.status(404).json({ message: 'Scan not found.' });
  await logActivity(req.user.id, `Deleted ${type} scan #${id}`);
  res.json({ message: 'Scan deleted.' });
}

// DELETE /api/history?type=all|url|email
async function clearHistory(req, res) {
  const type = ['url', 'email'].includes(req.query.type) ? req.query.type : 'all';
  let removed = 0;
  if (type !== 'email') {
    const [r] = await pool.query('DELETE FROM url_scans WHERE user_id = ?', [req.user.id]);
    removed += r.affectedRows;
  }
  if (type !== 'url') {
    const [r] = await pool.query('DELETE FROM email_scans WHERE user_id = ?', [req.user.id]);
    removed += r.affectedRows;
  }
  await logActivity(req.user.id, `Cleared scan history (${type}, ${removed} records)`);
  res.json({ message: `Deleted ${removed} scan(s).`, removed });
}

// Counts per risk level for one table, optionally for one user.
async function levelCounts(table, userId) {
  const [rows] = await pool.query(
    `SELECT risk_level, COUNT(*) AS total FROM ${table} ${userId ? 'WHERE user_id = ?' : ''} GROUP BY risk_level`,
    userId ? [userId] : []
  );
  const counts = { SAFE: 0, SUSPICIOUS: 0, 'HIGH RISK': 0, total: 0 };
  rows.forEach((r) => {
    counts[r.risk_level] = Number(r.total);
    counts.total += Number(r.total);
  });
  return counts;
}

// Scans per day for the last N days (both tables), optionally for one user.
async function dailyActivity(days, userId) {
  const where = `WHERE scanned_at >= DATE_SUB(CURDATE(), INTERVAL ${Number(days) - 1} DAY) ${userId ? 'AND user_id = ?' : ''}`;
  const params = userId ? [userId] : [];
  const [urlRows] = await pool.query(
    `SELECT DATE_FORMAT(scanned_at, '%Y-%m-%d') AS day, COUNT(*) AS total FROM url_scans ${where} GROUP BY day`, params);
  const [emailRows] = await pool.query(
    `SELECT DATE_FORMAT(scanned_at, '%Y-%m-%d') AS day, COUNT(*) AS total FROM email_scans ${where} GROUP BY day`, params);

  const result = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    result.push({
      day: key,
      url: Number((urlRows.find((r) => r.day === key) || {}).total || 0),
      email: Number((emailRows.find((r) => r.day === key) || {}).total || 0),
    });
  }
  return result;
}

// GET /api/dashboard
async function getDashboard(req, res) {
  const userId = req.user.id;
  const [url, email, daily] = await Promise.all([
    levelCounts('url_scans', userId),
    levelCounts('email_scans', userId),
    dailyActivity(7, userId),
  ]);
  const [recentUrl] = await pool.query(
    'SELECT id, submitted_url AS target, risk_score, risk_level, scanned_at FROM url_scans WHERE user_id = ? ORDER BY scanned_at DESC LIMIT 5',
    [userId]
  );
  const [recentEmail] = await pool.query(
    'SELECT id, scan_details, risk_score, risk_level, scanned_at FROM email_scans WHERE user_id = ? ORDER BY scanned_at DESC LIMIT 5',
    [userId]
  );
  const recent = [
    ...recentUrl.map((r) => ({ type: 'url', ...r })),
    ...recentEmail.map((r) => ({
      type: 'email',
      id: r.id,
      target: (parseJson(r.scan_details).meta || {}).excerpt || 'Email content',
      risk_score: r.risk_score,
      risk_level: r.risk_level,
      scanned_at: r.scanned_at,
    })),
  ]
    .sort((a, b) => new Date(b.scanned_at) - new Date(a.scanned_at))
    .slice(0, 6);

  res.json({ url, email, totalScans: url.total + email.total, daily, recent });
}

module.exports = {
  scanUrl,
  scanEmail,
  getHistory,
  getScan,
  deleteScan,
  clearHistory,
  getDashboard,
  levelCounts,
  dailyActivity,
};
