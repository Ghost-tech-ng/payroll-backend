const EmployerStatutoryRecord = require('../models/EmployerStatutoryRecord');
const Employee = require('../models/Employee');
const Organization = require('../models/Organization');

// @desc    Post employer statutory contribution
// @route   POST /api/employer-statutory/post
// @access  Private
const postStatutoryContribution = async (req, res) => {
    try {
        const { employeeId, contributionType, amount, percentage, period } = req.body;

        // Validate input
        if (!employeeId || !contributionType || !amount || !period) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        // Get employee details
        const employee = await Employee.findById(employeeId);
        if (!employee) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        // Verify employee belongs to user's organization
        if (employee.organization.toString() !== req.user.organization.toString()) {
            return res.status(403).json({ message: 'Unauthorized access to employee' });
        }

        // Create statutory record
        const record = await EmployerStatutoryRecord.create({
            organization: req.user.organization,
            employee: employeeId,
            employeeName: `${employee.firstName} ${employee.lastName}`,
            contributionType: contributionType.toLowerCase(),
            amount,
            percentage,
            baseSalary: employee.basicSalary,
            period,
            postedBy: req.user._id,
        });

        res.status(201).json(record);
    } catch (error) {
        console.error('Error posting statutory contribution:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Get all employer statutory records with filtering
// @route   GET /api/employer-statutory/records
// @access  Private
const getStatutoryRecords = async (req, res) => {
    try {
        const { period, contributionType, employeeId, status } = req.query;

        // Build filter
        const filter = { organization: req.user.organization };
        if (period) filter.period = period;
        if (contributionType) filter.contributionType = contributionType.toLowerCase();
        if (employeeId) filter.employee = employeeId;
        if (status) filter.status = status;

        const records = await EmployerStatutoryRecord.find(filter)
            .populate('employee', 'firstName lastName')
            .sort({ postedDate: -1 });

        res.json(records);
    } catch (error) {
        console.error('Error fetching statutory records:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get summary of employer statutory obligations
// @route   GET /api/employer-statutory/summary
// @access  Private
const getStatutorySummary = async (req, res) => {
    try {
        const { period } = req.query;

        const filter = {
            organization: req.user.organization,
            status: 'pending'
        };
        if (period) filter.period = period;

        // Aggregate by contribution type
        const summary = await EmployerStatutoryRecord.aggregate([
            { $match: filter },
            {
                $group: {
                    _id: '$contributionType',
                    totalAmount: { $sum: '$amount' },
                    count: { $sum: 1 }
                }
            }
        ]);

        // Get total pending amount
        const totalPending = summary.reduce((sum, item) => sum + item.totalAmount, 0);

        res.json({
            summary,
            totalPending,
            period: period || 'all'
        });
    } catch (error) {
        console.error('Error fetching statutory summary:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Mark statutory record as paid
// @route   PUT /api/employer-statutory/:id/mark-paid
// @access  Private
const markAsPaid = async (req, res) => {
    try {
        const record = await EmployerStatutoryRecord.findById(req.params.id);

        if (!record) {
            return res.status(404).json({ message: 'Record not found' });
        }

        // Verify record belongs to user's organization
        if (record.organization.toString() !== req.user.organization.toString()) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        record.status = 'paid';
        record.paymentDate = new Date();
        await record.save();

        res.json(record);
    } catch (error) {
        console.error('Error marking as paid:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Delete statutory record
// @route   DELETE /api/employer-statutory/:id
// @access  Private
const deleteStatutoryRecord = async (req, res) => {
    try {
        const record = await EmployerStatutoryRecord.findById(req.params.id);

        if (!record) {
            return res.status(404).json({ message: 'Record not found' });
        }

        // Verify record belongs to user's organization
        if (record.organization.toString() !== req.user.organization.toString()) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        await record.deleteOne();
        res.json({ message: 'Record deleted successfully' });
    } catch (error) {
        console.error('Error deleting record:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = {
    postStatutoryContribution,
    getStatutoryRecords,
    getStatutorySummary,
    markAsPaid,
    deleteStatutoryRecord
};
