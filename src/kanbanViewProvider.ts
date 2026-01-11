import * as fs from "node:fs";
import * as path from "node:path";
import * as vscode from "vscode";
import { findTaskFiles } from "./fileScanner";
import type { TaskFileWatcher } from "./fileWatcher";

export class KanbanViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = "kanbanBoard";
  private _view?: vscode.WebviewView;
  private _watcher?: TaskFileWatcher;

  constructor(private readonly _extensionUri: vscode.Uri) {}

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri],
    };

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

    webviewView.webview.onDidReceiveMessage(async (data) => {
      switch (data.type) {
        case "ready":
          await this.refreshBoardList();
          break;
        case "open":
          if (data.uri) {
            vscode.commands.executeCommand("ralphban.openKanbanBoard", vscode.Uri.parse(data.uri));
          }
          break;
        case "create":
          vscode.commands.executeCommand("ralphban.createKanbanBoard");
          break;
        case "onInfo":
          vscode.window.showInformationMessage(data.value || data.data);
          break;
        case "onError":
          vscode.window.showErrorMessage(data.value || data.data);
          break;
      }
    });

    webviewView.onDidDispose(() => {
      this._view = undefined;
      this._watcher?.dispose();
    });

    // Initial scan
    this.refreshBoardList();
  }

  public async refreshBoardList() {
    if (!this._view) {
      return;
    }

    const files = await findTaskFiles();
    const boards = files.map((uri) => ({
      name: path.basename(uri.fsPath),
      path: vscode.workspace.asRelativePath(uri),
      uri: uri.toString(),
    }));

    await this._view.webview.postMessage({
      type: "list",
      boards: boards,
    });
  }

  public async setTaskFile(_uri: vscode.Uri) {
    // We no longer switch the sidebar to the full board view
    // Instead we just refresh the list to ensure the current file is there
    await this.refreshBoardList();
  }

  public postMessage(message: any) {
    if (this._view) {
      this._view.webview.postMessage(message);
    }
  }

  private _getHtmlForWebview(webview: vscode.Webview) {
    const htmlPath = path.join(this._extensionUri.fsPath, "src", "webview", "selector.html");
    let html = fs.readFileSync(htmlPath, "utf8");

    const nonce = getNonce();

    html = html.replace(/\${webview.cspSource}/g, webview.cspSource);
    html = html.replace(/\${nonce}/g, nonce);

    return html;
  }
}

function getNonce() {
  let text = "";
  const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
