/* ============================================================
   Frontend Auth Service  –  JWT token management
   ============================================================ */

const API_BASE = 'http://localhost:4000/api';

const Auth = (() => {

  /* ── Storage helpers ── */
  function saveSession(data) {
    localStorage.setItem('svss_access_token',  data.accessToken);
    localStorage.setItem('svss_refresh_token', data.refreshToken);
    localStorage.setItem('svss_user',          JSON.stringify(data.user));
  }

  function clearSession() {
    localStorage.removeItem('svss_access_token');
    localStorage.removeItem('svss_refresh_token');
    localStorage.removeItem('svss_user');
  }

  function getAccessToken()  { return localStorage.getItem('svss_access_token');  }
  function getRefreshToken() { return localStorage.getItem('svss_refresh_token'); }

  function getUser() {
    try { return JSON.parse(localStorage.getItem('svss_user')); }
    catch { return null; }
  }

  function isLoggedIn() { return !!getAccessToken(); }

  function hasPermission(permission) {
    const user = getUser();
    if (!user) return false;
    return Array.isArray(user.permissions) && user.permissions.includes(permission);
  }

  function isAdmin() {
    const user = getUser();
    return user?.role === 'admin';
  }

  /* ── API call with auto-refresh ── */
  async function apiFetch(path, options = {}) {
    const token = getAccessToken();
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    };

    let res = await fetch(`${API_BASE}${path}`, { ...options, headers });

    // Auto-refresh on 401 TOKEN_EXPIRED
    if (res.status === 401) {
      const body = await res.clone().json().catch(() => ({}));
      if (body.code === 'TOKEN_EXPIRED') {
        const refreshed = await refreshAccessToken();
        if (refreshed) {
          headers.Authorization = `Bearer ${getAccessToken()}`;
          res = await fetch(`${API_BASE}${path}`, { ...options, headers });
        } else {
          clearSession();
          window.location.href = 'index.html';
          return null;
        }
      }
    }

    return res;
  }

  /* ── Refresh access token ── */
  async function refreshAccessToken() {
    const refreshToken = getRefreshToken();
    if (!refreshToken) return false;

    try {
      const res  = await fetch(`${API_BASE}/auth/refresh`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ refreshToken }),
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem('svss_access_token', data.data.accessToken);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  /* ── Login ── */
  async function login(email, password, remember = false) {
    const res  = await fetch(`${API_BASE}/auth/login`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ email, password }),
    });
    const data = await res.json();

    if (data.success) {
      saveSession(data.data);
      if (!remember) {
        // Clear tokens on tab close if "remember me" is off
        sessionStorage.setItem('svss_session_only', '1');
      }
    }

    return data;
  }

  /* ── Register ── */
  async function register(payload) {
    const res  = await fetch(`${API_BASE}/auth/register`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    });
    return res.json();
  }

  /* ── Logout ── */
  async function logout() {
    const refreshToken = getRefreshToken();
    try {
      await apiFetch('/auth/logout', {
        method: 'POST',
        body:   JSON.stringify({ refreshToken }),
      });
    } catch { /* ignore */ }
    clearSession();
    window.location.href = 'index.html';
  }

  /* ── Redirect based on role after login ── */
  function redirectAfterLogin(role) {
    window.location.href = 'dashboard.html';
  }

  /* ── Guard: call on protected pages ── */
  function requireAuth(requiredPermission = null) {
    if (!isLoggedIn()) {
      window.location.href = 'index.html';
      return false;
    }
    if (requiredPermission && !hasPermission(requiredPermission)) {
      window.location.href = 'unauthorized.html';
      return false;
    }
    return true;
  }

  return {
    login,
    register,
    logout,
    getUser,
    getAccessToken,
    isLoggedIn,
    isAdmin,
    hasPermission,
    apiFetch,
    requireAuth,
    redirectAfterLogin,
  };
})();
