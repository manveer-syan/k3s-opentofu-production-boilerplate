import { store } from '../store/StateStore.js';
import { validateTaskForm } from '../services/TaskService.js';
import { generateId } from '../utils/formatters.js';

export function renderTaskFormModal(container) {
  const { modalState, tasks } = store.getState();
  if (!modalState.isOpen) {
    container.innerHTML = '';
    return;
  }

  const isEdit = modalState.mode === 'edit';
  const taskToEdit = isEdit ? tasks.find(t => t.id === modalState.activeTaskId) : null;

  const defaultTask = {
    title: '',
    description: '',
    category: 'Development',
    priority: 'Medium',
    status: 'To Do',
    lead: 'Manveer Singh',
    dueDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
    estimatedHours: 8,
    tags: []
  };

  const initialValues = taskToEdit ? { ...taskToEdit } : defaultTask;

  container.innerHTML = `
    <div class="modal-overlay active" id="task-modal-overlay">
      <div class="modal-content animate-fade-in">
        <div class="modal-header">
          <h3>${isEdit ? 'Edit Operation Details' : 'Create New Operation'}</h3>
          <button class="btn btn-icon btn-sm" id="btn-close-modal">✕</button>
        </div>

        <form id="task-form">
          <div class="modal-body">
            <!-- Title -->
            <div class="form-group">
              <label for="form-title">Operation Title *</label>
              <input type="text" id="form-title" value="${initialValues.title || ''}" placeholder="e.g. Database Index Optimization" required />
              <span class="error-text" id="err-title"></span>
            </div>

            <!-- Description -->
            <div class="form-group">
              <label for="form-description">Description</label>
              <textarea id="form-description" rows="3" placeholder="Provide operational scope, goals, or requirements...">${initialValues.description || ''}</textarea>
            </div>

            <!-- Category & Priority Row -->
            <div class="form-row">
              <div class="form-group">
                <label for="form-category">Category *</label>
                <select id="form-category">
                  <option value="Development" ${initialValues.category === 'Development' ? 'selected' : ''}>Development</option>
                  <option value="Design" ${initialValues.category === 'Design' ? 'selected' : ''}>Design</option>
                  <option value="Marketing" ${initialValues.category === 'Marketing' ? 'selected' : ''}>Marketing</option>
                  <option value="Finance" ${initialValues.category === 'Finance' ? 'selected' : ''}>Finance</option>
                  <option value="Operations" ${initialValues.category === 'Operations' ? 'selected' : ''}>Operations</option>
                </select>
              </div>

              <div class="form-group">
                <label for="form-priority">Priority *</label>
                <select id="form-priority">
                  <option value="Low" ${initialValues.priority === 'Low' ? 'selected' : ''}>Low</option>
                  <option value="Medium" ${initialValues.priority === 'Medium' ? 'selected' : ''}>Medium</option>
                  <option value="High" ${initialValues.priority === 'High' ? 'selected' : ''}>High</option>
                  <option value="Urgent" ${initialValues.priority === 'Urgent' ? 'selected' : ''}>Urgent</option>
                </select>
              </div>
            </div>

            <!-- Status & Lead Row -->
            <div class="form-row">
              <div class="form-group">
                <label for="form-status">Status *</label>
                <select id="form-status">
                  <option value="Backlog" ${initialValues.status === 'Backlog' ? 'selected' : ''}>Backlog</option>
                  <option value="To Do" ${initialValues.status === 'To Do' ? 'selected' : ''}>To Do</option>
                  <option value="In Progress" ${initialValues.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
                  <option value="Under Review" ${initialValues.status === 'Under Review' ? 'selected' : ''}>Under Review</option>
                  <option value="Completed" ${initialValues.status === 'Completed' ? 'selected' : ''}>Completed</option>
                </select>
              </div>

              <div class="form-group">
                <label for="form-lead">Assigned Lead</label>
                <input type="text" id="form-lead" value="${initialValues.lead || ''}" placeholder="e.g. Manveer Singh" />
              </div>
            </div>

            <!-- Due Date & Estimated Hours Row -->
            <div class="form-row">
              <div class="form-group">
                <label for="form-due-date">Target Due Date</label>
                <input type="date" id="form-due-date" value="${initialValues.dueDate || ''}" />
              </div>

              <div class="form-group">
                <label for="form-hours">Estimated Hours</label>
                <input type="number" id="form-hours" min="0" value="${initialValues.estimatedHours || 0}" />
                <span class="error-text" id="err-hours"></span>
              </div>
            </div>

            <!-- Tags -->
            <div class="form-group">
              <label for="form-tags">Tags (comma separated)</label>
              <input type="text" id="form-tags" value="${(initialValues.tags || []).join(', ')}" placeholder="e.g. Backend, API, Performance" />
            </div>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" id="btn-cancel-modal">Cancel</button>
            <button type="submit" class="btn btn-primary">${isEdit ? 'Save Changes' : 'Create Operation'}</button>
          </div>
        </form>
      </div>
    </div>
  `;

  // Event Handlers
  const overlay = container.querySelector('#task-modal-overlay');
  const closeBtn = container.querySelector('#btn-close-modal');
  const cancelBtn = container.querySelector('#btn-cancel-modal');
  const form = container.querySelector('#task-form');

  const closeModal = () => store.closeTaskModal();

  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  if (cancelBtn) cancelBtn.addEventListener('click', closeModal);

  if (overlay) {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeModal();
    });
  }

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const rawTags = container.querySelector('#form-tags').value;
      const tagsArray = rawTags ? rawTags.split(',').map(t => t.trim()).filter(Boolean) : [];

      const formData = {
        title: container.querySelector('#form-title').value,
        description: container.querySelector('#form-description').value,
        category: container.querySelector('#form-category').value,
        priority: container.querySelector('#form-priority').value,
        status: container.querySelector('#form-status').value,
        lead: container.querySelector('#form-lead').value,
        dueDate: container.querySelector('#form-due-date').value,
        estimatedHours: Number(container.querySelector('#form-hours').value) || 0,
        tags: tagsArray
      };

      const validation = validateTaskForm(formData);
      if (!validation.isValid) {
        if (validation.errors.title) container.querySelector('#err-title').innerText = validation.errors.title;
        if (validation.errors.estimatedHours) container.querySelector('#err-hours').innerText = validation.errors.estimatedHours;
        return;
      }

      if (isEdit && taskToEdit) {
        store.updateTask({ ...taskToEdit, ...formData });
      } else {
        store.addTask({
          id: generateId(),
          ...formData,
          archived: false,
          createdAt: new Date().toISOString()
        });
      }

      closeModal();
    });
  }
}
