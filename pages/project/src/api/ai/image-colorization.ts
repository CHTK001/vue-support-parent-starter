import { http, type ReturnResult } from "@repo/utils";

/**
 * 图片上色生成任务
 */
export const fetchSaveTaskForColorization = (params) => {
  return http.request<ReturnResult<object[]>>("post", "/v2/ai/image/colorization/task", {
    data: params,
  });
};
/**
 * 图片上色查询任务
 */
export const fetchGetTaskForColorization = (params) => {
  return http.request<ReturnResult<object[]>>("get", "/v2/ai/image/colorization/task", {
    params,
    headers: {
      "x-remote-animation": "false",
    },
  });
};
