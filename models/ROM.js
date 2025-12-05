const mongoose = require('mongoose');

const romSchema = new mongoose.Schema({
    organization: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        required: true
    },
    employee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee',
        required: true
    },
    editedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    reason: {
        type: String,
        required: true
    },
    changes: {
        type: String, // Can be a JSON string or description of changes
        required: true
    },
    editedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('ROM', romSchema);
