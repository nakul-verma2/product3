const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const { body } = require('express-validator');
const { validate } = require('../middleware/validate');
const { register, login } = require('../controllers/authController');

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100, standardHeaders: true, legacyHeaders: false });

router.post(
  '/register',
  authLimiter,
  [body('email').isEmail().withMessage('Valid email is required.'), body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters.')],
  validate,
  register
);
router.post(
  '/login',
  authLimiter,
  [body('email').isEmail().withMessage('Valid email is required.'), body('password').notEmpty().withMessage('Password is required.')],
  validate,
  login
);

module.exports = router;
