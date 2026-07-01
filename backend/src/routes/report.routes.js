const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth.middleware');
const reportController = require('../controllers/report.controller');

router.get('/progress/:projectId?', auth, authorize('admin', 'manager'), reportController.generateProgressReport);
router.get('/data/:projectId?', auth, authorize('admin', 'manager'), reportController.getReportData);

module.exports = router;