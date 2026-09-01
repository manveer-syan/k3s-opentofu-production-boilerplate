import { store } from '../store/StateStore.js';

export function renderConfirmationModal(container) {
  const { confirmModalState } = store.getState();
  if (!confirmModalState.isOpen) {
    container.innerHTML = '';
    return;
  }

  container.innerHTML = `
    <div class="modal-overlay active" id="confirm-modal-overlay">
      <div class="modal-content animate-fade-in" style="max-width: 440px;">
        <div class="modal-header" style="border-bottom-color: rgba(239, 68, 68, 0.2);">
          <h3 style="color: #ef4444;">${confirmModalState.title || 'Confirm Action'}</h3>
          <button class="btn btn-icon btn-sm" id="btn-close-confirm">✕</button>
        </div>

        <div class="modal-body">
          <p style="color: var(--text-secondary); font-size: 0.95rem;">
            ${confirmModalState.message || 'Are you sure you want to proceed with this operation?'}
          </p>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" id="btn-cancel-confirm">Cancel</button>
          <button type="button" class="btn btn-danger" id="btn-execute-confirm">Confirm Delete</button>
        </div>
      </div>
    </div>
  `;

  const close = () => store.closeConfirmModal();

  container.querySelector('#btn-close-confirm')?.addEventListener('click', close);
  container.querySelector('#btn-cancel-confirm')?.addEventListener('click', close);
  container.querySelector('#confirm-modal-overlay')?.addEventListener('click', (e) => {
    if (e.target.id === 'confirm-modal-overlay') close();
  });

  container.querySelector('#btn-execute-confirm')?.addEventListener('click', () => {
    if (confirmModalState.actionType === 'delete_perm' && confirmModalState.targetId) {
      store.deleteTaskPermanently(confirmModalState.targetId);
    }
    close();
  });
}
