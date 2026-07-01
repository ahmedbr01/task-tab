const Message = require('../models/Message');
const User = require('../models/User');
const { Op } = require('sequelize');

// ============================================
// RÉCUPÉRER TOUTES LES CONVERSATIONS D'UN UTILISATEUR
// ============================================
const getConversations = async (req, res) => {
  try {
    const userId = req.user.id;

    // Récupérer tous les utilisateurs avec qui l'utilisateur a échangé
    const conversations = await Message.findAll({
      where: {
        [Op.or]: [
          { sender_id: userId },
          { receiver_id: userId }
        ]
      },
      attributes: ['sender_id', 'receiver_id'],
      group: ['sender_id', 'receiver_id'],
      raw: true
    });

    // Extraire les IDs des utilisateurs uniques
    const userIds = new Set();
    conversations.forEach(conv => {
      if (conv.sender_id !== userId) userIds.add(conv.sender_id);
      if (conv.receiver_id !== userId) userIds.add(conv.receiver_id);
    });

    // Récupérer les informations des utilisateurs
    const users = await User.findAll({
      where: {
        id: { [Op.in]: Array.from(userIds) },
        is_active: true
      },
      attributes: ['id', 'username', 'full_name', 'email', 'avatar', 'is_active']
    });

    // Pour chaque utilisateur, récupérer le dernier message
    const conversationsWithLastMessage = await Promise.all(
      users.map(async (user) => {
        const lastMessage = await Message.findOne({
          where: {
            [Op.or]: [
              { sender_id: userId, receiver_id: user.id },
              { sender_id: user.id, receiver_id: userId }
            ]
          },
          order: [['created_at', 'DESC']],
          attributes: ['id', 'content', 'created_at', 'sender_id', 'is_read']
        });

        // Compter les messages non lus
        const unreadCount = await Message.count({
          where: {
            sender_id: user.id,
            receiver_id: userId,
            is_read: false
          }
        });

        return {
          user: user.toJSON(),
          lastMessage: lastMessage || null,
          unreadCount: unreadCount || 0
        };
      })
    );

    // Trier par date du dernier message (plus récent en premier)
    conversationsWithLastMessage.sort((a, b) => {
      if (!a.lastMessage) return 1;
      if (!b.lastMessage) return -1;
      return new Date(b.lastMessage.created_at) - new Date(a.lastMessage.created_at);
    });

    res.json({
      success: true,
      conversations: conversationsWithLastMessage
    });
  } catch (error) {
    console.error('❌ Erreur getConversations:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ============================================
// RÉCUPÉRER LA CONVERSATION AVEC UN UTILISATEUR SPÉCIFIQUE
// ============================================
const getConversation = async (req, res) => {
  try {
    const userId = req.user.id;
    const { userId: otherUserId } = req.params;

    // Vérifier que l'utilisateur existe
    const otherUser = await User.findByPk(otherUserId);
    if (!otherUser) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    // Récupérer tous les messages entre les deux utilisateurs
    const messages = await Message.findAll({
      where: {
        [Op.or]: [
          { sender_id: userId, receiver_id: otherUserId },
          { sender_id: otherUserId, receiver_id: userId }
        ]
      },
      order: [['created_at', 'ASC']]
    });

    // Marquer les messages reçus comme lus
    await Message.update(
      { is_read: true, read_at: new Date() },
      {
        where: {
          sender_id: otherUserId,
          receiver_id: userId,
          is_read: false
        }
      }
    );

    res.json({
      success: true,
      messages,
      user: otherUser.toJSON()
    });
  } catch (error) {
    console.error('❌ Erreur getConversation:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ============================================
// 🔥 CRÉER UNE NOUVELLE CONVERSATION (si elle n'existe pas)
// ============================================
const createConversation = async (req, res) => {
  try {
    const userId = req.user.id;
    const { user_id } = req.body;

    if (!user_id) {
      return res.status(400).json({
        success: false,
        message: 'ID utilisateur requis'
      });
    }

    // Vérifier que l'utilisateur existe
    const targetUser = await User.findByPk(user_id);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    // Vérifier si une conversation existe déjà
    const existingMessages = await Message.findOne({
      where: {
        [Op.or]: [
          { sender_id: userId, receiver_id: user_id },
          { sender_id: user_id, receiver_id: userId }
        ]
      }
    });

    if (existingMessages) {
      return res.status(200).json({
        success: true,
        message: 'Conversation déjà existante',
        exists: true
      });
    }

    // Créer un message système pour initier la conversation (optionnel)
    // Ou simplement retourner un succès
    res.status(201).json({
      success: true,
      message: 'Conversation créée avec succès'
    });
  } catch (error) {
    console.error('❌ Erreur création conversation:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ============================================
// ENVOYER UN MESSAGE
// ============================================
const sendMessage = async (req, res) => {
  try {
    const userId = req.user.id;
    const { receiver_id, content } = req.body;

    if (!receiver_id || !content) {
      return res.status(400).json({
        success: false,
        message: 'Destinataire et contenu requis'
      });
    }

    // Vérifier que le destinataire existe
    const receiver = await User.findByPk(receiver_id);
    if (!receiver) {
      return res.status(404).json({
        success: false,
        message: 'Destinataire non trouvé'
      });
    }

    // Créer le message
    const message = await Message.create({
      sender_id: userId,
      receiver_id,
      content,
      is_read: false
    });

    // Récupérer le message avec les informations de l'expéditeur
    const messageWithSender = await Message.findByPk(message.id, {
      include: [
        {
          model: User,
          as: 'sender',
          attributes: ['id', 'username', 'full_name', 'avatar']
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: messageWithSender
    });
  } catch (error) {
    console.error('❌ Erreur sendMessage:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ============================================
// MARQUER LES MESSAGES COMME LUS
// ============================================
const markAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const { userId: otherUserId } = req.params;

    // Marquer tous les messages de l'autre utilisateur comme lus
    const result = await Message.update(
      { is_read: true, read_at: new Date() },
      {
        where: {
          sender_id: otherUserId,
          receiver_id: userId,
          is_read: false
        }
      }
    );

    res.json({
      success: true,
      message: `${result[0]} message(s) marqué(s) comme lu(s)`
    });
  } catch (error) {
    console.error('❌ Erreur markAsRead:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ============================================
// SUPPRIMER UN MESSAGE
// ============================================
const deleteMessage = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const message = await Message.findByPk(id);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message non trouvé'
      });
    }

    // Vérifier que l'utilisateur est l'expéditeur ou le destinataire
    if (message.sender_id !== userId && message.receiver_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Vous n\'êtes pas autorisé à supprimer ce message'
      });
    }

    await message.destroy();

    res.json({
      success: true,
      message: 'Message supprimé avec succès'
    });
  } catch (error) {
    console.error('❌ Erreur deleteMessage:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ============================================
// RÉCUPÉRER LE NOMBRE DE MESSAGES NON LUS
// ============================================
const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;

    const count = await Message.count({
      where: {
        receiver_id: userId,
        is_read: false
      }
    });

    res.json({
      success: true,
      unreadCount: count
    });
  } catch (error) {
    console.error('❌ Erreur getUnreadCount:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ============================================
// EXPORTER LES FONCTIONS
// ============================================
module.exports = {
  getConversations,
  getConversation,
  createConversation, // 🔥 AJOUTÉ
  sendMessage,
  markAsRead,
  deleteMessage,
  getUnreadCount
};