/**
 * 采集调度一体化平台接口契约类型（与 spring-api-support-collect-starter 逐字对齐）。
 *
 * 命名规约：业务字段一律 collectXxx 前缀（实体主键/条件参数同名），
 * 只有登录态与图 DSL 用裸名（authEnabled、dsl、nodes 等）。
 */

/** 通用键值三元组：流程参数、请求头、Cookie、变量、结果单元格共用 */
export interface CollectParam {
  name: string;
  value?: string | null;
  description?: string | null;
}

/** 下拉选项（value 始终是字符串，ID 也被转成 String） */
export interface CollectOption {
  value: string;
  label: string;
}

/** 分页结果（后端三层包装后剥到这一层） */
export interface CollectPage<T> {
  rows: T[];
  total: number;
  pageNo: number;
  pageSize: number;
}

/* ------------------------------- 设计器元数据 ------------------------------- */

/** 属性面板控件类型；switch 为后端预留，flow 是子流程下拉 */
export type CollectParamType =
  | "text"
  | "textarea"
  | "number"
  | "switch"
  | "select"
  | "pairs"
  | "fields"
  | "flow"
  /** 数据源下拉，候选项由数据源选项接口给出 */
  | "datasource"
  /** 数据表下拉，候选项随 dependsOn 指向的数据源级联刷新 */
  | "table"
  /** 字段映射表，左列取自 columnsFrom 指向的表 */
  | "mapping";

/** 参数元数据（/designer/metas 节点元数据） */
export interface CollectParamMeta {
  name: string;
  label: string;
  type: CollectParamType;
  options: string[];
  defaultValue: string | null;
  required: boolean;
  tip: string | null;
  /** 级联来源参数名：table 候选项要从哪个数据源读 */
  dependsOn?: string | null;
  /** 取列来源参数名：mapping 左列候选取自哪个表参数 */
  columnsFrom?: string | null;
}

/** 数据表列元数据，字段映射控件的左列候选项 */
export interface CollectColumn {
  name: string;
  label: string | null;
  position: number | null;
  typeName: string | null;
  size: number | null;
  nullable: boolean | null;
  primaryKey: boolean | null;
}

/** 节点类型元数据（/designer/metas 的元素） */
export interface CollectShapeMeta {
  shape: string;
  label: string;
  group: string;
  icon: string;
  description: string | null;
  outputVariable: string | null;
  fieldEditor: boolean;
  params: CollectParamMeta[];
}

/** 运行时概览 */
export interface CollectRuntime {
  enable: boolean;
  executorId: string;
  runningTasks: number;
  flowCount: number;
  enabledFlowCount: number;
  taskCount: number;
  recordCount: number;
  schedulerGroup: string;
  scheduledJobCount: number;
  taskTimeoutMs: number;
  maxRecordPerTask: number;
  defaultThreadCount: number;
  requestTimeoutMs: number;
  shapes: CollectShapeMeta[];
  builtinFunctions: string[];
}

/* --------------------------------- 流程 DSL -------------------------------- */

/** 抽取字段声明（extract 节点） */
export interface CollectExtractField {
  name: string;
  parserType?: string | null;
  expression?: string | null;
  attribute?: string | null;
  attrName?: string | null;
  group?: number | null;
  defaultValue?: string | null;
}

/** 流程图节点 */
export interface CollectNode {
  id: string;
  shape: string;
  name?: string | null;
  x?: number | null;
  y?: number | null;
  params: CollectParam[];
  fields: CollectExtractField[];
}

/** 流程图连线 */
export interface CollectEdge {
  id: string;
  from: string;
  to: string;
  condition?: string | null;
  /** "0" 总是 / "1" 仅上游异常 / "2" 仅上游正常 */
  exceptionFlow?: string | null;
  /** null 视为 true */
  transmitVariable?: boolean | null;
}

/** 流程图（保存与试运行的请求体） */
export interface CollectDsl {
  name?: string | null;
  threadCount?: number | null;
  headers: CollectParam[];
  cookies: CollectParam[];
  variables: CollectParam[];
  nodes: CollectNode[];
  edges: CollectEdge[];
}

