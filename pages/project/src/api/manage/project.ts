import { http, type ReturnResult } from "@repo/utils";

export interface SysProject {
  projectId?: number;
  projectName?: string;
  projectDescription?: string;
  projectIcon?: string;
  /** 服务器OS类型：linux / windows / macos / unknown */
  serverOs?: "linux" | "windows" | "macos" | "unknown";
  sortOrder?: number;
  status?: 0 | 1;
  // 服务器信息（脱敏，不含明文密码）
  serverType?: "SSH" | "WINRM" | "LOCAL";
  serverHost?: string;
  serverPort?: number;
  serverUsername?: string; // 脱敏：保留前2字符
  serverEnabled?: 0 | 1;
  serverActivatedAt?: string;
  secretCount?: number; // 关联密钥数量
  // 操作脚本
  startScript?: string;
  stopScript?: string;
  restartScript?: string;
  // 路径配置
  logPath?: string;
  configPath?: string;
  libPath?: string;    // 依赖目录路径
  rootPath?: string;   // 项目根目录
  // 运行时状态（后端实时返回）
  runtimeStatus?: "running" | "stopped" | "unknown";
  createTime?: string;
  updateTime?: string;
}

export interface ProjectUploadOptions {
  autoExtract?: boolean;      // 自动解压，默认 true
  clearLib?: boolean;         // 清空依赖目录
  clearConfig?: boolean;      // 清空配置目录
  compareLib?: boolean;       // 对比依赖（不清空，只替换变更文件）
  compareConfig?: boolean;    // 对比配置（不清空，只替换变更文件）
  autoRestart?: boolean;      // 上传完成后自动重启
}

export interface SysProjectServerInfo {
  serverType: "SSH" | "WINRM" | "LOCAL";
  host: string;
  port: number;
  username: string;
  password?: string;
  privateKey?: string;
  connectTimeout?: number;
}

/** 全量列表（不分页） */
export const fetchListProject = () =>
  http.request<ReturnResult<SysProject[]>>("get", "/v2/devops/project/list");

/** 新增项目 */
export const fetchSaveProject = (params: Partial<SysProject>) =>
  http.request<ReturnResult<object>>("post", "/v2/devops/project/save", {
    data: params,
  });

/** 更新项目 */
export const fetchUpdateProject = (params: Partial<SysProject>) =>
  http.request<ReturnResult<boolean>>("put", "/v2/devops/project/update", {
    data: params,
  });

/** 删除项目 */
export const fetchDeleteProject = (params: { projectId: number }) =>
  http.request<ReturnResult<boolean>>("delete", "/v2/devops/project/delete", {
    params,
  });

/** 获取解密服务器凭证（仅 server_enabled=true 时返回有效数据） */
export const fetchProjectServerInfo = (projectId: number) =>
  http.request<ReturnResult<SysProjectServerInfo>>(
    "get",
    `/v2/project/server-info/${projectId}`,
  );

/** 切换 server_enabled 状态 */
export const fetchToggleProjectServer = (projectId: number) =>
  http.request<ReturnResult<{ serverEnabled: 0 | 1 }>>(
    "put",
    `/v2/project/toggle-server/${projectId}`,
  );

/** 获取项目关联密钥列表 */
export const fetchProjectSecrets = (projectId: number) =>
  http.request<ReturnResult<object[]>>(
    "get",
    `/v2/project/secrets/${projectId}`,
  );

/** 执行项目操作动作 */
export const fetchProjectAction = (
  projectId: number,
  action: "start" | "stop" | "restart" | "snapshot",
) =>
  http.request<ReturnResult<{ message: string }>>(
    "post",
    `/v2/project/action/${projectId}`,
    { data: { action } },
  );

/** 获取项目日志（最近 N 行） */
export const fetchProjectLog = (projectId: number, lines = 200) =>
  http.request<ReturnResult<string>>(
    "get",
    `/v2/project/log/${projectId}`,
    { params: { lines } },
  );

/** 获取项目配置文件内容 */
export const fetchProjectConfig = (projectId: number) =>
  http.request<ReturnResult<string>>(
    "get",
    `/v2/project/config/${projectId}`,
  );

/** 上传文件到项目目录 */
export const fetchUploadProjectFile = (
  projectId: number,
  file: File,
  options: ProjectUploadOptions = {},
) => {
  const form = new FormData();
  form.append("file", file);
  form.append("options", JSON.stringify(options));
  return http.request<ReturnResult<{ message: string }>>(
    "post",
    `/v2/project/upload/${projectId}`,
    { data: form },
  );
};

/** 复制项目（后端创建副本，返回新项目） */
export const fetchCopyProject = (projectId: number) =>
  http.request<ReturnResult<SysProject>>(
    "post",
    `/v2/project/copy/${projectId}`,
  );

/** 为项目关联密钥（设置 sys_secret.project_id） */
export const fetchBindProjectSecret = (params: {
  projectId: number;
  secretId: number;
}) =>
  http.request<ReturnResult<boolean>>("put", "/v2/devops/project/bind-secret", {
    data: params,
  });

/** 取消项目关联密钥（清空 sys_secret.project_id） */
export const fetchUnbindProjectSecret = (params: {
  projectId: number;
  secretId: number;
}) =>
  http.request<ReturnResult<boolean>>("put", "/v2/devops/project/unbind-secret", {
    data: params,
  });
