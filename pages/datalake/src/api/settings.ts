import { http, type ReturnResult } from "@repo/utils";

export interface SystemSettings {
  httpPort: number;
  wsPort: number;
  tcpCollectPort: number;
  mqSubPort: number;
  tcpSubPort: number;
  authEnabled: boolean;
  rateLimit: number;
  weatherInterval: number;
}

/** 获取系统配置 */
export const fetchSettings = () =>
  http.request<ReturnResult<SystemSettings>>("get", "/v2/datalake/settings");

/** 更新系统配置 */
export const updateSettings = (data: Partial<SystemSettings>) =>
  http.request<ReturnResult<{ updated: string[]; restartRequired: boolean }>>(
    "put", "/v2/datalake/settings", { data }
  );