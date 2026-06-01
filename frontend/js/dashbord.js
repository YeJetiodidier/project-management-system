/**
 * dashbord.js – Dashboard logic (works for both manager and member)
 * Fetches /api/dashboard?stats (manager) or ?userId=... (member)
 * Renders real data into the existing HTML scaffold.
 */

(function () {
  'use strict';

  const name = sessionStorage.getItem('pms_name') || sessionStorage.getItem('pms_username') || 'User';
  const role = sessionStorage.getItem('pms_role') || 'member';
  const userId = sessionStorage.getItem('pms_id') || sessionStorage.getItem('pms_userId') || '';
  const initial = name.charAt(0).toUpperCase();

  const sidebarAvatar = document.getElementById('sidebarAvatar');
  const sidebarName   = document.getElementById('sidebarName');
  const topbarAvatar  = document.getElementById('topbarAvatar');
  if (sidebarAvatar) sidebarAvatar.textContent = initial;
  if (sidebarName)   sidebarName.textContent   = name;
  if (topbarAvatar)  topbarAvatar.textContent  = initial;

  function escapeHtml(t) {
    const d = document.createElement('div');
    d.textContent = t == null ? '' : String(t);
    return d.innerHTML;
  }
  function el(id) { return document.getElementById(id); }
  function safePct(part, total) { return total > 0 ? Math.round((part / total) * 100) : 0; }

  function setText(id, val) { const n = el(id); if (n) n.textContent = val; }

  let charts = {};
  function buildDoughnut(canvasId, labels, data, colors) {
    const ctx = el(canvasId);
    if (!ctx) return;
    if (charts[canvasId]) { charts[canvasId].destroy(); }
    charts[canvasId] = new Chart(ctx, {
      type: 'doughnut',
      data: { labels, datasets: [{ data, backgroundColor: colors, borderColor: 'transparent', borderWidth: 3, hoverOffset: 6 }] },
      options: { cutout: '68%', plugins: { legend: { display: false } }, animation: { duration: 900 } }
    });
  }
  function buildLine(canvasId, labels, datasets) {
    const ctx = el(canvasId);
    if (!ctx) return;
    if (charts[canvasId]) { charts[canvasId].destroy(); }
    charts[canvasId] = new Chart(ctx, {
      type: 'line',
      data: { labels, datasets },
      options: {
        responsive: true, maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        scales: {
          x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#64748b', font: { size: 11 } } },
          y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#64748b', font: { size: 11 } } }
        },
        plugins: { legend: { display: true, position: 'top', align: 'end', labels: { color: '#94a3b8', usePointStyle: true, pointStyle: 'circle', boxWidth: 8, font: { size: 11 } } } },
        animation: { duration: 900 }
      }
    });
  }

  function updateLegend(legendId, items) {
    const root = el(legendId);
    if (!root) return;
    root.innerHTML = items.map(it => `
      <div class="legend-item">
        <span class="legend-dot" style="background:${escapeHtml(it.color)};"></span>
        ${escapeHtml(it.label)} <span class="legend-pct">${escapeHtml(String(it.pct))}%</span>
      </div>
    `).join('');
  }

  async function loadManager() {
    try {
      const [statsRes, projectsRes, tasksRes] = await Promise.all([
        fetch('/api/dashboard?stats'),
        fetch('/api/projects'),
        fetch('/api/tasks')
      ]);
      if (!statsRes.ok) return;
      const s = await statsRes.json();
      const projects = projectsRes.ok ? await projectsRes.json() : [];
      const tasks = tasksRes.ok ? await tasksRes.json() : [];

      setText('statProjects', s.projects);
      setText('statTasks', s.tasks);
      setText('statMembers', s.users);
      setText('statFiles', s.files);

      const total = s.tasks || 0;
      const completed = s.completed || 0;
      const inProgress = s.inProgress || 0;
      const todo = s.todo || 0;
      const onHold = s.onHold || 0;

      buildDoughnut('tasksChart', ['Completed', 'On Hold', 'In Progress', 'Pending'],
        [completed, onHold, inProgress, todo],
        ['#10b981', '#6d63f5', '#06b6d4', '#ef4444']);
      updateLegend(null, [
        { color: '#10b981', label: 'Completed', pct: safePct(completed, total) },
        { color: '#6d63f5', label: 'On Hold',   pct: safePct(onHold, total) },
        { color: '#06b6d4', label: 'In Progress', pct: safePct(inProgress, total) },
        { color: '#ef4444', label: 'Pending',   pct: safePct(todo, total) }
      ]);

      const byProject = {};
      tasks.forEach(t => {
        const key = t.projectId || 'Unassigned';
        byProject[key] = (byProject[key] || 0) + 1;
      });
      const projectNames = projects.slice(0, 5).map(p => p.name);
      const workData = projects.slice(0, 5).map(p => byProject[p.id] || 0);
      buildDoughnut('worklogChart',
        projectNames.length ? projectNames : ['No data'],
        workData.length ? workData : [1],
        ['#ef4444', '#06b6d4', '#10b981', '#f59e0b', '#6d63f5']);
      updateLegend(null, projectNames.map((name, i) => ({
        color: ['#ef4444', '#06b6d4', '#10b981', '#f59e0b', '#6d63f5'][i % 5],
        label: name, pct: safePct(workData[i] || 0, workData.reduce((a, b) => a + b, 0) || 1)
      })));

      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
      const byMonth = [0, 0, 0, 0, 0, 0];
      tasks.forEach(t => {
        if (!t.createdAt) return;
        const d = new Date(t.createdAt);
        if (isNaN(d.getTime())) return;
        const m = d.getMonth();
        if (m >= 0 && m < 6) byMonth[m]++;
      });
      const targets = [5, 6, 7, 7, 8, 9];
      buildLine('performanceChart', months, [
        { label: 'Achieved', data: byMonth, borderColor: '#6d63f5', backgroundColor: 'rgba(109,99,245,0.12)', borderWidth: 2.5, pointBackgroundColor: '#6d63f5', pointRadius: 4, pointHoverRadius: 6, fill: true, tension: 0.45 },
        { label: 'Target',   data: targets, borderColor: '#06b6d4', backgroundColor: 'rgba(6,182,212,0.07)', borderWidth: 2, pointBackgroundColor: '#06b6d4', pointRadius: 4, pointHoverRadius: 6, fill: true, tension: 0.45, borderDash: [5, 4] }
      ]);

      const colors = ['#6d63f5', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
      const list = el('projectList');
      if (list) {
        const top = projects.slice(0, 6);
        if (top.length === 0) {
          list.innerHTML = '<p style="color:var(--text-muted);padding:8px;">No projects yet. <a href="project.html" style="color:var(--accent);">Create one</a>.</p>';
        } else {
          list.innerHTML = top.map((p, i) => {
            const pTasks = tasks.filter(t => t.projectId === p.id);
            const done = pTasks.filter(t => t.status === 'done').length;
            const pct = pTasks.length > 0 ? Math.round((done / pTasks.length) * 100) : 0;
            return `
              <a href="project-details.html?id=${encodeURIComponent(p.id)}" class="project-row">
                <span class="project-color" style="background:${colors[i % colors.length]};"></span>
                <div class="project-info">
                  <div class="project-name">${escapeHtml(p.name)}</div>
                  <div class="project-sub">${pTasks.length} task(s) &middot; ${escapeHtml(p.status || '—')}</div>
                </div>
                <div class="project-progress-wrap">
                  <div class="progress-bar-mini"><div class="progress-fill" style="width:${pct}%"></div></div>
                  <span class="progress-pct">${pct}%</span>
                </div>
              </a>
            `;
          }).join('');
        }
      }
    } catch (e) { console.error('[dashbord manager] load failed', e); }
  }

  async function loadMember() {
    try {
      const [statsRes, tasksRes, projectsRes] = await Promise.all([
        fetch('/api/dashboard?userId=' + encodeURIComponent(userId)),
        fetch('/api/tasks?assignee=' + encodeURIComponent(userId)),
        fetch('/api/projects')
      ]);
      if (!statsRes.ok) return;
      const s = await statsRes.json();
      const tasks = tasksRes.ok ? await tasksRes.json() : [];
      const projects = projectsRes.ok ? await projectsRes.json() : [];

      setText('statTasks', s.assignedTasks);
      setText('statCompleted', s.completedTasks);
      setText('statPending', s.inProgressTasks + s.pendingTasks);
      setText('statHours', '—');

      const projectIds = Array.from(new Set(tasks.map(t => t.projectId).filter(Boolean)));
      const myProjects = projects.filter(p => projectIds.includes(p.id));
      const byProject = {};
      tasks.forEach(t => { if (t.projectId) byProject[t.projectId] = (byProject[t.projectId] || 0) + 1; });

      const projectNames = myProjects.slice(0, 4).map(p => p.name);
      const projectData  = myProjects.slice(0, 4).map(p => byProject[p.id] || 0);
      buildDoughnut('memberTimeChart',
        projectNames.length ? projectNames : ['No tasks'],
        projectData.length  ? projectData  : [1],
        ['#6d63f5', '#06b6d4', '#10b981', '#ef4444']);
      updateLegend(null, projectNames.map((n, i) => ({
        color: ['#6d63f5', '#06b6d4', '#10b981', '#ef4444'][i % 4],
        label: n,
        pct: safePct(projectData[i] || 0, projectData.reduce((a, b) => a + b, 0) || 1)
      })));

      const weeks = ['Wk 1', 'Wk 2', 'Wk 3', 'Wk 4', 'Wk 5', 'Wk 6'];
      const byWeek = [0, 0, 0, 0, 0, 0];
      const now = Date.now();
      tasks.forEach(t => {
        if (!t.createdAt) return;
        const d = new Date(t.createdAt);
        if (isNaN(d.getTime())) return;
        const weeksAgo = Math.floor((now - d.getTime()) / (7 * 24 * 3600 * 1000));
        if (weeksAgo >= 0 && weeksAgo < 6) byWeek[5 - weeksAgo]++;
      });
      buildLine('memberEfficiencyChart', weeks, [
        { label: 'Tasks Created', data: byWeek, borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,0.12)', borderWidth: 2.5, pointBackgroundColor: '#10b981', pointRadius: 4, pointHoverRadius: 6, fill: true, tension: 0.45 }
      ]);

      const list = el('memberTaskList');
      if (list) {
        const sorted = tasks.slice().sort((a, b) => {
          const rank = { high: 0, medium: 1, low: 2 };
          return (rank[a.priority] ?? 3) - (rank[b.priority] ?? 3);
        });
        const top = sorted.slice(0, 5);
        if (top.length === 0) {
          list.innerHTML = '<p style="color:var(--text-muted);padding:8px;">No assigned tasks. <a href="task.html" style="color:var(--accent);">Browse tasks</a>.</p>';
        } else {
          list.innerHTML = top.map(t => {
            const p = projects.find(pp => pp.id === t.projectId);
            const projectName = p ? p.name : 'No project';
            const color = t.priority === 'high' ? '#ef4444' : t.priority === 'low' ? '#10b981' : '#f59e0b';
            return `
              <a href="project-details.html?id=${encodeURIComponent(t.projectId || '')}" class="project-row">
                <span class="project-color" style="background:${color};"></span>
                <div class="project-info">
                  <div class="project-name">${escapeHtml(t.title)}</div>
                  <div class="project-sub">Project: ${escapeHtml(projectName)} &middot; ${escapeHtml(t.status || '—')}</div>
                </div>
                <div class="project-progress-wrap">
                  <span class="progress-pct" style="color:var(--text-primary); background: rgba(255,255,255,0.05); padding:2px 8px; border-radius:12px;">${escapeHtml((t.priority || '—').charAt(0).toUpperCase() + (t.priority || '—').slice(1))}</span>
                </div>
              </a>
            `;
          }).join('');
        }
      }

      const projList = document.querySelectorAll('.project-list')[1];
      if (projList) {
        if (myProjects.length === 0) {
          projList.innerHTML = '<p style="color:var(--text-muted);padding:8px;">No projects yet.</p>';
        } else {
          projList.innerHTML = myProjects.slice(0, 5).map((p, i) => {
            const pTasks = tasks.filter(t => t.projectId === p.id);
            const done = pTasks.filter(t => t.status === 'done').length;
            const pct = pTasks.length > 0 ? Math.round((done / pTasks.length) * 100) : 0;
            const color = ['#6d63f5', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'][i % 5];
            return `
              <a href="project-details.html?id=${encodeURIComponent(p.id)}" class="project-row">
                <span class="project-color" style="background:${color};"></span>
                <div class="project-info">
                  <div class="project-name">${escapeHtml(p.name)}</div>
                  <div class="project-sub">${pTasks.length} task(s) &middot; ${escapeHtml(p.status || '—')}</div>
                </div>
                <div class="project-progress-wrap">
                  <div class="progress-bar-mini"><div class="progress-fill" style="width:${pct}%"></div></div>
                  <span class="progress-pct">${pct}%</span>
                </div>
              </a>
            `;
          }).join('');
        }
      }
    } catch (e) { console.error('[dashbord member] load failed', e); }
  }

  document.addEventListener('DOMContentLoaded', function () {
    if (typeof Chart === 'undefined') {
      let attempts = 0;
      const tryInit = setInterval(function () {
        attempts++;
        if (typeof Chart !== 'undefined') {
          clearInterval(tryInit);
          if (role === 'manager') loadManager(); else loadMember();
        } else if (attempts > 40) {
          clearInterval(tryInit);
        }
      }, 150);
    } else {
      if (role === 'manager') loadManager(); else loadMember();
    }
  });
})();
