use crate::models::*;
use serde_json;
use std::env;
use std::path::Path;
use tauri::Manager;

#[tauri::command]
pub fn scan_mcp_configs() -> Result<McpScanResponse, String> {
    use std::fs;

    let mut results = Vec::new();

    // Get home directory
    let home_dir = dirs::home_dir().ok_or("Could not determine home directory")?;

    // Config directories to scan (expanded list)
    let mut config_dirs = vec![home_dir.join(".config"), home_dir.clone()];

    // Add platform-specific directories
    #[cfg(target_os = "macos")]
    {
        config_dirs.push(home_dir.join("Library/Application Support"));
        config_dirs.push(home_dir.join("Library/Preferences"));
        // Add specific mac paths mentioned by user
        config_dirs.push(home_dir.join(".config/amp"));
        config_dirs.push(home_dir.join(".config/.claude"));
        config_dirs.push(home_dir.join(".config/opencode"));
        config_dirs.push(home_dir.join(".claude"));
        config_dirs.push(home_dir.join(".config/gemini"));
    }
    #[cfg(target_os = "windows")]
    {
        if let Some(appdata) = std::env::var_os("APPDATA") {
            config_dirs.push(Path::new(&appdata).to_path_buf());
        }
        if let Some(local_appdata) = std::env::var_os("LOCALAPPDATA") {
            config_dirs.push(Path::new(&local_appdata).to_path_buf());
        }
    }
    #[cfg(target_os = "linux")]
    {
        config_dirs.push(home_dir.join(".local/share"));
    }

    // Known MCP client config files and patterns
    let known_configs = vec![
        // Claude Desktop
        ("claude", ".claude.json"),
        ("claude", "claude_desktop_config.json"),
        ("claude", "claude.json"),
        ("claude", "settings.json"),
        // OpenCode
        ("opencode", ".opencode.json"),
        ("opencode", "opencode.json"),
        ("opencode", "settings.json"),
        // Gemini
        ("gemini", "gemini.json"),
        ("gemini", ".gemini.json"),
        ("gemini", "settings.json"),
        // AMP
        ("amp", "amp.json"),
        ("amp", ".amp.json"),
        ("amp", "settings.json"),
        // Continue
        ("continue", "continue.json"),
        ("continue", ".continue.json"),
        ("continue", "config.json"),
        ("continue", "settings.json"),
        // Cline
        ("cline", "cline.json"),
        ("cline", ".cline.json"),
        ("cline", "settings.json"),
        // Specific mac paths mentioned by user
        ("amp", ".config/amp/settings.json"),
        ("claude", ".config/.claude/settings.local.json"),
        ("opencode", ".config/opencode/opencode.json"),
        ("claude", ".claude.json"),
        ("gemini", ".config/gemini/settings.json"),
        // Other MCP clients
        ("mcp", "mcp.json"),
        ("mcp", ".mcp.json"),
        ("mcp-client", "mcp-client.json"),
    ];

    // Scan known config files
    for config_dir in &config_dirs {
        if !config_dir.exists() {
            continue;
        }

        for (provider, filename) in &known_configs {
            let config_path = config_dir.join(filename);

            if config_path.exists() {
                process_config_file(&config_path, provider, &mut results);
            }

            // Also check subdirectories for some clients
            if provider == &"claude" {
                let claude_dir = config_dir.join("Claude");
                if claude_dir.exists() {
                    if let Ok(entries) = fs::read_dir(&claude_dir) {
                        for entry in entries.flatten() {
                            let path = entry.path();
                            if path.extension().and_then(|s| s.to_str()) == Some("json") {
                                process_config_file(&path, provider, &mut results);
                            }
                        }
                    }
                }
            }
        }
    }

    // Also scan for any JSON files that might contain MCP configurations
    scan_for_mcp_json_files(&config_dirs, &mut results);

    Ok(McpScanResponse {
        success: true,
        data: Some(results),
        error: None,
    })
}

