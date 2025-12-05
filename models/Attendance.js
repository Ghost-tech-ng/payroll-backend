const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
    organization: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        required: true
    },
    employeeName: {
        type: String,
        required: true
    },
    date: {
        type: String, // YYYY-MM-DD
        required: true
    },
    timeIn: {
        type: String,
        required: true
    },
    timeOut: {
        type: String,
        required: true
    },
    month: {
        type: String,
        required: true
    },
    year: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['Present', 'Absent', 'Late', 'Leave', 'overtime', 'Suspension', 'terminated'],
        default: 'Present'
    },
    hoursWorked: {
        type: Number,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Add indexes for frequently queried fields
attendanceSchema.index({ organization: 1 });
attendanceSchema.index({ organization: 1, date: 1 });

module.exports = mongoose.model('Attendance', attendanceSchema);
