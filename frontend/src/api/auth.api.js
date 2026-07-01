import api from './config';

export const authApi = {
  login: (credentials) => api.post('/auth/login', credentials),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.put('/auth/change-password', data),
  uploadAvatar: (data) => {
    return api.post('/auth/upload-avatar', data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  logout: () => api.post('/auth/logout'),
};