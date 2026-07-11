export interface SoftwareCard {
  cardId?: number
  title: string
  description?: string
  icon?: string
  cardType?: string
  targetUrl?: string
  enabled?: boolean
  sortOrder?: number
  createTime?: string
  updateTime?: string
}

export interface InstalledSoftware {
  name: string
  version?: string
  publisher?: string
  installPath?: string
  executablePath?: string
  icon?: string
  size?: number
  uninstallString?: string
}

export interface LocalInstaller {
  name: string
  filePath: string
  fileName: string
  size: number
  type: string
}

export interface SdkInstallation {
  type: string
  name: string
  version: string
  installPath: string
  active: boolean
}

export interface ImageFile {
  name: string
  path: string
  size: number
  lastModified: number
  thumbnailPath: string
}

const BASE = '/api/software'
const SETTINGS_BASE = '/api/settings'
const ENV_BASE = '/api/environment'
const ALBUM_BASE = '/api/album'
const SYSTEM_BASE = '/api/system'

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

// Cards
export async function listCards(): Promise<SoftwareCard[]> {
  return request(`${BASE}/cards`)
}

export async function getCard(id: number): Promise<SoftwareCard> {
  return request(`${BASE}/cards/${id}`)
}

export async function createCard(card: SoftwareCard): Promise<SoftwareCard> {
  return request(`${BASE}/cards`, {
    method: 'POST',
    body: JSON.stringify(card),
  })
}

export async function updateCard(id: number, card: SoftwareCard): Promise<SoftwareCard> {
  return request(`${BASE}/cards/${id}`, {
    method: 'PUT',
    body: JSON.stringify(card),
  })
}

export async function deleteCard(id: number): Promise<void> {
  await fetch(`${BASE}/cards/${id}`, { method: 'DELETE' })
}

// Software scan / uninstall / install
export async function scanSoftware(): Promise<InstalledSoftware[]> {
  return request(`${BASE}/scan`)
}

export async function uninstallSoftware(name: string, uninstallString?: string, installPath?: string): Promise<{ success: boolean }> {
  return request(`${BASE}/uninstall`, {
    method: 'POST',
    body: JSON.stringify({ name, uninstallString, installPath }),
  })
}

export async function installSoftware(name: string, version?: string, filePath?: string): Promise<{ success: boolean }> {
  return request(`${BASE}/install`, {
    method: 'POST',
    body: JSON.stringify({ name, version, filePath }),
  })
}

export function getIconUrl(path: string): string {
  return `${BASE}/icon?path=${encodeURIComponent(path)}`
}

export async function getLocalPackages(): Promise<LocalInstaller[]> {
  return request(`${BASE}/local-packages`)
}

export async function searchWingetPackages(q: string): Promise<{ name: string; id: string; version: string; source: string }[]> {
  return request(`${BASE}/search-packages?q=${encodeURIComponent(q)}`)
}

// Settings
export async function getSettings(): Promise<Record<string, string>> {
  return request(`${SETTINGS_BASE}`)
}

