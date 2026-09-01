import { store } from '../store/StateStore.js';
import { exportTasksToJSON, exportTasksToCSV } from '../utils/storage.js';

export function renderHeader(container) {
  const state = store.getState();

  container.innerHTML = `
    <div class="flex items-center gap-3">
      <div class="search-box">
        <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <input 
          type="text" 
          id="global-search-input" 
          placeholder="Search operations, leads, tags..." 
          value="${state.filters.search || ''}"
        />
      </div>
    </div>

    <div class="header-actions">
      <!-- Data Export Menu -->
      <button class="btn btn-secondary btn-sm" id="btn-export-json" title="Export as JSON">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
          <polyline points="7 10 12 15 17 10"></polyline>
          <line x1="12" y1="15" x2="12" y2="3"></line>
        </svg>
        Export
      </button>

      <!-- Theme Switcher -->
      <button class="btn btn-icon" id="btn-theme-toggle" title="Toggle Theme">
        ${state.theme === 'dark' ? `
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="5"></circle>
            <line x1="12" y1="1" x2="12" y2="3"></line>
            <line x1="12" y1="21" x2="12" y2="23"></line>
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
            <line x1="1" y1="12" x2="3" y2="12"></line>
            <line x1="21" y1="12" x2="23" y2="12"></line>
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
          </svg>
        ` : `
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
          </svg>
        `}
      </button>

      <!-- New Task Primary CTA -->
      <button class="btn btn-primary" id="btn-new-task">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
        New Operation
      </button>
    </div>
  `;

  // Bind Header Event Listeners
  const searchInput = container.querySelector('#global-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      store.setFilter('search', e.target.value);
    });
  }

  const themeBtn = container.querySelector('#btn-theme-toggle');
  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      store.toggleTheme();
    });
  }

  const newTaskBtn = container.querySelector('#btn-new-task');
  if (newTaskBtn) {
    newTaskBtn.addEventListener('click', () => {
      store.openTaskModal('create');
    });
  }

  const exportBtn = container.querySelector('#btn-export-json');
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      const activeTasks = store.getState().tasks.filter(t => !t.archived);
      exportTasksToJSON(activeTasks);
      store.addToast('Data exported successfully!', 'success');
    });
  }
}
