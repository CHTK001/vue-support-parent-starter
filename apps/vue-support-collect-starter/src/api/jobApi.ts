/**
 * 调度中心接口层（job-starter 治理接口在采集宿主里的控制台出口）。
 *
 * 走 `/v2/scheduler/**`：它是带 `@Ignore` 的控制台出口，复用 job-starter 的
 * `JobGovernanceService`，由采集控制台会话把关（`CollectConsoleAuthInterceptor`）。
 * job-starter 自带的 `/v2/job/**` 要求平台统一认证，本宿主没接认证服务端，不要用。
 *
 * 分页出参是 `PageResult`（`data` 直接是 {pageNo,pageSize,totalPages,total,data:[]}），
 * http 层已逐层剥掉信封，所以这里拿到的是分页体本身。
 */
import { get, post, put, del } from "./http";
import type { JobExecutor, JobLog, JobLogQuery, JobNode, JobPage, JobQuery, JobRuntime, JobSave, JobSummary } from "../types/job";

const API = "/v2/scheduler";

/** 工作台概览：角色、选主态、任务与日志计数 */
export const getSummary = () => get<JobSummary>(`${API}/summary`);

/** 任务运行态分页 */
export const pageJobs = (query: JobQuery) => get<JobPage<JobRuntime>>(`${API}/page`, { ...query });

/** 按任务键取运行态 */
export const getJob = (jobKey: string) => get<JobRuntime>(`${API}/detail/${encodeURIComponent(jobKey)}`);

/** 登记或更新任务（调度配置与启停一次写入） */
export const saveJob = (job: JobSave) => post<boolean>(`${API}/save`, job);

/** 启停自动调度 */
export const setJobStatus = (jobKey: string, enabled: boolean) =>
  put<boolean>(`${API}/status`, { jobKey, enabled });

/**
 * 立即派发一次：经 JobOperator 命令通道投递，不改变启停状态。
 * 页面对停用的任务禁用该按钮——停用的任务不该被点一下就跑。
 */
export const triggerJob = (jobKey: string) => post<boolean>(`${API}/trigger`, undefined, { jobKey });

/** 删除任务（先停调度再删台账行） */
export const deleteJob = (jobKey: string) => del<boolean>(`${API}/${encodeURIComponent(jobKey)}`);

/** 本节点已注册执行器清单：@Job 扫描 + 三方编程式注入 */
export const listExecutors = () => get<JobExecutor[]>(`${API}/executors`);

/** 在线执行器节点清单：远程作业页用（节点身份 / 长链地址 / 处理器） */
export const listNodes = () => get<JobNode[]>(`${API}/nodes`);

/** 执行日志分页（按触发时刻倒序） */
export const pageJobLogs = (query: JobLogQuery) => get<JobPage<JobLog>>(`${API}/log/page`, { ...query });

/** 清理执行日志，retentionDays=0 表示清空全部 */
export const cleanupJobLogs = (retentionDays: number) =>
  post<number>(`${API}/log/cleanup`, undefined, { retentionDays });
