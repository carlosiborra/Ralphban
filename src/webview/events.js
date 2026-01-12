import {
  searchInput,
  filterCategory,
  filterPriority,
  clearFiltersBtn,
  closeButton,
  modal,
} from "./dom.js";
import {
  setFilters,
  updateFilter,
  getCurrentTasks,
  setCategories,
  updateTaskByDescription,
} from "./state.js";
import { applyFilters } from "./task-utils.js";
import { hideModal } from "./form.js";
import { renderBoard } from "./renderer.js";

export function setupFilterListeners(_renderBoard) {
  searchInput.addEventListener("input", (e) => {
    updateFilter("search", e.target.value.toLowerCase());
    applyFilters(getCurrentTasks(), renderBoard);
  });

  filterCategory.addEventListener("change", (e) => {
    updateFilter("category", e.target.value);
    applyFilters(getCurrentTasks(), renderBoard);
  });

  filterPriority.addEventListener("change", (e) => {
    updateFilter("priority", e.target.value);
    applyFilters(getCurrentTasks(), renderBoard);
  });

  clearFiltersBtn.addEventListener("click", () => {
    setFilters({ search: "", category: "", priority: "" });
    searchInput.value = "";
    filterCategory.value = "";
    filterPriority.value = "";
    applyFilters(getCurrentTasks(), renderBoard);
  });
}

export function setupGlobalEventListeners() {
  document.addEventListener("click", (e) => {
    const btn = e.target.closest(".add-task-btn");
    if (btn) {
      e.preventDefault();
      e.stopPropagation();
      import("./form.js").then(({ openTaskForm }) => {
        openTaskForm(null, btn.dataset.status);
      });
    }
  });

  closeButton.onclick = () => {
    hideModal();
  };

  window.onclick = (event) => {
    if (event.target === modal) {
      hideModal();
    }
  };
}

export function setupMessageListener() {
  window.addEventListener("message", (event) => {
    const message = event.data;
    switch (message.type) {
      case "taskUpdated":
        if (message.task && message.task.originalDescription) {
          updateTaskByDescription(message.task.originalDescription, message.task);
        }
        renderBoard(getCurrentTasks(), openTaskForm);
        break;
      case "update":
        if (message.categories) {
          setCategories(message.categories);
        }
        if (message.data.task && message.data.originalDescription) {
          updateTaskByDescription(message.data.originalDescription, message.data.task);
          renderBoard(getCurrentTasks(), openTaskForm);
        } else {
          renderBoard(message.data, openTaskForm);
        }
        break;
    }
  });
}

import { openTaskForm } from "./form.js";
