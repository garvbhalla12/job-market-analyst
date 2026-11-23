import axios from 'axios';
import { tokenStore } from './tokenStore';

const baseURL = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000').replace(/\/+$/, '');

// Centralised Axios instance used by every service.
export const api = axios.create({
  baseURL,
  timeout: 20000,
  headers: { 'Content-Type': 'application/json' },
});

// Interceptor-free client used only for the refresh call (prevents refresh loops).
const bare = axios.create({
  baseURL,
  timeout: 20000,
  headers: { 'Content-Type': 'application/json' },
});

const NO_REFRESH_URLS = [
  '/api/auth/login',
  '/api/auth/signup',
  '/api/auth/refresh',
  '/api/auth/logout',
];

let refreshPromise = null;

/**
 * Exchanges the stored refresh token for a new token pair.
 * Refresh tokens are single-use (rotation), so concurrent callers MUST share one request:
 * a second request with the same token would be rejected and log the user out.
 */
export function refreshSession() {
  const refresh_token = tokenStore.getRefresh();
  if (!refresh_token) {
    const err = new Error('No refresh token');
    err.noRefreshToken = true;
    return Promise.reject(err);
  }

  if (!refreshPromise) {
    refreshPromise = bare
      .post('/api/auth/refresh', { refresh_token })
      .then(({ data }) => {
        tokenStore.setTokens(data);
        return data.access_token;
      })
      .catch((err) => {
        // Only discard the token when the server actually rejected it.
        // A network failure keeps it so the next attempt can still succeed.
        if (err.response) tokenStore.clear();
        throw err;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

api.interceptors.request.use((config) => {
  const token = tokenStore.getAccess();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const status = error.response?.status;
    const skip = original && NO_REFRESH_URLS.some((u) => original.url?.startsWith(u));

    if (status === 401 && original && !original._retry && !skip) {
      original._retry = true; // each request is retried at most once
      try {
        const token = await refreshSession();
        original.headers.Authorization = `Bearer ${token}`;
        return api(original);
      } catch (refreshError) {
        const sessionOver = Boolean(refreshError.response || refreshError.noRefreshToken);
        if (sessionOver) {
          // Refresh was rejected (or there was nothing to refresh with): the session is over.
          tokenStore.clear();
          window.dispatchEvent(new Event('auth:logout'));
          return Promise.reject(error);
        }
        return Promise.reject(refreshError); // network failure: keep the session
      }
    }
    return Promise.reject(error);
  },
);

export default api;
