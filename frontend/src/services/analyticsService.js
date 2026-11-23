import api from './api';

const get = (url, params, signal) => api.get(url, { params, signal }).then((res) => res.data);

// Every function maps 1:1 to a route in backend/routes/analytics_routes.py.
export const analyticsService = {
  overview: (signal) => get('/api/analytics/overview', undefined, signal),
  skills: (limit = 15, signal) => get('/api/analytics/skills', { limit }, signal),
  salary: (signal) => get('/api/analytics/salary', undefined, signal),
  locations: (limit = 15, signal) => get('/api/analytics/locations', { limit }, signal),
  workplace: (signal) => get('/api/analytics/workplace', undefined, signal),
  employment: (signal) => get('/api/analytics/employment', undefined, signal),
  roles: (signal) => get('/api/analytics/roles', undefined, signal),
  companies: (limit = 15, signal) => get('/api/analytics/companies', { limit }, signal),
  fresher: (signal) => get('/api/analytics/fresher', undefined, signal),

  // Query params supported by the backend: search, workplace_type, employment_type, location, limit (1-100)
  jobs(params = {}, signal) {
    const clean = Object.fromEntries(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== null && String(v).trim() !== ''),
    );
    return get('/api/analytics/jobs', clean, signal);
  },
};

export default analyticsService;
