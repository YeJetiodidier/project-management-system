// Project Management System
const openModalBtn = document.getElementById('openModalBtn');
const modalOverlay = document.getElementById('modalOverlay');
const closeModalBtn = document.getElementById('closeModalBtn');
const cancelBtn = document.getElementById('cancelBtn');
const saveProjectBtn = document.getElementById('saveProjectBtn');
const projectList = document.getElementById('projectList');
const emptyState = document.getElementById('emptyState');
const badgeProjects = document.getElementById('badge-projects');
const searchInput = document.getElementById('searchInput');
const filterStatus = document.getElementById('filterStatus');
const filterPriority = document.getElementById('filterPriority');
const sortBy = document.getElementById('sortBy');
const viewGrid = document.getElementById('viewGrid');
const viewList = document.getElementById('viewList');

let currentView = 'grid';
let projectsData = [];
let usersData = [];

async function fetchProjects() {
  try {
    const response = await fetch('/api/projects');
    if (response.ok) {
      projectsData = await response.json();
      updateBadge(projectsData.length);
      updateStats();
      renderProjects();
    }
  } catch (err) {
    console.error("Failed to fetch projects", err);
  }
}

async function fetchUsers() {
  try {
    const response = await fetch('/api/users');
    if (response.ok) usersData = await response.json();
  } catch (e) { /* ignore */ }
}

function updateBadge(count) {
  if (badgeProjects) badgeProjects.textContent = count;
}

function updateStats() {
  const statTotal = document.getElementById('statTotal');
  const statActive = document.getElementById('statActive');
  const statPlanning = document.getElementById('statPlanning');
  const statCompleted = document.getElementById('statCompleted');

  if (statTotal) statTotal.textContent = projectsData.length;
  if (statActive) statActive.textContent = projectsData.filter(p => p.status === 'active').length;
  if (statPlanning) statPlanning.textContent = projectsData.filter(p => p.status === 'planning').length;
  if (statCompleted) statCompleted.textContent = projectsData.filter(p => p.status === 'completed').length;
}

async function addProject(project) {
  try {
    await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(project)
    });
    fetchProjects();
  } catch(err) { console.error(err); }
}

async function updateProject(projectId, updatedData) {
  updatedData.id = projectId;
  try {
    await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedData)
    });
    fetchProjects();
  } catch(err) { console.error(err); }
}

async function deleteProject(projectId) {
  if (!confirm('Delete this project? Tasks inside it will become unlinked.')) return;
  try {
    await fetch('/api/projects?id=' + encodeURIComponent(projectId), { method: 'DELETE' });
    fetchProjects();
  } catch(err) { console.error(err); }
}

function editProject(projectId) {
  const project = projectsData.find(p => p.id === projectId);
  if (!project) return;

  document.getElementById('editProjectId').value = projectId;
  document.getElementById('projectName').value = project.name;
  document.getElementById('projectDesc').value = project.description || '';
  document.getElementById('projectStatus').value = project.status;
  document.getElementById('projectPriority').value = project.priority || 'medium';
  document.getElementById('projectDeadline').value = project.dateline || '';
  populateAssigneeSelect(project.assignee);
  document.getElementById('modalTitle').textContent = 'Edit Project';
  toggleModal(true);
}

function populateAssigneeSelect(selectedId) {
  const sel = document.getElementById('projectAssignee');
  if (!sel) return;
  const opts = ['<option value="">— Unassigned —</option>']
    .concat(usersData.map(u => {
      const label = Auth.userLabel(u);
      const selAttr = u.id === selectedId ? ' selected' : '';
      return '<option value="' + escapeHtml(u.id) + '"' + selAttr + '>' + escapeHtml(label) + '</option>';
    }));
  sel.innerHTML = opts.join('');
}

function calculateProgress(deadlineStr) {
  if (!deadlineStr) return 0;
  const now = new Date();
  const deadline = new Date(deadlineStr);
  if (isNaN(deadline.getTime())) return 0;
  if (deadline <= now) return 100;
  const created = new Date(2024, 0, 1);
  if (deadline <= created) return 0;
  const totalDays = (deadline - created) / (1000 * 60 * 60 * 24);
  const elapsedDays = (now - created) / (1000 * 60 * 60 * 24);
  return Math.min(100, Math.max(0, Math.round((elapsedDays / totalDays) * 100)));
}

