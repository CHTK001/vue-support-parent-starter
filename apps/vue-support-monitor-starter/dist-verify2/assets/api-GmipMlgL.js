import { w as unwrapResult, x as http } from "./src-DDwlSqPX.js";
//#region ../../pages/monitor/src/api/index.ts
/**
* 后端统一返回结构 { code, data, msg } 解包
*
* 委托 @repo/utils 共享实现，避免各页面模块各自维护判定逻辑。
*/
var unwrap = (res) => unwrapResult(res);
var B = "/ms/monitor";
/**
* 资产聚合详情：主机台账 + 其名下监控项，用于把 hostId 解析成 monitorId
* @param hostId 主机台账标识
* @returns 资产聚合视图
*/
var getAssetDetail = (hostId) => http().get(`${B}/asset/${hostId}`).timeout(15e3).then((r) => unwrap(r));
var getAllConfig = () => http().get(`${B}/config`).then((r) => unwrap(r));
var saveConfig = (d) => http().post(`${B}/config/batch`).data(d).then((r) => unwrap(r));
var getLatestCpu = (monitorId) => http().get(`${B}/metric/cpu/${monitorId}`).then((r) => unwrap(r));
var getCpuHistory = (monitorId, hours = 1) => http().get(`${B}/metric/cpu/history/${monitorId}?hours=${hours}`).then((r) => unwrap(r));
var getLatestMemory = (monitorId) => http().get(`${B}/metric/memory/${monitorId}`).then((r) => unwrap(r));
var getMemoryHistory = (monitorId, hours = 1) => http().get(`${B}/metric/memory/history/${monitorId}?hours=${hours}`).then((r) => unwrap(r));
var getLatestDisk = (monitorId) => http().get(`${B}/metric/disk/${monitorId}`).then((r) => unwrap(r));
var getLatestNetwork = (monitorId) => http().get(`${B}/metric/network/${monitorId}`).then((r) => unwrap(r));
var getNetworkHistory = (monitorId, hours = 1) => http().get(`${B}/metric/network/history/${monitorId}?hours=${hours}`).then((r) => unwrap(r));
var getLatestJvm = (monitorId) => http().get(`${B}/metric/jvm/${monitorId}`).then((r) => unwrap(r));
var getJvmHistory = (monitorId, hours = 1) => http().get(`${B}/metric/jvm/history/${monitorId}?hours=${hours}`).then((r) => unwrap(r));
var getHostMetricHistory = (hostId, hours = 1) => http().get(`${B}/host/${hostId}/metric-history?hours=${hours}`).timeout(3e4).then((r) => {
	const d = r?.data;
	if (d && (d.code === "00000" || d.code === "200")) return d.data ?? [];
	return [];
}).catch(() => []);
var checkTshark = () => http().get(`${B}/tshark/check`).then((r) => unwrap(r));
var getTsharkInterfaces = () => http().get(`${B}/tshark/interfaces`).then((r) => unwrap(r));
var startTsharkCapture = (d) => http().post(`${B}/tshark/capture`).data(d).then((r) => unwrap(r));
var stopTsharkCapture = (id) => http().post(`${B}/tshark/capture/${id}/stop`).then((r) => unwrap(r));
var delTsharkSession = (id) => http().delete(`${B}/tshark/sessions/${id}`).then((r) => unwrap(r));
/**
* 抓包会话分页列表。
*
* @param source 来源过滤（live=实时抓包 / import=导入 pcap）；不传则不过滤
*/
var getTsharkSessions = (page = 1, size = 10, source = "") => http().get(`${B}/tshark/sessions?page=${page}&size=${size}${source ? `&source=${encodeURIComponent(source)}` : ""}`).then((r) => unwrap(r));
/**
* 导入 pcap 文件（PCAP 分析）。
*
* <p>走 multipart 而不是 JSON：pcap 动辄几十上百 MB，base64 进 JSON 要平白胖三分之一，
* 后端还得再解码一次。交给 FormData + axios 自动带 boundary —— 手写 Content-Type
* 反而会漏掉 boundary，后端直接解析不出文件。</p>
*
* <p>返回的是「刚落库的会话」：解析在后台跑，包数会陆续增长，前端靠会话推送看进度。</p>
*/
var importTsharkPcap = (file, name = "") => {
	const form = new FormData();
	form.append("file", file, file.name);
	if (name) form.append("name", name);
	return http().post(`${B}/tshark/pcap/import`).data(form).then((r) => unwrap(r));
};
var getTsharkPackets = (sessionId, page = 1, size = 20, keyword = "") => http().get(`${B}/tshark/sessions/${sessionId}/packets?page=${page}&size=${size}` + (keyword ? `&keyword=${encodeURIComponent(keyword)}` : "")).then((r) => unwrap(r));
/** 原始 pcap 下载地址：页面上的摘要只是 tshark 的解析结果，要深挖得拿原件去 Wireshark 打开 */
var tsharkPcapUrl = (sessionId) => `${B}/tshark/sessions/${sessionId}/pcap`;
var getTsharkPacketDetail = (id) => http().get(`${B}/tshark/packets/${id}`).then((r) => unwrap(r));
/**
* 某报文所属 TCP 流的握手 / 关闭生命周期。
*
* <p>该接口直接返回 VO（不是 ReturnResult 信封），所以取 r.data；404 表示协议
* 不跑在 TCP 上（UDP / ICMP / ARP），调用方按「不支持」提示。</p>
*/
var getTsharkHandshake = (packetId) => http().get(`${B}/tshark/packets/${packetId}/handshake`).then((r) => r.data);
/**
* 抓包会话的报文实时流（SSE）。
*
* <p>按会话分组推送：`packet` 新报文 / `session` 会话状态 / `ready` 建连确认。
* 走 SSE 而不是 socket.io 是全量广播 —— 抓包可能同时开几个会话，服务端只推
* 当前在看的那个，前端不必自己按 dataId 过滤。</p>
*/
var openTsharkPacketStream = (sessionId, options = {}) => http().get(`${B}/tshark/sessions/${sessionId}/packets/stream`).sse({
	reconnect: true,
	...options
});
var getTsharkProtocolStats = (sessionId) => http().get(`${B}/tshark/sessions/${sessionId}/stats/protocol`).then((r) => unwrap(r));
var getTsharkTopFlows = (sessionId, limit = 10) => http().get(`${B}/tshark/sessions/${sessionId}/stats/top?limit=${limit}`).then((r) => unwrap(r));
//#endregion
export { openTsharkPacketStream as C, tsharkPcapUrl as D, stopTsharkCapture as E, importTsharkPcap as S, startTsharkCapture as T, getTsharkPacketDetail as _, getCpuHistory as a, getTsharkSessions as b, getLatestCpu as c, getLatestMemory as d, getLatestNetwork as f, getTsharkInterfaces as g, getTsharkHandshake as h, getAssetDetail as i, getLatestDisk as l, getNetworkHistory as m, delTsharkSession as n, getHostMetricHistory as o, getMemoryHistory as p, getAllConfig as r, getJvmHistory as s, checkTshark as t, getLatestJvm as u, getTsharkPackets as v, saveConfig as w, getTsharkTopFlows as x, getTsharkProtocolStats as y };
