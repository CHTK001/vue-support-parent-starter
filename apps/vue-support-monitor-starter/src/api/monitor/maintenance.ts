// 维护组和服务器管理接口
import { http, type ReturnResult } from "@repo/utils";

/**
 * 获取维护组列表
 */
export function fetchMaintenanceGroups() {
  return http.request<ReturnResult<any>>("get", "/v1/maintenance/group/list");
}

/**
 * 获取维护组详情
 * @param id 维护组ID
 */
export function fetchMaintenanceGroupDetail(id: number) {
  return http.request<ReturnResult<any>>("get", `/v1/maintenance/group/${id}`);
}

/**
 * 创建维护组
 * @param params 维护组数据
 */
export function createMaintenanceGroup(params: any) {
  return http.request<ReturnResult<any>>("post", "/v1/maintenance/group/save", { data: params });
}

/**
 * 更新维护组
 * @param params 维护组数据
 */
export function updateMaintenanceGroup(params: any) {
  return http.request<ReturnResult<any>>("put", "/v1/maintenance/group/update", { data: params });
}

/**
 * 删除维护组
 * @param id 维护组ID
 */
export function deleteMaintenanceGroup(id: number) {
  return http.request<ReturnResult<any>>("post", `/v1/maintenance/group/delete/${id}`);
}

/**
 * 启用或禁用维护组
 * @param id 维护组ID
 * @param enabled 是否启用
 */
export function enableMaintenanceGroup(id: number, enabled: boolean) {
  return http.request<ReturnResult<any>>("put", `/v1/maintenance/group/update`, {
    data: {
      maintenanceGroupId: id,
      maintenanceGroupEnabled: enabled
    }
  });
}

/**
 * 获取维护主机列表
 * @param groupId 维护组ID
 */
export function fetchMaintenanceHosts(params: any) {
  return http.request<ReturnResult<any>>("get", "/v1/maintenance/host/list", { params });
}

/**
 * 创建维护主机
 * @param params 维护主机数据
 */
export function createMaintenanceHost(params: any) {
  return http.request<ReturnResult<any>>("post", "/v1/maintenance/host/save", { data: params });
}

/**
 * 更新维护主机
 * @param params 维护主机数据
 */
export function updateMaintenanceHost(params: any) {
  return http.request<ReturnResult<any>>("put", "/v1/maintenance/host/update", { data: params });
}

/**
 * 删除维护主机
 * @param id 维护主机ID
 */
export function deleteMaintenanceHost(id: number) {
  return http.request<ReturnResult<any>>("post", `/v1/maintenance/host/delete/${id}`);
}

/**
 * 启用或禁用维护主机
 * @param id 维护主机ID
 * @param enabled 是否启用
 */
export function enableMaintenanceHost(id: number, enabled: boolean) {
  return http.request<ReturnResult<any>>("put", `/v1/maintenance/host/update`, {
    data: {
      maintenanceHostId: id,
      maintenanceHostEnabled: enabled
    }
  });
}

/**
 * 测试主机连接
 * @param id 维护主机ID
 */
export function testHostConnection(id: number) {
  return http.request<ReturnResult<any>>("post", `/v1/maintenance/host/test/${id}`);
}

/**
 * 获取维护脚本列表
 * @param groupId 维护组ID
 */
export function fetchMaintenanceScripts(groupId: number) {
  return http.request<ReturnResult<any>>("get", "/v1/maintenance/script/list", { params: { groupId } });
}

/**
 * 创建维护脚本
 * @param params 维护脚本数据
 */
export function createMaintenanceScript(params: any) {
  return http.request<ReturnResult<any>>("post", "/v1/maintenance/script/save", { data: params });
}

/**
 * 更新维护脚本
 * @param params 维护脚本数据
 */
export function updateMaintenanceScript(params: any) {
  return http.request<ReturnResult<any>>("put", "/v1/maintenance/script/update", { data: params });
}

/**
 * 删除维护脚本
 * @param id 维护脚本ID
 */
export function deleteMaintenanceScript(id: number) {
  return http.request<ReturnResult<any>>("post", `/v1/maintenance/script/delete/${id}`);
}

/**
 * 同步脚本到远程主机
 * @param id 脚本ID
 */
export function syncMaintenanceScript(id: number) {
  return http.request<ReturnResult<any>>("post", `/v1/maintenance/script/${id}/sync`);
}

/**
 * 执行维护脚本
 * @param id 脚本ID
 * @param params 执行参数，必须包含maintenanceGroupId
 */
export function executeMaintenanceScript(id: number, params: any) {
  return http.request<ReturnResult<any>>("post", "/v1/maintenance/script/run", {
    data: {
      maintenanceScriptId: id,
      ...params
    }
  });
}

/**
 * 上传文件到维护组
 * @param formData 文件表单数据
 */
export function uploadFileToGroup(formData: FormData) {
  return http.request<ReturnResult<any>>("put", "/v1/maintenance/file/upload", {
    data: formData,
    headers: {
      "Content-Type": "multipart/form-data"
    }
  });
}

/**
 * 获取维护文件列表
 * @param groupId 维护组ID
 */
export function fetchMaintenanceFiles(groupId: number) {
  return http.request<ReturnResult<any>>("get", "/v1/maintenance/file/list", { params: { groupId } });
}

/**
 * 删除维护文件
 * @param id 文件ID
 */
export function deleteMaintenanceFile(id: number) {
  return http.request<ReturnResult<any>>("post", `/v1/maintenance/file/delete/${id}`);
}

/**
 * 部署文件到所有主机
 * @param id 文件ID
 * @param params 部署参数，包含groupId
 */
export function deployFile(id: number, params: any) {
  return http.request<ReturnResult<any>>("post", `/v1/maintenance/file/deploy/${id}`, { data: params });
}

/**
 * 同步文件到远程主机
 * @param id 文件ID
 */
export function syncMaintenanceFile(id: number) {
  return http.request<ReturnResult<any>>("post", `/v1/maintenance/file/${id}/sync`);
}

/**
 * 更新维护文件
 * @param params 维护文件数据
 */
export function updateMaintenanceFile(params: any) {
  return http.request<ReturnResult<any>>("put", "/v1/maintenance/file/update", { data: params });
}

/**
 * 获取维护日志
 * @param groupId 维护组ID
 */
export function getMaintenanceLogs(params: any) {
  return http.request<ReturnResult<any>>("get", `/v1/maintenance/log/group/${params?.groupId}`, { params });
}
