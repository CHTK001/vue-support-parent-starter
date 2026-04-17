/**
 * 通用远程 API 工厂
 *
 * 通过传入 basePath（只需 path，不需要完整 URL），
 * 生成一套文件管理 + 项目管理的 API 函数。
 *
 * 使用示例：
 *   // panel 里（Nginx SSH 连接）
 *   const api = createRemoteApi(`/v1/panel/nginx/${connectionId}`)
 *
 *   // server 里（服务器管理）
 *   const api = createRemoteApi(`/server/hosts/${serverId}`)
 */

import { http } from "@repo/utils";
import type { ReturnResult } from "@repo/utils";

// ─── 文件管理类型 ──────────────────────────────────────────────────────────────

export interface RemoteFileEntry {
  name: string;
  path: string;
  directory: boolean;
  file: boolean;
  hidden?: boolean;
  size?: number;
  lastModified?: number;
  extension?: string;
}

export interface RemoteFileContent {
  path: string;
  content: string;
  size?: number;
  truncated?: boolean;
  language?: string;
}

export interface RemoteFileOperationResult {
  success?: boolean;
  message?: string;
  path?: string;
  targetPath?: string;
}

/** 上传规则 */
export interface RemoteUploadOptions {
  /** 上传前清空目标目录 */
  clearBefore?: boolean;
  /** 上传后自动解压（zip/tar.gz） */
  autoExtract?: boolean;
  /** 解压后删除压缩包 */
  deleteArchiveAfterExtract?: boolean;
  /** 目标目录（不填则上传到根目录） */
  directory?: string;
  /** 备份原有文件（清空前先备份） */
  backupBefore?: boolean;
  /** 备份目录 */
  backupDirectory?: string;
}

export interface RemoteUploadResult {
  success?: boolean;
  message?: string;
  uploadedPath?: string;
  extractedPath?: string;
  backupPath?: string;
  filesCount?: number;
}

// ─── 项目管理类型 ──────────────────────────────────────────────────────────────

export type ProjectType =
  | "springboot"
  | "tomcat"
  | "nodejs"
  | "python"
  | "static"
  | "docker"
  | "custom";

export interface RemoteProject {
  projectId?: string;
  projectName: string;
  projectType: ProjectType;
  /** 项目根目录 */
  rootDirectory: string;
  /** 依赖目录（如 lib/） */
  libDirectory?: string;
  /** 配置目录（如 conf/） */
  configDirectory?: string;
  /** 日志目录 */
  logDirectory?: string;
  /** 启动脚本路径 */
  startScript?: string;
  /** 停止脚本路径 */
  stopScript?: string;
  /** 重启脚本路径 */
  restartScript?: string;
  /** 状态检查脚本 */
  statusScript?: string;
  /** 主 jar/war 文件名（SpringBoot/Tomcat） */
  mainArtifact?: string;
  /** JVM 参数（SpringBoot） */
  jvmArgs?: string;
  /** 运行状态 */
  runtimeStatus?: "running" | "stopped" | "unknown" | "error";
  /** 进程 PID */
  pid?: number;
  /** 描述 */
  description?: string;
  /** 最后操作时间 */
  lastOperationTime?: string;
  /** 最后操作信息 */
  lastOperationMessage?: string;
  /** 备份列表 */
  backups?: RemoteProjectBackup[];
}

export interface RemoteProjectBackup {
  backupId?: string;
  backupPath: string;
  backupTime: string;
  size?: number;
  note?: string;
}

export interface RemoteProjectOperationResult {
  success?: boolean;
  message?: string;
  output?: string;
  pid?: number;
  runtimeStatus?: string;
  backupPath?: string;
}

export interface RemoteDeployOptions {
  /** 上传规则 */
  uploadOptions?: RemoteUploadOptions;
  /** 部署前停止服务 */
  stopBeforeDeploy?: boolean;
  /** 部署后启动服务 */
  startAfterDeploy?: boolean;
  /** 部署前备份 */
  backupBefore?: boolean;
}

// ─── API 工厂 ──────────────────────────────────────────────────────────────────

