const router = require('express').Router();
const { protect } = require('../middleware/protect');
const c = require('../controllers/websitesController');

router.use(protect);
router.post('/add', c.add);
router.get('/list', c.list);
router.get('/:id/logs', c.logs);
router.get('/:id', c.getOne);
router.delete('/:id', c.remove);
router.patch('/:id/pause', c.pause);

module.exports = router;
