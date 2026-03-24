/**
 * Job 任务调度 API
 */
import { http, type ReturnResult } from "@repo/utils";

/** 任务信息 */
export interface JobInfo {
  /** 任务ID */
  jobId?: number;
  /** 任务名称 */
  jobName: string;
  /** 任务描述 */
  jobDesc?: string;
  /** 任务组ID */
  jobGroup?: number;
  /** 任务负责人 */
  jobAuthor?: string;
  /** 告警邮件 */
  jobAlarmEmail?: string;
  /** 调度类型 */
  jobScheduleType?: string;
  /** Cron表达式 */
  jobScheduleConf?: string;
  /** 执行器 */
  jobExecutorHandler?: string;
  /** 执行参数 */
  jobExecutorParam?: string;
  /** 路由策略 */
  jobExecutorRouteStrategy?: string;
  /** 阻塞处理策略 */
  jobExecutorBlockStrategy?: string;
  /** 任务超时时间 */
  jobExecutorTimeout?: number;
  /** 失败重试次数 */
  jobExecutorFailRetryCount?: number;
  /** 触发状态 0-停止 1-运行 */
  jobTriggerStatus?: number;
  /** 上次触发时间 */
  jobTriggerLastTime?: number;
  /** 下次触发时间 */
  jobTriggerNextTime?: number;
  /** 应用环境 */
  jobApplicationActive?: string;
  /** 子任务ID */
  jobChildJobId?: string;
  /** 创建时间 */
  createTime?: string;
  /** 更新时间 */
  updateTime?: string;
}

/** 任务日志信息 */
export interface JobLogInfo {
  /** 日志ID */
  logId?: number;
  /** 任务ID */
  jobId?: number;
  /** 任务组ID */
  jobGroup?: number;
  /** 执行器地址 */
  executorAddress?: string;
  /** 执行器处理器 */
  executorHandler?: string;
  /** 执行参数 */
  executorParam?: string;
  /** 调度时间 */
  triggerTime?: string;
  /** 调度结果 */
  triggerCode?: number;
  /** 调度日志 */
  triggerMsg?: string;
  /** 执行时间 */
  handleTime?: string;
  /** 执行结果 */
  handleCode?: number;
  /** 执行日志 */
  handleMsg?: string;
  /** 告警状态 */
  alarmStatus?: number;
}

/** 任务分页查询参数 */
export interface JobPageParams {
  /** 当前页 */
  page?: number;
  /** 每页条数 */
  pageSize?: number;
  /** 任务名称/描述 */
  jobDesc?: string;
  /** 任务组 */
  jobGroup?: number;
  /** 触发状态 */
  jobTriggerStatus?: number;
  /** 负责人 */
  jobAuthor?: string;
}

/** 任务日志分页查询参数 */
export interface JobLogPageParams {
  /** 当前页 */
  page?: number;
  /** 每页条数 */
  pageSize?: number;
  /** 任务ID */
  jobId?: number;
  /** 任务组ID */
  jobGroup?: number;
  /** 执行状态 */
  logStatus?: number;
  /** 开始时间 */
  triggerTimeStart?: string;
  /** 结束时间 */
  triggerTimeEnd?: string;
}

/**
 * 获取任务列表
 */
export const fetchJobPageList = (params: JobPageParams) => {
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
export const fetchJobTrigger = (params: { jobId: number; executorParam?: string }) => {
  return http.request<ReturnResult<any>>("get", "/v1/job/trigger", { params });
};

/**
 * 停止任务
 */
export const fetchJobStop = (params: { jobId: number }) => {
  return http.request<ReturnResult<any>>("post", "/v1/job/stop", { params });
};

/**
 * 启动任务
 */
export const fetchJobStart = (params: { jobId: number }) => {
  return http.request<ReturnResult<any>>("post", "/v1/job/start", { params });
};

/**
 * 删除任务
 */
export const fetchJobDelete = (params: { jobId: number }) => {
  return http.request<ReturnResult<any>>("delete", "/v1/job/delete", { params });
};

/**
 * 新增任务
 */
export const fetchJobSave = (data: JobInfo) => {
  return http.request<ReturnResult<any>>("post", "/v1/job/save", { data });
};

/**
 * 修改任务
 */
export const fetchJobUpdate = (data: JobInfo) => {
  return http.request<ReturnResult<any>>("put", "/v1/job/update", { data });
};

/**
 * 获取任务下次触发时间
 */
export const fetchJobNextTriggerTime = (params: { scheduleType: string; scheduleConf: string }) => {
  return http.request<ReturnResult<string[]>>("get", "/v1/job/nextTriggerTime", { params });
};

/**
 * 获取任务日志列表
 */
export const fetchJobLogPage = (params: JobLogPageParams) => {
  return http.request<ReturnResult<any>>("get", "/v1/job/log", { params });
};

/**
 * 获取任务日志统计
 */
export const fetchJobLogChart = (params: { startDate?: string; endDate?: string }) => {
  return http.request<ReturnResult<any>>("get", "/v1/job/time", { params });
};

/**
 * 清理日志
 */
export const fetchJobLogClear = (params: { jobId?: number; jobGroup?: number; clearBeforeNum?: number }) => {
  return http.request<ReturnResult<any>>("get", "/v1/job/clear", { params });
};

/**
 * 查看日志详情
 */
export const fetchJobLogCat = (params: { logId: number; fromLineNum?: number }) => {
  return http.request<ReturnResult<any>>("get", "/v1/job/logCat", { params });
};
