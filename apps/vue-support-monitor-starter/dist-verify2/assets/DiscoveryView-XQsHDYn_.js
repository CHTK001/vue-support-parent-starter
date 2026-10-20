import { $n as normalizeClass, D as createVNode, E as createTextVNode, St as resolveComponent, _ as createBaseVNode, b as createElementBlock, ct as onMounted, k as defineComponent, mt as openBlock, qt as withCtx, rr as toDisplayString, v as createBlock, vn as ref, y as createCommentVNode } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { t as ElMessage } from "./message-BQI5cdKE.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { Q as getDiscoveryStatus, at as queryDiscoveryInstances, tt as listDiscoveryProtocols } from "./api-CRz4q4qT.js";
//#region src/views/DiscoveryView.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1 = { class: "px disc-page" };
var _hoisted_2 = { class: "status-row" };
var _hoisted_3 = {
	key: 0,
	class: "muted"
};
var _hoisted_4 = {
	key: 1,
	class: "muted"
};
var _hoisted_5 = {
	key: 2,
	class: "muted"
};
var _hoisted_6 = {
	key: 3,
	class: "muted"
};
var _hoisted_7 = {
	key: 0,
	class: "hint"
};
var _hoisted_8 = { class: "query-bar" };
var _hoisted_9 = { class: "count" };
var _hoisted_10 = { class: "mono" };
//#endregion
//#region src/views/DiscoveryView.vue
var DiscoveryView_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	__name: "DiscoveryView",
	setup(__props) {
		/**
		* 发现服务 —— 服务发现状态、协议查询与服务实例列表
		* 后端端点：/ms/monitor/discovery（status / protocols / services）
		* 未启用发现服务时降级展示空列表与提示，不报错。
		* @author CH
		* @since 4.0.0
		*/
		const status = ref(null);
		/** 服务实例列表 */
		const instances = ref([]);
		/** 实例查询说明文案（未启用 / 查询失败时由后端返回） */
		const message = ref("");
		/** 可用的发现协议选项 */
		const protocolOptions = ref([]);
		/** 查询条件：协议（可选） */
		const queryProtocol = ref("");
		/** 查询条件：服务标识 uriSpec（可选） */
		const queryUriSpec = ref("");
		/** 加载中 */
		const loading = ref(false);
		/** 下拉选项（首项为空 = 全部） */
		const protocolSelectOptions = () => [{
			label: "全部",
			value: ""
		}, ...protocolOptions.value.map((p) => ({
			label: p,
			value: p
		}))];
		/**
		* 加载状态 + 协议列表
		*/
		async function loadStatus() {
			loading.value = true;
			try {
				[status.value, protocolOptions.value] = await Promise.all([getDiscoveryStatus(), listDiscoveryProtocols().catch(() => [])]);
			} catch (e) {
				ElMessage.error(`加载失败：${e?.message ?? e}`);
			} finally {
				loading.value = false;
			}
		}
		/**
		* 查询服务实例列表
		*/
		async function loadServices() {
			loading.value = true;
			message.value = "";
			try {
				const result = await queryDiscoveryInstances(queryProtocol.value || void 0, queryUriSpec.value || void 0);
				instances.value = result?.instances ?? [];
				message.value = result?.message && result.message !== "ok" ? result.message : "";
			} catch (e) {
				instances.value = [];
				message.value = `查询失败：${e?.message ?? e}`;
			} finally {
				loading.value = false;
			}
		}
		/**
		* 刷新状态
		*/
		function refresh() {
			loadStatus();
			loadServices();
		}
		onMounted(refresh);
		return (_ctx, _cache) => {
			const _component_ReButton = resolveComponent("ReButton");
			const _component_ReSectionHead = resolveComponent("ReSectionHead");
			const _component_ReCard = resolveComponent("ReCard");
			const _component_ReSelect = resolveComponent("ReSelect");
			const _component_ReInput = resolveComponent("ReInput");
			const _component_ReEmpty = resolveComponent("ReEmpty");
			const _component_ReTable = resolveComponent("ReTable");
			return openBlock(), createElementBlock("div", _hoisted_1, [
				createVNode(_component_ReSectionHead, { description: "服务发现能力由可选模块提供，未启用时降级返回空数据" }, {
					title: withCtx(() => [..._cache[2] || (_cache[2] = [createTextVNode("发现服务", -1)])]),
					actions: withCtx(() => [createVNode(_component_ReButton, {
						icon: "RefreshRight",
						"show-text": true,
						loading: loading.value,
						onClick: refresh
					}, {
						default: withCtx(() => [..._cache[3] || (_cache[3] = [createTextVNode(" 刷新 ", -1)])]),
						_: 1
					}, 8, ["loading"])]),
					_: 1
				}),
				createVNode(_component_ReCard, {
					radius: 12,
					shadow: "never"
				}, {
					header: withCtx(() => [..._cache[4] || (_cache[4] = [createBaseVNode("span", { class: "card-h" }, "服务发现状态", -1)])]),
					default: withCtx(() => [createBaseVNode("div", _hoisted_2, [
						createBaseVNode("span", { class: normalizeClass(["status-badge", status.value?.enabled ? "status-on" : "status-off"]) }, toDisplayString(status.value?.enabled ? "已启用" : "未启用"), 3),
						status.value?.enabled && status.value.availableProtocols?.length ? (openBlock(), createElementBlock("span", _hoisted_3, " 支持协议：" + toDisplayString(status.value.availableProtocols.join("、")), 1)) : status.value ? (openBlock(), createElementBlock("span", _hoisted_4, "暂无启用的发现协议配置")) : createCommentVNode("", true),
						status.value ? (openBlock(), createElementBlock("span", _hoisted_5, "运行中发现插件：" + toDisplayString(status.value.runningDiscoveryFilters) + " 个", 1)) : (openBlock(), createElementBlock("span", _hoisted_6, "加载中…"))
					]), !status.value?.enabled ? (openBlock(), createElementBlock("div", _hoisted_7, " 服务发现未启用：请在 plugin.discovery 配置中开启并声明协议，然后刷新查看。 ")) : createCommentVNode("", true)]),
					_: 1
				}),
				createVNode(_component_ReCard, {
					radius: 12,
					shadow: "never"
				}, {
					header: withCtx(() => [..._cache[5] || (_cache[5] = [createBaseVNode("span", { class: "card-h" }, "服务实例列表", -1)])]),
					default: withCtx(() => [createBaseVNode("div", _hoisted_8, [
						createVNode(_component_ReSelect, {
							modelValue: queryProtocol.value,
							"onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => queryProtocol.value = $event),
							options: protocolSelectOptions(),
							placeholder: "协议（全部）",
							clearable: "",
							style: { "width": "180px" }
						}, null, 8, ["modelValue", "options"]),
						createVNode(_component_ReInput, {
							modelValue: queryUriSpec.value,
							"onUpdate:modelValue": _cache[1] || (_cache[1] = ($event) => queryUriSpec.value = $event),
							placeholder: "服务标识 uriSpec（可选）",
							clearable: "",
							style: { "width": "240px" }
						}, null, 8, ["modelValue"]),
						createVNode(_component_ReButton, {
							icon: "Search",
							type: "primary",
							loading: loading.value,
							onClick: loadServices
						}, {
							default: withCtx(() => [..._cache[6] || (_cache[6] = [createTextVNode("查询", -1)])]),
							_: 1
						}, 8, ["loading"]),
						createBaseVNode("span", _hoisted_9, "共 " + toDisplayString(instances.value.length) + " 条", 1)
					]), message.value ? (openBlock(), createBlock(_component_ReEmpty, {
						key: 0,
						description: message.value,
						"image-size": 70,
						style: { "padding": "16px 0" }
					}, null, 8, ["description"])) : !instances.value.length ? (openBlock(), createBlock(_component_ReEmpty, {
						key: 1,
						description: "暂无服务实例",
						"image-size": 70,
						style: { "padding": "16px 0" }
					})) : (openBlock(), createBlock(_component_ReTable, {
						key: 2,
						data: instances.value,
						columns: [
							{
								prop: "id",
								label: "ID",
								width: 100
							},
							{
								prop: "host",
								label: "主机",
								width: 150
							},
							{
								prop: "port",
								label: "端口",
								width: 80
							},
							{
								prop: "protocol",
								label: "协议",
								width: 100
							},
							{
								prop: "weight",
								label: "权重",
								width: 80
							},
							{
								prop: "env",
								label: "环境",
								width: 90
							},
							{
								prop: "uriSpec",
								label: "服务标识",
								minWidth: 140,
								showOverflowTooltip: true
							},
							{
								prop: "metadata",
								label: "元数据",
								minWidth: 160,
								slot: "metadata",
								showOverflowTooltip: true
							}
						],
						loading: loading.value,
						"table-id": "discovery-instances"
					}, {
						"col-metadata": withCtx(({ row }) => [createBaseVNode("span", _hoisted_10, toDisplayString(row.metadata ? JSON.stringify(row.metadata) : "—"), 1)]),
						_: 1
					}, 8, ["data", "loading"]))]),
					_: 1
				})
			]);
		};
	}
}), [["__scopeId", "data-v-05780fa0"]]);
//#endregion
export { DiscoveryView_default as default };
