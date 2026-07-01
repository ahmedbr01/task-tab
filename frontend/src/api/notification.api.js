import api from './config';

export const notificationApi = {
  getAll: (params) => {
    const query = params ? `?${new URLSearchParams(params).toString()}` : '';
    return api.get(`/notifications${query}`);
  },
  getUnreadCount: () => api.get('/notifications/unread/count'),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
  subscribe: (subscription) => api.post('/notifications/subscribe', { subscription }),
  unsubscribe: (endpoint) => api.delete('/notifications/subscribe', { data: { endpoint } }),
};