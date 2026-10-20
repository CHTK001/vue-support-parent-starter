import { $n as normalizeClass, D as createVNode, E as createTextVNode, On as unref, Yt as withDirectives, _ as createBaseVNode, b as createElementBlock, bt as renderList, ct as onMounted, g as computed, gn as reactive, k as defineComponent, mt as openBlock, nr as normalizeStyle, o as Fragment, qt as withCtx, rr as toDisplayString, v as createBlock, vn as ref, y as createCommentVNode } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { S as vShow, w as withModifiers } from "./runtime-dom.esm-bundler-RRl39S3n.js";
import { t as ReTable_default } from "./ReTable-BO1ac7-i.js";
import { yt as message } from "./src-CEonioA3.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { t as ReButton_default } from "./ReButton-owxlNwDO.js";
import { t as component } from "./ReDialog-DZGeR3lw.js";
import { G as testNeo4jConnection, M as fetchNeo4jRelationships, j as fetchNeo4jLabels, v as executeNeo4jQuery } from "./manageConsoles-BaCEHWGA.js";
import { u as ReFormItem } from "./ReKit-CFSh6vls.js";
import { M as view_default, d as copy_document_default } from "./dist-Axt1Prff.js";
import { t as ReEmpty_default } from "./ReEmpty-DzxmsI1k.js";
import { t as ReForm_default } from "./ReForm-BHwHC8j0.js";
import { t as component$1 } from "./ReIcon-By12b2Y9.js";
import { t as ReInput_default } from "./ReInput-CGHpe202.js";
import { t as component$2 } from "./ReTag-D5UpQULZ.js";
import { t as DsmContextMenu_default } from "./DsmContextMenu-BEoagIWo.js";
import { t as component$3 } from "./ReRelationGraph-TK3CtGll.js";
import "./surface-Bdspw2jE.js";
import { t as DbSqlEditor_default } from "./DbSqlEditor-Byd806o1.js";
import { n as MiddlewareGap_default, t as useMiddlewareSource } from "./middlewareSource-BjMz9rOx.js";
import { t as copyToClipboard } from "./clipboard-Cx2N7jRl.js";
//#region ../../pages/datasource/src/views/console/Neo4jManageView.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1 = { class: "dsm tel-page" };
var _hoisted_2 = { class: "dsm-toolbar re-surface" };
var _hoisted_3 = { class: "dsm-toolbar-left" };
var _hoisted_4 = { class: "dsm-toolbar-right" };
var _hoisted_5 = { class: "dsm-body" };
var _hoisted_6 = { class: "dsm-sidebar" };
var _hoisted_7 = { class: "dsm-tree" };
var _hoisted_8 = { class: "dsm-tree-label" };
var _hoisted_9 = {
	key: 0,
	class: "dsm-tree-children"
};
var _hoisted_10 = { class: "dsm-tree-count" };
var _hoisted_11 = {
	key: 0,
	class: "dsm-tree-children"
};
var _hoisted_12 = ["onClick", "onContextmenu"];
var _hoisted_13 = { class: "dsm-tree-label" };
var _hoisted_14 = { class: "dsm-tree-count" };
var _hoisted_15 = {
	key: 0,
	class: "dsm-tree-node dsm-leaf-node"
};
var _hoisted_16 = { class: "dsm-tree-label" };
var _hoisted_17 = { class: "dsm-tree-count" };
var _hoisted_18 = {
	key: 1,
	class: "dsm-tree-children"
};
var _hoisted_19 = ["onClick", "onContextmenu"];
var _hoisted_20 = { class: "dsm-tree-label" };
var _hoisted_21 = { class: "dsm-tree-count" };
var _hoisted_22 = {
	key: 0,
	class: "dsm-tree-node dsm-leaf-node"
};
var _hoisted_23 = { class: "dsm-tree-label" };
var _hoisted_24 = { class: "dsm-content" };
var _hoisted_25 = { class: "neo4j-view-tabs" };
var _hoisted_26 = ["onClick"];
var _hoisted_27 = { class: "dsm-info-card" };
var _hoisted_28 = { class: "dsm-info-row" };
var _hoisted_29 = { class: "dsm-info-value" };
var _hoisted_30 = { class: "dsm-info-row" };
var _hoisted_31 = { class: "dsm-info-value mono" };
var _hoisted_32 = { class: "dsm-info-row" };
var _hoisted_33 = { class: "dsm-info-value mono" };
var _hoisted_34 = { class: "dsm-info-row" };
var _hoisted_35 = { class: "dsm-info-value mono" };
var _hoisted_36 = { class: "dsm-info-row" };
var _hoisted_37 = { class: "dsm-info-value mono" };
var _hoisted_38 = { class: "dsm-info-row" };
var _hoisted_39 = { class: "dsm-stats-row" };
var _hoisted_40 = { class: "dsm-stat-card" };
var _hoisted_41 = { class: "dsm-stat-value" };
var _hoisted_42 = { class: "dsm-stat-card" };
var _hoisted_43 = { class: "dsm-stat-value" };
var _hoisted_44 = { class: "dsm-stat-card" };
var _hoisted_45 = { class: "dsm-stat-value" };
var _hoisted_46 = { class: "dsm-stat-card" };
var _hoisted_47 = { class: "dsm-stat-value" };
var _hoisted_48 = { class: "dsm-section" };
var _hoisted_49 = { class: "neo4j-graph-view" };
var _hoisted_50 = { class: "ngv-toolbar" };
var _hoisted_51 = { class: "ngv-tip-title" };
var _hoisted_52 = { class: "ngv-tip-row" };
var _hoisted_53 = {
	key: 2,
	class: "ngv-legend"
};
var _hoisted_54 = { class: "dsm-section" };
var _hoisted_55 = { class: "dsm-section-title" };
var _hoisted_56 = {
	key: 0,
	class: "ngv-hint"
};
var _hoisted_57 = { class: "dsm-section" };
var _hoisted_58 = { class: "dsm-section-title" };
var _hoisted_59 = { class: "dsm-query-area" };
var _hoisted_60 = { class: "dsm-query-toolbar" };
var _hoisted_61 = { class: "dsm-query-result" };
var _hoisted_62 = { class: "dsm-query-header" };
var _hoisted_63 = {
	key: 0,
	class: "dsm-query-meta"
};
var _hoisted_64 = {
	key: 0,
	class: "dsm-query-warn"
};
var _hoisted_65 = {
	key: 0,
	class: "node-detail"
};
var _hoisted_66 = { class: "nd-row" };
var _hoisted_67 = { class: "nd-value" };
var _hoisted_68 = { class: "nd-row" };
var _hoisted_69 = { class: "nd-value" };
var _hoisted_70 = { class: "nd-props" };
var GRAPH_CYPHER = "MATCH (a)-[r]->(b)\nRETURN elementId(a) AS fromId, labels(a) AS fromLabel, properties(a) AS fromProps, type(r) AS rel, elementId(b) AS toId, labels(b) AS toLabel, properties(b) AS toProps\nLIMIT 80";
//#endregion
//#region ../../pages/datasource/src/views/console/Neo4jManageView.vue
var Neo4jManageView_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	__name: "Neo4jManageView",
	setup(__props) {
		/**
		* Neo4j 管理页
		*
		* <p>基于「数据源管理」登记的 neo4j 数据源，通过后端 neo4j 管理接口读取真实的标签、关系类型，
		* 并以 Cypher 查询驱动节点列表、关系采样图与节点/关系创建；接口缺失或连接失败时只展示失败
		* 原因，不回落任何演示数据。</p>
		* @author CH
		* @since 4.0.0
		*/
		const { datasourceId, source, gap, bind, fail, ready } = useMiddlewareSource();
		/** 侧栏根节点名称：真实数据源名 */
		const connectionName = computed(() => source.value ? source.value.name : "Neo4j 图数据库");
		const expandedNodes = ref(/* @__PURE__ */ new Set([
			"root",
			"nodes",
			"rels"
		]));
		const activeLabel = ref("");
		const loading = ref(false);
		const testing = ref(false);
		const neo4jVersion = ref("");
		const neo4jEdition = ref("");
		const neo4jView = ref("overview");
		const viewTabs = [
			{
				key: "overview",
				label: "概览"
			},
			{
				key: "graph",
				label: "图可视化"
			},
			{
				key: "nodes",
				label: "节点列表"
			},
			{
				key: "rels",
				label: "关系列表"
			}
		];
		const nodeLabels = ref([]);
		const relTypes = ref([]);
		const labelNodeTotal = computed(() => nodeLabels.value.reduce((sum, l) => sum + (l.nodeCount || 0), 0));
		const relCountTotal = computed(() => relTypes.value.reduce((sum, r) => sum + (r.relationshipCount || 0), 0));
		const labelColumns = [
			{
				prop: "name",
				label: "标签",
				minWidth: 180
			},
			{
				prop: "nodeCount",
				label: "节点数",
				width: 120
			},
			{
				prop: "propertyCount",
				label: "属性数",
				width: 120
			}
		];
		const relColumns = [
			{
				prop: "type",
				label: "关系类型",
				minWidth: 180
			},
			{
				prop: "relationshipCount",
				label: "关系数",
				width: 120
			},
			{
				prop: "propertyCount",
				label: "属性数",
				width: 120
			}
		];
		const nodeLoading = ref(false);
		const nodes = ref([]);
		/** 标签/关系类型行右键菜单（第九批统一 zk 模板） */
		const sideMenu = reactive({
			visible: false,
			x: 0,
			y: 0,
			kind: "label",
			key: ""
		});
		const sideMenuItems = computed(() => sideMenu.kind === "label" ? [{
			key: "view",
			label: "查看该标签节点",
			icon: "Circle"
		}, {
			key: "copy",
			label: "复制标签名",
			icon: "Document"
		}] : [{
			key: "view",
			label: "查看该类型关系",
			icon: "Right"
		}, {
			key: "copy",
			label: "复制类型名",
			icon: "Document"
		}]);
		/** 节点列表表格行右键（ReTable 内置菜单，图标为组件引用） */
		const nodeTableMenu = [{
			key: "view",
			label: "查看节点详情",
			icon: view_default
		}, {
			key: "copy",
			label: "复制 elementId",
			icon: copy_document_default
		}];
		/** 打开侧栏标签行右键菜单 */
		function onLabelContextMenu(e, name) {
			Object.assign(sideMenu, {
				visible: true,
				x: e.clientX,
				y: e.clientY,
				kind: "label",
				key: name
			});
		}
		/** 打开侧栏关系类型行右键菜单 */
		function onRelContextMenu(e, type) {
			Object.assign(sideMenu, {
				visible: true,
				x: e.clientX,
				y: e.clientY,
				kind: "rel",
				key: type
			});
		}
		/** 侧栏菜单分发 */
		function onSideMenuSelect(action) {
			const key = sideMenu.key;
			if (!key) return;
			if (action === "view") if (sideMenu.kind === "label") selectLabel(key);
			else selectRel(key);
			else if (action === "copy") copyToClipboard(key).then((ok) => ok ? message.success("已复制") : message.error("复制失败"));
		}
		/** 节点表格菜单分发 */
		function onNodeTableMenuSelect(item, ctx) {
			if (item.key === "view") onNodeClick(ctx.row);
			else if (item.key === "copy") copyToClipboard(String(ctx.row.id ?? "")).then((ok) => ok ? message.success("已复制 elementId") : message.error("复制失败"));
		}
		const nodeColumns = ref([]);
		const cypherVisible = ref(false);
		const cypherRunning = ref(false);
		const cypherElapsed = ref(0);
		const cypherQuery = ref("");
		/** Cypher 补全候选：节点标签 + 关系类型（输入即提示，随数据异步刷新） */
		const cypherKeywords = computed(() => [...nodeLabels.value.map((l) => l.name), ...relTypes.value.map((r) => r.type)]);
		const queryResult = ref({
			columns: [],
			rows: [],
			truncated: false,
			totalRows: 0
		});
		const nodeDetailVisible = ref(false);
		const selectedNode = ref(null);
		/** Cypher 标识字符合法性（标签/关系类型/属性名） */
		const IDENT = /^[A-Za-z_][A-Za-z0-9_]*$/;
		/** elementId 白名单：形如 4:abi:0，通过校验才允许拼进 Cypher 字面量 */
		const ELEMENT_ID = /^[A-Za-z0-9_:.-]+$/;
		/**
		* 取错误信息
		* @param e 异常
		* @returns 文本
		*/
		function errText(e) {
			return String(e?.message ?? e);
		}
		/**
		* 把返回行里的对象/数组值转成 JSON 文本，便于表格与详情展示
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
		* 由返回行的键推导表格列
		* @param rows 行数据
		* @returns 列定义
		*/
		function toColumns(rows) {
			return (rows.length > 0 ? Object.keys(rows[0]) : []).map((key) => ({
				prop: key,
				label: key,
				minWidth: 140
			}));
		}
		/**
		* 执行 Cypher 并返回展示行
		* @param cypher 语句
		* @returns 行数据与耗时
		*/
		async function runCypher(cypher) {
			const result = await executeNeo4jQuery(cypher, datasourceId.value);
			return {
				rows: stringifyRows(result?.rows || []),
				elapsed: result?.executionTimeMs ?? 0,
				truncated: !!result?.truncated,
				totalRows: result?.totalRows ?? (result?.rows?.length || 0)
			};
		}
		/**
		* 加载标签与关系类型
		*/
		async function refresh() {
			if (!source.value) {
				await bind("neo4j");
				if (!source.value) return;
			}
			loading.value = true;
			try {
				nodeLabels.value = await fetchNeo4jLabels(datasourceId.value) || [];
				ready();
			} catch (e) {
				nodeLabels.value = [];
				fail(e, "/ms/monitor/neo4j/labels");
			}
			try {
				relTypes.value = await fetchNeo4jRelationships(datasourceId.value) || [];
				ready();
			} catch (e) {
				relTypes.value = [];
				fail(e, "/ms/monitor/neo4j/relationships");
			} finally {
				loading.value = false;
			}
			if (activeLabel.value) await loadNodes();
			if (neo4jView.value === "graph") await loadGraph();
		}
		/**
		* 探测当前数据源的 Neo4j 连通性，回填服务端版本与版本类型
		*/
		async function testConnection() {
			testing.value = true;
			try {
				const result = await testNeo4jConnection({ datasourceId: datasourceId.value });
				if (result?.connected) {
					neo4jVersion.value = result.version || "";
					neo4jEdition.value = result.edition || "";
					ready();
					message.success(result.version ? `连接成功 · Neo4j ${result.version}` : "连接成功");
				} else message.error(result?.message || "连接失败");
			} catch (e) {
				fail(e, "/ms/monitor/neo4j/test");
			} finally {
				testing.value = false;
			}
		}
		/**
		* 展开/收起侧栏树节点
		* @param key 节点键
		*/
		function toggleNode(key) {
			if (expandedNodes.value.has(key)) expandedNodes.value.delete(key);
			else expandedNodes.value.add(key);
		}
		/**
		* 切换视图，图视图首次进入时自动采样
		* @param key 视图键
		*/
		function switchView(key) {
			neo4jView.value = key;
			if (key === "graph" && graphEdges.value.length === 0) loadGraph();
		}
		/**
		* 选中标签并查询其节点
		* @param label 标签名
		*/
		function selectLabel(label) {
			activeLabel.value = label;
			neo4jView.value = "nodes";
			loadNodes();
		}
		/**
		* 用关系类型生成计数查询
		* @param rel 关系类型
		*/
		function selectRel(rel) {
			cypherQuery.value = `MATCH ()-[r:\`${rel}\`]->()\nRETURN count(r) AS count`;
			cypherVisible.value = true;
		}
		/**
		* 查询当前选中标签的节点
		*/
		async function loadNodes() {
			if (!activeLabel.value) {
				nodes.value = [];
				nodeColumns.value = [];
				return;
			}
			nodeLoading.value = true;
			try {
				const { rows } = await runCypher(`MATCH (n:\`${activeLabel.value}\`)\nRETURN elementId(n) AS id, labels(n) AS labels, properties(n) AS properties\nLIMIT 100`);
				nodes.value = rows;
				nodeColumns.value = toColumns(rows);
				ready();
			} catch (e) {
				nodes.value = [];
				nodeColumns.value = [];
				fail(e, "/ms/monitor/neo4j/query");
			} finally {
				nodeLoading.value = false;
			}
		}
		/**
		* 点击表格行查看节点详情
		* @param row 行数据
		*/
		function onNodeClick(row) {
			showNode(String(row.id ?? ""));
		}
		/**
		* 展示节点详情
		* @param id 节点 ID
		*/
		function showNode(id) {
			const row = nodes.value.find((n) => String(n.id) === id);
			if (row) {
				selectedNode.value = {
					id,
					label: String(row.labels ?? "").replace(/[\[\]"]/g, ""),
					properties: String(row.properties ?? "{}")
				};
				nodeDetailVisible.value = true;
				return;
			}
			const graph = graphNodes.value.find((n) => n.id === id);
			if (graph) {
				selectedNode.value = {
					id,
					label: graph.label,
					properties: graph.properties
				};
				nodeDetailVisible.value = true;
			}
		}
		const graphLoading = ref(false);
		const graphNote = ref("");
		const graphNodes = ref([]);
		const graphEdges = ref([]);
		const nodeColors = ref({});
		/** ReRelationGraph 节点：标签作分组（同标签高亮），配色沿用图例色板，属性进业务数据 */
		const relationNodes = computed(() => graphNodes.value.map((n) => ({
			id: n.id,
			label: n.label,
			group: n.label,
			size: 44,
			style: {
				fill: n.color,
				stroke: "#ffffff",
				lineWidth: 2
			},
			data: { properties: n.properties }
		})));
		/** ReRelationGraph 边：关系类型作边标签，带方向箭头 */
		const relationEdges = computed(() => graphEdges.value.map((e, idx) => ({
			id: `e${idx}`,
			source: e.from,
			target: e.to,
			label: e.type,
			directed: true,
			group: e.type
		})));
		/**
		* 图上节点点击：复用节点详情弹窗（先查节点列表，再退回采样缓存）
		* @param node 图插件回传的节点（含 id）
		*/
		function onGraphNodeClick(node) {
			showNode(node.id);
		}
		/** 采样用的关系查询，列别名即渲染契约 */
		const PALETTE = [
			"#3b82f6",
			"#8b5cf6",
			"#10b981",
			"#f59e0b",
			"#ef4444",
			"#06b6d4",
			"#64748b"
		];
		/**
		* 采样真实关系数据绘制节点关系图
		*/
		async function loadGraph() {
			graphLoading.value = true;
			graphNote.value = "";
			try {
				const { rows } = await runCypher(GRAPH_CYPHER);
				if (rows.length === 0) {
					graphNodes.value = [];
					graphEdges.value = [];
					graphNote.value = "采样查询未返回关系数据";
					ready();
					return;
				}
				const missing = [
					"fromId",
					"toId",
					"rel"
				].filter((k) => !(k in rows[0]));
				if (missing.length > 0) {
					graphNodes.value = [];
					graphEdges.value = [];
					graphNote.value = `采样结果缺少列：${missing.join(", ")}，无法绘制关系图`;
					return;
				}
				const seen = /* @__PURE__ */ new Map();
				for (const row of rows) for (const [idKey, labelKey, propsKey] of [[
					"fromId",
					"fromLabel",
					"fromProps"
				], [
					"toId",
					"toLabel",
					"toProps"
				]]) {
					const key = String(row[idKey]);
					if (!seen.has(key)) {
						const label = String(row[labelKey] ?? "").replace(/[\[\]"]/g, "").split(",")[0] || "Node";
						seen.set(key, {
							id: key,
							label,
							color: "",
							properties: String(row[propsKey] ?? "{}")
						});
					}
				}
				const list = [...seen.values()].slice(0, 40);
				const labels = [...new Set(list.map((n) => n.label))];
				const colorMap = {};
				labels.forEach((label, idx) => colorMap[label] = PALETTE[idx % PALETTE.length]);
				list.forEach((node) => {
					node.color = colorMap[node.label] || PALETTE[PALETTE.length - 1];
				});
				const inSample = new Set(list.map((n) => n.id));
				const edges = [];
				for (const row of rows) {
					const from = String(row.fromId);
					const to = String(row.toId);
					if (inSample.has(from) && inSample.has(to)) edges.push({
						from,
						to,
						type: String(row.rel ?? "")
					});
				}
				graphNodes.value = list;
				graphEdges.value = edges;
				nodeColors.value = colorMap;
				graphNote.value = edges.length > 0 ? `采样 ${list.length} 个节点 / ${edges.length} 条关系` : "采样节点间无直接关系";
				ready();
			} catch (e) {
				graphNodes.value = [];
				graphEdges.value = [];
				graphNote.value = `采样失败：${errText(e)}`;
				fail(e, "/ms/monitor/neo4j/query");
			} finally {
				graphLoading.value = false;
			}
		}
		/**
		* 打开 Cypher 查询面板，未编辑过时按当前标签预填
		*/
		function openCypher() {
			if (!cypherQuery.value && activeLabel.value) cypherQuery.value = `MATCH (n:\`${activeLabel.value}\`)\nRETURN n\nLIMIT 25`;
			cypherVisible.value = true;
		}
		/**
		* 执行面板里的 Cypher
		*/
		async function executeCypher() {
			if (!cypherQuery.value.trim()) {
				message.warning("请输入 Cypher 语句");
				return;
			}
			cypherRunning.value = true;
			try {
				const { rows, elapsed, truncated, totalRows } = await runCypher(cypherQuery.value);
				queryResult.value = {
					columns: toColumns(rows),
					rows,
					truncated,
					totalRows
				};
				cypherElapsed.value = elapsed;
				ready();
			} catch (e) {
				queryResult.value = {
					columns: [],
					rows: [],
					truncated: false,
					totalRows: 0
				};
				fail(e, "/ms/monitor/neo4j/query");
			} finally {
				cypherRunning.value = false;
			}
		}
		const createNodeVisible = ref(false);
		const newNodeLabel = ref("");
		const newNodeProps = ref("{}");
		const creatingNode = ref(false);
		const createRelVisible = ref(false);
		const newRelType = ref("");
		const newRelFrom = ref("");
		const newRelTo = ref("");
		const newRelProps = ref("{}");
		const creatingRel = ref(false);
		/**
		* 打开新建节点弹窗
		*/
		function openCreateNode() {
			newNodeLabel.value = activeLabel.value || "";
			newNodeProps.value = "{}";
			createNodeVisible.value = true;
		}
		/**
		* 打开新建关系弹窗
		*/
		function openCreateRel() {
			newRelType.value = "";
			newRelFrom.value = "";
			newRelTo.value = "";
			newRelProps.value = "{}";
			createRelVisible.value = true;
		}
		/**
		* 把 JSON 属性转成 Cypher map 字面量
		* @param raw 用户输入的属性 JSON
		* @returns 字面量内容，非法时为 null
		*/
		function propsLiteral(raw) {
			let parsed;
			try {
				parsed = raw.trim() ? JSON.parse(raw) : {};
			} catch {
				message.error("属性必须是合法 JSON");
				return null;
			}
			if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
				message.error("属性必须是 JSON 对象");
				return null;
			}
			const parts = [];
			for (const [key, value] of Object.entries(parsed)) {
				if (!IDENT.test(key)) {
					message.error(`属性名不合法: ${key}`);
					return null;
				}
				if (value === null || [
					"string",
					"number",
					"boolean"
				].includes(typeof value)) parts.push(`${key}: ${JSON.stringify(value)}`);
				else {
					message.error(`属性 ${key} 仅支持字符串/数字/布尔/NULL`);
					return null;
				}
			}
			return parts.join(", ");
		}
		/**
		* 创建节点
		*/
		async function createNode() {
			const label = newNodeLabel.value.trim();
			if (!IDENT.test(label)) {
				message.warning("节点标签只能由字母、数字、下划线组成且不以数字开头");
				return;
			}
			const props = propsLiteral(newNodeProps.value);
			if (props === null) return;
			creatingNode.value = true;
			try {
				const { rows } = await runCypher(`CREATE (n:\`${label}\` {${props}})\nRETURN elementId(n) AS id, labels(n) AS labels`);
				if (rows.length === 0) throw new Error("后端未返回新建节点 ID");
				message.success(`节点已创建，Element ID=${rows[0].id}`);
				createNodeVisible.value = false;
				ready();
				await refresh();
			} catch (e) {
				fail(e, "/ms/monitor/neo4j/query");
			} finally {
				creatingNode.value = false;
			}
		}
		/**
		* 创建关系
		*/
		async function createRel() {
			const type = newRelType.value.trim();
			if (!IDENT.test(type)) {
				message.warning("关系类型只能由字母、数字、下划线组成且不以数字开头");
				return;
			}
			const fromId = newRelFrom.value.trim();
			const toId = newRelTo.value.trim();
			if (!ELEMENT_ID.test(fromId) || !ELEMENT_ID.test(toId)) {
				message.warning("起始/目标节点须填 elementId（形如 4:abi:0），可在节点列表里复制");
				return;
			}
			const props = propsLiteral(newRelProps.value);
			if (props === null) return;
			creatingRel.value = true;
			try {
				const { rows } = await runCypher(`MATCH (a), (b)\nWHERE elementId(a) = '${fromId}' AND elementId(b) = '${toId}'\nCREATE (a)-[r:\`${type}\` {${props}}]->(b)\nRETURN elementId(r) AS id, type(r) AS type`);
				if (rows.length === 0) throw new Error("未匹配到起止节点，关系未创建");
				message.success(`关系已创建，Element ID=${rows[0].id}`);
				createRelVisible.value = false;
				ready();
				await refresh();
			} catch (e) {
				fail(e, "/ms/monitor/neo4j/query");
			} finally {
				creatingRel.value = false;
			}
		}
		onMounted(async () => {
			await bind("neo4j");
			if (source.value) await refresh();
		});
		return (_ctx, _cache) => {
			return openBlock(), createElementBlock("div", _hoisted_1, [
				createBaseVNode("div", _hoisted_2, [createBaseVNode("div", _hoisted_3, [createVNode(unref(component$1), {
					name: "Share",
					size: 18,
					class: "dsm-title-icon dsm-neo4j-icon"
				}), _cache[19] || (_cache[19] = createBaseVNode("span", { class: "dsm-title" }, "Neo4j 图数据库管理", -1))]), createBaseVNode("div", _hoisted_4, [
					createVNode(unref(ReButton_default), {
						layout: "square",
						tip: "测试连接",
						icon: "Connection",
						"data-testid": "dsm-btn-test",
						disabled: !unref(source),
						loading: testing.value,
						onClick: testConnection
					}, null, 8, ["disabled", "loading"]),
					createVNode(unref(ReButton_default), {
						layout: "square",
						tip: "刷新",
						icon: "Refresh",
						"data-testid": "dsm-btn-refresh",
						loading: loading.value,
						onClick: refresh
					}, null, 8, ["loading"]),
					createVNode(unref(ReButton_default), {
						layout: "square",
						tip: "新建节点",
						icon: "Plus",
						"data-testid": "dsm-btn-create",
						disabled: !unref(source),
						onClick: openCreateNode
					}, null, 8, ["disabled"]),
					createVNode(unref(ReButton_default), {
						layout: "square",
						type: "primary",
						tip: "Cypher 查询",
						icon: "Search",
						"data-testid": "dsm-btn-query",
						disabled: !unref(source),
						onClick: openCypher
					}, null, 8, ["disabled"])
				])]),
				createVNode(MiddlewareGap_default, {
					text: unref(gap),
					onRetry: refresh
				}, null, 8, ["text"]),
				createBaseVNode("div", _hoisted_5, [createBaseVNode("div", _hoisted_6, [createBaseVNode("div", _hoisted_7, [createBaseVNode("div", {
					class: "dsm-tree-node dsm-tree-root",
					onClick: _cache[0] || (_cache[0] = ($event) => toggleNode("root"))
				}, [
					createVNode(unref(component$1), {
						name: expandedNodes.value.has("root") ? "ArrowDown" : "ArrowRight",
						size: "12"
					}, null, 8, ["name"]),
					createVNode(unref(component$1), {
						name: "Share",
						size: "14",
						class: "dsm-tree-icon dsm-neo4j-icon"
					}),
					createBaseVNode("span", _hoisted_8, toDisplayString(connectionName.value), 1)
				]), expandedNodes.value.has("root") ? (openBlock(), createElementBlock("div", _hoisted_9, [
					createBaseVNode("div", {
						class: "dsm-tree-node",
						onClick: _cache[1] || (_cache[1] = ($event) => toggleNode("nodes"))
					}, [
						createVNode(unref(component$1), {
							name: expandedNodes.value.has("nodes") ? "ArrowDown" : "ArrowRight",
							size: "12"
						}, null, 8, ["name"]),
						createVNode(unref(component$1), {
							name: "Circle",
							size: "14",
							class: "dsm-tree-icon"
						}),
						_cache[20] || (_cache[20] = createBaseVNode("span", { class: "dsm-tree-label" }, "节点标签 (Labels)", -1)),
						createBaseVNode("span", _hoisted_10, toDisplayString(nodeLabels.value.length), 1)
					]),
					expandedNodes.value.has("nodes") ? (openBlock(), createElementBlock("div", _hoisted_11, [(openBlock(true), createElementBlock(Fragment, null, renderList(nodeLabels.value, (label) => {
						return openBlock(), createElementBlock("div", {
							key: label.name,
							class: normalizeClass(["dsm-tree-node dsm-leaf-node", { active: activeLabel.value === label.name }]),
							onClick: ($event) => selectLabel(label.name),
							onContextmenu: withModifiers(($event) => onLabelContextMenu($event, label.name), ["prevent"])
						}, [
							createVNode(unref(component$1), {
								name: "Circle",
								size: "12",
								class: "dsm-tree-icon"
							}),
							createBaseVNode("span", _hoisted_13, toDisplayString(label.name), 1),
							createBaseVNode("span", _hoisted_14, toDisplayString(label.nodeCount), 1)
						], 42, _hoisted_12);
					}), 128)), nodeLabels.value.length === 0 ? (openBlock(), createElementBlock("div", _hoisted_15, [createBaseVNode("span", _hoisted_16, toDisplayString(unref(gap) ? "未读取到标签" : "暂无标签"), 1)])) : createCommentVNode("", true)])) : createCommentVNode("", true),
					createBaseVNode("div", {
						class: "dsm-tree-node",
						onClick: _cache[2] || (_cache[2] = ($event) => toggleNode("rels"))
					}, [
						createVNode(unref(component$1), {
							name: expandedNodes.value.has("rels") ? "ArrowDown" : "ArrowRight",
							size: "12"
						}, null, 8, ["name"]),
						createVNode(unref(component$1), {
							name: "Right",
							size: "14",
							class: "dsm-tree-icon"
						}),
						_cache[21] || (_cache[21] = createBaseVNode("span", { class: "dsm-tree-label" }, "关系类型 (Rels)", -1)),
						createBaseVNode("span", _hoisted_17, toDisplayString(relTypes.value.length), 1)
					]),
					expandedNodes.value.has("rels") ? (openBlock(), createElementBlock("div", _hoisted_18, [(openBlock(true), createElementBlock(Fragment, null, renderList(relTypes.value, (rel) => {
						return openBlock(), createElementBlock("div", {
							key: rel.type,
							class: "dsm-tree-node dsm-leaf-node",
							onClick: ($event) => selectRel(rel.type),
							onContextmenu: withModifiers(($event) => onRelContextMenu($event, rel.type), ["prevent"])
						}, [
							createVNode(unref(component$1), {
								name: "Right",
								size: "12",
								class: "dsm-tree-icon"
							}),
							createBaseVNode("span", _hoisted_20, toDisplayString(rel.type), 1),
							createBaseVNode("span", _hoisted_21, toDisplayString(rel.relationshipCount), 1)
						], 40, _hoisted_19);
					}), 128)), relTypes.value.length === 0 ? (openBlock(), createElementBlock("div", _hoisted_22, [createBaseVNode("span", _hoisted_23, toDisplayString(unref(gap) ? "未读取到关系类型" : "暂无关系类型"), 1)])) : createCommentVNode("", true)])) : createCommentVNode("", true)
				])) : createCommentVNode("", true)])]), createBaseVNode("div", _hoisted_24, [
					createBaseVNode("div", _hoisted_25, [(openBlock(), createElementBlock(Fragment, null, renderList(viewTabs, (tab) => {
						return createBaseVNode("button", {
							key: tab.key,
							class: normalizeClass(["nvt-btn", { active: neo4jView.value === tab.key }]),
							onClick: ($event) => switchView(tab.key)
						}, toDisplayString(tab.label), 11, _hoisted_26);
					}), 64))]),
					createBaseVNode("div", _hoisted_27, [
						createBaseVNode("div", _hoisted_28, [_cache[22] || (_cache[22] = createBaseVNode("span", { class: "dsm-info-label" }, "数据源", -1)), createBaseVNode("span", _hoisted_29, toDisplayString(unref(source) ? unref(source).name : "未选择"), 1)]),
						createBaseVNode("div", _hoisted_30, [_cache[23] || (_cache[23] = createBaseVNode("span", { class: "dsm-info-label" }, "连接地址", -1)), createBaseVNode("span", _hoisted_31, toDisplayString(unref(source) ? `http://${unref(source).host}:${unref(source).port || 7474}` : "—"), 1)]),
						createBaseVNode("div", _hoisted_32, [_cache[24] || (_cache[24] = createBaseVNode("span", { class: "dsm-info-label" }, "数据库", -1)), createBaseVNode("span", _hoisted_33, toDisplayString(unref(source)?.database || "neo4j"), 1)]),
						createBaseVNode("div", _hoisted_34, [_cache[25] || (_cache[25] = createBaseVNode("span", { class: "dsm-info-label" }, "服务端版本", -1)), createBaseVNode("span", _hoisted_35, toDisplayString(neo4jVersion.value || "未探测"), 1)]),
						createBaseVNode("div", _hoisted_36, [_cache[26] || (_cache[26] = createBaseVNode("span", { class: "dsm-info-label" }, "版本类型", -1)), createBaseVNode("span", _hoisted_37, toDisplayString(neo4jEdition.value || "未探测"), 1)]),
						createBaseVNode("div", _hoisted_38, [_cache[27] || (_cache[27] = createBaseVNode("span", { class: "dsm-info-label" }, "状态", -1)), createVNode(unref(component$2), { type: unref(gap) ? "danger" : "success" }, {
							default: withCtx(() => [createTextVNode(toDisplayString(unref(gap) ? "读取失败" : "正常"), 1)]),
							_: 1
						}, 8, ["type"])])
					]),
					withDirectives(createBaseVNode("div", null, [createBaseVNode("div", _hoisted_39, [
						createBaseVNode("div", _hoisted_40, [createBaseVNode("div", _hoisted_41, toDisplayString(labelNodeTotal.value), 1), _cache[28] || (_cache[28] = createBaseVNode("div", { class: "dsm-stat-label" }, "节点总数（按标签汇总）", -1))]),
						createBaseVNode("div", _hoisted_42, [createBaseVNode("div", _hoisted_43, toDisplayString(relCountTotal.value), 1), _cache[29] || (_cache[29] = createBaseVNode("div", { class: "dsm-stat-label" }, "关系总数（按类型汇总）", -1))]),
						createBaseVNode("div", _hoisted_44, [createBaseVNode("div", _hoisted_45, toDisplayString(nodeLabels.value.length), 1), _cache[30] || (_cache[30] = createBaseVNode("div", { class: "dsm-stat-label" }, "节点标签", -1))]),
						createBaseVNode("div", _hoisted_46, [createBaseVNode("div", _hoisted_47, toDisplayString(relTypes.value.length), 1), _cache[31] || (_cache[31] = createBaseVNode("div", { class: "dsm-stat-label" }, "关系类型", -1))])
					]), createBaseVNode("div", _hoisted_48, [_cache[32] || (_cache[32] = createBaseVNode("div", { class: "dsm-section-title" }, "标签统计", -1)), createVNode(unref(ReTable_default), {
						data: nodeLabels.value,
						columns: labelColumns,
						loading: loading.value,
						pagination: false,
						stripe: "",
						border: "",
						height: "260px"
					}, null, 8, ["data", "loading"])])], 512), [[vShow, neo4jView.value === "overview"]]),
					withDirectives(createBaseVNode("div", _hoisted_49, [
						createBaseVNode("div", _hoisted_50, [createBaseVNode("span", null, toDisplayString(graphNote.value || "节点关系采样图（来自 Cypher 采样查询）"), 1), createVNode(unref(ReButton_default), {
							loading: graphLoading.value,
							onClick: loadGraph
						}, {
							icon: withCtx(() => [createVNode(unref(component$1), { name: "Refresh" })]),
							default: withCtx(() => [_cache[33] || (_cache[33] = createTextVNode("重新采样 ", -1))]),
							_: 1
						}, 8, ["loading"])]),
						graphEdges.value.length > 0 ? (openBlock(), createBlock(unref(component$3), {
							key: 0,
							nodes: relationNodes.value,
							edges: relationEdges.value,
							layout: "force",
							height: "450px",
							highlight: "both",
							minimap: relationNodes.value.length > 3,
							"node-size": 44,
							"empty-text": "采样图无关系可绘制",
							"data-testid": "dsm-neo4j-graph",
							onNodeClick: onGraphNodeClick
						}, {
							hover: withCtx(({ node }) => [createBaseVNode("div", _hoisted_51, toDisplayString(node.label), 1), createBaseVNode("div", _hoisted_52, "id：" + toDisplayString(node.id), 1)]),
							_: 1
						}, 8, [
							"nodes",
							"edges",
							"minimap"
						])) : (openBlock(), createBlock(unref(ReEmpty_default), {
							key: 1,
							description: graphNote.value || "暂无采样数据"
						}, null, 8, ["description"])),
						graphNodes.value.length > 0 ? (openBlock(), createElementBlock("div", _hoisted_53, [(openBlock(true), createElementBlock(Fragment, null, renderList(nodeColors.value, (color, label) => {
							return openBlock(), createElementBlock("span", {
								key: label,
								class: "ngv-legend-item"
							}, [createBaseVNode("span", {
								class: "ngv-legend-dot",
								style: normalizeStyle({ background: color })
							}, null, 4), createTextVNode(toDisplayString(label), 1)]);
						}), 128))])) : createCommentVNode("", true)
					], 512), [[vShow, neo4jView.value === "graph"]]),
					withDirectives(createBaseVNode("div", _hoisted_54, [
						createBaseVNode("div", _hoisted_55, [createTextVNode(toDisplayString(activeLabel.value ? `${activeLabel.value} 节点` : "节点列表") + " ", 1), createVNode(unref(ReButton_default), {
							text: "",
							type: "primary",
							disabled: !activeLabel.value,
							onClick: loadNodes
						}, {
							icon: withCtx(() => [createVNode(unref(component$1), {
								name: "Refresh",
								size: "12"
							})]),
							default: withCtx(() => [_cache[34] || (_cache[34] = createTextVNode("重新查询 ", -1))]),
							_: 1
						}, 8, ["disabled"])]),
						createVNode(unref(ReTable_default), {
							data: nodes.value,
							columns: nodeColumns.value,
							loading: nodeLoading.value,
							pagination: false,
							stripe: "",
							border: "",
							height: "400px",
							"context-menu": nodeTableMenu,
							onContextMenuSelect: onNodeTableMenuSelect,
							onRowClick: onNodeClick
						}, null, 8, [
							"data",
							"columns",
							"loading"
						]),
						!activeLabel.value ? (openBlock(), createElementBlock("div", _hoisted_56, "从左侧选择一个节点标签后查询其节点")) : createCommentVNode("", true)
					], 512), [[vShow, neo4jView.value === "nodes"]]),
					withDirectives(createBaseVNode("div", _hoisted_57, [createBaseVNode("div", _hoisted_58, [_cache[36] || (_cache[36] = createTextVNode(" 关系类型列表 ", -1)), createVNode(unref(ReButton_default), {
						type: "primary",
						onClick: openCreateRel
					}, {
						icon: withCtx(() => [createVNode(unref(component$1), { name: "Plus" })]),
						default: withCtx(() => [_cache[35] || (_cache[35] = createTextVNode("新建关系 ", -1))]),
						_: 1
					})]), createVNode(unref(ReTable_default), {
						data: relTypes.value,
						columns: relColumns,
						loading: loading.value,
						pagination: false,
						stripe: "",
						border: "",
						height: "400px"
					}, null, 8, ["data", "loading"])], 512), [[vShow, neo4jView.value === "rels"]])
				])]),
				createVNode(unref(component), {
					modelValue: cypherVisible.value,
					"onUpdate:modelValue": _cache[6] || (_cache[6] = ($event) => cypherVisible.value = $event),
					title: "Cypher 查询",
					width: "760px"
				}, {
					footer: withCtx(() => [createVNode(unref(ReButton_default), { onClick: _cache[5] || (_cache[5] = ($event) => cypherVisible.value = false) }, {
						default: withCtx(() => [..._cache[40] || (_cache[40] = [createTextVNode("取消", -1)])]),
						_: 1
					}), createVNode(unref(ReButton_default), {
						type: "primary",
						loading: cypherRunning.value,
						onClick: executeCypher
					}, {
						icon: withCtx(() => [createVNode(unref(component$1), { name: "VideoPlay" })]),
						default: withCtx(() => [_cache[41] || (_cache[41] = createTextVNode("执行查询", -1))]),
						_: 1
					}, 8, ["loading"])]),
					default: withCtx(() => [createBaseVNode("div", _hoisted_59, [
						createBaseVNode("div", _hoisted_60, [
							createVNode(unref(ReButton_default), {
								layout: "square",
								type: "primary",
								icon: "VideoPlay",
								tip: "执行（Ctrl+Enter）",
								"data-testid": "dsm-btn-exec",
								onClick: executeCypher
							}),
							createVNode(unref(ReButton_default), {
								layout: "square",
								icon: "Delete",
								tip: "清空编辑器",
								"data-testid": "dsm-btn-clear",
								onClick: _cache[3] || (_cache[3] = ($event) => cypherQuery.value = "")
							}),
							_cache[37] || (_cache[37] = createBaseVNode("span", { class: "dsm-spacer" }, null, -1)),
							_cache[38] || (_cache[38] = createBaseVNode("span", { class: "dsm-query-hint" }, "标签/关系类型与 Cypher 关键字输入即提示", -1))
						]),
						createVNode(DbSqlEditor_default, {
							modelValue: cypherQuery.value,
							"onUpdate:modelValue": _cache[4] || (_cache[4] = ($event) => cypherQuery.value = $event),
							language: "cypher",
							keywords: cypherKeywords.value,
							"data-testid": "dsm-cypher-editor",
							onExecute: executeCypher
						}, null, 8, ["modelValue", "keywords"]),
						createBaseVNode("div", _hoisted_61, [createBaseVNode("div", _hoisted_62, [_cache[39] || (_cache[39] = createTextVNode(" 查询结果 ", -1)), queryResult.value.rows.length > 0 ? (openBlock(), createElementBlock("span", _hoisted_63, [createTextVNode(toDisplayString(queryResult.value.rows.length) + " 行 · " + toDisplayString(cypherElapsed.value) + " ms ", 1), queryResult.value.truncated ? (openBlock(), createElementBlock("span", _hoisted_64, "已截断，服务端共 " + toDisplayString(queryResult.value.totalRows) + " 行，请加 LIMIT 收窄结果", 1)) : createCommentVNode("", true)])) : createCommentVNode("", true)]), queryResult.value.columns.length > 0 ? (openBlock(), createBlock(unref(ReTable_default), {
							key: 0,
							data: queryResult.value.rows,
							columns: queryResult.value.columns,
							pagination: false,
							stripe: "",
							border: "",
							height: "200px"
						}, null, 8, ["data", "columns"])) : (openBlock(), createBlock(unref(ReEmpty_default), {
							key: 1,
							description: "执行查询后显示结果"
						}))])
					])]),
					_: 1
				}, 8, ["modelValue"]),
				createVNode(unref(component), {
					modelValue: nodeDetailVisible.value,
					"onUpdate:modelValue": _cache[7] || (_cache[7] = ($event) => nodeDetailVisible.value = $event),
					title: "节点详情",
					width: "500px"
				}, {
					default: withCtx(() => [selectedNode.value ? (openBlock(), createElementBlock("div", _hoisted_65, [
						createBaseVNode("div", _hoisted_66, [_cache[42] || (_cache[42] = createBaseVNode("span", { class: "nd-label" }, "Element ID：", -1)), createBaseVNode("span", _hoisted_67, toDisplayString(selectedNode.value.id), 1)]),
						createBaseVNode("div", _hoisted_68, [_cache[43] || (_cache[43] = createBaseVNode("span", { class: "nd-label" }, "标签：", -1)), createBaseVNode("span", _hoisted_69, toDisplayString(selectedNode.value.label || "—"), 1)]),
						_cache[44] || (_cache[44] = createBaseVNode("div", { class: "nd-row" }, [createBaseVNode("span", { class: "nd-label" }, "属性：")], -1)),
						createBaseVNode("pre", _hoisted_70, toDisplayString(selectedNode.value.properties), 1)
					])) : createCommentVNode("", true)]),
					_: 1
				}, 8, ["modelValue"]),
				createVNode(unref(component), {
					modelValue: createNodeVisible.value,
					"onUpdate:modelValue": _cache[11] || (_cache[11] = ($event) => createNodeVisible.value = $event),
					title: "新建节点",
					width: "500px"
				}, {
					footer: withCtx(() => [createVNode(unref(ReButton_default), { onClick: _cache[10] || (_cache[10] = ($event) => createNodeVisible.value = false) }, {
						default: withCtx(() => [..._cache[45] || (_cache[45] = [createTextVNode("取消", -1)])]),
						_: 1
					}), createVNode(unref(ReButton_default), {
						type: "primary",
						loading: creatingNode.value,
						onClick: createNode
					}, {
						default: withCtx(() => [..._cache[46] || (_cache[46] = [createTextVNode("创建", -1)])]),
						_: 1
					}, 8, ["loading"])]),
					default: withCtx(() => [createVNode(unref(ReForm_default), { "label-width": "100px" }, {
						default: withCtx(() => [createVNode(unref(ReFormItem), {
							label: "节点标签",
							required: ""
						}, {
							default: withCtx(() => [createVNode(unref(ReInput_default), {
								modelValue: newNodeLabel.value,
								"onUpdate:modelValue": _cache[8] || (_cache[8] = ($event) => newNodeLabel.value = $event),
								placeholder: "例如：Person、Movie"
							}, null, 8, ["modelValue"])]),
							_: 1
						}), createVNode(unref(ReFormItem), { label: "节点属性(JSON)" }, {
							default: withCtx(() => [createVNode(unref(ReInput_default), {
								modelValue: newNodeProps.value,
								"onUpdate:modelValue": _cache[9] || (_cache[9] = ($event) => newNodeProps.value = $event),
								type: "textarea",
								rows: 6,
								placeholder: "{\"name\": \"张三\", \"age\": 25}"
							}, null, 8, ["modelValue"])]),
							_: 1
						})]),
						_: 1
					})]),
					_: 1
				}, 8, ["modelValue"]),
				createVNode(unref(component), {
					modelValue: createRelVisible.value,
					"onUpdate:modelValue": _cache[17] || (_cache[17] = ($event) => createRelVisible.value = $event),
					title: "新建关系",
					width: "500px"
				}, {
					footer: withCtx(() => [createVNode(unref(ReButton_default), { onClick: _cache[16] || (_cache[16] = ($event) => createRelVisible.value = false) }, {
						default: withCtx(() => [..._cache[47] || (_cache[47] = [createTextVNode("取消", -1)])]),
						_: 1
					}), createVNode(unref(ReButton_default), {
						type: "primary",
						loading: creatingRel.value,
						onClick: createRel
					}, {
						default: withCtx(() => [..._cache[48] || (_cache[48] = [createTextVNode("创建", -1)])]),
						_: 1
					}, 8, ["loading"])]),
					default: withCtx(() => [createVNode(unref(ReForm_default), { "label-width": "100px" }, {
						default: withCtx(() => [
							createVNode(unref(ReFormItem), {
								label: "关系类型",
								required: ""
							}, {
								default: withCtx(() => [createVNode(unref(ReInput_default), {
									modelValue: newRelType.value,
									"onUpdate:modelValue": _cache[12] || (_cache[12] = ($event) => newRelType.value = $event),
									placeholder: "例如：ACTED_IN、DIRECTED"
								}, null, 8, ["modelValue"])]),
								_: 1
							}),
							createVNode(unref(ReFormItem), {
								label: "起始节点",
								required: ""
							}, {
								default: withCtx(() => [createVNode(unref(ReInput_default), {
									modelValue: newRelFrom.value,
									"onUpdate:modelValue": _cache[13] || (_cache[13] = ($event) => newRelFrom.value = $event),
									placeholder: "起始节点的 elementId，形如 4:abi:0"
								}, null, 8, ["modelValue"])]),
								_: 1
							}),
							createVNode(unref(ReFormItem), {
								label: "目标节点",
								required: ""
							}, {
								default: withCtx(() => [createVNode(unref(ReInput_default), {
									modelValue: newRelTo.value,
									"onUpdate:modelValue": _cache[14] || (_cache[14] = ($event) => newRelTo.value = $event),
									placeholder: "目标节点的 elementId，形如 4:abi:0"
								}, null, 8, ["modelValue"])]),
								_: 1
							}),
							createVNode(unref(ReFormItem), { label: "关系属性(JSON)" }, {
								default: withCtx(() => [createVNode(unref(ReInput_default), {
									modelValue: newRelProps.value,
									"onUpdate:modelValue": _cache[15] || (_cache[15] = ($event) => newRelProps.value = $event),
									type: "textarea",
									rows: 4,
									placeholder: "{\"role\": \"主角\", \"year\": 2023}"
								}, null, 8, ["modelValue"])]),
								_: 1
							})
						]),
						_: 1
					})]),
					_: 1
				}, 8, ["modelValue"]),
				createVNode(DsmContextMenu_default, {
					visible: sideMenu.visible,
					"onUpdate:visible": _cache[18] || (_cache[18] = ($event) => sideMenu.visible = $event),
					x: sideMenu.x,
					y: sideMenu.y,
					items: sideMenuItems.value,
					onSelect: onSideMenuSelect
				}, null, 8, [
					"visible",
					"x",
					"y",
					"items"
				])
			]);
		};
	}
}), [["__scopeId", "data-v-41b83eaf"]]);
//#endregion
export { Neo4jManageView_default as default };
