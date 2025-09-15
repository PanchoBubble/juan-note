use rusqlite::Connection;

pub fn up(conn: &Connection) -> rusqlite::Result<()> {
    // Add done column to notes table
    conn.execute(
        "ALTER TABLE notes ADD COLUMN done INTEGER DEFAULT 0",
        [],
    )?;

    // Create index for done column for better query performance
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_notes_done ON notes(done)",
        [],
    )?;

    Ok(())
}