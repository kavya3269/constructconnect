export async function api(path, options = {}) {
  const res = await fetch(path, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options
  });
  const contentType = res.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');
  if (!res.ok) {
    const err = isJson ? await res.json() : { error: await res.text() };
    throw new Error(err.error || 'Request failed');
  }
  return isJson ? res.json() : res.text();
}

export async function getMe() {
  return api('/api/auth/me');
}

export async function login(email, password) {
  return api('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
}

export async function logout() {
  return api('/api/auth/logout', { method: 'POST' });
}

export async function registerAccount(payload) {
  return api('/api/auth/register', { method: 'POST', body: JSON.stringify(payload) });
}

export async function forgotPassword(email) {
  return api('/api/auth/forgot', { method: 'POST', body: JSON.stringify({ email }) });
}

export async function getMetrics() {
  return api('/api/dashboard/metrics');
}

export async function getRecentProjects() {
  return api('/api/dashboard/recent-projects');
}

export async function getNotifications() {
  return api('/api/notifications');
}

