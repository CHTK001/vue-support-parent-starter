/**
 * 调度中心的前端类型，对应 job-starter 治理接口的出参 VO。
 *
 * 接口面是「任务运行态」（JobRuntimeVO）而不是 sys_job 台账行：哨兵值已由后端归一为 null
 * （lastFireTime=0 → null 表示从未派发，nextFireTime=-1 → null 表示不参与自动调度），
 * 前端不再判断 -1/0。所有写操作按 jobKey（执行器名 / 采集流程的 collect-flow-&lt;流程ID&gt;）定位，
 * jobNo 只作展示——雪花 ID 在 JS 里会失精，后端已统一按字符串出参。
 */

/** 任务运行态（JobRuntimeVO） */
export interface JobRuntime {
  /** 业务编号 */
  jobNo: string;
  /** 任务键：派发标识，与处理器名一致，所有操作的定位键 */
  jobKey: string;
  jobName: string | null;
  desc: string | null;
  /** 分组，collect-flow 表示这一行由采集流程托管 */
  group: string | null;
  /** CRON / FIXED / DELAY / NONE */
  scheduleType: string;
  /** cron 表达式或毫秒间隔，NONE 时为空 */
  scheduleTime: string | null;
  /** 是否启用自动调度 */
  enabled: boolean;
  executeParam: string | null;
  /** 最近一次派发时刻（毫秒），空表示无记录 */
  lastFireTime: number | null;
  /** 下一次触发时刻（毫秒），空表示不参与自动调度 */
  nextFireTime: number | null;
  /** 本节点是否登记了同名处理器 */
  handlerRegistered: boolean;
  /** LOCAL / REMOTE */
  dispatchMode: string | null;
  /** 远程执行器地址，仅 REMOTE 有意义 */
  remoteExecutorAddress: string | null;
  author: string | null;
  failRetry: number | null;
  /** 重试间隔秒，0 为立即重试 */
  retryInterval?: number | null;
  /** 执行超时秒，0 为不限 */
  executeTimeout: number | null;
  /** DO_NOTHING / FIRE_ONCE_NOW */
  misfireStrategy: string | null;
  /** 执行类型：BEAN=本机处理器；GLUE_GROOVY=脚本片段；GLUE_JAVA=Java 类片段（存量裸值 groovy 仍等价于脚本） */
  glueType?: string | null;
  /** 片段正文，仅代码片段任务（脚本 / Java 片段）有值 */
  glueSource?: string | null;
  /** 片段版本时刻（毫秒），正文变更后递增，执行器据此失效缓存 */
  glueUpdatetimeMs?: number | null;
  /** 重试前回调处理器名，每次重试前调用 */
  retryCallbackBean?: string | null;
  /** 异常回调处理器名，最终失败时调用 */
  exceptionCallbackBean?: string | null;
  /** 失败告警目标：邮箱（逗号分隔）或 webhook 地址 */
  alarmEmail?: string | null;
  /** 失败告警类型：EMAIL / WEBHOOK，空按 EMAIL */
  alarmType?: string | null;
}

/** 登记/更新任务入参（JobSpecDTO） */
export interface JobSave {
  jobKey: string;
  jobName?: string;
  desc?: string;
  group?: string;
  scheduleType: string;
  scheduleTime?: string;
  enabled?: boolean;
  executeParam?: string;
  dispatchMode?: string;
  remoteExecutorAddress?: string;
  author?: string;
  failRetry?: number;
  /** 重试间隔秒，0/空为立即重试 */
  retryInterval?: number;
  executeTimeout?: number;
  misfireStrategy?: string;
  /** 执行类型：BEAN（默认，本机处理器）/ GLUE_GROOVY（脚本）/ GLUE_JAVA（Java 类片段） */
  glueType?: string;
  /** 片段正文，执行类型非 BEAN 时必填；Java 片段要求完整类源码 */
  glueSource?: string;
  /** 重试前回调处理器名 */
  retryCallbackBean?: string;
  /** 异常回调处理器名 */
  exceptionCallbackBean?: string;
  /** 失败告警目标：邮箱（逗号分隔）或 webhook 地址 */
  alarmEmail?: string;
  /** 失败告警类型：EMAIL / WEBHOOK，空按 EMAIL */
  alarmType?: string;
  /** 编辑前的任务键：与 jobKey 不同时按重命名处理（编辑全字段放开） */
  originJobKey?: string;
}

