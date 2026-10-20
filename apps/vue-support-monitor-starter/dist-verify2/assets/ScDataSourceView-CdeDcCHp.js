import { $n as normalizeClass, Ct as resolveDirective, D as createVNode, E as createTextVNode, Ht as watch, On as unref, St as resolveComponent, Yt as withDirectives, _ as createBaseVNode, b as createElementBlock, bt as renderList, ct as onMounted, g as computed, gn as reactive, it as onBeforeUnmount, k as defineComponent, mt as openBlock, nr as normalizeStyle, o as Fragment, qt as withCtx, rr as toDisplayString, v as createBlock, vn as ref, w as createSlots, wn as toRef, xt as renderSlot, y as createCommentVNode } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { w as withModifiers } from "./runtime-dom.esm-bundler-RRl39S3n.js";
import { t as ElMessageBox } from "./message-box-CXDJvJwn.js";
import { t as ElPagination } from "./pagination-DeBPTRrN.js";
import { t as ReTable_default } from "./ReTable-BO1ac7-i.js";
import { yt as message } from "./src-CEonioA3.js";
import { x as http } from "./src-DDwlSqPX.js";
import { a as useRouter } from "./vue-router-D43uXGPs.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { C as managerRouteFor, _ as saveDatasourceTunnel, a as datasourceMetricStreamUrl, b as updateDataSource, d as fetchDatasourceMetricTrend, f as fetchDatasourceOperLog, h as fetchJdbcDriverJars, i as createDataSource, l as fetchDataSourceTypes, m as fetchDatasourceTunnel, n as TableSelect_default, o as deleteDataSource, s as deleteDatasourceTunnel, t as ColumnSelect_default, u as fetchDataSources, x as uploadJdbcDriverJar, y as testDataSource } from "./src-DW2Ffr17.js";
import { t as ReSelect_default } from "./ReSelect-C2rq-Voy.js";
import { t as ReButton_default } from "./ReButton-owxlNwDO.js";
import { t as component } from "./ReDialog-DZGeR3lw.js";
import { u as ReFormItem } from "./ReKit-CFSh6vls.js";
import { t as component$1 } from "./ReStatCard-BGjVHdD2.js";
import { k as timer_default, l as clock_default, s as circle_check_default } from "./dist-Axt1Prff.js";
import { t as ReEmpty_default } from "./ReEmpty-DzxmsI1k.js";
import { t as ReForm_default } from "./ReForm-BHwHC8j0.js";
import { t as component$2 } from "./ReIcon-By12b2Y9.js";
import { t as ReInput_default } from "./ReInput-CGHpe202.js";
import { t as ReInputNumber_default } from "./ReInputNumber-BOzz1hL8.js";
import { t as ReSwitch_default } from "./ReSwitch-B3yMYGw4.js";
import { t as ReTab_default } from "./ReTab-y-lcvWJm.js";
import { t as component$3 } from "./ReTag-D5UpQULZ.js";
import { r as formatDuration } from "./ReTime-BSxjnS6E.js";
import { t as DsmContextMenu_default } from "./DsmContextMenu-BEoagIWo.js";
import { n as token, r as useEchart } from "./useEchart-QklTP6NK.js";
import { s as fetchNginxAccessTop } from "./api-5Dnrf3ch.js";
//#region ../../packages/utils/src/modules/costMs.ts
/**
* 耗时毫秒数归一（@repo/utils）
*
* 供全平台耗时展示统一走 `<ReTime :value="costMs(raw)" format="duration" />`。
*
* <h3>为什么必须先归一再交给 ReTime</h3>
* <p>{@link ReTime} 的 {@code duration} 分支只认 {@code number}，非数字会先走
* {@code toMs} 的时间戳解析。后端的耗时字段（{@code collectTaskCost} /
* {@code sysLogCost} / {@code sysMessageCost} …）在不同 Mapper 里可能是数字，也可能是
* 数字字符串；字符串 {@code "800"} 进 {@code toMs} 会被当成<b>秒级</b>时间戳放大 1000 倍，
* 800 毫秒显示成 13 分钟。所以必须先转 number。</p>
*
* <h3>为什么空值返回 undefined 而不是 0</h3>
* <p>{@code Number(null)} 是 0，直接透传会让「没跑过 / 没统计」的记录显示成「0 毫秒」，
* 读起来像「跑得极快」。返回 {@code undefined} 让 ReTime 走自己的 {@code placeholder}。</p>
*
* @author CH
* @since 2026/9/28
*/
/**
* 把后端返回的耗时归一成可交给 ReTime 的毫秒数。
*
* @param ms 后端返回的耗时（毫秒，可能是数字或数字字符串）
* @return 可用的毫秒数；空值或非数字返回 undefined
*
* @example
* ```ts
* <ReTime :value="costMs(row.sysLogCost)" format="duration" placeholder="—" />
* ```
*/
function costMs(ms) {
	if (ms == null || ms === "") return;
	const value = Number(ms);
	return Number.isFinite(value) ? value : void 0;
}
//#endregion
//#region ../../pages/datasource/src/metrics/DatasourceMetricChart.vue
var DatasourceMetricChart_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	__name: "DatasourceMetricChart",
	props: {
		points: {},
		height: { default: 220 },
		fill: {
			type: Boolean,
			default: false
		}
	},
	setup(__props) {
		/**
		* 数据源监控指标图（ECharts）。
		*
		* <p><strong>为什么上下两块坐标系而不是一个</strong>：延迟是毫秒（几十~几千），
		* 连通与否是 0/1。放进同一个 y 轴，连通性会被压成贴着底轴的一条直线，
		* 「中间那次失败」根本看不出来；共用一套刻度又会让延迟读数失真。
		* 上下分开，各自一条轴，是这两类量唯一诚实的画法。</p>
		*
		* <p><strong>连通性用状态条而不是折线</strong>：连通与否不是连续量，
		* 折线会在失败与成功之间斜插一段「正在连接」，而这是不存在的状态。
		* 状态条每个采样点是一格，高=连通、低=不通、缺格=未判定。</p>
		*
		* <p><strong>连接数走右轴虚线</strong>：延迟（毫秒）与连接数（个）量纲不同，
		* 共轴会把其中一方压平；虚线弱化是它是背景量，不与延迟曲线抢视觉权重。
		* 取不到连接数的类型画成缺格（null 断线），不补 0 —— 0 会被读成
		* 「没有客户端在连」，与事实相反。</p>
		*
		* <p><strong>断点不连线</strong>：失败与未判定都给 `null`，
		* {@code connectNulls: false} 让延迟曲线在那一刻断开 ——
		* 「没测出来」画成一条穿过空洞的斜线，等于凭空捏造了一段延迟数据。</p>
		*
		* <p><strong>高宽策略</strong>：非嵌入模式给固定像素高（表格页高度本来就由
		* 内容决定）；嵌入模式走 {@code fill}，由外层 flex 布局把剩余高度分给画布，
		* 整张图用百分比栅格缩放，窗口高矮变化时不再出现「面板很高、图只有一小截」
		* 或「图被裁掉」的错位。</p>
		*
		* @author CH
		* @since 4.0.0.43
		*/
		const props = __props;
		const el = ref(null);
		const elRef = computed(() => el.value);
		/** ISO 字符串 → 毫秒时间戳；解析不了就返回 null，让该点变成断点而不是 NaN */
		function toTs(time) {
			if (!time) return null;
			const v = Date.parse(time);
			return Number.isNaN(v) ? null : v;
		}
		const build = () => {
			const axisColor = token("--text-secondary");
			const splitColor = token("--border-subtle");
			const tipBg = token("--bg-elevated") || token("--bg-container");
			const okColor = token("--status-success");
			const badColor = token("--status-error");
			const connect = [];
			const session = [];
			const health = [];
			const connections = [];
			const failures = [];
			for (const p of props.points) {
				const ts = toTs(p.time);
				if (ts === null) continue;
				connect.push([ts, p.connectLatencyMs ?? null]);
				session.push([ts, p.sessionLatencyMs ?? null]);
				health.push([ts, p.success === null ? null : p.success ? 1 : 0]);
				connections.push([ts, p.connectionCount ?? null]);
				if (p.success === false) failures.push([ts, p.errorMessage || "连接失败"]);
			}
			const GRID_TOP = "6%";
			const LATENCY_H = "55%";
			const HEALTH_TOP = "69%";
			const HEALTH_H = "23%";
			const series = [
				{
					name: "建连延迟",
					type: "line",
					xAxisIndex: 0,
					yAxisIndex: 0,
					data: connect,
					showSymbol: false,
					sampling: "lttb",
					connectNulls: false,
					lineStyle: {
						width: 2,
						color: token("--metric-db")
					},
					itemStyle: { color: token("--metric-db") }
				},
				{
					name: "会话延迟",
					type: "line",
					xAxisIndex: 0,
					yAxisIndex: 0,
					data: session,
					showSymbol: false,
					sampling: "lttb",
					connectNulls: false,
					lineStyle: {
						width: 2,
						color: token("--metric-net")
					},
					itemStyle: { color: token("--metric-net") }
				},
				{
					name: "连接数",
					type: "line",
					xAxisIndex: 0,
					yAxisIndex: 1,
					data: connections,
					showSymbol: false,
					sampling: "lttb",
					connectNulls: false,
					lineStyle: {
						width: 1.5,
						type: "dashed",
						color: token("--metric-redis")
					},
					itemStyle: { color: token("--metric-redis") }
				},
				{
					name: "连通性",
					type: "bar",
					xAxisIndex: 1,
					yAxisIndex: 2,
					data: health.map(([ts, v]) => ({
						value: [ts, v ?? .5],
						itemStyle: { color: v === null ? token("--text-tertiary") : v === 1 ? okColor : badColor }
					})),
					barWidth: "60%"
				}
			];
			return {
				animation: false,
				grid: [{
					left: "3%",
					right: "8%",
					top: GRID_TOP,
					height: LATENCY_H,
					containLabel: true
				}, {
					left: "3%",
					right: "8%",
					top: HEALTH_TOP,
					height: HEALTH_H,
					containLabel: true
				}],
				tooltip: {
					trigger: "axis",
					backgroundColor: tipBg,
					borderColor: splitColor,
					textStyle: {
						color: axisColor,
						fontSize: 12
					},
					formatter: (params) => {
						const arr = Array.isArray(params) ? params : [params];
						const first = arr[0];
						const ts = Number(first?.axisValue ?? NaN);
						if (!Number.isFinite(ts)) return "";
						const at = failures.find((f) => f[0] === ts);
						const time = new Date(ts).toLocaleString("zh-CN", { hour12: false });
						const lines = arr.map((raw) => {
							const item = raw;
							const pair = Array.isArray(item.value) ? item.value : null;
							const v = pair ? pair[1] : item.value;
							const text = v === null || v === void 0 ? "—" : String(Math.round(v));
							const unit = item.seriesName?.includes("延迟") ? " ms" : item.seriesName === "连接数" ? " 个" : "";
							return `${item.seriesName}: ${text}${unit}`;
						});
						if (at) lines.push(`失败原因: ${at[1]}`);
						return [time, ...lines].join("<br/>");
					}
				},
				axisPointer: { link: [{ xAxisIndex: "all" }] },
				xAxis: [{
					type: "time",
					gridIndex: 0,
					axisLine: { lineStyle: { color: splitColor } },
					axisTick: { show: false },
					axisLabel: { show: false },
					splitLine: { show: false }
				}, {
					type: "time",
					gridIndex: 1,
					axisLine: { lineStyle: { color: splitColor } },
					axisTick: { show: false },
					axisLabel: {
						color: axisColor,
						fontSize: 11,
						hideOverlap: true,
						formatter: (v) => new Date(v).toLocaleTimeString("zh-CN", { hour12: false })
					},
					splitLine: { show: false }
				}],
				yAxis: [
					{
						type: "value",
						gridIndex: 0,
						min: 0,
						name: "延迟 (ms)",
						nameTextStyle: {
							color: axisColor,
							fontSize: 11
						},
						axisLine: { show: false },
						axisTick: { show: false },
						axisLabel: {
							color: axisColor,
							fontSize: 11
						},
						splitLine: { lineStyle: {
							color: splitColor,
							type: "dashed"
						} }
					},
					{
						type: "value",
						gridIndex: 0,
						min: 0,
						minInterval: 1,
						name: "连接数",
						nameTextStyle: {
							color: axisColor,
							fontSize: 11
						},
						axisLine: { show: false },
						axisTick: { show: false },
						axisLabel: {
							color: axisColor,
							fontSize: 11
						},
						splitLine: { show: false }
					},
					{
						type: "value",
						gridIndex: 1,
						min: 0,
						max: 1,
						interval: 1,
						name: "连通",
						nameTextStyle: {
							color: axisColor,
							fontSize: 11
						},
						axisLine: { show: false },
						axisTick: { show: false },
						axisLabel: {
							color: axisColor,
							fontSize: 11,
							showMinLabel: true,
							showMaxLabel: true
						},
						splitLine: { show: false }
					}
				],
				series
			};
		};
		const { render } = useEchart(elRef, build);
		watch(() => [
			props.points,
			props.height,
			props.fill
		], render, { deep: true });
		return (_ctx, _cache) => {
			return openBlock(), createElementBlock("div", {
				ref_key: "el",
				ref: el,
				class: "ds-metric-echart",
				style: normalizeStyle({ height: __props.fill ? "100%" : `${__props.height}px` })
			}, null, 4);
		};
	}
}), [["__scopeId", "data-v-ffcf8509"]]);
//#endregion
//#region ../../pages/datasource/src/metrics/useDatasourceMetricStream.ts
/**
* 数据源监控指标的实时推送（SSE）订阅。
*
* <p>与 {@code ../nginx/useNginxStream} 同构，差异有一处是结构性的：
* 指标是一个数据源的一组数值，不是 7 条独立曲线，所以不需要「按指标各自封顶」；
* 二是推送载荷自带一小段窗口（{@code points}），因此这里是把窗口整体替换成
* 服务端给的版本，而不是逐点追加 —— 服务端窗口已经做过抽稀与「保留最后一点」，
* 前端再逐点合并反而会把抽稀后的稀疏点重新堆回密集。</p>
*
* <p>用共享的 {@code http().sse()} 而不是裸 {@code EventSource}：后者不能带自定义
* header，而本项目所有 {@code /ms/**} 请求都靠 token 鉴权，裸 EventSource 建连会拿不到
* 数据且只在控制台留一条不显眼的报错。</p>
*
* @author CH
* @since 4.0.0.43
*/
/** 单次会话最多保留的点数。60s 一轮 × 6 小时 ≈ 360 点，留出余量。 */
var MAX_POINTS = 600;
/**
* 订阅某数据源的指标实时推送，并在数据源切换时自动重连。
*
* @param datasourceId 响应式数据源 id
* @param options       回调
* @returns 控制句柄
*/
function useDatasourceMetricStream(datasourceId, options = {}) {
	const state = ref("idle");
	const lastPushAt = ref(null);
	let client = null;
	const close = () => {
		client?.close();
		client = null;
		state.value = "idle";
	};
	const connect = () => {
		close();
		const id = datasourceId.value;
		if (!id) return;
		state.value = "connecting";
		client = http().get(datasourceMetricStreamUrl(id)).sse({
			onOpen: () => {
				state.value = "open";
			},
			onMessage: (ev) => {
				state.value = "open";
				if (ev.event !== "metric") return;
				lastPushAt.value = (/* @__PURE__ */ new Date()).toLocaleTimeString("zh-CN", { hour12: false });
				const push = safeParse(ev.data);
				if (!push) return;
				options.onPush?.(push);
				const points = push.points?.points ?? [];
				if (points.length) options.onPoints?.(capPoints(points));
			},
			onError: () => {
				state.value = "error";
			},
			onClose: () => {
				state.value = "idle";
			},
			maxReconnectAttempts: 10,
			reconnectInterval: 3e3
		});
	};
	watch(datasourceId, () => connect(), { immediate: true });
	onBeforeUnmount(close);
	return {
		state,
		lastPushAt,
		close
	};
}
/**
* 封顶点数，丢最旧的。
*
* <p>实时看板看当下；历史完整度由首屏那次趋势查询保证。</p>
*
* @param points 服务端给的窗口点
* @returns 封顶后的新数组
*/
function capPoints(points) {
	if (points.length <= MAX_POINTS) return points;
	return points.slice(points.length - MAX_POINTS);
}
/** 反序列化，失败返回 null 而不是抛 —— 一条脏帧不该把整条流打死 */
function safeParse(raw) {
	if (typeof raw !== "string") return raw ?? null;
	try {
		return JSON.parse(raw);
	} catch {
		return null;
	}
}
//#endregion
//#region ../../pages/datasource/src/metrics/DatasourceMetricPanel.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1$3 = {
	key: 0,
	class: "ds-metrics__bar"
};
var _hoisted_2$3 = { class: "ds-metrics__stat" };
var _hoisted_3$3 = { class: "ds-metrics__stat" };
var _hoisted_4$3 = { class: "ds-metrics__stat-value mono" };
var _hoisted_5$3 = { class: "ds-metrics__stat" };
var _hoisted_6$3 = { class: "ds-metrics__stat-value mono" };
var _hoisted_7$3 = { class: "ds-metrics__stat" };
var _hoisted_8$2 = { class: "ds-metrics__stat-value" };
var _hoisted_9$2 = {
	key: 1,
	class: "ds-metrics__hint"
};
var _hoisted_10$2 = {
	key: 2,
	class: "ds-metrics__chart"
};
var _hoisted_11$2 = {
	key: 0,
	class: "ds-metrics__foot"
};
var _hoisted_12$2 = { key: 0 };
var _hoisted_13$2 = { key: 1 };
var _hoisted_14$2 = {
	key: 3,
	class: "ds-metrics__empty"
};
//#endregion
//#region ../../pages/datasource/src/metrics/DatasourceMetricPanel.vue
var DatasourceMetricPanel_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	__name: "DatasourceMetricPanel",
	props: {
		datasourceId: {},
		embedded: { type: Boolean }
	},
	emits: ["latest"],
	setup(__props, { expose: __expose, emit: __emit }) {
		/**
		* 数据源监控指标面板：状态胶囊 + 延迟/连通性趋势图。
		*
		* <p><strong>采集是「有人看才采」</strong>，这一点必须让用户看得见，
		* 否则「打开页面图是空的」会被当成故障。所以无数据时显示的是后端给的
		* {@code message}（说明为什么空、什么时候会有），不是一句「暂无数据」。</p>
		*
		* <p><strong>SSE 与趋势查询的分工</strong>：趋势接口给首屏历史，SSE 给增量。
		* 反过来（首屏等 SSE）会让页面上半秒是空白；只用 SSE（不带历史）
		* 则切回看过的数据源时又要重新等采集。</p>
		*
		* @author CH
		* @since 4.0.0.43
		*/
		const props = __props;
		const emit = __emit;
		const points = ref([]);
		/** 后端给的说明文案；无数据时说明原因，有数据时为 null */
		const note = ref(null);
		/** 最近一次采集结果，用于顶部胶囊 */
		const latest = ref(null);
		/** 实际使用的采样间隔（秒），抽稀后与请求值不同，展示要用后端报的那个 */
		const intervalSec = ref(null);
		const loadError = ref(null);
		const idRef = toRef(props, "datasourceId");
		/**
		* 拉首屏历史。
		*
		* <p>失败不抛到界面：把 error 混进 note 就够了 —— 这一页不是「操作」页，
		* 拉不到历史不该弹一个红色的 toast 把用户从正在做的事里拽走。</p>
		*/
		async function loadTrend() {
			const id = idRef.value;
			if (!id) {
				points.value = [];
				note.value = null;
				latest.value = null;
				return;
			}
			loadError.value = null;
			try {
				const trend = await fetchDatasourceMetricTrend(id);
				points.value = trend?.points ?? [];
				note.value = trend?.message ?? null;
				intervalSec.value = trend?.interval ?? null;
			} catch (e) {
				loadError.value = e instanceof Error ? e.message : String(e);
				points.value = [];
				note.value = null;
			}
		}
		const { state, lastPushAt, close } = useDatasourceMetricStream(idRef, {
			onPush: (push) => {
				latest.value = push;
				if (push.message && push.success === null) note.value = push.message;
			},
			onPoints: (incoming) => {
				points.value = incoming;
			}
		});
		watch(idRef, () => {
			latest.value = null;
			lastPushAt.value = null;
			intervalSec.value = null;
			loadTrend();
		});
		watch(points, (v) => emit("latest", v.length ? v[v.length - 1] : null));
		onMounted(loadTrend);
		const statusText = computed(() => {
			const s = latest.value?.success;
			if (s === null || s === void 0) return "未判定";
			return s ? "连通" : "不通";
		});
		const statusClass = computed(() => {
			const s = latest.value?.success;
			if (s === null || s === void 0) return "is-unknown";
			return s ? "is-ok" : "is-bad";
		});
		const connectText = computed(() => {
			const v = latest.value?.connectLatencyMs;
			return v === null || v === void 0 ? "—" : `${v} ms`;
		});
		const sessionText = computed(() => {
			const v = latest.value?.sessionLatencyMs;
			return v === null || v === void 0 ? "—" : `${v} ms`;
		});
		/** 未判定时写「—」而不是「直连」：没测出来就不能断言它没走隧道 */
		const tunneledText = computed(() => {
			const t = latest.value?.tunneled;
			if (t === null || t === void 0) return "—";
			return t ? "SSH 隧道" : "直连";
		});
		/** 采样时刻格式化；解析不了就原样返回，不吞成「—」（原样更利于排查） */
		function formatTime(time) {
			const v = Date.parse(time);
			return Number.isNaN(v) ? time : new Date(v).toLocaleString("zh-CN", { hour12: false });
		}
		const streamLabel = (s) => {
			switch (s) {
				case "open": return "实时中";
				case "connecting": return "连接中";
				case "error": return "重连中";
				default: return "未连接";
			}
		};
		const streamText = computed(() => {
			const at = lastPushAt.value;
			return at ? `${streamLabel(state.value)} · 最近更新 ${at}` : streamLabel(state.value);
		});
		const streamClass = computed(() => `is-${state.value}`);
		const hint = computed(() => {
			if (loadError.value) return `首屏历史加载失败：${loadError.value}`;
			return note.value;
		});
		const emptyText = computed(() => {
			if (loadError.value) return "首屏历史加载失败";
			if (note.value) return note.value;
			return "正在等待第一次采集（约 1 分钟内）";
		});
		__expose({ close });
		return (_ctx, _cache) => {
			return openBlock(), createElementBlock("div", { class: normalizeClass(["ds-metrics", { "is-embedded": __props.embedded }]) }, [
				!__props.embedded ? (openBlock(), createElementBlock("div", _hoisted_1$3, [
					createBaseVNode("div", _hoisted_2$3, [_cache[0] || (_cache[0] = createBaseVNode("span", { class: "ds-metrics__stat-label" }, "连通性", -1)), createBaseVNode("span", { class: normalizeClass(["ds-metrics__stat-value", statusClass.value]) }, toDisplayString(statusText.value), 3)]),
					createBaseVNode("div", _hoisted_3$3, [_cache[1] || (_cache[1] = createBaseVNode("span", { class: "ds-metrics__stat-label" }, "建连延迟", -1)), createBaseVNode("span", _hoisted_4$3, toDisplayString(connectText.value), 1)]),
					createBaseVNode("div", _hoisted_5$3, [_cache[2] || (_cache[2] = createBaseVNode("span", { class: "ds-metrics__stat-label" }, "会话延迟", -1)), createBaseVNode("span", _hoisted_6$3, toDisplayString(sessionText.value), 1)]),
					createBaseVNode("div", _hoisted_7$3, [_cache[3] || (_cache[3] = createBaseVNode("span", { class: "ds-metrics__stat-label" }, "链路", -1)), createBaseVNode("span", _hoisted_8$2, toDisplayString(tunneledText.value), 1)]),
					_cache[4] || (_cache[4] = createBaseVNode("div", { class: "ds-metrics__spacer" }, null, -1)),
					createBaseVNode("span", { class: normalizeClass(["ds-metrics__stream", streamClass.value]) }, toDisplayString(streamText.value), 3)
				])) : createCommentVNode("", true),
				hint.value ? (openBlock(), createElementBlock("p", _hoisted_9$2, toDisplayString(hint.value), 1)) : createCommentVNode("", true),
				points.value.length ? (openBlock(), createElementBlock("div", _hoisted_10$2, [createVNode(DatasourceMetricChart_default, {
					points: points.value,
					fill: __props.embedded
				}, null, 8, ["points", "fill"]), !__props.embedded ? (openBlock(), createElementBlock("p", _hoisted_11$2, [
					createTextVNode(" 共 " + toDisplayString(points.value.length) + " 个采样点", 1),
					intervalSec.value ? (openBlock(), createElementBlock("span", _hoisted_12$2, " · 采样间隔约 " + toDisplayString(Math.round(intervalSec.value)) + "s", 1)) : createCommentVNode("", true),
					points.value.length && points.value[points.value.length - 1]?.time ? (openBlock(), createElementBlock("span", _hoisted_13$2, " · 最新 " + toDisplayString(formatTime(points.value[points.value.length - 1]?.time)), 1)) : createCommentVNode("", true)
				])) : createCommentVNode("", true)])) : (openBlock(), createElementBlock("div", _hoisted_14$2, [createVNode(unref(ReEmpty_default), {
					description: emptyText.value,
					"image-size": 80
				}, null, 8, ["description"])]))
			], 2);
		};
	}
}), [["__scopeId", "data-v-b493b4dd"]]);
//#endregion
//#region ../../pages/datasource/src/metrics/DatasourceOperLogPanel.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1$2 = { class: "ds-oplog" };
var _hoisted_2$2 = { class: "ds-oplog__bar" };
var _hoisted_3$2 = {
	key: 0,
	class: "ds-oplog__error"
};
var _hoisted_4$2 = { class: "ds-oplog__table" };
var _hoisted_5$2 = {
	key: 1,
	class: "ds-oplog__pager"
};
var _hoisted_6$2 = { class: "ds-oplog__total" };
var _hoisted_7$2 = {
	key: 2,
	class: "ds-oplog__empty"
};
//#endregion
//#region ../../pages/datasource/src/metrics/DatasourceOperLogPanel.vue
var DatasourceOperLogPanel_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	__name: "DatasourceOperLogPanel",
	props: { datasourceId: {} },
	setup(__props, { expose: __expose }) {
		/**
		* 数据源操作日志面板。
		*
		* <p><strong>入口按需求先不露出</strong>（见 ScDataSourceView 的
		* {@code OPER_LOG_ENTRY_VISIBLE}），本面板先按可用状态写完并留好开关说明。
		* 数据源切换时重新拉第一页而不是保留当前页：换数据源后当前页码多半已越界，
		* 停在那一页会显示成「这个数据源没有日志」。</p>
		*
		* @author CH
		* @since 4.0.0.43
		*/
		const props = __props;
		const rows = ref([]);
		const total = ref(0);
		const page = ref(1);
		const size = ref(20);
		const actionFilter = ref("");
		const loading = ref(false);
		const error = ref(null);
		/** 操作码 → 中文名。码在后端、前端也要显示，不能各处各写一份中文 */
		const ACTION_LABELS = {
			CREATE: "新增数据源",
			UPDATE: "更新数据源",
			DELETE: "删除数据源",
			TEST: "连接测试",
			TUNNEL_QUERY: "查询隧道",
			TUNNEL_SAVE: "保存隧道",
			TUNNEL_DELETE: "删除隧道"
		};
		/** 后端返回 actionName 时优先用它（新增操作码不必等前端跟上） */
		function actionText(code, name) {
			return name || (code ? ACTION_LABELS[code] ?? code : "—");
		}
		/** 时间格式化；解析不了就原样返回，不吞成空串（原样更利于排查） */
		function formatTime(time) {
			if (!time) return "—";
			const v = Date.parse(time);
			return Number.isNaN(v) ? time : new Date(v).toLocaleString("zh-CN", { hour12: false });
		}
		/**
		* 筛选下拉的选项。
		*
		* <p>只列已知操作码而不是把库里出现过的码都拉出来：后者需要先查一次全量日志
		* 才能拿到码集合，而「筛选器本身要先查一次全量数据才能用」是个循环。</p>
		*/
		const actionOptions = computed(() => [{
			label: "全部操作",
			value: ""
		}, ...Object.entries(ACTION_LABELS).map(([value, label]) => ({
			label,
			value
		}))]);
		const columns = [
			{
				prop: "createTime",
				label: "时间",
				width: 165,
				formatter: (row) => formatTime(String(row.createTime ?? ""))
			},
			{
				prop: "action",
				label: "操作",
				width: 130,
				formatter: (row) => actionText(row.action, row.actionName)
			},
			{
				prop: "operator",
				label: "操作人",
				width: 100
			},
			{
				prop: "clientIp",
				label: "来源 IP",
				width: 130
			},
			{
				prop: "costMs",
				label: "耗时",
				width: 90,
				align: "right",
				formatter: (row) => row.costMs == null ? "—" : String(costMs(Number(row.costMs)))
			},
			{
				prop: "success",
				label: "结果",
				width: 80,
				align: "center",
				formatter: (row) => {
					const v = row.success;
					return v === 1 ? "成功" : v === 0 ? "失败" : "—";
				}
			},
			{
				prop: "detail",
				label: "说明",
				minWidth: 220,
				showOverflowTooltip: true
			},
			{
				prop: "requestUrl",
				label: "请求路径",
				minWidth: 200,
				showOverflowTooltip: true
			}
		];
		const idRef = toRef(props, "datasourceId");
		async function reload() {
			const id = idRef.value;
			if (!id) {
				rows.value = [];
				total.value = 0;
				return;
			}
			loading.value = true;
			error.value = null;
			try {
				const query = {
					action: actionFilter.value || null,
					page: page.value,
					size: size.value
				};
				const res = await fetchDatasourceOperLog(id, query);
				rows.value = res?.records ?? [];
				if (res?.size && res.size !== size.value) size.value = res.size;
				total.value = res?.total ?? 0;
			} catch (e) {
				error.value = e instanceof Error ? e.message : String(e);
				rows.value = [];
				total.value = 0;
			} finally {
				loading.value = false;
			}
		}
		/** 改每页条数后回到第 1 页：留在第 5 页而总数只有 2 页会显示空列表 */
		function onSizeChange() {
			page.value = 1;
			reload();
		}
		watch(idRef, () => {
			page.value = 1;
			reload();
		});
		onMounted(reload);
		__expose({ reload });
		return (_ctx, _cache) => {
			const _directive_loading = resolveDirective("loading");
			return openBlock(), createElementBlock("div", _hoisted_1$2, [
				createBaseVNode("div", _hoisted_2$2, [
					createVNode(unref(ReSelect_default), {
						modelValue: actionFilter.value,
						"onUpdate:modelValue": [_cache[0] || (_cache[0] = ($event) => actionFilter.value = $event), reload],
						class: "ds-oplog__filter",
						placeholder: "全部操作",
						options: actionOptions.value
					}, null, 8, ["modelValue", "options"]),
					_cache[3] || (_cache[3] = createBaseVNode("span", { class: "ds-oplog__spacer" }, null, -1)),
					createVNode(unref(ReButton_default), {
						icon: "Refresh",
						loading: loading.value,
						tip: "刷新",
						onClick: reload
					}, null, 8, ["loading"])
				]),
				error.value ? (openBlock(), createElementBlock("p", _hoisted_3$2, toDisplayString(error.value), 1)) : createCommentVNode("", true),
				createBaseVNode("div", _hoisted_4$2, [withDirectives(createVNode(unref(ReTable_default), {
					data: rows.value,
					columns,
					pagination: false,
					stripe: "",
					border: "",
					height: "100%"
				}, null, 8, ["data"]), [[_directive_loading, loading.value]])]),
				total.value > 0 ? (openBlock(), createElementBlock("div", _hoisted_5$2, [createBaseVNode("span", _hoisted_6$2, "共 " + toDisplayString(total.value) + " 条", 1), createVNode(unref(ElPagination), {
					"current-page": page.value,
					"onUpdate:currentPage": _cache[1] || (_cache[1] = ($event) => page.value = $event),
					"page-size": size.value,
					"onUpdate:pageSize": _cache[2] || (_cache[2] = ($event) => size.value = $event),
					total: total.value,
					"page-sizes": [
						20,
						50,
						100
					],
					layout: "sizes, prev, pager, next",
					background: "",
					onCurrentChange: reload,
					onSizeChange
				}, null, 8, [
					"current-page",
					"page-size",
					"total"
				])])) : !loading.value && !error.value ? (openBlock(), createElementBlock("div", _hoisted_7$2, [createVNode(unref(ReEmpty_default), {
					description: "还没有操作记录",
					"image-size": 80
				})])) : createCommentVNode("", true)
			]);
		};
	}
}), [["__scopeId", "data-v-c144eb45"]]);
//#endregion
//#region ../../pages/datasource/src/metrics/DatasourceServerStatsPanel.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1$1 = { class: "ds-server-stats" };
var _hoisted_2$1 = { class: "ds-server-stats__head" };
var _hoisted_3$1 = ["disabled", "title"];
var _hoisted_4$1 = { class: "ds-server-stats__grid" };
var _hoisted_5$1 = ["title"];
var _hoisted_6$1 = {
	key: 0,
	class: "ds-server-stats__note"
};
var _hoisted_7$1 = { class: "ds-server-stats__grid" };
var _hoisted_8$1 = ["title"];
var _hoisted_9$1 = {
	key: 0,
	class: "ds-server-stats__url"
};
var _hoisted_10$1 = { class: "ds-server-stats__url-title" };
var _hoisted_11$1 = { class: "ds-server-stats__url-list" };
var _hoisted_12$1 = ["title"];
var _hoisted_13$1 = { class: "ds-server-stats__url-hit" };
var _hoisted_14$1 = {
	key: 0,
	class: "ds-server-stats__note"
};
var _hoisted_15$1 = {
	key: 1,
	class: "ds-server-stats__empty"
};
var _hoisted_16$1 = {
	key: 2,
	class: "ds-server-stats__empty"
};
var _hoisted_17$1 = {
	key: 3,
	class: "ds-server-stats__empty"
};
var _hoisted_18$1 = {
	key: 2,
	class: "ds-server-stats__empty"
};
//#endregion
//#region ../../pages/datasource/src/metrics/DatasourceServerStatsPanel.vue
var DatasourceServerStatsPanel_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	__name: "DatasourceServerStatsPanel",
	props: {
		datasourceId: {},
		type: {},
		url: {},
		driverClassName: {},
		latest: {}
	},
	setup(__props) {
		const props = __props;
		const isNginx = computed(() => props.type === "nginx");
		const isJdbcMysql = computed(() => {
			const u = (props.url || "").trim().toLowerCase();
			const driver = (props.driverClassName || "").toLowerCase();
			if (props.type !== "jdbc") return false;
			if (u.startsWith("jdbc:")) return u.startsWith("jdbc:mysql:") || u.startsWith("jdbc:mariadb:") || driver.includes("mysql") || driver.includes("mariadb");
			return true;
		});
		const stats = computed(() => props.latest?.serverStats ?? null);
		const hasStats = computed(() => isJdbcMysql.value ? stats.value !== null && stats.value !== void 0 : isNginx.value ? nginxTop.value !== null : false);
		const isWaiting = computed(() => (isJdbcMysql.value || isNginx.value) && !hasStats.value);
		const nginxTop = ref(null);
		const nginxLoading = ref(false);
		const nginxError = ref("");
		async function loadNginxUrlStats() {
			if (!isNginx.value || !props.datasourceId) {
				nginxTop.value = null;
				nginxError.value = "";
				return;
			}
			nginxLoading.value = true;
			nginxError.value = "";
			try {
				nginxTop.value = await fetchNginxAccessTop(props.datasourceId, 2e3, 0, 5);
			} catch (e) {
				nginxTop.value = null;
				nginxError.value = e instanceof Error ? e.message : String(e);
			} finally {
				nginxLoading.value = false;
			}
		}
		watch(() => [props.type, props.datasourceId], () => {
			loadNginxUrlStats();
		}, { immediate: true });
		const tagText = computed(() => {
			if (isNginx.value) {
				if (nginxTop.value) return "Nginx / URL";
				if (nginxError.value) return "暂无 URL";
				if (nginxLoading.value) return "统计中";
				return "等待采集";
			}
			if (!isJdbcMysql.value) return "暂未采集";
			if (!props.latest) return "等待采集";
			return hasStats.value ? "MySQL / MariaDB" : "暂无指标";
		});
		const unsupportedText = computed(() => props.latest ? "当前类型暂未采集服务器指标（仅支持 MySQL / MariaDB）" : "正在等待第一次采集（约 1 分钟内）");
		function numberText(v) {
			return v === null || v === void 0 ? "—" : v.toLocaleString("zh-CN");
		}
		function formatSize(v) {
			if (v === null || v === void 0 || v < 0) return "—";
			if (v < 1024) return `${v} B`;
			const units = [
				"KB",
				"MB",
				"GB",
				"TB"
			];
			let n = v;
			let i = -1;
			do {
				n /= 1024;
				i += 1;
			} while (n >= 1024 && i < units.length - 1);
			return `${Number(n.toFixed(1)).toLocaleString("zh-CN")} ${units[i]}`;
		}
		function pctOfTop(hits) {
			const total = nginxTop.value?.total;
			if (!total || !hits) return 0;
			return Math.round(hits / total * 1e3) / 10;
		}
		const avgQps = computed(() => {
			const q = stats.value?.questions;
			const u = stats.value?.uptimeSeconds;
			if (q === null || q === void 0 || u === null || u === void 0 || u <= 0) return "—";
			return Number((q / u).toFixed(1)).toLocaleString("zh-CN");
		});
		const uptimeText = computed(() => {
			const s = stats.value?.uptimeSeconds;
			if (s === null || s === void 0 || s < 0) return "—";
			const total = Math.floor(s);
			if (total < 60) return `${total} 秒`;
			const minutes = Math.floor(total / 60);
			if (minutes < 60) return `${minutes} 分钟`;
			const hours = Math.floor(minutes / 60);
			if (hours < 48) return `${hours} 小时 ${minutes % 60} 分`;
			return `${Math.floor(hours / 24)} 天 ${hours % 24} 小时`;
		});
		const rows = computed(() => [
			{
				label: "慢查询数",
				value: numberText(stats.value?.slowQueries),
				hint: "服务器启动以来的累计慢查询数",
				mono: true,
				isEmpty: stats.value?.slowQueries === null || stats.value?.slowQueries === void 0
			},
			{
				label: "活跃线程",
				value: numberText(stats.value?.threadsRunning),
				hint: "正在执行的线程数，MySQL 侧负载的近似指标",
				mono: true,
				isEmpty: stats.value?.threadsRunning === null || stats.value?.threadsRunning === void 0
			},
			{
				label: "当前连接",
				value: numberText(props.latest?.connectionCount),
				hint: "本次采样时的客户端连接数",
				mono: true,
				isEmpty: props.latest?.connectionCount === null || props.latest?.connectionCount === void 0
			},
			{
				label: "峰值连接",
				value: numberText(stats.value?.maxUsedConnections),
				hint: "服务器历史峰值客户端连接数",
				mono: true,
				isEmpty: stats.value?.maxUsedConnections === null || stats.value?.maxUsedConnections === void 0
			},
			{
				label: "平均 QPS",
				value: avgQps.value,
				hint: "开机累计提问次数 ÷ 已运行秒数",
				mono: true,
				isEmpty: stats.value?.questions === null || stats.value?.questions === void 0
			},
			{
				label: "运行时长",
				value: uptimeText.value,
				hint: "服务器本次启动后的运行时间",
				mono: false,
				isEmpty: stats.value?.uptimeSeconds === null || stats.value?.uptimeSeconds === void 0
			}
		]);
		const nginxRows = computed(() => {
			const top = nginxTop.value;
			const errs = top ? (top.clientErrors ?? 0) + (top.serverErrors ?? 0) : null;
			const errorRate = top?.total ? Math.round(errs / top.total * 1e3) / 10 : null;
			return [
				{
					label: "URL 请求",
					value: numberText(top?.total),
					hint: "本次扫描成功解析的访问日志行数",
					mono: true,
					isEmpty: top === null
				},
				{
					label: "4xx",
					value: numberText(top?.clientErrors),
					hint: "客户端错误请求数",
					mono: true,
					isEmpty: top === null
				},
				{
					label: "5xx",
					value: numberText(top?.serverErrors),
					hint: "服务端错误请求数",
					mono: true,
					isEmpty: top === null
				},
				{
					label: "独立 IP",
					value: numberText(top?.uniqueIps),
					hint: "本次扫描覆盖到的独立客户端 IP 总数",
					mono: true,
					isEmpty: top === null
				},
				{
					label: "出站流量",
					value: formatSize(top?.bytesSent),
					hint: "access log 中 $body_bytes_sent 之和（响应体字节）",
					mono: true,
					isEmpty: top === null || top?.bytesSent === null
				},
				{
					label: "错误率",
					value: errorRate === null ? "—" : `${errorRate}%`,
					hint: "（4xx + 5xx）÷ 成功解析行数",
					mono: true,
					isEmpty: errorRate === null
				}
			];
		});
		return (_ctx, _cache) => {
			return openBlock(), createElementBlock("div", _hoisted_1$1, [createBaseVNode("header", _hoisted_2$1, [
				_cache[0] || (_cache[0] = createBaseVNode("h3", { class: "ds-server-stats__title" }, "其它信息", -1)),
				isNginx.value ? (openBlock(), createElementBlock("button", {
					key: 0,
					type: "button",
					class: "ds-server-stats__refresh",
					disabled: nginxLoading.value,
					title: nginxLoading.value ? "统计访问日志中" : "刷新 URL 指标",
					onClick: loadNginxUrlStats
				}, [createBaseVNode("span", { class: normalizeClass(["ds-server-stats__refresh-icon", { "is-spinning": nginxLoading.value }]) }, "↻", 2)], 8, _hoisted_3$1)) : createCommentVNode("", true),
				createBaseVNode("span", { class: normalizeClass(["ds-server-stats__tag", {
					"is-live": hasStats.value,
					"is-waiting": isWaiting.value
				}]) }, toDisplayString(tagText.value), 3)
			]), isJdbcMysql.value ? (openBlock(), createElementBlock(Fragment, { key: 0 }, [createBaseVNode("dl", _hoisted_4$1, [(openBlock(true), createElementBlock(Fragment, null, renderList(rows.value, (row) => {
				return openBlock(), createElementBlock("div", {
					key: row.label,
					class: "ds-server-stats__item",
					title: row.hint
				}, [createBaseVNode("dt", null, toDisplayString(row.label), 1), createBaseVNode("dd", { class: normalizeClass({
					mono: row.mono,
					"is-empty": row.isEmpty
				}) }, toDisplayString(row.value), 3)], 8, _hoisted_5$1);
			}), 128))]), !hasStats.value ? (openBlock(), createElementBlock("p", _hoisted_6$1, " MySQL 不暴露宿主机 CPU，这里用活跃线程反映 SQL 侧负载 ")) : createCommentVNode("", true)], 64)) : isNginx.value ? (openBlock(), createElementBlock(Fragment, { key: 1 }, [createBaseVNode("dl", _hoisted_7$1, [(openBlock(true), createElementBlock(Fragment, null, renderList(nginxRows.value, (row) => {
				return openBlock(), createElementBlock("div", {
					key: row.label,
					class: "ds-server-stats__item",
					title: row.hint
				}, [createBaseVNode("dt", null, toDisplayString(row.label), 1), createBaseVNode("dd", { class: normalizeClass({
					mono: row.mono,
					"is-empty": row.isEmpty
				}) }, toDisplayString(row.value), 3)], 8, _hoisted_8$1);
			}), 128))]), nginxTop.value?.paths?.length ? (openBlock(), createElementBlock("div", _hoisted_9$1, [
				createBaseVNode("div", _hoisted_10$1, [_cache[1] || (_cache[1] = createTextVNode("URL Top ", -1)), createBaseVNode("span", null, "· 日志尾部 " + toDisplayString(numberText(nginxTop.value.scanned)) + " 行", 1)]),
				createBaseVNode("ol", _hoisted_11$1, [(openBlock(true), createElementBlock(Fragment, null, renderList(nginxTop.value.paths.slice(0, 5), (p) => {
					return openBlock(), createElementBlock("li", {
						key: p.key,
						class: "ds-server-stats__url-item"
					}, [createBaseVNode("span", {
						class: "ds-server-stats__url-key mono",
						title: p.key
					}, toDisplayString(p.key), 9, _hoisted_12$1), createBaseVNode("span", _hoisted_13$1, [createTextVNode(toDisplayString(p.hits.toLocaleString("zh-CN")), 1), createBaseVNode("i", null, toDisplayString(pctOfTop(p.hits)) + "%", 1)])]);
				}), 128))]),
				nginxTop.value.message ? (openBlock(), createElementBlock("p", _hoisted_14$1, toDisplayString(nginxTop.value.message), 1)) : createCommentVNode("", true)
			])) : nginxLoading.value ? (openBlock(), createElementBlock("p", _hoisted_15$1, "正在统计访问日志…")) : nginxError.value ? (openBlock(), createElementBlock("p", _hoisted_16$1, toDisplayString(nginxError.value), 1)) : (openBlock(), createElementBlock("p", _hoisted_17$1, "暂无 URL 访问统计"))], 64)) : (openBlock(), createElementBlock("p", _hoisted_18$1, toDisplayString(unsupportedText.value), 1))]);
		};
	}
}), [["__scopeId", "data-v-e0a5b6c6"]]);
//#endregion
//#region ../../pages/datasource/src/datasourceStatus.ts
/**
* 启用口径：`status` 为 0 表示停用，其余（含 null 未标注）视为启用。
*
* <p>与 API 层保持一致（见 `api/index.ts` 的 `fetchDatasourceOptions`）。</p>
*
* @param item 数据源
* @returns 启用返回 true
*/
var isEnabled = (item) => item.status !== 0;
/**
* 异常口径：启用且最近一次连通性测试**失败**。
*
* <p>`lastTestOk` 的三态语义：`1` 连通、`0` 失败、`null` 从未测试。
* 只有 `0` 能证明「测过且没连上」；把 `null` 也算异常会把「没测过」误报成「故障」。</p>
*
* @param item 数据源
* @returns 异常返回 true
*/
var isAbnormal = (item) => isEnabled(item) && item.lastTestOk === 0;
/**
* 在线口径：启用且不异常。
*
* <p>把「测过并失败」的从在线里剔除，在线 / 异常 / 离线三类互斥，
* 左栏三个计数才可加、不会出现「在线 3 异常 1 全部 3」这种对不上的数。</p>
*
* @param item 数据源
* @returns 在线返回 true
*/
var isOnline = (item) => isEnabled(item) && !isAbnormal(item);
/**
* 离线口径：停用。
*
* @param item 数据源
* @returns 离线返回 true
*/
var isOffline = (item) => !isEnabled(item);
/**
* 判断一条数据源是否匹配给定的状态过滤键。
*
* @param item 数据源
* @param key  过滤键
* @returns 匹配返回 true
*/
var matchStatusKey = (item, key) => {
	if (key === "online") return isOnline(item);
	if (key === "abnormal") return isAbnormal(item);
	if (key === "offline") return isOffline(item);
	return true;
};
/**
* 关键词匹配：名称 / 类型 / 地址 / 备注，大小写不敏感；空关键词视为全部匹配。
*
* @param item    数据源
* @param keyword 关键词
* @returns 匹配返回 true
*/
var matchKeyword = (item, keyword) => {
	const key = keyword.trim().toLowerCase();
	if (!key) return true;
	return [
		item.name,
		item.type,
		item.host,
		item.remark
	].filter((value) => value != null && value !== "").some((value) => String(value).toLowerCase().includes(key));
};
/**
* 左栏列表派生：状态过滤 + 关键词过滤。
*
* @param list      全量数据源
* @param statusKey 状态过滤键
* @param keyword   关键词
* @returns 过滤后的列表
*/
var filterDataSources = (list, statusKey, keyword) => list.filter((item) => matchStatusKey(item, statusKey) && matchKeyword(item, keyword));
/**
* 各状态计数（互斥，可加）。
*
* @param list 全量数据源
* @returns 四个口径的数量
*/
var statusCounts = (list) => ({
	all: list.length,
	online: list.filter(isOnline).length,
	abnormal: list.filter(isAbnormal).length,
	offline: list.filter(isOffline).length
});
//#endregion
//#region ../../pages/datasource/src/managerRoutes.ts
/**
* 归一化路径用于比较。
*
* <p>业务路由是通过 {@code addRoute("layout", route)} 挂到布局下的（见
* {@code turbo/app/src/createVueApp.ts} 的 {@code registerRoutesUnderLayout}），
* 子路由若写成绝对路径 {@code /prometheus}，而别处写成 {@code prometheus/}
* 或多一个尾斜杠，直接用 {@code ===} 比就会得出「没注册」的结论。
* 比较前统一去掉首尾斜杠与重复斜杠。</p>
*
* @param p 路径
* @returns 归一化结果
*/
function normalizeRoutePath(p) {
	const trimmed = (p ?? "").trim().replace(/\/{2,}/g, "/");
	const noTail = trimmed.length > 1 ? trimmed.replace(/\/+$/, "") : trimmed;
	return noTail.startsWith("/") ? noTail : `/${noTail}`;
}
/**
* 当前应用是否注册了某条路径。
*
* @param router 路由实例
* @param path   目标路径
* @returns 是否已注册
*/
function hasRoutePath(router, path) {
	const want = normalizeRoutePath(path);
	return router.getRoutes().some((r) => normalizeRoutePath(r.path) === want);
}
/**
* 找出与目标路径最接近的已注册路径，用于失败提示。
*
* <p>只取同一层的第一段相同者（例如目标是 {@code /prometheus} 就找所有
* {@code /prometheus*}），并且最多给 5 条：提示是用来定位的，不是用来刷屏的。</p>
*
* @param router 路由实例
* @param path   目标路径
* @returns 候选路径（可能为空）
*/
function nearbyRoutePaths(router, path) {
	const want = normalizeRoutePath(path);
	const first = want.split("/")[1] ?? "";
	const out = [];
	for (const r of router.getRoutes()) {
		const p = normalizeRoutePath(r.path);
		if (p === want) continue;
		if (first && p.split("/")[1] === first) {
			out.push(r.path);
			if (out.length >= 5) break;
		}
	}
	return out;
}
//#endregion
//#region ../../pages/datasource/src/views/ScDataSourceView.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1 = { class: "ds" };
var _hoisted_2 = { class: "ds-layout" };
var _hoisted_3 = { class: "ds-side" };
var _hoisted_4 = { class: "ds-side-card" };
var _hoisted_5 = { class: "ds-status" };
var _hoisted_6 = ["onClick"];
var _hoisted_7 = { class: "ds-status__label" };
var _hoisted_8 = {
	key: 0,
	class: "ds-status__count"
};
var _hoisted_9 = { class: "ds-side__list" };
var _hoisted_10 = {
	key: 0,
	class: "ds-side__hint"
};
var _hoisted_11 = ["onClick", "onContextmenu"];
var _hoisted_12 = { class: "ds-item__body" };
var _hoisted_13 = { class: "ds-item__row" };
var _hoisted_14 = ["title"];
var _hoisted_15 = { class: "ds-item__addr mono" };
var _hoisted_16 = ["title"];
var _hoisted_17 = { class: "ds-main" };
var _hoisted_18 = { class: "ds-main-card" };
var _hoisted_19 = { class: "ds-head" };
var _hoisted_20 = { class: "ds-head__top" };
var _hoisted_21 = { class: "ds-crumb" };
var _hoisted_22 = { class: "ds-head__row" };
var _hoisted_23 = { class: "ds-head__main" };
var _hoisted_24 = ["title"];
var _hoisted_25 = { class: "ds-head__actions" };
var _hoisted_26 = { class: "ds-overview" };
var _hoisted_27 = { class: "ds-stats" };
var _hoisted_28 = { class: "ds-overview-grid" };
var _hoisted_29 = { class: "ds-overview-left" };
var _hoisted_30 = { class: "ds-panel ds-panel--trend" };
var _hoisted_31 = { class: "ds-panel__head" };
var _hoisted_32 = { class: "ds-panel__legend" };
var _hoisted_33 = { class: "ds-legend ds-legend--muted" };
var _hoisted_34 = { class: "ds-trend" };
var _hoisted_35 = { class: "ds-panel ds-panel--server-stats" };
var _hoisted_36 = { class: "ds-panel" };
var _hoisted_37 = { class: "ds-kv" };
var _hoisted_38 = { class: "ds-kv__label" };
var _hoisted_39 = { class: "ds-panel__actions" };
var _hoisted_40 = { class: "ds-panel" };
var _hoisted_41 = { class: "ds-kv" };
var _hoisted_42 = { class: "ds-kv__label" };
var _hoisted_43 = { class: "ds-panel" };
var _hoisted_44 = {
	key: 0,
	class: "ds-placeholder-text"
};
var _hoisted_45 = { class: "ds-tunnel-row" };
var _hoisted_46 = { class: "ds-tunnel-row" };
var _hoisted_47 = { class: "ds-tunnel-row" };
var _hoisted_48 = { class: "ds-tunnel-actions" };
var _hoisted_49 = {
	key: 1,
	class: "ds-tunnel-id mono"
};
var _hoisted_50 = { class: "ds-create" };
var _hoisted_51 = { class: "ds-create__side" };
var _hoisted_52 = { class: "ds-create__search" };
var _hoisted_53 = { class: "ds-create__types" };
var _hoisted_54 = ["data-testid", "onClick"];
var _hoisted_55 = { class: "ds-type-item__label" };
var _hoisted_56 = {
	key: 0,
	class: "ds-create__none"
};
var _hoisted_57 = { class: "ds-create__main" };
var _hoisted_58 = { class: "ds-create__head" };
var _hoisted_59 = { class: "ds-create__heading" };
var _hoisted_60 = { class: "ds-create__name" };
var _hoisted_61 = { class: "ds-create__desc" };
var _hoisted_62 = { class: "ds-create__badge" };
var _hoisted_63 = { class: "ds-driver-jar" };
var _hoisted_64 = { class: "ds-xparam" };
var _hoisted_65 = { class: "ds-xparam__foot" };
var _hoisted_66 = {
	key: 1,
	class: "ds-control-hint"
};
var _hoisted_67 = {
	key: 2,
	class: "ds-control-hint"
};
var _hoisted_68 = {
	key: 3,
	class: "ds-control-hint"
};
var _hoisted_69 = { class: "ds-create__test" };
var _hoisted_70 = {
	key: 1,
	class: "ds-create__test-hint"
};
var _hoisted_71 = { class: "ds-create__advanced" };
var _hoisted_72 = { class: "ds-schema" };
var _hoisted_73 = { class: "ds-schema__bar" };
var _hoisted_74 = { class: "ds-schema__count" };
var _hoisted_75 = {
	key: 0,
	class: "ds-schema__error"
};
//#endregion
//#region ../../pages/datasource/src/views/ScDataSourceView.vue
var ScDataSourceView_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	__name: "ScDataSourceView",
	props: { extraTabs: { default: () => [] } },
	setup(__props) {
		/**
		* 数据源中心（@pages/datasource）
		*
		* 左右两栏布局：
		*   左栏 —— 状态过滤 + 关键词搜索 + 数据源卡片列表 + 添加入口；
		*   右栏 —— 页头（面包屑 + 搜索 / 刷新 / 新增）+ 详情头 + 页签
		*           （概览 / 连接配置 / 监控指标 / 操作日志）。
		* 支持 JDBC/Redis/InfluxDB/Neo4j/Nacos/ZooKeeper/Nginx：
		* 列表 + 新增/编辑/删除 + 连通性测试 + 表结构浏览 + 按类型跳转对应管理页。
		* 数据来源：后端 spring-support-datasource-hub-starter 的 /ms/datasource/*。
		*
		* 视觉：koi 变量（--el-* / --metric-* / --status-*），颜色全部走令牌，暗色自动适配。
		*
		* @author CH
		* @since 4.0.0.42
		*/
		const props = __props;
		/** 左栏状态过滤键：all 全部 / online 在线 / abnormal 异常 / offline 离线 */
		const router = useRouter();
		const list = ref([]);
		const loading = ref(false);
		const types = ref([]);
		const dialogVisible = ref(false);
		const editing = ref(null);
		const form = ref({});
		const saving = ref(false);
		/** JDBC 驱动 jar 库（后端管理的目录，本页只上传与选用） */
		const driverJars = ref([]);
		/** 隐藏的文件选择 input 的 ref */
		const driverJarInput = ref(null);
		/** 正在上传的 jar 文件名，用于按钮上的等待态 */
		const driverJarUploading = ref(false);
		/** 驱动 jar 下拉项：显示「文件名 + 驱动类」，两者都要能看到 */
		const driverJarOptions = computed(() => driverJars.value.map((jar) => ({
			label: `${jar.jarName} · ${jar.driverClassName}`,
			value: jar.id
		})));
		/**
		* 拉取驱动 jar 列表。
		*
		* <p>失败只提示不打断表单：驱动 jar 是可选增强，拉不到列表不该让人连普通
		* MySQL 数据源都保存不了。</p>
		*/
		const loadDriverJars = async () => {
			try {
				driverJars.value = await fetchJdbcDriverJars();
			} catch (error) {
				message.warning(`读取驱动 jar 列表失败: ${String(error?.message ?? error)}`);
			}
		};
		/**
		* 选了 jar 文件就上传，并自动选中它、把它登记的驱动类名填进表单。
		*
		* <p>自动填驱动类名是因为上传时后端已经校验过这个类能加载，
		* 让用户再手输一遍同一个字符串只会引入不一致。</p>
		*
		* @param event 文件选择事件
		*/
		const onPickDriverJar = async (event) => {
			const input = event.target;
			const file = input.files?.[0];
			input.value = "";
			if (!file) return;
			const driverClass = (form.value.driverClassName ?? "").trim();
			if (!driverClass) {
				message.warning("先填驱动类名，再上传 jar（后端要当场验证这个类能不能加载）");
				return;
			}
			driverJarUploading.value = true;
			try {
				const saved = await uploadJdbcDriverJar(file, driverClass, file.name);
				await loadDriverJars();
				form.value.driverJarId = saved.id;
				form.value.driverClassName = saved.driverClassName;
				message.success(`已上传并选中驱动 ${saved.jarName}`);
			} catch (error) {
				message.error(`上传驱动 jar 失败: ${String(error?.message ?? error)}`);
			} finally {
				driverJarUploading.value = false;
			}
		};
		/** 额外参数行：键为空的行在保存时忽略 */
		const extraParams = ref([]);
		/** 常用 JDBC 连接参数预置（MySQL 系为主，兼顾各库高频项） */
		/**
		* JDBC 连接参数白名单。
		*
		* <p>下拉里的每一项都是**任意 JDBC 驱动都可能认的参数名**，而不是某一个
		* 数据库的专属参数 —— 选驱动与填参数是两件独立的事：同一个 `connectTimeout`
		* MySQL / PostgreSQL / H2 都认，`ssl` 三家都有各自的实现。这里按「通用 / 各家专属」
		* 分组标注，只为让用户知道从哪来，不做按驱动类型过滤（过滤会让换驱动后
		* 之前配好的参数凭空消失，代价大于收益）。</p>
		*
		* <p><b>白名单列不全，所以下拉必须允许自定义</b>：各驱动有大量私有参数
		* （{@code oracle.jdbc.*}、{@code sqlserver.*}、{@code h2.*} 之类），
		* 靠枚举维护既不完整也易过时。故下拉开了 {@code allow-create}，
		* 敲什么就是什么，保存时原样进连接串。</p>
		*/
		const COMMON_JDBC_PARAMS = [
			{
				label: "connectTimeout（连接超时，毫秒）",
				value: "connectTimeout"
			},
			{
				label: "socketTimeout（读超时，毫秒）",
				value: "socketTimeout"
			},
			{
				label: "loginTimeout（登录超时，秒）",
				value: "loginTimeout"
			},
			{
				label: "ssl（是否启用 SSL）",
				value: "ssl"
			},
			{
				label: "sslMode（PG/PG 风格：disable/require/verify-full）",
				value: "sslMode"
			},
			{
				label: "tcpKeepAlive（TCP 保活）",
				value: "tcpKeepAlive"
			},
			{
				label: "applicationName（驱动上报的应用名）",
				value: "ApplicationName"
			},
			{
				label: "currentSchema（当前 schema）",
				value: "currentSchema"
			},
			{
				label: "catalog（默认库）",
				value: "catalog"
			},
			{
				label: "properties（驱动自定义属性容器）",
				value: "properties"
			},
			{
				label: "user（用户名，部分驱动认）",
				value: "user"
			},
			{
				label: "password（密码，部分驱动认）",
				value: "password"
			},
			{
				label: "useSSL（MySQL，常配 false）",
				value: "useSSL"
			},
			{
				label: "serverTimezone（MySQL，如 Asia/Shanghai）",
				value: "serverTimezone"
			},
			{
				label: "characterEncoding（如 utf8 / utf8mb4）",
				value: "characterEncoding"
			},
			{
				label: "useUnicode（常配 true）",
				value: "useUnicode"
			},
			{
				label: "allowPublicKeyRetrieval（常配 true）",
				value: "allowPublicKeyRetrieval"
			},
			{
				label: "rewriteBatchedStatements（批处理重写）",
				value: "rewriteBatchedStatements"
			},
			{
				label: "zeroDateTimeBehavior（如 convertToNull）",
				value: "zeroDateTimeBehavior"
			},
			{
				label: "useInformationSchema（元数据走 information_schema）",
				value: "useInformationSchema"
			},
			{
				label: "useServerPrepStmts（服务端预编译）",
				value: "useServerPrepStmts"
			},
			{
				label: "cachePrepStmts（预编译缓存）",
				value: "cachePrepStmts"
			},
			{
				label: "prepStmtCacheSize（预编译缓存条数）",
				value: "prepStmtCacheSize"
			},
			{
				label: "prepStmtCacheSqlLimit（预编译 SQL 长度上限）",
				value: "prepStmtCacheSqlLimit"
			},
			{
				label: "useLocalSessionState（本地会话状态）",
				value: "useLocalSessionState"
			},
			{
				label: "useLocalTransactionState（本地事务状态）",
				value: "useLocalTransactionState"
			},
			{
				label: "elideSetAutoCommits（省略 setAutoCommit）",
				value: "elideSetAutoCommits"
			},
			{
				label: "autoReconnect（断线重连）",
				value: "autoReconnect"
			},
			{
				label: "tinyInt1isBit（tinyint(1) 映射为布尔）",
				value: "tinyInt1isBit"
			},
			{
				label: "nullCatalogMeansCurrent（常配 true）",
				value: "nullCatalogMeansCurrent"
			},
			{
				label: "allowMultiQueries（多语句）",
				value: "allowMultiQueries"
			},
			{
				label: "useAffectedRows（受影响行数语义）",
				value: "useAffectedRows"
			},
			{
				label: "useCursorFetch（游标分批拉取）",
				value: "useCursorFetch"
			},
			{
				label: "netTimeoutForStreamingResults（大结果集超时）",
				value: "netTimeoutForStreamingResults"
			},
			{
				label: "maxAllowedPacket（单包上限）",
				value: "maxAllowedPacket"
			},
			{
				label: "disableColumnStats（关统计）",
				value: "disableColumnStats"
			},
			{
				label: "cacheServerConfiguration（缓存服务器变量）",
				value: "cacheServerConfiguration"
			},
			{
				label: "maintainTimeStats（不统计维护时间）",
				value: "maintainTimeStats"
			},
			{
				label: "useOldAliasMetadataBehavior（旧别名元数据）",
				value: "useOldAliasMetadataBehavior"
			},
			{
				label: "useConfigs（按 profile 覆盖参数）",
				value: "useConfigs"
			},
			{
				label: "sslmode（PG：disable/allow/prefer/require/verify-ca/verify-full）",
				value: "sslmode"
			},
			{
				label: "sslfactory（PG：org.postgresql.ssl.NonValidatingFactory）",
				value: "sslfactory"
			},
			{
				label: "sslrootcert（PG：CA 证书路径）",
				value: "sslrootcert"
			},
			{
				label: "sslcert（PG：客户端证书）",
				value: "sslcert"
			},
			{
				label: "sslkey（PG：客户端私钥）",
				value: "sslkey"
			},
			{
				label: "sslpassword（PG：私钥口令）",
				value: "sslpassword"
			},
			{
				label: "targetServerType（primary/any）",
				value: "targetServerType"
			},
			{
				label: "loadBalanceHosts（多主机轮询）",
				value: "loadBalanceHosts"
			},
			{
				label: "hostRecheckSeconds（主机存活复查间隔）",
				value: "hostRecheckSeconds"
			},
			{
				label: "connect_timeout（PG 连接超时，秒）",
				value: "connect_timeout"
			},
			{
				label: "options（PG 启动选项）",
				value: "options"
			},
			{
				label: "ApplicationName（PG 侧应用名）",
				value: "pgAppName"
			},
			{
				label: "loggerLevel（驱动日志级别）",
				value: "loggerLevel"
			},
			{
				label: "assumeMinServerVersion（假设的最低服务端版本）",
				value: "assumeMinServerVersion"
			},
			{
				label: "reWriteBatchedInserts（批量插入重写）",
				value: "reWriteBatchedInserts"
			},
			{
				label: "preferQueryMode（simple/extended）",
				value: "preferQueryMode"
			},
			{
				label: "stringtype（string 映射类型）",
				value: "stringtype"
			},
			{
				label: "DateStyle（日期字面量风格）",
				value: "DateStyle"
			},
			{
				label: "TimeZone（会话时区）",
				value: "TimeZone"
			},
			{
				label: "oracle.jdbc.ReadTimeout（Oracle 读超时，毫秒）",
				value: "oracle.jdbc.ReadTimeout"
			},
			{
				label: "oracle.net.CONNECT_TIMEOUT（Oracle 连接超时，毫秒）",
				value: "oracle.net.CONNECT_TIMEOUT"
			},
			{
				label: "oracle.jdbc.defaultNChar（默认 NCHAR）",
				value: "oracle.jdbc.defaultNChar"
			},
			{
				label: "oracle.jdbc.convertNCHARsToNvarchar（NCHAR 转换）",
				value: "oracle.jdbc.convertNCHARsToNvarchar"
			},
			{
				label: "oracle.jdbc.translationVariant（字符集变体）",
				value: "oracle.jdbc.translationVariant"
			},
			{
				label: "oracle.net.encryption_client（Oracle 加密）",
				value: "oracle.net.encryption_client"
			},
			{
				label: "oracle.net.crypto_checksum_client（校验和）",
				value: "oracle.net.crypto_checksum_client"
			},
			{
				label: "oracle.jdbc.fanEnabled（TAF 故障转移）",
				value: "oracle.jdbc.fanEnabled"
			},
			{
				label: "oracle.jdbc.implicitStatementCacheSize（隐式语句缓存）",
				value: "oracle.jdbc.implicitStatementCacheSize"
			},
			{
				label: "encrypt（SQL Server 加密）",
				value: "encrypt"
			},
			{
				label: "trustServerCertificate（信任服务端证书）",
				value: "trustServerCertificate"
			},
			{
				label: "instanceName（命名实例）",
				value: "instanceName"
			},
			{
				label: "databaseName（默认库）",
				value: "databaseName"
			},
			{
				label: "sendTimeAsDatetime（时间按 datetime 发送）",
				value: "sendTimeAsDatetime"
			},
			{
				label: "responseBuffering（响应缓冲）",
				value: "responseBuffering"
			},
			{
				label: "selectMethod（游标/直接）",
				value: "selectMethod"
			},
			{
				label: "failoverPartner（故障转移伙伴）",
				value: "failoverPartner"
			},
			{
				label: "currentSchema（DB2 当前 schema）",
				value: "currentSchemaDB2"
			},
			{
				label: "retrieveMessagesFromServerOnGetMessage（DB2 取服务端消息）",
				value: "retrieveMessagesFromServerOnGetMessage"
			},
			{
				label: "progressiveStreaming（DB2 渐进流式）",
				value: "progressiveStreaming"
			},
			{
				label: "sslConnection（DB2 SSL）",
				value: "sslConnection"
			},
			{
				label: "MODE（H2 兼容模式，如 MySQL/PostgreSQL）",
				value: "MODE"
			},
			{
				label: "DB_CLOSE_DELAY（H2 常开库，-1）",
				value: "DB_CLOSE_DELAY"
			},
			{
				label: "AUTO_SERVER（H2 多进程共享）",
				value: "AUTO_SERVER"
			},
			{
				label: "DATABASE_TO_UPPER（H2 标识符大小写）",
				value: "DATABASE_TO_UPPER"
			},
			{
				label: "CASE_INSENSITIVE_IDENTIFIERS（H2 不敏感标识）",
				value: "CASE_INSENSITIVE_IDENTIFIERS"
			},
			{
				label: "NON_KEYWORDS（H2 非关键字）",
				value: "NON_KEYWORDS"
			},
			{
				label: "IFEXISTS（H2 建表前判存在）",
				value: "IFEXISTS"
			},
			{
				label: "ACCESS_MODE_DATA（H2 内存表模式）",
				value: "ACCESS_MODE_DATA"
			},
			{
				label: "journal_mode（SQLite：WAL/MEMORY）",
				value: "journal_mode"
			},
			{
				label: "synchronous（SQLite 同步级别）",
				value: "synchronous"
			},
			{
				label: "busy_timeout（SQLite 忙等毫秒）",
				value: "busy_timeout"
			},
			{
				label: "cache_size（SQLite 页缓存，KB）",
				value: "cache_size"
			},
			{
				label: "foreign_keys（SQLite 外键开关）",
				value: "foreign_keys"
			}
		];
		/** 下拉选项 = 预置项 + 当前行里未预置的自定义键（编辑整串 URL 时让旧参数可见可选） */
		const extraParamOptions = computed(() => {
			const seen = new Set(COMMON_JDBC_PARAMS.map((p) => p.value));
			const extra = extraParams.value.filter((r) => r.key && !seen.has(r.key)).map((r) => ({
				label: `${r.key}（当前）`,
				value: r.key
			}));
			return [...COMMON_JDBC_PARAMS, ...extra];
		});
		/** 追加一行额外参数 */
		const addExtraParam = () => {
			extraParams.value.push({
				key: "",
				value: ""
			});
		};
		/** 删除一行额外参数 */
		const removeExtraParam = (index) => {
			extraParams.value.splice(index, 1);
		};
		/** 解析整串 JDBC URL 的 query 为编辑行（保持原始文本，不做百分号解码/编码，往返不丢字节） */
		const parseJdbcExtraParams = (url) => {
			const qIndex = url.indexOf("?");
			if (qIndex < 0) return [];
			const rows = [];
			for (const seg of url.slice(qIndex + 1).split("&")) {
				if (!seg) continue;
				const eq = seg.indexOf("=");
				const key = (eq >= 0 ? seg.slice(0, eq) : seg).trim();
				if (!key) continue;
				rows.push({
					key,
					value: eq >= 0 ? seg.slice(eq + 1).trim() : ""
				});
			}
			return rows;
		};
		/** 后端三段式拼装用的默认参数（与 DatasourceServiceImpl.resolveJdbcUrl 同款，并入时不丢） */
		const MYSQL_URL_DEFAULTS = [
			["useUnicode", "true"],
			["characterEncoding", "utf8"],
			["serverTimezone", "Asia/Shanghai"]
		];
		/**
		* 保存前把额外参数并入 form.database（仅 jdbc 类型）。
		*
		* @returns 值非法时为 false，调用方应中止保存
		*/
		const applyJdbcExtraParams = () => {
			if (form.value.type !== "jdbc") return true;
			const rows = extraParams.value.map((r) => ({
				key: (r.key ?? "").trim(),
				value: (r.value ?? "").trim()
			})).filter((r) => r.key !== "");
			if (extraParams.value.some((r) => !(r.key ?? "").trim() && (r.value ?? "").trim() !== "")) {
				message.warning("有一行额外参数只填了值、没选参数名");
				return false;
			}
			const badValue = rows.find((r) => /[&#?\s]/.test(r.value));
			if (badValue) {
				message.warning(`参数 ${badValue.key} 的值里不能有空格或 & ? # 分隔符`);
				return false;
			}
			const badKey = rows.find((r) => /[&#?=\s]/.test(r.key));
			if (badKey) {
				message.warning(`参数名「${badKey.key}」里不能有空格或 & ? # = 分隔符`);
				return false;
			}
			const db = (form.value.database ?? "").trim();
			if (rows.length === 0 && !db.toLowerCase().startsWith("jdbc:")) return true;
			const query = /* @__PURE__ */ new Map();
			let base;
			if (db.toLowerCase().startsWith("jdbc:")) {
				const qIndex = db.indexOf("?");
				base = qIndex >= 0 ? db.slice(0, qIndex) : db;
			} else {
				const host = (form.value.host ?? "").trim();
				if (!host || !db) {
					message.warning("填额外参数时需要主机地址与库名（或直接把完整 JDBC URL 粘进库名）");
					return false;
				}
				base = `jdbc:mysql://${host}:${form.value.port ?? 3306}/${db}`;
				for (const [k, v] of MYSQL_URL_DEFAULTS) query.set(k, v);
			}
			const seenKeys = /* @__PURE__ */ new Set();
			const dupKey = rows.find((r) => seenKeys.has(r.key) ? true : (seenKeys.add(r.key), false));
			if (dupKey) {
				message.warning(`参数「${dupKey.key}」重复填写了，只会保留最后一条`);
				return false;
			}
			for (const r of rows) query.set(r.key, r.value);
			const qs = [...query.entries()].map(([k, v]) => `${k}=${v}`).join("&");
			form.value.database = qs ? `${base}?${qs}` : base;
			return true;
		};
		const testing = ref(null);
		/** 左栏与页头共享的搜索关键词 */
		const keyword = ref("");
		/** 左栏当前状态过滤键 */
		const statusKey = ref("all");
		/** 右栏当前页签 */
		const activeTab = ref("overview");
		/** 当前选中的数据源 ID；未选中时详情回落到列表第一条 */
		const currentId = ref(null);
		/** 概览趋势里的最新采样点，供趋势下方「其它信息」面板展示服务器指标 */
		const latestMetric = ref(null);
		/** 数据源类型图标和语义色（统一走 koi 变量） */
		const TYPE_META = {
			jdbc: {
				icon: "Coin",
				color: "var(--metric-cpu, var(--el-color-primary))",
				label: "JDBC 数据库"
			},
			redis: {
				icon: "Coin",
				color: "var(--metric-redis, var(--el-color-danger))",
				label: "Redis"
			},
			influxdb: {
				icon: "Coin",
				color: "var(--el-color-success)",
				label: "InfluxDB"
			},
			neo4j: {
				icon: "Coin",
				color: "var(--metric-mem, var(--el-color-primary))",
				label: "Neo4j 图数据库"
			},
			nacos: {
				icon: "Coin",
				color: "var(--metric-disk, var(--el-color-warning))",
				label: "Nacos 配置中心"
			},
			zookeeper: {
				icon: "Coin",
				color: "var(--el-color-warning)",
				label: "ZooKeeper"
			},
			kafka: {
				icon: "Coin",
				color: "#333333",
				label: "Kafka"
			},
			nginx: {
				icon: "Connection",
				color: "var(--metric-net, var(--el-color-info))",
				label: "Nginx"
			},
			etcd: {
				icon: "Coin",
				color: "var(--metric-net, var(--el-color-info))",
				label: "etcd 配置中心"
			},
			prometheus: {
				icon: "DataLine",
				color: "#e6522c",
				label: "Prometheus"
			},
			mongodb: {
				icon: "Coin",
				color: "#4DB33D",
				label: "MongoDB"
			},
			elasticsearch: {
				icon: "Coin",
				color: "#00bfb3",
				label: "Elasticsearch"
			}
		};
		const typeMeta = (type) => TYPE_META[type] || {
			icon: "Coin",
			color: "var(--el-text-color-placeholder)",
			label: type
		};
		/** InfluxDB 新增/编辑表单里的版本选项；v2 与 v3 查询语法不通用 */
		const INFLUX_VERSION_OPTIONS = [{
			label: "2.x（Flux / Bucket / Organization）",
			value: "2"
		}, {
			label: "3.x（SQL / InfluxQL / Database）",
			value: "3"
		}];
		/** InfluxDB 版本短标签，用于卡片/详情头 */
		const influxVersionShort = (version) => version === "2" ? "v2" : version === "3" ? "v3" : "";
		/** InfluxDB 版本完整标签，用于连接配置详情 */
		const influxVersionLabel = (version) => version === "2" ? "2.x（Flux / Bucket）" : version === "3" ? "3.x（SQL / InfluxQL / Database）" : version || "未设置";
		/** 数据源类型徽标：InfluxDB 额外显示 v2/v3，避免新增后分不清查询语法 */
		const sourceTypeChip = (item) => {
			const base = item.type.toUpperCase();
			const ver = item.type === "influxdb" ? influxVersionShort(item.version) : "";
			return ver ? `${base} · ${ver}` : base;
		};
		/** 新增/编辑弹窗左侧类型搜索关键词 */
		const typeKeyword = ref("");
		/**
		* 左侧类型面板：按关键词过滤（匹配类型键或中文标签）。
		*
		* <p>搜索框为空时原样返回全部类型，保持与历史下拉一致的完整清单。</p>
		*/
		const filteredTypes = computed(() => {
			const kw = typeKeyword.value.trim().toLowerCase();
			if (!kw) return types.value;
			return types.value.filter((t) => {
				const meta = typeMeta(t);
				return t.toLowerCase().includes(kw) || meta.label.toLowerCase().includes(kw);
			});
		});
		/**
		* 各类型的一句话连接说明（右侧表单头部展示）。
		*
		* @param type 数据源类型键
		* @return 说明文案
		*/
		const typeDesc = (type) => {
			return {
				jdbc: "通过 JDBC 驱动连接关系型数据库（MySQL / PostgreSQL / Oracle / SQL Server / H2 / SQLite 等）",
				redis: "连接 Redis 缓存服务，用于键值读写与监控",
				influxdb: "连接 InfluxDB 时序数据库，新增时选择 v2 或 v3：v2 用 Flux/Bucket，v3 用 SQL/InfluxQL/Database，语法不通用",
				neo4j: "连接 Neo4j 图数据库（HTTP 接口），用于图查询",
				nacos: "连接 Nacos 配置中心，用于配置与服务发现",
				zookeeper: "连接 ZooKeeper 协调服务，用于节点与配置管理",
				kafka: "连接 Kafka 消息队列（Bootstrap 地址），用于 Topic/Partition 与只读查询",
				nginx: "连接 Nginx 服务器，可查看状态并控制进程启停",
				etcd: "连接 etcd 配置中心，用于键值存储",
				prometheus: "连接 Prometheus 监控服务，用于指标查询",
				mongodb: "连接 MongoDB 文档数据库，用于集合查询与文档查看",
				elasticsearch: "连接 Elasticsearch 集群（HTTP 接口），用于索引/字段浏览与只读查询"
			}[type] ?? "填写连接信息以接入该类型的数据源";
		};
		/**
		* 左侧类型面板点选：切换类型并同步默认端口。
		*
		* <p>与历史下拉 @change 口径一致：新建时重置默认端口，编辑时保留原端口。</p>
		*
		* @param t 目标类型键
		*/
		const selectType = (t) => {
			if (form.value.type === t) return;
			form.value.type = t;
			onTypeChange(t);
		};
		/** 弹窗内「测试连接」：仅编辑态（已有 id）可用，新建态需先保存 */
		const dialogTesting = ref(false);
		const dialogTestResult = ref(null);
		/** 弹窗内「高级设置」折叠态（备注等可选字段） */
		const advancedOpen = ref(false);
		/**
		* 弹窗内测试连接。
		*
		* <p>后端连通性测试按已落库的 id 进行（{@code testDataSource(id)}），
		* 新建态还没有 id，故先提示保存；编辑态直接调用并内联展示结果。</p>
		*/
		const testInDialog = async () => {
			const id = editing.value?.id;
			if (id == null) {
				message.info("请先保存数据源，再测试连接");
				return;
			}
			dialogTesting.value = true;
			try {
				const result = await testDataSource(id);
				dialogTestResult.value = result;
				if (result?.success) message.success(result.message || "连接成功");
				else message.error(result?.message || "连接失败");
				await load();
			} catch (e) {
				message.error(`测试失败: ${String(e?.message ?? e)}`);
			} finally {
				dialogTesting.value = false;
			}
		};
		/** 加载数据源列表 */
		const load = async () => {
			loading.value = true;
			try {
				const [data, typeList] = await Promise.all([fetchDataSources(), fetchDataSourceTypes()]);
				list.value = data ?? [];
				types.value = typeList ?? [
					"jdbc",
					"redis",
					"influxdb",
					"neo4j",
					"nacos",
					"zookeeper",
					"kafka",
					"elasticsearch"
				];
			} catch (e) {
				message.error(`加载失败: ${String(e?.message ?? e)}`);
			} finally {
				loading.value = false;
			}
		};
		/** 打开新增弹窗 */
		const openCreate = () => {
			editing.value = null;
			form.value = {
				type: "jdbc",
				name: "",
				host: "127.0.0.1",
				port: 3306,
				username: "",
				password: "",
				database: "",
				remark: "",
				version: "",
				controlMode: "",
				controlTarget: ""
			};
			extraParams.value = [];
			advancedOpen.value = false;
			dialogTestResult.value = null;
			loadDriverJars();
			dialogVisible.value = true;
		};
		/** 打开编辑弹窗 */
		const openEdit = (item) => {
			editing.value = item;
			form.value = { ...item };
			const dbText = typeof item.database === "string" ? item.database.trim() : "";
			extraParams.value = item.type === "jdbc" && dbText.toLowerCase().startsWith("jdbc:") ? parseJdbcExtraParams(dbText) : [];
			loadDriverJars();
			advancedOpen.value = false;
			dialogTestResult.value = null;
			dialogVisible.value = true;
		};
		/** 保存 */
		const save = async () => {
			if (!form.value.name?.trim()) {
				message.warning("请输入数据源名称");
				return;
			}
			if (!form.value.type) {
				message.warning("请选择数据源类型");
				return;
			}
			if (form.value.type === "influxdb" && !editing.value && !form.value.version) {
				message.warning("请选择 InfluxDB 版本（2.x Flux / 3.x SQL）");
				return;
			}
			if (!applyJdbcExtraParams()) return;
			saving.value = true;
			try {
				if (editing.value) {
					if (editing.value.id == null) {
						message.warning("数据源缺少 ID，无法更新");
						return;
					}
					await updateDataSource(editing.value.id, form.value);
					message.success("更新成功");
				} else {
					await createDataSource(form.value);
					message.success("创建成功");
				}
				dialogVisible.value = false;
				await load();
			} catch (e) {
				message.error(`保存失败: ${String(e?.message ?? e)}`);
			} finally {
				saving.value = false;
			}
		};
		/** 删除 */
		const remove = async (item) => {
			try {
				await ElMessageBox.confirm(`确定删除数据源 "${item.name}" 吗？`, "删除确认", { type: "warning" });
			} catch {
				return;
			}
			try {
				if (item.id == null) {
					message.warning("数据源缺少 ID，无法删除");
					return;
				}
				await deleteDataSource(item.id);
				message.success("删除成功");
				await load();
			} catch (e) {
				message.error(`删除失败: ${String(e?.message ?? e)}`);
			}
		};
		/** 卡片「更多」命令分发（收敛次要操作：浏览表结构 / 编辑 / 删除） */
		const runCardCommand = (cmd, item) => {
			if (cmd === "schema") {
				openSchema(item);
				return;
			}
			if (cmd === "edit") {
				openEdit(item);
				return;
			}
			if (cmd === "delete") remove(item);
		};
		/** 左栏项右侧状态点：口径与上面状态过滤完全一致（../datasourceStatus 纯函数） */
		const datasourceStatusKeyOf = (item) => isAbnormal(item) ? "abnormal" : isEnabled(item) ? "online" : "offline";
		const STATUS_TEXT = {
			online: "在线",
			abnormal: "异常",
			offline: "离线"
		};
		const datasourceStatusTextOf = (item) => STATUS_TEXT[datasourceStatusKeyOf(item)] ?? "-";
		/** 右键菜单挂的目标项：菜单项闭包都基于它，弹出期间不换目标 */
		const ctxMenu = reactive({
			visible: false,
			x: 0,
			y: 0,
			item: null
		});
		const ctxMenuItems = [
			{
				key: "manage",
				label: "打开管理",
				icon: "View"
			},
			{
				key: "edit",
				label: "编辑数据源",
				icon: "EditPen"
			},
			{
				key: "delete",
				label: "删除数据源",
				icon: "Delete",
				danger: true,
				divided: true
			}
		];
		/**
		* 在数据源项上右键。
		* 顺手选中该项：菜单操作的是「被右键的那一项」，若右击 A 却作用在当前选中的 B 上，
		* 删除类操作会直接删错对象 —— 这是列表右键最常见的事故。
		*/
		const onItemContextMenu = (e, item) => {
			e.stopPropagation();
			selectSource(item);
			Object.assign(ctxMenu, {
				visible: true,
				x: e.clientX,
				y: e.clientY,
				item
			});
		};
		const onItemMenuSelect = (key) => {
			const item = ctxMenu.item;
			ctxMenu.item = null;
			if (!item) return;
			if (key === "manage") {
				openManager(item);
				return;
			}
			if (key === "edit") {
				openEdit(item);
				return;
			}
			if (key === "delete") remove(item);
		};
		const schemaVisible = ref(false);
		const schemaError = ref(null);
		const schemaSourceId = ref(null);
		const schemaSourceName = ref("");
		const schemaTable = ref("");
		/** 当前聚焦的字段：只用于在列结构里定位到某一个字段，不参与建表 */
		const schemaColumn = ref("");
		const schemaTables = ref([]);
		const schemaColumns = ref([]);
		/** 表下拉实例：刷新按钮靠它重拉表清单 */
		const schemaTablePicker = ref(null);
		/** 打开某数据源的表结构浏览 */
		const openSchema = async (item) => {
			if (item.id == null) {
				message.warning("数据源缺少 ID，无法浏览表结构");
				return;
			}
			schemaSourceId.value = item.id;
			schemaSourceName.value = item.name;
			schemaTable.value = "";
			schemaTables.value = [];
			schemaColumns.value = [];
			schemaError.value = null;
			schemaVisible.value = true;
		};
		/**
		* 表清单到达：默认选第一张表，省掉用户先点一次下拉才能看到列。
		*
		* <p>只在「还没选过」时自动选；用户主动清空后再回调不应该又替他选回来。</p>
		*/
		const onSchemaTables = (rows) => {
			schemaTables.value = rows;
			if (!schemaTable.value && rows.length) schemaTable.value = rows[0].name;
		};
		/** 列元数据到达 */
		const onSchemaColumns = (rows) => {
			schemaColumns.value = rows;
		};
		/** 取数失败：说清楚原因，别让空表格被当成「这张表没有列」 */
		const onSchemaError = (message) => {
			schemaError.value = message;
			schemaTables.value = [];
			schemaColumns.value = [];
		};
		/** 手动刷新表清单 */
		const refreshSchemaTables = () => {
			schemaError.value = null;
			schemaTablePicker.value?.reload();
		};
		/** 列元数据表格列定义 */
		const schemaColumnDefs = computed(() => [
			{
				prop: "position",
				label: "#",
				width: 60,
				align: "center"
			},
			{
				prop: "name",
				label: "列名",
				minWidth: 160
			},
			{
				prop: "typeName",
				label: "类型",
				width: 140
			},
			{
				prop: "size",
				label: "长度",
				width: 80,
				align: "center"
			},
			{
				prop: "nullable",
				label: "可空",
				width: 90,
				slot: "nullable",
				align: "center"
			},
			{
				prop: "primaryKey",
				label: "主键",
				width: 80,
				slot: "primaryKey",
				align: "center"
			}
		]);
		/** 测试连接 */
		const test = async (item) => {
			if (item.id == null) {
				message.warning("数据源缺少 ID，无法测试");
				return;
			}
			testing.value = item.id;
			try {
				const result = await testDataSource(item.id);
				await load();
				if (result?.success) {
					const detail = describeLatency(result);
					message.success(detail ? `${result.message || "连接成功"}（${detail}）` : result.message || "连接成功");
				} else message.error(result?.message || "连接失败");
			} catch (e) {
				message.error(`测试失败: ${String(e?.message ?? e)}`);
			} finally {
				testing.value = null;
			}
		};
		/** 把测试结果里的两个延迟拼成一句可读文本 */
		function describeLatency(result) {
			const parts = [];
			if (typeof result?.connectLatencyMs === "number") parts.push(`连接 ${formatDuration(costMs(result.connectLatencyMs))}`);
			if (typeof result?.sessionLatencyMs === "number") parts.push(`会话 ${formatDuration(costMs(result.sessionLatencyMs))}`);
			return parts.join(" / ");
		}
		/**
		* 打开对应类型的管理页面。
		*
		* <p>类型→路径的映射（{@code managerRouteFor}）与这些路径的路由声明（{@code routes.ts}）
		* 同出一处：映射写在本包、路由也由本包的 {@code createDatasourceManageRoutes} 产出，
		* 宿主只做合并。两处一旦分开声明就会漂 —— 历史上正是宿主各抄一份、漏了 Prometheus，
		* 导致「打开管理」对 Prometheus 稳定报「未注册」。</p>
		*
		* <p>宿主**不一定**注册了全部管理页（单宿主应用只 merge 自己需要的那些），
		* 没注册时**不能硬跳** —— 2026-10-05 实测落 /404?datasourceId=1。
		* 这里先查当前路由表，没有就给提示，不产生 404。</p>
		*
		* <p><strong>提示必须自带定位信息</strong>：只说「未注册 /prometheus 管理页」，
		* 这句话在「路由真的没有」和「路由有但路径写法不一致」两种情况下长得一模一样，
		* 而两者的修法完全不同。失败时把同前缀的已注册路径一并报出来（见 {@link managerRoutes}）。</p>
		*/
		const openManager = (item) => {
			const route = managerRouteFor(item.type);
			if (!route) {
				message.warning(`类型 ${item.type} 的管理页面开发中`);
				return;
			}
			if (!hasRoutePath(router, route)) {
				const near = nearbyRoutePaths(router, route);
				message.warning(`当前应用未注册 ${route} 管理页，无法打开「${item.type}」管理界面` + (near.length ? `（已注册的同前缀路由：${near.join("、")}）` : ""));
				return;
			}
			router.push({
				path: route,
				query: { datasourceId: item.id }
			});
		};
		/**
		* nginx 进程控制方式选项。
		*
		* <p>空串代表「自动探测」，与后端 {@code datasource_control_mode} 为空时的语义一致
		* （即本字段引入前的行为）。刻意不叫「自动」两个字：它是缺省值而非一个独立能力，
		* 叫「自动」会让人以为存在一个会主动猜测的实现。</p>
		*/
		const controlModeOptions = [
			{
				label: "自动探测",
				value: ""
			},
			{
				label: "systemd 托管（systemctl 启停）",
				value: "systemd"
			},
			{
				label: "本地目录（nginx -s 与裸启动）",
				value: "local"
			}
		];
		/** 根据类型显示默认端口 */
		const defaultPort = (type) => {
			return {
				jdbc: 3306,
				redis: 6379,
				influxdb: 8086,
				neo4j: 7474,
				nacos: 8848,
				zookeeper: 2181,
				kafka: 9092,
				nginx: 80,
				etcd: 2379,
				prometheus: 9090,
				mongodb: 27017,
				elasticsearch: 9200
			}[type] ?? 3306;
		};
		/** 类型变化时更新默认端口 */
		const onTypeChange = (type) => {
			if (!editing.value) form.value.port = defaultPort(type);
		};
		/** 当前选中的数据源；未显式选择或所选项已不存在时回落到第一条 */
		const current = computed(() => {
			if (!list.value.length) return null;
			return list.value.find((item) => item.id === currentId.value) ?? list.value[0];
		});
		/** 左栏数据源列表：状态过滤 + 关键词过滤（口径见 ../datasourceStatus） */
		const filteredList = computed(() => filterDataSources(list.value, statusKey.value, keyword.value));
		/** 左栏状态过滤项与计数；三类互斥可加（online + abnormal + offline === all） */
		const statusFilters = computed(() => {
			const counts = statusCounts(list.value);
			return [
				{
					key: "all",
					label: "全部",
					color: "var(--brand-500, var(--el-color-primary))",
					count: counts.all
				},
				{
					key: "online",
					label: "在线",
					color: "var(--status-success, var(--el-color-success))",
					count: counts.online
				},
				{
					key: "abnormal",
					label: "异常",
					color: "var(--status-warning, var(--el-color-warning))",
					count: counts.abnormal
				},
				{
					key: "offline",
					label: "离线",
					color: "var(--status-error, var(--el-color-danger))",
					count: counts.offline
				}
			];
		});
		/**
		* 「操作日志」页签入口开关。
		*
		* <p>操作日志的落库与查询链路（后端 DatasourceOperLogController + 前端面板）已就位，
		* 但还没在验收环境端到端跑通，按约定**先做功能、不露入口**：置 false 时页签条上
		* 不出现该项，概览里的「查看操作日志」按钮一并隐藏，避免留下一个点了没反应的入口。
		* 验收通过后把这里改成 true 即两处一起放开。</p>
		*/
		const tabItems = computed(() => [
			{
				name: "overview",
				label: "概览"
			},
			{
				name: "connection",
				label: "连接配置"
			},
			{
				name: "tunnel",
				label: "SSH 隧道"
			},
			{
				name: "metrics",
				label: "监控指标"
			},
			...[],
			...props.extraTabs
		]);
		/** 概览「运行状态」卡片文案：与左栏三态口径同源（正常 / 异常 / 已停用） */
		const runtimeText = computed(() => {
			const item = current.value;
			if (!item) return "—";
			if (isAbnormal(item)) return "异常";
			return isEnabled(item) ? "正常" : "已停用";
		});
		/** 详情头状态徽标文案：与左栏三态口径同源（在线 / 异常 / 已停用） */
		const detailBadgeText = computed(() => {
			const item = current.value;
			if (!item) return "—";
			if (isAbnormal(item)) return "异常";
			return isEnabled(item) ? "在线" : "已停用";
		});
		/** 详情头状态徽标样式：is-on 在线 / is-warn 异常 / is-off 已停用 */
		const detailBadgeClass = computed(() => {
			const item = current.value;
			if (!item) return "is-off";
			if (isAbnormal(item)) return "is-warn";
			return isEnabled(item) ? "is-on" : "is-off";
		});
		/** 毫秒数转卡片文案；无值时统一显示占位符，避免出现 0ms 误导 */
		function formatLatency(value) {
			const cost = costMs(value);
			return cost == null ? "—" : formatDuration(cost);
		}
		/** 连接延迟卡片值：后端点「测试连接」时回写台账 */
		const connectLatencyText = computed(() => formatLatency(current.value?.connectLatencyMs));
		/** 会话延迟卡片值 */
		const sessionLatencyText = computed(() => formatLatency(current.value?.sessionLatencyMs));
		/** 趋势面板图例里的「平均 xx ms」：目前后端只回写最近一次探测值，平均即当前值 */
		const latencyLegendText = computed(() => {
			const v = current.value?.connectLatencyMs;
			return typeof v === "number" ? `${v}ms` : "-";
		});
		/** 最后检测时间卡片文案：取后端回写的测试时间，而不是前端硬编码「刚刚」 */
		const lastTestText = computed(() => {
			const raw = current.value?.lastTestTime;
			if (!raw) return "未测试";
			const at = new Date(raw);
			if (Number.isNaN(at.getTime())) return "未测试";
			return at.toLocaleString("zh-CN", { hour12: false });
		});
		/** 地址展示：host(:port)；缺省时回落占位符 */
		const formatAddress = (item) => {
			if (!item.host) return "—";
			return item.port != null ? `${item.host}:${item.port}` : item.host;
		};
		/** 概览「连接配置」键值行（地址 / 配置路径 / 用户 / 备注 / 来源类型） */
		const configRows = computed(() => {
			const item = current.value;
			if (!item) return [];
			return [
				{
					label: "地址",
					value: formatAddress(item),
					mono: true
				},
				{
					label: "版本",
					value: item.type === "influxdb" ? influxVersionLabel(item.version) : "—",
					mono: false
				},
				{
					label: "配置路径",
					value: item.database || "—",
					mono: true
				},
				{
					label: "用户",
					value: item.username || "—",
					mono: false
				},
				{
					label: "备注",
					value: item.remark || "—",
					mono: false
				},
				{
					label: "来源类型",
					value: typeMeta(item.type).label,
					mono: false
				}
			];
		});
		/** 「连接配置」页签的完整参数行（只用现有字段，不新造接口） */
		const connectionRows = computed(() => {
			const item = current.value;
			if (!item) return [];
			return [
				{
					label: "数据源 ID",
					value: item.id != null ? String(item.id) : "—",
					mono: true
				},
				{
					label: "地址",
					value: formatAddress(item),
					mono: true
				},
				{
					label: "版本",
					value: item.type === "influxdb" ? influxVersionLabel(item.version) : "—",
					mono: false
				},
				{
					label: "配置路径",
					value: item.database || "—",
					mono: true
				},
				{
					label: "用户",
					value: item.username || "—",
					mono: false
				},
				{
					label: "驱动类",
					value: item.driverClassName || "—",
					mono: true
				},
				{
					label: "状态",
					value: item.status === 0 ? "已停用" : "启用",
					mono: false
				},
				{
					label: "备注",
					value: item.remark || "—",
					mono: false
				},
				{
					label: "创建时间",
					value: item.createTime || "—",
					mono: true
				},
				{
					label: "更新时间",
					value: item.updateTime || "—",
					mono: true
				}
			];
		});
		/** 左栏选中数据源（按 id 定位，列表刷新后仍能保持选中） */
		const selectSource = (item) => {
			currentId.value = item.id ?? null;
		};
		/**
		* 头部「更多」命令分发。
		*
		* 头部合并了原先的「面包屑行」与「详情头卡」，两处的操作都收进这一个下拉：
		* - refresh：页面级（刷新列表），未选中数据源时也要可用
		* - schema / edit / delete：依赖选中项，交给既有的 runCardCommand 复用
		*/
		const runHeadCommand = (cmd) => {
			if (cmd === "refresh") {
				load();
				return;
			}
			if (!current.value) return;
			runCardCommand(cmd, current.value);
		};
		/** 隧道表单：字段与后端 DataSourceTunnelDTO 一一对应 */
		const emptyTunnel = () => ({
			id: null,
			name: "",
			type: "LOCAL",
			sshHost: "",
			sshPort: 22,
			sshUsername: "",
			sshAuthType: "PASSWORD",
			sshPassword: "",
			sshPrivateKey: "",
			sshPassphrase: "",
			localPort: null,
			remoteHost: "",
			remotePort: null,
			bindAddress: "",
			status: 0
		});
		const tunnel = ref(emptyTunnel());
		const tunnelLoading = ref(false);
		const tunnelSaving = ref(false);
		const TUNNEL_TYPES = [
			{
				label: "本地转发 (-L)",
				value: "LOCAL"
			},
			{
				label: "反向转发 (-R)",
				value: "REMOTE"
			},
			{
				label: "动态 SOCKS5 (-D)",
				value: "DYNAMIC"
			}
		];
		const TUNNEL_AUTHS = [{
			label: "口令",
			value: "PASSWORD"
		}, {
			label: "私钥",
			value: "KEY"
		}];
		/** DYNAMIC 走 SOCKS5 代理，不指定远端目标 */
		const tunnelIsDynamic = computed(() => tunnel.value.type === "DYNAMIC");
		const tunnelIsKeyAuth = computed(() => tunnel.value.sshAuthType === "KEY");
		/**
		* 读当前数据源的隧道配置。
		*
		* <p>后端未配置时 data 为 null，表单落到空表单而不是报错：一个数据源
		* 允许没有隧道，未配置是正常状态而非异常。</p>
		*
		* @param id 数据源 ID
		*/
		const loadTunnel = async (id) => {
			tunnelLoading.value = true;
			try {
				const data = await fetchDatasourceTunnel(id);
				if (!data) {
					tunnel.value = emptyTunnel();
					return;
				}
				tunnel.value = {
					id: data.id ?? null,
					name: data.name ?? "",
					type: data.type || "LOCAL",
					sshHost: data.sshHost ?? "",
					sshPort: data.sshPort ?? 22,
					sshUsername: data.sshUsername ?? "",
					sshAuthType: data.sshAuthType || "PASSWORD",
					sshPassword: "",
					sshPrivateKey: data.sshPrivateKey ?? "",
					sshPassphrase: "",
					localPort: data.localPort ?? null,
					remoteHost: data.remoteHost ?? "",
					remotePort: data.remotePort ?? null,
					bindAddress: data.bindAddress ?? "",
					status: data.status ?? 0
				};
			} catch (e) {
				message.error(`读取隧道配置失败: ${String(e?.message ?? e)}`);
			} finally {
				tunnelLoading.value = false;
			}
		};
		/** 保存隧道；校验口径与后端 validate 保持一致（后端拒绝的这里先拦下） */
		const saveTunnel = async () => {
			const id = current.value?.id;
			if (id == null) return;
			const f = tunnel.value;
			if (!f.sshHost.trim()) {
				message.warning("请填写 SSH 服务器地址");
				return;
			}
			if (!f.sshUsername.trim()) {
				message.warning("请填写 SSH 用户名");
				return;
			}
			if (!tunnelIsDynamic.value) {
				if (!f.remoteHost.trim()) {
					message.warning("请填写远端目标主机（数据库地址）");
					return;
				}
				if (!f.remotePort || f.remotePort <= 0) {
					message.warning("请填写远端目标端口");
					return;
				}
			}
			if (tunnelIsKeyAuth.value && !f.sshPrivateKey.trim()) {
				message.warning("私钥认证请填写私钥（PEM 文本或私钥文件路径）");
				return;
			}
			tunnelSaving.value = true;
			try {
				await saveDatasourceTunnel(id, { ...f });
				message.success("隧道配置已保存");
				await loadTunnel(id);
			} catch (e) {
				message.error(`保存失败: ${String(e?.message ?? e)}`);
			} finally {
				tunnelSaving.value = false;
			}
		};
		/** 删除隧道：删除后该数据源的连接测试改为直连 */
		const removeTunnel = async () => {
			const id = current.value?.id;
			if (id == null) return;
			try {
				await ElMessageBox.confirm("删除后该数据源的连接测试将直连目标库（内网不可达时会失败），确定删除？", "删除隧道", { type: "warning" });
			} catch {
				return;
			}
			tunnelSaving.value = true;
			try {
				await deleteDatasourceTunnel(id);
				message.success("隧道已删除");
				await loadTunnel(id);
			} catch (e) {
				message.error(`删除失败: ${String(e?.message ?? e)}`);
			} finally {
				tunnelSaving.value = false;
			}
		};
		watch(() => current.value?.id ?? null, (id) => {
			if (id == null) {
				tunnel.value = emptyTunnel();
				return;
			}
			loadTunnel(id);
		}, { immediate: true });
		onMounted(load);
		return (_ctx, _cache) => {
			const _component_el_button = resolveComponent("el-button");
			const _component_ElDropdownItem = resolveComponent("ElDropdownItem");
			const _component_ElDropdownMenu = resolveComponent("ElDropdownMenu");
			const _component_ElDropdown = resolveComponent("ElDropdown");
			return openBlock(), createElementBlock("div", _hoisted_1, [
				createBaseVNode("div", _hoisted_2, [createBaseVNode("aside", _hoisted_3, [createBaseVNode("div", _hoisted_4, [
					createBaseVNode("ul", _hoisted_5, [(openBlock(true), createElementBlock(Fragment, null, renderList(statusFilters.value, (item) => {
						return openBlock(), createElementBlock("li", {
							key: item.key,
							class: normalizeClass(["ds-status__item", { "is-active": statusKey.value === item.key }]),
							onClick: ($event) => statusKey.value = item.key
						}, [
							createBaseVNode("span", {
								class: "ds-status__dot",
								style: normalizeStyle({ background: item.color })
							}, null, 4),
							createBaseVNode("span", _hoisted_7, toDisplayString(item.label), 1),
							item.count !== null ? (openBlock(), createElementBlock("span", _hoisted_8, toDisplayString(item.count), 1)) : createCommentVNode("", true)
						], 10, _hoisted_6);
					}), 128))]),
					_cache[47] || (_cache[47] = createBaseVNode("div", { class: "ds-side__divider" }, null, -1)),
					createVNode(unref(ReInput_default), {
						modelValue: keyword.value,
						"onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => keyword.value = $event),
						class: "ds-side__search",
						"prefix-icon": "Search",
						placeholder: "搜索数据源",
						clearable: ""
					}, null, 8, ["modelValue"]),
					createBaseVNode("div", _hoisted_9, [loading.value && !list.value.length ? (openBlock(), createElementBlock("p", _hoisted_10, "加载中…")) : !filteredList.value.length ? (openBlock(), createBlock(unref(ReEmpty_default), {
						key: 1,
						description: "暂无匹配的数据源",
						"image-size": 60
					})) : (openBlock(true), createElementBlock(Fragment, { key: 2 }, renderList(filteredList.value, (item) => {
						return openBlock(), createElementBlock("button", {
							key: item.id ?? item.name,
							type: "button",
							class: normalizeClass(["ds-item", { "is-active": current.value === item }]),
							onClick: ($event) => selectSource(item),
							onContextmenu: withModifiers(($event) => onItemContextMenu($event, item), ["prevent"])
						}, [
							createBaseVNode("span", {
								class: "ds-item__icon",
								style: normalizeStyle({ "--tile": typeMeta(item.type).color })
							}, [createVNode(unref(component$2), {
								name: typeMeta(item.type).icon,
								size: 16
							}, null, 8, ["name"])], 4),
							createBaseVNode("span", _hoisted_12, [createBaseVNode("span", _hoisted_13, [createBaseVNode("b", {
								class: "ds-item__name",
								title: item.name
							}, toDisplayString(item.name), 9, _hoisted_14), createBaseVNode("span", {
								class: "ds-item__chip",
								style: normalizeStyle({ "--tile": typeMeta(item.type).color })
							}, toDisplayString(sourceTypeChip(item)), 5)]), createBaseVNode("span", _hoisted_15, toDisplayString(item.host) + ":" + toDisplayString(item.port), 1)]),
							createBaseVNode("i", {
								class: normalizeClass(["ds-item__dot", `is-${datasourceStatusKeyOf(item)}`]),
								title: datasourceStatusTextOf(item),
								"aria-hidden": "true"
							}, null, 10, _hoisted_16)
						], 42, _hoisted_11);
					}), 128))]),
					createBaseVNode("button", {
						type: "button",
						class: "ds-side__add",
						onClick: openCreate
					}, [createVNode(unref(component$2), {
						name: "Plus",
						size: 14
					}), _cache[46] || (_cache[46] = createBaseVNode("span", null, "添加数据源", -1))])
				]), createVNode(DsmContextMenu_default, {
					visible: ctxMenu.visible,
					"onUpdate:visible": _cache[1] || (_cache[1] = ($event) => ctxMenu.visible = $event),
					x: ctxMenu.x,
					y: ctxMenu.y,
					items: ctxMenuItems,
					onSelect: onItemMenuSelect
				}, null, 8, [
					"visible",
					"x",
					"y"
				])]), createBaseVNode("div", _hoisted_17, [createBaseVNode("div", _hoisted_18, [createBaseVNode("div", _hoisted_19, [createBaseVNode("div", _hoisted_20, [createBaseVNode("span", _hoisted_21, [
					createVNode(unref(component$2), {
						name: "DataBoard",
						size: 15,
						class: "ds-crumb__icon"
					}),
					_cache[48] || (_cache[48] = createBaseVNode("span", null, "基础设施", -1)),
					createVNode(unref(component$2), {
						name: "ArrowRight",
						size: 12,
						class: "ds-crumb__arrow"
					}),
					_cache[49] || (_cache[49] = createBaseVNode("span", null, "数据源中心", -1))
				])]), createBaseVNode("div", _hoisted_22, [createBaseVNode("div", _hoisted_23, [
					current.value ? (openBlock(), createElementBlock("span", {
						key: 0,
						class: "ds-head__tile",
						style: normalizeStyle({ "--tile": typeMeta(current.value.type).color }),
						"aria-hidden": "true"
					}, [createVNode(unref(component$2), {
						name: typeMeta(current.value.type).icon,
						size: 20
					}, null, 8, ["name"])], 4)) : createCommentVNode("", true),
					createBaseVNode("h2", {
						class: "ds-detail__name",
						title: current.value?.name
					}, toDisplayString(current.value?.name ?? "数据源中心"), 9, _hoisted_24),
					current.value ? (openBlock(), createElementBlock(Fragment, { key: 1 }, [createBaseVNode("span", {
						class: "ds-detail__chip",
						style: normalizeStyle({ "--tile": typeMeta(current.value.type).color })
					}, toDisplayString(sourceTypeChip(current.value)), 5), createBaseVNode("span", { class: normalizeClass(["ds-detail__badge", detailBadgeClass.value]) }, [_cache[50] || (_cache[50] = createBaseVNode("span", { class: "ds-detail__badge-dot" }, null, -1)), createTextVNode(" " + toDisplayString(detailBadgeText.value), 1)], 2)], 64)) : createCommentVNode("", true)
				]), createBaseVNode("div", _hoisted_25, [
					createVNode(unref(ReInput_default), {
						modelValue: keyword.value,
						"onUpdate:modelValue": _cache[2] || (_cache[2] = ($event) => keyword.value = $event),
						class: "ds-head__search",
						"prefix-icon": "Search",
						placeholder: "搜索数据源",
						clearable: ""
					}, null, 8, ["modelValue"]),
					createVNode(unref(ReButton_default), {
						icon: "Plus",
						"show-text": false,
						layout: "square",
						onClick: openCreate
					}, {
						default: withCtx(() => [..._cache[51] || (_cache[51] = [createTextVNode("新增数据源", -1)])]),
						_: 1
					}),
					current.value ? (openBlock(), createElementBlock(Fragment, { key: 0 }, [createVNode(unref(ReButton_default), {
						icon: "Lightning",
						"show-text": false,
						layout: "square",
						loading: testing.value === current.value.id,
						onClick: _cache[3] || (_cache[3] = ($event) => test(current.value))
					}, {
						default: withCtx(() => [..._cache[52] || (_cache[52] = [createTextVNode("测试连接", -1)])]),
						_: 1
					}, 8, ["loading"]), createVNode(unref(ReButton_default), {
						icon: "View",
						"show-text": false,
						type: "primary",
						layout: "square",
						onClick: _cache[4] || (_cache[4] = ($event) => openManager(current.value))
					}, {
						default: withCtx(() => [..._cache[53] || (_cache[53] = [createTextVNode("打开管理", -1)])]),
						_: 1
					})], 64)) : createCommentVNode("", true),
					createVNode(_component_ElDropdown, {
						trigger: "click",
						placement: "bottom-end",
						onCommand: _cache[5] || (_cache[5] = (cmd) => runHeadCommand(cmd))
					}, {
						dropdown: withCtx(() => [createVNode(_component_ElDropdownMenu, null, {
							default: withCtx(() => [createVNode(_component_ElDropdownItem, { command: "refresh" }, {
								default: withCtx(() => [createVNode(unref(component$2), { name: "RefreshRight" }), _cache[54] || (_cache[54] = createTextVNode("刷新列表", -1))]),
								_: 1
							}), current.value ? (openBlock(), createElementBlock(Fragment, { key: 0 }, [
								current.value.type === "jdbc" ? (openBlock(), createBlock(_component_ElDropdownItem, {
									key: 0,
									command: "schema",
									divided: ""
								}, {
									default: withCtx(() => [createVNode(unref(component$2), { name: "Grid" }), _cache[55] || (_cache[55] = createTextVNode("浏览表结构", -1))]),
									_: 1
								})) : createCommentVNode("", true),
								createVNode(_component_ElDropdownItem, { command: "edit" }, {
									default: withCtx(() => [createVNode(unref(component$2), { name: "EditPen" }), _cache[56] || (_cache[56] = createTextVNode("编辑数据源", -1))]),
									_: 1
								}),
								createVNode(_component_ElDropdownItem, {
									command: "delete",
									divided: "",
									style: { "color": "var(--el-color-danger)" }
								}, {
									default: withCtx(() => [createVNode(unref(component$2), { name: "Delete" }), _cache[57] || (_cache[57] = createTextVNode("删除数据源", -1))]),
									_: 1
								})
							], 64)) : createCommentVNode("", true)]),
							_: 1
						})]),
						default: withCtx(() => [createVNode(_component_el_button, {
							class: "ds-head__more",
							text: "",
							"aria-label": "更多"
						}, {
							default: withCtx(() => [createVNode(unref(component$2), {
								name: "MoreFilled",
								size: 16
							})]),
							_: 1
						})]),
						_: 1
					})
				])])]), current.value ? (openBlock(), createBlock(unref(ReTab_default), {
					key: 0,
					modelValue: activeTab.value,
					"onUpdate:modelValue": _cache[25] || (_cache[25] = ($event) => activeTab.value = $event),
					variant: "underline",
					tabs: tabItems.value,
					stretch: ""
				}, createSlots({
					overview: withCtx(() => [createBaseVNode("div", _hoisted_26, [createBaseVNode("div", _hoisted_27, [
						createVNode(unref(component$1), {
							size: "compact",
							title: "连接延迟",
							value: connectLatencyText.value,
							icon: unref(timer_default),
							"icon-color": "var(--metric-cpu, var(--el-color-primary))"
						}, null, 8, ["value", "icon"]),
						createVNode(unref(component$1), {
							size: "compact",
							title: "会话延迟",
							value: sessionLatencyText.value,
							icon: unref(timer_default),
							"icon-color": "var(--status-success)"
						}, null, 8, ["value", "icon"]),
						createVNode(unref(component$1), {
							size: "compact",
							title: "最后检测",
							value: lastTestText.value,
							icon: unref(clock_default),
							"icon-color": "var(--metric-jvm)"
						}, null, 8, ["value", "icon"]),
						createVNode(unref(component$1), {
							size: "compact",
							title: "运行状态",
							value: runtimeText.value,
							icon: unref(circle_check_default),
							"icon-color": "var(--brand-500)"
						}, null, 8, ["value", "icon"])
					]), createBaseVNode("div", _hoisted_28, [createBaseVNode("div", _hoisted_29, [createBaseVNode("section", _hoisted_30, [createBaseVNode("header", _hoisted_31, [_cache[61] || (_cache[61] = createBaseVNode("h3", { class: "ds-panel__title" }, "连接延迟趋势", -1)), createBaseVNode("div", _hoisted_32, [
						_cache[59] || (_cache[59] = createBaseVNode("span", { class: "ds-legend" }, [createBaseVNode("i", { class: "ds-legend__dot" }), createTextVNode("连接延迟")], -1)),
						_cache[60] || (_cache[60] = createBaseVNode("span", { class: "ds-legend ds-legend--count" }, [createBaseVNode("i", { class: "ds-legend__dot ds-legend__dot--dashed" }), createTextVNode("连接数")], -1)),
						createBaseVNode("span", _hoisted_33, [_cache[58] || (_cache[58] = createBaseVNode("i", { class: "ds-legend__dot" }, null, -1)), createTextVNode("平均 " + toDisplayString(latencyLegendText.value), 1)])
					])]), createBaseVNode("div", _hoisted_34, [createVNode(DatasourceMetricPanel_default, {
						"datasource-id": current.value?.id,
						embedded: "",
						onLatest: _cache[6] || (_cache[6] = ($event) => latestMetric.value = $event)
					}, null, 8, ["datasource-id"])])]), createBaseVNode("section", _hoisted_35, [createVNode(DatasourceServerStatsPanel_default, {
						"datasource-id": current.value?.id,
						type: current.value.type,
						url: current.value.database,
						"driver-class-name": current.value.driverClassName,
						latest: latestMetric.value
					}, null, 8, [
						"datasource-id",
						"type",
						"url",
						"driver-class-name",
						"latest"
					])])]), createBaseVNode("section", _hoisted_36, [
						_cache[66] || (_cache[66] = createBaseVNode("h3", { class: "ds-panel__title" }, "连接配置", -1)),
						createBaseVNode("dl", _hoisted_37, [(openBlock(true), createElementBlock(Fragment, null, renderList(configRows.value, (row) => {
							return openBlock(), createElementBlock("div", {
								key: row.label,
								class: "ds-kv__row"
							}, [createBaseVNode("dt", _hoisted_38, toDisplayString(row.label), 1), createBaseVNode("dd", { class: normalizeClass(["ds-kv__value", { mono: row.mono }]) }, toDisplayString(row.value), 3)]);
						}), 128))]),
						createBaseVNode("div", _hoisted_39, [
							createVNode(unref(ReButton_default), {
								class: "ds-panel__primary",
								type: "primary",
								icon: "RefreshRight",
								"show-text": true,
								loading: testing.value === current.value.id,
								onClick: _cache[7] || (_cache[7] = ($event) => test(current.value))
							}, {
								default: withCtx(() => [..._cache[62] || (_cache[62] = [createTextVNode("立即检测", -1)])]),
								_: 1
							}, 8, ["loading"]),
							createVNode(unref(ReButton_default), {
								class: "ds-pill",
								icon: "EditPen",
								"show-text": true,
								onClick: _cache[8] || (_cache[8] = ($event) => openEdit(current.value))
							}, {
								default: withCtx(() => [..._cache[63] || (_cache[63] = [createTextVNode("编辑连接配置", -1)])]),
								_: 1
							}),
							createVNode(unref(ReButton_default), {
								class: "ds-pill",
								icon: "Connection",
								"show-text": true,
								onClick: _cache[9] || (_cache[9] = ($event) => activeTab.value = "tunnel")
							}, {
								default: withCtx(() => [..._cache[64] || (_cache[64] = [createTextVNode("SSH 隧道", -1)])]),
								_: 1
							}),
							createCommentVNode("", true)
						])
					])])])]),
					connection: withCtx(() => [createBaseVNode("section", _hoisted_40, [_cache[67] || (_cache[67] = createBaseVNode("h3", { class: "ds-panel__title" }, "连接配置", -1)), createBaseVNode("dl", _hoisted_41, [(openBlock(true), createElementBlock(Fragment, null, renderList(connectionRows.value, (row) => {
						return openBlock(), createElementBlock("div", {
							key: row.label,
							class: "ds-kv__row"
						}, [createBaseVNode("dt", _hoisted_42, toDisplayString(row.label), 1), createBaseVNode("dd", { class: normalizeClass(["ds-kv__value", { mono: row.mono }]) }, toDisplayString(row.value), 3)]);
					}), 128))])])]),
					tunnel: withCtx(() => [createBaseVNode("section", _hoisted_43, [
						_cache[72] || (_cache[72] = createBaseVNode("h3", { class: "ds-panel__title" }, "SSH 隧道", -1)),
						_cache[73] || (_cache[73] = createBaseVNode("p", { class: "ds-panel__hint" }, " 目标库只能从内网访问时，配置隧道后连接测试会先打开隧道、再经隧道本地端口去连目标库。 SSH 口令与私钥口令保存后不再回显，留空即保持原值。 ", -1)),
						tunnelLoading.value ? (openBlock(), createElementBlock("div", _hoisted_44, "正在读取隧道配置…")) : (openBlock(), createBlock(unref(ReForm_default), {
							key: 1,
							"label-position": "top",
							class: "ds-form ds-tunnel-form"
						}, {
							default: withCtx(() => [
								createBaseVNode("div", _hoisted_45, [
									createVNode(unref(ReFormItem), {
										label: "启用",
										class: "is-full"
									}, {
										default: withCtx(() => [createVNode(unref(ReSwitch_default), {
											modelValue: tunnel.value.status,
											"onUpdate:modelValue": _cache[11] || (_cache[11] = ($event) => tunnel.value.status = $event),
											"active-value": 1,
											"inactive-value": 0,
											"active-text": "启用",
											"inactive-text": "停用",
											"aria-label": "启用隧道"
										}, null, 8, ["modelValue"])]),
										_: 1
									}),
									createVNode(unref(ReFormItem), {
										label: "隧道名称",
										class: "is-full"
									}, {
										default: withCtx(() => [createVNode(unref(ReInput_default), {
											modelValue: tunnel.value.name,
											"onUpdate:modelValue": _cache[12] || (_cache[12] = ($event) => tunnel.value.name = $event),
											placeholder: "如 生产 MySQL 跳板"
										}, null, 8, ["modelValue"])]),
										_: 1
									}),
									createVNode(unref(ReFormItem), {
										label: "隧道类型",
										required: ""
									}, {
										default: withCtx(() => [createVNode(unref(ReSelect_default), {
											modelValue: tunnel.value.type,
											"onUpdate:modelValue": _cache[13] || (_cache[13] = ($event) => tunnel.value.type = $event),
											options: TUNNEL_TYPES
										}, null, 8, ["modelValue"])]),
										_: 1
									}),
									createVNode(unref(ReFormItem), { label: "认证方式" }, {
										default: withCtx(() => [createVNode(unref(ReSelect_default), {
											modelValue: tunnel.value.sshAuthType,
											"onUpdate:modelValue": _cache[14] || (_cache[14] = ($event) => tunnel.value.sshAuthType = $event),
											options: TUNNEL_AUTHS
										}, null, 8, ["modelValue"])]),
										_: 1
									})
								]),
								_cache[70] || (_cache[70] = createBaseVNode("h4", { class: "ds-sub-title" }, "SSH 服务器", -1)),
								createBaseVNode("div", _hoisted_46, [
									createVNode(unref(ReFormItem), {
										label: "地址",
										required: ""
									}, {
										default: withCtx(() => [createVNode(unref(ReInput_default), {
											modelValue: tunnel.value.sshHost,
											"onUpdate:modelValue": _cache[15] || (_cache[15] = ($event) => tunnel.value.sshHost = $event),
											placeholder: "跳板机地址，如 10.0.0.9"
										}, null, 8, ["modelValue"])]),
										_: 1
									}),
									createVNode(unref(ReFormItem), { label: "端口" }, {
										default: withCtx(() => [createVNode(unref(ReInputNumber_default), {
											"model-value": tunnel.value.sshPort ?? void 0,
											min: 1,
											max: 65535,
											style: { "width": "100%" },
											"onUpdate:modelValue": _cache[16] || (_cache[16] = ($event) => tunnel.value.sshPort = $event ?? null)
										}, null, 8, ["model-value"])]),
										_: 1
									}),
									createVNode(unref(ReFormItem), {
										label: "用户名",
										required: ""
									}, {
										default: withCtx(() => [createVNode(unref(ReInput_default), {
											modelValue: tunnel.value.sshUsername,
											"onUpdate:modelValue": _cache[17] || (_cache[17] = ($event) => tunnel.value.sshUsername = $event),
											placeholder: "如 tunnel"
										}, null, 8, ["modelValue"])]),
										_: 1
									})
								]),
								tunnelIsKeyAuth.value ? (openBlock(), createElementBlock(Fragment, { key: 0 }, [createVNode(unref(ReFormItem), {
									label: "私钥",
									required: "",
									class: "is-full"
								}, {
									default: withCtx(() => [createVNode(unref(ReInput_default), {
										modelValue: tunnel.value.sshPrivateKey,
										"onUpdate:modelValue": _cache[18] || (_cache[18] = ($event) => tunnel.value.sshPrivateKey = $event),
										type: "textarea",
										rows: 4,
										placeholder: "-----BEGIN OPENSSH PRIVATE KEY----- 全文，或本机私钥文件路径"
									}, null, 8, ["modelValue"])]),
									_: 1
								}), createVNode(unref(ReFormItem), {
									label: "私钥口令",
									class: "is-full"
								}, {
									default: withCtx(() => [createVNode(unref(ReInput_default), {
										modelValue: tunnel.value.sshPassphrase,
										"onUpdate:modelValue": _cache[19] || (_cache[19] = ($event) => tunnel.value.sshPassphrase = $event),
										type: "password",
										"show-password": "",
										placeholder: "留空表示不修改"
									}, null, 8, ["modelValue"])]),
									_: 1
								})], 64)) : (openBlock(), createBlock(unref(ReFormItem), {
									key: 1,
									label: "SSH 口令",
									class: "is-full"
								}, {
									default: withCtx(() => [createVNode(unref(ReInput_default), {
										modelValue: tunnel.value.sshPassword,
										"onUpdate:modelValue": _cache[20] || (_cache[20] = ($event) => tunnel.value.sshPassword = $event),
										type: "password",
										"show-password": "",
										placeholder: "留空表示不修改"
									}, null, 8, ["modelValue"])]),
									_: 1
								})),
								_cache[71] || (_cache[71] = createBaseVNode("h4", { class: "ds-sub-title" }, "转发", -1)),
								createBaseVNode("div", _hoisted_47, [
									createVNode(unref(ReFormItem), { label: "本地端口" }, {
										default: withCtx(() => [createVNode(unref(ReInputNumber_default), {
											"model-value": tunnel.value.localPort ?? void 0,
											min: 1,
											max: 65535,
											placeholder: "留空自动分配",
											style: { "width": "100%" },
											"onUpdate:modelValue": _cache[21] || (_cache[21] = ($event) => tunnel.value.localPort = $event ?? null)
										}, null, 8, ["model-value"])]),
										_: 1
									}),
									createVNode(unref(ReFormItem), { label: "绑定地址" }, {
										default: withCtx(() => [createVNode(unref(ReInput_default), {
											modelValue: tunnel.value.bindAddress,
											"onUpdate:modelValue": _cache[22] || (_cache[22] = ($event) => tunnel.value.bindAddress = $event),
											placeholder: "留空用 127.0.0.1"
										}, null, 8, ["modelValue"])]),
										_: 1
									}),
									!tunnelIsDynamic.value ? (openBlock(), createElementBlock(Fragment, { key: 0 }, [createVNode(unref(ReFormItem), {
										label: "远端目标主机",
										required: ""
									}, {
										default: withCtx(() => [createVNode(unref(ReInput_default), {
											modelValue: tunnel.value.remoteHost,
											"onUpdate:modelValue": _cache[23] || (_cache[23] = ($event) => tunnel.value.remoteHost = $event),
											placeholder: "数据库地址，如 10.0.0.20"
										}, null, 8, ["modelValue"])]),
										_: 1
									}), createVNode(unref(ReFormItem), {
										label: "远端目标端口",
										required: ""
									}, {
										default: withCtx(() => [createVNode(unref(ReInputNumber_default), {
											"model-value": tunnel.value.remotePort ?? void 0,
											min: 1,
											max: 65535,
											style: { "width": "100%" },
											"onUpdate:modelValue": _cache[24] || (_cache[24] = ($event) => tunnel.value.remotePort = $event ?? null)
										}, null, 8, ["model-value"])]),
										_: 1
									})], 64)) : createCommentVNode("", true)
								]),
								createBaseVNode("div", _hoisted_48, [
									createVNode(unref(ReButton_default), {
										type: "primary",
										icon: "Check",
										loading: tunnelSaving.value,
										onClick: saveTunnel
									}, {
										default: withCtx(() => [..._cache[68] || (_cache[68] = [createTextVNode("保存隧道", -1)])]),
										_: 1
									}, 8, ["loading"]),
									tunnel.value.id ? (openBlock(), createBlock(unref(ReButton_default), {
										key: 0,
										type: "danger",
										icon: "Delete",
										loading: tunnelSaving.value,
										onClick: removeTunnel
									}, {
										default: withCtx(() => [..._cache[69] || (_cache[69] = [createTextVNode("删除隧道", -1)])]),
										_: 1
									}, 8, ["loading"])) : createCommentVNode("", true),
									tunnel.value.id ? (openBlock(), createElementBlock("span", _hoisted_49, "已配置隧道 #" + toDisplayString(tunnel.value.id), 1)) : createCommentVNode("", true)
								])
							]),
							_: 1
						}))
					])]),
					metrics: withCtx(() => [createVNode(DatasourceMetricPanel_default, { "datasource-id": current.value?.id }, null, 8, ["datasource-id"])]),
					logs: withCtx(() => [createVNode(DatasourceOperLogPanel_default, { "datasource-id": current.value?.id }, null, 8, ["datasource-id"])]),
					_: 2
				}, [renderList(props.extraTabs, (t) => {
					return {
						name: t.name,
						fn: withCtx(() => [renderSlot(_ctx.$slots, t.name, { datasource: current.value }, void 0, true)])
					};
				})]), 1032, ["modelValue", "tabs"])) : (openBlock(), createBlock(unref(ReEmpty_default), {
					key: 1,
					description: "暂无数据源，点击「新增数据源」创建",
					"image-size": 80,
					class: "ds-main__empty"
				}))])])]),
				createVNode(unref(component), {
					modelValue: dialogVisible.value,
					"onUpdate:modelValue": _cache[42] || (_cache[42] = ($event) => dialogVisible.value = $event),
					title: editing.value ? "编辑数据源" : "新增数据源",
					width: "860px",
					class: "ds-create-dialog"
				}, {
					footer: withCtx(() => [createVNode(unref(ReButton_default), {
						class: "ds-pill",
						onClick: _cache[41] || (_cache[41] = ($event) => dialogVisible.value = false)
					}, {
						icon: withCtx(() => [createVNode(unref(component$2), {
							name: "Close",
							size: 12
						})]),
						default: withCtx(() => [_cache[83] || (_cache[83] = createTextVNode("取消", -1))]),
						_: 1
					}), createVNode(unref(ReButton_default), {
						type: "primary",
						class: "ds-pill",
						loading: saving.value,
						onClick: save
					}, {
						icon: withCtx(() => [createVNode(unref(component$2), {
							name: "Check",
							size: 12
						})]),
						default: withCtx(() => [_cache[84] || (_cache[84] = createTextVNode("保存", -1))]),
						_: 1
					}, 8, ["loading"])]),
					default: withCtx(() => [createBaseVNode("div", _hoisted_50, [createBaseVNode("aside", _hoisted_51, [createBaseVNode("div", _hoisted_52, [createVNode(unref(ReInput_default), {
						modelValue: typeKeyword.value,
						"onUpdate:modelValue": _cache[26] || (_cache[26] = ($event) => typeKeyword.value = $event),
						placeholder: "搜索类型",
						clearable: "",
						size: "small"
					}, {
						prefix: withCtx(() => [createVNode(unref(component$2), {
							name: "Search",
							size: 14
						})]),
						_: 1
					}, 8, ["modelValue"])]), createBaseVNode("div", _hoisted_53, [(openBlock(true), createElementBlock(Fragment, null, renderList(filteredTypes.value, (t) => {
						return openBlock(), createElementBlock("button", {
							key: t,
							type: "button",
							class: normalizeClass(["ds-type-item", { "is-active": form.value.type === t }]),
							"data-testid": `ds-type-${t}`,
							onClick: ($event) => selectType(t)
						}, [createBaseVNode("span", {
							class: "ds-type-item__tile",
							style: normalizeStyle({ "--tile": typeMeta(t).color })
						}, [createVNode(unref(component$2), {
							name: typeMeta(t).icon,
							size: 16
						}, null, 8, ["name"])], 4), createBaseVNode("span", _hoisted_55, toDisplayString(typeMeta(t).label), 1)], 10, _hoisted_54);
					}), 128)), !filteredTypes.value.length ? (openBlock(), createElementBlock("p", _hoisted_56, "无匹配类型")) : createCommentVNode("", true)])]), createBaseVNode("section", _hoisted_57, [createBaseVNode("header", _hoisted_58, [
						createBaseVNode("span", {
							class: "ds-create__tile",
							style: normalizeStyle({ "--tile": typeMeta(form.value.type || "").color })
						}, [createVNode(unref(component$2), {
							name: typeMeta(form.value.type || "").icon,
							size: 18
						}, null, 8, ["name"])], 4),
						createBaseVNode("div", _hoisted_59, [createBaseVNode("div", _hoisted_60, toDisplayString(typeMeta(form.value.type || "").label), 1), createBaseVNode("div", _hoisted_61, toDisplayString(typeDesc(form.value.type || "")), 1)]),
						createBaseVNode("span", _hoisted_62, toDisplayString((form.value.type || "").toUpperCase()), 1)
					]), createVNode(unref(ReForm_default), {
						"label-position": "top",
						class: "ds-form ds-create__form"
					}, {
						default: withCtx(() => [
							createVNode(unref(ReFormItem), {
								label: "名称",
								required: "",
								class: "is-full"
							}, {
								default: withCtx(() => [createVNode(unref(ReInput_default), {
									modelValue: form.value.name,
									"onUpdate:modelValue": _cache[27] || (_cache[27] = ($event) => form.value.name = $event),
									placeholder: "例如：生产 MySQL"
								}, null, 8, ["modelValue"])]),
								_: 1
							}),
							createVNode(unref(ReFormItem), {
								label: "主机地址",
								required: ""
							}, {
								default: withCtx(() => [createVNode(unref(ReInput_default), {
									modelValue: form.value.host,
									"onUpdate:modelValue": _cache[28] || (_cache[28] = ($event) => form.value.host = $event),
									placeholder: "127.0.0.1"
								}, null, 8, ["modelValue"])]),
								_: 1
							}),
							createVNode(unref(ReFormItem), {
								label: form.value.type === "neo4j" ? "端口 (HTTP)" : "端口",
								required: ""
							}, {
								default: withCtx(() => [createVNode(unref(ReInputNumber_default), {
									"model-value": form.value.port ?? void 0,
									min: 1,
									max: 65535,
									style: { "width": "100%" },
									"onUpdate:modelValue": _cache[29] || (_cache[29] = ($event) => form.value.port = $event)
								}, null, 8, ["model-value"])]),
								_: 1
							}, 8, ["label"]),
							createVNode(unref(ReFormItem), {
								label: "用户名",
								required: ""
							}, {
								default: withCtx(() => [createVNode(unref(ReInput_default), {
									modelValue: form.value.username,
									"onUpdate:modelValue": _cache[30] || (_cache[30] = ($event) => form.value.username = $event),
									placeholder: "数据库用户名"
								}, null, 8, ["modelValue"])]),
								_: 1
							}),
							createVNode(unref(ReFormItem), {
								label: "密码",
								required: ""
							}, {
								default: withCtx(() => [createVNode(unref(ReInput_default), {
									modelValue: form.value.password,
									"onUpdate:modelValue": _cache[31] || (_cache[31] = ($event) => form.value.password = $event),
									type: "password",
									"show-password": "",
									placeholder: "数据库密码"
								}, null, 8, ["modelValue"])]),
								_: 1
							}),
							createVNode(unref(ReFormItem), {
								label: form.value.type === "neo4j" ? "图数据库名" : "数据库/库名",
								class: "is-full"
							}, {
								default: withCtx(() => [createVNode(unref(ReInput_default), {
									modelValue: form.value.database,
									"onUpdate:modelValue": _cache[32] || (_cache[32] = ($event) => form.value.database = $event),
									placeholder: form.value.type === "neo4j" ? "留空按 neo4j；填完整 http(s):// 地址时按反向代理前缀处理" : "数据库名 / Redis DB 编号 / Kafka 可选上下文"
								}, null, 8, ["modelValue", "placeholder"])]),
								_: 1
							}, 8, ["label"]),
							form.value.type === "influxdb" ? (openBlock(), createBlock(unref(ReFormItem), {
								key: 0,
								label: "InfluxDB 版本",
								required: "",
								class: "is-full",
								"data-testid": "ds-influx-version-field"
							}, {
								default: withCtx(() => [createVNode(unref(ReSelect_default), {
									modelValue: form.value.version,
									"onUpdate:modelValue": _cache[33] || (_cache[33] = ($event) => form.value.version = $event),
									options: INFLUX_VERSION_OPTIONS,
									placeholder: "选择服务端版本",
									"data-testid": "ds-influx-version"
								}, null, 8, ["modelValue"]), _cache[74] || (_cache[74] = createBaseVNode("div", { class: "ds-form-hint" }, " v2 使用 Flux 与 Bucket；v3 使用 SQL/InfluxQL 与 Database，两者语法不通用。 ", -1))]),
								_: 1
							})) : createCommentVNode("", true),
							form.value.type === "jdbc" ? (openBlock(), createElementBlock(Fragment, { key: 1 }, [
								createVNode(unref(ReFormItem), {
									label: "驱动类名",
									class: "is-full"
								}, {
									default: withCtx(() => [createVNode(unref(ReInput_default), {
										modelValue: form.value.driverClassName,
										"onUpdate:modelValue": _cache[34] || (_cache[34] = ($event) => form.value.driverClassName = $event),
										placeholder: "org.h2.Driver（留空则用所选 jar 上登记的类名）"
									}, null, 8, ["modelValue"])]),
									_: 1
								}),
								createVNode(unref(ReFormItem), {
									label: "驱动 jar",
									class: "is-full"
								}, {
									default: withCtx(() => [createBaseVNode("div", _hoisted_63, [
										createVNode(unref(ReSelect_default), {
											modelValue: form.value.driverJarId,
											"onUpdate:modelValue": _cache[35] || (_cache[35] = ($event) => form.value.driverJarId = $event),
											options: driverJarOptions.value,
											placeholder: "用内置驱动（应用 classpath 上的）",
											clearable: "",
											class: "ds-driver-jar-select"
										}, null, 8, ["modelValue", "options"]),
										createBaseVNode("input", {
											ref_key: "driverJarInput",
											ref: driverJarInput,
											class: "ds-driver-jar-file",
											type: "file",
											accept: ".jar",
											onChange: onPickDriverJar
										}, null, 544),
										createVNode(unref(ReButton_default), {
											size: "small",
											onClick: _cache[36] || (_cache[36] = ($event) => driverJarInput.value?.click())
										}, {
											default: withCtx(() => [..._cache[75] || (_cache[75] = [createTextVNode("上传 jar", -1)])]),
											_: 1
										})
									]), _cache[76] || (_cache[76] = createBaseVNode("div", { class: "ds-form-hint" }, " 文件库（H2 / SQLite）也要在这里选驱动：它们不在应用 classpath 上。 ", -1))]),
									_: 1
								}),
								createVNode(unref(ReFormItem), {
									label: "额外参数",
									class: "is-full"
								}, {
									default: withCtx(() => [createBaseVNode("div", _hoisted_64, [(openBlock(true), createElementBlock(Fragment, null, renderList(extraParams.value, (row, i) => {
										return openBlock(), createElementBlock("div", {
											key: i,
											class: "ds-xparam__row"
										}, [
											createVNode(unref(ReSelect_default), {
												modelValue: row.key,
												"onUpdate:modelValue": ($event) => row.key = $event,
												class: "ds-xparam__key",
												options: extraParamOptions.value,
												placeholder: "选择或输入参数名",
												filterable: "",
												"allow-create": "",
												clearable: "",
												"data-testid": `dsm-xparam-key-${i}`
											}, null, 8, [
												"modelValue",
												"onUpdate:modelValue",
												"options",
												"data-testid"
											]),
											createVNode(unref(ReInput_default), {
												modelValue: row.value,
												"onUpdate:modelValue": ($event) => row.value = $event,
												class: "ds-xparam__value",
												placeholder: "参数值，如 false / Asia/Shanghai",
												"data-testid": `dsm-xparam-value-${i}`
											}, null, 8, [
												"modelValue",
												"onUpdate:modelValue",
												"data-testid"
											]),
											createVNode(unref(ReButton_default), {
												layout: "square",
												icon: "Delete",
												type: "danger",
												tip: "删除此参数",
												"data-testid": `dsm-xparam-del-${i}`,
												onClick: ($event) => removeExtraParam(i)
											}, null, 8, ["data-testid", "onClick"])
										]);
									}), 128)), createBaseVNode("div", _hoisted_65, [createVNode(unref(ReButton_default), {
										size: "small",
										"data-testid": "dsm-xparam-add",
										onClick: addExtraParam
									}, {
										icon: withCtx(() => [createVNode(unref(component$2), {
											name: "Plus",
											size: 12
										})]),
										default: withCtx(() => [_cache[77] || (_cache[77] = createTextVNode(" 添加参数 ", -1))]),
										_: 1
									}), _cache[78] || (_cache[78] = createBaseVNode("span", { class: "ds-form-hint" }, " 追加到 JDBC 连接串；同名参数覆盖后端默认值。值里不要带空格或 & ? # ", -1))])])]),
									_: 1
								})
							], 64)) : createCommentVNode("", true),
							form.value.type === "nginx" ? (openBlock(), createElementBlock(Fragment, { key: 2 }, [
								createVNode(unref(ReFormItem), {
									label: "控制方式",
									class: "is-full"
								}, {
									default: withCtx(() => [createVNode(unref(ReSelect_default), {
										modelValue: form.value.controlMode,
										"onUpdate:modelValue": _cache[37] || (_cache[37] = ($event) => form.value.controlMode = $event),
										options: controlModeOptions,
										placeholder: "自动探测"
									}, null, 8, ["modelValue"])]),
									_: 1
								}),
								form.value.controlMode === "systemd" ? (openBlock(), createBlock(unref(ReFormItem), {
									key: 0,
									label: "托管单元名",
									class: "is-full"
								}, {
									default: withCtx(() => [createVNode(unref(ReInput_default), {
										modelValue: form.value.controlTarget,
										"onUpdate:modelValue": _cache[38] || (_cache[38] = ($event) => form.value.controlTarget = $event),
										placeholder: "例如 nginx.service；留空则由后端自动探测"
									}, null, 8, ["modelValue"])]),
									_: 1
								})) : createCommentVNode("", true),
								form.value.controlMode === "local" ? (openBlock(), createElementBlock("p", _hoisted_66, [..._cache[79] || (_cache[79] = [
									createTextVNode(" 直接在本机执行 ", -1),
									createBaseVNode("code", null, "nginx -s stop", -1),
									createTextVNode(" 与裸启动，不经过 systemctl。 停止后进程不再受任何进程管理器托管，机器重启不会自动拉起。 ", -1)
								])])) : form.value.controlMode === "systemd" ? (openBlock(), createElementBlock("p", _hoisted_67, [..._cache[80] || (_cache[80] = [
									createTextVNode(" 启停交给 ", -1),
									createBaseVNode("code", null, "systemctl", -1),
									createTextVNode("。仍要求 SSH 用户对该单元有免密 sudo 权限，没有时自动退回本地目录方式。 ", -1)
								])])) : (openBlock(), createElementBlock("p", _hoisted_68, " 由后端自动判断：认得出托管单元且 SSH 用户有该单元的免密 sudo 权限才走 systemd，否则用本地目录方式。 "))
							], 64)) : createCommentVNode("", true),
							createBaseVNode("div", _hoisted_69, [createVNode(unref(ReButton_default), {
								size: "small",
								loading: dialogTesting.value,
								disabled: !editing.value,
								onClick: testInDialog
							}, {
								icon: withCtx(() => [createVNode(unref(component$2), {
									name: "Connection",
									size: 12
								})]),
								default: withCtx(() => [_cache[81] || (_cache[81] = createTextVNode(" 测试连接 ", -1))]),
								_: 1
							}, 8, ["loading", "disabled"]), dialogTestResult.value ? (openBlock(), createElementBlock("span", {
								key: 0,
								class: normalizeClass(["ds-create__test-result", dialogTestResult.value.success ? "is-ok" : "is-fail"])
							}, [createVNode(unref(component$2), {
								name: dialogTestResult.value.success ? "CircleCheck" : "CircleClose",
								size: 13
							}, null, 8, ["name"]), createTextVNode(" " + toDisplayString(dialogTestResult.value.success ? dialogTestResult.value.message || "连接成功" : dialogTestResult.value.message || "连接失败"), 1)], 2)) : !editing.value ? (openBlock(), createElementBlock("span", _hoisted_70, "保存数据源后即可测试连接")) : createCommentVNode("", true)]),
							createBaseVNode("div", _hoisted_71, [createBaseVNode("button", {
								type: "button",
								class: "ds-create__advanced-toggle",
								onClick: _cache[39] || (_cache[39] = ($event) => advancedOpen.value = !advancedOpen.value)
							}, [createVNode(unref(component$2), {
								name: advancedOpen.value ? "ArrowDown" : "ArrowRight",
								size: 12
							}, null, 8, ["name"]), _cache[82] || (_cache[82] = createTextVNode(" 高级设置 ", -1))]), advancedOpen.value ? (openBlock(), createBlock(unref(ReForm_default), {
								key: 0,
								"label-position": "top",
								class: "ds-form ds-create__advanced-form"
							}, {
								default: withCtx(() => [createVNode(unref(ReFormItem), {
									label: "备注",
									class: "is-full"
								}, {
									default: withCtx(() => [createVNode(unref(ReInput_default), {
										modelValue: form.value.remark,
										"onUpdate:modelValue": _cache[40] || (_cache[40] = ($event) => form.value.remark = $event),
										placeholder: "可选备注信息"
									}, null, 8, ["modelValue"])]),
									_: 1
								})]),
								_: 1
							})) : createCommentVNode("", true)])
						]),
						_: 1
					})])])]),
					_: 1
				}, 8, ["modelValue", "title"]),
				createVNode(unref(component), {
					modelValue: schemaVisible.value,
					"onUpdate:modelValue": _cache[45] || (_cache[45] = ($event) => schemaVisible.value = $event),
					title: `${schemaSourceName.value} · 表结构`,
					width: "820px"
				}, {
					default: withCtx(() => [createBaseVNode("div", _hoisted_72, [
						createBaseVNode("div", _hoisted_73, [
							_cache[86] || (_cache[86] = createBaseVNode("span", { class: "ds-schema__label" }, "表", -1)),
							createVNode(unref(TableSelect_default), {
								ref_key: "schemaTablePicker",
								ref: schemaTablePicker,
								class: "ds-schema__select",
								datasource: schemaSourceId.value ? String(schemaSourceId.value) : "",
								modelValue: schemaTable.value,
								"onUpdate:modelValue": _cache[43] || (_cache[43] = ($event) => schemaTable.value = $event),
								onLoaded: onSchemaTables,
								onError: onSchemaError
							}, null, 8, ["datasource", "modelValue"]),
							createVNode(unref(ReButton_default), {
								class: "ds-pill",
								icon: "RefreshRight",
								"show-text": true,
								onClick: refreshSchemaTables
							}, {
								default: withCtx(() => [..._cache[85] || (_cache[85] = [createTextVNode("刷新", -1)])]),
								_: 1
							}),
							createBaseVNode("span", _hoisted_74, "共 " + toDisplayString(schemaTables.value.length) + " 张表", 1)
						]),
						schemaError.value ? (openBlock(), createElementBlock("p", _hoisted_75, toDisplayString(schemaError.value), 1)) : (openBlock(), createBlock(unref(ColumnSelect_default), {
							key: 1,
							class: "ds-schema__select ds-schema__column",
							datasource: schemaSourceId.value ? String(schemaSourceId.value) : "",
							modelValue: schemaColumn.value,
							"onUpdate:modelValue": _cache[44] || (_cache[44] = ($event) => schemaColumn.value = $event),
							table: schemaTable.value,
							onLoaded: onSchemaColumns,
							onError: onSchemaError
						}, null, 8, [
							"datasource",
							"modelValue",
							"table"
						])),
						!schemaError.value ? (openBlock(), createBlock(unref(ReTable_default), {
							key: 2,
							columns: schemaColumnDefs.value,
							data: schemaColumns.value,
							"row-key": "name",
							"empty-text": "选择一张表查看列结构"
						}, {
							nullable: withCtx(({ row }) => [createVNode(unref(component$3), {
								effect: "plain",
								type: row.nullable ? "info" : "warning"
							}, {
								default: withCtx(() => [createTextVNode(toDisplayString(row.nullable ? "可空" : "NOT NULL"), 1)]),
								_: 2
							}, 1032, ["type"])]),
							primaryKey: withCtx(({ row }) => [row.primaryKey ? (openBlock(), createBlock(unref(component$3), {
								key: 0,
								effect: "plain",
								type: "danger"
							}, {
								default: withCtx(() => [..._cache[87] || (_cache[87] = [createTextVNode("主键", -1)])]),
								_: 1
							})) : createCommentVNode("", true)]),
							_: 1
						}, 8, ["columns", "data"])) : createCommentVNode("", true)
					])]),
					_: 1
				}, 8, ["modelValue", "title"])
			]);
		};
	}
}), [["__scopeId", "data-v-8335d8da"]]);
//#endregion
export { costMs as n, ScDataSourceView_default as t };
