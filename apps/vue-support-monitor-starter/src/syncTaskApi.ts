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
  syncTaskSourceDatasourceId: number;
  syncTaskSourceSql: string;
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

/** 任务新建/修改入参 */
export interface SyncTaskPayload {
  name: string;
  sourceDatasourceId: number;
  sourceSql: string;
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
 * @param data 源/目标与已配映射
 */
export const previewSyncMapping = (data: {
  sourceDatasourceId: number;
  sourceSql: string;
  targetDatasourceId: number;
  targetTable: string;
  mapping?: SyncFieldMapping[];
}) => http().post("/ms/monitor/datasync/preview").data(data).noToast(true).then(r => unwrap<SyncPreview>(r));

/**
 * 写入模式字典
 */
export const fetchSyncWriteModes = () =>
  http().get("/ms/monitor/datasync/write-modes").then(r => unwrap<SyncWriteMode[]>(r));