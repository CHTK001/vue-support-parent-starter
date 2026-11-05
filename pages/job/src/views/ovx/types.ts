/**
 * [临时] 调度概览设计探索的视图模型 —— 选定方案后整目录删除。
 *
 * 只描述「页面上要出现的每一个值」，不含任何取数逻辑与样式，保证 5 个候选方案
 * 拿到的是同一份事实：任何方案都不允许少显示一项，也不允许自己造数据。
 */

/** 构成条的单个分段（KPI 里表示比例关系的部分） */
export interface OvPart {
  label: string;
  value: number;
  color: string;
}

/**
 * KPI 之一。value/desc 是必显文案，parts 是比例关系的结构化表达
 * （方案可以画成分段条、环形、堆叠柱，但四段的数值必须在界面上可读）。
 */
export interface OvKpi {
  key: "total" | "dispatch" | "fail" | "unregistered";
  /** 卡面标题 */
  title: string;
  /** 主数值（已格式化） */
  value: string;
  /** 副文案（已按真实状态生成） */
  desc: string;
  /** 图标名 */
  icon: string;
  /** 语义色 */
  tone: "brand" | "success" | "warning" | "error";
  /** 点击跳转的路由 */
  path: string;
  /** 比例分段；与 spark 二选一 */
  parts: OvPart[] | null;
  /** 分段条可直接用的 CSS 渐变 */
  gradient: string | null;
  /** 迷你趋势序列；与 parts 二选一 */
  spark: number[] | null;
  sparkColor: string;
}

/** 节点概览事实（/v2/scheduler/summary 的标量字段，已拍平、null 已兜底） */
export interface OvSummaryView {
  /** summary 是否取到（false 时后面所有数值都是 0，界面必须给出「未取到」的说法） */
  ready: boolean;
  role: string;
  nodeId: string;
  group: string;
  leader: boolean;
  scanIntervalMs: number;
  preReadMs: number;
  totalJobs: number;
  runningJobs: number;
  stoppedJobs: number;
  localJobs: number;
  remoteJobs: number;
  unregisteredJobs: number;
  unclaimedRemoteJobs: number;
  registeredHandlers: number;
  /** 24 小时失败派发数（后端口径） */
  recentFailures: number;
  remoteDispatchOwnedByMe: boolean;
  onlineExecutors: string[];
}

/** 「标签 + 值」的事实项 */
export interface OvFact {
  label: string;
  value: string;
}

/** 近 24 小时按整点分桶的派发/失败序列 */
export interface OvHourly {
  /** 24 个整点标签，如 13:00 */
  labels: string[];
  /** 每桶派发数（SUCCESS + FAILURE） */
  dispatch: number[];
  /** 每桶失败数 */
  failure: number[];
  /** 累计派发 */
  cumDispatch: number[];
  /** 累计失败 */
  cumFailure: number[];
  totalDispatch: number;
  totalFailure: number;
  /** 当前整点所在下标（0~23），用于「现在」标尺 */
  nowIndex: number;
}

/** 即将触发的台账行 */
export interface OvUpcoming {
  jobKey: string;
  jobName: string;
  /** 是否由采集流程托管（group = collect-flow） */
  isFlow: boolean;
  /** 调度表达式 + 人话描述 */
  scheduleText: string;
  scheduleType: string;
  nextFireTime: number | null;
  /** 最近一次派发时刻，null 表示从未派发 */
  lastFireTime: number | null;
  /** 本节点是否登记了同名处理器 */
  handlerRegistered: boolean;
  /** LOCAL / REMOTE */
  dispatchMode: string | null;
}

/** 最近派发记录行 */
export interface OvDispatch {
  logId: string;
  triggerTime: number | null;
  jobKey: string;
  jobName: string;
  /** 执行器节点或地址 */
  executor: string;
  costMs: number | null;
  executeCode: string;
  /** SUCCESS / FAILURE / SKIPPED 的中文文案 */
  statusText: string;
  /** 触发类型：CRON / API / MANUAL … */
  triggerType: string | null;
  /** 结果说明（失败原因），可能为空 */
  message: string | null;
}

/** 在线执行器节点 */
export interface OvNode {
  clientId: string;
  nodeId: string;
  role: string;
  handlerCount: number;
  online: boolean;
  /** 调度中心长链地址 */
  serverUrl: string | null;
  registeredAt: number;
}

/** 已注册处理器 */
export interface OvExecutor {
  name: string;
  desc: string;
  handlerClass: string | null;
  /** ANNOTATION / INJECTED / REMOTE */
  source: string;
}

/** 图上标注：近 24 小时触发最多的任务，标它最后一次触发的时刻 */
export interface OvNotable {
  key: string;
  name: string;
  count: number;
  at: number;
  /** 落在哪个小时桶；-1 表示窗口外 */
  index: number;
}

/** 页面视图模型 */
export interface OvData {
  loading: boolean;
  /** 上次刷新时刻（HH:mm:ss） */
  updatedAt: string;
  /** 自动刷新开关状态 */
  autoRefresh: boolean;
  /** 开关自动刷新 */
  setAutoRefresh: (value: boolean) => void;
  /** 手动刷新 */
  reload: () => void;
  /** 跳转 */
  go: (path: string) => void;

  summary: OvSummaryView;
  kpis: OvKpi[];
  /** 状态事实四项：节点角色 / 扫描节奏 / 已注册处理器 / 在线执行器 */
  facts: OvFact[];
  /** 异常提醒；空串表示一切正常，整块不该渲染 */
  alert: string;
  /** 运行时参数详情 */
  runtimeRows: OvFact[];

  hourly: OvHourly;
  /** 图上标注（最多 2 条） */
  notable: OvNotable[];

  upcoming: OvUpcoming[];
  /** 停用任务提示；空串表示没有停用任务 */
  stoppedHint: string;
  dispatches: OvDispatch[];

  nodes: OvNode[];
  executors: OvExecutor[];

  /** 已读日志条数 / 台账条数，用于「口径」说明 */
  logCount: number;
  jobCount: number;
  /** 近 24 小时日志超过读取上限，曲线与计数只是下限值 */
  logTruncated: boolean;
  /** 台账行的状态分布（用于可视化启停比例） */
  ledger: {
    running: number;
    stopped: number;
    local: number;
    remote: number;
    /** 启用但本节点没有同名处理器的任务名（最多 6 个） */
    unregisteredSample: string[];
    flowJobs: number;
    beanJobs: number;
    scriptJobs: number;
  };
}
