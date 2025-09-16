use crate::database::{establish_connection, run_migrations, DbConnection};
use crate::models::*;
use rusqlite::Result;
use std::sync::OnceLock;
use chrono::{DateTime, Utc};
use std::path::Path;

static DB_CONNECTION: OnceLock<DbConnection> = OnceLock::new();

fn get_db_connection() -> &'static DbConnection {
    DB_CONNECTION.get_or_init(|| {
        establish_connection().expect("Failed to establish database connection")
    })
}

#[tauri::command]
pub fn initialize_db() -> Result<NotesListResponse, String> {
    let conn = get_db_connection();
    run_migrations(conn).map_err(|e| e.to_string())?;

    // Return empty list on successful initialization
    Ok(NotesListResponse {
        success: true,
        data: Vec::new(),
        error: None,
    })
}

#[tauri::command]
pub fn create_note(request: CreateNoteRequest) -> Result<NoteResponse, String> {
    let conn = get_db_connection();
    let conn = conn.lock().unwrap();

    let labels_json = serde_json::to_string(&request.labels.unwrap_or_default())
        .map_err(|e| format!("Failed to serialize labels: {}", e))?;

    let now = Utc::now().timestamp();

    conn.execute(
        "INSERT INTO notes (title, content, created_at, updated_at, priority, labels, deadline, reminder_minutes, done, state_id, \"order\")
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        rusqlite::params![
            request.title,
            request.content,
            now,
            now,
            request.priority.unwrap_or(0),
            labels_json,
            request.deadline.map(|dt| dt.timestamp()),
            request.reminder_minutes.unwrap_or(0),
            request.done.unwrap_or(false) as i32,
            request.state_id,
            request.order.unwrap_or(0)
        ],
    ).map_err(|e| format!("Failed to create note: {}", e))?;

    let id = conn.last_insert_rowid();

    // Retrieve the created note
    get_note_sync(id, &conn)
}

#[tauri::command]
pub fn get_note(id: i64) -> Result<NoteResponse, String> {
    let conn = get_db_connection();
    let conn = conn.lock().unwrap();

    get_note_sync(id, &conn)
}

#[tauri::command]
pub fn get_all_notes() -> Result<NotesListResponse, String> {
    let conn = get_db_connection();
    let conn = conn.lock().unwrap();

    let mut stmt = conn.prepare(
        "SELECT id, title, content, created_at, updated_at, priority, labels, deadline, reminder_minutes, done, state_id, \"order\"
         FROM notes ORDER BY \"order\" ASC, updated_at DESC"
    ).map_err(|e| format!("Failed to prepare query: {}", e))?;

    let notes_iter = stmt.query_map([], |row| {
        let labels_str: String = row.get(6)?;
        let labels: Vec<String> = serde_json::from_str(&labels_str)
            .unwrap_or_default();

        Ok(Note {
            id: Some(row.get(0)?),
            title: row.get(1)?,
            content: row.get(2)?,
            created_at: Some(DateTime::from_timestamp(row.get(3)?, 0).unwrap_or_default()),
            updated_at: Some(DateTime::from_timestamp(row.get(4)?, 0).unwrap_or_default()),
            priority: row.get(5)?,
            labels,
            deadline: row.get::<_, Option<i64>>(7)?.map(|ts| DateTime::from_timestamp(ts, 0).unwrap_or_default()),
            reminder_minutes: row.get(8)?,
            done: row.get::<_, i32>(9)? != 0,
            state_id: row.get(10)?,
            order: row.get(11)?,
        })
    }).map_err(|e| format!("Failed to query notes: {}", e))?;

    let mut notes = Vec::new();
    for note in notes_iter {
        match note {
            Ok(note) => notes.push(note),
            Err(e) => return Err(format!("Failed to parse note: {}", e)),
        }
    }

    Ok(NotesListResponse {
        success: true,
        data: notes,
        error: None,
    })
}

