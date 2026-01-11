import {
  board,
  statsContainer,
  taskCardTemplate,
  searchInput,
  filterCategory,
  filterPriority,
  clearFiltersBtn,
  vscode,
} from "./dom.js";
import { getCurrentTasks, getFilters, clearFilters, setCurrentTasks } from "./state.js";
import {
  getFilteredTasks,
  getUniqueStatuses,
  getTaskEffectiveStatus,
  isTaskCompleted,
} from "./task-utils.js";

export function renderStats(tasks) {
  const currentTasks = getCurrentTasks();
  const total = currentTasks.length;
  const filtered = tasks.length;
  const completed = tasks.filter((t) => isTaskCompleted(t)).length;
  const percent = filtered > 0 ? Math.round((completed / filtered) * 100) : 0;

  const filters = getFilters();
  const hasActiveFilters = filters.search || filters.category || filters.priority;

  statsContainer.innerHTML = `
      <span>${hasActiveFilters ? `Showing ${filtered} of ${total} tasks` : `Total Tasks: ${total}`}</span>
      <span>Completed: ${completed} (${percent}%)</span>
  `;
}

export function createTaskCard(task, openTaskForm) {
  const clone = taskCardTemplate.content.cloneNode(true);
  const card = clone.querySelector(".task-card");

  card.querySelector(".task-category").textContent = task.category;

  const priorityEl = card.querySelector(".task-priority");
  const priority = task.priority && task.priority !== "none" ? task.priority : null;
  if (priority) {
    priorityEl.textContent = priority;
    priorityEl.classList.add(priority.toLowerCase());
    priorityEl.style.display = "";
  } else {
    priorityEl.style.display = "none";
  }

  const descEl = card.querySelector(".task-description");
  descEl.textContent = task.description;

  const stepsCount = task.steps?.length || 0;
  card.querySelector(".task-steps-count").textContent = `Steps: ${stepsCount}`;

  const depsCount = task.dependencies?.length || 0;
  card.querySelector(".task-dependencies-count").textContent = `Deps: ${depsCount}`;

  card.addEventListener("click", () => openTaskForm(task));

  card.addEventListener("dragstart", (e) => {
    card.classList.add("dragging");
    e.dataTransfer.setData("text/plain", task.description);
    e.dataTransfer.effectAllowed = "move";
  });

  card.addEventListener("dragend", () => {
    card.classList.remove("dragging");
  });

  return card;
}

export function rebuildColumns(statuses, vscode, renderBoard, getCurrentTasks) {
  board.innerHTML = "";

  const statusOrder = ["pending", "completed"];
  statuses.sort((a, b) => {
    const aIndex = statusOrder.indexOf(a);
    const bIndex = statusOrder.indexOf(b);

    if (aIndex !== -1 && bIndex !== -1) {
      return aIndex - bIndex;
    }
    if (aIndex !== -1) {
      return a === "completed" ? 1 : -1;
    }
    if (bIndex !== -1) {
      return b === "completed" ? -1 : 1;
    }
    return a.localeCompare(b);
  });

  const STATUS_LABELS = {
    pending: "Pending",
    in_progress: "In Progress",
    completed: "Completed",
    cancelled: "Cancelled",
  };

  statuses.forEach((status) => {
    const columnEl = document.createElement("div");
    columnEl.className = "column";
    columnEl.id = `column-${status}`;
    columnEl.dataset.status = status;

    const label = STATUS_LABELS[status] || status;

    columnEl.innerHTML = `
      <h2>${label}</h2>
      <div class="task-list"></div>
      <button class="add-task-btn" type="button" data-status="${status}">+ Add Task</button>
    `;

    columnEl.addEventListener("dragover", (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      columnEl.classList.add("drag-over");
    });

    columnEl.addEventListener("dragleave", () => {
      columnEl.classList.remove("drag-over");
    });

    columnEl.addEventListener("drop", (e) => {
      e.preventDefault();
      columnEl.classList.remove("drag-over");

      const taskDescription = e.dataTransfer.getData("text/plain");
      const newStatus = status;

      const currentTasks = getCurrentTasks();
      const task = currentTasks.find((t) => t.description === taskDescription);
      if (task && getTaskEffectiveStatus(task) !== newStatus) {
        task.status = newStatus;
        task.passes = newStatus === "completed" ? true : undefined;
        renderBoard(currentTasks);

        vscode.postMessage({
          type: "updateTaskStatus",
          taskId: taskDescription,
          newStatus: task.status,
          passes: task.passes,
        });
      }
    });

    board.appendChild(columnEl);
  });
}

export function renderBoard(data, openTaskForm) {
  if (Array.isArray(data)) {
    setCurrentTasks(data);
  } else if (data && Array.isArray(data.tasks)) {
    setCurrentTasks(data.tasks);
  } else {
    setCurrentTasks([]);
  }

  const currentTasks = getCurrentTasks();
  const filteredTasks = getFilteredTasks(currentTasks);
  const filters = getFilters();

  const hasActiveFilters = filters.search || filters.category || filters.priority;
  clearFiltersBtn.disabled = !hasActiveFilters;
  clearFiltersBtn.style.opacity = hasActiveFilters ? "1" : "0.5";
  clearFiltersBtn.style.display = "inline-block";

  if (hasActiveFilters && filteredTasks.length === 0) {
    board.classList.add("no-results");
    board.innerHTML = "";
    const container = document.createElement("div");
    container.className = "no-results-container";
    container.innerHTML = `
      <div class="no-results-error">No tasks found</div>
      <button id="reset-link" class="clear-filters-big-btn">Clear Filters</button>
    `;
    board.appendChild(container);
    document.getElementById("reset-link").onclick = () => {
      clearFilters();
      searchInput.value = "";
      filterCategory.value = "";
      filterPriority.value = "";
      renderBoard(currentTasks, openTaskForm);
    };
    renderStats(filteredTasks);
    return;
  } else {
    board.classList.remove("no-results");
    const msg = document.getElementById("no-results-msg");
    if (msg) msg.remove();
  }

  const uniqueStatuses = getUniqueStatuses(currentTasks);

  const existingColumns = Array.from(board.querySelectorAll(".column")).map((col) =>
    col.id.replace("column-", "")
  );
  const columnsNeedRebuild =
    uniqueStatuses.length !== existingColumns.length ||
    !uniqueStatuses.every((s) => existingColumns.includes(s));

  if (columnsNeedRebuild) {
    rebuildColumns(uniqueStatuses, vscode, renderBoard, getCurrentTasks);
  }

  uniqueStatuses.forEach((status) => {
    const columnEl = document.querySelector(`#column-${status} .task-list`);
    if (!columnEl) return;

    columnEl.innerHTML = "";

    const tasks = filteredTasks.filter((t) => {
      const taskStatus = getTaskEffectiveStatus(t);
      return taskStatus === status;
    });

    tasks.forEach((task) => {
      const card = createTaskCard(task, openTaskForm);
      if (card) columnEl.appendChild(card);
    });
  });

  renderStats(filteredTasks);
}
