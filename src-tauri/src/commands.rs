use crate::database::{establish_connection, run_migrations, DbConnection};
use crate::models::*;
use rusqlite::Result;
use std::sync::OnceLock;
use chrono::{DateTime, Utc};

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
        "INSERT INTO notes (title, content, created_at, updated_at, priority, labels, deadline, reminder_minutes, done, state_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
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
            request.state_id
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
        "SELECT id, title, content, created_at, updated_at, priority, labels, deadline, reminder_minutes, done, state_id
         FROM notes ORDER BY updated_at DESC"
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
        "SELECT id, title, content, created_at, updated_at, priority, labels, deadline, reminder_minutes, done, state_id
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
        "SELECT n.id, n.title, n.content, n.created_at, n.updated_at, n.priority, n.labels, n.deadline, n.reminder_minutes, n.done, n.state_id
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
        "SELECT id, title, content, created_at, updated_at, priority, labels, deadline, reminder_minutes, done, state_id
         FROM notes
         WHERE title LIKE ? COLLATE NOCASE OR content LIKE ? COLLATE NOCASE
         ORDER BY updated_at DESC
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
