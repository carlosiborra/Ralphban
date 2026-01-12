# 🟡 Ralphban: A Visual Kanban for LLM Tasks in VS Code

Ralphban exists because I fell in love with a way of working.

After reading this explanation of Ralph-style task decomposition by [@mattpocockuk](https://x.com/mattpocockuk) on X ([see post here](https://x.com/mattpocockuk/status/2008200878633931247)) something clicked. The idea of breaking work into explicit, minimalistic and inspectable tasks that an LLM can reason about felt right. Deterministic. Debuggable. Calm.

But in practice, staring at raw JSON while iterating on long-running agents and task graphs was painful. I wanted to _see_ what my LLM was doing. I wanted to understand task state at a glance. I wanted feedback, not blobs of text.

So I built Ralphban.

![Ralphban Demo](images/demo-final.gif)

Ralphban is a VS Code extension that turns Ralph-style task files into a visual Kanban board. It is not a project manager. It is not Jira. It is a debugging and thinking tool for people building LLM-driven systems.

If you are building LLM workflows, task harnesses, or agent loops, this is meant to live next to your code.

Note: I personally use Ralphban alongside [OpenCode](https://opencode.ai/) and a specialized PRD Generator subagent that uses Ralphban's JSON schema. This combined with a bash script that iteratively ingests tasks into agents (as demonstrated in Matt Pocock's video), creates a powerful loop: describe features, generate structured tasks, visualize progress, and iterate until complete.

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
- Task completion is final (completed tasks cannot move back to pending)
- Edit tasks inline without breaking structure
- Real-time sync between the board and the file
- Multiple boards per workspace
- Automatic discovery of task files via patterns
- Progress tracking with percentage counter
- Filter and search tasks by category, priority, or description

## How It Works

You define tasks in a JSON file. Ralphban reads that file and renders it as a Kanban board. Any interaction you do in the UI writes back to the file. No hidden state. No magic.

Example `prd.json`:

```json
[
  {
    "category": "backend",
    "description": "Design task execution loop",
    "steps": ["Define task state transitions", "Handle retries and failures", "Persist progress"],
    "status": "pending",
    "priority": "high",
    "passes": null
  }
]
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
  "passes": null
}
```

### Ralphban Extensions

We extend this schema with three critical keys that enable the Kanban visualization and complex agent workflows:

1.  **`status`**: Replaces binary "passes" with a granular state (`pending`, `in_progress`, `completed`, `cancelled`). This is what determines the task's column on the board.
2.  **`priority`**: Adds a reasoning signal (`low`, `medium`, `high`) to help the LLM decide which tasks in a graph to tackle first.
3.  **`dependencies`**: A list of task descriptions that this task depends on. This allows the visualization of task graphs and helps agents handle conditional executions.

The `passes` field can be:

- `true`: Task is explicitly completed (overrides `status`)
- `false`: Task is explicitly failed (overrides `status`)
- `null`/`undefined`: Use `status` to determine completion

### Full Task Shape

```json
{
  "category": "backend",
  "description": "Design task execution loop",
  "status": "pending",
  "priority": "high",
  "steps": ["Define task state transitions", "Handle retries and failures"],
  "dependencies": ["Setup database schema"],
  "passes": null
}
```

> **Note**: Tasks are uniquely identified by `description`. The `passes` field is nullable - `null` or `undefined` means the completion state is determined by `status` alone.

## Configuration

You control which files are treated as boards.

```json
{
  "ralphban.filePatterns": ["**/*.prd.json", "**/tasks.json", "**/plans/**/*.json"]
}
```

### Feature Flags

Ralphban supports feature flags to enable or disable specific functionality:

```json
{
  "ralphban.featureFlags.enablePercentageCounter": true,
  "ralphban.featureFlags.enableDragDrop": true,
  "ralphban.featureFlags.enableFilters": true
}
```

| Feature Flag              | Default | Description                                                         |
| :------------------------ | :------ | :------------------------------------------------------------------ |
| `enablePercentageCounter` | `true`  | Show task completion percentage in the stats bar                    |
| `enableDragDrop`          | `true`  | Enable drag and drop functionality for moving tasks between columns |
| `enableFilters`           | `true`  | Enable search and filter functionality                              |

## Why a Kanban?

Because task state is the most important signal when debugging agent behavior.

A list hides flow. A board shows it.

When something stalls, loops, or fails, you see it immediately.

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

MIT

## Acknowledgments

- The Ralph task decomposition approach by Matt Pocock
- Anthropic’s work on agent harnesses

---

Made with a 💻 by Carlos Iborra Llopis

> Built because reading JSON is not how humans think
