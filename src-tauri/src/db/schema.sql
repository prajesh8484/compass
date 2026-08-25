-- Compass SQLite Schema
-- Version: 1
-- NOTE: SQLite is an index/metadata cache. Markdown files are the source of truth.

PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

-- ─────────────────────────────────────────
-- Settings
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS settings (
    key   TEXT PRIMARY KEY NOT NULL,
    value TEXT NOT NULL
);

-- settings
INSERT OR IGNORE INTO settings (key, value) VALUES ('last_active_project_id', '');
INSERT OR IGNORE INTO settings (key, value) VALUES ('schema_version', '1');

-- ─────────────────────────────────────────
-- Projects
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS projects (
    id             TEXT PRIMARY KEY NOT NULL,   -- UUID
    name           TEXT NOT NULL,
    folder_path    TEXT NOT NULL UNIQUE,         -- absolute path to project folder
    color          TEXT NOT NULL DEFAULT '#5b8dee',
    created_at     TEXT NOT NULL,                -- ISO 8601
    last_active_at TEXT NOT NULL,
    health_score   INTEGER NOT NULL DEFAULT 0   -- 0=healthy, 5/12/20/30
);

CREATE INDEX IF NOT EXISTS idx_projects_last_active ON projects(last_active_at DESC);

-- ─────────────────────────────────────────
-- Tasks
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tasks (
    id               TEXT PRIMARY KEY NOT NULL,  -- UUID
    project_id       TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    section          TEXT NOT NULL DEFAULT 'General',
    title            TEXT NOT NULL,
    description      TEXT NOT NULL DEFAULT '',
    status           TEXT NOT NULL DEFAULT 'todo'
                         CHECK(status IN ('todo', 'in_progress', 'done', 'archived')),

    -- User-assigned signals
    importance       INTEGER NOT NULL DEFAULT 5 CHECK(importance BETWEEN 1 AND 10),
    deadline         TEXT,                        -- ISO 8601 date or NULL
    estimated_minutes INTEGER,                    -- NULL means unknown
    difficulty       TEXT NOT NULL DEFAULT 'medium'
                         CHECK(difficulty IN ('easy', 'medium', 'hard', 'very_hard')),
    manual_boost     INTEGER NOT NULL DEFAULT 0 CHECK(manual_boost IN (0, 1)),
    pinned           INTEGER NOT NULL DEFAULT 0 CHECK(pinned IN (0, 1)),
    archived         INTEGER NOT NULL DEFAULT 0 CHECK(archived IN (0, 1)),

    -- Timestamps
    created_at       TEXT NOT NULL,
    updated_at       TEXT NOT NULL,
    completed_at     TEXT,
    last_worked_at   TEXT
);

CREATE INDEX IF NOT EXISTS idx_tasks_project     ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_section     ON tasks(project_id, section);
CREATE INDEX IF NOT EXISTS idx_tasks_status      ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_deadline    ON tasks(deadline ASC) WHERE deadline IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_pinned      ON tasks(pinned DESC, created_at DESC);

-- ─────────────────────────────────────────
-- Task Dependencies
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS task_dependencies (
    task_id        TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    depends_on_id  TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    PRIMARY KEY (task_id, depends_on_id),
    CHECK (task_id != depends_on_id)
);

-- ─────────────────────────────────────────
-- Tags (optional, future use)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tags (
    id   TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS task_tags (
    task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    tag_id  TEXT NOT NULL REFERENCES tags(id)  ON DELETE CASCADE,
    PRIMARY KEY (task_id, tag_id)
);
