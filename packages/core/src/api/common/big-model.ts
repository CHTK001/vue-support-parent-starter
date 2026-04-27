import { http, type ReturnResult } from "@repo/utils";
import { encodeSearchParams } from "@repo/utils";
import { getConfig } from "@repo/config";
export type BigModel = {
  to: string;
  content: string;
};

/**
 * 获取模型列表
 */
export const fetchListModel = () => {
  return http.request<ReturnResult<string[]>>(
    "get",
    "/v2/ai/chat/models",
    {},
  );
};
/**
 * 获取模型列表
 */
export const fetchCall = (params) => {
  return http.request<ReturnResult<{ text: string; model: string; sessionId?: number }>>(
    "post",
    "/v2/ai/chat/call",
    {
      data: params,
    },
  );
};
/**
 * 获取模型列表
 */
export const fetchCallStream = (params) => {
  const query = encodeSearchParams(params || {});
  return (
    getConfig().BaseUrl +
    "/v2/ai/chat/stream" +
    (query ? "?" + query : "")
  );
};

/**
 * 输入优化
 */
export const fetchOptimize = (params) => {
  return http.request<ReturnResult<{ text: string; model: string }>>(
    "post",
    "/v2/ai/chat/optimize",
    {
      data: params,
    },
  );
};

/**
 * 轮询任务详情
 */
export const fetchTaskDetail = (taskId) => {
  return http.request("get", `/v2/ai/task/${taskId}`);
};

/**
 * 查询任务历史
 */
export const fetchTaskHistory = (taskType) => {
  return http.request("get", "/v2/ai/task/history", {
    params: { taskType },
  });
};

/**
 * 创建任务
 */
export const fetchCreateTask = (taskType, params) => {
  const pathMap = {
    IMAGE: "/v2/ai/image/task",
    VIDEO: "/v2/ai/video/task",
    COLORIZATION: "/v2/ai/colorization/task",
    RESOLUTION: "/v2/ai/resolution/task",
  };
  return http.request("post", pathMap[taskType], {
    data: params,
  });
};
