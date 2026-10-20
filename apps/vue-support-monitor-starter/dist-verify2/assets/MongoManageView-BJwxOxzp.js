import { $n as normalizeClass, D as createVNode, E as createTextVNode, On as unref, _ as createBaseVNode, b as createElementBlock, bt as renderList, ct as onMounted, g as computed, it as onBeforeUnmount, k as defineComponent, mt as openBlock, nr as normalizeStyle, o as Fragment, qt as withCtx, rr as toDisplayString, v as createBlock, vn as ref, y as createCommentVNode } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { C as withKeys, w as withModifiers } from "./runtime-dom.esm-bundler-RRl39S3n.js";
import { t as ReTable_default } from "./ReTable-BO1ac7-i.js";
import { yt as message } from "./src-CEonioA3.js";
import { w as unwrapResult, x as http } from "./src-DDwlSqPX.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { t as ReSelect_default } from "./ReSelect-C2rq-Voy.js";
import { t as ReButton_default } from "./ReButton-owxlNwDO.js";
import { t as component } from "./ReDialog-DZGeR3lw.js";
import { t as ReEmpty_default } from "./ReEmpty-DzxmsI1k.js";
import { t as component$1 } from "./ReIcon-By12b2Y9.js";
import { t as ReInput_default } from "./ReInput-CGHpe202.js";
import { t as component$2 } from "./ReTag-D5UpQULZ.js";
import "./surface-Bdspw2jE.js";
import { t as DbSqlEditor_default } from "./DbSqlEditor-Byd806o1.js";
import { n as MiddlewareGap_default, t as useMiddlewareSource } from "./middlewareSource-BjMz9rOx.js";
//#region ../../pages/datasource/src/api/mongoManageApi.ts
var unwrap = (res) => unwrapResult(res);
/**
* 测试 MongoDB 连通性
*
* <p>传 {@code datasourceId} 走库中配置；未登记时可临时给 host/port/username/password
* 做即席探测（此时 {@code contextPath} 借道承载默认逻辑库名）。</p>
*
* @param payload 测试参数，见 {@link MongoTestPayload}
* @returns 测试结果
* @author CH
* @since 4.0.0.43
*/
var testMongoConnection = (payload = {}) => http().post("/ms/monitor/mongodb/test").data(payload).then((r) => unwrap(r));
/**
* 查询逻辑库列表
*
* @param datasourceId 数据源 ID（可选，缺省时服务端取第一个 mongodb 数据源）
* @returns 逻辑库列表
* @author CH
* @since 4.0.0.43
*/
var fetchMongoDatabases = (datasourceId) => http().get("/ms/monitor/mongodb/databases").query({ datasourceId }).then((r) => unwrap(r));
/**
* 查询集合列表
*
* @param datasourceId 数据源 ID（可选）
* @param database 逻辑库名，为空时服务端报「逻辑库名不能为空」
* @returns 集合列表
* @author CH
* @since 4.0.0.43
*/
var fetchMongoCollections = (datasourceId, database) => http().get("/ms/monitor/mongodb/collections").query({
	datasourceId,
	database
}).then((r) => unwrap(r));
/**
* 执行只读 shell 查询
*
* <p>仅支持 find/findOne/count/countDocuments/aggregate（可链 .limit/.skip/.sort），
* 写方法与 $out/$merge 阶段由服务端拒绝。</p>
*
* @param payload 查询入参，见 {@link MongoQueryPayload}
* @returns 查询结果
* @author CH
* @since 4.0.0.43
*/
var executeMongoQuery = (payload) => http().post("/ms/monitor/mongodb/query").data(payload).then((r) => unwrap(r));
/**
* 按 ID 查看单个文档
*
* @param payload 查看入参，见 {@link MongoDocumentPayload}
* @returns 文档内容（字段映射）
* @author CH
* @since 4.0.0.43
*/
var fetchMongoDocument = (payload) => http().post("/ms/monitor/mongodb/document").data(payload).then((r) => unwrap(r));
//#endregion
//#region ../../pages/datasource/src/views/console/MongoManageView.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1 = { class: "dsm-toolbar re-surface" };
var _hoisted_2 = { class: "dsm-toolbar-left" };
var _hoisted_3 = { class: "dsm-toolbar-right" };
var _hoisted_4 = {
	class: "dsm-db-select",
	"data-testid": "dsm-db-select"
};
var _hoisted_5 = { class: "dsm-body" };
var _hoisted_6 = { class: "dsm-search-section" };
var _hoisted_7 = { class: "dsm-view-bar" };
var _hoisted_8 = { class: "dsm-view-count" };
var _hoisted_9 = { class: "dsm-key-list" };
var _hoisted_10 = ["title", "onClick"];
var _hoisted_11 = { class: "dsm-tree-label" };
var _hoisted_12 = { class: "dsm-tree-count" };
var _hoisted_13 = {
	key: 0,
	class: "dsm-tree-node"
};
var _hoisted_14 = { class: "dsm-tree-label" };
var _hoisted_15 = { class: "dsm-content" };
var _hoisted_16 = { class: "dsm-info-card re-surface" };
var _hoisted_17 = { class: "dsm-info-row" };
var _hoisted_18 = { class: "dsm-info-value" };
var _hoisted_19 = { class: "dsm-info-row" };
var _hoisted_20 = { class: "dsm-info-value mono" };
var _hoisted_21 = { class: "dsm-info-row" };
var _hoisted_22 = {
	class: "dsm-info-value mono",
	"data-testid": "dsm-active-database"
};
var _hoisted_23 = { class: "dsm-info-row" };
var _hoisted_24 = { class: "dsm-info-value mono" };
var _hoisted_25 = { class: "dsm-info-row" };
var _hoisted_26 = { class: "dsm-info-row" };
var _hoisted_27 = { class: "dsm-info-value mono" };
var _hoisted_28 = { class: "dsm-query-panel" };
var _hoisted_29 = { class: "dsm-query-toolbar" };
var _hoisted_30 = {
	key: 0,
	class: "dsm-query-error",
	"data-testid": "dsm-query-error"
};
var _hoisted_31 = {
	class: "dsm-query-result",
	"data-testid": "dsm-query-result"
};
var _hoisted_32 = { class: "dsm-query-header" };
var _hoisted_33 = {
	key: 0,
	class: "dsm-query-meta"
};
var _hoisted_34 = {
	key: 0,
	class: "dsm-query-warn"
};
var _hoisted_35 = {
	key: 0,
	class: "dsm-doc-json",
	"data-testid": "dsm-doc-json"
};
var _hoisted_36 = {
	key: 1,
	class: "dsm-empty-inline"
};
var LEFT_WIDTH_KEY = "mongo-left-width";
//#endregion
//#region ../../pages/datasource/src/views/console/MongoManageView.vue
var MongoManageView_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	name: "MongoManageView",
	__name: "MongoManageView",
	setup(__props) {
		/**
		* MongoDB 数据源管理页（datasourceId 版控制台）。
		*
		* <p>只读取与操作「数据源管理」里登记的 mongodb 数据源，后端走
		* {@code /ms/monitor/mongodb}（官方同步驱动，每次请求临时建连、客户端按连接串缓存）。
		* 页面定位是「最小闭环」：逻辑库/集合浏览 + Mongo Shell 只读查询 + 文档查看；
		* CRUD、索引与 runCommand 不在本版范围内。</p>
		*
		* <p>查询口径与后端白名单一致：仅 find/findOne/count/countDocuments/aggregate
		* （可链 .limit/.skip/.sort），写方法与 $out/$merge 阶段由服务端拒绝。</p>
		*
		* @author CH
		* @since 4.0.0.43
		*/
		/** ReTable 列定义 */
		const { datasourceId, source, gap, bind, fail, ready } = useMiddlewareSource();
		/** 逻辑库列表 */
		const databases = ref([]);
		/** 当前逻辑库（shell 里的 db 所指） */
		const activeDatabase = ref("");
		/** 集合列表 */
		const collections = ref([]);
		/** 集合名过滤（侧栏） */
		const collectionFilter = ref("");
		/** 当前选中集合（查询面板按它补全） */
		const activeCollection = ref("");
		/** 服务端版本（测试连接后回填） */
		const version = ref("");
		/** 库/集合读取中 */
		const loading = ref(false);
		/** 测试连接中 */
		const testing = ref(false);
		/** 侧栏宽度持久化键 */
		const leftWidth = ref(Number(localStorage.getItem(LEFT_WIDTH_KEY)) || 320);
		/** 是否正在拖拽（拖拽中禁用文本选择） */
		const resizing = ref(false);
		/** 拖拽中的 window 监听器；中途卸载时要在 onBeforeUnmount 摘掉 */
		let dragHandlers = null;
		/**
		* 开始拖拽调节左侧宽度。
		*
		* @param e 鼠标按下事件
		*/
		function startResize(e) {
			resizing.value = true;
			const startX = e.clientX;
			const startWidth = leftWidth.value;
			const onMove = (ev) => {
				leftWidth.value = Math.min(560, Math.max(260, startWidth + ev.clientX - startX));
			};
			const onUp = () => {
				resizing.value = false;
				localStorage.setItem(LEFT_WIDTH_KEY, String(leftWidth.value));
				detachDrag();
			};
			const detachDrag = () => {
				window.removeEventListener("mousemove", onMove);
				window.removeEventListener("mouseup", onUp);
				dragHandlers = null;
			};
			dragHandlers = {
				move: onMove,
				up: onUp
			};
			window.addEventListener("mousemove", onMove);
			window.addEventListener("mouseup", onUp);
		}
		/** 逻辑库下拉选项（空库带标记） */
		const dbOptions = computed(() => databases.value.map((d) => ({
			label: d.empty ? `${d.name}（空库）` : d.name,
			value: d.name
		})));
		/** 集合名补全候选（编辑器输入即提示） */
		const collectionNames = computed(() => collections.value.map((c) => c.name));
		/** 按过滤词筛集合（大小写不敏感） */
		const filteredCollections = computed(() => {
			const kw = collectionFilter.value.trim().toLowerCase();
			if (!kw) return collections.value;
			return collections.value.filter((c) => c.name.toLowerCase().includes(kw));
		});
		/** 查询编辑器文本（Mongo Shell 表达式） */
		const queryText = ref("");
		/** 查询执行中 */
		const queryRunning = ref(false);
		/** 最近一次查询错误（服务端拒绝/网络错误） */
		const queryError = ref("");
		/** 最近一次查询结果（列由行键并集推导） */
		const queryResult = ref({
			columns: [],
			rows: [],
			rowCount: 0,
			totalRows: 0,
			truncated: false,
			executionTimeMs: 0
		});
		/** 文档查看弹窗状态 */
		const docVisible = ref(false);
		/** 文档 JSON 文本 */
		const docText = ref("");
		/**
		* 把返回行里的对象/数组值转成 JSON 文本，便于表格展示
		* @param rows 原始行
		* @returns 展示行
		*/
		function stringifyRows(rows) {
			return (rows || []).map((row) => {
				const out = {};
				for (const [key, value] of Object.entries(row)) out[key] = value !== null && typeof value === "object" ? JSON.stringify(value) : value;
				return out;
			});
		}
		/**
		* 由返回行的键推导表格列。
		*
		* <p>与 Neo4j 控制台取首行键不同，这里取<b>全部行的键并集</b>：MongoDB 同一集合
		* 的文档结构可以不同（动态 schema），只按首行推导会让后续行的字段在表里消失。</p>
		*
		* @param rows 行数据
		* @returns 列定义
		*/
		function toColumns(rows) {
			const keys = [];
			for (const row of rows || []) for (const key of Object.keys(row)) if (!keys.includes(key)) keys.push(key);
			return keys.map((key) => ({
				prop: key,
				label: key,
				minWidth: 140
			}));
		}
		/**
		* 执行查询面板里的只读 shell 表达式。
		*/
		async function executeQuery() {
			const expression = queryText.value.trim();
			if (!expression) {
				message.warning("请输入查询语句");
				return;
			}
			queryRunning.value = true;
			queryError.value = "";
			try {
				const result = await executeMongoQuery({
					datasourceId: datasourceId.value,
					database: activeDatabase.value || void 0,
					expression
				});
				const rows = stringifyRows(result?.rows || []);
				queryResult.value = {
					columns: toColumns(rows),
					rows,
					rowCount: result?.rowCount ?? rows.length,
					totalRows: result?.totalRows ?? rows.length,
					truncated: !!result?.truncated,
					executionTimeMs: result?.executionTimeMs ?? 0
				};
				ready();
			} catch (e) {
				queryResult.value = {
					columns: [],
					rows: [],
					rowCount: 0,
					totalRows: 0,
					truncated: false,
					executionTimeMs: 0
				};
				queryError.value = String(e?.message ?? e);
			} finally {
				queryRunning.value = false;
			}
		}
		/** 清空查询编辑器与结果 */
		function clearQuery() {
			queryText.value = "";
			queryError.value = "";
			queryResult.value = {
				columns: [],
				rows: [],
				rowCount: 0,
				totalRows: 0,
				truncated: false,
				executionTimeMs: 0
			};
		}
		/**
		* 点击结果行查看完整文档（按 _id 拉取）。
		*
		* @param row 结果行
		*/
		async function onRowClick(row) {
			const id = String(row._id ?? "");
			if (!id || id === "undefined") {
				message.warning("该行没有 _id，无法查看完整文档");
				return;
			}
			docText.value = "";
			docVisible.value = true;
			try {
				const doc = await fetchMongoDocument({
					datasourceId: datasourceId.value,
					database: activeDatabase.value || void 0,
					collection: activeCollection.value,
					id
				});
				docText.value = JSON.stringify(doc ?? {}, null, 2);
				ready();
			} catch (e) {
				docVisible.value = false;
				fail(e, "/ms/monitor/mongodb/document");
			}
		}
		/** 系统库（默认不进业务视角） */
		const SYSTEM_DATABASES = /* @__PURE__ */ new Set([
			"admin",
			"config",
			"local"
		]);
		/**
		* 读取逻辑库列表并挑选默认库。
		*
		* <p>默认库优先取数据源行配置的库（{@code source.database}），否则取第一个非系统库，
		* 全部都是系统库时用第一个。挑选结果会带上当前库的集合。</p>
		*/
		async function loadDatabases() {
			if (!datasourceId.value) return;
			try {
				databases.value = await fetchMongoDatabases(datasourceId.value) || [];
			} catch (e) {
				databases.value = [];
				fail(e, "/ms/monitor/mongodb/databases");
				return;
			}
			ready();
			const names = databases.value.map((d) => d.name);
			if (names.length === 0) return;
			const configured = (source.value?.database || "").trim();
			const pick = configured && names.includes(configured) && !SYSTEM_DATABASES.has(configured) ? configured : names.find((n) => !SYSTEM_DATABASES.has(n)) || names[0];
			activeDatabase.value = pick;
			await loadCollections();
		}
		/**
		* 读取当前库的集合列表。
		*/
		async function loadCollections() {
			if (!datasourceId.value || !activeDatabase.value) return;
			try {
				collections.value = await fetchMongoCollections(datasourceId.value, activeDatabase.value) || [];
				ready();
			} catch (e) {
				collections.value = [];
				fail(e, "/ms/monitor/mongodb/collections");
			}
		}
		/** 逻辑库下拉切换：重置选中与结果，重读集合 */
		function onDbChange(value) {
			if (value === "" || value == null) return;
			activeDatabase.value = String(value);
			activeCollection.value = "";
			collectionFilter.value = "";
			clearQuery();
			loadCollections();
		}
		/**
		* 点击集合：填入 {@code db.<集合>.find()} 并立即执行（最小闭环：点一下就能看到文档）。
		*
		* @param name 集合名
		*/
		function selectCollection(name) {
			activeCollection.value = name;
			queryText.value = `db.${name}.find()`;
			executeQuery();
		}
		/**
		* 测试连接（走 MongoDB 管理探测：ping + buildInfo）。
		*/
		async function testConnection() {
			if (!datasourceId.value) return;
			testing.value = true;
			try {
				const result = await testMongoConnection({ datasourceId: datasourceId.value });
				if (result?.connected) {
					version.value = result.version || "";
					message.success(result.version ? `连接成功 · MongoDB ${result.version}` : "连接成功");
					ready();
				} else message.error(result?.message || "连接失败");
			} catch (e) {
				fail(e, "/ms/monitor/mongodb/test");
			} finally {
				testing.value = false;
			}
		}
		/**
		* 全量刷新：重新绑定数据源并重读库与集合。
		*/
		async function refresh() {
			loading.value = true;
			try {
				await bind("mongodb");
				if (!source.value) return;
				await loadDatabases();
			} finally {
				loading.value = false;
			}
		}
		onMounted(() => {
			refresh();
		});
		onBeforeUnmount(() => {
			if (dragHandlers) {
				window.removeEventListener("mousemove", dragHandlers.move);
				window.removeEventListener("mouseup", dragHandlers.up);
				dragHandlers = null;
			}
		});
		return (_ctx, _cache) => {
			return openBlock(), createElementBlock("div", { class: normalizeClass(["dsm tel-page", { resizing: resizing.value }]) }, [
				createBaseVNode("div", _hoisted_1, [createBaseVNode("div", _hoisted_2, [createVNode(unref(component$1), {
					name: "Coin",
					size: 18,
					class: "dsm-title-icon dsm-mongo-icon"
				}), _cache[5] || (_cache[5] = createBaseVNode("span", { class: "dsm-title" }, "MongoDB 文档管理", -1))]), createBaseVNode("div", _hoisted_3, [
					createBaseVNode("div", _hoisted_4, [createVNode(unref(ReSelect_default), {
						modelValue: activeDatabase.value,
						"onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => activeDatabase.value = $event),
						options: dbOptions.value,
						disabled: databases.value.length === 0,
						placeholder: databases.value.length ? "选择逻辑库" : unref(gap) ? "未读取到库" : "—",
						filterable: "",
						onChange: onDbChange
					}, null, 8, [
						"modelValue",
						"options",
						"disabled",
						"placeholder"
					])]),
					createVNode(unref(ReButton_default), {
						layout: "square",
						icon: "Connection",
						tip: "测试连接",
						"data-testid": "dsm-btn-test",
						disabled: !unref(source),
						loading: testing.value,
						onClick: testConnection
					}, null, 8, ["disabled", "loading"]),
					createVNode(unref(ReButton_default), {
						layout: "square",
						icon: "Refresh",
						tip: "刷新",
						"data-testid": "dsm-btn-refresh",
						loading: loading.value,
						onClick: refresh
					}, null, 8, ["loading"])
				])]),
				createVNode(MiddlewareGap_default, {
					text: unref(gap),
					onRetry: refresh
				}, null, 8, ["text"]),
				createBaseVNode("div", _hoisted_5, [
					createBaseVNode("div", {
						class: "dsm-sidebar",
						style: normalizeStyle({ width: leftWidth.value + "px" })
					}, [
						createBaseVNode("div", _hoisted_6, [createVNode(unref(ReInput_default), {
							modelValue: collectionFilter.value,
							"onUpdate:modelValue": _cache[1] || (_cache[1] = ($event) => collectionFilter.value = $event),
							placeholder: "集合名过滤",
							onKeyup: withKeys(loadCollections, ["enter"])
						}, null, 8, ["modelValue"]), createVNode(unref(ReButton_default), {
							type: "primary",
							loading: loading.value,
							onClick: loadCollections
						}, {
							icon: withCtx(() => [createVNode(unref(component$1), {
								name: "Search",
								size: "12"
							})]),
							default: withCtx(() => [_cache[6] || (_cache[6] = createTextVNode("查询", -1))]),
							_: 1
						}, 8, ["loading"])]),
						createBaseVNode("div", _hoisted_7, [createBaseVNode("span", _hoisted_8, toDisplayString(filteredCollections.value.length) + " 集合", 1)]),
						createBaseVNode("div", _hoisted_9, [
							createBaseVNode("div", {
								class: normalizeClass(["dsm-scan-bar", { "is-active": loading.value }]),
								"data-testid": "dsm-scan-bar"
							}, [..._cache[7] || (_cache[7] = [createBaseVNode("span", null, null, -1)])], 2),
							(openBlock(true), createElementBlock(Fragment, null, renderList(filteredCollections.value, (row) => {
								return openBlock(), createElementBlock("div", {
									key: row.name,
									class: normalizeClass(["dsm-tree-node", { active: activeCollection.value === row.name }]),
									title: row.name,
									"data-testid": "dsm-collection-node",
									onClick: ($event) => selectCollection(row.name)
								}, [
									createVNode(unref(component$1), {
										name: "Document",
										size: "13",
										class: "dsm-tree-icon"
									}),
									createBaseVNode("span", _hoisted_11, toDisplayString(row.name), 1),
									createBaseVNode("span", _hoisted_12, toDisplayString(row.estimatedCount == null ? "—" : row.estimatedCount), 1)
								], 10, _hoisted_10);
							}), 128)),
							filteredCollections.value.length === 0 ? (openBlock(), createElementBlock("div", _hoisted_13, [createBaseVNode("span", _hoisted_14, toDisplayString(unref(gap) ? "未读取到集合" : "该库暂无集合"), 1)])) : createCommentVNode("", true)
						])
					], 4),
					createBaseVNode("div", {
						class: normalizeClass(["dsm-split", { active: resizing.value }]),
						title: "拖拽调节宽度",
						onMousedown: withModifiers(startResize, ["prevent"])
					}, null, 34),
					createBaseVNode("div", _hoisted_15, [createBaseVNode("div", _hoisted_16, [
						createBaseVNode("div", _hoisted_17, [_cache[8] || (_cache[8] = createBaseVNode("span", { class: "dsm-info-label" }, "数据源", -1)), createBaseVNode("span", _hoisted_18, toDisplayString(unref(source) ? unref(source).name : "未选择"), 1)]),
						createBaseVNode("div", _hoisted_19, [_cache[9] || (_cache[9] = createBaseVNode("span", { class: "dsm-info-label" }, "连接地址", -1)), createBaseVNode("span", _hoisted_20, toDisplayString(unref(source) ? `${unref(source).host || "127.0.0.1"}:${unref(source).port || 27017}` : "—"), 1)]),
						createBaseVNode("div", _hoisted_21, [_cache[10] || (_cache[10] = createBaseVNode("span", { class: "dsm-info-label" }, "当前库", -1)), createBaseVNode("span", _hoisted_22, toDisplayString(activeDatabase.value || "—"), 1)]),
						createBaseVNode("div", _hoisted_23, [_cache[11] || (_cache[11] = createBaseVNode("span", { class: "dsm-info-label" }, "集合数", -1)), createBaseVNode("span", _hoisted_24, toDisplayString(collections.value.length), 1)]),
						createBaseVNode("div", _hoisted_25, [_cache[12] || (_cache[12] = createBaseVNode("span", { class: "dsm-info-label" }, "状态", -1)), createVNode(unref(component$2), { type: unref(gap) ? "danger" : "success" }, {
							default: withCtx(() => [createTextVNode(toDisplayString(unref(gap) ? "读取失败" : "正常"), 1)]),
							_: 1
						}, 8, ["type"])]),
						createBaseVNode("div", _hoisted_26, [_cache[13] || (_cache[13] = createBaseVNode("span", { class: "dsm-info-label" }, "服务端版本", -1)), createBaseVNode("span", _hoisted_27, toDisplayString(version.value || "未探测"), 1)])
					]), createBaseVNode("div", _hoisted_28, [
						createBaseVNode("div", _hoisted_29, [
							createVNode(unref(ReButton_default), {
								layout: "square",
								type: "primary",
								icon: "VideoPlay",
								tip: "执行（Ctrl+Enter）",
								"data-testid": "dsm-btn-exec",
								disabled: !unref(source) || !queryText.value.trim(),
								loading: queryRunning.value,
								onClick: executeQuery
							}, null, 8, ["disabled", "loading"]),
							createVNode(unref(ReButton_default), {
								layout: "square",
								icon: "Delete",
								tip: "清空编辑器",
								"data-testid": "dsm-btn-clear",
								disabled: !queryText.value,
								onClick: clearQuery
							}, null, 8, ["disabled"]),
							_cache[14] || (_cache[14] = createBaseVNode("span", { class: "dsm-spacer" }, null, -1)),
							_cache[15] || (_cache[15] = createBaseVNode("span", { class: "dsm-query-hint" }, "集合名与只读方法输入即提示；仅支持 find/findOne/count/countDocuments/aggregate", -1))
						]),
						createVNode(DbSqlEditor_default, {
							modelValue: queryText.value,
							"onUpdate:modelValue": _cache[2] || (_cache[2] = ($event) => queryText.value = $event),
							language: "mongo",
							keywords: collectionNames.value,
							"data-testid": "dsm-mongo-editor",
							onExecute: executeQuery
						}, null, 8, ["modelValue", "keywords"]),
						queryError.value ? (openBlock(), createElementBlock("div", _hoisted_30, toDisplayString(queryError.value), 1)) : createCommentVNode("", true),
						createBaseVNode("div", _hoisted_31, [createBaseVNode("div", _hoisted_32, [_cache[16] || (_cache[16] = createTextVNode(" 查询结果 ", -1)), queryResult.value.rowCount > 0 ? (openBlock(), createElementBlock("span", _hoisted_33, [createTextVNode(toDisplayString(queryResult.value.rowCount) + " 行 · " + toDisplayString(queryResult.value.executionTimeMs) + " ms ", 1), queryResult.value.truncated ? (openBlock(), createElementBlock("span", _hoisted_34, "已截断，服务端共 " + toDisplayString(queryResult.value.totalRows) + " 行，请加 .limit(n) 收窄结果", 1)) : createCommentVNode("", true)])) : createCommentVNode("", true)]), queryResult.value.columns.length > 0 ? (openBlock(), createBlock(unref(ReTable_default), {
							key: 0,
							data: queryResult.value.rows,
							columns: queryResult.value.columns,
							pagination: false,
							stripe: "",
							border: "",
							height: "280px",
							onRowClick
						}, null, 8, ["data", "columns"])) : (openBlock(), createBlock(unref(ReEmpty_default), {
							key: 1,
							description: "点击左侧集合或输入 db.<集合>.find() 执行查询；点击结果行可查看完整文档"
						}))])
					])])
				]),
				createVNode(unref(component), {
					modelValue: docVisible.value,
					"onUpdate:modelValue": _cache[4] || (_cache[4] = ($event) => docVisible.value = $event),
					title: `文档 - ${activeCollection.value}`,
					width: "720px"
				}, {
					footer: withCtx(() => [createVNode(unref(ReButton_default), { onClick: _cache[3] || (_cache[3] = ($event) => docVisible.value = false) }, {
						icon: withCtx(() => [createVNode(unref(component$1), {
							name: "Close",
							size: "12"
						})]),
						default: withCtx(() => [_cache[17] || (_cache[17] = createTextVNode("关闭", -1))]),
						_: 1
					})]),
					default: withCtx(() => [docText.value ? (openBlock(), createElementBlock("pre", _hoisted_35, toDisplayString(docText.value), 1)) : (openBlock(), createElementBlock("div", _hoisted_36, "正在读取…"))]),
					_: 1
				}, 8, ["modelValue", "title"])
			], 2);
		};
	}
}), [["__scopeId", "data-v-289997a1"]]);
//#endregion
export { MongoManageView_default as default };
