const mongoose = require('mongoose');

const organizationSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    address: {
        type: String,
    },
    contactEmail: {
        type: String,
    },
    contactPhone: {
        type: String,
    },
    logo: {
        type: String, // URL from Cloudinary
    },
    subscriptionStatus: {
        type: String,
        enum: ['active', 'inactive', 'trial'],
        default: 'trial',
    },
    subscriptionPlan: {
        type: String,
        enum: ['basic', 'premium', 'enterprise', 'none'],
        default: 'none',
    },
    subscriptionExpiresAt: {
        type: Date,
    },
    address: String,
    tin: String,
    payrollFrequency: { type: String, default: 'Monthly' },
    payDay: String,
    employerPension: { enabled: { type: Boolean, default: true }, value: { type: Number, default: 10 } },
    employerNHIS: { enabled: { type: Boolean, default: true }, value: { type: Number, default: 5 } },
    employerECS: { enabled: { type: Boolean, default: true }, value: { type: Number, default: 1 } },
    employerITF: { enabled: { type: Boolean, default: true }, value: { type: Number, default: 1 } },
    payeEnabled: { type: Boolean, default: false },
}, {
    timestamps: true,
});

module.exports = mongoose.model('Organization', organizationSchema);
