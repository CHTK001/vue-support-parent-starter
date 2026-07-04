mod db;
mod http_server;
mod scan;
mod system;

use db::{ClientConfig, Database, ModelProvider, UsageStat, UsageSummary, SyncConfig};
use http_server::WebServer;
use scan::{ClientScanResult, SkillEntry};
use std::sync::{Arc, Mutex, OnceLock};
use system::{EnvVar, ProcessInfo, ServiceInfo};

static DB: OnceLock<Arc<Database>> = OnceLock::new();
static WEB_SERVER: OnceLock<Mutex<WebServer>> = OnceLock::new();

pub(crate) fn get_db() -> Arc<Database> {
    DB.get_or_init(|| {
        let db_path = dirs::data_local_dir()
            .unwrap_or_else(|| std::path::PathBuf::from("."))
            .join("mcp-manager")
            .join("data.db");

        std::fs::create_dir_all(db_path.parent().unwrap()).ok();

        Arc::new(Database::new(db_path.to_str().unwrap()).expect("Failed to init database"))
    })
    .clone()
}

pub(crate) fn get_web_server() -> &'static Mutex<WebServer> {
    WEB_SERVER.get_or_init(|| Mutex::new(WebServer::new()))
}

pub(crate) fn get_dist_dir() -> std::path::PathBuf {
    // When running in Tauri, the frontend dist is at ../dist relative to src-tauri
    let exe_dir = std::env::current_exe()
        .ok()
        .and_then(|p| p.parent().map(|p| p.to_path_buf()))
        .unwrap_or_else(|| std::path::PathBuf::from("."));

    // Try multiple paths to find the dist directory
    let candidates = vec![
        exe_dir.join("../dist"),
        exe_dir.join("../../dist"),
        exe_dir.join("../../../dist"),
        exe_dir.join("../../../../apps/vue-support-doc-starter/dist"),
        std::path::PathBuf::from("../dist"),
        std::path::PathBuf::from("../../dist"),
    ];

    for path in candidates {
        if path.join("index.html").exists() {
            return path;
        }
    }

    // Fallback
    std::path::PathBuf::from("../dist")
}

// ============ Client Config Commands ============

#[tauri::command]
fn get_client_config(id: String) -> Result<Option<ClientConfig>, String> {
    get_db().get_client_config(&id).map_err(|e| e.to_string())
}

