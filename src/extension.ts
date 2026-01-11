import * as vscode from 'vscode';
import { KanbanViewProvider } from './kanbanViewProvider';
import { findTaskFileByName } from './fileScanner';

export function activate(context: vscode.ExtensionContext) {
	console.log('Ralphban extension is now active!');

	const provider = new KanbanViewProvider(context.extensionUri);

	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(KanbanViewProvider.viewType, provider),
		vscode.commands.registerCommand('ralphban.openKanbanBoard', async (uri?: vscode.Uri) => {
			let targetUri = uri;
			
			if (!targetUri) {
				const activeEditor = vscode.window.activeTextEditor;
				if (activeEditor && activeEditor.document.fileName.endsWith('.json')) {
					targetUri = activeEditor.document.uri;
				} else {
					targetUri = await findTaskFileByName('prd.json');
				}
			}

			if (targetUri) {
				await provider.setTaskFile(targetUri);
			}

			vscode.commands.executeCommand('kanbanBoard.focus');
		})
	);
}

export function deactivate() {
	console.log('Ralphban extension is now deactivated!');
}
