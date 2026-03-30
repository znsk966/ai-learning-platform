// src/api/api.js
import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor to include auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken') || localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Track whether a token refresh is in progress to avoid concurrent refreshes
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });
  failedQueue = [];
};

const clearAuthAndRedirect = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('access_token');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('refresh_token');
  window.location.href = '/login';
};

// Add response interceptor with token refresh logic
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Only attempt refresh on 401 and if we haven't already retried
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    // Don't try to refresh if the failing request was itself a token refresh
    if (originalRequest.url?.includes('/token/refresh')) {
      clearAuthAndRedirect();
      return Promise.reject(error);
    }

    const refreshToken = localStorage.getItem('refreshToken') || localStorage.getItem('refresh_token');
    if (!refreshToken) {
      clearAuthAndRedirect();
      return Promise.reject(error);
    }

    // If a refresh is already in progress, queue this request
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then((token) => {
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return apiClient(originalRequest);
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const { data } = await axios.post(
        `${apiClient.defaults.baseURL}/token/refresh/`,
        { refresh: refreshToken }
      );

      const newAccessToken = data.access;
      localStorage.setItem('accessToken', newAccessToken);

      // If server rotated the refresh token, save the new one
      if (data.refresh) {
        localStorage.setItem('refreshToken', data.refresh);
      }

      apiClient.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;
      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

      processQueue(null, newAccessToken);
      return apiClient(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      clearAuthAndRedirect();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default apiClient;
