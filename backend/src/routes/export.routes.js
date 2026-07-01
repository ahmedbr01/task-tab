const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth.middleware');
const exportController = require('../controllers/export.controller');

router.get('/projects', auth, authorize('admin', 'manager'), exportController.exportProjects);
router.get('/tasks', auth, authorize('admin', 'manager'), exportController.exportTasks);
router.get('/users', auth, authorize('admin'), exportController.exportUsers);
router.get('/stats', auth, authorize('admin', 'manager'), exportController.exportStats);

module.exports = router;