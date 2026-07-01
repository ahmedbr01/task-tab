import api from './config';

export const projectApi = {
  getAll: (params) => {
    const queryParams = params ? `?${new URLSearchParams(params).toString()}` : '';
    console.log(`📤 API: GET /projects${queryParams}`);
    return api.get(`/projects${queryParams}`);
  },
  getById: (id) => {
    console.log('📤 API: GET /projects/' + id);
    return api.get(`/projects/${id}`);
  },
  create: (data) => {
    console.log('📤 API: POST /projects', data);
    return api.post('/projects', data);
  },
  update: (id, data) => {
    console.log('📤 API: PUT /projects/' + id, data);
    return api.put(`/projects/${id}`, data);
  },
  delete: (id) => {
    console.log('📤 API: DELETE /projects/' + id);
    return api.delete(`/projects/${id}`);
  },
};