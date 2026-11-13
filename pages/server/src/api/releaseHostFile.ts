/**
 * 发布管理「主机文件」接口（运行本服务的这台机器）。
 *
 * <p>浏览 / 删除走 server-starter 的 {@code /ms/server/host-file/*}，上传走
 * filesystem-starter 的 {@code /v2/file/upload-task/*}——分片、进度与断点都在那边，
 * 这里只做调用编排，避免发布模块再写一套上传。</p>
 *
 * <p><b>鉴权差异：</b>{@code /v2/file/**} 认的是 {@code x-oauth-token}（文件网关的入口约定），
 * 与业务接口的 {@code token} 头不是同一个；漏带会直接 403，而且报错信息看起来像没权限。</p>
 *
 * @author CH
 * @since 4.0.0.52
 */
import { getAccessToken, http, unwrapResult } from "@repo/utils";

/** 文件网关鉴权头 */
const fileAuth = () => ({ "x-oauth-token": getAccessToken() ?? "" });

/** 主机文件条目 */
export interface ReleaseHostFileItem {
  name: string;
  /** 相对存储桶的 key，删除与下载都用它 */
  key: string;
  size: number;
  directory: boolean;
  lastModified?: number;
  /** 该文件在主机上的绝对路径；目录没有。后端算好，前端别自己拼 */
  hostPath?: string;
}

/** 主机文件根信息 */
export interface ReleaseHostFileConfig {
  enabled: boolean;
  bucket?: string;
  root?: string;
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

/**
 * 取主机文件根信息。
 *
 * @returns 根信息；后端未装配文件存储时 enabled=false
 */
export const getReleaseHostFileConfig = () =>
  http()
    .get("/ms/server/host-file/config")
    .then((r) => unwrapResult<ReleaseHostFileConfig>(r));

/**
 * 列目录。
 *
 * @param path 目录 key（相对桶根），留空为根
 * @returns 条目列表与总数
 */
export const listReleaseHostFiles = (path?: string) =>
  http()
    .get("/ms/server/host-file/list")
    .query({ path: path || undefined })
    .then((r) => unwrapResult<{ items: ReleaseHostFileItem[]; total: number }>(r));

/**
 * 删除文件。
 *
 * @param key 文件 key
 * @returns 是否删除成功
 */
export const deleteReleaseHostFile = (key: string) =>
  http()
    .delete("/ms/server/host-file")
    .query({ key })
    .then((r) => unwrapResult<boolean>(r));

/**
 * 创建上传任务。
 *
 * @param fileName  文件名
 * @param totalSize 字节数
 * @param chunkSize 分片大小
 * @returns 任务快照（含 taskId / totalChunks）
 */
export const createUploadTask = (fileName: string, totalSize: number, chunkSize: number) =>
  http()
    .post("/v2/file/upload-task/task")
    .headers(fileAuth())
    .data({ fileName, totalSize, chunkSize })
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
    .then((r) => unwrapResult<unknown>(r));

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
 * 计算主机文件 MD5（按需，流式读取）。
 *
 * @param key 文件 key
 * @returns md5 / size / elapsedMs
 */
export const getReleaseHostFileMd5 = (key: string) =>
  http()
    .get("/ms/server/host-file/md5")
    .query({ key })
    .then((r) => unwrapResult<{ md5: string; size: number; elapsedMs: number }>(r));

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
