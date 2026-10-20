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
  /** 同步模式：FULL 全量 / INCREMENTAL 增量（存量行为空按 FULL） */
  syncTaskSyncMode?: string | null;
  /** 增量字段（仅增量模式） */
  syncTaskIncField?: string | null;
  /** 增量每批数量（单次执行最多同步条数），null/缺省=不限 */
  syncTaskIncBatchSize?: number | null;
  /** 增量水位（服务端执行成功后回写，不可由入参指定） */
  syncTaskLastSeq?: string | null;
  /** Hook 通知地址，空=不通知 */
  syncTaskHookUrl?: string | null;
  /** Hook 通知时机：DONE 完成通知 / ROW 每条数据+完成（全量固定 DONE） */
  syncTaskHookNotify?: string | null;
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
  /** 同步模式 FULL/INCREMENTAL，空按 FULL */
  syncMode?: string | null;
  /** 增量字段（INCREMENTAL 时必填，只允许字母数字下划线） */
  incField?: string | null;
  /** 增量每批数量，null=不限 */
  incBatchSize?: number | null;
  /** Hook 通知地址（http/https），null=不通知 */
  hookUrl?: string | null;
  /** Hook 通知时机 DONE/ROW，空按 DONE（全量固定 DONE） */
  hookNotify?: string | null;
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

/** 调试日志的单行（服务端内存采集：时间 / 级别 / 内容） */
export interface SyncTaskRunLogLine {
  /** 行时间 HH:mm:ss.SSS */
  time: string;
  /** INFO / WARN / ERROR */
  level: string;
  /** 内容；ERROR 行可能内嵌换行（完整堆栈） */
  message: string;
}

/** 一次执行的调试日志（过程日志，不是结果摘要） */
export interface SyncTaskRunLog {
  /** MANUAL 手动 / SCHEDULED 定时 / REALTIME 实时录入 */
  trigger: string;
  /** RUNNING 进行中 / SUCCESS / FAILED */
  status: string;
  /** 执行开始时刻 yyyy-MM-dd HH:mm:ss */
  runTime: string;
  /** 已进行/总耗时毫秒 */
  costMs: number | null;
  /** 逐步过程行（执行先后顺序） */
  lines: SyncTaskRunLogLine[];
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
 * 查询执行调试日志（服务端内存缓冲：进行中执行在最前，其后已完成执行新在前）
 * @param id 任务 ID
 */
export const fetchSyncTaskLogs = (id: number) =>
  http().get(`/ms/monitor/datasync/tasks/${id}/logs`).then(r => unwrap<SyncTaskRunLog[]>(r));

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

/** 本机文件条目（「选择文件 / 选择文件夹」用，已映射为 FilePickerItem 的同形结构） */
export interface LocalFileEntry {
  key: string;
  name: string;
  isDir: boolean;
  size?: number | null;
  updatedAt?: number | null;
}

/** filesystem-starter 的目录浏览条目（目录与文件共用） */
interface FileDirEntry {
  name: string;
  path: string;
  isDir?: boolean;
  size?: number | null;
  updatedAt?: number | null;
}

/**
 * 列举后端所在机器的目录（只读）
 *
 * <p>数据同步的输入源可以是「服务器本地文件 / 目录」，而 ReFilePicker 需要一个列目录的 loader。
 * 直接用 filesystem-starter 的 {@code GET /v2/file/dir/list}，不再维护监控模块自己的列举接口。</p>
 *
 * @param path  绝对路径；留空或 `/` 列出文件系统根（Windows 为盘符列表）
 * @param files 是否同时返回文件；选择文件夹时也传 true，文件只展示不可选
 */
export const fetchLocalFiles = (path?: string | null, files = true): Promise<LocalFileEntry[]> =>
  // noToast：列目录的失败由选择器自己就地渲染（「目录加载失败: …」），
  // 再飘一条全局错误条只会重复。
  http()
    .get("/v2/file/dir/list")
    .query({ path, files })
    .noToast(true)
    .then(r => unwrap<FileDirEntry[]>(r))
    .then(rows => (rows ?? []).map(row => ({
      key: row.path,
      name: row.name,
      isDir: row.isDir !== false,
      size: row.size,
      updatedAt: row.updatedAt,
    })));

/**
 * 写入模式字典
 */
export const fetchSyncWriteModes = () =>
  http().get("/ms/monitor/datasync/write-modes").then(r => unwrap<SyncWriteMode[]>(r));

/** 批量导入：单条 CSV 列 → 目标列映射 */
export interface BulkImportMapping {
  source: string;
  target: string;
}

/** 批量导入：一个输出目标（同一个 CSV 可并行写入多个目标） */
export interface BulkImportOutput {
  targetDatasourceId: number;
  targetTable: string;
  columnMapping: BulkImportMapping[];
}

/** 批量导入请求：后端对 outputs 逐个复用原有单目标 bulk load 方法即可 */
// 用 type 而非 interface，以获得隐式索引签名（.data() 的 RequestBody 需要 Record 兼容）。
export type BulkImportPayload = {
  taskName?: string;
  filePath: string;
  delimiter: string;
  encoding: string;
  hasHeader: boolean;
  outputs: BulkImportOutput[];
};

/** 批量导入：单个输出目标的结果 */
export interface BulkImportResultOutput {
  targetDatasourceId: number;
  targetTable: string;
  status: "SUCCESS" | "FAILED";
  readCount: number;
  writeCount: number;
  costMs: number;
  message?: string;
}

/** 批量导入：汇总结果 + 每个输出目标的结果 */
export interface BulkImportResult {
  status: "SUCCESS" | "FAILED";
  readCount: number;
  writeCount: number;
  costMs: number;
  message?: string;
  outputs: BulkImportResultOutput[];
}

/**
 * 批量导入 CSV
 *
 * <p>请求体带 {@code outputs[]}。后端建议把原有单目标 bulk load 方法包一层，
 * 用 {@code Executors.newVirtualThreadPerTaskExecutor()} 循环提交每个 output，
 * 等待全部完成后按目标汇总返回。</p>
 */
export const bulkImportCsv = (data: BulkImportPayload) =>
  http().post("/ms/monitor/bulkimport").data(data).noToast(true).then(r => unwrap<BulkImportResult>(r));