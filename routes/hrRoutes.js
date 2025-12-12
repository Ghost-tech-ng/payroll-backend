const express = require('express');
const router = express.Router();
const { getReminders } = require('../controllers/hrController');
const { protect } = require('../middleware/authMiddleware');

router.get('/reminders', protect, getReminders);

module.exports = router;
