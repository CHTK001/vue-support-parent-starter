import { http, type ReturnResult } from "@repo/utils";
/**
 * 门禁事件同步
 */
export const fetchSyncMessageForDevice = (params) => {
  return http.request<ReturnResult<object[]>>("get", "/v2/project/device/message/sync", {
    params,
  });
};
