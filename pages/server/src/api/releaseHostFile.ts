/**
 * 发布管理「主机文件」接口（运行本服务的这台机器）。
 *
 * <p>浏览 / 目录管理 / 下载走 server-starter 的 {@code /ms/server/host-file/*}，
 * 上传走 filesystem-starter 的 {@code /v2/file/upload-task/*}——分片、进度与断点都在那边，
 * 这里只做调用编排。</p>
 *
 * <p><b>两处容易踩的空值：</b></p>
 * <ul>
 *   <li>上传任务的 {@code bucket} 是「目标目录 key」而不是存储桶名：把当前浏览目录传进去，
 *       文件才会落在你正看着的文件夹里；漏传会一律落到存储根。</li>
 *   <li>{@code /v2/file/**} 认 {@code x-oauth-token}，业务接口认 {@code token}；
 *       漏带会 403，而且报错看起来像没权限。</li>
 * </ul>
 *
 * @author CH
 * @since 4.0.0.52
 */
import { getAccessToken, http, unwrapResult } from "@repo/utils";

/** 文件网关鉴权头 */
const fileAuth = () => ({ "x-oauth-token": getAccessToken() ?? "" });

/** 文件类型（后端判定，前端只按它选图标与筛选项） */
export type ReleaseHostFileKind =
  | "folder"
  | "package"
  | "archive"
  | "image"
  | "text"
  | "code"
  | "media"
  | "other";

/** 主机文件条目 */
export interface ReleaseHostFileItem {
  /** 条目名称 */
  name: string;
  /** 相对存储根的 key，所有操作都用它 */
  key: string;
  /** 所在目录 key（根目录为空串） */
  parent: string;
  /** 字节数（目录为 0） */
  size: number;
  /** 是否目录 */
  directory: boolean;
  /** 最后修改时间（毫秒） */
  lastModified: number;
  /** 类型 */
  kind: ReleaseHostFileKind;
  /** 小写扩展名 */
  ext: string;
  /** 本机绝对路径；非本地存储或目录为空 */
  hostPath?: string;
  /** 已登记并复核的 MD5（上传时服务端复核入库）；无记录为空 */
  md5?: string;
}

/** 主机文件存储信息 */
export interface ReleaseHostFileConfig {
  enabled: boolean;
  /** 当前存储提供者名 */
  bucket: string;
  /** 本机存储根目录；非本地存储为空串 */
  root: string;
  /** 是否本地存储（可算 MD5 / 重命名 / 建目录 / 有主机绝对路径） */
  local: boolean;
  /** 可切换的提供者 */
  buckets: string[];
  defaultBucket: string;
}

/** 目录页 */
export interface ReleaseHostFilePage {
  path: string;
  keyword: string;
  items: ReleaseHostFileItem[];
  /** 命中总数 */
  total: number;
  /** 本次扫描条目数 */
  scanned: number;
  /** 目录过大时只扫了前若干条 */
  truncated: boolean;
}

/** 批量删除结果 */
export interface ReleaseHostFileDeleteResult {
  succeeded: number;
  failed: number;
  failures: string[];
}

/** 上传任务快照（与 filesystem-starter 的 UploadTask 对齐的最小切片） */
export interface ReleaseUploadTask {
  taskId?: string;
  fileName?: string;
  totalSize?: number;
  receivedBytes?: number;
  receivedChunks?: number;
  totalChunks?: number;
  state?: string;
  objectKey?: string;
}

/** 排序字段 */
export type ReleaseHostFileSort = "name" | "size" | "time";

/** 排序方向 */
export type ReleaseHostFileOrder = "asc" | "desc";

/** 列目录参数 */
export interface ReleaseHostFileListQuery {
  path?: string;
  bucket?: string;
  keyword?: string;
  sort?: ReleaseHostFileSort;
  order?: ReleaseHostFileOrder;
  limit?: number;
  offset?: number;
}

/**
 * 取主机文件存储信息。
 *
 * @param bucket 存储提供者名（留空用默认提供者）
 * @returns 启用状态 / 根目录 / 可切换提供者
 */
