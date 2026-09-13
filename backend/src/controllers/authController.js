const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const env = require('../config/env');
const User = require('../models/User');

function sign(userId) {
  return jwt.sign({ id: userId }, env.JWT_SECRET, { expiresIn: '7d' });
}

async function register(req, res, next) {
  try {
    const { email, password } = req.body;
    const exists = await User.findOne({ email: String(email).toLowerCase().trim() });
    if (exists) return res.status(409).json({ message: 'Email already registered.' });
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ email: String(email).toLowerCase().trim(), passwordHash });
    return res.status(201).json({ token: sign(user._id), user: { id: String(user._id), email: user.email } });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ message: 'Email already registered.' });
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: String(email).toLowerCase().trim() }).select('+passwordHash');
    if (!user) return res.status(401).json({ message: 'Invalid email or password.' });
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ message: 'Invalid email or password.' });
    return res.json({ token: sign(user._id), user: { id: String(user._id), email: user.email } });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login };
