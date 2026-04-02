import type { AxiosRequestConfig, CustomParamsSerializer } from "axios";
import { stringify } from "qs";
import { getConfig } from "@repo/config";
import { resolveRequestConfig } from "./config-resolver";

/** 无权限状态码判断 */
export const isNoAuth = (code: string | number | null): boolean =>
  code === "C0403S0000" || code === 403;

/** 成功状态码判断 */
export const isSuccess = (code: string | number | null): boolean =>
  code === "00000" || code === 200;

/** 获取请求配置 */
export const getRequestConfig = () => {
  return resolveRequestConfig(getConfig());
};

/** 获取错误处理配置 */
export const getErrorHandlerConfig = () => {
  const config = getConfig();
  return {
    enable: config?.ErrorHandler?.enable || false,
    showNotification: config?.ErrorHandler?.showNotification !== false,
    logToConsole: config?.ErrorHandler?.logToConsole !== false,
    reportToServer: config?.ErrorHandler?.reportToServer || false,
    reportUrl: config?.ErrorHandler?.reportUrl || "/v1/error/report",
  };
};

/** 默认请求配置 */
export const defaultConfig: AxiosRequestConfig = {
  timeout: getRequestConfig().timeout,
  baseURL: getConfig()?.BaseUrl,
  headers: {
    Accept: "application/json, text/plain, */*",
    "Content-Type": "application/json; charset=UTF-8",
    "X-Requested-With": "XMLHttpRequest",
  },
  responseType: "blob",
  paramsSerializer: {
    serialize: stringify as unknown as CustomParamsSerializer,
  },
};

/** 请求白名单（不需要 token，也不追加前端签名头） */
export const WHITE_LIST = [
  "/refresh-token",
  "/login",
  "/logout",
  "/v2/setting/default",
];
