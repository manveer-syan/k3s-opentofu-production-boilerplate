import { store } from '../store/StateStore.js';
import { computeTaskStats } from '../services/TaskService.js';

export function renderStatsOverview(container) {
  const { tasks } = store.getState();
  const stats = computeTaskStats(tasks);

  container.innerHTML = `
    <div class="stats-grid animate-fade-in">
      <!-- Total Tasks Card -->
      <div class="glass-card stat-card" style="--stat-accent: #38bdf8;">
        <div class="stat-icon-wrapper">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 11l3 3L22 4"></path>
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
          </svg>
        </div>
        <div class="stat-info">
          <div class="stat-value">${stats.total}</div>
          <div class="stat-label">Active Operations</div>
        </div>
      </div>

      <!-- Completion Rate Card -->
      <div class="glass-card stat-card" style="--stat-accent: #10b981;">
        <div class="stat-icon-wrapper" style="background: rgba(16, 185, 129, 0.1); color: #10b981;">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </div>
        <div class="stat-info">
          <div class="stat-value">${stats.completed} <span style="font-size: 1rem; color: var(--text-muted);">(${stats.completionRate}%)</span></div>
          <div class="stat-label">Completed</div>
        </div>
      </div>

      <!-- In Progress Card -->
      <div class="glass-card stat-card" style="--stat-accent: #f59e0b;">
        <div class="stat-icon-wrapper" style="background: rgba(245, 158, 11, 0.1); color: #f59e0b;">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
        </div>
        <div class="stat-info">
          <div class="stat-value">${stats.inProgress}</div>
          <div class="stat-label">In Progress</div>
        </div>
      </div>

      <!-- Overdue Warning Card -->
      <div class="glass-card stat-card" style="--stat-accent: #ef4444;">
        <div class="stat-icon-wrapper" style="background: rgba(239, 68, 68, 0.1); color: #ef4444;">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
            <line x1="12" y1="9" x2="12" y2="13"></line>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
          </svg>
        </div>
        <div class="stat-info">
          <div class="stat-value" style="color: ${stats.overdue > 0 ? '#ef4444' : 'inherit'};">${stats.overdue}</div>
          <div class="stat-label">Overdue Items</div>
        </div>
      </div>

      <!-- Total Work Hours -->
      <div class="glass-card stat-card" style="--stat-accent: #818cf8;">
        <div class="stat-icon-wrapper" style="background: rgba(129, 140, 248, 0.1); color: #818cf8;">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
          </svg>
        </div>
        <div class="stat-info">
          <div class="stat-value">${stats.totalEstimatedHours} <span style="font-size: 0.9rem; color: var(--text-muted);">hrs</span></div>
          <div class="stat-label">Total Allocated</div>
        </div>
      </div>
    </div>
  `;
}
