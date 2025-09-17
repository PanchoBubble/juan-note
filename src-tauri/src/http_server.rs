use axum::{
    extract::Json,
    response::Json as JsonResponse,
    routing::{delete, get, patch, post, put},
    Router,
};
use serde_json::json;
use std::net::SocketAddr;
use tower_http::cors::{Any, CorsLayer};

// TODO: Add authentication middleware
// - Implement JWT token validation
// - Add Bearer token extraction from Authorization header
// - Validate token against user sessions
// - Return 401 Unauthorized for invalid/missing tokens
// - Consider rate limiting for API endpoints

use crate::commands::*;
use crate::models::*;

// Note Management Endpoints
async fn create_note_handler(Json(request): Json<CreateNoteRequest>) -> JsonResponse<NoteResponse> {
    match create_note(request) {
        Ok(response) => JsonResponse(response),
        Err(e) => JsonResponse(NoteResponse {
            success: false,
            data: None,
            error: Some(e),
        }),
    }
}

async fn get_note_handler(axum::extract::Path(id): axum::extract::Path<i64>) -> JsonResponse<NoteResponse> {
    match get_note(id) {
        Ok(response) => JsonResponse(response),
        Err(e) => JsonResponse(NoteResponse {
            success: false,
            data: None,
            error: Some(e),
        }),
    }
}

async fn get_all_notes_handler() -> JsonResponse<NotesListResponse> {
    match get_all_notes() {
        Ok(response) => JsonResponse(response),
        Err(e) => JsonResponse(NotesListResponse {
            success: false,
            data: Vec::new(),
            error: Some(e),
        }),
    }
}

async fn update_note_handler(
    axum::extract::Path(id): axum::extract::Path<i64>,
    Json(mut request): Json<UpdateNoteRequest>,
) -> JsonResponse<NoteResponse> {
    request.id = id;
    match update_note(request) {
        Ok(response) => JsonResponse(response),
        Err(e) => JsonResponse(NoteResponse {
            success: false,
            data: None,
            error: Some(e),
        }),
    }
}

async fn delete_note_handler(
    axum::extract::Path(id): axum::extract::Path<i64>,
) -> JsonResponse<NoteResponse> {
    let request = DeleteNoteRequest { id };
    match delete_note(request) {
        Ok(response) => JsonResponse(response),
        Err(e) => JsonResponse(NoteResponse {
            success: false,
            data: None,
            error: Some(e),
        }),
    }
}

async fn search_notes_handler(Json(request): Json<SearchRequest>) -> JsonResponse<NotesListResponse> {
    match search_notes(request) {
        Ok(response) => JsonResponse(response),
        Err(e) => JsonResponse(NotesListResponse {
            success: false,
            data: Vec::new(),
            error: Some(e),
        }),
    }
}

async fn update_note_done_handler(
    axum::extract::Path(id): axum::extract::Path<i64>,
    Json(request): Json<serde_json::Value>,
) -> JsonResponse<NoteResponse> {
    let done = request.get("done")
        .and_then(|v| v.as_bool())
        .unwrap_or(false);

    let request = UpdateNoteDoneRequest { id, done };
    match update_note_done(request) {
        Ok(response) => JsonResponse(response),
        Err(e) => JsonResponse(NoteResponse {
            success: false,
            data: None,
            error: Some(e),
        }),
    }
}

// State Management Endpoints
async fn get_all_states_handler() -> JsonResponse<StatesListResponse> {
    match get_all_states() {
        Ok(response) => JsonResponse(response),
        Err(e) => JsonResponse(StatesListResponse {
            success: false,
            data: Vec::new(),
            error: Some(e),
        }),
    }
}

async fn create_state_handler(Json(request): Json<CreateStateRequest>) -> JsonResponse<StateResponse> {
    match create_state(request) {
        Ok(response) => JsonResponse(response),
        Err(e) => JsonResponse(StateResponse {
            success: false,
            data: None,
            error: Some(e),
        }),
    }
}

async fn update_state_handler(
    axum::extract::Path(id): axum::extract::Path<i64>,
    Json(mut request): Json<UpdateStateRequest>,
) -> JsonResponse<StateResponse> {
    request.id = id;
    match update_state(request) {
        Ok(response) => JsonResponse(response),
        Err(e) => JsonResponse(StateResponse {
            success: false,
            data: None,
            error: Some(e),
        }),
    }
}

