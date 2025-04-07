import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

// Determine the base URL for the API
// Use environment variable provided by Vite, default to localhost:3001
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

// Create an Axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// --- Request Interceptor ---
// Adds the JWT token to the Authorization header for authenticated requests
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Retrieve the token from local storage (or wherever AuthContext stores it)
    const token = localStorage.getItem('authToken'); // Adjust key if needed
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    // Handle request error
    console.error('Axios Request Error:', error);
    return Promise.reject(error);
  }
);

// --- Response Interceptor ---
// Handles common API errors, like 401 Unauthorized
apiClient.interceptors.response.use(
  (response) => {
    // Any status code that lie within the range of 2xx cause this function to trigger
    return response;
  },
  (error: AxiosError) => {
    // Any status codes that falls outside the range of 2xx cause this function to trigger
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('Axios Response Error Status:', error.response.status);
      console.error('Axios Response Error Data:', error.response.data);

      if (error.response.status === 401) {
        // Handle Unauthorized error (e.g., token expired or invalid)
        // Handle Unauthorized error (e.g., token expired or invalid)
        // Clear token and redirect to login page to force re-authentication.
        const currentPath = window.location.pathname;
        localStorage.removeItem('authToken'); // Adjust key if needed
        console.warn('Unauthorized access (401) - Token removed. Redirecting to login.');
        // Avoid redirect loop if already on login page or if multiple requests fail
        if (currentPath !== '/login' && currentPath !== '/register') {
             // Use replace to avoid adding the failed page to history
            window.location.replace('/login?sessionExpired=true');
        }
      }
      // You could add more specific error handling here for 403, 404, 500 etc.
    } else if (error.request) {
      // The request was made but no response was received
      console.error('Axios No Response Error:', error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Axios Setup Error:', error.message);
    }

    // Return a rejected promise to propagate the error
    return Promise.reject(error);
  }
);

export default apiClient;