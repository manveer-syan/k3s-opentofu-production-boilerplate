/**
 * Formatting and Helper Utilities
 */

export function formatDate(dateString) {
  if (!dateString) return 'No Date';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(date);
}

export function getRelativeTimeStatus(dateString) {
  if (!dateString) return { text: 'No due date', class: 'normal' };
  const target = new Date(dateString);
  const now = new Date();
  // reset time parts for clean date comparison
  target.setHours(0,0,0,0);
  now.setHours(0,0,0,0);

  const diffTime = target.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { text: `Overdue by ${Math.abs(diffDays)} d`, class: 'urgent' };
  } else if (diffDays === 0) {
    return { text: 'Due Today', class: 'high' };
  } else if (diffDays === 1) {
    return { text: 'Due Tomorrow', class: 'medium' };
  } else {
    return { text: `${diffDays} days left`, class: 'normal' };
  }
}

export function generateId() {
  return 'task-' + Math.random().toString(36).substr(2, 9);
}

export function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function getPriorityBadgeHTML(priority) {
  const p = (priority || 'low').toLowerCase();
  return `<span class="badge badge-priority-${p}">
    <span class="badge-dot"></span>${escapeHtml(priority)}
  </span>`;
}

export function getStatusBadgeHTML(status) {
  const s = (status || 'backlog').toLowerCase().replace(/\s+/g, '');
  return `<span class="badge badge-status-${s}">
    <span class="badge-dot"></span>${escapeHtml(status)}
  </span>`;
}