#[tauri::command]
pub fn update_note(request: UpdateNoteRequest) -> Result<NoteResponse, String> {
    let conn = get_db_connection();
    let conn = conn.lock().unwrap();

    // Build dynamic update query
    let mut set_parts = Vec::new();
    let mut params: Vec<Box<dyn rusqlite::ToSql>> = Vec::new();

    if let Some(title) = &request.title {
        set_parts.push("title = ?".to_string());
        params.push(Box::new(title.clone()));
    }

    if let Some(content) = &request.content {
        set_parts.push("content = ?".to_string());
        params.push(Box::new(content.clone()));
    }

    if let Some(priority) = request.priority {
        set_parts.push("priority = ?".to_string());
        params.push(Box::new(priority));
    }

    if let Some(labels) = &request.labels {
        let labels_json = serde_json::to_string(labels)
            .map_err(|e| format!("Failed to serialize labels: {}", e))?;
        set_parts.push("labels = ?".to_string());
        params.push(Box::new(labels_json));
    }

    if let Some(deadline) = request.deadline {
        set_parts.push("deadline = ?".to_string());
        params.push(Box::new(deadline.timestamp()));
    }

    if let Some(reminder_minutes) = request.reminder_minutes {
        set_parts.push("reminder_minutes = ?".to_string());
        params.push(Box::new(reminder_minutes));
    }

    if let Some(done) = request.done {
        set_parts.push("done = ?".to_string());
        params.push(Box::new(done as i32));
    }

    if let Some(state_id) = request.state_id {
        set_parts.push("state_id = ?".to_string());
        params.push(Box::new(state_id));
    }

    if set_parts.is_empty() {
        return Err("No fields to update".to_string());
    }

    set_parts.push("updated_at = ?".to_string());
    let now = Utc::now().timestamp();
    params.push(Box::new(now));

    let query = format!(
        "UPDATE notes SET {} WHERE id = ?",
        set_parts.join(", ")
    );
    params.push(Box::new(request.id));

    let param_refs: Vec<&dyn rusqlite::ToSql> = params.iter().map(|p| p.as_ref()).collect();

    let rows_affected = conn.execute(&query, &param_refs[..])
        .map_err(|e| format!("Failed to update note: {}", e))?;

    if rows_affected == 0 {
        return Ok(NoteResponse {
            success: false,
            data: None,
            error: Some("Note not found".to_string()),
        });
    }

    // Return the updated note
    get_note_sync(request.id, &conn)
}

fn get_note_sync(id: i64, conn: &rusqlite::Connection) -> Result<NoteResponse, String> {
    let mut stmt = conn.prepare(
        "SELECT id, title, content, created_at, updated_at, priority, labels, deadline, reminder_minutes, done, state_id, \"order\"
         FROM notes WHERE id = ?"
    ).map_err(|e| format!("Failed to prepare query: {}", e))?;

    let note = stmt.query_row([id], |row| {
        let labels_str: String = row.get(6)?;
        let labels: Vec<String> = serde_json::from_str(&labels_str)
            .unwrap_or_default();

        Ok(Note {
            id: Some(row.get(0)?),
            title: row.get(1)?,
            content: row.get(2)?,
            created_at: Some(DateTime::from_timestamp(row.get(3)?, 0).unwrap_or_default()),
            updated_at: Some(DateTime::from_timestamp(row.get(4)?, 0).unwrap_or_default()),
            priority: row.get(5)?,
            labels,
            deadline: row.get::<_, Option<i64>>(7)?.map(|ts| DateTime::from_timestamp(ts, 0).unwrap_or_default()),
            reminder_minutes: row.get(8)?,
            done: row.get::<_, i32>(9)? != 0,
            state_id: row.get(10)?,
            order: row.get(11)?,
        })
    });

    match note {
        Ok(note) => Ok(NoteResponse {
            success: true,
            data: Some(note),
            error: None,
        }),
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(NoteResponse {
            success: false,
            data: None,
            error: Some("Note not found".to_string()),
        }),
        Err(e) => Err(format!("Failed to get note: {}", e)),
    }
}

#[tauri::command]
pub fn delete_note(request: DeleteNoteRequest) -> Result<NoteResponse, String> {
    let conn = get_db_connection();
    let conn = conn.lock().unwrap();

    // First get the note for return
    let note_result = get_note_sync(request.id, &conn)?;
    if !note_result.success {
        return Ok(note_result);
    }

    // Delete the note
    let rows_affected = conn.execute(
        "DELETE FROM notes WHERE id = ?",
        [request.id],
    ).map_err(|e| format!("Failed to delete note: {}", e))?;

    if rows_affected == 0 {
        return Ok(NoteResponse {
            success: false,
            data: None,
            error: Some("Note not found".to_string()),
        });
    }

    Ok(NoteResponse {
        success: true,
        data: note_result.data,
        error: None,
    })
}

