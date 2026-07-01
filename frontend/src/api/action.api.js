import api from './config';

export const actionApi = {
  // Récupérer toutes les actions
  getAll: (params) => {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key]) {
          queryParams.append(key, params[key]);
        }
      });
    }
    const query = queryParams.toString();
    return api.get(`/actions${query ? `?${query}` : ''}`);
  },

  // Récupérer une action par ID
  getById: (id) => api.get(`/actions/${id}`),

  // Créer une nouvelle action
  create: (data) => api.post('/actions', data),

  // Mettre à jour une action
  update: (id, data) => api.put(`/actions/${id}`, data),

  // 🔥 SUPPRIMER UNE ACTION
  delete: (id) => api.delete(`/actions/${id}`),

  // Récupérer les actions d'un projet spécifique
  getByProject: (projectId) => api.get(`/actions/project/${projectId}`),

  // Mettre à jour le statut d'une action
  updateStatus: (id, data) => api.put(`/actions/${id}/status`, data),

  // Récupérer les statistiques des actions
  getStats: () => api.get('/actions/stats'),
};