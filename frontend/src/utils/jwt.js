// Reads the (non-secret) `sub` claim from an access token. Used only as a fallback
// when GET /api/auth/me is unavailable. The token is NOT verified here; the backend does that.
export function decodeJwtPayload(token) {
  try {
    const part = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(part.padEnd(part.length + ((4 - (part.length % 4)) % 4), '=')));
  } catch {
    return null;
  }
}
