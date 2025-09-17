use crate::database::{establish_connection, DbConnection};
use crate::models::*;
use chrono::{DateTime, Utc};
use rusqlite::Result;
use std::sync::OnceLock;

static DB_CONNECTION: OnceLock<DbConnection> = OnceLock::new();

fn get_db_connection() -> &'static DbConnection {
    DB_CONNECTION
        .get_or_init(|| establish_connection().expect("Failed to establish database connection"))
}

#[tauri::command]
pub fn get_all_states() -> Result<StatesListResponse, String> {
    let conn = get_db_connection();
    let conn = conn.lock().unwrap();

    let mut stmt = conn
        .prepare(
            "SELECT id, name, position, color, created_at, updated_at
         FROM states ORDER BY position ASC",
        )
        .map_err(|e| format!("Failed to prepare query: {}", e))?;

    let states_iter = stmt
        .query_map([], |row| {
            Ok(State {
                id: Some(row.get(0)?),
                name: row.get(1)?,
                position: row.get(2)?,
                color: row.get(3)?,
                created_at: Some(DateTime::from_timestamp(row.get(4)?, 0).unwrap_or_default()),
                updated_at: Some(DateTime::from_timestamp(row.get(5)?, 0).unwrap_or_default()),
            })
        })
        .map_err(|e| format!("Failed to query states: {}", e))?;

    let mut states = Vec::new();
    for state in states_iter {
        match state {
            Ok(state) => states.push(state),
            Err(e) => return Err(format!("Failed to parse state: {}", e)),
        }
    }

    Ok(StatesListResponse {
        success: true,
        data: states,
        error: None,
    })
}

#[tauri::command]
pub fn create_state(request: CreateStateRequest) -> Result<StateResponse, String> {
    let conn = get_db_connection();
    let conn = conn.lock().unwrap();

    let now = Utc::now().timestamp();

    conn.execute(
        "INSERT INTO states (name, position, color, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?)",
        rusqlite::params![request.name, request.position, request.color, now, now],
    )
    .map_err(|e| format!("Failed to create state: {}", e))?;

    let id = conn.last_insert_rowid();

    // Retrieve the created state
    get_state_sync(id, &conn)
}

#[tauri::command]
pub fn update_state(request: UpdateStateRequest) -> Result<StateResponse, String> {
    let conn = get_db_connection();
    let conn = conn.lock().unwrap();

    // Build dynamic update query
    let mut set_parts = Vec::new();
    let mut params: Vec<Box<dyn rusqlite::ToSql>> = Vec::new();

    if let Some(name) = &request.name {
        set_parts.push("name = ?".to_string());
        params.push(Box::new(name.clone()));
    }

    if let Some(position) = request.position {
        set_parts.push("position = ?".to_string());
        params.push(Box::new(position));
    }

    if let Some(color) = &request.color {
        set_parts.push("color = ?".to_string());
        params.push(Box::new(color.clone()));
    }

    if set_parts.is_empty() {
        return Err("No fields to update".to_string());
    }

    set_parts.push("updated_at = ?".to_string());
    let now = Utc::now().timestamp();
    params.push(Box::new(now));

    let query = format!("UPDATE states SET {} WHERE id = ?", set_parts.join(", "));
    params.push(Box::new(request.id));

    let param_refs: Vec<&dyn rusqlite::ToSql> = params.iter().map(|p| p.as_ref()).collect();

    let rows_affected = conn
        .execute(&query, &param_refs[..])
        .map_err(|e| format!("Failed to update state: {}", e))?;

    if rows_affected == 0 {
        return Ok(StateResponse {
            success: false,
            data: None,
            error: Some("State not found".to_string()),
        });
    }

    // Return the updated state
    get_state_sync(request.id, &conn)
}

#[tauri::command]
pub fn delete_state(id: i64) -> Result<StateResponse, String> {
    let conn = get_db_connection();
    let conn = conn.lock().unwrap();

    // First get the state for return
    let state_result = get_state_sync(id, &conn)?;
    if !state_result.success {
        return Ok(state_result);
    }

    // Delete the state
    let rows_affected = conn
        .execute("DELETE FROM states WHERE id = ?", [id])
        .map_err(|e| format!("Failed to delete state: {}", e))?;

    if rows_affected == 0 {
        return Ok(StateResponse {
            success: false,
            data: None,
            error: Some("State not found".to_string()),
        });
    }

    Ok(StateResponse {
        success: true,
        data: state_result.data,
        error: None,
    })
}

fn get_state_sync(id: i64, conn: &rusqlite::Connection) -> Result<StateResponse, String> {
    let mut stmt = conn
        .prepare(
            "SELECT id, name, position, color, created_at, updated_at
         FROM states WHERE id = ?",
        )
        .map_err(|e| format!("Failed to prepare query: {}", e))?;

    let state = stmt.query_row([id], |row| {
        Ok(State {
            id: Some(row.get(0)?),
            name: row.get(1)?,
            position: row.get(2)?,
            color: row.get(3)?,
            created_at: Some(DateTime::from_timestamp(row.get(4)?, 0).unwrap_or_default()),
            updated_at: Some(DateTime::from_timestamp(row.get(5)?, 0).unwrap_or_default()),
        })
    });

    match state {
        Ok(state) => Ok(StateResponse {
            success: true,
            data: Some(state),
            error: None,
        }),
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(StateResponse {
            success: false,
            data: None,
            error: Some("State not found".to_string()),
        }),
        Err(e) => Err(format!("Failed to get state: {}", e)),
    }
}