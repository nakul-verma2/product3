const router = require('express').Router();
const { protect } = require('../middleware/protect');
const c = require('../controllers/businessAppsController');

router.post('/business-app/add', protect, c.add);
router.get('/business-app/list', protect, c.list);
router.delete('/business-app/:id', protect, c.remove);

module.exports = router;
