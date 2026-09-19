/**
 * 任务管理模块 API 封装（@pages/task）
 *
 * 对应两个后端模块：
 *   1) 任务派发服务（/v2/taskdistribution）
 *   2) 调度中心服务（/scheduler/api/v1/job-platform）
 *
 * 使用 http() 链式调用，返回 Promise<ApiResult<T>>。
 */
import { http } from "@repo/utils";
import type {
  ApiResult,
  DispatchNode,
  DispatchTask,
  JobEntity,
  JobLogEntity,
  SchedulerTaskUpdateRequest,
  SchedulerTaskVO,
} from "./types";

/* ================== 任务派发 /v2/taskdistribution ================== */

/** 任务列表 */
export function listDispatchTasks() {
  return http()
    .get("/v2/taskdistribution/task/list")
    .then<ApiResult<DispatchTask[]>>((r) => r.data);
}

/** 任务详情 */
export function getDispatchTask(taskId: string) {
  return http()
    .get(`/v2/taskdistribution/task/${taskId}`)
    .then<ApiResult<DispatchTask>>((r) => r.data);
}

/** 取消任务 */
export function cancelDispatchTask(taskId: string) {
  return http()
    .post(`/v2/taskdistribution/task/${taskId}/cancel`)
    .then<ApiResult<boolean>>((r) => r.data);
}

/** 暂停任务 */
export function pauseDispatchTask(taskId: string) {
  return http()
    .post(`/v2/taskdistribution/task/${taskId}/pause`)
    .then<ApiResult<boolean>>((r) => r.data);
}

/** 恢复任务 */
export function resumeDispatchTask(taskId: string) {
  return http()
    .post(`/v2/taskdistribution/task/${taskId}/resume`)
    .then<ApiResult<boolean>>((r) => r.data);
}

/** 删除任务 */
export function deleteDispatchTask(taskId: string) {
  return http()
    .delete(`/v2/taskdistribution/task/${taskId}`)
    .then<ApiResult<boolean>>((r) => r.data);
}

/** 节点列表 */
export function listDispatchNodes() {
  return http()
    .get("/v2/taskdistribution/node/list")
    .then<ApiResult<DispatchNode[]>>((r) => r.data);
}

/** 删除节点 */
export function removeDispatchNode(nodeId: string) {
  return http()
    .delete(`/v2/taskdistribution/node/${nodeId}`)
    .then<ApiResult<boolean>>((r) => r.data);
}

/* ================== 调度中心 /scheduler/api/v1/job-platform ================== */

const JOB = "/scheduler/api/v1/job-platform";

/** 任务分页 */
export function pageForJob(params: {
  pageNum?: number;
  pageSize?: number;
  jobName?: string;
  triggerStatus?: number;
  group?: string;
}) {
  return http()
    .get(`${JOB}/job/page`)
    .query(params as Record<string, unknown>)
    .then<ApiResult<{ records?: JobEntity[]; total?: number; current?: number; size?: number }>>((r) => r.data);
}

/** 任务详情 */
export function getJob(jobId: number) {
  return http()
    .get(`${JOB}/job/${jobId}`)
    .then<ApiResult<JobEntity>>((r) => r.data);
}

/** 新增任务 */
export function createJob(data: JobEntity) {
  return http()
    .post(`${JOB}/job`)
    .data(data as Record<string, unknown>)
    .then<ApiResult<JobEntity>>((r) => r.data);
}

/** 更新任务 */
export function updateJob(jobId: number, data: JobEntity) {
  return http()
    .put(`${JOB}/job/${jobId}`)
    .data(data as Record<string, unknown>)
    .then<ApiResult<JobEntity>>((r) => r.data);
}

/** 删除任务 */
export function deleteJob(jobId: number) {
  return http()
    .delete(`${JOB}/job/${jobId}`)
    .then<ApiResult<JobEntity>>((r) => r.data);
}

/** 恢复任务 */
export function restoreJob(jobId: number) {
  return http()
    .post(`${JOB}/job/${jobId}/restore`)
    .then<ApiResult<JobEntity>>((r) => r.data);
}

/** 启动任务 */
export function startJob(jobId: number) {
  return http()
    .post(`${JOB}/job/${jobId}/start`)
    .then<ApiResult<JobEntity>>((r) => r.data);
}

/** 停止任务 */
export function stopJob(jobId: number) {
  return http()
    .post(`${JOB}/job/${jobId}/stop`)
    .then<ApiResult<JobEntity>>((r) => r.data);
}

/** 手动触发任务 */
export function triggerJob(jobId: number, param?: string) {
  return http()
    .post(`${JOB}/job/${jobId}/trigger`)
    .data(param !== undefined ? { param } : {})
    .then<ApiResult<JobEntity>>((r) => r.data);
}

/** 任务日志分页 */
export function pageForJobLog(params: {
  pageNum?: number;
  pageSize?: number;
  beanName?: string;
  executeCode?: string;
  group?: string;
}) {
  return http()
    .get(`${JOB}/job-log/page`)
    .query(params as Record<string, unknown>)
    .then<ApiResult<{ records?: JobLogEntity[]; total?: number; current?: number; size?: number }>>((r) => r.data);
}

/** 任务列表（运行态） */
export function listSchedulerTasks(params?: { includeDeleted?: boolean; group?: string }) {
  return http()
    .get(`${JOB}/task/list`)
    .query((params ?? {}) as Record<string, unknown>)
    .then<ApiResult<SchedulerTaskVO[]>>((r) => r.data);
}

/** 更新任务（运行态） */
export function updateSchedulerTask(taskKey: string, data: SchedulerTaskUpdateRequest) {
  return http()
    .put(`${JOB}/task/${taskKey}`)
    .data(data as Record<string, unknown>)
    .then<ApiResult<SchedulerTaskVO>>((r) => r.data);
}

/** 触发任务（运行态） */
export function triggerSchedulerTask(taskKey: string) {
  return http()
    .post(`${JOB}/task/${taskKey}/trigger`)
    .then<ApiResult<SchedulerTaskVO>>((r) => r.data);
}