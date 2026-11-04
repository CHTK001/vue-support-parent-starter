import { http, unwrapResult } from '@repo/utils';

const B = '/ms/server';

// ===== 主机 MsServerHost =====
export const queryHosts = (params: { keyword?: string; groupId?: number | null; status?: number | null } = {}) =>
  http().get(`${B}/host`).query(params as Record<string, unknown>).then(r => unwrapResult<any[]>(r));
export const getHost = (id: number) => http().get(`${B}/host/${id}`).then(r => unwrapResult<any>(r));
export const fetchLocalAddress = () => http().get(`${B}/host/local-address`).then(r => unwrapResult<string>(r));
export const saveHost = (id: number | null, d: any) => id != null
  ? http().put(`${B}/host/${id}`).data(d).then(r => unwrapResult<any>(r))
  : http().post(`${B}/host`).data(d).then(r => unwrapResult<any>(r));
export const delHost = (id: number) => http().delete(`${B}/host/${id}`).then(r => unwrapResult<boolean>(r));
export const switchHost = (id: number, enabled: boolean) =>
  http().put(`${B}/host/${id}/status?enabled=${enabled}`).then(r => unwrapResult<boolean>(r));
export const testConnectHost = (id: number) =>
  http().post(`${B}/host/${id}/test-connect`).then(r => unwrapResult<string>(r));
/** 获取 VNC 直连凭据（noVNC 浏览器端 RFB 口令认证） */
export const getVncCredential = (hostId: number, identityId?: number | null) =>
  http().get(`${B}/host/${hostId}/vnc-credential${identityId != null ? `?identityId=${identityId}` : ''}`)
    .then(r => unwrapResult<{ username: string; password: string }>(r));
export const detectHost = (id: number) =>
  http().post(`${B}/host/${id}/detect`).then(r => unwrapResult<any>(r));
export const scanPorts = (id: number) =>
  http().post(`${B}/host/${id}/scan-ports`).then(r => unwrapResult<any>(r));
export const testPrometheusHost = (id: number) =>
  http().post(`${B}/host/${id}/test-prometheus`).then(r => unwrapResult<string>(r));
// ===== 软件管理（包管理器：检索 / 安装 / 卸载 / 升级 / 已安装） =====
export const searchSoftware = (hostId: number, keyword: string) =>
  http().get(`${B}/release/software/search`).query({ hostId, keyword }).timeout(30000).then(r => unwrapResult<any[]>(r));
export const listInstalledSoftware = (hostId: number) =>
  http().get(`${B}/release/software/installed`).query({ hostId }).timeout(60000).then(r => unwrapResult<any[]>(r));
export const installSoftwarePkg = (hostId: number, name: string) =>
  http().post(`${B}/release/software/install`).query({ hostId, name }).timeout(30000).then(r => unwrapResult<string>(r));
export const uninstallSoftwarePkg = (hostId: number, name: string) =>
  http().post(`${B}/release/software/uninstall`).query({ hostId, name }).timeout(30000).then(r => unwrapResult<string>(r));
export const upgradeSoftwarePkg = (hostId: number, name: string) =>
  http().post(`${B}/release/software/upgrade`).query({ hostId, name }).timeout(30000).then(r => unwrapResult<string>(r));
/** 可升级清单：前端据此决定是否显示「升级」按钮（只有清单内的包才可能真的升级） */
export const listUpgradableSoftware = (hostId: number) =>
  http().get(`${B}/release/software/upgradable`).query({ hostId }).timeout(60000).then(r => unwrapResult<any[]>(r));
/** 依赖关系：软件详情面板按需查询，返回依赖包名列表 */
export const getSoftwareDependencies = (hostId: number, name: string) =>
  http().get(`${B}/release/software/dependencies`).query({ hostId, name }).timeout(60000).then(r => unwrapResult<string[]>(r));
export const refreshHostPublicIp = (id: number) =>
  http().post(`${B}/host/${id}/refresh-public-ip`).then(r => unwrapResult<string>(r));
export const pushAgentData = (agentKey: string, payload: Record<string, unknown>) =>
  http().post(`${B}/host/agent/${agentKey}/push`).data(payload).then(r => unwrapResult<string>(r));

// ===== 系统配置 =====
export const getServerConfig = () =>
  http().get(`${B}/config/map`).then(r => unwrapResult<Record<string, any>>(r));
export const saveServerConfig = (config: Record<string, unknown>) =>
  http().post(`${B}/config`).data(config).then(r => unwrapResult<void>(r));

