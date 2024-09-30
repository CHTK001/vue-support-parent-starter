import { http, type ReturnResult } from "@/utils/http";

/**
 * 安装文件
 */
export const fetchGenDatabaseInstall = (params: any) => {
  const form = new FormData();
  form.append("file", params.file);
  form.append("type", params.type);
  form.append("genId", params.genId);

  return http.request<ReturnResult<any>>("post", "v1/gen/db/install", { data: form, headers: { "Content-Type": "multipart/form-data" } });
};
/**
 * 卸载文件
 */
export const fetchGenDatabasUninstall = (params: any) => {
  return http.request<ReturnResult<any>>("post", "v1/gen/db/uninstall", { data: params });
};

/**
 * 分页查询
 */
export const fetchGenDatabasePage = (params: any) => {
  return http.request<ReturnResult<any>>("get", "v1/gen/db/list", { params });
};

/**
 * 保存
 */
export const fetchGenDatabaseSave = (params: any) => {
  return http.request<ReturnResult<any>>("post", "v1/gen/db/save", { data: params });
};

/**
 * 删除
 */
export const fetchGenDatabaseDelete = (params: any) => {
  return http.request<ReturnResult<any>>("delete", "v1/gen/db/delete", { params });
};

/**
 * 修改
 */
export const fetchGenDatabaseUpdate = (params: any) => {
  return http.request<ReturnResult<any>>("put", "v1/gen/db/update", { data: params });
};

/**
 * 预览
 */
export const fetchGenDatabasePreviewDoc = (params: any) => {
  return http.request<ReturnResult<any>>("get", "v1/gen/db/previewDoc", { params, responseType: "blob" });
};

/**
 * 同步文档
 */
export const fetchGenDatabaseSyncDoc = (params: any) => {
  return http.request<ReturnResult<any>>("get", "v1/gen/db/syncDoc", { params });
};
/**
 * 下载文档
 */
export const fetchGenDatabaseDownloadDoc = (params: any) => {
  return http.request<ReturnResult<any>>("get", "v1/gen/db/downloadDoc", { params, responseType: "blob" });
};