#[tauri::command]
pub fn search_notes(request: SearchRequest) -> Result<NotesListResponse, String> {
    let conn = get_db_connection();
    let conn = conn.lock().unwrap();

    let limit = request.limit.unwrap_or(50).min(100); // Max 100 results
    let offset = request.offset.unwrap_or(0);

    // For partial substring search, use LIKE search as primary method
    // FTS is better for full-text search with ranking, but LIKE handles substrings better
    let query = request.query.trim();

    // If query contains FTS operators or is complex, try FTS first
    if query.contains(':') || query.contains('"') || query.contains('*') ||
       query.contains("AND") || query.contains("OR") || query.contains("NOT") ||
       query.split_whitespace().count() > 3 {
        let search_query = enhance_search_query(query);
        let fts_result = perform_fts_search(&conn, &search_query, limit, offset);

        match fts_result {
            Ok(notes) => {
                return Ok(NotesListResponse {
                    success: true,
                    data: notes,
                    error: None,
                });
            }
            Err(_) => {
                // Fallback to LIKE search
                return perform_like_search(&conn, query, limit, offset);
            }
        }
    } else {
        // For simple queries, use LIKE search for better substring matching
        return perform_like_search(&conn, query, limit, offset);
    }
}

fn perform_fts_search(conn: &rusqlite::Connection, search_query: &str, limit: i32, offset: i32) -> Result<Vec<Note>, String> {
    let mut stmt = conn.prepare(
        "SELECT n.id, n.title, n.content, n.created_at, n.updated_at, n.priority, n.labels, n.deadline, n.reminder_minutes, n.done, n.state_id, n.\"order\"
         FROM notes_fts fts
         JOIN notes n ON fts.rowid = n.id
         WHERE notes_fts MATCH ?
         ORDER BY rank
         LIMIT ? OFFSET ?"
    ).map_err(|e| format!("Failed to prepare FTS search query: {}", e))?;

    let notes_iter = stmt.query_map(
        rusqlite::params![search_query, limit as i64, offset as i64],
        |row| {
            let labels_str: String = row.get(6)?;
            let labels: Vec<String> = serde_json::from_str(&labels_str)
                .unwrap_or_default();

        Ok(Note {
            id: Some(row.get(0)?),
            title: row.get(1)?,
            content: row.get(2)?,
            created_at: Some(DateTime::from_timestamp(row.get(3)?, 0).unwrap_or_default()),
            updated_at: Some(DateTime::from_timestamp(row.get(4)?, 0).unwrap_or_default()),
            priority: row.get(5)?,
            labels,
            deadline: row.get::<_, Option<i64>>(7)?.map(|ts| DateTime::from_timestamp(ts, 0).unwrap_or_default()),
            reminder_minutes: row.get(8)?,
            done: row.get::<_, i32>(9)? != 0,
            state_id: row.get(10)?,
            order: row.get(11)?,
        })
        }
    ).map_err(|e| format!("Failed to execute FTS search: {}", e))?;

    let mut notes = Vec::new();
    for note in notes_iter {
        match note {
            Ok(note) => notes.push(note),
            Err(e) => return Err(format!("Failed to parse FTS search result: {}", e)),
        }
    }

    Ok(notes)
}

