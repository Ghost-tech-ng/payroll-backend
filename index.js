const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');

dotenv.config();

connectDB();

const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' })); // Increased limit for base64 images
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.get('/', (req, res) => {
    res.send('API is running...');
});

// Routes
const authRoutes = require('./routes/authRoutes');
const employeeRoutes = require('./routes/employeeRoutes');
const payrollRoutes = require('./routes/payrollRoutes');
const walletRoutes = require('./routes/walletRoutes');
const subscriptionRoutes = require('./routes/subscriptionRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const organizationRoutes = require('./routes/organizationRoutes');
const pensionRoutes = require('./routes/pensionRoutes');
const recruitmentRoutes = require('./routes/recruitmentRoutes');
const hrRoutes = require('./routes/hrRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const machineRoutes = require('./routes/machineRoutes');

const superAdminRoutes = require('./routes/superAdminRoutes');
const { getPlans } = require('./controllers/superAdminController');

// Public route for plans
app.get('/api/plans', getPlans);

app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/payroll', payrollRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/subscription', subscriptionRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/pension', pensionRoutes);
app.use('/api/recruitment', recruitmentRoutes);
app.use('/api/hr', hrRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/outsourcing', require('./routes/outsourcingRoutes'));
app.use('/api/organizations', require('./routes/organizationRoutes'));
app.use('/api/machine', machineRoutes);
app.use('/api/super-admin', superAdminRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
