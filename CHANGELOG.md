# Changelog

This file documents notable changes to Ralphban.

The format loosely follows Keep a Changelog and versioning follows Semantic Versioning. Entries focus on what actually matters to users and contributors.

## [1.0.0] – 2026-01-11

Initial release.

### Added

- First public version of Ralphban
- Visual Kanban board rendered directly from JSON task files
- Four fixed task states: `pending`, `in_progress`, `completed`, `cancelled`
- Drag and drop to move tasks between states
- Inline editing of tasks without breaking the underlying file
- Create and delete tasks from the UI
- Real-time sync between the board and the JSON file
  - File watcher picks up external edits
  - UI changes write back immediately

- Sidebar view listing all detected task files in the workspace
- Support for multiple boards in a single workspace
- Configurable file patterns for task discovery
- Search across task descriptions and steps
- Filtering by category and priority (filters can be combined)
- Markdown rendering for task descriptions and steps
- Basic task metadata
  - Category
  - Priority
  - Dependencies
  - Step-by-step breakdown

- JSON schema validation using AJV
  - Clear validation errors when files are malformed

- Simple, local-only architecture
  - No backend
  - No telemetry
  - No hidden state

---

## Changelog Conventions

- **Added**: new features or capabilities
- **Changed**: behavior changes
- **Fixed**: bug fixes
- **Deprecated**: features planned for removal
- **Removed**: features that were removed
- **Security**: security-related changes

---

If you want, I can also:

- add an “Unreleased” section
- make future entries more concise
- align it tightly with Conventional Commits output
