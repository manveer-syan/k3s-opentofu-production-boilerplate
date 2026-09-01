import { store } from './store/StateStore.js';
import { renderHeader } from './components/Header.js';
import { renderSidebar } from './components/Sidebar.js';
import { renderStatsOverview } from './components/StatsOverview.js';
import { renderFilterBar } from './components/FilterBar.js';
import { renderTaskList } from './components/TaskList.js';
import { renderKanbanBoard } from './components/KanbanBoard.js';
import { renderAnalyticsView } from './components/AnalyticsView.js';
import { renderTaskFormModal } from './components/TaskFormModal.js';
import { renderConfirmationModal } from './components/ConfirmationModal.js';
import { renderToasts } from './components/Toast.js';

class App {
  constructor() {
    this.initDOMReferences();
    this.subscribeToStore();
    this.render();
  }

  initDOMReferences() {
    this.headerContainer = document.getElementById('header-container');
    this.sidebarContainer = document.getElementById('sidebar-container');
    this.statsContainer = document.getElementById('stats-container');
    this.filterBarContainer = document.getElementById('filter-bar-container');
    this.mainViewContainer = document.getElementById('main-view-container');
    this.taskModalContainer = document.getElementById('task-modal-container');
    this.confirmModalContainer = document.getElementById('confirm-modal-container');
    this.toastContainer = document.getElementById('toast-container');
  }

  subscribeToStore() {
    store.subscribe(() => {
      this.render();
    });
  }

  render() {
    const state = store.getState();

    // Render Persistent Structural Components
    renderHeader(this.headerContainer);
    renderSidebar(this.sidebarContainer);
    renderStatsOverview(this.statsContainer);

    // Render Filter Bar unless in Kanban or Analytics View where filters differ
    if (state.currentView === 'analytics') {
      this.filterBarContainer.style.display = 'none';
    } else {
      this.filterBarContainer.style.display = 'block';
      renderFilterBar(this.filterBarContainer);
    }

    // Dynamic Main View Rendering
    switch (state.currentView) {
      case 'kanban':
        renderKanbanBoard(this.mainViewContainer);
        break;
      case 'analytics':
        renderAnalyticsView(this.mainViewContainer);
        break;
      case 'grid':
      case 'table':
      case 'archive':
      default:
        renderTaskList(this.mainViewContainer);
        break;
    }

    // Render Modals & Toasts
    renderTaskFormModal(this.taskModalContainer);
    renderConfirmationModal(this.confirmModalContainer);
    renderToasts(this.toastContainer);
  }
}

// Initialize Application when DOM ready
document.addEventListener('DOMContentLoaded', () => {
  new App();
});
