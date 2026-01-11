import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

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
    const htmlPath = path.join(this._extensionUri.fsPath, 'src', 'webview', 'kanban.html');

    let html = fs.readFileSync(htmlPath, 'utf8');

    const nonce = getNonce();

    // Replace placeholders in the HTML template
    html = html.replace(/\${webview.cspSource}/g, webview.cspSource);
    html = html.replace(/\${nonce}/g, nonce);
    html = html.replace(/\${styleUri}/g, styleUri.toString());
    html = html.replace(/\${scriptUri}/g, scriptUri.toString());

    // Inject the actual URIs into the template if they are not already there
    if (!html.includes(styleUri.toString())) {
        html = html.replace('</head>', `    <link href="${styleUri}" rel="stylesheet">\n</head>`);
    }
    if (!html.includes(scriptUri.toString())) {
        html = html.replace('</body>', `    <script nonce="${nonce}" src="${scriptUri}"></script>\n</body>`);
    }

    return html;
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
