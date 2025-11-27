import axios from 'axios';

// Em produção na Vercel: usar NEXT_PUBLIC_API_URL ou proxy via rewrites
// Em desenvolvimento: usar NEXT_PUBLIC_API_URL ou localhost
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL 
  ? process.env.NEXT_PUBLIC_API_URL
  : (process.env.NODE_ENV === 'production' 
    ? ''  // Usar proxy do Vercel (rewrites) se NEXT_PUBLIC_API_URL não estiver definido
    : 'http://localhost:8000');

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    console.log(`🚀 ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('❌ Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    console.log(`✅ ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('❌ Response error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export default apiClient;
