const axios = require('axios');
const Organization = require('../models/Organization');
const Plan = require('../models/Plan');

// @desc    Initialize subscription payment
// @route   POST /api/subscription/initialize
// @access  Private
const initializeSubscription = async (req, res) => {
    const { plan, email } = req.body;

    try {
        // Fetch plan from database
        const selectedPlan = await Plan.findOne({ name: plan });

        if (!selectedPlan) {
            return res.status(400).json({ message: 'Invalid plan selected' });
        }

        // Initialize Paystack transaction
        const response = await axios.post(
            'https://api.paystack.co/transaction/initialize',
            {
                email,
                amount: selectedPlan.price * 100, // Convert to kobo
                callback_url: `${process.env.FRONTEND_URL}/subscription/verify`,
                metadata: {
                    organization_id: req.user.organization.toString(),
                    user_id: req.user._id.toString(),
                    plan: selectedPlan.name,
                    plan_name: selectedPlan.name,
                    plan_id: selectedPlan._id.toString(),
                },
            },
            {
                headers: {
                    Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        res.json({
            authorization_url: response.data.data.authorization_url,
            access_code: response.data.data.access_code,
            reference: response.data.data.reference,
        });
    } catch (error) {
        console.error('Paystack initialization error:', error.response?.data || error.message);
        res.status(500).json({ message: 'Failed to initialize payment' });
    }
};

// @desc    Verify subscription payment
// @route   GET /api/subscription/verify/:reference
// @access  Private
const verifySubscription = async (req, res) => {
    const { reference } = req.params;

    try {
        // Verify transaction with Paystack
        const response = await axios.get(
            `https://api.paystack.co/transaction/verify/${reference}`,
            {
                headers: {
                    Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
                },
            }
        );

        const { status, metadata } = response.data.data;

        if (status === 'success') {
            // Update organization subscription
            const organization = await Organization.findById(metadata.organization_id);

            organization.subscriptionStatus = 'active';
            organization.subscriptionPlan = metadata.plan;
            organization.subscriptionExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

            await organization.save();

            res.json({
                success: true,
                message: 'Subscription activated successfully',
                organization,
            });
        } else {
            res.status(400).json({ success: false, message: 'Payment verification failed' });
        }
    } catch (error) {
        console.error('Payment verification error:', error.response?.data || error.message);
        res.status(500).json({ message: 'Failed to verify payment' });
    }
};

// @desc    Get subscription status
// @route   GET /api/subscription
// @access  Private
const getSubscription = async (req, res) => {
    try {
        const organization = await Organization.findById(req.user.organization);

        res.json({
            status: organization.subscriptionStatus || 'trial',
            plan: organization.subscriptionPlan || 'none',
            expiresAt: organization.subscriptionExpiresAt,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    initializeSubscription,
    verifySubscription,
    getSubscription,
};
