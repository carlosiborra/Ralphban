import * as vscode from "vscode";
import { minimatch } from "minimatch";
import { validateTaskFile } from "./jsonParser";

function getFilePatterns(): string[] {
  const config = vscode.workspace.getConfiguration("ralphban");
  return config.get<string[]>("filePatterns", ["**/*.prd.json", "**/prd.json", "**/tasks.json"]);
}

export async function findTaskFiles(): Promise<vscode.Uri[]> {
  const validUris: vscode.Uri[] = [];

  if (!vscode.workspace.workspaceFolders || vscode.workspace.workspaceFolders.length === 0) {
    return validUris;
  }

  try {
    const patterns = getFilePatterns();
    const excludePatterns = ["**/{node_modules,.git,.vscode,out,dist}/**"];

    const allUris: vscode.Uri[] = [];
    for (const pattern of patterns) {
      const files = await vscode.workspace.findFiles(pattern, excludePatterns.join(","), 100);
      allUris.push(...files);
    }

    const uniqueUris = Array.from(new Map(allUris.map((uri) => [uri.toString(), uri])).values());

    for (const fileUri of uniqueUris) {
      try {
        if (await isValidTaskFile(fileUri)) {
          validUris.push(fileUri);
        }
      } catch {
        // Intentionally ignore errors for individual files
      }
    }
  } catch (error) {
    console.error("Error scanning workspace for task files:", error);
  }

  return validUris;
}

export async function isValidTaskFile(uri: vscode.Uri): Promise<boolean> {
  try {
    const content = await vscode.workspace.fs.readFile(uri);
    const jsonString = new TextDecoder().decode(content);
    const parsed = JSON.parse(jsonString);
    const result = await validateTaskFile(parsed);
    return result.valid;
  } catch {
    return false;
  }
}

export async function findTaskFileByName(
  fileName: string = "prd.json"
): Promise<vscode.Uri | undefined> {
  const uris = await findTaskFiles();

  for (const uri of uris) {
    if (uri.path.endsWith(fileName)) {
      return uri;
    }
  }

  return uris.length > 0 ? uris[0] : undefined;
}

export function isTaskFileUri(uri: vscode.Uri): boolean {
  const patterns = getFilePatterns();
  const relativePath = vscode.workspace.asRelativePath(uri, false);

  return patterns.some((pattern) => minimatch(relativePath, pattern, { dot: true }));
}
