import axios from 'axios';

// Create axios instance pointing to your backend
const api = axios.create({
  baseURL: 'http://localhost:5000/api/v1', // Ensure this matches your server port
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add JWT token to headers
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;