import { http, type ReturnResult } from "@repo/utils";

const HTTP_TIMEOUT_KEY = "arthas.http.timeout";

// Arthas 堆栈帧信息
export interface ArthasStackFrame {
  className: string;
  methodName: string;
  fileName?: string;
  lineNumber: number;
}

// Arthas 锁信息
export interface ArthasLockInfo {
  className: string;
  identityHashCode: number;
}

// Arthas 线程信息
export interface ArthasThreadInfo {
  id: number;
  name: string;
  state: string;
  cpu: number;
  daemon: boolean;
  deltaTime: number;
  group: string;
  inNative: boolean;
  interrupted: boolean;
  lockInfo?: ArthasLockInfo;
  lockName?: string;
  lockOwnerId: number;
  lockedMonitors: any[];
  lockedSynchronizers: any[];
  priority: number;
  stackTrace: ArthasStackFrame[];
  suspended: boolean;
  time: number;
  waitedCount: number;
  waitedTime: number;
  blockedCount: number;
  blockedTime: number;
}

// Arthas 增强器效果
export interface ArthasEnhancerEffect {
  classCount: number;
  cost: number;
  listenerId: number;
  methodCount: number;
  overLimitMsg?: string;
}

// Arthas 命令结果
export interface ArthasCommandResult {
  jobId: number;
  type: string;
  // 线程相关
  busyThreads?: ArthasThreadInfo[];
  all?: boolean;
  // trace相关
  tree?: any;
  cost?: number;
  exception?: string;
  // enhancer相关
  effect?: ArthasEnhancerEffect;
  success?: boolean;
  // 状态相关
  statusCode?: number;
}

// Arthas 输出体
export interface ArthasOutputBody {
  command: string;
  jobId: number;
  jobStatus: string;
  results: ArthasCommandResult[];
  timeExpired: boolean;
}

// Arthas 完整输出
export interface ArthasOutput {
  body: ArthasOutputBody;
  sessionId: string;
  state: string;
}

// Arthas 执行响应
export interface ArthasExecResp {
  nodeId: string;
  command: string;
  collectMillis: number;
  output: ArthasOutput;
}

// Arthas 异步执行响应
export interface ArthasAsyncExecResp {
  sessionId: string;
  consumerId: string;
  jobId: number;
}

// Arthas 拉取结果响应
export interface ArthasPullResultsResp {
  body: ArthasOutputBody;
  sessionId: string;
  consumerId: string;
}

/**
 * 通过后端HTTP执行arthas命令（同步方式）
 * - 后端路径：POST /v1/arthas/exec
 * - 请求体：{ nodeId, command, collectMillis }
 * - 超时时间：从本地设置(arthas.http.timeout)读取并作为Axios timeout，同时作为收集时长的默认值
 */
export function execArthasCommand(
  nodeId: string,
  command: string,
  collectMillis?: number
) {
  const timeout = Number(localStorage.getItem(HTTP_TIMEOUT_KEY) || 15000);
  const ms =
    typeof collectMillis === "number" && collectMillis > 0
      ? collectMillis
      : timeout;
  return http.request<ReturnResult<ArthasExecResp>>("post", "/v1/arthas/exec", {
    data: { nodeId, command, collectMillis: ms },
    timeout,
    headers: { "x-remote-animation": "false" },
  });
}

/**
 * 获取或创建会话（推荐使用）
 * - 后端路径：POST /v1/arthas/get-or-create-session
 * - 请求体：{ nodeId, command? }
 * - 返回：{ sessionId, consumerId, jobId }
 * - 逻辑：先检查是否有可用会话，没有则创建新会话
 */
export function getOrCreateSession(nodeId: string, command?: string) {
  return http.request<ReturnResult<ArthasAsyncExecResp>>(
    "post",
    "/v1/arthas/get-or-create-session",
    {
      data: { nodeId, command },
      timeout: 10000,
      headers: { "x-remote-animation": "false" },
    }
  );
}

/**
 * 初始化会话
 * - 后端路径：POST /v1/arthas/init-session
 * - 请求体：{ nodeId, command? }
 * - 返回：{ sessionId, consumerId, jobId }
 */
export function initSession(nodeId: string, command?: string) {
  return http.request<ReturnResult<ArthasAsyncExecResp>>(
    "post",
    "/v1/arthas/init-session",
    {
      data: { nodeId, command },
      timeout: 10000,
      headers: { "x-remote-animation": "false" },
    }
  );
}

/**
 * 异步执行arthas命令（已废弃，建议使用getOrCreateSession）
 * - 后端路径：POST /v1/arthas/async-exec
 * - 请求体：{ nodeId, command }
 * - 返回：{ sessionId, consumerId, jobId }
 */
export function execArthasCommandAsync(nodeId: string, command: string) {
  return http.request<ReturnResult<ArthasAsyncExecResp>>(
    "post",
    "/v1/arthas/async-exec",
    {
      data: { nodeId, command },
      timeout: 10000, // 异步执行超时时间较短
      headers: { "x-remote-animation": "false" },
    }
  );
}

/**
 * 拉取arthas命令执行结果
 * - 后端路径：POST /v1/arthas/pull-results
 * - 请求体：{ sessionId, consumerId }
 * - 返回：命令执行结果
 */
export function pullArthasResults(sessionId: string, consumerId: string) {
  return http.request<ReturnResult<ArthasPullResultsResp>>(
    "post",
    "/v1/arthas/pull-results",
    {
      data: { sessionId, consumerId },
      timeout: 5000, // 拉取结果超时时间较短
      headers: { "x-remote-animation": "false" },
    }
  );
}

/**
 * 停止arthas命令执行
 * - 后端路径：POST /v1/arthas/interrupt-job
 * - 请求体：{ sessionId }
 */
export function interruptArthasJob(sessionId: string) {
  return http.request<ReturnResult<any>>("post", "/v1/arthas/interrupt-job", {
    data: { sessionId },
    timeout: 5000,
    headers: { "x-remote-animation": "false" },
  });
}

/**
 * 关闭arthas会话
 * - 后端路径：POST /v1/arthas/close-session
 * - 请求体：{ sessionId }
 */
export function closeArthasSession(sessionId: string) {
  return http.request<ReturnResult<any>>("post", "/v1/arthas/close-session", {
    data: { sessionId },
    timeout: 5000,
    headers: { "x-remote-animation": "false" },
  });
}
