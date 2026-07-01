const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth.middleware');
const actionController = require('../controllers/action.controller');

router.get('/', auth, actionController.getAll);
router.post('/', auth, authorize('admin', 'manager'), actionController.create);

module.exports = router;