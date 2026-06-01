// Task Management System
const openModalBtn = document.getElementById('openModalBtn');
const modalOverlay = document.getElementById('modalOverlay');
const closeModalBtn = document.getElementById('closeModalBtn');
const cancelBtn = document.getElementById('cancelBtn');
const saveTaskBtn = document.getElementById('saveTaskBtn');
const taskList = document.getElementById('taskList');
const emptyState = document.getElementById('emptyState');
const badgeTasks = document.getElementById('badge-tasks');
const viewGrid = document.getElementById('viewGrid');
const viewList = document.getElementById('viewList');
const searchInput = document.getElementById('searchInput');
const filterStatus = document.getElementById('filterStatus');
const filterPriority = document.getElementById('filterPriority');
const sortBy = document.getElementById('sortBy');

let currentView = 'list';
let tasksData = [];
let usersData = [];
let projectsData = [];

function escapeHtml(t) {
  const d = document.createElement('div');
  d.textContent = t == null ? '' : String(t);
  return d.innerHTML;
}

async function fetchTasks() {
  try {
    const r = await fetch('/api/tasks');
    if (r.ok) {
      tasksData = await r.json();
      updateBadge(tasksData.length);
      updateStats();
      renderTasks();
    }
  } catch (err) { console.error('Failed to fetch tasks', err); }
}
async function fetchUsers() {
  try {
    const r = await fetch('/api/users');
    if (r.ok) usersData = await r.json();
  } catch (e) { /* ignore */ }
}
async function fetchProjects() {
  try {
    const r = await fetch('/api/projects');
    if (r.ok) projectsData = await r.json();
  } catch (e) { /* ignore */ }
}

function updateBadge(count) {
  if (badgeTasks) badgeTasks.textContent = count;
}

function updateStats() {
  const statTotal = document.getElementById('statTotal');
  const statTodo = document.getElementById('statTodo');
  const statProgress = document.getElementById('statProgress');
  const statDone = document.getElementById('statDone');
  if (statTotal) statTotal.textContent = tasksData.length;
  if (statTodo) statTodo.textContent = tasksData.filter(t => t.status === 'todo').length;
  if (statProgress) statProgress.textContent = tasksData.filter(t => t.status === 'inprogress').length;
  if (statDone) statDone.textContent = tasksData.filter(t => t.status === 'done').length;
}

function userLabel(id) {
  if (!id) return '';
  const u = usersData.find(u => u.id === id);
  return u ? Auth.userLabel(u) : id;
}
function projectLabel(id) {
  if (!id) return '';
  const p = projectsData.find(p => p.id === id);
  return p ? p.name : id;
}

async function addTask(task) {
  await fetch('/api/tasks', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(task)
  });
  fetchTasks();
}
async function updateTaskReq(task) {
  await fetch('/api/tasks', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(task)
  });
  fetchTasks();
}
async function deleteTask(taskId) {
  if (!confirm('Delete this task?')) return;
  await fetch('/api/tasks?id=' + encodeURIComponent(taskId), { method: 'DELETE' });
  fetchTasks();
}

function editTask(taskId) {
  const task = tasksData.find(t => t.id === taskId);
  if (!task) return;
  document.getElementById('editTaskId').value = taskId;
  document.getElementById('taskTitle').value = task.title || '';
  document.getElementById('taskDesc').value = task.description || '';
  document.getElementById('taskStatus').value = task.status || 'todo';
  document.getElementById('taskPriority').value = task.priority || 'medium';
  document.getElementById('taskDue').value = task.dueDate || '';
  populateAssigneeSelect(task.assignee);
  populateProjectSelect(task.projectId);
  document.getElementById('modalTitle').textContent = 'Edit Task';
  toggleModal(true);
}

