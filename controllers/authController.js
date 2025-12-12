const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Organization = require('../models/Organization');
const Plan = require('../models/Plan');

// SEED SUPER ADMIN & PLANS
const seedSuperAdminAndPlans = async () => {
    try {
        // 1. Seed Plans
        const plans = [
            { name: 'Basic', price: 5000, maxEmployees: 10, features: ['Up to 10 employees', 'Basic Payroll'], color: 'bg-gray-500' },
            { name: 'Premium', price: 15000, maxEmployees: 50, features: ['Up to 50 employees', 'Advanced Payroll', 'HR Management'], popular: true, color: 'bg-green-500' },
            { name: 'Enterprise', price: 50000, maxEmployees: 200, features: ['Up to 200 employees', 'Full Suite', 'Dedicated Support'], color: 'bg-purple-500' }
        ];

        for (const p of plans) {
            const exists = await Plan.findOne({ name: p.name });
            if (!exists) {
                await Plan.create(p);
                console.log(`Plan ${p.name} seeded`);
            }
        }

        // 2. Seed Super Admin
        const superAdminEmail = 'superadmin@mipaymaster.com';
        const adminExists = await User.findOne({ email: superAdminEmail });

        if (!adminExists) {
            const user = await User.create({
                email: superAdminEmail,
                password: 'password123', // Will be hashed by pre-save hook
                firstName: 'Super',
                lastName: 'Admin',
                role: 'Super Admin',
                organization: null // Super Admin doesn't belong to a client org
            });
            console.log('Super Admin seeded');
        }

    } catch (error) {
        console.error('Seeding error:', error);
    }
};

// Run seeding
seedSuperAdminAndPlans();

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

// @desc    Register a new user & organization
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
    const { email, password, organizationName, firstName, lastName, phone } = req.body;

    try {
        const userExists = await User.findOne({ email });

        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Create Organization
        const organization = await Organization.create({
            name: organizationName,
            contactEmail: email,
            contactPhone: phone,
        });

        // Create User
        const user = await User.create({
            email,
            password,
            firstName,
            lastName,
            phoneNumber: phone,
            organization: organization._id,
            role: 'Admin', // First user is always Admin (company owner)
        });

        if (user) {
            res.status(201).json({
                _id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                role: user.role,
                organizationName: organization.name,
                token: generateToken(user._id),
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const authUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email }).populate('organization');

        if (user && (await user.matchPassword(password))) {
            res.json({
                _id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                role: user.role,
                organizationName: user.organization ? user.organization.name : '',
                token: generateToken(user._id),
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
const getUserProfile = async (req, res) => {
    const user = await User.findById(req.user._id).populate('organization');

    if (user) {
        res.json({
            _id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            role: user.role,
            organizationName: user.organization ? user.organization.name : '',
        });
    } else {
        res.status(404).json({ message: 'User not found' });
    }
};

module.exports = { registerUser, authUser, getUserProfile };
