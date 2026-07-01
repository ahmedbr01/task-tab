const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth.middleware');
const projectController = require('../controllers/project.controller');

console.log('📋 Routes projects chargées');

router.get('/', auth, projectController.getAll);
router.get('/:id', auth, projectController.getById);
router.post('/', auth, authorize('admin', 'manager'), projectController.create);
router.put('/:id', auth, authorize('admin', 'manager'), projectController.update);
router.delete('/:id', auth, authorize('admin'), projectController.delete);

module.exports = router;