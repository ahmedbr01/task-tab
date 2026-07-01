const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth.middleware');
const ganttController = require('../controllers/gantt.controller');

router.get('/', auth, authorize('admin', 'manager'), ganttController.getGanttData);
router.get('/project/:projectId', auth, ganttController.getProjectGantt);

module.exports = router;