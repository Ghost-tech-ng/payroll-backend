const express = require('express');
const router = express.Router();
const {
    getAllOrganizations,
    updateOrganizationPlan,
    deleteOrganization,
    deleteUser,
    createPlan,
    deletePlan
} = require('../controllers/superAdminController');
const { protect, superAdmin } = require('../middleware/authMiddleware');

router.get('/organizations', protect, superAdmin, getAllOrganizations);
router.put('/organizations/:id/plan', protect, superAdmin, updateOrganizationPlan);
router.delete('/organizations/:id', protect, superAdmin, deleteOrganization);
router.delete('/users/:id', protect, superAdmin, deleteUser);

router.post('/plans', protect, superAdmin, createPlan);
router.delete('/plans/:id', protect, superAdmin, deletePlan);

module.exports = router;