fn perform_like_search(conn: &rusqlite::Connection, query: &str, limit: i32, offset: i32) -> Result<NotesListResponse, String> {
    let search_pattern = format!("%{}%", query);

    let mut stmt = conn.prepare(
        "SELECT id, title, content, created_at, updated_at, priority, labels, deadline, reminder_minutes, done, state_id, \"order\"
         FROM notes
         WHERE title LIKE ? COLLATE NOCASE OR content LIKE ? COLLATE NOCASE
         ORDER BY \"order\" ASC, updated_at DESC
         LIMIT ? OFFSET ?"
    ).map_err(|e| format!("Failed to prepare LIKE search query: {}", e))?;

    let notes_iter = stmt.query_map(
        rusqlite::params![search_pattern, search_pattern, limit as i64, offset as i64],
        |row| {
            let labels_str: String = row.get(6)?;
            let labels: Vec<String> = serde_json::from_str(&labels_str)
                .unwrap_or_default();

        Ok(Note {
            id: Some(row.get(0)?),
            title: row.get(1)?,
            content: row.get(2)?,
            created_at: Some(DateTime::from_timestamp(row.get(3)?, 0).unwrap_or_default()),
            updated_at: Some(DateTime::from_timestamp(row.get(4)?, 0).unwrap_or_default()),
            priority: row.get(5)?,
            labels,
            deadline: row.get::<_, Option<i64>>(7)?.map(|ts| DateTime::from_timestamp(ts, 0).unwrap_or_default()),
            reminder_minutes: row.get(8)?,
            done: row.get::<_, i32>(9)? != 0,
            state_id: row.get(10)?,
            order: row.get(11)?,
        })
        }
    ).map_err(|e| format!("Failed to execute LIKE search: {}", e))?;

    let mut notes = Vec::new();
    for note in notes_iter {
        match note {
            Ok(note) => notes.push(note),
            Err(e) => return Err(format!("Failed to parse LIKE search result: {}", e)),
        }
    }

    Ok(NotesListResponse {
        success: true,
        data: notes,
        error: None,
    })
}

// Enhance search query to support better "like" matching for headers and descriptions
fn enhance_search_query(query: &str) -> String {
    let trimmed = query.trim();

    // If query is empty, return as-is
    if trimmed.is_empty() {
        return trimmed.to_string();
    }

    // If query already contains FTS operators, use as-is
    if trimmed.contains(':') || trimmed.contains('"') || trimmed.contains('*') ||
       trimmed.contains("AND") || trimmed.contains("OR") || trimmed.contains("NOT") {
        return trimmed.to_string();
    }

    // For simple queries, use FTS-compatible syntax that will trigger LIKE fallback for complex matching
    let words: Vec<&str> = trimmed.split_whitespace().collect();

    if words.len() == 1 {
        // Single word: search in both title and content with prefix matching
        // If this fails (due to complex queries), it will fallback to LIKE search
        let word = words[0];
        format!("title:{}* OR content:{}*", word, word)
    } else {
        // Multiple words: search for any of the words in either field
        let word_searches: Vec<String> = words.iter()
            .map(|word| format!("title:{}* OR content:{}*", word, word))
            .collect();

        format!("({})", word_searches.join(") OR ("))
    }
}

#[tauri::command]
pub fn update_note_done(request: UpdateNoteDoneRequest) -> Result<NoteResponse, String> {
    let conn = get_db_connection();
    let conn = conn.lock().unwrap();

    let now = Utc::now().timestamp();

    let rows_affected = conn.execute(
        "UPDATE notes SET done = ?, updated_at = ? WHERE id = ?",
        rusqlite::params![request.done as i32, now, request.id],
    ).map_err(|e| format!("Failed to update note done status: {}", e))?;

    if rows_affected == 0 {
        return Ok(NoteResponse {
            success: false,
            data: None,
            error: Some("Note not found".to_string()),
        });
    }

    // Return the updated note
    get_note_sync(request.id, &conn)
}

#[tauri::command]
pub fn get_all_states() -> Result<StatesListResponse, String> {
    let conn = get_db_connection();
    let conn = conn.lock().unwrap();

    let mut stmt = conn.prepare(
        "SELECT id, name, position, color, created_at, updated_at
         FROM states ORDER BY position ASC"
    ).map_err(|e| format!("Failed to prepare query: {}", e))?;

    let states_iter = stmt.query_map([], |row| {
        Ok(State {
            id: Some(row.get(0)?),
            name: row.get(1)?,
            position: row.get(2)?,
            color: row.get(3)?,
            created_at: Some(DateTime::from_timestamp(row.get(4)?, 0).unwrap_or_default()),
            updated_at: Some(DateTime::from_timestamp(row.get(5)?, 0).unwrap_or_default()),
        })
    }).map_err(|e| format!("Failed to query states: {}", e))?;

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
        rusqlite::params![
            request.name,
            request.position,
            request.color,
            now,
            now
        ],
    ).map_err(|e| format!("Failed to create state: {}", e))?;

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

    let query = format!(
        "UPDATE states SET {} WHERE id = ?",
        set_parts.join(", ")
    );
    params.push(Box::new(request.id));

    let param_refs: Vec<&dyn rusqlite::ToSql> = params.iter().map(|p| p.as_ref()).collect();

    let rows_affected = conn.execute(&query, &param_refs[..])
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
    let rows_affected = conn.execute(
        "DELETE FROM states WHERE id = ?",
        [id],
    ).map_err(|e| format!("Failed to delete state: {}", e))?;

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
    let mut stmt = conn.prepare(
        "SELECT id, name, position, color, created_at, updated_at
         FROM states WHERE id = ?"
    ).map_err(|e| format!("Failed to prepare query: {}", e))?;

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

