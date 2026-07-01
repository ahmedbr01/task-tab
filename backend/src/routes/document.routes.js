const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth.middleware');
const documentController = require('../controllers/document.controller');
const { uploadDocument } = require('../config/upload');

router.get('/', auth, documentController.getAll);
router.get('/task/:taskId', auth, documentController.getByTask);
router.post('/upload', auth, uploadDocument.single('file'), documentController.uploadFile);
router.get('/download/:id', auth, documentController.downloadFile);
router.delete('/:id', auth, authorize('admin', 'manager'), documentController.deleteDocument);

module.exports = router;