const router = require('express').Router();
const { protect } = require('../middleware/protect');
const c = require('../controllers/alertsController');

router.get('/settings', protect, c.get);
router.put('/settings', protect, c.update);
router.post('/test', protect, c.test);
router.get('/history', protect, c.history);
// Legacy PDF path: POST /api/alert/whatsapp
router.post('/whatsapp', protect, c.whatsappIngress);

module.exports = router;
