import { http, type ReturnResult } from "@/utils/http";

/**
 * 分页查询oss文件列表
 */
export const fetchOssPage = (params: any) => {
  return http.request<ReturnResult<any>>("get", "v1/file/storage/page", { params });
};

/**
 * 删除oss文件
 */
export const fetchOssDelete = (params: any) => {
  return http.request<ReturnResult<any>>("delete", "v1/file/storage/delete", {
    params
  });
};

/**
 * 保存oss文件
 */
export const fetchOssSave = (params: any) => {
  return http.request<ReturnResult<any>>("post", "v1/file/storage/save", {
    data: params
  });
};
/**
 * 修改oss文件
 */
export const fetchOssUpdate = (params: any) => {
  return http.request<ReturnResult<any>>("put", "v1/file/storage/update", {
    data: params
  });
};
/*********************************************************************************viewer*****************************************************************************************/
export const fetchOssViewer = (params: any) => {
  return http.request<ReturnResult<any>>("get", "v1/file/storage/viewer", { params });
};
/*********************************************************************************PROTOCOL*****************************************************************************************/
/**
 * 分页查询oss文件列表
 */
export const fetchOssProtocolPage = (params: any) => {
  return http.request<ReturnResult<any>>("get", "v1/file/storage/protocol/page", { params });
};

/**
 * 启动oss文件
 */
export const fetchOssProtocolStart = (params: any) => {
  return http.request<ReturnResult<any>>("get", "v1/file/storage/protocol/start", { params });
};

/**
 * 停止oss文件
 */
export const fetchOssProtocolStop = (params: any) => {
  return http.request<ReturnResult<any>>("get", "v1/file/storage/protocol/stop", { params });
};

/**
 * 删除oss文件
 */
export const fetchOssProtocolDelete = (params: any) => {
  return http.request<ReturnResult<any>>("delete", "v1/file/storage/protocol/delete", {
    params
  });
};

/**
 * 保存oss文件
 */
export const fetchOssProtocolSave = (params: any) => {
  return http.request<ReturnResult<any>>("post", "v1/file/storage/protocol/save", {
    data: params
  });
};
/**
 * 修改oss文件
 */
export const fetchOssProtocolUpdate = (params: any) => {
  return http.request<ReturnResult<any>>("put", "v1/file/storage/protocol/update", {
    data: params
  });
};
