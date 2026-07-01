import api from './config';

export const dashboardApi = {
  getStats: () => api.get('/dashboard/stats'),
};