#[tauri::command]
pub fn bulk_delete_notes(request: BulkDeleteRequest) -> Result<BulkOperationResponse, String> {
    let conn = get_db_connection();
    let conn = conn.lock().unwrap();

    let mut successful_count = 0;
    let mut failed_count = 0;
    let mut errors = Vec::new();

    for &note_id in &request.note_ids {
        match conn.execute(
            "DELETE FROM notes WHERE id = ?",
            [note_id],
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
                errors.push(format!("Failed to delete note {}: {}", note_id, e));
            }
        }
    }

    Ok(BulkOperationResponse {
        success: true,
        successful_count,
        failed_count,
        errors: if errors.is_empty() { None } else { Some(errors) },
        error: None,
    })
}

#[tauri::command]
pub fn bulk_update_notes_priority(request: BulkUpdatePriorityRequest) -> Result<BulkOperationResponse, String> {
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
        errors: if errors.is_empty() { None } else { Some(errors) },
        error: None,
    })
}

#[tauri::command]
pub fn bulk_update_notes_done(request: BulkUpdateDoneRequest) -> Result<BulkOperationResponse, String> {
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
        errors: if errors.is_empty() { None } else { Some(errors) },
        error: None,
    })
}

#[tauri::command]
pub fn bulk_update_notes_state(request: BulkUpdateStateRequest) -> Result<BulkOperationResponse, String> {
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
        errors: if errors.is_empty() { None } else { Some(errors) },
        error: None,
    })
}

#[tauri::command]
pub fn bulk_update_notes_order(request: BulkUpdateOrderRequest) -> Result<BulkOperationResponse, String> {
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
        errors: if errors.is_empty() { None } else { Some(errors) },
        error: None,
    })
}

#[tauri::command]
pub fn migrate_notes_to_states() -> Result<NoteResponse, String> {
    let conn = get_db_connection();
    let conn = conn.lock().unwrap();

    // Get all notes that don't have a state_id assigned
    let mut stmt = conn.prepare(
        "SELECT id, done, labels FROM notes WHERE state_id IS NULL"
    ).map_err(|e| format!("Failed to prepare migration query: {}", e))?;

    let note_rows = stmt.query_map([], |row| {
        let labels_str: String = row.get(2)?;
        let labels: Vec<String> = serde_json::from_str(&labels_str)
            .unwrap_or_default();

        Ok((row.get::<_, i64>(0)?, row.get::<_, i32>(1)? != 0, labels))
    }).map_err(|e| format!("Failed to query notes for migration: {}", e))?;

    for note_result in note_rows {
        match note_result {
            Ok((note_id, done, labels)) => {
                // Determine appropriate state based on current logic
                let state_name = if done {
                    "Done"
                } else if labels.iter().any(|l| l.to_lowercase().contains("progress") || l.to_lowercase().contains("in-progress")) {
                    "In Progress"
                } else {
                    "To Do"
                };

                // Find the state ID
                let mut state_stmt = conn.prepare(
                    "SELECT id FROM states WHERE name = ?"
                ).map_err(|e| format!("Failed to prepare state lookup: {}", e))?;

                let state_id: Option<i64> = state_stmt.query_row([state_name], |row| row.get(0)).ok();

                if let Some(state_id) = state_id {
                    // Update the note with the state_id
                    conn.execute(
                        "UPDATE notes SET state_id = ?, updated_at = ? WHERE id = ?",
                        rusqlite::params![
                            state_id,
                            Utc::now().timestamp(),
                            note_id
                        ],
                    ).map_err(|e| format!("Failed to update note {}: {}", note_id, e))?;
                }
            }
            Err(e) => return Err(format!("Failed to process note: {}", e)),
        }
    }

    Ok(NoteResponse {
        success: true,
        data: None,
        error: None,
    })
}

