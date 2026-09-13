const router = require('express').Router();
const { protect } = require('../middleware/protect');
const { diagnose } = require('../services/rootCause');

router.post('/root-cause', protect, (req, res) => {
  const { statusCode = null, error = '', responseTimeMs = null, isUp } = req.body || {};
  const inferredUp = typeof isUp === 'boolean' ? isUp : !(statusCode >= 400 || statusCode === 0);
  return res.json(diagnose({ statusCode, error, responseTimeMs, isUp: inferredUp }));
});

module.exports = router;
