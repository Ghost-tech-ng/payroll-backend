const mongoose = require('mongoose');

const planSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
    },
    price: {
        type: Number,
        required: true,
    },
    maxEmployees: {
        type: Number,
        required: true,
    },
    features: [{
        type: String,
    }],
    description: {
        type: String,
    },
    color: {
        type: String,
        default: 'bg-blue-500' // Default UI color
    },
    popular: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true,
});

module.exports = mongoose.model('Plan', planSchema);
