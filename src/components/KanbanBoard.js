import { store } from '../store/StateStore.js';
import { filterAndSortTasks } from '../services/TaskService.js';
import { getPriorityBadgeHTML, escapeHtml } from '../utils/formatters.js';

export function renderKanbanBoard(container) {
  const { tasks, filters } = store.getState();
  const activeTasks = filterAndSortTasks(tasks, filters, false);

  const columns = [
    { title: 'Backlog', status: 'Backlog', color: '#94a3b8' },
    { title: 'To Do', status: 'To Do', color: '#38bdf8' },
    { title: 'In Progress', status: 'In Progress', color: '#f59e0b' },
    { title: 'Under Review', status: 'Under Review', color: '#a855f7' },
    { title: 'Completed', status: 'Completed', color: '#10b981' }
  ];

  const columnsHTML = columns.map(col => {
    const columnTasks = activeTasks.filter(t => t.status === col.status);

    const cardsHTML = columnTasks.map(task => `
      <div 
        class="glass-card task-card draggable animate-fade-in" 
        data-id="${task.id}" 
        draggable="true"
        style="padding: 1rem;"
      >
        <div class="task-card-header">
          <span class="tag-category">${escapeHtml(task.category)}</span>
          ${getPriorityBadgeHTML(task.priority)}
        </div>
        <h4 class="task-title" style="font-size: 0.95rem;">${escapeHtml(task.title)}</h4>
        <div class="flex items-center justify-between" style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.5rem;">
          <span>👤 ${escapeHtml(task.lead || 'Unassigned')}</span>
          <span>⏱️ ${task.estimatedHours || 0}h</span>
        </div>
        <div class="flex justify-end gap-1" style="margin-top: 0.5rem;">
          <button class="btn btn-secondary btn-sm btn-edit" data-id="${task.id}">Edit</button>
        </div>
      </div>
    `).join('');

    return `
      <div class="kanban-column" data-status="${col.status}">
        <div class="kanban-column-header">
          <div class="flex items-center gap-2">
            <span style="width: 10px; height: 10px; border-radius: 50%; background: ${col.color};"></span>
            <span>${col.title}</span>
          </div>
          <span class="badge" style="background: var(--bg-tertiary);">${columnTasks.length}</span>
        </div>
        <div class="kanban-cards-container" data-status="${col.status}">
          ${cardsHTML.length ? cardsHTML : '<div style="font-size: 0.8rem; color: var(--text-muted); text-align: center; padding: 2rem 0;">Drag items here</div>'}
        </div>
      </div>
    `;
  }).join('');

  container.innerHTML = `<div class="kanban-board animate-fade-in">${columnsHTML}</div>`;

  // Bind Edit buttons
  container.querySelectorAll('.btn-edit').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.getAttribute('data-id');
      store.openTaskModal('edit', id);
    });
  });

  // Setup HTML5 Drag and Drop logic
  setupDragAndDrop(container);
}

function setupDragAndDrop(container) {
  let draggedTaskId = null;

  container.querySelectorAll('.draggable').forEach(card => {
    card.addEventListener('dragstart', (e) => {
      draggedTaskId = card.getAttribute('data-id');
      card.classList.add('dragging');
      e.dataTransfer.setData('text/plain', draggedTaskId);
    });

    card.addEventListener('dragend', () => {
      card.classList.remove('dragging');
    });
  });

  container.querySelectorAll('.kanban-cards-container').forEach(dropZone => {
    dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropZone.classList.add('drag-over');
    });

    dropZone.addEventListener('dragleave', () => {
      dropZone.classList.remove('drag-over');
    });

    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.classList.remove('drag-over');
      const targetStatus = dropZone.getAttribute('data-status');
      if (draggedTaskId && targetStatus) {
        store.updateTaskStatus(draggedTaskId, targetStatus);
      }
    });
  });
}
