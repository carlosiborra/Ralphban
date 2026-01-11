import * as vscode from "vscode";
import { writeTaskFile } from "./fileWriter";
import { parseTaskFile } from "./jsonParser";
import type { Task, TaskStatus } from "./types";

interface BaseMessage {
  type: string;
}

interface UpdateTaskStatus extends BaseMessage {
  type: "updateTaskStatus";
  taskId: string;
  newStatus: TaskStatus;
  passes?: boolean;
}

interface CreateTask extends BaseMessage {
  type: "createTask";
  task: Task;
}

interface UpdateTask extends BaseMessage {
  type: "updateTask";
  task: Task;
}

interface DeleteTask extends BaseMessage {
  type: "deleteTask";
  taskId: string;
}

interface RefreshTasks extends BaseMessage {
  type: "refreshTasks";
}

interface InfoMessage extends BaseMessage {
  type: "onInfo";
  data: string;
}

interface ErrorMessage extends BaseMessage {
  type: "onError";
  data: string;
}

export type WebviewMessage =
  | UpdateTaskStatus
  | CreateTask
  | UpdateTask
  | DeleteTask
  | RefreshTasks
  | InfoMessage
  | ErrorMessage;

export async function handleWebviewMessage(
  message: WebviewMessage,
  taskFileUri: vscode.Uri,
  webviewHost: vscode.WebviewView | vscode.WebviewPanel | undefined
): Promise<void> {
  try {
    switch (message.type) {
      case "updateTaskStatus":
        await updateTaskStatus(taskFileUri, message.taskId, message.newStatus, message.passes);
        if (webviewHost) {
          await refreshWebview(taskFileUri, webviewHost);
        }
        break;

      case "createTask":
        await createTask(taskFileUri, message.task);
        if (webviewHost) {
          await refreshWebview(taskFileUri, webviewHost);
        }
        break;

      case "updateTask":
        await updateTask(taskFileUri, message.task);
        if (webviewHost) {
          await refreshWebview(taskFileUri, webviewHost);
        }
        break;

      case "deleteTask":
        await deleteTask(taskFileUri, message.taskId);
        if (webviewHost) {
          await refreshWebview(taskFileUri, webviewHost);
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
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    vscode.window.showErrorMessage(`Error handling webview message: ${errorMessage}`);
  }
}

async function updateTaskStatus(
  uri: vscode.Uri,
  taskDescription: string,
  newStatus: TaskStatus,
  passes?: boolean
): Promise<void> {
  const tasks = await parseTaskFile(uri);
  const taskIndex = tasks.findIndex((t) => t.description === taskDescription);

  if (taskIndex !== -1 && tasks[taskIndex]) {
    tasks[taskIndex].status = newStatus;
    tasks[taskIndex].passes = passes ?? null;
    await writeTaskFile(uri, tasks);
  } else {
    throw new Error(`Task "${taskDescription}" not found`);
  }
}

async function createTask(uri: vscode.Uri, task: Task): Promise<void> {
  const tasks = await parseTaskFile(uri);

  if (!task.status) {
    task.status = "pending";
  }

  tasks.push(task);
  await writeTaskFile(uri, tasks);
}

async function updateTask(uri: vscode.Uri, updatedTask: Task): Promise<void> {
  const tasks = await parseTaskFile(uri);
  const taskDescription = updatedTask.description;

  if (!taskDescription) {
    throw new Error("Task must have a description");
  }

  const taskIndex = tasks.findIndex((t) => t.description === taskDescription);

  if (taskIndex === -1) {
    throw new Error(`Task "${taskDescription}" not found`);
  }

  tasks[taskIndex] = updatedTask;
  await writeTaskFile(uri, tasks);
}

async function deleteTask(uri: vscode.Uri, taskDescription: string): Promise<void> {
  const tasks = await parseTaskFile(uri);

  const taskIndex = tasks.findIndex((t) => t.description === taskDescription);

  if (taskIndex === -1) {
    throw new Error(`Task "${taskDescription}" not found`);
  }

  tasks.splice(taskIndex, 1);
  await writeTaskFile(uri, tasks);
}

async function refreshWebview(
  taskFileUri: vscode.Uri,
  webviewHost: vscode.WebviewView | vscode.WebviewPanel
): Promise<void> {
  const tasks = await parseTaskFile(taskFileUri);
  webviewHost.webview.postMessage({
    type: "update",
    data: { tasks },
  });
}