#[tauri::command]
fn save_client_config(config: ClientConfig) -> Result<(), String> {
    get_db()
        .save_client_config(&config)
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn list_client_configs() -> Result<Vec<ClientConfig>, String> {
    get_db()
        .list_client_configs()
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn delete_client_config(id: String) -> Result<(), String> {
    get_db()
        .delete_client_config(&id)
        .map_err(|e| e.to_string())
}

// ============ Model Provider Commands ============

#[tauri::command]
fn list_providers() -> Result<Vec<ModelProvider>, String> {
    get_db().list_providers().map_err(|e| e.to_string())
}

#[tauri::command]
fn save_provider(provider: ModelProvider) -> Result<(), String> {
    get_db()
        .save_provider(&provider)
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn delete_provider(id: String) -> Result<(), String> {
    get_db().delete_provider(&id).map_err(|e| e.to_string())
}

// ============ Scan Commands ============

#[allow(non_snake_case)]
#[tauri::command]
fn scan_client_mcp_cmd(clientId: String, configPaths: Vec<String>) -> ClientScanResult {
    let paths: Vec<&str> = configPaths.iter().map(|s| s.as_str()).collect();
    scan::scan_client_mcp(&clientId, &paths)
}

#[tauri::command]
fn scan_all_clients() -> Vec<ClientScanResult> {
    scan::get_all_scan_results()
}

#[allow(non_snake_case)]
#[tauri::command]
fn scan_local_skills_cmd(skillDirs: Vec<String>) -> Vec<SkillEntry> {
    let dirs: Vec<&str> = skillDirs.iter().map(|s| s.as_str()).collect();
    scan::scan_local_skills(&dirs)
}

// ============ System Commands ============

#[tauri::command]
fn list_processes_cmd() -> Result<Vec<ProcessInfo>, String> {
    system::list_processes()
}

#[tauri::command]
fn kill_process_cmd(pid: u32) -> Result<(), String> {
    system::kill_process(pid)
}

#[tauri::command]
fn kill_process_by_name_cmd(name: String) -> Result<(), String> {
    system::kill_process_by_name(&name)
}

#[tauri::command]
fn get_process_tree_cmd(pid: u32) -> Result<system::ProcessTreeNode, String> {
    system::get_process_tree(pid)
}

#[tauri::command]
fn get_env_vars_cmd() -> Vec<EnvVar> {
    system::get_env_vars()
}

#[tauri::command]
fn set_env_var_cmd(name: String, value: String) -> Result<(), String> {
    system::set_env_var(&name, &value)
}

#[tauri::command]
fn get_env_var_cmd(name: String) -> Option<String> {
    system::get_env_var(&name)
}

#[allow(non_snake_case)]
#[tauri::command]
fn read_registry_cmd(baseKey: String, subKey: String) -> Result<Vec<system::RegistryEntry>, String> {
    system::read_registry(&baseKey, &subKey)
}

#[tauri::command]
fn list_services_cmd() -> Result<Vec<ServiceInfo>, String> {
    system::list_services()
}

#[tauri::command]
fn start_service_cmd(name: String) -> Result<(), String> {
    system::start_service(&name)
}

#[tauri::command]
fn stop_service_cmd(name: String) -> Result<(), String> {
    system::stop_service(&name)
}

// ============ Usage Stats Commands ============

#[tauri::command]
fn save_usage_stat_cmd(stat: UsageStat) -> Result<(), String> {
    get_db().save_usage_stat(&stat).map_err(|e| e.to_string())
}

#[tauri::command]
fn list_usage_stats_cmd(limit: i64, offset: i64) -> Result<Vec<UsageStat>, String> {
    get_db().list_usage_stats(limit, offset).map_err(|e| e.to_string())
}

#[tauri::command]
fn get_usage_summary_cmd() -> Result<UsageSummary, String> {
    get_db().get_usage_stats_summary().map_err(|e| e.to_string())
}

#[tauri::command]
fn delete_usage_stat_cmd(id: String) -> Result<(), String> {
    get_db().delete_usage_stat(&id).map_err(|e| e.to_string())
}

// ============ Sync Config Commands ============

#[tauri::command]
fn get_sync_config_cmd(id: String) -> Result<Option<SyncConfig>, String> {
    get_db().get_sync_config(&id).map_err(|e| e.to_string())
}

#[tauri::command]
fn list_sync_configs_cmd() -> Result<Vec<SyncConfig>, String> {
    get_db().list_sync_configs().map_err(|e| e.to_string())
}

#[tauri::command]
fn save_sync_config_cmd(config: SyncConfig) -> Result<(), String> {
    get_db().save_sync_config(&config).map_err(|e| e.to_string())
}

// ============ Web Server Commands ============

#[tauri::command]
fn web_server_status() -> bool {
    get_web_server().lock().unwrap().is_running()
}

#[tauri::command]
fn web_server_start(port: u16) -> Result<(), String> {
    let db = get_db();
    let dist_dir = get_dist_dir();
    let mut server = get_web_server().lock().unwrap();
    server.start(port, db, dist_dir)
}

#[tauri::command]
fn web_server_stop() -> Result<(), String> {
    let mut server = get_web_server().lock().unwrap();
    server.stop();
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Parse CLI args
    let args: Vec<String> = std::env::args().collect();
    let is_service_mode = args.iter().any(|a| a == "--service" || a == "-s");
    let port: u16 = args
        .windows(2)
        .find(|w| w[0] == "--port" || w[0] == "-p")
        .and_then(|w| w[1].parse().ok())
        .or_else(|| {
            std::env::var("WEB_SERVER_PORT")
                .ok()
                .and_then(|p| p.parse().ok())
        })
        .unwrap_or(3721);

    // Initialize DB on startup
    let db = get_db();

    // Auto-start web server
    let dist_dir = get_dist_dir();
    let port_for_server = port;
    {
        let mut server = get_web_server().lock().unwrap();
        if let Err(e) = server.start(port_for_server, db.clone(), dist_dir) {
            eprintln!("[web-server] Failed to auto-start: {}", e);
        } else {
            eprintln!("[web-server] Started on http://localhost:{}", port_for_server);
        }
    }

    if is_service_mode {
        // Service mode: no window, just HTTP server
        eprintln!("[service-mode] Running in service mode on http://localhost:{}", port_for_server);

        // Open browser
        let url = format!("http://localhost:{}", port_for_server);
        let _ = webbrowser::open(&url);

        // Keep process alive (wait for Ctrl+C)
        loop {
            std::thread::sleep(std::time::Duration::from_secs(1));
            // Check if HTTP server is still running
            if !get_web_server().lock().unwrap().is_running() {
                eprintln!("[service-mode] Web server stopped, exiting");
                break;
            }
        }
        return;
    }

    // Software mode: normal Tauri GUI
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            // Client Config
            get_client_config,
            save_client_config,
            list_client_configs,
            delete_client_config,
            // Model Provider
            list_providers,
            save_provider,
            delete_provider,
            // Scan
            scan_client_mcp_cmd,
            scan_all_clients,
            scan_local_skills_cmd,
            // System
            list_processes_cmd,
            kill_process_cmd,
            kill_process_by_name_cmd,
            get_process_tree_cmd,
            get_env_vars_cmd,
            set_env_var_cmd,
            get_env_var_cmd,
            read_registry_cmd,
            list_services_cmd,
            start_service_cmd,
            stop_service_cmd,
            // Usage Stats
            save_usage_stat_cmd,
            list_usage_stats_cmd,
            get_usage_summary_cmd,
            delete_usage_stat_cmd,
            // Sync Config
            get_sync_config_cmd,
            list_sync_configs_cmd,
            save_sync_config_cmd,
            // Web Server
            web_server_status,
            web_server_start,
            web_server_stop,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}