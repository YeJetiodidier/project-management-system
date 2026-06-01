(function () {
  'use strict';

  const name = sessionStorage.getItem('pms_name') || sessionStorage.getItem('pms_username') || 'User';
  const role = sessionStorage.getItem('pms_role') || 'member';
  const userId = sessionStorage.getItem('pms_id') || sessionStorage.getItem('pms_userId') || '';
  const username = sessionStorage.getItem('pms_username') || '';
  const email = sessionStorage.getItem('pms_email') || '';

  const sidebarAvatar = document.getElementById('sidebarAvatar');
  const sidebarName = document.getElementById('sidebarName');
  if (sidebarAvatar) sidebarAvatar.textContent = name.charAt(0).toUpperCase();
  if (sidebarName) sidebarName.textContent = name;

  const profileAvatar = document.getElementById('profileAvatar');
  const profileName = document.getElementById('profileName');
  const profileEmail = document.getElementById('profileEmail');
  const profileId = document.getElementById('profileId');
  const profileRoleBadge = document.getElementById('profileRoleBadge');
  const profileRoleLabel = document.getElementById('profileRoleLabel');
  const profileJoin = document.getElementById('profileJoin');
  const accountTypeSub = document.getElementById('accountTypeSub');
  const accountTypePill = document.getElementById('accountTypePill');

  const statMyTasks = document.getElementById('statMyTasks');
  const statInProgress = document.getElementById('statInProgress');
  const statCompleted = document.getElementById('statCompleted');
  const statPending = document.getElementById('statPending');

  const profName = document.getElementById('profName');
  const profEmail = document.getElementById('profEmail');
  const profUsername = document.getElementById('profUsername');
  const profPassword = document.getElementById('profPassword');
  const profileForm = document.getElementById('profileForm');
  const status = document.getElementById('profileStatus');
  const logoutBtn = document.getElementById('logoutBtn');
  const logoutBtnInline = document.getElementById('logoutBtnInline');

  function formatDate(ts) {
    if (!ts) return '';
    const d = new Date(ts);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  function applyUserToHero(u) {
    const displayName = (u.name || u.username || u.email || name || 'User');
    const displayEmail = (u.email || email || '');
    const displayId = (u.userId || userId || u.id || '—');
    const displayRole = (u.role || role || 'member');
    const roleLabel = displayRole === 'manager' ? 'Project Manager' : 'Project Member';
    const initial = displayName.charAt(0).toUpperCase();

    if (profileAvatar) profileAvatar.textContent = initial;
    if (profileName) profileName.textContent = displayName;
    if (profileEmail) profileEmail.textContent = displayEmail;
    if (profileId) profileId.textContent = 'ID: ' + displayId;
    if (profileRoleBadge) {
      profileRoleBadge.textContent = displayRole === 'manager' ? 'Manager' : 'Member';
      profileRoleBadge.style.background = displayRole === 'manager' ? 'var(--cyan)' : 'var(--accent)';
    }
    if (profileRoleLabel) profileRoleLabel.textContent = roleLabel;
    if (profileJoin) {
      const joined = formatDate(u.createdAt || u.created_at);
      profileJoin.textContent = joined ? 'Joined ' + joined : 'Member since signup';
    }
    if (accountTypeSub) accountTypeSub.textContent = displayRole === 'manager'
      ? 'Full project management access'
      : 'Task and collaboration access';
    if (accountTypePill) {
      accountTypePill.textContent = displayRole === 'manager' ? 'Manager' : 'Member';
      accountTypePill.classList.toggle('manager', displayRole === 'manager');
    }
  }

  applyUserToHero({ name, email, userId, role });

  async function loadUser() {
    if (!userId) return;
    try {
      const r = await fetch('/api/users?id=' + encodeURIComponent(userId));
      if (!r.ok) return;
      const u = await r.json();
      if (profName)     profName.value     = u.name || '';
      if (profEmail)    profEmail.value    = u.email || '';
      if (profUsername) profUsername.value = u.username || '';
      applyUserToHero(u);
    } catch (e) { /* ignore */ }
  }

  async function loadStats() {
    if (!userId) return;
    try {
      const r = await fetch('/api/dashboard?userId=' + encodeURIComponent(userId));
      if (!r.ok) return;
      const s = await r.json();
      if (statMyTasks)    statMyTasks.textContent = s.assignedTasks || 0;
      if (statInProgress) statInProgress.textContent = s.inProgressTasks || 0;
      if (statCompleted)  statCompleted.textContent = s.completedTasks || 0;
      if (statPending)    statPending.textContent = s.pendingTasks || 0;
    } catch (e) { /* ignore */ }
  }

  function setStatus(msg, kind) {
    if (!status) return;
    status.textContent = msg;
    status.classList.remove('success', 'error');
    if (kind) status.classList.add(kind);
    if (msg) {
      setTimeout(() => {
        if (status.textContent === msg) {
          status.textContent = '';
          status.classList.remove('success', 'error');
        }
      }, 3000);
    }
  }

  if (profileForm) {
    profileForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      if (!userId) { setStatus('Not signed in.', 'error'); return; }
      const body = {
        name: profName.value.trim(),
        email: profEmail.value.trim(),
        username: profUsername.value.trim()
      };
      if (profPassword.value) body.password = profPassword.value;

      setStatus('Saving…');
      try {
        const r = await fetch('/api/users?id=' + encodeURIComponent(userId), {
          method: 'PUT', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });
        if (!r.ok) throw new Error('save failed');
        const u = await r.json();
        sessionStorage.setItem('pms_name', u.name || '');
        if (u.email) sessionStorage.setItem('pms_email', u.email);
        if (u.username) sessionStorage.setItem('pms_username', u.username);
        applyUserToHero(u);
        if (profPassword) profPassword.value = '';
        if (sidebarName) sidebarName.textContent = u.name || '';
        if (sidebarAvatar) sidebarAvatar.textContent = (u.name || 'U').charAt(0).toUpperCase();
        setStatus('✓ Saved successfully', 'success');
      } catch (err) {
        setStatus('✗ Failed to save changes', 'error');
      }
    });
  }

  function handleLogout(e) {
    if (e) e.preventDefault();
    sessionStorage.clear();
    window.location.href = 'login.html';
  }

  if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);
  if (logoutBtnInline) logoutBtnInline.addEventListener('click', handleLogout);

  document.addEventListener('DOMContentLoaded', () => {
    loadUser();
    loadStats();
  });
})();
