use serde::{Deserialize, Serialize};
use std::process::{Command, Stdio};

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ProcessInfo {
    pub pid: u32,
    pub name: String,
    pub command: String,
    pub status: String,
    pub cpu_usage: f64,
    pub memory_usage: u64,
    pub parent_pid: u32,
    pub child_count: u32,
    pub thread_count: u32,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ProcessTreeNode {
    pub pid: u32,
    pub name: String,
    pub cpu_usage: f64,
    pub memory_usage: u64,
    pub children: Vec<ProcessTreeNode>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct RegistryEntry {
    pub key: String,
    pub name: String,
    pub value: String,
    pub value_type: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct EnvVar {
    pub name: String,
    pub value: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ServiceInfo {
    pub name: String,
    pub display_name: String,
    pub status: String,
    pub startup_type: String,
}

#[cfg(target_os = "windows")]
pub fn list_processes() -> Result<Vec<ProcessInfo>, String> {
    let ps_script = r#"
Get-Process | Select-Object Id, ProcessName, CPU, WorkingSet64, ParentId, Threads, StartTime, Responding | ForEach-Object {
    [PSCustomObject]@{
        pid = $_.Id
        name = $_.ProcessName
        cpu = [math]::Round($_.CPU / (Get-Date).Subtract($_.StartTime).TotalSeconds, 1)
        memory = $_.WorkingSet64
        parentPid = if ($_.ParentId) { $_.ParentId } else { 0 }
        threadCount = ($_.Threads | Measure-Object).Count
        status = if ($_.Responding) { "Running" } else { "Not Responding" }
    }
} | ConvertTo-Json -Compress
"#;
    let output = Command::new("powershell")
        .args(&["-NoProfile", "-Command", ps_script])
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .output()
        .map_err(|e| e.to_string())?;

    let stdout = String::from_utf8_lossy(&output.stdout);
    let processed: Vec<ProcessInfo> = serde_json::from_str(&stdout).unwrap_or_default();

    // compute child counts
    let child_counts: std::collections::HashMap<u32, u32> = processed
        .iter()
        .fold(std::collections::HashMap::new(), |mut acc, p| {
            if p.parent_pid > 0 {
                *acc.entry(p.parent_pid).or_insert(0) += 1;
            }
            acc
        });

    Ok(processed
        .into_iter()
        .map(|mut p| {
            p.child_count = child_counts.get(&p.pid).copied().unwrap_or(0);
            p.command = p.name.clone();
            p
        })
        .collect())
}

#[cfg(not(target_os = "windows"))]
pub fn list_processes() -> Result<Vec<ProcessInfo>, String> {
    Ok(Vec::new())
}

#[cfg(target_os = "windows")]
pub fn kill_process(pid: u32) -> Result<(), String> {
    Command::new("taskkill")
        .args(&["/F", "/PID", &pid.to_string()])
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .output()
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[cfg(not(target_os = "windows"))]
pub fn kill_process(_pid: u32) -> Result<(), String> {
    Ok(())
}

#[cfg(target_os = "windows")]
pub fn kill_process_by_name(name: &str) -> Result<(), String> {
    Command::new("taskkill")
        .args(&["/F", "/IM", name])
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .output()
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[cfg(not(target_os = "windows"))]
pub fn kill_process_by_name(_name: &str) -> Result<(), String> {
    Ok(())
}

pub fn get_env_vars() -> Vec<EnvVar> {
    std::env::vars()
        .map(|(name, value)| EnvVar { name, value })
        .collect()
}

#[cfg(target_os = "windows")]
pub fn set_env_var(name: &str, value: &str) -> Result<(), String> {
    Command::new("setx")
        .args(&[name, value])
        .output()
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[cfg(not(target_os = "windows"))]
pub fn set_env_var(name: &str, value: &str) -> Result<(), String> {
    std::env::set_var(name, value);
    Ok(())
}

pub fn get_env_var(name: &str) -> Option<String> {
    std::env::var(name).ok()
}

pub fn get_process_tree(pid: u32) -> Result<ProcessTreeNode, String> {
    let procs = list_processes()?;
    let root = procs.iter().find(|p| p.pid == pid).ok_or("Process not found")?.clone();
    let children = build_child_tree(pid, &procs);
    Ok(ProcessTreeNode {
        pid: root.pid,
        name: root.name.clone(),
        cpu_usage: root.cpu_usage,
        memory_usage: root.memory_usage,
        children,
    })
}

fn build_child_tree(parent_pid: u32, all: &[ProcessInfo]) -> Vec<ProcessTreeNode> {
    all.iter()
        .filter(|p| p.parent_pid == parent_pid)
        .map(|p| ProcessTreeNode {
            pid: p.pid,
            name: p.name.clone(),
            cpu_usage: p.cpu_usage,
            memory_usage: p.memory_usage,
            children: build_child_tree(p.pid, all),
        })
        .collect()
}

#[cfg(target_os = "windows")]
pub fn read_registry(base_key: &str, sub_key: &str) -> Result<Vec<RegistryEntry>, String> {
    use winreg::enums::*;

    let hive = match base_key {
        "HKLM" | "HKEY_LOCAL_MACHINE" => winreg::RegKey::predef(HKEY_LOCAL_MACHINE),
        "HKCU" | "HKEY_CURRENT_USER" => winreg::RegKey::predef(HKEY_CURRENT_USER),
        _ => return Err("Invalid registry hive".to_string()),
    };

    let key = hive.open_subkey_with_flags(sub_key, KEY_READ)
        .map_err(|e| e.to_string())?;

    let mut entries = Vec::new();

    for value_name in key.enum_values() {
        if let Ok((name, raw_value)) = value_name {
            let data_str = String::from_utf8_lossy(&raw_value.bytes).to_string();
            entries.push(RegistryEntry {
                key: format!("{}\\{}", base_key, sub_key),
                name,
                value: data_str,
                value_type: format!("{:?}", raw_value.vtype),
            });
        }
    }

    Ok(entries)
}

#[cfg(not(target_os = "windows"))]
pub fn read_registry(_base_key: &str, _sub_key: &str) -> Result<Vec<RegistryEntry>, String> {
    Ok(Vec::new())
}

#[cfg(target_os = "windows")]
pub fn list_services() -> Result<Vec<ServiceInfo>, String> {
    let output = Command::new("sc")
        .args(&["query", "type=", "service", "state=", "all"])
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .output()
        .map_err(|e| e.to_string())?;

    let stdout = String::from_utf8_lossy(&output.stdout);
    let mut services = Vec::new();
    let mut current_service = ServiceInfo {
        name: String::new(),
        display_name: String::new(),
        status: String::new(),
        startup_type: String::new(),
    };

    for line in stdout.lines() {
        let trimmed = line.trim();
        if trimmed.starts_with("SERVICE_NAME:") {
            if !current_service.name.is_empty() {
                services.push(current_service.clone());
            }
            current_service.name = trimmed.replacen("SERVICE_NAME:", "", 1).trim().to_string();
        } else if trimmed.starts_with("DISPLAY_NAME:") {
            current_service.display_name = trimmed.replacen("DISPLAY_NAME:", "", 1).trim().to_string();
        } else if trimmed.starts_with("STATE:") {
            current_service.status = trimmed.replacen("STATE:", "", 1).trim().to_string();
        }
    }

    if !current_service.name.is_empty() {
        services.push(current_service);
    }

    Ok(services)
}

#[cfg(not(target_os = "windows"))]
pub fn list_services() -> Result<Vec<ServiceInfo>, String> {
    Ok(Vec::new())
}

#[cfg(target_os = "windows")]
pub fn start_service(name: &str) -> Result<(), String> {
    Command::new("sc")
        .args(&["start", name])
        .output()
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[cfg(target_os = "windows")]
pub fn stop_service(name: &str) -> Result<(), String> {
    Command::new("sc")
        .args(&["stop", name])
        .output()
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[cfg(not(target_os = "windows"))]
pub fn start_service(_name: &str) -> Result<(), String> {
    Err("Not supported on this platform".to_string())
}

#[cfg(not(target_os = "windows"))]
pub fn stop_service(_name: &str) -> Result<(), String> {
    Err("Not supported on this platform".to_string())
}
