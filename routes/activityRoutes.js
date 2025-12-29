const express = require('express');
const router = express.Router();
const { getActivities, createActivity, deleteActivity } = require('../controllers/activityController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
    .get(protect, getActivities)
    .post(protect, createActivity);

router.route('/:id')
    .delete(protect, deleteActivity);

module.exports = router;
