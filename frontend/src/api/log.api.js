import api from './config';

export const logApi = {
  getAll: (params) => {
    const query = params ? `?${new URLSearchParams(params).toString()}` : '';
    return api.get(`/logs${query}`);
  },
  getStats: () => api.get('/logs/stats'),
  clean: (days) => api.delete('/logs/clean', { data: { days } }),
  export: () => api.get('/logs/export', { responseType: 'blob' }),
};