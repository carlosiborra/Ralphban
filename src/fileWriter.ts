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
    // Read existing content to preserve other fields
    const fileContent = await vscode.workspace.fs.readFile(uri);
    const originalData = JSON.parse(Buffer.from(fileContent).toString("utf8"));

    // Update only the tasks field
    const updatedData = {
      ...originalData,
      tasks: tasks,
    };

    const content = Buffer.from(JSON.stringify(updatedData, null, 2), "utf8");
    const tempUri = uri.with({ path: `${uri.path}.tmp` });

    // 1. Write to temporary file
    await vscode.workspace.fs.writeFile(tempUri, content);

    // 2. Overwrite the original file (vscode.workspace.fs.copy with overwrite: true is relatively safe)
    await vscode.workspace.fs.copy(tempUri, uri, { overwrite: true });

    // 3. Delete temporary file
    await vscode.workspace.fs.delete(tempUri);
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
 * @param featureName Optional name for the feature.
 */
export async function createNewTaskFile(uri: vscode.Uri, featureName?: string): Promise<void> {
  const defaultData: any = {
    feature: featureName || "New Feature",
    description: "Created via Ralphban",
    tasks: [],
  };

  const content = Buffer.from(JSON.stringify(defaultData, null, 2), "utf8");
  await vscode.workspace.fs.writeFile(uri, content);
}
