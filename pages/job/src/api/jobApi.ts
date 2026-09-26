/**
 * 调度中心模块 API 封装（@pages/job）
 *
 * 覆盖两个后端入口：
 *   1) 调度平台（/scheduler/api/v1/job-platform）—— 任务 CRUD、启停、触发、日志
 *   2) 调度控制台（/job-console/api）—— 命名空间、执行器
 *
 * 使用 http() 链式调用，返回 Promise<ApiResult<T>>。
 */
import { http } from "@repo/utils";
import type {
  ApiResult,
  JobEntity,
  JobExecutor,
  JobLogEntity,
  JobNamespace,
  JobPageResult,
  SchedulerTaskUpdateRequest,
  SchedulerTaskVO,
} from "./types";

/* ================== 调度平台 ================== */

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
    .then<ApiResult<JobPageResult<JobEntity>>>((r) => r.data);
}

/** 任务详情 */
export function getJob(jobId: number) {
  return http().get(`${JOB}/job/${jobId}`).then<ApiResult<JobEntity>>((r) => r.data);
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
  return http().delete(`${JOB}/job/${jobId}`).then<ApiResult<JobEntity>>((r) => r.data);
}

/** 恢复任务 */
export function restoreJob(jobId: number) {
  return http().post(`${JOB}/job/${jobId}/restore`).then<ApiResult<JobEntity>>((r) => r.data);
}

/** 启动任务 */
export function startJob(jobId: number) {
  return http().post(`${JOB}/job/${jobId}/start`).then<ApiResult<JobEntity>>((r) => r.data);
}

/** 停止任务 */
export function stopJob(jobId: number) {
  return http().post(`${JOB}/job/${jobId}/stop`).then<ApiResult<JobEntity>>((r) => r.data);
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
    .then<ApiResult<JobPageResult<JobLogEntity>>>((r) => r.data);
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
  return http().post(`${JOB}/task/${taskKey}/trigger`).then<ApiResult<SchedulerTaskVO>>((r) => r.data);
}

/* ================== 调度控制台 ================== */

const CONSOLE = "/job-console/api";

/** 命名空间列表 */
export function listNamespaces() {
  return http().get(`${CONSOLE}/namespaces`).then<ApiResult<JobNamespace[]>>((r) => r.data);
}

/** 指定命名空间的执行器列表 */
export function listExecutors(namespace: string) {
  return http()
    .get(`${CONSOLE}/${encodeURIComponent(namespace)}/executors`)
    .then<ApiResult<JobExecutor[]>>((r) => r.data);
}
