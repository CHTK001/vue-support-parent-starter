import type { ReturnResult } from "@repo/utils";

/**
 * Docker 页面服务器选择项。
 */
export interface DockerServerOption {
  serverId: number;
  serverName: string;
  serverType?: string;
  osType?: string;
  host?: string;
  port?: number;
  enabled?: boolean;
}

/**
 * Docker 服务器能力视图。
 */
export interface DockerServerCapabilityView {
  serverId: number;
  serverName?: string;
  host?: string;
  serverEnabled?: boolean;
  dockerConfigured?: boolean;
  dockerInstalled?: boolean | null;
  dockerConnectable?: boolean;
  dockerVersion?: string;
  runtimeType?: string;
  probeLatencyMs?: number;
  message?: string;
}

/**
 * Docker 同步任务配置请求。
 */
export interface DockerSyncScheduleUpdateRequest {
  syncMode?: "manual" | "scheduled" | "disabled" | string;
  enabled?: boolean;
  scheduleType?: string;
  scheduleTime?: string;
  description?: string;
}

/**
 * Docker 同步任务配置返回。
 */
export interface DockerSyncScheduleView {
  syncMode?: "manual" | "scheduled" | "disabled" | string;
  scope: "images" | "containers" | string;
  jobId?: number;
  jobNo?: string;
  jobName?: string;
  handlerBean?: string;
  enabled?: boolean;
  scheduleType?: string;
  scheduleTime?: string;
  lastTriggerAt?: number;
  nextTriggerAt?: number;
  description?: string;
  source?: string;
}

/**
 * 服务器 Docker 连接配置。
 */
export interface DockerServerConnectionConfig {
  serverDockerId?: number;
  serverId: number;
  connectionType?: "api" | "local" | "ssh" | string;
  dockerHost?: string;
  dockerPort?: number;
  socketPath?: string;
  username?: string;
  password?: string;
  privateKey?: string;
  tlsEnabled?: boolean;
  certPath?: string;
  connectTimeoutMs?: number;
  enabled?: boolean;
  metadataJson?: string;
}

/**
 * 服务器 Docker 连接探活结果。
 */
export interface DockerServerConnectionProbeView {
  serverId: number;
  connectionType?: string;
  success: boolean;
  latencyMs?: number;
  dockerVersion?: string;
  probeCommand?: string;
  output?: string;
  message?: string;
}

/**
 * Docker 首页汇总信息。
 */
export interface DockerDashboardSummaryView {
  serverCount?: number;
  connectedServerCount?: number;
  registryCount?: number;
  imageCount?: number;
  containerCount?: number;
  mountCount?: number;
  networkCount?: number;
}

/**
 * Docker 全局检索结果项。
 */
export interface DockerSearchItemView {
  type: "image" | "container" | string;
  recordId: string;
  title?: string;
  subtitle?: string;
  serverId?: number;
  serverName?: string;
  registryId?: number;
  registryName?: string;
  registryUrl?: string;
  status?: string;
  description?: string;
}

/**
 * 安装引导步骤。
 */
export interface DockerInstallGuideStep {
  order: number;
  title: string;
  purpose: string;
  checklist: string[];
}

/**
 * 安装引导完整内容。
 */
export interface DockerInstallGuideView {
  title: string;
  audience: string;
  summary: string;
  steps: DockerInstallGuideStep[];
  notices: string[];
}

/**
 * Docker 仓库对象。
 */
export interface DockerRegistry {
  dockerRegistryId?: number;
  registryName: string;
  registryCode?: string;
  registryUrl?: string;
  namespace?: string;
  username?: string;
  password?: string;
  token?: string;
  defaultRegistry?: boolean;
  enabled?: boolean;
  description?: string;
  metadataJson?: string;
}

/**
 * Docker 挂载对象。
 */
export interface DockerMount {
  dockerMountId?: number;
  serverId: number;
  mountName?: string;
  hostPath: string;
  containerPath: string;
  mountType?: string;
  readOnly?: boolean;
  sourceType?: string;
  enabled?: boolean;
  metadataJson?: string;
}

/**
 * Docker 网络对象。
 */
export interface DockerNetwork {
  dockerNetworkId?: number;
  serverId: number;
  networkName: string;
  driver?: string;
  subnetCidr?: string;
  gatewayIp?: string;
  attachable?: boolean;
  internalNetwork?: boolean;
  sourceType?: string;
  enabled?: boolean;
  metadataJson?: string;
}

/**
 * 安装挂载输入。
 */
export interface DockerInstallMountInput {
  mountId?: number;
  hostPath?: string;
  containerPath?: string;
  readOnly?: boolean;
  mountName?: string;
}

/**
 * 安装网络输入。
 */
export interface DockerInstallNetworkInput {
  networkId?: number;
  networkName?: string;
  driver?: string;
  subnetCidr?: string;
  gatewayIp?: string;
}

/**
 * 安装端口映射输入。
 */
export interface DockerInstallPortMappingInput {
  hostPort?: number;
  containerPort?: number;
  protocol?: string;
  hostIp?: string;
}

/**
 * Docker 安装请求。
 */
