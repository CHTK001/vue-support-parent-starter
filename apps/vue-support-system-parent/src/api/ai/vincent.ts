import { http, type ReturnResult } from "@repo/utils";

/**
 * 文生图生成任务
 */
export const fetchSaveTaskForVincent = (params) => {
  return http.request<ReturnResult<object[]>>("post", "/v2/ai/vincent/task", {
    data: params,
  });
};
/**
 * 文生图查询任务
 */
export const fetchGetTaskForVincent = (params) => {
  return http.request<ReturnResult<object[]>>("get", "/v2/ai/vincent/task", {
    params,
  });
};

/**
 * 文生图查询历史任务
 */
export const fetchHistoryTaskForVincent = (params) => {
  return http.request<ReturnResult<object[]>>("get", "/v2/ai/vincent/history", {
    params,
  });
};
