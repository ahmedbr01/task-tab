import api from './config';

export const correspondenceApi = {
  // Récupérer toutes les correspondances
  getAll: () => api.get('/correspondence'),
  
  // Récupérer une correspondance par ID
  getById: (id) => api.get(`/correspondence/${id}`),
  
  // Créer une correspondance
  create: (data) => api.post('/correspondence', data),
  
  // Mettre à jour une correspondance
  update: (id, data) => api.put(`/correspondence/${id}`, data),
  
  // Générer le PDF
  generatePDF: (id) => api.post(`/correspondence/${id}/generate`),
  
  // Télécharger le PDF
  downloadPDF: (id) => {
    return api.get(`/correspondence/${id}/download`, {
      responseType: 'blob',
    });
  },
  
  // Supprimer une correspondance
  delete: (id) => api.delete(`/correspondence/${id}`),
};