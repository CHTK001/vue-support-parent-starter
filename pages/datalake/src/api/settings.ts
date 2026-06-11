import type { ReturnResult } from "@repo/utils";
import { datalakeRequest } from "./request";

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

export interface TokenInfo {
  token: string;
  description: string;
  createdAt: number;
  active: boolean;
  expiresAt?: number;
}

/** 获取系统配置 */
export const fetchSettings = () =>
  datalakeRequest<ReturnResult<SystemSettings>>("get", "/v2/datalake/settings");

/** 更新系统配置 */
export const updateSettings = (data: Partial<SystemSettings>) =>
  datalakeRequest<ReturnResult<{ updated: string[]; restartRequired: boolean }>>(
    "put", "/v2/datalake/settings", { data }
  );

export const fetchTokens = () =>
  datalakeRequest<ReturnResult<TokenInfo[]> | TokenInfo[]>("get", "/v2/datalake/auth/token");

export const createToken = (data: { description: string; expiresAt?: number }) =>
  datalakeRequest<ReturnResult<{ token: string }> | { token: string }>("post", "/v2/datalake/auth/token", { data });

export const deleteToken = (token: string) =>
  datalakeRequest<ReturnResult<any> | any>("delete", "/v2/datalake/auth/token", { params: { token } });

export const fetchValidatorStatus = () =>
  datalakeRequest<ReturnResult<any> | any>("get", "/v2/datalake/validator/status");

export const updateValidatorStatus = (data: { enabled: boolean; requirePipelineId: boolean }) =>
  datalakeRequest<ReturnResult<any> | any>("post", "/v2/datalake/validator/toggle", { data });

export const addValidatorWhitelist = (item: string) =>
  datalakeRequest<ReturnResult<any> | any>("post", "/v2/datalake/validator/whitelist/add", { data: { item } });

export const removeValidatorWhitelist = (item: string) =>
  datalakeRequest<ReturnResult<any> | any>("post", "/v2/datalake/validator/whitelist/remove", { data: { item } });
