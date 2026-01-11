import * as vscode from "vscode";

export interface FileWatcherEvents {
  onChange: (uri: vscode.Uri) => void;
  onDelete: (uri: vscode.Uri) => void;
}

export class TaskFileWatcher {
  private disposable: vscode.Disposable;
  private debounceTimers: Map<string, NodeJS.Timeout> = new Map();
  private readonly DEBOUNCE_MS = 300;

  constructor(
    uri: vscode.Uri,
    private events: FileWatcherEvents
  ) {
    const pattern = new vscode.RelativePattern(
      vscode.workspace.getWorkspaceFolder(uri)!,
      uri.fsPath
    );
    const watcher = vscode.workspace.createFileSystemWatcher(pattern);

    watcher.onDidChange(this.handleDidChange.bind(this));
    watcher.onDidDelete(this.handleDidDelete.bind(this));

    this.disposable = watcher;
  }

  private handleDidChange(uri: vscode.Uri): void {
    const uriString = uri.toString();

    if (this.debounceTimers.has(uriString)) {
      clearTimeout(this.debounceTimers.get(uriString)!);
    }

    const timer = setTimeout(() => {
      this.events.onChange(uri);
      this.debounceTimers.delete(uriString);
    }, this.DEBOUNCE_MS);

    this.debounceTimers.set(uriString, timer);
  }

  private handleDidDelete(uri: vscode.Uri): void {
    const uriString = uri.toString();
    this.debounceTimers.delete(uriString);
    this.events.onDelete(uri);
  }

  dispose(): void {
    this.debounceTimers.forEach((timer) => {
      clearTimeout(timer);
    });
    this.debounceTimers.clear();
    this.disposable.dispose();
  }
}

export function createFileWatcher(uri: vscode.Uri, events: FileWatcherEvents): TaskFileWatcher {
  return new TaskFileWatcher(uri, events);
}
