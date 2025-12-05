const mongoose = require('mongoose');

const walletSchema = mongoose.Schema({
    organization: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        required: true,
        unique: true,
    },
    balance: {
        type: Number,
        default: 0,
    },
    transactions: [{
        type: {
            type: String,
            enum: ['credit', 'debit'],
        },
        amount: Number,
        description: String,
        reference: String,
        status: {
            type: String,
            enum: ['pending', 'success', 'failed'],
            default: 'pending',
        },
        createdAt: {
            type: Date,
            default: Date.now,
        },
    }],
}, {
    timestamps: true,
});

module.exports = mongoose.model('Wallet', walletSchema);
