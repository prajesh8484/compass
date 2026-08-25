# Contributing to Compass

First off, thank you for considering contributing to Compass! Compass is built to be a small, premium, local-first tool that stays elegant as it grows rather than accumulating complexity.

## Development Setup

1. **Prerequisites**
   - Node.js (v18+)
   - Rust (latest stable)
   - Tauri v2 CLI requirements

2. **Installation**
   ```bash
   npm install
   ```

3. **Running Locally**
   ```bash
   npm run tauri dev
   ```

## Architectural Guidelines

**Key Rules:**
1. **No feature should depend directly on another feature.**
2. **Derived data is never persisted.** (e.g., Priority Scores)
3. **SQLite is the single source of truth.** Markdown exists only as an explicit export format.
4. **Build for scale.** (100,000 tasks)

## Module Boundaries

- **UI** (React Views/Components) -> **Services** -> **Repositories** -> **Storage**
- Ensure all modules are exported through their respective `index.ts` files (barrel files).
- Keep the `priorityEngine` pure. Never import React or Tauri into it.

## Pull Request Process

1. Ensure all tests pass: `npm test`
2. Ensure there are no type errors: `npm run typecheck`
3. Check for circular dependencies.
4. Keep PRs focused on a single concern.
5. If changing the Priority Engine, modify `src/config/priorityConfig.ts` rather than the logic in `priorityEngine.ts` whenever possible.