#[tauri::command]
pub fn scan_mcp_configs() -> Result<McpScanResponse, String> {
    use std::fs;

    let mut results = Vec::new();

    // Get home directory
    let home_dir = dirs::home_dir()
        .ok_or("Could not determine home directory")?;

    // Config directories to scan (expanded list)
    let mut config_dirs = vec![
        home_dir.join(".config"),
        home_dir.clone(),
    ];

    // Add platform-specific directories
    #[cfg(target_os = "macos")] {
        config_dirs.push(home_dir.join("Library/Application Support"));
        config_dirs.push(home_dir.join("Library/Preferences"));
    }
    #[cfg(target_os = "windows")] {
        if let Some(appdata) = std::env::var_os("APPDATA") {
            config_dirs.push(Path::new(&appdata).to_path_buf());
        }
        if let Some(local_appdata) = std::env::var_os("LOCALAPPDATA") {
            config_dirs.push(Path::new(&local_appdata).to_path_buf());
        }
    }
    #[cfg(target_os = "linux")] {
        config_dirs.push(home_dir.join(".local/share"));
    }

    // Known MCP client config files and patterns
    let known_configs = vec![
        // Claude Desktop
        ("claude", ".claude.json"),
        ("claude", "claude_desktop_config.json"),
        ("claude", "claude.json"),

        // OpenCode
        ("opencode", ".opencode.json"),
        ("opencode", "opencode.json"),

        // Gemini
        ("gemini", "gemini.json"),
        ("gemini", ".gemini.json"),

        // AMP
        ("amp", "amp.json"),
        ("amp", ".amp.json"),

        // Continue
        ("continue", "continue.json"),
        ("continue", ".continue.json"),
        ("continue", "config.json"),

        // Cline
        ("cline", "cline.json"),
        ("cline", ".cline.json"),

        // Other MCP clients
        ("mcp", "mcp.json"),
        ("mcp", ".mcp.json"),
        ("mcp-client", "mcp-client.json"),
    ];

    // Scan known config files
    for config_dir in &config_dirs {
        if !config_dir.exists() {
            continue;
        }

        for (provider, filename) in &known_configs {
            let config_path = config_dir.join(filename);

            if config_path.exists() {
                process_config_file(&config_path, provider, &mut results);
            }

            // Also check subdirectories for some clients
            if provider == &"claude" {
                let claude_dir = config_dir.join("Claude");
                if claude_dir.exists() {
                    if let Ok(entries) = fs::read_dir(&claude_dir) {
                        for entry in entries.flatten() {
                            let path = entry.path();
                            if path.extension().and_then(|s| s.to_str()) == Some("json") {
                                process_config_file(&path, provider, &mut results);
                            }
                        }
                    }
                }
            }
        }
    }

    // Also scan for any JSON files that might contain MCP configurations
    scan_for_mcp_json_files(&config_dirs, &mut results);

    Ok(McpScanResponse {
        success: true,
        data: Some(results),
        error: None,
    })
}

