const express = require('express');
const router = express.Router();
const {
    initializeSubscription,
    verifySubscription,
    getSubscription,
} = require('../controllers/subscriptionController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getSubscription);
router.post('/initialize', protect, initializeSubscription);
router.get('/verify/:reference', protect, verifySubscription);

module.exports = router;
