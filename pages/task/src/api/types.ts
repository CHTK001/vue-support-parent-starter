/**
 * 任务管理模块类型定义（@pages/task）
 *
 * 覆盖两个后端模块：
 *   1) 任务派发 spring-support-taskdistribution-starter（/v2/taskdistribution）
 *   2) 调度中心 spring-support-scheduler-starter（/scheduler/api/v1/job-platform）
 */

/** 统一返回结构（后端 ReturnResult） */
 * @author CH
 * @since 4.0.0
/** 统一返回结构（后端 ReturnResult） */
export interface ApiResult<T = unknown> {
  code?: string | number;
  msg?: string;
  data?: T;
}

/** 公共审计字段 */
 * @author CH
 * @since 4.0.0
/** 公共审计字段 */
export interface Auditable {
  createName?: string;
  createBy?: number;
  createTime?: string;
  updateName?: string;
  updateBy?: number;
  updateTime?: string;
}

/* ================== 任务派发 ================== */

/** 派发任务 */
 * @author CH
 * @since 4.0.0
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
 * @author CH
 * @since 4.0.0
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

/* ================== 调度中心 ================== */

/** 调度类型常量 */
 * @author CH
 * @since 4.0.0
/** 调度类型常量 */
export const ScheduleType = {
  CRON: "CRON",
  FIXED: "FIXED",
  FIXED_MS: "FIXED_MS",
  DELAY: "DELAY",
  AT: "AT",
  NONE: "NONE",
} as const;

/** 触发状态常量 */
 * @author CH
 * @since 4.0.0
/** 触发状态常量 */
export const TriggerStatus = {
  /** 停止 */
  STOPPED: 0,
  /** 运行 */
  RUNNING: 1,
} as const;

/** 任务实体 */
 * @author CH
 * @since 4.0.0
/** 任务实体 */
export interface JobEntity extends Auditable {
  sysJobId?: number;
  /** 任务编号 */
  sysJobNo?: string;
  /** 任务名称 */
  sysJobName?: string;
  /** 作者 */
  sysJobAuthor?: string;
  /** 告警邮箱 */
  sysJobAlarmEmail?: string;
  /** 任务分组/命名空间 */
  sysJobGroup?: string;
  /** 调度类型: CRON/FIXED/FIXED_MS/DELAY/AT/NONE */
  sysJobScheduleType?: string;
  /** 调度时间（cron 表达式或间隔） */
  sysJobScheduleTime?: string;
  /** 触发状态: 0停止 1运行 */
  sysJobTriggerStatus?: number;
  /** 描述 */
  sysJobDesc?: string;
  /** GLUE 更新时间 */
  sysJobGlueUpdatetime?: string;
  /** GLUE 源码 */
  sysJobGlueSource?: string;
  /** GLUE 类型: BEAN/GLUE */
  sysJobGlueType?: string;
  /** 分发模式: LOCAL/REMOTE */
  sysJobDispatchMode?: string;
  /** 远程执行器地址 */
  sysJobRemoteExecutorAddress?: string;
  /** 存储模式: DATABASE/FILE */
  sysJobStorageMode?: string;
  /** 失败重试次数 */
  sysJobFailRetry?: number;
  /** 重试间隔 */
  sysJobRetryInterval?: number;
  /** 执行超时(秒) */
  sysJobExecuteTimeout?: number;
  /** 执行 Bean */
  sysJobExecuteBean?: string;
  /** 执行参数 */
  sysJobExecuteParam?: string;
  /** 异常回调 Bean */
  sysJobExceptionCallbackBean?: string;
  /** 重试回调 Bean */
  sysJobRetryCallbackBean?: string;
  /** 执行过期策略 */
  sysJobExecuteMisfireStrategy?: string;
  /** 上次触发时间 */
  sysJobTriggerLastTime?: number;
  /** 下次触发时间 */
  sysJobTriggerNextTime?: number;
  /** 是否删除 */
  sysJobIsDeleted?: number;
  /** 乐观锁版本 */
  sysJobVersion?: number;
}

/** 任务日志 */
 * @author CH
 * @since 4.0.0
/** 任务日志 */
export interface JobLogEntity extends Auditable {
  sysJobLogId?: number;
  sysJobLogNo?: string;
  sysJobId?: number;
  sysJobNo?: string;
  /** 应用名 */
  sysJobLogApp?: string;
  /** 触发 Bean */
  sysJobLogTriggerBean?: string;
  /** 触发类型 */
  sysJobLogTriggerType?: string;
  /** 执行环境 */
  sysJobLogProfile?: string;
  /** 触发时间 */
  sysJobLogTriggerTime?: string;
  /** 触发日期 */
  sysJobLogTriggerDate?: string;
  /** 触发结果码 */
  sysJobLogTriggerCode?: string;
  /** 执行结果码 */
  sysJobLogExecuteCode?: string;
  /** 耗时 */
  sysJobLogCost?: number;
  /** 触发消息 */
  sysJobLogTriggerMsg?: string;
  /** 触发参数 */
  sysJobLogTriggerParam?: string;
  /** 触发地址 */
  sysJobLogTriggerAddress?: string;
  /** 节点ID */
  sysJobLogNodeId?: string;
  /** 日志文件路径 */
  sysJobLogFilePath?: string;
  /** 是否删除 */
  sysJobLogIsDeleted?: number;
}

/** 调度任务视图（task/list 返回） */
 * @author CH
 * @since 4.0.0
/** 调度任务视图（task/list 返回） */
export interface SchedulerTaskVO {
  jobId?: number;
  jobNo?: string;
  taskKey?: string;
  taskName?: string;
  scheduleType?: string;
  cronExpression?: string;
  enabled?: boolean;
  description?: string;
  scheduled?: boolean;
  dispatchMode?: string;
  remoteExecutorAddress?: string;
  storageMode?: string;
  nextExecutionTime?: string;
  lastStartedAt?: string;
  lastFinishedAt?: string;
  lastRunStatus?: string;
  lastRunMessage?: string;
  deleted?: boolean;
}

/** 任务更新请求 */
 * @author CH
 * @since 4.0.0
/** 任务更新请求 */
export interface SchedulerTaskUpdateRequest {
  cronExpression?: string;
  enabled?: boolean;
}