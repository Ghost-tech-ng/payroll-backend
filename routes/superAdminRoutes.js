const express = require('express');
const router = express.Router();
const {
    getAllOrganizations,
    updateOrganizationPlan,
    deleteOrganization,
    deleteUser,
    getPlans,
    createPlan,
    updatePlan,
    deletePlan
} = require('../controllers/superAdminController');
const { protect, superAdmin } = require('../middleware/authMiddleware');

router.get('/organizations', protect, superAdmin, getAllOrganizations);
router.put('/organizations/:id/plan', protect, superAdmin, updateOrganizationPlan);
router.delete('/organizations/:id', protect, superAdmin, deleteOrganization);
router.delete('/users/:id', protect, superAdmin, deleteUser);

router.get('/plans', protect, superAdmin, getPlans);
router.post('/plans', protect, superAdmin, createPlan);
router.put('/plans/:id', protect, superAdmin, updatePlan);
router.delete('/plans/:id', protect, superAdmin, deletePlan);

module.exports = router;
