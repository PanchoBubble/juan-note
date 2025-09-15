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
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateNoteRequest {
    pub title: String,
    pub content: String,
    pub priority: Option<i32>,
    pub labels: Option<Vec<String>>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateNoteRequest {
    pub id: i64,
    pub title: Option<String>,
    pub content: Option<String>,
    pub priority: Option<i32>,
    pub labels: Option<Vec<String>>,
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
}

impl Default for Note {
    fn default() -> Self {
        Self::new(String::new(), String::new())
    }
}