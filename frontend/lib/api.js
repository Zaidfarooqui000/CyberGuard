// Small helper around fetch() that talks to the Express API.
// It adds the JWT token automatically and turns errors into exceptions.

// Live backend on Vercel. Used whenever the site is NOT opened on localhost.
const PRODUCTION_API_URL = 'https://cyber-guard-gilt.vercel.app/api';
// Local development backend (can be changed in frontend/.env.local).
const LOCAL_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export function getApiUrl() {
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host !== 'localhost' && host !== '127.0.0.1') return PRODUCTION_API_URL;
  }
  return LOCAL_API_URL;
}

const TOKEN_KEY = 'cyberguard_token';

export function getToken() {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* storage unavailable – ignore */
  }
}

export async function api(path, { method = 'GET', body, auth = true } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (auth && token) headers.Authorization = `Bearer ${token}`;

  let response;
  try {
    response = await fetch(`${getApiUrl()}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error('Cannot reach the CyberGuard server. Please try again in a moment.');
  }

  let data = {};
  try {
    data = await response.json();
  } catch {
    /* empty response */
  }

  if (!response.ok) {
    const error = new Error(data.message || `Request failed (${response.status})`);
    error.status = response.status;
    // Expired or invalid session: clear token so the user is sent to login.
    if (response.status === 401 && auth) {
      setToken(null);
      if (typeof window !== 'undefined') window.dispatchEvent(new Event('cyberguard:logout'));
    }
    throw error;
  }
  return data;
}
