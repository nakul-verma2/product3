const router = require('express').Router();
const { protect } = require('../middleware/protect');
const { whatsappIngress } = require('../controllers/alertsController');

// Legacy PDF path: POST /api/alert/whatsapp (preferred: POST /api/alerts/whatsapp)
router.post('/', protect, whatsappIngress);

module.exports = router;
