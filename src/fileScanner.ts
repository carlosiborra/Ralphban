import * as vscode from 'vscode';
import { Task, TaskFile } from './types';

function getFilePatterns(): string[] {
	const config = vscode.workspace.getConfiguration('ralphban');
	return config.get<string[]>('filePatterns', ['**/*.prd.json', '**/prd.json', '**/tasks.json']);
}

export async function findTaskFiles(): Promise<vscode.Uri[]> {
	const validUris: vscode.Uri[] = [];

	if (!vscode.workspace.workspaceFolders || vscode.workspace.workspaceFolders.length === 0) {
		return validUris;
	}

	try {
		const patterns = getFilePatterns();
		const excludePatterns = ['**/{node_modules,.git,.vscode,out,dist}/**'];

		const allUris: vscode.Uri[] = [];
		for (const pattern of patterns) {
			const files = await vscode.workspace.findFiles(pattern, excludePatterns.join(','), 100);
			allUris.push(...files);
		}

		const uniqueUris = Array.from(new Map(allUris.map(uri => [uri.toString(), uri])).values());

		for (const fileUri of uniqueUris) {
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

	if (!Array.isArray(obj.tasks)) {
		return false;
	}

	return obj.tasks.every((task): task is Task => {
		if (!task || typeof task !== 'object') {
			return false;
		}

		const taskObj = task as Record<string, unknown>;

		return (
			typeof taskObj.description === 'string' &&
			(taskObj.status === undefined || (typeof taskObj.status === 'string' && ['pending', 'in_progress', 'completed', 'cancelled'].includes(taskObj.status))) &&
			typeof taskObj.category === 'string' &&
			['frontend', 'backend', 'database', 'testing', 'documentation', 'infrastructure', 'security', 'functional'].includes(taskObj.category) &&
			Array.isArray(taskObj.steps) &&
			(taskObj.dependencies === undefined || Array.isArray(taskObj.dependencies)) &&
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

export function isTaskFileUri(uri: vscode.Uri): boolean {
	const patterns = getFilePatterns();
	const relativePath = vscode.workspace.asRelativePath(uri, false);
	
	for (const pattern of patterns) {
		if (relativePath.includes(pattern.replace('**/', '').replace('*', ''))) {
			return true;
		}
	}
	
	return false;
}
