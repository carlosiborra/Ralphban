import * as vscode from 'vscode';
import { KanbanViewProvider } from './kanbanViewProvider';

export function activate(context: vscode.ExtensionContext) {
	console.log('Ralphban extension is now active!');

	const provider = new KanbanViewProvider(context.extensionUri);

	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(KanbanViewProvider.viewType, provider)
	);
}

export function deactivate() {
	console.log('Ralphban extension is now deactivated!');
}
