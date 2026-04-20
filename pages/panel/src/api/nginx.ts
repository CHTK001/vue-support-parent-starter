import { http, type ReturnResult } from "@repo/utils";
import { createRemoteApi } from "@pages/server";

const BASE = (id: string) => `/v1/panel/nginx/${id}`;

// ─── 基础类型 ──────────────────────────────────────────────────────────────────

export interface NginxStatusResult {
  configTest: string;
  systemctlStatus: string;
  version: string;
  pid: string;
}

export interface NginxActionResult {
  output: string;
  success: boolean;
}

// ─── Location 块 ───────────────────────────────────────────────────────────────

export interface NginxLocationBlock {
  path: string;
  mode?: 'proxy' | 'static' | 'redirect' | 'custom';
  // 反向代理
  proxyPass?: string;
  proxyReadTimeout?: string;
  proxyConnectTimeout?: string;
  proxySetHeader?: string[];
  proxyBuffering?: boolean;
  // 静态文件
  root?: string;
  alias?: string;
  tryFiles?: string;
  expires?: string;
  autoindex?: boolean;
  index?: string;
  // 重定向
  returnCode?: string;
  returnUrl?: string;
  // 访问控制
  allowList?: string[];
  denyList?: string[];
  // 限流
  limitReqZone?: string;
  limitReqBurst?: string;
  limitReqNoDelay?: boolean;
  // 通用
  addHeader?: string[];
  // 自定义
  rawDirectives?: string;
}

// ─── Server 块 ─────────────────────────────────────────────────────────────────

export interface NginxServerBlock {
  listen?: string;
  serverName?: string;
  root?: string;
  index?: string;
  sslCertificate?: string;
  sslCertificateKey?: string;
  accessLog?: string;
  locations?: NginxLocationBlock[];
  configPath?: string;
}

// ─── 配置文件 ──────────────────────────────────────────────────────────────────

export interface NginxConfFile {
  path: string;
  label: string;
  type?: 'main' | 'site' | 'include';
  servers?: NginxServerBlock[];
  exists?: boolean;
}

// ─── 大屏统计 ──────────────────────────────────────────────────────────────────

export interface NginxDashboardStats {
  // stub_status
  activeConnections: number;
  accepts: number;
  handled: number;
  requests: number;
  reading: number;
  writing: number;
  waiting: number;
  stubStatusAvailable: boolean;
  // access.log 分析
  topIps: Record<string, number>;
  recentRequests: string[];
  analyzedLines: number;
  uniqueIps: number;
  requestsPerMinute: number;
  dailyRequests: number;
  dailyUniqueIps: number;
  weeklyRequests: number;
  weeklyUniqueIps: number;
  monthlyRequests: number;
  monthlyUniqueIps: number;
  // 服务状态
  version: string;
  pid: string;
  running: boolean;
  configOk: boolean;
}

export interface NginxSiteIpTraffic {
  ip: string;
  requests: number;
  percent: number;
}

export interface NginxSiteTraffic {
  siteKey: string;
  siteName: string;
  logPath: string;
  requests: number;
  uniqueIps: number;
  qps: number;
  tps: number;
  topIps: NginxSiteIpTraffic[];
}

export interface NginxTrafficPoint {
  label: string;
  requests: number;
}

export interface NginxTrafficTrend {
  siteKey: string;
  siteName: string;
  ip: string;
  granularity: "minute" | "hour" | "day" | string;
  points: NginxTrafficPoint[];
}

export interface SoftPackageSummary {
  softPackageId?: number;
  packageCode?: string;
  packageName?: string;
}

export interface SoftPackageVersionSummary {
  softPackageVersionId?: number;
  versionCode?: string;
  versionName?: string;
}

export interface SoftPackageDetail {
  package: SoftPackageSummary;
  versions: SoftPackageVersionSummary[];
}

export interface SoftTargetPayload {
  softTargetId?: number;
  targetName: string;
  targetCode: string;
  targetType: "LOCAL" | "SSH" | "WINRM";
  osType?: string;
  host?: string;
  port?: number;
  username?: string;
  password?: string;
  privateKey?: string;
  baseDirectory?: string;
  enabled?: boolean;
  description?: string;
  metadataJson?: string;
}

export interface SoftInstallRequest {
  softPackageId: number;
  softPackageVersionId: number;
  softTargetId: number;
  installationName?: string;
  installPath?: string;
  serviceName?: string;
  installOptions?: Record<string, any>;
  serviceOptions?: Record<string, any>;
  configOptions?: Record<string, any>;
}

export interface SoftOperationTicket {
  operationId: number;
  installationId?: number;
  operationStatus?: string;
}

// ─── 连接管理 ──────────────────────────────────────────────────────────────────

export const openNginxConnection = (
  host: string,
  port: number,
  username: string,
  password?: string,
  privateKey?: string
) =>
  http.request<ReturnResult<string>>("post", "/v1/panel/nginx/open", {
    data: { host, port, username, password, privateKey },
  });

export const closeNginxConnection = (connectionId: string) =>
  http.request<ReturnResult<void>>("delete", BASE(connectionId));

// ─── 服务控制 ──────────────────────────────────────────────────────────────────