/** 流程保存入参 */
export interface CollectFlowSave {
  collectFlowId?: number | null;
  collectFlowName: string;
  collectFlowCategoryId?: number | null;
  collectFlowCode?: string | null;
  collectFlowCron?: string | null;
  collectFlowConcurrency?: number | null;
  collectFlowThreadCount?: number | null;
  collectFlowRemark?: string | null;
  dsl: CollectDsl;
}

/** 流程出参 */
export interface CollectFlow {
  collectFlowId: number;
  collectFlowName: string;
  collectFlowCategoryId: number;
  collectFlowCategoryName: string;
  collectFlowCode: string;
  collectFlowCron: string | null;
  collectFlowStatus: number;
  collectFlowConcurrency: number;
  collectFlowThreadCount: number;
  collectFlowRemark: string | null;
  collectFlowLastExecTime: string | null;
  collectFlowNextExecTime: string | null;
  collectFlowExecCount: number;
  collectFlowRecordCount: number | null;
  nodeCount: number | null;
  edgeCount: number | null;
  running: boolean;
  scheduled: boolean | null;
  dsl: CollectDsl | null;
  createName: string | null;
  createTime: string | null;
  updateTime: string | null;
}

/** 运行入参 */
export interface CollectRun {
  collectFlowId: number;
  persist?: boolean | null;
  variables?: CollectParam[] | null;
}

/* ---------------------------------- 分类 ---------------------------------- */

export interface CollectCategory {
  collectCategoryId?: number | null;
  collectCategoryName: string;
  collectCategoryPid?: number | null;
  collectCategoryTreeId?: string | null;
  collectCategorySort?: number | null;
  collectCategoryRemark?: string | null;
}

export interface CollectCategoryNode {
  collectCategoryId: number;
  collectCategoryName: string;
  collectCategoryPid: number;
  collectCategorySort: number;
  collectCategoryRemark: string | null;
  flowCount: number;
  children: CollectCategoryNode[];
}

/* ---------------------------------- 任务 ---------------------------------- */

export type CollectTaskStatus = "RUNNING" | "SUCCESS" | "FAILURE" | "STOPPED" | "SKIPPED";
export type CollectTriggerType = "CRON" | "MANUAL" | "TEST";

export interface CollectTask {
  collectTaskId: number;
  collectTaskNo: string;
  collectTaskFlowId: number;
  collectTaskFlowName: string | null;
  collectTaskStatus: CollectTaskStatus;
  collectTaskTriggerType: CollectTriggerType;
  collectTaskParams: string | null;
  collectTaskBeginTime: string | null;
  collectTaskEndTime: string | null;
  collectTaskCost: number | null;
  collectTaskNodeCount: number | null;
  collectTaskRequestCount: number | null;
  collectTaskRecordCount: number | null;
  collectTaskError: string | null;
  collectTaskExecutorId: string | null;
  running: boolean;
  createName: string | null;
}

export interface CollectTaskLog {
  collectTaskLogId: number;
  collectTaskLogTaskId: number;
  /** 该节点出自哪条流程；子流程节点的日志记在宿主任务下，但流程归属是子流程自己 */
  collectTaskLogFlowId: number | null;
  collectTaskLogNodeId: string;
  collectTaskLogNodeName: string | null;
  collectTaskLogNodeShape: string | null;
  collectTaskLogIteration: number | null;
  collectTaskLogStatus: CollectTaskStatus;
  collectTaskLogCost: number | null;
  collectTaskLogMessage: string | null;
  collectTaskLogOutput: string | null;
  createTime: string | null;
}

/* ------------------------------ 任务质量报告 ------------------------------ */

export interface CollectQualityNode {
  nodeId: string;
  nodeName: string | null;
  nodeShape: string | null;
  execCount: number;
  successCount: number;
  failedCount: number;
  skippedCount: number;
  avgCostMs: number | null;
  totalCostMs: number | null;
  recordCount: number;
  successRate: number | null;
}

