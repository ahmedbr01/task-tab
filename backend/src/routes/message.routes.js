const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth.middleware');
const messageController = require('../controllers/message.controller');

// Routes existantes
router.get('/conversations', auth, messageController.getConversations);
router.get('/conversation/:userId', auth, messageController.getConversation);
router.post('/', auth, messageController.sendMessage);

// 🔥 AJOUTER CETTE ROUTE
router.post('/conversation', auth, messageController.createConversation);

router.put('/read/:userId', auth, messageController.markAsRead);

// 🔥 CORRECTION : Utiliser deleteMessage au lieu de delete
router.delete('/:id', auth, messageController.deleteMessage);

// Route pour le nombre de messages non lus
router.get('/unread/count', auth, messageController.getUnreadCount);

module.exports = router;