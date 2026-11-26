const express = require('express');
const ctrl = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');
const v = require('../middleware/validate');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.post('/register', authLimiter, v.registerRules, v.handleValidation, asyncHandler(ctrl.register));
router.post('/login', authLimiter, v.loginRules, v.handleValidation, asyncHandler(ctrl.login));
router.post('/logout', authenticate, asyncHandler(ctrl.logout));
router.get('/me', authenticate, asyncHandler(ctrl.me));
router.put('/profile', authenticate, v.profileRules, v.handleValidation, asyncHandler(ctrl.updateProfile));
router.put('/password', authenticate, authLimiter, v.changePasswordRules, v.handleValidation, asyncHandler(ctrl.changePassword));

module.exports = router;
