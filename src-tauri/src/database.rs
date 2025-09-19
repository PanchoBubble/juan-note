use rusqlite::{Connection, Result};
use std::sync::{Arc, Mutex};

mod migrations;

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
    // Use a path outside the watched directory to prevent rebuild loops
    // Put database in a temp directory during development
    let temp_dir = std::env::temp_dir();
    let db_path = temp_dir.join("juan-note-dev.db");
    db_path.to_string_lossy().to_string()
}

pub fn run_migrations(conn: &DbConnection) -> Result<()> {
    let conn = conn.lock().unwrap();

    // Create migrations table if it doesn't exist
    conn.execute(
        "CREATE TABLE IF NOT EXISTS schema_migrations (
            version INTEGER PRIMARY KEY,
            applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )",
        [],
    )?;

    // Get the latest applied migration version
    let mut stmt = conn.prepare("SELECT COALESCE(MAX(version), 0) FROM schema_migrations")?;
    let latest_version: i32 = stmt.query_row([], |row| row.get(0))?;

    // Define migrations
    let migrations: Vec<(i32, fn(&Connection) -> Result<()>)> = vec![
        (1, migrations::migration_001::up),
        (2, migrations::migration_002::up),
        (3, migrations::migration_003::up),
        (4, migrations::migration_004::up),
        (5, migrations::migration_005::up),
        (6, migrations::migration_006::up),
        (7, migrations::migration_007::up),
    ];

    // Run pending migrations
    for (version, migration_fn) in migrations {
        if version > latest_version {
            migration_fn(&conn)?;
            conn.execute(
                "INSERT INTO schema_migrations (version) VALUES (?)",
                [version],
            )?;
        }
    }

    Ok(())
}