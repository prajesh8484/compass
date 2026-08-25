use rusqlite::Connection;
use tauri::State;
use std::sync::Mutex;
use uuid::Uuid;
use chrono::Utc;

use crate::models::{Settings, Project, CreateProjectPayload, UpdateProjectPayload};

pub type DbState = Mutex<Connection>;

// ─────────────────────────────────────────
// Settings
// ─────────────────────────────────────────

#[tauri::command]
pub fn get_settings(db: State<DbState>) -> Result<Settings, String> {
    let conn = db.lock().map_err(|e| e.to_string())?;
    let last_active_project_id: String = conn
        .query_row("SELECT value FROM settings WHERE key = 'last_active_project_id'", [], |r| r.get(0))
        .unwrap_or_default();
    let has_completed_onboarding: Option<String> = conn
        .query_row("SELECT value FROM settings WHERE key = 'has_completed_onboarding'", [], |r| r.get(0))
        .ok();
    Ok(Settings { last_active_project_id, has_completed_onboarding })
}

#[tauri::command]
pub fn set_setting(db: State<DbState>, key: String, value: String) -> Result<(), String> {
    let conn = db.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "INSERT INTO settings (key, value) VALUES (?1, ?2)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value",
        rusqlite::params![key, value],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

// ─────────────────────────────────────────
// Projects
// ─────────────────────────────────────────

#[tauri::command]
pub fn get_projects(db: State<DbState>) -> Result<Vec<Project>, String> {
    let conn = db.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare(
            "SELECT id, name, folder_path, color, created_at, last_active_at, health_score
             FROM projects
             ORDER BY last_active_at DESC",
        )
        .map_err(|e| e.to_string())?;

    let projects: Result<Vec<Project>, _> = stmt
        .query_map([], |row| {
            Ok(Project {
                id: row.get(0)?,
                name: row.get(1)?,
                folder_path: row.get(2)?,
                color: row.get(3)?,
                created_at: row.get(4)?,
                last_active_at: row.get(5)?,
                health_score: row.get(6)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect();

    projects.map_err(|e| e.to_string())
}

#[tauri::command]
pub fn create_project(db: State<DbState>, payload: CreateProjectPayload) -> Result<Project, String> {
    let conn = db.lock().map_err(|e| e.to_string())?;
    let id = Uuid::new_v4().to_string();
    let now = Utc::now().to_rfc3339();
    let color = payload.color.unwrap_or_else(|| "#5b8dee".to_string());

    conn.execute(
        "INSERT INTO projects (id, name, folder_path, color, created_at, last_active_at, health_score)
         VALUES (?1, ?2, ?3, ?4, ?5, ?5, 0)",
        rusqlite::params![id, payload.name, payload.folder_path, color, now],
    )
    .map_err(|e| e.to_string())?;

    Ok(Project {
        id,
        name: payload.name,
        folder_path: payload.folder_path,
        color,
        created_at: now.clone(),
        last_active_at: now,
        health_score: 0,
    })
}

#[tauri::command]
pub fn update_project(db: State<DbState>, payload: UpdateProjectPayload) -> Result<(), String> {
    let conn = db.lock().map_err(|e| e.to_string())?;
    let now = Utc::now().to_rfc3339();

    if let Some(name) = &payload.name {
        conn.execute("UPDATE projects SET name = ?1 WHERE id = ?2", rusqlite::params![name, payload.id])
            .map_err(|e| e.to_string())?;
    }
    if let Some(color) = &payload.color {
        conn.execute("UPDATE projects SET color = ?1 WHERE id = ?2", rusqlite::params![color, payload.id])
            .map_err(|e| e.to_string())?;
    }
    if let Some(score) = payload.health_score {
        conn.execute("UPDATE projects SET health_score = ?1 WHERE id = ?2", rusqlite::params![score, payload.id])
            .map_err(|e| e.to_string())?;
    }
    let last_active = payload.last_active_at.as_deref().unwrap_or(&now);
    conn.execute("UPDATE projects SET last_active_at = ?1 WHERE id = ?2", rusqlite::params![last_active, payload.id])
        .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub fn delete_project(db: State<DbState>, id: String) -> Result<(), String> {
    let conn = db.lock().map_err(|e| e.to_string())?;
    // Tasks cascade delete via FK
    conn.execute("DELETE FROM projects WHERE id = ?1", rusqlite::params![id])
        .map_err(|e| e.to_string())?;
    Ok(())
}
