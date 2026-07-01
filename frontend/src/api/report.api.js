import api from './config';

export const reportApi = {
  generateProgressReport: (projectId = '') => {
    const url = projectId ? `/reports/progress/${projectId}` : '/reports/progress';
    return api.get(url, {
      responseType: 'blob',
    });
  },
};