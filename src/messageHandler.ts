import * as vscode from 'vscode';
import { parseTaskFile } from './jsonParser';
import { writeTaskFile } from './fileWriter';

export interface WebviewMessage {
    type: string;
    data?: any;
    taskId?: string;
    newStatus?: string;
}

export async function handleWebviewMessage(
    message: WebviewMessage,
    taskFileUri: vscode.Uri,
    webviewView: vscode.WebviewView | undefined
): Promise<void> {
    try {
        switch (message.type) {
            case 'updateTaskStatus':
                if (message.taskId && message.newStatus) {
                    await updateTaskStatus(taskFileUri, message.taskId, message.newStatus as any);
                    // After update, we might want to refresh the webview, 
                    // but the file watcher should trigger it if it's active.
                }
                break;

            case 'refreshTasks':
                if (webviewView) {
                    const taskFile = await parseTaskFile(taskFileUri);
                    webviewView.webview.postMessage({
                        type: 'update',
                        data: taskFile
                    });
                }
                break;

            case 'onInfo':
                vscode.window.showInformationMessage(message.data);
                break;

            case 'onError':
                vscode.window.showErrorMessage(message.data);
                break;

            default:
                console.warn(`Unknown message type: ${message.type}`);
        }
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        vscode.window.showErrorMessage(`Error handling webview message: ${errorMessage}`);
    }
}

async function updateTaskStatus(
    uri: vscode.Uri,
    taskId: string,
    newStatus: 'pending' | 'in_progress' | 'completed' | 'cancelled'
): Promise<void> {
    const taskFile = await parseTaskFile(uri);
    const taskIndex = taskFile.tasks.findIndex(t => (t.id || t.description) === taskId);

    if (taskIndex !== -1) {
        taskFile.tasks[taskIndex].status = newStatus;
        await writeTaskFile(uri, taskFile.tasks);
    } else {
        throw new Error(`Task with ID ${taskId} not found`);
    }
}
