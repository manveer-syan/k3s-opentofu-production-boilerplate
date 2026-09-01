/**
 * Minimalist Go Frontend Logic with Professional Typography
 */

let operations = [];
let stats = {};
let currentView = 'table';
let editingId = null;

document.addEventListener('DOMContentLoaded', () => {
  fetchStats();
  fetchOperations();
  bindEvents();
});

function bindEvents() {
  document.getElementById('btn-theme-toggle').addEventListener('click', () => {
    const doc = document.documentElement;
    const next = doc.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    doc.setAttribute('data-theme', next);
  });

  document.getElementById('btn-new-op').addEventListener('click', () => {
    editingId = null;
    document.getElementById('modal-title').innerText = 'New Operation';
    document.getElementById('op-form').reset();
    document.getElementById('modal').classList.add('active');
  });

  document.getElementById('modal-close')?.addEventListener('click', closeModal);
  document.getElementById('btn-cancel').addEventListener('click', closeModal);

  document.getElementById('op-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
      title: document.getElementById('op-title').value,
      description: document.getElementById('op-desc').value,
      category: document.getElementById('op-category').value,
      priority: document.getElementById('op-priority').value,
      status: document.getElementById('op-status').value,
      lead: document.getElementById('op-lead').value,
      dueDate: document.getElementById('op-date').value,
      estimatedHours: parseInt(document.getElementById('op-hours').value) || 0
    };

    if (editingId) {
      await fetch(`/api/v1/operations/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
    } else {
      await fetch('/api/v1/operations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
    }

    closeModal();
    fetchStats();
    fetchOperations();
  });

  ['filter-category', 'filter-priority', 'filter-status', 'search-input'].forEach(id => {
    document.getElementById(id).addEventListener('change', fetchOperations);
    if (id === 'search-input') {
      document.getElementById(id).addEventListener('input', fetchOperations);
    }
  });
}

function closeModal() {
  document.getElementById('modal').classList.remove('active');
}

async function fetchStats() {
  try {
    const res = await fetch('/api/v1/stats');
    stats = await res.json();
    renderStats();
  } catch (err) {
    console.error('Failed to fetch stats', err);
  }
}

async function fetchOperations() {
  const cat = document.getElementById('filter-category').value;
  const prio = document.getElementById('filter-priority').value;
  const search = document.getElementById('search-input').value;

  const url = `/api/v1/operations?category=${encodeURIComponent(cat)}&priority=${encodeURIComponent(prio)}&search=${encodeURIComponent(search)}`;

  try {
    const res = await fetch(url);
    operations = await res.json();
    render();
  } catch (err) {
    console.error('Failed to fetch operations', err);
  }
}

function renderStats() {
  const container = document.getElementById('stats-row');
  container.innerHTML = `
    <div class="stat-card">
      <div class="stat-val">${stats.total || 0}</div>
      <div class="stat-lbl">Active Ops</div>
    </div>
    <div class="stat-card">
      <div class="stat-val">${stats.completed || 0} (${stats.completionRate || 0}%)</div>
      <div class="stat-lbl">Completed</div>
    </div>
    <div class="stat-card">
      <div class="stat-val">${stats.inProgress || 0}</div>
      <div class="stat-lbl">In Progress</div>
    </div>
    <div class="stat-card">
      <div class="stat-val">${stats.overdue || 0}</div>
      <div class="stat-lbl">Overdue</div>
    </div>
  `;
}

function render() {
  const container = document.getElementById('view-container');
  if (!operations || operations.length === 0) {
    container.innerHTML = '<div style="text-align:center; padding: 4rem 0; color: var(--muted); font-family: var(--font-mono); font-size: 11px;">NO OPERATIONS FOUND</div>';
    return;
  }

  renderTable(container);
}

function renderTable(container) {
  const rows = operations.map(op => `
    <tr>
      <td class="mono" style="font-weight: 600;">${op.id}</td>
      <td><strong>${escapeHtml(op.title)}</strong></td>
      <td class="mono">${op.category}</td>
      <td class="mono"><span class="badge">${op.priority}</span></td>
      <td class="mono">${op.status}</td>
      <td class="mono">${escapeHtml(op.lead || '-')}</td>
      <td class="mono">${op.dueDate || '-'}</td>
      <td class="mono" style="text-align: right;">
        <button class="btn-secondary" onclick="editOp('${op.id}')" style="padding:4px 8px; font-size:10px;">Edit</button>
        <button class="btn-danger" onclick="deleteOp('${op.id}')" style="padding:4px 8px; font-size:10px; margin-left: 4px;">Del</button>
      </td>
    </tr>
  `).join('');

  container.innerHTML = `
    <table>
      <thead>
        <tr><th>ID</th><th>Title</th><th>Category</th><th>Priority</th><th>Status</th><th>Lead</th><th>Due Date</th><th style="text-align: right;">Actions</th></tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

window.editOp = async function(id) {
  const res = await fetch(`/api/v1/operations/${id}`);
  const op = await res.json();
  editingId = id;
  document.getElementById('modal-title').innerText = 'Edit Operation';
  document.getElementById('op-title').value = op.title;
  document.getElementById('op-desc').value = op.description;
  document.getElementById('op-category').value = op.category;
  document.getElementById('op-priority').value = op.priority;
  document.getElementById('op-status').value = op.status;
  document.getElementById('op-lead').value = op.lead;
  document.getElementById('op-date').value = op.dueDate;
  document.getElementById('modal').classList.add('active');
};

window.deleteOp = async function(id) {
  if (confirm('Delete operation permanently?')) {
    await fetch(`/api/v1/operations/${id}`, { method: 'DELETE' });
    fetchStats();
    fetchOperations();
  }
};

function escapeHtml(str) {
  return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
