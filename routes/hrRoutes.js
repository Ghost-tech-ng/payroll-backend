const express = require('express');
const router = express.Router();
const {
    getPerformances, createPerformance,
    getTrainingPrograms, createTrainingProgram,
    getTrainingEvents, createTrainingEvent
} = require('../controllers/hrController');
const { protect } = require('../middleware/authMiddleware');

// Performance routes
router.get('/performance', protect, getPerformances);
router.post('/performance', protect, createPerformance);

// Training routes
router.get('/training/programs', protect, getTrainingPrograms);
router.post('/training/programs', protect, createTrainingProgram);
router.get('/training/events', protect, getTrainingEvents);
router.post('/training/events', protect, createTrainingEvent);

module.exports = router;
