use crate::db::Database;
use crate::system;
use serde_json::Value;
use std::fs;
use std::net::TcpStream;
use std::path::PathBuf;
use std::sync::{Arc, Mutex};
use std::thread;
use tiny_http::{Header, Response, Server};

pub struct WebServer {
    port: u16,
    running: Arc<Mutex<bool>>,
    thread: Option<thread::JoinHandle<()>>,
}

impl WebServer {
    pub fn new() -> Self {
        WebServer {
            port: 0,
            running: Arc::new(Mutex::new(false)),
            thread: None,
        }
    }

    pub fn is_running(&self) -> bool {
        *self.running.lock().unwrap()
    }

    pub fn start(&mut self, port: u16, db: Arc<Database>, dist_dir: PathBuf) -> Result<(), String> {
        if self.is_running() {
            return Err("Server already running".to_string());
        }

        let addr = format!("0.0.0.0:{}", port);
        let server = Server::http(&addr).map_err(|e| format!("Failed to start server: {}", e))?;
        let running = self.running.clone();
        let db = db.clone();
        let dist = dist_dir.clone();

        *running.lock().unwrap() = true;
        self.port = port;

        self.thread = Some(thread::spawn(move || {
            while *running.lock().unwrap() {
                match server.recv() {
                    Ok(mut request) => {
                        let url = request.url().to_string();
                        let method = request.method().as_str().to_string();

                        let cors_origin = Header::from_bytes(&b"Access-Control-Allow-Origin"[..], &b"*"[..]).unwrap();
                        let cors_methods = Header::from_bytes(&b"Access-Control-Allow-Methods"[..], &b"GET, POST, PUT, DELETE, OPTIONS"[..]).unwrap();
                        let cors_headers = Header::from_bytes(&b"Access-Control-Allow-Headers"[..], &b"Content-Type, Authorization"[..]).unwrap();

                        if method == "OPTIONS" {
                            let response = Response::from_string("")
                                .with_status_code(204)
                                .with_header(cors_origin)
                                .with_header(cors_methods)
                                .with_header(cors_headers);
                            let _ = request.respond(response);
                            continue;
                        }

                        let body = if method != "GET" && method != "HEAD" {
                            let mut buf = Vec::new();
                            let _ = request.as_reader().read_to_end(&mut buf);
                            if buf.is_empty() { None } else { serde_json::from_slice::<Value>(&buf).ok() }
                        } else {
                            None
                        };

                        let result = handle_request(&method, &url, &body, &db, &dist);

                        match result {
                            Ok((status, content_type, data)) => {
                                let ct = Header::from_bytes(&b"Content-Type"[..], content_type.as_bytes()).unwrap();
                                let response = Response::from_string(data)
                                    .with_status_code(status)
                                    .with_header(cors_origin)
                                    .with_header(cors_methods)
                                    .with_header(cors_headers)
                                    .with_header(ct);
                                let _ = request.respond(response);
                            }
                            Err((status, msg)) => {
                                let ct = Header::from_bytes(&b"Content-Type"[..], &b"application/json"[..]).unwrap();
                                let body = format!(r#"{{"error":"{}"}}"#, msg);
                                let response = Response::from_string(body)
                                    .with_status_code(status)
                                    .with_header(cors_origin)
                                    .with_header(cors_methods)
                                    .with_header(cors_headers)
                                    .with_header(ct);
                                let _ = request.respond(response);
                            }
                        }
                    }
                    Err(_) => break,
                }
            }
        }));

        Ok(())
    }

    pub fn stop(&mut self) {
        *self.running.lock().unwrap() = false;
        // Send a local request to unblock recv()
        if self.port > 0 {
            let _ = TcpStream::connect(format!("127.0.0.1:{}", self.port));
        }
        if let Some(handle) = self.thread.take() {
            let _ = handle.join();
        }
    }
}

fn handle_request(
    method: &str,
    url: &str,
    body: &Option<Value>,
    db: &Database,
    dist_dir: &PathBuf,
) -> Result<(u16, String, String), (u16, String)> {
    if url.starts_with("/api/") {
        return handle_api(method, url, body, db);
    }

    if url == "/health" {
        return Ok((
            200,
            "application/json".to_string(),
            r#"{"status":"ok","mode":"tauri-embedded"}"#.to_string(),
        ));
    }

    let path = if url == "/" || url.is_empty() {
        "index.html".to_string()
    } else {
        url.trim_start_matches('/').to_string()
    };

    let file_path = dist_dir.join(&path);
    if file_path.exists() && file_path.is_file() {
        let content = fs::read(&file_path).map_err(|e| (500, format!("Failed to read file: {}", e)))?;
        let mime = mime_guess::from_path(&path).first_or_octet_stream();
        let data = String::from_utf8_lossy(&content).to_string();
        Ok((200, mime.to_string(), data))
    } else {
        let index_path = dist_dir.join("index.html");
        if index_path.exists() {
            let content = fs::read_to_string(&index_path)
                .map_err(|e| (500, format!("Failed to read index.html: {}", e)))?;
            Ok((200, "text/html".to_string(), content))
        } else {
            Err((404, "Not found".to_string()))
        }
    }
}

fn handle_api(
    method: &str,
    url: &str,
    body: &Option<Value>,
    db: &Database,
) -> Result<(u16, String, String), (u16, String)> {
    let path = url.trim_start_matches("/api/").trim_end_matches('/');

    let json = |status: u16, data: Value| -> Result<_, (u16, String)> {
        Ok((status, "application/json".to_string(), serde_json::to_string(&data).unwrap()))
    };

    let json_str = |status: u16, s: &str| -> Result<_, (u16, String)> {
        Ok((status, "application/json".to_string(), s.to_string()))
    };

    match (method, path) {
        ("GET", "providers") => {
            let providers = db.list_providers().map_err(|e| (500, e.to_string()))?;
            json(200, serde_json::to_value(providers).unwrap())
        }
        ("POST", "providers") => {
            if let Some(b) = body {
                let provider: crate::db::ModelProvider =
                    serde_json::from_value(b.clone()).map_err(|e| (400, format!("Invalid provider: {}", e)))?;
                db.save_provider(&provider).map_err(|e| (500, e.to_string()))?;
                json(200, b.clone())
            } else {
                Err((400, "No request body".to_string()))
            }
        }
        (m, p) if p.starts_with("providers/") && m == "DELETE" => {
            let id = p.trim_start_matches("providers/");
            db.delete_provider(id).map_err(|e| (500, e.to_string()))?;
            json_str(200, r#"{"success":true}"#)
        }
        ("GET", "clients") => {
            let configs = db.list_client_configs().map_err(|e| (500, e.to_string()))?;
            json(200, serde_json::to_value(configs).unwrap())
        }
        (m, p) if p.starts_with("clients/") && p.ends_with("/config") => {
            let id = p.trim_start_matches("clients/").trim_end_matches("/config");
            match m {
                "GET" => match db.get_client_config(id).map_err(|e| (500, e.to_string()))? {
                    Some(c) => json(200, serde_json::to_value(c).unwrap()),
                    None => Err((404, "Not found".to_string())),
                },
                "PUT" => {
                    if let Some(b) = body {
                        let config: crate::db::ClientConfig =
                            serde_json::from_value(b.clone()).map_err(|e| (400, format!("Invalid config: {}", e)))?;
                        db.save_client_config(&config).map_err(|e| (500, e.to_string()))?;
                        json(200, b.clone())
                    } else {
                        Err((400, "No request body".to_string()))
                    }
                }
                "DELETE" => {
                    db.delete_client_config(id).map_err(|e| (500, e.to_string()))?;
                    json_str(200, r#"{"success":true}"#)
                }
                _ => Err((405, "Method not allowed".to_string())),
            }
        }
        ("GET", "system/processes") => {
            let processes = system::list_processes().map_err(|e| (500, e))?;
            json(200, serde_json::to_value(processes).unwrap())
        }
        (m, p) if p.starts_with("system/processes/") && m == "GET" && p.ends_with("/tree") => {
            let rest = p.trim_start_matches("system/processes/").trim_end_matches("/tree");
            if let Ok(pid) = rest.parse::<u32>() {
                let tree = system::get_process_tree(pid).map_err(|e| (404, e))?;
                json(200, serde_json::to_value(tree).unwrap())
            } else {
                Err((400, "Invalid PID".to_string()))
            }
        }
        (m, p) if p.starts_with("system/processes/") && m == "POST" => {
            let rest = p.trim_start_matches("system/processes/");
            if rest.ends_with("/kill") {
                let pid_str = rest.trim_end_matches("/kill");
                if let Ok(pid) = pid_str.parse::<u32>() {
                    system::kill_process(pid).map_err(|e| (500, e))?;
                    json_str(200, r#"{"success":true}"#)
                } else {
                    Err((400, "Invalid PID".to_string()))
                }
            } else {
                Err((404, "Not found".to_string()))
            }
        }
        ("GET", "system/env") => {
            let vars = system::get_env_vars();
            json(200, serde_json::to_value(vars).unwrap())
        }
        ("POST", "system/env") => {
            if let Some(b) = body {
                let name = b.get("name").and_then(|v| v.as_str()).unwrap_or("");
                let value = b.get("value").and_then(|v| v.as_str()).unwrap_or("");
                system::set_env_var(name, value).map_err(|e| (500, e))?;
                json_str(200, r#"{"success":true}"#)
            } else {
                Err((400, "No request body".to_string()))
            }
        }
        ("GET", "system/services") => {
            let services = system::list_services().map_err(|e| (500, e))?;
            json(200, serde_json::to_value(services).unwrap())
        }
        (m, p) if p.starts_with("system/services/") && (m == "POST") => {
            let rest = p.trim_start_matches("system/services/");
            if rest.ends_with("/start") {
                let name = rest.trim_end_matches("/start");
                if name.is_empty() { return Err((400, "Service name required".to_string())); }
                system::start_service(name).map_err(|e| (500, e))?;
                json_str(200, r#"{"success":true}"#)
            } else if rest.ends_with("/stop") {
                let name = rest.trim_end_matches("/stop");
                if name.is_empty() { return Err((400, "Service name required".to_string())); }
                system::stop_service(name).map_err(|e| (500, e))?;
                json_str(200, r#"{"success":true}"#)
            } else {
                Err((404, "Not found".to_string()))
            }
        }
        ("GET", "system/registry") => {
            let entries = crate::system::read_registry("HKEY_CURRENT_USER", "Software")
                .map_err(|e| (500, e))?;
            json(200, serde_json::to_value(entries).unwrap())
        }
        // ============ Scan Endpoints ============
        ("POST", "scan/client") => {
            if let Some(b) = body {
                let client_id = b.get("clientId").and_then(|v| v.as_str()).unwrap_or("");
                let config_paths: Vec<&str> = b.get("configPaths")
                    .and_then(|v| v.as_array())
                    .map(|arr| arr.iter().filter_map(|v| v.as_str()).collect())
                    .unwrap_or_default();
                if client_id.is_empty() {
                    return Err((400, "clientId required".to_string()));
                }
                let result = crate::scan::scan_client_mcp(client_id, &config_paths);
                json(200, serde_json::to_value(result).unwrap())
            } else {
                Err((400, "No request body".to_string()))
            }
        }
        ("GET", "scan/all") => {
            let results = crate::scan::get_all_scan_results();
            json(200, serde_json::to_value(results).unwrap())
        }
        ("POST", "scan/skills") => {
            if let Some(b) = body {
                let skill_dirs: Vec<&str> = b.get("skillDirs")
                    .and_then(|v| v.as_array())
                    .map(|arr| arr.iter().filter_map(|v| v.as_str()).collect())
                    .unwrap_or_default();
                let results = crate::scan::scan_local_skills(&skill_dirs);
                json(200, serde_json::to_value(results).unwrap())
            } else {
                Err((400, "No request body".to_string()))
            }
        }
        // ============ Web Server ============
        ("GET", "web-server/status") => {
            let running = crate::get_web_server().lock().unwrap().is_running();
            json(200, serde_json::json!({ "running": running }))
        }
        ("POST", "web-server/start") => {
            let port = body.as_ref()
                .and_then(|b| b.get("port"))
                .and_then(|v| v.as_u64())
                .unwrap_or(3721) as u16;
            let db = crate::get_db();
            let dist_dir = crate::get_dist_dir();
            let mut server = crate::get_web_server().lock().unwrap();
            server.start(port, db, dist_dir).map_err(|e| (500, e))?;
            json_str(200, r#"{"success":true}"#)
        }
        ("POST", "web-server/stop") => {
            let mut server = crate::get_web_server().lock().unwrap();
            server.stop();
            json_str(200, r#"{"success":true}"#)
        }
        _ => Err((404, format!("Not found: {} {}", method, url))),
    }
}