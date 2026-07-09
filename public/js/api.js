/* ============================================================
   C2S VLSI Lab Portal — API Client
   Centralized HTTP client with auth management
   ============================================================ */

const API_BASE = '/api';
const TOKEN_KEY = 'c2s_token';
const USER_KEY = 'c2s_user';

// ── Auth Helpers ──────────────────────────────────────────────

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

function getUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function setUser(user) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

function isLoggedIn() {
  return !!getToken() && !!getUser();
}

function isAdmin() {
  const user = getUser();
  return user && user.role === 'admin';
}

// ── Core API Function ─────────────────────────────────────────

async function api(endpoint, options = {}) {
  const url = `${API_BASE}/${endpoint.replace(/^\//, '')}`;
  const token = getToken();

  const headers = {};

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (options.body && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const config = {
    method: options.method || 'GET',
    headers: { ...headers, ...options.headers },
  };

  if (options.body) {
    config.body = (options.body instanceof FormData || typeof options.body === 'string')
      ? options.body
      : JSON.stringify(options.body);
  }

  try {
    const response = await fetch(url, config);

    if (response.status === 401) {
      clearAuth();
      if (typeof navigate === 'function') {
        navigate('/login');
      }
      throw new Error('Session expired. Please login again.');
    }

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const message = (data && (data.error || data.message)) || `Request failed (${response.status})`;
      const err = new Error(message);
      err.status = response.status;
      err.data = data;
      throw err;
    }

    return data;
  } catch (err) {
    if (err.name === 'TypeError' && err.message.includes('fetch')) {
      throw new Error('Network error. Please check your connection.');
    }
    throw err;
  }
}

// ── Convenience Methods ──────────────────────────────────────

api.get = (endpoint) => api(endpoint, { method: 'GET' });

api.post = (endpoint, data) => api(endpoint, {
  method: 'POST',
  body: data,
});

api.put = (endpoint, data) => api(endpoint, {
  method: 'PUT',
  body: data,
});

api.delete = (endpoint) => api(endpoint, { method: 'DELETE' });

// ── Make available globally ──────────────────────────────────
window.api = api;
window.getToken = getToken;
window.setToken = setToken;
window.getUser = getUser;
window.setUser = setUser;
window.clearAuth = clearAuth;
window.isLoggedIn = isLoggedIn;
window.isAdmin = isAdmin;
