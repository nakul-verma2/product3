const router = require('express').Router();
const { protect } = require('../middleware/protect');
const c = require('../controllers/auditController');

router.get('/report/generate', protect, c.generate);
router.get('/reports/list', protect, c.list);

module.exports = router;
