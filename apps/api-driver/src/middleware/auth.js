const jwt = require('jsonwebtoken');

// Drivers aren't Supabase Auth users - they're plain rows in the `drivers`
// table, authenticated via driverId/password and a token we sign ourselves.
const verifyDriverToken = (req, res, next) => {
  const path = req.path || req.originalUrl || '';
  const publicPaths = ['/login', '/api/driver/login'];
  if (publicPaths.some(p => path === p || path.endsWith(p))) return next();

  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ success: false, message: 'No token provided' });

  try {
    const decoded = jwt.verify(token, process.env.DRIVER_JWT_SECRET);
    req.driver = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};

module.exports = { verifyDriverToken };
