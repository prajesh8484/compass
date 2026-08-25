use rusqlite::Connection;
use tauri::State;
use uuid::Uuid;
use chrono::Utc;

use crate::commands::projects::DbState;
use crate::models::{Task, CreateTaskPayload, UpdateTaskPayload};

fn load_depends_on(conn: &Connection, task_id: &str) -> Vec<String> {
    let mut stmt = conn
        .prepare("SELECT depends_on_id FROM task_dependencies WHERE task_id = ?1")
        .unwrap();
    stmt.query_map(rusqlite::params![task_id], |r| r.get(0))
        .unwrap()
        .filter_map(|r| r.ok())
        .collect()
}

fn row_to_task(row: &rusqlite::Row, conn: &Connection) -> rusqlite::Result<Task> {
    let id: String = row.get(0)?;
    let depends_on = load_depends_on(conn, &id);
    Ok(Task {
        id: id.clone(),
        project_id: row.get(1)?,
        section: row.get(2)?,
        title: row.get(3)?,
        description: row.get(4)?,
        status: row.get(5)?,
        importance: row.get(6)?,
        deadline: row.get(7)?,
        estimated_minutes: row.get(8)?,
        difficulty: row.get(9)?,
        manual_boost: row.get::<_, i32>(10)? != 0,
        pinned: row.get::<_, i32>(11)? != 0,
        archived: row.get::<_, i32>(12)? != 0,
        created_at: row.get(13)?,
        updated_at: row.get(14)?,
        completed_at: row.get(15)?,
        last_worked_at: row.get(16)?,
        depends_on,
    })
}

// SQLite only stores source data — no priority_score, no score_computed_at.
// Ordering by created_at here; the Priority Engine computes and sorts in memory.
const TASK_SELECT: &str =
    "SELECT id, project_id, section, title, description, status, importance, deadline,
            estimated_minutes, difficulty, manual_boost, pinned, archived,
            created_at, updated_at, completed_at, last_worked_at
     FROM tasks";

// ─────────────────────────────────────────
// Read
// ─────────────────────────────────────────

#[tauri::command]
pub fn get_tasks(db: State<DbState>, project_id: Option<String>) -> Result<Vec<Task>, String> {
    let conn = db.lock().map_err(|e| e.to_string())?;

    let sql = if project_id.is_some() {
        format!("{} WHERE project_id = ?1 ORDER BY pinned DESC, created_at DESC", TASK_SELECT)
    } else {
        format!("{} ORDER BY pinned DESC, created_at DESC", TASK_SELECT)
    };

    let mut stmt = conn.prepare(&sql).map_err(|e| e.to_string())?;

    let tasks_result: Result<Vec<Task>, _> = if let Some(pid) = project_id {
        stmt.query_map(rusqlite::params![pid], |row| row_to_task(row, &conn))
            .map_err(|e| e.to_string())?
            .collect()
    } else {
        stmt.query_map([], |row| row_to_task(row, &conn))
            .map_err(|e| e.to_string())?
            .collect()
    };

    tasks_result.map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_active_tasks(db: State<DbState>) -> Result<Vec<Task>, String> {
    let conn = db.lock().map_err(|e| e.to_string())?;
    // Return all non-archived, non-done tasks; Priority Engine sorts in memory.
    let sql = format!(
        "{} WHERE status IN ('todo', 'in_progress') AND archived = 0
         ORDER BY pinned DESC, created_at DESC",
        TASK_SELECT
    );
    let mut stmt = conn.prepare(&sql).map_err(|e| e.to_string())?;
    let tasks: Result<Vec<Task>, _> = stmt
        .query_map([], |row| row_to_task(row, &conn))
        .map_err(|e| e.to_string())?
        .collect();
    tasks.map_err(|e| e.to_string())
}

// ─────────────────────────────────────────
// Create
// ─────────────────────────────────────────

#[tauri::command]
pub fn create_task(db: State<DbState>, payload: CreateTaskPayload) -> Result<Task, String> {
    let conn = db.lock().map_err(|e| e.to_string())?;
    let id = Uuid::new_v4().to_string();
    let now = Utc::now().to_rfc3339();
    let section = payload.section.unwrap_or_else(|| "General".to_string());
    let importance = payload.importance.unwrap_or(5).clamp(1, 10);
    let difficulty = payload.difficulty.unwrap_or_else(|| "medium".to_string());
    let description = payload.description.unwrap_or_default();

    conn.execute(
        "INSERT INTO tasks (id, project_id, section, title, description, status, importance,
                            deadline, estimated_minutes, difficulty, created_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, 'todo', ?6, ?7, ?8, ?9, ?10, ?10)",
        rusqlite::params![
            id, payload.project_id, section, payload.title, description, importance,
            payload.deadline, payload.estimated_minutes, difficulty, now
        ],
    )
    .map_err(|e| e.to_string())?;

    // Insert dependencies
    if let Some(deps) = &payload.depends_on {
        for dep_id in deps {
            conn.execute(
                "INSERT OR IGNORE INTO task_dependencies (task_id, depends_on_id) VALUES (?1, ?2)",
                rusqlite::params![id, dep_id],
            )
            .map_err(|e| e.to_string())?;
        }
    }

    Ok(Task {
        id: id.clone(),
        project_id: payload.project_id,
        section,
        title: payload.title,
        description,
        status: "todo".to_string(),
        importance,
        deadline: payload.deadline,
        estimated_minutes: payload.estimated_minutes,
        difficulty,
        manual_boost: false,
        pinned: false,
        archived: false,
        created_at: now.clone(),
        updated_at: now,
        completed_at: None,
        last_worked_at: None,
        depends_on: payload.depends_on.unwrap_or_default(),
    })
}

