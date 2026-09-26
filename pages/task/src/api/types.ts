/**
 * 任务派发模块类型定义（@pages/task）
 *
 * 只覆盖任务派发服务（/v2/taskdistribution）。
 * 调度中心与调度控制台的类型已迁至 @pages/job。
 */

/** 统一返回结构（后端 ReturnResult） */
export interface ApiResult<T = unknown> {
  code?: string | number;
  msg?: string;
  data?: T;
}

/* ================== 任务派发 ================== */

/** 派发任务 */
export interface DispatchTask {
  taskId?: string;
  /** 任务类型 */
  taskType?: string;
  /** 任务状态 */
  taskStatus?: string;
  /** 任务内容（JSON 字符串） */
  taskJson?: string;
  /** 任务结果（JSON 字符串） */
  resultJson?: string;
  /** 重试次数 */
  retryCount?: number;
  /** 创建时间 */
  createdAt?: string;
  /** 完成时间 */
  completedAt?: string;
  [key: string]: unknown;
}

/** 派发节点 */
export interface DispatchNode {
  nodeId?: string;
  /** 节点标签 */
  tags?: string[];
  /** 节点权重 */
  weight?: number;
  /** 主机 */
  host?: string;
  /** 端口 */
  port?: number;
  /** 是否在线 */
  online?: boolean;
  /** 最后心跳时间 */
  lastHeartbeat?: string;
  /** 归属中间件ID */
  homeMiddlewareId?: string;
  [key: string]: unknown;
}
