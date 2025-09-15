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
        "INSERT INTO notes (title, content, created_at, updated_at, priority, labels, deadline, reminder_minutes, done)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        rusqlite::params![
            request.title,
            request.content,
            now,
            now,
            request.priority.unwrap_or(0),
            labels_json,
            request.deadline.map(|dt| dt.timestamp()),
            request.reminder_minutes.unwrap_or(0),
            request.done.unwrap_or(false) as i32
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
        "SELECT id, title, content, created_at, updated_at, priority, labels, deadline, reminder_minutes, done
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
        "SELECT id, title, content, created_at, updated_at, priority, labels, deadline, reminder_minutes, done
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

    let mut stmt = conn.prepare(
        "SELECT n.id, n.title, n.content, n.created_at, n.updated_at, n.priority, n.labels, n.deadline, n.reminder_minutes, n.done
         FROM notes_fts fts
         JOIN notes n ON fts.rowid = n.id
         WHERE notes_fts MATCH ?
         ORDER BY rank
         LIMIT ? OFFSET ?"
    ).map_err(|e| format!("Failed to prepare search query: {}", e))?;

    let notes_iter = stmt.query_map(
        rusqlite::params![request.query, limit, offset],
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
        })
        }
    ).map_err(|e| format!("Failed to execute search: {}", e))?;

    let mut notes = Vec::new();
    for note in notes_iter {
        match note {
            Ok(note) => notes.push(note),
            Err(e) => return Err(format!("Failed to parse search result: {}", e)),
        }
    }

    Ok(NotesListResponse {
        success: true,
        data: notes,
        error: None,
    })
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