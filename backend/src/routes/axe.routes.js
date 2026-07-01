const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth.middleware');
const axeController = require('../controllers/axe.controller');

router.get('/', auth, axeController.getAll);
router.get('/stats', auth, axeController.getStats);
router.get('/:id', auth, axeController.getById);
router.post('/', auth, authorize('admin', 'manager'), axeController.create);
router.put('/:id', auth, authorize('admin', 'manager'), axeController.update);
router.delete('/:id', auth, authorize('admin'), axeController.delete);

module.exports = router;