const express = require('express');
const router = express.Router();
const { saveCalculation, getCalculations } = require('../controllers/pensionController');
const { protect } = require('../middleware/authMiddleware');

router.post('/calculate', protect, saveCalculation);
router.get('/calculations', protect, getCalculations);

module.exports = router;
