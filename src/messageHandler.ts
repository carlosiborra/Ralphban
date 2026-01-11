import * as vscode from "vscode";
import { writeTaskFile } from "./fileWriter";
import { parseTaskFile } from "./jsonParser";
import type { Task } from "./types";

export interface WebviewMessage {
  type: string;
  data?: any;
  taskId?: string;
  newStatus?: string;
  task?: Task;
}

export async function handleWebviewMessage(
  message: WebviewMessage,
  taskFileUri: vscode.Uri,
  webviewHost: vscode.WebviewView | vscode.WebviewPanel | undefined
): Promise<void> {
  try {
    switch (message.type) {
      case "updateTaskStatus":
        if (message.taskId && message.newStatus) {
          await updateTaskStatus(taskFileUri, message.taskId, message.newStatus as any);
        }
        break;

      case "createTask":
        if (message.task) {
          await createTask(taskFileUri, message.task);
          if (webviewHost) {
            await refreshWebview(taskFileUri, webviewHost);
          }
        }
        break;

      case "updateTask":
        if (message.task) {
          await updateTask(taskFileUri, message.task);
          if (webviewHost) {
            await refreshWebview(taskFileUri, webviewHost);
          }
        }
        break;

      case "deleteTask":
        if (message.taskId) {
          await deleteTask(taskFileUri, message.taskId);
          if (webviewHost) {
            await refreshWebview(taskFileUri, webviewHost);
          }
        }
        break;

      case "refreshTasks":
        if (webviewHost) {
          await refreshWebview(taskFileUri, webviewHost);
        }
        break;

      case "onInfo":
        vscode.window.showInformationMessage(message.data);
        break;

      case "onError":
        vscode.window.showErrorMessage(message.data);
        break;

      default:
        console.warn(`Unknown message type: ${message.type}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    vscode.window.showErrorMessage(`Error handling webview message: ${errorMessage}`);
  }
}

async function updateTaskStatus(
  uri: vscode.Uri,
  taskId: string,
  newStatus: "pending" | "in_progress" | "completed" | "cancelled"
): Promise<void> {
  const taskFile = await parseTaskFile(uri);
  const taskIndex = taskFile.tasks.findIndex((t) => (t.id || t.description) === taskId);

  if (taskIndex !== -1 && taskFile.tasks[taskIndex]) {
    taskFile.tasks[taskIndex].status = newStatus;
    await writeTaskFile(uri, taskFile.tasks);
  } else {
    throw new Error(`Task with ID ${taskId} not found`);
  }
}

async function createTask(uri: vscode.Uri, task: Task): Promise<void> {
  const taskFile = await parseTaskFile(uri);

  if (!task.id) {
    task.id = generateTaskId(task.description);
  }

  if (!task.status) {
    task.status = "pending";
  }

  taskFile.tasks.push(task);
  await writeTaskFile(uri, taskFile.tasks);
}

async function updateTask(uri: vscode.Uri, updatedTask: Task): Promise<void> {
  const taskFile = await parseTaskFile(uri);
  const taskId = updatedTask.id || updatedTask.description;

  if (!taskId) {
    throw new Error("Task must have either an id or description");
  }

  const taskIndex = taskFile.tasks.findIndex((t) => (t.id || t.description) === taskId);

  if (taskIndex === -1) {
    throw new Error(`Task with ID or description "${taskId}" not found`);
  }

  taskFile.tasks[taskIndex] = updatedTask;
  await writeTaskFile(uri, taskFile.tasks);
}

async function deleteTask(uri: vscode.Uri, taskId: string): Promise<void> {
  const taskFile = await parseTaskFile(uri);

  const taskIndex = taskFile.tasks.findIndex((t) => (t.id || t.description) === taskId);

  if (taskIndex === -1) {
    throw new Error(`Task with ID or description "${taskId}" not found`);
  }

  taskFile.tasks.splice(taskIndex, 1);
  await writeTaskFile(uri, taskFile.tasks);
}

async function refreshWebview(
  taskFileUri: vscode.Uri,
  webviewHost: vscode.WebviewView | vscode.WebviewPanel
): Promise<void> {
  const taskFile = await parseTaskFile(taskFileUri);
  webviewHost.webview.postMessage({
    type: "update",
    data: taskFile,
  });
}

function generateTaskId(description: string): string {
  const timestamp = Date.now();
  const sanitized = description
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `${sanitized}-${timestamp}`;
}
