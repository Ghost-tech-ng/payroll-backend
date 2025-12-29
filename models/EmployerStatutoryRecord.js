const mongoose = require('mongoose');

const employerStatutoryRecordSchema = mongoose.Schema({
    organization: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        required: true,
    },
    employee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee',
        required: true,
    },
    employeeName: {
        type: String,
        required: true,
    },
    contributionType: {
        type: String,
        required: true,
        enum: ['pension', 'nhis', 'ecs', 'itf'],
    },
    amount: {
        type: Number,
        required: true,
    },
    percentage: {
        type: Number,
    },
    baseSalary: {
        type: Number,
    },
    period: {
        type: String, // e.g., "january 2025"
        required: true,
    },
    postedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    postedDate: {
        type: Date,
        default: Date.now,
    },
    status: {
        type: String,
        enum: ['pending', 'paid'],
        default: 'pending',
    },
    paymentDate: {
        type: Date,
    },
    notes: {
        type: String,
    }
}, {
    timestamps: true,
});

// Add indexes for frequently queried fields
employerStatutoryRecordSchema.index({ organization: 1 });
employerStatutoryRecordSchema.index({ organization: 1, period: 1 });
employerStatutoryRecordSchema.index({ organization: 1, contributionType: 1 });
employerStatutoryRecordSchema.index({ organization: 1, status: 1 });

module.exports = mongoose.model('EmployerStatutoryRecord', employerStatutoryRecordSchema);
