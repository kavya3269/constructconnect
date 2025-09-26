import { getNotifications } from './api.js';

function renderNotifications(list) {
  const badge = document.getElementById('notifBadge');
  const box = document.getElementById('notifList');
  const btn = document.getElementById('notifBtn');
  if (!badge || !box || !btn) return;
  const count = list.length;
  if (count > 0) {
    badge.textContent = String(count);
    badge.hidden = false;
  } else {
    badge.hidden = true;
  }
  box.innerHTML = '';
  list.forEach(n => {
    const item = document.createElement('div');
    item.className = 'notif-item';
    const time = new Date(n.createdAt).toLocaleString();
    item.textContent = `${n.message} · ${time}`;
    box.appendChild(item);
  });
  btn.addEventListener('click', () => {
    box.hidden = !box.hidden;
  });
  document.addEventListener('click', (e) => {
    if (!box.contains(e.target) && e.target !== btn) {
      box.hidden = true;
    }
  });
}

async function initNotifications() {
  try {
    const { notifications } = await getNotifications();
    renderNotifications(notifications || []);
  } catch (e) {}
}

window.addEventListener('DOMContentLoaded', () => {
  initNotifications();
});

