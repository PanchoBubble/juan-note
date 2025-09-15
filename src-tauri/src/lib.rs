mod database;
mod models;
mod commands;

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
        .invoke_handler(tauri::generate_handler![
            greet,
            initialize_db,
            create_note,
            get_note,
            get_all_notes,
            update_note,
            delete_note,
            search_notes
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
