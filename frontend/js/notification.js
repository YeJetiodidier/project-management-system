/**
 * notification.js – Logic for the Notifications page
 * Loads from /api/notifications, supports All / Unread / Mentions filters,
 * Mark as read (single + all).
 */

(function () {
  'use strict';

  const name = sessionStorage.getItem('pms_name') || sessionStorage.getItem('pms_username') || 'User';
  const initial = name.charAt(0).toUpperCase();
  const topbarAvatar = document.getElementById('topbarAvatar');
  if (topbarAvatar) topbarAvatar.textContent = initial;

  const filterBtns = document.querySelectorAll('.filter-btn');
  const notifList = document.getElementById('notifList');
  const markAllBtn = document.getElementById('markAllReadBtn');
  const badgeNotif = document.getElementById('badge-notif');

  let notifs = [];
  let activeFilter = 'all';

  function escapeHtml(t) {
    const d = document.createElement('div');
    d.textContent = t == null ? '' : String(t);
    return d.innerHTML;
  }
  function isRead(n) { return !!(n.isread || n.isRead); }
  function iconFor(n) {
    switch (n.type) {
      case 'task':       return '✓';
      case 'task_done':  return '✅';
      case 'comment':    return '💬';
      case 'project':    return '📁';
      default:           return '🔔';
    }
  }
  function typeOf(n) {
    if (n.type === 'comment' || (n.message || '').toLowerCase().includes('mention')) return 'mentions';
    return 'all';
  }
  function timeAgo(ts) {
    if (!ts) return '';
    const d = new Date(ts);
    if (isNaN(d.getTime())) return '';
    const seconds = Math.floor((Date.now() - d.getTime()) / 1000);
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return Math.floor(seconds / 60) + ' mins ago';
    if (seconds < 86400) return Math.floor(seconds / 3600) + ' hours ago';
    return Math.floor(seconds / 86400) + ' days ago';
  }

  function updateBadge() {
    if (!badgeNotif) return;
    const unread = notifs.filter(n => !isRead(n)).length;
    badgeNotif.textContent = unread;
    badgeNotif.style.display = unread > 0 ? 'inline-block' : 'none';
  }

  function matchesFilter(n) {
    if (activeFilter === 'all')      return true;
    if (activeFilter === 'unread')   return !isRead(n);
    if (activeFilter === 'mentions') return typeOf(n) === 'mentions';
    return true;
  }

  function render() {
    const list = notifs.filter(matchesFilter);
    if (list.length === 0) {
      notifList.innerHTML = '<p style="color:var(--text-muted);padding:16px;">No notifications.</p>';
    } else {
      notifList.innerHTML = list.map(n => `
        <div class="notif-item ${isRead(n) ? '' : 'unread'}" data-id="${escapeHtml(n.id)}" data-type="${escapeHtml(typeOf(n))}">
          <div class="notif-icon">${escapeHtml(iconFor(n))}</div>
          <div class="notif-content">
            <div class="notif-meta">
              <span class="notif-time">${escapeHtml(timeAgo(n.timestamp || n.createdAt))}</span>
            </div>
            <div class="notif-message">${escapeHtml(n.message || '')}</div>
            ${isRead(n) ? '' : `
              <div class="notif-actions">
                <button class="notif-action-btn mark-read-single">Mark as read</button>
              </div>
            `}
          </div>
        </div>
      `).join('');
    }
    updateBadge();
  }

  async function fetchNotifs() {
    const userId = sessionStorage.getItem('pms_id') || sessionStorage.getItem('pms_userId') || '';
    if (!userId) {
      notifList.innerHTML = '<p style="color:var(--text-muted);padding:16px;">Not signed in.</p>';
      return;
    }
    try {
      const r = await fetch('/api/notifications?userId=' + encodeURIComponent(userId));
      if (!r.ok) throw new Error('failed');
      notifs = await r.json();
      render();
    } catch (e) {
      notifList.innerHTML = '<p style="color:var(--text-muted);padding:16px;">Failed to load notifications.</p>';
    }
  }

  async function markRead(id) {
    await fetch('/api/notifications', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    });
    const n = notifs.find(x => x.id === id);
    if (n) { n.isread = true; n.isRead = true; }
    render();
  }

  async function markAllRead() {
    const unread = notifs.filter(n => !isRead(n));
    for (const n of unread) {
      await fetch('/api/notifications', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: n.id })
      });
      n.isread = true; n.isRead = true;
    }
    render();
  }

  filterBtns.forEach(btn => btn.addEventListener('click', function () {
    filterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    activeFilter = btn.getAttribute('data-filter');
    render();
  }));

  if (markAllBtn) markAllBtn.addEventListener('click', markAllRead);

  notifList.addEventListener('click', function (e) {
    const btn = e.target.closest('.mark-read-single');
    if (!btn) return;
    const item = btn.closest('.notif-item');
    if (item) markRead(item.getAttribute('data-id'));
  });

  document.addEventListener('DOMContentLoaded', fetchNotifs);
})();
