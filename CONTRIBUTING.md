# Contributing to Ralphban

Thanks for wanting to help improve Ralphban. This project exists because I wanted better tools for thinking about LLM tasks, not because I wanted to maintain a big framework. Contributions are very welcome, especially if they make the tool simpler, clearer, or more useful for real workflows.

This guide explains how to get set up and how to contribute without friction.

## Ways You Can Contribute

Anything that improves clarity or usability is valuable:

- Reporting bugs or weird edge cases
- Suggesting features or improvements
- Improving documentation or examples
- Cleaning up code or refactors
- UI and UX improvements
- Adding or improving tests

If something feels awkward when you use the extension, that’s probably a good place to contribute.

## Getting Started

### Fork and clone

Fork the repo on GitHub, then clone your fork:

```bash
git clone https://github.com/carlosiborra/ralphban.git
cd ralphban
```

### Install dependencies

```bash
pnpm install
```

### Create a branch

Use a descriptive branch name:

```bash
git checkout -b feature/short-description
# or
git checkout -b fix/bug-description
```

## Development Workflow

### Running the extension

1. Open the project in VS Code
2. Press F5
3. A new Extension Development Host window will open
4. Test your changes there

This is the fastest feedback loop. Use it constantly.

### Watch mode

Automatically recompile on changes:

```bash
pnpm run watch
```

### Linting

```bash
pnpm run lint
pnpm run lint -- --fix
```

### Tests

```bash
pnpm test
```

Tests are appreciated, but clarity beats coverage. If a test makes the intent clearer, add it.

## Code Style and Expectations

This project favors readability and explicitness over cleverness.

### TypeScript

- Strict mode is on for a reason
- Prefer `const` over `let`
- Avoid `any`
- Name things clearly
- Keep public APIs obvious

Example:

```ts
// Good
export async function parseTaskFile(uri: vscode.Uri): Promise<TaskFile> {
  // ...
}

// Bad
export async function parse(u: any) {
  // ...
}
```

### File structure

```
src/
├── extension.ts          Entry point and activation
├── types.ts              Shared TypeScript types
├── messageHandler.ts     Message routing and extension-side logic
├── fileScanner.ts        Workspace task file discovery
├── jsonParser.ts         Schema validation with AJV
├── fileWriter.ts         Atomic file writes
├── kanbanPanel.ts        Panel management and view provider
├── kanbanViewProvider.ts Webview construction and messaging
├── webview/
│   ├── kanban.html       Main HTML structure
│   ├── kanban.css        All styling and animations
│   ├── kanban.js         Webpack entry point
│   ├── renderer.js       Board rendering logic
│   ├── dom.js            DOM element exports
│   ├── events.js         Event listener setup
│   ├── state.js          State management
│   ├── task-utils.js     Task utilities and filtering
│   ├── form.js           Task form handling
│   └── fileWatcher.ts    (not present in webview)
```

The webview is bundled as a single module. UI logic is split across focused files for maintainability.

### Naming

- Files: camelCase
- Classes: PascalCase
- Functions: camelCase
- Constants: UPPER_SNAKE_CASE
- Interfaces: PascalCase

## Testing Expectations

### Unit tests

Focus on logic, not UI.

```ts
test("parseTaskFile validates schema", async () => {
  const uri = vscode.Uri.file("/path/to/test.json");
  const result = await parseTaskFile(uri);
  expect(result.tasks).toBeDefined();
});
```

### Manual testing checklist

Before opening a PR, sanity check:

- Dragging tasks between columns
- Creating, editing, deleting tasks
- Search and filters (including no-results state with Clear Filters button)
- Markdown rendering
- Editing JSON directly and seeing updates
- Multiple boards in one workspace
- Handling invalid JSON gracefully

If something breaks, document it in the PR.

## Submitting Changes

### Commit messages

Use Conventional Commits. Keep them honest and boring.

```text
feat(ui): add priority color to cards
fix(parser): handle missing description
docs(readme): clarify setup
chore(deps): bump marked
```

Types:

- feat
- fix
- docs
- refactor
- test
- chore

### Pull requests

Before opening a PR:

```bash
git fetch upstream
git rebase upstream/main
```

Then push and open the PR.

Good PRs:

- Explain why the change exists
- Link related issues
- Include screenshots or GIFs for UI changes
- Keep scope small

PR title examples:

```text
feat: support custom column colors
fix: prevent duplicate task IDs
docs: clarify schema examples
```

## Bug Reports

Good bug reports save time.

