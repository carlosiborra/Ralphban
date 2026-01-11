# 🟡 Ralphban: A Visual Kanban for LLM Tasks in VS Code

Ralphban exists because I fell in love with a way of working.

After reading this explanation of Ralph-style task decomposition by [@mattpocockuk](https://x.com/mattpocockuk) on X ([see post here](https://x.com/mattpocockuk/status/2008200878633931247)) something clicked. The idea of breaking work into explicit, minimalistic and inspectable tasks that an LLM can reason about felt right. Deterministic. Debuggable. Calm.

But in practice, staring at raw JSON while iterating on long-running agents and task graphs was painful. I wanted to _see_ what my LLM was doing. I wanted to understand task state at a glance. I wanted feedback, not blobs of text.

So I built Ralphban.

Ralphban is a VS Code extension that turns Ralph-style task files into a visual Kanban board. It is not a project manager. It is not Jira. It is a debugging and thinking tool for people building LLM-driven systems.

If you are building LLM workflows, task harnesses, or agent loops, this is meant to live next to your code.

## What Ralphban Is For

- Designing and iterating on LLM task graphs
- Seeing task status and progress visually
- Editing task structure without losing the underlying JSON
- Making long-running agent workflows understandable

## What It Is Not

- A general-purpose Kanban or project management tool
- A hosted service
- An abstraction over your data

Your JSON stays your JSON. Ralphban is just a lens.

## Features

- Visual Kanban board generated directly from JSON task files
- Drag tasks between states to update status
- Edit tasks inline without breaking structure
- Real-time sync between the board and the file
- Multiple boards per workspace
- Automatic discovery of task files via patterns

## How It Works

You define tasks in a JSON file. Ralphban reads that file and renders it as a Kanban board. Any interaction you do in the UI writes back to the file. No hidden state. No magic.

Example `prd.json`:

```json
{
  "feature": "My Project",
  "description": "High-level goal of the system",
  "tasks": [
    {
      "category": "backend",
      "description": "Design task execution loop",
      "steps": ["Define task state transitions", "Handle retries and failures", "Persist progress"],
      "status": "pending",
      "priority": "high",
      "passes": false
    }
  ]
}
```

Open the Ralphban panel and you get a board that reflects this structure immediately.

## Task Schema

Ralphban follows the task structure described in Anthropic's [Effective Harnesses for Long-Running Agents](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents), but adds specific keys to improve visual state tracking and LLM reasoning.

### The Original Anthropic Structure

The base structure focuses on categories, steps, and binary passes:

```json
{
  "category": "functional",
  "description": "New chat button creates a fresh conversation",
  "steps": [
    "Navigate to main interface",
    "Click the 'New Chat' button",
    "Verify a new conversation is created"
  ],
  "passes": false
}
```

### Ralphban Extensions

We extend this schema with three critical keys that enable the Kanban visualization and complex agent workflows:

1.  **`status`**: Replaces binary "passes" with a granular state (`pending`, `in_progress`, `completed`, `cancelled`). This is what determines the task's column on the board.
2.  **`priority`**: Adds a reasoning signal (`low`, `medium`, `high`) to help the LLM decide which tasks in a graph to tackle first.
3.  **`dependencies`**: A list of task descriptions/IDs that this task depends on. This allows the visualization of task graphs and helps agents handle conditional executions.

### Full Task Shape

```json
{
  "id": "optional-id",
  "category": "backend",
  "description": "Design task execution loop",
  "status": "pending",
  "priority": "high",
  "steps": ["Define task state transitions", "Handle retries and failures"],
  "dependencies": ["Setup database schema"],
  "passes": false
}
```

## Configuration

You control which files are treated as boards.

```json
{
  "ralphban.filePatterns": ["**/*.prd.json", "**/tasks.json", "**/plans/**/*.json"]
}
```

## Why a Kanban?

Because task state is the most important signal when debugging agent behavior.

A list hides flow. A board shows it.

When something stalls, loops, or fails, you see it immediately.

## Development

### Prerequisites

- Node.js 18+
- pnpm
- VS Code 1.108+

### Quick Start

1. **Installation**:

   ```bash
   git clone https://github.com/carlosiborra/ralphban.git
   cd ralphban
   pnpm install
   pnpm run compile
   ```

2. **Run Extension**:
   - Open the project in VS Code: `code .`
   - Press `F5` (starts Extension Development Host).
   - In the new window, create a file named `test.prd.json` with some tasks.
   - Click the **Ralphban** icon in the sidebar to see your board!

### Architecture at a Glance

```
Extension Host (Backend)          Webview (Frontend)
┌─────────────────────┐          ┌─────────────────┐
│ extension.ts        │          │ kanban.html     │
│   ├─ Commands       │          │ kanban.css      │
│   └─ Event handlers │◄────────►│ kanban.js       │
│                     │          │                 │
│ messageHandler.ts   │  Message │ - Drag & drop   │
│   ├─ CRUD ops       │  Passing │ - Filters       │
│   └─ File I/O       │◄────────►│ - Forms         │
│                     │          │ - Markdown      │
│ fileScanner.ts      │          └─────────────────┘
│ jsonParser.ts       │
│ fileWriter.ts       │
│ fileWatcher.ts      │
└─────────────────────┘
         │
         ▼
  ┌──────────────┐
  │ prd.json     │
  │ tasks.json   │
  └──────────────┘
```

### Key Files

| File                       | Purpose                                   |
| :------------------------- | :---------------------------------------- |
| `src/extension.ts`         | Entry point, command registration         |
| `src/types.ts`             | TypeScript interfaces and data structures |
| `src/messageHandler.ts`    | Business logic and CRUD operations        |
| `src/webview/`             | Frontend UI (HTML, CSS, JS)               |
| `schemas/task-schema.json` | JSON Schema for task validation           |

### Troubleshooting

- **Extension doesn't activate**: Check the "Ralphban" channel in the Output view (`View → Output`).
- **Webview is blank**: Open "Developer: Open Webview Developer Tools" from the Command Palette (`Cmd+Shift+P`) to check for frontend errors.
- **Build issues**: Ensure you've run `pnpm install` and `pnpm run compile`.

## Documentation Index

1. **[CONTRIBUTING.md](CONTRIBUTING.md)** - How to contribute to Ralphban
2. **[CHANGELOG.md](CHANGELOG.md)** - Version history and recent changes
3. **[LICENSE](LICENSE)** - MIT License information

## Philosophy

- No backend
- No telemetry
- No accounts
- No abstractions over your data

Just files, tasks, and visibility.

## License

MIT. Do whatever you want with it.

## Acknowledgments

- The Ralph task decomposition approach
- Anthropic’s work on agent harnesses
- VS Code extension tooling

---

Made with a 💻 by Carlos Iborra Llopis

> Built because reading JSON is not how humans think
