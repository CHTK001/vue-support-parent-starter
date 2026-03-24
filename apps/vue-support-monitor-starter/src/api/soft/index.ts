import { http, type ReturnResult } from "@repo/utils";

// 从新的docker-management.ts中重新导出API
export * from "../docker/management";

// 为了向后兼容，保留一些旧的函数名
export {
  getSoftPageList,
  createSoft as saveSoft,
  updateSoft,
  deleteSoft,
  syncSoftware as syncSoft,
  getContainerPageList,
  getContainersBySoftId,
  getContainersByServerId,
  getContainerById,
  getContainerLogs,
  getContainerStats,
  startContainer,
  stopContainer,
  restartContainer,
  deleteContainer,
  createContainer,
  batchOperateContainers,
  syncContainerStatus,
} from "../docker/management";

// 软件仓库API（重新导出为原有的名称）
export {
  pageRegistry,
  getAllRegistries,
  getRegistryById,
  createRegistry,
  updateRegistry,
  deleteRegistry,
  batchDeleteRegistries,
  testRegistryConnection,
  syncRegistry,
} from "../docker/management";

// 为了向后兼容，保留一个softRegistryApi对象
import { registryApi } from "../docker/management";
export const softRegistryApi = registryApi;

// 为了兼容现有代码，保留一些遗留函数接口
export function getSoftVersionPageList(params: any) {
  return http.request<ReturnResult<{ records: any[]; total: number }>>(
    "get",
    "v1/soft/version/page",
    { params }
  );
}

export function saveSoftVersion(data: any) {
  return http.request<ReturnResult<any>>("post", "v1/soft/version/save", {
    data,
  });
}

export function updateSoftVersion(data: any) {
  return http.request<ReturnResult<boolean>>("put", "v1/soft/version/update", {
    data,
  });
}

export function installSoft(params: {
  systemSoftId: number;
  systemSoftVersionId: number;
  serverIds: number[];
  method?: string;
  params?: string;
}) {
  return http.request<ReturnResult<boolean>>("post", "v1/soft/record/install", {
    data: params,
  });
}

export function uninstallSoft(params: {
  systemSoftId: number;
  systemSoftVersionId: number;
  serverIds: number[];
}) {
  return http.request<ReturnResult<boolean>>(
    "post",
    "v1/soft/record/uninstall",
    { data: params }
  );
}

export function getSoftRecordPageList(params: any) {
  return http.request<ReturnResult<{ records: any[]; total: number }>>(
    "get",
    "v1/soft/record/page",
    { params }
  );
}

export function getAbnormalContainers() {
  return http.request<ReturnResult<any[]>>(
    "get",
    "v1/system/soft/container/abnormal"
  );
}

// 新增软件安装记录相关API函数
export function getSoftInstallRecords(params: any) {
  return http.request<ReturnResult<{ records: any[]; total: number }>>(
    "get",
    "v1/soft/record/page",
    { params }
  );
}

export function retryInstallSoft(data: { recordId: string }) {
  return http.request<ReturnResult<boolean>>("post", "v1/soft/record/retry", {
    data,
  });
}

export function cancelInstallSoft(data: { recordId: string }) {
  return http.request<ReturnResult<boolean>>("post", "v1/soft/record/cancel", {
    data,
  });
}

export function deleteInstallRecord(data: { recordId: string }) {
  return http.request<ReturnResult<boolean>>("delete", "v1/soft/record", {
    data,
  });
}

export function getInstallLogs(params: { recordId: string }) {
  return http.request<ReturnResult<string>>("get", "v1/soft/record/logs", {
    params,
  });
}

// 软件容器相关API函数
export function getSoftContainerList(params: any) {
  return http.request<ReturnResult<any[]>>(
    "get",
    "v1/system/soft/container/list",
    { params }
  );
}

export function startSoftContainer(data: { containerId: string }) {
  return http.request<ReturnResult<boolean>>(
    "post",
    "v1/system/soft/container/start",
    { data }
  );
}

export function stopSoftContainer(data: { containerId: string }) {
  return http.request<ReturnResult<boolean>>(
    "post",
    "v1/system/soft/container/stop",
    { data }
  );
}

export function removeSoftContainer(data: { containerId: string }) {
  return http.request<ReturnResult<boolean>>(
    "delete",
    "v1/system/soft/container",
    { data }
  );
}

export function getSoftContainerLogs(params: { containerId: string }) {
  return http.request<ReturnResult<string>>(
    "get",
    "v1/system/soft/container/logs",
    { params }
  );
}

// 获取WebSocket主题信息
export { getWebSocketTopics } from "../docker/management";
