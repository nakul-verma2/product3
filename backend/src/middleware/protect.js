const jwt = require('jsonwebtoken');
const env = require('../config/env');
const User = require('../models/User');

async function protect(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ message: 'Not authorized.' });
    const decoded = jwt.verify(token, env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('_id email').lean();
    if (!user) return res.status(401).json({ message: 'User no longer exists.' });
    req.user = { id: String(user._id), email: user.email };
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
}

module.exports = { protect };