export const getReleaseHostFileConfig = (bucket?: string) =>
  http()
    .get("/ms/server/host-file/config")
    .query({ bucket: bucket || undefined })
    .then((r) => unwrapResult<ReleaseHostFileConfig>(r));

/**
 * 列目录。
 *
 * @param query 目录 / 关键字 / 排序 / 分页
 * @returns 目录页
 */
export const listReleaseHostFiles = (query: ReleaseHostFileListQuery | string = {}) => {
  const q: ReleaseHostFileListQuery = typeof query === "string" ? { path: query } : query;
  return http()
    .get("/ms/server/host-file/list")
    .query({
      bucket: q.bucket || undefined,
      path: q.path || undefined,
      keyword: q.keyword || undefined,
      sort: q.sort || undefined,
      order: q.order || undefined,
      limit: q.limit ?? undefined,
      offset: q.offset ?? undefined,
    })
    .then((r) => unwrapResult<ReleaseHostFilePage>(r));
};

/**
 * 新建目录。
 *
 * @param path   父目录 key
 * @param name   目录名
 * @param bucket 存储提供者名
 * @returns 新目录条目
 */
export const mkdirReleaseHostDir = (path: string, name: string, bucket?: string) =>
  http()
    .post("/ms/server/host-file/dir")
    .query({ bucket: bucket || undefined, path: path || undefined, name })
    .then((r) => unwrapResult<ReleaseHostFileItem>(r));

/**
 * 重命名。
 *
 * @param key    目标 key
 * @param name   新名称
 * @param bucket 存储提供者名
 * @returns 重命名后的条目
 */
export const renameReleaseHostFile = (key: string, name: string, bucket?: string) =>
  http()
    .put("/ms/server/host-file/rename")
    .query({ bucket: bucket || undefined, key, name })
    .then((r) => unwrapResult<ReleaseHostFileItem>(r));

/**
 * 移动到另一个目录。
 *
 * @param key       目标 key
 * @param targetDir 目标目录 key（根目录传空串）
 * @param bucket    存储提供者名
 * @returns 移动后的条目
 */
export const moveReleaseHostFile = (key: string, targetDir: string, bucket?: string) =>
  http()
    .put("/ms/server/host-file/move")
    .query({ bucket: bucket || undefined, key, targetDir: targetDir || "" })
    .then((r) => unwrapResult<ReleaseHostFileItem>(r));

/**
 * 删除文件或目录。
 *
 * @param key    文件 key
 * @param bucket 存储提供者名
 * @returns 是否删除成功
 */
export const deleteReleaseHostFile = (key: string, bucket?: string) =>
  http()
    .delete("/ms/server/host-file")
    .query({ bucket: bucket || undefined, key })
    .then((r) => unwrapResult<boolean>(r));

/**
 * 批量删除。
 *
 * @param keys   文件 key 列表
 * @param bucket 存储提供者名
 * @returns 成功 / 失败汇总
 */
export const deleteReleaseHostFiles = (keys: string[], bucket?: string) =>
  http()
    .post("/ms/server/host-file/delete")
    .query({ bucket: bucket || undefined })
    .data(keys)
    .then((r) => unwrapResult<ReleaseHostFileDeleteResult>(r));

/**
 * 计算 MD5（仅本地存储）。
 *
 * @param key    文件 key
 * @param bucket 存储提供者名
 * @returns md5 / size / elapsedMs
 */
export const getReleaseHostFileMd5 = (key: string, bucket?: string) =>
  http()
    .get("/ms/server/host-file/md5")
    .query({ bucket: bucket || undefined, key })
    .then((r) => unwrapResult<{ md5: string; size: number; elapsedMs: number }>(r));

/**
 * 复核并登记 MD5（上传完成后调用）。
 *
 * <p>前端把本地算出的整文件 MD5 带给后端，服务端按落盘文件重算一遍，
 * 一致才写入台账；之后的列表直接显示台账值。不一致会返回失败，需要重新上传。</p>
 *
 * @param key    文件 key
 * @param md5    声明的 MD5（小写 hex）
 * @param bucket 存储提供者名
 * @returns 复核后的实际 MD5
 */
