import { http, type ReturnResult } from "@repo/utils";
/**
 * 更新管道信息
 */
export const fetchUpdateChannelForDevice = (params) => {
  return http.request<ReturnResult<object[]>>("put", "/v2/project/device/channel/update", {
    data: params,
  });
};
