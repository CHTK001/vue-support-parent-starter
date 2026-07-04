use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::path::PathBuf;

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct McpServerConfig {
    pub command: String,
    pub args: Vec<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub env: Option<HashMap<String, String>>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct McpConfig {
    pub mcp_servers: HashMap<String, McpServerConfig>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LocalMcpEntry {
    pub name: String,
    pub source: String,
    pub config: McpServerConfig,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SkillEntry {
    pub name: String,
    pub path: String,
    pub description: String,
    pub category: String,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ClientScanResult {
    pub client_id: String,
    pub client_name: String,
    pub found: bool,
    pub config_path: String,
    pub mcp_servers: Vec<LocalMcpEntry>,
}

fn get_home_dir() -> PathBuf {
    dirs::home_dir().unwrap_or_else(|| PathBuf::from("."))
}

fn get_appdata_dir() -> PathBuf {
    dirs::config_dir().unwrap_or_else(|| PathBuf::from("."))
}

fn expand_path(path: &str) -> PathBuf {
    if path.starts_with("~/") {
        let home = get_home_dir();
        home.join(&path[2..])
    } else if path.starts_with("%USERPROFILE%") {
        let home = get_home_dir();
        home.join(path.replacen("%USERPROFILE%", "", 1))
    } else if path.starts_with("%APPDATA%") {
        let appdata = get_appdata_dir();
        appdata.join(path.replacen("%APPDATA%", "", 1))
    } else {
        PathBuf::from(path)
    }
}

pub fn scan_client_mcp(client_id: &str, config_paths: &[&str]) -> ClientScanResult {
    let client_names: HashMap<&str, &str> = HashMap::from([
        ("claude-desktop", "Claude Desktop"),
        ("vscode", "VS Code"),
        ("mimocode", "MiMo Code"),
        ("cursor", "Cursor"),
        ("opencode", "OpenCode"),
        ("codex", "Codex"),
        ("gemini", "Gemini CLI"),
        ("openclaw", "OpenClaw"),
        ("cline", "CLine"),
    ]);

    let mut result = ClientScanResult {
        client_id: client_id.to_string(),
        client_name: client_names.get(client_id).unwrap_or(&"Unknown").to_string(),
        found: false,
        config_path: String::new(),
        mcp_servers: Vec::new(),
    };

    for path_str in config_paths {
        let path = expand_path(path_str);
        if path.exists() {
            result.found = true;
            result.config_path = path.display().to_string();

            if let Ok(content) = fs::read_to_string(&path) {
                if let Ok(config) = serde_json::from_str::<HashMap<String, HashMap<String, McpServerConfig>>>(&content) {
                    if let Some(servers) = config.get("mcpServers") {
                        for (name, server_config) in servers {
                            result.mcp_servers.push(LocalMcpEntry {
                                name: name.clone(),
                                source: result.client_name.clone(),
                                config: McpServerConfig {
                                    command: server_config.command.clone(),
                                    args: server_config.args.clone(),
                                    env: server_config.env.clone(),
                                },
                            });
                        }
                    }
                }

                if let Ok(config) = serde_json::from_str::<HashMap<String, HashMap<String, McpServerConfig>>>(&content) {
                    if let Some(servers) = config.get("servers") {
                        for (name, server_config) in servers {
                            let exists = result.mcp_servers.iter().any(|e| e.name == *name);
                            if !exists {
                                result.mcp_servers.push(LocalMcpEntry {
                                    name: name.clone(),
                                    source: result.client_name.clone(),
                                    config: McpServerConfig {
                                        command: server_config.command.clone(),
                                        args: server_config.args.clone(),
                                        env: server_config.env.clone(),
                                    },
                                });
                            }
                        }
                    }
                }
            }
            break;
        }
    }

    result
}

pub fn scan_local_skills(skill_dirs: &[&str]) -> Vec<SkillEntry> {
    let mut skills = Vec::new();

    for dir_str in skill_dirs {
        let dir = expand_path(dir_str);
        if !dir.exists() {
            continue;
        }

        if let Ok(entries) = fs::read_dir(&dir) {
            for entry in entries.flatten() {
                let path = entry.path();
                if path.is_dir() {
                    let skill_md = path.join("SKILL.md");
                    if skill_md.exists() {
                        if let Ok(content) = fs::read_to_string(&skill_md) {
                            let name = path.file_name()
                                .unwrap_or_default()
                                .to_string_lossy()
                                .to_string();

                            let description = extract_description(&content);
                            let category = extract_category(&content);

                            skills.push(SkillEntry {
                                name,
                                path: path.display().to_string(),
                                description,
                                category,
                            });
                        }
                    }
                }
            }
        }
    }

    skills
}

fn extract_description(content: &str) -> String {
    for line in content.lines() {
        let trimmed = line.trim();
        if !trimmed.is_empty() && !trimmed.starts_with('#') && !trimmed.starts_with("---") {
            return trimmed.to_string();
        }
    }
    String::new()
}

fn extract_category(content: &str) -> String {
    let lower = content.to_lowercase();
    if lower.contains("code") || lower.contains("refactor") || lower.contains("review") {
        "code".to_string()
    } else if lower.contains("ui") || lower.contains("design") || lower.contains("frontend") {
        "ui".to_string()
    } else if lower.contains("search") || lower.contains("web") {
        "search".to_string()
    } else if lower.contains("test") || lower.contains("debug") {
        "devops".to_string()
    } else {
        "other".to_string()
    }
}

pub fn get_all_scan_results() -> Vec<ClientScanResult> {
    let clients: Vec<(&str, Vec<&str>)> = vec![
        ("claude-desktop", vec!["%APPDATA%/Claude/claude_desktop_config.json", "~/Library/Application Support/Claude/claude_desktop_config.json", "~/.config/Claude/claude_desktop_config.json"]),
        ("vscode", vec!["%APPDATA%/Code/User/globalStorage/anthropic.claude-code/settings/cline_mcp_settings.json"]),
        ("mimocode", vec!["%USERPROFILE%/.config/mimocode/mcp.json", "~/.config/mimocode/mcp.json"]),
        ("cursor", vec!["%APPDATA%/Cursor/User/globalStorage/cursor.mcp/mcp.json", "~/.cursor/mcp.json"]),
        ("opencode", vec!["%USERPROFILE%/.config/opencode/mcp.json"]),
        ("codex", vec!["%USERPROFILE%/.codex/mcp.json"]),
        ("gemini", vec!["%USERPROFILE%/.gemini/mcp.json"]),
        ("openclaw", vec!["%USERPROFILE%/.config/openclaw/mcp.json"]),
        ("cline", vec!["%APPDATA%/Code/User/globalStorage/rooveterinaryinc.roo-cline/settings/cline_custom_mcp_config.json"]),
        ("zcode", vec!["%USERPROFILE%/.zcode/mcp.json"]),
    ];

    let mut results = Vec::new();
    for (client_id, paths) in clients {
        results.push(scan_client_mcp(client_id, &paths));
    }
    results
}
