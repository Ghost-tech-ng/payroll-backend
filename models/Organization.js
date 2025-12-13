const mongoose = require('mongoose');

const organizationSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    apiKey: {
        type: String,
        unique: true,
        sparse: true,
        description: "API Key for machine authentication"
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
    // Storage Tracking
    storageUsed: {
        type: Number,
        default: 0, // In bytes
    },
    storageLimit: {
        type: Number,
        default: 1073741824, // 1GB in bytes (1024 * 1024 * 1024)
    },
}, {
    timestamps: true,
});

module.exports = mongoose.model('Organization', organizationSchema);
