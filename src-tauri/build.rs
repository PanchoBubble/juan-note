use std::process::Command;
use std::path::Path;

fn main() {
    // Build the MCP server
    println!("cargo:warning=Building Juan Note MCP server...");

    let mcp_server_path = Path::new("../mcp-server");

    if mcp_server_path.exists() {
        let status = Command::new("npm")
            .args(&["run", "build"])
            .current_dir(mcp_server_path)
            .status()
            .expect("Failed to build MCP server");

        if !status.success() {
            panic!("Failed to build MCP server");
        }

        println!("cargo:warning=Juan Note MCP server built successfully");
    } else {
        println!("cargo:warning=MCP server directory not found, skipping build");
    }

    tauri_build::build()
}
