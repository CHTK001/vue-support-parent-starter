import { http, unwrapResult } from '@repo/utils';

const B = '/ms/server';

// ===== 主机 MsServerHost =====
export const queryHosts = (params: { keyword?: string; groupId?: number | null; status?: number | null } = {}) =>
  http().get(`${B}/host`).query(params as Record<string, unknown>).then(r => unwrapResult<any[]>(r));
export const getHost = (id: number) => http().get(`${B}/host/${id}`).then(r => unwrapResult<any>(r));
export const saveHost = (id: number | null, d: any) => id
  ? http().put(`${B}/host/${id}`).data(d).then(r => unwrapResult<any>(r))
  : http().post(`${B}/host`).data(d).then(r => unwrapResult<any>(r));
export const delHost = (id: number) => http().delete(`${B}/host/${id}`).then(r => unwrapResult<boolean>(r));
export const switchHost = (id: number, enabled: boolean) =>
  http().put(`${B}/host/${id}/status?enabled=${enabled}`).then(r => unwrapResult<boolean>(r));
export const testConnectHost = (id: number) =>
  http().post(`${B}/host/${id}/test-connect`).then(r => unwrapResult<string>(r));

// ===== 身份绑定 =====
export const listBoundIdentities = (hostId: number) =>
  http().get(`${B}/host/${hostId}/identities`).then(r => unwrapResult<number[]>(r));
export const bindIdentity = (hostId: number, identityId: number) =>
  http().post(`${B}/host/${hostId}/identity/${identityId}`).then(r => unwrapResult<boolean>(r));
export const unbindIdentity = (hostId: number, identityId: number) =>
  http().delete(`${B}/host/${hostId}/identity/${identityId}`).then(r => unwrapResult<boolean>(r));

// ===== 分组 MsServerGroup =====
export const getGroups = () => http().get(`${B}/group`).then(r => unwrapResult<any[]>(r));
export const saveGroup = (id: number | null, d: any) => id
  ? http().put(`${B}/group/${id}`).data(d).then(r => unwrapResult<any>(r))
  : http().post(`${B}/group`).data(d).then(r => unwrapResult<any>(r));
export const delGroup = (id: number) => http().delete(`${B}/group/${id}`).then(r => unwrapResult<boolean>(r));

// ===== 密钥 MsServerKey（脱敏返回）=====
export const getKeys = () => http().get(`${B}/key`).then(r => unwrapResult<any[]>(r));
export const saveKey = (id: number | null, d: any) => id
  ? http().put(`${B}/key/${id}`).data(d).then(r => unwrapResult<any>(r))
  : http().post(`${B}/key`).data(d).then(r => unwrapResult<any>(r));
export const delKey = (id: number) => http().delete(`${B}/key/${id}`).then(r => unwrapResult<boolean>(r));

// ===== 身份 MsServerIdentity（脱敏返回）=====
export const getIdentities = () => http().get(`${B}/identity`).then(r => unwrapResult<any[]>(r));
export const saveIdentity = (id: number | null, d: any) => id
  ? http().put(`${B}/identity/${id}`).data(d).then(r => unwrapResult<any>(r))
  : http().post(`${B}/identity`).data(d).then(r => unwrapResult<any>(r));
export const delIdentity = (id: number) => http().delete(`${B}/identity/${id}`).then(r => unwrapResult<boolean>(r));

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
export const saveJob = (id: number | null, d: any) => id
  ? http().put(`${B}/exec/job/${id}`).data(d).then(r => unwrapResult<any>(r))
  : http().post(`${B}/exec/job`).data(d).then(r => unwrapResult<any>(r));
export const delJob = (id: number) => http().delete(`${B}/exec/job/${id}`).then(r => unwrapResult<boolean>(r));
export const runJobNow = (id: number) => http().post(`${B}/exec/job/${id}/run`).then(r => unwrapResult<any[]>(r));
export const getExecLogs = (type?: string, hostId?: number) =>
  http().get(`${B}/exec/log?type=${type ?? ''}${hostId ? `&hostId=${hostId}` : ''}`).then(r => unwrapResult<any[]>(r));

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
  const proto = location.protocol === 'https:' ? 'wss' : 'ws';
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
