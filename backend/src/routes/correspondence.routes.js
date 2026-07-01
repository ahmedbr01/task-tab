const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth.middleware');
const correspondenceController = require('../controllers/correspondence.controller');

router.get('/', auth, authorize('admin', 'manager'), correspondenceController.getAll);
router.get('/:id', auth, authorize('admin', 'manager'), correspondenceController.getById);
router.post('/', auth, authorize('admin', 'manager'), correspondenceController.create);
router.put('/:id', auth, authorize('admin', 'manager'), correspondenceController.update);
router.post('/:id/generate', auth, authorize('admin', 'manager'), correspondenceController.generatePDF);
router.get('/:id/download', auth, authorize('admin', 'manager'), correspondenceController.downloadPDF);
router.delete('/:id', auth, authorize('admin'), correspondenceController.delete);

module.exports = router;