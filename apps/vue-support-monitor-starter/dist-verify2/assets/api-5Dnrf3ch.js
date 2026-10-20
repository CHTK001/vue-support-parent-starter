import { w as unwrapResult, x as http } from "./src-DDwlSqPX.js";
import { u as fetchDataSources } from "./src-DW2Ffr17.js";
//#region ../../pages/datasource/src/api/nginx/api.ts
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
var unwrap = (res) => unwrapResult(res);
/** 接口根路径 */
var B = "/ms/monitor/nginx";
/** 列出 type 为 nginx 的数据源 */
var fetchNginxSources = async () => {
	return (await fetchDataSources() || []).filter((d) => d.type === "nginx");
};
/**
* 查询指标趋势。
*
* <p>数据来自后台定时采集（默认 30s 一次），保留窗口由后端
* `monitor.data.retention.days` 控制（默认 1，即滚动 24 小时）。</p>
*
* @param datasourceId 数据源 ID
* @param hours       回溯小时数，缺省 24
* @param interval    采样间隔（分钟），缺省 30
* @return 趋势数据
*/
var fetchNginxTrend = (datasourceId, hours, interval) => http().get(`${B}/metric/trend`).query({
	datasourceId,
	hours,
	interval
}).noToast(true).then((r) => unwrap(r));
/**
* SSE 订阅地址。
*
* <p>刻意返回**相对路径**而不是拼绝对地址：SSE 客户端会把 `baseUrl` 拼到前面，
* 写死绝对地址会让 dev 代理与生产部署各写一份、极易指错后端。</p>
*
* @param datasourceId 数据源 ID
* @returns 相对路径
*/
var nginxMetricStreamUrl = (datasourceId) => datasourceId ? `${B}/metric/stream?datasourceId=${datasourceId}` : `${B}/metric/stream`;
/**
* 读取按 URL 的访问趋势。
*
* <p>与 24 小时趋势是两条独立链路：这个直接扫 access log 尾部，
* <strong>时间跨度由日志密度决定</strong>（高流量时可能只有几分钟），
* 所以界面上必须用 {@link NginxUrlTrend.message} 把实际覆盖区间标出来。</p>
*
* @param datasourceId 数据源 ID
* @param lines        扫描尾部行数，缺省 5000
* @param topN         取前几个 URL，缺省 5
* @return URL 趋势
*/
var fetchNginxUrlTrend = (datasourceId, lines, topN) => http().get(`${B}/log/url-trend`).query({
	datasourceId,
	lines,
	topN
}).timeout(6e4).then((r) => unwrap(r));
/**
* 读取访问日志 Top 统计。
*
* <p>后端 SSH 拉 access log 尾部后解析，<strong>不入库</strong>，所以每次都是实时扫描。</p>
*
* @param datasourceId 数据源 ID
* @param lines        扫描尾部行数，缺省 2000
* @param minutes      只统计最近 N 分钟，缺省 0（不限）
* @param topN         每维度取前几，缺省 10
* @return Top 统计
*/
var fetchNginxAccessTop = (datasourceId, lines, minutes, topN) => http().get(`${B}/log/top`).query({
	datasourceId,
	lines,
	minutes,
	topN
}).noToast(true).then((r) => unwrap(r));
/**
* 总览。
*
* <p>超时给到 60s：这个接口要走 SSH 上目标机、跑 {@code nginx -V} 定位 prefix、
* 读配置目录、跑 {@code nginx -t} 语法检查，再拉 stub_status。
* 实测常态就要 3.6~4.2s，赶上采集器（每 30s 一轮）并发时经常冲过 10s。</p>
*
* <p>原来没设 timeout，用的是全局默认 10s，于是本机验收里间歇性报
* 「总览加载失败 AxiosError: timeout of 10000ms exceeded」——
* 看着像接口挂了，其实是超时预算不够。相邻的重接口（test/reload/stop 等）
* 都显式给了 60~120s，唯独这里漏了。</p>
*/
var fetchNginxOverview = (datasourceId) => http().get(`${B}/overview`).query({ datasourceId }).timeout(6e4).noToast(true).then((r) => unwrap(r));
/** 列出配置文件 */
var fetchNginxConfigFiles = (datasourceId) => http().get(`${B}/config/files`).query({ datasourceId }).then((r) => unwrap(r));
/** 读取配置文件内容 */
var fetchNginxConfig = (datasourceId, path) => http().get(`${B}/config`).query({
	datasourceId,
	path
}).then((r) => unwrap(r));
/** 解析配置为语法树 */
var fetchNginxConfigTree = (datasourceId, path) => http().get(`${B}/config/tree`).query({
	datasourceId,
	path
}).timeout(6e4).then((r) => unwrap(r));
/** 应用配置改动（文件模式 / UI 模式） */
var applyNginxConfig = (data) => http().post(`${B}/config/apply`).data(data).timeout(12e4).then((r) => unwrap(r));
/** 指令元数据 */
var fetchNginxDirectives = (scope) => http().get(`${B}/directives`).query(scope && scope !== "all" ? { scope } : {}).then((r) => unwrap(r));
/** 站点清单：把所有 .conf 里的 server 块抽平 */
var fetchNginxSites = (datasourceId) => http().get(`${B}/sites`).query({ datasourceId }).timeout(12e4).then((r) => unwrap(r));
/** 配置模板库 */
var fetchNginxTemplates = () => http().get(`${B}/templates`).then((r) => unwrap(r));
/** 语法检查 */
var testNginx = (datasourceId) => http().post(`${B}/test`).query({ datasourceId }).timeout(6e4).then((r) => unwrap(r));
/** 重载 */
var reloadNginx = (datasourceId) => http().post(`${B}/reload`).query({ datasourceId }).timeout(6e4).then((r) => unwrap(r));
/** 重启 */
var restartNginx = (datasourceId) => http().post(`${B}/restart`).query({ datasourceId }).timeout(12e4).then((r) => unwrap(r));
/** 停止 */
var stopNginx = (datasourceId) => http().post(`${B}/stop`).query({ datasourceId }).timeout(6e4).then((r) => unwrap(r));
/** 启动 */
var startNginx = (datasourceId) => http().post(`${B}/start`).query({ datasourceId }).timeout(6e4).then((r) => unwrap(r));
/** stub_status 实时状态 */
var fetchNginxStatus = (datasourceId) => http().get(`${B}/status`).query({ datasourceId }).noToast(true).then((r) => unwrap(r));
/** 列出日志文件 */
var fetchNginxLogFiles = (datasourceId) => http().get(`${B}/log/files`).query({ datasourceId }).then((r) => unwrap(r));
/** 增量读取日志：只返回游标之后的新内容 */
var fetchNginxLogChunk = (datasourceId, path, lines = 200, cursor) => http().get(`${B}/log/chunk`).query({
	datasourceId,
	path,
	lines,
	cursor: cursor ?? void 0
}).noToast(true).then((r) => unwrap(r));
/** 立即备份 */
var backupNginxConfig = (datasourceId, path, reason) => http().post(`${B}/backup`).query({
	datasourceId,
	path,
	reason
}).timeout(6e4).then((r) => unwrap(r));
/** 列出备份 */
var fetchNginxBackups = (datasourceId) => http().get(`${B}/backup`).query({ datasourceId }).then((r) => unwrap(r));
/**
* 删除备份（单条与批量同一入口：names 单元素即单条删除）。
*
* <p>名字逐个 encodeURIComponent 后按 {@code names=a&names=b} 重复拼进 URL：
* axios 对数组参数的默认序列化是 {@code names[]=a} 形态，Spring 的
* {@code @RequestParam("names")} 认不了——这里不赌序列化默认行为。</p>
*/
var deleteNginxBackups = (datasourceId, names) => {
	const qs = [`datasourceId=${datasourceId ?? ""}`].concat(names.map((n) => `names=${encodeURIComponent(n)}`)).join("&");
	return http().delete(`${B}/backup?${qs}`).timeout(6e4).then((r) => unwrap(r));
};
/** 从备份恢复；原始路径含下划线时反推不可逆，必须显式给出 targetPath */
var restoreNginxBackup = (datasourceId, backupName, targetPath) => http().post(`${B}/backup/${encodeURIComponent(backupName)}/restore`).query({
	datasourceId,
	targetPath
}).timeout(6e4).then((r) => unwrap(r));
/** 读取备份内容，供预览与下载使用 */
var fetchNginxBackupContent = (datasourceId, name) => http().get(`${B}/backup/content`).query({
	datasourceId,
	name
}).timeout(6e4).then((r) => unwrap(r));
/** 备份与当前配置的差异 */
var fetchNginxBackupDiff = (datasourceId, name, target) => http().get(`${B}/backup/diff`).query({
	datasourceId,
	name,
	target
}).timeout(6e4).then((r) => unwrap(r));
/** 读取看板 */
var fetchNginxDashboard = (datasourceId) => http().get(`${B}/dashboard`).query({ datasourceId }).noToast(true).then((r) => unwrap(r));
/** 保存看板（实时保存链路后端入口） */
var saveNginxDashboard = (payload) => http().put(`${B}/dashboard`).data(payload).noToast(true).then((r) => unwrap(r));
/** 重新生成嵌入令牌 */
var regenerateNginxToken = (datasourceId) => http().post(`${B}/dashboard/token`).query({ datasourceId }).noToast(true).then((r) => unwrap(r));
/** 嵌入返回解包：后端 ReturnResult 信封 */
var unwrapNgxEmbed = (body) => {
	if (body && (body.code === "00000" || body.code === 200 || body.success === true)) return body.data;
	throw new Error(body?.msg || body?.message || "嵌入请求失败");
};
var ngxEmbedGet = async (token, subPath, query) => {
	let url = `${B}/dashboard/embed/${encodeURIComponent(token)}${subPath}`;
	if (query) {
		const qs = new URLSearchParams();
		Object.entries(query).forEach(([k, v]) => {
			if (v !== void 0 && v !== null && String(v) !== "") qs.set(k, String(v));
		});
		const text = qs.toString();
		if (text) url += `?${text}`;
	}
	const res = await fetch(url, { headers: { Accept: "application/json" } });
	const body = await res.json().catch(() => null);
	if (!res.ok && !body) throw new Error(`嵌入请求失败（HTTP ${res.status}）`);
	return unwrapNgxEmbed(body);
};
/** 按令牌读取嵌入看板 */
var fetchEmbedNginxDashboard = (token) => ngxEmbedGet(token, "");
/** 嵌入实时状态 */
var embedNginxStatus = (token) => ngxEmbedGet(token, "/status");
/** 嵌入指标趋势 */
var embedNginxTrend = (token, hours, interval) => ngxEmbedGet(token, "/metric/trend", {
	hours,
	interval
});
/** 嵌入访问日志 Top 统计 */
var embedNginxAccessTop = (token, lines, minutes, topN) => ngxEmbedGet(token, "/log/top", {
	lines,
	minutes,
	topN
});
/** 嵌入 URL 访问趋势 */
var embedNginxUrlTrend = (token, lines, topN) => ngxEmbedGet(token, "/log/url-trend", {
	lines,
	topN
});
/** 构造控制台取数上下文 */
var createNgxConsoleContext = (getDatasourceId) => ({
	embed: false,
	get datasourceId() {
		return getDatasourceId() ?? null;
	},
	status: () => fetchNginxStatus(getDatasourceId() ?? void 0),
	trend: (hours, interval) => fetchNginxTrend(getDatasourceId() ?? void 0, hours, interval),
	accessTop: (lines, minutes, topN) => fetchNginxAccessTop(getDatasourceId() ?? void 0, lines, minutes, topN),
	urlTrend: (lines, topN) => fetchNginxUrlTrend(getDatasourceId() ?? void 0, lines, topN)
});
/** 构造嵌入取数上下文 */
var createNgxEmbedContext = (token) => ({
	embed: true,
	datasourceId: null,
	status: () => embedNginxStatus(token),
	trend: (hours, interval) => embedNginxTrend(token, hours, interval),
	accessTop: (lines, minutes, topN) => embedNginxAccessTop(token, lines, minutes, topN),
	urlTrend: (lines, topN) => embedNginxUrlTrend(token, lines, topN)
});
//#endregion
export { startNginx as A, fetchNginxUrlTrend as C, restartNginx as D, reloadNginx as E, testNginx as M, restoreNginxBackup as O, fetchNginxTrend as S, regenerateNginxToken as T, fetchNginxLogFiles as _, deleteNginxBackups as a, fetchNginxSources as b, fetchNginxBackupContent as c, fetchNginxConfig as d, fetchNginxConfigFiles as f, fetchNginxLogChunk as g, fetchNginxDirectives as h, createNgxEmbedContext as i, stopNginx as j, saveNginxDashboard as k, fetchNginxBackupDiff as l, fetchNginxDashboard as m, backupNginxConfig as n, fetchEmbedNginxDashboard as o, fetchNginxConfigTree as p, createNgxConsoleContext as r, fetchNginxAccessTop as s, applyNginxConfig as t, fetchNginxBackups as u, fetchNginxOverview as v, nginxMetricStreamUrl as w, fetchNginxTemplates as x, fetchNginxSites as y };
