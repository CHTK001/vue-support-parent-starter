export interface ServerHost {
  serverId?: number;
  serverName: string;
  serverCode?: string;
  serverType: "LOCAL" | "SSH" | "WINRM";
  osType?: string;
  architecture?: string;
  host?: string;
  port?: number;
  username?: string;
  password?: string;
  privateKey?: string;
  baseDirectory?: string;
  tags?: string;
  enabled?: boolean;
  description?: string;
  metadataJson?: string;
  tagsList?: string[];
  statusSnapshot?: ServerMetricsSnapshot;
  guacamoleConfig?: ServerRemoteConsoleConfig;
  remoteGatewayConfig?: ServerRemoteConsoleConfig;
  createTime?: string;
  updateTime?: string;
}

export interface ServerHostSummary {
  total: number;
  enabled: number;
  disabled: number;
  local: number;
  remote: number;
}

export interface ServerCapabilityView {
  aiEnabled?: boolean;
  softEnabled?: boolean;
  remoteGatewayEnabled?: boolean;
  fileWatchEnabled?: boolean;
  socketEnabled?: boolean;
  serviceAutoDetectEnabled?: boolean;
  aiProvider?: string;
  aiDefaultProvider?: string;
  aiProviderCount?: number;
  aiProviderNames?: string[];
  aiConfigReady?: boolean;
  aiChatClientReady?: boolean;
  aiStatusText?: string;
  aiUnavailableReason?: string;
  aiUnavailableCode?: string;
  aiProviderResolvedFrom?: string;
}

export interface ServerAlertSettings {
  serverId?: number;
  inheritGlobal?: boolean;
  enabled?: boolean;
  messageEnabled?: boolean;
  cpuWarningPercent?: number;
  cpuDangerPercent?: number;
  memoryWarningPercent?: number;
  memoryDangerPercent?: number;
  diskWarningPercent?: number;
  diskDangerPercent?: number;
  ioWarningBytesPerSecond?: number;
  ioDangerBytesPerSecond?: number;
  latencyWarningMs?: number;
  latencyDangerMs?: number;
}

export interface ServerAlertEvent {
  serverAlertEventId?: number;
  serverId?: number;
  serverCode?: string;
  metricType?: string;
  severity?: string;
  metricValue?: number;
  warningThreshold?: number;
  dangerThreshold?: number;
  snapshotJson?: string;
  alertMessage?: string;
  createTime?: string;
}

export interface ServerSoftBindingTarget {
  softTargetId?: number;
  targetCode?: string;
  targetName?: string;
  targetType?: string;
  osType?: string;
  architecture?: string;
  host?: string;
  port?: number;
  username?: string;
  baseDirectory?: string;
  enabled?: boolean;
  metadataJson?: string;
}

export interface ServerSoftInstallation {
  softInstallationId?: number;
  softPackageId?: number;
  softPackageVersionId?: number;
  softTargetId?: number;
  installationName: string;
  installPath?: string;
  serviceName?: string;
  installStatus?: string;
  runtimeStatus?: string;
  installedVersion?: string;
  lastOperationTime?: string;
  lastOperationMessage?: string;
  packageName?: string;
  versionName?: string;
  targetName?: string;
}

export interface ServerSoftOperation {
  softOperationLogId?: number;
  softInstallationId?: number;
  softTargetId?: number;
  operationType?: string;
  operationStatus?: string;
  operationStage?: string;
  progressPercent?: number;
  operationMessage?: string;
  detailMessage?: string;
  operationOutput?: string;
  startTime?: string;
  endTime?: string;
}

export interface ServerService {
  serverServiceId?: number;
  serverId?: number;
  serviceCode?: string;
  serviceName: string;
  serviceType?: string;
  softPackageId?: number;
  softPackageVersionId?: number;
  softInstallationId?: number;
  installPath?: string;
  runtimeStatus?: string;
  configPathsJson?: string;
  logPathsJson?: string;
  configTemplate?: string;
  initScript?: string;
  installScript?: string;
  uninstallScript?: string;
  detectScript?: string;
  registerScript?: string;
  unregisterScript?: string;
  startScript?: string;
  stopScript?: string;
  restartScript?: string;
  statusScript?: string;
  enabled?: boolean;
  description?: string;
  metadataJson?: string;
  lastOperationTime?: string;
  lastOperationMessage?: string;
  serverName?: string;
  host?: string;
  latestOperationLogId?: number;
  latestOperationType?: string;
  latestOperationSuccess?: boolean;
  latestOperationOutput?: string;
  latestAiReason?: string;
  latestAiSolution?: string;
  latestAiFixScript?: string;
  latestAiProvider?: string;
  latestAiModel?: string;
  latestKnowledgeId?: number;
}

