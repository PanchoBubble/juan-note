# Agents Documentation - Juan Note

## Overview

This document provides comprehensive guidance for AI agents working on the Juan Note application, a Tauri-based note-taking application with React frontend and Rust backend.

## Architecture Overview

**Juan Note** is a desktop note-taking application built with:
- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS
- **Backend**: Tauri (Rust) with SQLite database
- **Communication**: Tauri IPC commands between frontend and backend

## API Connection Patterns

### Current API Structure

All client-backend communication happens through Tauri's `invoke` API. The following patterns are established:

#### Frontend Service Layer (`src/services/noteService.ts`)
```typescript
// All API calls follow this pattern:
static async methodName(params): Promise<ResponseType> {
  try {
    return await invoke('command_name', { paramName: params });
  } catch (error) {
    return { success: false, error: error.message };
  }
}
```

#### Backend Command Layer (`src-tauri/src/commands.rs`)
```rust
// All commands follow this pattern:
#[tauri::command]
pub fn command_name(params: RequestType) -> Result<ResponseType, String> {
  // Implementation
}
```

### Existing API Endpoints

| Frontend Method | Tauri Command | Purpose |
|----------------|---------------|---------|
| `initializeDatabase()` | `initialize_db` | Initialize SQLite database |
| `createNote(request)` | `create_note` | Create new note |
| `getNote(id)` | `get_note` | Get single note by ID |
| `getAllNotes()` | `get_all_notes` | Get all notes |
| `updateNote(request)` | `update_note` | Update existing note |
| `deleteNote(request)` | `delete_note` | Delete note |
| `searchNotes(request)` | `search_notes` | Full-text search notes |

## MCP Server Integration Requirements

### Why MCP Server is Needed

To ensure any new API connection to the client is properly tracked and managed, we need an MCP (Model Context Protocol) server that:

1. **Monitors API Changes**: Tracks when new Tauri commands are added
2. **Validates Consistency**: Ensures frontend service methods match backend commands
3. **Documents APIs**: Automatically maintains API documentation
4. **Type Safety**: Verifies request/response type consistency

### MCP Server Implementation Plan

The MCP server should be implemented as a separate Node.js service that:

#### Core Responsibilities
1. **File Watching**: Monitor changes in:
   - `src/services/noteService.ts`
   - `src-tauri/src/commands.rs`
   - `src/types/note.ts`

2. **API Validation**: 
   - Verify each frontend service method has corresponding Tauri command
   - Check parameter and return type consistency
   - Validate error handling patterns

3. **Documentation Generation**:
   - Auto-generate API documentation
   - Update this AGENTS.md file when APIs change
   - Maintain OpenAPI-style specifications

4. **Developer Notifications**:
   - Alert when API mismatches are detected
   - Suggest fixes for inconsistencies
   - Provide integration guidance

## Development Guidelines for Agents

### Adding New API Endpoints

When adding new API functionality, follow this checklist:

#### 1. Define Types First (`src/types/note.ts`)
```typescript
// Add request/response types
export interface NewFeatureRequest {
  // Define request parameters
}

export interface NewFeatureResponse {
  success: boolean;
  data?: NewFeatureData;
  error?: string;
}
```

#### 2. Implement Backend Command (`src-tauri/src/commands.rs`)
```rust
#[tauri::command]
pub fn new_feature_command(request: NewFeatureRequest) -> Result<NewFeatureResponse, String> {
    // Implementation with proper error handling
}
```

#### 3. Add Frontend Service Method (`src/services/noteService.ts`)
```typescript
static async newFeature(request: NewFeatureRequest): Promise<NewFeatureResponse> {
  try {
    return await invoke('new_feature_command', { request });
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
```

#### 4. Register Command in Tauri (`src-tauri/src/lib.rs`)
```rust
// Add to the command list in main.rs or lib.rs
.invoke_handler(tauri::generate_handler![
    // existing commands...
    new_feature_command
])
```

### Code Conventions

#### Error Handling
- All API methods must return responses with `success` boolean
- Include descriptive error messages
- Log errors on both frontend and backend
- Never expose internal implementation details in error messages

#### Type Safety
- Use TypeScript interfaces for all request/response types
- Maintain type consistency between frontend and backend
- Use Rust's type system for compile-time safety

#### Database Operations
- All database operations go through the singleton connection
- Use transactions for multi-step operations
- Include proper error handling for SQLite operations

### Testing Requirements

When adding new APIs:
1. **Unit Tests**: Test individual commands and service methods
2. **Integration Tests**: Test full frontend-to-backend flow
3. **Error Cases**: Test all error scenarios
4. **Type Tests**: Verify TypeScript compilation

### Security Considerations

- Validate all input parameters
- Use parameterized queries for database operations
- Sanitize user content before storage
- Implement proper access controls if adding authentication

## Current Limitations & Improvement Areas

1. **No Authentication**: All notes are accessible to all users
2. **No Real-time Sync**: Changes aren't synchronized across instances
3. **Limited Search**: Basic FTS, could be enhanced
4. **No Export/Import**: No data portability features
5. **No Attachments**: Text-only notes

## MCP Server Specification

### Proposed MCP Server Structure

```
mcp-server/
├── package.json
├── src/
│   ├── index.ts          # Main server entry
│   ├── watchers/         # File watching logic
│   ├── validators/       # API validation logic
│   ├── generators/       # Documentation generators
│   └── types/           # MCP server types
└── config/
    └── mcp-config.json  # Server configuration
```

### Key Features to Implement

1. **Real-time Monitoring**: Watch for file changes using `chokidar`
2. **AST Parsing**: Parse TypeScript and Rust files to extract API definitions
3. **Validation Engine**: Compare frontend and backend API definitions
4. **Documentation Generator**: Auto-update documentation files
5. **Integration Alerts**: Notify developers of API inconsistencies

## Summary

All API endpoints are properly synchronized between frontend and backend. ✅

# API Validation Report

**Generated:** 2025-09-15T18:28:39.381Z
**Status:** ✅ Valid

## Summary

All API endpoints are properly synchronized between frontend and backend. ✅

## Next Steps

1. Create MCP server implementation
2. Set up file watchers for the key API files
3. Implement validation logic for API consistency
4. Create automated documentation generation
5. Integrate MCP server into development workflow

---

*This document should be updated automatically by the MCP server when API changes are detected.*