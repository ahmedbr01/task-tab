const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth.middleware');
const categoryController = require('../controllers/category.controller');

// Routes publiques (authentifiées)
router.get('/', auth, categoryController.getAll);

// Routes admin uniquement
router.get('/admin', auth, authorize('admin'), categoryController.getAllAdmin);
router.get('/:id', auth, authorize('admin'), categoryController.getById);
router.post('/', auth, authorize('admin'), categoryController.create);
router.put('/:id', auth, authorize('admin'), categoryController.update);
router.delete('/:id', auth, authorize('admin'), categoryController.delete);

module.exports = router;