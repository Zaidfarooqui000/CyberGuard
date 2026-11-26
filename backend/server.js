// =============================================================
// CyberGuard API server – entry point
// Start with:  npm run dev   (auto-restart)  or  npm start
// =============================================================
require('dotenv').config({ quiet: true });
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const pool = require('./config/db');
const { apiLimiter } = require('./middleware/rateLimiter');
const { notFound, errorHandler } = require('./middleware/errorHandler');

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  console.error('JWT_SECRET is missing or too short. Copy .env.example to .env and set a long random secret.');
  process.exit(1);
}

const app = express();

// Security headers (XSS protection, no sniffing, etc.)
app.use(helmet());
// Only our frontend may call the API from a browser.
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:3000' }));
// Limit body size so huge payloads can't overload the server.
app.use(express.json({ limit: '100kb' }));
app.use('/api', apiLimiter);

app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', database: 'connected' });
  } catch {
    res.status(503).json({ status: 'error', database: 'disconnected' });
  }
});

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/tips', require('./routes/tipRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api', require('./routes/scanRoutes'));

app.use(notFound);
app.use(errorHandler);

const PORT = Number(process.env.PORT) || 5000;
app.listen(PORT, async () => {
  console.log(`CyberGuard API running at http://localhost:${PORT}`);
  try {
    await pool.query('SELECT 1');
    console.log('Connected to MySQL database:', process.env.DB_NAME);
  } catch (err) {
    console.error('Could not connect to MySQL:', err.code || err.message);
    console.error('Start MySQL in XAMPP and run "npm run db:setup" to create the database.');
  }
});
