import { $n as normalizeClass, Ct as resolveDirective, D as createVNode, E as createTextVNode, Ht as watch, On as unref, St as resolveComponent, Yt as withDirectives, _ as createBaseVNode, b as createElementBlock, bt as renderList, ct as onMounted, g as computed, it as onBeforeUnmount, k as defineComponent, mt as openBlock, nr as normalizeStyle, o as Fragment, qt as withCtx, rr as toDisplayString, tt as nextTick, v as createBlock, vn as ref, y as createCommentVNode } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { C as withKeys, w as withModifiers } from "./runtime-dom.esm-bundler-RRl39S3n.js";
import { D as connection_default, E as collection_default, F as data_line_default, V as document_default, tn as trend_charts_default } from "./dist-DogtK295.js";
import { t as ReTable_default } from "./ReTable-BO1ac7-i.js";
import { y as useSocketService, yt as message } from "./src-CEonioA3.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { t as ReButton_default } from "./ReButton-owxlNwDO.js";
import { t as component } from "./ReDialog-DZGeR3lw.js";
import { D as init } from "./echarts-compat-C1tiQKE2.js";
import { C as openTsharkPacketStream, D as tsharkPcapUrl, E as stopTsharkCapture, S as importTsharkPcap, T as startTsharkCapture, _ as getTsharkPacketDetail, b as getTsharkSessions, g as getTsharkInterfaces, h as getTsharkHandshake, n as delTsharkSession, t as checkTshark, v as getTsharkPackets, x as getTsharkTopFlows, y as getTsharkProtocolStats } from "./api-GmipMlgL.js";
import { t as ReEmpty_default } from "./ReEmpty-DzxmsI1k.js";
import { t as component$1 } from "./ReIcon-By12b2Y9.js";
import { t as component$2 } from "./ReTag-D5UpQULZ.js";
//#region ../../pages/monitor/src/views/tshark/useTshark.ts
/**
* TShark 抓包工作台的数据层
*
* 把「取数 + 状态 + 实时推送」从视图里抽出来，页面只负责排布与交互。
* 原实现全部塞在 1015 行的单文件里：模板、样式、请求、ECharts、socket 混在一起，
* 任何一个 tab 的调整都要读完整份文件。
*
* 几个刻意的取舍写在下面各处（会话全量拉取、实时包只在第一页追加、请求竞态丢弃），
* 都是原实现踩过或没处理到的点。
*/
/** 会话列表每页条数（前端分页） */
var DEFAULT_SESSION_PAGE_SIZE = 10;
/** 报文列表每页条数（后端分页） */
var PACKET_PAGE_SIZE = 20;
/**
* 会话一次性拉取的上限。
*
* <p>后端 `GET /tshark/sessions` 只有 page/size，没有 keyword 参数。会话总量很小
* （一次抓包一条），所以整批取回后在前端做「搜索 + 状态筛选 + 分页」——
* 否则搜索只能搜到当前页，翻到第 3 页搜一个在第 1 页的会话会「搜不到」。
* 报文列表不能这么做（可能几十万条），那边仍旧走后端过滤。</p>
*/
var SESSION_FETCH_SIZE = 200;
function useTshark(options = {}) {
	/**
	* 会话来源过滤：抓包分析页传 {@code 'live'}、PCAP 分析页传 {@code 'import'}。
	*
	* <p>过滤放后端（sessions 接口的 source 参数）而不是前端：两类会话共用一张表，
	* 只拉回自己那一类才不会让「已加载 N/M」的总数被对方的数据撑大，
	* 也省掉「拉 200 条再丢掉一半」的浪费。</p>
	*/
	const sessionSource = options.source ?? "";
	/**
	* 列表加载完是否自动选中第一条。
	*
	* <p>抓包分析页要（那份会话就是它当前的工作对象，进页面就该有数据可看）；
	* PCAP 分析页不要 —— 那一页的形态是「目录（导入记录）→ 点进去看某个文件的报文」，
	* 自动选中会让页面一进来就跳过目录、直接停在某个文件的报文上，用户反而找不到自己刚导入的那条。</p>
	*/
	const autoSelectFirst = options.autoSelectFirst ?? true;
	const tsharkOk = ref(false);
	const interfaces = ref([]);
	const iface = ref("");
	const filter = ref("");
	/**
	* 过滤语法：auto / bpf / display。
	*
	* <p>「http」这类词只有显示过滤认，塞给捕获过滤（-f）会让 tshark 立刻退出，
	* 页面表现为「新增会话后马上停止」；auto 由后端按文本判断，用户也可以显式指定。</p>
	*/
	const filterType = ref("auto");
	/** 会话名（可空，后端按网卡与时间生成） */
	const captureName = ref("");
	/**
	* 包数上限。0 = 不限 —— 默认必须是不限。
	*
	* <p>此前缺省 500，抓满 500 个包 tshark 就带 `-c 500` 自己退出，页面上表现为
	* 「刚抓到数据就结束了」：HTTP 这类流量几百个包几秒就满，用户点开页面时抓包
	* 已经停了。现在只有用户显式填了正数才加 `-c`；要停就点会话上的「停止抓包」。</p>
	*/
	const count = ref(0);
	const timeout = ref(0);
	const starting = ref(false);
	/** 导入 pcap 的上传中标志：几百 MB 的文件要传几秒，按钮得转圈，否则用户会重复点 */
	const importing = ref(false);
	const loadingSessions = ref(false);
	const sessions = ref([]);
	/** 后端返回的会话总数。可能大于已拉取的条数（超过 SESSION_FETCH_SIZE 时） */
	const sessionBackendTotal = ref(0);
	const sessionKeyword = ref("");
	const sessionFilter = ref("all");
	const sessionPage = ref(1);
	/** 每页条数做成 ref：列表页的 ReTable 可以改页大小，内部 pagedSessions 也跟着一致 */
	const sessionPageSize = ref(DEFAULT_SESSION_PAGE_SIZE);
	const activeSessionId = ref(null);
	const loadingPackets = ref(false);
	const packets = ref([]);
	const packetPage = ref(1);
	const packetTotal = ref(0);
	const packetKeyword = ref("");
	let keywordTimer = null;
	const loadingStats = ref(false);
	const protoStats = ref([]);
	const topFlows = ref([]);
	/**
	* 统计版本号。
	*
	* <p>实时推送是原地 `protoStats.push()`（不换数组引用），图表组件拿不到变更通知；
	* 统一改成「数据变了就自增一个计数器」，图表 watch 它重绘。</p>
	*/
	const statsVersion = ref(0);
	const detailOpen = ref(false);
	const packetDetail = ref(null);
	const liveCount = ref(0);
	const liveConnected = ref(false);
	/** 当前会话的 SSE 连接：切会话 / 清空选中 / 卸载时必须断开，否则服务端会一直推旧会话 */
	let packetStream = null;
	/**
	* 关掉当前报文流。
	*
	* <p>单独抽出来是因为「切会话」「清空选中」「组件卸载」三个出口都要做同一件事，
	* 漏掉任意一个都会留下一条后台长连接。</p>
	*/
	function closePacketStream() {
		packetStream?.close();
		packetStream = null;
		liveConnected.value = false;
	}
	/**
	* 打开某个会话的报文 SSE。
	*
	* <p>后端从 4.0.0.42 起把逐包推送从 socket.io 全量广播改成按会话分组的 SSE
	* （`/sessions/{id}/packets/stream`）。前端原本只订阅 socket.io 的
	* `monitor/tshark-packet`，在新后端上要么收不到、要么被其他会话的数据干扰；
	* 这里按会话建连，服务端只推当前在看的这一条。</p>
	*
	* @param sessionId 抓包会话 id
	*/
	function openPacketStream(sessionId) {
		closePacketStream();
		packetStream = openTsharkPacketStream(sessionId, {
			onOpen: () => {
				liveConnected.value = true;
			},
			onError: () => {
				liveConnected.value = false;
			},
			onClose: () => {
				liveConnected.value = false;
			},
			onMessage: (event) => {
				if (event.event === "packet") {
					applyLivePacket(event.data);
					return;
				}
				if (event.event === "session") {
					loadSessions(false);
					const phase = event.data?.phase;
					if (phase === "parsed" || phase === "finished") {
						loadStats();
						if (packetPage.value === 1 && !packetKeyword.value.trim()) loadPackets(1);
					}
				}
			}
		});
	}
	/**
	* 实时包入库到页面状态。
	*
	* <p>去重按报文 id：SSE 断线重连时后端可能重复推最近的包（`Last-Event-ID` 未启用），
	* 不去重会出现两行一模一样的数据。</p>
	*
	* @param packet 后端推来的精简报文
	*/
	function applyLivePacket(packet) {
		const sid = activeSessionId.value;
		if (sid == null || packet == null || packet.id == null) return;
		if (packet.sessionId != null && String(packet.sessionId) !== String(sid)) return;
		if (packets.value.some((p) => p.id === packet.id)) return;
		liveCount.value++;
		packetTotal.value++;
		const proto = packet.protocol || "OTHER";
		const hit = protoStats.value.find((s) => s.protocol === proto);
		if (hit) hit.count++;
		else protoStats.value.push({
			protocol: proto,
			count: 1
		});
		statsVersion.value++;
		if (packetKeyword.value.trim()) return;
		if (packetPage.value !== 1) return;
		packets.value.unshift(packet);
	}
	/**
	* 网卡下拉选项。
	*
	* <p>Windows 上 tshark 给的设备名是 `\Device\NPF_{GUID}`，直接展示是一串读不懂的
	* GUID，用户挑不出哪张是自己在用的网卡。这里改显友好名（「以太网 3」）+ IPv4，
	* 并把承载默认出口的那张标「本机」。</p>
	*/
	const ifaceOptions = computed(() => interfaces.value.map((i) => {
		if (typeof i === "string") return {
			label: i,
			value: i
		};
		const desc = i.description || i.name;
		const ip = i.ipv4 && i.ipv4.length ? i.ipv4.join(", ") : "无 IPv4";
		return {
			label: i.local ? `${desc} · ${ip} · 本机出口` : `${desc} · ${ip}`,
			value: i.name
		};
	}));
	const activeSession = computed(() => sessions.value.find((s) => s.id === activeSessionId.value) ?? null);
	/** 状态 + 关键字筛选后的会话（搜索在已拉取的全量上做，见 SESSION_FETCH_SIZE 说明） */
	const filteredSessions = computed(() => {
		const kw = sessionKeyword.value.trim().toLowerCase();
		return sessions.value.filter((s) => {
			if (sessionFilter.value === "running" && s.captureStatus !== 1) return false;
			if (sessionFilter.value === "stopped" && s.captureStatus === 1) return false;
			if (!kw) return true;
			return `${s.sessionName ?? ""} ${s.captureInterface ?? ""}`.toLowerCase().includes(kw);
		});
	});
	const pagedSessions = computed(() => {
		const start = (sessionPage.value - 1) * sessionPageSize.value;
		return filteredSessions.value.slice(start, start + sessionPageSize.value);
	});
	const runningCount = computed(() => sessions.value.filter((s) => s.captureStatus === 1).length);
	async function init() {
		try {
			tsharkOk.value = await checkTshark();
		} catch {
			tsharkOk.value = false;
		}
		await Promise.allSettled([loadInterfaces(), loadSessions()]);
	}
	async function loadInterfaces() {
		try {
			interfaces.value = await getTsharkInterfaces();
		} catch {}
	}
	/**
	* 拉取会话列表。
	*
	* @param resetActive 是否重新挑选激活会话。实时推送触发的刷新要传 false：
	*   否则用户切换会话的瞬间恰好来了一条 session 事件，选中项会被拽走。
	*/
	async function loadSessions(resetActive = true) {
		loadingSessions.value = true;
		try {
			const r = await getTsharkSessions(1, SESSION_FETCH_SIZE, sessionSource);
			const list = r?.records ?? r?.data ?? [];
			sessions.value = list;
			sessionBackendTotal.value = r?.total ?? list.length;
			const current = activeSessionId.value;
			const currentGone = current != null && !list.some((s) => s.id === current);
			if (currentGone) clearActiveSession();
			if (autoSelectFirst && list.length > 0 && (currentGone || resetActive && activeSessionId.value == null)) selectSession(list[0].id);
			clampSessionPage();
		} catch (e) {
			message.error("加载会话失败: " + (e?.message || e));
		} finally {
			loadingSessions.value = false;
		}
	}
	/** 筛选条件变化后页码可能越界（只剩 1 页时还停在第 3 页会是空列表） */
	function clampSessionPage() {
		const max = Math.max(1, Math.ceil(filteredSessions.value.length / sessionPageSize.value));
		if (sessionPage.value > max) sessionPage.value = max;
		if (sessionPage.value < 1) sessionPage.value = 1;
	}
	function setSessionKeyword(v) {
		sessionKeyword.value = v;
		sessionPage.value = 1;
	}
	function setSessionFilter(v) {
		sessionFilter.value = v;
		sessionPage.value = 1;
	}
	function clearActiveSession() {
		closePacketStream();
		activeSessionId.value = null;
		packets.value = [];
		packetTotal.value = 0;
		packetPage.value = 1;
		protoStats.value = [];
		topFlows.value = [];
		liveCount.value = 0;
	}
	function selectSession(id) {
		activeSessionId.value = id;
		liveCount.value = 0;
		openPacketStream(id);
		loadPackets(1);
		loadStats();
	}
	async function loadPackets(page = packetPage.value) {
		const sid = activeSessionId.value;
		if (sid == null) return;
		loadingPackets.value = true;
		try {
			const r = await getTsharkPackets(sid, page, PACKET_PAGE_SIZE, packetKeyword.value.trim());
			if (sid !== activeSessionId.value) return;
			packets.value = r?.records ?? r?.data ?? [];
			packetTotal.value = r?.total ?? packets.value.length;
			packetPage.value = page;
		} catch (e) {
			message.error("加载数据包失败: " + (e?.message || e));
		} finally {
			loadingPackets.value = false;
		}
	}
	/** 关键字变化：防抖 300ms 后回第一页重查（换关键字后页码不再有意义） */
	function setPacketKeyword(v) {
		packetKeyword.value = v;
		if (keywordTimer) clearTimeout(keywordTimer);
		keywordTimer = setTimeout(() => loadPackets(1), 300);
	}
	/** 从统计面板点某个协议跳到报文：直接用它当关键字 */
	function filterByProtocol(protocol) {
		if (keywordTimer) clearTimeout(keywordTimer);
		packetKeyword.value = protocol;
		loadPackets(1);
	}
	function refresh() {
		loadSessions(false);
		if (activeSessionId.value != null) {
			loadPackets();
			loadStats();
		}
	}
	/**
	* 导出当前查询结果为 CSV。
	*
	* <p>导的是**当前页**结果，不是整会话全量 —— 否则一次导出几十万行会把浏览器拖死。
	* 字段顺序与表格列一致，便于对照。表头的 BOM 与公式转义见下。</p>
	*/
	function exportCsv() {
		if (activeSessionId.value == null || packets.value.length === 0) {
			message.warning("当前没有可导出的数据包");
			return;
		}
		const head = [
			"时间",
			"协议",
			"源IP",
			"源端口",
			"目的IP",
			"目的端口",
			"长度(字节)",
			"摘要"
		];
		const esc = (v) => {
			const s = v === null || v === void 0 ? "" : String(v);
			const safe = /^[=+\-@]/.test(s) ? "'" + s : s;
			return /[",\n\r]/.test(safe) ? "\"" + safe.replace(/"/g, "\"\"") + "\"" : safe;
		};
		const lines = [head.join(",")];
		for (const p of packets.value) lines.push([
			p.packetTime,
			p.protocol || "OTHER",
			p.sourceIp,
			p.sourcePort,
			p.destIp,
			p.destPort,
			p.packetLength ?? 0,
			p.packetInfo || p.restoredText || ""
		].map(esc).join(","));
		const blob = new Blob(["﻿" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
		const a = document.createElement("a");
		a.href = URL.createObjectURL(blob);
		a.download = `tshark-session-${activeSessionId.value}-page${packetPage.value}.csv`;
		a.click();
		URL.revokeObjectURL(a.href);
		message.success(`已导出本页 ${packets.value.length} 条`);
	}
	/** 下载原始 pcap：页面上的摘要只是 tshark 的解析结果，要深挖得拿原件去 Wireshark 打开 */
	function downloadPcap(id, name) {
		const a = document.createElement("a");
		a.href = tsharkPcapUrl(id);
		a.download = name || `capture-${id}.pcap`;
		a.click();
	}
	async function loadStats() {
		const sid = activeSessionId.value;
		if (sid == null) {
			protoStats.value = [];
			topFlows.value = [];
			return;
		}
		loadingStats.value = true;
		try {
			const [p, f] = await Promise.allSettled([getTsharkProtocolStats(sid), getTsharkTopFlows(sid, 10)]);
			if (sid !== activeSessionId.value) return;
			protoStats.value = p.status === "fulfilled" ? p.value : [];
			topFlows.value = f.status === "fulfilled" ? f.value : [];
			statsVersion.value++;
		} finally {
			loadingStats.value = false;
		}
	}
	async function startCapture() {
		if (!iface.value) {
			message.warning("请选择网卡");
			return false;
		}
		starting.value = true;
		try {
			await startTsharkCapture({
				name: captureName.value.trim() || void 0,
				captureInterface: iface.value,
				captureFilter: filter.value.trim() || void 0,
				filterType: filterType.value,
				count: count.value > 0 ? count.value : void 0,
				timeout: timeout.value > 0 ? timeout.value : void 0
			});
			message.success("抓包已启动");
			captureName.value = "";
			await loadSessions();
			return true;
		} catch (e) {
			message.error("启动抓包失败: " + (e?.message || e));
			return false;
		} finally {
			starting.value = false;
		}
	}
	/**
	* 导入 pcap 文件（PCAP 分析）。
	*
	* <p>上传成功后后端先把会话落库、再在后台整份解析，会话是「立刻可见、包数陆续长」的。</p>
	*
	* @param file      选中的 pcap 文件
	* @param name      会话名（可空，后端回退用原始文件名）
	* @param autoSelect 是否在上传成功后直接跳进这条记录的详情。
	*   PCAP 分析页传 false：它的列表本身就是「目录页」，导入完停在这里看包数往上涨，
	*   比直接跳到还空着的报文页更符合预期（合作方要看的是「传上去了没、解出来了没」）。
	* @returns 是否上传成功；失败已弹提示，页面据此决定要不要清空已选文件
	*/
	async function importPcap(file, name = "", autoSelect = true) {
		importing.value = true;
		try {
			const created = await importTsharkPcap(file, name.trim());
			message.success("pcap 已上传，后台开始解析 —— 报文数会陆续增长");
			await loadSessions(false);
			const id = created?.id ?? null;
			if (autoSelect && id != null) selectSession(id);
			return true;
		} catch (e) {
			message.error("导入失败: " + (e?.message || e));
			return false;
		} finally {
			importing.value = false;
		}
	}
	async function stopSession(id) {
		try {
			await stopTsharkCapture(id);
			message.success("已停止抓包");
			loadSessions(false);
		} catch (e) {
			message.error("停止失败: " + (e?.message || e));
		}
	}
	async function deleteSession(id) {
		try {
			await message.confirm("确认删除该会话及其所有数据包？", "提示", "确定", "取消", "warning");
		} catch {
			return;
		}
		try {
			await delTsharkSession(id);
			message.success("已删除");
			if (activeSessionId.value === id) {
				clearActiveSession();
				detailOpen.value = false;
				packetDetail.value = null;
			}
			await loadSessions(true);
		} catch (e) {
			message.error("删除失败: " + (e?.message || e));
		}
	}
	async function openPacketDetail(row) {
		await openPacketDetailById(row.id);
	}
	/**
	* 按报文 id 打开详情。
	*
	* <p>生命周期时序图里只有 packetId，没有完整行数据，单独给一个入口，
	* 避免调用方为了凑一个 TsharkPacket 去造空对象。</p>
	*
	* @param id 报文 id
	*/
	async function openPacketDetailById(id) {
		try {
			packetDetail.value = await getTsharkPacketDetail(id);
			detailOpen.value = true;
		} catch (e) {
			message.error("加载详情失败: " + (e?.message || e));
		}
	}
	const socket = useSocketService();
	const socketUnsubs = [];
	if (socket) socketUnsubs.push(socket.subscribe("monitor", "tshark-session", () => {
		loadSessions(false);
	}));
	onBeforeUnmount(() => {
		socketUnsubs.forEach((fn) => fn?.());
		closePacketStream();
		if (keywordTimer) clearTimeout(keywordTimer);
	});
	return {
		tsharkOk,
		interfaces,
		ifaceOptions,
		iface,
		filter,
		filterType,
		captureName,
		count,
		timeout,
		starting,
		importing,
		loadingSessions,
		sessions,
		sessionBackendTotal,
		sessionKeyword,
		sessionFilter,
		sessionPage,
		activeSessionId,
		activeSession,
		filteredSessions,
		pagedSessions,
		runningCount,
		sessionPageSize,
		loadingPackets,
		packets,
		packetPage,
		packetTotal,
		packetKeyword,
		packetPageSize: PACKET_PAGE_SIZE,
		loadingStats,
		protoStats,
		topFlows,
		statsVersion,
		detailOpen,
		packetDetail,
		liveCount,
		liveConnected,
		init,
		loadInterfaces,
		loadSessions,
		selectSession,
		setSessionKeyword,
		setSessionFilter,
		clearActiveSession,
		loadPackets,
		setPacketKeyword,
		filterByProtocol,
		refresh,
		exportCsv,
		downloadPcap,
		loadStats,
		startCapture,
		stopSession,
		deleteSession,
		openPacketDetail,
		openPacketDetailById,
		importPcap
	};
}
//#endregion
//#region ../../pages/monitor/src/views/tshark/tsharkFormat.ts
/** 会话显示名：没起名字的（导入时留空且后端也没拿到文件名）退回 id */
function sessionName(s) {
	return s.sessionName || `导入 ${s.id}`;
}
/**
* 解析状态。
*
* <p>三态而不是两态：报文数为 0 的「已解析」多半是文件本身不含报文（或格式不对），
* 和正常解析完的文件混在一起会让人以为数据丢了，所以单独标成「无报文」。</p>
*/
function statusOf(s) {
	if (s.captureStatus === 1) return {
		type: "warning",
		text: "解析中"
	};
	if ((s.packetCount ?? 0) === 0) return {
		type: "info",
		text: "无报文"
	};
	return {
		type: "success",
		text: "已解析"
	};
}
/** 报文的首末时间。解析中时后端还没回填结束时间，就只显示起点 + 「解析中」 */
function timeRange(s) {
	const from = fmtTime(s.startTime);
	if (!from) return "—";
	const to = fmtTime(s.endTime);
	if (!to) return `${from} → 解析中`;
	return `${from} → ${to}`;
}
/** 后端给的是「2026-10-18T13:36:38」或「2026-10-18 13:36:38」两种形态，都要吃得下 */
function fmtTime(t) {
	if (!t) return "";
	const d = t.includes("T") ? new Date(t) : new Date(t.replace(/-/g, "/"));
	if (isNaN(d.getTime())) return t;
	const p = (n) => String(n).padStart(2, "0");
	return `${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}
/** 把「秒」说成人话；小于 1 秒的抓包很常见，直接显示 0s 会显得像没抓到东西 */
function fmtDuration(sec) {
	if (sec === null || sec === void 0) return "—";
	if (sec <= 0) return "<1s";
	if (sec < 60) return `${sec}s`;
	const m = Math.floor(sec / 60);
	const s = sec % 60;
	if (m < 60) return s ? `${m}m${s}s` : `${m}m`;
	return `${Math.floor(m / 60)}h${m % 60}m`;
}
/** 文件体积（选文件时的提示文字用）：一位小数够了，这里是给「感量级」不是给对账用 */
function fmtSize(bytes) {
	if (bytes >= 1073741824) return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
	if (bytes >= 1048576) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
	if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`;
	return `${bytes} B`;
}
//#endregion
//#region ../../pages/monitor/src/views/tshark/ScTsharkPacketPanel.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1$4 = { class: "tshark-panel" };
var _hoisted_2$4 = { class: "tshark-panel__tools" };
var _hoisted_3$4 = {
	key: 0,
	class: "tshark-dim packet-hint"
};
var _hoisted_4$4 = { class: "tshark-dim packet-count" };
var _hoisted_5$4 = { class: "tshark-panel__body" };
var _hoisted_6$4 = { class: "tshark-mono tshark-dim" };
var _hoisted_7$4 = { class: "tshark-mono" };
var _hoisted_8$4 = { class: "tshark-mono" };
var _hoisted_9$4 = { class: "tshark-mono" };
var _hoisted_10$4 = ["title"];
var _hoisted_11$4 = { class: "tshark-panel__foot" };
//#endregion
//#region ../../pages/monitor/src/views/tshark/ScTsharkPacketPanel.vue
var ScTsharkPacketPanel_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	__name: "ScTsharkPacketPanel",
	props: {
		packets: {},
		loading: { type: Boolean },
		page: {},
		pageSize: {},
		total: {},
		keyword: {},
		emptyText: {}
	},
	emits: [
		"update:keyword",
		"page-change",
		"open-detail",
		"open-lifecycle",
		"export"
	],
	setup(__props, { emit: __emit }) {
		const emit = __emit;
		/**
		* 报文右键菜单。
		*
		* <p>「查看生命周期」调后端 `/packets/{id}/handshake`：按四元组还原整条 TCP 流，
		* 给出三次/四次握手判定与按时间排好的报文序列（HTTP / TLS 等 TCP 上的协议同样支持），
		* 页面据此画时序图。UDP / ICMP / ARP 没有握手，弹层里会明确提示不支持。</p>
		*/
		const packetMenu = [{
			key: "detail",
			label: "查看报文详情",
			icon: document_default
		}, {
			key: "lifecycle",
			label: "查看生命周期",
			icon: connection_default,
			divided: true
		}];
		function onPacketMenuSelect(item, ctx) {
			const row = ctx.row;
			if (item.key === "detail") {
				emit("open-detail", row);
				return;
			}
			if (item.key === "lifecycle") emit("open-lifecycle", row);
		}
		function onKeyword(v) {
			emit("update:keyword", v === null || v === void 0 ? "" : String(v));
		}
		/** 「IP:端口」；端口缺失（ARP / ICMP 这类）时只留 IP，不要拖一个孤零零的冒号 */
		function addr(ip, port) {
			const host = ip || "?";
			return port === null || port === void 0 ? host : `${host}:${port}`;
		}
		/** 协议色 class；与统计面板共用一套（见 tshark.css 的协议配色段） */
		function protoClass(p) {
			return {
				TCP: "tshark-proto--tcp",
				UDP: "tshark-proto--udp",
				HTTP: "tshark-proto--http",
				HTTPS: "tshark-proto--http",
				TLS: "tshark-proto--tls",
				DNS: "tshark-proto--dns",
				ICMP: "tshark-proto--icmp",
				ARP: "tshark-proto--arp",
				SSH: "tshark-proto--ssh",
				QUIC: "tshark-proto--quic"
			}[p || ""] || "";
		}
		/** 表格行协议class，用于左侧色条 */
		function protoRowClass(p) {
			return {
				TCP: "row-tcp",
				UDP: "row-udp",
				HTTP: "row-http",
				HTTPS: "row-http",
				TLS: "row-tls",
				DNS: "row-dns",
				ICMP: "row-icmp",
				ARP: "row-arp",
				SSH: "row-ssh",
				QUIC: "row-quic"
			}[p || ""] || "";
		}
		function getRowClassName({ row }) {
			return protoRowClass(row.protocol);
		}
		return (_ctx, _cache) => {
			const _component_ReIcon = resolveComponent("ReIcon");
			const _component_ReInput = resolveComponent("ReInput");
			const _component_ReButton = resolveComponent("ReButton");
			const _component_ReTableColumn = resolveComponent("ReTableColumn");
			const _component_ReTag = resolveComponent("ReTag");
			const _component_ReTable = resolveComponent("ReTable");
			const _component_RePagination = resolveComponent("RePagination");
			return openBlock(), createElementBlock("div", _hoisted_1$4, [
				createBaseVNode("div", _hoisted_2$4, [
					createVNode(_component_ReInput, {
						class: "tshark-filter",
						"model-value": __props.keyword,
						placeholder: "过滤：协议 / IP / 端口 / 摘要",
						clearable: "",
						"onUpdate:modelValue": onKeyword
					}, {
						prefix: withCtx(() => [createVNode(_component_ReIcon, {
							name: "Search",
							size: 13
						})]),
						_: 1
					}, 8, ["model-value"]),
					__props.keyword ? (openBlock(), createElementBlock("span", _hoisted_3$4, "后端在库中按「" + toDisplayString(__props.keyword) + "」筛选", 1)) : createCommentVNode("", true),
					_cache[3] || (_cache[3] = createBaseVNode("span", { class: "tshark-dim packet-hint" }, "右键报文可查看 TCP 生命周期", -1)),
					_cache[4] || (_cache[4] = createBaseVNode("span", { class: "tshark-panel__spacer" }, null, -1)),
					createBaseVNode("span", _hoisted_4$4, "共 " + toDisplayString(__props.total) + " 条", 1),
					createVNode(_component_ReButton, {
						icon: "Download",
						disabled: __props.packets.length === 0,
						tip: "把当前页结果导出为 CSV",
						onClick: _cache[0] || (_cache[0] = ($event) => emit("export"))
					}, {
						default: withCtx(() => [..._cache[2] || (_cache[2] = [createTextVNode(" 导出 CSV ", -1)])]),
						_: 1
					}, 8, ["disabled"])
				]),
				createBaseVNode("div", _hoisted_5$4, [createVNode(_component_ReTable, {
					class: "tshark-table",
					data: __props.packets,
					loading: __props.loading,
					border: "",
					stripe: "",
					"row-key": "id",
					pagination: false,
					toolbar: false,
					"context-menu": packetMenu,
					"empty-text": __props.emptyText,
					"row-class-name": getRowClassName,
					onContextMenuSelect: onPacketMenuSelect
				}, {
					default: withCtx(() => [
						createVNode(_component_ReTableColumn, {
							prop: "packetTime",
							label: "时间",
							width: "176",
							align: "center"
						}, {
							default: withCtx(({ row }) => [createBaseVNode("span", _hoisted_6$4, toDisplayString(row.packetTime || "—"), 1)]),
							_: 1
						}),
						createVNode(_component_ReTableColumn, {
							label: "协议",
							width: "96",
							align: "center"
						}, {
							default: withCtx(({ row }) => [createVNode(_component_ReTag, {
								class: normalizeClass([["tshark-proto", protoClass(row.protocol)], "proto-tag"]),
								effect: "plain"
							}, {
								default: withCtx(() => [createTextVNode(toDisplayString(row.protocol || "OTHER"), 1)]),
								_: 2
							}, 1032, ["class"])]),
							_: 1
						}),
						createVNode(_component_ReTableColumn, {
							label: "源",
							width: "206"
						}, {
							default: withCtx(({ row }) => [createBaseVNode("span", _hoisted_7$4, toDisplayString(addr(row.sourceIp, row.sourcePort)), 1)]),
							_: 1
						}),
						createVNode(_component_ReTableColumn, {
							label: "目的",
							width: "206"
						}, {
							default: withCtx(({ row }) => [createBaseVNode("span", _hoisted_8$4, toDisplayString(addr(row.destIp, row.destPort)), 1)]),
							_: 1
						}),
						createVNode(_component_ReTableColumn, {
							prop: "packetLength",
							label: "长度",
							width: "88",
							align: "right"
						}, {
							default: withCtx(({ row }) => [createBaseVNode("span", _hoisted_9$4, toDisplayString(row.packetLength ?? 0), 1)]),
							_: 1
						}),
						createVNode(_component_ReTableColumn, {
							label: "摘要",
							"min-width": "260"
						}, {
							default: withCtx(({ row }) => [createBaseVNode("span", {
								class: "tshark-ellipsis",
								title: row.packetInfo
							}, toDisplayString(row.packetInfo || row.restoredText || "—"), 9, _hoisted_10$4)]),
							_: 1
						}),
						createVNode(_component_ReTableColumn, {
							label: "操作",
							width: "150",
							align: "center"
						}, {
							default: withCtx(({ row }) => [createVNode(_component_ReButton, {
								link: "",
								type: "primary",
								onClick: ($event) => emit("open-detail", row)
							}, {
								default: withCtx(() => [..._cache[5] || (_cache[5] = [createTextVNode("详情", -1)])]),
								_: 1
							}, 8, ["onClick"]), createVNode(_component_ReButton, {
								link: "",
								type: "primary",
								onClick: ($event) => emit("open-lifecycle", row)
							}, {
								default: withCtx(() => [..._cache[6] || (_cache[6] = [createTextVNode("生命周期", -1)])]),
								_: 1
							}, 8, ["onClick"])]),
							_: 1
						})
					]),
					_: 1
				}, 8, [
					"data",
					"loading",
					"empty-text"
				])]),
				createBaseVNode("div", _hoisted_11$4, [createVNode(_component_RePagination, {
					small: "",
					layout: "prev, pager, next",
					total: __props.total,
					"page-size": __props.pageSize,
					"current-page": __props.page,
					onCurrentChange: _cache[1] || (_cache[1] = (p) => emit("page-change", p))
				}, null, 8, [
					"total",
					"page-size",
					"current-page"
				])])
			]);
		};
	}
}), [["__scopeId", "data-v-9b188a31"]]);
//#endregion
//#region ../../pages/monitor/src/views/tshark/chartTheme.ts
/** 读取当前主题下的图表用色（每次渲染时调用，跟随主题切换） */
function readChartTheme() {
	const pick = (name, fallback) => {
		return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
	};
	return {
		font: "'Inter', -apple-system, 'Segoe UI', sans-serif",
		primary: pick("--el-color-primary", "#1677ff"),
		success: pick("--el-color-success", "#16c916"),
		warning: pick("--el-color-warning", "#ff9730"),
		danger: pick("--el-color-danger", "#ff4c4c"),
		cpu: pick("--metric-cpu", "#3b82f6"),
		net: pick("--metric-net", "#06b6d4"),
		jvm: pick("--metric-jvm", "#14b8a6"),
		disk: pick("--metric-disk", "#f59e0b"),
		secondary: pick("--el-text-color-secondary", "#4e5359"),
		tertiary: pick("--el-text-color-placeholder", "#8d9196")
	};
}
/**
* 常见协议的固定色相。
*
* 固定而非轮转：TCP 在饼图、协议表和报文列表三处都出现，颜色必须一致，
* 否则用户没法把「饼图那一块」和「表格那一行」对应起来。
*/
var NAMED = {
	TCP: "cpu",
	UDP: "success",
	HTTP: "disk",
	HTTPS: "disk",
	TLS: "tertiary",
	DNS: "danger",
	ICMP: "jvm",
	ARP: "disk",
	SSH: "net",
	QUIC: "secondary"
};
/** 未知协议的轮转调色板（避开上面已用掉的固定色相，减少撞色） */
function palette(t) {
	return [
		t.net,
		t.warning,
		t.jvm,
		t.primary,
		t.success,
		t.danger,
		t.cpu,
		t.disk,
		t.secondary,
		t.tertiary
	];
}
/**
* 为一批协议生成「协议 → 颜色」映射
*
* @param protocols 参与图例的协议名（按展示顺序传入，保证同一批数据每次配色一致）
*/
function buildProtoColors(protocols, t) {
	const ring = palette(t);
	const colors = {};
	let cursor = 0;
	for (const p of protocols) {
		const key = NAMED[p];
		colors[p] = key ? t[key] : ring[cursor++ % ring.length];
	}
	return colors;
}
//#endregion
//#region ../../pages/monitor/src/views/tshark/useEchart.ts
/**
* ECharts 生命周期小工具
*
* 原先每个图表都要手写一遍「init → onMounted 渲染 → resize 监听 → dispose」，
* 拆成面板后有两个图表组件，重复四份没有意义。
*
* <p>每次重画都 dispose 再 init：主题切换后 option 里的颜色是渲染时从 CSS 变量
* 解析出来的真实值，旧实例上残留的是上一个主题的颜色，重建最省心。</p>
*/
function useEchart(el, draw) {
	let chart = null;
	/** 重建并绘制；容器还没上屏（标签页未激活）时静默跳过 */
	function render() {
		const node = el.value;
		if (!node) return;
		chart?.dispose();
		chart = init(node);
		draw(chart);
	}
	function resize() {
		chart?.resize();
	}
	onMounted(() => {
		render();
		window.addEventListener("resize", resize);
	});
	onBeforeUnmount(() => {
		window.removeEventListener("resize", resize);
		chart?.dispose();
		chart = null;
	});
	return { render };
}
//#endregion
//#region ../../pages/monitor/src/views/tshark/ScTsharkStatsPanel.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1$3 = { class: "tshark-panel" };
var _hoisted_2$3 = { class: "stat-cards" };
var _hoisted_3$3 = { class: "tshark-panel__body" };
var _hoisted_4$3 = { class: "stats-grid" };
var _hoisted_5$3 = {
	key: 0,
	class: "proto-empty"
};
var _hoisted_6$3 = {
	key: 1,
	class: "proto-list"
};
var _hoisted_7$3 = ["onClick", "onKeydown"];
var _hoisted_8$3 = { class: "proto-row__name tshark-mono" };
var _hoisted_9$3 = { class: "proto-row__bar" };
var _hoisted_10$3 = { class: "proto-row__pct tshark-mono" };
var _hoisted_11$3 = { class: "proto-row__count tshark-mono" };
//#endregion
//#region ../../pages/monitor/src/views/tshark/ScTsharkStatsPanel.vue
var ScTsharkStatsPanel_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	__name: "ScTsharkStatsPanel",
	props: {
		protoStats: {},
		topFlows: {},
		packetTotal: {},
		version: {}
	},
	emits: ["pick-protocol"],
	setup(__props, { emit: __emit }) {
		const props = __props;
		const emit = __emit;
		/** 饼图与占比条的分母：用协议统计自己的合计，而不是报文总数（后者可能含未归类报文） */
		const protoTotal = computed(() => props.protoStats.reduce((sum, r) => sum + (r.count || 0), 0));
		/** 当前数据下的「协议 → 颜色」，饼图与明细行共用同一份，保证两处对得上 */
		const protoColors = computed(() => {
			return buildProtoColors(props.protoStats.map((r) => r.protocol || "OTHER"), readChartTheme());
		});
		function colorOf(protocol) {
			const key = protocol || "OTHER";
			return protoColors.value[key] || readChartTheme().tertiary;
		}
		function shareOf(count) {
			const total = protoTotal.value;
			return total > 0 ? count / total * 100 : 0;
		}
		const pieRef = ref(null);
		const { render } = useEchart(pieRef, (chart) => {
			const t = readChartTheme();
			const data = props.protoStats.slice(0, 12);
			const colors = buildProtoColors(data.map((d) => d.protocol || "OTHER"), t);
			const hasData = data.length > 0;
			chart.setOption({
				tooltip: {
					trigger: "item",
					borderWidth: 0,
					textStyle: {
						fontSize: 11,
						fontFamily: t.font
					}
				},
				legend: {
					bottom: 0,
					type: "scroll",
					icon: "circle",
					itemWidth: 8,
					itemHeight: 8,
					textStyle: {
						fontSize: 10,
						color: t.secondary,
						fontFamily: t.font
					}
				},
				series: [{
					type: "pie",
					radius: ["38%", "66%"],
					center: ["50%", "44%"],
					avoidLabelOverlap: true,
					itemStyle: {
						borderRadius: 5,
						borderWidth: 3,
						borderColor: "transparent"
					},
					label: { show: false },
					emphasis: { scaleSize: 4 },
					data: hasData ? data.map((d) => ({
						name: d.protocol || "OTHER",
						value: d.count,
						itemStyle: { color: colors[d.protocol || "OTHER"] }
					})) : [{
						name: "暂无数据",
						value: 1,
						itemStyle: { color: t.tertiary }
					}]
				}]
			});
		});
		watch(() => props.version, () => nextTick(render));
		return (_ctx, _cache) => {
			const _component_ReStatCard = resolveComponent("ReStatCard");
			const _component_ReCard = resolveComponent("ReCard");
			const _component_ReEmpty = resolveComponent("ReEmpty");
			return openBlock(), createElementBlock("div", _hoisted_1$3, [createBaseVNode("div", _hoisted_2$3, [
				createVNode(_component_ReStatCard, {
					size: "compact",
					title: "数据包总数",
					value: __props.packetTotal,
					desc: "已入库明细",
					icon: unref(data_line_default),
					"icon-color": "var(--metric-cpu)"
				}, null, 8, ["value", "icon"]),
				createVNode(_component_ReStatCard, {
					size: "compact",
					title: "协议种类",
					value: __props.protoStats.length,
					desc: "按最高层协议统计",
					icon: unref(collection_default),
					"icon-color": "var(--el-color-success)"
				}, null, 8, ["value", "icon"]),
				createVNode(_component_ReStatCard, {
					size: "compact",
					title: "Top 会话流",
					value: __props.topFlows.length,
					desc: "按包数排序",
					icon: unref(trend_charts_default),
					"icon-color": "var(--el-color-warning)"
				}, null, 8, ["value", "icon"])
			]), createBaseVNode("div", _hoisted_3$3, [createBaseVNode("div", _hoisted_4$3, [createVNode(_component_ReCard, {
				layout: "simple",
				radius: 14,
				padding: 14,
				shadow: "never",
				header: "协议分布",
				class: "stats-card"
			}, {
				header: withCtx(() => [..._cache[0] || (_cache[0] = [createBaseVNode("span", { class: "panel-title" }, "协议分布", -1)])]),
				default: withCtx(() => [createBaseVNode("div", {
					ref_key: "pieRef",
					ref: pieRef,
					class: "chart-box"
				}, null, 512)]),
				_: 1
			}), createVNode(_component_ReCard, {
				layout: "simple",
				radius: 14,
				padding: 14,
				shadow: "never",
				header: "协议明细",
				class: "stats-card"
			}, {
				header: withCtx(() => [..._cache[1] || (_cache[1] = [createBaseVNode("span", { class: "panel-title" }, [createTextVNode("协议明细"), createBaseVNode("em", { class: "panel-title__hint" }, "点击任意协议筛到报文")], -1)])]),
				default: withCtx(() => [__props.protoStats.length === 0 ? (openBlock(), createElementBlock("div", _hoisted_5$3, [createVNode(_component_ReEmpty, {
					description: "当前会话还没有解析出协议",
					layout: "modern"
				})])) : (openBlock(), createElementBlock("ul", _hoisted_6$3, [(openBlock(true), createElementBlock(Fragment, null, renderList(__props.protoStats, (row) => {
					return openBlock(), createElementBlock("li", {
						key: row.protocol,
						class: "proto-row",
						tabindex: "0",
						onClick: ($event) => emit("pick-protocol", row.protocol),
						onKeydown: withKeys(($event) => emit("pick-protocol", row.protocol), ["enter"])
					}, [
						createBaseVNode("span", {
							class: "proto-row__dot",
							style: normalizeStyle({ background: colorOf(row.protocol) })
						}, null, 4),
						createBaseVNode("span", _hoisted_8$3, toDisplayString(row.protocol || "OTHER"), 1),
						createBaseVNode("span", _hoisted_9$3, [createBaseVNode("span", {
							class: "proto-row__bar-fill",
							style: normalizeStyle({
								width: shareOf(row.count) + "%",
								background: colorOf(row.protocol)
							})
						}, null, 4)]),
						createBaseVNode("span", _hoisted_10$3, toDisplayString(shareOf(row.count).toFixed(1)) + "%", 1),
						createBaseVNode("span", _hoisted_11$3, toDisplayString(row.count), 1)
					], 40, _hoisted_7$3);
				}), 128))]))]),
				_: 1
			})])])]);
		};
	}
}), [["__scopeId", "data-v-e6d3e585"]]);
//#endregion
//#region ../../pages/monitor/src/views/tshark/ScTsharkFlowPanel.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1$2 = { class: "tshark-panel" };
var _hoisted_2$2 = { class: "tshark-panel__tools" };
var _hoisted_3$2 = { class: "tshark-dim flow-total" };
var _hoisted_4$2 = { class: "tshark-panel__body" };
var _hoisted_5$2 = { class: "flow-grid" };
var _hoisted_6$2 = {
	key: 0,
	class: "flow-empty"
};
var _hoisted_7$2 = {
	key: 0,
	class: "flow-empty"
};
var _hoisted_8$2 = {
	key: 1,
	class: "flow-list"
};
var _hoisted_9$2 = ["title"];
var _hoisted_10$2 = { class: "flow-row__pct tshark-mono" };
var _hoisted_11$2 = { class: "flow-row__count tshark-mono" };
//#endregion
//#region ../../pages/monitor/src/views/tshark/ScTsharkFlowPanel.vue
var ScTsharkFlowPanel_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	__name: "ScTsharkFlowPanel",
	props: {
		topFlows: {},
		packetTotal: {},
		version: {}
	},
	setup(__props) {
		const props = __props;
		const flowTotal = computed(() => props.topFlows.reduce((sum, r) => sum + (r.count || 0), 0));
		function shareOf(count) {
			const total = flowTotal.value;
			return total > 0 ? (count / total * 100).toFixed(1) : "0.0";
		}
		/** 纵轴标签压缩：流标识是「源 → 目的」，长了会把绘图区吃掉一半 */
		function shorten(flow, max = 26) {
			const s = flow || "";
			return s.length > max ? s.slice(0, max - 1) + "…" : s;
		}
		/** 排名色 class */
		function rankClass(i) {
			if (i === 0) return "rank--gold";
			if (i <= 2) return "rank--silver";
			if (i <= 4) return "rank--bronze";
			return "rank--normal";
		}
		/** 行左侧色条 class */
		function flowRowClass(i) {
			if (i === 0) return "flow-row--gold";
			if (i <= 2) return "flow-row--silver";
			if (i <= 4) return "flow-row--bronze";
			return "flow-row--normal";
		}
		const barRef = ref(null);
		const { render } = useEchart(barRef, (chart) => {
			const t = readChartTheme();
			const data = props.topFlows.slice(0, 10);
			chart.setOption({
				tooltip: {
					trigger: "axis",
					axisPointer: { type: "shadow" },
					borderWidth: 0,
					textStyle: {
						fontSize: 11,
						fontFamily: t.font
					}
				},
				grid: {
					left: 8,
					right: 24,
					top: 6,
					bottom: 24,
					containLabel: true
				},
				xAxis: {
					type: "value",
					name: "包数",
					nameTextStyle: {
						fontSize: 10,
						color: t.tertiary
					},
					axisLabel: {
						fontSize: 10,
						color: t.secondary
					},
					splitLine: { lineStyle: { color: "rgba(128,128,128,0.15)" } }
				},
				yAxis: {
					type: "category",
					inverse: true,
					data: data.map((d) => shorten(d.flow)),
					axisLabel: {
						fontSize: 9,
						color: t.secondary,
						width: 150,
						overflow: "truncate"
					},
					axisLine: { show: false },
					axisTick: { show: false }
				},
				series: [{
					type: "bar",
					data: data.map((d) => d.count),
					itemStyle: {
						borderRadius: [
							0,
							6,
							6,
							0
						],
						color: t.net
					},
					barWidth: "55%"
				}]
			});
		});
		watch(() => props.version, () => nextTick(render));
		return (_ctx, _cache) => {
			const _component_ReEmpty = resolveComponent("ReEmpty");
			const _component_ReCard = resolveComponent("ReCard");
			return openBlock(), createElementBlock("div", _hoisted_1$2, [createBaseVNode("div", _hoisted_2$2, [
				_cache[0] || (_cache[0] = createBaseVNode("span", { class: "tshark-dim flow-hint" }, "按包数排序，最多展示 10 条会话流", -1)),
				_cache[1] || (_cache[1] = createBaseVNode("span", { class: "tshark-panel__spacer" }, null, -1)),
				createBaseVNode("span", _hoisted_3$2, "本会话共 " + toDisplayString(__props.packetTotal) + " 包", 1)
			]), createBaseVNode("div", _hoisted_4$2, [createBaseVNode("div", _hoisted_5$2, [createVNode(_component_ReCard, {
				layout: "simple",
				radius: 14,
				padding: 14,
				shadow: "never",
				header: "Top 会话流",
				class: "flow-card"
			}, {
				header: withCtx(() => [..._cache[2] || (_cache[2] = [createBaseVNode("span", { class: "panel-title" }, "Top 会话流", -1)])]),
				default: withCtx(() => [__props.topFlows.length === 0 ? (openBlock(), createElementBlock("div", _hoisted_6$2, [createVNode(_component_ReEmpty, {
					description: "当前会话还没有可统计的会话流",
					layout: "modern"
				})])) : (openBlock(), createElementBlock("div", {
					key: 1,
					ref_key: "barRef",
					ref: barRef,
					class: "chart-box"
				}, null, 512))]),
				_: 1
			}), createVNode(_component_ReCard, {
				layout: "simple",
				radius: 14,
				padding: 14,
				shadow: "never",
				header: "流明细",
				class: "flow-card"
			}, {
				header: withCtx(() => [..._cache[3] || (_cache[3] = [createBaseVNode("span", { class: "panel-title" }, "流明细", -1)])]),
				default: withCtx(() => [__props.topFlows.length === 0 ? (openBlock(), createElementBlock("div", _hoisted_7$2, [createVNode(_component_ReEmpty, {
					description: "暂无数据",
					layout: "modern"
				})])) : (openBlock(), createElementBlock("ul", _hoisted_8$2, [(openBlock(true), createElementBlock(Fragment, null, renderList(__props.topFlows, (row, i) => {
					return openBlock(), createElementBlock("li", {
						key: row.flow + "-" + i,
						class: normalizeClass(["flow-row", flowRowClass(i)])
					}, [
						createBaseVNode("span", { class: normalizeClass(["flow-row__rank tshark-mono", rankClass(i)]) }, toDisplayString(i + 1), 3),
						createBaseVNode("span", {
							class: "flow-row__name tshark-mono",
							title: row.flow
						}, toDisplayString(row.flow), 9, _hoisted_9$2),
						createBaseVNode("span", _hoisted_10$2, toDisplayString(shareOf(row.count)) + "%", 1),
						createBaseVNode("span", _hoisted_11$2, toDisplayString(row.count), 1)
					], 2);
				}), 128))]))]),
				_: 1
			})])])]);
		};
	}
}), [["__scopeId", "data-v-87f96b81"]]);
//#endregion
//#region ../../pages/monitor/src/views/tshark/ScTsharkPacketDetail.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1$1 = {
	key: 0,
	class: "packet-detail"
};
var _hoisted_2$1 = { class: "packet-detail__head" };
var _hoisted_3$1 = { class: "tshark-mono tshark-dim" };
var _hoisted_4$1 = { class: "detail-section" };
var _hoisted_5$1 = { class: "detail-section__head" };
var _hoisted_6$1 = { class: "tshark-mono detail-text" };
var _hoisted_7$1 = {
	key: 0,
	class: "detail-section"
};
var _hoisted_8$1 = { class: "detail-section__head" };
var _hoisted_9$1 = { class: "detail-block" };
var _hoisted_10$1 = {
	key: 1,
	class: "detail-section"
};
var _hoisted_11$1 = { class: "detail-section__head" };
var _hoisted_12$1 = {
	key: 0,
	class: "tshark-dim detail-note"
};
var _hoisted_13$1 = { class: "detail-block" };
var _hoisted_14 = {
	key: 1,
	class: "tshark-panel__empty"
};
/** 原始数据一次最多渲染的字符数：几十 KB 的十六进制串直接塞进 <pre> 会把抽屉卡住 */
var RAW_LIMIT = 4e3;
//#endregion
//#region ../../pages/monitor/src/views/tshark/ScTsharkPacketDetail.vue
var ScTsharkPacketDetail_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	__name: "ScTsharkPacketDetail",
	props: {
		modelValue: { type: Boolean },
		packet: {}
	},
	emits: ["update:modelValue"],
	setup(__props, { emit: __emit }) {
		const props = __props;
		const emit = __emit;
		const rawPreview = computed(() => (props.packet?.rawData || "").slice(0, RAW_LIMIT));
		const rawTruncated = computed(() => (props.packet?.rawData || "").length > RAW_LIMIT);
		function onOpenChange(v) {
			emit("update:modelValue", !!v);
		}
		function addr(ip, port) {
			const host = ip || "?";
			return port === null || port === void 0 ? host : `${host}:${port}`;
		}
		function protoClass(p) {
			return {
				TCP: "tshark-proto--tcp",
				UDP: "tshark-proto--udp",
				HTTP: "tshark-proto--http",
				HTTPS: "tshark-proto--http",
				TLS: "tshark-proto--tls",
				DNS: "tshark-proto--dns",
				ICMP: "tshark-proto--icmp",
				ARP: "tshark-proto--arp",
				SSH: "tshark-proto--ssh",
				QUIC: "tshark-proto--quic"
			}[p || ""] || "";
		}
		async function copy(text, okText) {
			if (!text) return;
			try {
				await navigator.clipboard.writeText(text);
				message.success(okText);
			} catch {
				message.warning("复制失败，请手动选中文本复制");
			}
		}
		function copyAll() {
			const p = props.packet;
			if (!p) return;
			copy([
				`协议: ${p.protocol || ""}`,
				`时间: ${p.packetTime || ""}`,
				`长度: ${p.packetLength ?? 0} 字节`,
				`源: ${addr(p.sourceIp, p.sourcePort)}`,
				`目的: ${addr(p.destIp, p.destPort)}`,
				`摘要: ${p.packetInfo || ""}`
			].join("\n"), "关键字段已复制");
		}
		return (_ctx, _cache) => {
			const _component_ReTag = resolveComponent("ReTag");
			const _component_ReButton = resolveComponent("ReButton");
			const _component_ReDescriptionsItem = resolveComponent("ReDescriptionsItem");
			const _component_ReDescriptions = resolveComponent("ReDescriptions");
			const _component_ReEmpty = resolveComponent("ReEmpty");
			const _component_ReDrawer = resolveComponent("ReDrawer");
			return openBlock(), createBlock(_component_ReDrawer, {
				"model-value": __props.modelValue,
				title: "数据包详情",
				size: "55%",
				"footer-hidden": "",
				"onUpdate:modelValue": onOpenChange
			}, {
				default: withCtx(() => [__props.packet ? (openBlock(), createElementBlock("div", _hoisted_1$1, [
					createBaseVNode("div", _hoisted_2$1, [
						createVNode(_component_ReTag, {
							class: normalizeClass(["tshark-proto", protoClass(__props.packet.protocol)]),
							effect: "plain"
						}, {
							default: withCtx(() => [createTextVNode(toDisplayString(__props.packet.protocol || "OTHER"), 1)]),
							_: 1
						}, 8, ["class"]),
						createBaseVNode("span", _hoisted_3$1, toDisplayString(addr(__props.packet.sourceIp, __props.packet.sourcePort)) + " → " + toDisplayString(addr(__props.packet.destIp, __props.packet.destPort)), 1),
						_cache[4] || (_cache[4] = createBaseVNode("span", { class: "tshark-panel__spacer" }, null, -1)),
						createVNode(_component_ReButton, {
							icon: "CopyDocument",
							onClick: copyAll
						}, {
							default: withCtx(() => [..._cache[3] || (_cache[3] = [createTextVNode("复制关键字段", -1)])]),
							_: 1
						})
					]),
					createVNode(_component_ReDescriptions, {
						column: 2,
						border: ""
					}, {
						default: withCtx(() => [
							createVNode(_component_ReDescriptionsItem, { label: "协议" }, {
								default: withCtx(() => [createTextVNode(toDisplayString(__props.packet.protocol || "—"), 1)]),
								_: 1
							}),
							createVNode(_component_ReDescriptionsItem, { label: "长度" }, {
								default: withCtx(() => [createTextVNode(toDisplayString(__props.packet.packetLength ?? 0) + " 字节", 1)]),
								_: 1
							}),
							createVNode(_component_ReDescriptionsItem, { label: "源地址" }, {
								default: withCtx(() => [createTextVNode(toDisplayString(addr(__props.packet.sourceIp, __props.packet.sourcePort)), 1)]),
								_: 1
							}),
							createVNode(_component_ReDescriptionsItem, { label: "目的地址" }, {
								default: withCtx(() => [createTextVNode(toDisplayString(addr(__props.packet.destIp, __props.packet.destPort)), 1)]),
								_: 1
							}),
							createVNode(_component_ReDescriptionsItem, {
								label: "时间",
								span: 2
							}, {
								default: withCtx(() => [createTextVNode(toDisplayString(__props.packet.packetTime || "—"), 1)]),
								_: 1
							})
						]),
						_: 1
					}),
					createBaseVNode("section", _hoisted_4$1, [createBaseVNode("header", _hoisted_5$1, [_cache[6] || (_cache[6] = createBaseVNode("h4", null, "摘要", -1)), __props.packet.packetInfo ? (openBlock(), createBlock(_component_ReButton, {
						key: 0,
						link: "",
						type: "primary",
						onClick: _cache[0] || (_cache[0] = ($event) => copy(__props.packet.packetInfo || "", "摘要已复制"))
					}, {
						default: withCtx(() => [..._cache[5] || (_cache[5] = [createTextVNode("复制", -1)])]),
						_: 1
					})) : createCommentVNode("", true)]), createBaseVNode("p", _hoisted_6$1, toDisplayString(__props.packet.packetInfo || "—"), 1)]),
					__props.packet.restoredText ? (openBlock(), createElementBlock("section", _hoisted_7$1, [createBaseVNode("header", _hoisted_8$1, [_cache[8] || (_cache[8] = createBaseVNode("h4", null, "协议还原", -1)), createVNode(_component_ReButton, {
						link: "",
						type: "primary",
						onClick: _cache[1] || (_cache[1] = ($event) => copy(__props.packet.restoredText || "", "协议还原已复制"))
					}, {
						default: withCtx(() => [..._cache[7] || (_cache[7] = [createTextVNode("复制", -1)])]),
						_: 1
					})]), createBaseVNode("pre", _hoisted_9$1, toDisplayString(__props.packet.restoredText), 1)])) : createCommentVNode("", true),
					__props.packet.rawData ? (openBlock(), createElementBlock("section", _hoisted_10$1, [createBaseVNode("header", _hoisted_11$1, [
						_cache[10] || (_cache[10] = createBaseVNode("h4", null, "原始数据", -1)),
						rawTruncated.value ? (openBlock(), createElementBlock("span", _hoisted_12$1, "仅显示前 " + toDisplayString(RAW_LIMIT) + " 字符")) : createCommentVNode("", true),
						createVNode(_component_ReButton, {
							link: "",
							type: "primary",
							onClick: _cache[2] || (_cache[2] = ($event) => copy(__props.packet.rawData || "", "原始数据已复制"))
						}, {
							default: withCtx(() => [..._cache[9] || (_cache[9] = [createTextVNode("复制", -1)])]),
							_: 1
						})
					]), createBaseVNode("pre", _hoisted_13$1, toDisplayString(rawPreview.value), 1)])) : createCommentVNode("", true)
				])) : (openBlock(), createElementBlock("div", _hoisted_14, [createVNode(_component_ReEmpty, {
					description: "选择一个数据包查看详情",
					layout: "modern"
				})]))]),
				_: 1
			}, 8, ["model-value"]);
		};
	}
}), [["__scopeId", "data-v-98b6fbd4"]]);
//#endregion
//#region ../../pages/monitor/src/views/tshark/ScTsharkLifecycleDialog.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1 = {
	key: 0,
	class: "lc-loading",
	"element-loading-text": "正在还原整条 TCP 流…"
};
var _hoisted_2 = {
	key: 1,
	class: "lc-error"
};
var _hoisted_3 = { class: "lc-head" };
var _hoisted_4 = { class: "tshark-mono lc-endpoint" };
var _hoisted_5 = { class: "tshark-mono lc-endpoint" };
var _hoisted_6 = { class: "lc-meta" };
var _hoisted_7 = {
	key: 0,
	class: "lc-detail"
};
var _hoisted_8 = { class: "lc-seq-wrap" };
var _hoisted_9 = ["title", "onClick"];
var _hoisted_10 = { class: "lc-step__label" };
var _hoisted_11 = {
	key: 0,
	class: "lc-step__info"
};
var _hoisted_12 = { class: "tshark-mono" };
var _hoisted_13 = {
	key: 1,
	class: "lc-muted"
};
/** 时序图每步的行高（px）：箭头 + 标签要放得下，又不能把几十步拉成一条长卷 */
var STEP_H = 42;
//#endregion
//#region ../../pages/monitor/src/views/tshark/ScTsharkLifecycleDialog.vue
var ScTsharkLifecycleDialog_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	__name: "ScTsharkLifecycleDialog",
	props: {
		modelValue: { type: Boolean },
		packet: {}
	},
	emits: ["update:modelValue", "open-detail"],
	setup(__props, { emit: __emit }) {
		const props = __props;
		const emit = __emit;
		const loading = ref(false);
		const error = ref("");
		const data = ref(null);
		const steps = computed(() => data.value?.steps ?? []);
		const durationMs = computed(() => steps.value.length ? steps.value[steps.value.length - 1].relativeMs : 0);
		const seqHeight = computed(() => Math.max(120, 10 + steps.value.length * STEP_H + 12));
		const title = computed(() => {
			const p = props.packet;
			if (!p) return "TCP 生命周期";
			return `TCP 生命周期 · ${p.protocol || "OTHER"} ${p.sourceIp || "?"} → ${p.destIp || "?"}`;
		});
		const kindType = computed(() => {
			const kind = data.value?.handshake.kind;
			if (kind === "THREE_WAY") return "success";
			if (kind === "FOUR_WAY") return "warning";
			return "info";
		});
		const columns = [
			{
				prop: "relativeMs",
				label: "相对时间",
				width: 112,
				slot: "rel",
				align: "right"
			},
			{
				prop: "fromClient",
				label: "方向",
				width: 150,
				slot: "dir"
			},
			{
				prop: "flags",
				label: "标志",
				width: 110,
				slot: "flags",
				align: "center"
			},
			{
				prop: "length",
				label: "长度",
				width: 86,
				align: "right"
			},
			{
				prop: "info",
				label: "摘要",
				minWidth: 240,
				showOverflowTooltip: true
			},
			{
				prop: "action",
				label: "操作",
				width: 72,
				slot: "action",
				align: "center"
			}
		];
		watch(() => [props.modelValue, props.packet?.id], ([visible]) => {
			if (visible) load();
		}, { immediate: true });
		/**
		* 拉取生命周期。
		*
		* <p>404 不是错误：UDP / ICMP / ARP 本来就没有握手，后端按「没有」返回，
		* 页面要说清楚原因，而不是弹一个「请求失败」让人以为接口坏了。</p>
		*/
		async function load() {
			const id = props.packet?.id;
			if (id == null) return;
			loading.value = true;
			error.value = "";
			data.value = null;
			try {
				data.value = await getTsharkHandshake(id);
				if (!data.value?.steps?.length) error.value = "这条流还没有可展示的报文";
			} catch (e) {
				if (e?.status === 404) error.value = "该报文不是 TCP 流（UDP / ICMP / ARP），没有握手与挥手生命周期";
				else error.value = `加载生命周期失败：${e?.message || e}`;
			} finally {
				loading.value = false;
			}
		}
		function onOpenChange(v) {
			emit("update:modelValue", !!v);
		}
		function onRowClick(row) {
			emit("open-detail", Number(row.packetId));
		}
		/** 箭头上的短标签：标志位优先，没有标志就是数据帧 */
		function stepLabel(step) {
			return step.flags || "DATA";
		}
		function endpoint(ip, port) {
			const host = ip || "?";
			return port === null || port === void 0 ? host : `${host}:${port}`;
		}
		function formatMs(ms) {
			if (!Number.isFinite(ms) || ms <= 0) return "0ms";
			if (ms < 1e3) return `${Math.round(ms)}ms`;
			return `${(ms / 1e3).toFixed(ms < 1e4 ? 2 : 1)}s`;
		}
		return (_ctx, _cache) => {
			const _directive_loading = resolveDirective("loading");
			return openBlock(), createBlock(unref(component), {
				"model-value": __props.modelValue,
				title: title.value,
				width: "1000px",
				top: "5vh",
				"footer-hidden": "",
				"onUpdate:modelValue": onOpenChange
			}, {
				default: withCtx(() => [loading.value ? withDirectives((openBlock(), createElementBlock("div", _hoisted_1, null, 512)), [[_directive_loading, true]]) : error.value ? (openBlock(), createElementBlock("div", _hoisted_2, [createVNode(unref(ReEmpty_default), {
					description: error.value,
					layout: "modern"
				}, null, 8, ["description"]), createVNode(unref(ReButton_default), {
					icon: "Refresh",
					onClick: load
				}, {
					default: withCtx(() => [..._cache[0] || (_cache[0] = [createTextVNode("重试", -1)])]),
					_: 1
				})])) : data.value ? (openBlock(), createElementBlock(Fragment, { key: 2 }, [
					createBaseVNode("div", _hoisted_3, [
						createVNode(unref(component$2), {
							type: kindType.value,
							effect: "plain"
						}, {
							default: withCtx(() => [createTextVNode(toDisplayString(data.value.handshake.label), 1)]),
							_: 1
						}, 8, ["type"]),
						createVNode(unref(component$2), {
							type: data.value.handshake.closed ? "success" : "info",
							effect: "plain"
						}, {
							default: withCtx(() => [createTextVNode(toDisplayString(data.value.handshake.closed ? "已关闭" : "未关闭"), 1)]),
							_: 1
						}, 8, ["type"]),
						createBaseVNode("span", _hoisted_4, toDisplayString(endpoint(data.value.clientIp, data.value.clientPort)), 1),
						createVNode(unref(component$1), {
							name: "Right",
							size: 12
						}),
						createBaseVNode("span", _hoisted_5, toDisplayString(endpoint(data.value.serverIp, data.value.serverPort)), 1),
						_cache[1] || (_cache[1] = createBaseVNode("span", { class: "spacer" }, null, -1)),
						createBaseVNode("span", _hoisted_6, toDisplayString(steps.value.length) + " 个报文 · 跨度 " + toDisplayString(formatMs(durationMs.value)), 1)
					]),
					data.value.handshake.detail ? (openBlock(), createElementBlock("p", _hoisted_7, toDisplayString(data.value.handshake.detail), 1)) : createCommentVNode("", true),
					createBaseVNode("div", _hoisted_8, [_cache[6] || (_cache[6] = createBaseVNode("div", { class: "lc-lane-head" }, [createBaseVNode("span", { class: "lc-lane-label is-client" }, "客户端"), createBaseVNode("span", { class: "lc-lane-label is-server" }, "服务端")], -1)), createBaseVNode("div", {
						class: "lc-seq",
						style: normalizeStyle({ height: seqHeight.value + "px" })
					}, [
						_cache[4] || (_cache[4] = createBaseVNode("span", { class: "lc-lifeline is-client" }, null, -1)),
						_cache[5] || (_cache[5] = createBaseVNode("span", { class: "lc-lifeline is-server" }, null, -1)),
						(openBlock(true), createElementBlock(Fragment, null, renderList(steps.value, (step, i) => {
							return openBlock(), createElementBlock("button", {
								key: step.packetId,
								type: "button",
								class: normalizeClass(["lc-step", step.fromClient ? "is-request" : "is-response"]),
								style: normalizeStyle({ top: 10 + i * STEP_H + "px" }),
								title: `${step.info || ""}（点击查看报文详情）`,
								onClick: ($event) => emit("open-detail", step.packetId)
							}, [
								_cache[2] || (_cache[2] = createBaseVNode("span", { class: "lc-step__line" }, null, -1)),
								_cache[3] || (_cache[3] = createBaseVNode("span", { class: "lc-step__arrow" }, null, -1)),
								createBaseVNode("span", _hoisted_10, [createBaseVNode("b", null, toDisplayString(stepLabel(step)), 1), step.info ? (openBlock(), createElementBlock("span", _hoisted_11, toDisplayString(step.info), 1)) : createCommentVNode("", true)])
							], 14, _hoisted_9);
						}), 128))
					], 4)]),
					createVNode(unref(ReTable_default), {
						class: "lc-table",
						data: steps.value,
						columns,
						pagination: false,
						toolbar: false,
						"row-key": "packetId",
						"layout-table": { maxHeight: 280 },
						stripe: "",
						"empty-text": "这条流没有可展示的报文",
						onRowClick
					}, {
						rel: withCtx(({ row }) => [createBaseVNode("span", _hoisted_12, toDisplayString(row.relativeMs === 0 ? "0ms" : `+${formatMs(Number(row.relativeMs))}`), 1)]),
						dir: withCtx(({ row }) => [createBaseVNode("span", { class: normalizeClass(["lc-dir", row.fromClient ? "is-request" : "is-response"]) }, toDisplayString(row.fromClient ? "客户端 → 服务端" : "服务端 → 客户端"), 3)]),
						flags: withCtx(({ row }) => [row.flags ? (openBlock(), createBlock(unref(component$2), {
							key: 0,
							type: "info",
							effect: "plain"
						}, {
							default: withCtx(() => [createTextVNode(toDisplayString(row.flags), 1)]),
							_: 2
						}, 1024)) : (openBlock(), createElementBlock("span", _hoisted_13, "DATA"))]),
						action: withCtx(({ row }) => [createVNode(unref(ReButton_default), {
							link: "",
							type: "primary",
							onClick: withModifiers(($event) => emit("open-detail", row.packetId), ["stop"])
						}, {
							default: withCtx(() => [..._cache[7] || (_cache[7] = [createTextVNode("详情", -1)])]),
							_: 1
						}, 8, ["onClick"])]),
						_: 1
					}, 8, ["data"])
				], 64)) : createCommentVNode("", true)]),
				_: 1
			}, 8, ["model-value", "title"]);
		};
	}
}), [["__scopeId", "data-v-c63cebe9"]]);
//#endregion
export { ScTsharkPacketPanel_default as a, sessionName as c, useTshark as d, ScTsharkStatsPanel_default as i, statusOf as l, ScTsharkPacketDetail_default as n, fmtDuration as o, ScTsharkFlowPanel_default as r, fmtSize as s, ScTsharkLifecycleDialog_default as t, timeRange as u };
