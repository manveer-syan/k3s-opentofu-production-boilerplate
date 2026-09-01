import { store } from '../store/StateStore.js';
import { initialTasks } from '../utils/dummyData.js';

export function renderSidebar(container) {
  const state = store.getState();
  const activeTasksCount = state.tasks.filter(t => !t.archived).length;
  const archivedTasksCount = state.tasks.filter(t => t.archived).length;

  container.innerHTML = `
    <div class="sidebar-header">
      <img src="./assets/images/logo.jpg" alt="ATE Ops Logo" class="app-brand-logo" />
      <div>
        <div class="app-brand-title">ATE Suite</div>
        <div style="font-size: 0.7rem; color: var(--text-muted); font-weight: 500;">Operations Control</div>
      </div>
    </div>

    <nav class="sidebar-nav">
      <div 
        class="nav-item ${state.currentView === 'grid' ? 'active' : ''}" 
        data-view="grid"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="3" width="7" height="7"></rect>
          <rect x="14" y="3" width="7" height="7"></rect>
          <rect x="14" y="14" width="7" height="7"></rect>
          <rect x="3" y="14" width="7" height="7"></rect>
        </svg>
        <span>Card Grid</span>
        <span class="nav-badge">${activeTasksCount}</span>
      </div>

      <div 
        class="nav-item ${state.currentView === 'table' ? 'active' : ''}" 
        data-view="table"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="8" y1="6" x2="21" y2="6"></line>
          <line x1="8" y1="12" x2="21" y2="12"></line>
          <line x1="8" y1="18" x2="21" y2="18"></line>
          <line x1="3" y1="6" x2="3.01" y2="6"></line>
          <line x1="3" y1="12" x2="3.01" y2="12"></line>
          <line x1="3" y1="18" x2="3.01" y2="18"></line>
        </svg>
        <span>Data Table</span>
      </div>

      <div 
        class="nav-item ${state.currentView === 'kanban' ? 'active' : ''}" 
        data-view="kanban"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M3 3h4v18H3zM10 3h4v12h-4zM17 3h4v15h-4z"></path>
        </svg>
        <span>Kanban Board</span>
      </div>

      <div 
        class="nav-item ${state.currentView === 'analytics' ? 'active' : ''}" 
        data-view="analytics"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="20" x2="18" y2="10"></line>
          <line x1="12" y1="20" x2="12" y2="4"></line>
          <line x1="6" y1="20" x2="6" y2="14"></line>
        </svg>
        <span>Analytics</span>
      </div>

      <div style="height: 1px; background: var(--border-color); margin: 0.5rem 0;"></div>

      <div 
        class="nav-item ${state.currentView === 'archive' ? 'active' : ''}" 
        data-view="archive"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="21 8 21 21 3 21 3 8"></polyline>
          <rect x="1" y="3" width="22" height="5"></rect>
          <line x1="10" y1="12" x2="14" y2="12"></line>
        </svg>
        <span>Archive Trash</span>
        <span class="nav-badge">${archivedTasksCount}</span>
      </div>
    </nav>

    <div class="sidebar-footer">
      <button class="btn btn-secondary btn-sm" id="btn-seed-data" style="width: 100%;">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"></path>
        </svg>
        Reset Demo Data
      </button>
    </div>
  `;

  // Bind Sidebar Navigation
  const navItems = container.querySelectorAll('.nav-item');
  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const view = item.getAttribute('data-view');
      store.setCurrentView(view);
    });
  });

  const seedBtn = container.querySelector('#btn-seed-data');
  if (seedBtn) {
    seedBtn.addEventListener('click', () => {
      store.setTasks(initialTasks);
      store.addToast('Demo data restored successfully!', 'info');
    });
  }
}