async fn delete_state_handler(
    axum::extract::Path(id): axum::extract::Path<i64>,
) -> JsonResponse<StateResponse> {
    match delete_state(id) {
        Ok(response) => JsonResponse(response),
        Err(e) => JsonResponse(StateResponse {
            success: false,
            data: None,
            error: Some(e),
        }),
    }
}

// Bulk Operations Endpoints
async fn bulk_delete_notes_handler(Json(request): Json<BulkDeleteRequest>) -> JsonResponse<BulkOperationResponse> {
    match bulk_delete_notes(request) {
        Ok(response) => JsonResponse(response),
        Err(e) => JsonResponse(BulkOperationResponse {
            success: false,
            successful_count: 0,
            failed_count: 0,
            errors: Some(vec![e]),
            error: Some("Bulk delete failed".to_string()),
        }),
    }
}

async fn bulk_update_priority_handler(Json(request): Json<BulkUpdatePriorityRequest>) -> JsonResponse<BulkOperationResponse> {
    match bulk_update_notes_priority(request) {
        Ok(response) => JsonResponse(response),
        Err(e) => JsonResponse(BulkOperationResponse {
            success: false,
            successful_count: 0,
            failed_count: 0,
            errors: Some(vec![e]),
            error: Some("Bulk priority update failed".to_string()),
        }),
    }
}

async fn bulk_update_done_handler(Json(request): Json<BulkUpdateDoneRequest>) -> JsonResponse<BulkOperationResponse> {
    match bulk_update_notes_done(request) {
        Ok(response) => JsonResponse(response),
        Err(e) => JsonResponse(BulkOperationResponse {
            success: false,
            successful_count: 0,
            failed_count: 0,
            errors: Some(vec![e]),
            error: Some("Bulk done update failed".to_string()),
        }),
    }
}

async fn bulk_update_state_handler(Json(request): Json<BulkUpdateStateRequest>) -> JsonResponse<BulkOperationResponse> {
    match bulk_update_notes_state(request) {
        Ok(response) => JsonResponse(response),
        Err(e) => JsonResponse(BulkOperationResponse {
            success: false,
            successful_count: 0,
            failed_count: 0,
            errors: Some(vec![e]),
            error: Some("Bulk state update failed".to_string()),
        }),
    }
}

async fn bulk_update_order_handler(Json(request): Json<BulkUpdateOrderRequest>) -> JsonResponse<BulkOperationResponse> {
    match bulk_update_notes_order(request) {
        Ok(response) => JsonResponse(response),
        Err(e) => JsonResponse(BulkOperationResponse {
            success: false,
            successful_count: 0,
            failed_count: 0,
            errors: Some(vec![e]),
            error: Some("Bulk order update failed".to_string()),
        }),
    }
}

