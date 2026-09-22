/**
 * 调度作业台账接口层（scheduler-starter 的控制台 API）。
 *
 * 合并后这套接口跑在采集宿主同一进程里，受采集控制台会话保护（控制器自带 @Ignore，
 * 不需要平台令牌）。路径里的 default 是命名空间段，后端把它当作 sys_job_group 过滤条件，
 * "default" 映射为不过滤；本控制台按台账全量展示，分组差异用列标记区分。
 *
 * 只走 /job-console/api/**：/v1/job-platform/** 没有 @Ignore，仍需平台令牌。
 * /job-console/api/{ns}/task/** 属于调度平台旧的任务视图接口，当前后端实现有缺陷，不要接。
 */
import { get, post, put, del } from "./http";
import type { JobPage, SysJob, SysJobLog, SysJobLogQuery, SysJobQuery, SysJobSave } from "../types/job";
import type { CollectPage } from "../types/collect";

/** 命名空间段：default = 不按分组过滤 */
const NS = "default";
const API = `/job-console/api/${NS}`;

/** 作业分页（ReturnResult 单层信封，data 直接是 mybatis-plus 分页体） */
export async function pageJobs(query: SysJobQuery): Promise<CollectPage<SysJob>> {
  const data = await get<JobPage<SysJob>>(
    `${API}/job/page`,
    { pageNum: query.pageNum, pageSize: query.pageSize, jobName: query.sysJobName, triggerStatus: query.sysJobTriggerStatus } as Record<string, unknown>,
  );
  return {
    rows: Array.isArray(data?.records) ? data.records : [],
    total: Number(data?.total ?? 0),
    pageNo: Number(data?.current ?? query.pageNum),
    pageSize: Number(data?.size ?? query.pageSize),
  };
}

/** 按任务编号取台账详情 */
export const getJob = (jobNo: string) => get<SysJob>(`${API}/job/no/${encodeURIComponent(jobNo)}`);

/** 新建外部作业，分组由命名空间段决定（default 即不落分组） */
export const createJob = (job: SysJobSave) => post<SysJob>(`${API}/job`, job);

/** 按任务编号更新外部作业 */
export const updateJob = (jobNo: string, job: SysJobSave) =>
  put<boolean>(`${API}/job/no/${encodeURIComponent(jobNo)}`, job);

/** 逻辑删除外部作业（后端先停调度再置删除标记） */
export const deleteJob = (jobNo: string) => del<boolean>(`${API}/job/no/${encodeURIComponent(jobNo)}`);

/** 启用调度：置 triggerStatus=1 并算好下次触发时刻 */
export const startJob = (jobNo: string) => post<boolean>(`${API}/job/no/${encodeURIComponent(jobNo)}/start`);

/** 停止调度：置 0 并把下次触发时刻清零，台账行保留 */
export const stopJob = (jobNo: string) => post<boolean>(`${API}/job/no/${encodeURIComponent(jobNo)}/stop`);

/**
 * 立即派发一次：后端经 JobOperator 的命令通道投递，不改变启停状态也不打乱后续 cron 序列。
 * 页面对停用的作业禁用该按钮——停用的作业不该被点一下就跑。
 */
export const triggerJob = (jobNo: string, param?: string) =>
  post<boolean>(`${API}/job/no/${encodeURIComponent(jobNo)}/trigger`, undefined, { param });

/** 作业执行日志分页 */
export async function pageJobLogs(query: SysJobLogQuery): Promise<CollectPage<SysJobLog>> {
  const data = await get<JobPage<SysJobLog>>(`${API}/job-log/page`, {
    pageNum: query.pageNum,
    pageSize: query.pageSize,
    beanName: query.beanName,
    executeCode: query.executeCode,
  });
  return {
    rows: Array.isArray(data?.records) ? data.records : [],
    total: Number(data?.total ?? 0),
    pageNo: Number(data?.current ?? query.pageNum),
    pageSize: Number(data?.size ?? query.pageSize),
  };
}

/** 清理执行日志（含日志文件），retentionDays=0 表示清空全部；返回后端的中文结果文案 */
export const cleanupJobLogs = (retentionDays: number) =>
  post<string>(`${API}/job-log/cleanup`, undefined, { retentionDays });
