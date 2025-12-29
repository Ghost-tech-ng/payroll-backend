const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
    postStatutoryContribution,
    getStatutoryRecords,
    getStatutorySummary,
    markAsPaid,
    deleteStatutoryRecord
} = require('../controllers/employerStatutoryController');

router.post('/post', protect, postStatutoryContribution);
router.get('/records', protect, getStatutoryRecords);
router.get('/summary', protect, getStatutorySummary);
router.put('/:id/mark-paid', protect, markAsPaid);
router.delete('/:id', protect, deleteStatutoryRecord);

module.exports = router;