#[tauri::command]
pub fn query_mcp_functions() -> Result<McpFunctionQueryResponse, String> {
    // Return functions from the Juan Note MCP server
    // These are API validation and monitoring functions

    let juan_note_functions = vec![
        McpFunction {
            name: "validate_api_endpoints".to_string(),
            description: Some("Validate that all frontend service methods have corresponding backend Tauri commands".to_string()),
            parameters: vec![
                McpFunctionParameter {
                    name: "project_root".to_string(),
                    r#type: "string".to_string(),
                    description: Some("Path to the project root directory".to_string()),
                    required: false,
                },
            ],
            server_name: "juan-note-mcp-server".to_string(),
            server_provider: "juan-note".to_string(),
        },
        McpFunction {
            name: "generate_api_report".to_string(),
            description: Some("Generate a comprehensive API validation report".to_string()),
            parameters: vec![
                McpFunctionParameter {
                    name: "output_path".to_string(),
                    r#type: "string".to_string(),
                    description: Some("Path where to save the report (optional)".to_string()),
                    required: false,
                },
                McpFunctionParameter {
                    name: "include_details".to_string(),
                    r#type: "boolean".to_string(),
                    description: Some("Include detailed type mismatch information".to_string()),
                    required: false,
                },
            ],
            server_name: "juan-note-mcp-server".to_string(),
            server_provider: "juan-note".to_string(),
        },
        McpFunction {
            name: "check_file_changes".to_string(),
            description: Some("Check for recent changes in API-related files".to_string()),
            parameters: vec![
                McpFunctionParameter {
                    name: "since_minutes".to_string(),
                    r#type: "number".to_string(),
                    description: Some("Check changes within the last N minutes".to_string()),
                    required: false,
                },
            ],
            server_name: "juan-note-mcp-server".to_string(),
            server_provider: "juan-note".to_string(),
        },
        McpFunction {
            name: "update_api_documentation".to_string(),
            description: Some("Update the AGENTS.md file with current API information".to_string()),
            parameters: vec![
                McpFunctionParameter {
                    name: "force_update".to_string(),
                    r#type: "boolean".to_string(),
                    description: Some("Force update even if no changes detected".to_string()),
                    required: false,
                },
            ],
            server_name: "juan-note-mcp-server".to_string(),
            server_provider: "juan-note".to_string(),
        },
        McpFunction {
            name: "analyze_code_patterns".to_string(),
            description: Some("Analyze code patterns and suggest improvements".to_string()),
            parameters: vec![
                McpFunctionParameter {
                    name: "file_pattern".to_string(),
                    r#type: "string".to_string(),
                    description: Some("File pattern to analyze (e.g., *.ts, *.rs)".to_string()),
                    required: false,
                },
                McpFunctionParameter {
                    name: "analysis_type".to_string(),
                    r#type: "string".to_string(),
                    description: Some("Type of analysis (consistency, performance, security)".to_string()),
                    required: false,
                },
            ],
            server_name: "juan-note-mcp-server".to_string(),
            server_provider: "juan-note".to_string(),
        },
        McpFunction {
            name: "validate_type_safety".to_string(),
            description: Some("Validate TypeScript and Rust type consistency".to_string()),
            parameters: vec![
                McpFunctionParameter {
                    name: "strict_mode".to_string(),
                    r#type: "boolean".to_string(),
                    description: Some("Enable strict type checking mode".to_string()),
                    required: false,
                },
            ],
            server_name: "juan-note-mcp-server".to_string(),
            server_provider: "juan-note".to_string(),
        },
    ];

    Ok(McpFunctionQueryResponse {
        success: true,
        data: Some(juan_note_functions),
        error: None,
    })
}

