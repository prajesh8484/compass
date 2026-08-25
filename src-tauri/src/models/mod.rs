use serde::{Deserialize, Serialize};

// ─────────────────────────────────────────
// Project
// ─────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Project {
    pub id: String,
    pub name: String,
    pub folder_path: String,
    pub color: String,
    pub created_at: String,
    pub last_active_at: String,
    pub health_score: i32,
}

#[derive(Debug, Deserialize)]
pub struct CreateProjectPayload {
    pub name: String,
    pub folder_path: String,
    pub color: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateProjectPayload {
    pub id: String,
    pub name: Option<String>,
    pub color: Option<String>,
    pub last_active_at: Option<String>,
    pub health_score: Option<i32>,
}

// ─────────────────────────────────────────
// Task
// ─────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Task {
    pub id: String,
    pub project_id: String,
    pub section: String,
    pub title: String,
    pub description: String,
    pub status: String,
    pub importance: i32,
    pub deadline: Option<String>,
    pub estimated_minutes: Option<i32>,
    pub difficulty: String,
    pub manual_boost: bool,
    pub pinned: bool,
    pub archived: bool,
    pub created_at: String,
    pub updated_at: String,
    pub completed_at: Option<String>,
    pub last_worked_at: Option<String>,
    /// IDs of tasks this task depends on
    pub depends_on: Vec<String>,
}

#[derive(Debug, Deserialize)]
pub struct CreateTaskPayload {
    pub project_id: String,
    pub section: Option<String>,
    pub title: String,
    pub description: Option<String>,
    pub importance: Option<i32>,
    pub deadline: Option<String>,
    pub estimated_minutes: Option<i32>,
    pub difficulty: Option<String>,
    pub depends_on: Option<Vec<String>>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateTaskPayload {
    pub id: String,
    pub section: Option<String>,
    pub title: Option<String>,
    pub description: Option<String>,
    pub status: Option<String>,
    pub importance: Option<i32>,
    pub deadline: Option<String>,
    pub estimated_minutes: Option<i32>,
    pub difficulty: Option<String>,
    pub manual_boost: Option<bool>,
    pub pinned: Option<bool>,
    pub depends_on: Option<Vec<String>>,
}

// ─────────────────────────────────────────
// Settings
// ─────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Settings {
    pub last_active_project_id: String,
    pub has_completed_onboarding: Option<String>,
}
