const mongoose = require('mongoose');

const payrollSchema = mongoose.Schema({
    organization: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        required: true,
    },
    month: {
        type: String,
        required: true,
    },
    year: {
        type: Number,
        required: true,
    },
    status: {
        type: String,
        enum: ['draft', 'processing', 'completed'],
        default: 'draft',
    },
    totalAmount: {
        type: Number,
        default: 0,
    },
    details: [{
        employee: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Employee',
        },
        basicSalary: Number,
        totalAllowances: Number,
        totalDeductions: Number,
        netSalary: Number,
        // Tax Components
        tax: Number,
        pension: Number,
        nhf: Number,
        cra: Number,
        taxableIncome: Number,
        // Employer Contributions (Saved at time of payroll)
        employerPension: { type: Number, default: 0 },
        employerNHIS: { type: Number, default: 0 },
        employerECS: { type: Number, default: 0 },
        employerITF: { type: Number, default: 0 },

        breakdown: {
            allowances: Map,
            deductions: Map,
        },
    }],
}, {
    timestamps: true,
});

// Add indexes for frequently queried fields
payrollSchema.index({ organization: 1 });
payrollSchema.index({ organization: 1, month: 1, year: 1 });

module.exports = mongoose.model('Payroll', payrollSchema);
