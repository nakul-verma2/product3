const router = require('express').Router();
const { protect } = require('../middleware/protect');
const { summary, incidents } = require('../controllers/dashboardController');

router.get('/dashboard/summary', protect, summary);
router.get('/incidents', protect, incidents);

module.exports = router;
