/**
 * Nginx 控制台 接口封装
 *
 * <p>对接 {@code spring-support-monitor-starter} 的 {@code NginxManageController}。
 * 数据源从 {@code @pages/datasource} 取，与「数据源中心」页面共用同一份实现，
 * 避免同一后端接口在同一个应用里出现两份封装。</p>
 *
 * @author CH
 * @since 4.0.0.42
 */
import { http, unwrapResult } from "@repo/utils";
import { fetchDataSources, type DataSourceInfo } from "@pages/datasource";

const unwrap = <T>(res: any): T => unwrapResult<T>(res);

/** 接口根路径 */
const B = "/ms/monitor/nginx";

export type { DataSourceInfo };
export { fetchDataSources };

/** 列出 type 为 nginx 的数据源 */
export const fetchNginxSources = async (): Promise<DataSourceInfo[]> => {
  const all = await fetchDataSources();
  return (all || []).filter(d => d.type === "nginx");
};

// ==================== 类型 ====================

/** nginx 配置文件条目 */
export interface NginxConfigFile {
  path: string;
  size: number | null;
  mtime: string | null;
}

/** nginx 命令执行结果 */
export interface NginxCommandResult {
  success: boolean;
  message: string;
  stdout: string;
  stderr: string;
}

/** stub_status 实时状态 */
export interface NginxStatus {
  available: boolean;
  source: string | null;
  activeConnections: number | null;
  accepts: number | null;
  handled: number | null;
  requests: number | null;
  reading: number | null;
  writing: number | null;
  waiting: number | null;
  raw: string | null;
  /** 成功时是数据来源，失败时是具体原因 */
  message: string;
}

/** nginx 版本信息 */
export interface NginxVersion {
  version: string | null;
  configureArguments: string | null;
  raw: string;
}

/** 日志文件条目 */
export interface NginxLogFile {
  path: string;
  type: string;
  size: number | null;
  mtime: string | null;
}

/** 总览 */
export interface NginxOverview {
  running: string;
  masterPid: number | null;
  uptimeText: string | null;
  configRoot: string;
  configPath: string;
  version: NginxVersion;
  status: NginxStatus;
  configFileCount: number | null;
  configTotalSize: number | null;
  listenPorts: number[];
  logFiles: NginxLogFile[];
  issues: string[];
}

/** 指令元数据 */
export interface NginxDirectiveMeta {
  name: string;
  argType: string;
  enumValues: string[];
  multiple: boolean;
  required: boolean;
  desc: string;
  example: string;
  scopes: string[];
}

/** 配置语法树节点 */
export interface NginxConfigNode {
  id: string | null;
  parentId: string | null;
  name: string;
  headArg: string | null;
  label: string;
  block: boolean;
  value: string;
  scope: string;
  startLine: number | null;
  endLine: number | null;
  originalText: string;
  dirty: boolean;
  removed: boolean;
  /** 指令名是否有元数据登记；false 时 UI 退化为通用文本输入 */
  known: boolean;
  meta: NginxDirectiveMeta | null;
  warnings: string[];
  children: NginxConfigNode[];
}

/** 配置解析结果 */
export interface NginxConfigParse {
  path: string;
  content: string;
  root: NginxConfigNode;
  nodeCount: number;
  serverCount: number;
  locationCount: number;
  upstreamCount: number;
  unknownCount: number;
  warnings: string[];
}

/** 配置改动补丁 */
export type NginxPatch = {
  nodeId: string | null;
  op: "UPDATE" | "ADD" | "REMOVE";
  name?: string;
  headArg?: string;
  value?: string;
  index?: number;
};

/**
 * 保存配置请求
 *
 * <p>用 type 而非 interface：interface 没有隐式索引签名，无法赋值给
 * {@code RequestBody}（其联合里含 {@code Record<string, unknown>}）。</p>
 */
export type NginxApplyRequest = {
  datasourceId?: number;
  path: string;
  mode: "FILE" | "MODEL";
  content?: string;
  patches?: NginxPatch[];
  backup?: boolean;
  validate?: boolean;
  reload?: boolean;
  /** 只预览渲染结果，不落盘 */
  dryRun?: boolean;
};

/** 保存配置结果 */
export interface NginxApplyResult {
  saved: boolean;
  message: string;
  backupPath: string | null;
  validated: boolean;
  validateOk: boolean;
  validateText: string | null;
  reloaded: boolean;
  reloadOk: boolean;
  content: string;
  changedLineCount: number | null;
  warnings: string[];
  steps: string[];
}

/** 备份条目 */
export interface NginxBackup {
  name: string;
  path: string;
  size: number | null;
  mtime: string | null;
  sourceSize: number | null;
  reason: string | null;
}

/** 站点（一个 server 块）聚合视图 */
export interface NginxSite {
  /** 该 server 块在其所属文件语法树中的路径标识，可直接用于定位编辑 */
  nodePath: string;
  file: string;
  serverNames: string[];
  displayName: string;
  listenPorts: number[];
  https: boolean;
  defaultServer: boolean;
  rootDir: string | null;
  indexFiles: string[];
  proxyTargets: string[];
  locationCount: number;
  upstreamRefs: string[];
  hasCertificate: boolean;
  warnings: string[];
}

/** 配置模板 */
export interface NginxTemplate {
  key: string;
  title: string;
  summary: string;
  scene: string;
  difficulty: string;
  content: string;
  tips: string[];
  requiredFields: string[];
}

