# Juan Note MCP Server

Model Context Protocol (MCP) server for monitoring and validating API connections between the Juan Note frontend and backend.

## Purpose

This MCP server serves two main purposes:

### API Monitoring & Validation
Ensures that:
- Every frontend API call has a corresponding Tauri backend command
- Every Tauri command has a corresponding frontend service method
- Request/response types are consistent between frontend and backend
- API documentation stays up-to-date automatically

### LLM Integration
Provides standardized access to Juan Note functionality for Large Language Models:
- 16 MCP tools for comprehensive note management
- Secure access controls and rate limiting
- Configurable deployment options
- Support for multiple LLM clients (opencode, Claude Desktop, etc.)

## Features

### API Monitoring & Validation
- **Real-time Monitoring**: Watches for changes in API-related files
- **Automatic Validation**: Validates API consistency on file changes
- **Documentation Generation**: Auto-updates AGENTS.md with validation results
- **Type Safety**: Checks for type mismatches between frontend and backend
- **Developer Notifications**: Alerts when API inconsistencies are detected

### LLM Integration
- **16 MCP Tools**: Comprehensive note and state management
- **Security Controls**: Access control, rate limiting, input validation
- **Multi-Client Support**: Compatible with opencode, Claude Desktop, and other MCP clients
- **Deployment Options**: Docker support with environment-specific configurations
- **Bulk Operations**: Efficient handling of multiple notes at once

## Installation

```bash
cd mcp-server
npm install
```

## Usage

### Development Mode
```bash
npm run dev
```

### HTTP Server Mode (Remote MCP)
For remote MCP server access, run in HTTP mode:
```bash
# Development
npm run dev:http

# Production
npm run build
npm run start:http
```

The HTTP server runs on port 27182 by default (configurable via MCP_PORT environment variable).

### SSE Server Mode (Server-Sent Events) - Experimental
For real-time MCP server access with Server-Sent Events (currently experimental):
```bash
# Development
npm run dev:sse

# Production
npm run build
npm run start:sse
```

**Note**: SSE mode is currently experimental and may have compatibility issues with some MCP clients. Use HTTP mode for stable operation.

SSE mode provides:
- Real-time bidirectional communication
- Automatic reconnection handling
- Better performance for long-running operations
- Compatible with opencode clients that support SSE transport

### Type Checking
```bash
npm run type-check
```

### LLM Integration

#### With opencode (Local Mode)
Add to your `opencode.json`:
```json
{
  "mcp": {
    "juan-note": {
      "type": "local",
      "command": ["node", "/path/to/juan-note/mcp-server/dist/index.js"],
      "enabled": true
    }
  }
}
```

#### With opencode (Remote HTTP Mode) - Recommended
For remote MCP server access, configure opencode to connect to the HTTP endpoint:
```json
{
  "mcp": {
    "juan-note": {
      "type": "remote",
      "url": "http://localhost:27182",
      "enabled": true
    }
  }
}
```

#### With opencode (Remote SSE Mode) - Experimental
For Server-Sent Events transport (currently experimental):
```json
{
  "mcp": {
    "juan-note": {
      "type": "remote",
      "url": "http://localhost:27182/sse",
      "enabled": true
    }
  }
}
```

#### With Claude Desktop
Add to `claude_desktop_config.json`:
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

#### Docker Deployment
```bash
# Build and run with Docker
docker-compose -f mcp-server/docker/docker-compose.yml up -d
```

## Configuration

Edit `config/mcp-config.json` to customize:

```json
{
  "projectRoot": "/path/to/juan-note",
  "watchPaths": [
    "src/services",
    "src-tauri/src",
    "src/types"
  ],
  "outputPath": "api-validation-report.md",
  "validateOnChange": true,
  "generateDocs": true,
  "server": {
    "modes": {
      "stdio": {
        "enabled": true,
        "description": "Local MCP server using stdio transport"
      },
      "http": {
        "enabled": true,
        "port": 27182,
        "host": "localhost",
        "description": "Remote MCP server using HTTP transport"
      }
    },
    "defaultMode": "stdio"
  }
}
```

### Environment Variables

- `MCP_MODE`: Set to "http" to run in HTTP server mode (default: "stdio")
- `MCP_PORT`: HTTP server port (default: 27182)

## Monitored Files

The server watches these key files for changes:

- `src/services/noteService.ts` - Frontend API service
- `src-tauri/src/commands.rs` - Backend Tauri commands  
- `src/types/note.ts` - Type definitions
- `AGENTS.md` - Developer documentation

## Validation Rules

### Missing Backend Implementation
Triggers when a frontend service method calls `invoke()` with a command name that doesn't exist in the backend.

### Missing Frontend Implementation  
Triggers when a Tauri command is defined in the backend but no frontend service method calls it.

### Type Mismatches
Triggers when request/response types don't match between frontend and backend.

## Output

### Console Output
Real-time validation results are displayed in the console:

```
🚀 Starting Juan Note MCP Server...
📁 Project Root: /Users/juan/juan-note
👀 Watching paths: src/services, src-tauri/src, src/types
🔍 Running API validation...
✅ All APIs are synchronized
```

### Documentation Updates
The server automatically updates `AGENTS.md` with validation results and maintains an `api-validation-report.md` file.

### Error Notifications
When issues are found:

```
⚠️  API issues found:
  Missing backend: new_feature_command
  Type mismatches: 2
```

## Integration with Development Workflow

1. **Start the MCP server** when beginning development
2. **Make API changes** to frontend or backend
3. **Automatic validation** runs when files are saved
4. **Review notifications** for any inconsistencies
5. **Documentation updates** automatically

## Troubleshooting

### Server Won't Start
- Check that the project root path is correct in config
- Ensure all watched directories exist
- Verify Node.js version compatibility

### Validation Issues
- Check that Tauri commands are properly annotated with `#[tauri::command]`
- Verify frontend service methods use correct `invoke()` command names
- Ensure type definitions are consistent

### File Watching Issues
- Check file permissions for watched directories
- Verify paths in configuration are correct
- Restart server if file watching stops working

## Contributing

When adding new features to the MCP server:

1. Update type definitions in `src/types/`
2. Add validation logic in `src/validators/`
3. Update documentation generation in `src/generators/`
4. Test with the Juan Note project

## Architecture

```
mcp-server/
├── src/
│   ├── index.ts          # Main server entry point
│   ├── types/            # TypeScript type definitions
│   ├── watchers/         # File watching logic
│   ├── validators/       # API validation logic
│   └── generators/       # Documentation generation
├── config/
│   └── mcp-config.json   # Server configuration
└── package.json
```

The server follows a modular architecture where each component has a specific responsibility:

- **Watchers**: Monitor file system changes
- **Validators**: Analyze API consistency  
- **Generators**: Create and update documentation
- **Types**: Provide type safety across all components