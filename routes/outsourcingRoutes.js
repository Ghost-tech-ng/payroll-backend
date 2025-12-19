const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const OutsourcingRequest = require('../models/OutsourcingRequest');
const axios = require('axios'); // Assuming axios is used for Paystack calls, or use a library

// @desc    Create a new outsourcing request
// @route   POST /api/outsourcing/request
// @access  Private
router.post('/request', protect, async (req, res) => {
    try {
        const { serviceId, serviceName, customerData, hasFiles } = req.body;

        const newRequest = new OutsourcingRequest({
            organization: req.user.organization,
            user: req.user._id,
            serviceId,
            serviceName,
            customerData,
            hasFiles
        });

        await newRequest.save();

        res.status(201).json({ message: 'Request submitted successfully', requestId: newRequest._id });
    } catch (error) {
        console.error('Error creating outsourcing request:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @desc    Get all requests (Admin only)
// @route   GET /api/outsourcing/requests
// @access  Private/Admin
router.get('/requests', protect, async (req, res) => {
    try {
        if (req.user.role !== 'Super Admin' && req.user.role !== 'Admin') {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const requests = await OutsourcingRequest.find()
            .populate('user', 'name email')
            .sort({ createdAt: -1 });
        res.json(requests);
    } catch (error) {
        console.error('Error fetching requests:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @desc    Get my requests
// @route   GET /api/outsourcing/my-requests
// @access  Private
router.get('/my-requests', protect, async (req, res) => {
    try {
        const requests = await OutsourcingRequest.find({ organization: req.user.organization })
            .sort({ createdAt: -1 });
        res.json(requests);
    } catch (error) {
        console.error('Error fetching my requests:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @desc    Initialize Payment for a Request
// @route   POST /api/outsourcing/pay
// @access  Private
router.post('/pay', protect, async (req, res) => {
    try {
        const { requestId } = req.body;
        const request = await OutsourcingRequest.findById(requestId);

        if (!request) {
            return res.status(404).json({ message: 'Request not found' });
        }

        if (request.organization.toString() !== req.user.organization.toString()) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        if (request.quoteAmount <= 0) {
            return res.status(400).json({ message: 'Quote not yet ready' });
        }

        // Initialize Paystack Transaction
        const paystackUrl = 'https://api.paystack.co/transaction/initialize';
        const secretKey = process.env.PAYSTACK_SECRET_KEY;

        // NOTE: In a real app, ensure PAYSTACK_SECRET_KEY is in .env
        // callback_url should handle the verification

        // Mocking Paystack for Development if no key
        if (!secretKey) {
            // Simulate successful initialization for dev
            return res.json({
                authorization_url: 'https://checkout.paystack.com/mock-checkout', // Placeholder
                access_code: 'mock_code_' + requestId,
                reference: 'ref_' + Date.now()
            });
        }

        const response = await axios.post(paystackUrl, {
            email: req.user.email,
            amount: request.quoteAmount * 100, // Paystack expects kobo
            reference: `OUT_${requestId}_${Date.now()}`,
            callback_url: `${process.env.CLIENT_URL || 'http://localhost:5173'}/outsourcing/callback`
        }, {
            headers: {
                Authorization: `Bearer ${secretKey}`,
                'Content-Type': 'application/json'
            }
        });

        res.json(response.data.data);

    } catch (error) {
        console.error('Payment initialization error:', error.response ? error.response.data : error.message);
        res.status(500).json({ message: 'Payment initialization failed' });
    }
});

// @desc    Update request status/quote (Admin only)
// @route   PUT /api/outsourcing/request/:id
// @access  Private/Admin
router.put('/request/:id', protect, async (req, res) => {
    try {
        if (req.user.role !== 'Super Admin' && req.user.role !== 'Admin') {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const { quoteAmount, status, notes } = req.body;
        const request = await OutsourcingRequest.findById(req.params.id);

        if (!request) {
            return res.status(404).json({ message: 'Request not found' });
        }

        if (quoteAmount !== undefined) request.quoteAmount = quoteAmount;
        if (status) request.status = status;
        // Optionally store notes if you added a notes field, otherwise ignore or add to schema

        await request.save();
        res.json(request);
    } catch (error) {
        console.error('Error updating request:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
