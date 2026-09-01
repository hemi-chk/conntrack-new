const jwt = require('jsonwebtoken');

function requireDriverAuth(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, message: 'Missing authentication token' });
    }

    if (!process.env.JWT_SECRET) {
        return res.status(500).json({ success: false, message: 'Authentication is not configured' });
    }

    try {
        const token = authHeader.replace('Bearer ', '');
        req.driver = jwt.verify(token, process.env.JWT_SECRET);

        const tokenDriverId = req.driver?.driverId?.toString();
        const tokenEmpId = req.driver?.empId?.toString();
        const requestDriverId = req.params.driverId || req.body?.driverId;

        if (requestDriverId) {
            const requested = requestDriverId.toString();
            const isSameDriver = requested === tokenDriverId || requested === tokenEmpId;

            if (!isSameDriver) {
                return res.status(403).json({ success: false, message: 'Driver access denied' });
            }

            req.params.driverId = tokenDriverId;
            if (req.body) {
                req.body.driverId = tokenDriverId;
            }
        }

        next();
    } catch (error) {
        return res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }
}

module.exports = requireDriverAuth;
