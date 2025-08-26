import axios from 'axios';
const API_URL = import.meta.env.VITE_API_URL;
const axiosInstance = axios.create({
  baseURL: API_URL + '/api/v1', // Using Vite's environment variable syntax
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
});

// Hardcoded token for now
const API_TOKEN = localStorage.getItem('access_token');

axiosInstance.interceptors.request.use(
  (config) => {
    // Add token to every request
    config.headers.Authorization = `Bearer ${API_TOKEN}`;
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response) {
      console.error('API Error:', error.response.status, error.response.data);
      
      switch (error.response.status) {
        case 401:
          localStorage.clear();
          window.location.href = '/login';
          break;
        case 403:
          console.error('Forbidden: Insufficient permissions');
          break;
        case 404:
          console.error('Not found: Resource not available');
          break;
        case 500:
          console.error('Server error');
          break;
        default:
          console.error(`Unexpected error: ${error.response.status}`);
          break;
      }
    } else if (error.request) {
      console.error('Network Error:', error.request);
    } else {
      console.error('Request Error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

export default axiosInstance;