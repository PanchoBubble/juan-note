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

| Frontend Method        | Tauri Command   | Purpose                    |
| ---------------------- | --------------- | -------------------------- |
| `initializeDatabase()` | `initialize_db` | Initialize SQLite database |
| `createNote(request)`  | `create_note`   | Create new note            |
| `getNote(id)`          | `get_note`      | Get single note by ID      |
| `getAllNotes()`        | `get_all_notes` | Get all notes              |
| `updateNote(request)`  | `update_note`   | Update existing note       |
| `deleteNote(request)`  | `delete_note`   | Delete note                |
| `searchNotes(request)` | `search_notes`  | Full-text search notes     |

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

### Using Planning and Implementation Tools

When working on changes to the codebase:

1. **Planning Changes**: If the user requests planning a change, use the `tools_plan` tool to create a structured plan.

2. **Applying Changes**: When the user asks to apply a change, use the `tools_implement` tool to execute the implementation steps.

3. **No Changes Without Plan**: Do not allow changes to be applied without a previous plan.

This ensures systematic and organized development workflow.

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

## MCP Server Integration

The Juan Note application includes MCP server integration that allows it to be added as an MCP server to opencode and other MCP clients.

### MCP Server Implementation

The MCP server is implemented as a Node.js application that provides comprehensive access to all Juan Note functionality through MCP tools. It focuses exclusively on note management, state management, and bulk operations.

#### Available MCP Tools

**Note Management:**

1. **create_note**: Create a new note with title, content, priority, labels, deadline, etc.
2. **get_note**: Get a specific note by ID
3. **get_all_notes**: Get all notes from Juan Note
4. **update_note**: Update an existing note (partial updates supported)
5. **delete_note**: Delete a note by ID
6. **search_notes**: Search notes using full-text search with query, limit, and offset
7. **update_note_done**: Update the done status of a note

**State Management:** 8. **get_all_states**: Get all available states 9. **create_state**: Create a new state with name, position, and color 10. **update_state**: Update an existing state 11. **delete_state**: Delete a state by ID

**Bulk Operations:** 12. **bulk_delete_notes**: Delete multiple notes at once 13. **bulk_update_notes_priority**: Update priority for multiple notes 14. **bulk_update_notes_done**: Update done status for multiple notes 15. **bulk_update_notes_state**: Update state for multiple notes 16. **bulk_update_notes_order**: Update display order for multiple notes

#### MCP Server Structure

```
mcp-server/
├── package.json          # Node.js dependencies and scripts
├── src/
│   ├── index.ts          # MCP protocol implementation
│   ├── managers/         # Note management and communication logic
│   │   └── noteManager.ts # Handles communication with Juan Note app
│   └── types/           # TypeScript type definitions
└── config/
    └── mcp-config.json  # Server configuration
```

### Configuration in opencode

To use the Juan Note MCP server with opencode, you need to add it to your `opencode.json` configuration file. You can either:

#### Option 1: Manual Configuration

Create or update your `opencode.json` file with the following configuration:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "juan-note-api-validator": {
      "type": "local",
      "command": ["node", "mcp-server/dist/index.js"],
      "enabled": true,
      "environment": {
        "NODE_ENV": "production"
      }
    }
  }
}
```

#### Option 2: Automatic Configuration via Juan Note App

The Juan Note desktop application can automatically add the MCP server to your opencode configuration:

1. Launch the Juan Note application
2. Use the MCP integration feature to scan for and add the server to your opencode.json
3. The app will automatically detect your opencode configuration and add the proper MCP server entry

### Tauri Backend Integration

The Tauri backend provides the core note management functionality that the MCP server interfaces with. The MCP server communicates with the running Juan Note application to execute note operations through Tauri's command system.

### Usage in opencode

Once configured, you can use all MCP tools directly in opencode to manage your notes:

**Note Management:**

- Create notes: `create_note` with title, content, priority, labels, etc.
- Read notes: `get_note` by ID or `get_all_notes` for all notes
- Update notes: `update_note` with partial updates
- Delete notes: `delete_note` by ID
- Search notes: `search_notes` with full-text search
- Mark as done: `update_note_done`

**State Management:**

- View states: `get_all_states`
- Create states: `create_state` with name, position, color
- Update/delete states: `update_state`, `delete_state`

**Bulk Operations:**

- Bulk delete: `bulk_delete_notes` with array of IDs
- Bulk update priority: `bulk_update_notes_priority`
- Bulk update done status: `bulk_update_notes_done`
- Bulk update state: `bulk_update_notes_state`
- Bulk reorder: `bulk_update_notes_order`

## Summary

All API endpoints are properly synchronized between frontend and backend. ✅

# API Validation Report

**Generated:** 2025-09-15T18:28:39.381Z
**Status:** ✅ Valid

## Summary

All API endpoints are properly synchronized between frontend and backend. ✅

## Next Steps

1. ✅ Create MCP server implementation
2. ✅ Update Tauri backend to handle opencode MCP configuration format
3. ✅ Simplify MCP server to focus on note management (16 tools)
4. ✅ Test MCP server integration with opencode - **PASSED**
5. Implement proper error handling and connection management in NoteManager
6. Add support for streaming responses and real-time updates
7. Consider adding note templates and advanced search features

### Remote HTTP Server Mode

For remote MCP server access that follows the Model Context Protocol JSON-RPC 2.0 specification, run the server in HTTP mode:

```bash
cd mcp-server
npm run start:http  # Runs on port 27182 (weird port to avoid conflicts)
```

Then configure opencode for remote access:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "juan-note-mcp-server": {
      "type": "remote",
      "url": "http://localhost:27182",
      "enabled": true
    }
  }
}
```

For Server-Sent Events (SSE) transport with real-time capabilities (currently experimental):

```json
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "juan-note-api-validator": {
      "type": "remote",
      "url": "http://localhost:27182/sse",
      "enabled": true
    }
  }
}
```

**✅ Status: MCP Server is fully compliant and ready for opencode integration**

The MCP server has been tested and verified to work correctly with opencode:

- ✅ All 16 tools are MCP-compliant with required `title` fields
- ✅ JSON-RPC 2.0 protocol implementation is correct
- ✅ opencode can successfully connect and list available tools
- ✅ Tools include: Create Note, Get Note, Update Note, Delete Note, Search Notes, and bulk operations

**Note**: SSE mode has been deprecated. Use HTTP mode for stable, production-ready operation.

The server implements proper JSON-RPC 2.0 responses with `jsonrpc`, `id`, and `result`/`error` fields as required by opencode. HTTP mode provides reliable communication for all MCP operations.

---

_This document should be updated automatically by the MCP server when API changes are detected._
