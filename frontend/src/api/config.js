import axios from 'axios';

// 🔥 Détecter si on est sur ngrok
const isNgrok = window.location.hostname.includes('ngrok-free.dev');

// 🔥 Déterminer l'URL de base
// - Si on est sur ngrok : utiliser l'URL du navigateur (https://xxx.ngrok-free.dev/api)
// - Sinon : utiliser localhost:5000/api
const baseURL = isNgrok 
  ? `${window.location.origin}/api` 
  : 'http://localhost:5000/api';

console.log(`🌐 Base URL: ${baseURL}`);
console.log(`📡 Mode: ${isNgrok ? 'ngrok' : 'local'}`);

const api = axios.create({
  baseURL: baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 🔥 Augmenté à 30 secondes pour ngrok
  withCredentials: true, // 🔥 Important pour les cookies/sessions
});

// Intercepteur de requête
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log(`📤 ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('❌ Erreur intercepteur requête:', error);
    return Promise.reject(error);
  }
);

// Intercepteur de réponse
api.interceptors.response.use(
  (response) => {
    console.log(`📥 ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('❌ Erreur API:', error.message);
    if (error.response) {
      console.error('❌ Status:', error.response.status);
      console.error('❌ Données:', error.response.data);
    }
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;