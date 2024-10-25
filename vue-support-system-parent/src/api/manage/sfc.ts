import { http, type ReturnResult } from "@/utils/http";

/**
 * 分页查询
 */
export const fetchPageSfc = (params: any) => {
  return http.request<ReturnResult<Boolean>>("get", "/v2/sfc/page", {
    params
  });
};

/**
 * 保存
 */
export const fetchSaveSfc = (params: any) => {
  return http.request<ReturnResult<Boolean>>("post", "/v2/sfc/save", {
    data: params
  });
};

/**
 * 更新
 */
export const fetchUpdateSfc = (params: any) => {
  return http.request<ReturnResult<Boolean>>("put", "/v2/sfc/update", {
    data: params,
    headers: {
      "x-remote-animation": false
    }
  });
};

/**
 * 删除
 */
export const fetchDeleteSfc = (params: any) => {
  return http.request<ReturnResult<Boolean>>("delete", "/v2/sfc/delete", {
    params
  });
};

/**
 * 安装
 */
export const fetchInstallSfc = (params: any) => {
  return http.request<ReturnResult<Boolean>>("put", "/v2/sfc/install", {
    data: params
  });
};
/**
 * 卸载
 */
export const fetchUninstallSfc = (params: any) => {
  return http.request<ReturnResult<Boolean>>("put", "/v2/sfc/uninstall", {
    data: params
  });
};
