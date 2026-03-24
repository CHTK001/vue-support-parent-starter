import { http, type ReturnResult } from "@repo/utils";

/**
 * 超分辨率生成任务
 */
export const fetchSaveTaskForResolution = (params) => {
  return http.request<ReturnResult<object[]>>("post", "/v2/ai/image/resolution/task", {
    data: params,
  });
};
/**
 * 超分辨率查询任务
 */
export const fetchGetTaskForResolution = (params) => {
  return http.request<ReturnResult<object[]>>("get", "/v2/ai/image/resolution/task", {
    params,
    headers: {
      "x-remote-animation": "false",
    },
  });
};