#[tauri::command]
pub fn add_juan_note_mcp_server(app: tauri::AppHandle) -> Result<McpScanResponse, String> {
    use std::fs;

    // First scan for all MCP config files
    let scan_result = scan_mcp_configs()?;
    let config_results = scan_result.data.unwrap_or_default();

    // Use the MCP server port (27182) - this is a weird port to avoid conflicts
    let server_port = 27182;

    // Juan Note API configuration for remote MCP server
    let juan_note_config = serde_json::json!({
        "type": "remote",
        "url": format!("http://localhost:{}", server_port),
        "enabled": true,
        "headers": {
            // TODO: Add authentication headers when auth is implemented
            // "Authorization": "Bearer <token>"
        }
    });

    let mut updated_results = Vec::new();

    // Try to add Juan Note MCP server to each config file found
    for config_result in config_results {
        let mut updated_config = config_result.clone();

        match fs::read_to_string(&config_result.config_path) {
            Ok(content) => {
                match serde_json::from_str::<serde_json::Value>(&content) {
                    Ok(mut json) => {
                        // Try to add the server to this config
                        let added = add_server_to_config(
                            &mut json,
                            "juan-note-api",
                            juan_note_config.clone(),
                        );

                        if added {
                            // Write back to file
                            match serde_json::to_string_pretty(&json) {
                                Ok(updated_content) => {
                                    match fs::write(&config_result.config_path, updated_content) {
                                        Ok(_) => {
                                            updated_config.error = Some(
                                                "Successfully added Juan Note MCP server"
                                                    .to_string(),
                                            );
                                        }
                                        Err(e) => {
                                            updated_config.error =
                                                Some(format!("Failed to write config file: {}", e));
                                        }
                                    }
                                }
                                Err(e) => {
                                    updated_config.error =
                                        Some(format!("Failed to serialize config: {}", e));
                                }
                            }
                        } else {
                            updated_config.error = Some(
                                "Could not add Juan Note MCP server to this config format"
                                    .to_string(),
                            );
                        }
                    }
                    Err(e) => {
                        updated_config.error = Some(format!("Failed to parse config file: {}", e));
                    }
                }
            }
            Err(e) => {
                updated_config.error = Some(format!("Failed to read config file: {}", e));
            }
        }

        updated_results.push(updated_config);
    }

    Ok(McpScanResponse {
        success: true,
        data: Some(updated_results),
        error: None,
    })
}

#[tauri::command]
pub fn remove_juan_note_mcp_server() -> Result<McpScanResponse, String> {
    use std::fs;

    // First scan for all MCP config files
    let scan_result = scan_mcp_configs()?;
    let config_results = scan_result.data.unwrap_or_default();

    let mut updated_results = Vec::new();

    // Try to remove Juan Note MCP server from each config file found
    for config_result in config_results {
        let mut updated_config = config_result.clone();

        match fs::read_to_string(&config_result.config_path) {
            Ok(content) => {
                match serde_json::from_str::<serde_json::Value>(&content) {
                    Ok(mut json) => {
                        // Try to remove the server from this config
                        let removed = remove_server_from_config(&mut json, "juan-note-api");

                        if removed {
                            // Write back to file
                            match serde_json::to_string_pretty(&json) {
                                Ok(updated_content) => {
                                    match fs::write(&config_result.config_path, updated_content) {
                                        Ok(_) => {
                                            updated_config.error = Some(
                                                "Successfully removed Juan Note MCP server"
                                                    .to_string(),
                                            );
                                        }
                                        Err(e) => {
                                            updated_config.error =
                                                Some(format!("Failed to write config file: {}", e));
                                        }
                                    }
                                }
                                Err(e) => {
                                    updated_config.error =
                                        Some(format!("Failed to serialize config: {}", e));
                                }
                            }
                        } else {
                            updated_config.error =
                                Some("Juan Note MCP server not found in this config".to_string());
                        }
                    }
                    Err(e) => {
                        updated_config.error = Some(format!("Failed to parse config file: {}", e));
                    }
                }
            }
            Err(e) => {
                updated_config.error = Some(format!("Failed to read config file: {}", e));
            }
        }

        updated_results.push(updated_config);
    }

    Ok(McpScanResponse {
        success: true,
        data: Some(updated_results),
        error: None,
    })
}

#[tauri::command]
pub fn get_mcp_server_config(_app: tauri::AppHandle) -> Result<String, String> {
    // Use the MCP server port (27182) - this is a weird port to avoid conflicts
    let server_port = 27182;

    // Create the MCP server configuration for remote MCP server
    let config = serde_json::json!({
        "mcp": {
            "juan-note-api": {
                "type": "remote",
                "url": format!("http://localhost:{}", server_port),
                "enabled": true,
                "headers": {
                    // TODO: Add authentication headers when auth is implemented
                    // "Authorization": "Bearer <token>"
                }
            }
        }
    });

    Ok(serde_json::to_string_pretty(&config).unwrap())
}

#[tauri::command]
pub fn check_http_server_status() -> Result<serde_json::Value, String> {
    // TODO: Implement actual HTTP server status check
    // - Check if the HTTP server is running on the expected port
    // - Return server status, port, and health information
    // - This can be used by MCP clients to determine if app needs to be launched

    Ok(serde_json::json!({
        "server_running": true, // TODO: Actually check if server is running
        "port": 3001,
        "health_endpoint": "/health",
        "api_endpoints": [
            "/notes",
            "/states",
            "/bulk/notes/*"
        ]
    }))
}

