import {
  taskForm,
  formTitle,
  taskCategory,
  taskPriority,
  taskPasses,
  taskStatus,
  taskDescription,
  stepsContainer,
  dependenciesContainer,
  addStepBtn,
  addDependencyBtn,
  cancelEditBtn,
  formDeleteTaskBtn,
  vscode,
  modal,
} from "./dom.js";
import { setEditingTaskId, getEditingTaskId, getCategories } from "./state.js";

function populateCategoryDropdown() {
  const categories = getCategories();
  taskCategory.innerHTML = categories
    .map((cat) => `<option value="${cat}">${cat}</option>`)
    .join("");
}

export function showModal() {
  modal.style.display = "flex";
  setTimeout(() => modal.classList.add("show"), 10);
}

export function hideModal() {
  modal.classList.remove("show");
  setTimeout(() => {
    modal.style.display = "none";
  }, 300);
}

export function openTaskForm(task = null, statusDefault = null) {
  populateCategoryDropdown();
  const editingTaskDescription = task ? task.description : null;
  setEditingTaskId(editingTaskDescription);

  taskForm.style.display = "flex";

  if (task) {
    formTitle.textContent = "Edit Task";
    formDeleteTaskBtn.style.display = "flex";
    taskCategory.value = task.category;
    taskPriority.value = task.priority || "none";
    taskPasses.checked = task.passes === true || task.status === "completed";
    taskStatus.value = task.status || "";
    taskDescription.value = task.description;
    stepsContainer.innerHTML = "";
    (task.steps || []).forEach((step) => {
      addStepInput(step);
    });
    dependenciesContainer.innerHTML = "";
    (task.dependencies || []).forEach((dep) => {
      addDependencyInput(dep);
    });
  } else {
    formTitle.textContent = "New Task";
    formDeleteTaskBtn.style.display = "none";
    taskCategory.value = getCategories()[0] || "frontend";
    taskPriority.value = "none";
    taskPasses.checked = statusDefault === "completed";
    taskStatus.value = statusDefault || "";
    taskDescription.value = "";
    stepsContainer.innerHTML = "";
    dependenciesContainer.innerHTML = "";
  }

  showModal();
}

export function addStepInput(value = "") {
  const stepDiv = document.createElement("div");
  stepDiv.className = "step-input";

  const input = document.createElement("input");
  input.type = "text";
  input.value = value;
  input.placeholder = "Enter step...";
  input.required = true;

  const removeBtn = document.createElement("button");
  removeBtn.type = "button";
  removeBtn.className = "remove-step-btn";
  removeBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path fill-rule="evenodd" clip-rule="evenodd" d="M10 3h3v1h-1v9l-1 1H5l-1-1V4H3V3h3V2a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v1zM9 2H7v1h2V2zM5 4v9h6V4H5zm1 1h1v7H6V5zm2 0h1v7H8V5z"/></svg>`;
  removeBtn.title = "Remove Step";
  removeBtn.onclick = () => stepDiv.remove();

  stepDiv.appendChild(input);
  stepDiv.appendChild(removeBtn);
  stepsContainer.appendChild(stepDiv);
}

export function addDependencyInput(value = "") {
  const depDiv = document.createElement("div");
  depDiv.className = "step-input";

  const input = document.createElement("input");
  input.type = "text";
  input.value = value;
  input.placeholder = "Enter dependency ID or description...";
  input.required = true;

  const removeBtn = document.createElement("button");
  removeBtn.type = "button";
  removeBtn.className = "remove-step-btn";
  removeBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path fill-rule="evenodd" clip-rule="evenodd" d="M10 3h3v1h-1v9l-1 1H5l-1-1V4H3V3h3V2a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v1zM9 2H7v1h2V2zM5 4v9h6V4H5zm1 1h1v7H6V5zm2 0h1v7H8V5z"/></svg>`;
  removeBtn.title = "Remove Dependency";
  removeBtn.onclick = () => depDiv.remove();

  depDiv.appendChild(input);
  depDiv.appendChild(removeBtn);
  dependenciesContainer.appendChild(depDiv);
}

export function getStepsFromForm() {
  const stepInputs = stepsContainer.querySelectorAll(".step-input input");
  const steps = [];
  stepInputs.forEach((input) => {
    if (input.value.trim()) {
      steps.push(input.value.trim());
    }
  });
  return steps;
}

export function getDependenciesFromForm() {
  const depInputs = dependenciesContainer.querySelectorAll(".step-input input");
  const deps = [];
  depInputs.forEach((input) => {
    if (input.value.trim()) {
      deps.push(input.value.trim());
    }
  });
  return deps;
}

export function validateForm() {
  if (!taskDescription.value.trim()) {
    vscode.postMessage({ type: "onError", data: "Description is required" });
    return false;
  }
  if (!taskCategory.value) {
    vscode.postMessage({ type: "onError", data: "Category is required" });
    return false;
  }
  return true;
}

export function handleFormSubmit() {
  taskForm.onsubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const newStatus = taskStatus.value || (taskPasses.checked ? "completed" : "pending");
    const task = {
      description: taskDescription.value.trim(),
      category: taskCategory.value,
      priority: taskPriority.value,
      status: newStatus,
      steps: getStepsFromForm(),
      dependencies: getDependenciesFromForm(),
      passes: newStatus === "completed" ? true : undefined,
    };

    const editingTaskDescription = getEditingTaskId();
    if (editingTaskDescription) {
      task.description = editingTaskDescription;
      vscode.postMessage({ type: "updateTask", task });
    } else {
      vscode.postMessage({ type: "createTask", task });
    }

    hideModal();
  };
}

export function setupFormEventListeners() {
  cancelEditBtn.onclick = () => {
    hideModal();
  };

  taskStatus.addEventListener("change", () => {
    taskPasses.checked = taskStatus.value === "completed";
  });

  addStepBtn.onclick = () => {
    addStepInput();
  };

  addDependencyBtn.onclick = () => {
    addDependencyInput();
  };

  if (formDeleteTaskBtn) {
    formDeleteTaskBtn.addEventListener("click", () => {
      const editingTaskDescription = getEditingTaskId();
      if (editingTaskDescription && confirm("Are you sure you want to delete this task?")) {
        vscode.postMessage({ type: "deleteTask", taskId: editingTaskDescription });
        hideModal();
      }
    });
  }
}
