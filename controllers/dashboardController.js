const Employee = require('../models/Employee');
const Payroll = require('../models/Payroll');
const Organization = require('../models/Organization');

// @desc    Get dashboard statistics
// @route   GET /api/dashboard/stats
// @access  Private
const getDashboardStats = async (req, res) => {
    try {
        const organizationId = req.user.organization;

        // Get total employees
        const totalEmployees = await Employee.countDocuments({ organization: organizationId });

        // Get latest payroll total (for the current month or last processed)
        const latestPayroll = await Payroll.findOne({ organization: organizationId })
            .sort({ createdAt: -1 });

        const monthlyPayroll = latestPayroll ? latestPayroll.totalAmount : 0;

        // Get pending reports (mock logic for now, or count pending payrolls)
        const pendingPayrolls = await Payroll.countDocuments({
            organization: organizationId,
            status: 'pending'
        });

        // Get organization subscription details
        const organization = await Organization.findById(organizationId);

        // Get recent activities
        const Activity = require('../models/Activity');
        const recentActivities = await Activity.find({ organization: organizationId })
            .sort({ createdAt: -1 })
            .limit(5)
            .populate('user', 'firstName lastName');

        // Get ROMs (Records of Modification) count or recent ones if needed on dashboard
        // For now, just activities

        res.json({
            totalEmployees,
            monthlyPayroll,
            pendingReports: pendingPayrolls,
            upcomingEvents: 0, // Placeholder for now
            subscription: {
                plan: organization.subscriptionPlan,
                status: organization.subscriptionStatus,
                expiresAt: organization.subscriptionExpiresAt
            },
            recentActivities: recentActivities.map(activity => ({
                id: activity._id,
                action: activity.action,
                description: activity.description,
                user: activity.user ? `${activity.user.firstName} ${activity.user.lastName}` : 'System',
                timestamp: activity.createdAt
            }))
        });
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = {
    getDashboardStats,
};