/** 执行日志行（JobLogVO） */
export interface JobLog {
  logId: string;
  jobId: string | null;
  jobNo: string | null;
  /** 触发键；台账任务名要靠它回查，日志行本身不存名称 */
  jobKey: string | null;
  app: string | null;
  /** CRON / API / MANUAL 等 */
  triggerType: string | null;
  triggerCode: string | null;
  /** SUCCESS / FAILURE / SKIPPED 等 */
  executeCode: string | null;
  costMs: number | null;
  message: string | null;
  executeParam: string | null;
  address: string | null;
  nodeId: string | null;
  filePath: string | null;
  /** 触发时刻（毫秒） */
  triggerTime: number | null;
}

/** 调度概览（JobSummaryVO） */
export interface JobSummary {
  /** SCHEDULER / EXECUTOR / SINGLE */
  role: string | null;
  nodeId: string | null;
  leader: boolean;
  group: string | null;
  scanIntervalMs: number;
  preReadMs: number;
  totalJobs: number;
  runningJobs: number;
  stoppedJobs: number;
  localJobs: number;
  remoteJobs: number;
  /** 启用中但本节点没有同名处理器的任务数：这些行每一拍都会记「处理器未注册」 */
  unregisteredJobs: number;
  /**
   * 本机不领取的远程任务数（单机/执行器角色下启用的 REMOTE 行）：这些行既不会被本机单秒循环领走
   * （领取只过 LOCAL），本机也不是下发方，所以在本机永远不出日志。不是调度坏了，是归属在别的节点。
   */
  unclaimedRemoteJobs: number;
  registeredHandlers: number;
  /** 24 小时内的失败派发数 */
  recentFailures: number;
  /** 远程分发是否由本节点下发（单机/执行器角色为 false，远程行在本机不会跑） */
  remoteDispatchOwnedByMe: boolean;
  onlineExecutors: string[];
}

/** 已注册执行器（JobExecutorVO），来自后端处理器注册表 */
export interface JobExecutor {
  /** 执行器名，即 jobKey */
  name: string;
  desc: string | null;
  /** ANNOTATION=@Job 注解扫描；INJECTED=三方模块运行期 register 注入；REMOTE=在线执行器上报 */
  source: "ANNOTATION" | "INJECTED" | "REMOTE";
  /** 处理器实现类全名 */
  handlerClass: string | null;
}

/** 执行器节点（JobNodeVO，远程作业页） */
export interface JobNode {
  /** 同步通道客户端标识 */
  clientId: string;
  /** 执行器自述节点标识（通常带进程号） */
  nodeId: string | null;
  /** 角色（EXECUTOR 等） */
  role: string | null;
  /** 调度中心长链地址（执行器侧配置） */
  serverUrl: string | null;
  /** 处理器清单 */
  handlers: string[];
  /** 处理器数量 */
  handlerCount: number;
  /** 在线状态 */
  online: boolean;
  /** 首次登记时间（毫秒） */
  registeredAt: number;
}

/** 后端统一分页信封（PageResult） */
export interface JobPage<T> {
  pageNo: number;
  pageSize: number;
  totalPages: number;
  total: number;
  data: T[];
}

/** 任务分页查询条件 */
export interface JobQuery {
  pageNum: number;
  pageSize: number;
  /** 关键字：任务名 / 处理器名 / 描述 / 编号 / 负责人 */
  keyword?: string;
  group?: string;
  /** 1 启用 0 停用，空为全部 */
  status?: number;
  /** LOCAL / REMOTE，空为全部 */
  dispatchMode?: string;
}

/** 日志分页查询条件 */
export interface JobLogQuery {
  pageNum: number;
  pageSize: number;
  keyword?: string;
  jobKey?: string;
  executeCode?: string;
  startTime?: number;
  endTime?: number;
}

/** 采集流程在台账里的固定分组，与后端 CollectFlowJobHandler.JOB_GROUP 一致 */
export const COLLECT_FLOW_GROUP = "collect-flow";
