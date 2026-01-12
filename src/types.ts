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
  description: string;
  status?: TaskStatus;
  category: TaskCategory;
  steps: string[];
  dependencies?: string[];
  passes?: boolean | null;
  priority?: string;
}

export type TaskFile = Task[];

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
