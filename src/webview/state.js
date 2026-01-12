let currentTasks = [];
let categories = [
  "frontend",
  "backend",
  "database",
  "testing",
  "documentation",
  "infrastructure",
  "security",
  "functional",
];
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

export function getCategories() {
  return categories;
}

export function setCategories(newCategories) {
  categories = newCategories;
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

export function updateTaskByDescription(originalDescription, updatedTask) {
  const index = currentTasks.findIndex((t) => t.description === originalDescription);
  if (index !== -1) {
    currentTasks[index] = updatedTask;
  }
}
