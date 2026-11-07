/**
 * 采集调度一体化平台接口层（传输与信封解包见 ./http.ts）。
 *
 * 后端契约要点集中在 ./http.ts 的注释里；本文件只描述各接口的路径与出参类型。
 */
import { del, get, post, put } from "./http";
import type {
  CollectCategory,
  CollectCategoryNode,
  CollectColumn,
  CollectDatasource,
  CollectDatasourceVO,
  CollectDsl,
  CollectFieldDef,
  CollectFieldSave,
  CollectFlow,
  CollectFlowQuery,
  CollectFlowSave,
  CollectFunction,
  CollectFunctionTest,
  CollectFunctionTestResult,
  CollectNotice,
  CollectNotifyChannel,
  CollectNotifyResult,
  CollectOption,
  CollectPage,
  CollectRecord,
  CollectRecordQuery,
  CollectTask,
  CollectTaskLog,
  CollectTaskQuery,
  CollectRun,
  CollectRuntime,
  CollectShapeMeta,
  CollectVariable,
} from "../types/collect";

const API = "/v2/collect";

/** 解包分页对象为统一形状（空分页时后端 data 为 null） */
function toPage<T>(value: unknown): CollectPage<T> {
  const p = (value ?? {}) as { pageNo?: number; pageSize?: number; total?: number; data?: T[] | null };
  return {
    rows: Array.isArray(p.data) ? p.data : [],
    total: Number(p.total ?? 0),
    pageNo: Number(p.pageNo ?? 1),
    pageSize: Number(p.pageSize ?? 10),
  };
}

/* -------------------------------- 设计器元数据 ---------------------------- */

/** 全部节点类型元数据 */
export const fetchMetas = () => get<CollectShapeMeta[]>(`${API}/designer/metas`);

/** 运行时概览（执行器、统计、线程与超时配置） */
export const fetchRuntime = () => get<CollectRuntime>(`${API}/designer/runtime`);

/** AI 生成流程：把自然语言描述生成流程 DSL（服务端经图校验后返回）。 */
export const aiGenerateFlow = (input: string) => post<CollectDsl>(`${API}/designer/ai-generate`, { input });

/** 预览抓取出参，形状与后端 CollectPreviewVO 对齐 */
export interface CollectPreviewPayload {
  /** HTTP 状态码 */
  status: number;
  /** 响应 Content-Type */
  contentType?: string | null;
  /** 正文字符数 */
  length: number;
  /** 正文原文（后端不清洗，剥 script 由前端渲染前做） */
  html: string;
  /** 是否经过真实浏览器渲染（执行了 JS）；false 表示 HTTP 直取的原始响应 */
  rendered?: boolean;
}

/**
 * 设计期预览抓取：把 URL 抓回来给元素拾取器渲染。
 *
 * 后端只放行 http/https 且拒绝内网与本机地址，被拦时回业务错误（中文原因）。
 * 抓取结果在流程运行期只活在变量里，设计期拿不到，所以走这个只读出口。
 *
 * @param url       目标地址
 * @param timeoutMs 可选超时毫秒
 * @param render    是否用真实浏览器执行 JS 后取 DOM（SPA 站点必需，单次开销秒级）
 * @returns 抓取结果
 */
export const fetchPreview = (url: string, timeoutMs?: number, render?: boolean) =>
  get<CollectPreviewPayload>(`${API}/designer/fetch-preview`, { url, timeoutMs, render });

/* ---------------------------------- 流程 ---------------------------------- */

/** 流程分页 */
export async function pageFlows(query: CollectFlowQuery): Promise<CollectPage<CollectFlow>> {
  return toPage<CollectFlow>(await get<unknown>(`${API}/flow/page`, query as Record<string, unknown>));
}

/** 流程精简列表（不含 dsl） */
export const listFlows = (keyword?: string) => get<CollectFlow[]>(`${API}/flow/list`, { keyword });

/** 流程详情（唯一返回 dsl 的读接口） */
export const getFlow = (flowId: number) => get<CollectFlow>(`${API}/flow/detail`, { flowId });

