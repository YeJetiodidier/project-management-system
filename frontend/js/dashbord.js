/**
 * dashbord.js – Manager Dashboard Logic
 * Renders Chart.js charts and populates UI from sessionStorage
 */

(function () {
  'use strict';

  /* ── Restore user info from session ── */
  const name = sessionStorage.getItem('pms_name') || sessionStorage.getItem('pms_username') || 'Manager';
  const initial = name.charAt(0).toUpperCase();

  const sidebarAvatar = document.getElementById('sidebarAvatar');
  const sidebarName   = document.getElementById('sidebarName');
  const topbarAvatar  = document.getElementById('topbarAvatar');

  if (sidebarAvatar) sidebarAvatar.textContent = initial;
  if (sidebarName)   sidebarName.textContent   = name;
  if (topbarAvatar)  topbarAvatar.textContent   = initial;

  /* ═══════════════════════════════════════
     Chart.js global defaults
  ═══════════════════════════════════════ */
  function initCharts() {
    if (typeof Chart === 'undefined') return;

    Chart.defaults.color = '#64748b';
    Chart.defaults.font.family = "'Inter', sans-serif";

    /* ── Tasks Donut ── */
    const tasksCtx = document.getElementById('tasksChart');
    if (tasksCtx) {
      new Chart(tasksCtx, {
        type: 'doughnut',
        data: {
          labels: ['Completed', 'On Hold', 'In Progress', 'Pending'],
          datasets: [{
            data: [32, 25, 25, 18],
            backgroundColor: ['#10b981', '#6d63f5', '#06b6d4', '#ef4444'],
            borderColor: 'transparent',
            borderWidth: 3,
            hoverOffset: 6,
          }],
        },
        options: {
          cutout: '68%',
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: ctx => ` ${ctx.label}: ${ctx.parsed}%`,
              },
            },
          },
          animation: { animateRotate: true, duration: 900 },
        },
      });
    }

    /* ── Work Log Donut ── */
    const workCtx = document.getElementById('worklogChart');
    if (workCtx) {
      new Chart(workCtx, {
        type: 'doughnut',
        data: {
          labels: ['App Design', 'Backend', 'Testing', 'Marketing', 'Other'],
          datasets: [{
            data: [30, 25, 20, 15, 10],
            backgroundColor: ['#ef4444', '#06b6d4', '#10b981', '#f59e0b', '#6d63f5'],
            borderColor: 'transparent',
            borderWidth: 3,
            hoverOffset: 6,
          }],
        },
        options: {
          cutout: '68%',
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: ctx => ` ${ctx.label}: ${ctx.parsed}%`,
              },
            },
          },
          animation: { animateRotate: true, duration: 1000 },
        },
      });
    }

    /* ── Performance Line Chart ── */
    const perfCtx = document.getElementById('performanceChart');
    if (perfCtx) {
      const labels = ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];
      new Chart(perfCtx, {
        type: 'line',
        data: {
          labels,
          datasets: [
            {
              label: 'Achieved',
              data: [5, 7, 6, 9, 7, 8],
              borderColor: '#6d63f5',
              backgroundColor: 'rgba(109,99,245,0.12)',
              borderWidth: 2.5,
              pointBackgroundColor: '#6d63f5',
              pointRadius: 4,
              pointHoverRadius: 6,
              fill: true,
              tension: 0.45,
            },
            {
              label: 'Target',
              data: [6, 6, 7, 7, 8, 9],
              borderColor: '#06b6d4',
              backgroundColor: 'rgba(6,182,212,0.07)',
              borderWidth: 2,
              pointBackgroundColor: '#06b6d4',
              pointRadius: 4,
              pointHoverRadius: 6,
              fill: true,
              tension: 0.45,
              borderDash: [5, 4],
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: { mode: 'index', intersect: false },
          scales: {
            x: {
              grid: { color: 'rgba(255,255,255,0.05)' },
              ticks: { color: '#64748b', font: { size: 11 } },
            },
            y: {
              beginAtZero: true,
              max: 12,
              grid: { color: 'rgba(255,255,255,0.05)' },
              ticks: { color: '#64748b', font: { size: 11 }, stepSize: 2 },
            },
          },
          plugins: {
            legend: {
              display: true,
              position: 'top',
              align: 'end',
              labels: {
                color: '#94a3b8',
                usePointStyle: true,
                pointStyle: 'circle',
                boxWidth: 8,
                font: { size: 11 },
              },
            },
          },
          animation: { duration: 900 },
        },
      });
    }

    /* ── Member Time Donut ── */
    const memberTimeCtx = document.getElementById('memberTimeChart');
    if (memberTimeCtx) {
      new Chart(memberTimeCtx, {
        type: 'doughnut',
        data: {
          labels: ['Mobile App', 'Backend API v2', 'Meetings', 'Other'],
          datasets: [{
            data: [45, 35, 15, 5],
            backgroundColor: ['#6d63f5', '#06b6d4', '#10b981', '#ef4444'],
            borderColor: 'transparent',
            borderWidth: 3,
            hoverOffset: 6,
          }],
        },
        options: {
          cutout: '68%',
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: ctx => ` ${ctx.label}: ${ctx.parsed}%`,
              },
            },
          },
          animation: { animateRotate: true, duration: 1000 },
        },
      });
    }

    /* ── Member Efficiency Line Chart ── */
    const memberEffCtx = document.getElementById('memberEfficiencyChart');
    if (memberEffCtx) {
      const labels = ['Wk 1', 'Wk 2', 'Wk 3', 'Wk 4', 'Wk 5', 'Wk 6'];
      new Chart(memberEffCtx, {
        type: 'line',
        data: {
          labels,
          datasets: [
            {
              label: 'Tasks Completed',
              data: [3, 5, 4, 7, 5, 8],
              borderColor: '#10b981',
              backgroundColor: 'rgba(16,185,129,0.12)',
              borderWidth: 2.5,
              pointBackgroundColor: '#10b981',
              pointRadius: 4,
              pointHoverRadius: 6,
              fill: true,
              tension: 0.45,
            }
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: { mode: 'index', intersect: false },
          scales: {
            x: {
              grid: { color: 'rgba(255,255,255,0.05)' },
              ticks: { color: '#64748b', font: { size: 11 } },
            },
            y: {
              beginAtZero: true,
              max: 10,
              grid: { color: 'rgba(255,255,255,0.05)' },
              ticks: { color: '#64748b', font: { size: 11 }, stepSize: 2 },
            },
          },
          plugins: {
            legend: {
              display: false,
            },
          },
          animation: { duration: 900 },
        },
      });
    }
  }

  /* ── Wait for Chart.js to load (it's deferred) ── */
  document.addEventListener('DOMContentLoaded', function () {
    // Chart.js may still be loading (defer); retry until ready
    let attempts = 0;
    const tryInit = setInterval(function () {
      attempts++;
      if (typeof Chart !== 'undefined') {
        clearInterval(tryInit);
        initCharts();
      } else if (attempts > 20) {
        clearInterval(tryInit);
        console.warn('[dashbord] Chart.js failed to load.');
      }
    }, 150);
  });

  /* ── Active nav highlight ── */
  document.addEventListener('DOMContentLoaded', function () {
    const currentPage = window.location.pathname.split('/').pop();
    document.querySelectorAll('.nav-item').forEach(function (link) {
      const href = link.getAttribute('href');
      if (href && href !== '#' && currentPage === href) {
        document.querySelectorAll('.nav-item').forEach(l => l.classList.remove('active'));
        link.classList.add('active');
      }
    });
  });

})();
