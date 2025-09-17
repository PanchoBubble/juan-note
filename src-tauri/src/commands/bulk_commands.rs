use crate::database::{establish_connection, DbConnection};
use crate::models::*;
use chrono::Utc;
use rusqlite::Result;
use std::sync::OnceLock;

static DB_CONNECTION: OnceLock<DbConnection> = OnceLock::new();

fn get_db_connection() -> &'static DbConnection {
    DB_CONNECTION
        .get_or_init(|| establish_connection().expect("Failed to establish database connection"))
}

#[tauri::command]
pub fn bulk_delete_notes(request: BulkDeleteRequest) -> Result<BulkOperationResponse, String> {
    let conn = get_db_connection();
    let conn = conn.lock().unwrap();

    let mut successful_count = 0;
    let mut failed_count = 0;
    let mut errors = Vec::new();

    for &note_id in &request.note_ids {
        match conn.execute("DELETE FROM notes WHERE id = ?", [note_id]) {
            Ok(rows_affected) => {
                if rows_affected > 0 {
                    successful_count += 1;
                } else {
                    failed_count += 1;
                    errors.push(format!("Note {} not found", note_id));
                }
            }
            Err(e) => {
                failed_count += 1;
                errors.push(format!("Failed to delete note {}: {}", note_id, e));
            }
        }
    }

    Ok(BulkOperationResponse {
        success: true,
        successful_count,
        failed_count,
        errors: if errors.is_empty() {
            None
        } else {
            Some(errors)
        },
        error: None,
    })
}

#[tauri::command]
pub fn bulk_update_notes_priority(
    request: BulkUpdatePriorityRequest,
) -> Result<BulkOperationResponse, String> {
    let conn = get_db_connection();
    let conn = conn.lock().unwrap();

    let mut successful_count = 0;
    let mut failed_count = 0;
    let mut errors = Vec::new();
    let now = Utc::now().timestamp();

    for &note_id in &request.note_ids {
        match conn.execute(
            "UPDATE notes SET priority = ?, updated_at = ? WHERE id = ?",
            rusqlite::params![request.priority, now, note_id],
        ) {
            Ok(rows_affected) => {
                if rows_affected > 0 {
                    successful_count += 1;
                } else {
                    failed_count += 1;
                    errors.push(format!("Note {} not found", note_id));
                }
            }
            Err(e) => {
                failed_count += 1;
                errors.push(format!("Failed to update note {}: {}", note_id, e));
            }
        }
    }

    Ok(BulkOperationResponse {
        success: true,
        successful_count,
        failed_count,
        errors: if errors.is_empty() {
            None
        } else {
            Some(errors)
        },
        error: None,
    })
}

#[tauri::command]
pub fn bulk_update_notes_done(
    request: BulkUpdateDoneRequest,
) -> Result<BulkOperationResponse, String> {
    let conn = get_db_connection();
    let conn = conn.lock().unwrap();

    let mut successful_count = 0;
    let mut failed_count = 0;
    let mut errors = Vec::new();
    let now = Utc::now().timestamp();

    for &note_id in &request.note_ids {
        match conn.execute(
            "UPDATE notes SET done = ?, updated_at = ? WHERE id = ?",
            rusqlite::params![request.done as i32, now, note_id],
        ) {
            Ok(rows_affected) => {
                if rows_affected > 0 {
                    successful_count += 1;
                } else {
                    failed_count += 1;
                    errors.push(format!("Note {} not found", note_id));
                }
            }
            Err(e) => {
                failed_count += 1;
                errors.push(format!("Failed to update note {}: {}", note_id, e));
            }
        }
    }

    Ok(BulkOperationResponse {
        success: true,
        successful_count,
        failed_count,
        errors: if errors.is_empty() {
            None
        } else {
            Some(errors)
        },
        error: None,
    })
}

