# Compass

Compass is a small, premium, local-first desktop application designed to answer one question: *"What should I work on right now?"*

It uses a deterministic, transparent Priority Engine to rank your tasks across all your projects. It runs offline and stores everything in an embedded SQLite database on your machine — no accounts, no cloud, no network.

## Features

- **Local-First:** All data lives in a local SQLite database you own and can export anytime.
- **Priority Engine:** Computes priority scores based on deadline, importance, estimated time, and aging.
- **Focus Mode:** Always highlights the single most important, unblocked task.
- **Keyboard-First:** Navigate everything through the Command Palette (`Ctrl+K`) and quick-switch with `Ctrl+1–5`.
- **Premium Design:** A distraction-free, elegant dark mode UI.

## Technology Stack

- **Desktop Shell:** Tauri v2
- **Frontend:** React 19 + TypeScript + Vite + TailwindCSS v4
- **State Management:** Zustand
- **Database:** Embedded SQLite (single file, full data ownership)
- **Export:** JSON backups and Markdown summaries on demand

## Quick Start

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run the application in development mode:
   ```bash
   npm run tauri dev
   ```

3. Create a project, add tasks, and let the Priority Engine decide what to work on.

## Architecture & Contribution

Compass is built to last. We prioritize maintainability first, beauty second, and features last. 

If you'd like to contribute, please read [CONTRIBUTING.md](CONTRIBUTING.md).

## Modifying the Priority Engine

The Priority Engine is highly configurable. If you want to change how tasks are scored (e.g., heavily penalize overdue tasks, or increase the bonus for quick wins), simply modify `src/config/priorityConfig.ts`. The core engine logic (`src/lib/priorityEngine.ts`) should remain untouched unless you are adding a completely new scoring axis.
