import { Ct as resolveDirective, D as createVNode, E as createTextVNode, On as unref, St as resolveComponent, Yt as withDirectives, _ as createBaseVNode, b as createElementBlock, ct as onMounted, g as computed, k as defineComponent, mt as openBlock, qt as withCtx, rr as toDisplayString, v as createBlock, vn as ref } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { C as withKeys } from "./runtime-dom.esm-bundler-RRl39S3n.js";
import { Nt as refresh_default } from "./dist-DogtK295.js";
import { yt as message } from "./src-CEonioA3.js";
import { w as unwrapResult, x as http } from "./src-DDwlSqPX.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
//#region src/api/monitorNodesApi.ts
/**
* 在线节点 API
*
* 数据源：monitor 的 report 客户端注册（sync/client/register + monitor/app/report）。
* 后端上下文：spring-api-support-monitor-starter / /ms/monitor/node。
*
* @author CH
* @since 4.0.0.42
*/
var BASE = "/ms/monitor/node";
/** 全部已注册节点（含离线） */
var getMonitorNodes = () => http().get(`${BASE}/list`).then((r) => unwrapResult(r));
/** 节点统计 */
var getMonitorNodeStats = () => http().get(`${BASE}/stats`).then((r) => unwrapResult(r));
//#endregion
//#region src/views/NodesView.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1 = { class: "nodes-page" };
var _hoisted_2 = { class: "card nodes-hero" };
var _hoisted_3 = { class: "page-header" };
var _hoisted_4 = { class: "page-actions" };
var _hoisted_5 = { class: "stats-row" };
var _hoisted_6 = { class: "stat-card" };
var _hoisted_7 = { class: "stat-num ok" };
var _hoisted_8 = { class: "stat-card" };
var _hoisted_9 = { class: "stat-num muted" };
var _hoisted_10 = { class: "stat-card" };
var _hoisted_11 = { class: "stat-num" };
var _hoisted_12 = { class: "card nodes-main" };
var _hoisted_13 = { class: "filter-bar" };
var _hoisted_14 = { class: "filter-count" };
//#endregion
//#region src/views/NodesView.vue
var NodesView_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	name: "OnlineNodes",
	__name: "NodesView",
	setup(__props) {
		/**
		* 节点管理 —— 在线节点
		*
		* 展示通过 monitor 的 report 客户端（sync/client/register + monitor/app/report）
		* 注册上来的节点；在线状态由 sync 服务端连接会话判定。
		*
		* @author CH
		* @since 4.0.0.42
		*/
		const loading = ref(false);
		const nodes = ref([]);
		const stats = ref({
			total: 0,
			online: 0,
			offline: 0
		});
		const keyword = ref("");
		const statusFilter = ref("online");
		const rows = computed(() => {
			const kw = keyword.value.trim().toLowerCase();
			return nodes.value.filter((n) => {
				if (statusFilter.value === "online" && !n.online) return false;
				if (statusFilter.value === "offline" && n.online) return false;
				if (!kw) return true;
				return [
					n.applicationName,
					n.hostname,
					n.ipAddress,
					n.serviceUrl,
					n.activeProfiles
				].filter(Boolean).some((v) => String(v).toLowerCase().includes(kw));
			});
		});
		function timeText(ms) {
			if (!ms) return "—";
			const d = new Date(ms);
			if (Number.isNaN(d.getTime())) return "—";
			return d.toLocaleString();
		}
		function addressText(n) {
			if (!n.ipAddress) return "—";
			return n.port ? `${n.ipAddress}:${n.port}` : n.ipAddress;
		}
		async function load() {
			loading.value = true;
			try {
				const [list, stat] = await Promise.all([getMonitorNodes(), getMonitorNodeStats().catch(() => null)]);
				nodes.value = list ?? [];
				if (stat) stats.value = stat;
				else recomputeStats();
			} catch (e) {
				nodes.value = [];
				recomputeStats();
				message.error(`在线节点加载失败：${String(e?.message ?? e)}`);
			} finally {
				loading.value = false;
			}
		}
		function recomputeStats() {
			const online = nodes.value.filter((n) => n.online).length;
			stats.value = {
				total: nodes.value.length,
				online,
				offline: nodes.value.length - online
			};
		}
		onMounted(load);
		return (_ctx, _cache) => {
			const _component_el_icon = resolveComponent("el-icon");
			const _component_el_button = resolveComponent("el-button");
			const _component_el_input = resolveComponent("el-input");
			const _component_el_option = resolveComponent("el-option");
			const _component_el_select = resolveComponent("el-select");
			const _component_el_table_column = resolveComponent("el-table-column");
			const _component_el_tag = resolveComponent("el-tag");
			const _component_el_table = resolveComponent("el-table");
			const _directive_loading = resolveDirective("loading");
			return openBlock(), createElementBlock("div", _hoisted_1, [
				createBaseVNode("div", _hoisted_2, [createBaseVNode("div", _hoisted_3, [_cache[3] || (_cache[3] = createBaseVNode("div", null, [createBaseVNode("h1", { class: "page-title" }, "在线节点"), createBaseVNode("p", { class: "page-desc" }, "monitor report 客户端注册节点 · 服务发现数据源")], -1)), createBaseVNode("div", _hoisted_4, [createVNode(_component_el_button, {
					loading: loading.value,
					onClick: load
				}, {
					default: withCtx(() => [createVNode(_component_el_icon, null, {
						default: withCtx(() => [createVNode(unref(refresh_default))]),
						_: 1
					}), _cache[2] || (_cache[2] = createBaseVNode("span", null, "刷新", -1))]),
					_: 1
				}, 8, ["loading"])])])]),
				createBaseVNode("div", _hoisted_5, [
					createBaseVNode("div", _hoisted_6, [createBaseVNode("div", _hoisted_7, toDisplayString(stats.value.online), 1), _cache[4] || (_cache[4] = createBaseVNode("div", { class: "stat-label" }, "在线节点", -1))]),
					createBaseVNode("div", _hoisted_8, [createBaseVNode("div", _hoisted_9, toDisplayString(stats.value.offline), 1), _cache[5] || (_cache[5] = createBaseVNode("div", { class: "stat-label" }, "离线节点", -1))]),
					createBaseVNode("div", _hoisted_10, [createBaseVNode("div", _hoisted_11, toDisplayString(stats.value.total), 1), _cache[6] || (_cache[6] = createBaseVNode("div", { class: "stat-label" }, "注册总数", -1))])
				]),
				createBaseVNode("div", _hoisted_12, [createBaseVNode("div", _hoisted_13, [
					createVNode(_component_el_input, {
						modelValue: keyword.value,
						"onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => keyword.value = $event),
						placeholder: "应用名 / 主机 / IP / 服务地址",
						clearable: "",
						style: { "width": "280px" },
						onKeyup: withKeys(load, ["enter"]),
						onClear: load
					}, null, 8, ["modelValue"]),
					createVNode(_component_el_select, {
						modelValue: statusFilter.value,
						"onUpdate:modelValue": _cache[1] || (_cache[1] = ($event) => statusFilter.value = $event),
						style: { "width": "130px" }
					}, {
						default: withCtx(() => [
							createVNode(_component_el_option, {
								label: "在线",
								value: "online"
							}),
							createVNode(_component_el_option, {
								label: "全部",
								value: "all"
							}),
							createVNode(_component_el_option, {
								label: "离线",
								value: "offline"
							})
						]),
						_: 1
					}, 8, ["modelValue"]),
					createBaseVNode("span", _hoisted_14, "共 " + toDisplayString(rows.value.length) + " 条", 1)
				]), withDirectives((openBlock(), createBlock(_component_el_table, {
					data: rows.value,
					"row-key": "clientId",
					border: "",
					"empty-text": "暂无注册节点"
				}, {
					default: withCtx(() => [
						createVNode(_component_el_table_column, {
							prop: "applicationName",
							label: "应用名",
							"min-width": "180",
							"show-overflow-tooltip": ""
						}, {
							default: withCtx(({ row }) => [createTextVNode(toDisplayString(row.applicationName || "—"), 1)]),
							_: 1
						}),
						createVNode(_component_el_table_column, {
							prop: "hostname",
							label: "主机名",
							"min-width": "150",
							"show-overflow-tooltip": ""
						}, {
							default: withCtx(({ row }) => [createTextVNode(toDisplayString(row.hostname || "—"), 1)]),
							_: 1
						}),
						createVNode(_component_el_table_column, {
							label: "地址",
							"min-width": "160"
						}, {
							default: withCtx(({ row }) => [createTextVNode(toDisplayString(addressText(row)), 1)]),
							_: 1
						}),
						createVNode(_component_el_table_column, {
							prop: "serviceUrl",
							label: "服务地址",
							"min-width": "220",
							"show-overflow-tooltip": ""
						}, {
							default: withCtx(({ row }) => [createTextVNode(toDisplayString(row.serviceUrl || "—"), 1)]),
							_: 1
						}),
						createVNode(_component_el_table_column, {
							prop: "activeProfiles",
							label: "环境",
							width: "110"
						}, {
							default: withCtx(({ row }) => [createTextVNode(toDisplayString(row.activeProfiles || "—"), 1)]),
							_: 1
						}),
						createVNode(_component_el_table_column, {
							prop: "javaVersion",
							label: "Java",
							width: "110"
						}, {
							default: withCtx(({ row }) => [createTextVNode(toDisplayString(row.javaVersion || "—"), 1)]),
							_: 1
						}),
						createVNode(_component_el_table_column, {
							label: "状态",
							width: "100"
						}, {
							default: withCtx(({ row }) => [createVNode(_component_el_tag, {
								type: row.online ? "success" : "info",
								effect: "plain"
							}, {
								default: withCtx(() => [createTextVNode(toDisplayString(row.online ? "在线" : "离线"), 1)]),
								_: 2
							}, 1032, ["type"])]),
							_: 1
						}),
						createVNode(_component_el_table_column, {
							label: "最后心跳",
							width: "180"
						}, {
							default: withCtx(({ row }) => [createTextVNode(toDisplayString(timeText(row.lastHeartbeat)), 1)]),
							_: 1
						}),
						createVNode(_component_el_table_column, {
							label: "注册时间",
							width: "180"
						}, {
							default: withCtx(({ row }) => [createTextVNode(toDisplayString(timeText(row.registerTime)), 1)]),
							_: 1
						})
					]),
					_: 1
				}, 8, ["data"])), [[_directive_loading, loading.value]])])
			]);
		};
	}
}), [["__scopeId", "data-v-a06fd22e"]]);
//#endregion
export { NodesView_default as default };