// ===== 身份绑定 =====
export const listBoundIdentities = (hostId: number) =>
  http().get(`${B}/host/${hostId}/identities`).then(r => unwrapResult<number[]>(r));
export const bindIdentity = (hostId: number, identityId: number) =>
  http().post(`${B}/host/${hostId}/identity/${identityId}`).then(r => unwrapResult<boolean>(r));
export const unbindIdentity = (hostId: number, identityId: number) =>
  http().delete(`${B}/host/${hostId}/identity/${identityId}`).then(r => unwrapResult<boolean>(r));

// ===== 分组 MsServerGroup =====
export const getGroups = () => http().get(`${B}/group`).then(r => unwrapResult<any[]>(r));
export const saveGroup = (id: number | null, d: any) => id != null
  ? http().put(`${B}/group/${id}`).data(d).then(r => unwrapResult<any>(r))
  : http().post(`${B}/group`).data(d).then(r => unwrapResult<any>(r));
export const delGroup = (id: number) => http().delete(`${B}/group/${id}`).then(r => unwrapResult<boolean>(r));

// ===== 密钥 MsServerKey（脱敏返回）=====
export const getKeys = () => http().get(`${B}/key`).then(r => unwrapResult<any[]>(r));
export const saveKey = (id: number | null, d: any) => id != null
  ? http().put(`${B}/key/${id}`).data(d).then(r => unwrapResult<any>(r))
  : http().post(`${B}/key`).data(d).then(r => unwrapResult<any>(r));
export const delKey = (id: number) => http().delete(`${B}/key/${id}`).then(r => unwrapResult<boolean>(r));
export const generateKeyPair = (name: string, type: string, password?: string, remark?: string) =>
  http().post(`${B}/key/generate?name=${encodeURIComponent(name)}&type=${type}${password ? `&password=${encodeURIComponent(password)}` : ''}${remark ? `&remark=${encodeURIComponent(remark)}` : ''}`).timeout(60000).then(r => unwrapResult<{ publicKey: string; privateKey: string }>(r));

// ===== 身份 MsServerIdentity（脱敏返回）=====
export const getIdentities = () => http().get(`${B}/identity`).then(r => unwrapResult<any[]>(r));
export const saveIdentity = (id: number | null, d: any) => id != null
  ? http().put(`${B}/identity/${id}`).data(d).then(r => unwrapResult<any>(r))
  : http().post(`${B}/identity`).data(d).then(r => unwrapResult<any>(r));
export const delIdentity = (id: number) => http().delete(`${B}/identity/${id}`).then(r => unwrapResult<boolean>(r));

// ===== 邮箱账号信箱 (MAILBOX 身份, IMAP / 临时邮箱 API) =====
export const listMailbox = (identityId: number, folder?: string, limit = 20) =>
  http().get(`${B}/identity/${identityId}/mailbox/list?folder=${folder ?? ''}&limit=${limit}`).then(r => unwrapResult<any[]>(r));
export const getMailboxMessage = (identityId: number, folder?: string, subject?: string) =>
  http().get(`${B}/identity/${identityId}/mailbox/message?folder=${folder ?? ''}${subject ? `&subject=${encodeURIComponent(subject)}` : ''}`).then(r => unwrapResult<any>(r));
export const createTempEmail = (provider: string) =>
  http().post(`${B}/identity/mailbox/temp-create?provider=${encodeURIComponent(provider)}`).then(r => unwrapResult<{ email: string; provider: string }>(r));
export const registerMailbox = (identityId: number, clientId: string) =>
  http().put(`${B}/identity/${identityId}/mailbox/register?clientId=${encodeURIComponent(clientId)}`).then(r => unwrapResult<void>(r));
export const unregisterMailbox = (clientId: string) =>
  http().delete(`${B}/identity/mailbox/unregister?clientId=${encodeURIComponent(clientId)}`).then(r => unwrapResult<void>(r));

// ===== SFTP 文件管理 =====
export const sftpList = (hostId: number, path: string, identityId?: number | null) =>
  http().get(`${B}/sftp/${hostId}?path=${encodeURIComponent(path)}${identityId ? `&identityId=${identityId}` : ''}`)
    .then(r => unwrapResult<any[]>(r));
export const sftpReadContent = (hostId: number, path: string, identityId?: number | null) =>
  http().get(`${B}/sftp/${hostId}/content?path=${encodeURIComponent(path)}${identityId ? `&identityId=${identityId}` : ''}`)
    .then(r => unwrapResult<{ content: string; truncated: boolean; size: number }>(r));