function populateAssigneeSelect(selectedId) {
  const sel = document.getElementById('taskAssignee');
  if (!sel) return;
  // Sort members first (they are the ones tasks are typically assigned to),
  // then managers, then everyone else – alphabetical by display name within each group.
  const ordered = usersData.slice().sort(function (a, b) {
    const ra = (a.role === 'member') ? 0 : (a.role === 'manager') ? 1 : 2;
    const rb = (b.role === 'member') ? 0 : (b.role === 'manager') ? 1 : 2;
    if (ra !== rb) return ra - rb;
    const na = (a.name || a.username || a.email || '').toLowerCase();
    const nb = (b.name || b.username || b.email || '').toLowerCase();
    return na.localeCompare(nb);
  });
  const opts = ['<option value="">— Unassigned —</option>']
    .concat(ordered.map(u => {
      const label = Auth.userLabel(u);
      const selAttr = u.id === selectedId ? ' selected' : '';
      return `<option value="${escapeHtml(u.id)}"${selAttr}>${escapeHtml(label)}</option>`;
    }));
  sel.innerHTML = opts.join('');
}
function populateProjectSelect(selectedId) {
  const sel = document.getElementById('taskProject');
  if (!sel) return;
  const opts = ['<option value="">— None —</option>']
    .concat(projectsData.map(p => {
      const selAttr = p.id === selectedId ? ' selected' : '';
      return `<option value="${escapeHtml(p.id)}"${selAttr}>${escapeHtml(p.name)}</option>`;
    }));
  sel.innerHTML = opts.join('');
}

function statusLabel(s) {
  if (s === 'inprogress') return 'In Progress';
  if (!s) return '—';
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function getFilteredTasks() {
  let tasks = tasksData;
  const search = (searchInput?.value || '').toLowerCase();
  const statusF = filterStatus?.value || 'all';
  const priorityF = filterPriority?.value || 'all';
  const sortType = sortBy?.value || 'newest';

  if (search) {
    tasks = tasks.filter(t =>
      (t.title || '').toLowerCase().includes(search) ||
      (t.description && t.description.toLowerCase().includes(search))
    );
  }
  if (statusF !== 'all') tasks = tasks.filter(t => t.status === statusF);
  if (priorityF !== 'all') tasks = tasks.filter(t => t.priority === priorityF);

  tasks = tasks.slice();
  switch (sortType) {
    case 'newest':   tasks.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)); break;
    case 'oldest':   tasks.sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0)); break;
    case 'duedate':  tasks.sort((a, b) => new Date(a.dueDate || '9999') - new Date(b.dueDate || '9999')); break;
    case 'priority': tasks.sort((a, b) => {
      const rank = { high: 0, medium: 1, low: 2 };
      return (rank[a.priority] ?? 3) - (rank[b.priority] ?? 3);
    }); break;
  }
  return tasks;
}

function renderTasks() {
  const tasks = getFilteredTasks();
  if (tasks.length === 0) {
    if (emptyState) emptyState.style.display = 'flex';
    if (taskList) taskList.innerHTML = '';
    return;
  }
  if (emptyState) emptyState.style.display = 'none';
  if (taskList) {
    taskList.className = 'task-list' + (currentView === 'grid' ? ' grid-view' : '');
    const canManage = Auth.isManager();
    taskList.innerHTML = tasks.map(task => `
      <div class="task-card status-${escapeHtml(task.status || 'todo')} ${currentView === 'grid' ? 'grid-view' : ''}">
        <div class="task-main">
          <div class="task-title">${escapeHtml(task.title)}</div>
          ${task.description ? `<div class="task-description">${escapeHtml(task.description)}</div>` : ''}
          ${task.projectId ? `<div class="task-project" style="color:var(--text-muted);font-size:12px;margin-top:4px;">📁 ${escapeHtml(projectLabel(task.projectId))}</div>` : ''}
        </div>
        <div class="task-badges">
          <span class="badge badge-${escapeHtml(task.status || 'todo')}">${escapeHtml(statusLabel(task.status))}</span>
          <span class="badge badge-${escapeHtml(task.priority || 'medium')}">${escapeHtml((task.priority || 'medium').charAt(0).toUpperCase() + (task.priority || 'medium').slice(1))}</span>
        </div>
        ${task.assignee ? `<div class="task-assignee"><span class="assignee-avatar">${escapeHtml(userLabel(task.assignee).charAt(0).toUpperCase())}</span> ${escapeHtml(userLabel(task.assignee))}</div>` : ''}
        ${task.dueDate ? `<div class="task-due"><span>📅</span> ${escapeHtml(task.dueDate)}</div>` : ''}
        ${canManage ? `
        <div class="task-actions">
          <button class="action-btn" data-edit-task="${escapeHtml(task.id)}" title="Edit">✏️</button>
          <button class="action-btn delete" data-del-task="${escapeHtml(task.id)}" title="Delete">🗑️</button>
        </div>` : ''}
      </div>
    `).join('');
  }
}

