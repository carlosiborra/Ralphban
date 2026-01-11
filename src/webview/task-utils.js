import { getFilters } from "./state.js";

const STATUS_LABELS = {
  pending: "Pending",
  in_progress: "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

export function isTaskCompleted(task) {
  if (task.passes === true) {
    return true;
  }
  if (task.passes === false) {
    return false;
  }
  return task.status === "completed";
}

export function getTaskEffectiveStatus(task) {
  if (task.passes === true) {
    return "completed";
  }
  if (task.passes === false) {
    return task.status && task.status.trim() ? task.status : "pending";
  }
  if (task.status === "completed") {
    return "completed";
  }
  if (task.status && task.status.trim()) {
    return task.status;
  }
  return "pending";
}

export function getUniqueStatuses(tasks) {
  const statuses = new Set();
  statuses.add("pending");
  statuses.add("completed");

  tasks.forEach((task) => {
    const effectiveStatus = getTaskEffectiveStatus(task);
    if (effectiveStatus !== "pending" && effectiveStatus !== "completed") {
      statuses.add(effectiveStatus);
    }
  });

  return Array.from(statuses);
}

export function getFilteredTasks(tasks) {
  const currentFilters = getFilters();
  return tasks.filter((task) => {
    const matchesSearch =
      !currentFilters.search ||
      task.description.toLowerCase().includes(currentFilters.search) ||
      task.steps?.some((step) => step.toLowerCase().includes(currentFilters.search));

    const matchesCategory = !currentFilters.category || task.category === currentFilters.category;

    const matchesPriority =
      !currentFilters.priority ||
      currentFilters.priority === "none" ||
      (task.priority || "none") === currentFilters.priority;

    return matchesSearch && matchesCategory && matchesPriority;
  });
}

export function applyFilters(tasks, renderBoard) {
  renderBoard(tasks);
}

export function getStatusLabels() {
  return STATUS_LABELS;
}
