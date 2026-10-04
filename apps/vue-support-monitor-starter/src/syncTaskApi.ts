import { http, unwrapResult } from "@repo/utils";

/**
 * 数据同步任务 API
 *
 * <p>对接后端 {@code /ms/monitor/datasync/**}。任务是「源 jdbc 数据源按 SQL 读 → 字段映射 →
 * 目标 jdbc 数据源某张表」的一段配置，数据面由后端复用 datasync 引擎执行。</p>
 *
 * <p>执行类接口刻意 {@code noToast(true)}：同步失败是**业务结果**（返回体里带
 * {@code status=FAILED} 与原因），需要把「读了几行、失败在哪一步」原样展示给用户，
 * 不能被一个通用错误提示盖掉。</p>
 *
 * @author CH
 * @since 4.0.0.43
 */

const unwrap = <T>(res: any): T => unwrapResult<T>(res);

/** 写入模式 */
export interface SyncWriteMode {
  code: string;
  label: string;
}

/** 数据同步任务 */
export interface SyncTask {
  id: number;
  syncTaskName: string;
  /** 输入源类型：JDBC / FILE / DIR */
  syncTaskSourceType?: string | null;
  /** 源数据源 ID（仅 JDBC 源有值） */
  syncTaskSourceDatasourceId?: number | null;
  /** 源读取 SQL（仅 JDBC 源有值） */
  syncTaskSourceSql?: string | null;
  /** 文件/目录路径（FILE=文件 / DIR=目录） */
  syncTaskSourcePath?: string | null;
  /** 文件/目录选项 JSON：{format,delimiter,sheetIndex,pattern,recursive,afterProcess} */
  syncTaskSourceOptions?: string | null;
  syncTaskTargetDatasourceId: number;
  syncTaskTargetTable: string;
  /** 字段映射 JSON 数组，空表示按同名自动匹配 */
  syncTaskColumnMapping?: string | null;
  syncTaskWriteMode: string;
  syncTaskBatchSize: number;
  syncTaskCron?: string | null;
  syncTaskEnabled: number;
  syncTaskLastRunTime?: string | null;
  syncTaskLastStatus?: string | null;
  syncTaskLastReadCount?: number | null;
  syncTaskLastWriteCount?: number | null;
  syncTaskLastCostMs?: number | null;
  syncTaskLastMessage?: string | null;
}

/** 任务新建/修改入参（用 type 而非 interface：`.data()` 的参数要求 Record<string, unknown>，
    interface 没有隐式索引签名，会报 TS2345；匿名对象类型/类型别名则有） */
export type SyncTaskPayload = {
  name: string;
  /** 输入源类型 JDBC/FILE/DIR，空按 JDBC */
  sourceType?: string | null;
  sourceDatasourceId?: number | null;
  sourceSql?: string | null;
  /** 文件/目录路径（服务器本地绝对路径） */
  sourcePath?: string | null;
  /** 文件/目录选项 JSON */
  sourceOptions?: string | null;
  targetDatasourceId: number;
  targetTable: string;
  columnMapping?: string | null;
  writeMode: string;
  batchSize?: number;
  cron?: string | null;
  enabled?: number;
}

/** 一次执行结果 */
export interface SyncTaskRunResult {
  status: string;
  readCount: number;
  writeCount: number;
  costMs: number;
  message: string;
  runTime: string;
}

/** 库表列 */
export interface SyncColumn {
  name: string;
  type: string;
  comment: string;
}

/** 一条字段映射 */
export interface SyncFieldMapping {
  source: string;
  target: string;
}

/** 字段映射预览 */
export interface SyncPreview {
  sourceColumns: SyncColumn[];
  targetColumns: SyncColumn[];
  mapping: SyncFieldMapping[];
  warnings: string[];
}

/**
 * 任务列表
 */
export const fetchSyncTasks = () =>
  http().get("/ms/monitor/datasync/tasks").then(r => unwrap<SyncTask[]>(r));

/**
 * 任务详情
 * @param id 任务 ID
 */
export const fetchSyncTask = (id: number) =>
  http().get(`/ms/monitor/datasync/tasks/${id}`).then(r => unwrap<SyncTask>(r));

/**
 * 新建任务
 * @param data 任务入参
 */
export const createSyncTask = (data: SyncTaskPayload) =>
  http().post("/ms/monitor/datasync/tasks").data(data).then(r => unwrap<SyncTask>(r));

/**
 * 修改任务
 * @param id 任务 ID
 * @param data 任务入参
 */
export const updateSyncTask = (id: number, data: SyncTaskPayload) =>
  http().put(`/ms/monitor/datasync/tasks/${id}`).data(data).then(r => unwrap<SyncTask>(r));

/**
 * 删除任务
 * @param id 任务 ID
 */
export const deleteSyncTask = (id: number) =>
  http().delete(`/ms/monitor/datasync/tasks/${id}`).then(r => unwrap<boolean>(r));

/**
 * 立即执行一次
 * @param id 任务 ID
 */
export const runSyncTask = (id: number) =>
  http().post(`/ms/monitor/datasync/tasks/${id}/run`).noToast(true).then(r => unwrap<SyncTaskRunResult>(r));

/**
 * 启用定时
 * @param id 任务 ID
 */
export const enableSyncTask = (id: number) =>
  http().post(`/ms/monitor/datasync/tasks/${id}/enable`).then(r => unwrap<boolean>(r));

/**
 * 停用定时
 * @param id 任务 ID
 */
export const disableSyncTask = (id: number) =>
  http().post(`/ms/monitor/datasync/tasks/${id}/disable`).then(r => unwrap<boolean>(r));

/**
 * 预览字段映射（不落库）
 * @param data 输入源（JDBC 用 datasourceId+sql；文件/目录用 path+options）与目标、已配映射
 */
export const previewSyncMapping = (data: {
  sourceType?: string | null;
  sourceDatasourceId?: number | null;
  sourceSql?: string | null;
  sourcePath?: string | null;
  sourceOptions?: string | null;
  targetDatasourceId: number;
  targetTable: string;
  mapping?: SyncFieldMapping[];
}) => http().post("/ms/monitor/datasync/preview").data(data).noToast(true).then(r => unwrap<SyncPreview>(r));

/** 本机文件条目（「选择文件 / 选择文件夹」用） */
export interface LocalFileEntry {
  key: string;
  name: string;
  isDir: boolean;
  size?: number | null;
  updatedAt?: number | null;
}

/**
 * 列举后端所在机器的目录（只读）
 *
 * <p>数据同步的输入源可以是「服务器本地文件 / 目录」，而 ReFilePicker 需要一个列目录的 loader。
 * 监控后端为此提供 {@code /ms/monitor/local-files/list}。</p>
 *
 * @param path  绝对路径；留空列出文件系统根
 * @param files 是否同时返回数据文件（选择文件时传 true）
 */
export const fetchLocalFiles = (path?: string | null, files = false) =>
  http().get("/ms/monitor/local-files/list").query({ path, files }).then(r => unwrap<LocalFileEntry[]>(r));

/**
 * 写入模式字典
 */
export const fetchSyncWriteModes = () =>
  http().get("/ms/monitor/datasync/write-modes").then(r => unwrap<SyncWriteMode[]>(r));