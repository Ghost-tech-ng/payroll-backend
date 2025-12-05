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
    },
    phoneNumber: {
        type: String,
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
}, {
    timestamps: true,
});

// Add indexes for frequently queried fields
employeeSchema.index({ organization: 1 });
employeeSchema.index({ organization: 1, status: 1 });
employeeSchema.index({ email: 1 });

module.exports = mongoose.model('Employee', employeeSchema);