export interface ServerServiceOperationLog {
  serverServiceOperationLogId?: number;
  serverServiceId?: number;
  serverId?: number;
  operationType?: string;
  success?: boolean;
  exitCode?: number;
  runtimeStatus?: string;
  operationMessage?: string;
  operationOutput?: string;
  aiReason?: string;
  aiSolution?: string;
  aiFixScript?: string;
  aiProvider?: string;
  aiModel?: string;
  knowledgeId?: number;
  expireAt?: string;
  createTime?: string;
}

export interface ServerServiceCommandResult {
  serverServiceId?: number;
  serviceName?: string;
  operationType?: string;
  success?: boolean;
  exitCode?: number;
  message?: string;
  output?: string;
  runtimeStatus?: string;
  operationLogId?: number;
  aiReason?: string;
  aiSolution?: string;
  aiFixScript?: string;
  aiProvider?: string;
  aiModel?: string;
  knowledgeId?: number;
  taskId?: string;
  aiTaskStatus?: string;
}

export interface ServerAiTaskTicket {
  taskId?: string;
  taskType?: string;
  status?: string;
  serverServiceId?: number;
  serverId?: number;
  metricType?: string;
  severity?: string;
  operationLogId?: number;
  minutes?: number;
  startTime?: number;
  endTime?: number;
  stateFilter?: string;
  filterKey?: string;
  message?: string;
}

export interface ServerServiceAiDraft {
  summary?: string;
  description?: string;
  configPathsJson?: string;
  logPathsJson?: string;
  configTemplate?: string;
  initScript?: string;
  installScript?: string;
  uninstallScript?: string;
  detectScript?: string;
  registerScript?: string;
  unregisterScript?: string;
  startScript?: string;
  stopScript?: string;
  restartScript?: string;
  statusScript?: string;
  provider?: string;
  model?: string;
}

export interface ServerAiTaskPayload {
  taskId?: string;
  taskType?: string;
  status?: string;
  serverServiceId?: number;
  serverId?: number;
  metricType?: string;
  severity?: string;
  operationLogId?: number;
  minutes?: number;
  startTime?: number;
  endTime?: number;
  stateFilter?: string;
  filterKey?: string;
  message?: string;
  aiReason?: string;
  aiSolution?: string;
  aiFixScript?: string;
  aiProvider?: string;
  aiModel?: string;
  knowledgeId?: number;
  draft?: ServerServiceAiDraft;
  finishedAt?: number;
}

export interface ServerProcessView {
  serverId?: number;
  serverCode?: string;
  pid?: number;
  parentPid?: number;
  name?: string;
  command?: string;
  commandLine?: string;
  user?: string;
  state?: string;
  cpuPercent?: number;
  memoryPercent?: number;
  memoryBytes?: number;
  threadCount?: number;
  elapsed?: string;
  startTime?: string;
  alive?: boolean;
  executionProvider?: string;
  spiChannel?: string;
}

export interface ServerProcessCommandResult {
  serverId?: number;
  pid?: number;
  success?: boolean;
  exitCode?: number;
  force?: boolean;
  message?: string;
  output?: string;
}

export interface ServerProcessAiAdvice {
  pid?: number;
  summary?: string;
  riskLevel?: string;
  suggestion?: string;
  provider?: string;
  model?: string;
}

export interface ServerProcessRealtimePayload {
  serverId?: number;
  serverCode?: string;
  keyword?: string;
  limit?: number;
  processCount?: number;
  refreshedAt?: number;
  message?: string;
  executionProvider?: string;
  spiChannel?: string;
  processes?: ServerProcessView[];
}

export interface ServerServiceConfigWriteRequest {
  path?: string;
  content?: string;
}

export interface ServerMetricsSnapshot {
  serverId?: number;
  serverCode?: string;
  status?: string;
  online?: boolean;
  latencyMs?: number;
  cpuUsage?: number;
  cpuCores?: number;
  memoryUsage?: number;
  memoryTotalBytes?: number;
  memoryUsedBytes?: number;
  diskUsage?: number;
  diskTotalBytes?: number;
  diskUsedBytes?: number;
  ioReadBytesPerSecond?: number;
  ioWriteBytesPerSecond?: number;
  networkRxPacketsPerSecond?: number;
  networkTxPacketsPerSecond?: number;
  collectTimestamp?: number;
  detailMessage?: string;
}