export interface DockerInstallRequest {
  serverIds: number[];
  registryId?: number;
  imageName?: string;
  imageTag?: string;
  useDockerfile?: boolean;
  dockerfileContent?: string;
  dockerfilePath?: string;
  buildContextPath?: string;
  containerName?: string;
  env?: Record<string, string>;
  portMappings?: DockerInstallPortMappingInput[];
  mounts?: DockerInstallMountInput[];
  networks?: DockerInstallNetworkInput[];
  syncInputMounts?: boolean;
  syncInputNetworks?: boolean;
}

/**
 * 安装任务票据。
 */
export interface DockerInstallTaskTicket {
  taskId: string;
  status: string;
  message: string;
  createdAt: number;
}

/**
 * 容器视图。
 */
export interface DockerContainerView {
  containerId: string;
  serverId?: number;
  containerName?: string;
  imageName?: string;
  imageTag?: string;
  registryId?: number;
  status?: string;
  ports?: string;
  labels?: Record<string, string>;
  createdAt?: number;
}

/**
 * 进入容器请求。
 */
export interface DockerContainerExecRequest {
  command: string[];
  workDir?: string;
  env?: Record<string, string>;
}

/**
 * 容器配置更新请求。
 */
export interface DockerContainerConfigUpdateRequest {
  env?: Record<string, string>;
  portMappings?: string[];
  mounts?: DockerInstallMountInput[];
  restartPolicy?: string;
  cpuLimit?: string;
  memoryLimit?: string;
}

/**
 * 容器配置更新结果。
 */
export interface DockerContainerConfigUpdateResult {
  containerId: string;
  status: string;
  message: string;
  updatedFields: string[];
}

/**
 * 镜像视图。
 */
export interface DockerImageView {
  imageId: string;
  serverId?: number;
  registryId?: number;
  imageName?: string;
  imageTag?: string;
  sizeBytes?: number;
  status?: string;
  createdAt?: number;
}

/**
 * 镜像拉取请求。
 */
export interface DockerImagePullRequest {
  serverId: number;
  registryId?: number;
  imageName: string;
  imageTag?: string;
}

/**
 * 镜像导入请求。
 */
export interface DockerImageImportRequest {
  serverId: number;
  archivePath: string;
  imageName?: string;
  imageTag?: string;
}

/**
 * 镜像导出请求。
 */
export interface DockerImageExportRequest {
  serverId: number;
  imageId: string;
  outputPath: string;
}

/**
 * 通用操作票据。
 */
export interface DockerOperationTicket {
  operationId: string;
  operationType: string;
  status: string;
  message: string;
  createdAt: number;
}

/**
 * 安装任务步骤。
 */
export interface DockerInstallTaskStepView {
  stepKey: string;
  title: string;
  status: string;
  message: string;
  updatedAt: number;
}

/**
 * 安装任务详情。
 */
export interface DockerInstallTaskDetail {
  taskId: string;
  status: string;
  message: string;
  serverIds: number[];
  registryId?: number;
  imageName?: string;
  imageTag?: string;
  useDockerfile?: boolean;
  requestSnapshot?: DockerInstallRequest;
  steps: DockerInstallTaskStepView[];
  createdAt: number;
  updatedAt: number;
}

/**
 * 通用任务步骤模型。
 */
export interface TaskDialogStep {
  stepKey: string;
  title: string;
  status: string;
  message: string;
  updatedAt?: number;
}

/**
 * 通用任务摘要项。
 */
export interface TaskDialogSummaryItem {
  label: string;
  value: string;
}

/**
 * 通用任务弹框模型。
 */
export interface TaskDialogModel {
  taskId: string;
  status: string;
  message?: string;
  serverIds?: Array<number | string>;
  imageName?: string;
  imageTag?: string;
  summaryItems?: TaskDialogSummaryItem[];
  createdAt?: number;
  updatedAt?: number;
  steps?: TaskDialogStep[];
}

/**
 * 手动同步请求。
 */
export interface DockerSyncRunRequest {
  serverIds?: number[];
  deleteAbsent?: boolean;
}

/**
 * 单服务器同步结果。
 */
export interface DockerSyncServerResult {
  serverId: number;
  scope: string;
  startedAt?: number;
  finishedAt?: number;
  durationMs?: number;
  discoveredCount: number;
  createdCount: number;
  updatedCount: number;
  deletedCount: number;
  failedCount: number;
  message: string;
  errorDetail?: string;
}

/**
 * 同步汇总结果。
 */
export interface DockerSyncResult {
  startedAt?: number;
  scope: string;
  serverCount: number;
  deleteAbsent: boolean;
  discoveredCount: number;
  createdCount: number;
  updatedCount: number;
  deletedCount: number;
  failedCount: number;
  message: string;
  durationMs?: number;
  serverResults: DockerSyncServerResult[];
  finishedAt: number;
}

/**
 * Docker 实时事件载荷。
 */
export interface DockerRealtimePayload {
  eventId?: string;
  taskId?: string;
  scope?: string;
  status?: string;
  stepKey?: string;
  stepOrder?: number;
  progressPercent?: number;
  message?: string;
  line?: string;
  finished?: boolean;
  detail?: unknown;
}

export type DockerResult<T> = ReturnResult<T>;