#[tauri::command]
pub fn query_mcp_functions() -> Result<McpFunctionQueryResponse, String> {
    // For now, return mock data showing what this would look like
    // In a real implementation, this would query actual MCP servers
    // for their available tools/functions

    let mock_functions = vec![
        McpFunction {
            name: "get_weather".to_string(),
            description: Some("Get current weather for a location".to_string()),
            parameters: vec![
                McpFunctionParameter {
                    name: "location".to_string(),
                    r#type: "string".to_string(),
                    description: Some("City name or coordinates".to_string()),
                    required: true,
                },
                McpFunctionParameter {
                    name: "units".to_string(),
                    r#type: "string".to_string(),
                    description: Some("Temperature units (celsius/fahrenheit)".to_string()),
                    required: false,
                },
            ],
            server_name: "weather-api".to_string(),
            server_provider: "claude".to_string(),
        },
        McpFunction {
            name: "search_web".to_string(),
            description: Some("Search the web for information".to_string()),
            parameters: vec![
                McpFunctionParameter {
                    name: "query".to_string(),
                    r#type: "string".to_string(),
                    description: Some("Search query".to_string()),
                    required: true,
                },
                McpFunctionParameter {
                    name: "limit".to_string(),
                    r#type: "number".to_string(),
                    description: Some("Maximum number of results".to_string()),
                    required: false,
                },
            ],
            server_name: "web-search".to_string(),
            server_provider: "claude".to_string(),
        },
        McpFunction {
            name: "calculate".to_string(),
            description: Some("Perform mathematical calculations".to_string()),
            parameters: vec![
                McpFunctionParameter {
                    name: "expression".to_string(),
                    r#type: "string".to_string(),
                    description: Some("Mathematical expression to evaluate".to_string()),
                    required: true,
                },
            ],
            server_name: "calculator".to_string(),
            server_provider: "opencode".to_string(),
        },
        McpFunction {
            name: "read_file".to_string(),
            description: Some("Read contents of a file".to_string()),
            parameters: vec![
                McpFunctionParameter {
                    name: "path".to_string(),
                    r#type: "string".to_string(),
                    description: Some("File path to read".to_string()),
                    required: true,
                },
                McpFunctionParameter {
                    name: "encoding".to_string(),
                    r#type: "string".to_string(),
                    description: Some("File encoding (utf8, ascii, etc.)".to_string()),
                    required: false,
                },
            ],
            server_name: "filesystem".to_string(),
            server_provider: "cline".to_string(),
        },
        McpFunction {
            name: "send_email".to_string(),
            description: Some("Send an email message".to_string()),
            parameters: vec![
                McpFunctionParameter {
                    name: "to".to_string(),
                    r#type: "string".to_string(),
                    description: Some("Recipient email address".to_string()),
                    required: true,
                },
                McpFunctionParameter {
                    name: "subject".to_string(),
                    r#type: "string".to_string(),
                    description: Some("Email subject line".to_string()),
                    required: true,
                },
                McpFunctionParameter {
                    name: "body".to_string(),
                    r#type: "string".to_string(),
                    description: Some("Email message body".to_string()),
                    required: true,
                },
            ],
            server_name: "email-service".to_string(),
            server_provider: "continue".to_string(),
        },
    ];

    Ok(McpFunctionQueryResponse {
        success: true,
        data: Some(mock_functions),
        error: None,
    })
}

fn process_config_file(config_path: &Path, provider: &str, results: &mut Vec<McpConfigResult>) {
    match std::fs::read_to_string(config_path) {
        Ok(content) => {
            match serde_json::from_str::<serde_json::Value>(&content) {
                Ok(json) => {
                    let mcp_servers = extract_mcp_servers(&json);
                    if !mcp_servers.is_empty() {
                        results.push(McpConfigResult {
                            provider: provider.to_string(),
                            config_path: config_path.to_string_lossy().to_string(),
                            mcp_servers,
                            error: None,
                        });
                    } else {
                        // Even if no servers found, include the file for debugging
                        results.push(McpConfigResult {
                            provider: provider.to_string(),
                            config_path: config_path.to_string_lossy().to_string(),
                            mcp_servers: Vec::new(),
                            error: Some("No MCP servers found in config".to_string()),
                        });
                    }
                }
                Err(e) => {
                    results.push(McpConfigResult {
                        provider: provider.to_string(),
                        config_path: config_path.to_string_lossy().to_string(),
                        mcp_servers: Vec::new(),
                        error: Some(format!("Failed to parse JSON: {}", e)),
                    });
                }
            }
        }
        Err(e) => {
            results.push(McpConfigResult {
                provider: provider.to_string(),
                config_path: config_path.to_string_lossy().to_string(),
                mcp_servers: Vec::new(),
                error: Some(format!("Failed to read file: {}", e)),
            });
        }
    }
}