Please include:

- VS Code version
- Extension version
- OS
- Clear reproduction steps
- Expected vs actual behavior
- Logs from Output → Ralphban
- A minimal JSON example if relevant

## Feature Requests

Feature requests should answer one question:

What problem does this solve?

Include:

- The problem
- The proposed solution
- Alternatives you considered
- Any examples or references

## Architecture Overview

### Extension host

```
extension.ts
  Commands and activation

kanbanPanel.ts
  Panel lifecycle and view provider management

kanbanViewProvider.ts
  Webview HTML construction and message handling

messageHandler.ts
  Message routing, task operations, and file I/O

fileScanner.ts
  Workspace task file discovery

jsonParser.ts
  Schema validation with AJV

fileWriter.ts
  Atomic file writes with backup
```

### Webview

The webview is structured as a modular ESM codebase:

```
kanban.html
  Main HTML structure with modal and templates

kanban.css
  All styling, including no-results state

kanban.js
  Entry point that imports all modules

renderer.js
  Board and column rendering, task card creation

dom.js
  DOM element references and exports

events.js
  Search, filter, and button event listeners

state.js
  Central state management and filter state

task-utils.js
  Task filtering, status utilities, and validations

form.js
  Task form modal handling and validation
```

### Message flow

```
Webview (renderer.js)
  → postMessage (action, data)
  → Extension host (messageHandler.ts)
  → File update (fileWriter.ts)
  → File watcher notification
  → postMessage back (updated tasks)
  → Webview rerender
```

No hidden state. The file is the source of truth.

## Communication

- GitHub Issues for bugs and features
- GitHub Discussions for questions and ideas
- Pull Requests for code

If something is unclear, open a discussion. That is better than guessing.

## Good First Issues

Look for issues tagged `good-first-issue`. Documentation, UI polish, and error handling are great starting points.

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

### Building & Packaging

To compile TypeScript and create a `.vsix` package for distribution:

```bash
# Compile TypeScript
pnpm run compile

# Package the extension
pnpm exec vsce package --no-dependencies
```

The resulting `ralphban-X.X.X.vsix` file can be installed in VS Code via:

- **Extensions**: `...` menu → "Install from VSIX"
- **Command Palette**: "Extensions: Install from VSIX"

> **Note**: This is a pnpm project. Use `pnpm install` instead of `npm install`.

### Architecture at a Glance

```
Extension Host (Backend)          Webview (Frontend)
┌─────────────────────┐          ┌─────────────────┐
│ extension.ts        │          │ kanban.html     │
│   ├─ Commands       │          │ kanban.css      │
│   └─ Event handlers │◄────────►│ kanban.js       │
│                     │          │                 │
│ messageHandler.ts   │  Message │ dom.js          │ DOM element refs
│   ├─ CRUD ops       │  Passing │ state.js        │ State management
│   └─ File I/O       │◄────────►│ task-utils.js   │ Task utilities
│                     │          │ renderer.js     │ Rendering
│ fileScanner.ts      │          │ form.js         │ Forms
│ jsonParser.ts       │          │ events.js       │ Event listeners
│ fileWriter.ts       │          └─────────────────┘
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

| File                        | Purpose                                   |
| :-------------------------- | :---------------------------------------- |
| `src/extension.ts`          | Entry point, command registration         |
| `src/types.ts`              | TypeScript interfaces and data structures |
| `src/messageHandler.ts`     | Business logic and CRUD operations        |
| `src/webview/`              | Frontend UI modules                       |
| `src/webview/dom.js`        | DOM element references and exports        |
| `src/webview/state.js`      | State management (tasks, filters)         |
| `src/webview/task-utils.js` | Task utilities and filtering              |
| `src/webview/renderer.js`   | Board rendering and task cards            |
| `src/webview/form.js`       | Task form handling and submission         |
| `src/webview/events.js`     | Event listeners and message handling      |
| `schemas/task-schema.json`  | JSON Schema for task validation           |

### Troubleshooting

- **Extension doesn't activate**: Check the "Ralphban" channel in the Output view (`View → Output`).
- **Webview is blank**: Open "Developer: Open Webview Developer Tools" from the Command Palette (`Cmd+Shift+P`) to check for frontend errors.
- **Build issues**: Ensure you've run `pnpm install` and `pnpm run compile`.

## Code of Conduct

Be respectful. Be constructive. Assume good intent.

## Thanks

If you’re contributing, you’re already making this better. I appreciate it.

If you have questions, open a discussion on GitHub.
