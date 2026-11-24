import api, { refreshSession } from './api';
import { tokenStore } from './tokenStore';

const baseURL = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000').replace(/\/+$/, '');

// Error shaped like an Axios error so utils/errors.getErrorMessage() works for both.
function httpError(status, data) {
  const err = new Error(`Request failed (HTTP ${status})`);
  err.response = { status, data };
  return err;
}

async function postStream(path, formData, signal) {
  const doFetch = () =>
    fetch(`${baseURL}${path}`, {
      method: 'POST',
      body: formData,
      signal,
      headers: tokenStore.getAccess() ? { Authorization: `Bearer ${tokenStore.getAccess()}` } : {},
    });

  let res = await doFetch();

  // Same session rules as the Axios interceptor: refresh once on 401, then retry.
  if (res.status === 401) {
    try {
      await refreshSession();
    } catch (refreshError) {
      if (refreshError.response || refreshError.noRefreshToken) {
        tokenStore.clear();
        window.dispatchEvent(new Event('auth:logout'));
      }
      throw httpError(401, { detail: 'Your session has expired. Please sign in again.' });
    }
    res = await doFetch();
  }

  if (!res.ok) {
    let data = null;
    try { data = await res.json(); } catch { /* not JSON */ }
    throw httpError(res.status, data);
  }

  return res;
}

// Every function maps 1:1 to a route in backend/routes/chat_routes.py.
export const chatService = {
  list: () => api.get('/api/chat/conversations').then((r) => r.data),
  create: () => api.post('/api/chat/conversations', {}).then((r) => r.data),
  get: (id, signal) => api.get(`/api/chat/conversations/${id}`, { signal }).then((r) => r.data),
  rename: (id, title) => api.patch(`/api/chat/conversations/${id}`, { title }).then((r) => r.data),
  remove: (id) => api.delete(`/api/chat/conversations/${id}`),

  /**
   * Sends a message (and optional resume file) and streams the reply.
   * onEvent receives: {type:'start'|'tool'|'delta'|'done'|'error', ...}
   */
  send(id, { content, file }, options) {
    const form = new FormData();
    form.append('content', content || '');
    if (file) form.append('file', file);
    return streamEvents(`/api/chat/conversations/${id}/messages`, form, options);
  },

  /** Replaces the last AI reply with a new one (streamed like send). */
  regenerate(id, options) {
    return streamEvents(`/api/chat/conversations/${id}/regenerate`, undefined, options);
  },
};

async function streamEvents(path, body, { onEvent, signal } = {}) {
    const res = await postStream(path, body, signal);
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      let sep;
      while ((sep = buffer.indexOf('\n\n')) !== -1) {
        const raw = buffer.slice(0, sep);
        buffer = buffer.slice(sep + 2);
        const line = raw.split('\n').find((l) => l.startsWith('data: '));
        if (!line) continue;
        try {
          onEvent?.(JSON.parse(line.slice(6)));
        } catch { /* ignore malformed event */ }
      }
    }
}

export const RESUME_ACCEPT = '.pdf,.docx,.txt';
export const MAX_RESUME_MB = 5;

/** Returns an error message, or '' when the file can be uploaded. */
export function validateResumeFile(file) {
  if (!file) return 'No file selected.';
  const ext = file.name.includes('.') ? file.name.slice(file.name.lastIndexOf('.')).toLowerCase() : '';
  if (!RESUME_ACCEPT.split(',').includes(ext)) return 'Please upload a PDF, DOCX or TXT file.';
  if (file.size > MAX_RESUME_MB * 1024 * 1024) return `File is too large (max ${MAX_RESUME_MB} MB).`;
  return '';
}

/** The backend sends UTC times without a timezone suffix; treat them as UTC. */
export function parseServerDate(value) {
  if (!value) return null;
  const s = String(value);
  const date = new Date(/[zZ]|[+-]\d\d:?\d\d$/.test(s) ? s : `${s}Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export default chatService;
