import { http, type ReturnResult } from "@/utils/http";

/**
 * 获取任务列表
 */
export const fetchJobPageList = (params: any) => {
  return http.request<ReturnResult<any>>("post", "/jobinfo/pageList", { params });
};

/**
 * 触发任务
 */
export const fetchJobTrigger = (params: any) => {
  return http.request<ReturnResult<any>>("post", "/jobinfo/trigger", { params });
};

/**
 * 停止任务
 */
export const fetchJobStop = (params: any) => {
  return http.request<ReturnResult<any>>("post", "/jobinfo/stop", { params });
};

/**
 * 启动任务
 */
export const fetchJobStart = (params: any) => {
  return http.request<ReturnResult<any>>("post", "/jobinfo/start", { params });
};

/**
 * 删除任务
 */
export const fetchJobDelete = (params: any) => {
  return http.request<ReturnResult<any>>("post", "/jobinfo/delete", { params });
};

/**
 * 新增任务
 */
export const fetchJobAdd = (params: any) => {
  return http.request<ReturnResult<any>>("post", "/jobinfo/add", { params });
};

/**
 * 修改任务
 */
export const fetchJobUpdate = (params: any) => {
  return http.request<ReturnResult<any>>("post", "/jobinfo/update", { params });
};

/**
 * 获取任务下次触发时间
 */
export const fetchJobNextTriggerTime = (params: any) => {
  return http.request<ReturnResult<any>>("post", "/jobinfo/nextTriggerTime", { params });
};

/**
 * 获取任务日志统计
 */
export const fetchJobLogChart = (params: any) => {
  return http.request<ReturnResult<any>>("post", "/joblog/chartInfo", { params });
};

/**
 * 清理日志
 */
export const fetchJobLogClear = (params: any) => {
  return http.request<ReturnResult<any>>("post", "/joblog/clearLog", { params });
};
