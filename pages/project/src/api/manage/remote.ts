/**
 * 通用远程 API 工厂
 *
 * 通过传入 basePath（只需 path，不需要完整 URL），
 * 生成一套文件管理 + 项目管理的 API 函数。
 *
 * 使用示例：
 *   // 项目远程管理（推荐）
 *   const api = createRemoteApi(`/v2/project/${sysProjectId}/remote`)
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
  | "service"
  | "springboot"
  | "springboot_resource_split"
  | "springboot_resource_isolation"
  | "springboot_resource_separation"
  | "tomcat"
  | "static"

export interface RemoteProject {
  projectId?: string;
  projectName: string;
  projectType: ProjectType | string;
  /** 项目根目录 */
  rootDirectory: string;
  /** 依赖目录（如 lib/） */
  libDirectory?: string;
  /** 配置目录（如 conf/） */
  configDirectory?: string;
  /** Tomcat 安装目录 */
  tomcatHome?: string;
  /** 日志目录 */
  logDirectory?: string;
  /** 启动日志文件（优先用于“查看日志”） */
  startupLogFile?: string;
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
  /** 主包 MD5（部署后自动回填） */
  mainArtifactMd5?: string;
  /** JVM 参数（SpringBoot） */
  jvmArgs?: string;
  /** Spring 启动参数（如 --spring.profiles.active=prod --server.port=8080） */
  springArgs?: string;
  /** 健康检查地址（Spring 单体/资源分离默认 actuator health） */
  healthCheckUrl?: string;
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
  /** 定向上传目录（前端本地态，资源分离卡片选择时使用） */
  targetDirectory?: string;
  /** 部署前停止服务 */
  stopBeforeDeploy?: boolean;
  /** 部署后启动服务 */
  startAfterDeploy?: boolean;
  /** 部署前备份 */
  backupBefore?: boolean;
  /** 部署前执行配置目录核对 */
  configCheckBeforeDeploy?: boolean;
  /** 部署前执行依赖目录核对 */
  dependencyCheckBeforeDeploy?: boolean;
}

// ─── API 工厂 ──────────────────────────────────────────────────────────────────

