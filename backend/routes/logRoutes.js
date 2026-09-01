const express = require('express');
const router = express.Router();
const { getMyLogs } = require('../controllers/logController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getMyLogs);

module.exports = router;
