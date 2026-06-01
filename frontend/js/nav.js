(function () {
  'use strict';

  const originalFetch = window.fetch;
  window.fetch = function (input, init) {
    init = init || {};
    const headers = new Headers(init.headers || {});
    const token = sessionStorage.getItem('pms_token');
    if (token) {
      headers.set('Authorization', 'Bearer ' + token);
    }
    init.headers = headers;
    return originalFetch(input, init);
  };

  async function refreshBadges() {
    const token = sessionStorage.getItem('pms_token');
    if (!token) return;

    try {
      const [projRes, taskRes, notifRes] = await Promise.all([
        fetch('/api/projects'),
        fetch('/api/tasks'),
        fetch('/api/notifications?userId=' + encodeURIComponent(sessionStorage.getItem('pms_id') || sessionStorage.getItem('pms_userId') || ''))
      ]);

      if (projRes.ok) {
        const projects = await projRes.json();
        const badge = document.getElementById('badge-projects');
        if (badge) badge.textContent = projects.length;
      }
      if (taskRes.ok) {
        const tasks = await taskRes.json();
        const badge = document.getElementById('badge-tasks');
        if (badge) badge.textContent = tasks.length;
      }
      if (notifRes.ok) {
        const notifs = await notifRes.json();
        const unread = notifs.filter(function (n) { return !n.isread && !n.isRead; }).length;
        const badge = document.getElementById('badge-notif');
        if (badge) {
          badge.textContent = unread;
          badge.style.display = unread > 0 ? 'inline-block' : 'none';
        }
      }
    } catch (e) { /* server might be offline */ }
  }

  document.addEventListener('DOMContentLoaded', refreshBadges);
})();