export const sftpWriteContent = (hostId: number, path: string, content: string, identityId?: number | null) => {
  const q = `path=${encodeURIComponent(path)}${identityId ? `&identityId=${identityId}` : ''}`;
  // 后端 @RequestBody String 只吃 text/plain；axios 对字符串体会默认打 form-urlencoded 而 415
  return http().put(`${B}/sftp/${hostId}/content?${q}`)
    .headers({ 'Content-Type': 'text/plain;charset=UTF-8' })
    .data(content)
    .then(r => unwrapResult<boolean>(r));
};
export const sftpMkdir = (hostId: number, path: string, identityId?: number | null) =>
  http().post(`${B}/sftp/${hostId}/mkdir?path=${encodeURIComponent(path)}${identityId ? `&identityId=${identityId}` : ''}`)
    .then(r => unwrapResult<boolean>(r));
export const sftpDelete = (hostId: number, path: string, recursive: boolean, identityId?: number | null) =>
  http().delete(`${B}/sftp/${hostId}?path=${encodeURIComponent(path)}&recursive=${recursive}${identityId ? `&identityId=${identityId}` : ''}`)
    .then(r => unwrapResult<boolean>(r));
export const sftpRename = (hostId: number, fromPath: string, toPath: string, identityId?: number | null) => {
  const q = identityId ? `identityId=${identityId}` : '';
  return http().put(`${B}/sftp/${hostId}/rename${q ? '?' + q : ''}`).data({ fromPath, toPath }).then(r => unwrapResult<boolean>(r));
};
export const sftpUpload = (hostId: number, path: string, file: File, identityId?: number | null) => {
  const form = new FormData();
  form.append('file', file);
  const q = `path=${encodeURIComponent(path)}${identityId ? `&identityId=${identityId}` : ''}`;
  return http().post(`${B}/sftp/${hostId}/upload?${q}`).data(form).then(r => unwrapResult<string>(r));
};
/** 下载：直接以浏览器地址栏/链接方式触发（走同源代理） */
export const sftpDownloadUrl = (hostId: number, path: string, identityId?: number | null) =>
  `${B}/sftp/${hostId}/download?path=${encodeURIComponent(path)}${identityId ? `&identityId=${identityId}` : ''}`;

// ===== 批量命令 / 文件分发 =====
export const runCommand = (hostIds: number[], command: string, timeoutSeconds?: number) =>
  http().post(`${B}/exec/command`).data({ hostIds, command, timeoutSeconds }).then(r => unwrapResult<any[]>(r));
export const distributeFile = (hostIds: string, directory: string, file: File) => {
  const form = new FormData();
  form.append('file', file);
  return http()
    .post(`${B}/exec/file?hostIds=${encodeURIComponent(hostIds)}${directory ? `&directory=${encodeURIComponent(directory)}` : ''}`)
    .data(form)
    .then(r => unwrapResult<any[]>(r));
};

// ===== 计划任务 MsExecJob =====
export const getJobs = () => http().get(`${B}/exec/job`).then(r => unwrapResult<any[]>(r));
export const saveJob = (id: number | null, d: any) => id != null
  ? http().put(`${B}/exec/job/${id}`).data(d).then(r => unwrapResult<any>(r))
  : http().post(`${B}/exec/job`).data(d).then(r => unwrapResult<any>(r));
export const delJob = (id: number) => http().delete(`${B}/exec/job/${id}`).then(r => unwrapResult<boolean>(r));
/** 立即触发任务；hostIds 为空时用任务自身配置的主机 */
export const runJobNow = (id: number, hostIds?: number[], timeoutSeconds?: number) =>
  http().post(`${B}/exec/job/${id}/run`).data({ hostIds, timeoutSeconds }).then(r => unwrapResult<any[]>(r));
/** 执行日志；可按类型 / 主机 / 计划任务过滤 */
export const getExecLogs = (type?: string, hostId?: number, jobId?: number) => {
  const qs = new URLSearchParams();
  if (type) qs.set('type', type);
  if (hostId) qs.set('hostId', String(hostId));
  if (jobId) qs.set('jobId', String(jobId));
  return http().get(`${B}/exec/log${qs.toString() ? `?${qs.toString()}` : ''}`).then(r => unwrapResult<any[]>(r));
};

// ===== 远控短令牌 =====
/**
 * 签发远控短令牌（按服务器信息登记连接参数，浏览器只拿随机 token）
 *
 * @param hostId     主机 id
 * @param protocol   协议：ssh | vnc | rdp
 * @param identityId 登录身份 id（可选）
 * @param targetPort 目标端口覆盖（可选）
 * @returns { token, url, hostName, protocol }——url 为会话页地址（未配置 web 前端时为 null）
 */
