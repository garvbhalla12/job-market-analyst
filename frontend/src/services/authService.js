import api from './api';

// Request/response shapes come from backend/schemas.py and backend/routes/auth.py.
export const authService = {
  // POST /api/auth/signup  { full_name, email, password } -> { id, full_name, email, is_active }
  async signup({ full_name, email, password }) {
    const { data } = await api.post('/api/auth/signup', { full_name, email, password });
    return data;
  },

  // POST /api/auth/login { email, password } -> { message, access_token, refresh_token, token_type }
  async login({ email, password }) {
    const { data } = await api.post('/api/auth/login', { email, password });
    return data;
  },

  // POST /api/auth/logout { refresh_token } -> { message }
  async logout(refresh_token) {
    const { data } = await api.post('/api/auth/logout', { refresh_token });
    return data;
  },

  // GET /api/auth/me -> { id, full_name, email, is_active }
  // NOTE: this route is not in the uploaded backend yet; see backend_patch/README.md.
  async me() {
    const { data } = await api.get('/api/auth/me');
    return data;
  },
};

export default authService;
