const Organization = require('../models/Organization');

// @desc    Get organization profile
// @route   GET /api/organization
// @access  Private
const getOrganization = async (req, res) => {
    try {
        const organization = await Organization.findById(req.user.organization).select('+apiKey');
        res.json(organization);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Update organization profile
// @route   PUT /api/organization
// @access  Private
const updateOrganization = async (req, res) => {
    console.log('=== Update Organization Request ===');
    console.log('User ID:', req.user._id);
    console.log('Organization ID from User:', req.user.organization);
    console.log('Request Body:', req.body);

    try {
        const organization = await Organization.findById(req.user.organization);

        if (organization) {
            organization.name = req.body.name || organization.name;
            organization.email = req.body.email || organization.email;
            organization.phone = req.body.phone || organization.phone;
            organization.address = req.body.address || organization.address;
            organization.website = req.body.website || organization.website;
            organization.logo = req.body.logo || organization.logo;
            organization.tin = req.body.tin || organization.tin;

            // Update settings if provided
            if (req.body.payrollFrequency) organization.payrollFrequency = req.body.payrollFrequency;
            if (req.body.payDay) organization.payDay = req.body.payDay;

            // Update salary components
            console.log('📥 Received salaryComponents:', req.body.salaryComponents);
            if (req.body.salaryComponents !== undefined) organization.salaryComponents = req.body.salaryComponents;

            // Update statutory settings - check for undefined to allow false/disabled values
            console.log('📥 Received employerPension:', req.body.employerPension);
            console.log('📥 Received employerNHIS:', req.body.employerNHIS);
            console.log('📥 Received employerECS:', req.body.employerECS);
            console.log('📥 Received employerITF:', req.body.employerITF);

            if (req.body.employerPension !== undefined) organization.employerPension = req.body.employerPension;
            if (req.body.employerNHIS !== undefined) organization.employerNHIS = req.body.employerNHIS;
            if (req.body.employerECS !== undefined) organization.employerECS = req.body.employerECS;
            if (req.body.employerITF !== undefined) organization.employerITF = req.body.employerITF;
            if (req.body.lifeAssurance !== undefined) organization.lifeAssurance = req.body.lifeAssurance;
            if (req.body.employeeStatutoryDeductions !== undefined) organization.employeeStatutoryDeductions = req.body.employeeStatutoryDeductions;
            if (req.body.payeEnabled !== undefined) organization.payeEnabled = req.body.payeEnabled;
            // Update storage tracking if needed (usually handled by system, not user update)

            const updatedOrganization = await organization.save();
            console.log('✅ Organization updated successfully:', updatedOrganization.name);
            console.log('💾 Saved employerPension:', updatedOrganization.employerPension);
            console.log('💾 Saved employerNHIS:', updatedOrganization.employerNHIS);
            console.log('💾 Saved employerECS:', updatedOrganization.employerECS);
            console.log('💾 Saved employerITF:', updatedOrganization.employerITF);
            res.json(updatedOrganization);
        } else {
            console.warn('Organization not found for ID:', req.user.organization);
            res.status(404).json({ message: 'Organization not found' });
        }
    } catch (error) {
        console.error('Error updating organization:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

const crypto = require('crypto');

// @desc    Generate new API Key for Organization
// @route   POST /api/organizations/api-key
// @access  Private (Admin only)
const generateApiKey = async (req, res) => {
    try {
        const organization = await Organization.findById(req.user.organization);

        if (organization) {
            // Generate random 32-char hex string
            const apiKey = crypto.randomBytes(16).toString('hex');
            organization.apiKey = apiKey;
            await organization.save();
            res.json({ apiKey });
        } else {
            res.status(404).json({ message: 'Organization not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = {
    getOrganization,
    updateOrganization,
    generateApiKey
};
