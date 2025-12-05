const mongoose = require('mongoose');

const pensionCalculationSchema = mongoose.Schema({
    organization: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        required: true,
    },
    employeeName: {
        type: String,
        required: true,
    },
    monthlySalary: {
        type: Number,
        required: true,
    },
    employeeRate: {
        type: Number,
        required: true,
    },
    employerRate: {
        type: Number,
        required: true,
    },
    employeeContribution: {
        type: Number,
        required: true,
    },
    employerContribution: {
        type: Number,
        required: true,
    },
    totalContribution: {
        type: Number,
        required: true,
    },
    salaryComponents: [{
        name: String,
        percentage: Number,
        amount: Number
    }]
}, {
    timestamps: true,
});

module.exports = mongoose.model('PensionCalculation', pensionCalculationSchema);
