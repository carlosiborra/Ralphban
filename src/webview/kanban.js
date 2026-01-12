import { setupMessageListener, setupFilterListeners, setupGlobalEventListeners } from "./events.js";
import { handleFormSubmit, setupFormEventListeners } from "./form.js";
import { renderBoard } from "./renderer.js";

setupMessageListener();
setupFilterListeners(renderBoard);
setupGlobalEventListeners();
setupFormEventListeners();
handleFormSubmit();
