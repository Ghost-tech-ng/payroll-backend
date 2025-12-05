const mongoose = require('mongoose');

const performanceSchema = mongoose.Schema({
    organization: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        required: true,
    },
    employee: {
        type: String, // Storing ID or Name for now, ideally ObjectId ref to Employee
        required: true,
    },
    category: {
        type: String,
        required: true,
    },
    metrics: [{
        name: String,
        score: Number,
        comments: String
    }],
    overallScore: Number,
    evaluator: String,
    period: String,
    status: {
        type: String,
        enum: ['Draft', 'Submitted', 'Reviewed', 'Completed'],
        default: 'Draft',
    }
}, {
    timestamps: true,
});

module.exports = mongoose.model('Performance', performanceSchema);
