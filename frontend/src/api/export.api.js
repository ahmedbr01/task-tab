import api from './config';

export const exportApi = {
  exportProjects: () => {
    return api.get('/export/projects', {
      responseType: 'blob',
    });
  },
  exportTasks: () => {
    return api.get('/export/tasks', {
      responseType: 'blob',
    });
  },
  exportUsers: () => {
    return api.get('/export/users', {
      responseType: 'blob',
    });
  },
  exportStats: () => {
    return api.get('/export/stats', {
      responseType: 'blob',
    });
  },
};