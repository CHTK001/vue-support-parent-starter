import { D as createVNode, E as createTextVNode, Ht as watch, J as inject, On as unref, _ as createBaseVNode, b as createElementBlock, bt as renderList, ct as onMounted, g as computed, it as onBeforeUnmount, k as defineComponent, mt as openBlock, nr as normalizeStyle, o as Fragment, rr as toDisplayString, tt as nextTick, vn as ref, y as createCommentVNode } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { t as component } from "./ReIcon-By12b2Y9.js";
import { n as token, r as useEchart, t as URL_TREND_COLORS } from "./useEchart-QklTP6NK.js";
//#region ../../pages/datasource/src/components/console/nginx/ngxTypes.ts
/** 状态卡可选指标（stub_status 字段） */
var STAT_METRICS = [
	{
		value: "activeConnections",
		label: "活跃连接（Active）"
	},
	{
		value: "accepts",
		label: "已接受连接（Accepts，累计）"
	},
	{
		value: "handled",
		label: "已处理连接（Handled，累计）"
	},
	{
		value: "requests",
		label: "已处理请求（Requests，累计）"
	},
	{
		value: "reading",
		label: "读请求（Reading）"
	},
	{
		value: "writing",
		label: "写响应（Writing）"
	},
	{
		value: "waiting",
		label: "空闲等待（Waiting）"
	}
];
/** 趋势图可选指标（后台 30s 采集的指标名） */
var TREND_METRICS = [
	{
		value: "active",
		label: "活跃连接（active）"
	},
	{
		value: "accepts",
		label: "接受连接速率（accepts/s）"
	},
	{
		value: "handled",
		label: "处理连接速率（handled/s）"
	},
	{
		value: "requests",
		label: "请求速率（requests/s）"
	},
	{
		value: "reading",
		label: "读请求（reading）"
	},
	{
		value: "writing",
		label: "写响应（writing）"
	},
	{
		value: "waiting",
		label: "空闲等待（waiting）"
	}
];
/** 表格卡可选维度（访问日志 Top 统计） */
var TABLE_DIMENSIONS = [
	{
		value: "paths",
		label: "热点路径 Top"
	},
	{
		value: "ips",
		label: "来源 IP Top"
	},
	{
		value: "statuses",
		label: "状态码分布"
	}
];
/** 卡片类型目录 */
var NGX_CARD_META = {
	"ngx-stat": {
		label: "状态卡",
		description: "stub_status 单值（活跃连接、请求速率等）",
		icon: "Odometer",
		defaultSize: {
			w: 3,
			h: 3
		},
		defaultCard: {
			metric: "activeConnections",
			refreshSeconds: 30
		}
	},
	"ngx-chart": {
		label: "趋势图",
		description: "指标采集趋势（ECharts 折线/柱/面积）",
		icon: "TrendCharts",
		defaultSize: {
			w: 6,
			h: 5
		},
		defaultCard: {
			metrics: ["active", "requests"],
			chartType: "line",
			hours: 6,
			refreshSeconds: 60
		}
	},
	"ngx-table": {
		label: "访问 Top",
		description: "热点路径 / 来源 IP / 状态码分布",
		icon: "Grid",
		defaultSize: {
			w: 6,
			h: 5
		},
		defaultCard: {
			dimension: "paths",
			topN: 10,
			refreshSeconds: 60
		}
	},
	"ngx-script": {
		label: "脚本卡",
		description: "自定义脚本采集并渲染",
		icon: "Cpu",
		defaultSize: {
			w: 4,
			h: 3
		},
		defaultCard: {
			script: [
				"// ctx.status() / ctx.trend(hours, interval) / ctx.accessTop(lines, minutes, topN) / ctx.urlTrend(lines, topN)",
				"const st = await ctx.status();",
				"if (!st.available) return st.message;",
				"return `活跃 ${st.activeConnections} · 累计请求 ${st.requests}`;"
			].join("\n"),
			refreshSeconds: 30
		}
	}
};
/** 组件目录（给 WidgetLibrary 用；与 home 注册表解耦，只过滤出 Nginx 卡片） */
var NGX_CARD_CATALOG = Object.keys(NGX_CARD_META).map((type) => {
	const meta = NGX_CARD_META[type];
	return {
		type,
		title: meta.label,
		description: meta.description,
		icon: meta.icon,
		defaultSize: meta.defaultSize,
		category: "common",
		environment: "prod",
		requiredPermission: "user",
		maxCount: 24
	};
});
/** 卡片取数上下文注入键 */
var NGX_CTX_KEY = Symbol("ngx-context");
/** 新建一个空布局 */
var emptyNgxLayout = () => ({
	version: 1,
	widgets: [],
	grid: []
});
/** 解析持久化配置为布局；宽容处理坏数据 */
var parseNgxLayout = (config) => {
	if (!config) return emptyNgxLayout();
	try {
		const raw = JSON.parse(config);
		if (raw && Array.isArray(raw.widgets) && Array.isArray(raw.grid)) return {
			version: raw.version ?? 1,
			widgets: raw.widgets,
			grid: raw.grid
		};
	} catch {}
	return emptyNgxLayout();
};
/** 序列化布局 */
var serializeNgxLayout = (layout) => JSON.stringify({
	version: layout.version ?? 1,
	widgets: layout.widgets,
	grid: layout.grid
});
/** 生成卡片 id */
var newNgxCardId = () => `nw-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
//#endregion
//#region ../../pages/datasource/src/components/console/nginx/NgxCardRenderer.vue?vue&type=script&setup=true&name=NgxCardRenderer&lang.ts
var _hoisted_1 = ["data-ngx-kind"];
var _hoisted_2 = {
	key: 0,
	class: "ngx-card-head"
};
var _hoisted_3 = ["title"];
var _hoisted_4 = { class: "ngx-card-head-right" };
var _hoisted_5 = {
	key: 0,
	class: "ngx-card-time"
};
var _hoisted_6 = { class: "ngx-card-body" };
var _hoisted_7 = ["title"];
var _hoisted_8 = {
	key: 0,
	class: "ngx-stat"
};
var _hoisted_9 = { class: "ngx-stat-value" };
var _hoisted_10 = { class: "ngx-stat-sub" };
var _hoisted_11 = {
	key: 2,
	class: "ngx-table-wrap"
};
var _hoisted_12 = {
	key: 0,
	class: "ngx-table-summary"
};
var _hoisted_13 = {
	key: 1,
	class: "ngx-table"
};
var _hoisted_14 = { key: 0 };
var _hoisted_15 = { key: 1 };
var _hoisted_16 = {
	key: 2,
	class: "ngx-table-num"
};
var _hoisted_17 = ["title"];
var _hoisted_18 = { class: "ngx-table-num" };
var _hoisted_19 = {
	key: 0,
	class: "ngx-table-num"
};
var _hoisted_20 = {
	key: 2,
	class: "ngx-card-hint"
};
var _hoisted_21 = {
	key: 3,
	class: "ngx-script"
};
var _hoisted_22 = {
	key: 0,
	class: "ngx-script-out"
};
var _hoisted_23 = {
	key: 1,
	class: "ngx-card-hint"
};
var _hoisted_24 = {
	key: 2,
	class: "ngx-card-loading"
};
var _hoisted_25 = ["title"];
//#endregion
//#region ../../pages/datasource/src/components/console/nginx/NgxCardRenderer.vue
var NgxCardRenderer_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	__name: "NgxCardRenderer",
	props: {
		widget: {},
		hideTitle: {
			type: Boolean,
			default: false
		}
	},
	setup(__props) {
		/**
		* Nginx 看板卡片渲染器。
		*
		* <p>一张卡片 = 一个 widget：按 {@code widget.type} 渲染状态卡 / 趋势图 / 访问 Top / 脚本卡。
		* 卡片配置（指标名、图表类型、ECharts 参数、脚本、背景色、自定义 CSS、刷新间隔）来自
		* {@code widget.ngx}，由设置弹窗（表单/自定义双模式）产出。数据取数走注入的
		* {@link NgxDataContext}，因此同一套卡片在控制台与嵌入页复用。</p>
		*
		* @author CH
		* @since 4.0.0.42
		*/
		const props = __props;
		const ctx = inject(NGX_CTX_KEY, null);
		/** 卡片实例唯一标识：既给 style 作用域用（自定义 CSS），也避免多卡样式互串 */
		const uid = `nc-${Math.random().toString(36).slice(2, 10)}`;
		const kind = computed(() => props.widget.type || "ngx-stat");
		const config = computed(() => props.widget.ngx ?? {});
		const title = computed(() => props.widget.title || NGX_CARD_META[kind.value]?.label || "卡片");
		const loading = ref(false);
		const error = ref("");
		const configWarn = ref("");
		const updatedAt = ref("");
		const statusData = ref(null);
		const trendPoints = ref([]);
		const tableData = ref(null);
		const scriptOutput = ref("");
		const hasData = computed(() => statusData.value !== null || trendPoints.value.length > 0 || tableData.value !== null || scriptOutput.value !== "");
		const shellStyle = computed(() => {
			const style = {};
			if (config.value.background) style.background = config.value.background;
			if (config.value.textColor) style.color = config.value.textColor;
			const radius = props.widget.appearance?.borderRadius;
			if (typeof radius === "number") style.borderRadius = `${radius}px`;
			return style;
		});
		let styleEl = null;
		function rebuildCustomCss() {
			if (typeof document === "undefined") return;
			if (!styleEl) {
				styleEl = document.createElement("style");
				styleEl.setAttribute("data-ngx-card-style", uid);
				document.head.appendChild(styleEl);
			}
			const css = (config.value.css || "").trim();
			styleEl.textContent = css ? `.ngx-card[data-ngx-uid="${uid}"] { ${css} }` : "";
		}
		async function load() {
			if (!ctx) {
				error.value = "数据上下文缺失";
				return;
			}
			if (kind.value === "ngx-script") {
				await runScript();
				return;
			}
			loading.value = true;
			error.value = "";
			try {
				if (kind.value === "ngx-stat") statusData.value = await ctx.status();
				else if (kind.value === "ngx-chart") {
					const hours = config.value.hours && config.value.hours > 0 ? config.value.hours : 6;
					const interval = config.value.interval;
					const trend = await ctx.trend(hours, interval);
					trendPoints.value = trend.points ?? [];
				} else if (kind.value === "ngx-table") {
					const lines = config.value.lines;
					const minutes = config.value.minutes;
					const topN = config.value.topN && config.value.topN > 0 ? config.value.topN : 10;
					tableData.value = await ctx.accessTop(lines, minutes, topN);
				}
				updatedAt.value = (/* @__PURE__ */ new Date()).toLocaleTimeString("zh-CN", { hour12: false });
				await nextTick();
				render();
			} catch (e) {
				error.value = e?.message || String(e);
				statusData.value = null;
				trendPoints.value = [];
				tableData.value = null;
			} finally {
				loading.value = false;
			}
		}
		async function runScript() {
			const code = (config.value.script || "").trim();
			if (!code) {
				error.value = "未配置脚本";
				return;
			}
			loading.value = true;
			error.value = "";
			try {
				const out = await new Function("ctx", `"use strict";\nreturn (async () => {\n${code}\n})();`)(scriptCtx());
				scriptOutput.value = typeof out === "string" ? out : out === void 0 || out === null ? "" : JSON.stringify(out, null, 2);
				updatedAt.value = (/* @__PURE__ */ new Date()).toLocaleTimeString("zh-CN", { hour12: false });
			} catch (e) {
				error.value = `脚本执行失败: ${e?.message ?? e}`;
				scriptOutput.value = "";
			} finally {
				loading.value = false;
			}
		}
		function scriptCtx() {
			return {
				status: () => ctx.status(),
				trend: (hours, interval) => ctx.trend(hours, interval),
				accessTop: (lines, minutes, topN) => ctx.accessTop(lines, minutes, topN),
				urlTrend: (lines, topN) => ctx.urlTrend(lines, topN),
				datasourceId: ctx.datasourceId ?? null,
				embed: ctx.embed,
				now: Date.now()
			};
		}
		const STAT_LABELS = {
			activeConnections: "Active",
			accepts: "Accepts",
			handled: "Handled",
			requests: "Requests",
			reading: "Reading",
			writing: "Writing",
			waiting: "Waiting"
		};
		const statText = computed(() => {
			const st = statusData.value;
			if (!st || !st.available) return "—";
			const val = st[config.value.metric || "activeConnections"];
			if (val === null || val === void 0) return "—";
			const num = typeof val === "number" ? val : parseFloat(val);
			if (!Number.isFinite(num)) return String(val);
			const decimals = config.value.decimals ?? 0;
			const unit = config.value.unit || "";
			return `${Number(num.toFixed(Math.max(0, Math.min(6, decimals))))}${unit}`;
		});
		const statSub = computed(() => {
			const st = statusData.value;
			if (!st) return "无数据";
			if (!st.available) return st.message || "状态不可用";
			const field = config.value.metric || "activeConnections";
			return STAT_LABELS[field] || field;
		});
		const dimension = computed(() => config.value.dimension || "paths");
		const tableSummary = computed(() => {
			const d = tableData.value;
			if (!d) return "";
			const parts = [`共 ${d.total} 行`];
			if (d.uniqueIps != null) parts.push(`${d.uniqueIps} 个 IP`);
			if (d.clientErrors != null && d.clientErrors > 0) parts.push(`4xx ${d.clientErrors}`);
			if (d.serverErrors != null && d.serverErrors > 0) parts.push(`5xx ${d.serverErrors}`);
			return parts.join(" · ");
		});
		const tableRows = computed(() => {
			const d = tableData.value;
			if (!d) return [];
			const dim = dimension.value;
			if (dim === "statuses") return (d.statuses ?? []).map((s) => ({
				key: s.category,
				hits: String(s.hits),
				pct: `${(s.pct ?? 0).toFixed(1)}%`
			}));
			return (d[dim] ?? []).map((item) => ({
				key: item.key,
				hits: String(item.hits)
			}));
		});
		const chartEl = ref(null);
		function deepMerge(base, extra) {
			if (extra === null || extra === void 0 || typeof extra !== "object" || Array.isArray(extra)) return base;
			if (typeof base !== "object" || base === null || Array.isArray(base)) return base;
			const out = { ...base };
			for (const [key, value] of Object.entries(extra)) {
				const current = out[key];
				out[key] = value && typeof value === "object" && !Array.isArray(value) && current && typeof current === "object" ? deepMerge(current, value) : value;
			}
			return out;
		}
		function parseEchartsExtra() {
			const text = (config.value.echarts || "").trim();
			if (!text) {
				configWarn.value = "";
				return null;
			}
			try {
				const parsed = JSON.parse(text);
				configWarn.value = "";
				return parsed && typeof parsed === "object" ? parsed : null;
			} catch (e) {
				configWarn.value = `ECharts 参数不是合法 JSON：${e?.message ?? e}`;
				return null;
			}
		}
		/** 把 "yyyy-MM-dd HH:mm:ss" 解析成 epoch 毫秒（按本地时区） */
		function parseTimeMs(timeStr) {
			if (!timeStr) return Date.now();
			const ms = Date.parse(timeStr.replace(" ", "T"));
			return Number.isFinite(ms) ? ms : Date.now();
		}
		function buildOption() {
			const selected = config.value.metrics?.length ? config.value.metrics : ["active", "requests"];
			const chartType = config.value.chartType ?? "line";
			const grouped = {};
			for (const pt of trendPoints.value) {
				if (!selected.includes(pt.name)) continue;
				if (!grouped[pt.name]) grouped[pt.name] = [];
				const y = pt.rate != null ? pt.rate : pt.value;
				grouped[pt.name].push([parseTimeMs(pt.time), y]);
			}
			const names = Object.keys(grouped);
			const base = {
				animation: false,
				grid: {
					left: 6,
					right: 12,
					top: names.length > 1 ? 30 : 12,
					bottom: 4,
					containLabel: true
				},
				tooltip: { trigger: "axis" },
				color: names.map((_, i) => token(URL_TREND_COLORS[i % URL_TREND_COLORS.length])),
				xAxis: {
					type: "time",
					axisLine: { lineStyle: { color: token("--border-subtle") } },
					axisLabel: {
						color: token("--text-tertiary"),
						fontSize: 10
					}
				},
				yAxis: {
					type: "value",
					splitLine: { lineStyle: { color: token("--border-subtle") } },
					axisLabel: {
						color: token("--text-tertiary"),
						fontSize: 10
					}
				},
				series: names.map((name, i) => ({
					name,
					type: chartType === "bar" ? "bar" : "line",
					data: grouped[name],
					smooth: chartType === "line",
					showSymbol: false,
					barMaxWidth: 18,
					areaStyle: chartType === "area" ? { opacity: .16 } : void 0,
					connectNulls: false
				}))
			};
			if (names.length > 1) base.legend = {
				top: 0,
				type: "scroll",
				textStyle: {
					fontSize: 10,
					color: token("--text-secondary")
				}
			};
			const extra = parseEchartsExtra();
			return extra ? deepMerge(base, extra) : base;
		}
		const { render } = useEchart(chartEl, buildOption);
		let timer = null;
		function clearTimer() {
			if (timer !== null) {
				window.clearInterval(timer);
				timer = null;
			}
		}
		function setupTimer() {
			clearTimer();
			const seconds = Number(config.value.refreshSeconds ?? 30);
			if (seconds > 0) timer = window.setInterval(() => load(), Math.max(5, seconds) * 1e3);
		}
		onMounted(() => {
			rebuildCustomCss();
			setupTimer();
			load();
		});
		onBeforeUnmount(() => {
			clearTimer();
			styleEl?.remove();
			styleEl = null;
		});
		watch(() => [props.widget.ngx, props.widget.type], () => {
			rebuildCustomCss();
			setupTimer();
			load();
		}, { deep: true });
		return (_ctx, _cache) => {
			return openBlock(), createElementBlock("div", {
				class: "ngx-card",
				"data-ngx-uid": uid,
				"data-ngx-kind": kind.value,
				style: normalizeStyle(shellStyle.value)
			}, [!__props.hideTitle ? (openBlock(), createElementBlock("div", _hoisted_2, [createBaseVNode("span", {
				class: "ngx-card-title",
				title: title.value
			}, toDisplayString(title.value), 9, _hoisted_3), createBaseVNode("span", _hoisted_4, [updatedAt.value && !error.value ? (openBlock(), createElementBlock("span", _hoisted_5, toDisplayString(updatedAt.value), 1)) : createCommentVNode("", true), createBaseVNode("button", {
				class: "ngx-card-refresh",
				type: "button",
				"data-testid": "ngx-card-refresh",
				title: "刷新",
				"aria-label": "刷新",
				onClick: _cache[0] || (_cache[0] = ($event) => load())
			}, [createVNode(unref(component), {
				name: "Refresh",
				size: 12
			})])])])) : createCommentVNode("", true), createBaseVNode("div", _hoisted_6, [
				error.value ? (openBlock(), createElementBlock("div", {
					key: 0,
					class: "ngx-card-error",
					title: error.value
				}, toDisplayString(error.value), 9, _hoisted_7)) : (openBlock(), createElementBlock(Fragment, { key: 1 }, [kind.value === "ngx-stat" ? (openBlock(), createElementBlock("div", _hoisted_8, [createBaseVNode("div", _hoisted_9, toDisplayString(statText.value), 1), createBaseVNode("div", _hoisted_10, toDisplayString(statSub.value), 1)])) : kind.value === "ngx-chart" ? (openBlock(), createElementBlock("div", {
					key: 1,
					ref_key: "chartEl",
					ref: chartEl,
					class: "ngx-chart"
				}, null, 512)) : kind.value === "ngx-table" ? (openBlock(), createElementBlock("div", _hoisted_11, [tableSummary.value ? (openBlock(), createElementBlock("div", _hoisted_12, toDisplayString(tableSummary.value), 1)) : createCommentVNode("", true), tableRows.value.length ? (openBlock(), createElementBlock("table", _hoisted_13, [createBaseVNode("thead", null, [createBaseVNode("tr", null, [
					dimension.value === "statuses" ? (openBlock(), createElementBlock("th", _hoisted_14, "类别")) : (openBlock(), createElementBlock("th", _hoisted_15, toDisplayString(dimension.value === "ips" ? "IP" : "路径"), 1)),
					_cache[1] || (_cache[1] = createBaseVNode("th", { class: "ngx-table-num" }, "命中", -1)),
					dimension.value === "statuses" ? (openBlock(), createElementBlock("th", _hoisted_16, "占比")) : createCommentVNode("", true)
				])]), createBaseVNode("tbody", null, [(openBlock(true), createElementBlock(Fragment, null, renderList(tableRows.value, (row, i) => {
					return openBlock(), createElementBlock("tr", { key: `${row.key}-${i}` }, [
						createBaseVNode("td", {
							class: "ngx-table-key",
							title: row.key
						}, toDisplayString(row.key), 9, _hoisted_17),
						createBaseVNode("td", _hoisted_18, toDisplayString(row.hits), 1),
						dimension.value === "statuses" ? (openBlock(), createElementBlock("td", _hoisted_19, toDisplayString(row.pct ?? "—"), 1)) : createCommentVNode("", true)
					]);
				}), 128))])])) : (openBlock(), createElementBlock("div", _hoisted_20, "暂无数据"))])) : (openBlock(), createElementBlock("div", _hoisted_21, [scriptOutput.value ? (openBlock(), createElementBlock("pre", _hoisted_22, toDisplayString(scriptOutput.value), 1)) : (openBlock(), createElementBlock("div", _hoisted_23, "暂无输出"))]))], 64)),
				loading.value && !hasData.value ? (openBlock(), createElementBlock("div", _hoisted_24, [..._cache[2] || (_cache[2] = [createBaseVNode("span", { class: "ngx-card-loading-dot" }, null, -1), createTextVNode(" 加载中… ", -1)])])) : createCommentVNode("", true),
				configWarn.value ? (openBlock(), createElementBlock("div", {
					key: 3,
					class: "ngx-card-warn",
					title: configWarn.value
				}, toDisplayString(configWarn.value), 9, _hoisted_25)) : createCommentVNode("", true)
			])], 12, _hoisted_1);
		};
	}
}), [["__scopeId", "data-v-a3c790ce"]]);
//#endregion
export { STAT_METRICS as a, emptyNgxLayout as c, serializeNgxLayout as d, NGX_CTX_KEY as i, newNgxCardId as l, NGX_CARD_CATALOG as n, TABLE_DIMENSIONS as o, NGX_CARD_META as r, TREND_METRICS as s, NgxCardRenderer_default as t, parseNgxLayout as u };