/**
 * 创建通用远程 API 实例。
 * @param basePath 只需 path 部分，如 "/v1/panel/nginx/xxx" 或 "/server/hosts/1"
 */
export function createRemoteApi(basePath: string) {
  const p = (sub: string) => `${basePath}${sub}`;

  // ── 文件管理 ────────────────────────────────────────────────────────────────

  const listFiles = (path?: string) =>
    http.request<ReturnResult<RemoteFileEntry[]>>("get", p("/files"), {
      params: { path },
    });

  const readFileContent = (path: string, maxBytes?: number) =>
    http.request<ReturnResult<RemoteFileContent>>("get", p("/files/content"), {
      params: { path, maxBytes },
    });

  const writeFileContent = (path: string, content: string) =>
    http.request<ReturnResult<RemoteFileOperationResult>>(
      "put",
      p("/files/content"),
      { data: { path, content } }
    );

  const downloadFile = (path: string): string =>
    `${p("/files/download")}?path=${encodeURIComponent(path)}`;

  /**
   * 上传文件（支持规则：清空/备份/自动解压）
   */
  const uploadFile = (
    file: File,
    options?: RemoteUploadOptions
  ) => {
    const formData = new FormData();
    formData.append("file", file);
    if (options?.directory) formData.append("directory", options.directory);
    if (options?.clearBefore) formData.append("clearBefore", "true");
    if (options?.autoExtract) formData.append("autoExtract", "true");
    if (options?.deleteArchiveAfterExtract)
      formData.append("deleteArchiveAfterExtract", "true");
    if (options?.backupBefore) formData.append("backupBefore", "true");
    if (options?.backupDirectory)
      formData.append("backupDirectory", options.backupDirectory);
    return http.request<ReturnResult<RemoteUploadResult>>(
      "post",
      p("/files/upload"),
      { data: formData }
    );
  };

  const createDirectory = (path: string) =>
    http.request<ReturnResult<RemoteFileOperationResult>>(
      "post",
      p("/files/directories"),
      { params: { path } }
    );

  const renameFile = (path: string, targetPath: string) =>
    http.request<ReturnResult<RemoteFileOperationResult>>(
      "put",
      p("/files/rename"),
      { data: { path, targetPath } }
    );

  const deleteFile = (path: string, recursive = false) =>
    http.request<ReturnResult<RemoteFileOperationResult>>(
      "delete",
      p("/files"),
      { params: { path, recursive } }
    );

  // ── 项目管理 ────────────────────────────────────────────────────────────────

  const listProjects = () =>
    http.request<ReturnResult<RemoteProject[]>>("get", p("/projects"));

  const getProject = (projectId: string) =>
    http.request<ReturnResult<RemoteProject>>(
      "get",
      p(`/projects/${projectId}`)
    );

  const createProject = (project: RemoteProject) =>
    http.request<ReturnResult<RemoteProject>>("post", p("/projects"), {
      data: project,
    });

  const updateProject = (projectId: string, project: RemoteProject) =>
    http.request<ReturnResult<RemoteProject>>(
      "put",
      p(`/projects/${projectId}`),
      { data: project }
    );

  const deleteProject = (projectId: string) =>
    http.request<ReturnResult<void>>(
      "delete",
      p(`/projects/${projectId}`)
    );

  const startProject = (projectId: string) =>
    http.request<ReturnResult<RemoteProjectOperationResult>>(
      "post",
      p(`/projects/${projectId}/start`)
    );

  const stopProject = (projectId: string) =>
    http.request<ReturnResult<RemoteProjectOperationResult>>(
      "post",
      p(`/projects/${projectId}/stop`)
    );

  const restartProject = (projectId: string) =>
    http.request<ReturnResult<RemoteProjectOperationResult>>(
      "post",
      p(`/projects/${projectId}/restart`)
    );

  const getProjectStatus = (projectId: string) =>
    http.request<ReturnResult<RemoteProjectOperationResult>>(
      "get",
      p(`/projects/${projectId}/status`)
    );

  const getProjectLogs = (projectId: string, lines = 100) =>
    http.request<ReturnResult<string>>(
      "get",
      p(`/projects/${projectId}/logs`),
      { params: { lines } }
    );

  const backupProject = (projectId: string, note?: string) =>
    http.request<ReturnResult<RemoteProjectOperationResult>>(
      "post",
      p(`/projects/${projectId}/backup`),
      { data: { note } }
    );

  const rollbackProject = (projectId: string, backupId: string) =>
    http.request<ReturnResult<RemoteProjectOperationResult>>(
      "post",
      p(`/projects/${projectId}/rollback`),
      { data: { backupId } }
    );

  const listProjectBackups = (projectId: string) =>
    http.request<ReturnResult<RemoteProjectBackup[]>>(
      "get",
      p(`/projects/${projectId}/backups`)
    );

  /**
   * 一键部署：上传包 → 备份 → 清空 → 解压 → 重启
   */
  const deployProject = (
    projectId: string,
    file: File,
    options?: RemoteDeployOptions
  ) => {
    const formData = new FormData();
    formData.append("file", file);
    // 后端用 @RequestParam，通过 URL 参数传递选项
    const params: Record<string, string> = {};
    if (options?.stopBeforeDeploy !== undefined) params.stopBefore = String(options.stopBeforeDeploy);
    if (options?.startAfterDeploy !== undefined) params.startAfter = String(options.startAfterDeploy);
    if (options?.backupBefore !== undefined) params.backupBefore = String(options.backupBefore);
    if (options?.uploadOptions?.clearBefore !== undefined) params.clearBefore = String(options.uploadOptions.clearBefore);
    if (options?.uploadOptions?.autoExtract !== undefined) params.autoExtract = String(options.uploadOptions.autoExtract);
    if (options?.uploadOptions?.deleteArchiveAfterExtract !== undefined) params.deleteArchive = String(options.uploadOptions.deleteArchiveAfterExtract);
    return http.request<ReturnResult<RemoteProjectOperationResult>>(
      "post",
      p(`/projects/${projectId}/deploy`),
      { data: formData, params }
    );
  };

  return {
    basePath,
    // 文件管理
    listFiles,
    readFileContent,
    writeFileContent,
    downloadFile,
    uploadFile,
    createDirectory,
    renameFile,
    deleteFile,
    // 项目管理
    listProjects,
    getProject,
    createProject,
    updateProject,
    deleteProject,
    startProject,
    stopProject,
    restartProject,
    getProjectStatus,
    getProjectLogs,
    backupProject,
    rollbackProject,
    listProjectBackups,
    deployProject,
  };
}

