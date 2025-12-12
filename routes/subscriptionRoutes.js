const express = require('express');
const router = express.Router();
const {
    initializeSubscription,
    verifySubscription,
    getSubscription,
    payWithWallet,
} = require('../controllers/subscriptionController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getSubscription);
router.post('/initialize', protect, initializeSubscription);
router.get('/verify/:reference', protect, verifySubscription);
router.post('/pay-with-wallet', protect, payWithWallet);

module.exports = router;
