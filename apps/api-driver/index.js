require('dotenv').config();
const express = require('express');
const cors = require('cors');
const amqplib = require('amqplib');
const { verifyDriverToken } = require('./src/middleware/auth');
const driverRoutes = require('./src/routes/driver.routes');
const supabase = require('./src/config/supabase');
const { sendDriverPush } = require('./src/services/push.service');

const app = express();
const PORT = process.env.PORT || 5006;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Routes
// Mounted at both '/api/driver' and '/' so requests sent directly to port 5006
// (with /api/driver prefix) and requests sent via API Gateway (stripped to /) work seamlessly.
app.use('/api/driver', verifyDriverToken, driverRoutes);
app.use('/', verifyDriverToken, driverRoutes);

// Health Check
app.get('/health', (req, res) => {
    res.json({ service: 'driver', status: 'ok' });
});

// Fallback 404 handler (returns JSON instead of HTML so clients won't fail with JSON parse error)
app.use((req, res) => {
    res.status(404).json({ success: false, message: `Route ${req.method} ${req.url} not found` });
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
        ch.consume(QUEUE, async (msg) => {
            if (!msg) return;
            try {
                const payload = JSON.parse(msg.content.toString());
                console.log('[Driver] Job assigned event:', payload.order_id, '→ driver', payload.driver_id);
                  await sendDriverPush(
                      payload.driver_id,
                      'New Job Assigned',
                      `Order ${payload.order_reference || payload.order_id} has been assigned to you.`,
                      { type: 'driver_assigned', orderId: payload.order_id }
                  );
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

const sendLicenseExpiryWarnings = async () => {
    const { data: drivers, error } = await supabase
        .from('drivers')
        .select('driver_id, license_expiry');
    if (error) throw error;

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const warningDays = new Set([30, 7, 1]);

    for (const driver of drivers || []) {
        if (!driver.license_expiry) continue;
        const expiry = new Date(`${driver.license_expiry}T00:00:00Z`);
        const daysLeft = Math.round((expiry - today) / 86400000);
        if (!warningDays.has(daysLeft)) continue;

        const title = 'License Expiry Warning';
        const message = daysLeft === 1
            ? 'Your driver license expires tomorrow.'
            : `Your driver license expires in ${daysLeft} days.`;
        const startOfDay = new Date(today);
        const { data: existing } = await supabase
            .from('notifications')
            .select('id')
            .eq('driver_id', driver.driver_id)
            .eq('type', 'license_expiry')
            .eq('message', message)
            .gte('created_at', startOfDay.toISOString())
            .limit(1);

        if (existing?.length) continue;
        await supabase.from('notifications').insert([{
            driver_id: driver.driver_id,
            title,
            message,
            type: 'license_expiry',
            is_read: false,
            created_at: new Date().toISOString(),
        }]);
        await sendDriverPush(driver.driver_id, title, message, { type: 'license_expiry' });
    }
};

const startLicenseExpiryScheduler = () => {
    sendLicenseExpiryWarnings().catch((error) => console.error('License warning error:', error.message));
    setInterval(() => {
        sendLicenseExpiryWarnings().catch((error) => console.error('License warning error:', error.message));
    }, 24 * 60 * 60 * 1000);
};

const IP_ADDRESS = '0.0.0.0';
app.listen(PORT, IP_ADDRESS, () => {
    console.log(`-----------------------------------------`);
    console.log(`Driver Service is LIVE locally on port ${PORT}`);
    console.log(`-----------------------------------------`);
    startMessagingConsumer();
    startLicenseExpiryScheduler();
});
