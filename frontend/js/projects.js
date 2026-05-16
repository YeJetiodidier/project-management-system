// Project Management System
const PROJECTS_STORAGE_KEY = 'promanage_projects';
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

// Initialize projects from local storage
function initializeProjects() {
  const stored = localStorage.getItem(PROJECTS_STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
}

// Update badge with project count
function updateBadge(count) {
  if (badgeProjects) {
    badgeProjects.textContent = count;
  }
}

// Update statistics
function updateStats() {
  const projects = initializeProjects();
  const statTotal = document.getElementById('statTotal');
  const statActive = document.getElementById('statActive');
  const statPlanning = document.getElementById('statPlanning');
  const statCompleted = document.getElementById('statCompleted');

  if (statTotal) statTotal.textContent = projects.length;
  if (statActive) statActive.textContent = projects.filter(p => p.status === 'active').length;
  if (statPlanning) statPlanning.textContent = projects.filter(p => p.status === 'planning').length;
  if (statCompleted) statCompleted.textContent = projects.filter(p => p.status === 'completed').length;
}

// Save projects to local storage
function saveProjects(projects) {
  localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(projects));
  updateBadge(projects.length);
  updateStats();
}

// Add project
function addProject(project) {
  const projects = initializeProjects();
  project.id = Math.random().toString(36).substr(2, 9);
  project.createdAt = new Date().toISOString();
  project.progress = 0;
  projects.push(project);
  saveProjects(projects);
  renderProjects();
}

// Update project
function updateProject(projectId, updatedData) {
  let projects = initializeProjects();
  const index = projects.findIndex(p => p.id === projectId);
  if (index !== -1) {
    projects[index] = { ...projects[index], ...updatedData };
    saveProjects(projects);
    renderProjects();
  }
}

// Delete project
function deleteProject(projectId) {
  let projects = initializeProjects();
  projects = projects.filter(p => p.id !== projectId);
  saveProjects(projects);
  renderProjects();
}

// Edit project (load into modal)
function editProject(projectId) {
  const projects = initializeProjects();
  const project = projects.find(p => p.id === projectId);
  if (!project) return;

  document.getElementById('editProjectId').value = projectId;
  document.getElementById('projectName').value = project.name;
  document.getElementById('projectDesc').value = project.description || '';
  document.getElementById('projectStatus').value = project.status;
  document.getElementById('projectPriority').value = project.priority || 'medium';
  document.getElementById('projectDeadline').value = project.dateline || '';
  document.getElementById('projectAssignee').value = project.assignee || '';
  document.getElementById('modalTitle').textContent = 'Edit Project';
  toggleModal(true);
}

// Calculate progress based on deadline
function calculateProgress(deadlineStr) {
  if (!deadlineStr) return 0;
  
  const now = new Date();
  const deadline = new Date(deadlineStr);
  const created = new Date(2024, 0, 1);
  
  if (deadline <= now) return 100;
  if (deadline <= created) return 0;
  
  const totalDays = (deadline - created) / (1000 * 60 * 60 * 24);
  const elapsedDays = (now - created) / (1000 * 60 * 60 * 24);
  
  return Math.min(100, Math.max(0, Math.round((elapsedDays / totalDays) * 100)));
}

// Format date
function formatDate(dateStr) {
  if (!dateStr) return 'No deadline';
  const date = new Date(dateStr);
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return date.toLocaleDateString('en-US', options);
}