export const confirmReleaseHostFileMd5 = (key: string, md5: string, bucket?: string) =>
  http()
    .post("/ms/server/host-file/md5/confirm")
    .query({ bucket: bucket || undefined, key, md5 })
    .then((r) => unwrapResult<string>(r));

/**
 * 下载文件为 Blob。
 *
 * @param key    文件 key
 * @param bucket 存储提供者名
 * @param inline 为真时按内容类型内联（图片 / 文本预览）
 * @returns 文件内容
 */
export const downloadReleaseHostFile = (key: string, bucket?: string, inline = false) =>
  http()
    .get("/ms/server/host-file/download")
    .query({ bucket: bucket || undefined, key, inline: inline || undefined })
    .responseType("blob")
    .then((r) => r.data as Blob);

/**
 * 读取文本文件开头（256KB 上限）。
 *
 * @param key    文件 key
 * @param bucket 存储提供者名
 * @returns 文本内容
 */
export const readReleaseHostFileText = (key: string, bucket?: string) =>
  http()
    .get("/ms/server/host-file/text")
    .query({ bucket: bucket || undefined, key })
    .then((r) => unwrapResult<string>(r));

/**
 * 创建上传任务。
 *
 * @param fileName  文件名
 * @param totalSize 字节数
 * @param chunkSize 分片大小
 * @param dir       目标目录 key（空串表示存储根）
 * @param provider  存储提供者名
 * @param md5       整文件 MD5（小写 hex，可空；后端合并后按它整文件校验）
 * @returns 任务快照（含 taskId / totalChunks）
 */
export const createUploadTask = (
  fileName: string,
  totalSize: number,
  chunkSize: number,
  dir?: string,
  provider?: string,
  md5?: string,
) =>
  http()
    .post("/v2/file/upload-task/task")
    .headers(fileAuth())
    .data({
      fileName,
      totalSize,
      chunkSize,
      bucket: dir || undefined,
      provider: provider || undefined,
      md5: md5 || undefined,
    })
    .then((r) => unwrapResult<ReleaseUploadTask>(r));

/**
 * 上传一个分片。
 *
 * @param taskId 任务 ID
 * @param index  分片序号（从 0 开始）
 * @param chunk  分片内容
 * @returns 上传后的任务快照
 */
export const uploadTaskChunk = (taskId: string, index: number, chunk: Blob) =>
  http()
    .put(`/v2/file/upload-task/task/${taskId}/chunk`)
    .query({ index })
    .headers({ ...fileAuth(), "Content-Type": "application/octet-stream" })
    .data(chunk)
    .then((r) => unwrapResult<ReleaseUploadTask>(r));

/**
 * 触发合并（异步）。
 *
 * @param taskId 任务 ID
 * @returns 受理结果
 */
export const completeUploadTask = (taskId: string) =>
  http()
    .post(`/v2/file/upload-task/task/${taskId}/complete`)
    .headers(fileAuth())
    .then((r) => unwrapResult<ReleaseUploadTask>(r));

/**
 * 查询单个任务状态（SSE 不可用时的兜底）。
 *
 * @param taskId 任务 ID
 * @returns 任务快照
 */
export const getUploadTask = (taskId: string) =>
  http()
    .get(`/v2/file/upload-task/task/${taskId}`)
    .headers(fileAuth())
    .then((r) => unwrapResult<ReleaseUploadTask>(r));

/**
 * 订阅全局上传进度（一条流广播所有任务，不按 task 单独开）。
 *
 * @param onTask 任一项任务快照变化
 * @returns 关闭句柄
 */
