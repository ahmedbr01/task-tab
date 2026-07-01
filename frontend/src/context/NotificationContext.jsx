import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { notificationApi } from '../api/notification.api';
import { toast } from 'react-toastify';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isPushEnabled, setIsPushEnabled] = useState(false);

  // Charger les notifications
  const loadNotifications = async () => {
    if (!isAuthenticated) return;
    try {
      const response = await notificationApi.getAll({ limit: 50 });
      setNotifications(response.data.notifications || []);
      const unread = response.data.notifications?.filter(n => !n.is_read).length || 0;
      setUnreadCount(unread);
    } catch (error) {
      console.error('❌ Erreur chargement notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Charger le nombre de notifications non lues
  const loadUnreadCount = async () => {
    if (!isAuthenticated) return;
    try {
      const response = await notificationApi.getUnreadCount();
      setUnreadCount(response.data.count || 0);
    } catch (error) {
      console.error('❌ Erreur chargement unread count:', error);
    }
  };

  // Marquer comme lu
  const markAsRead = async (id) => {
    try {
      await notificationApi.markAsRead(id);
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('❌ Erreur markAsRead:', error);
    }
  };

  // Marquer toutes comme lues
  const markAllAsRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      setNotifications(prev =>
        prev.map(n => ({ ...n, is_read: true }))
      );
      setUnreadCount(0);
      toast.success('✅ Toutes les notifications marquées comme lues');
    } catch (error) {
      console.error('❌ Erreur markAllAsRead:', error);
    }
  };

  // Ajouter une notification (via Socket.io)
  const addNotification = (notification) => {
    setNotifications(prev => [notification, ...prev]);
    setUnreadCount(prev => prev + 1);
    toast.info(`🔔 ${notification.title}`);
  };

  // ============================================
  // PUSH NOTIFICATIONS
  // ============================================
  const subscribeToPush = async () => {
    try {
      if (!('Notification' in window) || !('serviceWorker' in navigator)) {
        toast.info('⚠️ Les notifications push ne sont pas supportées par ce navigateur');
        return;
      }

      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        toast.info('⚠️ Permission refusée pour les notifications');
        return;
      }

      // Enregistrer le Service Worker
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('✅ Service Worker enregistré');

      // Récupérer la clé publique VAPID
      const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
      if (!vapidPublicKey) {
        toast.warning('⚠️ Clé VAPID non configurée');
        return;
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidPublicKey,
      });

      await notificationApi.subscribe(subscription);
      setIsPushEnabled(true);
      toast.success('✅ Notifications push activées');
    } catch (error) {
      console.error('❌ Erreur subscription push:', error);
      toast.error('❌ Erreur lors de l\'activation des notifications');
    }
  };

  const unsubscribeFromPush = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await notificationApi.unsubscribe(subscription.endpoint);
        await subscription.unsubscribe();
        setIsPushEnabled(false);
        toast.success('✅ Notifications push désactivées');
      }
    } catch (error) {
      console.error('❌ Erreur unsubscribe:', error);
    }
  };

  // Initialisation
  useEffect(() => {
    if (isAuthenticated) {
      loadNotifications();
      loadUnreadCount();

      // Vérifier si les push sont activés
      const checkPushStatus = async () => {
        try {
          const registration = await navigator.serviceWorker.ready;
          const subscription = await registration.pushManager.getSubscription();
          setIsPushEnabled(!!subscription);
        } catch (e) {}
      };
      checkPushStatus();
    }
  }, [isAuthenticated]);

  // Socket.io pour les notifications en temps réel
  useEffect(() => {
    if (window.io) {
      const socket = window.io;
      socket.on('new-notification', (notification) => {
        addNotification(notification);
      });
    }
  }, []);

  const value = {
    notifications,
    unreadCount,
    loading,
    loadNotifications,
    loadUnreadCount,
    markAsRead,
    markAllAsRead,
    addNotification,
    subscribeToPush,
    unsubscribeFromPush,
    isPushEnabled,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationContext;