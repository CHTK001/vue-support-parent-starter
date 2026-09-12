/**
 * 发布项目管理模块 API 封装（@pages/project）
 *
 * 对应后端 spring-support-project-starter（/ms/project）。
 * 使用 @repo/core 的 http 链式调用，返回 unwrapResult 后的业务数据。
 */
import { http, unwrapResult } from '@repo/utils';

const B = '/ms/project';

/* ================== 项目台账 ================== */

/** 项目列表（卡片展示） */
export const queryProjects = (params: { keyword?: string; type?: string } = {}) =>
  http().get(B).query(params as Record<string, unknown>).then(r => unwrapResult<any[]>(r));

/** 项目详情 */
export const getProject = (id: number) =>
  http().get(`${B}/${id}`).then(r => unwrapResult<any>(r));

/** 新增/更新项目 */
export const saveProject = (id: number | null, d: any) => id != null
  ? http().put(`${B}/${id}`).data(d).then(r => unwrapResult<any>(r))
  : http().post(B).data(d).then(r => unwrapResult<any>(r));

/** 删除项目 */
export const delProject = (id: number) =>
  http().delete(`${B}/${id}`).then(r => unwrapResult<boolean>(r));

/** 更新启用状态 */
export const switchProject = (id: number, enabled: boolean) =>
  http().put(`${B}/${id}/status?enabled=${enabled}`).then(r => unwrapResult<boolean>(r));

/** 可选服务器（按 OS 过滤） */
export const queryHostOptions = (os?: string) =>
  http().get(`${B}/host-options${os ? `?os=${encodeURIComponent(os)}` : ''}`).then(r => unwrapResult<any[]>(r));

/* ================== 部署/升级/启停 ================== */

/** 部署/升级项目（拖拽上传） */
export const deployProject = (id: number, file: File, action = 'DEPLOY') => {
  const form = new FormData();
  form.append('file', file);
  return http()
    .post(`${B}/${id}/deploy?action=${action}`)
    .data(form)
    .then(r => unwrapResult<any[]>(r));
};

/** 启动项目 */
export const startProject = (id: number) =>
  http().post(`${B}/${id}/start`).then(r => unwrapResult<any[]>(r));

/** 停止项目 */
export const stopProject = (id: number) =>
  http().post(`${B}/${id}/stop`).then(r => unwrapResult<any[]>(r));

/** 重启项目 */
export const restartProject = (id: number) =>
  http().post(`${B}/${id}/restart`).then(r => unwrapResult<any[]>(r));

/** 部署日志 */
export const getDeployLogs = (id: number, action?: string) =>
  http().get(`${B}/${id}/logs${action ? `?action=${encodeURIComponent(action)}` : ''}`).then(r => unwrapResult<any[]>(r));

/** 部署包归档列表（历史版本） */
export const getArchives = (id: number, hostId?: number) =>
  http().get(`${B}/${id}/archives${hostId ? `?hostId=${hostId}` : ''}`).then(r => unwrapResult<any[]>(r));

/** 回滚到指定历史版本 */
export const rollbackProject = (id: number, archiveId: number) =>
  http().post(`${B}/${id}/rollback?archiveId=${archiveId}`).then(r => unwrapResult<any[]>(r));

/** 实时查看项目日志（tail） */
export const tailProjectLog = (id: number, hostId: number, cursor?: number, lines = 500) =>
  http().get(`${B}/${id}/log?hostId=${hostId}&lines=${lines}${cursor != null ? `&cursor=${cursor}` : ''}`).then(r => unwrapResult<{ content: string; cursor: number; eof: boolean }>(r));