export async function saveSettings(settings: Record<string, string>): Promise<void> {
  await fetch(`${SETTINGS_BASE}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings),
  })
}

// Environment / SDK
export async function getSdks(): Promise<SdkInstallation[]> {
  return request(`${ENV_BASE}/sdks`)
}

export async function switchSdk(type: string, version: string, installPath: string): Promise<{ success: boolean }> {
  return request(`${ENV_BASE}/sdks/switch`, {
    method: 'POST',
    body: JSON.stringify({ type, version, installPath }),
  })
}

// Album
export async function getImages(): Promise<ImageFile[]> {
  return request(`${ALBUM_BASE}/images`)
}

export function getImageUrl(path: string): string {
  return `${ALBUM_BASE}/image?path=${encodeURIComponent(path)}`
}

// System
export interface DiskInfo {
  name: string
  type: string
  total: number
  usable: number
  used: number
  usagePercent: number
}

export interface NetworkInfo {
  name: string
  addresses: string[]
}

export interface SystemInfo {
  osName: string
  osVersion: string
  osArch: string
  userName: string
  userHome: string
  userDir: string
  javaVersion: string
  javaVendor: string
  javaHome: string
  jvmName: string
  jvmVersion: string
  jvmMemory: number
  jvmMaxMemory: number
  jvmFreeMemory: number
  availableProcessors: number
  systemLoadAverage: number
  cpuCores: number
  cpuArch: string
  cpuLoad: number
  processCpuLoad: number
  totalMemory: number
  freeMemory: number
  usedMemory: number
  memoryUsagePercent: number
  uptime: number
  disks: DiskInfo[]
  networks: NetworkInfo[]
  environment: Record<string, string>
}

export async function getSystemInfo(): Promise<SystemInfo> {
  return request(`${SYSTEM_BASE}/info`)
}

export interface DirEntry {
  name: string
  path: string
  isDir: boolean
  parent?: string
}

export async function browseDirectory(path?: string): Promise<DirEntry[]> {
  const url = path ? `${SYSTEM_BASE}/browse?path=${encodeURIComponent(path)}` : `${SYSTEM_BASE}/browse`
  return request(url)
}

export async function getSoftwareUpdates(): Promise<{ name: string; id: string; version: string; available: string }[]> {
  return request(`${BASE}/updates`)
}

// AI
export interface AiModule {
  id?: number
  name: string
  provider: string
  model: string
  apiEndpoint?: string
  apiKey?: string
  enabled?: boolean
  sortOrder?: number
  createTime?: string
}

export interface AiSession {
  id?: number
  title?: string
  moduleId?: number
  createTime?: string
  updateTime?: string
  messages?: AiMessage[]
}

export interface AiMessage {
  id?: number
  sessionId: number
  role: string
  content: string
  createTime?: string
}

const AI_BASE = '/api/ai'

export async function listAiModules(): Promise<AiModule[]> {
  return request(`${AI_BASE}/modules`)
}

export async function getAiModule(id: number): Promise<AiModule> {
  return request(`${AI_BASE}/modules/${id}`)
}

export async function saveAiModule(m: AiModule): Promise<AiModule> {
  return request(`${AI_BASE}/modules`, {
    method: 'POST',
    body: JSON.stringify(m),
  })
}

export async function updateAiModule(id: number, m: AiModule): Promise<AiModule> {
  return request(`${AI_BASE}/modules/${id}`, {
    method: 'PUT',
    body: JSON.stringify(m),
  })
}

export async function deleteAiModule(id: number): Promise<void> {
  await fetch(`${AI_BASE}/modules/${id}`, { method: 'DELETE' })
}

export async function listAiSessions(): Promise<AiSession[]> {
  return request(`${AI_BASE}/sessions`)
}

export async function getAiSession(id: number): Promise<AiSession> {
  return request(`${AI_BASE}/sessions/${id}`)
}

export async function deleteAiSession(id: number): Promise<void> {
  await fetch(`${AI_BASE}/sessions/${id}`, { method: 'DELETE' })
}

export async function renameAiSession(id: number, title: string): Promise<void> {
  await fetch(`${AI_BASE}/sessions/${id}/rename`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title }),
  })
}

export async function aiChat(sessionId: number | undefined, moduleId: number | undefined, message: string): Promise<{ sessionId: number; content: string }> {
  return request(`${AI_BASE}/chat`, {
    method: 'POST',
    body: JSON.stringify({ sessionId, moduleId, message }),
  })
}

// AI Agents
export interface AgentClient {
  id: string
  name: string
  path: string
  installed: boolean
  mcpCount?: number
}

export async function scanAiAgents(): Promise<AgentClient[]> {
  return request(`${AI_BASE}/agents/scan`)
}

// AI MCP
export interface McpServerEntry {
  name: string
  command: string
  args: string
  installed: boolean
}

export async function listMcpServers(client: string): Promise<McpServerEntry[]> {
  return request(`${AI_BASE}/mcp/list?client=${encodeURIComponent(client)}`)
}

export async function installMcpServer(clientId: string, name: string, command: string, args?: string[]): Promise<{ success: boolean; message?: string; error?: string }> {
  return request(`${AI_BASE}/mcp/install`, {
    method: 'POST',
    body: JSON.stringify({ clientId, name, command, args }),
  })
}

export async function uninstallMcpServer(clientId: string, name: string): Promise<{ success: boolean; message?: string; error?: string }> {
  return request(`${AI_BASE}/mcp/uninstall`, {
    method: 'POST',
    body: JSON.stringify({ clientId, name }),
  })
}

// AI Skills
export interface AiSkill {
  id?: number
  skillId: string
  name: string
  description?: string
  category?: string
  enabled?: boolean
  createTime?: string
}

export async function listAiSkills(): Promise<AiSkill[]> {
  return request(`${AI_BASE}/skills`)
}

export async function syncAiSkills(skills: AiSkill[]): Promise<AiSkill[]> {
  return request(`${AI_BASE}/skills/sync`, {
    method: 'POST',
    body: JSON.stringify(skills),
  })
}

export async function toggleAiSkill(skillId: string, enabled: boolean): Promise<AiSkill> {
  return request(`${AI_BASE}/skills/toggle`, {
    method: 'POST',
    body: JSON.stringify({ skillId, enabled }),
  })
}

// System Tools
export interface StartupItem {
  name: string
  command: string
  location: string
  enabled: boolean
}

export interface ProcessEntry {
  pid: number
  name: string
  executablePath?: string
  memoryBytes: number
  cpuPercent: number
  status: string
}

export interface ServiceEntry {
  name: string
  displayName: string
  status: string
  startType: string
  description?: string
}

export interface RegistryEntry {
  key: string
  name: string
  value: string
  suggestion: string
}

export interface ThirdPartyServiceConfig {
  id?: number
  serviceName: string
  serviceType: string
  apiUrl: string
  apiKey?: string
  enabled: boolean
  sortOrder?: number
}

const THIRD_PARTY_BASE = '/api/third-party/services'

export async function listStartup(): Promise<StartupItem[]> {
  return request(`${SYSTEM_BASE}/startup`)
}

export async function toggleStartup(name: string, enabled: boolean): Promise<{ success: boolean }> {
  return request(`${SYSTEM_BASE}/startup/toggle`, {
    method: 'POST',
    body: JSON.stringify({ name, enabled }),
  })
}

export async function listProcesses(): Promise<ProcessEntry[]> {
  return request(`${SYSTEM_BASE}/processes`)
}

export async function killProcess(pid: number): Promise<{ success: boolean }> {
  return request(`${SYSTEM_BASE}/processes/kill`, {
    method: 'POST',
    body: JSON.stringify({ pid }),
  })
}

export async function listServices(): Promise<ServiceEntry[]> {
  return request(`${SYSTEM_BASE}/services`)
}

export async function controlService(name: string, action: string): Promise<{ success: boolean }> {
  return request(`${SYSTEM_BASE}/services/control`, {
    method: 'POST',
    body: JSON.stringify({ name, action }),
  })
}

export async function scanRegistry(): Promise<RegistryEntry[]> {
  return request(`${SYSTEM_BASE}/registry/scan`)
}

export async function cleanRegistry(entries: any[]): Promise<{ success: boolean }> {
  return request(`${SYSTEM_BASE}/registry/clean`, {
    method: 'POST',
    body: JSON.stringify(entries),
  })
}

export async function getSoftwareStats(): Promise<any> {
  return request(`${BASE}/stats`)
}

// Third-party services
export async function listThirdPartyServices(): Promise<ThirdPartyServiceConfig[]> {
  return request(THIRD_PARTY_BASE)
}

export async function getThirdPartyService(id: number): Promise<ThirdPartyServiceConfig> {
  return request(`${THIRD_PARTY_BASE}/${id}`)
}

export async function saveThirdPartyService(svc: ThirdPartyServiceConfig): Promise<ThirdPartyServiceConfig> {
  return request(THIRD_PARTY_BASE, {
    method: svc.id ? 'PUT' : 'POST',
    body: JSON.stringify(svc),
  })
}

export async function deleteThirdPartyService(id: number): Promise<void> {
  await fetch(`${THIRD_PARTY_BASE}/${id}`, { method: 'DELETE' })
}

export async function checkThirdPartyService(id: number): Promise<{ reachable: boolean }> {
  return request(`${THIRD_PARTY_BASE}/${id}/check`)
}

export async function getThirdPartyServiceTypes(): Promise<{ id: string; name: string; desc: string }[]> {
  return request(`${THIRD_PARTY_BASE}/types`)
}

// Toolbox - Clipboard
export async function getClipboardHistory(): Promise<any[]> {
  return request('/api/toolbox/clipboard')
}
export async function setClipboardText(text: string): Promise<{ success: boolean }> {
  return request('/api/toolbox/clipboard/set', { method: 'POST', body: JSON.stringify({ text }) })
}
export async function clearClipboardHistory(): Promise<{ success: boolean }> {
  return request('/api/toolbox/clipboard/clear', { method: 'POST' })
}

// Toolbox - Cleanup
export async function scanCleanup(): Promise<any[]> {
  return request('/api/toolbox/cleanup/scan')
}
export async function executeCleanup(items: any[]): Promise<{ success: boolean }> {
  return request('/api/toolbox/cleanup/execute', { method: 'POST', body: JSON.stringify(items) })
}

// Toolbox - Network
export async function networkPing(host: string, count?: number): Promise<any> {
  return request(`/api/toolbox/network/ping?host=${encodeURIComponent(host)}&count=${count || 4}`)
}
export async function networkTraceroute(host: string): Promise<any> {
  return request(`/api/toolbox/network/traceroute?host=${encodeURIComponent(host)}`)
}
export async function networkDns(host: string): Promise<any> {
  return request(`/api/toolbox/network/dns?host=${encodeURIComponent(host)}`)
}
export async function networkPort(host: string, port: number): Promise<any> {
  return request(`/api/toolbox/network/port?host=${encodeURIComponent(host)}&port=${port}`)
}
export async function networkConnections(): Promise<any[]> {
  return request('/api/toolbox/network/connections')
}
export async function networkLocalIp(): Promise<any> {
  return request('/api/toolbox/network/local-ip')
}

// Toolbox - Monitor
export async function getMonitorSnapshot(): Promise<any> {
  return request('/api/toolbox/monitor')
}

// Data export/import
export async function exportAllData(): Promise<any> {
  return request('/api/data/export')
}

export async function importAllData(data: any): Promise<{ success: boolean; imported?: string[]; error?: string }> {
  return request('/api/data/import', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function aiChatStream(sessionId: number | undefined, moduleId: number | undefined, message: string, onChunk: (text: string) => void, onDone: () => void): () => void {
  const xhr = new XMLHttpRequest()
  xhr.open('POST', `${AI_BASE}/chat/stream`, true)
  xhr.setRequestHeader('Content-Type', 'application/json')
  xhr.responseType = 'text'
  let lastIndex = 0
  xhr.onprogress = () => {
    const newText = xhr.responseText.substring(lastIndex)
    lastIndex = xhr.responseText.length
    if (newText) onChunk(newText)
  }
  xhr.onloadend = () => onDone()
  xhr.send(JSON.stringify({ sessionId, moduleId, message, stream: true }))
  return () => xhr.abort()
}
