const vscode = acquireVsCodeApi();

const board = document.getElementById("board");
const statsContainer = document.getElementById("stats-container");
const taskCardTemplate = document.getElementById("task-card-template");
const searchInput = document.getElementById("search-input");
const filterCategory = document.getElementById("filter-category");
const filterPriority = document.getElementById("filter-priority");
const clearFiltersBtn = document.getElementById("clear-filters-btn");

const modal = document.getElementById("task-modal");
const closeButton = document.querySelector(".close-button");

const taskForm = document.getElementById("task-form");
const formTitle = document.getElementById("form-title");
const taskCategory = document.getElementById("task-category");
const taskPriority = document.getElementById("task-priority");
const taskPasses = document.getElementById("task-passes");
const taskStatus = document.getElementById("task-status");
const taskDescription = document.getElementById("task-description");
const stepsContainer = document.getElementById("steps-container");
const dependenciesContainer = document.getElementById("dependencies-container");
const addStepBtn = document.getElementById("add-step-btn");
const addDependencyBtn = document.getElementById("add-dependency-btn");
const cancelEditBtn = document.getElementById("cancel-edit-btn");
const formDeleteTaskBtn = document.getElementById("form-delete-task-btn");

export {
  vscode,
  board,
  statsContainer,
  taskCardTemplate,
  searchInput,
  filterCategory,
  filterPriority,
  clearFiltersBtn,
  modal,
  closeButton,
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
};
