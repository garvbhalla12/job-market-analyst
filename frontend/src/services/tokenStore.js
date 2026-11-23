// Token handling.
// - The access token lives in memory only (short-lived, 30 min by default on the backend).
// - The backend returns the refresh token in the JSON body (no cookies), so it is kept in
//   localStorage to allow session restoration after a page reload. It is single-use:
//   every refresh rotates it.
const REFRESH_KEY = 'jma_refresh_token';
const PROFILE_KEY = 'jma_profile_cache';

let accessToken = null;

const safeStorage = {
  get(key) {
    try { return window.localStorage.getItem(key); } catch { return null; }
  },
  set(key, value) {
    try { window.localStorage.setItem(key, value); } catch { /* storage unavailable */ }
  },
  remove(key) {
    try { window.localStorage.removeItem(key); } catch { /* storage unavailable */ }
  },
};

export const tokenStore = {
  getAccess: () => accessToken,
  getRefresh: () => safeStorage.get(REFRESH_KEY),
  setTokens({ access_token, refresh_token }) {
    if (access_token) accessToken = access_token;
    if (refresh_token) safeStorage.set(REFRESH_KEY, refresh_token);
  },
  clear() {
    accessToken = null;
    safeStorage.remove(REFRESH_KEY);
    safeStorage.remove(PROFILE_KEY);
  },
  // Non-secret display info (name/email) used only if GET /api/auth/me is unavailable.
  getProfileCache() {
    try { return JSON.parse(safeStorage.get(PROFILE_KEY) || 'null'); } catch { return null; }
  },
  setProfileCache(profile) {
    safeStorage.set(PROFILE_KEY, JSON.stringify(profile));
  },
};
