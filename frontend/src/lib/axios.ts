import axios, { AxiosError } from 'axios';

// Create axios instance
const axiosInstance = axios.create();

// Flag to prevent multiple redirects
let isRedirecting = false;

// Response interceptor to handle 401 errors globally
axiosInstance.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // If 401 Unauthorized, clear localStorage and redirect to login
    if (error.response?.status === 401 && !isRedirecting) {
      isRedirecting = true;
      console.warn('❌ 401 Unauthorized - Token invalid, forcing logout...');

      // Clear all auth data
      localStorage.clear();
      sessionStorage.clear();

      // Redirect to login
      setTimeout(() => {
        window.location.href = '/login';
      }, 100);
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
