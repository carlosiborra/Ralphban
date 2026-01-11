export type TaskStatus = "pending" | "in_progress" | "completed" | "cancelled";

export type TaskCategory =
  | "frontend"
  | "backend"
  | "database"
  | "testing"
  | "documentation"
  | "infrastructure"
  | "security"
  | "functional";

export interface Task {
  id?: string;
  description: string;
  status?: TaskStatus;
  category: TaskCategory;
  steps: string[];
  dependencies?: string[];
  passes: boolean;
  priority?: string;
}

export interface TaskFile {
  feature?: string;
  description?: string;
  tasks: Task[];
}

export interface KanbanColumn {
  id: TaskStatus;
  label: string;
  tasks: Task[];
}

export interface DependencyNode {
  task: Task;
  blocking: Task[];
  blockedBy: Task[];
}
