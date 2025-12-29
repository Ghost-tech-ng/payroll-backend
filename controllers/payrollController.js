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

        // Get organization settings for rates
        const Organization = require('../models/Organization');
        const orgSettings = await Organization.findById(req.user.organization);

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

            const grossIncome = basic + totalAllowances; // Simplified gross

            // Calculate PAYE tax and statutory deductions
            const taxDetails = calculatePAYE(basic, housingAllowance, transportAllowance, otherAllowances);

            // Calculate other manual deductions
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

            // --- Calculate Employer Contributions ---
            // 1. Employer Pension (Standard: 10% of Basic+Housing+Transport)
            let employerPension = 0;
            if (orgSettings && orgSettings.employerPension && orgSettings.employerPension.enabled) {
                const rate = (orgSettings.employerPension.value || 10) / 100;
                employerPension = (basic + housingAllowance + transportAllowance) * rate;
            }

            // 2. Employer NHIS (Standard: usually set % of Basic or Gross)
            let employerNHIS = 0;
            if (orgSettings && orgSettings.employerNHIS && orgSettings.employerNHIS.enabled) {
                const rate = (orgSettings.employerNHIS.value || 5) / 100;
                employerNHIS = (basic + housingAllowance + transportAllowance) * rate; // Using same base as common practice
            }

            // 3. Employer ECS (Standard: 1% of Total Payroll)
            let employerECS = 0;
            if (orgSettings && orgSettings.employerECS && orgSettings.employerECS.enabled) {
                const rate = (orgSettings.employerECS.value || 1) / 100;
                employerECS = grossIncome * rate;
            }

            // 4. Employer ITF (Standard: 1% of Annual Payroll -> Monthly)
            let employerITF = 0;
            if (orgSettings && orgSettings.employerITF && orgSettings.employerITF.enabled) {
                const rate = (orgSettings.employerITF.value || 1) / 100;
                employerITF = grossIncome * rate;
            }
            // ----------------------------------------

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

                // Store Employer Contributions
                employerPension,
                employerNHIS,
                employerECS,
                employerITF,

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
            status: 'completed', // Or 'pending' if you want a review step
            totalAmount,
            details,
        });

        const createdPayroll = await payroll.save();
        res.status(201).json(createdPayroll);

    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

module.exports = { getPayrolls, createPayroll };
