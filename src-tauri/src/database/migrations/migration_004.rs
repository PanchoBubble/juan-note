use rusqlite::Connection;

pub fn up(conn: &Connection) -> rusqlite::Result<()> {
    // Create states table for dynamic kanban columns
    conn.execute(
        "CREATE TABLE IF NOT EXISTS states (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            position INTEGER NOT NULL,
            color TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )",
        [],
    )?;

    // Add state_id foreign key to notes table
    conn.execute(
        "ALTER TABLE notes ADD COLUMN state_id INTEGER REFERENCES states(id)",
        [],
    )?;

    // Create indexes for performance
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_states_position ON states(position)",
        [],
    )?;

    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_notes_state_id ON notes(state_id)",
        [],
    )?;

    // Insert default states
    conn.execute(
        "INSERT INTO states (name, position, color) VALUES
         ('To Do', 0, '#75715E'),
         ('In Progress', 1, '#66D9EF'),
         ('Done', 2, '#A6E22E')",
        [],
    )?;

    Ok(())
}