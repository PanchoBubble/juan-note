use rusqlite::Connection;

pub fn up(conn: &Connection) -> rusqlite::Result<()> {
    // Add order column to notes table for custom drag-and-drop ordering
    conn.execute(
        "ALTER TABLE notes ADD COLUMN \"order\" INTEGER DEFAULT 0",
        [],
    )?;

    // Create index for performance when ordering by custom order
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_notes_order ON notes(\"order\")",
        [],
    )?;

    // Set initial order values based on current updated_at order to preserve existing sorting
    // This ensures existing notes maintain their current relative order
    conn.execute(
        "
        WITH ordered_notes AS (
            SELECT id, ROW_NUMBER() OVER (ORDER BY updated_at DESC) - 1 as new_order
            FROM notes
        )
        UPDATE notes
        SET \"order\" = (SELECT new_order FROM ordered_notes WHERE ordered_notes.id = notes.id)
        ",
        [],
    )?;

    Ok(())
}