export const fetchNginxStatus = (connectionId: string) =>
  http.request<ReturnResult<NginxStatusResult>>("get", `${BASE(connectionId)}/status`);

export const reloadNginx = (connectionId: string) =>
  http.request<ReturnResult<NginxActionResult>>("post", `${BASE(connectionId)}/reload`);

export const restartNginx = (connectionId: string) =>
  http.request<ReturnResult<NginxActionResult>>("post", `${BASE(connectionId)}/restart`);

export const stopNginx = (connectionId: string) =>
  http.request<ReturnResult<NginxActionResult>>("post", `${BASE(connectionId)}/stop`);

// ─── 配置文件管理 ──────────────────────────────────────────────────────────────

export const readNginxConfig = (connectionId: string, path?: string) =>
  http.request<ReturnResult<string>>("get", `${BASE(connectionId)}/config`, {
    params: { path },
  });

export const writeNginxConfig = (connectionId: string, path: string, content: string) =>
  http.request<ReturnResult<void>>("put", `${BASE(connectionId)}/config`, {
    data: { path, content },
  });

export const listNginxConfFiles = (connectionId: string) =>
  http.request<ReturnResult<NginxConfFile[]>>("get", `${BASE(connectionId)}/conf-files`);

export const createNginxConfFile = (connectionId: string, path: string, content = "") =>
  http.request<ReturnResult<NginxConfFile>>("post", `${BASE(connectionId)}/conf-files`, {
    data: { path, content },
  });

export const deleteNginxConfFile = (connectionId: string, path: string) =>
  http.request<ReturnResult<void>>("delete", `${BASE(connectionId)}/conf-files`, {
    params: { path },
  });

// ─── Server/Location 结构化管理 ────────────────────────────────────────────────

export const fetchNginxServers = (connectionId: string, configPath?: string) =>
  http.request<ReturnResult<NginxServerBlock[]>>("get", `${BASE(connectionId)}/servers`, {
    params: { configPath },
  });

export const saveNginxServers = (
  connectionId: string,
  servers: NginxServerBlock[],
  configPath?: string
) =>
  http.request<ReturnResult<void>>("put", `${BASE(connectionId)}/servers`, {
    data: { configPath, servers },
  });

// ─── 日志 ──────────────────────────────────────────────────────────────────────

export const tailNginxLog = (connectionId: string, logPath?: string, lines = 100) =>
  http.request<ReturnResult<string>>("get", `${BASE(connectionId)}/log`, {
    params: { logPath, lines },
  });

// ─── 大屏统计 ──────────────────────────────────────────────────────────────────

export const fetchNginxDashboard = (
  connectionId: string,
  accessLogPath?: string,
  topN = 20,
  /** 是否禁用顶部进度条（轮询时传 true） */
  silent = false
) =>
  http.request<ReturnResult<NginxDashboardStats>>("get", `${BASE(connectionId)}/dashboard`, {
    params: { accessLogPath, topN },
    headers: silent ? { "x-remote-animation": "false" } : undefined,
  });

export const fetchNginxSiteTraffic = (connectionId: string, topN = 10) =>
  http.request<ReturnResult<NginxSiteTraffic[]>>("get", `${BASE(connectionId)}/traffic/sites`, {
    params: { topN },
  });

export const fetchNginxTrafficTrend = (
  connectionId: string,
  siteKey: string,
  ip: string,
  granularity: "minute" | "hour" | "day" = "minute",
) =>
  http.request<ReturnResult<NginxTrafficTrend>>("get", `${BASE(connectionId)}/traffic/trend`, {
    params: { siteKey, ip, granularity },
  });

export const listSoftPackages = () =>
  http.request<ReturnResult<SoftPackageSummary[]>>("get", "/soft/packages");

export const getSoftPackageDetail = (packageId: number) =>
  http.request<ReturnResult<SoftPackageDetail>>("get", `/soft/packages/${packageId}`);

export const listSoftTargets = () =>
  http.request<ReturnResult<SoftTargetPayload[]>>("get", "/soft/targets");

export const createSoftTarget = (payload: SoftTargetPayload) =>
  http.request<ReturnResult<SoftTargetPayload>>("post", "/soft/targets", { data: payload });

export const updateSoftTarget = (targetId: number, payload: SoftTargetPayload) =>
  http.request<ReturnResult<SoftTargetPayload>>("put", `/soft/targets/${targetId}`, { data: payload });

export const installSoftPackage = (payload: SoftInstallRequest) =>
  http.request<ReturnResult<SoftOperationTicket>>("post", "/soft/installations", { data: payload });

// ─── 兼容旧接口 ────────────────────────────────────────────────────────────────

export const listNginxSites = (connectionId: string) =>
  http.request<ReturnResult<string[]>>("get", `${BASE(connectionId)}/sites`);

// ─── 脚本执行 ──────────────────────────────────────────────────────────────────

export const executeNginxScript = (connectionId: string, script: string) =>
  http.request<ReturnResult<string>>("post", `${BASE(connectionId)}/execute-script`, {
    data: { script },
  });

// ─── 项目管理 API 工厂（basePath 指向 /v2/project/{sysProjectId}/remote） ─────────

export const createPanelProjectApi = (sysProjectId: string | number) =>
  createRemoteApi(`/v2/project/${sysProjectId}/remote`);
