const router = require('express').Router();
const { publicStatus } = require('../controllers/statusController');

router.get('/:userId', publicStatus);

module.exports = router;