#[tauri::command]
pub fn get_server_port() -> Result<i32, String> {
    // TODO: Make this configurable and persistent
    // - Store port in app config
    // - Handle port conflicts
    // - Allow user to configure custom port
    Ok(3001)
}

#[tauri::command]
pub fn get_launch_info(app: tauri::AppHandle) -> Result<serde_json::Value, String> {
    // TODO: Provide information for MCP clients to launch the app
    // - Get the app executable path
    // - Provide command line arguments if needed
    // - Include working directory
    // - Add platform-specific launch information

    let exe_path = std::env::current_exe()
        .map_err(|e| format!("Failed to get executable path: {}", e))?
        .to_string_lossy()
        .to_string();

    Ok(serde_json::json!({
        "executable_path": exe_path,
        "arguments": [],
        "working_directory": std::env::current_dir()
            .map_err(|e| format!("Failed to get working directory: {}", e))?
            .to_string_lossy(),
        "server_port": 3001,
        "health_check_url": "http://localhost:3001/health",
        "startup_timeout_ms": 10000 // 10 seconds to start HTTP server
    }))
}

fn process_config_file(config_path: &Path, provider: &str, results: &mut Vec<McpConfigResult>) {
    use std::fs;

    let config_path_str = config_path.to_string_lossy().to_string();

    // Check if we already have this config file
    if results.iter().any(|r| r.config_path == config_path_str) {
        return;
    }

    // Try to read and parse the file to see if it has MCP configuration
    match fs::read_to_string(config_path) {
        Ok(content) => {
            match serde_json::from_str::<serde_json::Value>(&content) {
                Ok(json) => {
                    // Check if it has MCP servers section
                    let has_mcp = json.get("mcp").is_some() ||
                                 json.get("servers").is_some() ||
                                 json.get("mcpServers").is_some();

                    if has_mcp {
                        results.push(McpConfigResult {
                            config_path: config_path_str,
                            provider: provider.to_string(),
                            mcp_servers: extract_mcp_servers(&json),
                            error: None,
                        });
                    } else {
                        // Still add it as a potential config file
                        results.push(McpConfigResult {
                            config_path: config_path_str,
                            provider: provider.to_string(),
                            mcp_servers: Vec::new(),
                            error: Some("No MCP configuration found".to_string()),
                        });
                    }
                }
                Err(e) => {
                    results.push(McpConfigResult {
                        config_path: config_path_str,
                        provider: provider.to_string(),
                        mcp_servers: Vec::new(),
                        error: Some(format!("Failed to parse JSON: {}", e)),
                    });
                }
            }
        }
        Err(e) => {
            results.push(McpConfigResult {
                config_path: config_path_str,
                provider: provider.to_string(),
                mcp_servers: Vec::new(),
                error: Some(format!("Failed to read file: {}", e)),
            });
        }
    }
}

fn scan_for_mcp_json_files(config_dirs: &[std::path::PathBuf], results: &mut Vec<McpConfigResult>) {
    for dir in config_dirs {
        if !dir.exists() {
            continue;
        }

        // Walk through directories to find JSON files that might contain MCP configs
        if let Ok(entries) = walk_dir(dir, 3) {
            for entry in entries {
                if entry.extension().and_then(|s| s.to_str()) == Some("json") {
                    // Check if filename suggests MCP config
                    let filename = entry.file_name().and_then(|n| n.to_str()).unwrap_or("");
                    if filename.contains("mcp") ||
                       filename.contains("claude") ||
                       filename.contains("opencode") ||
                       filename.contains("gemini") ||
                       filename.contains("amp") ||
                       filename.contains("cline") ||
                       filename.contains("continue") {
                        process_config_file(&entry, "auto-detected", results);
                    }
                }
            }
        }
    }
}

fn walk_dir(dir: &Path, max_depth: usize) -> Result<Vec<std::path::PathBuf>, std::io::Error> {
    let mut results = Vec::new();
    walk_dir_recursive(dir, max_depth, 0, &mut results)?;
    Ok(results)
}