function formatDate(dateStr) {
  if (!dateStr) return 'No deadline';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return 'No deadline';
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function escapeHtml(text) {
  const d = document.createElement('div');
  d.textContent = text == null ? '' : String(text);
  return d.innerHTML;
}

function getFilteredProjects() {
  let projects = projectsData;
  const searchTerm = (searchInput?.value || '').toLowerCase();
  const statusFilter = filterStatus?.value || 'all';
  const priorityFilter = filterPriority?.value || 'all';
  const sortType = sortBy?.value || 'newest';

  if (searchTerm) {
    projects = projects.filter(p =>
      (p.name || '').toLowerCase().includes(searchTerm) ||
      (p.description && p.description.toLowerCase().includes(searchTerm)) ||
      (p.id && p.id.includes(searchTerm))
    );
  }
  if (statusFilter !== 'all') projects = projects.filter(p => p.status === statusFilter);
  if (priorityFilter !== 'all') projects = projects.filter(p => p.priority === priorityFilter);

  projects = projects.slice();
  switch(sortType) {
    case 'newest':
      projects.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      break;
    case 'oldest':
      projects.sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
      break;
    case 'deadline':
      projects.sort((a, b) => {
        if (!a.dateline) return 1;
        if (!b.dateline) return -1;
        return new Date(a.dateline) - new Date(b.dateline);
      });
      break;
    case 'progress':
      projects.sort((a, b) => calculateProgress(b.dateline) - calculateProgress(a.dateline));
      break;
  }
  return projects;
}

function renderProjects() {
  const projects = getFilteredProjects();
  if (projects.length === 0) {
    if (emptyState) emptyState.style.display = 'flex';
    if (projectList) projectList.innerHTML = '';
    return;
  }
  if (emptyState) emptyState.style.display = 'none';
  if (projectList) {
    projectList.className = 'project-list' + (currentView === 'grid' ? ' grid-view' : '');
      projectList.innerHTML = projects.map(project => {
      const progress = calculateProgress(project.dateline);
      const deadline = formatDate(project.dateline);
      const priority = project.priority || 'medium';
      const assignee = usersData.find(u => u.id === project.assignee);
      const assigneeLabel = assignee ? Auth.userLabel(assignee) : (project.assignee || 'Unassigned');
      const canManage = Auth.isManager();
      const actions = canManage ? `
          <div class="project-footer">
            <button class="btn-action" data-edit="${escapeHtml(project.id)}">✏️ Edit</button>
            <button class="btn-action danger" data-del="${escapeHtml(project.id)}">🗑️ Delete</button>
          </div>` : '';

      return `
        <div class="project-item ${currentView === 'grid' ? 'grid-view' : ''}">
          <a class="project-link" href="project-details.html?id=${encodeURIComponent(project.id)}">
            <div class="project-header">
              <div class="project-badges">
                <span class="project-status status-${escapeHtml(project.status)}">${escapeHtml(project.status || '')}</span>
                <span class="project-priority priority-${escapeHtml(priority)}">${escapeHtml(priority)}</span>
              </div>
              <div class="project-title">${escapeHtml(project.name)}</div>
              <div class="project-id">ID: ${escapeHtml(project.id)}</div>
            </div>
            <div class="project-body">
              ${project.description ? `<div class="project-description">${escapeHtml(project.description)}</div>` : ''}
              <div class="project-deadline">📅 <strong>Deadline:</strong> ${escapeHtml(deadline)}</div>
              <div class="project-progress">
                <div class="progress-label">
                  <span>Progress</span>
                  <span class="progress-percent">${progress}%</span>
                </div>
                <div class="progress-bar">
                  <div class="progress-fill" style="width: ${progress}%"></div>
                </div>
              </div>
            </div>
            <div class="project-meta">
              <div class="meta-item">
                <span>👤</span>
                <span>${escapeHtml(assigneeLabel)}</span>
              </div>
            </div>
          </a>
          ${actions}
        </div>
      `;
    }).join('');
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
  document.getElementById('editProjectId').value = '';
  document.getElementById('projectName').value = '';
  document.getElementById('projectDesc').value = '';
  document.getElementById('projectStatus').value = 'planning';
  document.getElementById('projectPriority').value = 'medium';
  document.getElementById('projectDeadline').value = '';
  populateAssigneeSelect('');
  document.getElementById('modalTitle').textContent = 'New Project';
}

function validateForm() {
  const name = document.getElementById('projectName').value.trim();
  if (!name) { alert('Please enter a project name'); return false; }
  return true;
}

function handleSaveProject() {
  if (!validateForm()) return;
  const editId = document.getElementById('editProjectId').value;
  const projectData = {
    name: document.getElementById('projectName').value.trim(),
    description: document.getElementById('projectDesc').value.trim(),
    status: document.getElementById('projectStatus').value,
    priority: document.getElementById('projectPriority').value,
    dateline: document.getElementById('projectDeadline').value,
    assignee: document.getElementById('projectAssignee').value
  };
  if (editId) updateProject(editId, projectData);
  else addProject(projectData);
  toggleModal(false);
}

document.addEventListener('click', function (e) {
  const editId = e.target.closest('[data-edit]')?.getAttribute('data-edit');
  if (editId) { editProject(editId); return; }
  const delId = e.target.closest('[data-del]')?.getAttribute('data-del');
  if (delId) { deleteProject(delId); }
});

if (openModalBtn) openModalBtn.addEventListener('click', async () => {
  await fetchUsers();
  populateAssigneeSelect('');
  toggleModal(true);
});
if (closeModalBtn) closeModalBtn.addEventListener('click', () => toggleModal(false));
if (cancelBtn) cancelBtn.addEventListener('click', () => toggleModal(false));
if (saveProjectBtn) saveProjectBtn.addEventListener('click', handleSaveProject);

if (searchInput) searchInput.addEventListener('input', renderProjects);
if (filterStatus) filterStatus.addEventListener('change', renderProjects);
if (filterPriority) filterPriority.addEventListener('change', renderProjects);
if (sortBy) sortBy.addEventListener('change', renderProjects);

if (viewGrid) viewGrid.addEventListener('click', () => {
  currentView = 'grid';
  viewGrid.classList.add('active');
  viewList?.classList.remove('active');
  renderProjects();
});
if (viewList) viewList.addEventListener('click', () => {
  currentView = 'list';
  viewList.classList.add('active');
  viewGrid?.classList.remove('active');
  renderProjects();
});

if (modalOverlay) modalOverlay.addEventListener('click', (e) => {
  if (e.target === modalOverlay) toggleModal(false);
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') toggleModal(false);
});

document.addEventListener('DOMContentLoaded', () => {
  fetchUsers().then(fetchProjects);
});
