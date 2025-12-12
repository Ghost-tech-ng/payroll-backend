const Organization = require('../models/Organization');
const User = require('../models/User');
const Plan = require('../models/Plan');
const Employee = require('../models/Employee');

// @desc    Get all organizations with stats
// @route   GET /api/super-admin/organizations
// @access  Private/SuperAdmin
const getAllOrganizations = async (req, res) => {
    try {
        const organizations = await Organization.find({}).sort({ createdAt: -1 });

        // Get user counts and plan details for each org
        const orgsWithStats = await Promise.all(organizations.map(async (org) => {
            const employeeCount = await Employee.countDocuments({ organization: org._id });
            const adminUser = await User.findOne({ organization: org._id, role: 'Admin' }).select('firstName lastName email phoneNumber');

            // Get Plan limit
            let maxEmployees = 0;
            if (org.subscriptionPlan && org.subscriptionPlan !== 'none') {
                const plan = await Plan.findOne({ name: org.subscriptionPlan });
                if (plan) maxEmployees = plan.maxEmployees;
            }

            return {
                ...org.toObject(),
                employeeCount,
                maxEmployees,
                adminUser
            };
        }));

        res.json(orgsWithStats);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update organization plan (Grant Access)
// @route   PUT /api/super-admin/organizations/:id/plan
// @access  Private/SuperAdmin
const updateOrganizationPlan = async (req, res) => {
    try {
        const { planName } = req.body;
        const organization = await Organization.findById(req.params.id);

        if (organization) {
            organization.subscriptionPlan = planName;
            organization.subscriptionStatus = planName === 'none' ? 'inactive' : 'active';

            // Set arbitrary expiration for manual grants (e.g., 1 year) or indefinite?
            // For now, let's say manual grants are valid for 1 year
            const date = new Date();
            date.setFullYear(date.getFullYear() + 1);
            organization.subscriptionExpiresAt = date;

            const updatedOrg = await organization.save();
            res.json(updatedOrg);
        } else {
            res.status(404).json({ message: 'Organization not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete organization and all associated data
// @route   DELETE /api/super-admin/organizations/:id
// @access  Private/SuperAdmin
const deleteOrganization = async (req, res) => {
    try {
        const orgId = req.params.id;

        // Delete Employees
        await Employee.deleteMany({ organization: orgId });
        // Delete Users
        await User.deleteMany({ organization: orgId });
        // Delete Organization
        await Organization.findByIdAndDelete(orgId);

        res.json({ message: 'Organization and all related data deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete a specific user
// @route   DELETE /api/super-admin/users/:id
// @access  Private/SuperAdmin
const deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (user) {
            // If deleting an Admin, warn? Or just do it.
            // If it's the only admin for an org, that org becomes inaccessible.
            // But super admin has power to do this.
            await user.deleteOne();
            res.json({ message: 'User deleted' });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

// --- PLAN MANAGEMENT ---

// @desc    Get all plans
// @route   GET /api/public/plans (Public) or /api/super-admin/plans
// @access  Public
const getPlans = async (req, res) => {
    try {
        const plans = await Plan.find({}).sort({ price: 1 });
        res.json(plans);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create a new plan
// @route   POST /api/super-admin/plans
// @access  Private/SuperAdmin
const createPlan = async (req, res) => {
    const { name, price, maxEmployees, features, description, popular, color } = req.body;
    try {
        const planExists = await Plan.findOne({ name });
        if (planExists) {
            return res.status(400).json({ message: 'Plan already exists' });
        }

        const plan = await Plan.create({
            name,
            price,
            maxEmployees,
            features,
            description,
            popular,
            color
        });

        res.status(201).json(plan);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update a plan
// @route   PUT /api/super-admin/plans/:id
// @access  Private/SuperAdmin
const updatePlan = async (req, res) => {
    try {
        const { name, price, maxEmployees, features, description, popular, color } = req.body;
        const plan = await Plan.findById(req.params.id);

        if (!plan) {
            return res.status(404).json({ message: 'Plan not found' });
        }

        // Update fields
        plan.name = name || plan.name;
        plan.price = price !== undefined ? price : plan.price;
        plan.maxEmployees = maxEmployees || plan.maxEmployees;
        plan.features = features || plan.features;
        plan.description = description !== undefined ? description : plan.description;
        plan.popular = popular !== undefined ? popular : plan.popular;
        plan.color = color || plan.color;

        const updatedPlan = await plan.save();
        res.json(updatedPlan);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete a plan
// @route   DELETE /api/super-admin/plans/:id
// @access  Private/SuperAdmin
const deletePlan = async (req, res) => {
    try {
        // Prevent deleting if orgs are using it? 
        // For simplicity, allow deletion, but orgs on this plan will just fallback to having no limit checks or generic checks?
        // Better: Warning in frontend.
        await Plan.findByIdAndDelete(req.params.id);
        res.json({ message: 'Plan deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getAllOrganizations,
    updateOrganizationPlan,
    deleteOrganization,
    deleteUser,
    getPlans,
    createPlan,
    updatePlan,
    deletePlan
};
