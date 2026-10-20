import { $n as normalizeClass, Ct as resolveDirective, D as createVNode, E as createTextVNode, Ht as watch, On as unref, Yt as withDirectives, _ as createBaseVNode, b as createElementBlock, bt as renderList, ct as onMounted, g as computed, gn as reactive, k as defineComponent, mt as openBlock, nr as normalizeStyle, o as Fragment, qt as withCtx, rr as toDisplayString, tt as nextTick, v as createBlock, vn as ref, y as createCommentVNode } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { C as withKeys, w as withModifiers, x as vModelText } from "./runtime-dom.esm-bundler-RRl39S3n.js";
import { t as ElMessageBox } from "./message-box-CXDJvJwn.js";
import { t as ReTable_default } from "./ReTable-BO1ac7-i.js";
import { yt as message } from "./src-CEonioA3.js";
import { w as unwrapResult, x as http } from "./src-DDwlSqPX.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { t as ReSelect_default } from "./ReSelect-C2rq-Voy.js";
import { t as ReButton_default } from "./ReButton-owxlNwDO.js";
import { t as component } from "./ReDialog-DZGeR3lw.js";
import { t as ReAlert } from "./ReKit-CFSh6vls.js";
import { t as ReEmpty_default } from "./ReEmpty-DzxmsI1k.js";
import { t as component$1 } from "./ReIcon-By12b2Y9.js";
import { t as ReInput_default } from "./ReInput-CGHpe202.js";
import { t as ReInputNumber_default } from "./ReInputNumber-BOzz1hL8.js";
import { t as ReSwitch_default } from "./ReSwitch-B3yMYGw4.js";
import { t as ReTab_default } from "./ReTab-y-lcvWJm.js";
import { t as component$2 } from "./ReTag-D5UpQULZ.js";
import { t as component$3 } from "./ReDrawer-DD0yjZVq.js";
import { t as component$4 } from "./ReRelationGraph-TK3CtGll.js";
import "./surface-Bdspw2jE.js";
import { n as MiddlewareGap_default, t as useMiddlewareSource } from "./middlewareSource-BjMz9rOx.js";
//#region ../../pages/datasource/src/api/esManageApi.ts
/**
* Elasticsearch 控制台 API（@pages/datasource）
*
* <p>两条通道并存，各司其职：</p>
* <ul>
*   <li><b>通用中间件 SPI</b> {@code /ms/monitor/middleware/**}：能力声明、连接测试、只读检索。
*       能力包未安装时后端按契约返回「功能未开放」，前端原样展示而不是猜一个 500 页面。</li>
*   <li><b>ES 专属管理面</b> {@code /ms/monitor/elasticsearch/**}：索引（设计表/改表/删表）、
*       集群配置、关系图。这些是 ES 独有能力，没有通用 SPI 对应物。</li>
* </ul>
*
* <p>类型统一用 {@code type} 而非 {@code interface}：接口没有隐式索引签名，赋给
* {@code Record<string, unknown>}（ReTable 的 data、http().data 的 RequestBody）会报
* {@code TS2345}；对象类型别名可以。</p>
*
* @author CH
* @since 4.0.0.42
*/
var unwrap = (res) => unwrapResult(res);
var MIDDLEWARE_BASE = "/ms/monitor/middleware";
var ES_BASE = "/ms/monitor/elasticsearch";
/** 查询 Elasticsearch 中间件能力声明（不需要真实集群连接） */
var fetchEsCapability = () => http().get(`${MIDDLEWARE_BASE}/capability`).query({ type: "elasticsearch" }).noToast(true).then((r) => unwrap(r));
/** 测试 Elasticsearch 连接 */
var testEsConnection = (datasourceId) => http().post(`${MIDDLEWARE_BASE}/test`).query({ type: "elasticsearch" }).data({ datasourceId }).noToast(true).then((r) => unwrap(r));
/** 执行 Elasticsearch 检索（nodes / indices / count <index> / mapping <index> / search <index> [查询] / get <index> <id>） */
var queryEs = (expression, datasourceId, limit = 100) => http().post(`${MIDDLEWARE_BASE}/query`).query({
	type: "elasticsearch",
	expression,
	limit
}).noToast(true).then((r) => unwrap(r));
/** 索引列表 */
var fetchEsIndices = (datasourceId) => http().get(`${ES_BASE}/indices`).query({ datasourceId }).noToast(true).then((r) => unwrap(r));
/** 索引详情（字段映射 + 设置） */
var fetchEsIndexDetail = (index, datasourceId) => http().get(`${ES_BASE}/index`).query({
	index,
	datasourceId
}).noToast(true).then((r) => unwrap(r));
/** 新建索引（设计表） */
var createEsIndex = (form) => http().post(`${ES_BASE}/index`).data(form).noToast(true).then((r) => unwrap(r));
/** 追加字段（改表） */
var addEsMapping = (form) => http().post(`${ES_BASE}/mapping`).data(form).noToast(true).then((r) => unwrap(r));
/**
* 重建索引：删字段 / 改字段类型的唯一途径
*
* <p>后端会「建临时索引(新 mapping) → 搬运原数据 → 删原索引 → 用新 mapping 建回同名索引 →
* 搬运回来 → 删临时索引」。重建期间原索引短暂不可用，且耗时与数据量成正比。</p>
*/
var rebuildEsIndex = (form) => http().post(`${ES_BASE}/index/rebuild`).data(form).noToast(true).then((r) => unwrap(r));
/** 删除索引 */
var deleteEsIndex = (index, datasourceId) => http().delete(`${ES_BASE}/index`).query({
	index,
	datasourceId
}).noToast(true).then((r) => unwrap(r));
/** 集群信息（含有效设置） */
var fetchEsCluster = (datasourceId) => http().get(`${ES_BASE}/cluster`).query({ datasourceId }).noToast(true).then((r) => unwrap(r));
/** 分片分配 */
var fetchEsShards = (datasourceId) => http().get(`${ES_BASE}/shards`).query({ datasourceId }).noToast(true).then((r) => unwrap(r));
/** 更新集群设置 */
var updateEsClusterSettings = (form) => http().put(`${ES_BASE}/cluster/settings`).data(form).noToast(true).then((r) => unwrap(r));
/**
* Dev Tools 原始查询：透传任意 ES REST 调用
*
* @param method       HTTP 方法（GET / POST / PUT / DELETE / PATCH）
* @param path         ES 端点（如 _search、_settings，等）
* @param body         请求体（可为空）
* @param datasourceId 数据源 ID
*/
var fetchEsRawQuery = (method, path, body, datasourceId) => http().post(`${ES_BASE}/raw`).query({
	method,
	path,
	datasourceId
}).data(body || "").noToast(true).then((r) => unwrap(r));
//#endregion
//#region ../../pages/datasource/src/views/console/ElasticsearchManageView.vue?vue&type=script&setup=true&lang.ts
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
var _hoisted_18 = { class: "dsm-section" };
var _hoisted_19 = { class: "dsm-section-title" };
var _hoisted_20 = { class: "dsm-section-actions" };
var _hoisted_21 = { class: "dsm-section" };
var _hoisted_22 = { class: "dsm-section-title" };
var _hoisted_23 = { class: "dsm-section-actions" };
var _hoisted_24 = {
	key: 1,
	class: "dsm-muted"
};
var _hoisted_25 = {
	class: "dsm-meter",
	title: "CPU 使用率"
};
var _hoisted_26 = { class: "dsm-meter__track" };
var _hoisted_27 = { class: "dsm-meter__text" };
var _hoisted_28 = { class: "dsm-section" };
var _hoisted_29 = { class: "dsm-section-title" };
var _hoisted_30 = { class: "dsm-section-actions" };
var _hoisted_31 = { class: "dsm-cluster-form" };
var _hoisted_32 = { class: "dsm-form-item dsm-form-item--wide" };
var _hoisted_33 = { class: "dsm-bootstrap" };
var _hoisted_34 = { class: "dsm-field-head" };
var _hoisted_35 = { class: "dsm-sub-title" };
var _hoisted_36 = { class: "dsm-node-grid" };
var _hoisted_37 = {
	key: 0,
	class: "dsm-field-empty"
};
var _hoisted_38 = { class: "dsm-section-actions" };
var _hoisted_39 = {
	key: 0,
	class: "dsm-snippets"
};
var _hoisted_40 = { class: "dsm-snippet-head" };
var _hoisted_41 = { class: "mono" };
var _hoisted_42 = ["data-testid"];
var _hoisted_43 = { class: "dsm-section" };
var _hoisted_44 = { class: "dsm-section-title" };
var _hoisted_45 = { class: "dsm-section-actions" };
var _hoisted_46 = { class: "dsm-graph-wrap re-surface" };
var _hoisted_47 = {
	key: 0,
	class: "dsm-graph-detail",
	"data-testid": "es-graph-detail"
};
var _hoisted_48 = { class: "dsm-graph-tip-title" };
var _hoisted_49 = { class: "dsm-graph-tip-row" };
var _hoisted_50 = { class: "dsm-graph-tip-row" };
var _hoisted_51 = { class: "dsm-graph-tip-row" };
var _hoisted_52 = { class: "dsm-graph-tip-row" };
var _hoisted_53 = { class: "dsm-graph-tip-row" };
var _hoisted_54 = { class: "dsm-graph-tip-row" };
var _hoisted_55 = { class: "dsm-query-area" };
var _hoisted_56 = { class: "dsm-query-toolbar" };
var _hoisted_57 = { class: "dsm-query-result" };
var _hoisted_58 = { class: "dsm-query-header" };
var _hoisted_59 = {
	key: 0,
	class: "dsm-query-meta"
};
var _hoisted_60 = {
	key: 0,
	class: "dsm-query-warn"
};
var _hoisted_61 = { class: "dsm-devtools" };
var _hoisted_62 = { class: "dsm-devtools-history" };
var _hoisted_63 = { class: "dsm-devtools-history-head" };
var _hoisted_64 = {
	key: 0,
	class: "dsm-devtools-history-empty"
};
var _hoisted_65 = ["title", "onClick"];
var _hoisted_66 = { class: "dsm-devtools-history-cmd" };
var _hoisted_67 = { class: "dsm-devtools-history-idx" };
var _hoisted_68 = { class: "dsm-devtools-main" };
var _hoisted_69 = { class: "dsm-devtools-toolbar" };
var _hoisted_70 = { class: "dsm-devtools-editor-wrap" };
var _hoisted_71 = { class: "dsm-devtools-editor-hint" };
var _hoisted_72 = ["placeholder", "onKeydown"];
var _hoisted_73 = { class: "dsm-devtools-templates" };
var _hoisted_74 = {
	key: 0,
	class: "dsm-devtools-result"
};
var _hoisted_75 = { class: "dsm-devtools-result-head" };
var _hoisted_76 = { class: "dsm-devtools-result-meta" };
var _hoisted_77 = {
	key: 0,
	class: "dsm-devtools-error"
};
var _hoisted_78 = {
	key: 1,
	class: "dsm-devtools-json"
};
var _hoisted_79 = { class: "dsm-cluster" };
var _hoisted_80 = { class: "dsm-cluster-stats" };
var _hoisted_81 = { class: "dsm-stat" };
var _hoisted_82 = { class: "dsm-stat-value mono" };
var _hoisted_83 = { class: "dsm-stat" };
var _hoisted_84 = { class: "dsm-stat" };
var _hoisted_85 = { class: "dsm-stat-value" };
var _hoisted_86 = { class: "dsm-stat" };
var _hoisted_87 = { class: "dsm-stat-value" };
var _hoisted_88 = { class: "dsm-stat" };
var _hoisted_89 = { class: "dsm-stat-value" };
var _hoisted_90 = { class: "dsm-stat" };
var _hoisted_91 = { class: "dsm-stat-value" };
var _hoisted_92 = { class: "dsm-stat" };
var _hoisted_93 = { class: "dsm-stat-value mono" };
var _hoisted_94 = {
	key: 1,
	class: "dsm-muted"
};
var _hoisted_95 = {
	class: "dsm-meter",
	title: "CPU 使用率"
};
var _hoisted_96 = { class: "dsm-meter__track" };
var _hoisted_97 = { class: "dsm-meter__text" };
var _hoisted_98 = { class: "dsm-setting-edit" };
var _hoisted_99 = {
	key: 0,
	class: "dsm-setting-block",
	"data-testid": "es-setting-static"
};
var _hoisted_100 = { class: "dsm-field-drawer" };
var _hoisted_101 = { class: "dsm-drawer-bar" };
var _hoisted_102 = {
	key: 0,
	class: "dsm-divider-row"
};
var _hoisted_103 = { class: "dsm-muted" };
var _hoisted_104 = { class: "dsm-muted" };
var _hoisted_105 = { class: "dsm-muted" };
var _hoisted_106 = { class: "dsm-muted" };
var _hoisted_107 = {
	key: 1,
	class: "dsm-muted"
};
var _hoisted_108 = { class: "dsm-index-form" };
var _hoisted_109 = { class: "dsm-form-row" };
var _hoisted_110 = { class: "dsm-form-item" };
var _hoisted_111 = { class: "dsm-form-item" };
var _hoisted_112 = { class: "dsm-form-item" };
var _hoisted_113 = { class: "dsm-field-head" };
var _hoisted_114 = { class: "dsm-sub-title" };
var _hoisted_115 = { class: "dsm-field-grid" };
var _hoisted_116 = { class: "dsm-field-name" };
var _hoisted_117 = {
	key: 0,
	class: "dsm-field-empty"
};
var _hoisted_118 = { class: "dsm-form-hint" };
//#endregion
//#region ../../pages/datasource/src/views/console/ElasticsearchManageView.vue
var ElasticsearchManageView_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	name: "ElasticsearchManageView",
	__name: "ElasticsearchManageView",
	setup(__props) {
		/**
		* Elasticsearch 管理页
		*
		* <p>只消费两条契约：通用中间件 SPI（能力声明 / 连接测试 / 只读检索）与 ES 专属管理面
		* {@code /ms/monitor/elasticsearch/**}（索引设计表 / 集群配置 / 关系图）。能力包未安装时后端返回
		* 「功能未开放」，页面原样展示原因，不回落任何演示数据。</p>
		*
		* @author CH
		* @since 4.0.0.42
		*/
		const { datasourceId, source, gap, bind, ready } = useMiddlewareSource();
		/** 标签页：索引概览 / 节点列表 / 集群纳管 / 关系图谱 / 查询检索 / Dev Tools */
		const tabs = [
			{
				name: "overview",
				label: "索引概览",
				icon: "Collection"
			},
			{
				name: "nodes",
				label: "节点列表",
				icon: "Monitor"
			},
			{
				name: "clusterCfg",
				label: "集群纳管",
				icon: "Connection"
			},
			{
				name: "graph",
				label: "关系图谱",
				icon: "Share"
			},
			{
				name: "query",
				label: "查询检索",
				icon: "Search"
			},
			{
				name: "devtools",
				label: "Dev Tools",
				icon: "Cpu"
			}
		];
		const activeTab = ref("overview");
		const capability = ref(null);
		const capabilityLoading = ref(false);
		const testing = ref(false);
		const loading = ref(false);
		const testResult = ref({
			version: "",
			detail: ""
		});
		const indices = ref([]);
		const indexFilter = ref("");
		const cluster = ref(null);
		const nodesLoading = ref(false);
		const graphLoading = ref(false);
		const clusterForm = reactive({
			clusterName: "",
			bootstrap: true,
			nodes: []
		});
		const clusterSnippets = ref([]);
		/** 节点角色可选项（ES node.roles 的常用取值） */
		const ROLE_OPTIONS = [
			{
				label: "master（候选主节点）",
				value: "master"
			},
			{
				label: "data（数据节点）",
				value: "data"
			},
			{
				label: "ingest（预处理）",
				value: "ingest"
			},
			{
				label: "ml（机器学习）",
				value: "ml"
			},
			{
				label: "remote_cluster_client（跨集群检索）",
				value: "remote_cluster_client"
			}
		];
		/**
		* 静态设置的 key：ES 的 {@code _cluster/settings} <b>只接受动态设置</b>，
		* 这些写进去会被 ES 以 {@code unknown setting} / {@code not dynamic} 拒掉，
		* 必须在各节点的 elasticsearch.yml 里改并重启。
		*/
		const STATIC_SETTING_KEYS = ["cluster.name", "cluster.initial_master_nodes"];
		/** 静态设置的前缀（node.* 角色/属性、discovery.*、路径、网络、端口等都是节点级静态项） */
		const STATIC_SETTING_PREFIXES = [
			"node.",
			"discovery.",
			"path.",
			"bootstrap.",
			"plugin.",
			"network.",
			"http.",
			"transport.",
			"thread_pool.",
			"action.",
			"indices.",
			"search.",
			"repositories.",
			"xpack.",
			"logger."
		];
		/**
		* 判断某个集群设置是不是静态设置（不可通过 REST 动态改）。
		*
		* @param key 设置项 key
		* @returns 命中时返回给用户看的原因，否则空串
		*/
		function staticSettingReason(key) {
			const k = (key || "").trim();
			if (!k) return "";
			if (!(STATIC_SETTING_KEYS.includes(k) || STATIC_SETTING_PREFIXES.some((p) => k.startsWith(p)))) return "";
			return `「${k}」是静态设置：_cluster/settings 只接受动态设置（ES 会报 not dynamic / unknown setting），只能写进各节点的 elasticsearch.yml 并重启。要生成配置请切到「集群纳管」页签。`;
		}
		/** 当前所选设置项若是静态设置，给出拦截原因（模板里就地提示） */
		const settingKeyStaticReason = computed(() => staticSettingReason(settingKey.value));
		function addClusterNode() {
			clusterForm.nodes.push({
				name: `node-${clusterForm.nodes.length + 1}`,
				host: "",
				httpPort: 9200,
				transportPort: 9300,
				roles: ["master", "data"]
			});
		}
		function removeClusterNode(idx) {
			clusterForm.nodes.splice(idx, 1);
		}
		/**
		* 按当前表单生成「每个节点一份」的 elasticsearch.yml 片段。
		*
		* <p>各节点只有 node.name / node.roles / 端口不同，cluster.name 与 discovery 种子列表必须一致；
		* 首次引导才需要 cluster.initial_master_nodes，故做成可关的开关并在注释里写明何时该删。</p>
		*/
		function buildClusterSnippets() {
			const clusterName = clusterForm.clusterName.trim();
			if (!clusterName) {
				message.warning("请先填写集群名 cluster.name");
				return;
			}
			const nodes = clusterForm.nodes;
			if (nodes.length === 0) {
				message.warning("至少添加一个节点");
				return;
			}
			if (nodes.some((n) => !n.name.trim() || !n.host.trim())) {
				message.warning("每个节点都要填「节点名」和「主机」");
				return;
			}
			const names = nodes.map((n) => n.name.trim());
			if (new Set(names).size !== names.length) {
				message.warning("节点名不能重复（node.name 必须唯一）");
				return;
			}
			const seeds = nodes.map((n) => `${n.host.trim()}:${n.transportPort || 9300}`);
			const masters = nodes.filter((n) => n.roles.includes("master")).map((n) => n.name.trim());
			clusterSnippets.value = nodes.map((n) => {
				const lines = [
					`# ===== ${n.name.trim()}（${n.host.trim()}）—— 把该机器的 elasticsearch.yml 改成下面内容后重启 =====`,
					`cluster.name: ${clusterName}`,
					`node.name: ${n.name.trim()}`,
					`node.roles: [ ${n.roles.length > 0 ? n.roles.join(", ") : "data"} ]`,
					"network.host: 0.0.0.0",
					`http.port: ${n.httpPort || 9200}`,
					`transport.port: ${n.transportPort || 9300}`,
					`discovery.seed_hosts: [${seeds.map((s) => `"${s}"`).join(", ")}]`
				];
				if (clusterForm.bootstrap) lines.push("# 仅首次启动、且该节点数据目录为空时才保留下面这行；集群形成后必须删掉再重启：", `cluster.initial_master_nodes: [${masters.map((m) => `"${m}"`).join(", ")}]`);
				lines.push("# ES 8 默认开启安全：所有节点要共用同一份证书与口令（xpack.security.*），否则无法组成同一集群");
				return {
					title: `${n.name.trim()}（${n.host.trim()}）`,
					yaml: lines.join("\n")
				};
			});
			message.success(`已生成 ${clusterSnippets.value.length} 个节点的配置片段`);
		}
		/**
		* 复制文本：优先 Clipboard API，失败（无权限 / 非安全上下文）回落 textarea + execCommand。
		*
		* @param text  要复制的内容
		* @param label 成功提示里显示的来源名
		*/
		async function copyText(text, label) {
			let ok = false;
			try {
				if (navigator.clipboard?.writeText) {
					await navigator.clipboard.writeText(text);
					ok = true;
				}
			} catch {
				ok = false;
			}
			if (!ok) try {
				const ta = document.createElement("textarea");
				ta.value = text;
				ta.style.position = "fixed";
				ta.style.opacity = "0";
				document.body.appendChild(ta);
				ta.select();
				ok = document.execCommand("copy");
				document.body.removeChild(ta);
			} catch {
				ok = false;
			}
			if (ok) message.success(`${label} 已复制`);
			else message.warning("浏览器拒绝访问剪贴板，请手动全选复制");
		}
		async function copyAllClusterSnippets() {
			if (clusterSnippets.value.length === 0) return;
			await copyText(clusterSnippets.value.map((s) => s.yaml).join("\n\n"), `全部 ${clusterSnippets.value.length} 个节点`);
		}
		/** 用当前连接的集群名回填（省得手抄），没读到就提示手填 */
		async function prefillClusterForm() {
			if (!cluster.value) await loadNodesTab();
			const name = cluster.value?.clusterName || "";
			if (name) {
				clusterForm.clusterName = name;
				message.success(`已回填集群名 ${name}`);
			} else message.warning("没读到集群名，请手动填写");
			if (clusterForm.nodes.length === 0) addClusterNode();
		}
		const queryIndex = ref("");
		const queryKeyword = ref("");
		const queryLoading = ref(false);
		const queryResult = ref(null);
		/** DevTools 命令类型 */
		const devToolCmd = ref("GET");
		const devToolIndex = ref("");
		const devToolDsl = ref("");
		const devToolResult = ref(null);
		const devToolError = ref("");
		const devToolLoading = ref(false);
		const devToolTime = ref(0);
		const devToolHistory = ref([]);
		const devToolFullscreen = ref(false);
		const devToolCmdOptions = [
			{
				label: "GET",
				value: "GET"
			},
			{
				label: "POST",
				value: "POST"
			},
			{
				label: "PUT",
				value: "PUT"
			},
			{
				label: "DELETE",
				value: "DELETE"
			}
		];
		const devToolPlaceholder = computed(() => {
			const cmd = devToolCmd.value;
			const idx = devToolIndex.value || "<index>";
			return {
				GET: `GET ${idx}/_search\n{\n  "query": { "match_all": {} }\n}`,
				POST: `POST ${idx}/_doc\n{\n  "field": "value"\n}`,
				PUT: `PUT ${idx}/_settings\n{\n  "index": { "number_of_replicas": 1 }\n}`,
				DELETE: `DELETE ${idx}/_doc/<_id>`
			}[cmd];
		});
		/** 快捷模板 */
		const devToolTemplates = [
			{
				label: "match_all",
				cmd: "GET",
				dsl: "{\n  \"query\": { \"match_all\": {} }\n}"
			},
			{
				label: "term 查询",
				cmd: "GET",
				dsl: "{\n  \"query\": { \"term\": { \"<field>\": \"<value>\" } }\n}"
			},
			{
				label: "multi_match",
				cmd: "GET",
				dsl: "{\n  \"query\": { \"multi_match\": { \"query\": \"\", \"fields\": [] } }\n}"
			},
			{
				label: "bool-must",
				cmd: "GET",
				dsl: "{\n  \"query\": { \"bool\": { \"must\": [] } }\n}"
			},
			{
				label: "aggs-sum",
				cmd: "GET",
				dsl: "{\n  \"aggs\": { \"my_sum\": { \"sum\": { \"field\": \"<field>\" } } }\n}"
			},
			{
				label: "aggs-date_histogram",
				cmd: "GET",
				dsl: "{\n  \"aggs\": { \"over_time\": { \"date_histogram\": { \"field\": \"@timestamp\", \"calendar_interval\": \"day\" } } }\n}"
			},
			{
				label: "scroll",
				cmd: "GET",
				dsl: "{\n  \"query\": { \"match_all\": {} },\n  \"sort\": [\"_doc\"]\n}"
			},
			{
				label: "bulk",
				cmd: "POST",
				dsl: "{ \"index\": { \"_index\": \"\", \"_id\": \"\" } }\n{ \"field\": \"value\" }"
			}
		];
		async function runDevTool() {
			const dsl = devToolDsl.value.trim();
			if (!dsl) {
				message.warning("请输入 DSL 语句");
				return;
			}
			const cmd = devToolCmd.value;
			const idx = devToolIndex.value;
			devToolLoading.value = true;
			devToolResult.value = null;
			devToolError.value = "";
			const t0 = Date.now();
			try {
				const res = await fetchEsRawQuery(cmd, idx || "_search", dsl, datasourceId.value ?? 0);
				try {
					devToolResult.value = JSON.parse(res);
				} catch {
					devToolResult.value = res;
				}
				devToolTime.value = Date.now() - t0;
				const entry = {
					cmd,
					index: idx,
					dsl
				};
				const prev = devToolHistory.value.findIndex((h) => h.dsl === dsl);
				if (prev >= 0) devToolHistory.value.splice(prev, 1);
				devToolHistory.value.unshift(entry);
				if (devToolHistory.value.length > 50) devToolHistory.value.pop();
			} catch (e) {
				devToolError.value = e instanceof Error ? e.message : String(e);
				devToolTime.value = Date.now() - t0;
			} finally {
				devToolLoading.value = false;
			}
		}
		function applyDevToolHistory(h) {
			devToolCmd.value = h.cmd;
			devToolIndex.value = h.index;
			devToolDsl.value = h.dsl;
		}
		function applyTemplate(t) {
			devToolCmd.value = t.cmd;
			devToolDsl.value = t.dsl;
		}
		function insertTab(e) {
			const el = e.target;
			const s = el.selectionStart;
			const e2 = el.selectionEnd;
			devToolDsl.value = devToolDsl.value.slice(0, s) + "  " + devToolDsl.value.slice(e2);
			nextTick(() => {
				el.selectionStart = el.selectionEnd = s + 2;
			});
		}
		const clusterVisible = ref(false);
		const clusterLoading = ref(false);
		const shards = ref([]);
		const settingKey = ref("");
		const settingValue = ref("");
		const settingSaving = ref(false);
		const fieldDrawerVisible = ref(false);
		const fieldDrawerLoading = ref(false);
		const fieldDetail = ref(null);
		const indexDialogVisible = ref(false);
		const indexDialogMode = ref("create");
		const indexSaving = ref(false);
		/** 字段管理模式下，进入弹窗时从 mapping 快照下来的原始字段；保存时据此 diff 判定走哪条路 */
		const originalFields = ref([]);
		/** 字段管理模式打开时的加载态（要先拉一次现有字段） */
		const indexDialogLoading = ref(false);
		const indexForm = reactive({
			name: "",
			shards: 1,
			replicas: 0,
			fields: []
		});
		const fieldTypeOptions = [
			"keyword",
			"text",
			"long",
			"integer",
			"short",
			"byte",
			"double",
			"float",
			"date",
			"boolean",
			"object",
			"nested",
			"ip",
			"geo_point"
		].map((t) => ({
			label: t,
			value: t
		}));
		const capabilityText = computed(() => {
			const c = capability.value;
			if (!c) return "未加载";
			const parts = [];
			if (c.topNodeSupported) parts.push("索引浏览");
			if (c.childNodeSupported) parts.push("字段浏览");
			if (c.querySupported) parts.push("只读检索");
			if (c.documentSupported) parts.push("文档详情");
			return parts.join(" / ") || "未声明";
		});
		const indexColumns = [
			{
				prop: "name",
				label: "索引名",
				minWidth: 220
			},
			{
				prop: "health",
				label: "健康度",
				width: 110,
				slot: "col-health"
			},
			{
				prop: "status",
				label: "状态",
				width: 100
			},
			{
				prop: "docs",
				label: "文档数",
				width: 110
			},
			{
				prop: "storeSize",
				label: "存储",
				width: 110
			},
			{
				prop: "actions",
				label: "操作",
				width: 150,
				fixed: "right",
				slot: "col-actions"
			}
		];
		const nodeColumns = [
			{
				prop: "name",
				label: "节点名",
				minWidth: 180
			},
			{
				prop: "ip",
				label: "地址",
				minWidth: 150
			},
			{
				prop: "roles",
				label: "角色",
				minWidth: 140
			},
			{
				prop: "master",
				label: "Master",
				width: 100,
				slot: "col-master"
			},
			{
				prop: "heapPercent",
				label: "堆使用",
				width: 90
			},
			{
				prop: "cpu",
				label: "CPU",
				width: 150,
				slot: "col-cpu"
			},
			{
				prop: "load",
				label: "负载",
				width: 90
			},
			{
				prop: "version",
				label: "版本",
				width: 100
			}
		];
		const shardColumns = [
			{
				prop: "index",
				label: "索引",
				minWidth: 180
			},
			{
				prop: "shard",
				label: "分片",
				width: 80
			},
			{
				prop: "prirep",
				label: "主/副",
				width: 80
			},
			{
				prop: "state",
				label: "状态",
				width: 120
			},
			{
				prop: "docs",
				label: "文档数",
				width: 100
			},
			{
				prop: "store",
				label: "存储",
				width: 100
			},
			{
				prop: "node",
				label: "节点",
				minWidth: 160
			}
		];
		const fieldColumns = [
			{
				prop: "name",
				label: "字段名",
				minWidth: 180
			},
			{
				prop: "type",
				label: "类型",
				width: 110
			},
			{
				prop: "analyzer",
				label: "分词器",
				minWidth: 120
			},
			{
				prop: "format",
				label: "日期格式",
				minWidth: 120
			},
			{
				prop: "index",
				label: "建索引",
				width: 90,
				slot: "col-index"
			}
		];
		const settingColumns = [{
			prop: "key",
			label: "设置项",
			minWidth: 320
		}, {
			prop: "value",
			label: "有效值",
			minWidth: 240
		}];
		const filteredIndices = computed(() => {
			const kw = indexFilter.value.trim().toLowerCase();
			return kw ? indices.value.filter((i) => String(i.name || "").toLowerCase().includes(kw)) : indices.value;
		});
		const clusterNodes = computed(() => cluster.value?.nodes || []);
		/**
		* 节点表行：在原行上补齐 CPU 进度条需要的数值与色带。
		*
		* <p>后端 CPU 取自 ES {@code _cat/nodes} 的 cpu 列，是「整数百分比字符串」
		* （"3" 即 3%），不是分数，故按 0-100 直接当百分比用。</p>
		*/
		const nodeRows = computed(() => clusterNodes.value.map((node) => ({
			...node,
			cpuPct: cpuPercent(node.cpu),
			cpuTone: cpuTone(node.cpu)
		})));
		const indexOptions = computed(() => indices.value.map((i) => ({
			label: i.name,
			value: i.name
		})));
		const queryPlaceholder = computed(() => capability.value?.queryHint || "输入检索：留空索引则按原始表达式，如 search <index> <查询>");
		const queryColumns = computed(() => (queryResult.value?.columns || []).map((c) => ({
			prop: c,
			label: c,
			minWidth: 140
		})));
		const queryEmptyText = computed(() => queryResult.value?.message ? `检索未返回数据：${queryResult.value.message}` : "执行检索后显示结果");
		const fieldDrawerTitle = computed(() => `索引字段 - ${fieldDetail.value?.name || ""}`);
		const indexDialogTitle = computed(() => indexDialogMode.value === "create" ? "新建索引（设计表）" : `字段管理（增 / 删 / 改）- ${indexForm.name}`);
		/** 设置项键列表，供集群信息里选择后编辑 */
		const settingKeyOptions = computed(() => {
			const settings = cluster.value?.settings || {};
			return Object.keys(settings).map((k) => ({
				label: k,
				value: k
			}));
		});
		/** 集群设置表格：只展示前若干项，避免 781 项一次性渲染卡顿 */
		const filteredSettings = computed(() => {
			const settings = cluster.value?.settings || {};
			return Object.entries(settings).slice(0, 200).map(([key, value]) => ({
				key,
				value: String(value)
			}));
		});
		const graphNodes = computed(() => {
			const info = cluster.value;
			if (!info) return [];
			return [{
				id: "cluster",
				label: info.clusterName || "集群",
				type: "circle",
				size: 58,
				group: "cluster",
				data: {
					kind: "cluster",
					status: info.status
				},
				style: {
					fill: "#409eff",
					stroke: "#409eff",
					labelText: info.clusterName || "集群"
				}
			}, ...(info.nodes || []).map((n) => ({
				id: `node:${n.name}`,
				label: n.name,
				type: "circle",
				size: 44,
				group: n.master === "*" ? "master" : "node",
				data: {
					kind: "node",
					...n
				},
				style: {
					fill: n.master === "*" ? "#e6a23c" : "#00bfb3",
					stroke: n.master === "*" ? "#e6a23c" : "#00bfb3",
					labelText: n.name
				}
			}))];
		});
		const graphEdges = computed(() => (cluster.value?.nodes || []).map((n) => ({
			id: `cluster->node:${n.name}`,
			source: "cluster",
			target: `node:${n.name}`,
			label: n.master === "*" ? "master" : "node",
			animated: n.master === "*",
			style: {
				stroke: n.master === "*" ? "#e6a23c" : "#00bfb3",
				endArrow: true
			}
		})));
		/** 悬浮中的节点（详情固定渲染在图区右下角，避免与右上角工具栏/节点重叠） */
		const graphHover = ref(null);
		function onGraphNodeHover(node) {
			graphHover.value = node ? {
				label: node.label,
				...node.data || {}
			} : null;
		}
		function healthTag(health) {
			if (health === "green") return "success";
			if (health === "yellow") return "warning";
			if (health === "red") return "danger";
			return "info";
		}
		/** 节点 CPU 进度条色带（阈值与监控台其它页面同口径） */
		function cpuPercent(value) {
			if (value == null || String(value).trim() === "") return null;
			const n = Number(String(value).replace("%", "").trim());
			if (!Number.isFinite(n)) return null;
			return Math.max(0, Math.min(100, n));
		}
		/**
		* CPU 进度条色带：&lt;60 正常 / 60-84 偏高 / ≥85 危险。
		*
		* @param value CPU 原值
		* @returns 色带标识
		*/
		function cpuTone(value) {
			const pct = cpuPercent(value);
			if (pct === null) return "ok";
			if (pct >= 85) return "danger";
			if (pct >= 60) return "warn";
			return "ok";
		}
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
				capability.value = await fetchEsCapability();
				if (source.value && !gap.value) ready();
			} catch (e) {
				showError(e, "/ms/monitor/middleware/capability");
			} finally {
				capabilityLoading.value = false;
			}
		}
		async function testConnection() {
			if (!datasourceId.value) return;
			testing.value = true;
			try {
				const res = await testEsConnection(datasourceId.value);
				testResult.value = {
					version: res.version,
					detail: res.detail
				};
				if (res.connected) message.success(`Elasticsearch 连接正常${res.detail ? `：${res.detail}` : ""}`);
				else message.error(`Elasticsearch 连接失败：${res.message}`);
			} catch (e) {
				showError(e, "/ms/monitor/middleware/test");
			} finally {
				testing.value = false;
			}
		}
		async function loadIndices() {
			if (!datasourceId.value) return;
			loading.value = true;
			try {
				indices.value = await fetchEsIndices(datasourceId.value) || [];
				if (source.value && !gap.value) ready();
			} catch (e) {
				showError(e, "/ms/monitor/elasticsearch/indices");
			} finally {
				loading.value = false;
			}
		}
		async function removeIndex(row) {
			try {
				await ElMessageBox.confirm(`确认删除索引「${row.name}」？该操作不可恢复`, "删除索引", {
					type: "warning",
					confirmButtonText: "删除",
					cancelButtonText: "取消"
				});
			} catch {
				return;
			}
			try {
				await deleteEsIndex(row.name, datasourceId.value);
				message.success(`索引 ${row.name} 已删除`);
				await loadIndices();
			} catch (e) {
				showError(e, "/ms/monitor/elasticsearch/index");
			}
		}
		async function openFieldDrawer(row) {
			fieldDrawerVisible.value = true;
			fieldDrawerLoading.value = true;
			fieldDetail.value = null;
			try {
				fieldDetail.value = await fetchEsIndexDetail(row.name, datasourceId.value);
			} catch (e) {
				showError(e, "/ms/monitor/elasticsearch/index");
				fieldDrawerVisible.value = false;
			} finally {
				fieldDrawerLoading.value = false;
			}
		}
		function addFieldRow() {
			indexForm.fields.push({
				name: "",
				type: "keyword",
				analyzer: "",
				format: "",
				index: true
			});
		}
		function removeFieldRow(idx) {
			indexForm.fields.splice(idx, 1);
		}
		function openCreateIndex() {
			indexDialogMode.value = "create";
			indexForm.name = "";
			indexForm.shards = 1;
			indexForm.replicas = 0;
			indexForm.fields = [];
			addFieldRow();
			indexDialogVisible.value = true;
		}
		/** 该字段是否已存在于当前索引的 mapping（用于行内标记，并决定保存走哪条路） */
		function isOriginalField(name) {
			if (!name) return false;
			return originalFields.value.some((f) => f.name === name);
		}
		/** 判断两个 EsField 是否有实质性差异（任意一项不同都视为改动，需重建索引） */
		function fieldChanged(orig, cur) {
			const ov = (v) => v == null ? "" : String(v);
			return ov(orig.type) !== ov(cur.type) || ov(orig.analyzer) !== ov(cur.analyzer) || ov(orig.format) !== ov(cur.format) || orig.index !== false !== (cur.index !== false) || ov(orig.copyTo) !== ov(cur.copyTo) || ov(orig.normalizer) !== ov(cur.normalizer) || (orig.docValues ?? true) !== (cur.docValues ?? true) || (orig.sparse ?? false) !== (cur.sparse ?? false) || orig.dimension !== cur.dimension || (orig.eagerGlobalOrdinals ?? false) !== (cur.eagerGlobalOrdinals ?? false) || ov(orig.script) !== ov(cur.script) || ov(orig.similarity) !== ov(cur.similarity) || ov(orig.termVector) !== ov(cur.termVector) || (orig.ignoreAbove ?? 2147483647) !== (cur.ignoreAbove ?? 2147483647);
		}
		/**
		* 打开字段管理：先加载索引现有字段，再在其基础上增 / 删 / 改
		*
		* <p>ES 不能原地删字段，也不能改已存在字段的类型；保存时按 diff 自动分流：
		* 仅新增走 {@link addEsMapping}，含删除 / 改动走 {@link rebuildEsIndex}。</p>
		*/
		async function openFieldManager(name) {
			if (!name || !datasourceId.value) return;
			fieldDrawerVisible.value = false;
			indexDialogMode.value = "fields";
			indexForm.name = name;
			indexForm.shards = 1;
			indexForm.replicas = 0;
			indexForm.fields = [];
			originalFields.value = [];
			indexDialogVisible.value = true;
			indexDialogLoading.value = true;
			try {
				const detail = await fetchEsIndexDetail(name, datasourceId.value);
				originalFields.value = (detail.fields ?? []).map((f) => ({ ...f }));
				indexForm.fields = (detail.fields ?? []).map((f) => ({ ...f }));
				indexForm.shards = detail.shards ?? 1;
				indexForm.replicas = detail.replicas ?? 0;
			} catch (e) {
				showError(e, "/ms/monitor/elasticsearch/index");
				indexDialogVisible.value = false;
			} finally {
				indexDialogLoading.value = false;
			}
		}
		async function saveIndex() {
			const name = indexForm.name.trim();
			if (!name) {
				message.warning("请输入索引名");
				return;
			}
			const fields = indexForm.fields.filter((f) => f.name.trim());
			if (fields.length === 0) {
				message.warning("至少填写一个字段");
				return;
			}
			let target = "create";
			if (indexDialogMode.value !== "create") {
				const origByName = new Map(originalFields.value.map((f) => [f.name, f]));
				const curByName = new Map(fields.map((f) => [f.name, f]));
				const added = fields.filter((f) => !origByName.has(f.name));
				const removed = originalFields.value.filter((f) => !curByName.has(f.name));
				const modified = fields.filter((f) => {
					const orig = origByName.get(f.name);
					if (!orig) return false;
					return fieldChanged(orig, f);
				});
				if (removed.length > 0 || modified.length > 0) {
					target = "rebuild";
					try {
						await ElMessageBox.confirm(`索引「${name}」：将删除 ${removed.length} 个字段、改动 ${modified.length} 个字段。ES 无法原地删除字段或修改已存在字段的类型，必须重建索引（建临时索引 → 搬运数据 → 换回同名索引），重建期间原索引短暂不可用，耗时与数据量成正比。确定继续？`, "需要重建索引", {
							type: "warning",
							confirmButtonText: "重建并生效",
							cancelButtonText: "再想想"
						});
					} catch {
						return;
					}
				} else if (added.length > 0) target = "mapping";
				else {
					message.info("字段没有变化");
					return;
				}
			}
			indexSaving.value = true;
			try {
				if (target === "create") {
					await createEsIndex({
						name,
						shards: indexForm.shards,
						replicas: indexForm.replicas,
						fields,
						datasourceId: datasourceId.value
					});
					message.success(`索引 ${name} 创建成功`);
				} else if (target === "mapping") {
					await addEsMapping({
						index: name,
						fields,
						datasourceId: datasourceId.value
					});
					message.success(`索引 ${name} 追加字段成功`);
				} else {
					await rebuildEsIndex({
						name,
						shards: indexForm.shards,
						replicas: indexForm.replicas,
						fields,
						datasourceId: datasourceId.value
					});
					message.success(`索引 ${name} 已按新 mapping 重建完成`);
				}
				indexDialogVisible.value = false;
				originalFields.value = [];
				await loadIndices();
				if (fieldDrawerVisible.value && fieldDetail.value?.name === name) fieldDetail.value = await fetchEsIndexDetail(name, datasourceId.value);
			} catch (e) {
				showError(e, "/ms/monitor/elasticsearch/index");
			} finally {
				indexSaving.value = false;
			}
		}
		async function loadNodesTab() {
			if (!datasourceId.value) return;
			nodesLoading.value = true;
			try {
				cluster.value = await fetchEsCluster(datasourceId.value);
			} catch (e) {
				showError(e, "/ms/monitor/elasticsearch/cluster");
			} finally {
				nodesLoading.value = false;
			}
		}
		async function loadGraphTab() {
			if (!datasourceId.value) return;
			graphLoading.value = true;
			try {
				cluster.value = await fetchEsCluster(datasourceId.value);
			} catch (e) {
				showError(e, "/ms/monitor/elasticsearch/cluster");
			} finally {
				graphLoading.value = false;
			}
		}
		async function runQuery() {
			const index = queryIndex.value;
			const keyword = queryKeyword.value.trim();
			const expression = index ? `search ${index} ${keyword}`.trim() : keyword;
			if (!expression) {
				message.warning("请输入检索内容");
				return;
			}
			if (!datasourceId.value) return;
			queryLoading.value = true;
			try {
				const res = await queryEs(expression, datasourceId.value);
				queryResult.value = res;
				if (res.message) message.error(res.message);
			} catch (e) {
				showError(e, "/ms/monitor/middleware/query");
			} finally {
				queryLoading.value = false;
			}
		}
		async function openCluster() {
			clusterVisible.value = true;
			clusterLoading.value = true;
			try {
				const [info, shardRows] = await Promise.all([fetchEsCluster(datasourceId.value), fetchEsShards(datasourceId.value)]);
				cluster.value = info;
				shards.value = shardRows || [];
			} catch (e) {
				showError(e, "/ms/monitor/elasticsearch/cluster");
			} finally {
				clusterLoading.value = false;
			}
		}
		async function saveClusterSetting() {
			const key = settingKey.value.trim();
			if (!key) {
				message.warning("请选择要修改的设置项");
				return;
			}
			const blocked = staticSettingReason(key);
			if (blocked) {
				message.warning(blocked);
				return;
			}
			settingSaving.value = true;
			try {
				cluster.value = await updateEsClusterSettings({
					datasourceId: datasourceId.value,
					persistent: { [key]: settingValue.value }
				});
				message.success(`集群设置 ${key} 已更新`);
			} catch (e) {
				showError(e, "/ms/monitor/elasticsearch/cluster/settings");
			} finally {
				settingSaving.value = false;
			}
		}
		async function refresh() {
			await loadCapability();
			if (!datasourceId.value) return;
			if (activeTab.value === "overview") await loadIndices();
			else if (activeTab.value === "nodes") await loadNodesTab();
			else if (activeTab.value === "graph") await loadGraphTab();
		}
		watch(activeTab, async (tab) => {
			if (!datasourceId.value) return;
			if (tab === "nodes" && !cluster.value) await loadNodesTab();
			if (tab === "graph" && !cluster.value) await loadGraphTab();
			if (tab === "overview" && indices.value.length === 0) await loadIndices();
			if (tab === "clusterCfg") {
				if (!clusterForm.clusterName) {
					if (!cluster.value) await loadNodesTab();
					clusterForm.clusterName = cluster.value?.clusterName || "";
				}
				if (clusterForm.nodes.length === 0) addClusterNode();
			}
		});
		onMounted(async () => {
			await bind("elasticsearch");
			await loadCapability();
			if (datasourceId.value) await loadIndices();
		});
		return (_ctx, _cache) => {
			const _directive_loading = resolveDirective("loading");
			return openBlock(), createElementBlock("div", _hoisted_1, [
				createBaseVNode("div", _hoisted_2, [createBaseVNode("div", _hoisted_3, [createVNode(unref(component$1), {
					name: "Coin",
					size: 18,
					class: "dsm-title-icon dsm-es-icon"
				}), _cache[24] || (_cache[24] = createBaseVNode("span", { class: "dsm-title" }, "Elasticsearch 搜索引擎管理", -1))]), createBaseVNode("div", _hoisted_4, [
					createVNode(unref(ReButton_default), {
						layout: "square",
						tip: "集群信息",
						icon: "Monitor",
						"data-testid": "es-btn-cluster",
						disabled: !unref(source),
						loading: clusterLoading.value,
						onClick: openCluster
					}, null, 8, ["disabled", "loading"]),
					createVNode(unref(ReButton_default), {
						layout: "square",
						tip: "能力声明",
						icon: "Setting",
						"data-testid": "es-btn-capability",
						loading: capabilityLoading.value,
						onClick: loadCapability
					}, null, 8, ["loading"]),
					createVNode(unref(ReButton_default), {
						layout: "square",
						tip: "测试连接",
						icon: "Connection",
						"data-testid": "es-btn-test",
						disabled: !unref(source),
						loading: testing.value,
						onClick: testConnection
					}, null, 8, ["disabled", "loading"]),
					createVNode(unref(ReButton_default), {
						layout: "square",
						tip: "刷新",
						icon: "Refresh",
						"data-testid": "es-btn-refresh",
						loading: loading.value,
						onClick: refresh
					}, null, 8, ["loading"]),
					createVNode(unref(ReButton_default), {
						layout: "square",
						type: "primary",
						tip: "新建索引",
						icon: "Plus",
						"data-testid": "es-btn-create",
						disabled: !unref(source),
						onClick: openCreateIndex
					}, null, 8, ["disabled"])
				])]),
				createVNode(MiddlewareGap_default, {
					text: unref(gap),
					onRetry: refresh
				}, null, 8, ["text"]),
				!unref(gap) ? (openBlock(), createElementBlock("div", _hoisted_5, [createBaseVNode("div", _hoisted_6, [createBaseVNode("div", _hoisted_7, [
					createBaseVNode("div", _hoisted_8, [_cache[25] || (_cache[25] = createBaseVNode("span", { class: "dsm-info-label" }, "数据源", -1)), createBaseVNode("span", _hoisted_9, toDisplayString(unref(source) ? unref(source).name : "未选择"), 1)]),
					createBaseVNode("div", _hoisted_10, [_cache[26] || (_cache[26] = createBaseVNode("span", { class: "dsm-info-label" }, "连接地址", -1)), createBaseVNode("span", _hoisted_11, toDisplayString(unref(source) ? `${unref(source).host}:${unref(source).port || 9200}` : "—"), 1)]),
					createBaseVNode("div", _hoisted_12, [_cache[27] || (_cache[27] = createBaseVNode("span", { class: "dsm-info-label" }, "能力", -1)), createBaseVNode("span", _hoisted_13, toDisplayString(capabilityText.value), 1)]),
					createBaseVNode("div", _hoisted_14, [_cache[28] || (_cache[28] = createBaseVNode("span", { class: "dsm-info-label" }, "版本", -1)), createBaseVNode("span", _hoisted_15, toDisplayString(testResult.value.version || "未测试"), 1)]),
					createBaseVNode("div", _hoisted_16, [_cache[29] || (_cache[29] = createBaseVNode("span", { class: "dsm-info-label" }, "连接详情", -1)), createBaseVNode("span", _hoisted_17, toDisplayString(testResult.value.detail || "未测试"), 1)])
				]), createVNode(unref(ReTab_default), {
					modelValue: activeTab.value,
					"onUpdate:modelValue": _cache[13] || (_cache[13] = ($event) => activeTab.value = $event),
					tabs,
					"data-testid": "es-tabs"
				}, {
					overview: withCtx(() => [createBaseVNode("div", _hoisted_18, [
						createBaseVNode("div", _hoisted_19, [createBaseVNode("span", null, "索引概览（" + toDisplayString(filteredIndices.value.length) + " / " + toDisplayString(indices.value.length) + "）", 1), createBaseVNode("div", _hoisted_20, [
							createVNode(unref(ReInput_default), {
								modelValue: indexFilter.value,
								"onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => indexFilter.value = $event),
								placeholder: "过滤索引名",
								class: "dsm-filter",
								"data-testid": "es-index-filter"
							}, null, 8, ["modelValue"]),
							createVNode(unref(ReButton_default), {
								layout: "square",
								icon: "Refresh",
								tip: "刷新索引",
								"data-testid": "es-index-refresh",
								loading: loading.value,
								onClick: loadIndices
							}, null, 8, ["loading"]),
							createVNode(unref(ReButton_default), {
								layout: "square",
								type: "primary",
								icon: "Plus",
								tip: "新建索引（设计表）",
								"data-testid": "es-index-create",
								disabled: !unref(source),
								onClick: openCreateIndex
							}, null, 8, ["disabled"])
						])]),
						createVNode(unref(ReTable_default), {
							data: filteredIndices.value,
							columns: indexColumns,
							loading: loading.value,
							pagination: false,
							stripe: "",
							border: "",
							height: "420px"
						}, {
							"col-health": withCtx(({ row }) => [createVNode(unref(component$2), { type: healthTag(row.health) }, {
								default: withCtx(() => [createTextVNode(toDisplayString(row.health || "—"), 1)]),
								_: 2
							}, 1032, ["type"])]),
							"col-actions": withCtx(({ row }) => [createBaseVNode("span", {
								class: "dsm-row-actions",
								onClick: _cache[1] || (_cache[1] = withModifiers(() => {}, ["stop"]))
							}, [
								createVNode(unref(ReButton_default), {
									layout: "square",
									size: "small",
									icon: "View",
									tip: "字段",
									"data-testid": "es-row-fields",
									onClick: ($event) => openFieldDrawer(row)
								}, null, 8, ["onClick"]),
								createVNode(unref(ReButton_default), {
									layout: "square",
									size: "small",
									type: "primary",
									icon: "Edit",
									tip: "管理字段（增 / 删 / 改）",
									"data-testid": "es-row-fieldsmgr",
									onClick: ($event) => openFieldManager(row.name)
								}, null, 8, ["onClick"]),
								createVNode(unref(ReButton_default), {
									layout: "square",
									size: "small",
									type: "danger",
									icon: "Delete",
									tip: "删除索引（删表）",
									"data-testid": "es-row-delete",
									onClick: ($event) => removeIndex(row)
								}, null, 8, ["onClick"])
							])]),
							_: 1
						}, 8, ["data", "loading"]),
						!loading.value && indices.value.length === 0 ? (openBlock(), createBlock(unref(ReEmpty_default), {
							key: 0,
							description: "未读取到索引，可点右上角「新建索引」创建"
						})) : createCommentVNode("", true)
					])]),
					nodes: withCtx(() => [createBaseVNode("div", _hoisted_21, [
						createBaseVNode("div", _hoisted_22, [createBaseVNode("span", null, "节点列表（" + toDisplayString(clusterNodes.value.length) + "）", 1), createBaseVNode("div", _hoisted_23, [createVNode(unref(ReButton_default), {
							layout: "square",
							icon: "Refresh",
							tip: "刷新节点",
							"data-testid": "es-nodes-refresh",
							loading: nodesLoading.value,
							onClick: loadNodesTab
						}, null, 8, ["loading"])])]),
						createVNode(unref(ReTable_default), {
							data: nodeRows.value,
							columns: nodeColumns,
							loading: nodesLoading.value,
							pagination: false,
							stripe: "",
							border: "",
							height: "420px"
						}, {
							"col-master": withCtx(({ row }) => [row.master === "*" ? (openBlock(), createBlock(unref(component$2), {
								key: 0,
								type: "warning"
							}, {
								default: withCtx(() => [..._cache[30] || (_cache[30] = [createTextVNode("master", -1)])]),
								_: 1
							})) : (openBlock(), createElementBlock("span", _hoisted_24, "—"))]),
							"col-cpu": withCtx(({ row }) => [createBaseVNode("div", _hoisted_25, [createBaseVNode("span", _hoisted_26, [createBaseVNode("span", {
								class: normalizeClass(["dsm-meter__fill", `is-${row.cpuTone}`]),
								style: normalizeStyle({ width: `${row.cpuPct ?? 0}%` })
							}, null, 6)]), createBaseVNode("span", _hoisted_27, toDisplayString(row.cpuPct === null ? "—" : `${row.cpuPct}%`), 1)])]),
							_: 1
						}, 8, ["data", "loading"]),
						!nodesLoading.value && clusterNodes.value.length === 0 ? (openBlock(), createBlock(unref(ReEmpty_default), {
							key: 0,
							description: "未读取到节点，点「节点列表」右侧刷新重试"
						})) : createCommentVNode("", true)
					])]),
					clusterCfg: withCtx(() => [createBaseVNode("div", _hoisted_28, [
						createBaseVNode("div", _hoisted_29, [_cache[31] || (_cache[31] = createBaseVNode("span", null, "集群纳管（生成各节点 elasticsearch.yml）", -1)), createBaseVNode("div", _hoisted_30, [createVNode(unref(ReButton_default), {
							layout: "square",
							icon: "Refresh",
							tip: "用当前连接的集群名回填",
							"data-testid": "es-cluster-prefill",
							onClick: prefillClusterForm
						})])]),
						createVNode(unref(ReAlert), {
							type: "info",
							closable: false,
							title: "ES 组集群是节点级「静态设置」：只能改每台机器的 elasticsearch.yml 再重启，REST 的 _cluster/settings 不接受（ES 会报 not dynamic）。所以这里只生成配置片段，不远程改配置。"
						}),
						createBaseVNode("div", _hoisted_31, [createBaseVNode("div", _hoisted_32, [_cache[32] || (_cache[32] = createBaseVNode("label", null, "集群名 cluster.name（各节点必须完全一致）", -1)), createVNode(unref(ReInput_default), {
							modelValue: clusterForm.clusterName,
							"onUpdate:modelValue": _cache[2] || (_cache[2] = ($event) => clusterForm.clusterName = $event),
							placeholder: "如 my-es-cluster",
							"data-testid": "es-cluster-name"
						}, null, 8, ["modelValue"])]), createBaseVNode("label", _hoisted_33, [createVNode(unref(ReSwitch_default), {
							modelValue: clusterForm.bootstrap,
							"onUpdate:modelValue": _cache[3] || (_cache[3] = ($event) => clusterForm.bootstrap = $event),
							"data-testid": "es-cluster-bootstrap"
						}, null, 8, ["modelValue"]), _cache[33] || (_cache[33] = createBaseVNode("span", null, "首次启动写入 cluster.initial_master_nodes（集群形成后必须删掉这一行再重启）", -1))])]),
						createBaseVNode("div", _hoisted_34, [createBaseVNode("span", _hoisted_35, "节点（" + toDisplayString(clusterForm.nodes.length) + "）", 1), createVNode(unref(ReButton_default), {
							layout: "square",
							icon: "Plus",
							tip: "添加节点",
							"data-testid": "es-cluster-add-node",
							onClick: addClusterNode
						})]),
						createBaseVNode("div", _hoisted_36, [
							_cache[34] || (_cache[34] = createBaseVNode("div", { class: "dsm-node-grid-head" }, [
								createBaseVNode("span", null, "节点名"),
								createBaseVNode("span", null, "主机"),
								createBaseVNode("span", null, "HTTP 端口"),
								createBaseVNode("span", null, "传输端口"),
								createBaseVNode("span", null, "角色"),
								createBaseVNode("span", null, "操作")
							], -1)),
							(openBlock(true), createElementBlock(Fragment, null, renderList(clusterForm.nodes, (n, idx) => {
								return openBlock(), createElementBlock("div", {
									key: idx,
									class: "dsm-node-grid-row"
								}, [
									createVNode(unref(ReInput_default), {
										modelValue: n.name,
										"onUpdate:modelValue": ($event) => n.name = $event,
										placeholder: "node-1",
										"data-testid": `es-cluster-node-name-${idx}`
									}, null, 8, [
										"modelValue",
										"onUpdate:modelValue",
										"data-testid"
									]),
									createVNode(unref(ReInput_default), {
										modelValue: n.host,
										"onUpdate:modelValue": ($event) => n.host = $event,
										placeholder: "10.0.0.11",
										"data-testid": `es-cluster-node-host-${idx}`
									}, null, 8, [
										"modelValue",
										"onUpdate:modelValue",
										"data-testid"
									]),
									createVNode(unref(ReInputNumber_default), {
										modelValue: n.httpPort,
										"onUpdate:modelValue": ($event) => n.httpPort = $event,
										min: 1,
										max: 65535,
										"data-testid": `es-cluster-node-http-${idx}`
									}, null, 8, [
										"modelValue",
										"onUpdate:modelValue",
										"data-testid"
									]),
									createVNode(unref(ReInputNumber_default), {
										modelValue: n.transportPort,
										"onUpdate:modelValue": ($event) => n.transportPort = $event,
										min: 1,
										max: 65535,
										"data-testid": `es-cluster-node-transport-${idx}`
									}, null, 8, [
										"modelValue",
										"onUpdate:modelValue",
										"data-testid"
									]),
									createVNode(unref(ReSelect_default), {
										modelValue: n.roles,
										"onUpdate:modelValue": ($event) => n.roles = $event,
										multiple: "",
										"collapse-tags": "",
										data: ROLE_OPTIONS,
										"data-testid": `es-cluster-node-roles-${idx}`
									}, null, 8, [
										"modelValue",
										"onUpdate:modelValue",
										"data-testid"
									]),
									createVNode(unref(ReButton_default), {
										layout: "square",
										size: "small",
										type: "danger",
										icon: "Delete",
										tip: "删除节点",
										"data-testid": `es-cluster-node-remove-${idx}`,
										onClick: ($event) => removeClusterNode(idx)
									}, null, 8, ["data-testid", "onClick"])
								]);
							}), 128)),
							clusterForm.nodes.length === 0 ? (openBlock(), createElementBlock("div", _hoisted_37, " 还没有节点，点右上角「+」添加；至少两台才能组成集群 ")) : createCommentVNode("", true)
						]),
						createBaseVNode("div", _hoisted_38, [createVNode(unref(ReButton_default), {
							type: "primary",
							icon: "MagicStick",
							"data-testid": "es-cluster-gen",
							onClick: buildClusterSnippets
						}, {
							default: withCtx(() => [..._cache[35] || (_cache[35] = [createTextVNode(" 生成配置 ", -1)])]),
							_: 1
						}), createVNode(unref(ReButton_default), {
							icon: "CopyDocument",
							disabled: clusterSnippets.value.length === 0,
							"data-testid": "es-cluster-copy-all",
							onClick: copyAllClusterSnippets
						}, {
							default: withCtx(() => [..._cache[36] || (_cache[36] = [createTextVNode(" 复制全部 ", -1)])]),
							_: 1
						}, 8, ["disabled"])]),
						clusterSnippets.value.length ? (openBlock(), createElementBlock("div", _hoisted_39, [(openBlock(true), createElementBlock(Fragment, null, renderList(clusterSnippets.value, (s, idx) => {
							return openBlock(), createElementBlock("div", {
								key: idx,
								class: "dsm-snippet re-surface"
							}, [createBaseVNode("div", _hoisted_40, [createBaseVNode("span", _hoisted_41, toDisplayString(s.title), 1), createVNode(unref(ReButton_default), {
								layout: "square",
								size: "small",
								icon: "CopyDocument",
								tip: "复制该节点配置",
								"data-testid": `es-cluster-copy-${idx}`,
								onClick: ($event) => copyText(s.yaml, s.title)
							}, null, 8, ["data-testid", "onClick"])]), createBaseVNode("pre", {
								class: "dsm-snippet-body",
								"data-testid": `es-cluster-snippet-${idx}`
							}, toDisplayString(s.yaml), 9, _hoisted_42)]);
						}), 128))])) : createCommentVNode("", true)
					])]),
					graph: withCtx(() => [createBaseVNode("div", _hoisted_43, [createBaseVNode("div", _hoisted_44, [_cache[37] || (_cache[37] = createBaseVNode("span", null, "关系图谱（集群 → 节点，同 zk 拓扑；橙色为 master，悬浮节点看详情）", -1)), createBaseVNode("div", _hoisted_45, [createVNode(unref(ReButton_default), {
						layout: "square",
						icon: "Refresh",
						tip: "刷新图谱",
						"data-testid": "es-graph-refresh",
						loading: graphLoading.value,
						onClick: loadGraphTab
					}, null, 8, ["loading"])])]), createBaseVNode("div", _hoisted_46, [createVNode(unref(component$4), {
						nodes: graphNodes.value,
						edges: graphEdges.value,
						layout: "radial",
						height: "460px",
						highlight: "adjacent",
						minimap: graphNodes.value.length > 2,
						"node-size": 38,
						"empty-text": "未取到集群节点",
						"data-testid": "es-graph",
						onNodeHover: onGraphNodeHover
					}, null, 8, [
						"nodes",
						"edges",
						"minimap"
					]), graphHover.value ? (openBlock(), createElementBlock("div", _hoisted_47, [createBaseVNode("div", _hoisted_48, toDisplayString(graphHover.value.label), 1), graphHover.value.kind === "cluster" ? (openBlock(), createElementBlock(Fragment, { key: 0 }, [
						_cache[38] || (_cache[38] = createBaseVNode("div", { class: "dsm-graph-tip-row" }, "类型：集群", -1)),
						createBaseVNode("div", _hoisted_49, "健康度：" + toDisplayString(graphHover.value.status || "—"), 1),
						createBaseVNode("div", _hoisted_50, "节点数：" + toDisplayString(cluster.value?.nodes?.length ?? 0), 1)
					], 64)) : (openBlock(), createElementBlock(Fragment, { key: 1 }, [
						createBaseVNode("div", _hoisted_51, "角色：" + toDisplayString(graphHover.value.master === "*" ? "master" : "node"), 1),
						createBaseVNode("div", _hoisted_52, "地址：" + toDisplayString(graphHover.value.ip || "—"), 1),
						createBaseVNode("div", _hoisted_53, "堆使用：" + toDisplayString(graphHover.value.heapPercent || "—") + " % · CPU " + toDisplayString(graphHover.value.cpu || "—") + " %", 1),
						createBaseVNode("div", _hoisted_54, "负载：" + toDisplayString(graphHover.value.load || "—") + " · 版本 " + toDisplayString(graphHover.value.version || "—"), 1)
					], 64))])) : createCommentVNode("", true)])])]),
					query: withCtx(() => [createBaseVNode("div", _hoisted_55, [
						createBaseVNode("div", _hoisted_56, [
							createVNode(unref(ReSelect_default), {
								modelValue: queryIndex.value,
								"onUpdate:modelValue": _cache[4] || (_cache[4] = ($event) => queryIndex.value = $event),
								data: indexOptions.value,
								placeholder: "选择索引（可留空走原始表达式）",
								class: "dsm-query-index",
								"data-testid": "es-query-index"
							}, null, 8, ["modelValue", "data"]),
							createVNode(unref(ReInput_default), {
								modelValue: queryKeyword.value,
								"onUpdate:modelValue": _cache[5] || (_cache[5] = ($event) => queryKeyword.value = $event),
								placeholder: queryPlaceholder.value,
								class: "dsm-query-input",
								"data-testid": "es-query-keyword",
								onKeyup: withKeys(runQuery, ["enter"])
							}, null, 8, ["modelValue", "placeholder"]),
							createVNode(unref(ReButton_default), {
								type: "primary",
								icon: "Search",
								loading: queryLoading.value,
								"data-testid": "es-query-run",
								onClick: runQuery
							}, {
								default: withCtx(() => [..._cache[39] || (_cache[39] = [createTextVNode(" 检索 ", -1)])]),
								_: 1
							}, 8, ["loading"])
						]),
						capability.value?.queryDescription ? (openBlock(), createBlock(unref(ReAlert), {
							key: 0,
							type: "info",
							closable: false,
							title: capability.value.queryDescription,
							class: "dsm-query-hint"
						}, null, 8, ["title"])) : createCommentVNode("", true),
						createBaseVNode("div", _hoisted_57, [createBaseVNode("div", _hoisted_58, [_cache[40] || (_cache[40] = createTextVNode(" 检索结果 ", -1)), queryResult.value ? (openBlock(), createElementBlock("span", _hoisted_59, [createTextVNode(toDisplayString(queryResult.value.rowCount) + " 行 · " + toDisplayString(queryResult.value.executionTimeMs) + " ms ", 1), queryResult.value.truncated ? (openBlock(), createElementBlock("span", _hoisted_60, " 已截断，服务端共 " + toDisplayString(queryResult.value.totalRows) + " 行，请收窄条件 ", 1)) : createCommentVNode("", true)])) : createCommentVNode("", true)]), queryResult.value && queryResult.value.columns.length > 0 ? (openBlock(), createBlock(unref(ReTable_default), {
							key: 0,
							data: queryResult.value.rows,
							columns: queryColumns.value,
							stripe: "",
							border: "",
							height: "380px"
						}, null, 8, ["data", "columns"])) : (openBlock(), createBlock(unref(ReEmpty_default), {
							key: 1,
							description: queryEmptyText.value
						}, null, 8, ["description"]))])
					])]),
					devtools: withCtx(() => [createBaseVNode("div", _hoisted_61, [createBaseVNode("aside", _hoisted_62, [
						createBaseVNode("div", _hoisted_63, [_cache[41] || (_cache[41] = createBaseVNode("span", null, "历史记录", -1)), devToolHistory.value.length > 0 ? (openBlock(), createBlock(unref(ReButton_default), {
							key: 0,
							size: "small",
							type: "danger",
							icon: "Delete",
							tip: "清空历史",
							layout: "square",
							onClick: _cache[6] || (_cache[6] = ($event) => devToolHistory.value.splice(0))
						})) : createCommentVNode("", true)]),
						devToolHistory.value.length === 0 ? (openBlock(), createElementBlock("div", _hoisted_64, " 暂无历史 ")) : createCommentVNode("", true),
						(openBlock(true), createElementBlock(Fragment, null, renderList(devToolHistory.value, (h, i) => {
							return openBlock(), createElementBlock("div", {
								key: i,
								class: "dsm-devtools-history-item",
								title: h.dsl,
								onClick: ($event) => applyDevToolHistory(h)
							}, [createBaseVNode("span", _hoisted_66, toDisplayString(h.cmd), 1), createBaseVNode("span", _hoisted_67, toDisplayString(h.index || "*"), 1)], 8, _hoisted_65);
						}), 128))
					]), createBaseVNode("div", _hoisted_68, [
						createBaseVNode("div", _hoisted_69, [
							createVNode(unref(ReSelect_default), {
								modelValue: devToolCmd.value,
								"onUpdate:modelValue": _cache[7] || (_cache[7] = ($event) => devToolCmd.value = $event),
								data: devToolCmdOptions,
								placeholder: "命令",
								class: "dsm-devtools-cmd",
								"data-testid": "es-devtools-cmd"
							}, null, 8, ["modelValue"]),
							createVNode(unref(ReSelect_default), {
								modelValue: devToolIndex.value,
								"onUpdate:modelValue": _cache[8] || (_cache[8] = ($event) => devToolIndex.value = $event),
								data: indexOptions.value,
								filterable: "",
								"allow-create": "",
								placeholder: "索引名（* 表示所有）",
								class: "dsm-devtools-idx",
								"data-testid": "es-devtools-idx"
							}, null, 8, ["modelValue", "data"]),
							createVNode(unref(ReButton_default), {
								type: "primary",
								icon: "VideoPlay",
								loading: devToolLoading.value,
								"data-testid": "es-devtools-run",
								onClick: runDevTool
							}, {
								default: withCtx(() => [..._cache[42] || (_cache[42] = [createTextVNode(" 运行 ", -1)])]),
								_: 1
							}, 8, ["loading"]),
							createVNode(unref(ReButton_default), {
								icon: "Delete",
								tip: "清空",
								layout: "square",
								onClick: _cache[9] || (_cache[9] = ($event) => {
									devToolDsl.value = "";
									devToolResult.value = null;
									devToolTime.value = 0;
								})
							})
						]),
						createBaseVNode("div", _hoisted_70, [createBaseVNode("div", _hoisted_71, toDisplayString(devToolPlaceholder.value), 1), withDirectives(createBaseVNode("textarea", {
							"onUpdate:modelValue": _cache[10] || (_cache[10] = ($event) => devToolDsl.value = $event),
							class: "dsm-devtools-editor",
							placeholder: devToolPlaceholder.value,
							spellcheck: "false",
							"data-testid": "es-devtools-dsl",
							onKeydown: withKeys(withModifiers(insertTab, ["prevent"]), ["tab"])
						}, null, 40, _hoisted_72), [[vModelText, devToolDsl.value]])]),
						createBaseVNode("div", _hoisted_73, [_cache[43] || (_cache[43] = createBaseVNode("span", { class: "dsm-devtools-templates-label" }, "快捷模板：", -1)), (openBlock(), createElementBlock(Fragment, null, renderList(devToolTemplates, (t) => {
							return createVNode(unref(ReButton_default), {
								key: t.label,
								size: "small",
								tip: t.label,
								layout: "square",
								onClick: ($event) => applyTemplate(t)
							}, {
								default: withCtx(() => [createTextVNode(toDisplayString(t.label), 1)]),
								_: 2
							}, 1032, ["tip", "onClick"]);
						}), 64))]),
						devToolResult.value || devToolError.value ? (openBlock(), createElementBlock("div", _hoisted_74, [createBaseVNode("div", _hoisted_75, [_cache[44] || (_cache[44] = createBaseVNode("span", null, "响应", -1)), createBaseVNode("span", _hoisted_76, [
							createTextVNode(toDisplayString(devToolTime.value) + " ms ", 1),
							devToolResult.value ? (openBlock(), createBlock(unref(ReButton_default), {
								key: 0,
								size: "small",
								icon: "DocumentCopy",
								tip: "复制 JSON",
								layout: "square",
								onClick: _cache[11] || (_cache[11] = ($event) => copyText(JSON.stringify(devToolResult.value, null, 2), "Dev Tools 响应"))
							})) : createCommentVNode("", true),
							devToolResult.value ? (openBlock(), createBlock(unref(ReButton_default), {
								key: 1,
								size: "small",
								icon: "FullScreen",
								tip: "全屏",
								layout: "square",
								onClick: _cache[12] || (_cache[12] = ($event) => devToolFullscreen.value = !devToolFullscreen.value)
							})) : createCommentVNode("", true)
						])]), devToolError.value ? (openBlock(), createElementBlock("div", _hoisted_77, toDisplayString(devToolError.value), 1)) : (openBlock(), createElementBlock("pre", _hoisted_78, toDisplayString(JSON.stringify(devToolResult.value, null, 2)), 1))])) : createCommentVNode("", true)
					])])]),
					_: 1
				}, 8, ["modelValue"])])])) : createCommentVNode("", true),
				createVNode(unref(component), {
					modelValue: clusterVisible.value,
					"onUpdate:modelValue": _cache[16] || (_cache[16] = ($event) => clusterVisible.value = $event),
					title: "Elasticsearch 集群信息",
					width: "1080px"
				}, {
					default: withCtx(() => [withDirectives((openBlock(), createElementBlock("div", _hoisted_79, [
						createBaseVNode("div", _hoisted_80, [
							createBaseVNode("div", _hoisted_81, [_cache[45] || (_cache[45] = createBaseVNode("span", { class: "dsm-stat-label" }, "集群名", -1)), createBaseVNode("span", _hoisted_82, toDisplayString(cluster.value?.clusterName || "—"), 1)]),
							createBaseVNode("div", _hoisted_83, [_cache[46] || (_cache[46] = createBaseVNode("span", { class: "dsm-stat-label" }, "健康度", -1)), createVNode(unref(component$2), { type: healthTag(cluster.value?.status) }, {
								default: withCtx(() => [createTextVNode(toDisplayString(cluster.value?.status || "—"), 1)]),
								_: 1
							}, 8, ["type"])]),
							createBaseVNode("div", _hoisted_84, [_cache[47] || (_cache[47] = createBaseVNode("span", { class: "dsm-stat-label" }, "节点数", -1)), createBaseVNode("span", _hoisted_85, toDisplayString(cluster.value?.numberOfNodes ?? "—"), 1)]),
							createBaseVNode("div", _hoisted_86, [_cache[48] || (_cache[48] = createBaseVNode("span", { class: "dsm-stat-label" }, "数据节点", -1)), createBaseVNode("span", _hoisted_87, toDisplayString(cluster.value?.numberOfDataNodes ?? "—"), 1)]),
							createBaseVNode("div", _hoisted_88, [_cache[49] || (_cache[49] = createBaseVNode("span", { class: "dsm-stat-label" }, "活跃分片", -1)), createBaseVNode("span", _hoisted_89, toDisplayString(cluster.value?.activeShards ?? "—"), 1)]),
							createBaseVNode("div", _hoisted_90, [_cache[50] || (_cache[50] = createBaseVNode("span", { class: "dsm-stat-label" }, "未分配分片", -1)), createBaseVNode("span", _hoisted_91, toDisplayString(cluster.value?.unassignedShards ?? "—"), 1)]),
							createBaseVNode("div", _hoisted_92, [_cache[51] || (_cache[51] = createBaseVNode("span", { class: "dsm-stat-label" }, "版本", -1)), createBaseVNode("span", _hoisted_93, toDisplayString(cluster.value?.version || "—"), 1)])
						]),
						_cache[54] || (_cache[54] = createBaseVNode("div", { class: "dsm-sub-title" }, "节点", -1)),
						createVNode(unref(ReTable_default), {
							data: nodeRows.value,
							columns: nodeColumns,
							loading: clusterLoading.value,
							pagination: false,
							stripe: "",
							border: "",
							height: "220px"
						}, {
							"col-master": withCtx(({ row }) => [row.master === "*" ? (openBlock(), createBlock(unref(component$2), {
								key: 0,
								type: "warning"
							}, {
								default: withCtx(() => [..._cache[52] || (_cache[52] = [createTextVNode("master", -1)])]),
								_: 1
							})) : (openBlock(), createElementBlock("span", _hoisted_94, "—"))]),
							"col-cpu": withCtx(({ row }) => [createBaseVNode("div", _hoisted_95, [createBaseVNode("span", _hoisted_96, [createBaseVNode("span", {
								class: normalizeClass(["dsm-meter__fill", `is-${row.cpuTone}`]),
								style: normalizeStyle({ width: `${row.cpuPct ?? 0}%` })
							}, null, 6)]), createBaseVNode("span", _hoisted_97, toDisplayString(row.cpuPct === null ? "—" : `${row.cpuPct}%`), 1)])]),
							_: 1
						}, 8, ["data", "loading"]),
						_cache[55] || (_cache[55] = createBaseVNode("div", { class: "dsm-sub-title" }, "分片分配", -1)),
						createVNode(unref(ReTable_default), {
							data: shards.value,
							columns: shardColumns,
							loading: clusterLoading.value,
							pagination: false,
							stripe: "",
							border: "",
							height: "220px"
						}, null, 8, ["data", "loading"]),
						_cache[56] || (_cache[56] = createBaseVNode("div", { class: "dsm-sub-title" }, "集群设置（有效值，可改）", -1)),
						createBaseVNode("div", _hoisted_98, [
							createVNode(unref(ReSelect_default), {
								modelValue: settingKey.value,
								"onUpdate:modelValue": _cache[14] || (_cache[14] = ($event) => settingKey.value = $event),
								data: settingKeyOptions.value,
								placeholder: "选择设置项（可输入过滤）",
								class: "dsm-setting-key",
								"data-testid": "es-setting-key"
							}, null, 8, ["modelValue", "data"]),
							createVNode(unref(ReInput_default), {
								modelValue: settingValue.value,
								"onUpdate:modelValue": _cache[15] || (_cache[15] = ($event) => settingValue.value = $event),
								placeholder: "新值",
								class: "dsm-setting-value",
								"data-testid": "es-setting-value"
							}, null, 8, ["modelValue"]),
							createVNode(unref(ReButton_default), {
								type: "primary",
								loading: settingSaving.value,
								"data-testid": "es-setting-save",
								onClick: saveClusterSetting
							}, {
								default: withCtx(() => [..._cache[53] || (_cache[53] = [createTextVNode(" 保存 ", -1)])]),
								_: 1
							}, 8, ["loading"])
						]),
						settingKeyStaticReason.value ? (openBlock(), createElementBlock("div", _hoisted_99, toDisplayString(settingKeyStaticReason.value), 1)) : createCommentVNode("", true),
						createVNode(unref(ReTable_default), {
							data: filteredSettings.value,
							columns: settingColumns,
							pagination: false,
							stripe: "",
							border: "",
							height: "240px"
						}, null, 8, ["data"])
					])), [[_directive_loading, clusterLoading.value]])]),
					_: 1
				}, 8, ["modelValue"]),
				createVNode(unref(component$3), {
					modelValue: fieldDrawerVisible.value,
					"onUpdate:modelValue": _cache[18] || (_cache[18] = ($event) => fieldDrawerVisible.value = $event),
					title: fieldDrawerTitle.value,
					size: "680px",
					"footer-hidden": "",
					"data-testid": "es-field-drawer"
				}, {
					default: withCtx(() => [withDirectives((openBlock(), createElementBlock("div", _hoisted_100, [createBaseVNode("div", _hoisted_101, [fieldDetail.value ? (openBlock(), createElementBlock("div", _hoisted_102, [
						createVNode(unref(component$2), { type: healthTag(fieldDetail.value.health) }, {
							default: withCtx(() => [createTextVNode(toDisplayString(fieldDetail.value.health || "—"), 1)]),
							_: 1
						}, 8, ["type"]),
						createBaseVNode("span", _hoisted_103, "状态 " + toDisplayString(fieldDetail.value.status || "—"), 1),
						createBaseVNode("span", _hoisted_104, "分片 " + toDisplayString(fieldDetail.value.shards ?? "—") + " / 副本 " + toDisplayString(fieldDetail.value.replicas ?? "—"), 1),
						createBaseVNode("span", _hoisted_105, "文档 " + toDisplayString(fieldDetail.value.docs ?? "—"), 1),
						createBaseVNode("span", _hoisted_106, "存储 " + toDisplayString(fieldDetail.value.storeSize || "—"), 1)
					])) : (openBlock(), createElementBlock("span", _hoisted_107, "加载中…")), createVNode(unref(ReButton_default), {
						layout: "square",
						icon: "Edit",
						tip: "管理字段（增 / 删 / 改）",
						"data-testid": "es-drawer-fieldsmgr",
						disabled: !fieldDetail.value,
						onClick: _cache[17] || (_cache[17] = ($event) => openFieldManager(fieldDetail.value?.name))
					}, null, 8, ["disabled"])]), createVNode(unref(ReTable_default), {
						data: fieldDetail.value?.fields || [],
						columns: fieldColumns,
						loading: fieldDrawerLoading.value,
						pagination: false,
						stripe: "",
						border: "",
						height: "440px"
					}, {
						"col-index": withCtx(({ row }) => [createVNode(unref(component$2), { type: row.index === false ? "info" : "success" }, {
							default: withCtx(() => [createTextVNode(toDisplayString(row.index === false ? "否" : "是"), 1)]),
							_: 2
						}, 1032, ["type"])]),
						_: 1
					}, 8, ["data", "loading"])])), [[_directive_loading, fieldDrawerLoading.value]])]),
					_: 1
				}, 8, ["modelValue", "title"]),
				createVNode(unref(component), {
					modelValue: indexDialogVisible.value,
					"onUpdate:modelValue": _cache[23] || (_cache[23] = ($event) => indexDialogVisible.value = $event),
					title: indexDialogTitle.value,
					width: "920px"
				}, {
					footer: withCtx(() => [createVNode(unref(ReButton_default), { onClick: _cache[22] || (_cache[22] = ($event) => indexDialogVisible.value = false) }, {
						default: withCtx(() => [..._cache[68] || (_cache[68] = [createTextVNode("取消", -1)])]),
						_: 1
					}), createVNode(unref(ReButton_default), {
						type: "primary",
						loading: indexSaving.value,
						"data-testid": "es-form-save",
						onClick: saveIndex
					}, {
						default: withCtx(() => [createTextVNode(toDisplayString(indexDialogMode.value === "create" ? "创建" : "保存并生效"), 1)]),
						_: 1
					}, 8, ["loading"])]),
					default: withCtx(() => [withDirectives((openBlock(), createElementBlock("div", _hoisted_108, [
						createBaseVNode("div", _hoisted_109, [
							createBaseVNode("div", _hoisted_110, [_cache[57] || (_cache[57] = createBaseVNode("label", null, "索引名", -1)), createVNode(unref(ReInput_default), {
								modelValue: indexForm.name,
								"onUpdate:modelValue": _cache[19] || (_cache[19] = ($event) => indexForm.name = $event),
								disabled: indexDialogMode.value === "fields",
								placeholder: "如 order_2026_10（小写、不含空格）",
								"data-testid": "es-form-name"
							}, null, 8, ["modelValue", "disabled"])]),
							createBaseVNode("div", _hoisted_111, [_cache[58] || (_cache[58] = createBaseVNode("label", null, "主分片", -1)), createVNode(unref(ReInputNumber_default), {
								modelValue: indexForm.shards,
								"onUpdate:modelValue": _cache[20] || (_cache[20] = ($event) => indexForm.shards = $event),
								min: 1,
								max: 1024,
								disabled: indexDialogMode.value === "fields",
								"data-testid": "es-form-shards"
							}, null, 8, ["modelValue", "disabled"])]),
							createBaseVNode("div", _hoisted_112, [_cache[59] || (_cache[59] = createBaseVNode("label", null, "副本数", -1)), createVNode(unref(ReInputNumber_default), {
								modelValue: indexForm.replicas,
								"onUpdate:modelValue": _cache[21] || (_cache[21] = ($event) => indexForm.replicas = $event),
								min: 0,
								max: 64,
								disabled: indexDialogMode.value === "fields",
								"data-testid": "es-form-replicas"
							}, null, 8, ["modelValue", "disabled"])])
						]),
						createBaseVNode("div", _hoisted_113, [createBaseVNode("span", _hoisted_114, toDisplayString(indexDialogMode.value === "create" ? "字段设计" : "字段管理（增 / 删 / 改）"), 1), createVNode(unref(ReButton_default), {
							layout: "square",
							icon: "Plus",
							tip: "添加字段",
							"data-testid": "es-field-add",
							onClick: addFieldRow
						})]),
						createBaseVNode("div", _hoisted_115, [
							_cache[62] || (_cache[62] = createBaseVNode("div", { class: "dsm-field-grid-head" }, [
								createBaseVNode("span", null, "字段名"),
								createBaseVNode("span", null, "类型"),
								createBaseVNode("span", null, "分词器（text）"),
								createBaseVNode("span", null, "建索引"),
								createBaseVNode("span", null, "操作")
							], -1)),
							(openBlock(true), createElementBlock(Fragment, null, renderList(indexForm.fields, (field, idx) => {
								return openBlock(), createElementBlock("div", {
									key: idx,
									class: "dsm-field-grid-row"
								}, [
									createBaseVNode("div", _hoisted_116, [createVNode(unref(ReInput_default), {
										modelValue: field.name,
										"onUpdate:modelValue": ($event) => field.name = $event,
										placeholder: "字段名，支持 a.b",
										"data-testid": `es-field-name-${idx}`
									}, null, 8, [
										"modelValue",
										"onUpdate:modelValue",
										"data-testid"
									]), isOriginalField(field.name) ? (openBlock(), createBlock(unref(component$2), {
										key: 0,
										type: "info"
									}, {
										default: withCtx(() => [..._cache[60] || (_cache[60] = [createTextVNode("已有", -1)])]),
										_: 1
									})) : (openBlock(), createBlock(unref(component$2), {
										key: 1,
										type: "success"
									}, {
										default: withCtx(() => [..._cache[61] || (_cache[61] = [createTextVNode("新增", -1)])]),
										_: 1
									}))]),
									createVNode(unref(ReSelect_default), {
										modelValue: field.type,
										"onUpdate:modelValue": ($event) => field.type = $event,
										data: unref(fieldTypeOptions),
										"data-testid": `es-field-type-${idx}`
									}, null, 8, [
										"modelValue",
										"onUpdate:modelValue",
										"data",
										"data-testid"
									]),
									createVNode(unref(ReInput_default), {
										modelValue: field.analyzer,
										"onUpdate:modelValue": ($event) => field.analyzer = $event,
										disabled: field.type !== "text",
										placeholder: "standard",
										"data-testid": `es-field-analyzer-${idx}`
									}, null, 8, [
										"modelValue",
										"onUpdate:modelValue",
										"disabled",
										"data-testid"
									]),
									createVNode(unref(ReSwitch_default), {
										modelValue: field.index,
										"onUpdate:modelValue": ($event) => field.index = $event,
										"aria-label": field.index === false ? "不建索引" : "建索引"
									}, null, 8, [
										"modelValue",
										"onUpdate:modelValue",
										"aria-label"
									]),
									createVNode(unref(ReButton_default), {
										layout: "square",
										size: "small",
										type: "danger",
										icon: "Delete",
										tip: "删除该字段",
										"data-testid": `es-field-remove-${idx}`,
										onClick: ($event) => removeFieldRow(idx)
									}, null, 8, ["data-testid", "onClick"])
								]);
							}), 128)),
							indexForm.fields.length === 0 ? (openBlock(), createElementBlock("div", _hoisted_117, "暂无字段，点右上角「+」添加")) : createCommentVNode("", true)
						]),
						createBaseVNode("div", _hoisted_118, [indexDialogMode.value === "create" ? (openBlock(), createElementBlock(Fragment, { key: 0 }, [createTextVNode(" 索引名创建后不可改，主分片数创建后不可调整。 ")], 64)) : (openBlock(), createElementBlock(Fragment, { key: 1 }, [
							_cache[63] || (_cache[63] = createTextVNode(" ES 不能原地删除字段、也不能改已存在字段的类型：", -1)),
							_cache[64] || (_cache[64] = createBaseVNode("b", null, "只新增", -1)),
							_cache[65] || (_cache[65] = createTextVNode("走轻量 mapping； ", -1)),
							_cache[66] || (_cache[66] = createBaseVNode("b", null, "删除或改动已有字段", -1)),
							_cache[67] || (_cache[67] = createTextVNode("会触发重建索引（建新索引 → 搬运数据 → 换回同名索引）， 期间原索引短暂不可用，耗时与数据量成正比。 ", -1))
						], 64))])
					])), [[_directive_loading, indexDialogLoading.value]])]),
					_: 1
				}, 8, ["modelValue", "title"])
			]);
		};
	}
}), [["__scopeId", "data-v-10cf65e9"]]);
//#endregion
export { ElasticsearchManageView_default as default };
