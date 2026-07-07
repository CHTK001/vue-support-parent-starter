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
  let results: any[] = [];
  try {
    results = await apiOrInvoke<any[]>("/api/scan/all", "scan_all_clients");
  } catch {
    results = [];
  }
  return MCP_CLIENTS.map((client) => {
    const scanResult = results?.find((r: any) => r.clientId === client.id);
    const localStorageFound = !!localStorage.getItem(`mcp-client-${client.id}`);
    return {
      id: client.id,
      name: client.name,
      logo: client.logo,
      installed: scanResult?.found || localStorageFound || false,
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

export async function scanAllClients(type?: "all" | "mcp" | "skills"): Promise<any> {
  const url = type ? `/api/scan/agent-all?type=${type}` : "/api/scan/agent-all";
  return apiOrInvoke<any>(url, "scan_all_agent_clients_cmd", { type });
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

// ============ Usage Records ============

export interface UsageRecord {
  id: string;
  timestamp: string;
  model: string;
  providerId: string;
  providerName: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  cost: number;
  source: string;
}

const USAGE_STORAGE_KEY = "usage-records";

function getLocalUsageRecords(): UsageRecord[] {
  try {
    return JSON.parse(localStorage.getItem(USAGE_STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function setLocalUsageRecords(records: UsageRecord[]): void {
  localStorage.setItem(USAGE_STORAGE_KEY, JSON.stringify(records));
}

export async function listUsageRecords(startDate: string, endDate: string): Promise<UsageRecord[]> {
  try {
    return await apiOrInvoke<UsageRecord[]>(
      `/api/usage?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`,
      "list_usage_records_cmd",
      { startDate, endDate }
    );
  } catch {
    const all = getLocalUsageRecords();
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();
    return all.filter((r) => {
      const ts = new Date(r.timestamp).getTime();
      return ts >= start && ts <= end;
    });
  }
}

export async function insertUsageRecord(record: UsageRecord): Promise<void> {
  try {
    await apiOrInvoke<void>(
      "/api/usage", "insert_usage_record_cmd", { record },
      "POST", record
    );
  } catch {
    const all = getLocalUsageRecords();
    const idx = all.findIndex((r) => r.id === record.id);
    if (idx >= 0) all[idx] = record;
    else all.push(record);
    setLocalUsageRecords(all);
  }
}

// ============ Agent Clients ============

export interface AgentClientData {
  id: string;
  name: string;
  type: string;
  logo: string;
  color: string;
  icon: string;
  homeDir: string;
  configPaths: string;
  enabled: boolean;
  installed: boolean;
  scanStatus: string;
  lastScanAt: string;
  createdAt: string;
  updatedAt: string;
}

export async function listAgentClients(): Promise<AgentClientData[]> {
  try {
    return await apiOrInvoke<AgentClientData[]>("/api/agent-clients", "list_agent_clients_cmd");
  } catch {
    return [];
  }
}

export async function scanAgentClient(clientId: string, type?: "all" | "mcp" | "skills"): Promise<any> {
  const url = type ? `/api/agent-clients/${clientId}/scan?type=${type}` : `/api/agent-clients/${clientId}/scan`;
  return apiOrInvoke<any>(url, "scan_agent_client_cmd", { clientId, type }, "POST");
}

export async function updateAgentClientConfig(clientId: string, configPaths: string, homeDir: string): Promise<void> {
  return apiOrInvoke<void>(
    `/api/agent-clients/${clientId}`, "update_agent_client_config_cmd",
    { clientId, configPaths, homeDir },
    "PUT", { configPaths, homeDir }
  );
}

export async function toggleAgentClientEnabled(clientId: string, enabled: boolean): Promise<void> {
  return apiOrInvoke<void>(
    `/api/agent-clients/${clientId}/enabled`, "toggle_agent_client_enabled_cmd",
    { clientId, enabled },
    "PUT", { enabled }
  );
}

// ============ MCP Servers CRUD ============

export interface McpServerEntry {
  id?: string;
  name: string;
  description?: string;
  category?: string;
  command?: string;
  args?: string;
  env?: string;
  enabled?: boolean;
  clientId?: string;
}

export async function listMcpServers(clientId?: string): Promise<McpServerEntry[]> {
  const url = clientId ? `/api/mcp-servers?clientId=${encodeURIComponent(clientId)}` : "/api/mcp-servers";
  try { return await apiOrInvoke<McpServerEntry[]>(url, "list_mcp_servers_cmd"); } catch { return []; }
}

export async function saveMcpServer(server: McpServerEntry): Promise<McpServerEntry> {
  return apiOrInvoke<McpServerEntry>("/api/mcp-servers", "save_mcp_server_cmd", { server }, "POST", server);
}

export async function deleteMcpServer(id: string): Promise<void> {
  await apiOrInvoke<void>(`/api/mcp-servers/${id}`, "delete_mcp_server_cmd", { id }, "DELETE");
}

// ============ Skills CRUD ============

export interface SkillEntry {
  id?: string;
  name: string;
  description?: string;
  category?: string;
  path?: string;
  enabled?: boolean;
  clientId?: string;
}

export async function listSkills(clientId?: string): Promise<SkillEntry[]> {
  const url = clientId ? `/api/skills?clientId=${encodeURIComponent(clientId)}` : "/api/skills";
  try { return await apiOrInvoke<SkillEntry[]>(url, "list_skills_cmd"); } catch { return []; }
}

export async function saveSkill(skill: SkillEntry): Promise<SkillEntry> {
  return apiOrInvoke<SkillEntry>("/api/skills", "save_skill_cmd", { skill }, "POST", skill);
}

export async function deleteSkill(id: string): Promise<void> {
  await apiOrInvoke<void>(`/api/skills/${id}`, "delete_skill_cmd", { id }, "DELETE");
}

export async function getSkillContent(id: string): Promise<{ content: string; path: string }> {
  return apiOrInvoke<{ content: string; path: string }>(`/api/skills/content/${id}`, "get_skill_content_cmd");
}

export async function saveSkillContent(id: string, content: string): Promise<void> {
  await apiOrInvoke<void>(`/api/skills/content/${id}`, "save_skill_content_cmd", { id, content }, "POST", { content });
}

// ============ Backup / Restore ============

export async function exportBackup(clientId: string, includeProviders?: boolean): Promise<any> {
  return apiOrInvoke<any>("/api/backup/export", "export_backup_cmd", { clientId, includeProviders }, "POST", { clientId, includeProviders });
}

export async function importBackup(clientId: string, data: any): Promise<{ mcpImported: number; skillsImported: number }> {
  return apiOrInvoke<{ mcpImported: number; skillsImported: number }>(
    "/api/backup/import", "import_backup_cmd", { clientId, data }, "POST", { clientId, data }
  );
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

// ============ Usage Stats ============

export interface UsageStat {
  id: string;
  clientId?: string;
  provider: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  cost: number;
  durationMs: number;
  timestamp: string;
  metadata: string;
}

export interface UsageSummary {
  totalPromptTokens: number;
  totalCompletionTokens: number;
  totalTokens: number;
  totalCost: number;
  totalRequests: number;
}

export async function listUsageStats(limit = 100, offset = 0): Promise<UsageStat[]> {
  return apiOrInvoke(`/api/usage-stats?limit=${limit}&offset=${offset}`, "list_usage_stats_cmd", { limit, offset });
}

export async function saveUsageStat(stat: UsageStat): Promise<void> {
  await apiOrInvoke("/api/usage-stats", "save_usage_stat_cmd", { stat }, "POST", stat);
}

export async function getUsageSummary(): Promise<UsageSummary> {
  return apiOrInvoke("/api/usage-stats/summary", "get_usage_summary_cmd");
}

export async function listUsageDaily(startDate: string, endDate: string): Promise<any[]> {
  return apiOrInvoke(`/api/usage/daily?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`, "list_usage_daily_cmd");
}

export async function deleteUsageStat(id: string): Promise<void> {
  await apiOrInvoke(`/api/usage-stats/${id}`, "delete_usage_stat_cmd", { id }, "DELETE");
}

// ============ Sync Config ============

export interface SyncConfigData {
  id: string;
  source: string;
  enabled: boolean;
  apiEndpoint?: string;
  apiKey?: string;
  syncInterval: number;
  lastSyncAt?: string;
  createdAt: string;
  updatedAt: string;
}

export async function listSyncConfigs(): Promise<SyncConfigData[]> {
  return apiOrInvoke("/api/sync-configs", "list_sync_configs_cmd");
}

export async function getSyncConfig(id: string): Promise<SyncConfigData | null> {
  return apiOrInvoke(`/api/sync-configs/${id}`, "get_sync_config_cmd", { id });
}

export async function saveSyncConfig(config: SyncConfigData): Promise<void> {
  await apiOrInvoke("/api/sync-configs", "save_sync_config_cmd", { config }, "POST", config);
}
