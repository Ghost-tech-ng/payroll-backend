const { calculatePAYE } = require('../utils/taxCalculations');
const Payroll = require('../models/Payroll');
const Employee = require('../models/Employee');

// ... (existing imports)

// @desc    Create/Run payroll for a month
// @route   POST /api/payroll
// @access  Private
// Get all payrolls for organization
const getPayrolls = async (req, res) => {
    try {
        const payrolls = await Payroll.find({ organization: req.user.organization })
            .sort({ createdAt: -1 });
        res.json(payrolls);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const createPayroll = async (req, res) => {
    const { month, year } = req.body;

    try {
        // ... (existing payroll existence check)
        const payrollExists = await Payroll.findOne({
            organization: req.user.organization,
            month,
            year,
        });

        if (payrollExists) {
            return res.status(400).json({ message: 'Payroll already exists for this month' });
        }

        // Get all active employees
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
            const basic = emp.basicSalary || 0;

            // Calculate Total Allowances
            let totalAllowances = 0;
            let housingAllowance = 0;
            let transportAllowance = 0;
            let otherAllowances = 0;

            if (emp.allowances) {
                // Check if map or object
                const allowanceEntries = emp.allowances instanceof Map ? Array.from(emp.allowances.entries()) : Object.entries(emp.allowances);

                allowanceEntries.forEach(([key, amount]) => {
                    const value = Number(amount) || 0;
                    const lowerKey = key.toLowerCase();

                    if (lowerKey.includes('housing')) {
                        housingAllowance += value;
                    } else if (lowerKey.includes('transport')) {
                        transportAllowance += value;
                    } else {
                        otherAllowances += value;
                    }
                    totalAllowances += value;
                });
            }

            // Calculate PAYE tax and statutory deductions
            const taxDetails = calculatePAYE(basic, housingAllowance, transportAllowance, otherAllowances);

            // Calculate other manual deductions (if any, excluding statutory ones calculated by standard)
            // Note: If user manually added 'Pension' or 'Tax' in deductions map, we should probably override or ignore them to avoid double counting,
            // OR we assume manual deductions are extra (like loan repayment, penalties etc).
            // For now, let's treat manual deductions as EXTRA deductions (e.g. Loans).
            let manualDeductions = 0;
            if (emp.deductions) {
                const deductionEntries = emp.deductions instanceof Map ? Array.from(emp.deductions.entries()) : Object.entries(emp.deductions);

                deductionEntries.forEach(([key, amount]) => {
                    manualDeductions += Number(amount) || 0;
                });
            }

            // Total Deductions = Tax + Pension + NHF + Manual Deductions
            const totalStatutoryDeductions = taxDetails.tax + taxDetails.pension + taxDetails.nhf;
            const totalDeductions = totalStatutoryDeductions + manualDeductions;

            const netSalary = taxDetails.grossIncome - totalDeductions;
            totalAmount += netSalary;

            // Add statutory deductions to the breakdown map for completeness
            const fullDeductionsMap = emp.deductions ? JSON.parse(JSON.stringify(emp.deductions)) : {};
            fullDeductionsMap['PAYE Tax'] = taxDetails.tax;
            fullDeductionsMap['Pension (8%)'] = taxDetails.pension;
            fullDeductionsMap['NHF (2.5%)'] = taxDetails.nhf;

            return {
                employee: emp._id,
                basicSalary: basic,
                totalAllowances,
                totalDeductions,
                netSalary,
                // Store calculated fields
                tax: taxDetails.tax,
                pension: taxDetails.pension,
                nhf: taxDetails.nhf,
                cra: taxDetails.cra,
                taxableIncome: taxDetails.taxableIncome,

                breakdown: {
                    allowances: emp.allowances,
                    deductions: fullDeductionsMap,
                },
            };
        });

        const payroll = new Payroll({
            organization: req.user.organization,
            month,
            year,
            status: 'completed',
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