// ─────────────────────────────────────────
// Update
// ─────────────────────────────────────────

#[tauri::command]
pub fn update_task(db: State<DbState>, payload: UpdateTaskPayload) -> Result<(), String> {
    let conn = db.lock().map_err(|e| e.to_string())?;
    let now = Utc::now().to_rfc3339();

    macro_rules! update_field {
        ($field:expr, $col:expr) => {
            if let Some(val) = &$field {
                conn.execute(
                    &format!("UPDATE tasks SET {} = ?1, updated_at = ?2 WHERE id = ?3", $col),
                    rusqlite::params![val, now, payload.id],
                )
                .map_err(|e| e.to_string())?;
            }
        };
    }

    update_field!(payload.section, "section");
    update_field!(payload.title, "title");
    update_field!(payload.description, "description");
    update_field!(payload.status, "status");
    update_field!(payload.importance, "importance");
    update_field!(payload.deadline, "deadline");
    update_field!(payload.estimated_minutes, "estimated_minutes");
    update_field!(payload.difficulty, "difficulty");

    if let Some(boost) = payload.manual_boost {
        let val = if boost { 1 } else { 0 };
        conn.execute(
            "UPDATE tasks SET manual_boost = ?1, updated_at = ?2 WHERE id = ?3",
            rusqlite::params![val, now, payload.id],
        )
        .map_err(|e| e.to_string())?;
    }
    if let Some(pinned) = payload.pinned {
        let val = if pinned { 1 } else { 0 };
        conn.execute(
            "UPDATE tasks SET pinned = ?1, updated_at = ?2 WHERE id = ?3",
            rusqlite::params![val, now, payload.id],
        )
        .map_err(|e| e.to_string())?;
    }

    // Replace dependencies if provided
    if let Some(deps) = &payload.depends_on {
        conn.execute("DELETE FROM task_dependencies WHERE task_id = ?1", rusqlite::params![payload.id])
            .map_err(|e| e.to_string())?;
        for dep_id in deps {
            conn.execute(
                "INSERT OR IGNORE INTO task_dependencies (task_id, depends_on_id) VALUES (?1, ?2)",
                rusqlite::params![payload.id, dep_id],
            )
            .map_err(|e| e.to_string())?;
        }
    }

    Ok(())
}

// ─────────────────────────────────────────
// Status transitions
// ─────────────────────────────────────────

#[tauri::command]
pub fn complete_task(db: State<DbState>, id: String) -> Result<(), String> {
    let conn = db.lock().map_err(|e| e.to_string())?;
    let now = Utc::now().to_rfc3339();
    conn.execute(
        "UPDATE tasks SET status = 'done', completed_at = ?1, updated_at = ?1 WHERE id = ?2",
        rusqlite::params![now, id],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn archive_task(db: State<DbState>, id: String) -> Result<(), String> {
    let conn = db.lock().map_err(|e| e.to_string())?;
    let now = Utc::now().to_rfc3339();
    conn.execute(
        "UPDATE tasks SET archived = 1, status = 'archived', updated_at = ?1 WHERE id = ?2",
        rusqlite::params![now, id],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn pin_task(db: State<DbState>, id: String, pinned: bool) -> Result<(), String> {
    let conn = db.lock().map_err(|e| e.to_string())?;
    let now = Utc::now().to_rfc3339();
    let val = if pinned { 1 } else { 0 };
    conn.execute(
        "UPDATE tasks SET pinned = ?1, updated_at = ?2 WHERE id = ?3",
        rusqlite::params![val, now, id],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn set_last_worked(db: State<DbState>, id: String) -> Result<(), String> {
    let conn = db.lock().map_err(|e| e.to_string())?;
    let now = Utc::now().to_rfc3339();
    conn.execute(
        "UPDATE tasks SET last_worked_at = ?1, status = 'in_progress', updated_at = ?1 WHERE id = ?2",
        rusqlite::params![now, id],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn delete_task(db: State<DbState>, id: String) -> Result<(), String> {
    let conn = db.lock().map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM tasks WHERE id = ?1", rusqlite::params![id])
        .map_err(|e| e.to_string())?;
    Ok(())
}
