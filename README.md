# Tauri + React + Typescript

This template should help get you started developing with Tauri, React and Typescript in Vite.

## Recommended IDE Setup

- [VS Code](https://code.visualstudio.com/) + [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)

## MCP Server Integration

This project includes an MCP (Model Context Protocol) server that provides API validation tools for the Juan Note application. The MCP server can be integrated with compatible clients like [opencode](https://opencode.ai).

### Setting up MCP Server

1. **Build the MCP server:**

   ```bash
   cd mcp-server
   npm install
   npm run build
   ```

2. **Configure opencode:**
   Copy `opencode.json.example` to `opencode.json` and customize as needed:

   ```bash
   cp opencode.json.example opencode.json
   ```

3. **Alternative: Use Juan Note app for automatic configuration:**
   Launch the Juan Note desktop application and use the MCP integration feature to automatically add the server to your opencode configuration.

### Available MCP Tools

- `validate_api_consistency`: Validates API consistency between frontend and backend
- `generate_api_report`: Generates API validation reports
- `check_api_endpoint`: Checks specific API endpoints

For more details, see [AGENTS.md](./AGENTS.md).
