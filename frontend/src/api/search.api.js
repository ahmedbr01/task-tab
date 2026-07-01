import api from './config';

export const searchApi = {
  search: (params) => {
    const queryParams = new URLSearchParams(params).toString();
    return api.get(`/search?${queryParams}`);
  },
  advanced: (params) => {
    const queryParams = new URLSearchParams(params).toString();
    return api.get(`/search/advanced?${queryParams}`);
  },
};