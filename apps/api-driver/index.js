require('dotenv').config();
const express = require('express');
const cors = require('cors');
const amqplib = require('amqplib');
const { verifyDriverToken } = require('./src/middleware/auth');
const driverRoutes = require('./src/routes/driver.routes');

const app = express();
const PORT = process.env.PORT || 5006;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Routes
// Note: Mounted at '/' because Gateway rewrites '/api/driver' by stripping it
// verifyDriverToken lets /login through unauthenticated, requires a valid
// token for everything else.
app.use('/', verifyDriverToken, driverRoutes);

// Health Check
app.get('/health', (req, res) => {
    res.json({ service: 'driver', status: 'ok' });
});

async function startMessagingConsumer() {
    const amqpUrl = process.env.AMQP_URL;
    if (!amqpUrl) return;
    try {
        const conn = await amqplib.connect(amqpUrl);
        const ch = await conn.createChannel();
        const EXCHANGE = 'conntrack.events';
        const QUEUE = 'driver.assigned.queue';
        await ch.assertExchange(EXCHANGE, 'topic', { durable: true });
        await ch.assertQueue(QUEUE, { durable: true });
        await ch.bindQueue(QUEUE, EXCHANGE, 'driver.assigned');
        ch.prefetch(1);
        ch.consume(QUEUE, (msg) => {
            if (!msg) return;
            try {
                const payload = JSON.parse(msg.content.toString());
                console.log('[Driver] Job assigned event:', payload.order_id, '→ driver', payload.driver_id);
                ch.ack(msg);
            } catch (err) {
                console.error('[Driver] Consumer error:', err.message);
                ch.nack(msg, false, false);
            }
        });
        console.log('[Driver] Messaging consumer ready');
        conn.on('error', (err) => console.error('[Driver] AMQP error:', err.message));
    } catch (err) {
        console.warn('[Driver] RabbitMQ unavailable — running without messaging:', err.message);
    }
}

const IP_ADDRESS = '0.0.0.0';
app.listen(PORT, IP_ADDRESS, () => {
    console.log(`-----------------------------------------`);
    console.log(`Driver Service is LIVE locally on port ${PORT}`);
    console.log(`-----------------------------------------`);
    startMessagingConsumer();
});
