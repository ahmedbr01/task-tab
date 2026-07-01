const Notification = require('../models/Notification');
const Subscription = require('../models/Subscription');
const User = require('../models/User');
const webpush = require('web-push');

// ============================================
// CONFIGURATION VAPID
// ============================================
const publicKey = process.env.VAPID_PUBLIC_KEY;
const privateKey = process.env.VAPID_PRIVATE_KEY;
const subject = process.env.VAPID_SUBJECT || 'mailto:admin@cnrps.tn';

if (publicKey && privateKey && publicKey !== 'VOTRE_PUBLIC_KEY' && privateKey !== 'VOTRE_PRIVATE_KEY') {
  try {
    webpush.setVapidDetails(subject, publicKey, privateKey);
    console.log('✅ VAPID Keys configurées avec succès');
  } catch (error) {
    console.warn('⚠️ Erreur configuration VAPID:', error.message);
  }
} else {
  console.warn('⚠️ VAPID Keys non configurées. Les notifications push seront désactivées.');
}

// ============================================
// RÉCUPÉRER LES NOTIFICATIONS D'UN UTILISATEUR
// ============================================
const getNotifications = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const { count, rows } = await Notification.findAndCountAll({
      where: { user_id: req.user.id },
      order: [['created_at', 'DESC']],
      limit,
      offset,
    });

    res.json({
      success: true,
      notifications: rows,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    console.error('❌ Erreur getNotifications:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================
// MARQUER UNE NOTIFICATION COMME LUE
// ============================================
const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOne({
      where: {
        id: req.params.id,
        user_id: req.user.id,
      },
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification non trouvée',
      });
    }

    await notification.update({
      is_read: true,
      read_at: new Date(),
    });

    res.json({ success: true, notification });
  } catch (error) {
    console.error('❌ Erreur markAsRead:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================
// MARQUER TOUTES LES NOTIFICATIONS COMME LUES
// ============================================
const markAllAsRead = async (req, res) => {
  try {
    await Notification.update(
      { is_read: true, read_at: new Date() },
      {
        where: {
          user_id: req.user.id,
          is_read: false,
        },
      }
    );

    res.json({
      success: true,
      message: 'Toutes les notifications marquées comme lues',
    });
  } catch (error) {
    console.error('❌ Erreur markAllAsRead:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================
// COMPTER LES NOTIFICATIONS NON LUES
// ============================================
const getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.count({
      where: {
        user_id: req.user.id,
        is_read: false,
      },
    });

    res.json({ success: true, count });
  } catch (error) {
    console.error('❌ Erreur getUnreadCount:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================
// ENREGISTRER UNE SUBSCRIPTION PUSH
// ============================================
const saveSubscription = async (req, res) => {
  try {
    const { subscription } = req.body;

    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return res.status(400).json({
        success: false,
        message: 'Subscription invalide',
      });
    }

    const existing = await Subscription.findOne({
      where: {
        user_id: req.user.id,
        endpoint: subscription.endpoint,
      },
    });

    if (existing) {
      await existing.update({
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      });
    } else {
      await Subscription.create({
        user_id: req.user.id,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      });
    }

    res.json({
      success: true,
      message: 'Subscription enregistrée avec succès',
    });
  } catch (error) {
    console.error('❌ Erreur saveSubscription:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================
// SUPPRIMER UNE SUBSCRIPTION
// ============================================
const deleteSubscription = async (req, res) => {
  try {
    const { endpoint } = req.body;

    if (!endpoint) {
      return res.status(400).json({
        success: false,
        message: 'Endpoint requis',
      });
    }

    await Subscription.destroy({
      where: {
        user_id: req.user.id,
        endpoint: endpoint,
      },
    });

    res.json({
      success: true,
      message: 'Subscription supprimée avec succès',
    });
  } catch (error) {
    console.error('❌ Erreur deleteSubscription:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================
// ENVOYER UNE NOTIFICATION PUSH À UN UTILISATEUR
// ============================================
const sendPushNotification = async (userId, notification) => {
  try {
    if (!publicKey || !privateKey || publicKey === 'VOTRE_PUBLIC_KEY') {
      console.warn('⚠️ VAPID Keys non configurées, notification push ignorée');
      return [];
    }

    const subscriptions = await Subscription.findAll({
      where: { user_id: userId },
    });

    if (subscriptions.length === 0) {
      console.log(`📭 Aucune subscription pour l'utilisateur ${userId}`);
      return [];
    }

    const payload = JSON.stringify({
      title: notification.title,
      body: notification.message,
      icon: '/favicon.svg',
      badge: '/favicon.svg',
      data: {
        url: notification.link || '/dashboard',
        type: notification.type,
        id: notification.id,
      },
    });

    const results = await Promise.allSettled(
      subscriptions.map(async (sub) => {
        const pushSubscription = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
        };

        return webpush.sendNotification(pushSubscription, payload);
      })
    );

    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        const error = result.reason;
        if (error.statusCode === 410 || error.statusCode === 404) {
          Subscription.destroy({
            where: { id: subscriptions[index]?.id },
          });
          console.log(`🗑️ Subscription invalide supprimée (${error.statusCode})`);
        }
      }
    });

    return results;
  } catch (error) {
    console.error('❌ Erreur sendPushNotification:', error);
    return [];
  }
};

// ============================================
// CRÉER UNE NOTIFICATION (INTERNE)
// ============================================
const createNotification = async (userId, type, title, message, link = null, data = null) => {
  try {
    // Vérifier que l'utilisateur existe
    const user = await User.findByPk(userId);
    if (!user) {
      console.warn(`⚠️ Utilisateur ${userId} non trouvé`);
      return null;
    }

    if (!user.is_active) {
      console.warn(`⚠️ Utilisateur ${userId} désactivé, notification ignorée`);
      return null;
    }

    // Créer la notification en base
    const notification = await Notification.create({
      user_id: userId,
      type,
      title,
      message,
      link,
      data,
      is_read: false,
    });

    console.log(`🔔 Notification créée pour ${user.username}: ${title}`);

    // Envoyer la notification push
    await sendPushNotification(userId, notification);

    // Envoyer en temps réel via Socket.io
    try {
      const { io, onlineUsers } = require('../../server');
      const userSocketId = onlineUsers?.get(userId);
      if (userSocketId && io) {
        io.to(userSocketId).emit('new-notification', notification);
        console.log(`📡 Notification envoyée en temps réel à ${user.username}`);
      }
    } catch (socketError) {
      // Socket non disponible, ignorer
    }

    return notification;
  } catch (error) {
    console.error('❌ Erreur createNotification:', error);
    return null;
  }
};

// ============================================
// NOTIFICATION DE TÂCHE ASSIGNÉE
// ============================================
const notifyTaskAssigned = async (userId, task, assignerName) => {
  if (!userId) {
    console.warn('⚠️ userId requis pour notifyTaskAssigned');
    return null;
  }

  return createNotification(
    userId,
    'task_assigned',
    `📋 Nouvelle tâche assignée`,
    `${assignerName || 'Un utilisateur'} vous a assigné la tâche: "${task.title_ar}"`,
    '/kanban',
    { taskId: task.id, taskTitle: task.title_ar }
  );
};

// ============================================
// NOTIFICATION DE NOUVEAU MESSAGE
// ============================================
const notifyNewMessage = async (userId, senderName, messageContent) => {
  if (!userId) {
    console.warn('⚠️ userId requis pour notifyNewMessage');
    return null;
  }

  return createNotification(
    userId,
    'message',
    `💬 Nouveau message`,
    `${senderName || 'Un utilisateur'}: ${messageContent.substring(0, 50)}${messageContent.length > 50 ? '...' : ''}`,
    '/messages',
    { senderName, messageContent: messageContent.substring(0, 200) }
  );
};

// ============================================
// NOTIFICATION D'ÉCHÉANCE
// ============================================
const notifyDeadline = async (userId, taskTitle, dueDate) => {
  if (!userId) {
    console.warn('⚠️ userId requis pour notifyDeadline');
    return null;
  }

  const formattedDate = new Date(dueDate).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  return createNotification(
    userId,
    'deadline',
    `⏰ Échéance approche`,
    `La tâche "${taskTitle}" arrive à échéance le ${formattedDate}`,
    '/kanban',
    { taskTitle, dueDate }
  );
};

// ============================================
// NOTIFICATION DE MISE À JOUR DE TÂCHE
// ============================================
const notifyTaskUpdated = async (userId, taskTitle, status) => {
  if (!userId) {
    console.warn('⚠️ userId requis pour notifyTaskUpdated');
    return null;
  }

  const statusLabels = {
    todo: '📋 À faire',
    in_progress: '🔄 En cours',
    review: '🔍 En révision',
    done: '✅ Terminé',
    cancelled: '❌ Annulé',
  };

  return createNotification(
    userId,
    'task_updated',
    `🔄 Tâche mise à jour`,
    `La tâche "${taskTitle}" est passée à "${statusLabels[status] || status}"`,
    '/kanban',
    { taskTitle, status }
  );
};

// ============================================
// NOTIFICATION DE NOUVEAU PROJET
// ============================================
const notifyNewProject = async (userId, projectName, creatorName) => {
  if (!userId) {
    console.warn('⚠️ userId requis pour notifyNewProject');
    return null;
  }

  return createNotification(
    userId,
    'system',
    `📁 Nouveau projet créé`,
    `${creatorName || 'Un utilisateur'} a créé le projet: "${projectName}"`,
    '/projects',
    { projectName }
  );
};

// ============================================
// NOTIFICATION DE PROJET TERMINÉ
// ============================================
const notifyProjectCompleted = async (userId, projectName) => {
  if (!userId) {
    console.warn('⚠️ userId requis pour notifyProjectCompleted');
    return null;
  }

  return createNotification(
    userId,
    'system',
    `✅ Projet terminé`,
    `Le projet "${projectName}" a été marqué comme terminé`,
    '/projects',
    { projectName }
  );
};

// ============================================
// NOTIFICATION DE NOUVEL UTILISATEUR
// ============================================
const notifyNewUser = async (adminId, newUserName) => {
  if (!adminId) {
    console.warn('⚠️ adminId requis pour notifyNewUser');
    return null;
  }

  return createNotification(
    adminId,
    'system',
    `👤 Nouvel utilisateur inscrit`,
    `Un nouvel utilisateur "${newUserName}" a été créé`,
    '/admin/users',
    { newUserName }
  );
};

// ============================================
// EXPORTER
// ============================================
module.exports = {
  // Routes principales
  getNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
  saveSubscription,
  deleteSubscription,
  
  // Fonctions internes
  sendPushNotification,
  createNotification,
  
  // Fonctions de notification spécifiques
  notifyTaskAssigned,
  notifyTaskUpdated,
  notifyNewMessage,
  notifyDeadline,
  notifyNewProject,
  notifyProjectCompleted,
  notifyNewUser,
};