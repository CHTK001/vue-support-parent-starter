import { w as unwrapResult, x as http } from "./src-DDwlSqPX.js";
//#region ../../pages/server/src/api/serviceManage.ts
/**
* 服务管理 API 封装
*
* 对应后端监控服务暴露的 REST 接口：
*   1) GET    /ms/monitor/server                        — 节点列表（含运行状态）
*   2) GET    /ms/monitor/server/{id}                   — 节点详情
*   3) POST   /ms/monitor/server                        — 创建节点（enabled=1 立即拉起）
*   4) PUT    /ms/monitor/server/{id}                   — 全量更新（停→替换→重启）
*   5) POST   /ms/monitor/server/{id}/hot-update        — 热更新（过滤器链就地替换，不中断）
*   6) DELETE /ms/monitor/server/{id}                   — 删除节点
*   7) POST   /ms/monitor/server/{id}/start|stop        — 启停
*   8) POST   /ms/monitor/server/{id}/filters/{i}/toggle— 热切换单个过滤器启停
*   9) POST   /ms/monitor/server/{id}/filters/{i}/params— 热更新单个过滤器参数
*  10) GET    /ms/monitor/server/protocols              — 协议下拉（内置 + Server SPI 动态发现）
*  11) GET    /ms/monitor/server/filters                — ServerFilter 下拉（预设 + SPI + FQCN）
*  12) GET    /ms/monitor/server/proxies                — 反向代理节点
*/
var B$1 = "/ms/monitor/server";
var listServerNodes = () => http().get(B$1).then((r) => unwrapResult(r));
var getServerNode = (id) => http().get(`${B$1}/${id}`).then((r) => unwrapResult(r));
var createServerNode = (d) => http().post(B$1).data(d).then((r) => unwrapResult(r));
var updateServerNode = (id, d) => http().put(`${B$1}/${id}`).data(d).then((r) => unwrapResult(r));
/** 热更新：过滤器链就地替换，仅监听参数变更时才重启 */
var hotUpdateServerNode = (id, d) => http().post(`${B$1}/${id}/hot-update`).data(d).then((r) => unwrapResult(r));
var deleteServerNode = (id) => http().delete(`${B$1}/${id}`).then((r) => unwrapResult(r));
var startServerNode = (id) => http().post(`${B$1}/${id}/start`).then((r) => unwrapResult(r));
var stopServerNode = (id) => http().post(`${B$1}/${id}/stop`).then((r) => unwrapResult(r));
/** 先停再启，用于 ERROR 节点排障 */
var restartServerNode = async (id) => {
	await http().post(`${B$1}/${id}/stop`).then((r) => unwrapResult(r));
	return http().post(`${B$1}/${id}/start`).then((r) => unwrapResult(r));
};
var toggleServerFilter = (id, index, enabled) => http().post(`${B$1}/${id}/filters/${index}/toggle?enabled=${enabled}`).then((r) => unwrapResult(r));
var updateServerFilterParams = (id, index, params) => http().post(`${B$1}/${id}/filters/${index}/params`).data(params).then((r) => unwrapResult(r));
var listProtocols = () => http().get(`${B$1}/protocols`).then((r) => unwrapResult(r));
var listFilterTypes = () => http().get(`${B$1}/filters`).then((r) => unwrapResult(r));
/** 按协议 / 服务标识查询服务实例 */
var queryDiscoveryInstances = (protocol, uriSpec) => {
	const qs = new URLSearchParams();
	if (protocol) qs.set("protocol", protocol);
	if (uriSpec) qs.set("uriSpec", uriSpec);
	return http().get(`/ms/monitor/discovery/services${qs.toString() ? `?${qs.toString()}` : ""}`).then((r) => unwrapResult(r));
};
/** 已启用的发现协议列表 */
var listDiscoveryProtocols = () => http().get("/ms/monitor/discovery/protocols").then((r) => unwrapResult(r));
/** 发现服务状态 */
var getDiscoveryStatus = () => http().get("/ms/monitor/discovery/status").then((r) => unwrapResult(r));
//#endregion
//#region ../../pages/server/src/api/index.ts
var B = "/ms/server";
var queryHosts = (params = {}) => http().get(`${B}/host`).query(params).then((r) => unwrapResult(r));
var getHost = (id) => http().get(`${B}/host/${id}`).then((r) => unwrapResult(r));
var fetchLocalAddress = () => http().get(`${B}/host/local-address`).then((r) => unwrapResult(r));
var saveHost = (id, d) => id != null ? http().put(`${B}/host/${id}`).data(d).then((r) => unwrapResult(r)) : http().post(`${B}/host`).data(d).then((r) => unwrapResult(r));
var delHost = (id) => http().delete(`${B}/host/${id}`).then((r) => unwrapResult(r));
/** 获取 VNC 直连凭据（noVNC 浏览器端 RFB 口令认证） */
var getVncCredential = (hostId, identityId) => http().get(`${B}/host/${hostId}/vnc-credential${identityId != null ? `?identityId=${identityId}` : ""}`).then((r) => unwrapResult(r));
var scanPorts = (id) => http().post(`${B}/host/${id}/scan-ports`).then((r) => unwrapResult(r));
var testPrometheusHost = (id) => http().post(`${B}/host/${id}/test-prometheus`).then((r) => unwrapResult(r));
var listBoundIdentities = (hostId) => http().get(`${B}/host/${hostId}/identities`).then((r) => unwrapResult(r));
var bindIdentity = (hostId, identityId) => http().post(`${B}/host/${hostId}/identity/${identityId}`).then((r) => unwrapResult(r));
var unbindIdentity = (hostId, identityId) => http().delete(`${B}/host/${hostId}/identity/${identityId}`).then((r) => unwrapResult(r));
var getGroups = () => http().get(`${B}/group`).then((r) => unwrapResult(r));
var saveGroup = (id, d) => id != null ? http().put(`${B}/group/${id}`).data(d).then((r) => unwrapResult(r)) : http().post(`${B}/group`).data(d).then((r) => unwrapResult(r));
var delGroup = (id) => http().delete(`${B}/group/${id}`).then((r) => unwrapResult(r));
var getKeys = () => http().get(`${B}/key`).then((r) => unwrapResult(r));
var saveKey = (id, d) => id != null ? http().put(`${B}/key/${id}`).data(d).then((r) => unwrapResult(r)) : http().post(`${B}/key`).data(d).then((r) => unwrapResult(r));
var delKey = (id) => http().delete(`${B}/key/${id}`).then((r) => unwrapResult(r));
var generateKeyPair = (name, type, password, remark) => http().post(`${B}/key/generate?name=${encodeURIComponent(name)}&type=${type}${password ? `&password=${encodeURIComponent(password)}` : ""}${remark ? `&remark=${encodeURIComponent(remark)}` : ""}`).timeout(6e4).then((r) => unwrapResult(r));
var getIdentities = () => http().get(`${B}/identity`).then((r) => unwrapResult(r));
var saveIdentity = (id, d) => id != null ? http().put(`${B}/identity/${id}`).data(d).then((r) => unwrapResult(r)) : http().post(`${B}/identity`).data(d).then((r) => unwrapResult(r));
var delIdentity = (id) => http().delete(`${B}/identity/${id}`).then((r) => unwrapResult(r));
var listMailbox = (identityId, folder, limit = 20) => http().get(`${B}/identity/${identityId}/mailbox/list?folder=${folder ?? ""}&limit=${limit}`).then((r) => unwrapResult(r));
var getMailboxMessage = (identityId, folder, subject) => http().get(`${B}/identity/${identityId}/mailbox/message?folder=${folder ?? ""}${subject ? `&subject=${encodeURIComponent(subject)}` : ""}`).then((r) => unwrapResult(r));
var sftpList = (hostId, path, identityId) => http().get(`${B}/sftp/${hostId}?path=${encodeURIComponent(path)}${identityId ? `&identityId=${identityId}` : ""}`).then((r) => unwrapResult(r));
var sftpReadContent = (hostId, path, identityId) => http().get(`${B}/sftp/${hostId}/content?path=${encodeURIComponent(path)}${identityId ? `&identityId=${identityId}` : ""}`).then((r) => unwrapResult(r));
var sftpWriteContent = (hostId, path, content, identityId) => {
	const q = `path=${encodeURIComponent(path)}${identityId ? `&identityId=${identityId}` : ""}`;
	return http().put(`${B}/sftp/${hostId}/content?${q}`).headers({ "Content-Type": "text/plain;charset=UTF-8" }).data(content).then((r) => unwrapResult(r));
};
var sftpMkdir = (hostId, path, identityId) => http().post(`${B}/sftp/${hostId}/mkdir?path=${encodeURIComponent(path)}${identityId ? `&identityId=${identityId}` : ""}`).then((r) => unwrapResult(r));
var sftpDelete = (hostId, path, recursive, identityId) => http().delete(`${B}/sftp/${hostId}?path=${encodeURIComponent(path)}&recursive=${recursive}${identityId ? `&identityId=${identityId}` : ""}`).then((r) => unwrapResult(r));
var sftpRename = (hostId, fromPath, toPath, identityId) => {
	const q = identityId ? `identityId=${identityId}` : "";
	return http().put(`${B}/sftp/${hostId}/rename${q ? "?" + q : ""}`).data({
		fromPath,
		toPath
	}).then((r) => unwrapResult(r));
};
var sftpUpload = (hostId, path, file, identityId) => {
	const form = new FormData();
	form.append("file", file);
	const q = `path=${encodeURIComponent(path)}${identityId ? `&identityId=${identityId}` : ""}`;
	return http().post(`${B}/sftp/${hostId}/upload?${q}`).data(form).then((r) => unwrapResult(r));
};
/** 下载：直接以浏览器地址栏/链接方式触发（走同源代理） */
var sftpDownloadUrl = (hostId, path, identityId) => `${B}/sftp/${hostId}/download?path=${encodeURIComponent(path)}${identityId ? `&identityId=${identityId}` : ""}`;
var getJobs = () => http().get(`${B}/exec/job`).then((r) => unwrapResult(r));
var saveJob = (id, d) => id != null ? http().put(`${B}/exec/job/${id}`).data(d).then((r) => unwrapResult(r)) : http().post(`${B}/exec/job`).data(d).then((r) => unwrapResult(r));
var delJob = (id) => http().delete(`${B}/exec/job/${id}`).then((r) => unwrapResult(r));
/** 立即触发任务；hostIds 为空时用任务自身配置的主机 */
var runJobNow = (id, hostIds, timeoutSeconds) => http().post(`${B}/exec/job/${id}/run`).data({
	hostIds,
	timeoutSeconds
}).then((r) => unwrapResult(r));
/** 执行日志；可按类型 / 主机 / 计划任务过滤 */
var getExecLogs = (type, hostId, jobId) => {
	const qs = new URLSearchParams();
	if (type) qs.set("type", type);
	if (hostId) qs.set("hostId", String(hostId));
	if (jobId) qs.set("jobId", String(jobId));
	return http().get(`${B}/exec/log${qs.toString() ? `?${qs.toString()}` : ""}`).then((r) => unwrapResult(r));
};
var getSessions = (status) => http().get(`${B}/terminal/session${status ? `?status=${status}` : ""}`).then((r) => unwrapResult(r));
var closeSession = (recordId) => http().post(`${B}/terminal/session/${recordId}/close`).then((r) => unwrapResult(r));
var getSnippets = () => http().get(`${B}/terminal/snippet`).then((r) => unwrapResult(r));
var saveSnippet = (d) => http().post(`${B}/terminal/snippet`).data(d).then((r) => unwrapResult(r));
var updateSnippet = (id, d) => http().put(`${B}/terminal/snippet/${id}`).data(d).then((r) => unwrapResult(r));
var delSnippet = (id) => http().delete(`${B}/terminal/snippet/${id}`).then((r) => unwrapResult(r));
var getBookmarks = (hostId) => http().get(`${B}/terminal/bookmark?hostId=${hostId}`).then((r) => unwrapResult(r));
var createBookmark = (d) => http().post(`${B}/terminal/bookmark`).data(d).then((r) => unwrapResult(r));
var delBookmark = (id) => http().delete(`${B}/terminal/bookmark/${id}`).then((r) => unwrapResult(r));
var getMaintenancePlans = () => http().get(`${B}/maintenance-plan`).then((r) => unwrapResult(r));
var saveMaintenancePlan = (id, d) => id != null ? http().put(`${B}/maintenance-plan/${id}`).data(d).then((r) => unwrapResult(r)) : http().post(`${B}/maintenance-plan`).data(d).then((r) => unwrapResult(r));
var delMaintenancePlan = (id) => http().delete(`${B}/maintenance-plan/${id}`).then((r) => unwrapResult(r));
var getGroupTree = () => http().get(`${B}/group/tree`).then((r) => unwrapResult(r));
//#endregion
export { getServerNode as $, runJobNow as A, sftpDownloadUrl as B, getMaintenancePlans as C, listBoundIdentities as D, getVncCredential as E, saveKey as F, sftpUpload as G, sftpMkdir as H, saveMaintenancePlan as I, unbindIdentity as J, sftpWriteContent as K, saveSnippet as L, saveHost as M, saveIdentity as N, listMailbox as O, saveJob as P, getDiscoveryStatus as Q, scanPorts as R, getMailboxMessage as S, getSnippets as T, sftpReadContent as U, sftpList as V, sftpRename as W, createServerNode as X, updateSnippet as Y, deleteServerNode as Z, getGroups as _, delGroup as a, queryDiscoveryInstances as at, getJobs as b, delJob as c, stopServerNode as ct, delSnippet as d, updateServerNode as dt, hotUpdateServerNode as et, fetchLocalAddress as f, getGroupTree as g, getExecLogs as h, delBookmark as i, listServerNodes as it, saveGroup as j, queryHosts as k, delKey as l, toggleServerFilter as lt, getBookmarks as m, closeSession as n, listFilterTypes as nt, delHost as o, restartServerNode as ot, generateKeyPair as p, testPrometheusHost as q, createBookmark as r, listProtocols as rt, delIdentity as s, startServerNode as st, bindIdentity as t, listDiscoveryProtocols as tt, delMaintenancePlan as u, updateServerFilterParams as ut, getHost as v, getSessions as w, getKeys as x, getIdentities as y, sftpDelete as z };
