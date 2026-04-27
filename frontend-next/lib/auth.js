export function getToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('access_token');
}

export function getUser() {
  if (typeof window === 'undefined') return null;
  try {
    return JSON.parse(localStorage.getItem('user') || 'null');
  } catch { return null; }
}

export function clearAuth() {
  localStorage.removeItem('access_token');
  localStorage.removeItem('user');
}

export function isTokenExpired(token) {
  if (!token) return true;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 < Date.now();
  } catch { return true; }
}

export function requireAuth(router) {
  const token = getToken();
  if (!token || isTokenExpired(token)) {
    clearAuth();
    router.push('/auth/login');
    return false;
  }
  return true;
}
