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

// @desc    Pay for subscription using wallet balance
// @route   POST /api/subscription/pay-with-wallet
// @access  Private
const payWithWallet = async (req, res) => {
    const { plan } = req.body;

    try {
        // Fetch plan from database
        const selectedPlan = await Plan.findOne({ name: plan });

        if (!selectedPlan) {
            return res.status(400).json({ message: 'Invalid plan selected' });
        }

        // Get user's wallet
        const Wallet = require('../models/Wallet');
        let wallet = await Wallet.findOne({ organization: req.user.organization });

        if (!wallet) {
            return res.status(400).json({ 
                message: 'Wallet not found. Please fund your wallet first.',
                insufficientBalance: true 
            });
        }

        // Check if wallet has sufficient balance
        if (wallet.balance < selectedPlan.price) {
            return res.status(400).json({ 
                message: `Insufficient wallet balance. Required: ₦${selectedPlan.price.toLocaleString()}, Available: ₦${wallet.balance.toLocaleString()}`,
                insufficientBalance: true,
                required: selectedPlan.price,
                available: wallet.balance
            });
        }

        // Deduct amount from wallet
        wallet.balance -= selectedPlan.price;
        
        // Add transaction record
        wallet.transactions.push({
            type: 'debit',
            amount: selectedPlan.price,
            description: `Subscription payment for ${selectedPlan.name} plan`,
            reference: `SUB-${Date.now()}`,
            status: 'success',
        });

        await wallet.save();

        // Update organization subscription
        const organization = await Organization.findById(req.user.organization);
        organization.subscriptionStatus = 'active';
        organization.subscriptionPlan = selectedPlan.name;
        organization.subscriptionExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

        await organization.save();

        res.json({
            success: true,
            message: 'Subscription activated successfully using wallet balance',
            organization,
            wallet: {
                balance: wallet.balance,
                amountDeducted: selectedPlan.price
            }
        });
    } catch (error) {
        console.error('Wallet payment error:', error);
        res.status(500).json({ message: 'Failed to process wallet payment' });
    }
};

module.exports = {
    initializeSubscription,
    verifySubscription,
    getSubscription,
    payWithWallet,
};
