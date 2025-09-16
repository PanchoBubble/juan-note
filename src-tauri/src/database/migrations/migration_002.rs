use rusqlite::Connection;

pub fn up(conn: &Connection) -> rusqlite::Result<()> {
    // Add deadline column
    conn.execute(
        "ALTER TABLE notes ADD COLUMN deadline INTEGER",
        [],
    )?;

    // Add reminder_minutes column
    conn.execute(
        "ALTER TABLE notes ADD COLUMN reminder_minutes INTEGER DEFAULT 0",
        [],
    )?;

    Ok(())
}