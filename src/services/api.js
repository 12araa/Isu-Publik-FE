import axios from 'axios';
import { useAuthStore } from '../stores/authStore';
import router from '../router';

const api = axios.create({
  baseURL: 'http://127.0.0.1:8000/api', 
  timeout: 300000, // Timeout diatur panjang (5 menit) karena proses scraping memakan waktu
  headers: {
    'Content-Type': 'application/json',
  }
});
api.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('session_token');
    
    console.log("Token yang akan dikirim ke Backend:", token);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      const authStore = useAuthStore();
      
      authStore.logout();
      
      if (router.currentRoute.value.path !== '/login') {
        router.push('/login');
      }
    }
    return Promise.reject(error);
  }
);

export default api;