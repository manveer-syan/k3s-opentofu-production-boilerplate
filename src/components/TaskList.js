import { store } from '../store/StateStore.js';
import { filterAndSortTasks } from '../services/TaskService.js';
import { formatDate, getRelativeTimeStatus, getPriorityBadgeHTML, getStatusBadgeHTML, escapeHtml } from '../utils/formatters.js';

export function renderTaskList(container) {
  const { tasks, filters, currentView } = store.getState();
  const isArchive = currentView === 'archive';
  const filteredTasks = filterAndSortTasks(tasks, filters, isArchive);

  if (filteredTasks.length === 0) {
    container.innerHTML = `
      <div class="glass-card animate-fade-in" style="padding: 3rem; text-align: center;">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="1.5" style="margin-bottom: 1rem;">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        <h3 style="margin-bottom: 0.5rem; color: var(--text-secondary);">No Operations Found</h3>
        <p style="font-size: 0.9rem; color: var(--text-muted);">
          ${isArchive ? 'The archive is currently empty.' : 'No tasks match your current search and filter criteria.'}
        </p>
      </div>
    `;
    return;
  }

  if (currentView === 'table' || isArchive) {
    renderTableView(container, filteredTasks, isArchive);
  } else {
    renderGridView(container, filteredTasks);
  }
}

function renderGridView(container, tasks) {
  const cardsHTML = tasks.map(task => {
    const timeStatus = getRelativeTimeStatus(task.dueDate);
    const tagsHTML = (task.tags || []).map(t => `<span class="tag-category">#${escapeHtml(t)}</span>`).join(' ');

    return `
      <div class="glass-card task-card draggable animate-fade-in" data-id="${task.id}" draggable="true">
        <div class="task-card-header">
          <span class="tag-category">${escapeHtml(task.category || 'General')}</span>
          ${getPriorityBadgeHTML(task.priority)}
        </div>

        <div>
          <h4 class="task-title" title="${escapeHtml(task.title)}">${escapeHtml(task.title)}</h4>
          <p class="task-description" style="margin-top: 0.35rem;">${escapeHtml(task.description || 'No description provided.')}</p>
        </div>

        <div class="flex items-center justify-between" style="margin-top: 0.25rem;">
          ${getStatusBadgeHTML(task.status)}
          <span style="font-size: 0.8rem; color: var(--text-muted);">${task.estimatedHours || 0} hrs</span>
        </div>

        ${tagsHTML ? `<div class="flex flex-wrap gap-1">${tagsHTML}</div>` : ''}

        <div class="task-meta-row">
          <div class="flex items-center gap-1" title="Assigned Lead">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
            <span>${escapeHtml(task.lead || 'Unassigned')}</span>
          </div>

          <div style="color: ${timeStatus.class === 'urgent' ? '#ef4444' : 'inherit'}; font-weight: 500;">
            📅 ${formatDate(task.dueDate)}
          </div>
        </div>

        <div class="task-actions flex justify-end gap-1" style="margin-top: 0.25rem;">
          <button class="btn btn-secondary btn-sm btn-edit" data-id="${task.id}" title="Edit Task">
            Edit
          </button>
          <button class="btn btn-danger btn-sm btn-archive" data-id="${task.id}" title="Move to Archive">
            Archive
          </button>
        </div>
      </div>
    `;
  }).join('');

  container.innerHTML = `<div class="tasks-grid-view">${cardsHTML}</div>`;
  bindTaskEvents(container);
}

function renderTableView(container, tasks, isArchive) {
  const rowsHTML = tasks.map(task => {
    return `
      <tr data-id="${task.id}" class="animate-fade-in">
        <td><strong>${escapeHtml(task.title)}</strong></td>
        <td><span class="tag-category">${escapeHtml(task.category || 'General')}</span></td>
        <td>${getPriorityBadgeHTML(task.priority)}</td>
        <td>${getStatusBadgeHTML(task.status)}</td>
        <td>${escapeHtml(task.lead || 'Unassigned')}</td>
        <td>${formatDate(task.dueDate)}</td>
        <td>${task.estimatedHours || 0} hrs</td>
        <td class="flex gap-1 justify-end">
          ${isArchive ? `
            <button class="btn btn-secondary btn-sm btn-restore" data-id="${task.id}">Restore</button>
            <button class="btn btn-danger btn-sm btn-delete-perm" data-id="${task.id}">Delete</button>
          ` : `
            <button class="btn btn-secondary btn-sm btn-edit" data-id="${task.id}">Edit</button>
            <button class="btn btn-danger btn-sm btn-archive" data-id="${task.id}">Archive</button>
          `}
        </td>
      </tr>
    `;
  }).join('');

  container.innerHTML = `
    <div class="table-container animate-fade-in">
      <table class="data-table">
        <thead>
          <tr>
            <th>Operation Title</th>
            <th>Category</th>
            <th>Priority</th>
            <th>Status</th>
            <th>Lead</th>
            <th>Due Date</th>
            <th>Est. Hours</th>
            <th style="text-align: right;">Actions</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHTML}
        </tbody>
      </table>
    </div>
  `;
  bindTaskEvents(container);
}

function bindTaskEvents(container) {
  container.querySelectorAll('.btn-edit').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.getAttribute('data-id');
      store.openTaskModal('edit', id);
    });
  });

  container.querySelectorAll('.btn-archive').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.getAttribute('data-id');
      store.archiveTask(id);
    });
  });

  container.querySelectorAll('.btn-restore').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.getAttribute('data-id');
      store.restoreTask(id);
    });
  });

  container.querySelectorAll('.btn-delete-perm').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.getAttribute('data-id');
      store.openConfirmModal({
        title: 'Delete Operation Permanently',
        message: 'Are you sure you want to permanently delete this task? This action cannot be undone.',
        actionType: 'delete_perm',
        targetId: id
      });
    });
  });
}
