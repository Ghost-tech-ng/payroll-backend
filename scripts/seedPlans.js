const mongoose = require('mongoose');
const Plan = require('../models/Plan');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const plans = [
    {
        name: 'Basic',
        price: 8000,
        maxEmployees: 5,
        description: 'Essential features for micro businesses',
        features: [
            'Up to 5 employees',
            'Basic payroll only',
            'Simple employee records',
            'Basic reports',
            'Email support only'
        ],
        color: 'bg-gray-500',
        popular: false
    },
    {
        name: 'Starter',
        price: 15000,
        maxEmployees: 10,
        description: 'Perfect for small businesses just getting started',
        features: [
            'Up to 10 employees',
            'Basic payroll processing',
            'Employee records management',
            'Basic attendance tracking',
            'Email support',
            'Monthly reports'
        ],
        color: 'bg-blue-500',
        popular: false
    },
    {
        name: 'Professional',
        price: 35000,
        maxEmployees: 50,
        description: 'Ideal for growing businesses with advanced needs',
        features: [
            'Up to 50 employees',
            'Advanced payroll processing',
            'Full HR management suite',
            'Advanced attendance & leave management',
            'Performance evaluation tools',
            'Priority email & phone support',
            'Custom reports & analytics',
            'Tax calculations & filing'
        ],
        color: 'bg-green-500',
        popular: true
    },
    {
        name: 'Enterprise',
        price: 75000,
        maxEmployees: 200,
        description: 'Comprehensive solution for large organizations',
        features: [
            'Up to 200 employees',
            'Complete payroll & HR suite',
            'Multi-location management',
            'Advanced reporting & analytics',
            'API integrations',
            'Dedicated account manager',
            '24/7 priority support',
            'Custom workflows',
            'Compliance management'
        ],
        color: 'bg-purple-500',
        popular: false
    },
    {
        name: 'Premium',
        price: 120000,
        maxEmployees: 500,
        description: 'Premium features for established enterprises',
        features: [
            'Up to 500 employees',
            'All Professional features',
            'Advanced analytics dashboard',
            'Multi-currency support',
            'Advanced security features',
            'Custom branding',
            'Dedicated support team',
            'Training & consultation'
        ],
        color: 'bg-indigo-500',
        popular: false
    },
    {
        name: 'Unlimited',
        price: 150000,
        maxEmployees: 999999,
        description: 'No limits solution for enterprise corporations',
        features: [
            'Unlimited employees',
            'All Enterprise features',
            'White-label solution',
            'Custom integrations',
            'On-premise deployment option',
            'Dedicated infrastructure',
            'Custom training & onboarding',
            'SLA guarantees'
        ],
        color: 'bg-yellow-500',
        popular: false
    }
];

const seedPlans = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB connected...');

        // Clear existing plans
        await Plan.deleteMany({});
        console.log('Existing plans cleared.');

        // Insert new plans
        const createdPlans = await Plan.insertMany(plans);
        console.log(`${createdPlans.length} plans created successfully:`);
        createdPlans.forEach(plan => {
            console.log(`  - ${plan.name}: ₦${plan.price.toLocaleString()}/month (${plan.maxEmployees} employees)`);
        });

        process.exit(0);
    } catch (error) {
        console.error('Error seeding plans:', error);
        process.exit(1);
    }
};

seedPlans();
