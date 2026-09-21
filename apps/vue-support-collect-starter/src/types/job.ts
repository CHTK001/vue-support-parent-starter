/**
 * 调度作业台账类型（对应 job-starter 的 sys_job / sys_job_log）。
 *
 * 合并后这张表是采集与调度共用的唯一调度账本：分组为 collect-flow 的行由采集流程
 * 托管（cron 存在 collect_flow 上，这里只是台账镜像），其余行是外部作业。
 *
 * 主键 sys_job_id 是雪花 ID，数值超过 Number.MAX_SAFE_INTEGER，JSON 反序列化即失精，
 * 因此所有按行操作的接口都用 sysJobNo 定位，id 只作展示。
 */

/** 台账行（JobEntity 序列化结果） */
export interface SysJob {
  sysJobId: number;
  sysJobNo: string;
  sysJobName: string;
  sysJobGroup: string | null;
  /** CRON / FIXED / DELAY / NONE */
  sysJobScheduleType: string;
  /** cron 表达式或毫秒间隔，NONE 时为空 */
  sysJobScheduleTime: string | null;
  /** 1 启用 0 停用 */
  sysJobTriggerStatus: number;
  sysJobDesc: string | null;
  /** BEAN / GLUE 等 */
  sysJobGlueType: string;
  /** LOCAL / REMOTE */
  sysJobDispatchMode: string | null;
  sysJobStorageMode: string | null;
  sysJobFailRetry: number | null;
  sysJobRetryInterval: number | null;
  /** 执行超时秒，0 表示不限 */
  sysJobExecuteTimeout: number | null;
  /** 执行器：@Job 处理器名，采集流程固定 collect-flow-<流程ID> */
  sysJobExecuteBean: string | null;
  sysJobExecuteParam: string | null;
  /** 错过触发策略：DO_NOTHING / FIRE_ONCE_NOW 等 */
  sysJobExecuteMisfireStrategy: string | null;
  /** 最近一次触发时刻（毫秒时间戳，0 表示没有） */
  sysJobTriggerLastTime: number;
  /** 下次触发时刻（毫秒时间戳，停用时后端可能残留旧值，展示须先看 triggerStatus） */
  sysJobTriggerNextTime: number;
  sysJobIsDeleted: number;
  sysJobVersion: number;
  sysJobGlueUpdatetime: number | null;
  createTime: string | null;
  updateTime: string | null;
}

/** 新建/编辑外部作业提交的字段子集 */
export interface SysJobSave {
  sysJobName: string;
  sysJobGroup?: string;
  sysJobScheduleType: string;
  sysJobScheduleTime?: string;
  sysJobExecuteBean: string;
  sysJobExecuteParam?: string;
  sysJobDesc?: string;
  sysJobFailRetry?: number;
  sysJobExecuteTimeout?: number;
  sysJobExecuteMisfireStrategy?: string;
  /** 1 立即启用调度，0 只登记不调度 */
  sysJobTriggerStatus?: number;
}

/** 作业执行日志行（JobLogEntity 序列化结果） */
export interface SysJobLog {
  sysJobLogId: number;
  sysJobLogNo: string;
  sysJobId: number;
  sysJobNo: string | null;
  sysJobLogApp: string | null;
  /** 处理器 Bean 名（派发事件的 jobName）；台账名称不落日志行，要靠下面的 sysJobNo 回查台账 */
  sysJobLogTriggerBean: string | null;
  /** CRON / API / MANUAL 等触发方式 */
  sysJobLogTriggerType: string | null;
  sysJobLogProfile: string | null;
  sysJobLogTriggerTime: string | null;
  sysJobLogTriggerDate: string | null;
  /** 派发结果码，如 SUCCESS / 200 */
  sysJobLogTriggerCode: string | null;
  /** 执行结果码，如 SUCCESS / FAIL */
  sysJobLogExecuteCode: string | null;
  sysJobLogCost: number | null;
  sysJobLogTriggerMsg: string | null;
  sysJobLogTriggerParam: string | null;
  sysJobLogTriggerAddress: string | null;
  sysJobLogNodeId: string | null;
  sysJobLogFilePath: string | null;
  sysJobLogIsDeleted: number | null;
  createTime: string | null;
  updateTime: string | null;
}

/** 控制台分页信封（ReturnResult.data） */
export interface JobPage<T> {
  records: T[];
  total: number;
  current: number;
  size: number;
  pages: number;
}

/** 作业分页查询条件 */
export interface SysJobQuery {
  pageNum: number;
  pageSize: number;
  sysJobName?: string;
  /** 1 启用 0 停用，空为全部 */
  sysJobTriggerStatus?: number;
}

/** 作业日志分页查询条件 */
export interface SysJobLogQuery {
  pageNum: number;
  pageSize: number;
  /** 关键字：处理器 Bean 名 / 任务编号 / 台账任务名称 */
  beanName?: string;
  executeCode?: string;
}

/** 采集流程在台账里的固定分组，与后端 CollectFlowJobHandler.JOB_GROUP 一致 */
export const COLLECT_FLOW_GROUP = "collect-flow";
