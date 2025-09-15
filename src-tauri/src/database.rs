use rusqlite::{Connection, Result};
use std::path::Path;
use std::sync::{Arc, Mutex};

pub type DbConnection = Arc<Mutex<Connection>>;

pub fn establish_connection() -> Result<DbConnection> {
    let db_path = get_database_path();
    let conn = Connection::open(&db_path)?;

    // Enable WAL mode for better concurrency
    conn.pragma_update(None, "journal_mode", "WAL")?;
    conn.pragma_update(None, "synchronous", "NORMAL")?;
    conn.pragma_update(None, "cache_size", -64000)?; // 64MB cache
    conn.pragma_update(None, "foreign_keys", "ON")?;

    Ok(Arc::new(Mutex::new(conn)))
}

pub fn get_database_path() -> String {
    let app_dir = tauri::api::path::app_data_dir(&tauri::Config::default())
        .expect("Failed to get app data directory");
    app_dir.join("notes.db").to_string_lossy().to_string()
}

pub fn initialize_database(conn: &DbConnection) -> Result<()> {
    let conn = conn.lock().unwrap();

    conn.execute(
        "CREATE TABLE IF NOT EXISTS notes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            priority INTEGER DEFAULT 0,
            labels TEXT DEFAULT '[]'
        )",
        [],
    )?;

    // Create indexes for better performance
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_notes_created_at ON notes(created_at)",
        [],
    )?;

    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_notes_priority ON notes(priority)",
        [],
    )?;

    // Create FTS table for full-text search
    conn.execute(
        "CREATE VIRTUAL TABLE IF NOT EXISTS notes_fts USING fts5(
            title, content,
            content=notes,
            content_rowid=id
        )",
        [],
    )?;

    // Create triggers to keep FTS table in sync
    conn.execute(
        "CREATE TRIGGER IF NOT EXISTS notes_fts_insert AFTER INSERT ON notes
         BEGIN
             INSERT INTO notes_fts(rowid, title, content) VALUES (new.id, new.title, new.content);
         END",
        [],
    )?;

    conn.execute(
        "CREATE TRIGGER IF NOT EXISTS notes_fts_delete AFTER DELETE ON notes
         BEGIN
             DELETE FROM notes_fts WHERE rowid = old.id;
         END",
        [],
    )?;

    conn.execute(
        "CREATE TRIGGER IF NOT EXISTS notes_fts_update AFTER UPDATE ON notes
         BEGIN
             UPDATE notes_fts SET title = new.title, content = new.content WHERE rowid = new.id;
         END",
        [],
    )?;

    Ok(())
}