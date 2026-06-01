/**
 * auth.js – Login logic for the Project Management System
 *
 * Credentials: Email + Password only.
 * The role (manager / member) is determined by the server and used to
 * redirect to the appropriate dashboard.
 */

(function () {
  'use strict';

  /* ── DOM references ── */
  const form           = document.getElementById('loginForm');
  const emailInput     = document.getElementById('email');
  const passwordInput  = document.getElementById('password');
  const togglePassword = document.getElementById('togglePassword');
  const loginBtn       = document.getElementById('loginBtn');
  const errorBox       = document.getElementById('authError');
  const errorMsg       = document.getElementById('authErrorMsg');

  /* ══════════════════════════════════════════
     Helpers
  ══════════════════════════════════════════ */
  function showError(msg) {
    errorMsg.textContent = msg;
    errorBox.classList.add('show');
  }

  function hideError() {
    errorBox.classList.remove('show');
  }

  function setLoading(on) {
    loginBtn.classList.toggle('loading', on);
    loginBtn.disabled = on;
  }

  /* ══════════════════════════════════════════
     Validation
  ══════════════════════════════════════════ */
  function validate() {
    const email = emailInput.value.trim();

    if (!email) {
      showError('Please enter your email address.');
      emailInput.focus();
      return false;
    }
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRe.test(email)) {
      showError('Please enter a valid email address.');
      emailInput.focus();
      return false;
    }
    const password = passwordInput.value;
    if (!password) {
      showError('Please enter your password.');
      passwordInput.focus();
      return false;
    }
    return true;
  }

  /* ══════════════════════════════════════════
     Password visibility toggle
  ══════════════════════════════════════════ */
  if (togglePassword) {
    togglePassword.addEventListener('click', function () {
      const hidden = passwordInput.type === 'password';
      passwordInput.type = hidden ? 'text' : 'password';
      togglePassword.textContent = hidden ? '🙈' : '👁️';
    });
  }

  /* ══════════════════════════════════════════
     Form Submit
  ══════════════════════════════════════════ */
  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    hideError();

    if (!validate()) return;

    const email    = emailInput.value.trim();
    const password = passwordInput.value;

    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        let serverMsg = 'Invalid email or password. Please try again.';
        try {
          const data = await response.json();
          if (data && data.message) serverMsg = data.message;
        } catch (_) { /* ignore */ }
        showError(serverMsg);
        setLoading(false);
        return;
      }

      const data = await response.json();
      const role = data.role || 'member';

      // Persist session info
      if (data.token)    sessionStorage.setItem('pms_token',    data.token);
      if (data.id)       sessionStorage.setItem('pms_id',       data.id);
      if (data.userId)   sessionStorage.setItem('pms_userId',   data.userId);
      if (data.username) sessionStorage.setItem('pms_username', data.username);
      if (data.name)     sessionStorage.setItem('pms_name',     data.name);
      if (data.email)    sessionStorage.setItem('pms_email',    data.email);
      sessionStorage.setItem('pms_role', role);

      // Redirect based on the role returned by the server
      window.location.href = role === 'manager'
        ? 'dashbord_manager.html'
        : 'dashbord ui_member.html';

    } catch (err) {
      console.error('[auth] Login error:', err);
      showError('Unable to connect to the server. Please check your connection.');
      setLoading(false);
    }
  });

  /* ── Clear error while typing ── */
  [emailInput, passwordInput].forEach(function (el) {
    el.addEventListener('input', hideError);
  });

})();
