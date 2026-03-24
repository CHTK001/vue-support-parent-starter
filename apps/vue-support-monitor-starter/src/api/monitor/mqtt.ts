import { http, type ReturnResult } from "@repo/utils";

/**
 * 获取mqtt列表
 */
export const fetchPageForMqtt = (params: any) => {
  return http.request<ReturnResult<any>>("get", "/v1/mqtt/server/page", {
    params,
    headers: {
      "x-remote-animation": "false"
    }
  });
};
/**
 * 新增mqtt配置
 */
export const fetchSaveForMqtt = (params: any) => {
  return http.request<ReturnResult<any>>("post", "/v1/mqtt/server/save", {
    data: params
  });
};
/**
 * 修改mqtt配置
 */
export const fetchUpdateForMqtt = (params: any) => {
  return http.request<ReturnResult<any>>("put", "/v1/mqtt/server/update", {
    data: params
  });
};
/**
 * 删除mqtt配置
 */
export const fetchDeleteForMqtt = (params: any) => {
  return http.request<ReturnResult<any>>("delete", "/v1/mqtt/server/delete", {
    params
  });
};
/**
 * 启动mqtt
 */
export const fetchStartForMqtt = (params: any) => {
  return http.request<ReturnResult<any>>("get", "/v1/mqtt/server/start", {
    params
  });
};
/**
 * 停止mqtt
 */
export const fetchStopForMqtt = (params: any) => {
  return http.request<ReturnResult<any>>("get", "/v1/mqtt/server/stop", {
    params
  });
};
