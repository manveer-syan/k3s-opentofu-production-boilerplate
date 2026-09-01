import { store } from '../store/StateStore.js';
import { computeTaskStats } from '../services/TaskService.js';
import { escapeHtml } from '../utils/formatters.js';

export function renderAnalyticsView(container) {
  const { tasks } = store.getState();
  const stats = computeTaskStats(tasks);

  const categoryEntries = Object.entries(stats.categories);
  const priorityEntries = Object.entries(stats.priorities);

  container.innerHTML = `
    <div class="analytics-grid animate-fade-in">
      <!-- Category Distribution -->
      <div class="glass-card analytics-card">
        <h3>Category Breakdown</h3>
        <p style="font-size: 0.85rem; color: var(--text-secondary);">Distribution of active operations by department.</p>

        <div class="chart-bar-group" style="margin-top: 1rem;">
          ${categoryEntries.map(([cat, count]) => {
            const percent = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
            return `
              <div class="chart-bar-item">
                <div class="chart-bar-label">
                  <span>${escapeHtml(cat)}</span>
                  <span>${count} tasks (${percent}%)</span>
                </div>
                <div class="progress-bar-bg">
                  <div class="progress-bar-fill" style="width: ${percent}%;"></div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <!-- Priority Distribution -->
      <div class="glass-card analytics-card">
        <h3>Priority Heatmap</h3>
        <p style="font-size: 0.85rem; color: var(--text-secondary);">Volume of tasks categorized by urgency level.</p>

        <div class="chart-bar-group" style="margin-top: 1rem;">
          ${priorityEntries.map(([prio, count]) => {
            const percent = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
            const colorMap = {
              Urgent: '#ef4444',
              High: '#f97316',
              Medium: '#3b82f6',
              Low: '#10b981'
            };
            return `
              <div class="chart-bar-item">
                <div class="chart-bar-label">
                  <span>${prio} Priority</span>
                  <span>${count} tasks (${percent}%)</span>
                </div>
                <div class="progress-bar-bg">
                  <div class="progress-bar-fill" style="width: ${percent}%; background: ${colorMap[prio] || 'var(--accent-primary)'};"></div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <!-- Workflow Velocity -->
      <div class="glass-card analytics-card">
        <h3>Completion Velocity</h3>
        <p style="font-size: 0.85rem; color: var(--text-secondary);">Overall progress towards completing current workload.</p>

        <div class="flex flex-col items-center justify-center" style="padding: 2rem 0;">
          <div style="font-size: 3rem; font-weight: 800; background: var(--accent-gradient); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">
            ${stats.completionRate}%
          </div>
          <p style="font-size: 0.9rem; color: var(--text-muted); margin-top: 0.5rem;">
            ${stats.completed} of ${stats.total} Active Operations Finished
          </p>
        </div>
      </div>
    </div>
  `;
}
