import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, 
  withCredentials: true, // INDISPENSABLE pour recevoir le cookie CSRF
});

// Intercepteur de requête
api.interceptors.request.use(
  (config) => {
    // 1. JWT
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // 2. Token CSRF depuis les cookies
    const match = document.cookie.match(new RegExp('(^| )XSRF-TOKEN=([^;]+)'));
    if (match) {
      config.headers['CSRF-Token'] = match[2];
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Intercepteur de réponse
api.interceptors.response.use(
  (response) => {
    // Sauvegarder le nouveau token CSRF si le serveur en envoie un
    const csrfToken = response.headers['x-csrf-token'];
    if (csrfToken) {
       document.cookie = `XSRF-TOKEN=${csrfToken}; path=/; SameSite=Lax`;
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