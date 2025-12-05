const Payroll = require('../models/Payroll');
const Employee = require('../models/Employee');

// @desc    Get all payrolls for an organization
// @route   GET /api/payroll
// @access  Private
const getPayrolls = async (req, res) => {
    try {
        const payrolls = await Payroll.find({ organization: req.user.organization })
            .lean()
            .sort({ createdAt: -1 }); // Sort by newest first
        res.json(payrolls);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create/Run payroll for a month
// @route   POST /api/payroll
// @access  Private
const createPayroll = async (req, res) => {
    const { month, year } = req.body;

    try {
        // Check if payroll already exists
        const payrollExists = await Payroll.findOne({
            organization: req.user.organization,
            month,
            year,
        });

        if (payrollExists) {
            return res.status(400).json({ message: 'Payroll already exists for this month' });
        }

        // Get all active employees - only fetch necessary fields
        const employees = await Employee.find({
            organization: req.user.organization,
            status: 'active',
        })
            .select('_id firstName lastName basicSalary allowances deductions')
            .lean();

        if (employees.length === 0) {
            return res.status(400).json({ message: 'No active employees found' });
        }

        let totalAmount = 0;
        const details = employees.map((emp) => {
            // Simple calculation logic - can be expanded
            const basic = emp.basicSalary || 0;

            let totalAllowances = 0;
            if (emp.allowances) {
                emp.allowances.forEach((amount) => {
                    totalAllowances += amount;
                });
            }

            let totalDeductions = 0;
            if (emp.deductions) {
                emp.deductions.forEach((amount) => {
                    totalDeductions += amount;
                });
            }

            const netSalary = basic + totalAllowances - totalDeductions;
            totalAmount += netSalary;

            return {
                employee: emp._id,
                basicSalary: basic,
                totalAllowances,
                totalDeductions,
                netSalary,
                breakdown: {
                    allowances: emp.allowances,
                    deductions: emp.deductions,
                },
            };
        });

        const payroll = new Payroll({
            organization: req.user.organization,
            month,
            year,
            status: 'completed', // Auto-complete for now, can be 'draft'
            totalAmount,
            details,
        });

        const createdPayroll = await payroll.save();

        // Log Activity
        const Activity = require('../models/Activity');
        await Activity.create({
            organization: req.user.organization,
            user: req.user._id,
            action: 'PAYROLL_RUN',
            description: `Ran payroll for ${month} ${year}`,
            entityType: 'Payroll',
            entityId: createdPayroll._id
        });

        res.status(201).json(createdPayroll);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

module.exports = { getPayrolls, createPayroll };
