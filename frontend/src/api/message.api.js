import api from './config';

export const messageApi = {
  // Récupérer les conversations
  getConversations: () => api.get('/messages/conversations'),
  
  // Récupérer la conversation avec un utilisateur spécifique
  getConversation: (userId) => api.get(`/messages/conversation/${userId}`),
  
  // 🔥 CRÉER UNE NOUVELLE CONVERSATION
  createConversation: (userId) => api.post('/messages/conversation', { user_id: userId }),
  
  // Envoyer un message
  sendMessage: (data) => api.post('/messages', data),
  
  // Marquer les messages comme lus
  markAsRead: (userId) => api.put(`/messages/read/${userId}`),
  
  // Supprimer un message
  delete: (id) => api.delete(`/messages/${id}`),
};