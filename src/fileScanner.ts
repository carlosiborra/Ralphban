import * as vscode from 'vscode';
import { Task, TaskFile } from './types';

export async function findTaskFiles(): Promise<vscode.Uri[]> {
	const validUris: vscode.Uri[] = [];

	if (!vscode.workspace.workspaceFolders || vscode.workspace.workspaceFolders.length === 0) {
		return validUris;
	}

	try {
		const jsonFiles = await vscode.workspace.findFiles(
			'**/*.json',
			'**/{node_modules,.git,.vscode,out,dist}/**',
			100
		);

		for (const fileUri of jsonFiles) {
			try {
				const content = await vscode.workspace.fs.readFile(fileUri);
				const jsonString = new TextDecoder().decode(content);
				const parsed = JSON.parse(jsonString);

				if (isValidTaskFile(parsed)) {
					validUris.push(fileUri);
				}
			} catch {
				continue;
			}
		}
	} catch (error) {
		console.error('Error scanning workspace for task files:', error);
	}

	return validUris;
}

function isValidTaskFile(data: unknown): data is TaskFile {
	if (!data || typeof data !== 'object') {
		return false;
	}

	const obj = data as Record<string, unknown>;

	if (
		typeof obj.feature !== 'string' ||
		typeof obj.description !== 'string' ||
		!Array.isArray(obj.tasks) ||
		obj.tasks.length === 0
	) {
		return false;
	}

	return obj.tasks.every((task): task is Task => {
		if (!task || typeof task !== 'object') {
			return false;
		}

		const taskObj = task as Record<string, unknown>;

		return (
			typeof taskObj.description === 'string' &&
			typeof taskObj.status === 'string' &&
			['pending', 'in_progress', 'completed', 'cancelled'].includes(taskObj.status) &&
			typeof taskObj.category === 'string' &&
			['frontend', 'backend', 'database', 'testing', 'documentation', 'infrastructure', 'security'].includes(taskObj.category) &&
			Array.isArray(taskObj.steps) &&
			Array.isArray(taskObj.dependencies) &&
			typeof taskObj.passes === 'boolean'
		);
	});
}

export async function findTaskFileByName(fileName: string = 'prd.json'): Promise<vscode.Uri | undefined> {
	const uris = await findTaskFiles();

	for (const uri of uris) {
		if (uri.path.endsWith(fileName)) {
			return uri;
		}
	}

	return uris.length > 0 ? uris[0] : undefined;
}
