import * as vscode from 'vscode';
import { findTaskFileByName, isTaskFileUri } from './fileScanner';
import { KanbanPanel } from './kanbanPanel';

export function activate(context: vscode.ExtensionContext) {
	console.log('Ralphban extension is now active!');
	const output = vscode.window.createOutputChannel('Ralphban');
	context.subscriptions.push(output);

	context.subscriptions.push(
		vscode.commands.registerCommand('ralphban.openKanbanBoard', async (uri?: vscode.Uri) => {
			try {
				let targetUri = uri;

				if (!targetUri) {
					const activeEditor = vscode.window.activeTextEditor;
					if (activeEditor && isTaskFileUri(activeEditor.document.uri)) {
						targetUri = activeEditor.document.uri;
					} else {
						targetUri = await findTaskFileByName('prd.json');
					}
				}

				if (!targetUri) {
					vscode.window.showErrorMessage('No PRD JSON file found to open.');
					return;
				}

				output.appendLine(`[openKanbanBoard] opening: ${targetUri.fsPath}`);
				output.show(true);
				await KanbanPanel.createOrShow(context.extensionUri, targetUri);
			} catch (error) {
				const message = error instanceof Error ? error.stack || error.message : String(error);
				output.appendLine(`[openKanbanBoard] error: ${message}`);
				output.show(true);
				vscode.window.showErrorMessage('Failed to open Kanban board. See Output → Ralphban for details.');
			}
		})
	);

	const updateContext = () => {
		const activeEditor = vscode.window.activeTextEditor;
		if (activeEditor && isTaskFileUri(activeEditor.document.uri)) {
			vscode.commands.executeCommand('setContext', 'ralphban.isTaskFile', true);
		} else {
			vscode.commands.executeCommand('setContext', 'ralphban.isTaskFile', false);
		}
	};

	updateContext();

	context.subscriptions.push(
		vscode.window.onDidChangeActiveTextEditor(updateContext)
	);

	context.subscriptions.push(
		vscode.workspace.onDidChangeTextDocument(e => {
			if (e.document === vscode.window.activeTextEditor?.document) {
				updateContext();
			}
		})
	);
}

export function deactivate() {
	console.log('Ralphban extension is now deactivated!');
}
