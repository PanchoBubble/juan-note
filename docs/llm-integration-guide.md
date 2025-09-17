# Juan Note MCP Server - LLM Integration Guide

This guide explains how to integrate Juan Note MCP server with various LLM clients and platforms.

## Overview

The Juan Note MCP server allows LLMs to interact with your note-taking application through a standardized protocol. Users can manage notes, states, and perform bulk operations directly through their LLM of choice.

## Supported LLM Clients

### 1. opencode (Recommended)

**Installation:**

```bash
# Ensure Juan Note MCP server is built
cd mcp-server && npm run build

# Add to opencode configuration
# Edit your opencode.json or use the Juan Note app's MCP integration
```

**Configuration:**

```json
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "juan-note": {
      "type": "local",
      "command": ["node", "/path/to/juan-note/mcp-server/dist/index.js"],
      "enabled": true
    }
  }
}
```

**Usage:**
Once configured, you can use natural language commands like:

- "Create a note about my meeting with the design team"
- "Show me all my high-priority notes"
- "Mark the shopping list note as completed"
- "Find notes containing 'project deadline'"

### 2. Claude Desktop

**Installation:**

```bash
# Build the MCP server
cd mcp-server && npm run build

# Add to Claude Desktop configuration
# Location: ~/Library/Application Support/Claude/claude_desktop_config.json (macOS)
#          %APPDATA%/Claude/claude_desktop_config.json (Windows)
```

**Configuration:**

```json
{
  "mcpServers": {
    "juan-note": {
      "command": "node",
      "args": ["/path/to/juan-note/mcp-server/dist/index.js"]
    }
  }
}
```

### 3. Gemini/Cursor

**Installation:**
Similar to Claude Desktop, add the MCP server to your Gemini configuration file.

## Current Limitations

### 1. Localhost Dependency

- **Issue**: MCP server requires Juan Note to be running on localhost:1420
- **Impact**: Users must have Juan Note app running to use MCP functionality
- **Workaround**: Keep Juan Note running in background

### 2. No Authentication

- **Issue**: No user authentication or session management
- **Impact**: Any LLM client can access all notes
- **Security**: Relies on local network security

### 3. No Streaming Responses

- **Issue**: Bulk operations return results all at once
- **Impact**: Long operations may timeout or appear unresponsive
- **Limitation**: No progress indicators for large operations

### 4. No Real-time Updates

- **Issue**: Changes made through MCP don't trigger real-time UI updates
- **Impact**: User must refresh Juan Note manually to see changes
- **Limitation**: No live synchronization

### 5. Limited Error Context

- **Issue**: Error messages are generic to avoid information leakage
- **Impact**: Debugging issues requires checking Juan Note logs
- **Limitation**: LLMs get limited diagnostic information

### 6. No Caching

- **Issue**: Every request goes to Juan Note backend
- **Impact**: Slower response times for repeated queries
- **Limitation**: No performance optimization for frequent operations

## Available Tools

The MCP server provides 16 tools organized by functionality:

### Note Management (7 tools)

- `create_note`: Create new notes with title, content, priority, labels, deadline
- `get_note`: Retrieve specific note by ID
- `get_all_notes`: List all notes
- `update_note`: Modify existing notes
- `delete_note`: Remove notes by ID
- `search_notes`: Full-text search with pagination
- `update_note_done`: Mark notes as completed/incomplete

### State Management (4 tools)

- `get_all_states`: List available note states/categories
- `create_state`: Add new states with name, position, color
- `update_state`: Modify existing states
- `delete_state`: Remove states

### Bulk Operations (5 tools)

- `bulk_delete_notes`: Delete multiple notes at once
- `bulk_update_notes_priority`: Change priority for multiple notes
- `bulk_update_notes_done`: Mark multiple notes as done/undone
- `bulk_update_notes_state`: Change state for multiple notes
- `bulk_update_notes_order`: Reorder multiple notes

## Best Practices for LLM Usage

### 1. Be Specific

Instead of "create a note", use:

- "Create a high-priority note titled 'Meeting Notes' with content about the design review"

### 2. Use Context

Provide context for better results:

- "Find all notes related to the Q1 project that are not completed"

### 3. Batch Operations

Use bulk operations for efficiency:

- "Mark all notes with 'shopping' in the title as completed"

### 4. Search Effectively

Leverage full-text search:

- "Search for notes containing 'deadline' with priority 4 or higher"

## Troubleshooting

### MCP Server Won't Start

```bash
# Check if Juan Note is running
curl http://localhost:1420

# Verify MCP server builds
cd mcp-server && npm run build

# Check for errors
cd mcp-server && npm run dev
```

### Tools Not Available

- Ensure MCP server is properly configured in your LLM client
- Check that Juan Note application is running
- Verify the MCP server path is correct

### Operations Fail

- Check Juan Note application logs
- Verify note IDs exist before operations
- Ensure bulk operations don't exceed size limits (50 items)

### Rate Limiting

- Bulk delete: 2 operations per minute
- Other bulk operations: 5 per minute
- Individual operations: 5-60 per minute (depending on operation)

## Future Improvements

### Planned Features

1. **Streaming Responses**: Progress indicators for long operations
2. **Real-time Updates**: Live synchronization with Juan Note UI
3. **Authentication**: Secure access control
4. **Caching**: Performance optimization
5. **Remote Access**: Access notes from different machines
6. **Advanced Search**: Filters, sorting, and complex queries

### Configuration Options

- Environment-specific settings (development/production)
- Custom rate limits
- Feature toggles
- Security settings

## Development

To contribute to LLM integration improvements:

1. Test with multiple LLM clients
2. Provide feedback on usability issues
3. Suggest new tools or features
4. Report security concerns

## Support

For issues with LLM integration:

1. Check this guide first
2. Verify Juan Note and MCP server are running
3. Test with simple operations before complex ones
4. Check Juan Note application logs for errors
