/**
 * register.js – Registration logic for the Project Management System
 *
 * Both roles register with: Email, Username, Password
 * Project Member additionally requires: Project ID (to join a manager's project)
 *
 * On success → redirects to login.html
 */

(function () {
  'use strict';

  /* ── DOM references ── */
  const form           = document.getElementById('registerForm');
  const emailInput     = document.getElementById('regEmail');
  const usernameInput  = document.getElementById('regUsername');
  const passwordInput  = document.getElementById('regPassword');
  const togglePassword = document.getElementById('togglePassword');
  const projectIdInput = document.getElementById('projectId');
  const projectIdGroup = document.getElementById('projectIdGroup');
  const pwBar          = document.getElementById('pwStrengthBar');
  const pwLabel        = document.getElementById('pwStrengthLabel');
  const registerBtn    = document.getElementById('registerBtn');
  const errorBox       = document.getElementById('regError');
  const errorMsg       = document.getElementById('regErrorMsg');
  const successBox     = document.getElementById('regSuccess');
  const successMsg     = document.getElementById('regSuccessMsg');
  const radios         = document.querySelectorAll('input[name="role"]');
  const subtitle       = document.getElementById('registerSubtitle');

  /* ══════════════════════════════════════════
     Role Toggle → show/hide Project ID field
  ══════════════════════════════════════════ */
  function applyRole(role) {
    const isMember = role === 'member';

    // Animated reveal of Project ID field
    projectIdGroup.style.display = 'block';
    // Trigger CSS transition on next frame
    requestAnimationFrame(function () {
      projectIdGroup.classList.toggle('visible', isMember);
    });

    // Required only for member
    projectIdInput.required = isMember;

    // Update subtitle hint
    subtitle.textContent = isMember
      ? 'Enter your details and the Project ID your manager gave you.'
      : 'Enter your details to create a manager account.';

    hideError();
    hideSuccess();
  }

  radios.forEach(function (radio) {
    radio.addEventListener('change', function () {
      applyRole(this.value);
    });
  });

  // Init with default (manager)
  applyRole('manager');

  /* ══════════════════════════════════════════
     Password visibility toggle
  ══════════════════════════════════════════ */
  if (togglePassword) {
    togglePassword.addEventListener('click', function () {
      const hidden = passwordInput.type === 'password';
      passwordInput.type     = hidden ? 'text' : 'password';
      togglePassword.textContent = hidden ? '🙈' : '👁️';
    });
  }

  /* ══════════════════════════════════════════
     Password strength meter
  ══════════════════════════════════════════ */
  function checkStrength(pw) {
    if (!pw) return { level: '', label: '' };
    let score = 0;
    if (pw.length >= 8)                     score++;
    if (/[A-Z]/.test(pw))                   score++;
    if (/[0-9]/.test(pw))                   score++;
    if (/[^A-Za-z0-9]/.test(pw))            score++;

    if (score <= 1) return { level: 'weak',   label: 'Weak' };
    if (score <= 2) return { level: 'fair',   label: 'Fair' };
    return           { level: 'strong', label: 'Strong' };
  }

  passwordInput.addEventListener('input', function () {
    const { level, label } = checkStrength(this.value);
    pwBar.className   = 'pw-strength-bar ' + level;
    pwLabel.className = 'pw-strength-label ' + level;
    pwLabel.textContent = label ? `Password strength: ${label}` : '';
  });

  /* ══════════════════════════════════════════
     Helpers
  ══════════════════════════════════════════ */
  function showError(msg) {
    errorMsg.textContent = msg;
    errorBox.classList.add('show');
    successBox.classList.remove('show');
  }

  function hideError() { errorBox.classList.remove('show'); }

  function showSuccess(msg) {
    successMsg.textContent = msg;
    successBox.classList.add('show');
    errorBox.classList.remove('show');
  }

  function hideSuccess() { successBox.classList.remove('show'); }

  function setLoading(on) {
    registerBtn.classList.toggle('loading', on);
    registerBtn.disabled = on;
  }

  function getSelectedRole() {
    for (const r of radios) { if (r.checked) return r.value; }
    return 'member';
  }

  /* ══════════════════════════════════════════
     Validation
  ══════════════════════════════════════════ */
  function validate(role) {
    const email     = emailInput.value.trim();
    const username  = usernameInput.value.trim();
    const password  = passwordInput.value;
    const projectId = projectIdInput.value.trim();

    if (!email) {
      showError('Please enter your email address.');
      emailInput.focus(); return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showError('Please enter a valid email address.');
      emailInput.focus(); return false;
    }
    if (!username) {
      showError('Please choose a username.');
      usernameInput.focus(); return false;
    }
    if (username.length < 3) {
      showError('Username must be at least 3 characters.');
      usernameInput.focus(); return false;
    }
    if (!password) {
      showError('Please create a password.');
      passwordInput.focus(); return false;
    }
    if (password.length < 6) {
      showError('Password must be at least 6 characters.');
      passwordInput.focus(); return false;
    }
    if (role === 'member' && !projectId) {
      showError('Please enter the Project ID given to you by your manager.');
      projectIdInput.focus(); return false;
    }
    return true;
  }

  /* ══════════════════════════════════════════
     Form Submit
  ══════════════════════════════════════════ */
  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    hideError();
    hideSuccess();

    const role = getSelectedRole();
    if (!validate(role)) return;

    const payload = {
      email:    emailInput.value.trim(),
      username: usernameInput.value.trim(),
      password: passwordInput.value,
      role,
    };

    // Attach Project ID only for members
    if (role === 'member') {
      payload.projectId = projectIdInput.value.trim();
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      });

      if (!response.ok) {
        let serverMsg = 'Registration failed. Please try again.';
        try {
          const data = await response.json();
          if (data && data.message) serverMsg = data.message;
        } catch (_) { /* ignore */ }
        showError(serverMsg);
        setLoading(false);
        return;
      }

      // Success
      showSuccess('Account created successfully! Redirecting to login…');
      setTimeout(function () {
        window.location.href = 'login.html';
      }, 1800);

    } catch (err) {
      console.error('[register] Error:', err);
      showError('Unable to reach the server. Please check your connection.');
      setLoading(false);
    }
  });

  /* ── Clear errors on input ── */
  [emailInput, usernameInput, passwordInput, projectIdInput].forEach(function (el) {
    el.addEventListener('input', hideError);
  });

})();
