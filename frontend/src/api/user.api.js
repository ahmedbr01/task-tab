import api from './config';

export const userApi = {
  // Récupérer tous les utilisateurs (admin)
  getAll: () => {
    console.log('📤 API: GET /users');
    return api.get('/users');
  },
  
  // Récupérer les utilisateurs actifs pour la messagerie (accessible à tous)
  getActiveUsers: () => {
    console.log('📤 API: GET /users/active');
    return api.get('/users/active');
  },
  
  getById: (id) => {
    console.log('📤 API: GET /users/' + id);
    return api.get(`/users/${id}`);
  },
  
  create: (data) => {
    console.log('📤 API: POST /users', data);
    return api.post('/users', data);
  },
  
  update: (id, data) => {
    console.log('📤 API: PUT /users/' + id, data);
    return api.put(`/users/${id}`, data);
  },
  
  delete: (id) => {
    console.log('📤 API: DELETE /users/' + id);
    return api.delete(`/users/${id}`);
  },
};