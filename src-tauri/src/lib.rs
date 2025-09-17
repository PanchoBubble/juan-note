mod commands;
mod database;
mod http_server;
mod models;

use commands::*;

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            initialize_db,
            create_note,
            get_note,
            get_all_notes,
            update_note,
            delete_note,
            search_notes,
            update_note_done,
            get_all_states,
            create_state,
            update_state,
            delete_state,
            migrate_notes_to_states,
            bulk_delete_notes,
            bulk_update_notes_priority,
            bulk_update_notes_done,
            bulk_update_notes_state,
            bulk_update_notes_order,
            scan_mcp_configs,
            query_mcp_functions,
            add_juan_note_mcp_server,
            remove_juan_note_mcp_server,
            get_mcp_server_config,
            check_http_server_status,
            get_server_port,
            get_launch_info
        ])
        .setup(|app| {
            // Initialize database on startup
            let _ = initialize_db();

            // Start HTTP server in background
            let app_handle = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                if let Err(e) = http_server::start_http_server().await {
                    eprintln!("Failed to start HTTP server: {}", e);
                }
            });

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
