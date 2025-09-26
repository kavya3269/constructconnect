import { getMe, getMetrics, getRecentProjects, logout } from './api.js';

const byId = (id) => document.getElementById(id);

function formatCurrency(n) {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

async function loadUser() {
  try {
    const me = await getMe();
    const el = document.getElementById('userInfo');
    if (el) el.textContent = `${me.name} · ${me.role}`;
  } catch (e) {
    // Not logged in, go home
    location.href = '/';
  }
}

async function loadMetrics() {
  try {
    const m = await getMetrics();
    if (byId('mTotal')) byId('mTotal').textContent = m.totalProjects;
    if (byId('mActive')) byId('mActive').textContent = m.activeProjects;
    if (byId('mBudget')) byId('mBudget').textContent = formatCurrency(m.totalBudget);
    if (byId('mUsed')) byId('mUsed').textContent = formatCurrency(m.budgetUsed);
  } catch (e) {}
}

async function loadRecent() {
  try {
    const { projects } = await getRecentProjects();
    const container = document.getElementById('recentProjects');
    if (!container) return;
    container.innerHTML = '';
    projects.forEach(p => {
      const item = document.createElement('div');
      item.className = 'list-item';
      item.innerHTML = `<strong>${p.name}</strong><small>Status: ${p.status}</small>`;
      container.appendChild(item);
    });
  } catch (e) {}
}

function initNav() {
  const drawer = document.getElementById('drawer');
  const open = document.getElementById('hamburger');
  const close = document.getElementById('drawerClose');
  if (open) open.addEventListener('click', () => drawer.classList.add('open'));
  if (close) close.addEventListener('click', () => drawer.classList.remove('open'));
  const signOut = document.getElementById('signOut');
  if (signOut) signOut.addEventListener('click', async () => { await logout(); location.href = '/'; });
}

window.addEventListener('DOMContentLoaded', async () => {
  initNav();
  await loadUser();
  await Promise.all([loadMetrics(), loadRecent()]);
});

