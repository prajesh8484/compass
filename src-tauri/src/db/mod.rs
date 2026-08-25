use rusqlite::{Connection, Result};

const SCHEMA: &str = include_str!("schema.sql");

/// Opens (or creates) the Compass SQLite database and runs all migrations.
/// The database file lives in the app's data directory.
pub fn initialize(db_path: &str) -> Result<Connection> {
    let conn = Connection::open(db_path)?;
    conn.execute_batch(SCHEMA)?;

    // Migration: Ensure 'section' column exists on 'tasks' table
    let has_section: bool = conn
        .prepare("PRAGMA table_info(tasks)")?
        .query_map([], |row| row.get::<_, String>(1))?
        .filter_map(|r| r.ok())
        .any(|col| col == "section");

    if !has_section {
        conn.execute("ALTER TABLE tasks ADD COLUMN section TEXT NOT NULL DEFAULT 'General'", [])?;
    }

    Ok(conn)
}
