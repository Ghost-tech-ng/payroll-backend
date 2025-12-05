const mongoose = require('mongoose');

const jobSchema = mongoose.Schema({
    organization: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        required: true,
    },
    title: {
        type: String,
        required: true,
    },
    department: {
        type: String,
        required: true,
    },
    location: {
        type: String,
        required: true,
    },
    type: {
        type: String,
        required: true,
        enum: ['Full-time', 'Part-time', 'Contract', 'Internship', 'Temporary'],
    },
    status: {
        type: String,
        enum: ['Open', 'Closed', 'On Hold'],
        default: 'Open',
    },
    description: {
        type: String,
    },
    closingDate: {
        type: Date,
        required: true,
    },
    postedDate: {
        type: Date,
        default: Date.now,
    },
    applicationsCount: {
        type: Number,
        default: 0,
    }
}, {
    timestamps: true,
});

module.exports = mongoose.model('Job', jobSchema);
