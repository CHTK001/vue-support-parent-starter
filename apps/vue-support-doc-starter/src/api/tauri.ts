/**
 * Tauri API helper - bridges frontend to Rust backend
 * In web mode, falls back to localStorage
 */

// Check if running in Tauri
function isTauri(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

// Dynamic import for Tauri invoke
async function getInvoke() {
  if (isTauri()) {
    const { invoke } = await import("@tauri-apps/api/core");
    return invoke;
  }
  return null;
}

// ============ Client Config ============

export interface ClientConfig {
  id: string;
  name: string;
  mcpJson: string;
  skillsJson: string;
  apiKey?: string;
  apiEndpoint?: string;
  model?: string;
  createdAt: string;
  updatedAt: string;
}

export async function getClientConfig(id: string): Promise<ClientConfig | null> {
  const invoke = await getInvoke();
  if (invoke) {
    return await invoke("get_client_config", { id });
  }
  // Fallback to localStorage
  const data = localStorage.getItem(`client-config-${id}`);
  return data ? JSON.parse(data) : null;
}

export async function saveClientConfig(config: ClientConfig): Promise<void> {
  const invoke = await getInvoke();
  if (invoke) {
    await invoke("save_client_config", { config });
  } else {
    localStorage.setItem(`client-config-${config.id}`, JSON.stringify(config));
  }
}

export async function listClientConfigs(): Promise<ClientConfig[]> {
  const invoke = await getInvoke();
  if (invoke) {
    return await invoke("list_client_configs");
  }
  // Fallback
  const configs: ClientConfig[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith("client-config-")) {
      configs.push(JSON.parse(localStorage.getItem(key)!));
    }
  }
  return configs;
}

export async function deleteClientConfig(id: string): Promise<void> {
  const invoke = await getInvoke();
  if (invoke) {
    await invoke("delete_client_config", { id });
  } else {
    localStorage.removeItem(`client-config-${id}`);
  }
}

// ============ Model Provider ============

export interface ModelProvider {
  id: string;
  name: string;
  apiBase: string;
  apiKey?: string;
  models: string[];
  isActive: boolean;
}

export async function listProviders(): Promise<ModelProvider[]> {
  const invoke = await getInvoke();
  if (invoke) {
    return await invoke("list_providers");
  }
  const data = localStorage.getItem("mcp-manager-providers");
  return data ? JSON.parse(data) : [];
}

export async function saveProvider(provider: ModelProvider): Promise<void> {
  const invoke = await getInvoke();
  if (invoke) {
    await invoke("save_provider", { provider });
  } else {
    const providers = await listProviders();
    const idx = providers.findIndex((p) => p.id === provider.id);
    if (idx >= 0) providers[idx] = provider;
    else providers.push(provider);
    localStorage.setItem("mcp-manager-providers", JSON.stringify(providers));
  }
}

export async function deleteProvider(id: string): Promise<void> {
  const invoke = await getInvoke();
  if (invoke) {
    await invoke("delete_provider", { id });
  } else {
    const providers = await listProviders();
    localStorage.setItem("mcp-manager-providers", JSON.stringify(providers.filter((p) => p.id !== id)));
  }
}

// ============ Scan ============

export interface LocalMcpEntry {
  name: string;
  source: string;
  config: { command: string; args: string[]; env?: Record<string, string> };
}

export interface ClientScanResult {
  clientId: string;
  clientName: string;
  found: boolean;
  configPath: string;
  mcpServers: LocalMcpEntry[];
}

export async function scanAllClients(): Promise<ClientScanResult[]> {
  const invoke = await getInvoke();
  if (invoke) {
    return await invoke("scan_all_clients");
  }
  // Web fallback - no real scanning
  return [];
}

// ============ System ============

export interface ProcessInfo {
  pid: number;
  name: string;
  status: string;
}

export interface EnvVar {
  name: string;
  value: string;
}

export async function listProcesses(): Promise<ProcessInfo[]> {
  const invoke = await getInvoke();
  if (invoke) {
    return await invoke("list_processes_cmd");
  }
  return [];
}

export async function killProcess(pid: number): Promise<void> {
  const invoke = await getInvoke();
  if (invoke) {
    await invoke("kill_process_cmd", { pid });
  }
}

export async function getEnvVars(): Promise<EnvVar[]> {
  const invoke = await getInvoke();
  if (invoke) {
    return await invoke("get_env_vars_cmd");
  }
  return Object.entries(process.env || {}).map(([name, value]) => ({ name, value: value || "" }));
}

export async function setEnvVar(name: string, value: string): Promise<void> {
  const invoke = await getInvoke();
  if (invoke) {
    await invoke("set_env_var_cmd", { name, value });
  }
}