#[tauri::command]
pub fn bulk_update_notes_state(
    request: BulkUpdateStateRequest,
) -> Result<BulkOperationResponse, String> {
    let conn = get_db_connection();
    let conn = conn.lock().unwrap();

    let mut successful_count = 0;
    let mut failed_count = 0;
    let mut errors = Vec::new();
    let now = Utc::now().timestamp();

    for &note_id in &request.note_ids {
        match conn.execute(
            "UPDATE notes SET state_id = ?, updated_at = ? WHERE id = ?",
            rusqlite::params![request.state_id, now, note_id],
        ) {
            Ok(rows_affected) => {
                if rows_affected > 0 {
                    successful_count += 1;
                } else {
                    failed_count += 1;
                    errors.push(format!("Note {} not found", note_id));
                }
            }
            Err(e) => {
                failed_count += 1;
                errors.push(format!("Failed to update note {}: {}", note_id, e));
            }
        }
    }

    Ok(BulkOperationResponse {
        success: true,
        successful_count,
        failed_count,
        errors: if errors.is_empty() {
            None
        } else {
            Some(errors)
        },
        error: None,
    })
}

#[tauri::command]
pub fn bulk_update_notes_order(
    request: BulkUpdateOrderRequest,
) -> Result<BulkOperationResponse, String> {
    let conn = get_db_connection();
    let conn = conn.lock().unwrap();

    let mut successful_count = 0;
    let mut failed_count = 0;
    let mut errors = Vec::new();
    let now = Utc::now().timestamp();

    // Update each note with its corresponding order value
    for (i, &note_id) in request.note_ids.iter().enumerate() {
        let order = request.orders.get(i).copied().unwrap_or(0);

        match conn.execute(
            "UPDATE notes SET \"order\" = ?, updated_at = ? WHERE id = ?",
            rusqlite::params![order, now, note_id],
        ) {
            Ok(rows_affected) => {
                if rows_affected > 0 {
                    successful_count += 1;
                } else {
                    failed_count += 1;
                    errors.push(format!("Note {} not found", note_id));
                }
            }
            Err(e) => {
                failed_count += 1;
                errors.push(format!("Failed to update note {}: {}", note_id, e));
            }
        }
    }

    Ok(BulkOperationResponse {
        success: true,
        successful_count,
        failed_count,
        errors: if errors.is_empty() {
            None
        } else {
            Some(errors)
        },
        error: None,
    })
}

#[tauri::command]
pub fn migrate_notes_to_states() -> Result<NoteResponse, String> {
    let conn = get_db_connection();
    let conn = conn.lock().unwrap();

    // Get all notes that don't have a state_id assigned
    let mut stmt = conn.prepare(
        "SELECT id FROM notes WHERE state_id IS NULL"
    ).map_err(|e| format!("Failed to prepare migration query: {}", e))?;

    let note_ids: Result<Vec<i64>, _> = stmt.query_map([], |row| row.get(0))
        .map_err(|e| format!("Failed to query notes for migration: {}", e))?
        .collect();

    let note_ids = note_ids.map_err(|e| format!("Failed to collect note IDs: {}", e))?;

    if note_ids.is_empty() {
        return Ok(NoteResponse {
            success: true,
            data: None,
            error: Some("No notes need migration".to_string()),
        });
    }

    // Get the first state (assuming there's at least one default state)
    let first_state_id: Option<i64> = conn.query_row(
        "SELECT id FROM states ORDER BY position ASC LIMIT 1",
        [],
        |row| row.get(0)
    ).ok();

    let state_id = match first_state_id {
        Some(id) => id,
        None => {
            // Create a default state if none exists
            let now = Utc::now().timestamp();
            conn.execute(
                "INSERT INTO states (name, position, color, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
                rusqlite::params!["Default", 0, "#6b7280", now, now],
            ).map_err(|e| format!("Failed to create default state: {}", e))?;

            conn.last_insert_rowid()
        }
    };

    // Update all notes without state_id to use the first state
    let now = Utc::now().timestamp();
    let rows_affected = conn.execute(
        "UPDATE notes SET state_id = ?, updated_at = ? WHERE state_id IS NULL",
        rusqlite::params![state_id, now],
    ).map_err(|e| format!("Failed to migrate notes: {}", e))?;

    Ok(NoteResponse {
        success: true,
        data: None,
        error: Some(format!("Migrated {} notes to default state", rows_affected)),
    })
}