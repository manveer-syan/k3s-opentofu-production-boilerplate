import { store } from '../store/StateStore.js';

export function renderFilterBar(container) {
  const state = store.getState();
  const { filters, currentView } = state;

  // Extract unique leads and categories dynamically from task list
  const categories = ['All', 'Development', 'Design', 'Marketing', 'Finance', 'Operations'];
  const leads = ['All', ...new Set(state.tasks.map(t => t.lead).filter(Boolean))];
  const priorities = ['All', 'Low', 'Medium', 'High', 'Urgent'];
  const statuses = ['All', 'Backlog', 'To Do', 'In Progress', 'Under Review', 'Completed'];

  container.innerHTML = `
    <div class="filter-bar animate-fade-in">
      <div class="filter-group">
        <!-- Category Filter -->
        <div class="flex items-center gap-1">
          <label style="font-size: 0.8rem; color: var(--text-muted);">Category:</label>
          <select id="filter-category" class="select-sm">
            ${categories.map(cat => `<option value="${cat}" ${filters.category === cat ? 'selected' : ''}>${cat}</option>`).join('')}
          </select>
        </div>

        <!-- Priority Filter -->
        <div class="flex items-center gap-1">
          <label style="font-size: 0.8rem; color: var(--text-muted);">Priority:</label>
          <select id="filter-priority" class="select-sm">
            ${priorities.map(p => `<option value="${p}" ${filters.priority === p ? 'selected' : ''}>${p}</option>`).join('')}
          </select>
        </div>

        <!-- Status Filter -->
        <div class="flex items-center gap-1">
          <label style="font-size: 0.8rem; color: var(--text-muted);">Status:</label>
          <select id="filter-status" class="select-sm">
            ${statuses.map(s => `<option value="${s}" ${filters.status === s ? 'selected' : ''}>${s}</option>`).join('')}
          </select>
        </div>

        <!-- Lead Filter -->
        <div class="flex items-center gap-1">
          <label style="font-size: 0.8rem; color: var(--text-muted);">Lead:</label>
          <select id="filter-lead" class="select-sm">
            ${leads.map(l => `<option value="${l}" ${filters.lead === l ? 'selected' : ''}>${l}</option>`).join('')}
          </select>
        </div>
      </div>

      <div class="filter-group">
        <!-- Sorting dropdown -->
        <div class="flex items-center gap-1">
          <label style="font-size: 0.8rem; color: var(--text-muted);">Sort By:</label>
          <select id="filter-sort-by" class="select-sm">
            <option value="dueDate" ${filters.sortBy === 'dueDate' ? 'selected' : ''}>Due Date</option>
            <option value="priority" ${filters.sortBy === 'priority' ? 'selected' : ''}>Priority</option>
            <option value="title" ${filters.sortBy === 'title' ? 'selected' : ''}>Title</option>
            <option value="estimatedHours" ${filters.sortBy === 'estimatedHours' ? 'selected' : ''}>Est. Hours</option>
            <option value="createdAt" ${filters.sortBy === 'createdAt' ? 'selected' : ''}>Creation Date</option>
          </select>

          <button class="btn btn-icon btn-sm" id="btn-toggle-sort-order" title="Toggle Sort Direction (${filters.sortOrder.toUpperCase()})">
            ${filters.sortOrder === 'asc' ? '↑' : '↓'}
          </button>
        </div>

        <!-- View Switch Buttons -->
        ${(currentView === 'grid' || currentView === 'table') ? `
          <div class="flex items-center gap-1" style="background: var(--bg-tertiary); padding: 2px; border-radius: var(--radius-md);">
            <button class="btn btn-sm ${currentView === 'grid' ? 'btn-primary' : ''}" id="btn-view-grid" title="Grid View">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="7" height="7"></rect>
                <rect x="14" y="3" width="7" height="7"></rect>
                <rect x="14" y="14" width="7" height="7"></rect>
                <rect x="3" y="14" width="7" height="7"></rect>
              </svg>
            </button>
            <button class="btn btn-sm ${currentView === 'table' ? 'btn-primary' : ''}" id="btn-view-table" title="Table View">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="8" y1="6" x2="21" y2="6"></line>
                <line x1="8" y1="12" x2="21" y2="12"></line>
                <line x1="8" y1="18" x2="21" y2="18"></line>
                <line x1="3" y1="6" x2="3.01" y2="6"></line>
              </svg>
            </button>
          </div>
        ` : ''}
      </div>
    </div>
  `;

  // Filter event bindings
  const categorySelect = container.querySelector('#filter-category');
  if (categorySelect) categorySelect.addEventListener('change', e => store.setFilter('category', e.target.value));

  const prioritySelect = container.querySelector('#filter-priority');
  if (prioritySelect) prioritySelect.addEventListener('change', e => store.setFilter('priority', e.target.value));

  const statusSelect = container.querySelector('#filter-status');
  if (statusSelect) statusSelect.addEventListener('change', e => store.setFilter('status', e.target.value));

  const leadSelect = container.querySelector('#filter-lead');
  if (leadSelect) leadSelect.addEventListener('change', e => store.setFilter('lead', e.target.value));

  const sortBySelect = container.querySelector('#filter-sort-by');
  if (sortBySelect) sortBySelect.addEventListener('change', e => store.setFilter('sortBy', e.target.value));

  const sortOrderBtn = container.querySelector('#btn-toggle-sort-order');
  if (sortOrderBtn) {
    sortOrderBtn.addEventListener('click', () => {
      store.setFilter('sortOrder', filters.sortOrder === 'asc' ? 'desc' : 'asc');
    });
  }

  const gridViewBtn = container.querySelector('#btn-view-grid');
  if (gridViewBtn) gridViewBtn.addEventListener('click', () => store.setCurrentView('grid'));

  const tableViewBtn = container.querySelector('#btn-view-table');
  if (tableViewBtn) tableViewBtn.addEventListener('click', () => store.setCurrentView('table'));
}