fn scan_for_mcp_json_files(config_dirs: &[std::path::PathBuf], results: &mut Vec<McpConfigResult>) {
    for config_dir in config_dirs {
        if !config_dir.exists() {
            continue;
        }

        // Recursively scan for JSON files that might contain MCP configs
        if let Ok(entries) = walk_dir(config_dir, 3) { // Max depth of 3
            for entry in entries {
                if let Some(extension) = entry.extension() {
                    if extension == "json" {
                        if let Ok(content) = std::fs::read_to_string(&entry) {
                            if content.contains("mcp") || content.contains("server") {
                                match serde_json::from_str::<serde_json::Value>(&content) {
                                    Ok(json) => {
                                        let mcp_servers = extract_mcp_servers(&json);
                                        if !mcp_servers.is_empty() {
                                            let filename = entry.file_name()
                                                .and_then(|n| n.to_str())
                                                .unwrap_or("unknown");
                                            results.push(McpConfigResult {
                                                provider: format!("auto-detected ({})", filename),
                                                config_path: entry.to_string_lossy().to_string(),
                                                mcp_servers,
                                                error: None,
                                            });
                                        }
                                    }
                                    _ => {} // Ignore invalid JSON
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

fn walk_dir(dir: &Path, max_depth: usize) -> Result<Vec<std::path::PathBuf>, std::io::Error> {
    let mut results = Vec::new();
    walk_dir_recursive(dir, max_depth, 0, &mut results)?;
    Ok(results)
}

fn walk_dir_recursive(
    dir: &Path,
    max_depth: usize,
    current_depth: usize,
    results: &mut Vec<std::path::PathBuf>
) -> Result<(), std::io::Error> {
    if current_depth > max_depth {
        return Ok(());
    }

    let entries = std::fs::read_dir(dir)?;
    for entry in entries {
        let entry = entry?;
        let path = entry.path();

        if path.is_file() {
            results.push(path);
        } else if path.is_dir() && current_depth < max_depth {
            walk_dir_recursive(&path, max_depth, current_depth + 1, results)?;
        }
    }

    Ok(())
}

fn extract_mcp_servers(json: &serde_json::Value) -> Vec<McpServerConfig> {
    let mut servers = Vec::new();

    // Check for standard MCP configuration formats
    let possible_keys = vec![
        "mcpServers",
        "servers",
        "mcp",
        "tools",
        "integrations"
    ];

    for key in possible_keys {
        if let Some(section) = json.get(key) {
            if let Some(obj) = section.as_object() {
                for (name, config) in obj {
                    if let Some(server_config) = config.as_object() {
                        let server = extract_server_config(name, server_config);
                        servers.push(server);
                    }
                }
            }
        }
    }

    // Also check for array-based configurations
    if let Some(servers_array) = json.get("mcpServers").and_then(|v| v.as_array()) {
        for (index, config) in servers_array.iter().enumerate() {
            if let Some(server_config) = config.as_object() {
                let default_name = format!("server-{}", index);
                let name = server_config.get("name")
                    .and_then(|n| n.as_str())
                    .unwrap_or(&default_name);
                let server = extract_server_config(name, server_config);
                servers.push(server);
            }
        }
    }

    // Check for Claude Desktop specific format
    if let Some(claude_config) = json.get("claude_desktop") {
        if let Some(mcp) = claude_config.get("mcp") {
            if let Some(servers_obj) = mcp.get("servers") {
                if let Some(obj) = servers_obj.as_object() {
                    for (name, config) in obj {
                        if let Some(server_config) = config.as_object() {
                            let server = extract_server_config(name, server_config);
                            servers.push(server);
                        }
                    }
                }
            }
        }
    }

    servers
}

fn extract_server_config(name: &str, config: &serde_json::Map<String, serde_json::Value>) -> McpServerConfig {
    let command = config.get("command")
        .or_else(|| config.get("cmd"))
        .or_else(|| config.get("executable"))
        .and_then(|c| c.as_str())
        .unwrap_or("")
        .to_string();

    let args = config.get("args")
        .or_else(|| config.get("arguments"))
        .and_then(|a| a.as_array())
        .map(|arr| arr.iter()
            .filter_map(|v| v.as_str().map(|s| s.to_string()))
            .collect::<Vec<_>>()
        );

    let env = config.get("env")
        .or_else(|| config.get("environment"))
        .or_else(|| config.get("envVars"))
        .cloned();

    McpServerConfig {
        name: name.to_string(),
        command,
        args,
        env,
    }
}
