import { http, type ReturnResult } from "@repo/utils";

/**
 * 项目设备日志列表
 */
export const fetchPageProjectForDeviceLog = (params) => {
  return http.request<ReturnResult<object[]>>("get", "/v2/project/template/device/log/page", {
    params,
  });
};
/**
 * 项目设备列表
 */
export const fetchPageProjectForDevice = (params) => {
  return http.request<ReturnResult<object[]>>("get", "/v2/project/template/device/page", {
    params,
  });
};
/**
 * 同步设备列表
 */
export const fetchSyncProjectForDevice = (params) => {
  return http.request<ReturnResult<object[]>>("put", "/v2/project/template/device/syncTemplate", {
    data: params,
  });
};
/**
 * 获取设备直播地址
 */

export const fetchGetProjectForDevicePreviewUrl = (params) => {
  return http.request<ReturnResult<object[]>>("put", "/v2/project/template/device/previewUrl", {
    data: params,
  });
};
/**
 * 获取设备在线情况
 */
export const fetchTimelineProjectForDevice = (params) => {
  return http.request<ReturnResult<object[]>>("get", "/v2/project/template/device/timeline", {
    params,
  });
};

/**
 * 获取设备在线情况
 */
export const fetchCheckProjectForDevice = (params) => {
  return http.request<ReturnResult<object[]>>("put", "/v2/project/template/device/check", {
    data: params,
  });
};
/**
 * 获取组织
 */
export const fetchListProjectOrgForDevice = (params) => {
  return http.request<ReturnResult<object[]>>("get", "/v2/project/template/device/listOrg", {
    params,
  });
};
/**
 * 同步设备组织列表
 */
export const fetchSyncProjectForDeviceOrg = (params) => {
  return http.request<ReturnResult<object[]>>("put", "/v2/project/template/device/syncOrg", {
    data: params,
  });
};
/**
 * 删除设备模板
 */
export const fetchDeleteProjectForDevice = (params) => {
  return http.request<ReturnResult<object[]>>("put", "/v2/project/template/device/delete", {
    data: params,
  });
};
/**
 * 更新设备模板
 */
export const fetchUpdateProjectForDevice = (params) => {
  return http.request<ReturnResult<object[]>>("put", "/v2/project/template/device/update", {
    data: params,
  });
};
/**
 * 新增设备模板
 */
export const fetchSaveProjectForDevice = (params) => {
  return http.request<ReturnResult<object[]>>("post", "/v2/project/template/device/save", {
    data: params,
  });
};

/**
 * 发送设备
 */
export const fetctSenderProjectForDevice = (params: any) => {
  return http.request<ReturnResult<boolean>>("put", "/v2/project/template/device", {
    data: params,
  });
};
