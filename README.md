# 🟡 Ralphban: A Visual Kanban for LLM Tasks in VS Code

Ralphban exists because I fell in love with a way of working.

After reading this explanation of Ralph-style task decomposition by [@mattpocockuk](https://x.com/mattpocockuk) on X ([see post here](https://x.com/mattpocockuk/status/2008200878633931247)) something clicked. The idea of breaking work into explicit, minimalistic and inspectable tasks that an LLM can reason about felt right. Deterministic. Debuggable. Calm.

But in practice, staring at raw JSON while iterating on long-running agents and task graphs was painful. I wanted to _see_ what my LLM was doing. I wanted to understand task state at a glance. I wanted feedback, not blobs of text.

So I built Ralphban.

Ralphban is a VS Code extension that turns Ralph-style task files into a visual Kanban board. It is not a project manager. It is not Jira. It is a debugging and thinking tool for people building LLM-driven systems.

This extension also follows the task and agent structure described in Anthropic’s excellent write-up on long-running agents:
[Effective Harnesses for Long-Running Agents](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents). But with some additional keys:

- `status`: The current status of the task (more specific than just `passed`)
- `priority`: The priority of the task for helping the LLM reason about the task graph
- `dependencies`: The tasks that this task depends on in case of conditional executions

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

The schema is intentionally boring and explicit.

### Status

- `pending`
- `in_progress`
- `completed`
- `cancelled`

### Priority

- `low`
- `medium`
- `high`

### Categories

- `frontend`
- `backend`
- `database`
- `testing`
- `documentation`
- `infrastructure`
- `security`
- `functional`

### Full Task Shape

```json
{
  "id": "optional-id",
  "category": "backend",
  "description": "Task description",
  "status": "pending",
  "priority": "high",
  "steps": ["Concrete step 1", "Concrete step 2"],
  "dependencies": ["Another task description"],
  "passes": false
}
```

This structure maps cleanly to how LLM agents reason about work: explicit steps, explicit state, explicit dependencies.

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

Requirements:

- Node.js 18+
- pnpm
- VS Code 1.108+

Local setup:

```bash
git clone https://github.com/carlosiborra/ralphban.git
cd ralphban
pnpm install
```

Run locally:

- Open the project in VS Code
- Press F5
- Create a test task file
- Open the Ralphban panel

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