export const fetchIssueRemoteToken = (
  hostId: number,
  protocol: string,
  identityId?: number | null,
  targetPort?: number | null,
) =>
  http().get(`${B}/remote/token`)
    .query({ hostId, protocol, identityId: identityId ?? undefined, targetPort: targetPort ?? undefined } as Record<string, unknown>)
    .then(r => unwrapResult<{ token: string; url: string | null; hostName: string; protocol: string }>(r));

// ===== 终端会话审计 =====
export const getOnlineSessions = () =>
  http().get(`${B}/terminal/online`).then(r => unwrapResult<any[]>(r));
export const getSessions = (status?: string) =>
  http().get(`${B}/terminal/session${status ? `?status=${status}` : ''}`).then(r => unwrapResult<any[]>(r));
export const closeSession = (recordId: number) =>
  http().post(`${B}/terminal/session/${recordId}/close`).then(r => unwrapResult<boolean>(r));

// ===== 命令片段 / 路径书签 =====
/** 命令片段载荷（字段名与后端实体 MsTerminalSnippet 对齐；须为 type 以获得隐式索引签名） */
export type TerminalSnippetPayload = {
  msTerminalSnippetName: string;
  msTerminalSnippetContent: string;
  msTerminalSnippetRemark?: string;
};
export const getSnippets = () => http().get(`${B}/terminal/snippet`).then(r => unwrapResult<any[]>(r));
export const saveSnippet = (d: TerminalSnippetPayload) =>
  http().post(`${B}/terminal/snippet`).data(d).then(r => unwrapResult<any>(r));
export const updateSnippet = (id: number, d: TerminalSnippetPayload) =>
  http().put(`${B}/terminal/snippet/${id}`).data(d).then(r => unwrapResult<any>(r));
export const delSnippet = (id: number) => http().delete(`${B}/terminal/snippet/${id}`).then(r => unwrapResult<boolean>(r));
export const getBookmarks = (hostId: number) =>
  http().get(`${B}/terminal/bookmark?hostId=${hostId}`).then(r => unwrapResult<any[]>(r));
export const createBookmark = (d: any) => http().post(`${B}/terminal/bookmark`).data(d).then(r => unwrapResult<any>(r));
export const delBookmark = (id: number) => http().delete(`${B}/terminal/bookmark/${id}`).then(r => unwrapResult<boolean>(r));

/* ===== 终端共享（口径同文件协同 /v2/file/collab：公开 / 私有 + 授权用户） =====
 *
 * 一条共享记录把「当前这条 SSH 会话」开放给其他用户协同操作：被邀请方凭 roomId
 * 接到同一条 SSH 连接与同一个远端伪终端，而不是另开一条。前端按返回的
 * canWrite / isOwner 决定能否操作与能否改权限。
 */

/** 可见性：公开（全员可协同操作）/ 私有（仅指定用户） */
export type TerminalShareVisibility = "PUBLIC" | "PRIVATE";

/** 终端共享记录 */
export interface TerminalShareInfo {
  /** 共享标识（改权限 / 取消共享用） */
  shareId: string;
  /** 终端房间号（被邀请方加入凭它） */
  roomId: string;
  hostId: number;
  hostName: string;
  /** 发起者用户标识 */
  owner: string;
  visibility: TerminalShareVisibility;
  /** 私有时的授权用户 */
  allowedUserIds: string[];
  createdAt: number;
  updatedAt: number;
  /** 当前账号是否可协同操作（写终端） */
  canWrite: boolean;
  /** 当前账号是否发起者（可改权限 / 取消共享） */
  isOwner: boolean;
}

/** 发起终端共享 */
export const createTerminalShare = (options: {
  hostId: number;
  hostName?: string;
  roomId?: string;
  userId?: string;
  visibility?: TerminalShareVisibility;
  userIds?: string[];
}) => {
  const params = new URLSearchParams({ hostId: String(options.hostId) });
  if (options.hostName) params.set("hostName", options.hostName);
  if (options.roomId) params.set("roomId", options.roomId);
  if (options.userId) params.set("userId", options.userId);
  params.set("visibility", options.visibility ?? "PUBLIC");
  if (options.userIds?.length) params.set("userIds", options.userIds.join(","));
  return http().post(`${B}/terminal/share/create?${params.toString()}`)
    .then(r => unwrapResult<TerminalShareInfo>(r));
};

