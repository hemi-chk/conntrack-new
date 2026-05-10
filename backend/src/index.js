require('dotenv').config();
const express = require('express');
const cors = require('cors');
const driverRoutes = require('./routes/driver.routes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Routes
app.use('/api/driver', driverRoutes);

// Health Check
app.get('/', (req, res) => {
    res.send('Conntrack Backend API is running...');
});

const IP_ADDRESS = '0.0.0.0';
app.listen(PORT, IP_ADDRESS, () => {
    console.log(`-----------------------------------------`);
    console.log(`Server is LIVE locally on port ${PORT}`);
    console.log(`Localtunnel should be pointed to this port.`);
    console.log(`-----------------------------------------`);
});
