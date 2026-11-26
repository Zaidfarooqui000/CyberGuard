// Input validation rules (express-validator) and a helper that returns errors.
const { body, param, validationResult } = require('express-validator');

// Sends 400 with the first error message if any rule failed.
function handleValidation(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const list = errors.array();
    return res.status(400).json({ message: list[0].msg, errors: list.map((e) => ({ field: e.path, message: e.msg })) });
  }
  next();
}

// Removes HTML tags and angle brackets from plain-text fields (extra XSS protection;
// React also escapes everything it renders).
const stripTags = (value) => String(value ?? '').replace(/<[^>]*>/g, '').replace(/[<>]/g, '').trim();

const nameRule = body('name')
  .customSanitizer(stripTags)
  .isLength({ min: 2, max: 100 }).withMessage('Name must be 2–100 characters.')
  .matches(/^[\p{L} .'-]+$/u).withMessage('Name can only contain letters, spaces, dots, apostrophes and hyphens.');

const emailRule = body('email')
  .trim()
  .isEmail().withMessage('Please enter a valid email address.')
  .isLength({ max: 255 })
  .normalizeEmail({ gmail_remove_dots: false });

const strongPassword = (field) =>
  body(field)
    .isString()
    .isLength({ min: 8, max: 72 }).withMessage('Password must be 8–72 characters.')
    .matches(/[a-z]/).withMessage('Password must contain a lowercase letter.')
    .matches(/[A-Z]/).withMessage('Password must contain an uppercase letter.')
    .matches(/\d/).withMessage('Password must contain a number.');

const registerRules = [nameRule, emailRule, strongPassword('password')];

const loginRules = [
  emailRule,
  body('password').isString().notEmpty().withMessage('Password is required.').isLength({ max: 72 }),
];

const profileRules = [nameRule, emailRule];

const changePasswordRules = [
  body('currentPassword').isString().notEmpty().withMessage('Current password is required.'),
  strongPassword('newPassword'),
];

const urlScanRules = [
  body('url')
    .isString().withMessage('URL must be text.')
    .trim()
    .notEmpty().withMessage('Please enter a URL.')
    .isLength({ max: 2048 }).withMessage('URL is too long (max 2048 characters).'),
];

const emailScanRules = [
  body('content')
    .isString().withMessage('Email content must be text.')
    .isLength({ min: 10, max: 20000 }).withMessage('Email content must be 10–20,000 characters.'),
  body('sender').optional({ values: 'falsy' }).isString().isLength({ max: 320 }).withMessage('Sender is too long.'),
  body('subject').optional({ values: 'falsy' }).isString().isLength({ max: 300 }).withMessage('Subject is too long.'),
];

const idParam = param('id').isInt({ min: 1 }).withMessage('Invalid id.').toInt();
const typeParam = param('type').isIn(['url', 'email']).withMessage('Type must be "url" or "email".');

const tipRules = [
  body('title').customSanitizer(stripTags).isLength({ min: 3, max: 150 }).withMessage('Title must be 3–150 characters.'),
  body('description').customSanitizer(stripTags).isLength({ min: 10, max: 5000 }).withMessage('Description must be 10–5000 characters.'),
];

const roleRules = [body('role').isIn(['user', 'admin']).withMessage('Role must be "user" or "admin".')];

module.exports = {
  handleValidation,
  registerRules,
  loginRules,
  profileRules,
  changePasswordRules,
  urlScanRules,
  emailScanRules,
  idParam,
  typeParam,
  tipRules,
  roleRules,
};
