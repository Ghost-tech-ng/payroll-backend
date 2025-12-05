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
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/employees', require('./routes/employeeRoutes'));
app.use('/api/payroll', require('./routes/payrollRoutes'));
app.use('/api/wallet', require('./routes/walletRoutes'));
app.use('/api/subscription', require('./routes/subscriptionRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/organization', require('./routes/organizationRoutes'));
app.use('/api/pension', require('./routes/pensionRoutes'));
app.use('/api/recruitment', require('./routes/recruitmentRoutes'));
app.use('/api/hr', require('./routes/hrRoutes'));
app.use('/api/upload', require('./routes/uploadRoutes'));
app.use('/api/attendance', require('./routes/attendanceRoutes'));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