/** 某台主机对当前用户可见的共享终端 */
export const listTerminalShares = (hostId: number, userId?: string) => {
  const qs = new URLSearchParams({ hostId: String(hostId) });
  if (userId) qs.set("userId", userId);
  return http().get(`${B}/terminal/share/list?${qs.toString()}`)
    .then(r => unwrapResult<TerminalShareInfo[]>(r));
};

/** 按房间号取共享（加入前校验权限） */
export const getTerminalShareByRoom = (roomId: string, userId?: string) => {
  const qs = userId ? `?userId=${encodeURIComponent(userId)}` : "";
  return http().get(`${B}/terminal/share/room/${encodeURIComponent(roomId)}${qs}`)
    .then(r => unwrapResult<TerminalShareInfo>(r));
};

/** 更新共享权限（仅发起者） */
export const updateTerminalShareAccess = (
  shareId: string,
  visibility: TerminalShareVisibility,
  userIds: string[] = [],
  userId?: string,
) => {
  const qs = new URLSearchParams({ visibility });
  if (userIds.length) qs.set("userIds", userIds.join(","));
  if (userId) qs.set("userId", userId);
  return http().put(`${B}/terminal/share/${shareId}/access?${qs.toString()}`)
    .then(r => unwrapResult<TerminalShareInfo>(r));
};

/** 取消共享（仅发起者） */
export const deleteTerminalShare = (shareId: string, userId?: string) => {
  const qs = userId ? `?userId=${encodeURIComponent(userId)}` : "";
  return http().delete(`${B}/terminal/share/${shareId}${qs}`)
    .then(r => unwrapResult<boolean>(r));
};

/**
 * 拉取可授权的用户列表（共享选人）。
 *
 * <p>与协同文档同一口径：复用系统模块的用户分页接口 {@code GET /v2/user/page}，
 * 不另建用户模型。接口不可用时降级为空列表（公开共享不受影响）。</p>
 *
 * @param limit 拉取上限（默认 100）
 */
export async function listUsersForPicker(limit = 100): Promise<Array<{ userId: string; label: string }>> {
  try {
    const raw = (await http()
      .get("/v2/user/page")
      .query({ page: 1, pageSize: limit, sysUserStatus: 1 })
      .then(r => (r as { data?: unknown }).data)) as unknown;
    const wrap = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
    const page = (wrap.data ?? {}) as Record<string, unknown> | unknown[];
    const users = (Array.isArray(page)
      ? page
      : ((page as Record<string, unknown>)?.records ?? (page as Record<string, unknown>)?.list ?? [])) as Array<
      { sysUserId?: number; sysUserUsername?: string; sysUserNickname?: string; sysUserStatus?: number }
    >;
    return (users ?? [])
      .filter(u => u && u.sysUserId != null && u.sysUserStatus !== 0)
      .map(u => ({
        userId: String(u.sysUserId),
        label: u.sysUserNickname || u.sysUserUsername || String(u.sysUserId),
      }));
  } catch {
    return [];
  }
}

/* ===== 主机工作台：Docker/K8s 能力与资源（接口约定见 src/workbench-api-contract.md） =====
 *
 * Docker 的**页面**已迁到独立包 @pages/docker（后端 /ms/server/docker），
 * 下列 /host/{id}/docker 一组接口仅保留给 ScDockerK8sWorkbench 的 K8s 同屏组件
 * （其 domain="docker" 分支已无入口）。不要再往这些接口上挂页面。
 */
export const dockerCapability = (hostId: number) =>
  http().get(`${B}/host/${hostId}/docker/capability`).then(r => unwrapResult<any>(r));
export const listDockerContainers = (hostId: number, all = true) =>
  http().get(`${B}/host/${hostId}/docker/containers`).query({ all }).then(r => unwrapResult<any[]>(r));
export const startDockerContainer = (hostId: number, containerId: string) =>
  http().post(`${B}/host/${hostId}/docker/containers/${containerId}/start`).then(r => unwrapResult<boolean>(r));
export const stopDockerContainer = (hostId: number, containerId: string) =>
  http().post(`${B}/host/${hostId}/docker/containers/${containerId}/stop`).then(r => unwrapResult<boolean>(r));
export const restartDockerContainer = (hostId: number, containerId: string) =>
  http().post(`${B}/host/${hostId}/docker/containers/${containerId}/restart`).then(r => unwrapResult<boolean>(r));
export const dockerContainerLogs = (hostId: number, containerId: string, tail = 200) =>
  http().post(`${B}/host/${hostId}/docker/containers/${containerId}/logs`).query({ tail }).then(r => unwrapResult<string>(r));
export const listDockerImages = (hostId: number) =>
  http().get(`${B}/host/${hostId}/docker/images`).then(r => unwrapResult<any[]>(r));
