const express = require('express');
const router = express.Router();
const { getOrganization, updateOrganization, generateApiKey } = require('../controllers/organizationController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getOrganization);
router.put('/', protect, updateOrganization);
router.post('/api-key', protect, generateApiKey);

module.exports = router;