// Escape HTML
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Filter and sort projects
function getFilteredProjects() {
  let projects = initializeProjects();
  const searchTerm = searchInput.value.toLowerCase();
  const statusFilter = filterStatus.value;
  const priorityFilter = filterPriority.value;
  const sortType = sortBy.value;

  // Filter by search
  if (searchTerm) {
    projects = projects.filter(p => 
      p.name.toLowerCase().includes(searchTerm) ||
      (p.description && p.description.toLowerCase().includes(searchTerm)) ||
      p.id.includes(searchTerm)
    );
  }

  // Filter by status
  if (statusFilter !== 'all') {
    projects = projects.filter(p => p.status === statusFilter);
  }

  // Filter by priority
  if (priorityFilter !== 'all') {
    projects = projects.filter(p => p.priority === priorityFilter);
  }

  // Sort
  switch(sortType) {
    case 'newest':
      projects.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      break;
    case 'oldest':
      projects.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
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

// Render projects to DOM
function renderProjects() {
  const projects = getFilteredProjects();
  
  if (projects.length === 0) {
    emptyState.style.display = 'flex';
    projectList.innerHTML = '';
    return;
  }
  
  emptyState.style.display = 'none';
  projectList.className = 'project-list' + (currentView === 'grid' ? ' grid-view' : '');
  projectList.innerHTML = projects.map(project => {
    const progress = calculateProgress(project.dateline);
    const deadline = formatDate(project.dateline);
    const priority = project.priority || 'medium';
    
    return `
      <div class="project-item ${currentView === 'grid' ? 'grid-view' : ''}">
        <div class="project-header">
          <div class="project-badges">
            <span class="project-status status-${project.status}">${project.status}</span>
            <span class="project-priority priority-${priority}">${priority}</span>
          </div>
          <div class="project-title">${escapeHtml(project.name)}</div>
          <div class="project-id">ID: ${project.id}</div>
        </div>
        <div class="project-body">
          ${project.description ? `<div class="project-description">${escapeHtml(project.description)}</div>` : ''}
          <div class="project-deadline">📅 <strong>Deadline:</strong> ${deadline}</div>
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
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="8.5" cy="7" r="4"></circle>
            </svg>
            <span>${project.assignee || 'Unassigned'}</span>
          </div>
        </div>
        <div class="project-footer">
          <button class="btn-action" onclick="editProject('${project.id}')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
            Edit
          </button>
          <button class="btn-action danger" onclick="deleteProject('${project.id}')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              <line x1="10" y1="11" x2="10" y2="17"></line>
              <line x1="14" y1="11" x2="14" y2="17"></line>
            </svg>
            Delete
          </button>
        </div>
      </div>
    `;
  }).join('');
}

// Toggle modal
function toggleModal(show) {
  if (show) {
    modalOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  } else {
    modalOverlay.classList.remove('active');
    document.body.style.overflow = '';
    resetForm();
  }
}

// Reset form
function resetForm() {
  document.getElementById('editProjectId').value = '';
  document.getElementById('projectName').value = '';
  document.getElementById('projectDesc').value = '';
  document.getElementById('projectStatus').value = 'planning';
  document.getElementById('projectPriority').value = 'medium';
  document.getElementById('projectDeadline').value = '';
  document.getElementById('projectAssignee').value = '';
  document.getElementById('modalTitle').textContent = 'New Project';
}

// Validate form
function validateForm() {
  const name = document.getElementById('projectName').value.trim();
  const status = document.getElementById('projectStatus').value;

  if (!name) {
    alert('Please enter a project name');
    return false;
  }

  if (!status) {
    alert('Please select a status');
    return false;
  }

  return true;
}

// Save or update project
function handleSaveProject() {
  if (!validateForm()) return;

  const editId = document.getElementById('editProjectId').value;
  const projectData = {
    name: document.getElementById('projectName').value.trim(),
    description: document.getElementById('projectDesc').value.trim(),
    status: document.getElementById('projectStatus').value,
    priority: document.getElementById('projectPriority').value,
    dateline: document.getElementById('projectDeadline').value,
    assignee: document.getElementById('projectAssignee').value.trim()
  };

  if (editId) {
    updateProject(editId, projectData);
  } else {
    addProject(projectData);
  }

  toggleModal(false);
}

// Event listeners
if (openModalBtn) openModalBtn.addEventListener('click', () => toggleModal(true));
if (closeModalBtn) closeModalBtn.addEventListener('click', () => toggleModal(false));
if (cancelBtn) cancelBtn.addEventListener('click', () => toggleModal(false));
if (saveProjectBtn) saveProjectBtn.addEventListener('click', handleSaveProject);

// Filter and search event listeners
if (searchInput) searchInput.addEventListener('input', renderProjects);
if (filterStatus) filterStatus.addEventListener('change', renderProjects);
if (filterPriority) filterPriority.addEventListener('change', renderProjects);
if (sortBy) sortBy.addEventListener('change', renderProjects);

// View toggle
if (viewGrid) {
  viewGrid.addEventListener('click', () => {
    currentView = 'grid';
    viewGrid.classList.add('active');
    viewList.classList.remove('active');
    renderProjects();
  });
}

if (viewList) {
  viewList.addEventListener('click', () => {
    currentView = 'list';
    viewList.classList.add('active');
    viewGrid.classList.remove('active');
    renderProjects();
  });
}

// Close modal on overlay click
if (modalOverlay) {
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) {
      toggleModal(false);
    }
  });
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    toggleModal(false);
  }
});

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
  updateStats();
  updateBadge(initializeProjects().length);
  renderProjects();
});
