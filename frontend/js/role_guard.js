(function () {
  'use strict';

  const role = sessionStorage.getItem('pms_role');
  const token = sessionStorage.getItem('pms_token');

  if (!token) {
    window.location.href = 'login.html';
    return;
  }

  const page = window.location.pathname.split('/').pop();
  const isManagerPage = page === 'dashbord_manager.html';
  const isMemberPage  = page === 'dashbord ui_member.html';

  if (isManagerPage && role !== 'manager') {
    window.location.href = 'dashbord ui_member.html';
  } else if (isMemberPage && role !== 'member') {
    window.location.href = 'dashbord_manager.html';
  }
})();