export const listDockerNetworks = (hostId: number) =>
  http().get(`${B}/host/${hostId}/docker/networks`).then(r => unwrapResult<any[]>(r));
export const listDockerVolumes = (hostId: number) =>
  http().get(`${B}/host/${hostId}/docker/volumes`).then(r => unwrapResult<any[]>(r));
export const dockerPrune = (hostId: number) =>
  http().post(`${B}/host/${hostId}/docker/prune`).then(r => unwrapResult<any>(r));

export const k8sCapability = (hostId: number) =>
  http().get(`${B}/host/${hostId}/kubernetes/capability`).then(r => unwrapResult<any>(r));
export const k8sCluster = (hostId: number) =>
  http().get(`${B}/host/${hostId}/kubernetes/cluster`).then(r => unwrapResult<any>(r));
export const k8sWorkloads = (hostId: number, namespace?: string) =>
  http().get(`${B}/host/${hostId}/kubernetes/workloads`).query({ namespace: namespace || '' }).then(r => unwrapResult<any[]>(r));
export const k8sNamespaces = (hostId: number) =>
  http().get(`${B}/host/${hostId}/kubernetes/namespaces`).then(r => unwrapResult<string[]>(r));
export const k8sScale = (hostId: number, name: string, kind: string, ns: string, replicas: number) =>
  http().post(`${B}/host/${hostId}/kubernetes/workloads/${name}/scale`)
    .query({ kind, ns, replicas }).then(r => unwrapResult<boolean>(r));
export const k8sRestart = (hostId: number, name: string, kind: string, ns: string) =>
  http().post(`${B}/host/${hostId}/kubernetes/workloads/${name}/restart`)
    .query({ kind, ns }).then(r => unwrapResult<boolean>(r));

/* ===== 主机工作台：隧道 / 反向隧道（接口约定见 src/workbench-api-contract.md） ===== */
export const listTunnels = (hostId: number) =>
  http().get(`${B}/host/${hostId}/tunnel`).then(r => unwrapResult<any[]>(r));
export const createTunnel = (hostId: number, d: any) =>
  http().post(`${B}/host/${hostId}/tunnel`).data(d).then(r => unwrapResult<any>(r));
export const updateTunnelState = (hostId: number, id: number, state: "RUNNING" | "STOPPED") =>
  http().put(`${B}/host/${hostId}/tunnel/${id}/state?state=${state}`).then(r => unwrapResult<any>(r));
/**
 * 生成 SSH 命令（ssh -L / ssh -R）—— 配合正向/反向隧道使用：
 * 用真实的 ssh 客户端拉起隧道，验证调通。
 *
 * @param hostId 跳板主机 id
 * @param d      与 建立隧道（POST /host/{id}/tunnel）入参一致
 * @returns 完整 ssh 命令行
 */
export const generateSshCommand = (hostId: number, d: any) =>
  http().post(`${B}/host/${hostId}/tunnel/ssh-command`).data(d).then(r => unwrapResult<{ command: string }>(r));
export const delTunnel = (hostId: number, id: number) =>
  http().delete(`${B}/host/${hostId}/tunnel/${id}`).then(r => unwrapResult<boolean>(r));

/**
 * 构造远控 WebSocket 地址
 *
 * @param hostId     主机 ID
 * @param protocol   协议 ssh/vnc/rdp
 * @param identityId 指定身份，可为空
 * @param targetPort 目标服务端口(RDP/VNC)，可为空
 * @param user       发起用户名
 */
export const buildTerminalWsUrl = (
  hostId: number,
  protocol: string,
  identityId?: number | null,
  targetPort?: number | null,
  user = 'admin',
): string => {
  const proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
  const qs = new URLSearchParams({
    hostId: String(hostId),
    protocol,
    user,
  });
  if (identityId) {
    qs.set('identityId', String(identityId));
  }
  if (targetPort) {
    qs.set('targetPort', String(targetPort));
  }
  return `${proto}//${location.host}/ws/ms/server/terminal?${qs.toString()}`;
};

/**
 * 构造远控 WebSocket 地址（token 模式——URL 只携带随机令牌，服务器信息不出后端）
 *
 * @param token 远控短令牌（由 fetchIssueRemoteToken 签发）
 * @param user  发起用户名（仅审计用）
 */
export const buildTerminalTokenWsUrl = (token: string, user = 'admin'): string => {
  const proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
  const qs = new URLSearchParams({ token, user });
  return `${proto}//${location.host}/ws/ms/server/terminal?${qs.toString()}`;
};

