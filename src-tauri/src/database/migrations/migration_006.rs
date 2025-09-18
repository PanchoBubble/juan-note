use rusqlite::Connection;

pub fn up(conn: &Connection) -> rusqlite::Result<()> {
    // Convert TEXT timestamps to INTEGER timestamps for notes table
    // First, create temporary columns (only if they don't exist)
    let _ = conn.execute(
        "ALTER TABLE notes ADD COLUMN created_at_temp INTEGER",
        [],
    ); // Ignore error if column already exists

    let _ = conn.execute(
        "ALTER TABLE notes ADD COLUMN updated_at_temp INTEGER",
        [],
    ); // Ignore error if column already exists

    let _ = conn.execute(
        "ALTER TABLE notes ADD COLUMN deadline_temp INTEGER",
        [],
    ); // Ignore error if column already exists

    // Convert TEXT timestamps to INTEGER timestamps
    // For notes that have TEXT timestamps, convert them
    conn.execute(
        "
        UPDATE notes
        SET created_at_temp = CASE
            WHEN typeof(created_at) = 'text' THEN strftime('%s', created_at)
            ELSE created_at
        END,
        updated_at_temp = CASE
            WHEN typeof(updated_at) = 'text' THEN strftime('%s', updated_at)
            ELSE updated_at
        END,
        deadline_temp = CASE
            WHEN typeof(deadline) = 'text' AND deadline IS NOT NULL THEN strftime('%s', deadline)
            ELSE deadline
        END
        ",
        [],
    )?;

    // Drop old columns and rename temp columns (only if they exist)
    let _ = conn.execute("ALTER TABLE notes DROP COLUMN created_at", []); // Ignore error if column doesn't exist
    let _ = conn.execute("ALTER TABLE notes DROP COLUMN updated_at", []); // Ignore error if column doesn't exist
    let _ = conn.execute("ALTER TABLE notes DROP COLUMN deadline", []); // Ignore error if column doesn't exist

    let _ = conn.execute("ALTER TABLE notes RENAME COLUMN created_at_temp TO created_at", []); // Ignore error if column doesn't exist
    let _ = conn.execute("ALTER TABLE notes RENAME COLUMN updated_at_temp TO updated_at", []); // Ignore error if column doesn't exist
    let _ = conn.execute("ALTER TABLE notes RENAME COLUMN deadline_temp TO deadline", []); // Ignore error if column doesn't exist

    // Convert TEXT timestamps to INTEGER timestamps for states table
    // First, create temporary columns (only if they don't exist)
    let _ = conn.execute(
        "ALTER TABLE states ADD COLUMN created_at_temp INTEGER",
        [],
    ); // Ignore error if column already exists

    let _ = conn.execute(
        "ALTER TABLE states ADD COLUMN updated_at_temp INTEGER",
        [],
    ); // Ignore error if column already exists

    // Convert TEXT timestamps to INTEGER timestamps
    conn.execute(
        "
        UPDATE states
        SET created_at_temp = CASE
            WHEN typeof(created_at) = 'text' THEN strftime('%s', created_at)
            ELSE created_at
        END,
        updated_at_temp = CASE
            WHEN typeof(updated_at) = 'text' THEN strftime('%s', updated_at)
            ELSE updated_at
        END
        ",
        [],
    )?;

    // Drop old columns and rename temp columns (only if they exist)
    let _ = conn.execute("ALTER TABLE states DROP COLUMN created_at", []); // Ignore error if column doesn't exist
    let _ = conn.execute("ALTER TABLE states DROP COLUMN updated_at", []); // Ignore error if column doesn't exist

    let _ = conn.execute("ALTER TABLE states RENAME COLUMN created_at_temp TO created_at", []); // Ignore error if column doesn't exist
    let _ = conn.execute("ALTER TABLE states RENAME COLUMN updated_at_temp TO updated_at", []); // Ignore error if column doesn't exist

    Ok(())
}