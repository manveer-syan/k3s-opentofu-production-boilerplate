/**
 * Go Powered Frontend Application logic
 */

let operations = [];
let stats = {};
let currentView = 'grid';
let editingId = null;

document.addEventListener('DOMContentLoaded', () => {
  fetchStats();
  fetchOperations();
  bindEvents();
});

function bindEvents() {
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
      document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
      item.classList.add('active');
      currentView = item.getAttribute('data-view');
      render();
    });
  });

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

  document.getElementById('modal-close').addEventListener('click', closeModal);
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
  const status = document.getElementById('filter-status').value;
  const search = document.getElementById('search-input').value;

  const isArchive = currentView === 'archive';
  const url = `/api/v1/operations?archived=${isArchive}&category=${encodeURIComponent(cat)}&priority=${encodeURIComponent(prio)}&status=${encodeURIComponent(status)}&search=${encodeURIComponent(search)}`;

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
      <div class="stat-lbl">Active Operations</div>
    </div>
    <div class="stat-card">
      <div class="stat-val" style="color: #10b981;">${stats.completed || 0} (${stats.completionRate || 0}%)</div>
      <div class="stat-lbl">Completed</div>
    </div>
    <div class="stat-card">
      <div class="stat-val" style="color: #f59e0b;">${stats.inProgress || 0}</div>
      <div class="stat-lbl">In Progress</div>
    </div>
    <div class="stat-card">
      <div class="stat-val" style="color: #ef4444;">${stats.overdue || 0}</div>
      <div class="stat-lbl">Overdue</div>
    </div>
  `;
}

function render() {
  const container = document.getElementById('view-container');
  if (!operations || operations.length === 0) {
    container.innerHTML = '<div style="text-align:center; padding: 3rem; color: var(--text-secondary);">No operations found.</div>';
    return;
  }

  if (currentView === 'table' || currentView === 'archive') {
    renderTable(container);
  } else if (currentView === 'analytics') {
    renderAnalytics(container);
  } else {
    renderGrid(container);
  }
}

function renderGrid(container) {
  const cards = operations.map(op => `
    <div class="card">
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <span style="font-size:0.75rem; color:var(--text-secondary);">${op.category}</span>
        <span class="badge badge-${op.priority.toLowerCase()}">${op.priority}</span>
      </div>
      <h4 style="font-size:1.05rem;">${escapeHtml(op.title)}</h4>
      <p style="font-size:0.85rem; color:var(--text-secondary);">${escapeHtml(op.description || 'No description')}</p>
      <div style="display:flex; justify-content:space-between; font-size:0.8rem; border-top:1px solid var(--border); padding-top:0.5rem; margin-top:0.5rem;">
        <span>👤 ${escapeHtml(op.lead || 'Unassigned')}</span>
        <span>⏱️ ${op.estimatedHours}h</span>
      </div>
      <div style="display:flex; gap:0.5rem; justify-content:flex-end;">
        <button class="btn btn-secondary" onclick="editOp('${op.id}')" style="padding:0.3rem 0.6rem; font-size:0.8rem;">Edit</button>
        <button class="btn btn-danger" onclick="archiveOp('${op.id}', ${!op.archived})" style="padding:0.3rem 0.6rem; font-size:0.8rem;">
          ${op.archived ? 'Restore' : 'Archive'}
        </button>
      </div>
    </div>
  `).join('');
  container.innerHTML = `<div class="grid-view">${cards}</div>`;
}

function renderTable(container) {
  const rows = operations.map(op => `
    <tr>
      <td><strong>${escapeHtml(op.title)}</strong></td>
      <td>${op.category}</td>
      <td><span class="badge badge-${op.priority.toLowerCase()}">${op.priority}</span></td>
      <td>${op.status}</td>
      <td>${escapeHtml(op.lead || 'Unassigned')}</td>
      <td>${op.dueDate}</td>
      <td>
        <button class="btn btn-secondary" onclick="editOp('${op.id}')" style="padding:0.25rem 0.5rem; font-size:0.75rem;">Edit</button>
        <button class="btn btn-danger" onclick="deleteOp('${op.id}')" style="padding:0.25rem 0.5rem; font-size:0.75rem;">Delete</button>
      </td>
    </tr>
  `).join('');

  container.innerHTML = `
    <table class="table">
      <thead>
        <tr><th>Title</th><th>Category</th><th>Priority</th><th>Status</th><th>Lead</th><th>Due Date</th><th>Actions</th></tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

function renderAnalytics(container) {
  const categories = stats.categoryBreakdown || {};
  const items = Object.entries(categories).map(([cat, val]) => `
    <div style="margin-bottom: 1rem;">
      <div style="display:flex; justify-content:space-between; font-size:0.9rem;"><span>${cat}</span><span>${val} tasks</span></div>
      <div style="height:8px; background:var(--bg-primary); border-radius:4px; margin-top:4px; overflow:hidden;">
        <div style="height:100%; width:${(val/(stats.total||1))*100}%; background:var(--accent);"></div>
      </div>
    </div>
  `).join('');
  container.innerHTML = `<div class="stat-card" style="max-width:500px;"><h3>Category Distribution</h3><div style="margin-top:1rem;">${items}</div></div>`;
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
  document.getElementById('op-hours').value = op.estimatedHours;
  document.getElementById('modal').classList.add('active');
};

window.archiveOp = async function(id, archived) {
  await fetch(`/api/v1/operations/${id}/archive`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ archived })
  });
  fetchStats();
  fetchOperations();
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