// Root API documentation endpoint
async fn api_documentation() -> JsonResponse<serde_json::Value> {
    JsonResponse(json!({
        "service": "Juan Note API",
        "version": "1.0.0",
        "description": "REST API for Juan Note application - Note and task management",
        "base_url": "http://localhost:3001",
        "authentication": {
            "required": false,
            "type": "Bearer Token (planned for future)",
            "header": "Authorization: Bearer <token>"
        },
        "endpoints": {
            "api_documentation": {
                "path": "/",
                "method": "GET",
                "description": "Get complete API documentation and usage instructions",
                "response": "This comprehensive API documentation (you're reading it!)"
            },
            "health": {
                "path": "/health",
                "method": "GET",
                "description": "Check API server health and status",
                "response": {
                    "status": "ok",
                    "service": "juan-note-api",
                    "version": "1.0.0"
                }
            },
            "get_all_notes": {
                "path": "/notes",
                "method": "GET",
                "description": "Retrieve all notes with optional filtering",
                "parameters": {
                    "query": "Optional search query string",
                    "limit": "Optional maximum number of results (default: 50, max: 1000)",
                    "offset": "Optional pagination offset (default: 0)"
                },
                "response": {
                    "success": true,
                    "data": [
                        {
                            "id": 1,
                            "title": "Note title",
                            "content": "Note content",
                            "created_at": "2024-01-01T00:00:00Z",
                            "updated_at": "2024-01-01T00:00:00Z",
                            "priority": 0,
                            "labels": ["tag1", "tag2"],
                            "deadline": "2024-12-31T23:59:59Z",
                            "reminder_minutes": 0,
                            "done": false,
                            "state_id": 1,
                            "order": 0
                        }
                    ],
                    "error": null
                }
            },
            "create_note": {
                "path": "/notes",
                "method": "POST",
                "description": "Create a new note",
                "body": {
                    "title": "Required: Note title",
                    "content": "Required: Note content",
                    "priority": "Optional: Priority level (0-5, default: 0)",
                    "labels": "Optional: Array of string labels",
                    "deadline": "Optional: ISO 8601 datetime string",
                    "reminder_minutes": "Optional: Minutes before deadline to remind (default: 0)",
                    "done": "Optional: Completion status (default: false)",
                    "state_id": "Optional: State ID for kanban",
                    "order": "Optional: Display order (default: 0)"
                },
                "response": {
                    "success": true,
                    "data": {
                        "id": 1,
                        "title": "New note",
                        "content": "Note content",
                        "created_at": "2024-01-01T00:00:00Z",
                        "updated_at": "2024-01-01T00:00:00Z",
                        "priority": 0,
                        "labels": [],
                        "deadline": null,
                        "reminder_minutes": 0,
                        "done": false,
                        "state_id": null,
                        "order": 0
                    },
                    "error": null
                }
            },
            "get_note": {
                "path": "/notes/{id}",
                "method": "GET",
                "description": "Get a specific note by ID",
                "parameters": {
                    "id": "Required: Note ID (integer)"
                },
                "response": {
                    "success": true,
                    "data": {
                        "id": 1,
                        "title": "Note title",
                        "content": "Note content",
                        "created_at": "2024-01-01T00:00:00Z",
                        "updated_at": "2024-01-01T00:00:00Z",
                        "priority": 0,
                        "labels": ["tag1"],
                        "deadline": "2024-12-31T23:59:59Z",
                        "reminder_minutes": 60,
                        "done": false,
                        "state_id": 1,
                        "order": 0
                    },
                    "error": null
                }
            },
            "update_note": {
                "path": "/notes/{id}",
                "method": "PUT",
                "description": "Update an existing note (partial updates allowed)",
                "parameters": {
                    "id": "Required: Note ID (integer)"
                },
                "body": {
                    "title": "Optional: New title",
                    "content": "Optional: New content",
                    "priority": "Optional: New priority (0-5)",
                    "labels": "Optional: New array of labels",
                    "deadline": "Optional: New deadline (ISO 8601)",
                    "reminder_minutes": "Optional: New reminder minutes",
                    "done": "Optional: New completion status",
                    "state_id": "Optional: New state ID",
                    "order": "Optional: New display order"
                },
                "response": {
                    "success": true,
                    "data": {
                        "id": 1,
                        "title": "Updated title",
                        "content": "Updated content",
                        "updated_at": "2024-01-01T12:00:00Z"
                    },
                    "error": null
                }
            },
            "delete_note": {
                "path": "/notes/{id}",
                "method": "DELETE",
                "description": "Delete a note by ID",
                "parameters": {
                    "id": "Required: Note ID (integer)"
                },
                "response": {
                    "success": true,
                    "data": {
                        "id": 1,
                        "title": "Deleted note title",
                        "content": "Deleted note content"
                    },
                    "error": null
                }
            },
            "update_note_done": {
                "path": "/notes/{id}/done",
                "method": "PATCH",
                "description": "Update the completion status of a note",
                "parameters": {
                    "id": "Required: Note ID (integer)"
                },
                "body": {
                    "done": "Required: New completion status (boolean)"
                },
                "response": {
                    "success": true,
                    "data": {
                        "id": 1,
                        "done": true,
                        "updated_at": "2024-01-01T12:00:00Z"
                    },
                    "error": null
                }
            },
            "search_notes": {
                "path": "/notes/search",
                "method": "POST",
                "description": "Search notes using full-text search",
                "body": {
                    "query": "Required: Search query string",
                    "limit": "Optional: Max results (default: 50, max: 1000)",
                    "offset": "Optional: Pagination offset (default: 0)"
                },
                "response": {
                    "success": true,
                    "data": [
                        {
                            "id": 1,
                            "title": "Matching note",
                            "content": "Content with search terms"
                        }
                    ],
                    "error": null
                }
            },
            "get_all_states": {
                "path": "/states",
                "method": "GET",
                "description": "Get all available states for kanban board",
                "response": {
                    "success": true,
                    "data": [
                        {
                            "id": 1,
                            "name": "To Do",
                            "position": 0,
                            "color": "#3b82f6",
                            "created_at": "2024-01-01T00:00:00Z",
                            "updated_at": "2024-01-01T00:00:00Z"
                        }
                    ],
                    "error": null
                }
            },
            "create_state": {
                "path": "/states",
                "method": "POST",
                "description": "Create a new state for kanban board",
                "body": {
                    "name": "Required: State name",
                    "position": "Required: Display position (integer)",
                    "color": "Optional: Hex color code (e.g., #3b82f6)"
                },
                "response": {
                    "success": true,
                    "data": {
                        "id": 1,
                        "name": "New State",
                        "position": 1,
                        "color": "#10b981",
                        "created_at": "2024-01-01T00:00:00Z",
                        "updated_at": "2024-01-01T00:00:00Z"
                    },
                    "error": null
                }
            },
            "update_state": {
                "path": "/states/{id}",
                "method": "PUT",
                "description": "Update an existing state",
                "parameters": {
                    "id": "Required: State ID (integer)"
                },
                "body": {
                    "name": "Optional: New name",
                    "position": "Optional: New position",
                    "color": "Optional: New color"
                },
                "response": {
                    "success": true,
                    "data": {
                        "id": 1,
                        "name": "Updated State",
                        "position": 2,
                        "updated_at": "2024-01-01T12:00:00Z"
                    },
                    "error": null
                }
            },
            "delete_state": {
                "path": "/states/{id}",
                "method": "DELETE",
                "description": "Delete a state by ID",
                "parameters": {
                    "id": "Required: State ID (integer)"
                },
                "response": {
                    "success": true,
                    "data": {
                        "id": 1,
                        "name": "Deleted State"
                    },
                    "error": null
                }
            },
            "bulk_delete_notes": {
                "path": "/bulk/notes/delete",
                "method": "POST",
                "description": "Delete multiple notes at once",
                "body": {
                    "note_ids": "Required: Array of note IDs to delete"
                },
                "response": {
                    "success": true,
                    "successful_count": 5,
                    "failed_count": 0,
                    "errors": null,
                    "error": null
                }
            },
            "bulk_update_priority": {
                "path": "/bulk/notes/priority",
                "method": "PATCH",
                "description": "Update priority for multiple notes",
                "body": {
                    "note_ids": "Required: Array of note IDs",
                    "priority": "Required: New priority level (0-5)"
                },
                "response": {
                    "success": true,
                    "successful_count": 3,
                    "failed_count": 0,
                    "errors": null,
                    "error": null
                }
            },
            "bulk_update_done": {
                "path": "/bulk/notes/done",
                "method": "PATCH",
                "description": "Update completion status for multiple notes",
                "body": {
                    "note_ids": "Required: Array of note IDs",
                    "done": "Required: New completion status (boolean)"
                },
                "response": {
                    "success": true,
                    "successful_count": 2,
                    "failed_count": 0,
                    "errors": null,
                    "error": null
                }
            },
            "bulk_update_state": {
                "path": "/bulk/notes/state",
                "method": "PATCH",
                "description": "Update state for multiple notes",
                "body": {
                    "note_ids": "Required: Array of note IDs",
                    "state_id": "Required: New state ID"
                },
                "response": {
                    "success": true,
                    "successful_count": 4,
                    "failed_count": 0,
                    "errors": null,
                    "error": null
                }
            },
            "bulk_update_order": {
                "path": "/bulk/notes/order",
                "method": "PATCH",
                "description": "Update display order for multiple notes",
                "body": {
                    "note_ids": "Required: Array of note IDs",
                    "orders": "Required: Array of order values (same length as note_ids)"
                },
                "response": {
                    "success": true,
                    "successful_count": 3,
                    "failed_count": 0,
                    "errors": null,
                    "error": null
                }
            }
        },
        "usage_instructions": {
            "getting_started": [
                "Start by visiting the root endpoint '/' to get this complete API documentation",
                "Use '/health' to check if the API server is running",
                "All endpoints return JSON responses with 'success', 'data', and 'error' fields"
            ],
            "general": [
                "Use 'success: true' to check if the operation succeeded",
                "Error messages are provided in the 'error' field when success is false",
                "All timestamps are in ISO 8601 format (UTC)",
                "Note IDs and State IDs are integers",
                "Priority levels range from 0 (lowest) to 5 (highest)"
            ],
            "search": [
                "Search supports full-text search across title and content",
                "Use simple keywords or phrases",
                "Search is case-insensitive",
                "Results are ordered by relevance and creation date"
            ],
            "bulk_operations": [
                "Bulk operations are atomic - either all succeed or all fail",
                "Check 'successful_count' and 'failed_count' in response",
                "Individual errors are listed in the 'errors' array",
                "Use bulk operations for better performance with multiple items"
            ],
            "states": [
                "States are used for kanban board organization",
                "Each note can belong to one state",
                "States have position for ordering in the UI",
                "Colors help visually distinguish states"
            ],
            "error_handling": [
                "Always check the 'success' field first",
                "Common errors: invalid ID, missing required fields, database errors",
                "Network errors will result in connection failures",
                "Invalid JSON in request body returns 400 Bad Request"
            ]
        },
        "examples": {
            "api_documentation": {
                "curl": "curl http://localhost:3001/",
                "description": "Get complete API documentation and usage instructions"
            },
            "create_note": {
                "curl": "curl -X POST http://localhost:3001/notes -H 'Content-Type: application/json' -d '{\"title\":\"My Note\",\"content\":\"Note content\"}'",
                "response": "{\"success\":true,\"data\":{\"id\":1,\"title\":\"My Note\",\"content\":\"Note content\"},\"error\":null}"
            },
            "search_notes": {
                "curl": "curl -X POST http://localhost:3001/notes/search -H 'Content-Type: application/json' -d '{\"query\":\"important\"}'",
                "response": "{\"success\":true,\"data\":[{\"id\":1,\"title\":\"Important Task\",\"content\":\"This is important\"}],\"error\":null}"
            },
            "bulk_update": {
                "curl": "curl -X PATCH http://localhost:3001/bulk/notes/done -H 'Content-Type: application/json' -d '{\"note_ids\":[1,2,3],\"done\":true}'",
                "response": "{\"success\":true,\"successful_count\":3,\"failed_count\":0,\"errors\":null,\"error\":null}"
            }
        }
    }))
}

