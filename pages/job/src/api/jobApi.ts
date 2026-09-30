/**
 * 调度中心接口层。
 *
 * 出口前缀由各宿主配置（`url.jobApi`），因为同一份 pages/job 被两个宿主复用而治理出口不同：
 * - 采集控制台没有平台统一认证，用 job-starter 那个带 `@Ignore` 的控制台出口
 *   `/v2/scheduler/**`，由采集控制台会话把关（`CollectConsoleAuthInterceptor`）；
 * - 系统管理应用有平台认证，用 job-starter 自带的 `/v2/job/**`。
 *
 * 早先这里把前缀写死成 `/v2/scheduler`，导致系统管理应用的调度页整页 404：
 * 页面能渲染（列表请求失败被当成空台账），但保存会打 `/v2/scheduler/save` 拿 404，
 * 而且失败没有任何用户可见反馈。不要再写死。
 *
 * 分页出参是 `PageResult`（`data` 直接是 {pageNo,pageSize,totalPages,total,data:[]}），
 * http 层已逐层剥掉信封，所以这里拿到的是分页体本身。
 */
import { getConfig } from "@repo/config";
import { get, post, put, del } from "./http";
import type { JobExecutor, JobLog, JobLogContent, JobLogQuery, JobNode, JobPage, JobQuery, JobRuntime, JobSave, JobSummary } from "../types/job";

/**
 * 治理出口前缀：取宿主配置，缺省回落到采集控制台出口（与 @repo/config 的默认值一致）。
 *
 * @returns 去掉首尾斜杠的前缀
 */
function apiPrefix(): string {
  return (getConfig().url?.jobApi || "/v2/scheduler").replace(/\/+$/, "");
}

/** 工作台概览：角色、选主态、任务与日志计数 */
export const getSummary = () => get<JobSummary>(`${apiPrefix()}/summary`);

/** 任务运行态分页 */
export const pageJobs = (query: JobQuery) => get<JobPage<JobRuntime>>(`${apiPrefix()}/page`, { ...query });

/** 按任务键取运行态 */
export const getJob = (jobKey: string) => get<JobRuntime>(`${apiPrefix()}/detail/${encodeURIComponent(jobKey)}`);

/** 登记或更新任务（调度配置与启停一次写入） */
export const saveJob = (job: JobSave) => post<boolean>(`${apiPrefix()}/save`, job);

/** 启停自动调度 */
export const setJobStatus = (jobKey: string, enabled: boolean) =>
  put<boolean>(`${apiPrefix()}/status`, { jobKey, enabled });

/**
 * 立即派发一次：经 JobOperator 命令通道投递，不改变启停状态。
 * 页面对停用的任务禁用该按钮——停用的任务不该被点一下就跑。
 */
export const triggerJob = (jobKey: string) => post<boolean>(`${apiPrefix()}/trigger`, undefined, { jobKey });

/** 删除任务（先停调度再删台账行） */
export const deleteJob = (jobKey: string) => del<boolean>(`${apiPrefix()}/${encodeURIComponent(jobKey)}`);

/** 本节点已注册执行器清单：@Job 扫描 + 三方编程式注入 */
export const listExecutors = () => get<JobExecutor[]>(`${apiPrefix()}/executors`);

/** 可用脚本引擎（SPI 运行时枚举）：驱动「语言」下拉，装了新引擎自动出现 */
export const listGlueEngines = () => get<string[]>(`${apiPrefix()}/glue/engines`);

/** 在线执行器节点清单：远程作业页用（节点身份 / 长链地址 / 处理器） */
export const listNodes = () => get<JobNode[]>(`${apiPrefix()}/nodes`);

/** 执行日志分页（按触发时刻倒序） */
export const pageJobLogs = (query: JobLogQuery) => get<JobPage<JobLog>>(`${apiPrefix()}/log/page`, { ...query });
/**
 * 读单次执行的日志正文。
 *
 * 入参是日志行上的 filePath（相对 plugin.job.log.base-path）；后端会做目录越界校验，
 * 所以这里原样回传，不在前端拼路径。
 */
export const readJobLogContent = (filePath: string) =>
  get<JobLogContent>(`${apiPrefix()}/log/content`, { filePath });
/** 清理执行日志，retentionDays=0 表示清空全部 */
export const cleanupJobLogs = (retentionDays: number) =>
  post<number>(`${apiPrefix()}/log/cleanup`, undefined, { retentionDays });
