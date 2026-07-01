import api from './config';

export const ganttApi = {
  getAll: () => api.get('/gantt'),
  getByProject: (projectId) => api.get(`/gantt/project/${projectId}`),
};