fn walk_dir_recursive(
    dir: &Path,
    max_depth: usize,
    current_depth: usize,
    results: &mut Vec<std::path::PathBuf>,
) -> Result<(), std::io::Error> {
    if current_depth > max_depth {
        return Ok(());
    }

    let entries = std::fs::read_dir(dir)?;
    for entry in entries {
        let entry = entry?;
        let path = entry.path();

        if path.is_file() {
            results.push(path);
        } else if path.is_dir() && current_depth < max_depth {
            walk_dir_recursive(&path, max_depth, current_depth + 1, results)?;
        }
    }

    Ok(())
}

fn extract_mcp_servers(json: &serde_json::Value) -> Vec<McpServerConfig> {
    let mut servers = Vec::new();

    // Try different possible MCP server locations in the JSON
    if let Some(mcp) = json.get("mcp") {
        if let Some(servers_obj) = mcp.get("servers") {
            if let Some(obj) = servers_obj.as_object() {
                for (name, config) in obj {
                    if let Ok(server_config) = serde_json::from_value(config.clone()) {
                        servers.push(server_config);
                    }
                }
            }
        }
    }

    // Also check top-level servers
    if let Some(servers_obj) = json.get("servers") {
        if let Some(obj) = servers_obj.as_object() {
            for (name, config) in obj {
                if let Ok(server_config) = serde_json::from_value(config.clone()) {
                    servers.push(server_config);
                }
            }
        }
    }

    servers
}

fn extract_server_config(
    json: &serde_json::Value,
    server_name: &str,
) -> Option<McpServerConfig> {
    // Try different possible locations
    if let Some(mcp) = json.get("mcp") {
        if let Some(servers) = mcp.get("servers") {
            if let Some(server) = servers.get(server_name) {
                return serde_json::from_value(server.clone()).ok();
            }
        }
    }

    if let Some(servers) = json.get("servers") {
        if let Some(server) = servers.get(server_name) {
            return serde_json::from_value(server.clone()).ok();
        }
    }

    None
}

fn remove_server_from_config(
    json: &mut serde_json::Value,
    server_name: &str,
) -> bool {
    // Try to remove from mcp object (OpenCode format)
    if let Some(mcp) = json.get_mut("mcp") {
        if let Some(obj) = mcp.as_object_mut() {
            if obj.remove(server_name).is_some() {
                return true;
            }
        }
    }

    // Try to remove from servers object
    if let Some(servers) = json.get_mut("servers") {
        if let Some(obj) = servers.as_object_mut() {
            if obj.remove(server_name).is_some() {
                return true;
            }
        }
    }

    // Try to remove from top level
    if let Some(obj) = json.as_object_mut() {
        if obj.remove(server_name).is_some() {
            return true;
        }
    }

    false
}

fn add_server_to_config(
    json: &mut serde_json::Value,
    server_name: &str,
    server_config: serde_json::Value,
) -> bool {
    // Try to add directly to mcp object (OpenCode format)
    if let Some(mcp) = json.get_mut("mcp") {
        if let Some(obj) = mcp.as_object_mut() {
            obj.insert(server_name.to_string(), server_config);
            return true;
        }
    } else {
        // Create mcp object if it doesn't exist
        if let Some(obj) = json.as_object_mut() {
            let mut mcp_obj = serde_json::Map::new();
            mcp_obj.insert(server_name.to_string(), server_config);
            obj.insert("mcp".to_string(), serde_json::Value::Object(mcp_obj));
            return true;
        }
    }

    // Fallback: Try top-level servers (some MCP clients)
    if let Some(servers) = json.get_mut("servers") {
        if let Some(obj) = servers.as_object_mut() {
            obj.insert(server_name.to_string(), server_config);
            return true;
        }
    } else {
        // Try to add directly at top level (alternative format)
        if let Some(obj) = json.as_object_mut() {
            // Check if this looks like a config that expects servers at top level
            let has_existing_servers = obj.keys().any(|k| k == "mcp" || k == "servers" || k == "mcpServers");
            if !has_existing_servers {
                obj.insert(server_name.to_string(), server_config);
                return true;
            } else {
                // Create top-level servers object
                let mut servers = serde_json::Map::new();
                servers.insert(server_name.to_string(), server_config);
                obj.insert("servers".to_string(), serde_json::Value::Object(servers));
                return true;
            }
        }
    }

    false
}
