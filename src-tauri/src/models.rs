use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

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