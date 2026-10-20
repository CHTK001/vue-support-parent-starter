import { $n as normalizeClass, D as createVNode, E as createTextVNode, On as unref, _ as createBaseVNode, b as createElementBlock, ct as onMounted, g as computed, k as defineComponent, mt as openBlock, qt as withCtx, rr as toDisplayString, v as createBlock, vn as ref, y as createCommentVNode } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { C as withKeys, w as withModifiers } from "./runtime-dom.esm-bundler-RRl39S3n.js";
import { t as ReTable_default } from "./ReTable-BO1ac7-i.js";
import { yt as message } from "./src-CEonioA3.js";
import { w as unwrapResult, x as http } from "./src-DDwlSqPX.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { t as ReButton_default } from "./ReButton-owxlNwDO.js";
import { t as ReAlert } from "./ReKit-CFSh6vls.js";
import { t as ReEmpty_default } from "./ReEmpty-DzxmsI1k.js";
import { t as component } from "./ReIcon-By12b2Y9.js";
import { t as ReInput_default } from "./ReInput-CGHpe202.js";
import "./surface-Bdspw2jE.js";
import { n as MiddlewareGap_default, t as useMiddlewareSource } from "./middlewareSource-BjMz9rOx.js";
//#region ../../pages/datasource/src/api/kafkaManageApi.ts
/**
* Kafka 控制台 API（@pages/datasource）
*
* <p>Kafka 是可选中间件能力包，前端不直接调用旧版 Kafka 专属接口，而是走宿主的
* 通用中间件 SPI 面：{@code /ms/monitor/middleware/**}。这样 Kafka 模块未安装时，
* 后端会按契约返回「功能未开放」业务结果，前端原样展示而不是猜一个 500 页面。</p>
*
* @author CH
* @since 4.0.0.46
*/
var unwrap = (res) => unwrapResult(res);
var MIDDLEWARE_BASE = "/ms/monitor/middleware";
/** 查询 Kafka 中间件能力声明（不需要真实 Broker 连接） */
var fetchKafkaCapability = () => http().get(`${MIDDLEWARE_BASE}/capability`).query({ type: "kafka" }).noToast(true).then((r) => unwrap(r));
/** 测试 Kafka 连接 */
var testKafkaConnection = (datasourceId) => http().post(`${MIDDLEWARE_BASE}/test`).query({ type: "kafka" }).data({ datasourceId }).noToast(true).then((r) => unwrap(r));
/** 列出 Kafka 顶层节点（Topic） */
var fetchKafkaTopNodes = (datasourceId) => http().get(`${MIDDLEWARE_BASE}/nodes`).query({
	type: "kafka",
	datasourceId
}).noToast(true).then((r) => unwrap(r));
/** 列出 Topic 下的子节点（Partition） */
var fetchKafkaChildren = (parentKey, datasourceId) => http().get(`${MIDDLEWARE_BASE}/children`).query({
	type: "kafka",
	parentKey,
	datasourceId
}).noToast(true).then((r) => unwrap(r));
/** 执行 Kafka 只读查询（topics / brokers / groups / describe <topic> / preview <topic>） */
var queryKafka = (expression, datasourceId, limit = 100) => http().post(`${MIDDLEWARE_BASE}/query`).query({
	type: "kafka",
	expression,
	limit
}).noToast(true).then((r) => unwrap(r));
//#endregion
//#region ../../pages/datasource/src/views/console/KafkaManageView.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1 = { class: "dsm tel-page" };
var _hoisted_2 = { class: "dsm-toolbar re-surface" };
var _hoisted_3 = { class: "dsm-toolbar-left" };
var _hoisted_4 = { class: "dsm-toolbar-right" };
var _hoisted_5 = {
	key: 0,
	class: "dsm-body"
};
var _hoisted_6 = { class: "dsm-content" };
var _hoisted_7 = { class: "dsm-info-card re-surface" };
var _hoisted_8 = { class: "dsm-info-row" };
var _hoisted_9 = { class: "dsm-info-value" };
var _hoisted_10 = { class: "dsm-info-row" };
var _hoisted_11 = { class: "dsm-info-value mono" };
var _hoisted_12 = { class: "dsm-info-row" };
var _hoisted_13 = { class: "dsm-info-value" };
var _hoisted_14 = { class: "dsm-info-row" };
var _hoisted_15 = { class: "dsm-info-value mono" };
var _hoisted_16 = { class: "dsm-info-row" };
var _hoisted_17 = { class: "dsm-info-value" };
var _hoisted_18 = { class: "dsm-tabs" };
var _hoisted_19 = {
	key: 0,
	class: "dsm-section"
};
var _hoisted_20 = { class: "dsm-section-title" };
var _hoisted_21 = { class: "dsm-section-actions" };
var _hoisted_22 = { class: "mono" };
var _hoisted_23 = {
	key: 1,
	class: "dsm-section"
};
var _hoisted_24 = { class: "dsm-section-title" };
var _hoisted_25 = { class: "dsm-section-actions" };
var _hoisted_26 = {
	key: 2,
	class: "dsm-query-area"
};
var _hoisted_27 = { class: "dsm-query-toolbar" };
var _hoisted_28 = { class: "dsm-query-result" };
var _hoisted_29 = { class: "dsm-query-header" };
var _hoisted_30 = {
	key: 0,
	class: "dsm-query-meta"
};
var _hoisted_31 = {
	key: 0,
	class: "dsm-query-warn"
};
//#endregion
//#region ../../pages/datasource/src/views/console/KafkaManageView.vue
var KafkaManageView_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	name: "KafkaManageView",
	__name: "KafkaManageView",
	setup(__props) {
		/**
		* Kafka 管理页
		*
		* <p>只消费宿主通用中间件 SPI 契约（/ms/monitor/middleware/**），不在前端写死
		* 旧版 Kafka 专属接口。Kafka 能力包未安装时后端返回「功能未开放」，页面展示原因；
		* 已安装但当前环境没有真实 Broker 时，能力声明与优雅失败仍可验收。</p>
		*
		* @author CH
		* @since 4.0.0.46
		*/
		const { datasourceId, source, gap, bind, ready } = useMiddlewareSource();
		const capability = ref(null);
		const capabilityLoading = ref(false);
		const topics = ref([]);
		const children = ref([]);
		const activeTopic = ref("");
		const loading = ref(false);
		const testing = ref(false);
		const queryLoading = ref(false);
		const activeTab = ref("topics");
		const queryExpression = ref("topics");
		const queryResult = ref(null);
		const testResult = ref({
			version: "",
			detail: ""
		});
		const topNodeLabel = computed(() => capability.value?.topNodeLabel || "主题");
		const childNodeLabel = computed(() => capability.value?.childNodeLabel || "分区");
		const queryPlaceholder = computed(() => capability.value?.queryHint || "输入查询：topics / brokers / groups / describe <topic> / preview <topic>");
		const capabilityText = computed(() => {
			const c = capability.value;
			if (!c) return "未加载";
			const parts = [];
			if (c.topNodeSupported) parts.push("主题浏览");
			if (c.childNodeSupported) parts.push("分区浏览");
			if (c.querySupported) parts.push("只读查询");
			if (c.documentSupported) parts.push("消息详情");
			return parts.join(" / ");
		});
		const topicColumns = [
			{
				prop: "label",
				label: "主题",
				minWidth: 220,
				slot: "col-label"
			},
			{
				prop: "comment",
				label: "说明",
				minWidth: 120
			},
			{
				prop: "estimatedCount",
				label: "条目数",
				width: 100
			},
			{
				prop: "actions",
				label: "操作",
				width: 110,
				fixed: "right",
				slot: "col-actions"
			}
		];
		const childColumns = [
			{
				prop: "label",
				label: "分区",
				minWidth: 180
			},
			{
				prop: "key",
				label: "节点标识",
				minWidth: 220
			},
			{
				prop: "comment",
				label: "说明",
				minWidth: 180
			}
		];
		const queryColumns = computed(() => (queryResult.value?.columns || []).map((c) => ({
			prop: c,
			label: c,
			minWidth: 140
		})));
		const queryEmptyText = computed(() => queryResult.value?.message ? `查询未返回数据：${queryResult.value.message}` : "执行查询后显示结果");
		function showError(error, api) {
			const msg = String(error?.message ?? error ?? "");
			if (/功能未开放/.test(msg)) {
				gap.value = msg;
				return;
			}
			if (/status code 404|No static resource|no handler|资源不存在/i.test(msg)) {
				gap.value = `后端未提供 ${api}（HTTP 404），本页无真实数据可显示`;
				return;
			}
			gap.value = `调用 ${api} 失败：${msg || "未知错误"}`;
		}
		async function loadCapability() {
			capabilityLoading.value = true;
			try {
				capability.value = await fetchKafkaCapability();
				if (source.value && !gap.value) ready();
			} catch (e) {
				showError(e, "/ms/monitor/middleware/capability");
			} finally {
				capabilityLoading.value = false;
			}
		}
		async function loadTopics() {
			if (!datasourceId.value) return;
			loading.value = true;
			try {
				topics.value = await fetchKafkaTopNodes(datasourceId.value) || [];
				if (source.value && !gap.value) ready();
			} catch (e) {
				showError(e, "/ms/monitor/middleware/nodes");
			} finally {
				loading.value = false;
			}
		}
		async function loadChildren(topic) {
			if (!datasourceId.value) return;
			loading.value = true;
			try {
				children.value = await fetchKafkaChildren(topic, datasourceId.value) || [];
			} catch (e) {
				showError(e, "/ms/monitor/middleware/children");
			} finally {
				loading.value = false;
			}
		}
		function selectTopic(row) {
			activeTopic.value = row.key;
			loadChildren(row.key);
		}
		async function testConnection() {
			if (!datasourceId.value) return;
			testing.value = true;
			try {
				const res = await testKafkaConnection(datasourceId.value);
				testResult.value = {
					version: res.version,
					detail: res.detail
				};
				if (res.connected) message.success(`Kafka 连接正常${res.detail ? `：${res.detail}` : ""}`);
				else message.error(`Kafka 连接失败：${res.message}`);
			} catch (e) {
				showError(e, "/ms/monitor/middleware/test");
			} finally {
				testing.value = false;
			}
		}
		async function executeQuery() {
			const expression = queryExpression.value.trim();
			if (!expression) {
				message.warning("请输入查询表达式");
				return;
			}
			if (!datasourceId.value) return;
			queryLoading.value = true;
			try {
				const res = await queryKafka(expression, datasourceId.value);
				queryResult.value = res;
				if (res.message) message.error(res.message);
				else if (source.value && !gap.value) ready();
			} catch (e) {
				showError(e, "/ms/monitor/middleware/query");
			} finally {
				queryLoading.value = false;
			}
		}
		async function refresh() {
			await loadCapability();
			await loadTopics();
			if (activeTopic.value) await loadChildren(activeTopic.value);
		}
		onMounted(async () => {
			await bind("kafka");
			await loadCapability();
			if (datasourceId.value) await loadTopics();
		});
		return (_ctx, _cache) => {
			return openBlock(), createElementBlock("div", _hoisted_1, [
				createBaseVNode("div", _hoisted_2, [createBaseVNode("div", _hoisted_3, [createVNode(unref(component), {
					name: "Coin",
					size: 18,
					class: "dsm-title-icon dsm-kafka-icon"
				}), _cache[5] || (_cache[5] = createBaseVNode("span", { class: "dsm-title" }, "Kafka 消息队列管理", -1))]), createBaseVNode("div", _hoisted_4, [
					createVNode(unref(ReButton_default), {
						layout: "square",
						tip: "能力声明",
						icon: "Setting",
						"data-testid": "kafka-btn-capability",
						loading: capabilityLoading.value,
						onClick: loadCapability
					}, null, 8, ["loading"]),
					createVNode(unref(ReButton_default), {
						layout: "square",
						tip: "测试连接",
						icon: "Connection",
						"data-testid": "kafka-btn-test",
						disabled: !unref(source),
						loading: testing.value,
						onClick: testConnection
					}, null, 8, ["disabled", "loading"]),
					createVNode(unref(ReButton_default), {
						layout: "square",
						tip: "刷新",
						icon: "Refresh",
						"data-testid": "kafka-btn-refresh",
						loading: loading.value,
						onClick: refresh
					}, null, 8, ["loading"]),
					createVNode(unref(ReButton_default), {
						layout: "square",
						type: "primary",
						tip: "只读查询",
						icon: "Search",
						"data-testid": "kafka-btn-query",
						disabled: !unref(source),
						onClick: _cache[0] || (_cache[0] = ($event) => activeTab.value = "query")
					}, null, 8, ["disabled"])
				])]),
				createVNode(MiddlewareGap_default, {
					text: unref(gap),
					onRetry: refresh
				}, null, 8, ["text"]),
				!unref(gap) ? (openBlock(), createElementBlock("div", _hoisted_5, [createBaseVNode("div", _hoisted_6, [
					createBaseVNode("div", _hoisted_7, [
						createBaseVNode("div", _hoisted_8, [_cache[6] || (_cache[6] = createBaseVNode("span", { class: "dsm-info-label" }, "数据源", -1)), createBaseVNode("span", _hoisted_9, toDisplayString(unref(source) ? unref(source).name : "未选择"), 1)]),
						createBaseVNode("div", _hoisted_10, [_cache[7] || (_cache[7] = createBaseVNode("span", { class: "dsm-info-label" }, "连接地址", -1)), createBaseVNode("span", _hoisted_11, toDisplayString(unref(source) ? `${unref(source).host}:${unref(source).port || 9092}` : "—"), 1)]),
						createBaseVNode("div", _hoisted_12, [_cache[8] || (_cache[8] = createBaseVNode("span", { class: "dsm-info-label" }, "能力", -1)), createBaseVNode("span", _hoisted_13, toDisplayString(capabilityText.value), 1)]),
						createBaseVNode("div", _hoisted_14, [_cache[9] || (_cache[9] = createBaseVNode("span", { class: "dsm-info-label" }, "集群 ID", -1)), createBaseVNode("span", _hoisted_15, toDisplayString(testResult.value.version || "未测试"), 1)]),
						createBaseVNode("div", _hoisted_16, [_cache[10] || (_cache[10] = createBaseVNode("span", { class: "dsm-info-label" }, "连接详情", -1)), createBaseVNode("span", _hoisted_17, toDisplayString(testResult.value.detail || "未测试"), 1)])
					]),
					createBaseVNode("div", _hoisted_18, [createBaseVNode("button", {
						type: "button",
						class: normalizeClass(["dsm-tab", { active: activeTab.value === "topics" }]),
						"data-testid": "kafka-tab-topics",
						onClick: _cache[1] || (_cache[1] = ($event) => activeTab.value = "topics")
					}, [createVNode(unref(component), {
						name: "Collection",
						size: "12"
					}), _cache[11] || (_cache[11] = createBaseVNode("span", null, "主题列表", -1))], 2), createBaseVNode("button", {
						type: "button",
						class: normalizeClass(["dsm-tab", { active: activeTab.value === "query" }]),
						"data-testid": "kafka-tab-query",
						onClick: _cache[2] || (_cache[2] = ($event) => activeTab.value = "query")
					}, [createVNode(unref(component), {
						name: "Search",
						size: "12"
					}), _cache[12] || (_cache[12] = createBaseVNode("span", null, "只读查询", -1))], 2)]),
					activeTab.value === "topics" ? (openBlock(), createElementBlock("div", _hoisted_19, [
						createBaseVNode("div", _hoisted_20, [createTextVNode(toDisplayString(topNodeLabel.value) + "（" + toDisplayString(topics.value.length) + "） ", 1), createBaseVNode("div", _hoisted_21, [createVNode(unref(ReButton_default), {
							text: "",
							onClick: loadTopics
						}, {
							icon: withCtx(() => [createVNode(unref(component), {
								name: "Refresh",
								size: "12"
							})]),
							default: withCtx(() => [_cache[13] || (_cache[13] = createTextVNode("刷新 ", -1))]),
							_: 1
						})])]),
						createVNode(unref(ReTable_default), {
							data: topics.value,
							columns: topicColumns,
							loading: loading.value,
							pagination: false,
							stripe: "",
							border: "",
							height: "320px",
							onRowClick: selectTopic
						}, {
							"col-label": withCtx(({ row }) => [createBaseVNode("span", _hoisted_22, toDisplayString(row.label), 1)]),
							"col-actions": withCtx(({ row }) => [createVNode(unref(ReButton_default), {
								text: "",
								type: "primary",
								onClick: withModifiers(($event) => selectTopic(row), ["stop"])
							}, {
								icon: withCtx(() => [createVNode(unref(component), {
									name: "FolderOpened",
									size: "12"
								})]),
								default: withCtx(() => [_cache[14] || (_cache[14] = createTextVNode("分区 ", -1))]),
								_: 1
							}, 8, ["onClick"])]),
							_: 1
						}, 8, ["data", "loading"]),
						!loading.value && topics.value.length === 0 ? (openBlock(), createBlock(unref(ReEmpty_default), {
							key: 0,
							description: "未读取到 Topic，可先执行只读查询 topics"
						})) : createCommentVNode("", true)
					])) : createCommentVNode("", true),
					activeTab.value === "topics" && activeTopic.value ? (openBlock(), createElementBlock("div", _hoisted_23, [createBaseVNode("div", _hoisted_24, [createTextVNode(toDisplayString(childNodeLabel.value) + " - " + toDisplayString(activeTopic.value) + " ", 1), createBaseVNode("div", _hoisted_25, [createVNode(unref(ReButton_default), {
						text: "",
						onClick: _cache[3] || (_cache[3] = ($event) => loadChildren(activeTopic.value))
					}, {
						icon: withCtx(() => [createVNode(unref(component), {
							name: "Refresh",
							size: "12"
						})]),
						default: withCtx(() => [_cache[15] || (_cache[15] = createTextVNode("刷新 ", -1))]),
						_: 1
					})])]), createVNode(unref(ReTable_default), {
						data: children.value,
						columns: childColumns,
						loading: loading.value,
						pagination: false,
						stripe: "",
						border: "",
						height: "240px"
					}, null, 8, ["data", "loading"])])) : createCommentVNode("", true),
					activeTab.value === "query" ? (openBlock(), createElementBlock("div", _hoisted_26, [
						createBaseVNode("div", _hoisted_27, [createVNode(unref(ReInput_default), {
							modelValue: queryExpression.value,
							"onUpdate:modelValue": _cache[4] || (_cache[4] = ($event) => queryExpression.value = $event),
							placeholder: queryPlaceholder.value,
							class: "dsm-query-input",
							"data-testid": "kafka-query-expression",
							onKeyup: withKeys(executeQuery, ["enter"])
						}, null, 8, ["modelValue", "placeholder"]), createVNode(unref(ReButton_default), {
							type: "primary",
							loading: queryLoading.value,
							"data-testid": "kafka-btn-execute",
							onClick: executeQuery
						}, {
							icon: withCtx(() => [createVNode(unref(component), {
								name: "VideoPlay",
								size: "12"
							})]),
							default: withCtx(() => [_cache[16] || (_cache[16] = createTextVNode("执行 ", -1))]),
							_: 1
						}, 8, ["loading"])]),
						capability.value?.queryDescription ? (openBlock(), createBlock(unref(ReAlert), {
							key: 0,
							type: "info",
							closable: false,
							title: capability.value.queryDescription,
							class: "dsm-query-hint"
						}, null, 8, ["title"])) : createCommentVNode("", true),
						createBaseVNode("div", _hoisted_28, [createBaseVNode("div", _hoisted_29, [_cache[17] || (_cache[17] = createTextVNode(" 查询结果 ", -1)), queryResult.value ? (openBlock(), createElementBlock("span", _hoisted_30, [createTextVNode(toDisplayString(queryResult.value.rowCount) + " 行 · " + toDisplayString(queryResult.value.executionTimeMs) + " ms ", 1), queryResult.value.truncated ? (openBlock(), createElementBlock("span", _hoisted_31, " 已截断，服务端共 " + toDisplayString(queryResult.value.totalRows) + " 行，请加 limit 或收窄条件 ", 1)) : createCommentVNode("", true)])) : createCommentVNode("", true)]), queryResult.value && queryResult.value.columns.length > 0 ? (openBlock(), createBlock(unref(ReTable_default), {
							key: 0,
							data: queryResult.value.rows,
							columns: queryColumns.value,
							stripe: "",
							border: "",
							"layout-table": { height: "360px" }
						}, null, 8, ["data", "columns"])) : (openBlock(), createBlock(unref(ReEmpty_default), {
							key: 1,
							description: queryEmptyText.value
						}, null, 8, ["description"]))])
					])) : createCommentVNode("", true)
				])])) : createCommentVNode("", true)
			]);
		};
	}
}), [["__scopeId", "data-v-c3e3de5f"]]);
//#endregion
export { KafkaManageView_default as default };
