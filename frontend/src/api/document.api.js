import api from './config';

export const documentApi = {
  getAll: () => api.get('/documents'),
  getByTask: (taskId) => api.get(`/documents/task/${taskId}`),
  upload: (data) => {
    const formData = new FormData();
    formData.append('file', data.file);
    if (data.task_id) {
      formData.append('task_id', data.task_id);
    }
    return api.post('/documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  download: (id) => api.get(`/documents/download/${id}`, {
    responseType: 'blob',
  }),
  delete: (id) => api.delete(`/documents/${id}`),
};