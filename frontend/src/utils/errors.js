import axios from 'axios';

export function isCanceled(error) {
  return axios.isCancel(error) || error?.code === 'ERR_CANCELED';
}

// Turns any Axios/FastAPI error into a short, user-friendly message.
export function getErrorMessage(error) {
  if (!error) return 'Something went wrong.';

  if (!error.response) {
    if (error.code === 'ECONNABORTED') return 'The request timed out. Please try again.';
    return 'Cannot reach the server. Make sure the FastAPI backend is running and VITE_API_BASE_URL is correct.';
  }

  const { status, data } = error.response;
  const detail = data?.detail;

  // FastAPI validation errors: detail is an array of { loc, msg }
  if (Array.isArray(detail)) {
    return detail
      .map((d) => {
        const field = Array.isArray(d.loc) ? d.loc[d.loc.length - 1] : null;
        return field && field !== 'body' ? `${field}: ${d.msg}` : d.msg;
      })
      .join(' · ');
  }
  if (typeof detail === 'string' && detail) return detail;

  if (status === 401) return 'Your session has expired. Please sign in again.';
  if (status === 403) return 'You do not have permission to perform this action.';
  if (status === 404) return 'The requested resource was not found.';
  if (status >= 500) return 'The server ran into an error. Please try again shortly.';
  return `Request failed (HTTP ${status}).`;
}
