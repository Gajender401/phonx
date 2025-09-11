import axios from 'axios';
import { getCookie, setCookie, deleteCookie } from 'cookies-next';

const baseURL = process.env.NEXT_PUBLIC_BASE_URL;

console.log('baseURL', baseURL);

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Track if we're currently refreshing to avoid multiple simultaneous refresh attempts
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (error?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });
  
  failedQueue = [];
};

// Add request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = getCookie('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // If we're already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = getCookie('refreshToken');
        const userEmail = getCookie('userEmail');

        if (!refreshToken || !userEmail) {
          throw new Error('No refresh token available');
        }

        // Call refresh token endpoint
        const { data } = await axios.post(`${baseURL}/auth/refresh-token`, {
          refreshToken,
          email: userEmail,
        });

        const { accessToken, refreshToken: newRefreshToken } = data.data;

        // Update cookies
        setCookie('token', accessToken, { maxAge: 60 * 60 * 24 }); // 1 day
        if (newRefreshToken) {
          setCookie('refreshToken', newRefreshToken, { maxAge: 60 * 60 * 24 * 30 }); // 30 days
        }

        // Update authorization header for the original request
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;

        // Process any queued requests
        processQueue(null, accessToken);

        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed, clear all auth data
        deleteCookie('token');
        deleteCookie('refreshToken');
        deleteCookie('userEmail');

        // Process queued requests with error
        processQueue(refreshError, null);

        // Redirect to login page
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api; 