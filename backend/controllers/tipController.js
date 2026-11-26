// Security tips (educational content). Public read, admin create/update/delete.
const pool = require('../config/db');
const { logActivity } = require('../utils/activityLogger');

// GET /api/tips
async function listTips(req, res) {
  const [rows] = await pool.query('SELECT id, title, description, created_at FROM security_tips ORDER BY created_at DESC, id DESC');
  res.json({ tips: rows });
}

// POST /api/admin/tips
async function createTip(req, res) {
  const { title, description } = req.body;
  const [result] = await pool.query('INSERT INTO security_tips (title, description) VALUES (?, ?)', [title, description]);
  await logActivity(req.user.id, `Created security tip #${result.insertId}`);
  res.status(201).json({ message: 'Tip created.', tip: { id: result.insertId, title, description, created_at: new Date() } });
}

// PUT /api/admin/tips/:id
async function updateTip(req, res) {
  const { title, description } = req.body;
  const [result] = await pool.query('UPDATE security_tips SET title = ?, description = ? WHERE id = ?', [
    title,
    description,
    req.params.id,
  ]);
  if (result.affectedRows === 0) return res.status(404).json({ message: 'Tip not found.' });
  await logActivity(req.user.id, `Updated security tip #${req.params.id}`);
  res.json({ message: 'Tip updated.' });
}

// DELETE /api/admin/tips/:id
async function deleteTip(req, res) {
  const [result] = await pool.query('DELETE FROM security_tips WHERE id = ?', [req.params.id]);
  if (result.affectedRows === 0) return res.status(404).json({ message: 'Tip not found.' });
  await logActivity(req.user.id, `Deleted security tip #${req.params.id}`);
  res.json({ message: 'Tip deleted.' });
}

module.exports = { listTips, createTip, updateTip, deleteTip };
