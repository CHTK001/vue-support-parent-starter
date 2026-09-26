/**
 * 任务派发模块 API 封装（@pages/task）
 *
 * 对应后端任务派发服务（/v2/taskdistribution）。
 * 调度中心与调度控制台的 API 已迁至 @pages/job（jobApi.ts）。
 *
 * 使用 http() 链式调用，返回 Promise<ApiResult<T>>。
 */
import { http } from "@repo/utils";
import type { ApiResult, DispatchNode, DispatchTask } from "./types";

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