export interface CollectQuality {
  taskId: number;
  taskNo: string | null;
  totalNodes: number;
  successNodes: number;
  failedNodes: number;
  skippedNodes: number;
  requestCount: number;
  requestSuccess: number;
  requestFailed: number;
  recordCount: number;
  newRecords: number;
  duplicateRecords: number;
  insertRate: number | null;
  nodeSuccessRate: number | null;
  totalCostMs: number | null;
  slowestNode: string | null;
  slowestNodeCostMs: number | null;
  qualityScore: number;
  qualityLevel: "EXCELLENT" | "GOOD" | "FAIR" | "POOR";
  errorSummary: string | null;
  nodes: CollectQualityNode[];
}

/* ------------------------------ 执行历史统计 ------------------------------ */

export interface CollectDailyTrend {
  date: string;
  runCount: number;
  successCount: number;
  failureCount: number;
  recordCount: number;
  avgCostMs: number | null;
}

export interface CollectNodeCostStat {
  nodeId: string;
  nodeName: string | null;
  nodeShape: string | null;
  execCount: number;
  avgCostMs: number | null;
  totalCostMs: number | null;
  successRate: number | null;
}

export interface CollectStats {
  flowId: number;
  flowName: string | null;
  days: number;
  totalRuns: number;
  successCount: number;
  failureCount: number;
  skippedCount: number;
  successRate: number | null;
  totalRecords: number;
  avgRecordsPerRun: number | null;
  totalCostMs: number | null;
  avgCostMs: number | null;
  maxCostMs: number | null;
  minCostMs: number | null;
  daily: CollectDailyTrend[];
  nodeCosts: CollectNodeCostStat[];
}

/* ------------------------------ 告警规则 ------------------------------ */

export interface CollectAlertRule {
  collectAlertRuleId?: number | null;
  collectFlowId?: number | null;
  collectAlertRuleName: string;
  alertType: string;
  threshold: number | null;
  alertTiming?: string | null;
  alertEnabled?: number | null;
  lastAlertTime?: string | null;
  lastAlertResult?: string | null;
  createName?: string | null;
  createTime?: string | null;
  updateName?: string | null;
  updateTime?: string | null;
}

/* ------------------------------ 流程版本 ------------------------------ */

export interface CollectFlowVersion {
  collectFlowVersionId: number;
  collectFlowId: number;
  versionNo: number;
  flowDsl: string | null;
  versionRemark: string | null;
  createName: string | null;
  createTime: string | null;
}

/* --------------------------------- 采集结果 -------------------------------- */

export interface CollectRecord {
  collectRecordId: number;
  collectRecordFlowId: number;
  collectRecordTaskId: number;
  collectRecordNodeId: string | null;
  collectRecordKey: string | null;
  collectRecordUrl: string | null;
  cells: CollectParam[];
  createTime: string | null;
  updateTime: string | null;
}

/** 结果字段定义（实体直出） */
export interface CollectFieldDef {
  collectFieldId?: number | null;
  collectFieldFlowId?: number | null;
  collectFieldNodeId?: string | null;
  collectFieldName: string;
  collectFieldLabel?: string | null;
  collectFieldType?: string | null;
  collectFieldPrimary?: number | null;
  collectFieldLength?: number | null;
  collectFieldSort?: number | null;
  collectFieldEnabled?: number | null;
}

export interface CollectFieldSave {
  collectFlowId: number;
  collectNodeId?: string | null;
  fields: CollectFieldDef[];
}

/* --------------------------------- 全局变量 -------------------------------- */

export interface CollectVariable {
  collectVariableId?: number | null;
  collectVariableName: string;
  collectVariableValue?: string | null;
  collectVariableEncrypted?: number | null;
  collectVariableDescription?: string | null;
  createName?: string | null;
  createTime?: string | null;
  updateTime?: string | null;
}

/* --------------------------------- 数据源 ---------------------------------- */