/** 新增流程 */
export const saveFlow = (dto: CollectFlowSave) => post<CollectFlow>(`${API}/flow/save`, dto);

/** 修改流程 */
export const updateFlow = (dto: CollectFlowSave) => put<CollectFlow>(`${API}/flow/update`, dto);

/** 启停流程调度，status 只接受 0/1 */
export const setFlowStatus = (flowId: number, status: number) =>
  put<CollectFlow>(`${API}/flow/status`, undefined, { flowId, status });

/** 复制流程 */
export const copyFlow = (flowId: number) => post<CollectFlow>(`${API}/flow/copy`, undefined, { flowId });

/** 删除流程（逻辑删） */
export const deleteFlow = (flowId: number) => del<boolean>(`${API}/flow/delete`, { flowId });

/** 只校验流程图不落库，通过时返回提示文案 */
export const validateDsl = (dsl: CollectDsl) => post<string>(`${API}/flow/validate`, dsl);

/* ---------------------------------- 分类 ---------------------------------- */

/** 分类树 */
export const fetchCategoryTree = () => get<CollectCategoryNode[]>(`${API}/category/tree`);

/** 分类下拉（首项固定 value:"0" 未分类） */
export const fetchCategoryOptions = () => get<CollectOption[]>(`${API}/category/options`);

/** 新增分类 */
export const saveCategory = (dto: CollectCategory) => post<CollectCategory>(`${API}/category/save`, dto);

/** 修改分类 */
export const updateCategory = (dto: CollectCategory) => put<boolean>(`${API}/category/update`, dto);

/** 删除分类（有子分类或流程时后端拒绝） */
export const deleteCategory = (categoryId: number) => del<boolean>(`${API}/category/delete`, { categoryId });

/* ---------------------------------- 执行 ---------------------------------- */

/** 运行已保存流程（异步，立即返回任务号） */
export const runFlow = (dto: CollectRun) => post<CollectTask>(`${API}/execution/run`, dto);

/** 试运行未保存的流程图，结果不落库 */
export const dryRun = (dsl: CollectDsl) => post<CollectTask>(`${API}/execution/dry-run`, dsl);

/** 停止任务 */
export const stopTask = (taskId: number) => post<boolean>(`${API}/execution/stop`, undefined, { taskId });

/** 本机执行中任务数 */
export const fetchRunningCount = () => get<number>(`${API}/execution/running`);

/** 某流程排队+执行中任务数 */
export const fetchInflight = (flowId: number) => get<number>(`${API}/execution/inflight`, { flowId });

/* ---------------------------------- 任务 ---------------------------------- */

/** 任务分页 */
export async function pageTasks(query: CollectTaskQuery): Promise<CollectPage<CollectTask>> {
  return toPage<CollectTask>(await get<unknown>(`${API}/task/page`, query as Record<string, unknown>));
}

/** 任务详情 */
export const getTask = (taskId: number) => get<CollectTask>(`${API}/task/detail`, { taskId });

/** 节点执行日志（按执行顺序，上限 1000 条） */
export const fetchTaskLogs = (taskId: number) => get<CollectTaskLog[]>(`${API}/task/logs`, { taskId });

/** 每节点最近一次状态，供设计器着色 */
export const fetchNodeStates = (taskId: number) => get<CollectTaskLog[]>(`${API}/task/node-states`, { taskId });

/** 删除任务及其日志 */
export const deleteTask = (taskId: number) => del<boolean>(`${API}/task/delete`, { taskId });

/** 清理历史任务，返回删除条数 */
export const cleanTasks = (flowId?: number, days = 7) =>
  post<number>(`${API}/task/clean`, undefined, { flowId, days });

/* --------------------------------- 采集结果 -------------------------------- */

/** 结果分页 */
export async function pageRecords(query: CollectRecordQuery): Promise<CollectPage<CollectRecord>> {
  return toPage<CollectRecord>(await get<unknown>(`${API}/record/page`, query as Record<string, unknown>));
}

/** 结果详情 */
export const getRecord = (recordId: number) => get<CollectRecord>(`${API}/record/detail`, { recordId });

/** 删除单条结果 */
export const deleteRecord = (recordId: number) => del<boolean>(`${API}/record/delete`, { recordId });

