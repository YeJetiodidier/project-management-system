// Task Management System
const TASKS_STORAGE_KEY = 'promanage_tasks';
const openModalBtn = document.getElementById('openModalBtn');
const modalOverlay = document.getElementById('modalOverlay');
const closeModalBtn = document.getElementById('closeModalBtn');
const cancelBtn = document.getElementById('cancelBtn');
const saveTaskBtn = document.getElementById('saveTaskBtn');
const taskList = document.getElementById('taskList');
const emptyState = document.getElementById('emptyState');
const badgeTasks = document.getElementById('badge-tasks');

// Initialize tasks from local storage
function initializeTasks() {
  const stored = localStorage.getItem(TASKS_STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
}

// Update badge with task count
function updateBadge(count) {
  if (badgeTasks) {
    badgeTasks.textContent = count;
  }
}

// Update stats
function updateStats() {
  const tasks = initializeTasks();
  const statTotal = document.getElementById('statTotal');
  const statTodo = document.getElementById('statTodo');
  const statProgress = document.getElementById('statProgress');
  const statDone = document.getElementById('statDone');

  if (statTotal) statTotal.textContent = tasks.length;
  if (statTodo) statTodo.textContent = tasks.filter(t => t.status === 'todo').length;
  if (statProgress) statProgress.textContent = tasks.filter(t => t.status === 'inprogress').length;
  if (statDone) statDone.textContent = tasks.filter(t => t.status === 'done').length;
}

// Save tasks to local storage
function saveTasks(tasks) {
  localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
  updateBadge(tasks.length);
  updateStats();
}

// Add task
function addTask(task) {
  const tasks = initializeTasks();
  task.id = Date.now().toString();
  tasks.push(task);
  saveTasks(tasks);
  renderTasks();
}

// Delete task
function deleteTask(taskId) {
  let tasks = initializeTasks();
  tasks = tasks.filter(t => t.id !== taskId);
  saveTasks(tasks);
  renderTasks();
}

// Edit task (load into modal)
function editTask(taskId) {
  const tasks = initializeTasks();
  const task = tasks.find(t => t.id === taskId);
  if (!task) return;

  document.getElementById('editTaskId').value = taskId;
  document.getElementById('taskTitle').value = task.title;
  document.getElementById('taskDesc').value = task.description || '';
  document.getElementById('taskStatus').value = task.status;
  document.getElementById('taskPriority').value = task.priority;
  document.getElementById('taskDue').value = task.dueDate || '';
  document.getElementById('taskAssignee').value = task.assignee || '';
  document.getElementById('modalTitle').textContent = 'Edit Task';
  toggleModal(true);
}

// Render tasks to DOM
function renderTasks() {
  const tasks = initializeTasks();
  
  if (tasks.length === 0) {
    emptyState.style.display = 'flex';
    taskList.innerHTML = '';
    return;
  }
  
  emptyState.style.display = 'none';
  taskList.innerHTML = tasks.map(task => `
    <div class="task-card status-${task.status}">
      <div class="task-check">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      </div>
      <div class="task-main">
        <div class="task-title">${escapeHtml(task.title)}</div>
        ${task.description ? `<div class="task-description">${escapeHtml(task.description)}</div>` : ''}
      </div>
      <div class="task-badges">
        <span class="badge badge-${task.status}">${task.status === 'inprogress' ? 'In Progress' : task.status.charAt(0).toUpperCase() + task.status.slice(1)}</span>
        <span class="badge badge-${task.priority}">${task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}</span>
      </div>
      ${task.assignee ? `<div class="task-assignee"><span class="assignee-avatar">${task.assignee.charAt(0).toUpperCase()}</span> ${escapeHtml(task.assignee)}</div>` : ''}
      ${task.dueDate ? `<div class="task-due"><span>📅</span> ${task.dueDate}</div>` : ''}
      <div class="task-actions">
        <button class="action-btn" onclick="editTask('${task.id}')" title="Edit">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
        </button>
        <button class="action-btn delete" onclick="if(confirm('Delete this task?')) deleteTask('${task.id}')" title="Delete">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
        </button>
      </div>
    </div>
  `).join('');
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

// Modal toggle
function toggleModal(show) {
  if (modalOverlay) {
    modalOverlay.classList.toggle('active', show);
  }
}

// Modal event listeners
if (openModalBtn && modalOverlay && closeModalBtn && cancelBtn) {
  openModalBtn.addEventListener('click', () => toggleModal(true));
  closeModalBtn.addEventListener('click', () => toggleModal(false));
  cancelBtn.addEventListener('click', () => toggleModal(false));

  modalOverlay.addEventListener('click', (event) => {
    if (event.target === modalOverlay) {
      toggleModal(false);
    }
  });
}

// Save task button
if (saveTaskBtn) {
  saveTaskBtn.addEventListener('click', () => {
    const editTaskId = document.getElementById('editTaskId')?.value;
    const title = document.getElementById('taskTitle')?.value;
    const desc = document.getElementById('taskDesc')?.value;
    const status = document.getElementById('taskStatus')?.value || 'todo';
    const priority = document.getElementById('taskPriority')?.value || 'medium';
    const dueDate = document.getElementById('taskDue')?.value;
    const assignee = document.getElementById('taskAssignee')?.value;

    if (!title) {
      alert('Please enter a task title');
      return;
    }

    if (editTaskId) {
      // Update existing task
      let tasks = initializeTasks();
      const taskIndex = tasks.findIndex(t => t.id === editTaskId);
      if (taskIndex >= 0) {
        tasks[taskIndex] = { ...tasks[taskIndex], title, description: desc, status, priority, dueDate, assignee };
        saveTasks(tasks);
      }
      document.getElementById('editTaskId').value = '';
      document.getElementById('modalTitle').textContent = 'New Task';
    } else {
      // Add new task
      addTask({ title, description: desc, status, priority, dueDate, assignee });
    }
    
    // Reset form and close modal
    document.getElementById('taskTitle').value = '';
    document.getElementById('taskDesc').value = '';
    document.getElementById('taskDue').value = '';
    document.getElementById('taskAssignee').value = '';
    toggleModal(false);
  });
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  renderTasks();
  updateBadge(initializeTasks().length);
  updateStats();
});
