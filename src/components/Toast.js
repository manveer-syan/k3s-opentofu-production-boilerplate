import { store } from '../store/StateStore.js';

export function renderToasts(container) {
  const { toasts } = store.getState();

  container.innerHTML = `
    <div class="toast-container">
      ${toasts.map(t => `
        <div class="toast toast-${t.type} animate-slide-right">
          <div class="flex items-center gap-2">
            <span>${getToastIcon(t.type)}</span>
            <span style="font-size: 0.9rem; font-weight: 500;">${t.message}</span>
          </div>
          <button class="btn btn-icon btn-sm btn-dismiss-toast" data-id="${t.id}" style="width: 24px; height: 24px;">✕</button>
        </div>
      `).join('')}
    </div>
  `;

  container.querySelectorAll('.btn-dismiss-toast').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = Number(btn.getAttribute('data-id'));
      store.removeToast(id);
    });
  });
}

function getToastIcon(type) {
  switch (type) {
    case 'success': return '✓';
    case 'error': return '✕';
    default: return 'ℹ';
  }
}
