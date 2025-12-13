const Activity = require('../models/Activity');
const ROM = require('../models/ROM');
const Employee = require('../models/Employee');
const Organization = require('../models/Organization');

// @desc    Get all employees for an organization
// @route   GET /api/employees
// @access  Private
const getEmployees = async (req, res) => {
    try {
        // Only select essential fields to improve performance
        // Exclude large fields like photo, education, guarantors, workHistory
        const employees = await Employee.find({ organization: req.user.organization })
            .select('firstName lastName email phoneNumber role department designation dateOfJoining basicSalary allowances deductions bankDetails status')
            .lean(); // Use lean() for faster queries when we don't need Mongoose document methods
        res.json(employees);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get single employee
// @route   GET /api/employees/:id
// @access  Private
const getEmployeeById = async (req, res) => {
    try {
        const employee = await Employee.findById(req.params.id);

        if (employee && employee.organization.toString() === req.user.organization.toString()) {
            res.json(employee);
        } else {
            res.status(404).json({ message: 'Employee not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get employee ROMs
// @route   GET /api/employees/:id/rom
// @access  Private
const getEmployeeROMs = async (req, res) => {
    try {
        const roms = await ROM.find({ employee: req.params.id, organization: req.user.organization })
            .sort({ editedAt: -1 })
            .populate('editedBy', 'firstName lastName');
        res.json(roms);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create a new employee
// @route   POST /api/employees
// @access  Private
const createEmployee = async (req, res) => {
    const {
        firstName,
        lastName,
        email,
        phoneNumber,
        role,
        department,
        designation,
        dateOfJoining,
        basicSalary,
        allowances,
        deductions,
        bankDetails,
        gender,
        dateOfBirth,
        stateOfOrigin,
        maritalStatus,
        numberOfChildren,
        residentialAddress,
        jobDescription,
        employmentType,
        reportingManager,
        pensionPin,
        pensionCommencementDate,
        education,
        guarantors,
        nextOfKin,
        workHistory,
        photo
    } = req.body;

    try {
        // --- SUBSCRIPTION CHECK ---
        const organization = await Organization.findById(req.user.organization);

        // 1. Check if subscription is active
        if (!organization || organization.subscriptionStatus !== 'active') {
            // Allow 'trial' status? Let's say yes for now, or strict "active"
            if (organization.subscriptionStatus !== 'trial') {
                return res.status(403).json({ message: 'No active subscription. Please upgrade to add employees.' });
            }
        }

        // 2. Check dynamic plan limits
        const Plan = require('../models/Plan');
        let limit = 10; // Default fallback (e.g. Trial or Basic hardcoded fallback)

        // If they have a plan name
        if (organization.subscriptionPlan && organization.subscriptionPlan !== 'none') {
            const plan = await Plan.findOne({ name: organization.subscriptionPlan });
            if (plan) {
                limit = plan.maxEmployees;
            }
        }

        // Count current employees
        const currentCount = await Employee.countDocuments({ organization: req.user.organization });

        if (currentCount >= limit) {
            return res.status(403).json({
                message: `Plan limit reached (${limit} employees). Should you need more space, please contact the Super Admin or upgrade your plan.`
            });
        }
        // ---------------------------

        // ---------------------------

        // 3. Storage & File Size Check for Passport Photo
        let photoSize = 0;
        if (photo && photo.startsWith('data:image/')) {
            // Calculate size in bytes (approx)
            photoSize = Math.ceil(photo.length * 0.75);

            // Check max size (100KB)
            if (photoSize > 102400) { // 100KB
                return res.status(400).json({
                    message: `Passport photo too large (${Math.round(photoSize / 1024)}KB). Maximum allowed is 100KB.`
                });
            }

            // Check organization storage limit
            const currentStorage = organization.storageUsed || 0;
            const limit = organization.storageLimit || 1073741824; // 1GB default

            if (currentStorage + photoSize > limit) {
                return res.status(403).json({
                    message: 'Storage limit exceeded. Cannot upload photo.'
                });
            }

            // Update storage used
            organization.storageUsed = currentStorage + photoSize;
            await organization.save();
        }

        const employee = new Employee({
            organization: req.user.organization,
            firstName,
            lastName,
            email,
            phoneNumber,
            role,
            department,
            designation,
            dateOfJoining,
            basicSalary,
            allowances,
            deductions,
            bankDetails,
            gender,
            dateOfBirth,
            stateOfOrigin,
            maritalStatus,
            numberOfChildren,
            residentialAddress,
            jobDescription,
            employmentType,
            reportingManager,
            pensionPin,
            pensionCommencementDate,
            education,
            guarantors,
            nextOfKin,
            workHistory,
            photo
        });

        const createdEmployee = await employee.save();

        // Log Activity
        await Activity.create({
            organization: req.user.organization,
            user: req.user._id,
            action: 'CREATE',
            description: `Created employee: ${firstName} ${lastName}`,
            entityType: 'Employee',
            entityId: createdEmployee._id
        });

        res.status(201).json(createdEmployee);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Update employee
// @route   PUT /api/employees/:id
// @access  Private
const updateEmployee = async (req, res) => {
    try {
        const employee = await Employee.findById(req.params.id);

        if (employee && employee.organization.toString() === req.user.organization.toString()) {
            // Capture changes for ROM
            const changes = [];
            for (const key in req.body) {
                if (req.body.hasOwnProperty(key) && key !== 'reason' && JSON.stringify(employee[key]) !== JSON.stringify(req.body[key])) {
                    changes.push(`${key}: ${employee[key]} -> ${req.body[key]}`);
                }
            }

            // ---------------------------
            // Storage & File Size Check for Passport Photo Update
            if (req.body.photo && req.body.photo !== employee.photo && req.body.photo.startsWith('data:image/')) {
                // Calculate size in bytes (approx)
                const photoSize = Math.ceil(req.body.photo.length * 0.75);

                // Check max size (100KB)
                if (photoSize > 102400) { // 100KB
                    return res.status(400).json({
                        message: `Passport photo too large (${Math.round(photoSize / 1024)}KB). Maximum allowed is 100KB.`
                    });
                }

                // Check organization storage limit
                const organization = await Organization.findById(req.user.organization);
                const currentStorage = organization.storageUsed || 0;
                const limit = organization.storageLimit || 1073741824; // 1GB default

                if (currentStorage + photoSize > limit) {
                    return res.status(403).json({
                        message: 'Storage limit exceeded. Cannot upload photo.'
                    });
                }

                // Update storage used (Improvement: Subtract old if possible, but for now just add new usage)
                organization.storageUsed = currentStorage + photoSize;
                await organization.save();
            }
            // ---------------------------

            Object.assign(employee, req.body);
            const updatedEmployee = await employee.save();

            // Create ROM if there are changes and a reason is provided (or just log it)
            if (changes.length > 0) {
                await ROM.create({
                    organization: req.user.organization,
                    employee: employee._id,
                    editedBy: req.user._id,
                    reason: req.body.reason || 'Update details',
                    changes: changes.join(', ')
                });

                // Log Activity
                await Activity.create({
                    organization: req.user.organization,
                    user: req.user._id,
                    action: 'UPDATE',
                    description: `Updated employee: ${employee.firstName} ${employee.lastName}`,
                    entityType: 'Employee',
                    entityId: employee._id
                });
            }

            res.json(updatedEmployee);
        } else {
            res.status(404).json({ message: 'Employee not found' });
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Delete employee
// @route   DELETE /api/employees/:id
// @access  Private
const deleteEmployee = async (req, res) => {
    try {
        const employee = await Employee.findById(req.params.id);

        if (employee && employee.organization.toString() === req.user.organization.toString()) {
            const name = `${employee.firstName} ${employee.lastName}`;
            await employee.deleteOne();

            // Log Activity
            await Activity.create({
                organization: req.user.organization,
                user: req.user._id,
                action: 'DELETE',
                description: `Deleted employee: ${name}`,
                entityType: 'Employee',
                entityId: req.params.id
            });

            res.json({ message: 'Employee removed' });
        } else {
            res.status(404).json({ message: 'Employee not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getEmployees,
    getEmployeeById,
    getEmployeeROMs,
    createEmployee,
    updateEmployee,
    deleteEmployee,
};
