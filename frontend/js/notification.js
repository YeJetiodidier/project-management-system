/**
 * notification.js – Logic for the Notifications page
 * Handles filtering (All, Unread, Mentions) and marking items as read.
 */

(function () {
  'use strict';

  /* Restore user initials matching dashbord behaviour */
  const name = sessionStorage.getItem('pms_name') || sessionStorage.getItem('pms_username') || 'User';
  const initial = name.charAt(0).toUpperCase();
  const topbarAvatar = document.getElementById('topbarAvatar');
  if (topbarAvatar) topbarAvatar.textContent = initial;

  // DOM Elements
  const filterBtns = document.querySelectorAll('.filter-btn');
  const notifItems = document.querySelectorAll('.notif-item');
  const markAllBtn = document.getElementById('markAllReadBtn');
  const badgeNotif = document.getElementById('badge-notif');

  // Update Global Badge Count
  function updateBadge() {
    const unreadCount = document.querySelectorAll('.notif-item.unread').length;
    if (badgeNotif) {
      badgeNotif.textContent = unreadCount;
      badgeNotif.style.display = unreadCount > 0 ? 'inline-block' : 'none';
      if(unreadCount === 0) badgeNotif.parentNode.removeChild(badgeNotif);
    }
  }

  // Handle Filters
  filterBtns.forEach(btn => {
    btn.addEventListener('click', function () {
      // Manage active visual state
      filterBtns.forEach(b => b.classList.remove('active'));
      this.classList.add('active');

      const filterType = this.getAttribute('data-filter');

      // Filter Logic
      notifItems.forEach(item => {
        if (filterType === 'all') {
          item.style.display = 'flex';
        } else if (filterType === 'unread') {
          item.style.display = item.classList.contains('unread') ? 'flex' : 'none';
        } else if (filterType === 'mentions') {
          item.style.display = item.getAttribute('data-type') === 'mentions' ? 'flex' : 'none';
        }
      });
    });
  });

  // Mark all as read
  if (markAllBtn) {
    markAllBtn.addEventListener('click', function () {
      notifItems.forEach(item => {
        item.classList.remove('unread');
        // Hide the single "mark as read" button if it exists
        const singleBtn = item.querySelector('.mark-read-single');
        if (singleBtn) singleBtn.style.display = 'none';
      });
      updateBadge();

      // If we are currently filtering by 'unread', re-apply the filter so they vanish
      const activeFilter = document.querySelector('.filter-btn.active').getAttribute('data-filter');
      if (activeFilter === 'unread') {
        notifItems.forEach(item => item.style.display = 'none');
      }
    });
  }

  // Handle individual "Mark as read" buttons
  document.querySelectorAll('.mark-read-single').forEach(btn => {
    btn.addEventListener('click', function () {
      const parentItem = this.closest('.notif-item');
      if (parentItem) {
        parentItem.classList.remove('unread');
        this.style.display = 'none'; // hide the button
        updateBadge();

        // If currently filtering by unread, hide it immediately
        const activeFilter = document.querySelector('.filter-btn.active').getAttribute('data-filter');
        if (activeFilter === 'unread') {
          parentItem.style.display = 'none';
        }
      }
    });
  });

  // Initial setup
  updateBadge();

})();