/** 批量删除，body 是裸 JSON 数组 */
export const deleteRecords = (recordIds: number[]) => post<number>(`${API}/record/deletes`, recordIds);

/** 清空结果，flowId 与 taskId 至少给一个 */
export const clearRecords = (flowId?: number, taskId?: number) =>
  del<number>(`${API}/record/clear`, { flowId, taskId });

/* -------------------------------- 结果字段定义 ------------------------------ */

/** 字段定义列表，nodeId 为空表示流程级 */
export const fetchFields = (flowId: number, nodeId?: string) =>
  get<CollectFieldDef[]>(`${API}/field/list`, { flowId, nodeId });

/** 整体替换字段定义（先删后插，空数组即清空） */
export const replaceFields = (dto: CollectFieldSave) => post<boolean>(`${API}/field/replace`, dto);

/* --------------------------------- 全局变量 -------------------------------- */

/** 变量列表（密文值回掩码 "******"） */
export const listVariables = () => get<CollectVariable[]>(`${API}/variable/list`);

/** 新增变量 */
export const saveVariable = (dto: CollectVariable) => post<CollectVariable>(`${API}/variable/save`, dto);

/** 修改变量，密文变量提交掩码表示不改值 */
export const updateVariable = (dto: CollectVariable) => put<boolean>(`${API}/variable/update`, dto);

/** 删除变量 */
export const deleteVariable = (variableId: number) => del<boolean>(`${API}/variable/delete`, { variableId });

/* ---------------------------------- 数据源 --------------------------------- */

/**
 * 数据源台账只有一份实现：@pages/datasource（后端数据源中心 /ms/datasource）。
 * 这里只做再导出，页面与 API 都不在本 app 里另放一份。
 */
export {
  APP_DATASOURCE,
  fetchDatasourceOptions,
  fetchDatasourceTables,
  fetchDatasourceTableInfos,
  fetchDatasourceColumns,
} from "@pages/datasource";
export type { CollectColumn, CollectTable } from "@pages/datasource";

/* --------------------------------- 执行通知 -------------------------------- */

/**
 * 通知配置列表（全局清单，对所有采集器生效）。
 *
 * 不接 flowId：通知已定为平台级配置，后端 `/notice/list` 也没有这个入参了。
 */
export const listNotices = () => get<CollectNotice[]>(`${API}/notice/list`);

/** 可用渠道，来自后端注册表（Spring Bean + SPI），前端不写死 */
export const fetchNoticeChannels = () => get<CollectNotifyChannel[]>(`${API}/notice/channels`);

/** 新增通知配置 */
export const saveNotice = (dto: CollectNotice) => post<CollectNotice>(`${API}/notice/save`, dto);

/** 修改通知配置 */
export const updateNotice = (dto: CollectNotice) => put<boolean>(`${API}/notice/update`, dto);

/** 删除通知配置 */
export const deleteNotice = (noticeId: number) => del<boolean>(`${API}/notice/delete`, { noticeId });

/** 试发一条通知，结果同时写进该配置的「最近结果」 */
export const testNotice = (noticeId: number) => post<CollectNotifyResult>(`${API}/notice/test`, undefined, { noticeId });

/* -------------------------------- 自定义函数 -------------------------------- */

/** 函数列表，keyword 模糊匹配函数名与说明 */
export const listFunctions = (keyword?: string) => get<CollectFunction[]>(`${API}/function/list`, { keyword });

/** 新增函数，后端编译不过会直接拒绝 */
export const saveFunction = (dto: CollectFunction) => post<CollectFunction>(`${API}/function/save`, dto);

/** 修改函数 */
export const updateFunction = (dto: CollectFunction) => put<boolean>(`${API}/function/update`, dto);

/** 删除函数 */
export const deleteFunction = (functionId: number) => del<boolean>(`${API}/function/delete`, { functionId });

/** 试跑函数，走与流程运行相同的派发链，实参按位置传 */
export const testFunction = (dto: CollectFunctionTest) =>
  post<CollectFunctionTestResult>(`${API}/function/test`, dto);
