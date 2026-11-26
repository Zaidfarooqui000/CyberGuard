// Rate limiting – protects against brute-force login attempts and API abuse.
const rateLimit = require('express-rate-limit');

const message = (text) => ({ message: text });

// Applies to every /api request
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 500,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: message('Too many requests. Please try again later.'),
});

// Login / register: much stricter
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: message('Too many login attempts. Please wait 15 minutes and try again.'),
});

// Scans: limit per minute
const scanLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: message('Scan limit reached (20 per minute). Please slow down.'),
});

module.exports = { apiLimiter, authLimiter, scanLimiter };
