use rusqlite::Connection;

pub fn up(conn: &Connection) -> rusqlite::Result<()> {
    // Create notes table
    conn.execute(
        "CREATE TABLE IF NOT EXISTS notes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            created_at INTEGER DEFAULT (strftime('%s', 'now')),
            updated_at INTEGER DEFAULT (strftime('%s', 'now')),
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