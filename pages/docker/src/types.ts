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
 * Docker 同步任务配置请求。
 */
export interface DockerSyncScheduleUpdateRequest {
  enabled?: boolean;
  scheduleType?: string;
  scheduleTime?: string;
  description?: string;
}

/**
 * Docker 同步任务配置返回。
 */
export interface DockerSyncScheduleView {
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

export type DockerResult<T> = ReturnResult<T>;

