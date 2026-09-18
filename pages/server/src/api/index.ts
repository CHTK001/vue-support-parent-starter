import { http, unwrapResult } from '@repo/utils';

const B = '/ms/server';

// ===== 主机 MsServerHost =====
export const queryHosts = (params: { keyword?: string; groupId?: number | null; status?: number | null } = {}) =>
  http().get(`${B}/host`).query(params as Record<string, unknown>).then(r => unwrapResult<any[]>(r));
export const getHost = (id: number) => http().get(`${B}/host/${id}`).then(r => unwrapResult<any>(r));
export const saveHost = (id: number | null, d: any) => id != null
  ? http().put(`${B}/host/${id}`).data(d).then(r => unwrapResult<any>(r))
  : http().post(`${B}/host`).data(d).then(r => unwrapResult<any>(r));
export const delHost = (id: number) => http().delete(`${B}/host/${id}`).then(r => unwrapResult<boolean>(r));
export const switchHost = (id: number, enabled: boolean) =>
  http().put(`${B}/host/${id}/status?enabled=${enabled}`).then(r => unwrapResult<boolean>(r));
export const testConnectHost = (id: number) =>
  http().post(`${B}/host/${id}/test-connect`).then(r => unwrapResult<string>(r));
export const detectHost = (id: number) =>
  http().post(`${B}/host/${id}/detect`).then(r => unwrapResult<any>(r));
export const scanPorts = (id: number) =>
  http().post(`${B}/host/${id}/scan-ports`).then(r => unwrapResult<any>(r));
export const testPrometheusHost = (id: number) =>
  http().post(`${B}/host/${id}/test-prometheus`).then(r => unwrapResult<string>(r));
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
  http().post(`${B}/key/generate?name=${encodeURIComponent(name)}&type=${type}${password ? `&password=${encodeURIComponent(password)}` : ''}${remark ? `&remark=${encodeURIComponent(remark)}` : ''}`).then(r => unwrapResult<{ publicKey: string; privateKey: string }>(r));

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
  return http().put(`${B}/sftp/${hostId}/content?${q}`).data(content).then(r => unwrapResult<boolean>(r));
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
export const runJobNow = (id: number) => http().post(`${B}/exec/job/${id}/run`).then(r => unwrapResult<any[]>(r));
export const getExecLogs = (type?: string, hostId?: number) =>
  http().get(`${B}/exec/log?type=${type ?? ''}${hostId ? `&hostId=${hostId}` : ''}`).then(r => unwrapResult<any[]>(r));

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
export const getSnippets = () => http().get(`${B}/terminal/snippet`).then(r => unwrapResult<any[]>(r));
export const saveSnippet = (d: any) => http().post(`${B}/terminal/snippet`).data(d).then(r => unwrapResult<any>(r));
export const delSnippet = (id: number) => http().delete(`${B}/terminal/snippet/${id}`).then(r => unwrapResult<boolean>(r));
export const getBookmarks = (hostId: number) =>
  http().get(`${B}/terminal/bookmark?hostId=${hostId}`).then(r => unwrapResult<any[]>(r));
export const createBookmark = (d: any) => http().post(`${B}/terminal/bookmark`).data(d).then(r => unwrapResult<any>(r));
export const delBookmark = (id: number) => http().delete(`${B}/terminal/bookmark/${id}`).then(r => unwrapResult<boolean>(r));

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
