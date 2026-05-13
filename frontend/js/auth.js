/**
 * auth.js – Login logic for the Project Management System
 *
 * Credentials per role:
 *   Project Manager  →  Email + Username
 *   Project Member   →  Email + User ID
 *
 * On success → redirects to the appropriate dashboard.
 */

(function () {
  'use strict';

  /* ── DOM references ── */
  const form       = document.getElementById('loginForm');
  const emailInput = document.getElementById('email');
  const credInput  = document.getElementById('credInput');
  const credLabel  = document.getElementById('credLabel');
  const credIcon   = document.getElementById('credIcon');
  const toggleCred = document.getElementById('toggleCred');
  const loginBtn   = document.getElementById('loginBtn');
  const errorBox   = document.getElementById('authError');
  const errorMsg   = document.getElementById('authErrorMsg');
  const radios     = document.querySelectorAll('input[name="role"]');

  /* ══════════════════════════════════════════
     Role Toggle → swap second field
  ══════════════════════════════════════════ */
  function updateCredField(role) {
    const prefix = role === 'manager' ? 'manager' : 'member';
    credLabel.textContent       = credInput.dataset[prefix + 'Label'];
    credInput.placeholder       = credInput.dataset[prefix + 'Placeholder'];
    credInput.name              = credInput.dataset[prefix + 'Name'];
    credIcon.textContent        = credInput.dataset[prefix + 'Icon'];
    credInput.value             = '';          // clear on switch
    credInput.setAttribute('aria-label', credInput.dataset[prefix + 'Label']);
    hideError();
  }

  radios.forEach(function (radio) {
    radio.addEventListener('change', function () {
      updateCredField(this.value);
    });
  });

  // Initialise with the default checked role (manager)
  updateCredField('manager');

  /* ══════════════════════════════════════════
     Toggle credential visibility
  ══════════════════════════════════════════ */
  if (toggleCred) {
    toggleCred.addEventListener('click', function () {
      const hidden = credInput.type === 'password';
      credInput.type          = hidden ? 'text' : 'password';
      toggleCred.textContent  = hidden ? '🙈' : '👁️';
    });
  }

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

  function getSelectedRole() {
    for (const r of radios) { if (r.checked) return r.value; }
    return 'member';
  }

  /* ══════════════════════════════════════════
     Validation
  ══════════════════════════════════════════ */
  function validate(role) {
    const email = emailInput.value.trim();
    const cred  = credInput.value.trim();
    const credName = role === 'manager' ? 'username' : 'User ID';

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
    if (!cred) {
      showError(`Please enter your ${credName}.`);
      credInput.focus();
      return false;
    }
    return true;
  }

  /* ══════════════════════════════════════════
     Form Submit
  ══════════════════════════════════════════ */
  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    hideError();

    const role = getSelectedRole();
    if (!validate(role)) return;

    const email = emailInput.value.trim();
    const cred  = credInput.value.trim();

    // Build payload – key differs per role
    const payload = role === 'manager'
      ? { email, username: cred, role }
      : { email, userId:   cred, role };

    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      });

      if (!response.ok) {
        let serverMsg = role === 'manager'
          ? 'Invalid email or username. Please try again.'
          : 'Invalid email or User ID. Please try again.';
        try {
          const data = await response.json();
          if (data && data.message) serverMsg = data.message;
        } catch (_) { /* ignore */ }
        showError(serverMsg);
        setLoading(false);
        return;
      }

      const data = await response.json();

      // Persist session info
      if (data.token)    sessionStorage.setItem('pms_token',    data.token);
      if (data.userId)   sessionStorage.setItem('pms_userId',   data.userId);
      if (data.username) sessionStorage.setItem('pms_username', data.username);
      if (data.name)     sessionStorage.setItem('pms_name',     data.name);
      sessionStorage.setItem('pms_role', role);

      // Redirect to correct dashboard
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
  [emailInput, credInput].forEach(function (el) {
    el.addEventListener('input', hideError);
  });

})();
