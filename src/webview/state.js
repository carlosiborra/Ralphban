let currentTasks = [];
let editingTaskId = null;
let filters = {
  search: "",
  category: "",
  priority: "",
};

export function getCurrentTasks() {
  return currentTasks;
}

export function setCurrentTasks(tasks) {
  currentTasks = tasks;
}

export function getEditingTaskId() {
  return editingTaskId;
}

export function setEditingTaskId(id) {
  editingTaskId = id;
}

export function getFilters() {
  return filters;
}

export function setFilters(newFilters) {
  filters = newFilters;
}

export function updateFilter(key, value) {
  filters[key] = value;
}

export function clearFilters() {
  filters = { search: "", category: "", priority: "" };
}
