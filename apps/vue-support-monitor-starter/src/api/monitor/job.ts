import { http, type ReturnResult } from "@repo/utils";

/**
 * 获取任务列表
 */
export const fetchJobPageList = (params: any) => {
  return http.request<ReturnResult<any>>("get", "/v1/job/page", {
    params,
    headers: {
      "x-remote-animation": "false"
    }
  });
};

/**
 * 触发任务
 */
export const fetchJobTrigger = (params: any) => {
  return http.request<ReturnResult<any>>("get", "/v1/job/trigger", { params });
};

/**
 * 停止任务
 */
export const fetchJobStop = (params: any) => {
  return http.request<ReturnResult<any>>("post", "/v1/job/stop", { params });
};

/**
 * 启动任务
 */
export const fetchJobStart = (params: any) => {
  return http.request<ReturnResult<any>>("post", "/v1/job/start", { params });
};

/**
 * 删除任务
 */
export const fetchJobDelete = (params: any) => {
  return http.request<ReturnResult<any>>("delete", "/v1/job/delete", { params });
};

/**
 * 新增任务
 */
export const fetchJobSave = (params: any) => {
  return http.request<ReturnResult<any>>("post", "/v1/job/save", { data: params });
};

/**
 * 修改任务
 */
export const fetchJobUpdate = (params: any) => {
  return http.request<ReturnResult<any>>("put", "/v1/job/update", { data: params });
};

/**
 * 获取任务下次触发时间
 */
export const fetchJobNextTriggerTime = (params: any) => {
  return http.request<ReturnResult<any>>("get", "/v1/job/nextTriggerTime", { params });
};

/**
 * 获取任务日志列表
 */
export const fetchJobLogPage = (params: any) => {
  return http.request<ReturnResult<any>>("get", "/v1/job/log", { params });
};
/**
 * 获取任务日志统计
 */
export const fetchJobLogChart = (params: any) => {
  return http.request<ReturnResult<any>>("get", "/v1/job/time", { params });
};

/**
 * 清理日志
 */
export const fetchJobLogClear = (params: any) => {
  return http.request<ReturnResult<any>>("get", "/v1/job/clear", { params });
};

/**
 * 查看日志
 */
export const fetchJobLogCat = (params: any) => {
  return http.request<ReturnResult<any>>("get", "/v1/job/logCat", { params });
};
