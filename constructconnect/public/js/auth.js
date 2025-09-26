import { login, registerAccount, forgotPassword } from './api.js';

const qs = sel => document.querySelector(sel);
const byId = id => document.getElementById(id);

function showModal(id) {
  const el = byId(id);
  if (!el) return;
  el.classList.add('show');
  el.setAttribute('aria-hidden', 'false');
}

function hideModal(id) {
  const el = byId(id);
  if (!el) return;
  el.classList.remove('show');
  el.setAttribute('aria-hidden', 'true');
}

window.addEventListener('DOMContentLoaded', () => {
  const loginForm = byId('loginForm');
  const togglePassword = byId('togglePassword');
  const password = byId('password');
  const openForgot = byId('openForgot');
  const openCreate = byId('openCreate');

  // Toggle password visibility
  if (togglePassword && password) {
    togglePassword.addEventListener('click', () => {
      const type = password.getAttribute('type') === 'password' ? 'text' : 'password';
      password.setAttribute('type', type);
      togglePassword.textContent = type === 'password' ? '👁️' : '🙈';
    });
  }

  // Login
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = byId('email').value.trim();
      const pass = byId('password').value;
      try {
        const res = await login(email, pass);
        if (res.role === 'manager') {
          location.href = '/manager';
        } else {
          location.href = '/client';
        }
      } catch (err) {
        alert(err.message || 'Login failed');
      }
    });
  }

  // Modals open
  if (openForgot) openForgot.addEventListener('click', () => showModal('forgotModal'));
  if (openCreate) openCreate.addEventListener('click', () => showModal('createModal'));

  // Modal close buttons
  document.querySelectorAll('.close-modal').forEach(btn => {
    btn.addEventListener('click', () => hideModal(btn.getAttribute('data-close')));
  });

  // Forgot password
  const forgotForm = byId('forgotForm');
  if (forgotForm) {
    forgotForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = byId('forgotEmail').value.trim();
      try {
        const res = await forgotPassword(email);
        alert(res.message || 'If the email exists, we sent a link.');
        hideModal('forgotModal');
      } catch (err) {
        alert(err.message || 'Something went wrong');
      }
    });
  }

  // Create account
  const createForm = byId('createForm');
  if (createForm) {
    createForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const payload = {
        firstName: byId('firstName').value.trim(),
        lastName: byId('lastName').value.trim(),
        phone: byId('phone').value.trim(),
        email: byId('createEmail').value.trim(),
        password: byId('createPassword').value
      };
      try {
        const res = await registerAccount(payload);
        // Default role is client
        location.href = res.role === 'manager' ? '/manager' : '/client';
      } catch (err) {
        alert(err.message || 'Registration failed');
      }
    });
  }
});

