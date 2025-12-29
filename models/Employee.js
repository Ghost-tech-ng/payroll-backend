const mongoose = require('mongoose');

const employeeSchema = mongoose.Schema({
    organization: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        required: true,
    },
    firstName: {
        type: String,
        required: true,
    },
    lastName: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    phoneNumber: {
        type: String,
    },
    biometricId: {
        type: String,
        description: "ID derived from attendance machine"
    },
    role: {
        type: String,
        default: 'Employee',
    },
    department: {
        type: String,
    },
    designation: {
        type: String,
    },
    dateOfJoining: {
        type: Date,
    },
    basicSalary: {
        type: Number,
        default: 0,
    },
    allowances: {
        type: Map,
        of: Number,
        default: {},
    },
    deductions: {
        type: Map,
        of: Number,
        default: {},
    },
    // Employee-level statutory deductions (inherits from employer defaults, can be overridden)
    statutoryDeductions: {
        pension: {
            enabled: { type: Boolean, default: true },
            percentage: { type: Number, default: 8 }
        },
        nhf: {
            enabled: { type: Boolean, default: true },
            percentage: { type: Number, default: 2.5 }
        },
        nhis: {
            enabled: { type: Boolean, default: true },
            percentage: { type: Number, default: 5 }
        },
        voluntaryPension: {
            enabled: { type: Boolean, default: false },
            amount: { type: Number, default: 0 }
        },
        profUnionDues: {
            enabled: { type: Boolean, default: false },
            amount: { type: Number, default: 0 }
        }
    },
    payeEnabled: { type: Boolean, default: false },
    bankDetails: {
        accountName: String,
        accountNumber: String,
        bankName: String,
    },
    status: {
        type: String,
        enum: ['active', 'inactive', 'terminated'],
        default: 'active',
    },
    isDeleted: {
        type: Boolean,
        default: false,
    },
    // Personal Info
    gender: String,
    dateOfBirth: Date,
    stateOfOrigin: String,
    maritalStatus: String,
    numberOfChildren: Number,
    residentialAddress: String,

    // Employment Details
    jobDescription: String,
    employmentType: String,
    reportingManager: String,

    // Pension
    pensionPin: String,
    pensionPFA: String, // Pension Fund Administrator / Bank
    pensionCommencementDate: Date,

    // Other Details
    education: [
        {
            institution: String,
            degree: String,
            year: String,
        }
    ],
    guarantors: [
        {
            fullName: String,
            phoneNumber: String,
            email: String,
            address: String,
            relationship: String,
        }
    ],
    nextOfKin: {
        fullName: String,
        phoneNumber: String,
        email: String,
        address: String,
        relationship: String,
    },
    workHistory: [
        {
            companyName: String,
            role: String,
            startDate: Date,
            endDate: Date,
        }
    ],
    photo: String, // URL for employee photo

    // WebAuthn Credentials for Biometrics
    credentials: [{
        credentialID: String,
        credentialPublicKey: String,
        counter: Number,
        transports: [String]
    }],
}, {
    timestamps: true,
});

// Add indexes for frequently queried fields
employeeSchema.index({ organization: 1 });
employeeSchema.index({ organization: 1, status: 1 });


module.exports = mongoose.model('Employee', employeeSchema);
