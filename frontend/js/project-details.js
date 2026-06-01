(function () {
  'use strict';

  const params = new URLSearchParams(window.location.search);
  const projectId = params.get('id');
  let project = null;
  let tasks = [];
  let users = [];
  let commentsLoadedFor = '';

  function escapeHtml(t) {
    const d = document.createElement('div');
    d.textContent = t == null ? '' : String(t);
    return d.innerHTML;
  }

  function findUser(id) {
    return users.find(u => u.id === id);
  }
  function userLabel(id) {
    if (!id) return 'Unassigned';
    const u = findUser(id);
    return u ? (u.name || u.username || u.email) : id;
  }

  async function loadUsers() {
    try {
      const r = await fetch('/api/users');
      if (r.ok) users = await r.json();
    } catch (e) { /* ignore */ }
  }

  async function loadProject() {
    if (!projectId) {
      document.getElementById('projectDetail').innerHTML = '<p>No project specified.</p>';
      return;
    }
    const r = await fetch('/api/projects?id=' + encodeURIComponent(projectId));
    if (!r.ok) {
      document.getElementById('projectDetail').innerHTML = '<p>Project not found.</p>';
      return;
    }
    project = await r.json();
    document.getElementById('projectTitle').textContent = project.name || 'Project Details';
    renderProject();
    populateAssigneeSelect();
  }

  function renderProject() {
    const el = document.getElementById('projectDetail');
    el.innerHTML = `
      <p>${escapeHtml(project.description || 'No description.')}</p>
      <p><strong>Status:</strong> ${escapeHtml(project.status || '—')} &middot;
         <strong>Priority:</strong> ${escapeHtml(project.priority || '—')}</p>
      <p><strong>Deadline:</strong> ${escapeHtml(project.dateline || 'None')} &middot;
         <strong>Assignee:</strong> ${escapeHtml(userLabel(project.assignee))}</p>
    `;
  }

  async function loadTasks() {
    if (!projectId) return;
    const r = await fetch('/api/tasks?projectId=' + encodeURIComponent(projectId));
    if (!r.ok) { return; }
    tasks = await r.json();
    renderTasks();
    populateTaskCommentSelect();
  }

  function renderTasks() {
    const list = document.getElementById('taskList');
    if (tasks.length === 0) {
      list.innerHTML = '<p style="color:var(--text-muted);">No tasks yet. Click "Add Task" to create one.</p>';
      return;
    }
    list.innerHTML = tasks.map(t => `
      <div class="task-item" data-task-id="${escapeHtml(t.id)}" style="padding:10px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;">
        <div>
          <strong>${escapeHtml(t.title)}</strong>
          <span style="color:var(--text-muted);font-size:12px;margin-left:8px;">[${escapeHtml(t.status || '—')}]</span>
          <span style="color:var(--text-muted);font-size:12px;margin-left:8px;">👤 ${escapeHtml(userLabel(t.assignee))}</span>
        </div>
        <div>
          <button class="btn-action" data-load-comments="${escapeHtml(t.id)}">💬 Comments</button>
          <button class="btn-action danger" data-del-task="${escapeHtml(t.id)}">🗑️</button>
        </div>
      </div>
    `).join('');
  }

  function populateTaskCommentSelect() {
    const sel = document.getElementById('commentTaskSelect');
    const opts = ['<option value="">— Select a task —</option>']
      .concat(tasks.map(t => `<option value="${escapeHtml(t.id)}">${escapeHtml(t.title)}</option>`));
    sel.innerHTML = opts.join('');
  }

  function populateAssigneeSelect() {
    const sel = document.getElementById('taskAssignee');
    const opts = ['<option value="">— Unassigned —</option>']
      .concat(users.map(u => {
        const label = (u.name || u.username || u.email || u.id);
        return `<option value="${escapeHtml(u.id)}">${escapeHtml(label)}</option>`;
      }));
    sel.innerHTML = opts.join('');
  }

  async function loadCommentsFor(taskId) {
    commentsLoadedFor = taskId;
    const list = document.getElementById('commentList');
    const r = await fetch('/api/comments?taskId=' + encodeURIComponent(taskId));
    if (!r.ok) { list.innerHTML = '<p style="color:var(--text-muted);">No comments.</p>'; return; }
    const arr = await r.json();
    if (arr.length === 0) { list.innerHTML = '<p style="color:var(--text-muted);">No comments yet for this task.</p>'; return; }
    list.innerHTML = arr.map(c => `
      <div class="comment-item" style="padding:8px 0;border-bottom:1px solid var(--border);">
        <div><strong>${escapeHtml(c.author || 'Anonymous')}</strong>
          <span style="color:var(--text-muted);font-size:12px;margin-left:6px;">${c.createdAt ? new Date(c.createdAt).toLocaleString() : ''}</span>
        </div>
        <div>${escapeHtml(c.text)}</div>
      </div>
    `).join('');
  }

  function openTaskModal() {
    document.getElementById('editTaskId').value = '';
    document.getElementById('taskTitle').value = '';
    document.getElementById('taskDesc').value = '';
    document.getElementById('taskStatus').value = 'todo';
    document.getElementById('taskPriority').value = 'medium';
    document.getElementById('taskDue').value = '';
    document.getElementById('taskAssignee').value = '';
    document.getElementById('taskModalOverlay').classList.add('active');
  }
  function closeTaskModal() {
    document.getElementById('taskModalOverlay').classList.remove('active');
  }

  async function saveTask() {
    const title = document.getElementById('taskTitle').value.trim();
    if (!title) { alert('Please enter a task title'); return; }
    const body = {
      title,
      description: document.getElementById('taskDesc').value.trim(),
      status: document.getElementById('taskStatus').value,
      priority: document.getElementById('taskPriority').value,
      dueDate: document.getElementById('taskDue').value,
      assignee: document.getElementById('taskAssignee').value,
      projectId: projectId
    };
    await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    closeTaskModal();
    loadTasks();
  }

  async function addComment() {
    const text = document.getElementById('newCommentText').value.trim();
    const taskId = document.getElementById('commentTaskSelect').value;
    if (!text) { alert('Comment cannot be empty'); return; }
    if (!taskId) { alert('Select a task first'); return; }
    const author = sessionStorage.getItem('pms_name') || sessionStorage.getItem('pms_username') || 'User';
    const r = await fetch('/api/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ taskId, text, author })
    });
    if (r.ok) {
      document.getElementById('newCommentText').value = '';
      loadCommentsFor(taskId);
    }
  }

  document.addEventListener('click', function (e) {
    const loadFor = e.target.closest('[data-load-comments]')?.getAttribute('data-load-comments');
    if (loadFor) {
      document.getElementById('commentTaskSelect').value = loadFor;
      loadCommentsFor(loadFor);
    }
    const delTask = e.target.closest('[data-del-task]')?.getAttribute('data-del-task');
    if (delTask) {
      if (!confirm('Delete this task?')) return;
      fetch('/api/tasks?id=' + encodeURIComponent(delTask), { method: 'DELETE' })
        .then(function () { loadTasks(); });
    }
  });

  document.getElementById('openTaskModalBtn')?.addEventListener('click', openTaskModal);
  document.getElementById('closeTaskModalBtn')?.addEventListener('click', closeTaskModal);
  document.getElementById('cancelTaskBtn')?.addEventListener('click', closeTaskModal);
  document.getElementById('saveTaskBtn')?.addEventListener('click', saveTask);
  document.getElementById('addCommentBtn')?.addEventListener('click', addComment);
  document.getElementById('commentTaskSelect')?.addEventListener('change', function (e) {
    if (e.target.value) loadCommentsFor(e.target.value);
    else document.getElementById('commentList').innerHTML = '';
  });

  document.addEventListener('DOMContentLoaded', async function () {
    const name = sessionStorage.getItem('pms_name') || sessionStorage.getItem('pms_username') || 'User';
    const initial = name.charAt(0).toUpperCase();
    const sideA = document.getElementById('sidebarAvatar'); if (sideA) sideA.textContent = initial;
    const sideN = document.getElementById('sidebarName');   if (sideN) sideN.textContent = name;
    await loadUsers();
    await loadProject();
    await loadTasks();
  });
})();
