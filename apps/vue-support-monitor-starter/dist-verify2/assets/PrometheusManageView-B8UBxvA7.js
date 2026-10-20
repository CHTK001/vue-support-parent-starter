import { $n as normalizeClass, Ct as resolveDirective, D as createVNode, E as createTextVNode, Ht as watch, On as unref, Yt as withDirectives, _ as createBaseVNode, b as createElementBlock, bt as renderList, ct as onMounted, g as computed, gn as reactive, gt as provide, it as onBeforeUnmount, k as defineComponent, mt as openBlock, nr as normalizeStyle, o as Fragment, qt as withCtx, rr as toDisplayString, tt as nextTick, v as createBlock, vn as ref, y as createCommentVNode } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { C as withKeys, w as withModifiers, x as vModelText } from "./runtime-dom.esm-bundler-RRl39S3n.js";
import { t as ElMessageBox } from "./message-box-CXDJvJwn.js";
import { yt as message } from "./src-CEonioA3.js";
import { i as useRoute } from "./vue-router-D43uXGPs.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { t as ReSelect_default } from "./ReSelect-C2rq-Voy.js";
import { t as ReButton_default } from "./ReButton-owxlNwDO.js";
import { t as component } from "./ReDialog-DZGeR3lw.js";
import { f as ReOption } from "./ReKit-CFSh6vls.js";
import { t as component$1 } from "./ReIcon-By12b2Y9.js";
import { t as ReInput_default } from "./ReInput-CGHpe202.js";
import { t as ReSwitch_default } from "./ReSwitch-B3yMYGw4.js";
import { t as component$2 } from "./ReTag-D5UpQULZ.js";
import { n as token, r as useEchart, t as URL_TREND_COLORS } from "./useEchart-QklTP6NK.js";
import { n as HomePreview_default, t as WidgetLibrary_default } from "./WidgetLibrary-E_wqJbS9.js";
import "./surface-Bdspw2jE.js";
import { n as MiddlewareGap_default, t as useMiddlewareSource } from "./middlewareSource-BjMz9rOx.js";
import { t as copyToClipboard } from "./clipboard-Cx2N7jRl.js";
import { A as serializeLayout, C as PROM_CTX_KEY, D as formatNumber, E as formatMetric, O as newCardId, S as PROM_CARD_META, T as emptyLayout, _ as restorePrometheusBackup, a as fetchPrometheusBackups, b as PromCardRenderer_default, c as fetchPrometheusDashboard, d as fetchPrometheusSources, f as fetchPrometheusTargets, g as reloadPrometheusConfig, h as regeneratePrometheusToken, i as fetchPrometheusAlerts, k as parseLayout, l as fetchPrometheusOverview, m as prometheusQueryRange, o as fetchPrometheusConfig, p as prometheusQuery, s as fetchPrometheusConfigFiles, t as createConsoleContext, u as fetchPrometheusRules, v as savePrometheusConfig, w as autoStep, x as PROM_CARD_CATALOG, y as savePrometheusDashboard } from "./api-Dly0h-Bj.js";
//#region ../../pages/datasource/src/components/console/prometheus/PromOverviewPanel.vue?vue&type=script&setup=true&name=PromOverviewPanel&lang.ts
var _hoisted_1$6 = { class: "dsm-flex-col" };
var _hoisted_2$6 = { class: "dsm-grid-6 gap-6" };
var _hoisted_3$6 = { class: "dsm-stat-card" };
var _hoisted_4$6 = { class: "dsm-stat-value" };
var _hoisted_5$6 = { class: "dsm-stat-card" };
var _hoisted_6$6 = { class: "dsm-stat-value is-up" };
var _hoisted_7$6 = { class: "dsm-stat-card" };
var _hoisted_8$6 = { class: "dsm-stat-value is-down" };
var _hoisted_9$6 = { class: "dsm-stat-card" };
var _hoisted_10$6 = { class: "dsm-stat-value" };
var _hoisted_11$6 = { class: "dsm-stat-card" };
var _hoisted_12$5 = { class: "dsm-stat-value is-alarm" };
var _hoisted_13$5 = { class: "dsm-stat-card" };
var _hoisted_14$5 = { class: "dsm-stat-value" };
var _hoisted_15$4 = { class: "dsm-section" };
var _hoisted_16$4 = { class: "dsm-info-grid" };
var _hoisted_17$4 = { class: "dsm-info-val" };
var _hoisted_18$4 = { class: "dsm-info-val" };
var _hoisted_19$4 = { class: "dsm-info-val" };
var _hoisted_20$4 = { class: "dsm-info-val" };
var _hoisted_21$4 = { class: "dsm-info-val" };
var _hoisted_22$4 = { class: "dsm-info-val" };
var _hoisted_23$4 = { class: "dsm-info-val" };
var _hoisted_24$3 = {
	key: 0,
	class: "dsm-tag is-ok"
};
var _hoisted_25$3 = {
	key: 1,
	class: "dsm-tag is-warn"
};
var _hoisted_26$3 = { key: 2 };
var _hoisted_27$3 = ["title"];
var _hoisted_28$2 = { class: "dsm-section" };
var _hoisted_29$2 = {
	key: 0,
	class: "dsm-table"
};
var _hoisted_30$2 = { class: "dsm-table-name" };
var _hoisted_31$1 = { class: "dsm-badge is-up" };
var _hoisted_32$1 = { class: "dsm-badge is-down" };
var _hoisted_33$1 = { class: "dsm-badge" };
var _hoisted_34 = {
	key: 1,
	class: "dsm-hint"
};
//#endregion
//#region ../../pages/datasource/src/components/console/prometheus/PromOverviewPanel.vue
var PromOverviewPanel_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	__name: "PromOverviewPanel",
	props: {
		loading: { type: Boolean },
		data: {}
	},
	setup(__props) {
		return (_ctx, _cache) => {
			return openBlock(), createElementBlock("div", _hoisted_1$6, [
				createBaseVNode("div", _hoisted_2$6, [
					createBaseVNode("div", _hoisted_3$6, [_cache[0] || (_cache[0] = createBaseVNode("div", { class: "dsm-stat-label" }, "总目标", -1)), createBaseVNode("div", _hoisted_4$6, toDisplayString(__props.data?.targetTotal ?? "—"), 1)]),
					createBaseVNode("div", _hoisted_5$6, [_cache[1] || (_cache[1] = createBaseVNode("div", { class: "dsm-stat-label" }, "在线", -1)), createBaseVNode("div", _hoisted_6$6, toDisplayString(__props.data?.targetUp ?? "—"), 1)]),
					createBaseVNode("div", _hoisted_7$6, [_cache[2] || (_cache[2] = createBaseVNode("div", { class: "dsm-stat-label" }, "离线", -1)), createBaseVNode("div", _hoisted_8$6, toDisplayString(__props.data?.targetDown ?? "—"), 1)]),
					createBaseVNode("div", _hoisted_9$6, [_cache[3] || (_cache[3] = createBaseVNode("div", { class: "dsm-stat-label" }, "未知", -1)), createBaseVNode("div", _hoisted_10$6, toDisplayString(__props.data?.targetUnknown ?? "—"), 1)]),
					createBaseVNode("div", _hoisted_11$6, [_cache[4] || (_cache[4] = createBaseVNode("div", { class: "dsm-stat-label" }, "活跃告警", -1)), createBaseVNode("div", _hoisted_12$5, toDisplayString(__props.data?.activeAlerts ?? "—"), 1)]),
					createBaseVNode("div", _hoisted_13$5, [_cache[5] || (_cache[5] = createBaseVNode("div", { class: "dsm-stat-label" }, "规则数", -1)), createBaseVNode("div", _hoisted_14$5, toDisplayString(__props.data?.ruleCount ?? "—"), 1)])
				]),
				createBaseVNode("div", _hoisted_15$4, [_cache[13] || (_cache[13] = createBaseVNode("div", { class: "dsm-section-title" }, "实例信息", -1)), createBaseVNode("div", _hoisted_16$4, [
					_cache[6] || (_cache[6] = createBaseVNode("span", { class: "dsm-info-key" }, "数据源", -1)),
					createBaseVNode("span", _hoisted_17$4, toDisplayString(__props.data?.datasourceName), 1),
					_cache[7] || (_cache[7] = createBaseVNode("span", { class: "dsm-info-key" }, "Prometheus 地址", -1)),
					createBaseVNode("span", _hoisted_18$4, toDisplayString(__props.data?.prometheusUrl), 1),
					_cache[8] || (_cache[8] = createBaseVNode("span", { class: "dsm-info-key" }, "版本", -1)),
					createBaseVNode("span", _hoisted_19$4, toDisplayString(__props.data?.version ?? "—"), 1),
					_cache[9] || (_cache[9] = createBaseVNode("span", { class: "dsm-info-key" }, "Revisions", -1)),
					createBaseVNode("span", _hoisted_20$4, toDisplayString(__props.data?.revision ?? "—"), 1),
					_cache[10] || (_cache[10] = createBaseVNode("span", { class: "dsm-info-key" }, "配置根目录", -1)),
					createBaseVNode("span", _hoisted_21$4, toDisplayString(__props.data?.configRoot ?? "—"), 1),
					_cache[11] || (_cache[11] = createBaseVNode("span", { class: "dsm-info-key" }, "主配置文件", -1)),
					createBaseVNode("span", _hoisted_22$4, toDisplayString(__props.data?.configPath ?? "—"), 1),
					_cache[12] || (_cache[12] = createBaseVNode("span", { class: "dsm-info-key" }, "配置存在", -1)),
					createBaseVNode("span", _hoisted_23$4, [__props.data?.configExists === true ? (openBlock(), createElementBlock("span", _hoisted_24$3, "是")) : __props.data?.configExists === false ? (openBlock(), createElementBlock("span", _hoisted_25$3, "否")) : (openBlock(), createElementBlock("span", _hoisted_26$3, "—")), __props.data?.configCheckError ? (openBlock(), createElementBlock("span", {
						key: 3,
						class: "dsm-tag is-error",
						title: __props.data.configCheckError
					}, "配置错误", 8, _hoisted_27$3)) : createCommentVNode("", true)])
				])]),
				createBaseVNode("div", _hoisted_28$2, [_cache[15] || (_cache[15] = createBaseVNode("div", { class: "dsm-section-title" }, "采集任务", -1)), __props.data?.jobs?.length ? (openBlock(), createElementBlock("table", _hoisted_29$2, [_cache[14] || (_cache[14] = createBaseVNode("thead", null, [createBaseVNode("tr", null, [
					createBaseVNode("th", null, "Job"),
					createBaseVNode("th", null, "在线"),
					createBaseVNode("th", null, "离线"),
					createBaseVNode("th", null, "未知")
				])], -1)), createBaseVNode("tbody", null, [(openBlock(true), createElementBlock(Fragment, null, renderList(__props.data.jobs, (j) => {
					return openBlock(), createElementBlock("tr", { key: j.job }, [
						createBaseVNode("td", _hoisted_30$2, toDisplayString(j.job), 1),
						createBaseVNode("td", null, [createBaseVNode("span", _hoisted_31$1, toDisplayString(j.up), 1)]),
						createBaseVNode("td", null, [createBaseVNode("span", _hoisted_32$1, toDisplayString(j.down), 1)]),
						createBaseVNode("td", null, [createBaseVNode("span", _hoisted_33$1, toDisplayString(j.unknown), 1)])
					]);
				}), 128))])])) : (openBlock(), createElementBlock("div", _hoisted_34, "无采集任务数据"))])
			]);
		};
	}
}), [["__scopeId", "data-v-1c63d6fe"]]);
//#endregion
//#region ../../pages/datasource/src/components/console/prometheus/PromQueryPanel.vue?vue&type=script&setup=true&name=PromQueryPanel&lang.ts
var _hoisted_1$5 = { class: "dsm-flex-col" };
var _hoisted_2$5 = { class: "pqs-input-card" };
var _hoisted_3$5 = { class: "pqs-toolbar" };
var _hoisted_4$5 = {
	class: "dsm-seg",
	role: "group",
	"aria-label": "查询模式"
};
var _hoisted_5$5 = ["onKeydown"];
var _hoisted_6$5 = {
	key: 0,
	class: "pqs-error"
};
var _hoisted_7$5 = {
	key: 0,
	class: "pqs-result-card pqs-center"
};
var _hoisted_8$5 = {
	key: 1,
	class: "pqs-result-card",
	"data-testid": "prq-result"
};
var _hoisted_9$5 = { class: "pqs-result-head" };
var _hoisted_10$5 = { class: "pqs-result-title" };
var _hoisted_11$5 = { class: "pqs-result-meta" };
var _hoisted_12$4 = { class: "pqs-table-wrap" };
var _hoisted_13$4 = { class: "pqs-table" };
var _hoisted_14$4 = { key: 0 };
var _hoisted_15$3 = { key: 1 };
var _hoisted_16$3 = { key: 2 };
var _hoisted_17$3 = { key: 3 };
var _hoisted_18$3 = ["title"];
var _hoisted_19$3 = { key: 0 };
var _hoisted_20$3 = { key: 1 };
var _hoisted_21$3 = { key: 2 };
var _hoisted_22$3 = { key: 3 };
var _hoisted_23$3 = {
	key: 2,
	class: "pqs-result-card pqs-center"
};
//#endregion
//#region ../../pages/datasource/src/components/console/prometheus/PromQueryPanel.vue
var PromQueryPanel_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	__name: "PromQueryPanel",
	props: { datasourceId: {} },
	setup(__props) {
		/**
		* PromQL 查询面板：即时/范围双模式，范围结果用 ECharts 折线呈现。
		*/
		const props = __props;
		const mode = ref("instant");
		const query = ref("up");
		const duration = ref("60");
		const sample = ref("");
		const loading = ref(false);
		const error = ref("");
		const elapsed = ref(0);
		const series = ref([]);
		function onSample(value) {
			if (typeof value === "string" && value) query.value = value;
		}
		const rows = computed(() => {
			return series.value.map((s) => {
				if (s.values?.length) {
					const nums = s.values.map((v) => parseFloat(v[1])).filter(Number.isFinite);
					const last = parseFloat(s.values[s.values.length - 1][1]);
					return {
						name: formatMetric(s.metric),
						last: formatNumber(last, 4),
						min: nums.length ? formatNumber(Math.min(...nums), 4) : "—",
						max: nums.length ? formatNumber(Math.max(...nums), 4) : "—"
					};
				}
				const value = s.value ? parseFloat(s.value[1]) : NaN;
				return {
					name: formatMetric(s.metric),
					last: formatNumber(value, 4),
					min: "",
					max: ""
				};
			});
		});
		const chartEl = ref(null);
		function buildOption() {
			const names = series.value.map((s) => formatMetric(s.metric));
			return {
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
				legend: names.length > 1 ? {
					top: 0,
					type: "scroll",
					textStyle: {
						fontSize: 10,
						color: token("--text-secondary")
					}
				} : void 0,
				series: series.value.map((s, i) => ({
					name: names[i],
					type: "line",
					showSymbol: false,
					smooth: true,
					data: (s.values ?? (s.value ? [s.value] : [])).map((v) => [v[0] * 1e3, parseFloat(v[1])])
				}))
			};
		}
		const { render } = useEchart(chartEl, buildOption);
		let timer = null;
		async function run() {
			const q = query.value.trim();
			if (!q) return;
			if (timer !== null) {
				window.clearTimeout(timer);
				timer = null;
			}
			loading.value = true;
			error.value = "";
			const start = performance.now();
			try {
				if (mode.value === "range") {
					const minutes = Number(duration.value) || 60;
					const end = Math.floor(Date.now() / 1e3);
					const begin = end - minutes * 60;
					const res = await prometheusQueryRange(props.datasourceId, q, begin, end, autoStep(begin, end));
					series.value = res.data?.result ?? [];
				} else {
					const res = await prometheusQuery(props.datasourceId, q);
					series.value = res.data?.result ?? [];
				}
				elapsed.value = Math.round(performance.now() - start);
				await nextTick();
				if (mode.value === "range") render();
			} catch (e) {
				error.value = e?.message || String(e);
				series.value = [];
				message.error(`查询失败：${error.value}`);
			} finally {
				loading.value = false;
			}
		}
		onBeforeUnmount(() => {
			if (timer !== null) window.clearTimeout(timer);
		});
		return (_ctx, _cache) => {
			return openBlock(), createElementBlock("div", _hoisted_1$5, [createBaseVNode("div", _hoisted_2$5, [
				createBaseVNode("div", _hoisted_3$5, [
					createBaseVNode("div", _hoisted_4$5, [createBaseVNode("button", {
						type: "button",
						class: normalizeClass({ "is-active": mode.value === "instant" }),
						"data-testid": "prq-mode-instant",
						onClick: _cache[0] || (_cache[0] = ($event) => mode.value = "instant")
					}, "即时", 2), createBaseVNode("button", {
						type: "button",
						class: normalizeClass({ "is-active": mode.value === "range" }),
						"data-testid": "prq-mode-range",
						onClick: _cache[1] || (_cache[1] = ($event) => mode.value = "range")
					}, "范围", 2)]),
					mode.value === "range" ? (openBlock(), createBlock(unref(ReSelect_default), {
						key: 0,
						modelValue: duration.value,
						"onUpdate:modelValue": _cache[2] || (_cache[2] = ($event) => duration.value = $event),
						class: "pqs-select",
						"data-testid": "prq-select-duration",
						onChange: () => {}
					}, {
						default: withCtx(() => [
							createVNode(unref(ReOption), {
								value: "15",
								label: "近 15 分钟"
							}),
							createVNode(unref(ReOption), {
								value: "60",
								label: "近 1 小时"
							}),
							createVNode(unref(ReOption), {
								value: "360",
								label: "近 6 小时"
							}),
							createVNode(unref(ReOption), {
								value: "1440",
								label: "近 24 小时"
							}),
							createVNode(unref(ReOption), {
								value: "10080",
								label: "近 7 天"
							})
						]),
						_: 1
					}, 8, ["modelValue"])) : createCommentVNode("", true),
					createVNode(unref(ReSelect_default), {
						modelValue: sample.value,
						"onUpdate:modelValue": _cache[3] || (_cache[3] = ($event) => sample.value = $event),
						class: "pqs-select pqs-select--wide",
						"data-testid": "prq-select-sample",
						placeholder: "示例 PromQL",
						onChange: onSample
					}, {
						default: withCtx(() => [
							createVNode(unref(ReOption), {
								value: "up",
								label: "up — 目标存活"
							}),
							createVNode(unref(ReOption), {
								value: "process_cpu_seconds_total",
								label: "process_cpu_seconds_total — CPU"
							}),
							createVNode(unref(ReOption), {
								value: "rate(prometheus_http_requests_total[5m])",
								label: "rate(prometheus_http_requests_total[5m]) — QPS"
							}),
							createVNode(unref(ReOption), {
								value: "prometheus_tsdb_head_series",
								label: "prometheus_tsdb_head_series — 时序数"
							}),
							createVNode(unref(ReOption), {
								value: "sum(up) by (job)",
								label: "sum(up) by (job) — 按任务汇总"
							})
						]),
						_: 1
					}, 8, ["modelValue"]),
					_cache[6] || (_cache[6] = createBaseVNode("div", { class: "pqs-spacer" }, null, -1)),
					createVNode(unref(ReButton_default), {
						type: "primary",
						"data-testid": "prq-btn-run",
						disabled: !query.value.trim() || loading.value,
						onClick: run
					}, {
						default: withCtx(() => [createVNode(unref(component$1), {
							name: "Search",
							size: 14
						}), _cache[5] || (_cache[5] = createTextVNode(" 执行 ", -1))]),
						_: 1
					}, 8, ["disabled"])
				]),
				withDirectives(createBaseVNode("textarea", {
					"onUpdate:modelValue": _cache[4] || (_cache[4] = ($event) => query.value = $event),
					class: "pqs-textarea",
					"data-testid": "prq-input",
					rows: "3",
					spellcheck: "false",
					placeholder: "输入 PromQL，Ctrl+Enter 执行",
					onKeydown: [withKeys(withModifiers(run, ["ctrl", "prevent"]), ["enter"]), withKeys(withModifiers(run, ["meta", "prevent"]), ["enter"])]
				}, null, 40, _hoisted_5$5), [[vModelText, query.value]]),
				error.value ? (openBlock(), createElementBlock("div", _hoisted_6$5, toDisplayString(error.value), 1)) : createCommentVNode("", true)
			]), loading.value ? (openBlock(), createElementBlock("div", _hoisted_7$5, "查询中…")) : rows.value.length || series.value.length ? (openBlock(), createElementBlock("div", _hoisted_8$5, [
				createBaseVNode("div", _hoisted_9$5, [createBaseVNode("span", _hoisted_10$5, "结果 · " + toDisplayString(rows.value.length) + " 条序列", 1), createBaseVNode("span", _hoisted_11$5, toDisplayString(elapsed.value) + " ms", 1)]),
				mode.value === "range" ? (openBlock(), createElementBlock("div", {
					key: 0,
					ref_key: "chartEl",
					ref: chartEl,
					class: "pqs-chart"
				}, null, 512)) : createCommentVNode("", true),
				createBaseVNode("div", _hoisted_12$4, [createBaseVNode("table", _hoisted_13$4, [createBaseVNode("thead", null, [createBaseVNode("tr", null, [
					_cache[7] || (_cache[7] = createBaseVNode("th", null, "序列", -1)),
					mode.value === "range" ? (openBlock(), createElementBlock("th", _hoisted_14$4, "最新")) : createCommentVNode("", true),
					mode.value === "range" ? (openBlock(), createElementBlock("th", _hoisted_15$3, "最小")) : createCommentVNode("", true),
					mode.value === "range" ? (openBlock(), createElementBlock("th", _hoisted_16$3, "最大")) : (openBlock(), createElementBlock("th", _hoisted_17$3, "值"))
				])]), createBaseVNode("tbody", null, [(openBlock(true), createElementBlock(Fragment, null, renderList(rows.value, (row) => {
					return openBlock(), createElementBlock("tr", { key: row.name }, [
						createBaseVNode("td", {
							class: "pqs-name",
							title: row.name
						}, toDisplayString(row.name), 9, _hoisted_18$3),
						mode.value === "range" ? (openBlock(), createElementBlock("td", _hoisted_19$3, toDisplayString(row.last), 1)) : createCommentVNode("", true),
						mode.value === "range" ? (openBlock(), createElementBlock("td", _hoisted_20$3, toDisplayString(row.min), 1)) : createCommentVNode("", true),
						mode.value === "range" ? (openBlock(), createElementBlock("td", _hoisted_21$3, toDisplayString(row.max), 1)) : (openBlock(), createElementBlock("td", _hoisted_22$3, toDisplayString(row.last), 1))
					]);
				}), 128))])])])
			])) : (openBlock(), createElementBlock("div", _hoisted_23$3, "暂无结果"))]);
		};
	}
}), [["__scopeId", "data-v-48f5a4d1"]]);
//#endregion
//#region ../../pages/datasource/src/components/console/prometheus/PromMonitorPanel.vue?vue&type=script&setup=true&name=PromMonitorPanel&lang.ts
var _hoisted_1$4 = { class: "dsm-flex-col" };
var _hoisted_2$4 = { class: "pms-card" };
var _hoisted_3$4 = { class: "pms-toolbar" };
var _hoisted_4$4 = {
	class: "dsm-seg",
	role: "group",
	"aria-label": "监控视图"
};
var _hoisted_5$4 = {
	key: 0,
	class: "pms-count"
};
var _hoisted_6$4 = { key: 0 };
var _hoisted_7$4 = {
	key: 0,
	class: "pms-center"
};
var _hoisted_8$4 = {
	key: 1,
	class: "pms-error"
};
var _hoisted_9$4 = {
	key: 2,
	class: "pms-center"
};
var _hoisted_10$4 = {
	key: 3,
	class: "pms-table"
};
var _hoisted_11$4 = ["title"];
var _hoisted_12$3 = ["title"];
var _hoisted_13$3 = { key: 1 };
var _hoisted_14$3 = {
	key: 0,
	class: "pms-center"
};
var _hoisted_15$2 = {
	key: 1,
	class: "pms-error"
};
var _hoisted_16$2 = {
	key: 2,
	class: "pms-center"
};
var _hoisted_17$2 = {
	key: 3,
	class: "pms-groups"
};
var _hoisted_18$2 = { class: "pms-group-head" };
var _hoisted_19$2 = { class: "pms-group-name" };
var _hoisted_20$2 = { class: "pms-group-file" };
var _hoisted_21$2 = { class: "pms-table" };
var _hoisted_22$2 = { key: 1 };
var _hoisted_23$2 = ["title"];
var _hoisted_24$2 = { key: 2 };
var _hoisted_25$2 = {
	key: 0,
	class: "pms-center"
};
var _hoisted_26$2 = {
	key: 1,
	class: "pms-error"
};
var _hoisted_27$2 = {
	key: 2,
	class: "pms-center"
};
var _hoisted_28$1 = {
	key: 3,
	class: "pms-table"
};
var _hoisted_29$1 = { class: "pms-alert-name" };
var _hoisted_30$1 = { class: "pms-alert-sub" };
//#endregion
//#region ../../pages/datasource/src/components/console/prometheus/PromMonitorPanel.vue
var PromMonitorPanel_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	__name: "PromMonitorPanel",
	props: { datasourceId: {} },
	setup(__props) {
		/**
		* 监控面板：抓取目标 / 规则 / 活跃告警 三视图。
		*/
		const props = __props;
		const tab = ref("targets");
		const loading = ref(false);
		const error = ref("");
		const targetList = ref([]);
		const ruleGroups = ref([]);
		const alerts = ref([]);
		const targets = ref(0);
		const load = async (manual = false) => {
			loading.value = true;
			error.value = "";
			try {
				if (tab.value === "targets") {
					const data = await fetchPrometheusTargets(props.datasourceId);
					targetList.value = data?.activeTargets ?? [];
					targets.value = targetList.value.length;
				} else if (tab.value === "rules") {
					const data = await fetchPrometheusRules(props.datasourceId);
					ruleGroups.value = data?.groups ?? [];
				} else {
					const data = await fetchPrometheusAlerts(props.datasourceId);
					alerts.value = data?.alerts ?? [];
				}
			} catch (e) {
				error.value = e?.message || String(e);
			} finally {
				loading.value = false;
			}
		};
		function switchTab(next) {
			if (tab.value === next) return;
			tab.value = next;
			load();
		}
		function healthClass(health) {
			if (health === "up") return "is-up";
			if (health === "down") return "is-down";
			return "";
		}
		function stateClass(state) {
			if (state === "firing") return "is-down";
			if (state === "pending") return "is-warn";
			return "is-up";
		}
		function severityClass(severity) {
			if (!severity) return "";
			if (/critical|fatal|page/i.test(severity)) return "is-down";
			if (/warning|warn/i.test(severity)) return "is-warn";
			return "";
		}
		function shortTime(value) {
			if (!value) return "—";
			const d = new Date(value);
			if (Number.isNaN(d.getTime())) return value;
			return d.toLocaleString("zh-CN", { hour12: false });
		}
		watch(() => props.datasourceId, () => {
			load();
		});
		onMounted(() => {
			load();
		});
		return (_ctx, _cache) => {
			return openBlock(), createElementBlock("div", _hoisted_1$4, [createBaseVNode("div", _hoisted_2$4, [createBaseVNode("div", _hoisted_3$4, [
				createBaseVNode("div", _hoisted_4$4, [
					createBaseVNode("button", {
						type: "button",
						class: normalizeClass({ "is-active": tab.value === "targets" }),
						"data-testid": "pms-tab-targets",
						onClick: _cache[0] || (_cache[0] = ($event) => switchTab("targets"))
					}, [_cache[4] || (_cache[4] = createTextVNode(" 抓取目标 ", -1)), tab.value === "targets" && targets.value ? (openBlock(), createElementBlock("span", _hoisted_5$4, toDisplayString(targets.value), 1)) : createCommentVNode("", true)], 2),
					createBaseVNode("button", {
						type: "button",
						class: normalizeClass({ "is-active": tab.value === "rules" }),
						"data-testid": "pms-tab-rules",
						onClick: _cache[1] || (_cache[1] = ($event) => switchTab("rules"))
					}, "规则", 2),
					createBaseVNode("button", {
						type: "button",
						class: normalizeClass({ "is-active": tab.value === "alerts" }),
						"data-testid": "pms-tab-alerts",
						onClick: _cache[2] || (_cache[2] = ($event) => switchTab("alerts"))
					}, "告警", 2)
				]),
				_cache[6] || (_cache[6] = createBaseVNode("div", { class: "pms-spacer" }, null, -1)),
				createVNode(unref(ReButton_default), {
					size: "small",
					"data-testid": "pms-btn-refresh",
					onClick: _cache[3] || (_cache[3] = ($event) => load(true))
				}, {
					default: withCtx(() => [createVNode(unref(component$1), {
						name: "Refresh",
						size: 13
					}), _cache[5] || (_cache[5] = createTextVNode(" 刷新 ", -1))]),
					_: 1
				})
			]), tab.value === "targets" ? (openBlock(), createElementBlock("div", _hoisted_6$4, [loading.value ? (openBlock(), createElementBlock("div", _hoisted_7$4, "加载中…")) : error.value ? (openBlock(), createElementBlock("div", _hoisted_8$4, toDisplayString(error.value), 1)) : !targetList.value.length ? (openBlock(), createElementBlock("div", _hoisted_9$4, "暂无抓取目标")) : (openBlock(), createElementBlock("table", _hoisted_10$4, [_cache[7] || (_cache[7] = createBaseVNode("thead", null, [createBaseVNode("tr", null, [
				createBaseVNode("th", null, "Job"),
				createBaseVNode("th", null, "实例"),
				createBaseVNode("th", null, "健康"),
				createBaseVNode("th", null, "最近抓取"),
				createBaseVNode("th", null, "耗时"),
				createBaseVNode("th", null, "错误")
			])], -1)), createBaseVNode("tbody", null, [(openBlock(true), createElementBlock(Fragment, null, renderList(targetList.value, (t, i) => {
				return openBlock(), createElementBlock("tr", { key: i }, [
					createBaseVNode("td", null, toDisplayString(t.labels?.job || "—"), 1),
					createBaseVNode("td", {
						class: "pms-name",
						title: t.scrapeUrl || t.labels?.instance
					}, toDisplayString(t.labels?.instance || t.scrapeUrl || "—"), 9, _hoisted_11$4),
					createBaseVNode("td", null, [createBaseVNode("span", { class: normalizeClass(["pms-badge", healthClass(t.health)]) }, toDisplayString(t.health), 3)]),
					createBaseVNode("td", null, toDisplayString(shortTime(t.lastScrape)), 1),
					createBaseVNode("td", null, toDisplayString(t.lastScrapeDuration ? `${t.lastScrapeDuration.toFixed(3)}s` : "—"), 1),
					createBaseVNode("td", {
						class: "pms-err",
						title: t.lastError
					}, toDisplayString(t.lastError || ""), 9, _hoisted_12$3)
				]);
			}), 128))])]))])) : tab.value === "rules" ? (openBlock(), createElementBlock("div", _hoisted_13$3, [loading.value ? (openBlock(), createElementBlock("div", _hoisted_14$3, "加载中…")) : error.value ? (openBlock(), createElementBlock("div", _hoisted_15$2, toDisplayString(error.value), 1)) : !ruleGroups.value?.length ? (openBlock(), createElementBlock("div", _hoisted_16$2, "暂无规则")) : (openBlock(), createElementBlock("div", _hoisted_17$2, [(openBlock(true), createElementBlock(Fragment, null, renderList(ruleGroups.value, (g) => {
				return openBlock(), createElementBlock("div", {
					key: g.file + g.name,
					class: "pms-group"
				}, [createBaseVNode("div", _hoisted_18$2, [createBaseVNode("span", _hoisted_19$2, toDisplayString(g.name), 1), createBaseVNode("span", _hoisted_20$2, toDisplayString(g.file), 1)]), createBaseVNode("table", _hoisted_21$2, [_cache[8] || (_cache[8] = createBaseVNode("thead", null, [createBaseVNode("tr", null, [
					createBaseVNode("th", null, "名称"),
					createBaseVNode("th", null, "类型"),
					createBaseVNode("th", null, "状态"),
					createBaseVNode("th", null, "表达式")
				])], -1)), createBaseVNode("tbody", null, [(openBlock(true), createElementBlock(Fragment, null, renderList(g.rules, (r, i) => {
					return openBlock(), createElementBlock("tr", { key: i }, [
						createBaseVNode("td", null, toDisplayString(r.name), 1),
						createBaseVNode("td", null, toDisplayString(r.type), 1),
						createBaseVNode("td", null, [r.state ? (openBlock(), createElementBlock("span", {
							key: 0,
							class: normalizeClass(["pms-badge", stateClass(r.state)])
						}, toDisplayString(r.state), 3)) : (openBlock(), createElementBlock("span", _hoisted_22$2, "—"))]),
						createBaseVNode("td", {
							class: "pms-expr",
							title: r.query
						}, toDisplayString(r.query), 9, _hoisted_23$2)
					]);
				}), 128))])])]);
			}), 128))]))])) : (openBlock(), createElementBlock("div", _hoisted_24$2, [loading.value ? (openBlock(), createElementBlock("div", _hoisted_25$2, "加载中…")) : error.value ? (openBlock(), createElementBlock("div", _hoisted_26$2, toDisplayString(error.value), 1)) : !alerts.value?.length ? (openBlock(), createElementBlock("div", _hoisted_27$2, "当前无活跃告警")) : (openBlock(), createElementBlock("table", _hoisted_28$1, [_cache[9] || (_cache[9] = createBaseVNode("thead", null, [createBaseVNode("tr", null, [
				createBaseVNode("th", null, "告警"),
				createBaseVNode("th", null, "级别"),
				createBaseVNode("th", null, "状态"),
				createBaseVNode("th", null, "开始时间"),
				createBaseVNode("th", null, "值")
			])], -1)), createBaseVNode("tbody", null, [(openBlock(true), createElementBlock(Fragment, null, renderList(alerts.value, (a, i) => {
				return openBlock(), createElementBlock("tr", { key: i }, [
					createBaseVNode("td", null, [createBaseVNode("div", _hoisted_29$1, toDisplayString(a.labels?.alertname || "—"), 1), createBaseVNode("div", _hoisted_30$1, toDisplayString(a.annotations?.summary || a.annotations?.description || ""), 1)]),
					createBaseVNode("td", null, [createBaseVNode("span", { class: normalizeClass(["pms-badge", severityClass(a.labels?.severity)]) }, toDisplayString(a.labels?.severity || "—"), 3)]),
					createBaseVNode("td", null, [createBaseVNode("span", { class: normalizeClass(["pms-badge", a.state === "firing" ? "is-down" : "is-warn"]) }, toDisplayString(a.state), 3)]),
					createBaseVNode("td", null, toDisplayString(shortTime(a.activeAt)), 1),
					createBaseVNode("td", null, toDisplayString(a.value ?? "—"), 1)
				]);
			}), 128))])]))]))])]);
		};
	}
}), [["__scopeId", "data-v-f49dd7cc"]]);
//#endregion
//#region ../../pages/datasource/src/components/console/prometheus/PromConfigPanel.vue?vue&type=script&setup=true&name=PromConfigPanel&lang.ts
var _hoisted_1$3 = { class: "prc" };
var _hoisted_2$3 = { class: "prc-body" };
var _hoisted_3$3 = { class: "prc-side" };
var _hoisted_4$3 = { class: "prc-side-head" };
var _hoisted_5$3 = { class: "prc-side-body" };
var _hoisted_6$3 = ["title", "onClick"];
var _hoisted_7$3 = { class: "prc-filename" };
var _hoisted_8$3 = {
	key: 0,
	class: "prc-main-tag"
};
var _hoisted_9$3 = {
	key: 0,
	class: "prc-empty"
};
var _hoisted_10$3 = { class: "prc-side-head prc-side-head--backup" };
var _hoisted_11$3 = { class: "prc-side-body prc-side-body--backup" };
var _hoisted_12$2 = ["title", "onClick"];
var _hoisted_13$2 = { class: "prc-filename" };
var _hoisted_14$2 = { class: "prc-size" };
var _hoisted_15$1 = {
	key: 0,
	class: "prc-empty"
};
var _hoisted_16$1 = { class: "prc-main" };
var _hoisted_17$1 = { class: "prc-bar" };
var _hoisted_18$1 = ["title"];
var _hoisted_19$1 = { class: "prc-editor" };
var _hoisted_20$1 = { class: "prc-gutter" };
var _hoisted_21$1 = ["disabled"];
var _hoisted_22$1 = {
	key: 0,
	class: "prc-editor-mask"
};
var _hoisted_23$1 = { class: "prc-result-head" };
var _hoisted_24$1 = {
	key: 0,
	class: "prc-result-sub"
};
var _hoisted_25$1 = {
	key: 1,
	class: "prc-result-sub"
};
var _hoisted_26$1 = {
	key: 0,
	class: "prc-steps"
};
var _hoisted_27$1 = {
	key: 1,
	class: "prc-output"
};
var _hoisted_28 = { class: "prc-foot" };
var _hoisted_29 = { class: "prc-opts" };
var _hoisted_30 = { class: "prc-ops" };
var _hoisted_31 = { class: "prc-backup-head" };
var _hoisted_32 = ["title"];
var _hoisted_33 = { class: "prc-backup-content" };
//#endregion
//#region ../../pages/datasource/src/components/console/prometheus/PromConfigPanel.vue
var PromConfigPanel_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	__name: "PromConfigPanel",
	props: { datasourceId: {} },
	setup(__props) {
		/**
		* Prometheus 配置面板（参考 nginx 控制台）：
		* 左侧文件 / 备份列表，右侧编辑 + 保存（临时文件 → promtool 校验 → 备份 → 覆盖 → 重载）。
		*/
		const props = __props;
		const files = ref([]);
		const backups = ref([]);
		const filesLoading = ref(false);
		const backupsLoading = ref(false);
		const loading = ref(false);
		const saving = ref(false);
		const reloading = ref(false);
		const restoring = ref(false);
		const currentPath = ref("");
		const content = ref("");
		const loadedContent = ref("");
		const result = ref(null);
		const commandResult = ref(null);
		const optBackup = ref(true);
		const optValidate = ref(true);
		const optReload = ref(true);
		const backupVisible = ref(false);
		const backupPreview = ref(null);
		const pendingRestore = ref(null);
		const dirty = computed(() => content.value !== loadedContent.value);
		const lineCount = computed(() => content.value.split("\n").length);
		function shortName(path) {
			const parts = path.split("/");
			return parts[parts.length - 1] || path;
		}
		function humanSize(size) {
			if (size === null || size === void 0) return "";
			if (size < 1024) return `${size} B`;
			if (size < 1048576) return `${(size / 1024).toFixed(1)} KB`;
			return `${(size / 1024 / 1024).toFixed(1)} MB`;
		}
		async function loadFiles() {
			filesLoading.value = true;
			try {
				files.value = await fetchPrometheusConfigFiles(props.datasourceId) || [];
			} catch (e) {
				message.error(`读取配置文件列表失败：${e?.message ?? e}`);
			} finally {
				filesLoading.value = false;
			}
		}
		async function loadBackups() {
			backupsLoading.value = true;
			try {
				backups.value = await fetchPrometheusBackups(props.datasourceId) || [];
			} catch (e) {
				message.error(`读取备份列表失败：${e?.message ?? e}`);
			} finally {
				backupsLoading.value = false;
			}
		}
		async function openFile(path) {
			if (dirty.value && !window.confirm("当前文件有未保存修改，切换将丢失，继续？")) return;
			loading.value = true;
			result.value = null;
			commandResult.value = null;
			try {
				const config = await fetchPrometheusConfig(props.datasourceId, path);
				currentPath.value = config.path || path;
				content.value = config.content ?? "";
				loadedContent.value = content.value;
			} catch (e) {
				message.error(`读取配置失败：${e?.message ?? e}`);
			} finally {
				loading.value = false;
			}
		}
		async function doSave() {
			if (!currentPath.value) return;
			saving.value = true;
			result.value = null;
			try {
				const apply = await savePrometheusConfig({
					datasourceId: props.datasourceId,
					path: currentPath.value,
					content: content.value,
					backup: optBackup.value,
					validate: optValidate.value,
					reload: optReload.value
				});
				result.value = apply;
				if (apply.success) {
					loadedContent.value = content.value;
					message.success(apply.message || "保存成功");
					loadBackups();
				} else message.error(apply.message || "保存失败");
			} catch (e) {
				message.error(`保存失败：${e?.message ?? e}`);
			} finally {
				saving.value = false;
			}
		}
		async function doReload() {
			reloading.value = true;
			commandResult.value = null;
			try {
				const cmd = await reloadPrometheusConfig(props.datasourceId);
				commandResult.value = cmd;
				if (cmd.success) message.success(cmd.message || "重载成功");
				else message.error(cmd.message || "重载失败");
			} catch (e) {
				message.error(`重载失败：${e?.message ?? e}`);
			} finally {
				reloading.value = false;
			}
		}
		async function previewBackup(b) {
			try {
				const config = await fetchPrometheusConfig(props.datasourceId, b.path);
				backupPreview.value = {
					path: config.path || b.path,
					content: config.content ?? ""
				};
				pendingRestore.value = b;
				backupVisible.value = true;
			} catch (e) {
				message.error(`读取备份失败：${e?.message ?? e}`);
			}
		}
		async function doRestore() {
			if (!pendingRestore.value) return;
			restoring.value = true;
			try {
				const apply = await restorePrometheusBackup(props.datasourceId, pendingRestore.value.path);
				backupVisible.value = false;
				result.value = apply;
				if (apply.success) {
					message.success(apply.message || "恢复成功");
					if (currentPath.value) await openFile(currentPath.value);
					loadBackups();
				} else message.error(apply.message || "恢复失败");
			} catch (e) {
				message.error(`恢复失败：${e?.message ?? e}`);
			} finally {
				restoring.value = false;
			}
		}
		watch(() => props.datasourceId, () => {
			currentPath.value = "";
			content.value = "";
			loadedContent.value = "";
			result.value = null;
			loadFiles();
			loadBackups();
		});
		onMounted(async () => {
			await Promise.all([loadFiles(), loadBackups()]);
			const main = files.value.find((f) => f.main) ?? files.value[0];
			if (main) await openFile(main.path);
		});
		return (_ctx, _cache) => {
			return openBlock(), createElementBlock("div", _hoisted_1$3, [createBaseVNode("div", _hoisted_2$3, [createBaseVNode("aside", _hoisted_3$3, [
				createBaseVNode("div", _hoisted_4$3, [_cache[6] || (_cache[6] = createBaseVNode("span", { class: "prc-side-title" }, "配置文件", -1)), createVNode(unref(ReButton_default), {
					icon: "Refresh",
					text: "",
					title: "刷新列表",
					"data-testid": "prc-btn-files",
					onClick: loadFiles
				})]),
				createBaseVNode("div", _hoisted_5$3, [(openBlock(true), createElementBlock(Fragment, null, renderList(files.value, (f) => {
					return openBlock(), createElementBlock("div", {
						key: f.path,
						class: normalizeClass(["prc-file", { active: f.path === currentPath.value }]),
						"data-testid": "prc-file",
						title: f.path,
						onClick: ($event) => openFile(f.path)
					}, [
						createVNode(unref(component$1), {
							name: "Document",
							size: 13
						}),
						createBaseVNode("span", _hoisted_7$3, toDisplayString(shortName(f.path)), 1),
						f.main ? (openBlock(), createElementBlock("span", _hoisted_8$3, "主")) : createCommentVNode("", true)
					], 10, _hoisted_6$3);
				}), 128)), !files.value.length && !filesLoading.value ? (openBlock(), createElementBlock("div", _hoisted_9$3, "未发现配置文件")) : createCommentVNode("", true)]),
				createBaseVNode("div", _hoisted_10$3, [_cache[7] || (_cache[7] = createBaseVNode("span", { class: "prc-side-title" }, "备份记录", -1)), createVNode(unref(ReButton_default), {
					icon: "Refresh",
					text: "",
					title: "刷新备份",
					"data-testid": "prc-btn-backups",
					onClick: loadBackups
				})]),
				createBaseVNode("div", _hoisted_11$3, [(openBlock(true), createElementBlock(Fragment, null, renderList(backups.value, (b) => {
					return openBlock(), createElementBlock("div", {
						key: b.path,
						class: "prc-file",
						"data-testid": "prc-backup",
						title: b.path,
						onClick: ($event) => previewBackup(b)
					}, [
						createVNode(unref(component$1), {
							name: "Clock",
							size: 13
						}),
						createBaseVNode("span", _hoisted_13$2, toDisplayString(shortName(b.path)), 1),
						createBaseVNode("span", _hoisted_14$2, toDisplayString(humanSize(b.size)), 1)
					], 8, _hoisted_12$2);
				}), 128)), !backups.value.length && !backupsLoading.value ? (openBlock(), createElementBlock("div", _hoisted_15$1, "暂无备份")) : createCommentVNode("", true)])
			]), createBaseVNode("section", _hoisted_16$1, [
				createBaseVNode("div", _hoisted_17$1, [createBaseVNode("span", {
					class: "prc-path",
					title: currentPath.value
				}, toDisplayString(currentPath.value || "请选择左侧配置文件"), 9, _hoisted_18$1), dirty.value ? (openBlock(), createBlock(unref(component$2), {
					key: 0,
					type: "warning"
				}, {
					default: withCtx(() => [..._cache[8] || (_cache[8] = [createTextVNode("未保存", -1)])]),
					_: 1
				})) : createCommentVNode("", true)]),
				createBaseVNode("div", _hoisted_19$1, [
					createBaseVNode("div", _hoisted_20$1, [(openBlock(true), createElementBlock(Fragment, null, renderList(lineCount.value, (n) => {
						return openBlock(), createElementBlock("div", {
							key: n,
							class: "prc-lineno"
						}, toDisplayString(n), 1);
					}), 128))]),
					withDirectives(createBaseVNode("textarea", {
						"onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => content.value = $event),
						class: "prc-textarea",
						"data-testid": "prc-textarea",
						spellcheck: "false",
						disabled: loading.value || !currentPath.value,
						placeholder: "选择左侧配置文件后在此编辑"
					}, null, 8, _hoisted_21$1), [[vModelText, content.value]]),
					loading.value ? (openBlock(), createElementBlock("div", _hoisted_22$1, "加载中…")) : createCommentVNode("", true)
				]),
				result.value ? (openBlock(), createElementBlock("div", {
					key: 0,
					class: normalizeClass(["prc-result", result.value.success ? "is-ok" : "is-fail"])
				}, [
					createBaseVNode("div", _hoisted_23$1, [
						createVNode(unref(component$1), {
							name: result.value.success ? "CircleCheck" : "CircleClose",
							size: 14
						}, null, 8, ["name"]),
						createBaseVNode("span", null, toDisplayString(result.value.message), 1),
						result.value.validated === false ? (openBlock(), createElementBlock("span", _hoisted_24$1, "（未通过 promtool 校验）")) : createCommentVNode("", true),
						!result.value.reloaded ? (openBlock(), createElementBlock("span", _hoisted_25$1, "（未重载）")) : createCommentVNode("", true)
					]),
					result.value.steps?.length ? (openBlock(), createElementBlock("ul", _hoisted_26$1, [(openBlock(true), createElementBlock(Fragment, null, renderList(result.value.steps, (s, i) => {
						return openBlock(), createElementBlock("li", { key: i }, toDisplayString(s), 1);
					}), 128))])) : createCommentVNode("", true),
					result.value.output ? (openBlock(), createElementBlock("pre", _hoisted_27$1, toDisplayString(result.value.output), 1)) : createCommentVNode("", true)
				], 2)) : createCommentVNode("", true),
				createBaseVNode("div", _hoisted_28, [createBaseVNode("div", _hoisted_29, [
					createVNode(unref(ReSwitch_default), {
						modelValue: optBackup.value,
						"onUpdate:modelValue": _cache[1] || (_cache[1] = ($event) => optBackup.value = $event),
						"aria-label": "保存前备份"
					}, null, 8, ["modelValue"]),
					_cache[9] || (_cache[9] = createBaseVNode("span", { class: "prc-opt-label" }, "保存前备份", -1)),
					createVNode(unref(ReSwitch_default), {
						modelValue: optValidate.value,
						"onUpdate:modelValue": _cache[2] || (_cache[2] = ($event) => optValidate.value = $event),
						"aria-label": "promtool 校验"
					}, null, 8, ["modelValue"]),
					_cache[10] || (_cache[10] = createBaseVNode("span", { class: "prc-opt-label" }, "promtool 校验", -1)),
					createVNode(unref(ReSwitch_default), {
						modelValue: optReload.value,
						"onUpdate:modelValue": _cache[3] || (_cache[3] = ($event) => optReload.value = $event),
						"aria-label": "保存后重载"
					}, null, 8, ["modelValue"]),
					_cache[11] || (_cache[11] = createBaseVNode("span", { class: "prc-opt-label" }, "保存后重载", -1))
				]), createBaseVNode("div", _hoisted_30, [createVNode(unref(ReButton_default), {
					loading: reloading.value,
					"data-testid": "prc-btn-reload",
					onClick: doReload
				}, {
					icon: withCtx(() => [createVNode(unref(component$1), {
						name: "RefreshRight",
						size: 13
					})]),
					default: withCtx(() => [_cache[12] || (_cache[12] = createTextVNode(" 重载 ", -1))]),
					_: 1
				}, 8, ["loading"]), createVNode(unref(ReButton_default), {
					type: "primary",
					disabled: !dirty.value || !currentPath.value,
					loading: saving.value,
					"data-testid": "prc-btn-save",
					onClick: doSave
				}, {
					icon: withCtx(() => [createVNode(unref(component$1), {
						name: "Check",
						size: 13
					})]),
					default: withCtx(() => [_cache[13] || (_cache[13] = createTextVNode(" 保存 ", -1))]),
					_: 1
				}, 8, ["disabled", "loading"])])])
			])]), createVNode(unref(component), {
				modelValue: backupVisible.value,
				"onUpdate:modelValue": _cache[5] || (_cache[5] = ($event) => backupVisible.value = $event),
				title: "备份预览",
				width: "760px"
			}, {
				footer: withCtx(() => [createVNode(unref(ReButton_default), {
					"data-testid": "prc-btn-restore-cancel",
					onClick: _cache[4] || (_cache[4] = ($event) => backupVisible.value = false)
				}, {
					default: withCtx(() => [..._cache[14] || (_cache[14] = [createTextVNode("取消", -1)])]),
					_: 1
				}), createVNode(unref(ReButton_default), {
					type: "primary",
					loading: restoring.value,
					"data-testid": "prc-btn-restore-do",
					onClick: doRestore
				}, {
					default: withCtx(() => [..._cache[15] || (_cache[15] = [createTextVNode("恢复此备份", -1)])]),
					_: 1
				}, 8, ["loading"])]),
				default: withCtx(() => [createBaseVNode("div", _hoisted_31, [createBaseVNode("span", {
					class: "prc-path",
					title: backupPreview.value?.path
				}, toDisplayString(backupPreview.value?.path), 9, _hoisted_32)]), createBaseVNode("pre", _hoisted_33, toDisplayString(backupPreview.value?.content ?? ""), 1)]),
				_: 1
			}, 8, ["modelValue"])]);
		};
	}
}), [["__scopeId", "data-v-0620aaa1"]]);
//#endregion
//#region ../../pages/datasource/src/components/console/prometheus/PromCardSettingsDialog.vue?vue&type=script&setup=true&name=PromCardSettingsDialog&lang.ts
var _hoisted_1$2 = { class: "pcs" };
var _hoisted_2$2 = { class: "pcs-mode" };
var _hoisted_3$2 = {
	class: "dsm-seg",
	role: "group",
	"aria-label": "配置模式"
};
var _hoisted_4$2 = { class: "pcs-mode-hint" };
var _hoisted_5$2 = { class: "pcs-row" };
var _hoisted_6$2 = { class: "pcs-row" };
var _hoisted_7$2 = { class: "pcs-inline" };
var _hoisted_8$2 = { class: "pcs-row" };
var _hoisted_9$2 = { class: "pcs-row" };
var _hoisted_10$2 = { class: "pcs-row" };
var _hoisted_11$2 = { class: "pcs-inline" };
var _hoisted_12$1 = { class: "pcs-row" };
var _hoisted_13$1 = { class: "pcs-row" };
var _hoisted_14$1 = { class: "pcs-row" };
var _hoisted_15 = {
	key: 2,
	class: "pcs-row"
};
var _hoisted_16 = {
	key: 3,
	class: "pcs-row"
};
var _hoisted_17 = { class: "pcs-inline" };
var _hoisted_18 = { class: "pcs-row" };
var _hoisted_19 = { class: "pcs-inline" };
var _hoisted_20 = ["value"];
var _hoisted_21 = { class: "pcs-row" };
var _hoisted_22 = { class: "pcs-swatches" };
var _hoisted_23 = ["title", "onClick"];
var _hoisted_24 = { class: "pcs-row" };
var _hoisted_25 = { class: "pcs-inline" };
var _hoisted_26 = { class: "pcs-row" };
var _hoisted_27 = {
	key: 0,
	class: "pcs-error"
};
//#endregion
//#region ../../pages/datasource/src/components/console/prometheus/PromCardSettingsDialog.vue
var PromCardSettingsDialog_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	__name: "PromCardSettingsDialog",
	props: {
		modelValue: { type: Boolean },
		widget: {}
	},
	emits: ["update:modelValue", "save"],
	setup(__props, { emit: __emit }) {
		/**
		* 卡片设置弹窗（表单 / 自定义 JSON 双模式，默认表单）。
		*
		* <p>两种模式编辑的是同一份卡片模型：切到自定义时把当前表单序列化为 JSON，
		* 切回表单时解析 JSON 回填。保存时输出新的 widget 条目（父组件负责替换进布局并触发实时保存）。</p>
		*/
		const props = __props;
		const emit = __emit;
		const PRESET_COLORS = [
			{
				label: "白",
				value: "#ffffff"
			},
			{
				label: "浅灰",
				value: "#f5f7fa"
			},
			{
				label: "浅蓝",
				value: "#eef4ff"
			},
			{
				label: "浅绿",
				value: "#eefaf1"
			},
			{
				label: "浅黄",
				value: "#fdf6e3"
			},
			{
				label: "浅红",
				value: "#fdeef0"
			},
			{
				label: "深蓝",
				value: "#1e293b"
			},
			{
				label: "深灰",
				value: "#334155"
			}
		];
		const mode = ref("form");
		const customText = ref("");
		const customError = ref("");
		const form = reactive({ title: "" });
		const kind = computed(() => props.widget?.type || "prom-stat");
		const headLabel = computed(() => props.widget?.title || PROM_CARD_META[kind.value]?.label || "卡片");
		/** 背景色选择器的显示值：表单里存的是任意 CSS 颜色文本，input[type=color] 只认 #rrggbb */
		const colorPick = computed(() => /^#[0-9a-fA-F]{6}$/.test(form.background || "") ? form.background : "#ffffff");
		/** 打开弹窗时把 widget 配置灌进表单 */
		watch(() => [props.modelValue, props.widget], () => {
			if (!props.modelValue || !props.widget) return;
			mode.value = "form";
			customError.value = "";
			const prom = props.widget.prom ?? {};
			Object.keys(form).forEach((key) => {
				if (!(key in prom) && key !== "title") form[key] = void 0;
			});
			Object.assign(form, prom);
			form.title = props.widget.title || "";
			form.mode = prom.mode ?? (props.widget.type === "prom-chart" ? "range" : "instant");
			form.refreshSeconds = prom.refreshSeconds ?? 30;
		}, { immediate: true });
		/** 原生色块选择器：从事件目标读值写入背景色（不能读 colorPick——它是由背景色派生出来的） */
		function onPickColor(e) {
			const value = e.target.value;
			if (/^#[0-9a-fA-F]{6}$/.test(value)) form.background = value;
		}
		/** 切模式：表单 → JSON 序列化；JSON → 解析回填（解析失败留在自定义模式并报错） */
		function switchMode(next) {
			if (next === mode.value) return;
			if (next === "custom") {
				customText.value = JSON.stringify(buildPayload(), null, 2);
				customError.value = "";
				mode.value = "custom";
				return;
			}
			if (!customText.value.trim()) {
				mode.value = "form";
				return;
			}
			try {
				applyCustom(JSON.parse(customText.value));
				customError.value = "";
				mode.value = "form";
			} catch (e) {
				customError.value = `JSON 解析失败：${e?.message ?? e}`;
			}
		}
		/** 组装要保存的 widget 条目 */
		function buildPayload() {
			const { title, ...prom } = form;
			return {
				title: (title || "").trim(),
				prom: cleanProm(prom)
			};
		}
		/** 去掉空值字段，保持持久化 JSON 干净 */
		function cleanProm(prom) {
			const out = {};
			Object.entries(prom).forEach(([k, v]) => {
				if (v === void 0 || v === null || v === "") return;
				out[k] = v;
			});
			return out;
		}
		/** 自定义 JSON → 表单回填 */
		function applyCustom(parsed) {
			if (!parsed || typeof parsed !== "object") throw new Error("卡片 JSON 必须是对象");
			const prom = parsed.prom && typeof parsed.prom === "object" ? parsed.prom : {};
			Object.keys(form).forEach((key) => {
				if (key === "title") return;
				if (!(key in prom)) form[key] = void 0;
			});
			Object.assign(form, prom);
			form.title = typeof parsed.title === "string" ? parsed.title : "";
		}
		/** 自定义模式的 JSON 校验 */
		function validateCustom() {
			try {
				applyCustom(JSON.parse(customText.value));
				customError.value = "";
				message.success("JSON 合法");
				return true;
			} catch (e) {
				customError.value = `JSON 解析失败：${e?.message ?? e}`;
				return false;
			}
		}
		/** 保存：表单模式直接组装；自定义模式先解析再组装 */
		function save() {
			if (!props.widget) return;
			let title = form.title;
			let prom;
			if (mode.value === "custom") try {
				applyCustom(JSON.parse(customText.value));
			} catch (e) {
				customError.value = `JSON 解析失败：${e?.message ?? e}`;
				message.error("自定义 JSON 不合法，无法保存");
				return;
			}
			const payload = buildPayload();
			title = payload.title;
			prom = payload.prom;
			const next = {
				...props.widget,
				title: title || headLabel.value,
				prom
			};
			emit("save", { widget: next });
			emit("update:modelValue", false);
		}
		return (_ctx, _cache) => {
			return openBlock(), createBlock(unref(component), {
				"model-value": __props.modelValue,
				title: `卡片设置 · ${headLabel.value}`,
				width: "720px",
				"onUpdate:modelValue": _cache[20] || (_cache[20] = (v) => emit("update:modelValue", v))
			}, {
				footer: withCtx(() => [
					createVNode(unref(ReButton_default), {
						"data-testid": "pcs-btn-cancel",
						onClick: _cache[19] || (_cache[19] = ($event) => emit("update:modelValue", false))
					}, {
						default: withCtx(() => [..._cache[41] || (_cache[41] = [createTextVNode("取消", -1)])]),
						_: 1
					}),
					mode.value === "custom" ? (openBlock(), createBlock(unref(ReButton_default), {
						key: 0,
						"data-testid": "pcs-btn-validate",
						onClick: validateCustom
					}, {
						default: withCtx(() => [..._cache[42] || (_cache[42] = [createTextVNode("校验 JSON", -1)])]),
						_: 1
					})) : createCommentVNode("", true),
					createVNode(unref(ReButton_default), {
						type: "primary",
						"data-testid": "pcs-btn-save",
						onClick: save
					}, {
						default: withCtx(() => [..._cache[43] || (_cache[43] = [createTextVNode("保存", -1)])]),
						_: 1
					})
				]),
				default: withCtx(() => [createBaseVNode("div", _hoisted_1$2, [createBaseVNode("div", _hoisted_2$2, [createBaseVNode("div", _hoisted_3$2, [createBaseVNode("button", {
					type: "button",
					class: normalizeClass({ "is-active": mode.value === "form" }),
					"data-testid": "pcs-mode-form",
					onClick: _cache[0] || (_cache[0] = ($event) => switchMode("form"))
				}, "表单", 2), createBaseVNode("button", {
					type: "button",
					class: normalizeClass({ "is-active": mode.value === "custom" }),
					"data-testid": "pcs-mode-custom",
					onClick: _cache[1] || (_cache[1] = ($event) => switchMode("custom"))
				}, "自定义 JSON", 2)]), createBaseVNode("span", _hoisted_4$2, toDisplayString(mode.value === "form" ? "表单配置（默认）" : "直接编辑完整 JSON，适合高级参数"), 1)]), mode.value === "form" ? (openBlock(), createElementBlock(Fragment, { key: 0 }, [
					createBaseVNode("div", _hoisted_5$2, [_cache[21] || (_cache[21] = createBaseVNode("label", { class: "pcs-label" }, "标题", -1)), createVNode(unref(ReInput_default), {
						modelValue: form.title,
						"onUpdate:modelValue": _cache[2] || (_cache[2] = ($event) => form.title = $event),
						"data-testid": "pcs-input-title",
						placeholder: "卡片标题"
					}, null, 8, ["modelValue"])]),
					createBaseVNode("div", _hoisted_6$2, [_cache[23] || (_cache[23] = createBaseVNode("label", { class: "pcs-label" }, "刷新间隔", -1)), createBaseVNode("div", _hoisted_7$2, [createVNode(unref(ReInput_default), {
						modelValue: form.refreshSeconds,
						"onUpdate:modelValue": _cache[3] || (_cache[3] = ($event) => form.refreshSeconds = $event),
						"data-testid": "pcs-input-refresh",
						type: "number",
						placeholder: "秒，0 表示不自动刷新"
					}, null, 8, ["modelValue"]), _cache[22] || (_cache[22] = createBaseVNode("span", { class: "pcs-suffix" }, "秒", -1))])]),
					kind.value !== "prom-script" ? (openBlock(), createElementBlock(Fragment, { key: 0 }, [
						createBaseVNode("div", _hoisted_8$2, [_cache[24] || (_cache[24] = createBaseVNode("label", { class: "pcs-label" }, "数据模式", -1)), createVNode(unref(ReSelect_default), {
							modelValue: form.mode,
							"onUpdate:modelValue": _cache[4] || (_cache[4] = ($event) => form.mode = $event)
						}, {
							default: withCtx(() => [createVNode(unref(ReOption), {
								value: "instant",
								label: "即时查询（instant）"
							}), createVNode(unref(ReOption), {
								value: "range",
								label: "范围查询（range）"
							})]),
							_: 1
						}, 8, ["modelValue"])]),
						createBaseVNode("div", _hoisted_9$2, [_cache[25] || (_cache[25] = createBaseVNode("label", { class: "pcs-label" }, "PromQL", -1)), withDirectives(createBaseVNode("textarea", {
							"onUpdate:modelValue": _cache[5] || (_cache[5] = ($event) => form.promql = $event),
							class: "pcs-textarea",
							"data-testid": "pcs-textarea-promql",
							rows: "3",
							spellcheck: "false",
							placeholder: "如 up 或 rate(prometheus_http_requests_total[5m])"
						}, null, 512), [[vModelText, form.promql]])]),
						form.mode === "range" || kind.value === "prom-chart" ? (openBlock(), createElementBlock(Fragment, { key: 0 }, [createBaseVNode("div", _hoisted_10$2, [_cache[27] || (_cache[27] = createBaseVNode("label", { class: "pcs-label" }, "回看时长", -1)), createBaseVNode("div", _hoisted_11$2, [createVNode(unref(ReInput_default), {
							modelValue: form.durationMinutes,
							"onUpdate:modelValue": _cache[6] || (_cache[6] = ($event) => form.durationMinutes = $event),
							type: "number",
							placeholder: "分钟"
						}, null, 8, ["modelValue"]), _cache[26] || (_cache[26] = createBaseVNode("span", { class: "pcs-suffix" }, "分钟", -1))])]), createBaseVNode("div", _hoisted_12$1, [_cache[28] || (_cache[28] = createBaseVNode("label", { class: "pcs-label" }, "步长", -1)), createVNode(unref(ReInput_default), {
							modelValue: form.step,
							"onUpdate:modelValue": _cache[7] || (_cache[7] = ($event) => form.step = $event),
							placeholder: "空 = 按跨度自动（如 30s / 1m）"
						}, null, 8, ["modelValue"])])], 64)) : createCommentVNode("", true)
					], 64)) : createCommentVNode("", true),
					kind.value === "prom-chart" ? (openBlock(), createElementBlock(Fragment, { key: 1 }, [createBaseVNode("div", _hoisted_13$1, [_cache[29] || (_cache[29] = createBaseVNode("label", { class: "pcs-label" }, "图表类型", -1)), createVNode(unref(ReSelect_default), {
						modelValue: form.chartType,
						"onUpdate:modelValue": _cache[8] || (_cache[8] = ($event) => form.chartType = $event)
					}, {
						default: withCtx(() => [
							createVNode(unref(ReOption), {
								value: "line",
								label: "折线"
							}),
							createVNode(unref(ReOption), {
								value: "bar",
								label: "柱状"
							}),
							createVNode(unref(ReOption), {
								value: "area",
								label: "面积"
							})
						]),
						_: 1
					}, 8, ["modelValue"])]), createBaseVNode("div", _hoisted_14$1, [_cache[30] || (_cache[30] = createBaseVNode("label", { class: "pcs-label" }, "ECharts 参数", -1)), withDirectives(createBaseVNode("textarea", {
						"onUpdate:modelValue": _cache[9] || (_cache[9] = ($event) => form.echarts = $event),
						class: "pcs-textarea pcs-textarea--mono",
						"data-testid": "pcs-textarea-echarts",
						rows: "4",
						spellcheck: "false",
						placeholder: "JSON，深合并到自动生成的 option，如 {\"yAxis\":{\"max\":100}}"
					}, null, 512), [[vModelText, form.echarts]])])], 64)) : createCommentVNode("", true),
					kind.value === "prom-script" ? (openBlock(), createElementBlock("div", _hoisted_15, [_cache[31] || (_cache[31] = createBaseVNode("label", { class: "pcs-label" }, "采集脚本", -1)), withDirectives(createBaseVNode("textarea", {
						"onUpdate:modelValue": _cache[10] || (_cache[10] = ($event) => form.script = $event),
						class: "pcs-textarea pcs-textarea--mono",
						"data-testid": "pcs-textarea-script",
						rows: "8",
						spellcheck: "false",
						placeholder: "JS 函数体，可用 ctx.query / ctx.queryRange 取数，return 文本或对象"
					}, null, 512), [[vModelText, form.script]])])) : createCommentVNode("", true),
					kind.value === "prom-stat" || kind.value === "prom-table" ? (openBlock(), createElementBlock("div", _hoisted_16, [_cache[32] || (_cache[32] = createBaseVNode("label", { class: "pcs-label" }, "单位 / 小数位", -1)), createBaseVNode("div", _hoisted_17, [createVNode(unref(ReInput_default), {
						modelValue: form.unit,
						"onUpdate:modelValue": _cache[11] || (_cache[11] = ($event) => form.unit = $event),
						placeholder: "单位（如 % / req/s）"
					}, null, 8, ["modelValue"]), createVNode(unref(ReInput_default), {
						modelValue: form.decimals,
						"onUpdate:modelValue": _cache[12] || (_cache[12] = ($event) => form.decimals = $event),
						type: "number",
						placeholder: "小数位",
						class: "pcs-num"
					}, null, 8, ["modelValue"])])])) : createCommentVNode("", true),
					_cache[39] || (_cache[39] = createBaseVNode("div", { class: "pcs-divider" }, "外观", -1)),
					createBaseVNode("div", _hoisted_18, [_cache[34] || (_cache[34] = createBaseVNode("label", { class: "pcs-label" }, "背景色", -1)), createBaseVNode("div", _hoisted_19, [
						withDirectives(createBaseVNode("input", {
							"onUpdate:modelValue": _cache[13] || (_cache[13] = ($event) => form.background = $event),
							class: "pcs-color-text",
							"data-testid": "pcs-input-background",
							placeholder: "空 = 跟随主题（支持任意 CSS 颜色）"
						}, null, 512), [[vModelText, form.background]]),
						createBaseVNode("input", {
							value: colorPick.value,
							type: "color",
							class: "pcs-color",
							"data-testid": "pcs-input-color",
							onInput: onPickColor
						}, null, 40, _hoisted_20),
						createVNode(unref(ReButton_default), {
							"data-testid": "pcs-btn-clear-bg",
							onClick: _cache[14] || (_cache[14] = ($event) => form.background = "")
						}, {
							default: withCtx(() => [..._cache[33] || (_cache[33] = [createTextVNode("清除", -1)])]),
							_: 1
						})
					])]),
					createBaseVNode("div", _hoisted_21, [_cache[35] || (_cache[35] = createBaseVNode("label", { class: "pcs-label" }, "预设", -1)), createBaseVNode("div", _hoisted_22, [(openBlock(), createElementBlock(Fragment, null, renderList(PRESET_COLORS, (c) => {
						return createBaseVNode("button", {
							key: c.value,
							type: "button",
							class: "pcs-swatch",
							style: normalizeStyle({ background: c.value }),
							title: c.label,
							onClick: ($event) => form.background = c.value
						}, null, 12, _hoisted_23);
					}), 64))])]),
					createBaseVNode("div", _hoisted_24, [_cache[37] || (_cache[37] = createBaseVNode("label", { class: "pcs-label" }, "文字色", -1)), createBaseVNode("div", _hoisted_25, [withDirectives(createBaseVNode("input", {
						"onUpdate:modelValue": _cache[15] || (_cache[15] = ($event) => form.textColor = $event),
						class: "pcs-color-text",
						"data-testid": "pcs-input-textcolor",
						placeholder: "空 = 跟随主题"
					}, null, 512), [[vModelText, form.textColor]]), createVNode(unref(ReButton_default), {
						"data-testid": "pcs-btn-clear-textcolor",
						onClick: _cache[16] || (_cache[16] = ($event) => form.textColor = "")
					}, {
						default: withCtx(() => [..._cache[36] || (_cache[36] = [createTextVNode("清除", -1)])]),
						_: 1
					})])]),
					createBaseVNode("div", _hoisted_26, [_cache[38] || (_cache[38] = createBaseVNode("label", { class: "pcs-label" }, "自定义 CSS", -1)), withDirectives(createBaseVNode("textarea", {
						"onUpdate:modelValue": _cache[17] || (_cache[17] = ($event) => form.css = $event),
						class: "pcs-textarea pcs-textarea--mono",
						"data-testid": "pcs-textarea-css",
						rows: "4",
						spellcheck: "false",
						placeholder: "作用于卡片根元素的 CSS 声明，如 background: linear-gradient(...); border-radius: 12px;"
					}, null, 512), [[vModelText, form.css]])])
				], 64)) : (openBlock(), createElementBlock(Fragment, { key: 1 }, [
					_cache[40] || (_cache[40] = createBaseVNode("div", { class: "pcs-custom-hint" }, " 完整卡片 JSON（title + prom 配置）。字段与表单模式一一对应；保存前会做 JSON 校验。 ", -1)),
					withDirectives(createBaseVNode("textarea", {
						"onUpdate:modelValue": _cache[18] || (_cache[18] = ($event) => customText.value = $event),
						class: "pcs-textarea pcs-textarea--mono pcs-custom-json",
						"data-testid": "pcs-custom-json",
						rows: "18",
						spellcheck: "false"
					}, null, 512), [[vModelText, customText.value]]),
					customError.value ? (openBlock(), createElementBlock("div", _hoisted_27, toDisplayString(customError.value), 1)) : createCommentVNode("", true)
				], 64))])]),
				_: 1
			}, 8, ["model-value", "title"]);
		};
	}
}), [["__scopeId", "data-v-b20e1d0f"]]);
//#endregion
//#region ../../pages/datasource/src/components/console/prometheus/PromLayoutPanel.vue?vue&type=script&setup=true&name=PromLayoutPanel&lang.ts
var _hoisted_1$1 = { class: "prl" };
var _hoisted_2$1 = { class: "prl-bar" };
var _hoisted_3$1 = { class: "prl-bar-left" };
var _hoisted_4$1 = { class: "prl-bar-right" };
var _hoisted_5$1 = { class: "prl-body" };
var _hoisted_6$1 = { class: "prl-embed" };
var _hoisted_7$1 = { class: "prl-embed-block" };
var _hoisted_8$1 = { class: "prl-embed-row" };
var _hoisted_9$1 = ["value"];
var _hoisted_10$1 = { class: "prl-embed-block" };
var _hoisted_11$1 = { class: "prl-embed-row" };
var _hoisted_12 = ["value"];
var _hoisted_13 = { class: "prl-embed-foot" };
var _hoisted_14 = { class: "prl-embed-token" };
//#endregion
//#region ../../pages/datasource/src/components/console/prometheus/PromLayoutPanel.vue
var PromLayoutPanel_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	__name: "PromLayoutPanel",
	props: { datasourceId: {} },
	setup(__props) {
		/**
		* 自定义布局面板（需求 1.1/1.3/1.4/1.5/1.6）。
		*
		* <p>复用 home 插件的网格编辑器（HomePreview + WidgetLibrary），卡片配置挂 widget.prom：
		* 背景色 / 自定义 CSS / 采集脚本 / ECharts 参数均在卡片设置里配置（表单或 JSON 双模式，默认表单）。
		* 布局变化实时保存（debounce），并生成免登录嵌入链接供其他系统 iframe 使用。</p>
		*/
		const props = __props;
		provide(PROM_CTX_KEY, createConsoleContext(() => props.datasourceId));
		useRoute();
		const layout = ref(emptyLayout());
		const loading = ref(false);
		const saving = ref(false);
		const dirty = ref(false);
		const embedToken = ref("");
		const dashboardName = ref("");
		const savedAt = ref("");
		const saveError = ref("");
		const settingsVisible = ref(false);
		const editingWidget = ref(null);
		const embedVisible = ref(false);
		const regenerating = ref(false);
		const stateText = computed(() => {
			if (saving.value) return "保存中…";
			if (saveError.value) return `保存失败：${saveError.value}`;
			if (dirty.value) return "编辑中…";
			return savedAt.value ? `已保存 ${savedAt.value}` : "已同步";
		});
		const stateClass = computed(() => ({
			"is-saving": saving.value,
			"is-dirty": dirty.value && !saving.value,
			"is-error": !!saveError.value,
			"is-saved": !dirty.value && !saving.value && !saveError.value
		}));
		/** 嵌入链接：hash 路由下的免登录只读页面 */
		const embedUrl = computed(() => {
			if (!embedToken.value) return "";
			return `${`${window.location.origin}${window.location.pathname}`}#/prometheus/embed/${embedToken.value}`;
		});
		const iframeSnippet = computed(() => `<iframe src="${embedUrl.value}" width="100%" height="720" style="border:0" allowfullscreen loading="lazy"></iframe>`);
		/** 载入期间抑制 watcher 触发的保存：避免把「从后端载入布局」误当成「用户编辑」自动落库 */
		let hydrating = false;
		async function reload() {
			loading.value = true;
			saveError.value = "";
			try {
				const dashboard = await fetchPrometheusDashboard(props.datasourceId);
				embedToken.value = dashboard?.embedToken || "";
				dashboardName.value = dashboard?.name || "";
				hydrating = true;
				layout.value = parseLayout(dashboard?.config);
				nextTick(() => {
					hydrating = false;
				});
				dirty.value = false;
				savedAt.value = dashboard?.updateTime ? formatTime(dashboard.updateTime) : "";
			} catch (e) {
				saveError.value = e?.message || String(e);
				message.error(`看板读取失败：${saveError.value}`);
			} finally {
				loading.value = false;
			}
		}
		async function saveNow() {
			if (saving.value) return;
			saving.value = true;
			saveError.value = "";
			try {
				const dashboard = await savePrometheusDashboard({
					datasourceId: props.datasourceId,
					name: dashboardName.value || void 0,
					config: serializeLayout(layout.value)
				});
				embedToken.value = dashboard?.embedToken || embedToken.value;
				dirty.value = false;
				savedAt.value = formatNow();
			} catch (e) {
				saveError.value = e?.message || String(e);
			} finally {
				saving.value = false;
			}
		}
		/** 实时保存：布局变化 800ms 后落库 */
		let saveTimer = null;
		function scheduleSave() {
			dirty.value = true;
			if (saveTimer !== null) window.clearTimeout(saveTimer);
			saveTimer = window.setTimeout(() => {
				saveTimer = null;
				saveNow();
			}, 800);
		}
		watch(layout, () => {
			if (hydrating) return;
			scheduleSave();
		}, { deep: true });
		function formatNow() {
			return (/* @__PURE__ */ new Date()).toLocaleTimeString("zh-CN", { hour12: false });
		}
		function formatTime(value) {
			const d = new Date(value);
			return Number.isNaN(d.getTime()) ? value : d.toLocaleTimeString("zh-CN", { hour12: false });
		}
		function onGridUpdate(grid) {
			layout.value = {
				...layout.value,
				grid
			};
		}
		function onRemove(id) {
			layout.value = {
				...layout.value,
				widgets: layout.value.widgets.filter((w) => w.id !== id),
				grid: layout.value.grid.filter((g) => g.i !== id)
			};
		}
		function onAdd(type) {
			const kind = type;
			const meta = PROM_CARD_META[kind];
			if (!meta) return;
			if (layout.value.widgets.filter((w) => w.type === type).length >= 24) {
				message.warning(`${meta.label} 数量已达上限`);
				return;
			}
			const id = newCardId();
			const bottom = layout.value.grid.reduce((max, g) => Math.max(max, g.y + g.h), 0);
			const widget = {
				id,
				type: kind,
				title: meta.label,
				prom: { ...meta.defaultCard }
			};
			layout.value = {
				...layout.value,
				widgets: [...layout.value.widgets, widget],
				grid: [...layout.value.grid, {
					i: id,
					x: 0,
					y: bottom,
					w: meta.defaultSize.w,
					h: meta.defaultSize.h
				}]
			};
			openSettings(id);
		}
		function openSettings(id) {
			const found = layout.value.widgets.find((w) => w.id === id);
			if (!found) return;
			editingWidget.value = found;
			settingsVisible.value = true;
		}
		function onSettingsSave(payload) {
			layout.value = {
				...layout.value,
				widgets: layout.value.widgets.map((w) => w.id === payload.widget.id ? payload.widget : w)
			};
		}
		function openEmbed() {
			embedVisible.value = true;
			if (!embedToken.value && !saving.value) saveNow().then(() => {
				if (!embedToken.value) message.warning("请先成功保存看板后再获取嵌入链接");
			});
		}
		async function regenerate() {
			try {
				await ElMessageBox.confirm("重新生成后旧链接立即失效，确认继续？", "重新生成令牌", {
					type: "warning",
					confirmButtonText: "重新生成",
					cancelButtonText: "取消"
				});
			} catch {
				return;
			}
			regenerating.value = true;
			try {
				const dashboard = await regeneratePrometheusToken(props.datasourceId);
				embedToken.value = dashboard?.embedToken || "";
				message.success("令牌已更新");
			} catch (e) {
				message.error(`生成失败：${e?.message ?? e}`);
			} finally {
				regenerating.value = false;
			}
		}
		function selectText(e) {
			e.target.select();
		}
		async function copyText(text, label) {
			if (!text) {
				message.warning("暂无可复制的链接");
				return;
			}
			if (await copyToClipboard(text)) message.success(`${label}已复制`);
			else message.warning("复制失败，请手动选中复制");
		}
		onMounted(() => {
			reload();
		});
		onBeforeUnmount(() => {
			if (saveTimer !== null) window.clearTimeout(saveTimer);
		});
		watch(() => props.datasourceId, () => {
			reload();
		});
		return (_ctx, _cache) => {
			return openBlock(), createElementBlock("div", _hoisted_1$1, [
				createBaseVNode("div", _hoisted_2$1, [createBaseVNode("div", _hoisted_3$1, [_cache[5] || (_cache[5] = createBaseVNode("span", { class: "prl-title" }, "自定义看板", -1)), createBaseVNode("span", { class: normalizeClass(["prl-state", stateClass.value]) }, toDisplayString(stateText.value), 3)]), createBaseVNode("div", _hoisted_4$1, [
					createVNode(unref(ReButton_default), {
						loading: loading.value,
						"data-testid": "prl-btn-reload",
						onClick: reload
					}, {
						icon: withCtx(() => [createVNode(unref(component$1), {
							name: "Refresh",
							size: 13
						})]),
						default: withCtx(() => [_cache[6] || (_cache[6] = createTextVNode(" 重新载入 ", -1))]),
						_: 1
					}, 8, ["loading"]),
					createVNode(unref(ReButton_default), {
						disabled: !dirty.value || saving.value,
						"data-testid": "prl-btn-save",
						onClick: saveNow
					}, {
						icon: withCtx(() => [createVNode(unref(component$1), {
							name: "Check",
							size: 13
						})]),
						default: withCtx(() => [_cache[7] || (_cache[7] = createTextVNode(" 保存 ", -1))]),
						_: 1
					}, 8, ["disabled"]),
					createVNode(unref(ReButton_default), {
						type: "primary",
						"data-testid": "prl-btn-embed",
						onClick: openEmbed
					}, {
						icon: withCtx(() => [createVNode(unref(component$1), {
							name: "Link",
							size: 13
						})]),
						default: withCtx(() => [_cache[8] || (_cache[8] = createTextVNode(" 嵌入链接 ", -1))]),
						_: 1
					})
				])]),
				createBaseVNode("div", _hoisted_5$1, [createVNode(HomePreview_default, {
					widgets: layout.value.widgets,
					grid: layout.value.grid,
					"onUpdate:grid": onGridUpdate,
					onRemove,
					onEdit: openSettings
				}, {
					default: withCtx(({ widget }) => [createVNode(PromCardRenderer_default, { widget }, null, 8, ["widget"])]),
					_: 1
				}, 8, ["widgets", "grid"]), createVNode(WidgetLibrary_default, {
					catalog: unref(PROM_CARD_CATALOG),
					onAdd
				}, null, 8, ["catalog"])]),
				createVNode(PromCardSettingsDialog_default, {
					modelValue: settingsVisible.value,
					"onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => settingsVisible.value = $event),
					widget: editingWidget.value,
					onSave: onSettingsSave
				}, null, 8, ["modelValue", "widget"]),
				createVNode(unref(component), {
					modelValue: embedVisible.value,
					"onUpdate:modelValue": _cache[4] || (_cache[4] = ($event) => embedVisible.value = $event),
					title: "嵌入到其他系统",
					width: "680px"
				}, {
					footer: withCtx(() => [createVNode(unref(ReButton_default), {
						type: "primary",
						"data-testid": "prl-btn-embed-close",
						onClick: _cache[3] || (_cache[3] = ($event) => embedVisible.value = false)
					}, {
						default: withCtx(() => [..._cache[15] || (_cache[15] = [createTextVNode("关闭", -1)])]),
						_: 1
					})]),
					default: withCtx(() => [createBaseVNode("div", _hoisted_6$1, [
						_cache[14] || (_cache[14] = createBaseVNode("div", { class: "prl-embed-hint" }, " 下面链接免登录只读访问本看板，可直接 iframe 嵌入任意系统；令牌泄露可在下方重新生成（旧链接立即失效）。 ", -1)),
						createBaseVNode("div", _hoisted_7$1, [_cache[10] || (_cache[10] = createBaseVNode("div", { class: "prl-embed-label" }, "嵌入链接", -1)), createBaseVNode("div", _hoisted_8$1, [createBaseVNode("input", {
							class: "prl-embed-input",
							"data-testid": "prl-embed-url",
							value: embedUrl.value,
							readonly: "",
							onFocus: selectText
						}, null, 40, _hoisted_9$1), createVNode(unref(ReButton_default), {
							"data-testid": "prl-btn-copy-url",
							onClick: _cache[1] || (_cache[1] = ($event) => copyText(embedUrl.value, "链接"))
						}, {
							default: withCtx(() => [..._cache[9] || (_cache[9] = [createTextVNode("复制", -1)])]),
							_: 1
						})])]),
						createBaseVNode("div", _hoisted_10$1, [_cache[12] || (_cache[12] = createBaseVNode("div", { class: "prl-embed-label" }, "iframe 片段", -1)), createBaseVNode("div", _hoisted_11$1, [createBaseVNode("input", {
							class: "prl-embed-input",
							"data-testid": "prl-embed-snippet",
							value: iframeSnippet.value,
							readonly: "",
							onFocus: selectText
						}, null, 40, _hoisted_12), createVNode(unref(ReButton_default), {
							"data-testid": "prl-btn-copy-snippet",
							onClick: _cache[2] || (_cache[2] = ($event) => copyText(iframeSnippet.value, "iframe 片段"))
						}, {
							default: withCtx(() => [..._cache[11] || (_cache[11] = [createTextVNode("复制", -1)])]),
							_: 1
						})])]),
						createBaseVNode("div", _hoisted_13, [createBaseVNode("span", _hoisted_14, "令牌：" + toDisplayString(embedToken.value || "保存看板后自动生成"), 1), createVNode(unref(ReButton_default), {
							loading: regenerating.value,
							"data-testid": "prl-btn-regenerate",
							onClick: regenerate
						}, {
							icon: withCtx(() => [createVNode(unref(component$1), {
								name: "RefreshRight",
								size: 13
							})]),
							default: withCtx(() => [_cache[13] || (_cache[13] = createTextVNode(" 重新生成令牌 ", -1))]),
							_: 1
						}, 8, ["loading"])])
					])]),
					_: 1
				}, 8, ["modelValue"])
			]);
		};
	}
}), [["__scopeId", "data-v-05abcf77"]]);
//#endregion
//#region ../../pages/datasource/src/views/console/PrometheusManageView.vue?vue&type=script&setup=true&name=PrometheusManageView&lang.ts
var _hoisted_1 = { class: "dsm tel-page" };
var _hoisted_2 = { class: "dsm-toolbar re-surface" };
var _hoisted_3 = { class: "dsm-toolbar-left" };
var _hoisted_4 = {
	key: 0,
	class: "prm-meta"
};
var _hoisted_5 = { class: "dsm-toolbar-right" };
var _hoisted_6 = { class: "dsm-db-select" };
var _hoisted_7 = {
	key: 1,
	class: "dsm-body"
};
var _hoisted_8 = { class: "dsm-sidebar prm-nav" };
var _hoisted_9 = { class: "prm-nav-list" };
var _hoisted_10 = ["data-testid", "onClick"];
var _hoisted_11 = { class: "prm-main" };
//#endregion
//#region ../../pages/datasource/src/views/console/PrometheusManageView.vue
var PrometheusManageView_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	__name: "PrometheusManageView",
	setup(__props) {
		/**
		* Prometheus 控制台：总览 / 查询 / 监控 / 配置 / 自定义看板。
		*/
		const { datasourceId, source, gap, bind, ready, fail } = useMiddlewareSource();
		const tabs = [
			{
				name: "overview",
				label: "总览",
				icon: "Odometer"
			},
			{
				name: "query",
				label: "查询",
				icon: "Search"
			},
			{
				name: "monitor",
				label: "监控",
				icon: "Monitor"
			},
			{
				name: "config",
				label: "配置",
				icon: "Setting"
			},
			{
				name: "layout",
				label: "自定义布局",
				icon: "Grid"
			}
		];
		const activeTab = ref("overview");
		const sources = ref([]);
		const overview = ref(null);
		const overviewLoading = ref(false);
		/** 顶栏状态：可达 / 不可达 / 加载中 / 未知 */
		const statusText = computed(() => {
			if (overviewLoading.value) return "加载中";
			if (!overview.value) return "状态未知";
			return overview.value.reachable ? "运行中" : "不可达";
		});
		const stateClass = computed(() => ({
			"is-running": !overviewLoading.value && overview.value?.reachable === true,
			"is-stopped": !overviewLoading.value && overview.value?.reachable === false,
			"is-unknown": !overviewLoading.value && !overview.value,
			"is-loading": overviewLoading.value
		}));
		/** 版本信息进顶栏 */
		const metaText = computed(() => {
			const o = overview.value;
			if (!o) return "";
			const parts = [];
			if (o.version) parts.push(`v${o.version}`);
			if (o.revision) parts.push(o.revision.slice(0, 8));
			if (source.value) parts.push(`${source.value.host}:${source.value.port || 9090}`);
			return parts.join(" · ");
		});
		function goTab(name) {
			activeTab.value = name;
		}
		async function onGapRetry() {
			await bind("prometheus");
			if (datasourceId.value) await reloadOverview();
		}
		async function reloadOverview() {
			if (!datasourceId.value) {
				overview.value = null;
				return;
			}
			overviewLoading.value = true;
			try {
				overview.value = await fetchPrometheusOverview(datasourceId.value);
				ready();
			} catch (e) {
				overview.value = null;
				fail(e, "/ms/monitor/prometheus/overview");
				message.error(`总览加载失败：${e?.message ?? e}`);
			} finally {
				overviewLoading.value = false;
			}
		}
		async function onSwitchSource(id) {
			datasourceId.value = id;
			overview.value = null;
			await bind("prometheus");
			if (datasourceId.value) await reloadOverview();
		}
		onMounted(async () => {
			try {
				sources.value = await fetchPrometheusSources() || [];
			} catch {}
			await bind("prometheus");
			if (datasourceId.value) await reloadOverview();
		});
		return (_ctx, _cache) => {
			const _directive_loading = resolveDirective("loading");
			return openBlock(), createElementBlock("div", _hoisted_1, [createBaseVNode("div", _hoisted_2, [createBaseVNode("div", _hoisted_3, [
				createVNode(unref(component$1), {
					name: "DataLine",
					size: 18,
					class: "dsm-title-icon dsm-prom-icon"
				}),
				_cache[1] || (_cache[1] = createBaseVNode("span", { class: "dsm-title" }, "Prometheus 服务管理", -1)),
				createBaseVNode("span", { class: normalizeClass(["prm-state", stateClass.value]) }, [_cache[0] || (_cache[0] = createBaseVNode("i", { class: "prm-state-dot" }, null, -1)), createTextVNode(" " + toDisplayString(statusText.value), 1)], 2),
				metaText.value ? (openBlock(), createElementBlock("span", _hoisted_4, toDisplayString(metaText.value), 1)) : createCommentVNode("", true)
			]), createBaseVNode("div", _hoisted_5, [createBaseVNode("div", _hoisted_6, [createVNode(unref(ReSelect_default), {
				"model-value": unref(datasourceId),
				"data-testid": "prm-select-source",
				placeholder: "选择实例",
				onChange: onSwitchSource
			}, {
				default: withCtx(() => [(openBlock(true), createElementBlock(Fragment, null, renderList(sources.value, (d) => {
					return openBlock(), createBlock(unref(ReOption), {
						key: d.id,
						value: d.id,
						label: d.name || `${d.host}:${d.port || 9090}`
					}, null, 8, ["value", "label"]);
				}), 128))]),
				_: 1
			}, 8, ["model-value"])]), createVNode(unref(ReButton_default), {
				layout: "square",
				icon: "Refresh",
				tip: "刷新",
				"data-testid": "prm-btn-refresh",
				loading: overviewLoading.value,
				onClick: reloadOverview
			}, null, 8, ["loading"])])]), unref(gap) ? (openBlock(), createBlock(MiddlewareGap_default, {
				key: 0,
				text: unref(gap),
				onRetry: onGapRetry
			}, null, 8, ["text"])) : (openBlock(), createElementBlock("div", _hoisted_7, [createBaseVNode("aside", _hoisted_8, [_cache[2] || (_cache[2] = createBaseVNode("div", { class: "dsm-view-bar" }, [createBaseVNode("span", { class: "prm-nav-title" }, "PROMETHEUS 控制台")], -1)), createBaseVNode("div", _hoisted_9, [(openBlock(), createElementBlock(Fragment, null, renderList(tabs, (t) => {
				return createBaseVNode("button", {
					key: t.name,
					class: normalizeClass(["prm-nav-item", { active: activeTab.value === t.name }]),
					type: "button",
					"data-testid": `prm-tab-${t.name}`,
					onClick: ($event) => goTab(t.name)
				}, [createVNode(unref(component$1), {
					name: t.icon,
					size: 14,
					class: "prm-nav-icon"
				}, null, 8, ["name"]), createBaseVNode("span", null, toDisplayString(t.label), 1)], 10, _hoisted_10);
			}), 64))])]), createBaseVNode("section", _hoisted_11, [activeTab.value === "overview" ? withDirectives((openBlock(), createBlock(PromOverviewPanel_default, {
				key: 0,
				loading: overviewLoading.value,
				data: overview.value
			}, null, 8, ["loading", "data"])), [[_directive_loading, overviewLoading.value]]) : activeTab.value === "query" ? (openBlock(), createBlock(PromQueryPanel_default, {
				key: 1,
				"datasource-id": unref(datasourceId)
			}, null, 8, ["datasource-id"])) : activeTab.value === "monitor" ? (openBlock(), createBlock(PromMonitorPanel_default, {
				key: 2,
				"datasource-id": unref(datasourceId)
			}, null, 8, ["datasource-id"])) : activeTab.value === "config" ? (openBlock(), createBlock(PromConfigPanel_default, {
				key: 3,
				"datasource-id": unref(datasourceId)
			}, null, 8, ["datasource-id"])) : activeTab.value === "layout" ? (openBlock(), createBlock(PromLayoutPanel_default, {
				key: 4,
				"datasource-id": unref(datasourceId)
			}, null, 8, ["datasource-id"])) : createCommentVNode("", true)])]))]);
		};
	}
}), [["__scopeId", "data-v-3e184c90"]]);
//#endregion
export { PrometheusManageView_default as default };
