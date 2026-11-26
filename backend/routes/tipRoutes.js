// Public: anyone can read the security tips on the awareness page.
const express = require('express');
const { listTips } = require('../controllers/tipController');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();
router.get('/', asyncHandler(listTips));

module.exports = router;
