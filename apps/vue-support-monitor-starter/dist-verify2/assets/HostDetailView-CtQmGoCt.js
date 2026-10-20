import { $n as normalizeClass, D as createVNode, E as createTextVNode, Ht as watch, On as unref, St as resolveComponent, T as createStaticVNode, _ as createBaseVNode, b as createElementBlock, bt as renderList, ct as onMounted, g as computed, it as onBeforeUnmount, k as defineComponent, mt as openBlock, nr as normalizeStyle, o as Fragment, qt as withCtx, rr as toDisplayString, tt as nextTick, v as createBlock, vn as ref, y as createCommentVNode } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { C as withKeys } from "./runtime-dom.esm-bundler-RRl39S3n.js";
import { dt as loading_default } from "./dist-DogtK295.js";
import { t as ElMessageBox } from "./message-box-CXDJvJwn.js";
import { y as useSocketService, yt as message } from "./src-CEonioA3.js";
import { a as useRouter, i as useRoute } from "./vue-router-D43uXGPs.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { A as restartService, L as setHostEnvVar, R as startService, T as killProcess, b as fetchHostProfileSection, f as fetchAiStatus, k as restartHostProcess, r as closeNetProcess, s as deleteHostEnvVar, t as aiAnalyzeHost, y as fetchHostProfile, z as stopService } from "./monitorApi-CwY9j0MY.js";
import { v as getHost } from "./api-CRz4q4qT.js";
import { D as init, Z as LinearGradient } from "./echarts-compat-C1tiQKE2.js";
import { t as HostNetworkAdapters_default } from "./HostNetworkAdapters-BYa3R-uu.js";
import { a as getCpuHistory, c as getLatestCpu, d as getLatestMemory, f as getLatestNetwork, i as getAssetDetail, l as getLatestDisk, m as getNetworkHistory, o as getHostMetricHistory, p as getMemoryHistory, r as getAllConfig, s as getJvmHistory, u as getLatestJvm, w as saveConfig } from "./api-GmipMlgL.js";
//#region src/views/HostDetailView.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1 = { class: "hd tel-page" };
var _hoisted_2 = {
	key: 0,
	class: "hd-error"
};
var _hoisted_3 = { class: "panel" };
var _hoisted_4 = { class: "ph" };
var _hoisted_5 = { class: "ph-left" };
var _hoisted_6 = { class: "ph-idx" };
var _hoisted_7 = { class: "ph-title" };
var _hoisted_8 = { class: "ph-meta" };
var _hoisted_9 = {
	key: 0,
	class: "ph-monitor"
};
var _hoisted_10 = { class: "ph-right" };
var _hoisted_11 = { class: "ph-stat" };
var _hoisted_12 = { class: "stat-v" };
var _hoisted_13 = { class: "stat-v mono" };
var _hoisted_14 = ["disabled"];
var _hoisted_15 = {
	key: 0,
	class: "no-monitor"
};
var _hoisted_16 = {
	key: 0,
	class: "builtin-hint"
};
var _hoisted_17 = { class: "gauge-grid" };
var _hoisted_18 = { class: "g-ring" };
var _hoisted_19 = {
	viewBox: "0 0 120 120",
	class: "g-svg"
};
var _hoisted_20 = { class: "ticks" };
var _hoisted_21 = ["transform"];
var _hoisted_22 = { class: "g-center" };
var _hoisted_23 = { class: "g-num mono" };
var _hoisted_24 = { class: "g-sub mono" };
var _hoisted_25 = { class: "g-ring" };
var _hoisted_26 = {
	viewBox: "0 0 120 120",
	class: "g-svg"
};
var _hoisted_27 = { class: "ticks" };
var _hoisted_28 = ["transform"];
var _hoisted_29 = { class: "g-center" };
var _hoisted_30 = { class: "g-num mono" };
var _hoisted_31 = { class: "g-sub mono" };
var _hoisted_32 = { class: "g-ring" };
var _hoisted_33 = {
	viewBox: "0 0 120 120",
	class: "g-svg"
};
var _hoisted_34 = { class: "ticks" };
var _hoisted_35 = ["transform"];
var _hoisted_36 = { class: "g-center" };
var _hoisted_37 = { class: "g-num mono" };
var _hoisted_38 = { class: "g-sub mono" };
var _hoisted_39 = { class: "gauge" };
var _hoisted_40 = { class: "g-ring" };
var _hoisted_41 = {
	viewBox: "0 0 120 120",
	class: "g-svg"
};
var _hoisted_42 = { class: "ticks" };
var _hoisted_43 = ["transform"];
var _hoisted_44 = { class: "g-center io-c" };
var _hoisted_45 = { class: "io-row" };
var _hoisted_46 = { class: "mono" };
var _hoisted_47 = { class: "io-row" };
var _hoisted_48 = { class: "mono" };
var _hoisted_49 = { class: "gauge" };
var _hoisted_50 = { class: "g-ring net" };
var _hoisted_51 = {
	viewBox: "0 0 120 120",
	class: "g-svg"
};
var _hoisted_52 = { class: "ticks" };
var _hoisted_53 = ["transform"];
var _hoisted_54 = { class: "g-center net-c" };
var _hoisted_55 = { class: "net-dir" };
var _hoisted_56 = { class: "mono" };
var _hoisted_57 = { class: "net-dir" };
var _hoisted_58 = { class: "mono" };
var _hoisted_59 = { class: "g-ring" };
var _hoisted_60 = {
	viewBox: "0 0 120 120",
	class: "g-svg"
};
var _hoisted_61 = { class: "ticks" };
var _hoisted_62 = ["transform"];
var _hoisted_63 = { class: "g-center" };
var _hoisted_64 = { class: "g-num mono" };
var _hoisted_65 = { class: "g-sub mono" };
var _hoisted_66 = { class: "trend-grid" };
var _hoisted_67 = { class: "t-head" };
var _hoisted_68 = { class: "t-label" };
var _hoisted_69 = { class: "t-right" };
var _hoisted_70 = { class: "t-now mono" };
var _hoisted_71 = {
	class: "t-svg",
	viewBox: "0 0 200 56",
	preserveAspectRatio: "none"
};
var _hoisted_72 = ["points"];
var _hoisted_73 = ["points"];
var _hoisted_74 = { class: "t-foot mono" };
var _hoisted_75 = { class: "t-head" };
var _hoisted_76 = { class: "t-label" };
var _hoisted_77 = { class: "t-right" };
var _hoisted_78 = { class: "t-now mono" };
var _hoisted_79 = {
	class: "t-svg",
	viewBox: "0 0 200 56",
	preserveAspectRatio: "none"
};
var _hoisted_80 = ["points"];
var _hoisted_81 = ["points"];
var _hoisted_82 = { class: "t-foot mono" };
var _hoisted_83 = { class: "t-head" };
var _hoisted_84 = { class: "t-right" };
var _hoisted_85 = { class: "t-now mono" };
var _hoisted_86 = {
	class: "t-svg",
	viewBox: "0 0 200 56",
	preserveAspectRatio: "none"
};
var _hoisted_87 = ["points"];
var _hoisted_88 = ["points"];
var _hoisted_89 = { class: "t-foot mono" };
var _hoisted_90 = {
	class: "t-svg",
	viewBox: "0 0 200 56",
	preserveAspectRatio: "none"
};
var _hoisted_91 = ["points"];
var _hoisted_92 = ["points"];
var _hoisted_93 = { class: "t-foot io-legend mono" };
var _hoisted_94 = {
	key: 0,
	class: "trend"
};
var _hoisted_95 = { class: "t-head" };
var _hoisted_96 = { class: "t-now mono" };
var _hoisted_97 = {
	class: "t-svg",
	viewBox: "0 0 200 56",
	preserveAspectRatio: "none"
};
var _hoisted_98 = ["points"];
var _hoisted_99 = ["points"];
var _hoisted_100 = { class: "t-foot mono" };
var _hoisted_101 = { class: "trend" };
var _hoisted_102 = { class: "t-head" };
var _hoisted_103 = { class: "t-label" };
var _hoisted_104 = { class: "t-now mono" };
var _hoisted_105 = {
	class: "t-svg",
	viewBox: "0 0 200 56",
	preserveAspectRatio: "none"
};
var _hoisted_106 = ["points"];
var _hoisted_107 = ["points"];
var _hoisted_108 = { class: "t-foot mono" };
var _hoisted_109 = {
	key: 1,
	class: "sw-panel"
};
var _hoisted_110 = { class: "sp-head" };
var _hoisted_111 = { class: "sp-actions" };
var _hoisted_112 = { class: "sp-count mono" };
var _hoisted_113 = { class: "sw-grid" };
var _hoisted_114 = { class: "sw-top" };
var _hoisted_115 = { class: "sw-badge" };
var _hoisted_116 = { class: "sw-head" };
var _hoisted_117 = { class: "sw-name-line" };
var _hoisted_118 = { class: "sw-dn" };
var _hoisted_119 = {
	key: 0,
	class: "sw-chip mono"
};
var _hoisted_120 = { class: "sw-pidchips" };
var _hoisted_121 = {
	key: 0,
	class: "sw-pid sw-pid-more mono"
};
var _hoisted_122 = { class: "sw-stats mono" };
var _hoisted_123 = { class: "sw-stat" };
var _hoisted_124 = { class: "sw-v" };
var _hoisted_125 = { class: "sw-stat" };
var _hoisted_126 = { class: "sw-v" };
var _hoisted_127 = { class: "sw-stat" };
var _hoisted_128 = { class: "sw-v" };
var _hoisted_129 = {
	key: 0,
	class: "sw-bars"
};
var _hoisted_130 = { class: "sw-bar-label mono" };
var _hoisted_131 = { class: "sw-bar-track" };
var _hoisted_132 = { class: "sw-bar-val mono" };
var _hoisted_133 = {
	key: 0,
	class: "sw-bars-more mono"
};
var _hoisted_134 = {
	key: 1,
	class: "sw-single"
};
var _hoisted_135 = {
	key: 0,
	class: "sw-port mono"
};
var _hoisted_136 = ["title"];
var _hoisted_137 = { class: "profile-panel" };
var _hoisted_138 = { class: "pp-head" };
var _hoisted_139 = { class: "pp-tabs" };
var _hoisted_140 = ["onClick"];
var _hoisted_141 = { class: "pp-bar" };
var _hoisted_142 = {
	key: 0,
	class: "dim"
};
var _hoisted_143 = {
	key: 1,
	class: "dim"
};
var _hoisted_144 = { class: "pp-pager" };
var _hoisted_145 = { class: "mono page-no" };
var _hoisted_146 = {
	key: 0,
	class: "pp-error"
};
var _hoisted_147 = {
	key: 1,
	class: "pp-net"
};
var _hoisted_148 = {
	key: 2,
	class: "dim pp-loading"
};
var _hoisted_149 = {
	key: 3,
	class: "dim pp-loading"
};
var _hoisted_150 = {
	key: 4,
	class: "pp-scroll"
};
var _hoisted_151 = { class: "pp-table" };
var _hoisted_152 = ["onClick"];
var _hoisted_153 = { key: 0 };
var _hoisted_154 = { key: 0 };
var _hoisted_155 = { key: 1 };
var _hoisted_156 = { key: 2 };
var _hoisted_157 = { key: 3 };
var _hoisted_158 = { class: "disk-panel" };
var _hoisted_159 = { class: "dp-head" };
var _hoisted_160 = { class: "dp-count mono" };
var _hoisted_161 = { class: "drive-grid" };
var _hoisted_162 = { class: "drive-info" };
var _hoisted_163 = ["title"];
var _hoisted_164 = { class: "drive-bar" };
var _hoisted_165 = { class: "drive-cap" };
var _hoisted_166 = {
	key: 0,
	class: "empty drive-empty"
};
var _hoisted_167 = { class: "ai-bar" };
var _hoisted_168 = {
	key: 0,
	class: "ai-state"
};
var _hoisted_169 = {
	key: 1,
	class: "ai-state"
};
var _hoisted_170 = {
	key: 2,
	class: "ai-state is-error"
};
var _hoisted_171 = {
	key: 3,
	class: "ai-result"
};
var _hoisted_172 = { class: "ai-content" };
var _hoisted_173 = { class: "ai-meta" };
var _hoisted_174 = {
	key: 4,
	class: "ai-state"
};
var _hoisted_175 = { class: "hist-bar" };
var _hoisted_176 = {
	key: 0,
	class: "hist-loading"
};
var _hoisted_177 = {
	key: 1,
	class: "hist-loading"
};
var _hoisted_178 = { class: "swset-bar" };
var _hoisted_179 = { class: "swset-list" };
var _hoisted_180 = { class: "swset-label" };
var _hoisted_181 = { class: "swset-type mono" };
var _hoisted_182 = {
	key: 0,
	class: "swdet"
};
var _hoisted_183 = { class: "swdet-table" };
var _hoisted_184 = { class: "mono" };
var _hoisted_185 = { class: "mono" };
var _hoisted_186 = { class: "mono" };
var _hoisted_187 = { class: "mono" };
var _hoisted_188 = { class: "mono" };
var _hoisted_189 = ["title"];
var _hoisted_190 = { class: "swdet" };
var MAX_LIVE = 240;
var LIVE_TTL = 3e4;
var SW_VISIBLE_KEY = "monitor.host.software.visible.types";
//#endregion
//#region src/views/HostDetailView.vue
var HostDetailView_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	__name: "HostDetailView",
	setup(__props) {
		/**
		* 主机监控详情 —— 遥测控制台（mission-control telemetry）
		*
		* 数据源（前端不做 HTTP 轮询，全部由 socket 推送或事件触发的一次性拉取）：
		*   1) 进入页面一次性拉取：主机台账 + 近1h内置历史 + 资产监控项解析 + 一次新鲜画像；
		*   2) Socket 实时推送：
		*      - monitor:host-metrics（按 hostId 过滤）：CPU/内存/磁盘/磁盘IO/软件；
		*      - monitor:metric（按 monitorId 过滤）：监控项明细（含 JVM）。
		*   3) AI 智能分析：事件触发，后端按主机取数，前端只传分析重点。
		*
		* 所有仪表/趋势均来自真实采集值，点击趋势卡打开的历史弹窗与外侧口径一致；
		* 弹窗内只选择时间范围，指标由被点击的卡片确定。
		*
		* @author CH
		* @since 4.0.0
		*/
		const route = useRoute();
		const router = useRouter();
		/** 路由参数是主机台账标识（AssetsView 用 /host/${h.id} 跳转），不是监控项标识 */
		const hostId = ref(Number(route.params.id) || 0);
		/** 指标查询用监控项标识，由资产详情解析得到 */
		const monitorId = ref(0);
		const hostName = ref("");
		const monitors = ref([]);
		const loading = ref(false);
		const error = ref("");
		/** 主机台账记录（内置指标的初始来源，即使没有监控项也能出数） */
		const hostRecord = ref(null);
		const cpu = ref(null);
		const mem = ref(null);
		const disk = ref([]);
		const net = ref(null);
		const jvm = ref(null);
		/** 磁盘读写速率 KB/s */
		const diskRead = ref(0);
		const diskWrite = ref(0);
		/** 主机上识别到的软件实例（动态，按主机实际存在渲染） */
		const software = ref([]);
		const cpuHist = ref([]);
		const memHist = ref([]);
		const diskHist = ref([]);
		const diskReadHist = ref([]);
		const diskWriteHist = ref([]);
		const netHist = ref([]);
		const jvmHist = ref([]);
		function num(v) {
			return v == null ? "—" : String(Math.round(v));
		}
		function fmt(v) {
			if (v == null) return "—";
			if (v >= 1073741824) return `${(v / 1073741824).toFixed(1)}G`;
			if (v >= 1048576) return `${(v / 1048576).toFixed(1)}M`;
			if (v >= 1024) return `${(v / 1024).toFixed(1)}K`;
			return String(Math.round(v));
		}
		/** 速率（KB/s）展示：自动升到 MB/s */
		function fmtKbs(v) {
			if (v == null) return "—";
			if (v >= 1024) return `${(v / 1024).toFixed(1)} MB/s`;
			return `${v.toFixed(0)} KB/s`;
		}
		/** 运行时长：2d 3h / 4h 12m / 30m */
		function fmtUptime(sec) {
			if (sec == null || sec < 0) return "—";
			const d = Math.floor(sec / 86400);
			const h = Math.floor(sec % 86400 / 3600);
			const m = Math.floor(sec % 3600 / 60);
			if (d) return `${d}d ${h}h`;
			if (h) return `${h}h ${m}m`;
			return `${m}m`;
		}
		function numOr0(v) {
			const n = Number(v);
			return v == null || Number.isNaN(n) ? 0 : n;
		}
		/** 把 ISO 时间 / 时间戳转成 HH:MM:SS */
		function fmtClock(t) {
			if (t == null) return "—";
			const d = new Date(typeof t === "number" ? t : String(t).length === 13 ? Number(t) : t);
			if (Number.isNaN(d.getTime())) return "—";
			return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`;
		}
		/** 解析软件 JSON（后端可能给字符串或数组） */
		function parseSoftware(raw) {
			if (!raw) return [];
			let arr = raw;
			if (typeof raw === "string") try {
				arr = JSON.parse(raw);
			} catch {
				return [];
			}
			return Array.isArray(arr) ? arr : [];
		}
		function sparkScaled(data, min, max) {
			if (data.length === 0) return "";
			const range = max - min || 1, pad = 3;
			return data.map((v, i) => {
				const x = pad + i / (data.length - 1 || 1) * 194;
				const y = 53 - (v - min) / range * 50;
				return `${x.toFixed(1)},${y.toFixed(1)}`;
			}).join(" ");
		}
		function spark(data) {
			if (data.length === 0) return "";
			return sparkScaled(data, Math.min(...data), Math.max(...data));
		}
		function area(data) {
			if (data.length === 0) return "";
			return `${spark(data)} 200,56 0,56`;
		}
		/** 磁盘IO 两条线共用纵轴（读+写一起取 min/max，便于对比） */
		function ioSpark(which) {
			const all = [...diskReadHist.value, ...diskWriteHist.value];
			if (!all.length) return "";
			const min = Math.min(...all), max = Math.max(...all);
			return sparkScaled(which === "read" ? diskReadHist.value : diskWriteHist.value, min, max);
		}
		function trendMin(data) {
			return data.length ? data.reduce((a, b) => Math.min(a, b), Infinity).toFixed(0) : "—";
		}
		function trendMax(data) {
			return data.length ? data.reduce((a, b) => Math.max(a, b), -Infinity).toFixed(0) : "—";
		}
		function trendLast(data) {
			return data.length ? data[data.length - 1].toFixed(0) : "—";
		}
		function netMin(data) {
			return data.length ? fmt(data.reduce((a, b) => Math.min(a, b), Infinity)) : "—";
		}
		function netMax(data) {
			return data.length ? fmt(data.reduce((a, b) => Math.max(a, b), -Infinity)) : "—";
		}
		function netLast(data) {
			return data.length ? fmt(data[data.length - 1]) : "—";
		}
		/** 磁盘IO 趋势的最新读/写文本 */
		const ioLastRead = computed(() => diskReadHist.value.length ? fmtKbs(diskReadHist.value[diskReadHist.value.length - 1]) : "—");
		const ioLastWrite = computed(() => diskWriteHist.value.length ? fmtKbs(diskWriteHist.value[diskWriteHist.value.length - 1]) : "—");
		const ticks = Array.from({ length: 60 }, (_, i) => i);
		function ringDash(p) {
			const circ = 2 * Math.PI * 50;
			return `${(circ * Math.max(0, Math.min(100, p)) / 100).toFixed(2)} ${circ.toFixed(2)}`;
		}
		function ringStyle(p) {
			return { strokeDasharray: ringDash(p) };
		}
		/** 仪表热力等级：0 正常 / 1 偏高 / 2 告警 */
		function heat(v) {
			if (v == null) return 0;
			if (v >= 85) return 2;
			if (v >= 70) return 1;
			return 0;
		}
		const cpuPct = computed(() => cpu.value?.usage ?? 0);
		const memPct = computed(() => mem.value?.usagePercent ?? 0);
		const diskPct = computed(() => Math.max(0, ...disk.value.map((d) => Number(d.usagePercent ?? 0))));
		const jvmPct = computed(() => jvm.value?.heapUsagePercent ?? 0);
		const socket = useSocketService();
		const sockOn = computed(() => socket?.connected.value ?? false);
		const pushCount = ref(0);
		const lastPushText = ref("—");
		const lastPushAt = ref(0);
		const liveActive = computed(() => sockOn.value && Date.now() - lastPushAt.value < LIVE_TTL);
		let unsubMetric;
		let unsubHostMetric;
		function pushPoint(arr, v) {
			if (v == null || Number.isNaN(Number(v))) return;
			const next = [...arr.value, Number(v)];
			arr.value = next.length > MAX_LIVE ? next.slice(next.length - MAX_LIVE) : next;
		}
		/** 从推送 metrics 中按候选键名取值（后端 ServerLocalProvider 用 snake_case） */
		function pickMetric(metrics, keys) {
			if (!metrics) return null;
			for (const k of keys) {
				const v = metrics[k];
				if (v != null && !Number.isNaN(Number(v))) return Number(v);
			}
			return null;
		}
		/** 应用一次实时指标推送（monitor:metric，监控项明细） */
		function applyLivePayload(payload) {
			const metrics = payload?.metrics;
			if (!metrics) return;
			const cpuVal = pickMetric(metrics, [
				"cpu_usage",
				"cpuUsage",
				"cpu"
			]);
			if (cpuVal != null) {
				cpu.value = {
					...cpu.value ?? {},
					usage: cpuVal
				};
				pushPoint(cpuHist, cpuVal);
			}
			const memVal = pickMetric(metrics, [
				"memory_usage",
				"memoryUsage",
				"mem_usage",
				"memUsage"
			]);
			if (memVal != null) {
				mem.value = {
					...mem.value ?? {},
					usagePercent: memVal
				};
				pushPoint(memHist, memVal);
			}
			const diskVal = pickMetric(metrics, [
				"disk_usage",
				"diskUsage",
				"disk"
			]);
			if (diskVal != null && disk.value.length === 0) disk.value = [{
				mount: "/",
				device: "",
				used: 0,
				total: 0,
				usedText: "—",
				usagePercent: diskVal
			}];
			const rx = pickMetric(metrics, [
				"network_rx_bytes",
				"networkRx",
				"rx"
			]);
			const tx = pickMetric(metrics, [
				"network_tx_bytes",
				"networkTx",
				"tx"
			]);
			if (rx != null || tx != null) {
				net.value = {
					rx: rx ?? net.value?.rx,
					tx: tx ?? net.value?.tx
				};
				pushPoint(netHist, tx ?? rx ?? 0);
			}
			const jvmVal = pickMetric(metrics, [
				"jvm_heap_usage",
				"heapUsagePercent",
				"jvm_usage",
				"jvmUsage"
			]);
			if (jvmVal != null) {
				jvm.value = {
					...jvm.value ?? {},
					heapUsagePercent: jvmVal
				};
				pushPoint(jvmHist, jvmVal);
			}
			pushCount.value++;
			lastPushAt.value = Date.now();
			lastPushText.value = fmtClock(payload.collectTime ?? Date.now());
		}
		/** 订阅当前主机的监控项明细推送 */
		function bindLive() {
			unsubMetric?.();
			if (!socket) return;
			unsubMetric = socket.subscribe("monitor", "metric", (msg) => {
				try {
					const data = msg.data ?? msg;
					const payload = data && typeof data === "object" ? data.data ?? data : data;
					if (!payload || payload.monitorId == null) return;
					if (String(payload.monitorId) !== String(monitorId.value)) return;
					applyLivePayload(payload);
				} catch {}
			});
		}
		/** 聚合磁盘的合成标签：Linux 根「/」，Windows「此电脑」 */
		const aggDiskLabel = computed(() => {
			return String(hostRecord.value?.serverHostOsType ?? "").toUpperCase().includes("WIN") ? "此电脑" : "/";
		});
		/** 主机是否曾被成功画像：成功采集会写入 CPU 核数/内存/磁盘规格，失败主机这些列为 null */
		function isProfiled(r) {
			return !!r && (r.serverHostCpuCores != null || r.serverHostMemoryMb != null || r.serverHostDiskGb != null);
		}
		/** 主机是否已采到过内置指标（决定无监控项时是否仍渲染仪表） */
		const hasHostMetrics = computed(() => {
			const r = hostRecord.value;
			if (!r || !isProfiled(r)) return false;
			return r.serverHostCpuUsage != null || r.serverHostMemUsage != null || r.serverHostDiskUsage != null;
		});
		/** 趋势口径：有监控项为 24h 历史，否则仅本次会话的实时序列 */
		const trendIsRealtime = computed(() => !monitorId.value);
		/** 记录一次推送/采集的心跳（LIVE 活性、推送计数、最后时间） */
		function markPushHeart(clock) {
			pushCount.value++;
			lastPushAt.value = Date.now();
			lastPushText.value = fmtClock(clock ?? Date.now());
		}
		/**
		* 用主机台账记录初始化仪表（CPU/内存/磁盘/磁盘IO/软件 + 硬件规格），并给实时趋势种起点。
		* 监控项存在时，监控项的明细（网络/JVM/24h）会在 fetchMetrics 中覆盖更精确的值。
		*/
		function applyHostRecord(r) {
			if (!r) return;
			hostRecord.value = r;
			if (!hostName.value) hostName.value = r.serverHostName ?? "";
			if (!isProfiled(r)) return;
			const cores = r.serverHostCpuCores != null ? Number(r.serverHostCpuCores) : void 0;
			if (r.serverHostCpuUsage != null) {
				const v = Number(r.serverHostCpuUsage);
				cpu.value = {
					usage: v,
					cores
				};
				if (trendIsRealtime.value) pushPoint(cpuHist, v);
			} else if (cores != null) cpu.value = {
				...cpu.value ?? {},
				cores
			};
			const memMb = r.serverHostMemoryMb != null ? Number(r.serverHostMemoryMb) : void 0;
			const memTotal = memMb != null ? memMb * 1024 * 1024 : void 0;
			if (r.serverHostMemUsage != null) {
				const v = Number(r.serverHostMemUsage);
				const used = memTotal != null ? memTotal * v / 100 : void 0;
				mem.value = {
					usagePercent: v,
					usage: used,
					total: memTotal
				};
				if (trendIsRealtime.value) pushPoint(memHist, v);
			} else if (memTotal != null) mem.value = {
				...mem.value ?? {},
				total: memTotal
			};
			if (r.serverHostDiskUsage != null && disk.value.length === 0) {
				const v = Number(r.serverHostDiskUsage);
				const total = r.serverHostDiskGb != null ? Number(r.serverHostDiskGb) * 1024 * 1024 * 1024 : void 0;
				disk.value = [{
					mount: aggDiskLabel.value,
					device: r.serverHostOsType ?? "",
					used: total ? total * v / 100 : 0,
					total,
					usedText: "—",
					usagePercent: v
				}];
			}
			if (r.serverHostDiskReadKbs != null) diskRead.value = Number(r.serverHostDiskReadKbs);
			if (r.serverHostDiskWriteKbs != null) diskWrite.value = Number(r.serverHostDiskWriteKbs);
			const sw = parseSoftware(r.serverHostSoftware);
			if (sw.length) software.value = sw;
		}
		/** 拉取主机台账，初始化内置指标 */
		async function loadHostRecord() {
			try {
				applyHostRecord(await getHost(hostId.value));
			} catch (e) {
				error.value = String(e?.message ?? e);
			}
		}
		/** 订阅主机内置实时推送（host-metrics，按 hostId 过滤），无监控项时这是主实时源 */
		function bindHostMetrics() {
			unsubHostMetric?.();
			if (!socket) return;
			unsubHostMetric = socket.subscribe("monitor", "host-metrics", (msg) => {
				try {
					const d = msg.data ?? msg;
					if (!d || d.hostId == null || String(d.hostId) !== String(hostId.value)) return;
					if (d.cpu != null && !Number.isNaN(Number(d.cpu))) {
						const v = Number(d.cpu);
						cpu.value = {
							...cpu.value ?? {},
							usage: v
						};
						if (trendIsRealtime.value) pushPoint(cpuHist, v);
					}
					if (d.mem != null && !Number.isNaN(Number(d.mem))) {
						const v = Number(d.mem);
						mem.value = {
							...mem.value ?? {},
							usagePercent: v
						};
						if (trendIsRealtime.value) pushPoint(memHist, v);
					}
					if (d.disk != null && !Number.isNaN(Number(d.disk))) {
						const v = Number(d.disk);
						if (disk.value.length === 0) disk.value = [{
							mount: aggDiskLabel.value,
							device: "",
							used: 0,
							total: 0,
							usedText: "—",
							usagePercent: v
						}];
						else disk.value = disk.value.map((d0, i) => i === 0 ? {
							...d0,
							usagePercent: v
						} : d0);
						pushPoint(diskHist, v);
					}
					if (d.diskRead != null) {
						const v = Number(d.diskRead);
						diskRead.value = v;
						if (trendIsRealtime.value) pushPoint(diskReadHist, v);
					}
					if (d.diskWrite != null) {
						const v = Number(d.diskWrite);
						diskWrite.value = v;
						if (trendIsRealtime.value) pushPoint(diskWriteHist, v);
					}
					const sw = parseSoftware(d.software);
					if (sw.length) software.value = sw;
					markPushHeart(d.collectTime);
				} catch {}
			});
		}
		/** 把画像概览（HostProfile，metrics 为 HostMetricsVO 形状）映射到仪表与趋势 */
		function applyFreshProfile(p) {
			if (!p) return;
			if (p.host) {
				hostRecord.value = p.host;
				if (!hostName.value) hostName.value = p.host.serverHostName ?? "";
			}
			const m = p.metrics;
			if (!m) {
				markPushHeart(p.collectedAt);
				return;
			}
			const realtime = trendIsRealtime.value;
			const cpuVal = numOr0(m.cpuPercent);
			const cores = cpu.value?.cores ?? (p.host?.serverHostCpuCores != null ? numOr0(p.host.serverHostCpuCores) : void 0);
			cpu.value = {
				usage: cpuVal,
				cores
			};
			if (realtime) pushPoint(cpuHist, cpuVal);
			const totalMb = numOr0(m.memoryTotalMb), usedMb = numOr0(m.memoryUsedMb);
			mem.value = {
				usagePercent: numOr0(m.memoryPercent),
				usage: usedMb * 1024 * 1024,
				total: totalMb * 1024 * 1024
			};
			if (realtime) pushPoint(memHist, numOr0(m.memoryPercent));
			if (realtime) {
				const totalGb = numOr0(m.diskTotalGb), usedGb = numOr0(m.diskUsedGb);
				disk.value = [{
					mount: aggDiskLabel.value,
					device: p.host?.serverHostOsType ?? "",
					used: usedGb * 1073741824,
					total: totalGb * 1073741824,
					usedText: "—",
					usagePercent: numOr0(m.diskPercent)
				}];
				pushPoint(diskHist, numOr0(m.diskPercent));
			}
			const rKbs = numOr0(m.diskReadKbs), wKbs = numOr0(m.diskWriteKbs);
			diskRead.value = rKbs;
			diskWrite.value = wKbs;
			if (realtime) {
				pushPoint(diskReadHist, rKbs);
				pushPoint(diskWriteHist, wKbs);
			}
			const sw = parseSoftware(p.host?.serverHostSoftware);
			if (sw.length) software.value = sw;
			const rxKb = Number(m.networkRxKb ?? 0), txKb = Number(m.networkTxKb ?? 0);
			net.value = {
				rx: rxKb * 1024,
				tx: txKb * 1024
			};
			if (realtime) pushPoint(netHist, Math.max(txKb, rxKb) * 1024);
			markPushHeart(m.collectTime ?? p.collectedAt);
		}
		/** 强制一次新鲜采集：画像接口拉全量（含网络/磁盘IO/软件），有监控项再补 JVM/24h */
		async function refreshNow(silent = false) {
			if (!silent) loading.value = true;
			error.value = "";
			try {
				applyFreshProfile(await fetchHostProfile(hostId.value, {
					live: true,
					persist: true
				}));
				if (monitorId.value) await fetchMetrics();
			} catch (e) {
				error.value = String(e?.message ?? e);
			} finally {
				loading.value = false;
			}
		}
		async function fetchMetrics() {
			if (!monitorId.value) {
				resetMetrics();
				return;
			}
			loading.value = true;
			error.value = "";
			try {
				const id = monitorId.value;
				const [c, m, d, n, j] = await Promise.allSettled([
					getLatestCpu(id),
					getLatestMemory(id),
					getLatestDisk(id),
					getLatestNetwork(id),
					getLatestJvm(id)
				]);
				if (c.status === "fulfilled") cpu.value = c.value ? {
					usage: numOr0(c.value.cpuUsage),
					cores: c.value.cpuCores
				} : null;
				if (m.status === "fulfilled") mem.value = m.value ? {
					usagePercent: numOr0(m.value.usagePercent),
					usage: numOr0(m.value.usedBytes),
					total: numOr0(m.value.totalBytes)
				} : null;
				if (d.status === "fulfilled") disk.value = (d.value ?? []).map((r) => ({
					mount: r.mountPoint,
					device: r.fileSystem,
					used: r.usedBytes,
					total: r.totalBytes,
					usagePercent: r.usagePercent
				}));
				if (n.status === "fulfilled") net.value = n.value ? {
					rx: numOr0(n.value.rxBytes),
					tx: numOr0(n.value.txBytes)
				} : null;
				if (j.status === "fulfilled") jvm.value = j.value ? {
					heapUsed: numOr0(j.value.heapUsedBytes),
					heapMax: numOr0(j.value.heapMaxBytes),
					heapUsagePercent: numOr0(j.value.heapUsagePercent)
				} : null;
				const [ch, mh, nh, jh] = await Promise.allSettled([
					getCpuHistory(id, 24),
					getMemoryHistory(id, 24),
					getNetworkHistory(id, 24),
					getJvmHistory(id, 24)
				]);
				if (ch.status === "fulfilled") cpuHist.value = (ch.value ?? []).map((r) => numOr0(r.cpuUsage));
				if (mh.status === "fulfilled") memHist.value = (mh.value ?? []).map((r) => numOr0(r.usagePercent));
				if (nh.status === "fulfilled") netHist.value = (nh.value ?? []).map((r) => numOr0(r.txBytes));
				if (jh.status === "fulfilled") jvmHist.value = (jh.value ?? []).map((r) => numOr0(r.heapUsagePercent));
			} catch (e) {
				error.value = String(e?.message ?? e);
			} finally {
				loading.value = false;
			}
		}
		/** 清空仪表与趋势，避免显示上一台主机/上一个监控项的数据 */
		function resetMetrics() {
			cpu.value = null;
			mem.value = null;
			disk.value = [];
			net.value = null;
			jvm.value = null;
			diskRead.value = 0;
			diskWrite.value = 0;
			software.value = [];
			cpuHist.value = [];
			memHist.value = [];
			diskHist.value = [];
			diskReadHist.value = [];
			diskWriteHist.value = [];
			netHist.value = [];
			jvmHist.value = [];
		}
		/**
		* 解析资产聚合详情：主机名 + 名下监控项，并把 monitorId 定位到可用监控项
		* @param preferred 优先选中的监控项标识（下拉切换时用）
		*/
		async function resolveAsset(preferred) {
			try {
				const detail = await getAssetDetail(hostId.value);
				hostName.value = detail?.name ?? "";
				monitors.value = detail?.monitors ?? [];
				const hit = preferred != null ? monitors.value.find((m) => Number(m.monitorId) === Number(preferred)) : monitors.value.find((m) => m.enabled !== false) ?? monitors.value[0];
				const next = hit ? Number(hit.monitorId) : 0;
				if (next === monitorId.value) return;
				monitorId.value = next;
				bindLive();
				await fetchMetrics();
			} catch (e) {
				error.value = String(e?.message ?? e);
			}
		}
		/** 下拉切换监控项 */
		function onMonitorChange(id) {
			resolveAsset(id);
		}
		const aiEnabled = ref(false);
		const aiModel = ref("");
		const aiDialogVisible = ref(false);
		const aiLoading = ref(false);
		const aiError = ref("");
		const aiResult = ref("");
		const aiUsedModel = ref("");
		const aiDimension = ref("");
		/** 分析重点候选：后端把该值原样拼进提示词的"分析重点"，空值即综合评估 */
		const AI_DIMENSIONS = [
			{
				label: "综合评估",
				value: ""
			},
			{
				label: "CPU 与负载",
				value: "CPU 使用率与系统负载"
			},
			{
				label: "内存压力",
				value: "内存占用与泄漏风险"
			},
			{
				label: "磁盘容量",
				value: "磁盘使用率与容量趋势"
			},
			{
				label: "网络与延迟",
				value: "网络吞吐与延迟"
			}
		];
		/** 按钮可用态：AI 未配置时禁用并在提示里说明原因 */
		const aiDisabled = computed(() => !aiEnabled.value || !hostId.value);
		/** 读取 AI 配置状态，决定入口是否可用 */
		async function loadAiStatus() {
			try {
				const st = await fetchAiStatus();
				aiEnabled.value = !!st?.enabled;
				aiModel.value = st?.model ?? "";
			} catch {
				aiEnabled.value = false;
			}
		}
		/** 打开弹窗并发起一次分析 */
		function runAiAnalysis() {
			aiError.value = "";
			aiResult.value = "";
			aiUsedModel.value = "";
			aiDialogVisible.value = true;
			requestAnalysis();
		}
		/** 调用主机指标分析接口（指标快照由后端按 hostId 取，前端不回传） */
		async function requestAnalysis() {
			if (aiLoading.value || !hostId.value) return;
			aiLoading.value = true;
			aiError.value = "";
			aiResult.value = "";
			try {
				const res = await aiAnalyzeHost(hostId.value, { dimension: aiDimension.value || void 0 });
				aiResult.value = res?.content ?? "";
				aiUsedModel.value = res?.model ?? "";
				if (!aiResult.value) aiError.value = "模型未返回内容，请稍后重试。";
			} catch (e) {
				aiError.value = String(e?.message ?? e);
			} finally {
				aiLoading.value = false;
			}
		}
		watch(() => route.params.id, (id) => {
			const n = Number(id);
			if (!n || n === hostId.value) return;
			hostId.value = n;
			monitorId.value = 0;
			hostRecord.value = null;
			if (histChart) {
				histChart.dispose();
				histChart = null;
			}
			resetMetrics();
			resetProfilePager();
			profileRows.value = [];
			(async () => {
				await loadHostRecord();
				await loadHostBaseHistory();
				await resolveAsset();
				await refreshNow(true);
				loadProfileSection();
			})();
		});
		onMounted(() => {
			bindHostMetrics();
			(async () => {
				await loadSwSetting();
				await loadHostRecord();
				await loadHostBaseHistory();
				await resolveAsset();
				await refreshNow(true);
				loadAiStatus();
				loadProfileSection();
			})();
		});
		onBeforeUnmount(() => {
			unsubMetric?.();
			unsubHostMetric?.();
			if (histChart) {
				histChart.dispose();
				histChart = null;
			}
		});
		/** 进页面先取近 1 小时主机历史，作为趋势基础数据（无监控项也可） */
		async function loadHostBaseHistory() {
			try {
				const rows = await getHostMetricHistory(hostId.value, 1);
				if (!rows.length) return;
				const cpuVals = [];
				const memVals = [];
				const diskVals = [];
				const rVals = [];
				const wVals = [];
				for (const r of rows) {
					if (r[1] != null) cpuVals.push(Number(r[1]));
					if (r[2] != null) memVals.push(Number(r[2]));
					if (r[3] != null) diskVals.push(Number(r[3]));
					if (r[4] != null) rVals.push(Number(r[4]));
					if (r[5] != null) wVals.push(Number(r[5]));
				}
				if (!monitorId.value) {
					if (cpuVals.length) cpuHist.value = cpuVals.slice(-240);
					if (memVals.length) memHist.value = memVals.slice(-240);
					if (diskVals.length) diskHist.value = diskVals.slice(-240);
					if (rVals.length) diskReadHist.value = rVals.slice(-240);
					if (wVals.length) diskWriteHist.value = wVals.slice(-240);
				}
			} catch {}
		}
		/** 历史弹窗指标：单序列百分比（cpu/mem/disk）或双序列磁盘IO（diskio） */
		const histDialogVisible = ref(false);
		const histKind = ref("cpu");
		const histHours = ref(1);
		const histLoading = ref(false);
		/** 单序列（百分比） */
		const histSeries = ref([]);
		/** 双序列（磁盘IO，KB/s）：读 / 写 */
		const histIoRead = ref([]);
		const histIoWrite = ref([]);
		const histRangeOptions = [
			{
				label: "近1小时",
				value: 1
			},
			{
				label: "近6小时",
				value: 6
			},
			{
				label: "近24小时",
				value: 24
			},
			{
				label: "近7天",
				value: 168
			}
		];
		const KIND_LABEL = {
			cpu: "CPU 使用率",
			mem: "内存使用率",
			disk: "磁盘使用率",
			diskio: "磁盘读写速率"
		};
		const histTitle = computed(() => `${hostName.value || "主机 #" + hostId.value} · ${KIND_LABEL[histKind.value]}`);
		const histChartRef = ref();
		let histChart = null;
		/** 各指标主题色（与趋势 sparkline 一致） */
		const HIST_COLOR = {
			cpu: "#3b82f6",
			mem: "#8b5cf6",
			disk: "#f59e0b"
		};
		/** 点击趋势卡片打开历史弹窗（指标即被点击卡片，弹窗内只选时间范围） */
		function openHistDialog(kind) {
			histKind.value = kind;
			histDialogVisible.value = true;
			fetchHistSeries();
		}
		/** 弹窗内切换时间范围后重新拉取 */
		function onHistHoursChange(v) {
			histHours.value = Number(v);
			fetchHistSeries();
		}
		/** 按当前指标与时间范围拉取真实历史并渲染大图 */
		async function fetchHistSeries() {
			histLoading.value = true;
			try {
				const rows = await getHostMetricHistory(hostId.value, histHours.value);
				if (histKind.value === "diskio") {
					const rPts = [];
					const wPts = [];
					for (const r of rows) {
						if (r[4] != null) rPts.push([Number(r[0]), Number(r[4])]);
						if (r[5] != null) wPts.push([Number(r[0]), Number(r[5])]);
					}
					histIoRead.value = rPts;
					histIoWrite.value = wPts;
				} else {
					const idx = histKind.value === "cpu" ? 1 : histKind.value === "mem" ? 2 : 3;
					const pts = [];
					for (const r of rows) {
						const v = r[idx];
						if (v != null) pts.push([Number(r[0]), Number(v)]);
					}
					histSeries.value = pts;
				}
				await nextTick(() => renderHistChart());
			} finally {
				histLoading.value = false;
			}
		}
		/** 渲染历史大图 */
		function renderHistChart() {
			if (!histChartRef.value) return;
			if (!histChart) histChart = init(histChartRef.value);
			if (histKind.value === "diskio") histChart.setOption({
				grid: {
					left: 60,
					right: 20,
					top: 36,
					bottom: 42
				},
				legend: {
					top: 6,
					right: 12,
					itemWidth: 14,
					itemHeight: 8,
					textStyle: { fontSize: 11 },
					data: [{ name: "读取" }, { name: "写入" }]
				},
				tooltip: {
					trigger: "axis",
					valueFormatter: (v) => fmtKbs(Number(v))
				},
				xAxis: {
					type: "time",
					axisLabel: {
						fontSize: 10,
						hideOverlap: true
					}
				},
				yAxis: {
					type: "value",
					min: 0,
					axisLabel: {
						formatter: (v) => v >= 1024 ? `${(v / 1024).toFixed(0)}M` : `${v}K`,
						fontSize: 10
					}
				},
				dataZoom: [{ type: "inside" }, {
					type: "slider",
					height: 16,
					bottom: 12
				}],
				series: [{
					name: "读取",
					type: "line",
					data: histIoRead.value,
					showSymbol: false,
					smooth: false,
					lineStyle: {
						color: "#f59e0b",
						width: 2
					},
					itemStyle: { color: "#f59e0b" },
					areaStyle: { color: "rgba(245,158,11,0.08)" }
				}, {
					name: "写入",
					type: "line",
					data: histIoWrite.value,
					showSymbol: false,
					smooth: false,
					lineStyle: {
						color: "#06b6d4",
						width: 2
					},
					itemStyle: { color: "#06b6d4" },
					areaStyle: { color: "rgba(6,182,212,0.08)" }
				}]
			}, true);
			else {
				const color = HIST_COLOR[histKind.value];
				histChart.setOption({
					grid: {
						left: 48,
						right: 20,
						top: 20,
						bottom: 42
					},
					tooltip: {
						trigger: "axis",
						valueFormatter: (v) => `${Number(v).toFixed(1)}%`
					},
					xAxis: {
						type: "time",
						axisLabel: {
							fontSize: 10,
							hideOverlap: true
						}
					},
					yAxis: {
						type: "value",
						min: 0,
						max: 100,
						axisLabel: {
							formatter: "{value}%",
							fontSize: 10
						}
					},
					dataZoom: [{ type: "inside" }, {
						type: "slider",
						height: 16,
						bottom: 12
					}],
					series: [{
						type: "line",
						data: histSeries.value,
						showSymbol: false,
						smooth: false,
						lineStyle: {
							color,
							width: 2
						},
						itemStyle: { color },
						areaStyle: { color: new LinearGradient(0, 0, 0, 1, [{
							offset: 0,
							color: color + "40"
						}, {
							offset: 1,
							color: color + "05"
						}]) }
					}]
				}, true);
			}
			histChart.resize();
		}
		watch(histDialogVisible, (v) => {
			if (!v && histChart) {
				histChart.dispose();
				histChart = null;
			}
		});
		function diskCapacityText(r) {
			return `已用 ${fmt(r.used)} · 共 ${fmt(r.total)}`;
		}
		/** 容量是否紧张（使用率 ≥90%）→ 进度条红色 */
		function diskLow(r) {
			return Number(r.usagePercent ?? 0) >= 90;
		}
		function diskUsageWidth(r) {
			return `${Math.max(0, Math.min(100, Number(r.usagePercent ?? 0)))}%`;
		}
		/** 软件显示设置在 ms_monitor_config 中的 key；值为逗号分隔可见类型，空串=全部显示 */
		const SOFTWARE_LABELS = {
			java: "Java 进程",
			mysql: "MySQL",
			mariadb: "MariaDB",
			postgres: "PostgreSQL",
			redis: "Redis",
			"redis-sentinel": "Redis Sentinel",
			mongodb: "MongoDB",
			nginx: "Nginx",
			node: "Node.js",
			docker: "Docker",
			containerd: "containerd",
			elasticsearch: "Elasticsearch",
			kafka: "Kafka",
			zookeeper: "ZooKeeper",
			rabbitmq: "RabbitMQ",
			tomcat: "Tomcat",
			arthas: "Arthas",
			skywalking: "SkyWalking",
			memcached: "Memcached",
			etcd: "etcd",
			minio: "MinIO",
			"node-exporter": "Node Exporter",
			"redis-exporter": "Redis Exporter"
		};
		function swLabel(t) {
			return SOFTWARE_LABELS[t] || t;
		}
		/** 可见类型集合：null=全部显示（默认），Set=仅显示其中类型 */
		const visibleTypes = ref(null);
		/** 显示设置弹窗 */
		const swSettingVisible = ref(false);
		const swSettingSaving = ref(false);
		function openSwSetting() {
			swSettingVisible.value = true;
		}
		/** 设置弹窗候选类型（已知类型 ∪ 当前检测类型），按标签排序 */
		const swSettingTypes = computed(() => {
			const set = new Set(Object.keys(SOFTWARE_LABELS));
			for (const s of software.value) set.add(s.type);
			return [...set].sort((a, b) => swLabel(a).localeCompare(swLabel(b), "zh"));
		});
		function swSettingChecked(t) {
			return visibleTypes.value ? visibleTypes.value.has(t) : true;
		}
		function swSettingToggle(t) {
			if (!visibleTypes.value) visibleTypes.value = new Set(swSettingTypes.value);
			if (visibleTypes.value.has(t)) visibleTypes.value.delete(t);
			else visibleTypes.value.add(t);
		}
		function swSettingAll(on) {
			visibleTypes.value = on ? new Set(swSettingTypes.value) : /* @__PURE__ */ new Set();
		}
		async function loadSwSetting() {
			try {
				const raw = (await getAllConfig())?.[SW_VISIBLE_KEY];
				if (raw == null || String(raw).trim() === "") visibleTypes.value = null;
				else visibleTypes.value = new Set(String(raw).split(",").map((s) => s.trim()).filter(Boolean));
			} catch {
				visibleTypes.value = null;
			}
		}
		async function saveSwSetting() {
			swSettingSaving.value = true;
			try {
				const value = !visibleTypes.value || visibleTypes.value.size === swSettingTypes.value.length ? "" : [...visibleTypes.value ?? []].join(",");
				await saveConfig([{
					monitorConfigKey: SW_VISIBLE_KEY,
					monitorConfigValue: value,
					monitorConfigDesc: "主机软件实例可见类型(逗号分隔,空=全部)"
				}]);
				visibleTypes.value = value ? new Set(value.split(",")) : null;
				swSettingVisible.value = false;
			} finally {
				swSettingSaving.value = false;
			}
		}
		const softwareVisible = computed(() => {
			if (!visibleTypes.value) return software.value;
			return software.value.filter((s) => visibleTypes.value.has(s.type));
		});
		/** 按类型聚合的软件分组，按总 CPU 降序 */
		const softwareGroups = computed(() => {
			const map = /* @__PURE__ */ new Map();
			for (const s of softwareVisible.value) {
				if (!map.has(s.type)) map.set(s.type, []);
				map.get(s.type).push(s);
			}
			const groups = [];
			for (const [type, instances] of map) {
				const ins = [...instances].sort((a, b) => numOr0(b.cpu) - numOr0(a.cpu));
				groups.push({
					type,
					label: swLabel(type),
					instances: ins,
					count: ins.length,
					totalCpu: ins.reduce((acc, x) => acc + numOr0(x.cpu), 0),
					totalMem: ins.reduce((acc, x) => acc + numOr0(x.memMb), 0),
					pids: ins.map((x) => numOr0(x.pid)),
					ports: ins.map((x) => numOr0(x.port)).filter(Boolean),
					maxUptime: Math.max(0, ...ins.map((x) => numOr0(x.uptimeSec)))
				});
			}
			return groups.sort((a, b) => b.totalCpu - a.totalCpu);
		});
		/** 软件类型数（顶部统计，按可见后） */
		const softwareTypeCount = computed(() => softwareGroups.value.length);
		/** 可见软件实例总数 */
		const softwareInstanceCount = computed(() => softwareVisible.value.length);
		/** 分组徽章首字母 */
		function swMonogram(g) {
			return (g.label || g.type || "?").trim().charAt(0).toUpperCase();
		}
		/** 卡片上展示的 PID（最多 3 个，超出显示 +N） */
		function swCardPids(g) {
			return {
				pids: g.pids.slice(0, 3),
				rest: Math.max(0, g.pids.length - 3)
			};
		}
		/** 内联迷你条：某实例 CPU 相对组内最大值的宽度百分比 */
		function swBarWidth(g, v) {
			const max = Math.max(1, ...g.instances.map((x) => numOr0(x.cpu)));
			return Math.max(4, Math.round(numOr0(v) / max * 100));
		}
		/** 分组配色角色（循环取 el 主题色，全部走 CSS 变量） */
		const SW_COLOR_ROLES = [
			"primary",
			"success",
			"warning",
			"danger",
			"info"
		];
		function swColorRole(i) {
			return SW_COLOR_ROLES[i % SW_COLOR_ROLES.length];
		}
		const swDetailVisible = ref(false);
		const swDetailGroup = ref(null);
		const swDetailChartRef = ref();
		let swDetailChart = null;
		function openSwDetail(g) {
			swDetailGroup.value = g;
			swDetailVisible.value = true;
		}
		function renderSwDetailChart() {
			const g = swDetailGroup.value;
			if (!swDetailChartRef.value || !g) return;
			if (!swDetailChart) swDetailChart = init(swDetailChartRef.value);
			swDetailChart.setOption({
				tooltip: {
					trigger: "item",
					valueFormatter: (v) => `${v}%`
				},
				legend: {
					bottom: 0,
					type: "scroll",
					textStyle: { fontSize: 11 }
				},
				series: [{
					type: "pie",
					radius: ["42%", "68%"],
					center: ["50%", "44%"],
					avoidLabelOverlap: true,
					itemStyle: { borderWidth: 2 },
					label: {
						show: true,
						formatter: "{b}\n{d}%",
						fontSize: 10
					},
					data: g.instances.map((x) => ({
						name: `PID ${numOr0(x.pid)}`,
						value: Number(numOr0(x.cpu).toFixed(2))
					}))
				}]
			}, true);
			swDetailChart.resize();
		}
		watch(swDetailVisible, (v) => {
			if (v) nextTick(renderSwDetailChart);
			else if (swDetailChart) {
				swDetailChart.dispose();
				swDetailChart = null;
			}
		});
		onBeforeUnmount(() => {
			if (swDetailChart) {
				swDetailChart.dispose();
				swDetailChart = null;
			}
		});
		/** 分区定义：单主机详情无需左侧列表，直接沿用画像分区的列与动作 */
		const PROFILE_SECTIONS = [
			{
				name: "ports",
				label: "监听端口"
			},
			{
				name: "processes",
				label: "进程"
			},
			{
				name: "services",
				label: "服务"
			},
			{
				name: "disks",
				label: "磁盘"
			},
			{
				name: "network",
				label: "网络"
			},
			{
				name: "env",
				label: "环境变量"
			},
			{
				name: "firewall",
				label: "防火墙"
			}
		];
		/** 各分区的列定义（与 HostProfileView.COLUMNS 同口径，防火墙按后端 FirewallRuleRowVO 补列） */
		const PROFILE_COLUMNS = {
			ports: [
				{
					key: "protocol",
					label: "协议"
				},
				{
					key: "local",
					label: "监听地址"
				},
				{
					key: "port",
					label: "端口",
					sortable: true,
					align: "right"
				},
				{
					key: "state",
					label: "状态"
				},
				{
					key: "pid",
					label: "PID",
					sortable: true,
					align: "right"
				},
				{
					key: "process",
					label: "进程"
				}
			],
			processes: [
				{
					key: "pid",
					label: "PID",
					sortable: true,
					align: "right"
				},
				{
					key: "name",
					label: "进程名"
				},
				{
					key: "cpu",
					label: "CPU%",
					sortable: true,
					align: "right"
				},
				{
					key: "memory",
					label: "内存",
					sortable: true,
					align: "right"
				},
				{
					key: "threads",
					label: "线程",
					sortable: true,
					align: "right"
				},
				{
					key: "command",
					label: "命令行"
				}
			],
			services: [
				{
					key: "name",
					label: "服务名"
				},
				{
					key: "displayName",
					label: "显示名"
				},
				{
					key: "state",
					label: "状态"
				},
				{
					key: "startType",
					label: "启动类型"
				},
				{
					key: "pid",
					label: "PID",
					sortable: true,
					align: "right"
				}
			],
			disks: [
				{
					key: "mount",
					label: "挂载点"
				},
				{
					key: "name",
					label: "名称"
				},
				{
					key: "fsType",
					label: "类型"
				},
				{
					key: "totalGb",
					label: "容量(GB)",
					sortable: true,
					align: "right"
				},
				{
					key: "usedGb",
					label: "已用(GB)",
					sortable: true,
					align: "right"
				},
				{
					key: "availGb",
					label: "可用(GB)",
					sortable: true,
					align: "right"
				},
				{
					key: "usage",
					label: "使用率%",
					sortable: true,
					align: "right"
				}
			],
			network: [
				{
					key: "name",
					label: "网卡"
				},
				{
					key: "status",
					label: "状态"
				},
				{
					key: "mac",
					label: "MAC"
				},
				{
					key: "ipv4",
					label: "IPv4"
				},
				{
					key: "ipv6",
					label: "IPv6"
				},
				{
					key: "mtu",
					label: "MTU",
					sortable: true,
					align: "right"
				},
				{
					key: "speed",
					label: "速率"
				}
			],
			env: [{
				key: "name",
				label: "变量"
			}, {
				key: "value",
				label: "值"
			}],
			firewall: [
				{
					key: "name",
					label: "规则名",
					sortable: true
				},
				{
					key: "direction",
					label: "方向",
					sortable: true
				},
				{
					key: "action",
					label: "动作",
					sortable: true
				},
				{
					key: "protocol",
					label: "协议",
					sortable: true
				},
				{
					key: "localPort",
					label: "端口",
					sortable: true,
					align: "right"
				},
				{
					key: "program",
					label: "程序"
				}
			]
		};
		/** 当前分区 */
		const profileTab = ref("disks");
		/** 分页（仅 ports/processes/services/firewall 走后端分页） */
		const profilePage = ref(1);
		const profilePageSize = ref(10);
		/** 检索关键字：分页分区走后端跨页匹配，非分页分区走前端过滤 */
		const profileKeyword = ref("");
		const profileRows = ref([]);
		const profileLoading = ref(false);
		const profileError = ref("");
		let profileReq = 0;
		/** 进程/服务/监听端口/防火墙由后端分页（后台只回当前页） */
		const profilePaged = computed(() => profileTab.value === "processes" || profileTab.value === "services" || profileTab.value === "ports" || profileTab.value === "firewall");
		/** 后端不分页的分区在前端过滤：任一字段命中关键字即保留 */
		const profileVisibleRows = computed(() => {
			const kw = profileKeyword.value.trim().toLowerCase();
			const rows = !kw || profilePaged.value ? profileRows.value : profileRows.value.filter((r) => Object.values(r).some((v) => v !== null && v !== void 0 && String(v).toLowerCase().includes(kw)));
			if (profilePaged.value || !profileSortKey.value) return rows;
			const k = profileSortKey.value;
			const dir = profileSortDir.value === "asc" ? 1 : -1;
			return [...rows].sort((a, b) => {
				const av = a[k], bv = b[k];
				if (av == null || av === "") return dir;
				if (bv == null || bv === "") return -dir;
				const an = Number(av), bn = Number(bv);
				if (!isNaN(an) && !isNaN(bn)) return (an - bn) * dir;
				return String(av).localeCompare(String(bv)) * dir;
			});
		});
		/** 排序列名（为空表示未排序） */
		const profileSortKey = ref("");
		/** 排序方向：asc | desc */
		const profileSortDir = ref("asc");
		/** 点击表头切换排序：未排→降序→升序→取消 */
		function toggleProfileSort(key) {
			if (profileSortKey.value === key) if (profileSortDir.value === "desc") {
				profileSortKey.value = "";
				profileSortDir.value = "asc";
			} else profileSortDir.value = "desc";
			else {
				profileSortKey.value = key;
				profileSortDir.value = "desc";
			}
			profilePage.value = 1;
			loadProfileSection();
		}
		/** 切分区先归零页码与关键字，避免上一分区的检索污染下一分区 */
		function resetProfilePager() {
			profilePage.value = 1;
			profileKeyword.value = "";
			profileSortKey.value = "";
			profileSortDir.value = "asc";
		}
		/** 拉取当前分区 */
		async function loadProfileSection() {
			const req = ++profileReq;
			const hid = hostId.value;
			if (!hid) return;
			profileLoading.value = true;
			profileError.value = "";
			try {
				const sec = profileTab.value;
				const res = await fetchHostProfileSection(hid, sec, profilePaged.value ? profilePage.value : void 0, profilePaged.value ? profilePageSize.value : void 0, profilePaged.value ? profileKeyword.value.trim() || void 0 : void 0);
				if (req !== profileReq || hid !== hostId.value) return;
				profileRows.value = res.rows ?? [];
			} catch (e) {
				if (req !== profileReq) return;
				profileError.value = String(e?.message ?? e);
			} finally {
				if (req === profileReq) profileLoading.value = false;
			}
		}
		function pickProfileTab(name) {
			profileTab.value = name;
			resetProfilePager();
			profileRows.value = [];
			loadProfileSection();
		}
		function applyProfileKeyword() {
			profilePage.value = 1;
			loadProfileSection();
		}
		function changeProfilePage(delta) {
			const next = profilePage.value + delta;
			if (next < 1) return;
			profilePage.value = next;
			loadProfileSection();
		}
		/** 正在执行动作的行键（同一时刻只允许一个远端写操作） */
		const profileBusyRow = ref("");
		/** 环境变量新增弹窗 */
		const profileEnvDialog = ref(false);
		const profileEnvForm = ref({
			name: "",
			value: ""
		});
		/** 执行一次远端写操作：成功回显后端文案并重拉分区；失败由传输层统一提示 */
		async function runProfileAction(key, task) {
			profileBusyRow.value = key;
			try {
				const msg = await task;
				message.success(String(msg || "操作已完成"));
				await loadProfileSection();
				return true;
			} catch {
				return false;
			} finally {
				profileBusyRow.value = "";
			}
		}
		/** 破坏性动作前确认，取消返回 false */
		async function confirmProfileAction(message) {
			try {
				await ElMessageBox.confirm(message, "操作确认", {
					type: "warning",
					confirmButtonText: "确定",
					cancelButtonText: "取消"
				});
				return true;
			} catch {
				return false;
			}
		}
		/** 提交新增环境变量 */
		async function submitProfileEnv() {
			const name = profileEnvForm.value.name.trim();
			if (!name) {
				message.warning("请填写变量名");
				return;
			}
			if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(name)) {
				message.warning("变量名只能包含字母、数字、下划线，且不能以数字开头");
				return;
			}
			if (await runProfileAction(`env-set-${name}`, setHostEnvVar(hostId.value, name, profileEnvForm.value.value))) {
				profileEnvDialog.value = false;
				profileEnvForm.value = {
					name: "",
					value: ""
				};
			}
		}
		return (_ctx, _cache) => {
			const _component_ReButton = resolveComponent("ReButton");
			const _component_ReSectionHead = resolveComponent("ReSectionHead");
			const _component_ReSelect = resolveComponent("ReSelect");
			const _component_ReInput = resolveComponent("ReInput");
			const _component_el_icon = resolveComponent("el-icon");
			const _component_ReDialog = resolveComponent("ReDialog");
			const _component_el_checkbox = resolveComponent("el-checkbox");
			const _component_el_input = resolveComponent("el-input");
			return openBlock(), createElementBlock("div", _hoisted_1, [
				createVNode(_component_ReSectionHead, { description: `主机 #${hostId.value} · 实时遥测与趋势` }, {
					title: withCtx(() => [createTextVNode(toDisplayString(hostName.value || `主机 #${hostId.value}`), 1)]),
					actions: withCtx(() => [
						createVNode(_component_ReButton, {
							icon: "Back",
							"show-text": true,
							onClick: _cache[0] || (_cache[0] = ($event) => unref(router).push("/assets"))
						}, {
							default: withCtx(() => [..._cache[32] || (_cache[32] = [createTextVNode("资产", -1)])]),
							_: 1
						}),
						createVNode(_component_ReButton, {
							icon: "RefreshRight",
							"show-text": true,
							loading: loading.value,
							onClick: _cache[1] || (_cache[1] = ($event) => refreshNow())
						}, {
							default: withCtx(() => [..._cache[33] || (_cache[33] = [createTextVNode("刷新", -1)])]),
							_: 1
						}, 8, ["loading"]),
						createVNode(_component_ReButton, {
							icon: "MagicStick",
							"show-text": true,
							disabled: aiDisabled.value,
							title: aiDisabled.value ? "未配置 AI 模型，请先在系统配置中接入" : "按主机指标调用大模型分析",
							onClick: runAiAnalysis
						}, {
							default: withCtx(() => [..._cache[34] || (_cache[34] = [createTextVNode("AI 分析", -1)])]),
							_: 1
						}, 8, ["disabled", "title"]),
						createVNode(_component_ReButton, {
							icon: "Connection",
							"show-text": true,
							type: "primary",
							onClick: _cache[2] || (_cache[2] = ($event) => unref(router).push({
								path: "/terminal",
								query: { hostId: String(hostId.value) }
							}))
						}, {
							default: withCtx(() => [..._cache[35] || (_cache[35] = [createTextVNode("连接远控", -1)])]),
							_: 1
						})
					]),
					_: 1
				}, 8, ["description"]),
				error.value && (monitorId.value || hasHostMetrics.value) ? (openBlock(), createElementBlock("div", _hoisted_2, [createBaseVNode("span", null, "部分数据加载失败：" + toDisplayString(error.value), 1), createVNode(_component_ReButton, {
					icon: "RefreshRight",
					type: "primary",
					"show-text": true,
					onClick: _cache[3] || (_cache[3] = ($event) => refreshNow())
				}, {
					default: withCtx(() => [..._cache[36] || (_cache[36] = [createTextVNode("重试", -1)])]),
					_: 1
				})])) : createCommentVNode("", true),
				createBaseVNode("div", _hoisted_3, [
					createBaseVNode("header", _hoisted_4, [createBaseVNode("div", _hoisted_5, [
						createBaseVNode("div", _hoisted_6, "HOST · " + toDisplayString(String(hostId.value).padStart(3, "0")), 1),
						createBaseVNode("div", _hoisted_7, toDisplayString(hostName.value || `主机 #${hostId.value}`), 1),
						createBaseVNode("div", _hoisted_8, [
							createBaseVNode("span", null, "CPU " + toDisplayString(cpu.value?.cores ? cpu.value.cores + " 核" : "—"), 1),
							_cache[37] || (_cache[37] = createBaseVNode("i", { class: "dot-sep" }, null, -1)),
							createBaseVNode("span", null, "内存 " + toDisplayString(mem.value?.total ? fmt(mem.value.total) : "—"), 1),
							_cache[38] || (_cache[38] = createBaseVNode("i", { class: "dot-sep" }, null, -1)),
							createBaseVNode("span", null, "软件 " + toDisplayString(softwareTypeCount.value || "—") + " 类", 1)
						]),
						monitors.value.length ? (openBlock(), createElementBlock("div", _hoisted_9, [
							_cache[39] || (_cache[39] = createBaseVNode("span", { class: "pm-k" }, "监控项", -1)),
							createVNode(_component_ReSelect, {
								"model-value": monitorId.value,
								class: "pm-sel",
								options: monitors.value.map((m) => ({
									label: `${m.name || "#" + m.monitorId}（告警 ${m.activeAlarmCount ?? 0}）`,
									value: Number(m.monitorId)
								})),
								onChange: _cache[4] || (_cache[4] = ($event) => onMonitorChange(Number($event)))
							}, null, 8, ["model-value", "options"]),
							_cache[40] || (_cache[40] = createBaseVNode("span", { class: "pm-hint" }, "指标按监控项存储，切换后下方仪表与趋势随之刷新", -1))
						])) : createCommentVNode("", true)
					]), createBaseVNode("div", _hoisted_10, [
						createBaseVNode("span", { class: normalizeClass(["live", { on: liveActive.value }]) }, [..._cache[41] || (_cache[41] = [createBaseVNode("i", { class: "live-dot" }, null, -1), createTextVNode("LIVE", -1)])], 2),
						createBaseVNode("div", _hoisted_11, [
							_cache[42] || (_cache[42] = createBaseVNode("span", { class: "stat-k" }, "推送", -1)),
							createBaseVNode("b", _hoisted_12, toDisplayString(pushCount.value), 1),
							_cache[43] || (_cache[43] = createBaseVNode("span", { class: "stat-sep" }, null, -1)),
							_cache[44] || (_cache[44] = createBaseVNode("span", { class: "stat-k" }, "最后", -1)),
							createBaseVNode("b", _hoisted_13, toDisplayString(lastPushText.value), 1)
						]),
						createBaseVNode("span", { class: normalizeClass(["sock", { ok: sockOn.value }]) }, [_cache[45] || (_cache[45] = createBaseVNode("span", { class: "sock-dot" }, null, -1)), createTextVNode(" " + toDisplayString(sockOn.value ? "实时已连接" : "实时未连接"), 1)], 2),
						createBaseVNode("button", {
							class: "btn-refresh",
							disabled: loading.value,
							onClick: _cache[5] || (_cache[5] = ($event) => refreshNow())
						}, [createBaseVNode("i", { class: normalizeClass(["ico", { spin: loading.value }]) }, null, 2), _cache[46] || (_cache[46] = createTextVNode("刷新 ", -1))], 8, _hoisted_14)
					])]),
					_cache[111] || (_cache[111] = createBaseVNode("div", { class: "scanline" }, null, -1)),
					!monitorId.value && !hasHostMetrics.value ? (openBlock(), createElementBlock("div", _hoisted_15, [error.value ? (openBlock(), createElementBlock(Fragment, { key: 0 }, [
						_cache[48] || (_cache[48] = createBaseVNode("b", null, "主机当前不可采集", -1)),
						createBaseVNode("span", null, toDisplayString(error.value) + "。请检查主机采集方式、端口与凭据，或确认 Agent 是否已部署并运行。", 1),
						createVNode(_component_ReButton, {
							type: "primary",
							"show-text": true,
							loading: loading.value,
							onClick: _cache[6] || (_cache[6] = ($event) => refreshNow())
						}, {
							default: withCtx(() => [..._cache[47] || (_cache[47] = [createTextVNode("重新连接", -1)])]),
							_: 1
						}, 8, ["loading"])
					], 64)) : (openBlock(), createElementBlock(Fragment, { key: 1 }, [
						_cache[50] || (_cache[50] = createBaseVNode("b", null, "该主机尚未关联监控项", -1)),
						_cache[51] || (_cache[51] = createBaseVNode("span", null, "遥测指标按监控项存储。请到「监控配置」新建监控项并绑定本机，或开启主机采集以获取内置 CPU/内存/磁盘指标。", -1)),
						createVNode(_component_ReButton, {
							type: "primary",
							"show-text": true,
							onClick: _cache[7] || (_cache[7] = ($event) => unref(router).push("/config"))
						}, {
							default: withCtx(() => [..._cache[49] || (_cache[49] = [createTextVNode("去配置监控项", -1)])]),
							_: 1
						})
					], 64))])) : (openBlock(), createElementBlock(Fragment, { key: 1 }, [
						!monitorId.value ? (openBlock(), createElementBlock("div", _hoisted_16, [_cache[53] || (_cache[53] = createBaseVNode("span", null, "当前显示主机内置实时指标（CPU / 内存 / 磁盘 / 磁盘IO / 网络 / 软件）；配置监控项后可获得 JVM 堆与 24h 历史。", -1)), createVNode(_component_ReButton, {
							icon: "Setting",
							link: "",
							"show-text": true,
							onClick: _cache[8] || (_cache[8] = ($event) => unref(router).push("/config"))
						}, {
							default: withCtx(() => [..._cache[52] || (_cache[52] = [createTextVNode("配置监控项", -1)])]),
							_: 1
						})])) : createCommentVNode("", true),
						createBaseVNode("section", _hoisted_17, [
							createBaseVNode("div", { class: normalizeClass(["gauge", {
								hot: heat(cpuPct.value) === 1,
								danger: heat(cpuPct.value) === 2
							}]) }, [
								createBaseVNode("div", _hoisted_18, [(openBlock(), createElementBlock("svg", _hoisted_19, [
									createBaseVNode("g", _hoisted_20, [(openBlock(true), createElementBlock(Fragment, null, renderList(unref(ticks), (t) => {
										return openBlock(), createElementBlock("line", {
											key: t,
											class: normalizeClass({ major: t % 15 === 0 }),
											transform: `rotate(${t * 6} 60 60)`,
											x1: "60",
											y1: "8",
											x2: "60",
											y2: "13"
										}, null, 10, _hoisted_21);
									}), 128))]),
									_cache[54] || (_cache[54] = createBaseVNode("circle", {
										class: "ring-bg",
										cx: "60",
										cy: "60",
										r: "50"
									}, null, -1)),
									createBaseVNode("circle", {
										class: "ring-fg",
										cx: "60",
										cy: "60",
										r: "50",
										style: normalizeStyle(ringStyle(cpuPct.value)),
										transform: "rotate(-90 60 60)"
									}, null, 4)
								])), createBaseVNode("div", _hoisted_22, [createBaseVNode("b", _hoisted_23, toDisplayString(num(cpuPct.value)), 1), _cache[55] || (_cache[55] = createBaseVNode("span", { class: "g-unit" }, "%", -1))])]),
								_cache[56] || (_cache[56] = createBaseVNode("div", { class: "g-label" }, "CPU", -1)),
								createBaseVNode("div", _hoisted_24, toDisplayString(cpu.value?.cores ? cpu.value.cores + " CORE" : "—"), 1)
							], 2),
							createBaseVNode("div", { class: normalizeClass(["gauge", {
								hot: heat(memPct.value) === 1,
								danger: heat(memPct.value) === 2
							}]) }, [
								createBaseVNode("div", _hoisted_25, [(openBlock(), createElementBlock("svg", _hoisted_26, [
									createBaseVNode("g", _hoisted_27, [(openBlock(true), createElementBlock(Fragment, null, renderList(unref(ticks), (t) => {
										return openBlock(), createElementBlock("line", {
											key: t,
											class: normalizeClass({ major: t % 15 === 0 }),
											transform: `rotate(${t * 6} 60 60)`,
											x1: "60",
											y1: "8",
											x2: "60",
											y2: "13"
										}, null, 10, _hoisted_28);
									}), 128))]),
									_cache[57] || (_cache[57] = createBaseVNode("circle", {
										class: "ring-bg",
										cx: "60",
										cy: "60",
										r: "50"
									}, null, -1)),
									createBaseVNode("circle", {
										class: "ring-fg mem",
										cx: "60",
										cy: "60",
										r: "50",
										style: normalizeStyle(ringStyle(memPct.value)),
										transform: "rotate(-90 60 60)"
									}, null, 4)
								])), createBaseVNode("div", _hoisted_29, [createBaseVNode("b", _hoisted_30, toDisplayString(num(memPct.value)), 1), _cache[58] || (_cache[58] = createBaseVNode("span", { class: "g-unit" }, "%", -1))])]),
								_cache[59] || (_cache[59] = createBaseVNode("div", { class: "g-label" }, "内存", -1)),
								createBaseVNode("div", _hoisted_31, toDisplayString(fmt(mem.value?.usage)) + "/" + toDisplayString(fmt(mem.value?.total)), 1)
							], 2),
							createBaseVNode("div", { class: normalizeClass(["gauge", {
								hot: heat(diskPct.value) === 1,
								danger: heat(diskPct.value) === 2
							}]) }, [
								createBaseVNode("div", _hoisted_32, [(openBlock(), createElementBlock("svg", _hoisted_33, [
									createBaseVNode("g", _hoisted_34, [(openBlock(true), createElementBlock(Fragment, null, renderList(unref(ticks), (t) => {
										return openBlock(), createElementBlock("line", {
											key: t,
											class: normalizeClass({ major: t % 15 === 0 }),
											transform: `rotate(${t * 6} 60 60)`,
											x1: "60",
											y1: "8",
											x2: "60",
											y2: "13"
										}, null, 10, _hoisted_35);
									}), 128))]),
									_cache[60] || (_cache[60] = createBaseVNode("circle", {
										class: "ring-bg",
										cx: "60",
										cy: "60",
										r: "50"
									}, null, -1)),
									createBaseVNode("circle", {
										class: "ring-fg disk",
										cx: "60",
										cy: "60",
										r: "50",
										style: normalizeStyle(ringStyle(diskPct.value)),
										transform: "rotate(-90 60 60)"
									}, null, 4)
								])), createBaseVNode("div", _hoisted_36, [createBaseVNode("b", _hoisted_37, toDisplayString(num(diskPct.value)), 1), _cache[61] || (_cache[61] = createBaseVNode("span", { class: "g-unit" }, "%", -1))])]),
								_cache[62] || (_cache[62] = createBaseVNode("div", { class: "g-label" }, "磁盘容量", -1)),
								createBaseVNode("div", _hoisted_38, toDisplayString(disk.value.length) + " MOUNT", 1)
							], 2),
							createBaseVNode("div", _hoisted_39, [
								createBaseVNode("div", _hoisted_40, [(openBlock(), createElementBlock("svg", _hoisted_41, [createBaseVNode("g", _hoisted_42, [(openBlock(true), createElementBlock(Fragment, null, renderList(unref(ticks), (t) => {
									return openBlock(), createElementBlock("line", {
										key: t,
										class: normalizeClass({ major: t % 15 === 0 }),
										transform: `rotate(${t * 6} 60 60)`,
										x1: "60",
										y1: "8",
										x2: "60",
										y2: "13"
									}, null, 10, _hoisted_43);
								}), 128))]), _cache[63] || (_cache[63] = createBaseVNode("circle", {
									class: "ring-bg",
									cx: "60",
									cy: "60",
									r: "50"
								}, null, -1))])), createBaseVNode("div", _hoisted_44, [createBaseVNode("span", _hoisted_45, [_cache[64] || (_cache[64] = createBaseVNode("i", { class: "io-k" }, "R", -1)), createBaseVNode("b", _hoisted_46, toDisplayString(diskRead.value >= 1024 ? (diskRead.value / 1024).toFixed(1) + "M" : diskRead.value.toFixed(0) + "K"), 1)]), createBaseVNode("span", _hoisted_47, [_cache[65] || (_cache[65] = createBaseVNode("i", { class: "io-k" }, "W", -1)), createBaseVNode("b", _hoisted_48, toDisplayString(diskWrite.value >= 1024 ? (diskWrite.value / 1024).toFixed(1) + "M" : diskWrite.value.toFixed(0) + "K"), 1)])])]),
								_cache[66] || (_cache[66] = createBaseVNode("div", { class: "g-label" }, "磁盘 IO", -1)),
								_cache[67] || (_cache[67] = createBaseVNode("div", { class: "g-sub mono" }, "READ / WRITE", -1))
							]),
							createBaseVNode("div", _hoisted_49, [
								createBaseVNode("div", _hoisted_50, [(openBlock(), createElementBlock("svg", _hoisted_51, [createBaseVNode("g", _hoisted_52, [(openBlock(true), createElementBlock(Fragment, null, renderList(unref(ticks), (t) => {
									return openBlock(), createElementBlock("line", {
										key: t,
										class: normalizeClass({ major: t % 15 === 0 }),
										transform: `rotate(${t * 6} 60 60)`,
										x1: "60",
										y1: "8",
										x2: "60",
										y2: "13"
									}, null, 10, _hoisted_53);
								}), 128))]), _cache[68] || (_cache[68] = createBaseVNode("circle", {
									class: "ring-bg",
									cx: "60",
									cy: "60",
									r: "50"
								}, null, -1))])), createBaseVNode("div", _hoisted_54, [createBaseVNode("span", _hoisted_55, [_cache[69] || (_cache[69] = createBaseVNode("i", { class: "rx-arr" }, null, -1)), createBaseVNode("b", _hoisted_56, toDisplayString(fmt(net.value?.rx)), 1)]), createBaseVNode("span", _hoisted_57, [_cache[70] || (_cache[70] = createBaseVNode("i", { class: "tx-arr" }, null, -1)), createBaseVNode("b", _hoisted_58, toDisplayString(fmt(net.value?.tx)), 1)])])]),
								_cache[71] || (_cache[71] = createBaseVNode("div", { class: "g-label" }, "网络", -1)),
								_cache[72] || (_cache[72] = createBaseVNode("div", { class: "g-sub mono" }, "RX / TX", -1))
							]),
							monitorId.value ? (openBlock(), createElementBlock("div", {
								key: 0,
								class: normalizeClass(["gauge", {
									hot: heat(jvmPct.value) === 1,
									danger: heat(jvmPct.value) === 2
								}])
							}, [
								createBaseVNode("div", _hoisted_59, [(openBlock(), createElementBlock("svg", _hoisted_60, [
									createBaseVNode("g", _hoisted_61, [(openBlock(true), createElementBlock(Fragment, null, renderList(unref(ticks), (t) => {
										return openBlock(), createElementBlock("line", {
											key: t,
											class: normalizeClass({ major: t % 15 === 0 }),
											transform: `rotate(${t * 6} 60 60)`,
											x1: "60",
											y1: "8",
											x2: "60",
											y2: "13"
										}, null, 10, _hoisted_62);
									}), 128))]),
									_cache[73] || (_cache[73] = createBaseVNode("circle", {
										class: "ring-bg",
										cx: "60",
										cy: "60",
										r: "50"
									}, null, -1)),
									createBaseVNode("circle", {
										class: "ring-fg jvm",
										cx: "60",
										cy: "60",
										r: "50",
										style: normalizeStyle(ringStyle(jvmPct.value)),
										transform: "rotate(-90 60 60)"
									}, null, 4)
								])), createBaseVNode("div", _hoisted_63, [createBaseVNode("b", _hoisted_64, toDisplayString(jvm.value ? num(jvmPct.value) : "—"), 1), _cache[74] || (_cache[74] = createBaseVNode("span", { class: "g-unit" }, "%", -1))])]),
								_cache[75] || (_cache[75] = createBaseVNode("div", { class: "g-label" }, "JVM", -1)),
								createBaseVNode("div", _hoisted_65, toDisplayString(fmt(jvm.value?.heapUsed)) + "/" + toDisplayString(fmt(jvm.value?.heapMax)), 1)
							], 2)) : createCommentVNode("", true)
						]),
						createBaseVNode("section", _hoisted_66, [
							createBaseVNode("div", {
								class: "trend clickable",
								title: "点击查看 CPU 历史",
								onClick: _cache[9] || (_cache[9] = ($event) => openHistDialog("cpu"))
							}, [
								createBaseVNode("div", _hoisted_67, [createBaseVNode("span", _hoisted_68, "CPU · " + toDisplayString(trendIsRealtime.value ? "近1H" : "24H"), 1), createBaseVNode("span", _hoisted_69, [createBaseVNode("span", _hoisted_70, toDisplayString(trendLast(cpuHist.value)) + "%", 1), _cache[76] || (_cache[76] = createBaseVNode("i", { class: "t-zoom" }, null, -1))])]),
								(openBlock(), createElementBlock("svg", _hoisted_71, [
									_cache[77] || (_cache[77] = createStaticVNode("<defs data-v-775f61a3><linearGradient id=\"tg-cpu\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\" data-v-775f61a3><stop offset=\"0\" stop-color=\"#3b82f6\" stop-opacity=\".30\" data-v-775f61a3></stop><stop offset=\"1\" stop-color=\"#3b82f6\" stop-opacity=\"0\" data-v-775f61a3></stop></linearGradient></defs><g class=\"t-grid\" data-v-775f61a3><line x1=\"0\" y1=\"14\" x2=\"200\" y2=\"14\" data-v-775f61a3></line><line x1=\"0\" y1=\"28\" x2=\"200\" y2=\"28\" data-v-775f61a3></line><line x1=\"0\" y1=\"42\" x2=\"200\" y2=\"42\" data-v-775f61a3></line></g>", 2)),
									createBaseVNode("polygon", {
										class: "t-area",
										points: area(cpuHist.value),
										fill: "url(#tg-cpu)"
									}, null, 8, _hoisted_72),
									createBaseVNode("polyline", {
										class: "t-line cpu",
										points: spark(cpuHist.value)
									}, null, 8, _hoisted_73)
								])),
								createBaseVNode("div", _hoisted_74, [createBaseVNode("span", null, "MIN " + toDisplayString(trendMin(cpuHist.value)), 1), createBaseVNode("span", null, "MAX " + toDisplayString(trendMax(cpuHist.value)), 1)])
							]),
							createBaseVNode("div", {
								class: "trend clickable",
								title: "点击查看内存历史",
								onClick: _cache[10] || (_cache[10] = ($event) => openHistDialog("mem"))
							}, [
								createBaseVNode("div", _hoisted_75, [createBaseVNode("span", _hoisted_76, "内存 · " + toDisplayString(trendIsRealtime.value ? "近1H" : "24H"), 1), createBaseVNode("span", _hoisted_77, [createBaseVNode("span", _hoisted_78, toDisplayString(trendLast(memHist.value)) + "%", 1), _cache[78] || (_cache[78] = createBaseVNode("i", { class: "t-zoom" }, null, -1))])]),
								(openBlock(), createElementBlock("svg", _hoisted_79, [
									_cache[79] || (_cache[79] = createStaticVNode("<defs data-v-775f61a3><linearGradient id=\"tg-mem\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\" data-v-775f61a3><stop offset=\"0\" stop-color=\"#8b5cf6\" stop-opacity=\".30\" data-v-775f61a3></stop><stop offset=\"1\" stop-color=\"#8b5cf6\" stop-opacity=\"0\" data-v-775f61a3></stop></linearGradient></defs><g class=\"t-grid\" data-v-775f61a3><line x1=\"0\" y1=\"14\" x2=\"200\" y2=\"14\" data-v-775f61a3></line><line x1=\"0\" y1=\"28\" x2=\"200\" y2=\"28\" data-v-775f61a3></line><line x1=\"0\" y1=\"42\" x2=\"200\" y2=\"42\" data-v-775f61a3></line></g>", 2)),
									createBaseVNode("polygon", {
										class: "t-area",
										points: area(memHist.value),
										fill: "url(#tg-mem)"
									}, null, 8, _hoisted_80),
									createBaseVNode("polyline", {
										class: "t-line mem",
										points: spark(memHist.value)
									}, null, 8, _hoisted_81)
								])),
								createBaseVNode("div", _hoisted_82, [createBaseVNode("span", null, "MIN " + toDisplayString(trendMin(memHist.value)), 1), createBaseVNode("span", null, "MAX " + toDisplayString(trendMax(memHist.value)), 1)])
							]),
							createBaseVNode("div", {
								class: "trend clickable",
								title: "点击查看磁盘容量历史",
								onClick: _cache[11] || (_cache[11] = ($event) => openHistDialog("disk"))
							}, [
								createBaseVNode("div", _hoisted_83, [_cache[81] || (_cache[81] = createBaseVNode("span", { class: "t-label" }, "磁盘容量 · 近1H", -1)), createBaseVNode("span", _hoisted_84, [createBaseVNode("span", _hoisted_85, toDisplayString(trendLast(diskHist.value)) + "%", 1), _cache[80] || (_cache[80] = createBaseVNode("i", { class: "t-zoom" }, null, -1))])]),
								(openBlock(), createElementBlock("svg", _hoisted_86, [
									_cache[82] || (_cache[82] = createStaticVNode("<defs data-v-775f61a3><linearGradient id=\"tg-disk\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\" data-v-775f61a3><stop offset=\"0\" stop-color=\"#f59e0b\" stop-opacity=\".30\" data-v-775f61a3></stop><stop offset=\"1\" stop-color=\"#f59e0b\" stop-opacity=\"0\" data-v-775f61a3></stop></linearGradient></defs><g class=\"t-grid\" data-v-775f61a3><line x1=\"0\" y1=\"14\" x2=\"200\" y2=\"14\" data-v-775f61a3></line><line x1=\"0\" y1=\"28\" x2=\"200\" y2=\"28\" data-v-775f61a3></line><line x1=\"0\" y1=\"42\" x2=\"200\" y2=\"42\" data-v-775f61a3></line></g>", 2)),
									createBaseVNode("polygon", {
										class: "t-area",
										points: area(diskHist.value),
										fill: "url(#tg-disk)"
									}, null, 8, _hoisted_87),
									createBaseVNode("polyline", {
										class: "t-line disk",
										points: spark(diskHist.value)
									}, null, 8, _hoisted_88)
								])),
								createBaseVNode("div", _hoisted_89, [createBaseVNode("span", null, "MIN " + toDisplayString(trendMin(diskHist.value)), 1), createBaseVNode("span", null, "MAX " + toDisplayString(trendMax(diskHist.value)), 1)])
							]),
							createBaseVNode("div", {
								class: "trend clickable",
								title: "点击查看磁盘读写历史",
								onClick: _cache[12] || (_cache[12] = ($event) => openHistDialog("diskio"))
							}, [
								_cache[86] || (_cache[86] = createBaseVNode("div", { class: "t-head" }, [createBaseVNode("span", { class: "t-label" }, "磁盘 IO · 近1H"), createBaseVNode("span", { class: "t-right" }, [createBaseVNode("i", { class: "t-zoom" })])], -1)),
								(openBlock(), createElementBlock("svg", _hoisted_90, [
									_cache[83] || (_cache[83] = createBaseVNode("g", { class: "t-grid" }, [
										createBaseVNode("line", {
											x1: "0",
											y1: "14",
											x2: "200",
											y2: "14"
										}),
										createBaseVNode("line", {
											x1: "0",
											y1: "28",
											x2: "200",
											y2: "28"
										}),
										createBaseVNode("line", {
											x1: "0",
											y1: "42",
											x2: "200",
											y2: "42"
										})
									], -1)),
									createBaseVNode("polyline", {
										class: "t-line io-r",
										points: ioSpark("read")
									}, null, 8, _hoisted_91),
									createBaseVNode("polyline", {
										class: "t-line io-w",
										points: ioSpark("write")
									}, null, 8, _hoisted_92)
								])),
								createBaseVNode("div", _hoisted_93, [createBaseVNode("span", null, [_cache[84] || (_cache[84] = createBaseVNode("i", { class: "lg-dot r" }, null, -1)), createTextVNode("R " + toDisplayString(ioLastRead.value), 1)]), createBaseVNode("span", null, [_cache[85] || (_cache[85] = createBaseVNode("i", { class: "lg-dot w" }, null, -1)), createTextVNode("W " + toDisplayString(ioLastWrite.value), 1)])])
							]),
							monitorId.value ? (openBlock(), createElementBlock("div", _hoisted_94, [
								createBaseVNode("div", _hoisted_95, [_cache[87] || (_cache[87] = createBaseVNode("span", { class: "t-label" }, "JVM · 24H", -1)), createBaseVNode("span", _hoisted_96, toDisplayString(trendLast(jvmHist.value)) + "%", 1)]),
								(openBlock(), createElementBlock("svg", _hoisted_97, [
									_cache[88] || (_cache[88] = createStaticVNode("<defs data-v-775f61a3><linearGradient id=\"tg-jvm\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\" data-v-775f61a3><stop offset=\"0\" stop-color=\"#14b8a6\" stop-opacity=\".30\" data-v-775f61a3></stop><stop offset=\"1\" stop-color=\"#14b8a6\" stop-opacity=\"0\" data-v-775f61a3></stop></linearGradient></defs><g class=\"t-grid\" data-v-775f61a3><line x1=\"0\" y1=\"14\" x2=\"200\" y2=\"14\" data-v-775f61a3></line><line x1=\"0\" y1=\"28\" x2=\"200\" y2=\"28\" data-v-775f61a3></line><line x1=\"0\" y1=\"42\" x2=\"200\" y2=\"42\" data-v-775f61a3></line></g>", 2)),
									createBaseVNode("polygon", {
										class: "t-area",
										points: area(jvmHist.value),
										fill: "url(#tg-jvm)"
									}, null, 8, _hoisted_98),
									createBaseVNode("polyline", {
										class: "t-line jvm",
										points: spark(jvmHist.value)
									}, null, 8, _hoisted_99)
								])),
								createBaseVNode("div", _hoisted_100, [createBaseVNode("span", null, "MIN " + toDisplayString(trendMin(jvmHist.value)), 1), createBaseVNode("span", null, "MAX " + toDisplayString(trendMax(jvmHist.value)), 1)])
							])) : createCommentVNode("", true),
							createBaseVNode("div", _hoisted_101, [
								createBaseVNode("div", _hoisted_102, [createBaseVNode("span", _hoisted_103, "网络 · " + toDisplayString(trendIsRealtime.value ? "实时" : "24H"), 1), createBaseVNode("span", _hoisted_104, toDisplayString(netLast(netHist.value)), 1)]),
								(openBlock(), createElementBlock("svg", _hoisted_105, [
									_cache[89] || (_cache[89] = createStaticVNode("<defs data-v-775f61a3><linearGradient id=\"tg-net\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\" data-v-775f61a3><stop offset=\"0\" stop-color=\"#06b6d4\" stop-opacity=\".30\" data-v-775f61a3></stop><stop offset=\"1\" stop-color=\"#06b6d4\" stop-opacity=\"0\" data-v-775f61a3></stop></linearGradient></defs><g class=\"t-grid\" data-v-775f61a3><line x1=\"0\" y1=\"14\" x2=\"200\" y2=\"14\" data-v-775f61a3></line><line x1=\"0\" y1=\"28\" x2=\"200\" y2=\"28\" data-v-775f61a3></line><line x1=\"0\" y1=\"42\" x2=\"200\" y2=\"42\" data-v-775f61a3></line></g>", 2)),
									createBaseVNode("polygon", {
										class: "t-area",
										points: area(netHist.value),
										fill: "url(#tg-net)"
									}, null, 8, _hoisted_106),
									createBaseVNode("polyline", {
										class: "t-line net",
										points: spark(netHist.value)
									}, null, 8, _hoisted_107)
								])),
								createBaseVNode("div", _hoisted_108, [createBaseVNode("span", null, "MIN " + toDisplayString(netMin(netHist.value)), 1), createBaseVNode("span", null, "MAX " + toDisplayString(netMax(netHist.value)), 1)])
							])
						]),
						softwareGroups.value.length ? (openBlock(), createElementBlock("section", _hoisted_109, [createBaseVNode("div", _hoisted_110, [_cache[91] || (_cache[91] = createBaseVNode("span", { class: "sp-title" }, "软件实例", -1)), createBaseVNode("div", _hoisted_111, [createBaseVNode("span", _hoisted_112, toDisplayString(softwareInstanceCount.value) + " INSTANCE · " + toDisplayString(softwareTypeCount.value) + " TYPE", 1), createVNode(_component_ReButton, {
							icon: "Setting",
							onClick: openSwSetting
						}, {
							default: withCtx(() => [..._cache[90] || (_cache[90] = [createTextVNode("显示设置", -1)])]),
							_: 1
						})])]), createBaseVNode("div", _hoisted_113, [(openBlock(true), createElementBlock(Fragment, null, renderList(softwareGroups.value, (g, gi) => {
							return openBlock(), createElementBlock("div", {
								key: g.type,
								class: normalizeClass(["sw-card", `is-${swColorRole(gi)}`])
							}, [
								createBaseVNode("div", _hoisted_114, [
									createBaseVNode("div", _hoisted_115, toDisplayString(swMonogram(g)), 1),
									createBaseVNode("div", _hoisted_116, [createBaseVNode("div", _hoisted_117, [createBaseVNode("span", _hoisted_118, toDisplayString(g.label), 1), g.count > 1 ? (openBlock(), createElementBlock("span", _hoisted_119, "×" + toDisplayString(g.count), 1)) : createCommentVNode("", true)]), createBaseVNode("div", _hoisted_120, [(openBlock(true), createElementBlock(Fragment, null, renderList(swCardPids(g).pids, (p) => {
										return openBlock(), createElementBlock("span", {
											key: p,
											class: "sw-pid mono"
										}, "PID " + toDisplayString(p), 1);
									}), 128)), swCardPids(g).rest ? (openBlock(), createElementBlock("span", _hoisted_121, "+" + toDisplayString(swCardPids(g).rest), 1)) : createCommentVNode("", true)])]),
									createVNode(_component_ReButton, {
										class: "sw-detail-btn",
										icon: "View",
										onClick: ($event) => openSwDetail(g)
									}, {
										default: withCtx(() => [..._cache[92] || (_cache[92] = [createTextVNode("详情", -1)])]),
										_: 1
									}, 8, ["onClick"])
								]),
								createBaseVNode("div", _hoisted_122, [
									createBaseVNode("div", _hoisted_123, [_cache[93] || (_cache[93] = createBaseVNode("span", { class: "sw-k" }, "CPU", -1)), createBaseVNode("span", _hoisted_124, toDisplayString(g.totalCpu.toFixed(1)) + "%", 1)]),
									createBaseVNode("div", _hoisted_125, [_cache[94] || (_cache[94] = createBaseVNode("span", { class: "sw-k" }, "MEM", -1)), createBaseVNode("span", _hoisted_126, toDisplayString(g.totalMem.toFixed(0)) + "M", 1)]),
									createBaseVNode("div", _hoisted_127, [_cache[95] || (_cache[95] = createBaseVNode("span", { class: "sw-k" }, "UP", -1)), createBaseVNode("span", _hoisted_128, toDisplayString(fmtUptime(g.maxUptime)), 1)])
								]),
								g.count > 1 ? (openBlock(), createElementBlock("div", _hoisted_129, [(openBlock(true), createElementBlock(Fragment, null, renderList(g.instances.slice(0, 5), (x) => {
									return openBlock(), createElementBlock("div", {
										key: x.pid,
										class: "sw-bar-row"
									}, [
										createBaseVNode("span", _hoisted_130, toDisplayString(x.pid), 1),
										createBaseVNode("span", _hoisted_131, [createBaseVNode("span", {
											class: "sw-bar-fill",
											style: normalizeStyle({ width: swBarWidth(g, x.cpu) + "%" })
										}, null, 4)]),
										createBaseVNode("span", _hoisted_132, toDisplayString(numOr0(x.cpu).toFixed(1)), 1)
									]);
								}), 128)), g.instances.length > 5 ? (openBlock(), createElementBlock("div", _hoisted_133, "其余 " + toDisplayString(g.instances.length - 5) + " 个实例见详情", 1)) : createCommentVNode("", true)])) : (openBlock(), createElementBlock("div", _hoisted_134, [g.ports.length ? (openBlock(), createElementBlock("span", _hoisted_135, "端口 :" + toDisplayString(g.ports.join(" / :")), 1)) : createCommentVNode("", true), createBaseVNode("span", {
									class: "sw-cmd mono",
									title: g.instances[0].cmd
								}, toDisplayString(g.instances[0].cmd), 9, _hoisted_136)]))
							], 2);
						}), 128))])])) : createCommentVNode("", true),
						createBaseVNode("section", _hoisted_137, [
							createBaseVNode("div", _hoisted_138, [_cache[96] || (_cache[96] = createBaseVNode("span", { class: "pp-title" }, "画像分区", -1)), createBaseVNode("div", _hoisted_139, [(openBlock(), createElementBlock(Fragment, null, renderList(PROFILE_SECTIONS, (s) => {
								return createBaseVNode("button", {
									key: s.name,
									class: normalizeClass(["pp-tab", { on: profileTab.value === s.name }]),
									onClick: ($event) => pickProfileTab(s.name)
								}, toDisplayString(s.label), 11, _hoisted_140);
							}), 64))])]),
							createBaseVNode("div", _hoisted_141, [profileTab.value !== "network" ? (openBlock(), createElementBlock("span", _hoisted_142, toDisplayString(profileKeyword.value.trim() ? `命中 ${profileVisibleRows.value.length} 条` : `共 ${profileVisibleRows.value.length} 条`), 1)) : (openBlock(), createElementBlock("span", _hoisted_143, "Windows 网络连接视图")), createBaseVNode("div", _hoisted_144, [
								profileTab.value !== "network" ? (openBlock(), createBlock(_component_ReInput, {
									key: 0,
									modelValue: profileKeyword.value,
									"onUpdate:modelValue": _cache[13] || (_cache[13] = ($event) => profileKeyword.value = $event),
									class: "pp-search",
									placeholder: "关键字过滤",
									clearable: "",
									onKeyup: withKeys(applyProfileKeyword, ["enter"]),
									onClear: applyProfileKeyword
								}, null, 8, ["modelValue"])) : createCommentVNode("", true),
								profilePaged.value ? (openBlock(), createElementBlock(Fragment, { key: 1 }, [
									createVNode(_component_ReButton, { onClick: applyProfileKeyword }, {
										default: withCtx(() => [..._cache[97] || (_cache[97] = [createTextVNode("搜索", -1)])]),
										_: 1
									}),
									createVNode(_component_ReButton, {
										disabled: profilePage.value <= 1 || profileLoading.value,
										onClick: _cache[14] || (_cache[14] = ($event) => changeProfilePage(-1))
									}, {
										default: withCtx(() => [..._cache[98] || (_cache[98] = [createTextVNode("上一页", -1)])]),
										_: 1
									}, 8, ["disabled"]),
									createBaseVNode("span", _hoisted_145, toDisplayString(profilePage.value), 1),
									createVNode(_component_ReButton, {
										disabled: profileLoading.value || profileRows.value.length < profilePageSize.value,
										onClick: _cache[15] || (_cache[15] = ($event) => changeProfilePage(1))
									}, {
										default: withCtx(() => [..._cache[99] || (_cache[99] = [createTextVNode("下一页", -1)])]),
										_: 1
									}, 8, ["disabled"])
								], 64)) : createCommentVNode("", true),
								profileTab.value === "env" ? (openBlock(), createBlock(_component_ReButton, {
									key: 2,
									type: "primary",
									icon: "Plus",
									onClick: _cache[16] || (_cache[16] = ($event) => profileEnvDialog.value = true)
								}, {
									default: withCtx(() => [..._cache[100] || (_cache[100] = [createTextVNode("新增变量", -1)])]),
									_: 1
								})) : createCommentVNode("", true),
								createVNode(_component_ReButton, {
									type: "primary",
									icon: "Refresh",
									loading: profileLoading.value,
									onClick: loadProfileSection
								}, {
									default: withCtx(() => [..._cache[101] || (_cache[101] = [createTextVNode("刷新", -1)])]),
									_: 1
								}, 8, ["loading"])
							])]),
							profileError.value ? (openBlock(), createElementBlock("div", _hoisted_146, toDisplayString(profileError.value), 1)) : profileTab.value === "network" ? (openBlock(), createElementBlock("div", _hoisted_147, [createVNode(HostNetworkAdapters_default, {
								"host-id": hostId.value,
								rows: profileRows.value,
								platform: hostRecord.value?.serverHostOsType,
								onApplied: loadProfileSection
							}, null, 8, [
								"host-id",
								"rows",
								"platform"
							])])) : profileLoading.value && !profileRows.value.length ? (openBlock(), createElementBlock("div", _hoisted_148, "正在拉取…")) : !profileVisibleRows.value.length ? (openBlock(), createElementBlock("div", _hoisted_149, toDisplayString(profileKeyword.value.trim() ? "关键字未命中任何一行" : "该分区无数据"), 1)) : (openBlock(), createElementBlock("div", _hoisted_150, [createBaseVNode("table", _hoisted_151, [createBaseVNode("thead", null, [createBaseVNode("tr", null, [(openBlock(true), createElementBlock(Fragment, null, renderList(PROFILE_COLUMNS[profileTab.value], (col) => {
								return openBlock(), createElementBlock("th", {
									key: col.key,
									class: normalizeClass({
										sortable: col.sortable,
										"sort-on": profileSortKey.value === col.key
									}),
									onClick: ($event) => col.sortable && toggleProfileSort(col.key)
								}, toDisplayString(col.label), 11, _hoisted_152);
							}), 128)), profileTab.value === "ports" || profileTab.value === "processes" || profileTab.value === "services" || profileTab.value === "env" ? (openBlock(), createElementBlock("th", _hoisted_153, "操作")) : createCommentVNode("", true)])]), createBaseVNode("tbody", null, [(openBlock(true), createElementBlock(Fragment, null, renderList(profileVisibleRows.value, (r, idx) => {
								return openBlock(), createElementBlock("tr", { key: idx }, [(openBlock(true), createElementBlock(Fragment, null, renderList(PROFILE_COLUMNS[profileTab.value], (col) => {
									return openBlock(), createElementBlock("td", {
										key: col.key,
										class: "mono"
									}, toDisplayString(r[col.key] ?? "—"), 1);
								}), 128)), profileTab.value === "processes" ? (openBlock(), createElementBlock("td", _hoisted_154, [createVNode(_component_ReButton, {
									icon: "RefreshRight",
									loading: profileBusyRow.value === `restart-${r.pid}`,
									disabled: !Number(r.pid),
									onClick: ($event) => confirmProfileAction(`确定重启进程 ${r.name ?? ""}（PID ${r.pid}）？`).then((ok) => ok && runProfileAction(`restart-${r.pid}`, unref(restartHostProcess)(Number(r.pid), hostId.value)))
								}, {
									default: withCtx(() => [..._cache[102] || (_cache[102] = [createTextVNode("重启", -1)])]),
									_: 1
								}, 8, [
									"loading",
									"disabled",
									"onClick"
								]), createVNode(_component_ReButton, {
									icon: "CircleClose",
									type: "danger",
									loading: profileBusyRow.value === `kill-${r.pid}`,
									disabled: !Number(r.pid),
									onClick: ($event) => confirmProfileAction(`确定结束进程 ${r.name ?? ""}（PID ${r.pid}）？该操作不可恢复。`).then((ok) => ok && runProfileAction(`kill-${r.pid}`, unref(killProcess)(Number(r.pid), hostId.value)))
								}, {
									default: withCtx(() => [..._cache[103] || (_cache[103] = [createTextVNode("结束", -1)])]),
									_: 1
								}, 8, [
									"loading",
									"disabled",
									"onClick"
								])])) : profileTab.value === "services" ? (openBlock(), createElementBlock("td", _hoisted_155, [
									createVNode(_component_ReButton, {
										icon: "VideoPlay",
										type: "primary",
										loading: profileBusyRow.value === `service-start-${r.name}`,
										onClick: ($event) => runProfileAction(`service-start-${r.name}`, unref(startService)(String(r.name), hostId.value))
									}, {
										default: withCtx(() => [..._cache[104] || (_cache[104] = [createTextVNode("启动", -1)])]),
										_: 1
									}, 8, ["loading", "onClick"]),
									createVNode(_component_ReButton, {
										icon: "VideoPause",
										type: "danger",
										loading: profileBusyRow.value === `service-stop-${r.name}`,
										onClick: ($event) => confirmProfileAction(`确定停止服务 ${r.displayName || r.name}？`).then((ok) => ok && runProfileAction(`service-stop-${r.name}`, unref(stopService)(String(r.name), hostId.value)))
									}, {
										default: withCtx(() => [..._cache[105] || (_cache[105] = [createTextVNode("停止", -1)])]),
										_: 1
									}, 8, ["loading", "onClick"]),
									createVNode(_component_ReButton, {
										icon: "RefreshRight",
										loading: profileBusyRow.value === `service-restart-${r.name}`,
										onClick: ($event) => confirmProfileAction(`确定重启服务 ${r.displayName || r.name}？`).then((ok) => ok && runProfileAction(`service-restart-${r.name}`, unref(restartService)(String(r.name), hostId.value)))
									}, {
										default: withCtx(() => [..._cache[106] || (_cache[106] = [createTextVNode("重启", -1)])]),
										_: 1
									}, 8, ["loading", "onClick"])
								])) : profileTab.value === "ports" ? (openBlock(), createElementBlock("td", _hoisted_156, [createVNode(_component_ReButton, {
									icon: "CircleClose",
									type: "danger",
									loading: profileBusyRow.value === `netproc-${r.pid}-${r.port}`,
									disabled: !Number(r.pid),
									onClick: ($event) => confirmProfileAction(`确定结束 PID ${r.pid}？它正占用 ${r.protocol ?? ""} ${r.port}。`).then((ok) => ok && runProfileAction(`netproc-${r.pid}-${r.port}`, unref(closeNetProcess)(Number(r.pid), Number(r.port) || void 0, hostId.value)))
								}, {
									default: withCtx(() => [..._cache[107] || (_cache[107] = [createTextVNode("结束", -1)])]),
									_: 1
								}, 8, [
									"loading",
									"disabled",
									"onClick"
								])])) : profileTab.value === "env" ? (openBlock(), createElementBlock("td", _hoisted_157, [createVNode(_component_ReButton, {
									icon: "Delete",
									type: "danger",
									loading: profileBusyRow.value === `env-del-${r.name}`,
									onClick: ($event) => confirmProfileAction(`确定删除系统级环境变量 ${r.name}？`).then((ok) => ok && runProfileAction(`env-del-${r.name}`, unref(deleteHostEnvVar)(hostId.value, String(r.name))))
								}, {
									default: withCtx(() => [..._cache[108] || (_cache[108] = [createTextVNode("删除", -1)])]),
									_: 1
								}, 8, ["loading", "onClick"])])) : createCommentVNode("", true)]);
							}), 128))])])]))
						]),
						createBaseVNode("section", _hoisted_158, [createBaseVNode("div", _hoisted_159, [_cache[109] || (_cache[109] = createBaseVNode("span", { class: "dp-title" }, "磁盘驱动器", -1)), createBaseVNode("span", _hoisted_160, toDisplayString(disk.value.length) + " DEVICE", 1)]), createBaseVNode("div", _hoisted_161, [(openBlock(true), createElementBlock(Fragment, null, renderList(disk.value, (r, i) => {
							return openBlock(), createElementBlock("div", {
								key: i,
								class: normalizeClass(["drive-tile", { low: diskLow(r) }])
							}, [_cache[110] || (_cache[110] = createStaticVNode("<svg class=\"drive-ico\" viewBox=\"0 0 48 48\" aria-hidden=\"true\" data-v-775f61a3><path class=\"di-body\" d=\"M6 16 h36 a3 3 0 0 1 3 3 v14 a3 3 0 0 1-3 3 H6 a3 3 0 0 1-3-3 V19 a3 3 0 0 1 3-3 z\" data-v-775f61a3></path><rect class=\"di-slot\" x=\"9\" y=\"20\" width=\"22\" height=\"4\" rx=\"1.5\" data-v-775f61a3></rect><circle class=\"di-led\" cx=\"39\" cy=\"22\" r=\"2.2\" data-v-775f61a3></circle><rect class=\"di-base\" x=\"9\" y=\"29\" width=\"30\" height=\"3\" rx=\"1.5\" data-v-775f61a3></rect></svg>", 1)), createBaseVNode("div", _hoisted_162, [
								createBaseVNode("div", {
									class: "drive-name",
									title: r.mount || ""
								}, toDisplayString(r.mount || "—"), 9, _hoisted_163),
								createBaseVNode("div", _hoisted_164, [createBaseVNode("div", {
									class: "drive-fill",
									style: normalizeStyle({ width: diskUsageWidth(r) })
								}, null, 4)]),
								createBaseVNode("div", _hoisted_165, toDisplayString(diskCapacityText(r)), 1)
							])], 2);
						}), 128)), disk.value.length === 0 ? (openBlock(), createElementBlock("div", _hoisted_166, "暂无磁盘数据")) : createCommentVNode("", true)])])
					], 64))
				]),
				createVNode(_component_ReDialog, {
					modelValue: aiDialogVisible.value,
					"onUpdate:modelValue": _cache[20] || (_cache[20] = ($event) => aiDialogVisible.value = $event),
					title: "AI 主机指标智能分析",
					width: "700px"
				}, {
					footer: withCtx(() => [createVNode(_component_ReButton, { onClick: _cache[19] || (_cache[19] = ($event) => aiDialogVisible.value = false) }, {
						default: withCtx(() => [..._cache[119] || (_cache[119] = [createTextVNode("关闭", -1)])]),
						_: 1
					})]),
					default: withCtx(() => [createBaseVNode("div", _hoisted_167, [
						_cache[112] || (_cache[112] = createBaseVNode("span", { class: "ai-bar-k" }, "分析重点", -1)),
						createVNode(_component_ReSelect, {
							modelValue: aiDimension.value,
							"onUpdate:modelValue": _cache[17] || (_cache[17] = ($event) => aiDimension.value = $event),
							class: "ai-bar-sel",
							options: AI_DIMENSIONS
						}, null, 8, ["modelValue"]),
						createVNode(_component_ReButton, {
							type: "primary",
							"show-text": true,
							loading: aiLoading.value,
							onClick: requestAnalysis
						}, {
							default: withCtx(() => [createTextVNode(toDisplayString(aiResult.value || aiError.value ? "重新分析" : "开始分析"), 1)]),
							_: 1
						}, 8, ["loading"]),
						_cache[113] || (_cache[113] = createBaseVNode("span", { class: "ai-bar-hint" }, "指标快照与趋势由后端按主机取数，前端不回传", -1))
					]), !aiEnabled.value ? (openBlock(), createElementBlock("div", _hoisted_168, [
						_cache[115] || (_cache[115] = createBaseVNode("b", null, "AI 分析未启用", -1)),
						_cache[116] || (_cache[116] = createBaseVNode("span", null, "未检测到可用的模型配置，请先到「系统配置 → AI 设置」接入模型后再试。", -1)),
						createVNode(_component_ReButton, {
							"show-text": true,
							onClick: _cache[18] || (_cache[18] = ($event) => unref(router).push("/system-config"))
						}, {
							default: withCtx(() => [..._cache[114] || (_cache[114] = [createTextVNode("前往配置", -1)])]),
							_: 1
						})
					])) : aiLoading.value ? (openBlock(), createElementBlock("div", _hoisted_169, [createVNode(_component_el_icon, { class: "is-loading ai-spin" }, {
						default: withCtx(() => [createVNode(unref(loading_default))]),
						_: 1
					}), createBaseVNode("span", null, "AI 正在分析主机 " + toDisplayString(hostName.value || `#${hostId.value}`) + " 的指标，请稍候…", 1)])) : aiError.value ? (openBlock(), createElementBlock("div", _hoisted_170, [_cache[117] || (_cache[117] = createBaseVNode("b", null, "分析失败", -1)), createBaseVNode("span", null, toDisplayString(aiError.value), 1)])) : aiResult.value ? (openBlock(), createElementBlock("div", _hoisted_171, [createBaseVNode("pre", _hoisted_172, toDisplayString(aiResult.value), 1), createBaseVNode("div", _hoisted_173, [createBaseVNode("span", null, "模型：" + toDisplayString(aiUsedModel.value || aiModel.value || "默认模型"), 1), createBaseVNode("span", null, "对象：" + toDisplayString(hostName.value || `#${hostId.value}`) + "（监控项 #" + toDisplayString(monitorId.value) + "）", 1)])])) : (openBlock(), createElementBlock("div", _hoisted_174, [..._cache[118] || (_cache[118] = [createBaseVNode("span", null, "点击上方「开始分析」生成主机指标诊断结论。", -1)])]))]),
					_: 1
				}, 8, ["modelValue"]),
				createVNode(_component_ReDialog, {
					modelValue: histDialogVisible.value,
					"onUpdate:modelValue": _cache[21] || (_cache[21] = ($event) => histDialogVisible.value = $event),
					title: histTitle.value,
					width: "860px"
				}, {
					default: withCtx(() => [
						createBaseVNode("div", _hoisted_175, [createVNode(_component_ReSelect, {
							"model-value": histHours.value,
							class: "hist-sel",
							options: histRangeOptions,
							onChange: onHistHoursChange
						}, null, 8, ["model-value"]), _cache[120] || (_cache[120] = createBaseVNode("span", { class: "hist-hint" }, "数据来自主机采集历史，按主机维度持久化，口径与外侧卡片一致", -1))]),
						histLoading.value ? (openBlock(), createElementBlock("div", _hoisted_176, [createVNode(_component_el_icon, { class: "is-loading" }, {
							default: withCtx(() => [createVNode(unref(loading_default))]),
							_: 1
						}), _cache[121] || (_cache[121] = createBaseVNode("span", null, "正在加载历史数据…", -1))])) : !histSeries.value.length && !(histIoRead.value.length || histIoWrite.value.length) ? (openBlock(), createElementBlock("div", _hoisted_177, [..._cache[122] || (_cache[122] = [createBaseVNode("span", null, "该时间段内暂无历史数据，请确认主机已开启自动采集。", -1)])])) : createCommentVNode("", true),
						createBaseVNode("div", {
							ref_key: "histChartRef",
							ref: histChartRef,
							class: "hist-canvas"
						}, null, 512)
					]),
					_: 1
				}, 8, ["modelValue", "title"]),
				createVNode(_component_ReDialog, {
					modelValue: swSettingVisible.value,
					"onUpdate:modelValue": _cache[25] || (_cache[25] = ($event) => swSettingVisible.value = $event),
					title: "软件实例显示设置",
					width: "580px"
				}, {
					footer: withCtx(() => [createVNode(_component_ReButton, { onClick: _cache[24] || (_cache[24] = ($event) => swSettingVisible.value = false) }, {
						default: withCtx(() => [..._cache[126] || (_cache[126] = [createTextVNode("取消", -1)])]),
						_: 1
					}), createVNode(_component_ReButton, {
						type: "primary",
						loading: swSettingSaving.value,
						onClick: saveSwSetting
					}, {
						default: withCtx(() => [..._cache[127] || (_cache[127] = [createTextVNode("保存", -1)])]),
						_: 1
					}, 8, ["loading"])]),
					default: withCtx(() => [createBaseVNode("div", _hoisted_178, [
						createVNode(_component_ReButton, { onClick: _cache[22] || (_cache[22] = ($event) => swSettingAll(true)) }, {
							default: withCtx(() => [..._cache[123] || (_cache[123] = [createTextVNode("全选", -1)])]),
							_: 1
						}),
						createVNode(_component_ReButton, { onClick: _cache[23] || (_cache[23] = ($event) => swSettingAll(false)) }, {
							default: withCtx(() => [..._cache[124] || (_cache[124] = [createTextVNode("全不选", -1)])]),
							_: 1
						}),
						_cache[125] || (_cache[125] = createBaseVNode("span", { class: "swset-hint" }, "仅勾选的软件类型会在主机详情中展示，对所有主机生效并持久化。", -1))
					]), createBaseVNode("div", _hoisted_179, [(openBlock(true), createElementBlock(Fragment, null, renderList(swSettingTypes.value, (t) => {
						return openBlock(), createElementBlock("label", {
							key: t,
							class: "swset-item"
						}, [
							createVNode(_component_el_checkbox, {
								"model-value": swSettingChecked(t),
								onChange: ($event) => swSettingToggle(t)
							}, null, 8, ["model-value", "onChange"]),
							createBaseVNode("span", _hoisted_180, toDisplayString(swLabel(t)), 1),
							createBaseVNode("span", _hoisted_181, toDisplayString(t), 1)
						]);
					}), 128))])]),
					_: 1
				}, 8, ["modelValue"]),
				createVNode(_component_ReDialog, {
					modelValue: swDetailVisible.value,
					"onUpdate:modelValue": _cache[27] || (_cache[27] = ($event) => swDetailVisible.value = $event),
					title: `${swDetailGroup.value?.label ?? ""} · 实例明细`,
					width: "800px"
				}, {
					footer: withCtx(() => [createVNode(_component_ReButton, {
						type: "primary",
						onClick: _cache[26] || (_cache[26] = ($event) => swDetailVisible.value = false)
					}, {
						default: withCtx(() => [..._cache[129] || (_cache[129] = [createTextVNode("关闭", -1)])]),
						_: 1
					})]),
					default: withCtx(() => [swDetailGroup.value ? (openBlock(), createElementBlock("div", _hoisted_182, [createBaseVNode("div", {
						ref_key: "swDetailChartRef",
						ref: swDetailChartRef,
						class: "swdet-chart"
					}, null, 512), createBaseVNode("table", _hoisted_183, [_cache[128] || (_cache[128] = createBaseVNode("thead", null, [createBaseVNode("tr", null, [
						createBaseVNode("th", null, "PID"),
						createBaseVNode("th", null, "端口"),
						createBaseVNode("th", null, "CPU %"),
						createBaseVNode("th", null, "内存 M"),
						createBaseVNode("th", null, "运行时长"),
						createBaseVNode("th", null, "命令行")
					])], -1)), createBaseVNode("tbody", null, [(openBlock(true), createElementBlock(Fragment, null, renderList(swDetailGroup.value.instances, (x) => {
						return openBlock(), createElementBlock("tr", { key: x.pid }, [
							createBaseVNode("td", _hoisted_184, toDisplayString(x.pid), 1),
							createBaseVNode("td", _hoisted_185, toDisplayString(x.port || "—"), 1),
							createBaseVNode("td", _hoisted_186, toDisplayString(numOr0(x.cpu).toFixed(1)), 1),
							createBaseVNode("td", _hoisted_187, toDisplayString(numOr0(x.memMb).toFixed(0)), 1),
							createBaseVNode("td", _hoisted_188, toDisplayString(fmtUptime(x.uptimeSec)), 1),
							createBaseVNode("td", {
								class: "swdet-cmd mono",
								title: x.cmd
							}, toDisplayString(x.cmd), 9, _hoisted_189)
						]);
					}), 128))])])])) : createCommentVNode("", true)]),
					_: 1
				}, 8, ["modelValue", "title"]),
				createVNode(_component_ReDialog, {
					modelValue: profileEnvDialog.value,
					"onUpdate:modelValue": _cache[31] || (_cache[31] = ($event) => profileEnvDialog.value = $event),
					title: "新增系统级环境变量",
					width: "520px"
				}, {
					footer: withCtx(() => [createVNode(_component_ReButton, { onClick: _cache[30] || (_cache[30] = ($event) => profileEnvDialog.value = false) }, {
						default: withCtx(() => [..._cache[132] || (_cache[132] = [createTextVNode("取消", -1)])]),
						_: 1
					}), createVNode(_component_ReButton, {
						type: "primary",
						loading: profileBusyRow.value.startsWith("env-set"),
						onClick: submitProfileEnv
					}, {
						default: withCtx(() => [..._cache[133] || (_cache[133] = [createTextVNode("保存", -1)])]),
						_: 1
					}, 8, ["loading"])]),
					default: withCtx(() => [createBaseVNode("div", _hoisted_190, [
						_cache[130] || (_cache[130] = createBaseVNode("label", { class: "sub-label" }, "变量名", -1)),
						createVNode(_component_el_input, {
							modelValue: profileEnvForm.value.name,
							"onUpdate:modelValue": _cache[28] || (_cache[28] = ($event) => profileEnvForm.value.name = $event),
							placeholder: "如 JAVA_HOME，字母/数字/下划线",
							spellcheck: "false"
						}, null, 8, ["modelValue"]),
						_cache[131] || (_cache[131] = createBaseVNode("label", { class: "sub-label" }, "变量值", -1)),
						createVNode(_component_el_input, {
							modelValue: profileEnvForm.value.value,
							"onUpdate:modelValue": _cache[29] || (_cache[29] = ($event) => profileEnvForm.value.value = $event),
							type: "textarea",
							rows: 4,
							placeholder: "系统级持久化：Windows 写入 Machine，Linux 写入 /etc/environment",
							spellcheck: "false"
						}, null, 8, ["modelValue"])
					])]),
					_: 1
				}, 8, ["modelValue"])
			]);
		};
	}
}), [["__scopeId", "data-v-775f61a3"]]);
//#endregion
export { HostDetailView_default as default };
