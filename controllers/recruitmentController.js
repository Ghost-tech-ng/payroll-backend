const Job = require('../models/Job');
const Candidate = require('../models/Candidate');

// @desc    Get all jobs
// @route   GET /api/recruitment/jobs
// @access  Private
const getJobs = async (req, res) => {
    try {
        const jobs = await Job.find({ organization: req.user.organization }).sort({ createdAt: -1 });
        res.json(jobs);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Create a job
// @route   POST /api/recruitment/jobs
// @access  Private
const createJob = async (req, res) => {
    try {
        const job = await Job.create({
            organization: req.user.organization,
            ...req.body
        });
        res.status(201).json(job);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get all candidates
// @route   GET /api/recruitment/candidates
// @access  Private
const getCandidates = async (req, res) => {
    try {
        const candidates = await Candidate.find({ organization: req.user.organization }).sort({ createdAt: -1 });
        res.json(candidates);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Create a candidate
// @route   POST /api/recruitment/candidates
// @access  Private
const createCandidate = async (req, res) => {
    try {
        const candidate = await Candidate.create({
            organization: req.user.organization,
            ...req.body
        });
        res.status(201).json(candidate);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = {
    getJobs,
    createJob,
    getCandidates,
    createCandidate,
};
