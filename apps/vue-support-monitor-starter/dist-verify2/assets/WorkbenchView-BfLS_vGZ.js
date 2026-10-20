import { $n as normalizeClass, D as createVNode, E as createTextVNode, On as unref, St as resolveComponent, _ as createBaseVNode, b as createElementBlock, bt as renderList, ct as onMounted, g as computed, it as onBeforeUnmount, k as defineComponent, mt as openBlock, nr as normalizeStyle, o as Fragment, qt as withCtx, rr as toDisplayString, vn as ref, y as createCommentVNode } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { y as useSocketService } from "./src-CEonioA3.js";
import { a as useRouter } from "./vue-router-D43uXGPs.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { n as alarmLevel, p as fetchAlarmEvents, w as isUnhandled } from "./monitorApi-CwY9j0MY.js";
import { k as queryHosts } from "./api-CRz4q4qT.js";
//#region src/views/WorkbenchView.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1 = { class: "tel-page" };
var _hoisted_2 = { class: "page-header" };
var _hoisted_3 = { class: "page-desc" };
var _hoisted_4 = { class: "live-clock" };
var _hoisted_5 = { class: "page-actions" };
var _hoisted_6 = {
	key: 0,
	class: "as-error"
};
var _hoisted_7 = { class: "kpi-row cols-5" };
var _hoisted_8 = { class: "kpi-health-card" };
var _hoisted_9 = { class: "kpi-health-ring" };
var _hoisted_10 = {
	viewBox: "0 0 44 44",
	class: "kpi-health-svg"
};
var _hoisted_11 = ["stroke", "stroke-dasharray"];
var _hoisted_12 = { class: "kpi-health-score" };
var _hoisted_13 = { class: "kpi-health-desc" };
var _hoisted_14 = { class: "kpi-big" };
var _hoisted_15 = { class: "kpi-big" };
var _hoisted_16 = { class: "kpi-big" };
var _hoisted_17 = { class: "kpi-big" };
var _hoisted_18 = { class: "cols-2-equal-responsive" };
var _hoisted_19 = { class: "card" };
var _hoisted_20 = { class: "donut-wrap" };
var _hoisted_21 = { class: "donut-center" };
var _hoisted_22 = { class: "donut-value" };
var _hoisted_23 = { class: "donut-legend" };
var _hoisted_24 = { class: "legend-item" };
var _hoisted_25 = { class: "legend-label" };
var _hoisted_26 = { class: "card" };
var _hoisted_27 = {
	key: 0,
	class: "empty-state"
};
var _hoisted_28 = {
	key: 1,
	class: "t"
};
var _hoisted_29 = { class: "td-sev" };
var _hoisted_30 = { class: "truncate" };
var _hoisted_31 = { class: "mono dim" };
var _hoisted_32 = {
	key: 2,
	class: "see-all"
};
var _hoisted_33 = { class: "card" };
//#endregion
//#region src/views/WorkbenchView.vue
var WorkbenchView_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	__name: "WorkbenchView",
	setup(__props) {
		/**
		* 监控概览（工作台）—— 对齐 prototype §PAGE-1
		* KPI（ReStatCard + ReCountup + ReSkeleton）+ Donut + 最近告警 + 快捷入口
		* 全部按钮统一 ReButton；.kpi 色条类保留（pages.css 左侧色条 + e2e 定位）
		* @author CH
		* @since 4.0.0
		*/
		const router = useRouter();
		const socket = useSocketService();
		const loading = ref(false);
		const loadError = ref("");
		/** 资产口径改为主机台账（而非监控项），初始 HTTP 拉取后由 socket 实时更新，不做轮询 */
		const hosts = ref([]);
		const events = ref([]);
		ref("");
		const LEVELS = [
			"P0",
			"P1",
			"P2",
			"P3",
			"P4"
		];
		const LEVEL_COLORS = {
			P0: "var(--sev-p0-text)",
			P1: "var(--sev-p1-text)",
			P2: "var(--sev-p2-text)",
			P3: "var(--sev-p3-text)",
			P4: "var(--sev-p4-text)"
		};
		const LEVEL_LABELS = {
			P0: "严重",
			P1: "高",
			P2: "中",
			P3: "低",
			P4: "信息"
		};
		const enabledCount = computed(() => hosts.value.filter((h) => Number(h.serverHostStatus) !== 0).length);
		const onlineCount = computed(() => hosts.value.filter((h) => Number(h.serverHostOnline) === 1).length);
		const unhandledCount = computed(() => events.value.filter(isUnhandled).length);
		const totalAlarms = computed(() => events.value.length);
		const levelCounts = computed(() => {
			const m = {
				P0: 0,
				P1: 0,
				P2: 0,
				P3: 0,
				P4: 0
			};
			for (const e of events.value) m[alarmLevel(e)]++;
			return m;
		});
		const donutStyle = computed(() => {
			const total = totalAlarms.value;
			if (total === 0) return { background: "var(--border-subtle)" };
			let acc = 0;
			const stops = [];
			for (const lv of LEVELS) {
				const n = levelCounts.value[lv];
				if (!n) continue;
				const from = acc / total * 360;
				acc += n;
				stops.push(`${LEVEL_COLORS[lv]} ${from}deg ${acc / total * 360}deg`);
			}
			return { background: `conic-gradient(${stops.join(", ")})` };
		});
		const recentAlarms = computed(() => [...events.value].sort((a, b) => (b.msMonitorAlarmEventTriggerTime ?? "").localeCompare(a.msMonitorAlarmEventTriggerTime ?? "")).slice(0, 5));
		/** 健康度：100 - (P0×10 + P1×5 + P2×2 + P3×0.5 + P4×0) / max(hosts.length×10, 1) */
		const healthScore = computed(() => {
			const n = hosts.value.length || 1;
			const penalty = levelCounts.value.P0 * 10 + levelCounts.value.P1 * 5 + levelCounts.value.P2 * 2 + levelCounts.value.P3 * .5;
			return Math.max(0, Math.min(100, Math.round(100 - penalty / (n * 10) * 100)));
		});
		const healthColor = computed(() => {
			const s = healthScore.value;
			if (s >= 80) return "var(--status-online)";
			if (s >= 60) return "var(--status-warn-text)";
			return "var(--status-error-text)";
		});
		computed(() => {
			const total = totalAlarms.value;
			const n = hosts.value.length || 1;
			return Math.min(100, Math.round(total / Math.max(n * 5, 1) * 20));
		});
		/** 写入最近更新时钟（实时） */
		const now = ref(/* @__PURE__ */ new Date());
		let clockTimer = null;
		function startClock() {
			clockTimer = setInterval(() => {
				now.value = /* @__PURE__ */ new Date();
			}, 1e3);
		}
		function fmtClock(d) {
			return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`;
		}
		const liveTime = computed(() => fmtClock(now.value));
		async function fetchAll(silent = false) {
			if (!silent) loading.value = true;
			loadError.value = "";
			try {
				const [hs, ev] = await Promise.all([queryHosts({}), fetchAlarmEvents()]);
				hosts.value = hs ?? [];
				events.value = ev ?? [];
				stampClock();
			} catch (e) {
				loadError.value = String(e?.message ?? e);
			} finally {
				if (!silent) loading.value = false;
			}
		}
		let unsubOnline;
		let unsubMetrics;
		let unsubAlarm;
		function bindSocket() {
			if (!socket) return;
			unsubOnline = socket.subscribe("monitor", "host-online", (msg) => {
				try {
					const d = msg.data ?? msg;
					const t = d?.hostId != null ? hosts.value.find((h) => h.id === d.hostId) : null;
					if (t) t.serverHostOnline = d.online ? 1 : 0;
				} catch {}
			});
			unsubMetrics = socket.subscribe("monitor", "host-metrics", (msg) => {
				try {
					const d = msg.data ?? msg;
					const t = d?.hostId != null ? hosts.value.find((h) => h.id === d.hostId) : null;
					if (t) {
						if (d.cpu != null) t.serverHostCpuUsage = Number(d.cpu);
						if (d.mem != null) t.serverHostMemUsage = Number(d.mem);
						if (d.disk != null) t.serverHostDiskUsage = Number(d.disk);
						stampClock();
					}
				} catch {}
			});
			unsubAlarm = socket.subscribe("monitor", "alarm", () => {
				fetchAlarmEvents().then((ev) => {
					events.value = ev ?? [];
					stampClock();
				}).catch(() => {});
			});
		}
		onMounted(() => {
			fetchAll();
			bindSocket();
			startClock();
		});
		onBeforeUnmount(() => {
			unsubOnline?.();
			unsubMetrics?.();
			unsubAlarm?.();
			if (clockTimer) {
				clearInterval(clockTimer);
				clockTimer = null;
			}
		});
		return (_ctx, _cache) => {
			const _component_ReButton = resolveComponent("ReButton");
			const _component_ReStatusIndicator = resolveComponent("ReStatusIndicator");
			const _component_ReStatCard = resolveComponent("ReStatCard");
			const _component_ReSkeleton = resolveComponent("ReSkeleton");
			const _component_el_tooltip = resolveComponent("el-tooltip");
			const _component_ReIcon = resolveComponent("ReIcon");
			return openBlock(), createElementBlock("div", _hoisted_1, [
				createBaseVNode("div", _hoisted_2, [createBaseVNode("div", null, [_cache[11] || (_cache[11] = createBaseVNode("h1", { class: "page-title" }, "监控概览", -1)), createBaseVNode("p", _hoisted_3, [
					_cache[7] || (_cache[7] = createTextVNode("资产健康一览 · ", -1)),
					createBaseVNode("span", _hoisted_4, toDisplayString(liveTime.value), 1),
					_cache[8] || (_cache[8] = createTextVNode()),
					_cache[9] || (_cache[9] = createBaseVNode("span", {
						class: "live-dot",
						title: "实时更新中"
					}, null, -1)),
					_cache[10] || (_cache[10] = createBaseVNode("span", { class: "muted" }, "· Socket 实时推送", -1))
				])]), createBaseVNode("div", _hoisted_5, [createVNode(_component_ReButton, {
					icon: "RefreshRight",
					"show-text": true,
					loading: loading.value,
					onClick: _cache[0] || (_cache[0] = ($event) => fetchAll())
				}, {
					default: withCtx(() => [..._cache[12] || (_cache[12] = [createTextVNode("刷新", -1)])]),
					_: 1
				}, 8, ["loading"]), createVNode(_component_ReButton, {
					icon: "Plus",
					"show-text": true,
					type: "primary",
					onClick: _cache[1] || (_cache[1] = ($event) => unref(router).push("/assets"))
				}, {
					default: withCtx(() => [..._cache[13] || (_cache[13] = [createTextVNode("新建资产", -1)])]),
					_: 1
				})])]),
				loadError.value ? (openBlock(), createElementBlock("div", _hoisted_6, [
					createVNode(_component_ReStatusIndicator, { type: "danger" }),
					createBaseVNode("span", null, "数据加载失败：" + toDisplayString(loadError.value), 1),
					createVNode(_component_ReButton, {
						icon: "RefreshRight",
						type: "primary",
						"show-text": true,
						onClick: _cache[2] || (_cache[2] = ($event) => fetchAll())
					}, {
						default: withCtx(() => [..._cache[14] || (_cache[14] = [createTextVNode("重试", -1)])]),
						_: 1
					})
				])) : createCommentVNode("", true),
				createVNode(_component_ReSkeleton, {
					loading: loading.value,
					rows: 4,
					animated: ""
				}, {
					default: withCtx(() => [createBaseVNode("section", _hoisted_7, [
						createBaseVNode("div", _hoisted_8, [
							createBaseVNode("div", _hoisted_9, [(openBlock(), createElementBlock("svg", _hoisted_10, [_cache[15] || (_cache[15] = createBaseVNode("circle", {
								cx: "22",
								cy: "22",
								r: "18",
								fill: "none",
								stroke: "var(--border-subtle)",
								"stroke-width": "4"
							}, null, -1)), createBaseVNode("circle", {
								cx: "22",
								cy: "22",
								r: "18",
								fill: "none",
								stroke: healthColor.value,
								"stroke-width": "4",
								"stroke-linecap": "round",
								"stroke-dasharray": `${healthScore.value * 1.13} 113`,
								"stroke-dashoffset": "28",
								transform: "rotate(-90 22 22)",
								style: { "transition": "stroke-dasharray 0.6s ease, stroke 0.4s" }
							}, null, 8, _hoisted_11)])), createBaseVNode("div", _hoisted_12, toDisplayString(healthScore.value), 1)]),
							_cache[16] || (_cache[16] = createBaseVNode("div", { class: "kpi-health-label" }, "系统健康度", -1)),
							createBaseVNode("div", _hoisted_13, "在线 " + toDisplayString(onlineCount.value) + "/" + toDisplayString(hosts.value.length), 1)
						]),
						createVNode(_component_ReStatCard, {
							size: "compact",
							title: "资产总数",
							desc: `已启用 ${enabledCount.value} · 在线 ${onlineCount.value}`,
							"icon-color": "var(--brand-500)"
						}, {
							icon: withCtx(() => [createVNode(_component_ReButton, {
								icon: "DataBoard",
								layout: "square",
								decorative: ""
							})]),
							value: withCtx(() => [createBaseVNode("span", _hoisted_14, toDisplayString(hosts.value.length), 1)]),
							_: 1
						}, 8, ["desc"]),
						createVNode(_component_ReStatCard, {
							size: "compact",
							title: "未处理告警",
							desc: `累计事件 ${totalAlarms.value}`,
							"icon-color": "var(--status-alarm)"
						}, {
							icon: withCtx(() => [createVNode(_component_ReButton, {
								icon: "Bell",
								layout: "square",
								type: "danger",
								decorative: ""
							})]),
							value: withCtx(() => [createBaseVNode("span", _hoisted_15, toDisplayString(unhandledCount.value), 1)]),
							_: 1
						}, 8, ["desc"]),
						createVNode(_component_ReStatCard, {
							size: "compact",
							title: "高危告警 P0+P1",
							desc: "30 分钟内响应",
							"icon-color": "var(--sev-p0-text)"
						}, {
							icon: withCtx(() => [createVNode(_component_ReButton, {
								icon: "Warning",
								layout: "square",
								type: "danger",
								decorative: ""
							})]),
							value: withCtx(() => [createBaseVNode("span", _hoisted_16, toDisplayString(levelCounts.value.P0 + levelCounts.value.P1), 1)]),
							_: 1
						}),
						createVNode(_component_ReStatCard, {
							size: "compact",
							title: "中危告警 P2",
							desc: "当班处理",
							"icon-color": "var(--sev-p2-text)"
						}, {
							icon: withCtx(() => [createVNode(_component_ReButton, {
								icon: "AlarmClock",
								layout: "square",
								type: "warning",
								decorative: ""
							})]),
							value: withCtx(() => [createBaseVNode("span", _hoisted_17, toDisplayString(levelCounts.value.P2), 1)]),
							_: 1
						})
					])]),
					_: 1
				}, 8, ["loading"]),
				createBaseVNode("section", _hoisted_18, [
					createBaseVNode("div", _hoisted_19, [_cache[17] || (_cache[17] = createBaseVNode("div", { class: "card-head" }, [createBaseVNode("span", { class: "card-title" }, "告警等级分布")], -1)), createBaseVNode("div", _hoisted_20, [createVNode(_component_el_tooltip, {
						content: `告警事件 · 共 ${totalAlarms.value} 起`,
						placement: "top"
					}, {
						default: withCtx(() => [createBaseVNode("div", {
							class: "donut",
							style: normalizeStyle(donutStyle.value)
						}, [createBaseVNode("div", _hoisted_21, [createBaseVNode("div", _hoisted_22, toDisplayString(totalAlarms.value), 1)])], 4)]),
						_: 1
					}, 8, ["content"]), createBaseVNode("div", _hoisted_23, [(openBlock(), createElementBlock(Fragment, null, renderList(LEVELS, (lv) => {
						return createVNode(_component_el_tooltip, {
							key: lv,
							content: `${lv} ${LEVEL_LABELS[lv]}`,
							placement: "top"
						}, {
							default: withCtx(() => [createBaseVNode("div", _hoisted_24, [
								createBaseVNode("span", {
									class: "legend-dot",
									style: normalizeStyle({ background: LEVEL_COLORS[lv] })
								}, null, 4),
								createBaseVNode("span", _hoisted_25, toDisplayString(lv), 1),
								createBaseVNode("span", { class: normalizeClass(["tag", `sev-${lv}`]) }, toDisplayString(levelCounts.value[lv]), 3)
							])]),
							_: 2
						}, 1032, ["content"]);
					}), 64))])])]),
					createBaseVNode("div", _hoisted_26, [
						_cache[21] || (_cache[21] = createBaseVNode("div", { class: "card-head" }, [createBaseVNode("span", { class: "card-title" }, "最近告警")], -1)),
						recentAlarms.value.length === 0 ? (openBlock(), createElementBlock("div", _hoisted_27, [createVNode(_component_ReIcon, {
							name: "CircleCheck",
							size: 28,
							style: {
								"color": "var(--status-online)",
								"margin-bottom": "8px"
							}
						}), _cache[18] || (_cache[18] = createBaseVNode("p", null, "暂无告警事件，系统运行平稳", -1))])) : (openBlock(), createElementBlock("table", _hoisted_28, [_cache[19] || (_cache[19] = createBaseVNode("thead", null, [createBaseVNode("tr", null, [
							createBaseVNode("th", { class: "th-sev" }, "级别"),
							createBaseVNode("th", null, "主机"),
							createBaseVNode("th", null, "指标"),
							createBaseVNode("th", null, "时间")
						])], -1)), createBaseVNode("tbody", null, [(openBlock(true), createElementBlock(Fragment, null, renderList(recentAlarms.value, (a) => {
							return openBlock(), createElementBlock("tr", {
								key: a.id,
								class: normalizeClass(["alarm-row", `sev-row-${unref(alarmLevel)(a)}`])
							}, [
								createBaseVNode("td", _hoisted_29, [createBaseVNode("span", { class: normalizeClass(["tag", `sev-${unref(alarmLevel)(a)}`]) }, toDisplayString(unref(alarmLevel)(a)), 3)]),
								createBaseVNode("td", null, toDisplayString(a.msMonitorAlarmEventMonitorName), 1),
								createBaseVNode("td", _hoisted_30, toDisplayString(a.msMonitorAlarmEventMetricName), 1),
								createBaseVNode("td", _hoisted_31, toDisplayString((a.msMonitorAlarmEventTriggerTime || "").slice(5, 16)), 1)
							], 2);
						}), 128))])])),
						totalAlarms.value > 5 ? (openBlock(), createElementBlock("div", _hoisted_32, [createVNode(_component_ReButton, {
							icon: "ArrowRight",
							"show-text": true,
							link: "",
							type: "primary",
							onClick: _cache[3] || (_cache[3] = ($event) => unref(router).push("/alarms"))
						}, {
							default: withCtx(() => [..._cache[20] || (_cache[20] = [createTextVNode("查看全部", -1)])]),
							_: 1
						})])) : createCommentVNode("", true)
					]),
					createBaseVNode("div", _hoisted_33, [
						_cache[25] || (_cache[25] = createBaseVNode("div", { class: "card-head" }, [createBaseVNode("span", { class: "card-title" }, "快捷入口")], -1)),
						createVNode(_component_ReButton, {
							icon: "Position",
							"show-text": true,
							class: "quick w100",
							onClick: _cache[4] || (_cache[4] = ($event) => unref(router).push("/terminal"))
						}, {
							default: withCtx(() => [..._cache[22] || (_cache[22] = [createTextVNode("远程控制台", -1)])]),
							_: 1
						}),
						createVNode(_component_ReButton, {
							icon: "Monitor",
							"show-text": true,
							class: "quick w100",
							style: { "margin-top": "8px" },
							onClick: _cache[5] || (_cache[5] = ($event) => unref(router).push("/assets"))
						}, {
							default: withCtx(() => [..._cache[23] || (_cache[23] = [createTextVNode("主机资产", -1)])]),
							_: 1
						}),
						createVNode(_component_ReButton, {
							icon: "Bell",
							"show-text": true,
							class: "quick w100",
							style: { "margin-top": "8px" },
							onClick: _cache[6] || (_cache[6] = ($event) => unref(router).push("/alarms"))
						}, {
							default: withCtx(() => [..._cache[24] || (_cache[24] = [createTextVNode("告警中心", -1)])]),
							_: 1
						})
					])
				])
			]);
		};
	}
}), [["__scopeId", "data-v-9b604894"]]);
//#endregion
export { WorkbenchView_default as default };
