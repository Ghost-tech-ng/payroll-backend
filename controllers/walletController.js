const Wallet = require('../models/Wallet');
const axios = require('axios');

// @desc    Get wallet balance
// @route   GET /api/wallet
// @access  Private
const getWallet = async (req, res) => {
    try {
        let wallet = await Wallet.findOne({ organization: req.user.organization });

        // Create wallet if it doesn't exist
        if (!wallet) {
            wallet = await Wallet.create({
                organization: req.user.organization,
                balance: 0,
                transactions: [],
            });
        }

        res.json(wallet);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Initialize Paystack payment
// @route   POST /api/wallet/fund
// @access  Private
const initializeFunding = async (req, res) => {
    const { amount, email } = req.body;

    try {
        // Initialize Paystack transaction
        const response = await axios.post(
            'https://api.paystack.co/transaction/initialize',
            {
                email,
                amount: amount * 100, // Convert to kobo
                callback_url: `${process.env.FRONTEND_URL}/wallet/verify`,
                metadata: {
                    organization_id: req.user.organization.toString(),
                    user_id: req.user._id.toString(),
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

// @desc    Verify Paystack payment
// @route   GET /api/wallet/verify/:reference
// @access  Private
const verifyPayment = async (req, res) => {
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

        const { status, amount, metadata } = response.data.data;

        if (status === 'success') {
            // Update wallet
            const wallet = await Wallet.findOne({ organization: metadata.organization_id });

            const amountInNaira = amount / 100;
            wallet.balance += amountInNaira;
            wallet.transactions.push({
                type: 'credit',
                amount: amountInNaira,
                description: 'Wallet funding via Paystack',
                reference,
                status: 'success',
            });

            await wallet.save();

            res.json({
                success: true,
                message: 'Payment verified successfully',
                wallet,
            });
        } else {
            res.status(400).json({ success: false, message: 'Payment verification failed' });
        }
    } catch (error) {
        console.error('Payment verification error:', error.response?.data || error.message);
        res.status(500).json({ message: 'Failed to verify payment' });
    }
};

// @desc    Get wallet transactions
// @route   GET /api/wallet/transactions
// @access  Private
const getTransactions = async (req, res) => {
    try {
        const wallet = await Wallet.findOne({ organization: req.user.organization });

        if (!wallet) {
            return res.json({ transactions: [] });
        }

        res.json({ transactions: wallet.transactions });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getWallet,
    initializeFunding,
    verifyPayment,
    getTransactions,
};
