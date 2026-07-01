const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth.middleware');
const logController = require('../controllers/log.controller');

router.get('/', auth, authorize('admin'), logController.getLogs);
router.get('/stats', auth, authorize('admin'), logController.getLogStats);
router.delete('/clean', auth, authorize('admin'), logController.cleanLogs);
router.get('/export', auth, authorize('admin'), logController.exportLogs);

module.exports = router;