// Health check endpoint
async fn health_check() -> JsonResponse<serde_json::Value> {
    // TODO: Add authentication check for health endpoint
    // - Verify if user is authenticated
    // - Return user info in health response
    JsonResponse(json!({
        "status": "ok",
        "service": "juan-note-api",
        "version": "1.0.0"
    }))
}

pub fn create_router() -> Router {
    // TODO: Add authentication middleware layer
    // - Create auth middleware that validates JWT tokens
    // - Apply to all routes except health check
    // - Extract user ID from token for request context

    Router::new()
        // API documentation (root endpoint)
        .route("/", get(api_documentation))
        // Health check
        .route("/health", get(health_check))

        // Note management
        .route("/notes", post(create_note_handler))
        .route("/notes", get(get_all_notes_handler))
        .route("/notes/search", post(search_notes_handler))
        .route("/notes/:id", get(get_note_handler))
        .route("/notes/:id", put(update_note_handler))
        .route("/notes/:id", delete(delete_note_handler))
        .route("/notes/:id/done", patch(update_note_done_handler))

        // State management
        .route("/states", get(get_all_states_handler))
        .route("/states", post(create_state_handler))
        .route("/states/:id", put(update_state_handler))
        .route("/states/:id", delete(delete_state_handler))

        // Bulk operations
        .route("/bulk/notes/delete", post(bulk_delete_notes_handler))
        .route("/bulk/notes/priority", patch(bulk_update_priority_handler))
        .route("/bulk/notes/done", patch(bulk_update_done_handler))
        .route("/bulk/notes/state", patch(bulk_update_state_handler))
        .route("/bulk/notes/order", patch(bulk_update_order_handler))

        // TODO: Restrict CORS for production
        // - Remove allow_origin(Any) and allow_methods(Any)
        // - Specify allowed origins and methods explicitly
        // - Add proper CORS headers for security
        .layer(CorsLayer::new()
            .allow_origin(Any)
            .allow_methods(Any)
            .allow_headers(Any))
}

pub async fn start_http_server() -> Result<(), Box<dyn std::error::Error>> {
    let app = create_router();

    // Try to find an available port starting from 3001
    let mut port = 3001;
    let addr = loop {
        let addr = SocketAddr::from(([127, 0, 0, 1], port));
        if tokio::net::TcpListener::bind(addr).await.is_ok() {
            break addr;
        }
        port += 1;
        if port > 3100 {
            return Err("No available ports found".into());
        }
    };

    println!("Starting Juan Note API server on http://{}", addr);

    let listener = tokio::net::TcpListener::bind(addr).await?;
    axum::serve(listener, app).await?;

    Ok(())
}