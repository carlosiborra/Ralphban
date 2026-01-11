# Changelog

All notable changes to the Ralphban extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-01-11

### Added

- ✨ Initial release of Ralphban
- 📋 Visual Kanban board for JSON task files
- 🎨 Drag-and-drop task management between columns (Pending, In Progress, Completed, Cancelled)
- 🔍 Real-time search and filter functionality
  - Search by task description or step content
  - Filter by category (frontend, backend, database, etc.)
  - Filter by priority (high, medium, low)
  - Combined filters support
- ✏️ Full CRUD operations
  - Create new tasks with inline forms
  - Edit existing tasks
  - Delete tasks with confirmation
  - Update task status via drag-and-drop
- 🔄 Real-time file synchronization
  - Instant updates when JSON file changes
  - Bidirectional sync between UI and file
  - File watcher for external edits
- 📁 Multi-board management
  - Sidebar view listing all task files
  - Support for multiple boards in one workspace
  - Quick switching between boards
- ⚙️ Configurable file patterns
  - Default patterns: `*.prd.json`, `tasks.json`
  - User-configurable via settings
  - Smart file detection
- 🎯 Task properties
  - Categories: Frontend, Backend, Database, Testing, Documentation, Infrastructure, Security, Functional
  - Status tracking
  - Priority levels
  - Dependencies visualization
  - Step-by-step task breakdown
- 🛡️ JSON Schema validation
  - Automatic validation with AJV
  - Helpful error messages
  - Schema documentation included
- 🎨 Polished UI
  - Smooth animations
  - Responsive design
  - Intuitive drag-and-drop
  - Modal-based editing
- 📊 Task statistics
  - Total task count
  - Completion percentage
  - Filter-aware stats

---

## Version History Format

- **Added** for new features
- **Changed** for changes in existing functionality
- **Deprecated** for soon-to-be removed features
- **Removed** for now removed features
- **Fixed** for any bug fixes
- **Security** in case of vulnerabilities
