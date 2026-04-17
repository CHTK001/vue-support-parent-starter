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
  // 服务状态
  version: string;
  pid: string;
  running: boolean;
  configOk: boolean;
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

// ─── 兼容旧接口 ────────────────────────────────────────────────────────────────

export const listNginxSites = (connectionId: string) =>
  http.request<ReturnResult<string[]>>("get", `${BASE(connectionId)}/sites`);

// ─── 脚本执行 ──────────────────────────────────────────────────────────────────

export const executeNginxScript = (connectionId: string, script: string) =>
  http.request<ReturnResult<string>>("post", `${BASE(connectionId)}/execute-script`, {
    data: { script },
  });

// ─── 项目管理 API 工厂（basePath 指向 /v1/server/project/{connectionId}） ─────────

export const createPanelProjectApi = (connectionId: string) =>
  createRemoteApi(`/v1/server/project/${connectionId}`);
