import api from './config';

export const taskApi = {
  // Récupérer toutes les tâches (avec pagination et filtres)
  getAll: (params) => {
    const queryParams = new URLSearchParams();
    
    // 🔥 AJOUTER per_page = 1000 pour récupérer TOUTES les tâches
    queryParams.append('per_page', 1000);
    
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key]) {
          queryParams.append(key, params[key]);
        }
      });
    }
    const query = queryParams.toString();
    return api.get(`/tasks${query ? `?${query}` : ''}`);
  },

  // Récupérer les tâches de l'utilisateur connecté
  getMyTasks: () => api.get('/tasks/my-tasks'),

  // Récupérer une tâche par ID
  getById: (id) => api.get(`/tasks/${id}`),

  // Créer une nouvelle tâche
  create: (data) => api.post('/tasks', data),

  // Mettre à jour le statut d'une tâche (Kanban)
  updateStatus: (id, data) => api.put(`/tasks/${id}/status`, data),

  // Mettre à jour une tâche complètement
  update: (id, data) => api.put(`/tasks/${id}`, data),

  // 🔥 SUPPRIMER UNE TÂCHE
  delete: (id) => api.delete(`/tasks/${id}`),

  // Récupérer les statistiques des tâches
  getStats: () => api.get('/tasks/stats'),
};