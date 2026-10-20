import { w as unwrapResult, x as http } from "./src-DDwlSqPX.js";
//#region src/monitorApi.ts
var unwrap = (res) => unwrapResult(res);
/**
* 获取全部监控项列表
* @returns 监控项列表
*/
var fetchMonitors = () => http().get("/ms/monitor").then((r) => unwrap(r));
/**
* 获取全部告警事件列表
* @returns 告警事件列表
*/
var fetchAlarmEvents = () => http().get("/ms/monitor/alarm/event").then((r) => unwrap(r));
/**
* 处理告警事件（remark 备注，falseAlarm 标记误报）—— design.md §4.4
* @param id 告警事件 ID
* @param remark 处理备注
* @param falseAlarm 是否标记为误报
* @returns 处理结果
*/
var handleAlarmEvent = (id, remark, falseAlarm) => http().post(`/ms/monitor/alarm/event/${id}/handle?remark=${encodeURIComponent(remark)}&falseAlarm=${falseAlarm}`).then((r) => unwrap(r));
/**
* 告警级别（P0~P4，兜底 P3）
* @param e 告警事件
* @returns 归一化后的告警级别字符串
*/
function alarmLevel(e) {
	const lv = String(e.msMonitorAlarmEventLevel || "").toUpperCase();
	return /^P[0-4]$/.test(lv) ? lv : "P3";
}
/**
* 判断告警事件是否未处理
* @param e 告警事件
* @returns 未处理返回 true
*/
function isUnhandled(e) {
	return String(e.msMonitorAlarmEventStatus || "").toUpperCase() === "NEW";
}
/**
* 获取全部告警策略
* @returns 告警策略列表
*/
var fetchAlarmPolicies = () => http().get("/ms/monitor/alarm/policy").then((r) => unwrap(r));
/**
* 保存告警策略（id 为 null 时创建，否则更新）
* @param id 策略 ID，null 表示新建
* @param d 策略数据
* @returns 保存后的策略
*/
var saveAlarmPolicy = (id, d) => id != null ? http().put(`/ms/monitor/alarm/policy/${id}`).data(d).then((r) => unwrap(r)) : http().post("/ms/monitor/alarm/policy").data(d).then((r) => unwrap(r));
/**
* 删除告警策略
* @param id 策略 ID
* @returns 删除结果
*/
var delAlarmPolicy = (id) => http().delete(`/ms/monitor/alarm/policy/${id}`).then((r) => unwrap(r));
/**
* 获取告警规则列表
* @param policyId 策略 ID（可选，不传则查全部）
* @returns 告警规则列表
*/
var fetchAlarmRules = (policyId) => http().get(`/ms/monitor/alarm/rule${policyId ? `?policyId=${policyId}` : ""}`).then((r) => unwrap(r));
/**
* 保存告警规则（id 为 null 时创建，否则更新）
* @param id 规则 ID，null 表示新建
* @param d 规则数据
* @returns 保存后的规则
*/
var saveAlarmRule = (id, d) => id != null ? http().put(`/ms/monitor/alarm/rule/${id}`).data(d).then((r) => unwrap(r)) : http().post("/ms/monitor/alarm/rule").data(d).then((r) => unwrap(r));
/**
* 删除告警规则
* @param id 规则 ID
* @returns 删除结果
*/
var delAlarmRule = (id) => http().delete(`/ms/monitor/alarm/rule/${id}`).then((r) => unwrap(r));
/**
* 测试告警规则
* @param ruleId 规则 ID
* @param metricName 测试指标名（可选）
* @param value 测试值（可选）
* @returns 测试是否触发告警
*/
var testAlarmRule = (ruleId, metricName, value) => http().get(`/ms/monitor/alarm/rule/${ruleId}/test?metricName=${encodeURIComponent(metricName ?? "")}&value=${value ?? 0}`).then((r) => unwrap(r));
/**
* 获取维护窗口列表
* @param policyId 策略 ID（可选，不传则查全部）
* @returns 维护窗口列表
*/
var fetchAlarmWindows = (policyId) => http().get("/ms/monitor/alarm/maintenance-window").query({ policyId }).then((r) => unwrap(r));
/**
* 保存维护窗口（id 为 null 时创建，否则更新）
* @param id 窗口 ID，null 表示新建
* @param d 窗口数据
* @returns 保存后的窗口
*/
var saveAlarmWindow = (id, d) => id != null ? http().put(`/ms/monitor/alarm/maintenance-window/${id}`).data(d).then((r) => unwrap(r)) : http().post("/ms/monitor/alarm/maintenance-window").data(d).then((r) => unwrap(r));
/**
* 删除维护窗口
* @param id 窗口 ID
* @returns 删除结果
*/
var delAlarmWindow = (id) => http().delete(`/ms/monitor/alarm/maintenance-window/${id}`).then((r) => unwrap(r));
/**
* 查询 AI 分析是否启用
* @returns AI 状态
*/
var fetchAiStatus = () => http().get("/ms/monitor/ai/status").then((r) => unwrap(r));
/**
* 主机指标智能分析
* @param hostId 主机 ID（ms_server_host.id）
* @param options 可选配置（dimension 分析重点 / systemPrompt / model）
* @returns AI 分析结果
*/
var aiAnalyzeHost = (hostId, options) => http().post(`/ms/monitor/ai/host/${hostId}/analyze`).data({
	dimension: options?.dimension,
	systemPrompt: options?.systemPrompt,
	model: options?.model
}).timeout(12e4).then((r) => unwrap(r));
/** 关闭进程 */
var killProcess = (pid, hostId) => http().post(`/ms/system/process/${pid}/kill${hostId ? `?hostId=${hostId}` : ""}`).then((r) => unwrap(r));
/** 启动服务 */
var startService = (name, hostId) => http().post(`/ms/system/service/${encodeURIComponent(name)}/start${hostId ? `?hostId=${hostId}` : ""}`).then((r) => unwrap(r));
/** 停止服务 */
var stopService = (name, hostId) => http().post(`/ms/system/service/${encodeURIComponent(name)}/stop${hostId ? `?hostId=${hostId}` : ""}`).then((r) => unwrap(r));
/** 重启服务 */
var restartService = (name, hostId) => http().post(`/ms/system/service/${encodeURIComponent(name)}/restart${hostId ? `?hostId=${hostId}` : ""}`).then((r) => unwrap(r));
/** 重启进程（后端按原命令行与工作目录重新拉起） */
var restartHostProcess = (pid, hostId) => http().post("/ms/system/process/restart").query({
	pid,
	...hostId ? { hostId } : {}
}).timeout(6e4).then((r) => unwrap(r));
/** 关闭占用端口的进程 */
var closeNetProcess = (pid, port, hostId) => http().post("/ms/system/netproc/close").query({
	pid,
	...port ? { port } : {},
	...hostId ? { hostId } : {}
}).timeout(6e4).then((r) => unwrap(r));
/** 新增/更新系统级环境变量（Windows 写 Machine，Linux 写 /etc/environment） */
var setHostEnvVar = (hostId, name, value) => http().post("/ms/system/env/set").query({ hostId }).data({
	name,
	value
}).timeout(6e4).then((r) => unwrap(r));
/** 删除系统级环境变量 */
var deleteHostEnvVar = (hostId, name) => http().post("/ms/system/env/delete").query({
	hostId,
	name
}).timeout(6e4).then((r) => unwrap(r));
/**
* 拉取主机画像概览
* @param hostId 主机 id
* @param opts.live    是否实时采集：默认 false 只读台账快照（进入画像不触发采集）；true 经通道实时拉取
* @param opts.persist 实时采集时是否回写主机台账，默认 true（仅 live=true 生效）
*/
var fetchHostProfile = (hostId, opts = {}) => http().get(`/ms/server/host/profile/${hostId}`).query({
	live: opts.live ?? false,
	persist: opts.persist ?? true
}).timeout(9e4).then((r) => unwrap(r));
/**
* 拉取主机画像某个分区
* @param hostId 主机 id
* @param section ports/processes/services/disks/network/env
* @param page 页码（进程/服务）
* @param size 每页条数（进程/服务）
* @param keyword 关键字（进程/服务，匹配 PID/名称/用户/命令行，跨页命中）
*/
var fetchHostProfileSection = (hostId, section, page, size, keyword) => http().get(`/ms/server/host/profile/${hostId}/${section}`).query({
	page,
	size,
	keyword
}).timeout(6e4).then((r) => unwrap(r));
/** 从 fetchHostProfileSection 响应中提取行数组（兼容 SectionPage 和裸数组） */
function sectionRows(res) {
	if (Array.isArray(res)) return res;
	if (res && Array.isArray(res.rows)) return res.rows;
	return [];
}
/** 读取网卡详情 */
var fetchAdapterDetail = (hostId, name) => http().get(`/ms/server/host/network/${hostId}/adapter`).query({ name }).timeout(3e4).then((r) => unwrap(r));
/** 列出主机全部可见网卡（Windows，名称与系统一致） */
var fetchAdapters = (hostId) => http().get(`/ms/server/host/network/${hostId}/adapters`).timeout(3e4).then((r) => unwrap(r));
/** 读取 IPv4 配置 */
var fetchIPv4Config = (hostId, name) => http().get(`/ms/server/host/network/${hostId}/ipv4`).query({ name }).timeout(3e4).then((r) => unwrap(r));
/** 下发 IPv4 配置（DHCP / 静态地址、网关、DNS） */
var saveIPv4Config = (hostId, config) => http().put(`/ms/server/host/network/${hostId}/ipv4`).data(config).timeout(3e4).then((r) => unwrap(r));
/**
* 提交 Agent 生命周期动作（安装/重装/升级/卸载）。
* <p>
* 安装对应后端 deploy 端点，其余动作同名；进度通过 socket 的 monitor/agent-deploy 事件推送。
* @param hostId 主机 ID
* @param action 生命周期动作
* @returns 后端受理的动作标识
*/
var submitAgentAction = (hostId, action) => {
	const endpoint = action === "install" ? "deploy" : action;
	return http().post(`/ms/server/host/agent/${hostId}/${endpoint}`).then((r) => unwrap(r));
};
/**
* 主机文件接口前缀
* @param hostId 主机 ID
* @returns 前缀路径
*/
var hostFileBase = (hostId) => `/ms/server/host/file/${hostId}`;
/**
* 列出主机目录
* @param hostId 主机 ID
* @param path 目录路径
*/
var fetchHostFiles = (hostId, path) => http().get(hostFileBase(hostId)).query({ path }).then((r) => unwrap(r));
/**
* 读取主机文本文件
* @param hostId 主机 ID
* @param path 文件路径
*/
var readHostFileContent = (hostId, path) => http().get(`${hostFileBase(hostId)}/content`).query({ path }).then((r) => unwrap(r));
/**
* 写入主机文本文件
* @param hostId 主机 ID
* @param path 文件路径
* @param content 内容
*/
var writeHostFileContent = (hostId, path, content) => http().put(`${hostFileBase(hostId)}/content`).query({ path }).headers({ "Content-Type": "text/plain;charset=utf-8" }).data(content).then((r) => unwrap(r));
/**
* 创建主机目录
* @param hostId 主机 ID
* @param path 目录路径
*/
var mkdirHostFile = (hostId, path) => http().post(`${hostFileBase(hostId)}/mkdir`).query({ path }).then((r) => unwrap(r));
/**
* 删除主机文件 / 目录
* @param hostId 主机 ID
* @param path 目标路径
*/
var deleteHostFile = (hostId, path) => http().delete(hostFileBase(hostId)).query({ path }).then((r) => unwrap(r));
/**
* 重命名 / 移动主机文件
* @param hostId 主机 ID
* @param from 源路径
* @param to 目标路径
*/
var renameHostFile = (hostId, from, to) => http().put(`${hostFileBase(hostId)}/rename`).query({
	from,
	to
}).then((r) => unwrap(r));
/**
* 上传文件到主机目录
* @param hostId 主机 ID
* @param dir 目标目录
* @param file 文件
*/
var uploadHostFile = (hostId, dir, file) => {
	const form = new FormData();
	form.append("file", file);
	return http().post(`${hostFileBase(hostId)}/upload`).query({ path: dir }).data(form).then((r) => unwrap(r));
};
/**
* 下载主机文件，返回 Blob（由组件触发浏览器保存）
* @param hostId 主机 ID
* @param path 文件路径
*/
var downloadHostFile = (hostId, path) => http().get(`${hostFileBase(hostId)}/download`).query({ path }).responseType("blob").then((r) => r.data);
/**
* 读取主机文件/目录权限（类 Unix）
* @param hostId 主机 ID
* @param path 目标路径
*/
var fetchHostPerms = (hostId, path) => http().get(`${hostFileBase(hostId)}/chmod`).query({ path }).then((r) => unwrap(r));
/**
* 下发主机文件/目录权限（类 Unix）
* @param hostId 主机 ID
* @param path 目标路径
* @param mode 八进制权限（3~4 位）
*/
var saveHostPerms = (hostId, path, mode) => http().put(`${hostFileBase(hostId)}/chmod`).query({
	path,
	mode
}).then((r) => unwrap(r));
//#endregion
export { restartService as A, submitAgentAction as B, handleAlarmEvent as C, readHostFileContent as D, mkdirHostFile as E, saveIPv4Config as F, uploadHostFile as H, sectionRows as I, setHostEnvVar as L, saveAlarmRule as M, saveAlarmWindow as N, renameHostFile as O, saveHostPerms as P, startService as R, fetchMonitors as S, killProcess as T, writeHostFileContent as U, testAlarmRule as V, fetchHostFiles as _, delAlarmRule as a, fetchHostProfileSection as b, deleteHostFile as c, fetchAdapters as d, fetchAiStatus as f, fetchAlarmWindows as g, fetchAlarmRules as h, delAlarmPolicy as i, saveAlarmPolicy as j, restartHostProcess as k, downloadHostFile as l, fetchAlarmPolicies as m, alarmLevel as n, delAlarmWindow as o, fetchAlarmEvents as p, closeNetProcess as r, deleteHostEnvVar as s, aiAnalyzeHost as t, fetchAdapterDetail as u, fetchHostPerms as v, isUnhandled as w, fetchIPv4Config as x, fetchHostProfile as y, stopService as z };
