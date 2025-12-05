const express = require('express');
const router = express.Router();
const {
    getWallet,
    initializeFunding,
    verifyPayment,
    getTransactions,
} = require('../controllers/walletController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getWallet);
router.post('/fund', protect, initializeFunding);
router.get('/verify/:reference', protect, verifyPayment);
router.get('/transactions', protect, getTransactions);

module.exports = router;
