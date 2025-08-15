import { http, type ReturnResult } from "@repo/utils";

// ========= 类型 =========
export interface SystemSoft {
  systemSoftId?: number;
  systemSoftName?: string;
  systemSoftCode?: string;
  systemSoftCategory?: string;
  systemSoftIcon?: string;
  systemSoftTags?: string;
  systemSoftDesc?: string;
  systemSoftImage?: string;
}

export interface SystemSoftVersion {
  systemSoftVersionId?: number;
  systemSoftId?: number;
  version?: string;
  downloadUrl?: string;
  imageTag?: string;
  installTemplate?: string;
}

export interface PageParams<T = any> {
  page?: number;
  pageSize?: number;
  [k: string]: any;
}

// ========= 软件 =========
export function getSoftPageList(params: PageParams<SystemSoft>) {
  return http.request<ReturnResult<{ records: SystemSoft[]; total: number }>>("get", "v1/soft/page", { params });
}

export function saveSoft(data: SystemSoft) {
  return http.request<ReturnResult<SystemSoft>>("post", "v1/soft/save", { data });
}

export function updateSoft(data: SystemSoft) {
  return http.request<ReturnResult<boolean>>("put", "v1/soft/update", { data });
}

export function syncSoft() {
  return http.request<ReturnResult<boolean>>("post", "v1/soft/sync", {});
}

// ========= 版本 =========
export function getSoftVersionPageList(params: PageParams<SystemSoftVersion>) {
  return http.request<ReturnResult<{ records: SystemSoftVersion[]; total: number }>>("get", "v1/soft/version/page", { params });
}

export function saveSoftVersion(data: SystemSoftVersion) {
  return http.request<ReturnResult<SystemSoftVersion>>("post", "v1/soft/version/save", { data });
}

export function updateSoftVersion(data: SystemSoftVersion) {
  return http.request<ReturnResult<boolean>>("put", "v1/soft/version/update", { data });
}

// ========= 安装/卸载 =========
export function installSoft(params: { systemSoftId: number; systemSoftVersionId: number; serverIds: number[] }) {
  return http.request<ReturnResult<boolean>>("post", "v1/soft/record/install", { params });
}

export function uninstallSoft(params: { systemSoftId: number; systemSoftVersionId: number; serverIds: number[] }) {
  return http.request<ReturnResult<boolean>>("post", "v1/soft/record/uninstall", { params });
}

