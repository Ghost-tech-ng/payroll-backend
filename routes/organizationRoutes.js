const express = require('express');
const router = express.Router();
const { getOrganization, updateOrganization } = require('../controllers/organizationController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getOrganization);
router.put('/', protect, updateOrganization);

module.exports = router;
