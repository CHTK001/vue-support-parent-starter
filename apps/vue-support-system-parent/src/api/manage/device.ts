import { http, type ReturnResult } from "@repo/utils";
/**
 * 项目设备列表
 */
export const fetchPageProjectForDevice = (params) => {
  return http.request<ReturnResult<object[]>>("get", "/v2/project/device/page", {
    params,
  });
};
