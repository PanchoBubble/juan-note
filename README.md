# Juan Note

A modern note-taking application built with Tauri, React, and TypeScript, featuring comprehensive MCP (Model Context Protocol) integration for LLM access.

## Installation

### For Users

1. **Download and install** Juan Note from the [releases page](https://github.com/your-repo/juan-note/releases)
2. **Install MCP Server** (optional, for LLM integration):
   ```bash
   # The app will prompt you to install the MCP server on first run
   # Or run manually from the installation directory:
   npm run mcp:install-user
   ```
3. **Configure your LLM client** following the [LLM Integration Guide](docs/llm-integration-guide.md)

### For Developers

```bash
# Install dependencies
npm install

# Build MCP server
npm run mcp:build

# Run in development mode
npm run dev

# Build for production
npm run tauri build
```

## Recommended IDE Setup

- [VS Code](https://code.visualstudio.com/) + [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)

## MCP Server Integration

Juan Note includes a comprehensive MCP (Model Context Protocol) server that enables LLMs to interact with your notes through natural language. The server provides 16 tools for complete note management and supports multiple LLM clients.

### Features

- **16 MCP Tools**: Full CRUD operations for notes and states
- **Security Controls**: Rate limiting, input validation, and access controls
- **Multi-Client Support**: Compatible with opencode, Claude Desktop, and other MCP clients
- **Deployment Options**: Docker support and environment-specific configurations
- **Streaming Support**: Progress tracking for long-running operations

### Setting up MCP Server

#### Option 1: Automatic Installation (Recommended)

1. Install and launch Juan Note
2. Use the MCP integration feature in Settings to automatically install and configure the MCP server

#### Option 2: Manual Installation

```bash
# Install MCP server to user directory
npm run mcp:install-user

# Configure your LLM client (see examples below)
```

#### Option 3: Development Setup

```bash
# Build MCP server
npm run mcp:build

# Configure opencode or other clients manually
```

### LLM Client Configuration

#### opencode

```json
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "juan-note": {
      "type": "local",
      "command": ["node", "/path/to/juan-note-mcp-server/index.js"],
      "enabled": true
    }
  }
}
```

#### Claude Desktop

```json
{
  "mcpServers": {
    "juan-note": {
      "command": "node",
      "args": ["/path/to/juan-note-mcp-server/index.js"]
    }
  }
}
```

### Available MCP Tools

#### Note Management (7 tools)

- `create_note`: Create new notes with full metadata
- `get_note`: Retrieve specific notes by ID
- `get_all_notes`: List all notes
- `update_note`: Modify existing notes
- `delete_note`: Remove notes by ID
- `search_notes`: Full-text search with pagination
- `update_note_done`: Mark notes as completed/incomplete

#### State Management (4 tools)

- `get_all_states`: List available note states/categories
- `create_state`: Add new states with custom colors
- `update_state`: Modify existing states
- `delete_state`: Remove states

#### Bulk Operations (5 tools)

- `bulk_delete_notes`: Delete multiple notes at once
- `bulk_update_notes_priority`: Change priority for multiple notes
- `bulk_update_notes_done`: Mark multiple notes as done/undone
- `bulk_update_notes_state`: Change state for multiple notes
- `bulk_update_notes_order`: Reorder multiple notes

For detailed setup instructions and troubleshooting, see the [LLM Integration Guide](docs/llm-integration-guide.md).