// ===== 维护计划 =====
export const getMaintenancePlans = () => http().get(`${B}/maintenance-plan`).then(r => unwrapResult<any[]>(r));
export const saveMaintenancePlan = (id: number | null, d: any) => id != null
  ? http().put(`${B}/maintenance-plan/${id}`).data(d).then(r => unwrapResult<any>(r))
  : http().post(`${B}/maintenance-plan`).data(d).then(r => unwrapResult<any>(r));
export const delMaintenancePlan = (id: number) => http().delete(`${B}/maintenance-plan/${id}`).then(r => unwrapResult<boolean>(r));

// ===== 主机工作台：调度（复用计划任务 /exec/job，按主机过滤）=====
/**
 * 计划任务格式（任务名 / 调度表达式 / 平台命令）
 *
 * <p>后端没有独立的 {@code /host/{id}/schedule} 存储，调度规则实际落在
 * {@code ms_exec_job}（批量计划任务）里，{@code msExecJobHostIds} 记录目标主机；
 * 这里在 API 层做一层映射，页面只关心「这台主机的调度规则」。</p>
 */
export interface SchedulePayload {
  /** 规则名 */
  msScheduleName: string;
  /** cron 表达式 */
  expression: string;
  /** 在目标主机上执行的命令 */
  command: string;
  /** 备注 */
  remark?: string;
}
/** 调度行（由计划任务映射而来） */
export interface ScheduleItem extends SchedulePayload {
  id: number;
  /** 所属主机 id */
  hostId?: number;
  /** 1 启用 / 0 停用 */
  status?: number;
  /** 上次执行时间 */
  lastRunTime?: string;
  /** 下次执行时间 */
  nextRunTime?: string;
  /** 创建时间 */
  createdAt?: string;
}

/** 编辑态行（多一个 `name` 字段，省得跨字段转换） */
export interface ScheduleDraft extends ScheduleItem {
  name: string;
}

/**
 * 解析计划任务的 hostIds。
 *
 * <p>后端用 JSON 数组字符串存储（如 {@code "[1,2]"}）；空串或脏数据按空数组处理，
 * 避免一条坏记录让整张调度表报错。</p>
 *
 * @param raw 原始 hostIds 字段
 * @returns 主机 id 列表
 */
export function parseScheduleHostIds(raw?: string | null): number[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.map(v => Number(v)).filter(n => Number.isFinite(n))
      : [];
  } catch {
    return [];
  }
}

/**
 * 计划任务 -> 主机调度行
 *
 * @param job    后端计划任务
 * @param hostId 当前主机
 * @returns 调度行
 */
function toScheduleItem(job: any, hostId: number): ScheduleItem {
  return {
    id: Number(job?.id ?? 0),
    hostId,
    msScheduleName: String(job?.msExecJobName ?? ""),
    expression: String(job?.msExecJobCron ?? ""),
    command: String(job?.msExecJobCommand ?? ""),
    remark: String(job?.msExecJobRemark ?? ""),
    status: Number(job?.msExecJobEnabled ?? 1),
    lastRunTime: job?.msExecJobLastRunTime ?? undefined,
    nextRunTime: job?.msExecJobNextRunTime ?? undefined,
    createdAt: job?.createTime ?? undefined,
  };
}

/**
 * 主机调度列表：拉取计划任务后只保留命中该主机的规则。
 *
 * @param hostId 主机 id
 * @returns 该主机的调度规则
 */
export const listSchedules = async (hostId: number): Promise<ScheduleItem[]> => {
  const jobs = await getJobs();
  return jobs
    .filter((job: any) => parseScheduleHostIds(job?.msExecJobHostIds).includes(hostId))
    .map((job: any) => toScheduleItem(job, hostId));
};

/**
 * 新增主机调度：落成单主机 cron 计划任务。
 *
 * @param hostId 主机 id
 * @param d      调度内容
 * @returns 新建后的调度行
 */
export const saveSchedule = (hostId: number, d: SchedulePayload) =>
  saveJob(null, {
    msExecJobName: d.msScheduleName,
    msExecJobType: "CRON",
    msExecJobCron: d.expression,
    msExecJobCommand: d.command,
    msExecJobHostIds: JSON.stringify([hostId]),
    msExecJobTimeout: 60,
    msExecJobEnabled: 1,
    msExecJobRemark: d.remark ?? "",
  }).then((job: any) => toScheduleItem(job, hostId));

/**
 * 修改主机调度：只改规则本身，保留任务原有的目标主机与启停状态。
 *
 * @param hostId 主机 id
 * @param id     计划任务 id
 * @param d      调度内容
 * @returns 修改后的调度行
 */
