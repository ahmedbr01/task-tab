import axios from 'axios';

const isNgrok = window.location.hostname.includes('ngrok-free.dev');

const baseURL = `${window.location.origin}/api`;

console.log(`🌐 Base URL: ${baseURL}`);
console.log(`📡 Mode: ${isNgrok ? 'ngrok' : 'local'}`);

const api = axios.create({
  baseURL: baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, 
  withCredentials: true, 
});


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