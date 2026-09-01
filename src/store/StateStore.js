import { loadTasksFromStorage, saveTasksToStorage, loadSavedTheme, saveThemePreference } from '../utils/storage.js';

class StateStore {
  constructor() {
    this.state = {
      tasks: loadTasksFromStorage(),
      currentView: 'grid', // 'grid', 'table', 'kanban', 'analytics', 'archive'
      theme: loadSavedTheme(),
      filters: {
        search: '',
        category: 'All',
        priority: 'All',
        status: 'All',
        lead: 'All',
        sortBy: 'dueDate', // 'dueDate', 'priority', 'title', 'createdAt', 'estimatedHours'
        sortOrder: 'asc' // 'asc' or 'desc'
      },
      modalState: {
        isOpen: false,
        mode: 'create', // 'create' or 'edit'
        activeTaskId: null
      },
      confirmModalState: {
        isOpen: false,
        title: '',
        message: '',
        actionType: null,
        targetId: null
      },
      toasts: []
    };

    this.listeners = [];
  }

  getState() {
    return this.state;
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notify() {
    this.listeners.forEach(listener => listener(this.state));
  }

  // --- Task State Actions ---

  setTasks(tasks) {
    this.state.tasks = tasks;
    saveTasksToStorage(tasks);
    this.notify();
  }

  addTask(task) {
    this.state.tasks = [task, ...this.state.tasks];
    saveTasksToStorage(this.state.tasks);
    this.addToast('Task created successfully!', 'success');
    this.notify();
  }

  updateTask(updatedTask) {
    this.state.tasks = this.state.tasks.map(t => t.id === updatedTask.id ? { ...t, ...updatedTask } : t);
    saveTasksToStorage(this.state.tasks);
    this.addToast('Task updated successfully!', 'success');
    this.notify();
  }

  updateTaskStatus(taskId, newStatus) {
    const task = this.state.tasks.find(t => t.id === taskId);
    if (task) {
      task.status = newStatus;
      saveTasksToStorage(this.state.tasks);
      this.addToast(`Moved to ${newStatus}`, 'info');
      this.notify();
    }
  }

  archiveTask(taskId) {
    this.state.tasks = this.state.tasks.map(t => t.id === taskId ? { ...t, archived: true } : t);
    saveTasksToStorage(this.state.tasks);
    this.addToast('Task moved to archive', 'info');
    this.notify();
  }

  restoreTask(taskId) {
    this.state.tasks = this.state.tasks.map(t => t.id === taskId ? { ...t, archived: false } : t);
    saveTasksToStorage(this.state.tasks);
    this.addToast('Task restored from archive', 'success');
    this.notify();
  }

  deleteTaskPermanently(taskId) {
    this.state.tasks = this.state.tasks.filter(t => t.id !== taskId);
    saveTasksToStorage(this.state.tasks);
    this.addToast('Task permanently deleted', 'error');
    this.notify();
  }

  // --- View & Filter Actions ---

  setCurrentView(view) {
    this.state.currentView = view;
    this.notify();
  }

  setFilter(key, value) {
    this.state.filters[key] = value;
    this.notify();
  }

  toggleTheme() {
    const newTheme = this.state.theme === 'dark' ? 'light' : 'dark';
    this.state.theme = newTheme;
    saveThemePreference(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    this.notify();
  }

  // --- Modal Control ---

  openTaskModal(mode = 'create', taskId = null) {
    this.state.modalState = {
      isOpen: true,
      mode,
      activeTaskId: taskId
    };
    this.notify();
  }

  closeTaskModal() {
    this.state.modalState.isOpen = false;
    this.notify();
  }

  openConfirmModal({ title, message, actionType, targetId }) {
    this.state.confirmModalState = {
      isOpen: true,
      title,
      message,
      actionType,
      targetId
    };
    this.notify();
  }

  closeConfirmModal() {
    this.state.confirmModalState.isOpen = false;
    this.notify();
  }

  // --- Toast Notifications ---

  addToast(message, type = 'info') {
    const id = Date.now();
    this.state.toasts.push({ id, message, type });
    this.notify();

    setTimeout(() => {
      this.removeToast(id);
    }, 3500);
  }

  removeToast(id) {
    this.state.toasts = this.state.toasts.filter(t => t.id !== id);
    this.notify();
  }
}

export const store = new StateStore();
