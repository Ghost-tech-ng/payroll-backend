const mongoose = require('mongoose');

const candidateSchema = mongoose.Schema({
    organization: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        required: true,
    },
    fullName: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
    },
    phone: {
        type: String,
        required: true,
    },
    dateOfBirth: Date,
    gender: String,
    maritalStatus: String,
    address: String,
    city: String,
    state: String,
    nationality: String,
    experience: String,
    education: String,
    skills: String,
    status: {
        type: String,
        enum: ['New', 'Screening', 'Interview', 'Offer', 'Hired', 'Rejected'],
        default: 'New',
    },
    appliedJobs: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Job'
    }]
}, {
    timestamps: true,
});

module.exports = mongoose.model('Candidate', candidateSchema);
