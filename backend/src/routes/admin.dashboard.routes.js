const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth.middleware');
const adminDashboardController = require('../controllers/admin.dashboard.controller');

router.get('/stats', auth, authorize('admin'), adminDashboardController.getStats);
router.get('/activity', auth, authorize('admin'), adminDashboardController.getRecentActivity);

module.exports = router;