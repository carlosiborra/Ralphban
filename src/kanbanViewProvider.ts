import * as vscode from 'vscode';
import * as path from 'path';

export class KanbanViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'kanbanBoard';
  private _view?: vscode.WebviewView;

  constructor(
    private readonly _extensionUri: vscode.Uri,
  ) { }

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken,
  ) {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [
        this._extensionUri
      ]
    };

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

    webviewView.webview.onDidReceiveMessage(data => {
      switch (data.type) {
        case 'onInfo': {
          vscode.window.showInformationMessage(data.value);
          break;
        }
        case 'onError': {
          vscode.window.showErrorMessage(data.value);
          break;
        }
      }
    });

    webviewView.onDidDispose(() => {
      this._view = undefined;
    });
  }

  public postMessage(message: any) {
    if (this._view) {
      this._view.webview.postMessage(message);
    }
  }

  private _getHtmlForWebview(webview: vscode.Webview) {
    const scriptUri = webview.asWebviewUri(vscode.Uri.file(path.join(this._extensionUri.fsPath, 'src', 'webview', 'kanban.js')));
    const styleUri = webview.asWebviewUri(vscode.Uri.file(path.join(this._extensionUri.fsPath, 'src', 'webview', 'kanban.css')));

    const nonce = getNonce();

    return `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">
				<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<link href="${styleUri}" rel="stylesheet">
				<title>Kanban Board</title>
			</head>
			<body>
				<div id="board"></div>
				<script nonce="${nonce}" src="${scriptUri}"></script>
			</body>
			</html>`;
  }
}

function getNonce() {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
