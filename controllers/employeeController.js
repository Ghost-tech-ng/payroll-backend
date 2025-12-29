const Activity = require('../models/Activity');
const ROM = require('../models/ROM');
const Employee = require('../models/Employee');
const Organization = require('../models/Organization');

// @desc    Get all employees for an organization (Active by default, Trash optional)
// @route   GET /api/employees
// @access  Private
const getEmployees = async (req, res) => {
    try {
        const { trash } = req.query;

        const filter = {
            organization: req.user.organization
        };

        if (trash === 'true') {
            filter.isDeleted = true;
        } else {
            // Default: Show active employees (isDeleted is false OR undefined)
            filter.isDeleted = { $ne: true };
        }

        // Select essential fields including photo and isDeleted
        const employees = await Employee.find(filter)
            .select('firstName lastName email phoneNumber role department designation dateOfJoining basicSalary allowances deductions bankDetails status photo biometricId gender dateOfBirth stateOfOrigin maritalStatus numberOfChildren residentialAddress employmentType jobDescription reportingManager nextOfKin education guarantors workHistory pensionPin pensionPFA pensionCommencementDate isDeleted')
            .lean();
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
        pensionPFA,
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
        let planName = organization.subscriptionPlan || 'Trial';

        // If they have a plan name
        if (organization.subscriptionPlan && organization.subscriptionPlan !== 'none') {
            const plan = await Plan.findOne({ name: organization.subscriptionPlan });
            if (plan) {
                limit = plan.maxEmployees;
                planName = plan.name;
            }
        }

        // Count current employees
        const currentCount = await Employee.countDocuments({ organization: req.user.organization });

        if (currentCount >= limit) {
            return res.status(403).json({
                message: `Employee limit reached. Your ${planName} plan allows up to ${limit} employees. You currently have ${currentCount} employees. Please upgrade your subscription to add more employees.`,
                currentCount: currentCount,
                maxAllowed: limit,
                planName: planName
            });
        }
        // ---------------------------

        // ---------------------------

        // 3. Storage & File Size Check for Passport Photo
        let photoSize = 0;
        if (photo && photo.startsWith('data:image/')) {
            // Calculate size in bytes (approx)
            photoSize = Math.ceil(photo.length * 0.75);

            // Check max size (500KB)
            if (photoSize > 512000) { // 500KB
                return res.status(400).json({
                    message: `Passport photo too large (${Math.round(photoSize / 1024)}KB). Maximum allowed is 500KB.`
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

        // 4. Check for duplicate email
        const existingEmployee = await Employee.findOne({ email: email.toLowerCase().trim() });
        if (existingEmployee) {
            return res.status(400).json({
                message: 'This email is already registered. Please use a different email address.'
            });
        }

        // 5. Validate Array Limits (Max 4)
        if (education && education.length > 4) {
            return res.status(400).json({ message: 'Maximum of 4 education records allowed.' });
        }
        if (guarantors && guarantors.length > 4) {
            return res.status(400).json({ message: 'Maximum of 4 guarantors allowed.' });
        }
        if (workHistory && workHistory.length > 4) {
            return res.status(400).json({ message: 'Maximum of 4 work history records allowed.' });
        }

        // Initialize statutory deductions from employer defaults
        const statutoryDeductions = {
            pension: {
                enabled: organization.employeeStatutoryDeductions?.pension?.enabled ?? true,
                percentage: 8
            },
            nhf: {
                enabled: organization.employeeStatutoryDeductions?.nhf?.enabled ?? true,
                percentage: 2.5
            },
            nhis: {
                enabled: organization.employeeStatutoryDeductions?.nhis?.enabled ?? true,
                percentage: 5
            },
            voluntaryPension: {
                enabled: organization.employeeStatutoryDeductions?.voluntaryPension?.enabled ?? false,
                amount: 0
            },
            profUnionDues: {
                enabled: organization.employeeStatutoryDeductions?.profUnionDues?.enabled ?? false,
                amount: 0
            }
        };

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
            statutoryDeductions, // Initialize from employer defaults
            payeEnabled: organization.payeEnabled || false, // Initialize from employer default
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
            pensionPFA,
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
            // Define fields to exclude from ROM (frontend-only or redundant fields)
            const excludeFields = [
                'reason', 'fullName', 'position', 'startDate', 'monthlySalary',
                'employmentStatus', 'accountName', 'accountNumber', 'bankName',
                'createdAt', 'updatedAt', '__v', '_id', 'organization'
            ];

            // Map database fields to human-readable labels
            const fieldLabels = {
                firstName: 'First Name',
                lastName: 'Last Name',
                email: 'Email',
                phoneNumber: 'Phone Number',
                role: 'Role',
                department: 'Department',
                designation: 'Designation',
                dateOfJoining: 'Date of Joining',
                basicSalary: 'Basic Salary',
                gender: 'Gender',
                dateOfBirth: 'Date of Birth',
                stateOfOrigin: 'State of Origin',
                maritalStatus: 'Marital Status',
                numberOfChildren: 'Number of Children',
                residentialAddress: 'Residential Address',
                jobDescription: 'Job Description',
                employmentType: 'Employment Type',
                reportingManager: 'Reporting Manager',
                pensionPin: 'Pension PIN',
                status: 'Status',
                photo: 'Photo'
            };

            const changes = [];
            for (const key in req.body) {
                if (req.body.hasOwnProperty(key) && !excludeFields.includes(key)) {
                    const oldValue = employee[key];
                    const newValue = req.body[key];

                    // Skip if both are undefined/null/empty
                    if (!oldValue && !newValue) continue;

                    // Simple equality check (works for primitives)
                    // For objects/arrays, we might want to be smarter, but basic JSON stringify check works for now
                    if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
                        const label = fieldLabels[key] || key;
                        let oldValStr = oldValue;
                        let newValStr = newValue;

                        // Format dates
                        if (key === 'dateOfJoining' || key === 'dateOfBirth') {
                            oldValStr = oldValue ? new Date(oldValue).toISOString().split('T')[0] : 'Not Set';
                            newValStr = newValue ? new Date(newValue).toISOString().split('T')[0] : 'Not Set';
                        }

                        // Handle undefined/null
                        if (oldValStr === undefined || oldValStr === null) oldValStr = 'Not Set';
                        if (newValStr === undefined || newValStr === null) newValStr = 'Not Set';

                        changes.push(`${label}: ${oldValStr} -> ${newValStr}`);
                    }
                }
            }

            // Validate Array Limits for Updates
            if (req.body.education && req.body.education.length > 4) {
                return res.status(400).json({ message: 'Maximum of 4 education records allowed.' });
            }
            if (req.body.guarantors && req.body.guarantors.length > 4) {
                return res.status(400).json({ message: 'Maximum of 4 guarantors allowed.' });
            }
            if (req.body.workHistory && req.body.workHistory.length > 4) {
                return res.status(400).json({ message: 'Maximum of 4 work history records allowed.' });
            }

            // ---------------------------
            // Storage & File Size Check for Passport Photo Update
            if (req.body.photo && req.body.photo !== employee.photo && req.body.photo.startsWith('data:image/')) {
                // Calculate size in bytes (approx)
                const photoSize = Math.ceil(req.body.photo.length * 0.75);

                // Check max size (500KB)
                if (photoSize > 512000) { // 500KB
                    return res.status(400).json({
                        message: `Passport photo too large (${Math.round(photoSize / 1024)}KB). Maximum allowed is 500KB.`
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

            // Soft Delete
            employee.isDeleted = true;
            employee.status = 'inactive';
            await employee.save();

            // Log Activity
            await Activity.create({
                organization: req.user.organization,
                user: req.user._id,
                action: 'DELETE',
                description: `Moved employee to trash: ${name}`,
                entityType: 'Employee',
                entityId: req.params.id
            });

            res.json({ message: 'Employee moved to trash' });
        } else {
            res.status(404).json({ message: 'Employee not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Restore employee
// @route   PUT /api/employees/:id/restore
// @access  Private
const restoreEmployee = async (req, res) => {
    try {
        const employee = await Employee.findById(req.params.id);

        if (employee && employee.organization.toString() === req.user.organization.toString()) {
            if (!employee.isDeleted) {
                return res.status(400).json({ message: 'Employee is not in trash' });
            }

            const name = `${employee.firstName} ${employee.lastName}`;

            // Restore
            employee.isDeleted = false;
            employee.status = 'active'; // Restore to active
            await employee.save();

            // Log Activity
            await Activity.create({
                organization: req.user.organization,
                user: req.user._id,
                action: 'UPDATE', // Log as update/restore
                description: `Restored employee from trash: ${name}`,
                entityType: 'Employee',
                entityId: req.params.id
            });

            res.json({ message: 'Employee restored successfully' });
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
    restoreEmployee
};
