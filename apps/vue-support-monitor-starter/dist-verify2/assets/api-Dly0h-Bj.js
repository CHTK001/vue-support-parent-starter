import { D as createVNode, E as createTextVNode, Ht as watch, J as inject, On as unref, _ as createBaseVNode, b as createElementBlock, bt as renderList, ct as onMounted, g as computed, it as onBeforeUnmount, k as defineComponent, mt as openBlock, nr as normalizeStyle, o as Fragment, rr as toDisplayString, tt as nextTick, vn as ref, y as createCommentVNode } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { w as unwrapResult, x as http } from "./src-DDwlSqPX.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { u as fetchDataSources } from "./src-DW2Ffr17.js";
import { t as component } from "./ReIcon-By12b2Y9.js";
import { n as token, r as useEchart, t as URL_TREND_COLORS } from "./useEchart-QklTP6NK.js";
//#region ../../pages/datasource/src/components/console/prometheus/promTypes.ts
/** 卡片类型目录 */
var PROM_CARD_META = {
	"prom-stat": {
		label: "指标卡",
		description: "单值展示（目标数、QPS 等）",
		icon: "Odometer",
		defaultSize: {
			w: 3,
			h: 3
		},
		defaultCard: {
			mode: "instant",
			promql: "up",
			refreshSeconds: 30,
			decimals: 2
		}
	},
	"prom-chart": {
		label: "趋势图",
		description: "ECharts 折线/柱状/面积图",
		icon: "TrendCharts",
		defaultSize: {
			w: 6,
			h: 5
		},
		defaultCard: {
			mode: "range",
			promql: "rate(prometheus_http_requests_total{code=\"200\"}[5m])",
			chartType: "line",
			durationMinutes: 60,
			refreshSeconds: 30
		}
	},
	"prom-table": {
		label: "数据表",
		description: "查询结果明细表",
		icon: "Grid",
		defaultSize: {
			w: 6,
			h: 5
		},
		defaultCard: {
			mode: "instant",
			promql: "up",
			refreshSeconds: 60
		}
	},
	"prom-script": {
		label: "脚本卡",
		description: "自定义脚本采集并渲染",
		icon: "Cpu",
		defaultSize: {
			w: 4,
			h: 3
		},
		defaultCard: {
			script: [
				"// ctx.query(promql) / ctx.queryRange(promql, minutes, step)",
				"const res = await ctx.query('up');",
				"const list = res.data?.result || [];",
				"const down = list.filter(s => s.value && s.value[1] !== '1').length;",
				"return `在线 ${list.length - down} / 共 ${list.length}`;"
			].join("\n"),
			refreshSeconds: 30
		}
	}
};
/** 组件目录（给 WidgetLibrary 用；与 home 注册表解耦，只过滤出 Prometheus 卡片） */
var PROM_CARD_CATALOG = Object.keys(PROM_CARD_META).map((type) => {
	const meta = PROM_CARD_META[type];
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
var PROM_CTX_KEY = Symbol("prom-context");
/** 新建一个空布局 */
var emptyLayout = () => ({
	version: 1,
	widgets: [],
	grid: []
});
/** 解析持久化配置为布局；宽容处理坏数据 */
var parseLayout = (config) => {
	if (!config) return emptyLayout();
	try {
		const raw = JSON.parse(config);
		if (raw && Array.isArray(raw.widgets) && Array.isArray(raw.grid)) return {
			version: raw.version ?? 1,
			widgets: raw.widgets,
			grid: raw.grid
		};
	} catch {}
	return emptyLayout();
};
/** 序列化布局 */
var serializeLayout = (layout) => JSON.stringify({
	version: layout.version ?? 1,
	widgets: layout.widgets,
	grid: layout.grid
});
/** 生成卡片 id */
var newCardId = () => `pw-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
/** 把标签集合排版成 `job="x", instance="y"` */
var formatMetric = (metric) => {
	if (!metric) return "{}";
	const keys = Object.keys(metric);
	if (keys.length === 0) return "{}";
	return keys.map((k) => `${k}="${metric[k]}"`).join(", ");
};
/** 从范围查询的 series 里取「自动步长」：按跨越时长选择常用粒度 */
var autoStep = (startSec, endSec) => {
	const span = Math.max(1, endSec - startSec);
	if (span <= 1800) return "15s";
	if (span <= 10800) return "30s";
	if (span <= 43200) return "1m";
	if (span <= 172800) return "5m";
	return "15m";
};
/** 格式化数字（小数位 + 单位） */
var formatNumber = (value, decimals = 2, unit = "") => {
	if (!Number.isFinite(value)) return `-${unit}`;
	return `${Number(value.toFixed(Math.max(0, Math.min(6, decimals))))}${unit}`;
};
//#endregion
//#region ../../pages/datasource/src/components/console/prometheus/PromCardRenderer.vue?vue&type=script&setup=true&name=PromCardRenderer&lang.ts
var _hoisted_1 = ["data-prom-kind"];
var _hoisted_2 = {
	key: 0,
	class: "prom-card-head"
};
var _hoisted_3 = ["title"];
var _hoisted_4 = { class: "prom-card-head-right" };
var _hoisted_5 = {
	key: 0,
	class: "prom-card-time"
};
var _hoisted_6 = { class: "prom-card-body" };
var _hoisted_7 = ["title"];
var _hoisted_8 = {
	key: 0,
	class: "prom-stat"
};
var _hoisted_9 = { class: "prom-stat-value" };
var _hoisted_10 = { class: "prom-stat-sub" };
var _hoisted_11 = {
	key: 2,
	class: "prom-table-wrap"
};
var _hoisted_12 = {
	key: 0,
	class: "prom-table"
};
var _hoisted_13 = { key: 0 };
var _hoisted_14 = { key: 1 };
var _hoisted_15 = { key: 2 };
var _hoisted_16 = { key: 3 };
var _hoisted_17 = ["title"];
var _hoisted_18 = { key: 0 };
var _hoisted_19 = { key: 1 };
var _hoisted_20 = { key: 2 };
var _hoisted_21 = { key: 3 };
var _hoisted_22 = {
	key: 1,
	class: "prom-card-hint"
};
var _hoisted_23 = {
	key: 3,
	class: "prom-script"
};
var _hoisted_24 = {
	key: 0,
	class: "prom-script-out"
};
var _hoisted_25 = {
	key: 1,
	class: "prom-card-hint"
};
var _hoisted_26 = {
	key: 2,
	class: "prom-card-loading"
};
var _hoisted_27 = ["title"];
//#endregion
//#region ../../pages/datasource/src/components/console/prometheus/PromCardRenderer.vue
var PromCardRenderer_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	__name: "PromCardRenderer",
	props: {
		widget: {},
		hideTitle: {
			type: Boolean,
			default: false
		}
	},
	setup(__props) {
		/**
		* Prometheus 看板卡片渲染器。
		*
		* <p>一张卡片 = 一个 widget：按 {@code widget.type} 渲染指标卡 / 趋势图 / 数据表 / 脚本卡。
		* 卡片配置（PromQL、ECharts 参数、脚本、背景色、自定义 CSS、刷新间隔）来自
		* {@code widget.prom}，由设置弹窗（表单/自定义双模式）产出。数据取数走注入的
		* {@link PromDataContext}，因此同一套卡片在控制台与嵌入页复用。</p>
		*
		* <p>组件刻意做成「四类卡片合体」而不是四个注册组件：四者共享同一条取数/刷新/
		* 错误处理链路，拆开后每一处修补都要抄四遍。</p>
		*/
		const props = __props;
		const ctx = inject(PROM_CTX_KEY, null);
		/** 卡片实例唯一标识：既给 style 作用域用（自定义 CSS），也避免多卡样式互串 */
		const uid = `pc-${Math.random().toString(36).slice(2, 10)}`;
		const kind = computed(() => props.widget.type || "prom-stat");
		const config = computed(() => props.widget.prom ?? {});
		const title = computed(() => props.widget.title || PROM_CARD_META[kind.value]?.label || "卡片");
		const rangeMode = computed(() => (config.value.mode ?? (kind.value === "prom-chart" ? "range" : "instant")) === "range");
		const loading = ref(false);
		const error = ref("");
		const configWarn = ref("");
		const updatedAt = ref("");
		const response = ref(null);
		const scriptOutput = ref("");
		const hasData = computed(() => response.value !== null || scriptOutput.value !== "");
		/** 卡片外壳样式：背景色 / 文字色 / 圆角（appearance 与 prom 配置都算数） */
		const shellStyle = computed(() => {
			const style = {};
			if (config.value.background) style.background = config.value.background;
			if (config.value.textColor) style.color = config.value.textColor;
			const radius = props.widget.appearance?.borderRadius;
			if (typeof radius === "number") style.borderRadius = `${radius}px`;
			return style;
		});
		let styleEl = null;
		/** 把「自定义 CSS」注入到 head，用属性选择器圈定本卡片 */
		function rebuildCustomCss() {
			if (typeof document === "undefined") return;
			if (!styleEl) {
				styleEl = document.createElement("style");
				styleEl.setAttribute("data-prom-card-style", uid);
				document.head.appendChild(styleEl);
			}
			const css = (config.value.css || "").trim();
			styleEl.textContent = css ? `.prom-card[data-prom-uid="${uid}"] { ${css} }` : "";
		}
		/**
		* 取一次数据。
		*
		* @param silent 保留参数位：目前与普通加载同路径（刷新按钮也会带 loading），便于将来做静默轮询
		*/
		async function load(silent = false) {
			if (!ctx) {
				error.value = "数据上下文缺失";
				return;
			}
			if (kind.value === "prom-script") {
				await runScript();
				return;
			}
			const promql = (config.value.promql || "").trim();
			if (!promql) {
				error.value = "未配置 PromQL";
				return;
			}
			loading.value = true;
			error.value = "";
			try {
				if (rangeMode.value) {
					const minutes = config.value.durationMinutes && config.value.durationMinutes > 0 ? config.value.durationMinutes : 60;
					const end = Math.floor(Date.now() / 1e3);
					const start = end - minutes * 60;
					const step = (config.value.step || "").trim() || autoStep(start, end);
					response.value = await ctx.queryRange(promql, start, end, step);
				} else response.value = await ctx.query(promql);
				updatedAt.value = (/* @__PURE__ */ new Date()).toLocaleTimeString("zh-CN", { hour12: false });
				await nextTick();
				render();
			} catch (e) {
				error.value = e?.message || String(e);
				response.value = null;
			} finally {
				loading.value = false;
			}
		}
		/** 脚本卡：脚本体在沙箱外直接执行（后台管理员自己配置的采集脚本），ctx 提供取数能力 */
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
		/** 脚本可用的上下文（仅暴露取数与数据源标识，不暴露页面内部状态） */
		function scriptCtx() {
			return {
				query: (q, time) => ctx.query(q, time),
				queryRange: (q, minutes, step) => {
					const end = Math.floor(Date.now() / 1e3);
					const start = end - (minutes && minutes > 0 ? minutes : config.value.durationMinutes || 60) * 60;
					return ctx.queryRange(q, start, end, (step || "").trim() || autoStep(start, end));
				},
				datasourceId: ctx.datasourceId ?? null,
				now: Date.now()
			};
		}
		/** 指标卡主值：取第一条序列的最新点 */
		const statText = computed(() => {
			const series = response.value?.data?.result ?? [];
			if (!series.length) return "—";
			const first = series[0];
			const raw = first.values?.length ? first.values[first.values.length - 1][1] : first.value ? first.value[1] : "";
			const num = parseFloat(raw);
			if (!Number.isFinite(num)) return raw || "—";
			return formatNumber(num, config.value.decimals ?? 2, config.value.unit || "");
		});
		/** 指标卡副标题：序列数 / 首条序列标签 */
		const statSub = computed(() => {
			const series = response.value?.data?.result ?? [];
			if (!series.length) return "无数据";
			const text = formatMetric(series[0].metric);
			return series.length > 1 ? `${text}（共 ${series.length} 条序列）` : text;
		});
		const tableRows = computed(() => {
			const series = response.value?.data?.result ?? [];
			const decimals = config.value.decimals ?? 2;
			const unit = config.value.unit || "";
			return series.map((s) => {
				const name = formatMetric(s.metric);
				if (s.values?.length) {
					const nums = s.values.map((v) => parseFloat(v[1])).filter((n) => Number.isFinite(n));
					return {
						name,
						last: formatNumber(parseFloat(s.values[s.values.length - 1][1]), decimals, unit),
						min: nums.length ? formatNumber(Math.min(...nums), decimals, unit) : "—",
						max: nums.length ? formatNumber(Math.max(...nums), decimals, unit) : "—"
					};
				}
				return {
					name,
					last: formatNumber(s.value ? parseFloat(s.value[1]) : NaN, decimals, unit),
					min: "",
					max: ""
				};
			});
		});
		const chartEl = ref(null);
		/** ECharts 参数（自定义 JSON）深合并 */
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
		/** 解析 ECharts 参数 JSON；失败时给出可见告警而不是静默吞掉 */
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
		/** 用当前数据构造图表配置；useEchart 每次重绘都会重新调用 */
		function buildOption() {
			const series = response.value?.data?.result ?? [];
			const names = series.map((s) => formatMetric(s.metric));
			const chartType = config.value.chartType ?? "line";
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
				series: series.map((s, i) => {
					const data = (s.values ?? (s.value ? [s.value] : [])).map((v) => [v[0] * 1e3, parseFloat(v[1])]);
					return {
						name: names[i],
						type: chartType === "bar" ? "bar" : "line",
						data,
						smooth: chartType === "line",
						showSymbol: false,
						barMaxWidth: 18,
						areaStyle: chartType === "area" ? { opacity: .16 } : void 0
					};
				})
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
			if (seconds > 0) timer = window.setInterval(() => load(true), Math.max(5, seconds) * 1e3);
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
		watch(() => [props.widget.prom, props.widget.type], () => {
			rebuildCustomCss();
			setupTimer();
			load();
		}, { deep: true });
		return (_ctx, _cache) => {
			return openBlock(), createElementBlock("div", {
				class: "prom-card",
				"data-prom-uid": uid,
				"data-prom-kind": kind.value,
				style: normalizeStyle(shellStyle.value)
			}, [!__props.hideTitle ? (openBlock(), createElementBlock("div", _hoisted_2, [createBaseVNode("span", {
				class: "prom-card-title",
				title: title.value
			}, toDisplayString(title.value), 9, _hoisted_3), createBaseVNode("span", _hoisted_4, [updatedAt.value && !error.value ? (openBlock(), createElementBlock("span", _hoisted_5, toDisplayString(updatedAt.value), 1)) : createCommentVNode("", true), createBaseVNode("button", {
				class: "prom-card-refresh",
				type: "button",
				"data-testid": "prom-card-refresh",
				title: "刷新",
				"aria-label": "刷新",
				onClick: _cache[0] || (_cache[0] = ($event) => load())
			}, [createVNode(unref(component), {
				name: "Refresh",
				size: 12
			})])])])) : createCommentVNode("", true), createBaseVNode("div", _hoisted_6, [
				error.value ? (openBlock(), createElementBlock("div", {
					key: 0,
					class: "prom-card-error",
					title: error.value
				}, toDisplayString(error.value), 9, _hoisted_7)) : (openBlock(), createElementBlock(Fragment, { key: 1 }, [kind.value === "prom-stat" ? (openBlock(), createElementBlock("div", _hoisted_8, [createBaseVNode("div", _hoisted_9, toDisplayString(statText.value), 1), createBaseVNode("div", _hoisted_10, toDisplayString(statSub.value), 1)])) : kind.value === "prom-chart" ? (openBlock(), createElementBlock("div", {
					key: 1,
					ref_key: "chartEl",
					ref: chartEl,
					class: "prom-chart"
				}, null, 512)) : kind.value === "prom-table" ? (openBlock(), createElementBlock("div", _hoisted_11, [tableRows.value.length ? (openBlock(), createElementBlock("table", _hoisted_12, [createBaseVNode("thead", null, [createBaseVNode("tr", null, [
					_cache[1] || (_cache[1] = createBaseVNode("th", null, "序列", -1)),
					rangeMode.value ? (openBlock(), createElementBlock("th", _hoisted_13, "最新")) : createCommentVNode("", true),
					rangeMode.value ? (openBlock(), createElementBlock("th", _hoisted_14, "最小")) : createCommentVNode("", true),
					rangeMode.value ? (openBlock(), createElementBlock("th", _hoisted_15, "最大")) : (openBlock(), createElementBlock("th", _hoisted_16, "值"))
				])]), createBaseVNode("tbody", null, [(openBlock(true), createElementBlock(Fragment, null, renderList(tableRows.value, (row) => {
					return openBlock(), createElementBlock("tr", { key: row.name }, [
						createBaseVNode("td", {
							class: "prom-table-name",
							title: row.name
						}, toDisplayString(row.name), 9, _hoisted_17),
						rangeMode.value ? (openBlock(), createElementBlock("td", _hoisted_18, toDisplayString(row.last), 1)) : createCommentVNode("", true),
						rangeMode.value ? (openBlock(), createElementBlock("td", _hoisted_19, toDisplayString(row.min), 1)) : createCommentVNode("", true),
						rangeMode.value ? (openBlock(), createElementBlock("td", _hoisted_20, toDisplayString(row.max), 1)) : (openBlock(), createElementBlock("td", _hoisted_21, toDisplayString(row.last), 1))
					]);
				}), 128))])])) : (openBlock(), createElementBlock("div", _hoisted_22, "暂无数据"))])) : (openBlock(), createElementBlock("div", _hoisted_23, [scriptOutput.value ? (openBlock(), createElementBlock("pre", _hoisted_24, toDisplayString(scriptOutput.value), 1)) : (openBlock(), createElementBlock("div", _hoisted_25, "暂无输出"))]))], 64)),
				loading.value && !hasData.value ? (openBlock(), createElementBlock("div", _hoisted_26, [..._cache[2] || (_cache[2] = [createBaseVNode("span", { class: "prom-card-loading-dot" }, null, -1), createTextVNode(" 加载中… ", -1)])])) : createCommentVNode("", true),
				configWarn.value ? (openBlock(), createElementBlock("div", {
					key: 3,
					class: "prom-card-warn",
					title: configWarn.value
				}, toDisplayString(configWarn.value), 9, _hoisted_27)) : createCommentVNode("", true)
			])], 12, _hoisted_1);
		};
	}
}), [["__scopeId", "data-v-c54144ca"]]);
//#endregion
//#region ../../pages/datasource/src/api/prometheus/api.ts
/**
* Prometheus 控制台 接口封装
*
* <p>对接 {@code spring-support-datasource-hub-starter} 的 {@code PrometheusManageController}。
* 两条线：查询走 Prometheus HTTP API（后端代理），配置/看板走本模块接口。</p>
*
* <p>嵌入场景（{@code /dashboard/embed/**}）用原生 fetch 直连：嵌入页可能没有登录态，
* 不能走 {@code http()}（它会给请求挂令牌/统一错误提示）。</p>
*
* @author CH
* @since 4.0.0.42
*/
var unwrap = (res) => unwrapResult(res);
/** 接口根路径 */
var B = "/ms/monitor/prometheus";
/** 列出 type 为 prometheus 的数据源 */
var fetchPrometheusSources = async () => {
	return (await fetchDataSources() || []).filter((d) => d.type === "prometheus");
};
/**
* 读取总览。
*
* @param datasourceId 数据源 ID，可空
*/
var fetchPrometheusOverview = (datasourceId) => http().get(`${B}/overview`).query({ datasourceId }).noToast(true).then((r) => unwrap(r));
/**
* 即时查询。
*
* @param datasourceId 数据源 ID，可空
* @param query        PromQL
* @param time         求值时刻，可空
*/
var prometheusQuery = (datasourceId, query, time) => http().get(`${B}/query`).query({
	datasourceId,
	query,
	time
}).noToast(true).then((r) => unwrap(r));
/**
* 范围查询。
*
* @param datasourceId 数据源 ID，可空
* @param query        PromQL
* @param start        起始（RFC3339 或 Unix 秒）
* @param end          结束
* @param step         步长（如 30s / 1m）
*/
var prometheusQueryRange = (datasourceId, query, start, end, step) => http().get(`${B}/query_range`).query({
	datasourceId,
	query,
	start,
	end,
	step
}).noToast(true).timeout(3e4).then((r) => unwrap(r));
/** 抓取目标 */
var fetchPrometheusTargets = (datasourceId) => http().get(`${B}/targets`).query({ datasourceId }).noToast(true).then((r) => unwrap(r));
/** 规则列表（data 节点：groups） */
var fetchPrometheusRules = (datasourceId) => http().get(`${B}/rules`).query({ datasourceId }).noToast(true).then((r) => unwrap(r));
/** 活跃告警（data 节点：alerts） */
var fetchPrometheusAlerts = (datasourceId) => http().get(`${B}/alerts`).query({ datasourceId }).noToast(true).then((r) => unwrap(r));
/** 读取配置文件 */
var fetchPrometheusConfig = (datasourceId, path) => http().get(`${B}/config`).query({
	datasourceId,
	path
}).noToast(true).then((r) => unwrap(r));
/** 列出配置文件 */
var fetchPrometheusConfigFiles = (datasourceId) => http().get(`${B}/config/files`).query({ datasourceId }).noToast(true).then((r) => unwrap(r));
/** 保存配置文件（校验 → 备份 → 覆盖 → 重载） */
var savePrometheusConfig = (payload) => http().put(`${B}/config`).data(payload).noToast(true).timeout(6e4).then((r) => unwrap(r));
/** 触发重载 */
var reloadPrometheusConfig = (datasourceId) => http().post(`${B}/config/reload`).query({ datasourceId }).noToast(true).timeout(3e4).then((r) => unwrap(r));
/** 列出备份 */
var fetchPrometheusBackups = (datasourceId) => http().get(`${B}/config/backups`).query({ datasourceId }).noToast(true).then((r) => unwrap(r));
/** 从备份恢复 */
var restorePrometheusBackup = (datasourceId, path) => http().post(`${B}/config/restore`).query({
	datasourceId,
	path
}).noToast(true).timeout(6e4).then((r) => unwrap(r));
/** 读取看板 */
var fetchPrometheusDashboard = (datasourceId) => http().get(`${B}/dashboard`).query({ datasourceId }).noToast(true).then((r) => unwrap(r));
/** 保存看板（实时保存链路后端入口） */
var savePrometheusDashboard = (payload) => http().put(`${B}/dashboard`).data(payload).noToast(true).then((r) => unwrap(r));
/** 重新生成嵌入令牌 */
var regeneratePrometheusToken = (datasourceId) => http().post(`${B}/dashboard/token`).query({ datasourceId }).noToast(true).then((r) => unwrap(r));
/** 嵌入返回解包：后端 ReturnResult 信封 */
var unwrapEmbed = (body) => {
	if (body && (body.code === "00000" || body.code === 200 || body.success === true)) return body.data;
	throw new Error(body?.msg || body?.message || "嵌入请求失败");
};
var embedGet = async (path, query) => {
	let url = `${B}${path}`;
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
	return unwrapEmbed(body);
};
/** 按令牌读取嵌入看板 */
var fetchEmbedDashboard = (token) => embedGet(`/dashboard/embed/${encodeURIComponent(token)}`);
/** 嵌入即时查询 */
var embedQuery = (token, query, time) => embedGet(`/dashboard/embed/${encodeURIComponent(token)}/query`, {
	query,
	time
});
/** 嵌入范围查询 */
var embedQueryRange = (token, query, start, end, step) => embedGet(`/dashboard/embed/${encodeURIComponent(token)}/query_range`, {
	query,
	start,
	end,
	step
});
/** 构造控制台取数上下文 */
var createConsoleContext = (getDatasourceId) => ({
	embed: false,
	get datasourceId() {
		return getDatasourceId() ?? null;
	},
	query: (promql, time) => prometheusQuery(getDatasourceId(), promql, time),
	queryRange: (promql, startSec, endSec, step) => prometheusQueryRange(getDatasourceId(), promql, startSec, endSec, step)
});
/** 构造嵌入取数上下文 */
var createEmbedContext = (token) => ({
	embed: true,
	datasourceId: null,
	query: (promql, time) => embedQuery(token, promql, time),
	queryRange: (promql, startSec, endSec, step) => embedQueryRange(token, promql, startSec, endSec, step)
});
//#endregion
export { serializeLayout as A, PROM_CTX_KEY as C, formatNumber as D, formatMetric as E, newCardId as O, PROM_CARD_META as S, emptyLayout as T, restorePrometheusBackup as _, fetchPrometheusBackups as a, PromCardRenderer_default as b, fetchPrometheusDashboard as c, fetchPrometheusSources as d, fetchPrometheusTargets as f, reloadPrometheusConfig as g, regeneratePrometheusToken as h, fetchPrometheusAlerts as i, parseLayout as k, fetchPrometheusOverview as l, prometheusQueryRange as m, createEmbedContext as n, fetchPrometheusConfig as o, prometheusQuery as p, fetchEmbedDashboard as r, fetchPrometheusConfigFiles as s, createConsoleContext as t, fetchPrometheusRules as u, savePrometheusConfig as v, autoStep as w, PROM_CARD_CATALOG as x, savePrometheusDashboard as y };
