const Performance = require('../models/Performance');
const { TrainingProgram, TrainingEvent } = require('../models/Training');

// Performance Controllers
const getPerformances = async (req, res) => {
    try {
        const performances = await Performance.find({ organization: req.user.organization }).sort({ createdAt: -1 });
        res.json(performances);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

const createPerformance = async (req, res) => {
    try {
        const performance = await Performance.create({
            organization: req.user.organization,
            ...req.body
        });
        res.status(201).json(performance);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// Training Controllers
const getTrainingPrograms = async (req, res) => {
    try {
        const programs = await TrainingProgram.find({ organization: req.user.organization }).sort({ createdAt: -1 });
        res.json(programs);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

const createTrainingProgram = async (req, res) => {
    try {
        const program = await TrainingProgram.create({
            organization: req.user.organization,
            ...req.body
        });
        res.status(201).json(program);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

const getTrainingEvents = async (req, res) => {
    try {
        const events = await TrainingEvent.find({ organization: req.user.organization }).sort({ date: 1 });
        res.json(events);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

const createTrainingEvent = async (req, res) => {
    try {
        const event = await TrainingEvent.create({
            organization: req.user.organization,
            ...req.body
        });
        res.status(201).json(event);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

const getReminders = async (req, res) => {
    try {
        const organizationId = req.user.organization;

        // 1. Get upcoming training events (next 30 days)
        const next30Days = new Date();
        next30Days.setDate(next30Days.getDate() + 30);

        const upcomingEvents = await TrainingEvent.find({
            organization: organizationId,
            date: { $gte: new Date(), $lte: next30Days }
        }).sort({ date: 1 }).limit(5);

        // 2. Get pending performance reviews
        const pendingReviews = await Performance.countDocuments({
            organization: organizationId,
            status: { $in: ['Draft', 'Pending'] }
        });

        // 3. Contract expiry (Mock for now as we don't have explicit contract end date in Employee model yet)
        // In a real app, we would query Employee.find({ contractEndDate: ... })
        const contractExpiryCount = 0;

        res.json({
            urgent: [
                {
                    title: 'Performance Reviews',
                    description: `${pendingReviews} reviews pending`,
                    due: 'Action Required',
                    type: 'warning'
                },
                {
                    title: 'Contract Expiry',
                    description: `${contractExpiryCount} employees' contracts expire soon`,
                    due: 'This Month',
                    type: 'danger'
                }
            ],
            upcoming: upcomingEvents.map(event => ({
                title: event.title,
                description: event.type,
                date: event.date,
                type: 'info'
            })),
            compliance: {
                files: { completed: 18, total: 20 }, // Mock
                training: { completed: 16, total: 20 }, // Mock
                certifications: { valid: 15, total: 20 } // Mock
            }
        });
    } catch (error) {
        console.error('Error fetching HR reminders:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = {
    getPerformances,
    createPerformance,
    getTrainingPrograms,
    createTrainingProgram,
    getTrainingEvents,
    createTrainingEvent,
    getReminders,
};