export interface CollectDatasource {
  collectDatasourceId?: number | null;
  collectDatasourceName: string;
  collectDatasourceType?: string | null;
  collectDatasourceDriverClassName?: string | null;
  collectDatasourceJdbcUrl: string;
  collectDatasourceUsername?: string | null;
  collectDatasourcePassword?: string | null;
  collectDatasourceStatus?: number | null;
  collectDatasourceRemark?: string | null;
}

export interface CollectDatasourceVO {
  collectDatasourceId: number;
  collectDatasourceName: string;
  collectDatasourceType: string | null;
  collectDatasourceDriverClassName: string | null;
  collectDatasourceJdbcUrl: string;
  collectDatasourceUsername: string | null;
  passwordSet: boolean;
  collectDatasourceStatus: number;
  collectDatasourceRemark: string | null;
  createTime: string | null;
  updateTime: string | null;
}

/* --------------------------------- 执行通知 -------------------------------- */

/**
 * 通知配置（实体直出）。
 *
 * 通知是平台级配置，后端表里已经没有流程列，这里也不留流程字段。
 */
export interface CollectNotice {
  collectNoticeId?: number | null;
  collectNoticeName: string;
  collectNoticeChannel: string;
  /** 收件邮箱（逗号分隔）或回调地址 */
  collectNoticeTarget: string;
  /** SUCCESS / FAILURE / ALWAYS */
  collectNoticeTiming: string;
  collectNoticeSubject?: string | null;
  collectNoticeContent?: string | null;
  collectNoticeEnabled?: number | null;
  collectNoticeLastResult?: string | null;
  collectNoticeLastTime?: string | null;
  createTime?: string | null;
  updateTime?: string | null;
}

/** 渠道下拉项，来自后端注册表，targetHint 说明该渠道的接收目标怎么填 */
export interface CollectNotifyChannel {
  value: string;
  label: string;
  targetHint?: string | null;
}

/** 试发通知的返回（渠道 MessageResponse） */
export interface CollectNotifyResult {
  success?: boolean;
  messageId?: string | null;
  errorMessage?: string | null;
  durationMillis?: number | null;
}

/* -------------------------------- 自定义函数 -------------------------------- */

/** 自定义函数（实体直出），脚本正文必须是 Groovy 闭包字面量 */
export interface CollectFunction {
  collectFunctionId?: number | null;
  collectFunctionName: string;
  collectFunctionScript: string;
  /** 形参个数由后端按闭包签名回填，前端只读 */
  collectFunctionParameters?: number | null;
  collectFunctionDescription?: string | null;
  collectFunctionEnabled?: number | null;
  collectFunctionLastResult?: string | null;
  collectFunctionLastTime?: string | null;
  createTime?: string | null;
  updateTime?: string | null;
}

/** 函数试跑入参，实参按位置传且都以字符串提交 */
export interface CollectFunctionTest {
  collectFunctionId: number;
  arguments?: string[] | null;
}

/** 函数试跑出参 */
export interface CollectFunctionTestResult {
  success?: boolean;
  functionName?: string | null;
  parameters?: number | null;
  result?: string | null;
  resultType?: string | null;
  costMs?: number | null;
  errorMessage?: string | null;
}

/* --------------------------------- 查询条件 -------------------------------- */

/** 流程分页条件（只有这四个字段真正进 WHERE） */
export interface CollectFlowQuery {
  page?: number;
  pageSize?: number;
  collectFlowName?: string;
  collectFlowCode?: string;
  collectFlowCategoryId?: number | string;
  collectFlowStatus?: number | string;
}

/** 任务分页条件 */
export interface CollectTaskQuery {
  page?: number;
  pageSize?: number;
  collectTaskFlowId?: number | string;
  collectTaskStatus?: string;
  collectTaskTriggerType?: string;
  collectTaskNo?: string;
  collectTaskFlowName?: string;
}

/** 结果分页条件 */
export interface CollectRecordQuery {
  page?: number;
  pageSize?: number;
  collectRecordFlowId?: number | string;
  collectRecordTaskId?: number | string;
  collectRecordNodeId?: string;
  collectRecordKey?: string;
  collectRecordUrl?: string;
}
