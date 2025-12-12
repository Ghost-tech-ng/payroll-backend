const Employee = require('../models/Employee');
const Activity = require('../models/Activity');

// @desc    Get HR Dashboard Reminders & Stats
// @route   GET /api/hr/reminders
// @access  Private
const getReminders = async (req, res) => {
    try {
        const organizationId = req.user.organization;

        // 1. Fetch all active employees for analysis
        const employees = await Employee.find({
            organization: organizationId,
            status: 'active'
        });

        // --- URGENT REMINDERS LOGIC ---
        const urgent = [];

        // Check for missing data
        const missingBankDetails = employees.filter(e => !e.bankDetails?.accountNumber).length;
        if (missingBankDetails > 0) {
            urgent.push({
                title: 'Missing Bank Details',
                description: `${missingBankDetails} employees missing bank account info`,
                type: 'danger',
                due: 'Immediate'
            });
        }

        const missingPension = employees.filter(e => !e.pensionPin).length;
        if (missingPension > 0) {
            urgent.push({
                title: 'Pension PINs Missing',
                description: `${missingPension} employees missing Pension PIN`,
                type: 'warning',
                due: 'Next Payroll'
            });
        }

        const missingNextOfKin = employees.filter(e => !e.nextOfKin?.fullName).length;
        if (missingNextOfKin > 0) {
            urgent.push({
                title: 'Next of Kin Missing',
                description: `${missingNextOfKin} employees missing Next of Kin`,
                type: 'warning',
                due: 'ASAP'
            });
        }

        // --- UPCOMING EVENTS LOGIC ---
        const upcoming = [];
        const today = new Date();
        const nextMonth = new Date();
        nextMonth.setMonth(today.getMonth() + 1);

        employees.forEach(emp => {
            if (emp.dateOfBirth) {
                const dob = new Date(emp.dateOfBirth);
                const birthdayThisYear = new Date(today.getFullYear(), dob.getMonth(), dob.getDate());

                // If birthday has passed this year, look at next year (edge case for Dec)
                if (birthdayThisYear < today) {
                    birthdayThisYear.setFullYear(today.getFullYear() + 1);
                }

                // Check if within next 30 days
                const diffTime = Math.abs(birthdayThisYear - today);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                if (diffDays <= 30) {
                    upcoming.push({
                        title: `${emp.firstName} ${emp.lastName}'s Birthday`,
                        description: `Turns ${today.getFullYear() - dob.getFullYear()} years old`,
                        date: birthdayThisYear,
                        type: 'birthday'
                    });
                }
            }

            if (emp.dateOfJoining) {
                const doj = new Date(emp.dateOfJoining);
                const anniversaryThisYear = new Date(today.getFullYear(), doj.getMonth(), doj.getDate());
                if (anniversaryThisYear < today) {
                    anniversaryThisYear.setFullYear(today.getFullYear() + 1);
                }
                const diffTime = Math.abs(anniversaryThisYear - today);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                if (diffDays <= 30) {
                    upcoming.push({
                        title: `${emp.firstName} ${emp.lastName}'s Work Anniversary`,
                        description: `Celebrates ${today.getFullYear() - doj.getFullYear()} year(s)`,
                        date: anniversaryThisYear,
                        type: 'anniversary'
                    });
                }
            }
        });

        // Sort upcoming by date
        upcoming.sort((a, b) => a.date - b.date);

        // --- COMPLIANCE STATS LOGIC ---
        // A simple "completeness" score based on key fields
        const totalEmployees = employees.length || 1; // Avoid division by zero

        const filesCompleted = employees.filter(e =>
            e.bankDetails?.accountNumber &&
            e.pensionPin &&
            e.nextOfKin?.fullName &&
            e.phoneNumber &&
            e.residentialAddress
        ).length;

        // Mocking training/certifications since we don't have those models yet
        // In a real app, this would query a TrainingProgress model
        const trainingCompleted = Math.floor(totalEmployees * 0.8);
        const certsValid = Math.floor(totalEmployees * 0.9);

        const compliance = {
            files: {
                completed: filesCompleted,
                total: totalEmployees
            },
            training: {
                completed: trainingCompleted,
                total: totalEmployees
            },
            certifications: {
                valid: certsValid,
                total: totalEmployees
            }
        };

        res.json({
            urgent,
            upcoming: upcoming.slice(0, 5), // Limit to top 5
            compliance
        });

    } catch (error) {
        console.error('Error fetching HR reminders:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = {
    getReminders
};
