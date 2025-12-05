const Attendance = require('../models/Attendance');

// @desc    Get all attendance records
// @route   GET /api/attendance
// @access  Private
const getAttendance = async (req, res) => {
    try {
        const attendance = await Attendance.find({ organization: req.user.organization }).sort({ createdAt: -1 });
        res.json(attendance);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Mark attendance
// @route   POST /api/attendance
// @access  Private
const markAttendance = async (req, res) => {
    const { employeeName, date, timeIn, timeOut, month, year, status, hoursWorked } = req.body;

    try {
        const attendance = new Attendance({
            organization: req.user.organization,
            employeeName,
            date,
            timeIn,
            timeOut,
            month,
            year,
            status,
            hoursWorked
        });

        const createdAttendance = await attendance.save();
        res.status(201).json(createdAttendance);
    } catch (error) {
        res.status(400).json({ message: 'Invalid attendance data' });
    }
};

module.exports = {
    getAttendance,
    markAttendance
};
