import { http, type ReturnResult } from "@repo/utils";

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
 * 我的组件
 */
export const fetchMineSfc = (params: any) => {
  return http.request<ReturnResult<Boolean>>("get", "/v2/sfc/mine", {
    params
  });
};
/**
 *  获取详情
 * @param params id
 * @returns
 */
export const fetchGetSfc = (params: any) => {
  return http.request<ReturnResult<Boolean>>("get", "/v2/sfc/get", {
    params
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

export const fetchUploadSfc = (file, params) => {
  const formData = new FormData();
  formData.append("file", file);
  for (const key in params) {
    if (params[key]) {
      formData.append(key, params[key]);
    }
  }
  return http.request("post", "/v2/sfc/upload", {
    headers: {
      "Content-Type": "multipart/form-data"
    },
    data: formData
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
