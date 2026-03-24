import { http, type ReturnResult } from "@repo/utils";

/**
 * 文生图生成任务
 */
export const fetchSaveTaskForVincent = (params) => {
  if (params.sysAiModuleType == "VINCENT") {
    return http.request<ReturnResult<object[]>>("post", "/v2/ai/image/generations/task", {
      data: params,
    });
  }
  if (params.sysAiModuleType == "VIDEO") {
    return http.request<ReturnResult<object[]>>("post", "/v2/ai/video/generations/task", {
      data: params,
    });
  }
};
/**
 * 文生图查询任务
 */
export const fetchGetTaskForVincent = (params) => {
  if (params.sysAiModuleType == "VINCENT") {
    return http.request<ReturnResult<object[]>>("get", "/v2/ai/image/generations/task", {
      params,
      headers: {
        "x-remote-animation": "false",
      },
    });
  }

  if (params.sysAiModuleType == "VIDEO") {
    return http.request<ReturnResult<object[]>>("get", "/v2/ai/video/generations/task", {
      params,
      headers: {
        "x-remote-animation": "false",
      },
    });
  }
};

/**
 * 文生图查询历史任务
 */
export const fetchHistoryTaskForVincent = (params) => {
  return http.request<ReturnResult<object[]>>("get", "/v2/ai/image/generations/history", {
    params,
  });
};
