const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
    organization: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    action: {
        type: String,
        required: true,
        enum: ['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'PAYROLL_RUN', 'OTHER']
    },
    description: {
        type: String,
        required: true
    },
    entityType: {
        type: String,
        enum: ['Employee', 'Payroll', 'Organization', 'User', 'Candidate', 'Job', 'Training', 'Performance'],
        required: false
    },
    entityId: {
        type: mongoose.Schema.Types.ObjectId,
        required: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Activity', activitySchema);
