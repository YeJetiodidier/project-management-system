// Shared Navigation & Badge Initialization
// This script runs on all pages to sync badges with localStorage

document.addEventListener('DOMContentLoaded', () => {
  initializeBadges();
});

function initializeBadges() {
  // Initialize task badge from localStorage
  const tasksData = localStorage.getItem('promanage_tasks');
  const tasks = tasksData ? JSON.parse(tasksData) : [];
  
  const badgeTask = document.getElementById('badge-tasks');
  if (badgeTask) {
    badgeTask.textContent = tasks.length;
  }

  // You can add other badge initializations here for projects, notifications, etc.
  // Example:
  // const projectsData = localStorage.getItem('promanage_projects');
  // const projects = projectsData ? JSON.parse(projectsData) : [];
  // const badgeProjects = document.getElementById('badge-projects');
  // if (badgeProjects) {
  //   badgeProjects.textContent = projects.length;
  // }
}

// Optional: Add storage event listener to sync badges when localStorage changes in other tabs
window.addEventListener('storage', (event) => {
  if (event.key === 'promanage_tasks') {
    initializeBadges();
  }
});
