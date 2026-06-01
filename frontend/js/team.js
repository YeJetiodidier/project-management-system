(function () {
  'use strict';

  const teamList = document.getElementById('teamList');
  const emptyState = document.getElementById('emptyState');
  const searchInput = document.getElementById('searchInput');
  const sortBy = document.getElementById('sortBy');
  const viewGrid = document.getElementById('viewGrid');
  const viewList = document.getElementById('viewList');
  const openTeamModalBtn = document.getElementById('openTeamModalBtn');
  const teamModalOverlay = document.getElementById('teamModalOverlay');
  const closeTeamModalBtn = document.getElementById('closeTeamModalBtn');
  const cancelTeamBtn = document.getElementById('cancelTeamBtn');
  const saveTeamBtn = document.getElementById('saveTeamBtn');

  const statTeams = document.getElementById('statTeams');
  const statMembers = document.getElementById('statMembers');
  const statLeaders = document.getElementById('statLeaders');
  const statAvg = document.getElementById('statAvg');

  let teamsData = [];
  let usersData = [];
  let currentView = 'grid';

  function escapeHtml(t) {
    const d = document.createElement('div');
    d.textContent = t == null ? '' : String(t);
    return d.innerHTML;
  }

  function userLabel(id) {
    if (!id) return null;
    const u = usersData.find(x => x.id === id);
    if (!u) return null;
    return u.name || u.username || u.email || id;
  }

  function userInitial(id) {
    const name = userLabel(id);
    return name ? name.charAt(0).toUpperCase() : '?';
  }

  function avatarColorFor(id) {
    const colors = [
      'linear-gradient(135deg, #6d63f5, #06b6d4)',
      'linear-gradient(135deg, #f59e0b, #ef4444)',
      'linear-gradient(135deg, #10b981, #06b6d4)',
      'linear-gradient(135deg, #a855f7, #ec4899)',
      'linear-gradient(135deg, #3b82f6, #8b5cf6)',
      'linear-gradient(135deg, #14b8a6, #22c55e)',
    ];
    let hash = 0;
    for (let i = 0; i < (id || '').length; i++) hash = (hash * 31 + id.charCodeAt(i)) & 0xffffffff;
    return colors[Math.abs(hash) % colors.length];
  }

  async function fetchTeams() {
    try {
      const r = await fetch('/api/teams');
      if (r.ok) teamsData = await r.json();
      updateStats();
      renderTeams();
    } catch (e) { console.error('Failed to fetch teams', e); }
  }

  async function fetchUsers() {
    try {
      const r = await fetch('/api/users');
      if (r.ok) usersData = await r.json();
    } catch (e) { /* ignore */ }
  }

  function updateStats() {
    if (statTeams) statTeams.textContent = teamsData.length;
    const totalMembers = teamsData.reduce((acc, t) => acc + ((t.members || []).length), 0);
    if (statMembers) statMembers.textContent = totalMembers;
    const leaders = teamsData.filter(t => t.leader && userLabel(t.leader)).length;
    if (statLeaders) statLeaders.textContent = leaders;
    const avg = teamsData.length > 0 ? (totalMembers / teamsData.length) : 0;
    if (statAvg) statAvg.textContent = teamsData.length > 0 ? avg.toFixed(1) : '0';
  }

  function getFilteredTeams() {
    const search = (searchInput?.value || '').toLowerCase().trim();
    const sortType = sortBy?.value || 'newest';

    let teams = teamsData.slice();
    if (search) {
      teams = teams.filter(t => {
        if ((t.name || '').toLowerCase().includes(search)) return true;
        if (t.leader && userLabel(t.leader) && userLabel(t.leader).toLowerCase().includes(search)) return true;
        if ((t.members || []).some(id => {
          const lbl = userLabel(id);
          return lbl && lbl.toLowerCase().includes(search);
        })) return true;
        return false;
      });
    }

    switch (sortType) {
      case 'oldest':
        teams.sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
        break;
      case 'name':
        teams.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        break;
      case 'size':
        teams.sort((a, b) => ((b.members || []).length) - ((a.members || []).length));
        break;
      case 'newest':
      default:
        teams.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    }
    return teams;
  }

  function renderTeamCard(t) {
    const isGrid = currentView === 'grid';
    const memberIds = t.members || [];
    const leaderLabel = userLabel(t.leader);
    const leaderInitial = userInitial(t.leader);
    const teamInitial = (t.name || 'T').charAt(0).toUpperCase();

    const maxChips = 5;
    const visibleMembers = memberIds.slice(0, maxChips);
    const extraCount = memberIds.length - visibleMembers.length;
    const membersHtml = visibleMembers.map(id =>
      `<div class="member-bubble" style="background:${avatarColorFor(id)};" title="${escapeHtml(userLabel(id) || id)}">${escapeHtml(userInitial(id))}</div>`
    ).join('') + (extraCount > 0 ? `<div class="member-bubble more">+${extraCount}</div>` : '');

    const memberNames = memberIds.length === 0
      ? '<span class="team-members-empty">No members yet</span>'
      : memberIds.map(id => {
          const lbl = userLabel(id) || id;
          const isLeader = id === t.leader;
          return `<span class="member-chip ${isLeader ? 'leader-chip' : ''}">
            <span class="member-chip-avatar" style="background:${avatarColorFor(id)};">${escapeHtml(userInitial(id))}</span>
            ${escapeHtml(lbl)}${isLeader ? ' ★' : ''}
          </span>`;
        }).join('');

    const canManage = Auth.isManager();
    const actions = canManage ? `
      <div class="team-footer">
        <button class="btn-action" data-edit-team="${escapeHtml(t.id)}">✏️ Edit</button>
        <button class="btn-action danger" data-del-team="${escapeHtml(t.id)}">🗑️ Delete</button>
      </div>` : '';

    return `
      <div class="team-item ${isGrid ? 'grid-view' : ''}">
        <div class="team-item-header">
          <div class="team-avatar" style="background:${avatarColorFor(t.id)};">${escapeHtml(teamInitial)}</div>
          <div class="team-info">
            <div class="team-name">${escapeHtml(t.name || 'Unnamed Team')}</div>
            <div class="team-leader">👑 <strong>${escapeHtml(leaderLabel || 'No leader')}</strong></div>
          </div>
        </div>
        <div class="team-body">
          <div class="team-members-row">
            <div class="team-members-count">Members <span>${memberIds.length}</span></div>
            <div class="team-members-stack">${membersHtml || ''}</div>
          </div>
          ${memberIds.length > 0 ? `<div class="team-members-list">${memberNames}</div>` : ''}
        </div>
        ${actions}
      </div>
    `;
  }

  function renderTeams() {
    const filtered = getFilteredTeams();
    if (filtered.length === 0) {
      if (emptyState) emptyState.style.display = 'flex';
      if (teamList) {
        teamList.className = 'team-list';
        teamList.innerHTML = '';
      }
      return;
    }
    if (emptyState) emptyState.style.display = 'none';
    if (teamList) {
      teamList.className = 'team-list' + (currentView === 'grid' ? ' grid-view' : '');
      teamList.innerHTML = filtered.map(renderTeamCard).join('');
    }
  }

  function populateUserSelects(selectedLeader, selectedMembers) {
    const leaderSel = document.getElementById('teamLeader');
    const memberSel = document.getElementById('teamMembers');
    const userOpts = usersData.map(u => {
      const label = (u.name || u.username || u.email || u.id);
      return `<option value="${escapeHtml(u.id)}">${escapeHtml(label)}</option>`;
    }).join('');
    if (leaderSel) leaderSel.innerHTML = '<option value="">— None —</option>' + userOpts;
    if (memberSel) memberSel.innerHTML = userOpts;
    if (selectedLeader && leaderSel) leaderSel.value = selectedLeader;
    if (selectedMembers && selectedMembers.length && memberSel) {
      Array.from(memberSel.options).forEach(o => {
        if (selectedMembers.includes(o.value)) o.selected = true;
      });
    }
  }

  function openModal() {
    document.getElementById('editTeamId').value = '';
    document.getElementById('teamName').value = '';
    document.getElementById('teamModalTitle').textContent = 'New Team';
    populateUserSelects('', []);
    teamModalOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    teamModalOverlay.classList.remove('active');
    document.body.style.overflow = '';
  }

  function editTeam(id) {
    const t = teamsData.find(x => x.id === id);
    if (!t) return;
    document.getElementById('editTeamId').value = id;
    document.getElementById('teamName').value = t.name || '';
    document.getElementById('teamModalTitle').textContent = 'Edit Team';
    populateUserSelects(t.leader || '', t.members || []);
    teamModalOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  async function saveTeam() {
    const name = document.getElementById('teamName').value.trim();
    if (!name) { alert('Team name is required'); return; }
    const editId = document.getElementById('editTeamId').value;
    const memberSel = document.getElementById('teamMembers');
    const members = Array.from(memberSel.selectedOptions).map(o => o.value);
    const payload = {
      id: editId || undefined,
      name,
      leader: document.getElementById('teamLeader').value,
      members
    };
    await fetch('/api/teams', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    closeModal();
    fetchTeams();
  }

  async function deleteTeam(id) {
    if (!confirm('Delete this team?')) return;
    await fetch('/api/teams?id=' + encodeURIComponent(id), { method: 'DELETE' });
    fetchTeams();
  }

  document.addEventListener('click', function (e) {
    const editId = e.target.closest('[data-edit-team]')?.getAttribute('data-edit-team');
    if (editId) { editTeam(editId); return; }
    const delId = e.target.closest('[data-del-team]')?.getAttribute('data-del-team');
    if (delId) { deleteTeam(delId); }
  });

  if (openTeamModalBtn) openTeamModalBtn.addEventListener('click', async () => {
    await fetchUsers();
    openModal();
  });
  if (closeTeamModalBtn) closeTeamModalBtn.addEventListener('click', closeModal);
  if (cancelTeamBtn) cancelTeamBtn.addEventListener('click', closeModal);
  if (saveTeamBtn) saveTeamBtn.addEventListener('click', saveTeam);
  if (teamModalOverlay) teamModalOverlay.addEventListener('click', (e) => {
    if (e.target === teamModalOverlay) closeModal();
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });
  if (searchInput) searchInput.addEventListener('input', renderTeams);
  if (sortBy) sortBy.addEventListener('change', renderTeams);

  if (viewGrid) viewGrid.addEventListener('click', () => {
    currentView = 'grid';
    viewGrid.classList.add('active');
    viewList?.classList.remove('active');
    renderTeams();
  });
  if (viewList) viewList.addEventListener('click', () => {
    currentView = 'list';
    viewList.classList.add('active');
    viewGrid?.classList.remove('active');
    renderTeams();
  });

  document.addEventListener('DOMContentLoaded', () => {
    fetchUsers().then(fetchTeams);
  });
})();