export const updateSchedule = (hostId: number, id: number, d: SchedulePayload) =>
  saveJob(id, {
    msExecJobName: d.msScheduleName,
    msExecJobType: "CRON",
    msExecJobCron: d.expression,
    msExecJobCommand: d.command,
    msExecJobRemark: d.remark ?? "",
  }).then((job: any) => toScheduleItem(job, hostId));

/**
 * 启停主机调度。
 *
 * @param hostId  主机 id
 * @param id      计划任务 id
 * @param enabled 是否启用
 * @returns 修改后的调度行
 */
export const toggleSchedule = (hostId: number, id: number, enabled: boolean) =>
  saveJob(id, { msExecJobEnabled: enabled ? 1 : 0 })
    .then((job: any) => toScheduleItem(job, hostId));

/**
 * 从当前主机移除调度。
 *
 * <p>同一条计划任务可能同时命中多台主机：这里只把当前主机从 hostIds 里摘掉，
 * 摘到空才真正删除任务，避免在 A 主机上删规则把 B 主机的规则一起删了。</p>
 *
 * @param hostId 主机 id
 * @param id     计划任务 id
 * @returns 是否成功
 */
export const delSchedule = async (hostId: number, id: number): Promise<boolean> => {
  const jobs = await getJobs();
  const job = jobs.find((j: any) => Number(j?.id) === id);
  if (!job) return true;
  const remain = parseScheduleHostIds(job?.msExecJobHostIds).filter(x => x !== hostId);
  if (!remain.length) return delJob(id);
  await saveJob(id, { msExecJobHostIds: JSON.stringify(remain) });
  return true;
};

// ===== 资产统计 =====
export const getHostStats = () => http().get(`${B}/host/stats`).then(r => unwrapResult<{ total: number; online: number; offline: number; unknown: number }>(r));

// ===== 导入导出 =====
export const exportHostsUrl = (keyword?: string, groupId?: number | null) => {
  const qs = new URLSearchParams();
  if (keyword) qs.set('keyword', keyword);
  if (groupId) qs.set('groupId', String(groupId));
  return `${B}/host/export${qs.toString() ? '?' + qs.toString() : ''}`;
};
export const importHosts = (file: File) => {
  const form = new FormData();
  form.append('file', file);
  return http().post(`${B}/host/import`).data(form).then(r => unwrapResult<number>(r));
};

// ===== 批量操作 =====
export const batchUpdateStatus = (ids: number[], enabled: boolean) =>
  http().put(`${B}/host/batch/status?enabled=${enabled}`).data(ids).then(r => unwrapResult<void>(r));
export const batchMoveGroup = (ids: number[], groupId: number | null) => {
  const q = groupId != null ? `?groupId=${groupId}` : '';
  return http().put(`${B}/host/batch/group${q}`).data(ids).then(r => unwrapResult<void>(r));
};

// ===== 分组树 =====
export const getGroupTree = () => http().get(`${B}/group/tree`).then(r => unwrapResult<any[]>(r));

// ===== 硬件规格 =====
export const updateHardware = (id: number, d: any) =>
  http().put(`${B}/host/${id}/hardware`).data(d).then(r => unwrapResult<any>(r));
export const listHardware = (keyword?: string) =>
  http().get(`${B}/host/hardware${keyword ? `?keyword=${keyword}` : ''}`).then(r => unwrapResult<any[]>(r));

// ===== 主机扫描发现 =====
export const scanIpRange = (cidr: string) =>
  http().post(`${B}/host/scan?cidr=${encodeURIComponent(cidr)}`).then(r => unwrapResult<{ ip: string; port: number; osType: string; hostname: string }[]>(r));

// ===== 服务管理（协议服务器节点 Server + ServerFilter + 服务发现）=====
// 实现见 serviceManage.ts，统一从本文件转出。
export * from './serviceManage';

// ===== 目标机运行时（进程/服务/网络/磁盘/防火墙/驱动/环境变量）=====
// 实现见 hostRuntime.ts，统一从本文件转出。
export * from './hostRuntime';

// ===== 主机画像 / 主机网卡 =====
// 实现见 hostProfile.ts，统一从本文件转出。
export * from './hostProfile';

// ===== 主机文件管理 / Agent 生命周期 =====
// 实现见 hostFile.ts，统一从本文件转出。
export * from './hostFile';

// ===== ACME 证书 =====
// 实现见 acmeApi.ts，统一从本文件转出。
export * from './acmeApi';
