import { initialTasks } from './dummyData.js';

const STORAGE_KEY = 'ate_operations_tasks';
const THEME_KEY = 'ate_theme';

export function loadTasksFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      saveTasksToStorage(initialTasks);
      return initialTasks;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to parse local storage tasks', err);
    return initialTasks;
  }
}

export function saveTasksToStorage(tasks) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch (err) {
    console.error('Failed to save tasks to local storage', err);
  }
}

export function loadSavedTheme() {
  return localStorage.getItem(THEME_KEY) || 'dark';
}

export function saveThemePreference(theme) {
  localStorage.setItem(THEME_KEY, theme);
}

export function exportTasksToJSON(tasks) {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(tasks, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", `ate_tasks_export_${new Date().toISOString().slice(0,10)}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

export function exportTasksToCSV(tasks) {
  if (!tasks.length) return;
  const headers = ['ID', 'Title', 'Category', 'Priority', 'Status', 'Lead', 'Due Date', 'Est Hours', 'Tags', 'Created At'];
  const rows = tasks.map(t => [
    t.id,
    `"${(t.title || '').replace(/"/g, '""')}"`,
    `"${(t.category || '').replace(/"/g, '""')}"`,
    t.priority,
    t.status,
    `"${(t.lead || '').replace(/"/g, '""')}"`,
    t.dueDate,
    t.estimatedHours || 0,
    `"${(t.tags || []).join(';')}"`,
    t.createdAt
  ]);

  const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", encodeURI(csvContent));
  downloadAnchor.setAttribute("download", `ate_tasks_export_${new Date().toISOString().slice(0,10)}.csv`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}
