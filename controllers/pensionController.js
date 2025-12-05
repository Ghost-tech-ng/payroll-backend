const PensionCalculation = require('../models/PensionCalculation');

// @desc    Save pension calculation
// @route   POST /api/pension/calculate
// @access  Private
const saveCalculation = async (req, res) => {
    try {
        const {
            employeeName,
            monthlySalary,
            employeeRate,
            employerRate,
            employeeContribution,
            employerContribution,
            totalContribution,
            salaryComponents
        } = req.body;

        const calculation = await PensionCalculation.create({
            organization: req.user.organization,
            employeeName,
            monthlySalary,
            employeeRate,
            employerRate,
            employeeContribution,
            employerContribution,
            totalContribution,
            salaryComponents
        });

        res.status(201).json(calculation);
    } catch (error) {
        console.error('Error saving pension calculation:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get saved calculations
// @route   GET /api/pension/calculations
// @access  Private
const getCalculations = async (req, res) => {
    try {
        const query = { organization: req.user.organization };
        if (req.query.employeeName) {
            query.employeeName = req.query.employeeName;
        }

        const calculations = await PensionCalculation.find(query)
            .sort({ createdAt: -1 });
        res.json(calculations);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = {
    saveCalculation,
    getCalculations,
};
