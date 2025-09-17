use crate::database::{establish_connection, run_migrations, DbConnection};
use crate::models::*;
use chrono::{DateTime, Utc};
use rusqlite::Result;
use serde_json;
use std::sync::OnceLock;

static DB_CONNECTION: OnceLock<DbConnection> = OnceLock::new();

fn get_db_connection() -> &'static DbConnection {
    DB_CONNECTION
        .get_or_init(|| establish_connection().expect("Failed to establish database connection"))
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
         FROM notes ORDER BY \"order\" ASC, created_at DESC"
    ).map_err(|e| format!("Failed to prepare statement: {}", e))?;

    let note_iter = stmt.query_map([], |row| {
        let labels_json: String = row.get(6)?;
        let labels: Vec<String> = serde_json::from_str(&labels_json).unwrap_or_default();

        Ok(Note {
            id: row.get(0)?,
            title: row.get(1)?,
            content: row.get(2)?,
            created_at: Some(DateTime::from_timestamp(row.get(3)?, 0).unwrap_or_default()),
            updated_at: Some(DateTime::from_timestamp(row.get(4)?, 0).unwrap_or_default()),
            priority: row.get(5)?,
            labels,
            deadline: match row.get::<_, Option<i64>>(7)? {
                Some(ts) => Some(DateTime::from_timestamp(ts, 0).unwrap_or_default()),
                None => None,
            },
            reminder_minutes: row.get(8)?,
            done: row.get::<_, i32>(9)? != 0,
            state_id: row.get(10)?,
            order: row.get(11)?,
        })
    }).map_err(|e| format!("Failed to query notes: {}", e))?;

    let mut notes = Vec::new();
    for note in note_iter {
        notes.push(note.map_err(|e| format!("Failed to read note: {}", e))?);
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

    let now = Utc::now().timestamp();

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
    if let Some(deadline) = &request.deadline {
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
    if let Some(order) = request.order {
        set_parts.push("\"order\" = ?".to_string());
        params.push(Box::new(order));
    }

    set_parts.push("updated_at = ?".to_string());
    params.push(Box::new(now));

    if set_parts.is_empty() {
        return Err("No fields to update".to_string());
    }

    let query = format!("UPDATE notes SET {} WHERE id = ?", set_parts.join(", "));
    params.push(Box::new(request.id));

    let param_refs: Vec<&dyn rusqlite::ToSql> = params.iter().map(|p| p.as_ref()).collect();

    conn.execute(&query, &param_refs[..])
        .map_err(|e| format!("Failed to update note: {}", e))?;

    // Retrieve the updated note
    get_note_sync(request.id, &conn)
}

#[tauri::command]
pub fn delete_note(request: DeleteNoteRequest) -> Result<NoteResponse, String> {
    let conn = get_db_connection();
    let conn = conn.lock().unwrap();

    // First get the note to return it
    let note = get_note_sync(request.id, &conn)?;

    // Delete the note
    conn.execute("DELETE FROM notes WHERE id = ?", [request.id])
        .map_err(|e| format!("Failed to delete note: {}", e))?;

    Ok(note)
}

#[tauri::command]
pub fn search_notes(request: SearchRequest) -> Result<NotesListResponse, String> {
    let conn = get_db_connection();
    let conn = conn.lock().unwrap();

    let limit = request.limit.unwrap_or(50).min(1000); // Cap at 1000
    let offset = request.offset.unwrap_or(0);

    let (query, params) = if request.query.is_empty() {
        // Simple query without search
        let sql = format!(
            "SELECT id, title, content, created_at, updated_at, priority, labels, deadline, reminder_minutes, done, state_id, \"order\"
             FROM notes ORDER BY \"order\" ASC, created_at DESC LIMIT {} OFFSET {}",
            limit, offset
        );
        (sql, Vec::new())
    } else {
        // Use FTS search
        perform_fts_search(&conn, &request.query, limit as i64, offset as i64)
    };

    let mut stmt = conn.prepare(&query)
        .map_err(|e| format!("Failed to prepare search statement: {}", e))?;

    let param_refs: Vec<&dyn rusqlite::ToSql> = params.iter().map(|s| s as &dyn rusqlite::ToSql).collect();

    let note_iter = stmt.query_map(&param_refs[..], |row| {
        let labels_json: String = row.get(6)?;
        let labels: Vec<String> = serde_json::from_str(&labels_json).unwrap_or_default();

        Ok(Note {
            id: row.get(0)?,
            title: row.get(1)?,
            content: row.get(2)?,
            created_at: Some(DateTime::from_timestamp(row.get(3)?, 0).unwrap_or_default()),
            updated_at: Some(DateTime::from_timestamp(row.get(4)?, 0).unwrap_or_default()),
            priority: row.get(5)?,
            labels,
            deadline: match row.get::<_, Option<i64>>(7)? {
                Some(ts) => Some(DateTime::from_timestamp(ts, 0).unwrap_or_default()),
                None => None,
            },
            reminder_minutes: row.get(8)?,
            done: row.get::<_, i32>(9)? != 0,
            state_id: row.get(10)?,
            order: row.get(11)?,
        })
    }).map_err(|e| format!("Failed to execute search: {}", e))?;

    let mut notes = Vec::new();
    for note in note_iter {
        notes.push(note.map_err(|e| format!("Failed to read search result: {}", e))?);
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

    conn.execute(
        "UPDATE notes SET done = ?, updated_at = ? WHERE id = ?",
        rusqlite::params![request.done as i32, now, request.id],
    ).map_err(|e| format!("Failed to update note done status: {}", e))?;

    // Retrieve the updated note
    get_note_sync(request.id, &conn)
}

fn get_note_sync(id: i64, conn: &rusqlite::Connection) -> Result<NoteResponse, String> {
    let mut stmt = conn.prepare(
        "SELECT id, title, content, created_at, updated_at, priority, labels, deadline, reminder_minutes, done, state_id, \"order\"
         FROM notes WHERE id = ?"
    ).map_err(|e| format!("Failed to prepare statement: {}", e))?;

    let mut rows = stmt.query_map([id], |row| {
        let labels_json: String = row.get(6)?;
        let labels: Vec<String> = serde_json::from_str(&labels_json).unwrap_or_default();

        Ok(Note {
            id: row.get(0)?,
            title: row.get(1)?,
            content: row.get(2)?,
            created_at: Some(DateTime::from_timestamp(row.get(3)?, 0).unwrap_or_default()),
            updated_at: Some(DateTime::from_timestamp(row.get(4)?, 0).unwrap_or_default()),
            priority: row.get(5)?,
            labels,
            deadline: match row.get::<_, Option<i64>>(7)? {
                Some(ts) => Some(DateTime::from_timestamp(ts, 0).unwrap_or_default()),
                None => None,
            },
            reminder_minutes: row.get(8)?,
            done: row.get::<_, i32>(9)? != 0,
            state_id: row.get(10)?,
            order: row.get(11)?,
        })
    }).map_err(|e| format!("Failed to query note: {}", e))?;

    match rows.next() {
        Some(row) => {
            let note = row.map_err(|e| format!("Failed to read note: {}", e))?;
            Ok(NoteResponse {
                success: true,
                data: Some(note),
                error: None,
            })
        }
        None => Ok(NoteResponse {
            success: false,
            data: None,
            error: Some("Note not found".to_string()),
        }),
    }
}

fn perform_fts_search(
    conn: &rusqlite::Connection,
    query: &str,
    limit: i64,
    offset: i64,
) -> (String, Vec<String>) {
    let enhanced_query = enhance_search_query(query);

    // Use FTS5 virtual table for full-text search
    let sql = format!(
        "SELECT n.id, n.title, n.content, n.created_at, n.updated_at, n.priority, n.labels, n.deadline, n.reminder_minutes, n.done, n.state_id, n.\"order\"
         FROM notes n
         JOIN notes_fts fts ON n.id = fts.rowid
         WHERE fts.notes_fts MATCH ?
         ORDER BY rank, n.\"order\" ASC, n.created_at DESC
         LIMIT {} OFFSET {}",
        limit, offset
    );

    (sql, vec![enhanced_query])
}

fn perform_like_search(
    conn: &rusqlite::Connection,
    query: &str,
    limit: i64,
    offset: i64,
) -> (String, Vec<String>) {
    let like_pattern = format!("%{}%", query);

    let sql = format!(
        "SELECT id, title, content, created_at, updated_at, priority, labels, deadline, reminder_minutes, done, state_id, \"order\"
         FROM notes
         WHERE title LIKE ? OR content LIKE ?
         ORDER BY \"order\" ASC, created_at DESC
         LIMIT {} OFFSET {}",
        limit, offset
    );

    (sql, vec![like_pattern.clone(), like_pattern])
}

fn enhance_search_query(query: &str) -> String {
    // Enhance the search query for better FTS results
    let words: Vec<&str> = query.split_whitespace().collect();

    if words.len() == 1 {
        // Single word - use prefix search
        format!("{}*", words[0])
    } else {
        // Multiple words - use AND operator
        words.iter().map(|word| format!("{}*", word)).collect::<Vec<_>>().join(" AND ")
    }
}