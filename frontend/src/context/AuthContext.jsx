import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import authService from '../services/authService';
import { refreshSession } from '../services/api';
import { tokenStore } from '../services/tokenStore';
import { decodeJwtPayload } from '../utils/jwt';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // 'loading' (restoring session) | 'authenticated' | 'unauthenticated'
  const [status, setStatus] = useState('loading');
  // True when GET /api/auth/me does not exist on the backend and limited info is used.
  const [profileLimited, setProfileLimited] = useState(false);

  const loadUser = useCallback(async () => {
    try {
      const me = await authService.me();
      setProfileLimited(false);
      setUser(me);
    } catch (err) {
      if (err.response && (err.response.status === 404 || err.response.status === 405)) {
        const payload = decodeJwtPayload(tokenStore.getAccess() || '');
        const cached = tokenStore.getProfileCache() || {};
        setProfileLimited(true);
        setUser({
          id: payload?.sub ? Number(payload.sub) : null,
          full_name: cached.full_name || '',
          email: cached.email || '',
          is_active: true,
        });
        return;
      }
      throw err;
    }
  }, []);

  // Session restoration: exchange the stored refresh token for fresh tokens, then load the user.
  useEffect(() => {
    let active = true;
    (async () => {
      if (!tokenStore.getRefresh()) {
        setStatus('unauthenticated');
        return;
      }
      try {
        await refreshSession(); // shared in-flight promise, safe under React StrictMode
        await loadUser();
        if (active) setStatus('authenticated');
      } catch {
        if (active) {
          setUser(null);
          setStatus('unauthenticated');
        }
      }
    })();
    return () => {
      active = false;
    };
  }, [loadUser]);

  // Fired by the Axios interceptor when a refresh is rejected.
  useEffect(() => {
    const onForcedLogout = () => {
      setUser(null);
      setStatus('unauthenticated');
    };
    window.addEventListener('auth:logout', onForcedLogout);
    return () => window.removeEventListener('auth:logout', onForcedLogout);
  }, []);

  const login = useCallback(
    async ({ email, password }) => {
      const tokens = await authService.login({ email, password });
      tokenStore.setTokens(tokens);
      const cached = tokenStore.getProfileCache();
      tokenStore.setProfileCache({ ...(cached?.email === email ? cached : {}), email });
      try {
        await loadUser();
      } catch (err) {
        tokenStore.clear();
        throw err;
      }
      setStatus('authenticated');
    },
    [loadUser],
  );

  const signup = useCallback(
    async ({ full_name, email, password }) => {
      await authService.signup({ full_name, email, password });
      tokenStore.setProfileCache({ full_name, email });
      await login({ email, password });
    },
    [login],
  );

  const logout = useCallback(async () => {
    const refreshToken = tokenStore.getRefresh();
    try {
      if (refreshToken) await authService.logout(refreshToken);
    } catch {
      /* the token is discarded locally regardless */
    } finally {
      tokenStore.clear();
      setUser(null);
      setStatus('unauthenticated');
    }
  }, []);

  const value = useMemo(
    () => ({ user, status, profileLimited, isAuthenticated: status === 'authenticated', login, signup, logout }),
    [user, status, profileLimited, login, signup, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
