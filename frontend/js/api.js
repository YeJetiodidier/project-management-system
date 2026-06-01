const API = {
  async request(method, path, body) {
    const opts = { method, headers: { 'Content-Type': 'application/json' } };
    if (body) opts.body = JSON.stringify(body);
    const token = sessionStorage.getItem('pms_token');
    if (token) opts.headers['Authorization'] = 'Bearer ' + token;
    try {
      const res = await fetch(path, opts);
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: res.statusText }));
        throw new Error(err.message || 'Request failed');
      }
      const text = await res.text();
      return text ? JSON.parse(text) : null;
    } catch (e) {
      if (e.message.includes('Failed to fetch')) {
        throw new Error('Unable to reach server. Please check your connection.');
      }
      throw e;
    }
  },

  get(path)    { return this.request('GET', path); },
  post(path, body) { return this.request('POST', path, body); },
  put(path, body)  { return this.request('PUT', path, body); },
  del(path)   { return this.request('DELETE', path); },
};

const Auth = {
  role()   { return sessionStorage.getItem('pms_role') || 'member'; },
  isManager() { return this.role() === 'manager'; },
  isMember()  { return this.role() === 'member'; },
  id()     { return sessionStorage.getItem('pms_id') || sessionStorage.getItem('pms_userId') || ''; },
  name()   { return sessionStorage.getItem('pms_name') || sessionStorage.getItem('pms_username') || 'User'; },
  userId() { return sessionStorage.getItem('pms_userId') || ''; },
  userLabel(user) {
    if (!user) return '';
    const displayName = user.name || user.username || user.email || user.id;
    if (user.role === 'member' && user.userId) {
      return displayName + ' — User ID: ' + user.userId;
    }
    if (user.role === 'manager') {
      return displayName + ' (Manager)';
    }
    return displayName;
  },
  logout() {
    sessionStorage.clear();
    window.location.href = 'login.html';
  }
};

document.addEventListener('DOMContentLoaded', function () {
  document.querySelectorAll('[data-requires="manager"]').forEach(function (el) {
    if (!Auth.isManager()) el.style.display = 'none';
  });
  document.querySelectorAll('[data-requires="member"]').forEach(function (el) {
    if (!Auth.isMember()) el.style.display = 'none';
  });
});
