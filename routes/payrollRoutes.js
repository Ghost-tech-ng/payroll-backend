const express = require('express');
const router = express.Router();
const { getPayrolls, createPayroll } = require('../controllers/payrollController');
const { protect } = require('../middleware/authMiddleware');

router.route('/').get(protect, getPayrolls).post(protect, createPayroll);

module.exports = router;