/**
 * 创建通用远程 API 实例。
 * @param basePath 只需 path 部分，如 "/v2/project/1/remote"
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
      { data: { path, content } },
    );

  const downloadFile = (path: string): string =>
    `${p("/files/download")}?path=${encodeURIComponent(path)}`;

  /**
   * 上传文件（支持规则：清空/备份/自动解压）
   */
  const uploadFile = (file: File, options?: RemoteUploadOptions) => {
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
      { data: formData },
    );
  };

  const createDirectory = (path: string) =>
    http.request<ReturnResult<RemoteFileOperationResult>>(
      "post",
      p("/files/directories"),
      { params: { path } },
    );

  const renameFile = (path: string, targetPath: string) =>
    http.request<ReturnResult<RemoteFileOperationResult>>(
      "put",
      p("/files/rename"),
      { data: { path, targetPath } },
    );

  const deleteFile = (path: string, recursive = false) =>
    http.request<ReturnResult<RemoteFileOperationResult>>(
      "delete",
      p("/files"),
      { params: { path, recursive } },
    );

  // ── 项目管理 ────────────────────────────────────────────────────────────────

  const listProjects = () =>
    http.request<ReturnResult<RemoteProject[]>>("get", p("/projects"));

  const getProject = (projectId: string) =>
    http.request<ReturnResult<RemoteProject>>(
      "get",
      p(`/projects/${projectId}`),
    );

  const createProject = (project: RemoteProject) =>
    http.request<ReturnResult<RemoteProject>>("post", p("/projects"), {
      data: project,
    });

  const updateProject = (projectId: string, project: RemoteProject) =>
    http.request<ReturnResult<RemoteProject>>(
      "put",
      p(`/projects/${projectId}`),
      { data: project },
    );

  const deleteProject = (projectId: string) =>
    http.request<ReturnResult<void>>("delete", p(`/projects/${projectId}`));

  const startProject = (projectId: string) =>
    http.request<ReturnResult<RemoteProjectOperationResult>>(
      "post",
      p(`/projects/${projectId}/start`),
    );

  const stopProject = (projectId: string) =>
    http.request<ReturnResult<RemoteProjectOperationResult>>(
      "post",
      p(`/projects/${projectId}/stop`),
    );

  const restartProject = (projectId: string) =>
    http.request<ReturnResult<RemoteProjectOperationResult>>(
      "post",
      p(`/projects/${projectId}/restart`),
    );

  const getProjectStatus = (projectId: string) =>
    http.request<ReturnResult<RemoteProjectOperationResult>>(
      "get",
      p(`/projects/${projectId}/status`),
    );

  const getProjectLogs = (projectId: string, lines = 100) =>
    http.request<ReturnResult<string>>(
      "get",
      p(`/projects/${projectId}/logs`),
      { params: { lines }, showLoading: false },
    );

  const getProjectDeployLogs = (projectId: string, lines = 200) =>
    http.request<ReturnResult<string>>(
      "get",
      p(`/projects/${projectId}/deploy-logs`),
      { params: { lines }, showLoading: false },
    );

  const backupProject = (projectId: string, note?: string) =>
    http.request<ReturnResult<RemoteProjectOperationResult>>(
      "post",
      p(`/projects/${projectId}/backup`),
      { data: { note } },
    );

  const rollbackProject = (projectId: string, backupId: string) =>
    http.request<ReturnResult<RemoteProjectOperationResult>>(
      "post",
      p(`/projects/${projectId}/rollback`),
      { data: { backupId } },
    );

  const listProjectBackups = (projectId: string) =>
    http.request<ReturnResult<RemoteProjectBackup[]>>(
      "get",
      p(`/projects/${projectId}/backups`),
    );

  /**
   * 一键部署：上传包 → 备份 → 清空 → 解压 → 重启
   */
  const deployProject = (
    projectId: string,
    file: File,
    options?: RemoteDeployOptions,
  ) => {
    const formData = new FormData();
    formData.append("file", file);
    // 后端用 @RequestParam，通过 URL 参数传递选项
    const params: Record<string, string> = {};
    if (options?.stopBeforeDeploy !== undefined)
      params.stopBefore = String(options.stopBeforeDeploy);
    if (options?.startAfterDeploy !== undefined)
      params.startAfter = String(options.startAfterDeploy);
    if (options?.backupBefore !== undefined)
      params.backupBefore = String(options.backupBefore);
    if (options?.configCheckBeforeDeploy !== undefined) {
      params.configCheckBefore = String(options.configCheckBeforeDeploy);
    }
    if (options?.dependencyCheckBeforeDeploy !== undefined) {
      params.dependencyCheckBefore = String(
        options.dependencyCheckBeforeDeploy,
      );
    }
    if (options?.uploadOptions?.clearBefore !== undefined)
      params.clearBefore = String(options.uploadOptions.clearBefore);
    if (options?.uploadOptions?.autoExtract !== undefined)
      params.autoExtract = String(options.uploadOptions.autoExtract);
    if (options?.uploadOptions?.deleteArchiveAfterExtract !== undefined)
      params.deleteArchive = String(
        options.uploadOptions.deleteArchiveAfterExtract,
      );
    return http.request<ReturnResult<RemoteProjectOperationResult>>(
      "post",
      p(`/projects/${projectId}/deploy`),
      { data: formData, params },
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
    getProjectDeployLogs,
    backupProject,
    rollbackProject,
    listProjectBackups,
    deployProject,
  };
}

/** API 实例类型，方便组件 props 类型声明 */
export type RemoteApi = ReturnType<typeof createRemoteApi>;

// ─── 项目远程部署工厂（基于 sysProjectId） ───────────────────────────────────────

/**
 * 根据 endpoint 反查项目ID（匹配 sys_project_endpoint）。
 */
export const resolveProjectRemoteTarget = (endpoint: string) =>
  http.request<ReturnResult<number>>("get", "/v2/project/remote/resolve", {
    params: { endpoint },
  });

/**
 * 获取远程部署加密公钥（无可用公钥时调用方可回退明文）。
 */
export const fetchServerProjectPublicKey = () =>
  http.request<ReturnResult<string>>("get", "/v2/project/remote/public-key");

/**
 * 创建项目远程管理 API。
 */
export const createProjectRemoteApi = (sysProjectId: string | number) =>
  createRemoteApi(`/v2/project/${sysProjectId}/remote`);
