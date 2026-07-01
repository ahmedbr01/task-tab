import api from './config';

export const axeApi = {
  // Récupérer tous les axes
  getAll: () => {
    console.log('📤 API: GET /axes');
    return api.get('/axes');
  },
  
  // Récupérer un axe par ID
  getById: (id) => {
    console.log('📤 API: GET /axes/' + id);
    return api.get(`/axes/${id}`);
  },
  
  // Récupérer les statistiques des axes
  getStats: () => {
    console.log('📤 API: GET /axes/stats');
    return api.get('/axes/stats');
  },
  
  // Créer un axe
  create: (data) => {
    console.log('📤 API: POST /axes', data);
    return api.post('/axes', data);
  },
  
  // Mettre à jour un axe
  update: (id, data) => {
    console.log('📤 API: PUT /axes/' + id, data);
    return api.put(`/axes/${id}`, data);
  },
  
  // Supprimer un axe
  delete: (id) => {
    console.log('📤 API: DELETE /axes/' + id);
    return api.delete(`/axes/${id}`);
  },
};