// ==================== 接口 ====================

/** 总览 */
export const fetchNginxOverview = (datasourceId?: number) =>
  http().get(`${B}/overview`).query({ datasourceId }).noToast(true).then(r => unwrap<NginxOverview>(r));

/** 列出配置文件 */
export const fetchNginxConfigFiles = (datasourceId?: number) =>
  http().get(`${B}/config/files`).query({ datasourceId }).then(r => unwrap<NginxConfigFile[]>(r));

/** 读取配置文件内容 */
export const fetchNginxConfig = (datasourceId: number | undefined, path: string) =>
  http().get(`${B}/config`).query({ datasourceId, path }).then(r => unwrap<string>(r));

/** 解析配置为语法树 */
export const fetchNginxConfigTree = (datasourceId: number | undefined, path: string) =>
  http().get(`${B}/config/tree`).query({ datasourceId, path }).timeout(60_000).then(r => unwrap<NginxConfigParse>(r));

/** 应用配置改动（文件模式 / UI 模式） */
export const applyNginxConfig = (data: NginxApplyRequest) =>
  http().post(`${B}/config/apply`).data(data).timeout(120_000).then(r => unwrap<NginxApplyResult>(r));

/** 指令元数据 */
export const fetchNginxDirectives = (scope?: string) =>
  http().get(`${B}/directives`).query({ scope }).then(r => unwrap<NginxDirectiveMeta[]>(r));

/** 站点清单：把所有 .conf 里的 server 块抽平 */
export const fetchNginxSites = (datasourceId?: number) =>
  http()
    .get(`${B}/sites`)
    .query({ datasourceId })
    .timeout(120_000)
    .then(r => unwrap<NginxSite[]>(r));

/** 配置模板库 */
export const fetchNginxTemplates = () =>
  http().get(`${B}/templates`).then(r => unwrap<NginxTemplate[]>(r));

/** 语法检查 */
export const testNginx = (datasourceId?: number) =>
  http().post(`${B}/test`).query({ datasourceId }).timeout(60_000).then(r => unwrap<NginxCommandResult>(r));

/** 重载 */
export const reloadNginx = (datasourceId?: number) =>
  http().post(`${B}/reload`).query({ datasourceId }).timeout(60_000).then(r => unwrap<NginxCommandResult>(r));

/** 重启 */
export const restartNginx = (datasourceId?: number) =>
  http().post(`${B}/restart`).query({ datasourceId }).timeout(120_000).then(r => unwrap<NginxCommandResult>(r));

/** 停止 */
export const stopNginx = (datasourceId?: number) =>
  http().post(`${B}/stop`).query({ datasourceId }).timeout(60_000).then(r => unwrap<NginxCommandResult>(r));

/** 启动 */
export const startNginx = (datasourceId?: number) =>
  http().post(`${B}/start`).query({ datasourceId }).timeout(60_000).then(r => unwrap<NginxCommandResult>(r));

/** 版本信息 */
export const fetchNginxVersion = (datasourceId?: number) =>
  http().get(`${B}/version`).query({ datasourceId }).then(r => unwrap<NginxVersion>(r));

/** stub_status 实时状态 */
export const fetchNginxStatus = (datasourceId?: number) =>
  http().get(`${B}/status`).query({ datasourceId }).noToast(true).then(r => unwrap<NginxStatus>(r));

/** 列出日志文件 */
export const fetchNginxLogFiles = (datasourceId?: number) =>
  http().get(`${B}/log/files`).query({ datasourceId }).then(r => unwrap<NginxLogFile[]>(r));

/** 日志增量结果 */
export interface NginxLogChunk {
  content: string;
  cursor: number | null;
  size: number | null;
  rotated: boolean;
  path: string;
}

/** 取日志尾部 N 行 */
export const fetchNginxLog = (datasourceId: number | undefined, path: string, lines = 200) =>
  http().get(`${B}/log`).query({ datasourceId, path, lines }).noToast(true).then(r => unwrap<string>(r));

/** 增量读取日志：只返回游标之后的新内容 */
export const fetchNginxLogChunk = (
  datasourceId: number | undefined,
  path: string,
  lines = 200,
  cursor?: number | null
) =>
  http()
    .get(`${B}/log/chunk`)
    .query({ datasourceId, path, lines, cursor: cursor ?? undefined })
    .noToast(true)
    .then(r => unwrap<NginxLogChunk>(r));

/** 立即备份 */
export const backupNginxConfig = (datasourceId: number | undefined, path: string, reason?: string) =>
  http().post(`${B}/backup`).query({ datasourceId, path, reason }).timeout(60_000).then(r => unwrap<NginxBackup>(r));

/** 列出备份 */
export const fetchNginxBackups = (datasourceId?: number) =>
  http().get(`${B}/backup`).query({ datasourceId }).then(r => unwrap<NginxBackup[]>(r));

/** 从备份恢复；原始路径含下划线时反推不可逆，必须显式给出 targetPath */
export const restoreNginxBackup = (
  datasourceId: number | undefined,
  backupName: string,
  targetPath?: string
) =>
  http()
    .post(`${B}/backup/${encodeURIComponent(backupName)}/restore`)
    .query({ datasourceId, targetPath })
    .timeout(60_000)
    .then(r => unwrap<NginxCommandResult>(r));
