import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { handleWebviewMessage } from './messageHandler';
import { ParseError, parseTaskFile } from './jsonParser';
import { TaskFileWatcher } from './fileWatcher';

export class KanbanPanel {
	public static readonly viewType = 'ralphban.kanbanPanel';
	private static currentPanel: KanbanPanel | undefined;
	private static readonly outputChannel = vscode.window.createOutputChannel('Ralphban');

	private _currentFile?: vscode.Uri;
	private _watcher?: TaskFileWatcher;

	private constructor(
		private readonly panel: vscode.WebviewPanel,
		private readonly extensionUri: vscode.Uri
	) {
		this.panel.webview.options = {
			enableScripts: true,
			localResourceRoots: [this.extensionUri]
		};

		this.panel.webview.html = this.getHtmlForWebview(this.panel.webview);

		this.panel.webview.onDidReceiveMessage(async (data) => {
			if (this._currentFile) {
				await handleWebviewMessage(data, this._currentFile, this.panel);
				return;
			}

			switch (data?.type) {
				case 'onInfo':
					vscode.window.showInformationMessage(data.value || data.data);
					break;
				case 'onError':
					vscode.window.showErrorMessage(data.value || data.data);
					break;
			}
		});

		this.panel.onDidDispose(() => {
			this.dispose();
		});
	}

	public dispose() {
		KanbanPanel.currentPanel = undefined;
		this._watcher?.dispose();
		this.panel.dispose();
	}

	public static async createOrShow(extensionUri: vscode.Uri, taskFileUri?: vscode.Uri) {
		const column = vscode.window.activeTextEditor?.viewColumn ?? vscode.ViewColumn.One;

		if (KanbanPanel.currentPanel) {
			KanbanPanel.currentPanel.panel.reveal(column, true);
			if (taskFileUri) {
				await KanbanPanel.currentPanel.setTaskFile(taskFileUri);
			}
			return;
		}

		const panel = vscode.window.createWebviewPanel(
			KanbanPanel.viewType,
			'Kanban Board',
			column,
			{
				enableScripts: true,
				retainContextWhenHidden: true,
				localResourceRoots: [extensionUri]
			}
		);

		panel.iconPath = vscode.Uri.file(path.join(extensionUri.fsPath, 'images', 'icon.png'));

		KanbanPanel.currentPanel = new KanbanPanel(panel, extensionUri);

		if (taskFileUri) {
			await KanbanPanel.currentPanel.setTaskFile(taskFileUri);
		}
	}

	public async setTaskFile(uri: vscode.Uri) {
		this._currentFile = uri;
		this.panel.title = `Kanban Board — ${path.basename(uri.fsPath)}`;

		this._watcher?.dispose();
		this._watcher = new TaskFileWatcher(uri, {
			onChange: async () => {
				await this.refreshContent();
			},
			onDelete: () => {
				vscode.window.showWarningMessage(`Kanban file ${path.basename(uri.fsPath)} was deleted.`);
				this.dispose();
			}
		});

		await this.refreshContent();
	}

	private async refreshContent() {
		if (!this._currentFile) {
			return;
		}

		try {
			const taskFile = await parseTaskFile(this._currentFile);
			await this.panel.webview.postMessage({
				type: 'update',
				data: taskFile
			});
		} catch (error) {
			if (error instanceof ParseError) {
				KanbanPanel.outputChannel.appendLine(error.message);
				if (error.errors?.length) {
					for (const line of error.errors) {
						KanbanPanel.outputChannel.appendLine(`  - ${line}`);
					}
				}
				KanbanPanel.outputChannel.show(true);
				vscode.window.showErrorMessage(error.message);
				return;
			}

			const message = error instanceof Error ? error.message : String(error);
			KanbanPanel.outputChannel.appendLine(`Unexpected error: ${message}`);
			KanbanPanel.outputChannel.show(true);
			vscode.window.showErrorMessage(`Failed to open Kanban board: ${message}`);
		}
	}

	private getHtmlForWebview(webview: vscode.Webview) {
		const scriptPath = vscode.Uri.file(path.join(this.extensionUri.fsPath, 'src', 'webview', 'kanban.js'));
		const stylePath = vscode.Uri.file(path.join(this.extensionUri.fsPath, 'src', 'webview', 'kanban.css'));
		const htmlPath = path.join(this.extensionUri.fsPath, 'src', 'webview', 'kanban.html');

		const scriptUri = webview.asWebviewUri(scriptPath);
		const styleUri = webview.asWebviewUri(stylePath);

		let html = fs.readFileSync(htmlPath, 'utf8');

		const nonce = getNonce();

		html = html.replace(/\${webview.cspSource}/g, webview.cspSource);
		html = html.replace(/\${nonce}/g, nonce);
		html = html.replace(/\${styleUri}/g, styleUri.toString());
		html = html.replace(/\${scriptUri}/g, scriptUri.toString());

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
