const express = require('express');
const router = express.Router();
const { pushAttendance } = require('../controllers/machineController');

// POST /api/machine/push
router.post('/push', pushAttendance);

module.exports = router;
