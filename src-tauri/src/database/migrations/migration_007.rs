use rusqlite::Connection;

pub fn up(conn: &Connection) -> rusqlite::Result<()> {
    // Add section column to notes table for organizing notes into sections/tabs
    conn.execute(
        "ALTER TABLE notes ADD COLUMN section TEXT DEFAULT 'unset'",
        [],
    )?;

    // Create index for performance when filtering notes by section
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_notes_section ON notes(section)",
        [],
    )?;

    Ok(())
}