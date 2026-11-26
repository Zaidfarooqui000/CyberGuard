// Scans, history and the user dashboard – all require login.
const express = require('express');
const ctrl = require('../controllers/scanController');
const { authenticate } = require('../middleware/auth');
const { scanLimiter } = require('../middleware/rateLimiter');
const v = require('../middleware/validate');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();
// authenticate is added to each route (not router.use) so unknown /api URLs still return 404.

router.post('/scans/url', authenticate, scanLimiter, v.urlScanRules, v.handleValidation, asyncHandler(ctrl.scanUrl));
router.post('/scans/email', authenticate, scanLimiter, v.emailScanRules, v.handleValidation, asyncHandler(ctrl.scanEmail));

router.get('/history', authenticate, asyncHandler(ctrl.getHistory));
router.delete('/history', authenticate, asyncHandler(ctrl.clearHistory));
router.get('/history/:type/:id', authenticate, v.typeParam, v.idParam, v.handleValidation, asyncHandler(ctrl.getScan));
router.delete('/history/:type/:id', authenticate, v.typeParam, v.idParam, v.handleValidation, asyncHandler(ctrl.deleteScan));

router.get('/dashboard', authenticate, asyncHandler(ctrl.getDashboard));

module.exports = router;
