require('dotenv').config();
const express = require('express');
const cors = require('cors');
const driverRoutes = require('./src/routes/driver.routes');

const app = express();
const PORT = process.env.PORT || 5006;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Routes
// Note: Mounted at '/' because Gateway rewrites '/api/driver' by stripping it
app.use('/', driverRoutes);

// Health Check
app.get('/health', (req, res) => {
    res.json({ service: 'driver', status: 'ok' });
});

const IP_ADDRESS = '0.0.0.0';
app.listen(PORT, IP_ADDRESS, () => {
    console.log(`-----------------------------------------`);
    console.log(`Driver Service is LIVE locally on port ${PORT}`);
    console.log(`-----------------------------------------`);
});
