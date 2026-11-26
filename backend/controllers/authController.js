// Registration, login, logout, current user, and profile management.
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const { logActivity } = require('../utils/activityLogger');

const SALT_ROUNDS = 12;
// Used to keep login timing the same whether or not the email exists.
const DUMMY_HASH = bcrypt.hashSync('timing-attack-protection', SALT_ROUNDS);

function createToken(user) {
  return jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
  });
}

const publicUser = (u) => ({ id: u.id, name: u.name, email: u.email, role: u.role, created_at: u.created_at });

// POST /api/auth/register
async function register(req, res) {
  const { name, email, password } = req.body;

  const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
  if (existing.length > 0) {
    return res.status(409).json({ message: 'An account with this email already exists.' });
  }

  const hash = await bcrypt.hash(password, SALT_ROUNDS);
  // New accounts are always normal users – admins are promoted by another admin.
  const [result] = await pool.query('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)', [
    name,
    email,
    hash,
    'user',
  ]);

  const user = { id: result.insertId, name, email, role: 'user', created_at: new Date() };
  await logActivity(user.id, 'Registered a new account');
  res.status(201).json({ message: 'Account created successfully.', token: createToken(user), user: publicUser(user) });
}

// POST /api/auth/login
async function login(req, res) {
  const { email, password } = req.body;
  const [rows] = await pool.query('SELECT id, name, email, password, role, created_at FROM users WHERE email = ?', [email]);
  const user = rows[0];

  const passwordOk = await bcrypt.compare(password, user ? user.password : DUMMY_HASH);
  if (!user || !passwordOk) {
    await logActivity(user ? user.id : null, `Failed login attempt for ${email.slice(0, 100)}`);
    // Same message for both cases so attackers can't discover registered emails.
    return res.status(401).json({ message: 'Invalid email or password.' });
  }

  await logActivity(user.id, 'Logged in');
  res.json({ message: 'Login successful.', token: createToken(user), user: publicUser(user) });
}

// POST /api/auth/logout  (JWT is stateless – the browser deletes the token)
async function logout(req, res) {
  await logActivity(req.user.id, 'Logged out');
  res.json({ message: 'Logged out successfully.' });
}

// GET /api/auth/me
async function me(req, res) {
  const [rows] = await pool.query('SELECT id, name, email, role, created_at FROM users WHERE id = ?', [req.user.id]);
  res.json({ user: publicUser(rows[0]) });
}

// PUT /api/auth/profile
async function updateProfile(req, res) {
  const { name, email } = req.body;
  const [taken] = await pool.query('SELECT id FROM users WHERE email = ? AND id <> ?', [email, req.user.id]);
  if (taken.length > 0) {
    return res.status(409).json({ message: 'This email is already used by another account.' });
  }
  await pool.query('UPDATE users SET name = ?, email = ? WHERE id = ?', [name, email, req.user.id]);
  await logActivity(req.user.id, 'Updated profile');
  const [rows] = await pool.query('SELECT id, name, email, role, created_at FROM users WHERE id = ?', [req.user.id]);
  res.json({ message: 'Profile updated.', user: publicUser(rows[0]) });
}

// PUT /api/auth/password
async function changePassword(req, res) {
  const { currentPassword, newPassword } = req.body;
  const [rows] = await pool.query('SELECT password FROM users WHERE id = ?', [req.user.id]);
  const ok = await bcrypt.compare(currentPassword, rows[0].password);
  if (!ok) {
    return res.status(400).json({ message: 'Current password is incorrect.' });
  }
  const hash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await pool.query('UPDATE users SET password = ? WHERE id = ?', [hash, req.user.id]);
  await logActivity(req.user.id, 'Changed password');
  res.json({ message: 'Password changed successfully.' });
}

module.exports = { register, login, logout, me, updateProfile, changePassword };
