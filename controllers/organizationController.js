const Organization = require('../models/Organization');

// @desc    Get organization profile
// @route   GET /api/organization
// @access  Private
const getOrganization = async (req, res) => {
    try {
        const organization = await Organization.findById(req.user.organization);
        res.json(organization);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Update organization profile
// @route   PUT /api/organization
// @access  Private
const updateOrganization = async (req, res) => {
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

            // Update statutory settings
            if (req.body.employerPension) organization.employerPension = req.body.employerPension;
            if (req.body.employerNHIS) organization.employerNHIS = req.body.employerNHIS;
            if (req.body.employerECS) organization.employerECS = req.body.employerECS;
            if (req.body.employerITF) organization.employerITF = req.body.employerITF;
            if (req.body.payeEnabled !== undefined) organization.payeEnabled = req.body.payeEnabled;

            const updatedOrganization = await organization.save();
            res.json(updatedOrganization);
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
};
