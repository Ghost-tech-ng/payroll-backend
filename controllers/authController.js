const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Organization = require('../models/Organization');

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
