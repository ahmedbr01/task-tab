import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL: baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, 
  withCredentials: true, // IMPORTANT : Permet de recevoir le cookie CSRF
});

// Intercepteur de requête : Ajoute le JWT ET le token CSRF
api.interceptors.request.use(
  (config) => {
    // 1. Ajouter le JWT
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // 2. Ajouter le token CSRF (si présent)
    const csrfToken = localStorage.getItem('csrfToken');
    if (csrfToken) {
      config.headers['CSRF-Token'] = csrfToken;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Intercepteur de réponse : Sauvegarde le nouveau token CSRF
api.interceptors.response.use(
  (response) => {
    // On récupère le token CSRF depuis le header du serveur
    const newCsrfToken = response.headers['x-csrf-token'];
    if (newCsrfToken) {
      localStorage.setItem('csrfToken', newCsrfToken);
    }
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;