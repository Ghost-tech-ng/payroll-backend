const express = require('express');
const router = express.Router();
const { getJobs, createJob, getCandidates, createCandidate } = require('../controllers/recruitmentController');
const { protect } = require('../middleware/authMiddleware');

router.get('/jobs', protect, getJobs);
router.post('/jobs', protect, createJob);
router.get('/candidates', protect, getCandidates);
router.post('/candidates', protect, createCandidate);

module.exports = router;
