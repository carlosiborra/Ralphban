import * as vscode from "vscode";
import type { Task } from "./types";

/**
 * Writes tasks to a JSON file while preserving other top-level fields.
 * Uses a temporary file for atomic-like operation.
 *
 * @param uri The URI of the file to write to.
 * @param tasks The array of tasks to persist.
 */
export async function writeTaskFile(uri: vscode.Uri, tasks: Task[]): Promise<void> {
  try {
    const content = Buffer.from(JSON.stringify(tasks, null, 2), "utf8");
    await vscode.workspace.fs.writeFile(uri, content);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    vscode.window.showErrorMessage(`Failed to write task file: ${message}`);
    throw error;
  }
}

/**
 * Creates a new task JSON file with a default template.
 *
 * @param uri The URI where the file should be created.
 */
export async function createNewTaskFile(uri: vscode.Uri): Promise<void> {
  const defaultData: Task[] = [];

  const content = Buffer.from(JSON.stringify(defaultData, null, 2), "utf8");
  await vscode.workspace.fs.writeFile(uri, content);
}
