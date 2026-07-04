import { MCP_CLIENTS, getClientConfigPath, getClientHomeDir } from "@/utils/mcp-config";

// ============ Transport: HTTP API (same-origin, works in both modes) ============

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) {
    const err = await res.text().catch(() => res.statusText);
    throw new Error(`API ${res.status}: ${err}`);
  }
  return res.json();
}

// ============ Transport: Tauri IPC (desktop mode only) ============

function isTauri(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

async function invoke<T>(cmd: string, args?: Record<string, unknown>): Promise<T> {
  if (isTauri()) {
    const { invoke: tauriInvoke } = await import("@tauri-apps/api/core");
    return tauriInvoke(cmd, args);
  }
  throw new Error("Not in Tauri environment");
}

// ============ Helper: HTTP → IPC fallback ============

async function apiOrInvoke<T>(apiPath: string, ipcCmd: string, ipcArgs?: Record<string, unknown>, method = "GET", body?: unknown): Promise<T> {
  try {
    if (method === "GET") {
      return await apiFetch<T>(apiPath);
    }
    return await apiFetch<T>(apiPath, {
      method,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    return invoke<T>(ipcCmd, ipcArgs);
  }
}

// ============ Types ============

export interface ClientScanResult {
  clientId: string;
  clientName: string;
  found: boolean;
  configPath: string;
  mcpServers: Array<{ name: string; source: string; config: { command: string; args: string[] } }>;
}

export interface DetectedClient {
  id: string;
  name: string;
  logo: string;
  installed: boolean;
  configPath: string;
  homeDir: string;
  mcpCount: number;
  skillCount: number;
}

export interface ClientConfigData {
  id: string;
  name: string;
  mcpJson: string;
  skillsJson: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProviderData {
  id: string;
  name: string;
  apiBase: string;
  apiKey?: string;
  models: string[];
  isActive: boolean;
}

export interface ModelInfo {
  id: string;
  name: string;
}

export interface ProcessInfo {
  pid: number;
  name: string;
  command: string;
  status: string;
  cpuUsage: number;
  memoryUsage: number;
  parentPid: number;
  childCount: number;
  threadCount: number;
}

export interface ProcessTreeNode {
  pid: number;
  name: string;
  cpuUsage: number;
  memoryUsage: number;
  children: ProcessTreeNode[];
}

export interface EnvVar {
  name: string;
  value: string;
}

export interface ServiceInfo {
  name: string;
  displayName: string;
  status: string;
}

export interface RegistryEntry {
  name: string;
  value: string;
  valueType: string;
}

// ============ Scan ============

export async function detectInstalledClients(): Promise<DetectedClient[]> {
  const results = await apiOrInvoke<any[]>("/api/scan/all", "scan_all_clients");
  return MCP_CLIENTS.map((client) => {
    const scanResult = results?.find((r: any) => r.clientId === client.id);
    return {
      id: client.id,
      name: client.name,
      logo: client.logo,
      installed: scanResult?.found || false,
      configPath: getClientConfigPath(client),
      homeDir: getClientHomeDir(client),
      mcpCount: scanResult?.mcpServers?.length || 0,
      skillCount: 0
    };
  });
}

export async function scanSingleClient(clientId: string, configPaths: string[]): Promise<ClientScanResult> {
  return apiOrInvoke(
    "/api/scan/client", "scan_client_mcp_cmd", { clientId, configPaths },
    "POST", { clientId, configPaths }
  );
}

export async function scanLocalSkills(skillDirs: string[]): Promise<ClientScanResult[]> {
  return apiOrInvoke(
    "/api/scan/skills", "scan_local_skills_cmd", { skillDirs },
    "POST", { skillDirs }
  );
}

// ============ Client Config ============

export async function getClientConfig(id: string): Promise<ClientConfigData | null> {
  return apiOrInvoke(
    `/api/clients/${id}/config`, "get_client_config", { id }
  );
}

export async function saveClientConfig(config: ClientConfigData): Promise<void> {
  await apiOrInvoke(
    `/api/clients/${config.id}/config`, "save_client_config", { config },
    "PUT", config
  );
}

export async function listClientConfigs(): Promise<ClientConfigData[]> {
  return apiOrInvoke("/api/clients", "list_client_configs");
}

// ============ Provider ============

export async function listProviders(): Promise<ProviderData[]> {
  return apiOrInvoke("/api/providers", "list_providers");
}

export async function saveProvider(provider: ProviderData): Promise<void> {
  await apiOrInvoke(
    "/api/providers", "save_provider", { provider },
    "POST", provider
  );
}

export async function deleteProvider(id: string): Promise<void> {
  await apiOrInvoke(
    `/api/providers/${id}`, "delete_provider", { id },
    "DELETE"
  );
}

// ============ Model Fetching (external API, no fallback) ============

export async function fetchModelsFromProvider(apiBase: string, apiKey?: string): Promise<ModelInfo[]> {
  const url = `${apiBase.replace(/\/$/, "")}/models`;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (apiKey) headers["Authorization"] = `Bearer ${apiKey}`;

  const response = await fetch(url, { headers, signal: AbortSignal.timeout(10000) });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);

  const data = await response.json();
  const models: ModelInfo[] = [];

  if (data.data && Array.isArray(data.data)) {
    for (const m of data.data) {
      if (m.id) models.push({ id: m.id, name: m.id });
    }
  } else if (Array.isArray(data)) {
    for (const m of data) {
      const id = typeof m === "string" ? m : m.id || m.name;
      if (id) models.push({ id, name: id });
    }
  }

  return models.sort((a, b) => a.name.localeCompare(b.name));
}

// ============ System ============

export async function listProcesses(): Promise<ProcessInfo[]> {
  return apiOrInvoke("/api/system/processes", "list_processes_cmd");
}

export async function killProcess(pid: number): Promise<void> {
  await apiOrInvoke(
    `/api/system/processes/${pid}/kill`, "kill_process_cmd", { pid },
    "POST"
  );
}

export async function getProcessTree(pid: number): Promise<ProcessTreeNode> {
  return apiOrInvoke(
    `/api/system/processes/${pid}/tree`, "get_process_tree_cmd", { pid }
  );
}

export async function getEnvVars(): Promise<EnvVar[]> {
  return apiOrInvoke("/api/system/env", "get_env_vars_cmd");
}

export async function setEnvVar(name: string, value: string): Promise<void> {
  await apiOrInvoke(
    "/api/system/env", "set_env_var_cmd", { name, value },
    "POST", { name, value }
  );
}

export async function listServices(): Promise<ServiceInfo[]> {
  return apiOrInvoke("/api/system/services", "list_services_cmd");
}

export async function startService(name: string): Promise<void> {
  await apiOrInvoke(
    `/api/system/services/${name}/start`, "start_service_cmd", { name },
    "POST"
  );
}

export async function stopService(name: string): Promise<void> {
  await apiOrInvoke(
    `/api/system/services/${name}/stop`, "stop_service_cmd", { name },
    "POST"
  );
}

export async function readRegistry(hive: string, path: string): Promise<RegistryEntry[]> {
  return apiOrInvoke("/api/system/registry", "read_registry_cmd", { baseKey: hive, subKey: path });
}

// ============ Web Server ============

export async function webServerStatus(): Promise<boolean> {
  try {
    const res = await apiFetch<{ running: boolean }>("/api/web-server/status");
    return res.running;
  } catch {
    return invoke<boolean>("web_server_status");
  }
}

export async function webServerStart(port: number): Promise<void> {
  try {
    await apiFetch("/api/web-server/start", {
      method: "POST",
      body: JSON.stringify({ port }),
    });
  } catch {
    await invoke("web_server_start", { port });
  }
}

export async function webServerStop(): Promise<void> {
  try {
    await apiFetch("/api/web-server/stop", { method: "POST" });
  } catch {
    await invoke("web_server_stop");
  }
}
