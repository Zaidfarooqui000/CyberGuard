// Every route here requires a logged-in admin.
const express = require('express');
const admin = require('../controllers/adminController');
const tips = require('../controllers/tipController');
const { authenticate, requireAdmin } = require('../middleware/auth');
const v = require('../middleware/validate');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();
router.use(authenticate, requireAdmin);

router.get('/stats', asyncHandler(admin.getStats));

router.get('/users', asyncHandler(admin.listUsers));
router.put('/users/:id/role', v.idParam, v.roleRules, v.handleValidation, asyncHandler(admin.updateUserRole));
router.delete('/users/:id', v.idParam, v.handleValidation, asyncHandler(admin.deleteUser));

router.get('/scans', asyncHandler(admin.listScans));
router.get('/logs', asyncHandler(admin.listLogs));

router.post('/tips', v.tipRules, v.handleValidation, asyncHandler(tips.createTip));
router.put('/tips/:id', v.idParam, v.tipRules, v.handleValidation, asyncHandler(tips.updateTip));
router.delete('/tips/:id', v.idParam, v.handleValidation, asyncHandler(tips.deleteTip));

module.exports = router;
