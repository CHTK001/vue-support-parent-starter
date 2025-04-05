// 维护组和服务器管理接口
import { http, type ReturnResult } from "@repo/utils";

/**
 * 获取维护组列表
 */
export function fetchMaintenanceGroups() {
  return http.request<ReturnResult<any>>("get", "/api/maintenance/group/list");
}

/**
 * 获取维护组详情
 * @param id 维护组ID
 */
export function fetchMaintenanceGroupDetail(id: number) {
  return http.request<ReturnResult<any>>("get", `/api/maintenance/group/${id}`);
}

/**
 * 创建维护组
 * @param params 维护组数据
 */
export function createMaintenanceGroup(params: any) {
  return http.request<ReturnResult<any>>("post", "/api/maintenance/group/save", { data: params });
}

/**
 * 更新维护组
 * @param params 维护组数据
 */
export function updateMaintenanceGroup(params: any) {
  return http.request<ReturnResult<any>>("put", "/api/maintenance/group/update", { data: params });
}

/**
 * 删除维护组
 * @param id 维护组ID
 */
export function deleteMaintenanceGroup(id: number) {
  return http.request<ReturnResult<any>>("post", `/api/maintenance/group/delete/${id}`);
}

/**
 * 启用或禁用维护组
 * @param id 维护组ID
 * @param enabled 是否启用
 */
export function enableMaintenanceGroup(id: number, enabled: boolean) {
  return http.request<ReturnResult<any>>("post", `/api/maintenance/group/status/${id}/${enabled ? 1 : 0}`);
}

/**
 * 获取维护主机列表
 * @param params 查询参数，包含groupId
 */
export function fetchMaintenanceHosts(params: any) {
  return http.request<ReturnResult<any>>("get", "/api/maintenance/host/list", { params });
}

/**
 * 创建维护主机
 * @param params 维护主机数据
 */
export function createMaintenanceHost(params: any) {
  return http.request<ReturnResult<any>>("post", "/api/maintenance/host/save", { data: params });
}

/**
 * 更新维护主机
 * @param params 维护主机数据
 */
export function updateMaintenanceHost(params: any) {
  return http.request<ReturnResult<any>>("put", "/api/maintenance/host/update", { data: params });
}

/**
 * 删除维护主机
 * @param id 维护主机ID
 */
export function deleteMaintenanceHost(id: number) {
  return http.request<ReturnResult<any>>("post", `/api/maintenance/host/delete/${id}`);
}

/**
 * 启用或禁用维护主机
 * @param id 维护主机ID
 * @param enabled 是否启用
 */
export function enableMaintenanceHost(id: number, enabled: boolean) {
  return http.request<ReturnResult<any>>("post", `/api/maintenance/host/status/${id}/${enabled ? 1 : 0}`);
}

/**
 * 测试主机连接
 * @param id 维护主机ID
 */
export function testHostConnection(id: number) {
  return http.request<ReturnResult<any>>("post", `/api/maintenance/host/test/${id}`);
}

/**
 * 获取维护脚本列表
 * @param params 查询参数，包含groupId
 */
export function fetchMaintenanceScripts(params: any) {
  return http.request<ReturnResult<any>>("get", "/api/maintenance/script/list", { params });
}

/**
 * 创建维护脚本
 * @param params 维护脚本数据
 */
export function createMaintenanceScript(params: any) {
  return http.request<ReturnResult<any>>("post", "/api/maintenance/script/save", { data: params });
}

/**
 * 更新维护脚本
 * @param params 维护脚本数据
 */
export function updateMaintenanceScript(params: any) {
  return http.request<ReturnResult<any>>("put", "/api/maintenance/script/update", { data: params });
}

/**
 * 删除维护脚本
 * @param id 维护脚本ID
 */
export function deleteMaintenanceScript(id: number) {
  return http.request<ReturnResult<any>>("post", `/api/maintenance/script/delete/${id}`);
}

/**
 * 执行维护脚本
 * @param id 脚本ID
 * @param params 执行参数，包含groupId
 */
export function executeMaintenanceScript(id: number, params: any) {
  return http.request<ReturnResult<any>>("post", `/api/maintenance/script/execute/${id}`, { data: params });
}

/**
 * 上传文件到维护组
 * @param formData 文件表单数据
 */
export function uploadFileToGroup(formData: FormData) {
  return http.request<ReturnResult<any>>("put", "/api/maintenance/file/upload", {
    data: formData,
    headers: {
      "Content-Type": "multipart/form-data"
    }
  });
}

/**
 * 获取维护文件列表
 * @param params 查询参数，包含groupId
 */
export function fetchMaintenanceFiles(params: any) {
  return http.request<ReturnResult<any>>("get", "/api/maintenance/file/list", { params });
}

/**
 * 删除维护文件
 * @param id 文件ID
 */
export function deleteMaintenanceFile(id: number) {
  return http.request<ReturnResult<any>>("post", `/api/maintenance/file/delete/${id}`);
}

/**
 * 部署文件到所有主机
 * @param id 文件ID
 * @param params 部署参数，包含groupId
 */
export function deployFile(id: number, params: any) {
  return http.request<ReturnResult<any>>("post", `/api/maintenance/file/deploy/${id}`, { data: params });
}

/**
 * 更新维护文件
 * @param params 维护文件数据
 */
export function updateMaintenanceFile(params: any) {
  return http.request<ReturnResult<any>>("put", "/api/maintenance/file/update", { data: params });
}
