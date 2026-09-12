/**
 * 文件系统管理模块 API 封装（@pages/filesystem）
 *
 * 对应后端 SysFileSystemController（spring-api-support-common-service-starter，/v2/file）：
 *   1) 全部使用 http()，URL 遵循 /v2/file/{action}
 *   2) 链式 API：.get(url).query(params) / .post(url).data(body) / .put / .delete
 *   3) 返回 Promise<ApiResult<T>>，业务侧 .then(r => r.data) 解包
 *   4) 文件上传使用 FormData 提交
 */
import { http } from "@repo/utils";
import type {
  ApiResult,
  FileListQuery,
  FileSystemStats,
  FileTaskInfo,
  InstantUploadResponse,
  SysFileSystem,
  SysFileSystemGroup,
  SysFileSystemSetting,
  UploadResult,
} from "./types";

/* ================== 文件列表 ================== */

/** 分页查询文件列表 */
export function pageForFile(params: FileListQuery) {
  return http()
    .get("/v2/file/list")
    .query(params as Record<string, unknown>)
    .then<ApiResult<{ records?: SysFileSystem[]; total?: number; current?: number; size?: number }>>(
      (r) => r.data,
    );
}

/** 删除文件 */
export function deleteFile(fileId: number) {
  return http()
    .delete(`/v2/file/${fileId}`)
    .then<ApiResult<boolean>>((r) => r.data);
}

/** 手动合并文件 */
export function mergeFile(fileId: number) {
  return http()
    .post(`/v2/file/merge/${fileId}`)
    .then<ApiResult<boolean>>((r) => r.data);
}

/** 获取文件统计信息 */
export function getFileStats() {
  return http()
    .get("/v2/file/stats")
    .then<ApiResult<FileSystemStats>>((r) => r.data);
}

/* ================== 文件上传 ================== */

/** 普通上传（multipart PUT /v2/file/upload） */
export function uploadFile(file: File, request?: { fileBucket?: string; fileName?: string; ossType?: string }) {
  const fd = new FormData();
  fd.append("file", file);
  if (request?.fileBucket) fd.append("fileBucket", request.fileBucket);
  if (request?.fileName) fd.append("fileName", request.fileName);
  if (request?.ossType) fd.append("ossType", request.ossType);
  return http()
    .put("/v2/file/upload")
    .data(fd)
    .then<ApiResult<UploadResult>>((r) => r.data);
}

/** 秒传检查 */
export function checkInstantUpload(data: { fileMd5: string; fileSize: number; fileName?: string }) {
  return http()
    .post("/v2/file/instant-check")
    .data(data as Record<string, unknown>)
    .then<ApiResult<InstantUploadResponse>>((r) => r.data);
}

/** 创建分片上传任务 */
export function createUploadTask(data: {
  fileName?: string;
  fileMd5?: string;
  fileType?: string;
  fileSummary?: string;
  fileBucket?: string;
  fileSize?: number;
}) {
  return http()
    .post("/v2/file/task/create")
    .data(data as Record<string, unknown>)
    .then<ApiResult<{ taskId?: string; url?: string }>>((r) => r.data);
}

/** 上传分片 */
export function uploadTaskPart(file: File, data: { taskId: string; fileMd5?: string; taskSeq: number; fileSize: number }) {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("taskId", data.taskId);
  if (data.fileMd5) fd.append("fileMd5", data.fileMd5);
  fd.append("taskSeq", String(data.taskSeq));
  fd.append("fileSize", String(data.fileSize));
  return http()
    .post("/v2/file/task/upload")
    .data(fd)
    .then<ApiResult<unknown>>((r) => r.data);
}

/** 获取上传任务信息（断点续传） */
export function getTaskInfo(taskId: string) {
  return http()
    .get(`/v2/file/task/info/${taskId}`)
    .then<ApiResult<FileTaskInfo>>((r) => r.data);
}

/** 根据 MD5 查找未完成的上传任务（断点续传） */
export function findTaskByMd5(fileMd5: string, fileSize?: number) {
  return http()
    .get("/v2/file/task/resume")
    .query({ fileMd5, ...(fileSize !== undefined ? { fileSize } : {}) })
    .then<ApiResult<FileTaskInfo>>((r) => r.data);
}

/* ================== 分组管理 ================== */

/** 获取分组树 */
export function listGroupTree() {
  return http()
    .get("/v2/file/group/tree")
    .then<ApiResult<SysFileSystemGroup[]>>((r) => r.data);
}

/** 获取分组列表 */
export function listGroup() {
  return http()
    .get("/v2/file/group/list")
    .then<ApiResult<SysFileSystemGroup[]>>((r) => r.data);
}

/** 新增分组 */
export function saveGroup(data: SysFileSystemGroup) {
  return http()
    .post("/v2/file/group")
    .data(data as Record<string, unknown>)
    .then<ApiResult<SysFileSystemGroup>>((r) => r.data);
}

/** 更新分组 */
export function updateGroup(data: SysFileSystemGroup) {
  return http()
    .put("/v2/file/group")
    .data(data as Record<string, unknown>)
    .then<ApiResult<boolean>>((r) => r.data);
}

/** 删除分组 */
export function deleteGroup(groupId: number) {
  return http()
    .delete(`/v2/file/group/${groupId}`)
    .then<ApiResult<boolean>>((r) => r.data);
}

/** 初始化默认分组 */
export function initDefaultGroups() {
  return http()
    .post("/v2/file/group/init")
    .then<ApiResult<boolean>>((r) => r.data);
}

/* ================== 存储配置 ================== */

/** 获取文件系统配置 */
export function getFileSetting() {
  return http()
    .get("/v2/file/setting")
    .then<ApiResult<SysFileSystemSetting>>((r) => r.data);
}

/** 更新文件系统配置 */
export function updateFileSetting(data: SysFileSystemSetting) {
  return http()
    .put("/v2/file/setting")
    .data(data as Record<string, unknown>)
    .then<ApiResult<boolean>>((r) => r.data);
}

/* ================== HTTP 文件服务器 ================== */

/** 启动文件服务器 */
export function startFileServer() {
  return http()
    .post("/v2/file/server/start")
    .then<ApiResult<boolean>>((r) => r.data);
}

/** 停止文件服务器 */
export function stopFileServer() {
  return http()
    .post("/v2/file/server/stop")
    .then<ApiResult<boolean>>((r) => r.data);
}

/** 获取文件服务器状态 */
export function getFileServerStatus() {
  return http()
    .get("/v2/file/server/status")
    .then<ApiResult<string>>((r) => r.data);
}

/** 检查端口是否可用 */
export function checkFileServerPort(port: number) {
  return http()
    .get("/v2/file/server/check-port")
    .query({ port })
    .then<ApiResult<boolean>>((r) => r.data);
}