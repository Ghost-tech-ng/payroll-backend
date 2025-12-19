const mongoose = require('mongoose');

const outsourcingRequestSchema = new mongoose.Schema({
    organization: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        required: false // Optional, as some leads might be new
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false // Optional
    },
    serviceId: {
        type: String,
        required: true
    },
    serviceName: {
        type: String,
        required: true
    },
    customerData: {
        type: Object, // Flexible schema for various service types
        required: true
    },
    hasFiles: {
        type: Boolean,
        default: false
    },
    // Billing Fields
    quoteAmount: {
        type: Number,
        default: 0
    },
    currency: {
        type: String,
        default: 'NGN'
    },
    paymentStatus: {
        type: String,
        default: 'Unpaid',
        enum: ['Unpaid', 'Pending', 'Paid']
    },
    paymentReference: {
        type: String
    },
    status: {
        type: String,
        default: 'Pending',
        enum: ['Pending', 'Reviewed', 'Quote Sent', 'Approved', 'Rejected']
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('OutsourcingRequest', outsourcingRequestSchema);
