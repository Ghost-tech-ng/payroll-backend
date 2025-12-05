const express = require('express');
const router = express.Router();
const { getAttendance, markAttendance } = require('../controllers/attendanceController');
const { protect } = require('../middleware/authMiddleware');

router.route('/').get(protect, getAttendance).post(protect, markAttendance);

module.exports = router;