export function subscribeUploadTasks(onTask: (task: ReleaseUploadTask) => void): { close(): void } {
  const client = http()
    .get("/v2/file/upload-task/events")
    .headers(fileAuth())
    .sse<{ type?: string; task?: ReleaseUploadTask; tasks?: ReleaseUploadTask[] }>({
      // 生成类请求才需要关闭重连；进度流允许重连，但页面离开时必须主动关
      reconnect: true,
      onMessage: (e) => {
        const frame = e.data;
        if (!frame) {
          return;
        }
        if (frame.task) {
          onTask(frame.task);
        } else if (Array.isArray(frame.tasks)) {
          frame.tasks.forEach(onTask);
        }
      },
    });
  return { close: () => client.close() };
}

/**
 * 把浏览器选中的文件上传进主机文件存储，并返回落盘后的条目。
 *
 * <p>升级弹框里的「直接上传」用它：上传完成后需要拿到带 {@code hostPath} 的条目
 * 才能回填产物路径。合并是异步的，所以合并后短暂轮询目录直到文件出现。</p>
 *
 * @param file       浏览器选中的文件
 * @param dir        目标目录 key（空串表示存储根）
 * @param onProgress 进度回调（0-100）
 * @returns 落盘后的条目；未在目录里找到时返回 null
 */
export const uploadReleaseHostFile = async (
  file: File,
  dir = "",
  onProgress?: (percent: number) => void,
): Promise<ReleaseHostFileItem | null> => {
  const chunkSize = 5 * 1024 * 1024;
  const task = await createUploadTask(file.name, file.size, chunkSize, dir);
  const taskId = String(task?.taskId || "");
  if (!taskId) {
    throw new Error("未返回 taskId");
  }
  const sse = subscribeUploadTasks((t) => {
    if (t.taskId === taskId && t.totalSize) {
      onProgress?.(Math.min(100, Math.round((Number(t.receivedBytes || 0) / Number(t.totalSize)) * 100)));
    }
  });
  try {
    const total = Math.max(1, Math.ceil(file.size / chunkSize));
    for (let i = 0; i < total; i++) {
      const blob = file.slice(i * chunkSize, Math.min(file.size, (i + 1) * chunkSize));
      const snap = await uploadTaskChunk(taskId, i, blob);
      if (snap?.totalSize) {
        onProgress?.(Math.min(100, Math.round((Number(snap.receivedBytes || 0) / Number(snap.totalSize)) * 100)));
      } else {
        onProgress?.(Math.round(((i + 1) / total) * 100));
      }
    }
    await completeUploadTask(taskId);
    onProgress?.(100);
  } finally {
    sse.close();
  }
  // 合并是异步的：短暂轮询目录，直到文件出现并带上 hostPath
  for (let attempt = 0; attempt < 12; attempt++) {
    const page = await listReleaseHostFiles({ path: dir, limit: 500 });
    const hit = (page?.items || []).find((item) => !item.directory && item.name === file.name);
    if (hit) {
      return hit;
    }
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
  return null;
};

/**
 * 用主机文件里的产物升级。
 *
 * <p>包在运行本服务的这台机器上，后端负责推到目标主机 uploads/ 再投放；
 * 前端不需要知道目标机路径。</p>
 *
 * @param projectId 项目 ID
 * @param key       主机文件 key
 * @param config    升级配置（与手动升级同一套字段）
 * @returns 异步任务 ID
 */
export const upgradeFromHostFile = (
  projectId: number,
  key: string,
  config: Record<string, unknown>,
) =>
  http()
    .post(`/ms/server/release/project/${projectId}/upgrade/from-host-file`)
    .data({ key, ...config })
    .then((r) => unwrapResult<string>(r));

/**
 * 把主机文件里的产物投放到目标主机的 uploads/（只投放，不触发升级）。
 *
 * <p>「主机文件」操作列的「上传项目」用它：先生成完整的发布 / 项目两级选择，
 * 选中的包直接推到目标机，是否升级由用户在发布管理里决定。</p>
 *
 * @param projectId 项目 ID
 * @param key       主机文件 key
 * @returns 目标机上的最终包路径
 */
export const pushReleaseHostFileToProject = (projectId: number, key: string) =>
  http()
    .post(`/ms/server/release/project/${projectId}/push/from-host-file`)
    .data({ key })
    .then((r) => unwrapResult<string>(r));
