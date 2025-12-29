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
    // Salary Components Configuration
    salaryComponents: {
        basicSalary: {
            enabled: { type: Boolean, default: true },
            percentage: { type: Number, default: 40 }
        }
    },
    // Employer Statutory Contributions Configuration
    employerPension: { enabled: { type: Boolean, default: false }, percentage: { type: Number, default: 10 } },
    employerNHIS: { enabled: { type: Boolean, default: false }, percentage: { type: Number, default: 5 } },
    employerECS: { enabled: { type: Boolean, default: false }, percentage: { type: Number, default: 1 } },
    employerITF: { enabled: { type: Boolean, default: false }, percentage: { type: Number, default: 1 } },
    lifeAssurance: { type: Number, default: 0 }, // Fixed amount paid by employer
    // Employee Statutory Deductions Configuration (company-wide defaults - checkboxes only)
    // Individual employees inherit these defaults but can override on their profile
    employeeStatutoryDeductions: {
        pension: { enabled: { type: Boolean, default: true } },
        nhf: { enabled: { type: Boolean, default: true } },
        nhis: { enabled: { type: Boolean, default: true } },
        voluntaryPension: { enabled: { type: Boolean, default: false } },
        profUnionDues: { enabled: { type: Boolean, default: false } }
    },
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
