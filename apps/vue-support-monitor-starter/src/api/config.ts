///
/// Copyright (c) 2019 Of Him Code Technology Studio
/// Jpom is licensed under Mulan PSL v2.
/// You can use this software according to the terms and conditions of the Mulan PSL v2.
/// You may obtain a copy of Mulan PSL v2 at:
/// 			http://license.coscl.org.cn/MulanPSL2
/// THIS SOFTWARE IS PROVIDED ON AN "AS IS" BASIS, WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT, MERCHANTABILITY OR FIT FOR A PARTICULAR PURPOSE.
/// See the Mulan PSL v2 for more details.
///

import { t } from "@repo/config";
import { GlobalWindow } from "@/interface/common";
import { IResponse } from "@/interface/request";
import { base64Encode } from "@/utils/check-type";
import { http, type RequestMethods } from "@repo/utils";
import { AxiosRequestConfig } from "axios";

const delTimeout: number = 20 * 1000;
const jpomWindow_ = window as unknown as GlobalWindow;
const apiTimeout: number = Number(jpomWindow_.apiTimeout === "<apiTimeout>" ? delTimeout : jpomWindow_.apiTimeout);
// debug routerBase
const routerBase: string = jpomWindow_.routerBase === "<routerBase>" ? "" : jpomWindow_.routerBase;

const pro: boolean = process.env.NODE_ENV === "production";

const baseURL = import.meta.env.JPOM_BASE_API_URL || "/monitor/api";

// 续签状态
let isRefreshing = false;

const obj2base64 = (obj: any) => {
  if (obj instanceof Object && obj.constructor === Object) {
    const keys = Object.keys(obj);
    const newData: any = {};
    for (const key of keys) {
      const item = obj[key];
      if (typeof item === "string" || typeof item === "number" || typeof item === "boolean") {
        newData[base64Encode(String(key))] = base64Encode(String(item));
      }
    }
    return newData;
  } else if (obj instanceof FormData) {
    const newFormData: any = new FormData();
    for (const key of (obj as any).keys()) {
      const item = obj.get(key);
      if (typeof item === "string" || typeof item === "number" || typeof item === "boolean") {
        newFormData.append(base64Encode(String(key)), base64Encode(String(item)));
      } else {
        newFormData.append(base64Encode(String(key)), item);
      }
    }
    return newFormData;
  }
  if (Array.isArray(obj)) {
    return obj.map((item: any) => {
      if (typeof item === "string" || typeof item === "number" || typeof item === "boolean") {
        item = base64Encode(String(item));
      }
      return item;
    });
  }
  return obj;
};

/**
 * 请求封装
 * @param url 接口地址
 * @param config AxiosRequestConfig
 * @returns IResponse<T>
 */
async function request<T = any>(url: string, config?: AxiosRequestConfig): Promise<IResponse<T>>;
// eslint-disable-next-line no-redeclare
async function request<T = any>(config: AxiosRequestConfig): Promise<IResponse<T>>;
// eslint-disable-next-line no-redeclare
async function request<T = any>(arg: string | AxiosRequestConfig, config?: AxiosRequestConfig): Promise<IResponse<T>> {
  config = config || {};
  const options =
    typeof arg === "string"
      ? {
          url: arg,
          ...config
        }
      : arg;
  return http.request((options.method || "GET") as RequestMethods, options.url, options);
}

export default request;

export function loadRouterBase(url: string, params: any) {
  const paramsObj = params || {};
  let queryStr = "";
  Object.keys(paramsObj).forEach((key, i) => {
    queryStr += `${i === 0 ? "" : "&"}${key}=${paramsObj[key]}`;
  });
  return `${(baseURL + (routerBase || "") + url).replace(new RegExp("//", "gm"), "/")}?${queryStr}`;
}

/**
 * 获取 socket 地址
 * @param {String} url 二级地址
 * @param {String} parameter 参数
 * @returns
 */
export function getWebSocketUrl(url: string, parameter: any) {
  const protocol: string = location.protocol === "https:" ? "wss://" : "ws://";
  const fullUrl: string = ((baseURL || "") + (routerBase || "") + url).replace(new RegExp("//", "gm"), "/");
  return `${protocol}${location.host}${fullUrl}?${parameter}`;
}

// ==================== 配置管理相关类型和接口 ====================

/**
 * 配置项类型
 */
export interface MonitorConfig {
  monitorSysGenConfigId?: number;
  monitorSysGenConfigKey?: string;
  monitorSysGenConfigValue?: string;
  monitorSysGenConfigDescription?: string;
  monitorSysGenConfigEnv?: string;
  monitorSysGenConfigApp?: string;
  monitorSysGenConfigStatus?: number;
  createTime?: string;
  updateTime?: string;
}

/**
 * 配置推送请求
 */
export interface ConfigPushRequest {
  configIds: number[];
  serverIds: number[];
}

/**
 * 配置推送历史
 */
export interface ConfigPushHistory {
  id: number;
  configId: number;
  configKey: string;
  configValue: string;
  serverId: number;
  serverName: string;
  success: boolean;
  pushTime: string;
  operator: string;
}

/**
 * 配置统计
 */
export interface ConfigStats {
  total: number;
  enabled: number;
  disabled: number;
  envStats: Record<string, number>;
}

/**
 * 获取配置分页列表
 */
export function getConfigPageList(params?: any) {
  return request("/config/page", { params });
}

/**
 * 删除配置
 */
export function deleteConfig(id: number) {
  return request(`/config/${id}`, { method: "DELETE" });
}

/**
 * 获取环境列表
 */
export function getEnvList() {
  return request("/config/envs");
}

/**
 * 获取配置统计
 */
export function getConfigStats() {
  return request("/config/stats");
}

/**
 * 推送配置到节点
 */
export function pushConfigToNodes(data: ConfigPushRequest) {
  return request("/config/push", { method: "POST", data });
}

/**
 * 获取配置推送历史
 */
export function getConfigPushHistory(params?: any) {
  return request("/config/push/history", { params });
}

/**
 * 从历史记录重新推送
 */
export function repushFromHistory(historyId: number) {
  return request(`/config/push/history/${historyId}/repush`, { method: "POST" });
}

/**
 * 批量从历史记录重新推送
 */
export function batchRepushFromHistory(historyIds: number[]) {
  return request("/config/push/history/batch-repush", { method: "POST", data: { ids: historyIds } });
}

/**
 * 删除推送历史
 */
export function deletePushHistory(historyId: number) {
  return request(`/config/push/history/${historyId}`, { method: "DELETE" });
}

/**
 * 批量删除推送历史
 */
export function batchDeletePushHistory(historyIds: number[]) {
  return request("/config/push/history/batch-delete", { method: "POST", data: { ids: historyIds } });
}