export interface ServerDiskPartitionView {
  name?: string;
  mountPoint?: string;
  fileSystem?: string;
  label?: string;
  totalBytes?: number;
  usedBytes?: number;
  freeBytes?: number;
  usagePercent?: number;
  status?: string;
}

export interface ServerNetworkInterfaceView {
  name?: string;
  displayName?: string;
  status?: string;
  ipv4?: string;
  macAddress?: string;
  receivedBytes?: number;
  transmittedBytes?: number;
  receivedPackets?: number;
  transmittedPackets?: number;
}

export interface ServerMetricsDetail {
  serverId?: number;
  serverCode?: string;
  hostName?: string;
  publicIp?: string;
  actualOsName?: string;
  actualKernel?: string;
  collectTimestamp?: number;
  diskPartitions?: ServerDiskPartitionView[];
  networkInterfaces?: ServerNetworkInterfaceView[];
}

export interface ServerMetricsTaskSettings {
  serverId?: number;
  serverName?: string;
  inheritGlobal?: boolean;
  enabled?: boolean;
  schedulerMode?: string;
  jobEnabled?: boolean;
  refreshIntervalMs?: number;
  timeoutMs?: number;
  cacheEnabled?: boolean;
  cacheTtlSeconds?: number;
  lastRefreshAt?: number;
  nextRefreshAt?: number;
  historyLimit?: number;
  status?: string;
  jobId?: number;
  jobNo?: string;
  jobName?: string;
  jobScheduleType?: string;
  jobScheduleTime?: string;
  jobStatus?: string;
  jobLastTriggerAt?: number;
  jobNextTriggerAt?: number;
  manualTriggerSupported?: boolean;
}

export interface ServerMetricsTaskSettingsRequest {
  inheritGlobal?: boolean;
  enabled?: boolean;
  refreshIntervalMs?: number;
  timeoutMs?: number;
  cacheEnabled?: boolean;
  cacheTtlSeconds?: number;
}

export interface ServerRemoteConsoleConfig {
  enabled?: boolean;
  provider?: string;
  protocol?: string;
  gatewayUrl?: string;
  websocketUrl?: string;
  launchUrl?: string;
  connectionId?: string;
  message?: string;
  parameters?: Record<string, string>;
}

export type ServerGuacamoleConfig = ServerRemoteConsoleConfig;

export interface ServerRemoteGatewaySettings {
  inheritGlobal?: boolean;
  enabled?: boolean;
  provider?: string;
  gatewayUrl?: string;
  protocol?: string;
  launchPath?: string;
  websocketPath?: string;
  connectionId?: string;
}

export interface ServerFileEntry {
  name: string;
  path: string;
  directory: boolean;
  file: boolean;
  hidden?: boolean;
  size?: number;
  lastModified?: number;
  extension?: string;
}

export interface ServerFileContent {
  path: string;
  content: string;
  size?: number;
  truncated?: boolean;
  language?: string;
}

export interface ServerFileOperationResult {
  success?: boolean;
  message?: string;
  path?: string;
  targetPath?: string;
}

export interface ServerFileRenameRequest {
  path: string;
  targetPath: string;
}

export interface ServerFileWriteRequest {
  path: string;
  content: string;
}

export interface ServerFileWatchTicket {
  watchId: number;
  serverId?: number;
  path?: string;
  acceptedAt?: number;
}

export interface ServerRealtimePayload {
  serverId?: number;
  serverCode?: string;
  status?: string;
  online?: boolean;
  latencyMs?: number;
  cpuUsage?: number;
  cpuCores?: number;
  memoryUsage?: number;
  memoryTotalBytes?: number;
  memoryUsedBytes?: number;
  diskUsage?: number;
  diskTotalBytes?: number;
  diskUsedBytes?: number;
  ioReadBytesPerSecond?: number;
  ioWriteBytesPerSecond?: number;
  networkRxPacketsPerSecond?: number;
  networkTxPacketsPerSecond?: number;
  collectTimestamp?: number;
  path?: string;
  watchId?: number;
  line?: string;
  message?: string;
  finished?: boolean;
}

export interface ServerRealtimeEnvelope {
  module: "SERVER";
  event:
    | "SERVER_METRICS"
    | "FILE_LOG"
    | "SERVER_SERVICE"
    | "SERVER_AI_TASK"
    | "SERVER_ALERT"
    | "SERVER_PROCESS";
  dataId?: string | number;
  data:
    | ServerRealtimePayload
    | ServerService
    | ServerAiTaskPayload
    | ServerAlertEvent
    | ServerProcessRealtimePayload;
  timestamp?: number | string;
}
