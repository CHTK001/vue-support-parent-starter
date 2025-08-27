import { http, type ReturnResult } from "@repo/utils";

/**
 * AI模块列表
 */
export const fetchPageAiModule = (params) => {
  return http.request<ReturnResult<object[]>>("get", "/v2/ai/module/page", {
    params,
  });
};

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

/**
 * LLM对话接口
 */
export const fetchLLMChat = (params) => {
  return http.request<ReturnResult<object>>("post", "/v2/ai/llm/chat", {
    data: params,
  });
};

/**
 * 图像上色接口
 */
export const fetchImageColorization = (params) => {
  return http.request<ReturnResult<object>>("post", "/v2/ai/image/colorization", {
    data: params,
  });
};

/**
 * 图像分辨率增强接口
 */
export const fetchImageResolution = (params) => {
  return http.request<ReturnResult<object>>("post", "/v2/ai/image/resolution", {
    data: params,
  });
};

/**
 * 视频生成接口
 */
export const fetchVideoGeneration = (params) => {
  return http.request<ReturnResult<object>>("post", "/v2/ai/video/generation", {
    data: params,
  });
};