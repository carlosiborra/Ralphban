import * as path from "node:path";
import * as vscode from "vscode";
import { findTaskFileByName, isTaskFileUri } from "./fileScanner";
import { createNewTaskFile } from "./fileWriter";
import { KanbanPanel } from "./kanbanPanel";
import { KanbanViewProvider } from "./kanbanViewProvider";

export function activate(context: vscode.ExtensionContext) {
  console.log("Ralphban extension is now active!");
  const output = vscode.window.createOutputChannel("Ralphban");
  context.subscriptions.push(output);

  const provider = new KanbanViewProvider(context.extensionUri);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(KanbanViewProvider.viewType, provider)
  );

  const openKanbanBoard = async (uri?: vscode.Uri) => {
    try {
      let targetUri = uri;

      if (!targetUri) {
        const activeEditor = vscode.window.activeTextEditor;
        if (activeEditor && isTaskFileUri(activeEditor.document.uri)) {
          targetUri = activeEditor.document.uri;
        } else {
          targetUri = await findTaskFileByName("prd.json");
        }
      }

      if (!targetUri) {
        const selection = await vscode.window.showErrorMessage(
          "No Kanban JSON file found to open.",
          "Create New Board"
        );
        if (selection === "Create New Board") {
          vscode.commands.executeCommand("ralphban.createKanbanBoard");
        }
        return;
      }

      output.appendLine(`[openKanbanBoard] opening: ${targetUri.fsPath}`);
      output.show(true);
      await KanbanPanel.createOrShow(context.extensionUri, targetUri);
    } catch (error) {
      const message = error instanceof Error ? error.stack || error.message : String(error);
      output.appendLine(`[openKanbanBoard] error: ${message}`);
      output.show(true);
      vscode.window.showErrorMessage(
        "Failed to open Kanban board. See Output → Ralphban for details."
      );
    }
  };

  context.subscriptions.push(
    vscode.commands.registerCommand("ralphban.openKanbanBoard", openKanbanBoard)
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("ralphban.createKanbanBoard", async () => {
      const workspaceFolders = vscode.workspace.workspaceFolders;
      if (!workspaceFolders || workspaceFolders.length === 0) {
        vscode.window.showErrorMessage("Please open a workspace before creating a Kanban board.");
        return;
      }

      const firstFolder = workspaceFolders[0];
      if (!firstFolder) {
        return;
      }
      const defaultUri = vscode.Uri.file(path.join(firstFolder.uri.fsPath, "prd.json"));
      const options: vscode.SaveDialogOptions = {
        defaultUri: defaultUri,
        filters: { "JSON Files": ["json"] },
        title: "Create New Kanban Board",
      };

      const fileUri = await vscode.window.showSaveDialog(options);
      if (fileUri) {
        await createNewTaskFile(fileUri);
        await openKanbanBoard(fileUri);
        vscode.window.showInformationMessage(
          `Created new Kanban board: ${path.basename(fileUri.fsPath)}`
        );
      }
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("ralphban.refreshBoardList", () => {
      provider.refreshBoardList();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("ralphban.forceReopenBoard", async (uri?: vscode.Uri) => {
      let targetUri = uri;

      if (!targetUri) {
        const activeEditor = vscode.window.activeTextEditor;
        if (activeEditor && isTaskFileUri(activeEditor.document.uri)) {
          targetUri = activeEditor.document.uri;
        } else {
          targetUri = await findTaskFileByName("prd.json");
        }
      }

      if (!targetUri) {
        return;
      }

      KanbanPanel.closeCurrentPanel();

      await new Promise((resolve) => setTimeout(resolve, 100));
      await KanbanPanel.createOrShow(context.extensionUri, targetUri);
    })
  );

  const updateContext = () => {
    const activeEditor = vscode.window.activeTextEditor;
    if (activeEditor && isTaskFileUri(activeEditor.document.uri)) {
      vscode.commands.executeCommand("setContext", "ralphban.isTaskFile", true);
    } else {
      vscode.commands.executeCommand("setContext", "ralphban.isTaskFile", false);
    }
  };

  updateContext();

  context.subscriptions.push(vscode.window.onDidChangeActiveTextEditor(updateContext));

  context.subscriptions.push(
    vscode.workspace.onDidSaveTextDocument((e) => {
      if (isTaskFileUri(e.uri)) {
        provider.refreshBoardList();
        KanbanPanel.refreshIfOpen(e.uri);
      }
    })
  );

  context.subscriptions.push(
    vscode.workspace.onDidCreateFiles(() => provider.refreshBoardList()),
    vscode.workspace.onDidDeleteFiles(() => provider.refreshBoardList()),
    vscode.workspace.onDidRenameFiles(() => provider.refreshBoardList())
  );

  context.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument((e) => {
      if (e.document === vscode.window.activeTextEditor?.document) {
        updateContext();
      }
    })
  );
}

export function deactivate() {
  console.log("Ralphban extension is now deactivated!");
}