/** API 实例类型，方便组件 props 类型声明 */
export type RemoteApi = ReturnType<typeof createRemoteApi>;

// ─── 项目管理连接工厂 ──────────────────────────────────────────────────────────

export interface ServerProjectConnectRequest {
  /** SSH / WINRM / LOCAL */
  serverType?: string;
  host?: string;
  port?: number;
  username?: string;
  /** 密码（明文或加密，由调用方约定） */
  password?: string;
  privateKey?: string;
  osType?: string;
}

/**
 * 建立项目管理连接，返回 connectionId。
 * 后端不持久化账号信息，TTL 30min。
 */
export const connectServerProject = (req: ServerProjectConnectRequest) =>
  http.request<ReturnResult<string>>("post", "/v1/server/project/connect", {
    data: req,
  });

export const disconnectServerProject = (connectionId: string) =>
  http.request<ReturnResult<void>>("delete", `/v1/server/project/${connectionId}/disconnect`);

/**
 * 获取服务器项目连接的 RSA 公钥
 * @returns PEM 格式公钥字符串
 */
export const fetchServerProjectPublicKey = () =>
  http.request<ReturnResult<string>>("get", "/v1/server/project/public-key");

/**
 * 建立连接后创建 RemoteApi 实例。
 * 使用示例：
 *   const { data: cid } = await connectServerProject({ serverType: 'SSH', host, port, username, password })
 *   const api = createServerProjectApi(cid)
 */
export const createServerProjectApi = (connectionId: string) =>
  createRemoteApi(`/v1/server/project/${connectionId}`);
