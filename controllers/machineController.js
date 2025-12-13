const Organization = require('../models/Organization');
const Employee = require('../models/Employee');
const Attendance = require('../models/Attendance');
const moment = require('moment'); // Assuming moment is available, or use native Date

// Handle push from attendance machine
const pushAttendance = async (req, res) => {
    try {
        const { apiKey, biometricId, timestamp, status, deviceId } = req.body;

        // 1. Validate Organization API Key
        const organization = await Organization.findOne({ apiKey });
        if (!organization) {
            return res.status(401).json({ message: 'Invalid API Key' });
        }

        // 2. Find Employee
        const employee = await Employee.findOne({
            organization: organization._id,
            biometricId: biometricId
        });

        if (!employee) {
            return res.status(404).json({ message: `Employee with Biometric ID ${biometricId} not found` });
        }

        // 3. Parse Date and Time
        // timestamp format from machines varies, assuming ISO or 'YYYY-MM-DD HH:mm:ss'
        const dateObj = moment(timestamp);
        const dateStr = dateObj.format('YYYY-MM-DD');
        const timeStr = dateObj.format('HH:mm');
        const month = dateObj.format('MMMM');
        const year = dateObj.format('YYYY');

        // 4. Check for existing attendance record for this day
        let attendance = await Attendance.findOne({
            organization: organization._id,
            employeeName: `${employee.firstName} ${employee.lastName}`,
            date: dateStr
        });

        // 5. Logic for Clock In / Out
        // If no record exists, creating new record (Clock In)
        if (!attendance) {
            attendance = new Attendance({
                organization: organization._id,
                employeeName: `${employee.firstName} ${employee.lastName}`,
                date: dateStr,
                timeIn: timeStr,
                timeOut: '-', // Placeholder
                month: month,
                year: year,
                status: 'Present',
                source: 'Machine',
                deviceId: deviceId || 'Unknown'
            });
            await attendance.save();
            return res.status(200).json({ message: 'Clock In Successful', employee: employee.firstName });
        } else {
            // If record exists, update Time Out (Clock Out)
            // Only update if the new time is later than timeIn
            if (attendance.timeOut === '-' || timeStr > attendance.timeOut) {
                attendance.timeOut = timeStr;

                // Calculate hours worked
                const start = moment(`${dateStr} ${attendance.timeIn}`, 'YYYY-MM-DD HH:mm');
                const end = moment(`${dateStr} ${timeStr}`, 'YYYY-MM-DD HH:mm');
                const duration = moment.duration(end.diff(start));
                attendance.hoursWorked = parseFloat(duration.asHours().toFixed(2));

                await attendance.save();
                return res.status(200).json({ message: 'Clock Out Successful', employee: employee.firstName });
            } else {
                return res.status(200).json({ message: 'Attendance already logged', employee: employee.firstName });
            }
        }

    } catch (error) {
        console.error("Machine Push Error:", error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

module.exports = {
    pushAttendance
};
