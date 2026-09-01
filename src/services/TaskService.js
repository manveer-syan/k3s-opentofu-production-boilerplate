/**
 * Business Logic Service for Tasks Operations
 */

export function filterAndSortTasks(tasks, filters, isArchiveView = false) {
  let result = tasks.filter(t => isArchiveView ? t.archived : !t.archived);

  // 1. Global Search
  if (filters.search && filters.search.trim() !== '') {
    const q = filters.search.toLowerCase().trim();
    result = result.filter(t =>
      (t.title && t.title.toLowerCase().includes(q)) ||
      (t.description && t.description.toLowerCase().includes(q)) ||
      (t.lead && t.lead.toLowerCase().includes(q)) ||
      (t.category && t.category.toLowerCase().includes(q)) ||
      (t.tags && t.tags.some(tag => tag.toLowerCase().includes(q)))
    );
  }

  // 2. Category Filter
  if (filters.category && filters.category !== 'All') {
    result = result.filter(t => t.category === filters.category);
  }

  // 3. Priority Filter
  if (filters.priority && filters.priority !== 'All') {
    result = result.filter(t => t.priority === filters.priority);
  }

  // 4. Status Filter
  if (filters.status && filters.status !== 'All') {
    result = result.filter(t => t.status === filters.status);
  }

  // 5. Lead Filter
  if (filters.lead && filters.lead !== 'All') {
    result = result.filter(t => t.lead === filters.lead);
  }

  // 6. Sorting
  const priorityWeight = { 'Urgent': 4, 'High': 3, 'Medium': 2, 'Low': 1 };

  result.sort((a, b) => {
    let comparison = 0;
    if (filters.sortBy === 'dueDate') {
      const dateA = a.dueDate ? new Date(a.dueDate).getTime() : 9999999999999;
      const dateB = b.dueDate ? new Date(b.dueDate).getTime() : 9999999999999;
      comparison = dateA - dateB;
    } else if (filters.sortBy === 'priority') {
      comparison = (priorityWeight[b.priority] || 0) - (priorityWeight[a.priority] || 0);
    } else if (filters.sortBy === 'title') {
      comparison = a.title.localeCompare(b.title);
    } else if (filters.sortBy === 'estimatedHours') {
      comparison = (a.estimatedHours || 0) - (b.estimatedHours || 0);
    } else if (filters.sortBy === 'createdAt') {
      comparison = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }

    return filters.sortOrder === 'desc' ? -comparison : comparison;
  });

  return result;
}

export function computeTaskStats(tasks) {
  const activeTasks = tasks.filter(t => !t.archived);
  const now = new Date();
  now.setHours(0,0,0,0);

  const total = activeTasks.length;
  const completed = activeTasks.filter(t => t.status === 'Completed').length;
  const inProgress = activeTasks.filter(t => t.status === 'In Progress').length;
  const urgent = activeTasks.filter(t => t.priority === 'Urgent').length;

  const overdue = activeTasks.filter(t => {
    if (t.status === 'Completed' || !t.dueDate) return false;
    const due = new Date(t.dueDate);
    due.setHours(0,0,0,0);
    return due < now;
  }).length;

  const totalEstimatedHours = activeTasks.reduce((acc, t) => acc + (Number(t.estimatedHours) || 0), 0);
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  // Breakdown by category
  const categories = {};
  activeTasks.forEach(t => {
    const cat = t.category || 'Unassigned';
    categories[cat] = (categories[cat] || 0) + 1;
  });

  // Breakdown by priority
  const priorities = { Low: 0, Medium: 0, High: 0, Urgent: 0 };
  activeTasks.forEach(t => {
    if (priorities[t.priority] !== undefined) {
      priorities[t.priority]++;
    }
  });

  return {
    total,
    completed,
    inProgress,
    urgent,
    overdue,
    totalEstimatedHours,
    completionRate,
    categories,
    priorities
  };
}

export function validateTaskForm(formData) {
  const errors = {};
  if (!formData.title || formData.title.trim() === '') {
    errors.title = 'Title is required';
  } else if (formData.title.length < 3) {
    errors.title = 'Title must be at least 3 characters long';
  }

  if (!formData.category) {
    errors.category = 'Please select a category';
  }

  if (!formData.priority) {
    errors.priority = 'Please select a priority';
  }

  if (!formData.status) {
    errors.status = 'Please select a status';
  }

  if (formData.estimatedHours !== undefined && (isNaN(formData.estimatedHours) || formData.estimatedHours < 0)) {
    errors.estimatedHours = 'Hours must be a positive number';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}
