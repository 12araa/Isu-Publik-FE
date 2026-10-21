import { defineStore } from 'pinia';
import api from '../services/api';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: sessionStorage.getItem('session_token') || null,
  }),
  
  getters: {
    isAuthenticated: (state) => !!state.token,
  },
  
  actions: {
    async login(email, password) {
      try {
        const response = await api.post('/auth/login', { 
          email: email, 
          password: password 
        });
        
        if (response.data.status === 'success') {
          this.token = response.data.session_token;
          sessionStorage.setItem('session_token', this.token);
          return true;
        }
      } catch (error) {
        throw error;
      }
    },
    
    logout() {
      this.token = null;
      sessionStorage.removeItem('session_token');
    }
  }
});