function toggleModal(show) {
  if (show) {
    modalOverlay?.classList.add('active');
    document.body.style.overflow = 'hidden';
  } else {
    modalOverlay?.classList.remove('active');
    document.body.style.overflow = '';
    resetForm();
  }
}
function resetForm() {
  document.getElementById('editTaskId').value = '';
  document.getElementById('taskTitle').value = '';
  document.getElementById('taskDesc').value = '';
  document.getElementById('taskStatus').value = 'todo';
  document.getElementById('taskPriority').value = 'medium';
  document.getElementById('taskDue').value = '';
  populateAssigneeSelect('');
  populateProjectSelect('');
  document.getElementById('modalTitle').textContent = 'New Task';
}

document.addEventListener('click', function (e) {
  const editId = e.target.closest('[data-edit-task]')?.getAttribute('data-edit-task');
  if (editId) { editTask(editId); return; }
  const delId = e.target.closest('[data-del-task]')?.getAttribute('data-del-task');
  if (delId) { deleteTask(delId); }
});

if (openModalBtn) openModalBtn.addEventListener('click', async () => {
  await Promise.all([fetchUsers(), fetchProjects()]);
  populateAssigneeSelect('');
  populateProjectSelect('');
  toggleModal(true);
});
if (closeModalBtn) closeModalBtn.addEventListener('click', () => toggleModal(false));
if (cancelBtn) cancelBtn.addEventListener('click', () => toggleModal(false));
if (saveTaskBtn) saveTaskBtn.addEventListener('click', () => {
  const editTaskId = document.getElementById('editTaskId').value;
  const title = document.getElementById('taskTitle').value.trim();
  if (!title) { alert('Please enter a task title'); return; }
  const payload = {
    title,
    description: document.getElementById('taskDesc').value.trim(),
    status: document.getElementById('taskStatus').value,
    priority: document.getElementById('taskPriority').value,
    dueDate: document.getElementById('taskDue').value,
    assignee: document.getElementById('taskAssignee').value,
    projectId: document.getElementById('taskProject').value
  };
  if (editTaskId) updateTaskReq({ id: editTaskId, ...payload });
  else addTask(payload);
  toggleModal(false);
});

if (modalOverlay) modalOverlay.addEventListener('click', (e) => {
  if (e.target === modalOverlay) toggleModal(false);
});
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') toggleModal(false); });

if (searchInput) searchInput.addEventListener('input', renderTasks);
if (filterStatus) filterStatus.addEventListener('change', renderTasks);
if (filterPriority) filterPriority.addEventListener('change', renderTasks);
if (sortBy) sortBy.addEventListener('change', renderTasks);

if (viewGrid) viewGrid.addEventListener('click', () => {
  currentView = 'grid';
  viewGrid.classList.add('active');
  viewList?.classList.remove('active');
  renderTasks();
});
if (viewList) viewList.addEventListener('click', () => {
  currentView = 'list';
  viewList.classList.add('active');
  viewGrid?.classList.remove('active');
  renderTasks();
});

document.addEventListener('DOMContentLoaded', () => {
  fetchUsers();
  fetchProjects();
  fetchTasks();
});
