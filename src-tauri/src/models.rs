use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct State {
    pub id: Option<i64>,
    pub name: String,
    pub position: i32,
    pub color: Option<String>,
    pub created_at: Option<DateTime<Utc>>,
    pub updated_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateStateRequest {
    pub name: String,
    pub position: i32,
    pub color: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateStateRequest {
    pub id: i64,
    pub name: Option<String>,
    pub position: Option<i32>,
    pub color: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct StateResponse {
    pub success: bool,
    pub data: Option<State>,
    pub error: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct StatesListResponse {
    pub success: bool,
    pub data: Vec<State>,
    pub error: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Note {
    pub id: Option<i64>,
    pub title: String,
    pub content: String,
    pub created_at: Option<DateTime<Utc>>,
    pub updated_at: Option<DateTime<Utc>>,
    pub priority: i32,
    pub labels: Vec<String>,
    pub deadline: Option<DateTime<Utc>>,
    pub reminder_minutes: i32,
    pub done: bool,
    pub state_id: Option<i64>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateNoteRequest {
    pub title: String,
    pub content: String,
    pub priority: Option<i32>,
    pub labels: Option<Vec<String>>,
    pub deadline: Option<DateTime<Utc>>,
    pub reminder_minutes: Option<i32>,
    pub done: Option<bool>,
    pub state_id: Option<i64>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateNoteRequest {
    pub id: i64,
    pub title: Option<String>,
    pub content: Option<String>,
    pub priority: Option<i32>,
    pub labels: Option<Vec<String>>,
    pub deadline: Option<DateTime<Utc>>,
    pub reminder_minutes: Option<i32>,
    pub done: Option<bool>,
    pub state_id: Option<i64>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct NoteResponse {
    pub success: bool,
    pub data: Option<Note>,
    pub error: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct NotesListResponse {
    pub success: bool,
    pub data: Vec<Note>,
    pub error: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SearchRequest {
    pub query: String,
    pub limit: Option<i32>,
    pub offset: Option<i32>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DeleteNoteRequest {
    pub id: i64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateNoteDoneRequest {
    pub id: i64,
    pub done: bool,
}

// Bulk Operations Types
#[derive(serde::Deserialize)]
pub struct BulkDeleteRequest {
    pub note_ids: Vec<i64>,
}

#[derive(serde::Deserialize)]
pub struct BulkUpdatePriorityRequest {
    pub note_ids: Vec<i64>,
    pub priority: i32,
}

#[derive(serde::Deserialize)]
pub struct BulkUpdateStateRequest {
    pub note_ids: Vec<i64>,
    pub state_id: i64,
}

#[derive(serde::Deserialize)]
pub struct BulkUpdateDoneRequest {
    pub note_ids: Vec<i64>,
    pub done: bool,
}

#[derive(serde::Serialize)]
pub struct BulkOperationResponse {
    pub success: bool,
    pub successful_count: usize,
    pub failed_count: usize,
    pub errors: Option<Vec<String>>,
    pub error: Option<String>,
}

impl Note {
    pub fn new(title: String, content: String) -> Self {
        Self {
            id: None,
            title,
            content,
            created_at: Some(Utc::now()),
            updated_at: Some(Utc::now()),
            priority: 0,
            labels: Vec::new(),
            deadline: None,
            reminder_minutes: 0,
            done: false,
            state_id: None,
        }
    }

    pub fn with_priority(mut self, priority: i32) -> Self {
        self.priority = priority;
        self
    }

    pub fn with_labels(mut self, labels: Vec<String>) -> Self {
        self.labels = labels;
        self
    }

    pub fn with_deadline(mut self, deadline: DateTime<Utc>) -> Self {
        self.deadline = Some(deadline);
        self
    }

    pub fn with_reminder_minutes(mut self, reminder_minutes: i32) -> Self {
        self.reminder_minutes = reminder_minutes;
        self
    }

    pub fn with_done(mut self, done: bool) -> Self {
        self.done = done;
        self
    }
}

impl Default for Note {
    fn default() -> Self {
        Self::new(String::new(), String::new())
    }
}