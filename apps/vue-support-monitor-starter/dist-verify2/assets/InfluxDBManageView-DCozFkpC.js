import { $n as normalizeClass, D as createVNode, E as createTextVNode, Ht as watch, On as unref, Yt as withDirectives, _ as createBaseVNode, b as createElementBlock, bt as renderList, ct as onMounted, g as computed, gn as reactive, k as defineComponent, mt as openBlock, o as Fragment, qt as withCtx, rr as toDisplayString, v as createBlock, vn as ref, y as createCommentVNode } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { S as vShow, w as withModifiers } from "./runtime-dom.esm-bundler-RRl39S3n.js";
import { t as ElMessageBox } from "./message-box-CXDJvJwn.js";
import { t as ReTable_default } from "./ReTable-BO1ac7-i.js";
import { yt as message } from "./src-CEonioA3.js";
import { w as unwrapResult, x as http } from "./src-DDwlSqPX.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import "./src-DW2Ffr17.js";
import { t as ReSelect_default } from "./ReSelect-C2rq-Voy.js";
import { t as ReButton_default } from "./ReButton-owxlNwDO.js";
import { t as component } from "./ReDialog-DZGeR3lw.js";
import { T as fetchInfluxdbMeasurements, U as testInfluxdbConnection, _ as executeInfluxdbQuery, w as fetchInfluxdbBuckets } from "./manageConsoles-BaCEHWGA.js";
import { f as ReOption, u as ReFormItem } from "./ReKit-CFSh6vls.js";
import { d as copy_document_default, f as delete_default, h as edit_pen_default } from "./dist-Axt1Prff.js";
import { t as ReEmpty_default } from "./ReEmpty-DzxmsI1k.js";
import { t as ReForm_default } from "./ReForm-BHwHC8j0.js";
import { t as component$1 } from "./ReIcon-By12b2Y9.js";
import { t as ReInput_default } from "./ReInput-CGHpe202.js";
import { t as ReInputNumber_default } from "./ReInputNumber-BOzz1hL8.js";
import { t as component$2 } from "./ReTag-D5UpQULZ.js";
import { t as DsmContextMenu_default } from "./DsmContextMenu-BEoagIWo.js";
import "./surface-Bdspw2jE.js";
import { t as DbSqlEditor_default } from "./DbSqlEditor-Byd806o1.js";
import { n as MiddlewareGap_default, t as useMiddlewareSource } from "./middlewareSource-BjMz9rOx.js";
import { t as copyToClipboard } from "./clipboard-Cx2N7jRl.js";
//#region ../../pages/datasource/src/utils/externalDatasource.ts
/**
* 读取数据源扩展字段（{@code config} map），值为空时返回兜底文本。
*
* @param datasource 数据源详情
* @param keys       字段名，按优先级排列
* @param fallback   未配置时的兜底文本
* @returns 字段文本
*/
function extraText(datasource, keys, fallback = "-") {
	if (!datasource) return fallback;
	for (const key of keys) {
		const value = datasource.config?.[key];
		if (value !== void 0 && value !== null && String(value).trim() !== "") return String(value);
	}
	return fallback;
}
//#endregion
//#region ../../pages/datasource/src/api/influxdbNginxApi.ts
/**
* InfluxDB 增强 接口封装
*
* <p>不改动 monitorApi.ts 既有函数；这里只放新增端点。
* Nginx 相关接口已迁至 {@code src/nginx/api.ts}，本文件不再包含。</p>
* @author CH
* @since 4.0.0
*/
var unwrap = (res) => unwrapResult(res);
/**
* 读取当前数据源 Org 信息
* @param datasourceId 数据源 ID
*/
var fetchInfluxdbOrg = (datasourceId) => http().get("/ms/monitor/influxdb/org").query({ datasourceId }).then((r) => unwrap(r));
/**
* 新建 Bucket
* @param data 新建请求
*/
var createInfluxdbBucket = (data) => http().post("/ms/monitor/influxdb/bucket").data(data).then((r) => unwrap(r));
/**
* 删除 Bucket
* @param bucketId Bucket ID（UUID）
* @param datasourceId 数据源 ID
*/
var deleteInfluxdbBucket = (bucketId, datasourceId) => http().delete(`/ms/monitor/influxdb/bucket/${encodeURIComponent(bucketId)}`).query({ datasourceId }).then((r) => unwrap(r));
/**
* 编辑 Bucket 保留期
* @param bucketId Bucket ID（UUID）
* @param retentionHours 保留时长（小时），0/空表示永久
* @param datasourceId 数据源 ID
*/
var updateInfluxdbBucketRetention = (bucketId, retentionHours, datasourceId) => http().put(`/ms/monitor/influxdb/bucket/${encodeURIComponent(bucketId)}`).data({ retentionHours }).query({ datasourceId }).then((r) => unwrap(r));
/**
* 写入数据点（line protocol）
* @param data 写入请求
*/
var writeInfluxdbPoints = (data) => http().post("/ms/monitor/influxdb/write").data(data).then((r) => unwrap(r));
//#endregion
//#region ../../pages/datasource/src/composables/useInfluxdbQuery.ts
/**
* InfluxDB 查询 composable：语句生成 + 执行 + 结果列推导。
*
* <p>服务端模型（v2 组织/桶、v3 数据库）与查询方言（Flux / SQL+InfluxQL）是
* <b>两件事</b>：InfluxDB 2.x 的 Flux 是可选组件（{@code flux-enabled=false} 时
* 只认 InfluxQL），所以「v2 实例 + SQL 方言」必须能用。因此这里同时接收
* {@code useSql}（方言：决定生成哪种语句、结果怎么取列）；库/桶一律在执行时随请求
* 带上，语句里不拼限定名（InfluxQL 的两段名是保留策略.度量，见 {@code sqlTable}）。</p>
*
* @author CH
* @since 4.0.0.42
*/
function useInfluxdbQuery(options) {
	const { datasourceId, useSql, activeBucket, measurements } = options;
	/**
	* SQL 模式下的表名。
	*
	* <p>只给度量名，<b>不要</b>拼「库.度量」：InfluxQL 的两段限定名是
	* {@code 保留策略.度量}（三段才是 {@code 库.保留策略.度量}），把库当第一段会报
	* {@code retention policy not found}。库/桶一律由执行时随请求带上
	* （v3 是 database，v2/v1 是 bucket/db 参数），语句里不需要也不该出现。</p>
	*
	* @param measurement 度量名
	* @returns 限定后的表名
	*/
	function sqlTable(measurement) {
		return `"${measurement.replace(/"/g, "\"\"")}"`;
	}
	/**
	* 执行查询并返回行数据与耗时/截断信息
	*
	* <p>SQL 方言（无论 v2 还是 v3）都要把目标库/桶带上：v3 是 database，
	* v2 是 InfluxQL 缺省的 bucket——InfluxQL 语句里没有 {@code from(bucket:...)}
	* 可以兜底，不带就会落回服务端默认桶、查到空数据。</p>
	*
	* @param statement 查询语句
	* @returns 行数据与元信息
	*/
	async function runQuery(statement) {
		const result = await executeInfluxdbQuery(statement, datasourceId.value, useSql.value ? activeBucket.value : void 0);
		return {
			rows: displayRows(result?.rows || []),
			elapsed: result?.executionTimeMs ?? 0,
			truncated: !!result?.truncated,
			totalRows: result?.totalRows ?? (result?.rows?.length || 0)
		};
	}
	/**
	* 把行内嵌套结构转成 JSON 文本，避免表格里显示成 [object Object]
	* @param rows 查询返回的行
	* @returns 可直读的行
	*/
	function displayRows(rows) {
		return rows.map((row) => {
			const flat = {};
			for (const [key, value] of Object.entries(row)) flat[key] = value !== null && typeof value === "object" ? JSON.stringify(value) : value;
			return flat;
		});
	}
	/**
	* 查询页签的缺省语句：按当前选中的库生成
	* @returns 缺省查询语句；SQL 方言且当前库尚无度量时返回空串
	*/
	function buildDefaultStatement() {
		if (!activeBucket.value) return "";
		if (useSql.value) {
			const table = measurements.value[0]?.name;
			return table ? `SELECT * FROM ${sqlTable(table)} ORDER BY time DESC LIMIT 50` : "";
		}
		return `from(bucket: "${activeBucket.value}")\n  |> range(start: -1h)\n  |> limit(n: 50)`;
	}
	/**
	* 数据浏览查询语句（SQL 方言生成 SQL/InfluxQL，Flux 方言生成 Flux）
	* @param measurement 度量名
	* @param range 时间范围（如 {@code -1h} / {@code -7d}）
	* @param field 字段过滤（可选）
	* @returns 查询语句
	*/
	function buildBrowserStatement(measurement, range, field) {
		if (useSql.value) {
			const table = sqlTable(measurement);
			const m = /^(\d+)([hd])$/.exec(range.replace(/^-/, ""));
			const unit = m?.[2] === "d" ? "DAY" : "HOUR";
			let statement = `SELECT * FROM ${table} WHERE time >= now() - INTERVAL '${m?.[1] ?? "1"}' ${unit}`;
			if (field) statement += ` AND "${field.replace(/"/g, "\"\"")}" IS NOT NULL`;
			return `${statement} ORDER BY time DESC LIMIT 500`;
		}
		let statement = `from(bucket: "${activeBucket.value}")\n  |> range(start: ${range})\n  |> filter(fn: (r) => r._measurement == "${measurement}")`;
		if (field) statement += `\n  |> filter(fn: (r) => r._field == "${field}")`;
		return `${statement}\n  |> limit(n: 500)`;
	}
	/**
	* 由返回行的键推导表格列，避免写死后端字段
	* @param rows 查询返回的行
	* @returns 表格列定义
	*/
	function deriveColumns(rows) {
		return (rows.length > 0 ? Object.keys(rows[0]) : []).map((key) => ({
			prop: key,
			label: key,
			minWidth: 140
		}));
	}
	/**
	* 由查询结果收集 field 选项：Flux 取行里的 {@code _field}；
	* SQL / InfluxQL 的字段即结果列（排除 time 与 tag 列）
	* @param rows 查询返回的行
	* @returns field 选项列表
	*/
	function deriveFieldOptions(rows) {
		const fields = /* @__PURE__ */ new Set();
		if (useSql.value) {
			for (const key of Object.keys(rows[0] || {})) if (key !== "time") fields.add(key);
		} else for (const row of rows) {
			const f = row._field;
			if (f != null) fields.add(String(f));
		}
		return [...fields];
	}
	/**
	* v3 编辑器按需解析度量的字段列（information_schema.columns）
	* @param table 表（度量）名
	* @returns 列名
	*/
	async function resolveSqlColumns(table) {
		try {
			const { rows } = await runQuery(`SELECT column_name FROM information_schema.columns WHERE table_name = '${table.replace(/'/g, "''")}'`);
			return rows.map((r) => String(r.column_name ?? "")).filter(Boolean);
		} catch {
			return [];
		}
	}
	return {
		runQuery,
		buildDefaultStatement,
		buildBrowserStatement,
		deriveColumns,
		deriveFieldOptions,
		resolveSqlColumns
	};
}
//#endregion
//#region ../../pages/datasource/src/views/console/InfluxDBManageView.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1 = { class: "dsm tel-page" };
var _hoisted_2 = { class: "dsm-toolbar re-surface" };
var _hoisted_3 = { class: "dsm-toolbar-left" };
var _hoisted_4 = { class: "dsm-toolbar-right" };
var _hoisted_5 = {
	class: "dsm-dialect",
	"data-testid": "dsm-dialect-switch"
};
var _hoisted_6 = ["disabled", "title"];
var _hoisted_7 = { class: "dsm-body" };
var _hoisted_8 = { class: "dsm-sidebar" };
var _hoisted_9 = { class: "dsm-tree" };
var _hoisted_10 = { class: "dsm-tree-label" };
var _hoisted_11 = {
	key: 0,
	class: "dsm-tree-children"
};
var _hoisted_12 = { class: "dsm-tree-label" };
var _hoisted_13 = { class: "dsm-tree-count" };
var _hoisted_14 = {
	key: 0,
	class: "dsm-tree-children"
};
var _hoisted_15 = ["onClick", "onContextmenu"];
var _hoisted_16 = { class: "dsm-tree-label" };
var _hoisted_17 = { class: "dsm-tree-count" };
var _hoisted_18 = {
	key: 1,
	class: "dsm-tree-children"
};
var _hoisted_19 = ["onClick", "onContextmenu"];
var _hoisted_20 = { class: "dsm-tree-label" };
var _hoisted_21 = {
	key: 0,
	class: "dsm-tree-node dsm-leaf-node"
};
var _hoisted_22 = { class: "dsm-content" };
var _hoisted_23 = { class: "dsm-tabs" };
var _hoisted_24 = ["onClick"];
var _hoisted_25 = { class: "dsm-tab-title" };
var _hoisted_26 = {
	key: 0,
	class: "dsm-info-card"
};
var _hoisted_27 = { class: "dsm-info-row" };
var _hoisted_28 = { class: "dsm-info-value" };
var _hoisted_29 = { class: "dsm-info-row" };
var _hoisted_30 = { class: "dsm-info-value mono" };
var _hoisted_31 = {
	key: 0,
	class: "dsm-info-row"
};
var _hoisted_32 = { class: "dsm-info-value mono" };
var _hoisted_33 = {
	key: 1,
	class: "dsm-info-row"
};
var _hoisted_34 = { class: "dsm-info-value mono" };
var _hoisted_35 = { class: "dsm-info-row" };
var _hoisted_36 = { class: "dsm-info-status" };
var _hoisted_37 = { class: "dsm-info-sub" };
var _hoisted_38 = {
	key: 1,
	class: "dsm-section"
};
var _hoisted_39 = { class: "dsm-section-title" };
var _hoisted_40 = { class: "dsm-row-ops" };
var _hoisted_41 = {
	key: 2,
	class: "dsm-section"
};
var _hoisted_42 = { class: "dsm-section-title" };
var _hoisted_43 = { class: "dsm-section-hint" };
var _hoisted_44 = {
	key: 3,
	class: "dsm-section"
};
var _hoisted_45 = { class: "dsm-section-title" };
var _hoisted_46 = {
	key: 4,
	class: "dsm-empty"
};
var _hoisted_47 = { class: "dsm-query-toolbar" };
var _hoisted_48 = { class: "dsm-query-hint" };
var _hoisted_49 = { class: "dsm-query-result" };
var _hoisted_50 = { class: "dsm-query-header" };
var _hoisted_51 = {
	key: 0,
	class: "dsm-query-meta"
};
var _hoisted_52 = {
	key: 0,
	class: "dsm-query-warn"
};
var _hoisted_53 = { class: "dsm-browser-bar" };
var _hoisted_54 = { class: "dsm-browser-meta" };
//#endregion
//#region ../../pages/datasource/src/views/console/InfluxDBManageView.vue
var InfluxDBManageView_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	__name: "InfluxDBManageView",
	setup(__props) {
		/**
		* InfluxDB 管理页
		*
		* <p>基于「数据源管理」登记的 influxdb 数据源，通过 /ms/monitor/influxdb/** 读取真实 Bucket、
		* 度量与 Flux 查询结果；接口缺失或连接失败时只展示失败原因，不回落任何演示数据。</p>
		* @author CH
		* @since 4.0.0
		*/
		const { datasourceId, source, gap, bind, fail, ready } = useMiddlewareSource();
		/** 侧栏根节点名称：真实数据源名 */
		const connectionName = computed(() => source.value ? source.value.name : "InfluxDB 时序数据库");
		const expandedNodes = ref(/* @__PURE__ */ new Set([
			"root",
			"buckets",
			"measurements"
		]));
		const activeBucket = ref("");
		const loading = ref(false);
		const dataLoading = ref(false);
		const testing = ref(false);
		const influxVersion = ref("");
		/**
		* 服务端大版本号（去掉 `v` 前缀后的首位）。
		*
		* <p>三个版本都要认：v1 的 `/ping` 给的是 `v1.11.8`（**带 v 前缀**），
		* 不剥掉就会被当成 v2。</p>
		*/
		const serverMajor = computed(() => influxVersion.value.trim().replace(/^v/i, "").split(".")[0] ?? "");
		/** 是否 InfluxDB 3.x（v3 为 Rust 重写：SQL/InfluxQL + 数据库模型，已移除 Flux 与组织） */
		const isV3 = computed(() => serverMajor.value === "3");
		/** 是否 InfluxDB 1.x（只有 InfluxQL，容器是 database，无 Flux、无组织） */
		const isV1 = computed(() => serverMajor.value === "1");
		/**
		* 容器是否叫「数据库」。
		*
		* <p>v1 的 database 对应 v2 的 bucket、v3 的 database；只有 v2 侧才叫「存储桶」。
		* 决定文案用，真正调哪个接口由后端按探测到的版本自行分发。</p>
		*/
		const databaseModel = computed(() => isV3.value || isV1.value);
		/**
		* 查询方言（Flux / SQL+InfluxQL）。
		*
		* <p>与 `isV3` 正交：`isV3` 说的是<b>服务端是什么</b>（组织/桶 还是 数据库），
		* 方言说的是<b>语句怎么写</b>。两者必须分开，因为 InfluxDB 2.x 的 Flux 是可选组件
		* （`flux-enabled=false` 时只认 InfluxQL）——「2.x 实例 + SQL 方言」是真实存在的组合，
		* 用大版本去推方言会让这种实例完全没法查。</p>
		*/
		const dialect = ref("flux");
		/**
		* 当前是否按 SQL / InfluxQL 方言工作。
		*
		* <p>用户选择之外还要按服务端能力兜底：v1 压根没有 Flux、v3 已移除 Flux，
		* 这两种实例上即便登记了「v2」，也必须走 InfluxQL——否则只会拿到一串 403。</p>
		*/
		const useSql = computed(() => dialect.value === "sql" || isV3.value || isV1.value);
		const buckets = ref([]);
		/** 桶/测量行右键菜单（第九批统一 zk 模板）：侧栏共用一个菜单实例，按 kind 切换条目 */
		const sideMenu = reactive({
			visible: false,
			x: 0,
			y: 0,
			kind: "bucket",
			key: ""
		});
		const sideMenuItems = computed(() => sideMenu.kind === "bucket" ? [
			{
				key: "view",
				label: databaseModel.value ? "查看该库数据" : "查看该桶数据",
				icon: "Collection"
			},
			{
				key: "copy",
				label: databaseModel.value ? "复制数据库名" : "复制桶名",
				icon: "Document"
			},
			{
				key: "delete",
				label: databaseModel.value ? "删除数据库" : "删除 Bucket",
				icon: "Delete",
				danger: true,
				divided: true
			}
		] : [{
			key: "view",
			label: "查看该测量",
			icon: "TrendCharts"
		}, {
			key: "copy",
			label: "复制名称",
			icon: "Document"
		}]);
		/** 存储桶表格行右键（ReTable 内置菜单，图标为组件引用） */
		const bucketTableMenu = computed(() => [
			{
				key: "retention",
				label: "编辑保留期",
				icon: edit_pen_default
			},
			{
				key: "copy",
				label: databaseModel.value ? "复制数据库名" : "复制桶名",
				icon: copy_document_default
			},
			{
				key: "delete",
				label: databaseModel.value ? "删除数据库" : "删除 Bucket",
				icon: delete_default,
				divided: true
			}
		]);
		/** 打开侧栏桶行右键菜单 */
		function onBucketContextMenu(e, name) {
			Object.assign(sideMenu, {
				visible: true,
				x: e.clientX,
				y: e.clientY,
				kind: "bucket",
				key: name
			});
		}
		/** 打开侧栏测量行右键菜单 */
		function onMeasurementContextMenu(e, name) {
			Object.assign(sideMenu, {
				visible: true,
				x: e.clientX,
				y: e.clientY,
				kind: "measurement",
				key: name
			});
		}
		/** 复制文本（菜单动作共用） */
		async function copyMenuText(text, okMsg) {
			if (await copyToClipboard(text)) message.success(okMsg);
			else message.error("复制失败");
		}
		/** 侧栏菜单分发 */
		function onSideMenuSelect(action) {
			const name = sideMenu.key;
			if (!name) return;
			if (action === "copy") {
				copyMenuText(name, isV3.value ? "已复制数据库名" : "已复制名称");
				return;
			}
			if (action === "view") {
				if (sideMenu.kind === "bucket") selectBucket(name);
				else selectMeasurement(name);
				return;
			}
			if (action === "delete" && sideMenu.kind === "bucket") {
				const row = buckets.value.find((b) => b.name === name);
				if (row) confirmDeleteBucket(row);
			}
		}
		/** 存储桶表格菜单分发 */
		function onBucketTableMenuSelect(item, ctx) {
			const row = ctx.row;
			if (item.key === "retention") openEditRetention(row);
			else if (item.key === "copy") copyMenuText(String(row.name ?? ""), isV3.value ? "已复制数据库名" : "已复制桶名");
			else if (item.key === "delete") confirmDeleteBucket(row);
		}
		const measurements = ref([]);
		/** 查询能力收口：语句生成 + 执行 + 结果列推导（v2 Flux / v3 SQL 双版本，见 composable 文档） */
		const { runQuery, buildDefaultStatement, buildBrowserStatement, deriveColumns, deriveFieldOptions, resolveSqlColumns } = useInfluxdbQuery({
			datasourceId,
			useSql,
			activeBucket,
			measurements
		});
		/**
		* 连接信息（地址/端口/组织/版本）。
		*
		* <p>由 {@code applyConnectionInfo()} 写入。当前模板不直接读取它，
		* 但保留写入行为以便后续展示，故此处补上声明（此前迁移遗漏导致引用悬空）。</p>
		*/
		const connectionInfo = {
			host: "-",
			port: 0,
			organization: "-",
			version: "-"
		};
		/** 连通状态。同上：脚本内写入，模板暂未读取，保留写入行为 */
		const connected = ref(false);
		const recentData = ref([]);
		const bucketColumns = [
			{
				prop: "name",
				label: "存储桶名称",
				minWidth: 180
			},
			{
				prop: "retentionHours",
				label: "保留时长(h)",
				width: 120
			},
			{
				prop: "createdAt",
				label: "创建时间",
				minWidth: 170
			},
			{
				prop: "action",
				label: "操作",
				width: 130,
				slot: "action",
				fixed: "right",
				align: "center"
			}
		];
		const measurementColumns = [
			{
				prop: "name",
				label: "度量名称",
				minWidth: 160
			},
			{
				prop: "fieldCount",
				label: "字段数",
				width: 90
			},
			{
				prop: "tagCount",
				label: "标签数",
				width: 90
			},
			{
				prop: "lastWriteTime",
				label: "最后写入",
				minWidth: 170
			}
		];
		const dataColumns = computed(() => deriveColumns(recentData.value));
		const queryTabs = ref([]);
		const activeWorkspaceTab = ref("overview");
		let queryTabSeq = 0;
		/** Flux 补全候选：桶名 + 已加载的测量名（输入即提示，随数据异步刷新） */
		const fluxKeywords = computed(() => [...buckets.value.map((b) => b.name), ...measurements.value.map((m) => m.name)]);
		/** v3 SQL 编辑器的表候选：度量即 SQL 表 */
		const sqlTables = computed(() => measurements.value.map((m) => m.name));
		const orgInfo = ref({
			orgId: "",
			orgName: ""
		});
		const bucketDialogVisible = ref(false);
		const bucketSaving = ref(false);
		const bucketForm = ref({
			id: "",
			name: "",
			retentionHours: 0,
			description: ""
		});
		const browserVisible = ref(false);
		const browserLoading = ref(false);
		const browserMeasurement = ref("");
		const browserRange = ref("-1h");
		const browserField = ref("");
		const browserFields = ref([]);
		const browserRows = ref([]);
		const browserColumns = ref([]);
		const writeVisible = ref(false);
		const writeSaving = ref(false);
		const writeForm = ref({
			bucket: "",
			measurement: "",
			tags: "",
			fields: "",
			timestamp: ""
		});
		/**
		* 回填连接信息（地址、组织、已登记方言）
		*
		* <p>登记的 version 是<b>查询方言</b>的用户选择，这里只用来定默认方言；
		* <b>不再</b>拿它去推服务端模型——那会让「2.x 实例选了 SQL」被误当成 v3，
		* 从而把控制台切到数据库/组织那套根本不存在的 v3 接口上。服务端模型以实测
		* 版本号为准（进入页面时探测，见 {@code probeServerVersion()}）。</p>
		*/
		function applyConnectionInfo() {
			const info = source.value;
			connectionInfo.host = info?.host ?? "-";
			connectionInfo.port = info?.port ?? 0;
			connectionInfo.organization = extraText(info, ["organization", "org"], info?.database ?? "-");
			if (info?.type === "influxdb" && (info.version === "2" || info.version === "3")) dialect.value = info.version === "3" ? "sql" : "flux";
			connectionInfo.version = info?.version || "-";
		}
		/**
		* 探测服务端真实版本，驱动「组织/桶 还是 数据库」这套服务端模型。
		*
		* <p>只读、不抛错：探不到时保持 v2 侧栏（更保守，v3 专有接口不会被打出去）。</p>
		*/
		async function probeServerVersion() {
			if (!datasourceId.value) return;
			try {
				const result = await testInfluxdbConnection({ datasourceId: datasourceId.value });
				if (result?.version) {
					influxVersion.value = result.version;
					if (isV3.value || isV1.value) dialect.value = "sql";
				}
			} catch {}
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
		* 选中 Bucket 后加载度量与最近数据
		* @param name Bucket 名
		*/
		async function selectBucket(name) {
			activeBucket.value = name;
			await loadMeasurements();
			loadBucketData();
		}
		/**
		* 选中度量，按该度量新建一个查询页签并激活
		* @param name 度量名
		*/
		function selectMeasurement(name) {
			openQueryTab(useSql.value ? `SELECT * FROM "${name.replace(/"/g, "\"\"")}" ORDER BY time DESC LIMIT 50` : `from(bucket: "${activeBucket.value}")\n  |> range(start: -1h)\n  |> filter(fn: (r) => r._measurement == "${name}")\n  |> limit(n: 50)`);
		}
		/**
		* 加载当前 Bucket 下的度量列表
		*/
		async function loadMeasurements() {
			try {
				measurements.value = await fetchInfluxdbMeasurements(datasourceId.value, activeBucket.value) || [];
				ready();
			} catch (e) {
				measurements.value = [];
				fail(e, "/ms/monitor/influxdb/measurements");
			}
		}
		/**
		* 点击度量行打开数据浏览弹窗（时间范围 + 表格 + field 过滤）
		* @param row 度量行
		*/
		function onMeasurementRowClick(row) {
			const name = String(row?.name ?? "");
			if (name) openBrowser(name);
		}
		/**
		* 探测当前数据源的 InfluxDB 连通性并显示版本
		*/
		async function testConnection() {
			testing.value = true;
			try {
				const result = await testInfluxdbConnection({ datasourceId: datasourceId.value });
				if (result?.connected) {
					influxVersion.value = result.version || "";
					ready();
					message.success(result.version ? `连接成功 · InfluxDB ${result.version}` : "连接成功");
				} else message.error(result?.message || "连接失败");
			} catch (e) {
				fail(e, "/ms/monitor/influxdb/test");
			} finally {
				testing.value = false;
			}
		}
		/**
		* 刷新 Bucket 列表，并在已选中 Bucket 时级联刷新度量
		*/
		async function refresh() {
			if (!source.value) {
				await bind("influxdb");
				if (!source.value) return;
			}
			loading.value = true;
			try {
				buckets.value = await fetchInfluxdbBuckets(datasourceId.value) || [];
				ready();
				await loadOrg();
				if (buckets.value.length > 0 && !buckets.value.some((b) => b.name === activeBucket.value)) selectBucket(buckets.value[0].name);
				else if (activeBucket.value && buckets.value.some((b) => b.name === activeBucket.value)) {
					await loadMeasurements();
					loadBucketData();
				}
			} catch (e) {
				buckets.value = [];
				fail(e, "/ms/monitor/influxdb/buckets");
			} finally {
				loading.value = false;
			}
		}
		/**
		* 读取当前库的最近数据（v2 用 Flux，v3 用 SQL 取第一个度量的最近数据）
		*/
		async function loadBucketData() {
			if (!activeBucket.value) {
				recentData.value = [];
				return;
			}
			dataLoading.value = true;
			try {
				const statement = buildDefaultStatement();
				if (!statement) {
					recentData.value = [];
					return;
				}
				const { rows } = await runQuery(statement);
				recentData.value = rows;
				ready();
			} catch (e) {
				recentData.value = [];
				fail(e, "/ms/monitor/influxdb/query");
			} finally {
				dataLoading.value = false;
			}
		}
		/**
		* 新建一个查询页签并激活（jdbc「查询 N」式，可多开）
		* @param flux 预填语句，缺省按当前库生成
		* @returns 新页签
		*/
		function openQueryTab(flux) {
			const seq = ++queryTabSeq;
			const tab = {
				id: `q${seq}`,
				title: `查询 ${seq}`,
				flux: flux ?? buildDefaultStatement(),
				executing: false,
				elapsed: 0,
				truncated: false,
				totalRows: 0,
				result: {
					columns: [],
					rows: []
				}
			};
			queryTabs.value.push(tab);
			activeWorkspaceTab.value = tab.id;
			return tab;
		}
		/**
		* 关闭查询页签；关的是当前页签时回退到相邻页签或总览
		* @param id 页签 ID
		*/
		function closeQueryTab(id) {
			const idx = queryTabs.value.findIndex((t) => t.id === id);
			if (idx < 0) return;
			queryTabs.value.splice(idx, 1);
			if (activeWorkspaceTab.value === id) {
				const next = queryTabs.value[idx] || queryTabs.value[idx - 1];
				activeWorkspaceTab.value = next ? next.id : "overview";
			}
		}
		/**
		* 工具栏「Flux 查询」：新建一个查询页签
		*/
		function openQuery() {
			openQueryTab();
		}
		/**
		* 切换查询方言。
		*
		* <p>方言与服务端版本无关，所以切方言只影响语句生成与编辑器语言，不重新拉桶/度量。
		* 当前页签若还空着，就按新方言补一条缺省语句，免得用户面对上一种语言的残留。</p>
		*
		* @param next 目标方言
		*/
		function switchDialect(next) {
			if (next === dialect.value) return;
			dialect.value = next;
			const tab = queryTabs.value.find((item) => item.id === activeWorkspaceTab.value);
			if (tab && !tab.flux.trim()) tab.flux = buildDefaultStatement();
		}
		/**
		* 执行指定页签里的查询
		* @param tab 查询页签
		*/
		async function executeQuery(tab) {
			if (!tab.flux.trim()) {
				message.warning(useSql.value ? "请输入 SQL 查询语句" : "请输入 Flux 查询语句");
				return;
			}
			tab.executing = true;
			try {
				const res = await runQuery(tab.flux);
				tab.elapsed = res.elapsed;
				tab.truncated = res.truncated;
				tab.totalRows = res.totalRows;
				tab.result = {
					columns: deriveColumns(res.rows),
					rows: res.rows
				};
				ready();
			} catch (e) {
				tab.result = {
					columns: [],
					rows: []
				};
				fail(e, "/ms/monitor/influxdb/query");
			} finally {
				tab.executing = false;
			}
		}
		/**
		* 加载当前数据源 Org 信息（v3 已移除组织概念，无需请求）
		*/
		async function loadOrg() {
			if (!datasourceId.value || isV3.value || isV1.value) return;
			try {
				orgInfo.value = await fetchInfluxdbOrg(datasourceId.value) || {
					orgId: "",
					orgName: ""
				};
			} catch {}
		}
		/**
		* 打开新建 Bucket 弹窗
		*/
		function openCreateBucket() {
			bucketForm.value = {
				id: "",
				name: "",
				retentionHours: 0,
				description: ""
			};
			bucketDialogVisible.value = true;
		}
		/**
		* 打开编辑保留期弹窗
		* @param row Bucket 行
		*/
		function openEditRetention(row) {
			bucketForm.value = {
				id: row.id,
				name: row.name,
				retentionHours: row.retentionHours ?? 0,
				description: ""
			};
			bucketDialogVisible.value = true;
		}
		/**
		* 提交新建或编辑保留期
		*/
		async function submitBucket() {
			if (!bucketForm.value.name.trim()) {
				message.warning("请输入 Bucket 名称");
				return;
			}
			bucketSaving.value = true;
			try {
				if (bucketForm.value.id) {
					await updateInfluxdbBucketRetention(bucketForm.value.id, bucketForm.value.retentionHours, datasourceId.value);
					message.success("保留期已更新");
				} else {
					await createInfluxdbBucket({
						datasourceId: datasourceId.value,
						name: bucketForm.value.name.trim(),
						retentionHours: bucketForm.value.retentionHours,
						description: bucketForm.value.description
					});
					message.success("Bucket 创建成功");
				}
				bucketDialogVisible.value = false;
				await refresh();
			} catch (e) {
				fail(e, "/ms/monitor/influxdb/bucket");
			} finally {
				bucketSaving.value = false;
			}
		}
		/**
		* 删除 Bucket / 数据库（二次确认）
		* @param row Bucket 行
		*/
		async function confirmDeleteBucket(row) {
			try {
				await ElMessageBox.confirm(isV3.value ? `确认删除数据库「${row.name}」？该操作会删除库内全部数据，不可恢复。` : `确认删除 Bucket「${row.name}」？该操作会删除桶内全部数据，不可恢复。`, "删除确认", {
					type: "warning",
					confirmButtonText: "删除",
					cancelButtonText: "取消"
				});
			} catch {
				return;
			}
			try {
				await deleteInfluxdbBucket(row.id, datasourceId.value);
				message.success(databaseModel.value ? "数据库已删除" : "Bucket 已删除");
				if (activeBucket.value === row.name) activeBucket.value = "";
				await refresh();
			} catch (e) {
				fail(e, "/ms/monitor/influxdb/bucket");
			}
		}
		/**
		* 打开数据浏览弹窗
		* @param measurement 度量名
		*/
		function openBrowser(measurement) {
			browserMeasurement.value = measurement;
			browserRange.value = "-1h";
			browserField.value = "";
			browserFields.value = [];
			browserRows.value = [];
			browserColumns.value = [];
			browserVisible.value = true;
			runBrowserQuery();
		}
		/**
		* 执行数据浏览查询（v2 走 Flux，v3 走 SQL）
		*/
		async function runBrowserQuery() {
			if (!activeBucket.value || !browserMeasurement.value) return;
			browserLoading.value = true;
			try {
				const statement = buildBrowserStatement(browserMeasurement.value, browserRange.value, browserField.value || void 0);
				const { rows } = await runQuery(statement);
				browserRows.value = rows;
				browserColumns.value = deriveColumns(rows);
				browserFields.value = deriveFieldOptions(rows);
				ready();
			} catch (e) {
				browserRows.value = [];
				browserColumns.value = [];
				fail(e, "/ms/monitor/influxdb/query");
			} finally {
				browserLoading.value = false;
			}
		}
		/**
		* 打开写入数据点弹窗
		*/
		function openWritePoint() {
			writeForm.value = {
				bucket: activeBucket.value,
				measurement: browserMeasurement.value || "",
				tags: "",
				fields: "",
				timestamp: ""
			};
			writeVisible.value = true;
		}
		/**
		* 把多行 key=value 文本解析成有序字符串
		* @param text 多行文本
		* @param escapeValue 是否对值做 line protocol 转义
		* @returns 拼接好的 key=value 段
		*/
		function parseKv(text, escapeValue) {
			const parts = [];
			for (const line of (text || "").split("\n")) {
				const trimmed = line.trim();
				if (!trimmed || !trimmed.includes("=")) continue;
				const idx = trimmed.indexOf("=");
				const k = trimmed.slice(0, idx).trim();
				let v = trimmed.slice(idx + 1).trim();
				if (!k) continue;
				if (v.startsWith("\"") && v.endsWith("\"") || v.startsWith("'") && v.endsWith("'")) v = v.slice(1, -1);
				const safeKey = k.replace(/,/g, "\\,").replace(/ /g, "\\ ");
				if (escapeValue) if (/^-?\d+(\.\d+)?$/.test(v)) parts.push(`${safeKey}=${v}`);
				else parts.push(`${safeKey}="${v.replace(/"/g, "\\\"")}"`);
				else parts.push(`${safeKey}=${v.replace(/,/g, "\\,").replace(/ /g, "\\ ")}`);
			}
			return parts.join(",");
		}
		/**
		* 提交写入数据点
		*/
		async function submitWrite() {
			if (!writeForm.value.bucket.trim()) {
				message.warning("请选择 Bucket");
				return;
			}
			if (!writeForm.value.measurement.trim()) {
				message.warning("请输入 Measurement");
				return;
			}
			if (!writeForm.value.fields.trim()) {
				message.warning("请至少填写一个 Field");
				return;
			}
			const measurement = writeForm.value.measurement.trim().replace(/,/g, "\\,").replace(/ /g, "\\ ");
			const tags = parseKv(writeForm.value.tags, false);
			const fields = parseKv(writeForm.value.fields, true);
			if (!fields) {
				message.warning("Field 格式无效，应为 key=value");
				return;
			}
			let line = measurement;
			if (tags) line += "," + tags;
			line += " " + fields;
			if (writeForm.value.timestamp.trim()) line += " " + writeForm.value.timestamp.trim();
			writeSaving.value = true;
			try {
				await writeInfluxdbPoints({
					datasourceId: datasourceId.value,
					bucket: writeForm.value.bucket.trim(),
					precision: "ns",
					lines: line
				});
				message.success("写入成功");
				writeVisible.value = false;
				if (activeBucket.value) await selectBucket(activeBucket.value);
			} catch (e) {
				fail(e, "/ms/monitor/influxdb/write");
			} finally {
				writeSaving.value = false;
			}
		}
		onMounted(async () => {
			await bind("influxdb");
			if (source.value) await refresh();
		});
		watch(datasourceId, async (id) => {
			applyConnectionInfo();
			if (!id) {
				buckets.value = [];
				measurements.value = [];
				recentData.value = [];
				activeBucket.value = "";
				connected.value = false;
				connectionInfo.version = "-";
				influxVersion.value = "";
				if (gap.value) message.warning(gap.value);
				return;
			}
			await probeServerVersion();
			await refresh();
		}, { immediate: true });
		watch(source, applyConnectionInfo);
		return (_ctx, _cache) => {
			return openBlock(), createElementBlock("div", _hoisted_1, [
				createBaseVNode("div", _hoisted_2, [createBaseVNode("div", _hoisted_3, [createVNode(unref(component$1), {
					name: "DataAnalysis",
					size: 18,
					class: "dsm-title-icon"
				}), _cache[23] || (_cache[23] = createBaseVNode("span", { class: "dsm-title" }, "InfluxDB 时序数据库管理", -1))]), createBaseVNode("div", _hoisted_4, [
					createBaseVNode("div", _hoisted_5, [createBaseVNode("button", {
						type: "button",
						class: normalizeClass(["dsm-dialect-btn", { "is-active": !useSql.value }]),
						disabled: isV3.value || isV1.value,
						title: isV3.value || isV1.value ? isV1.value ? "v1 只有 InfluxQL，没有 Flux" : "v3 已移除 Flux，只能用 SQL" : "按 Flux 语法查询（需服务端 flux-enabled=true）",
						"data-testid": "dsm-dialect-flux",
						onClick: _cache[0] || (_cache[0] = ($event) => switchDialect("flux"))
					}, " Flux ", 10, _hoisted_6), createBaseVNode("button", {
						type: "button",
						class: normalizeClass(["dsm-dialect-btn", { "is-active": useSql.value }]),
						title: "按 SQL / InfluxQL 语法查询",
						"data-testid": "dsm-dialect-sql",
						onClick: _cache[1] || (_cache[1] = ($event) => switchDialect("sql"))
					}, " SQL ", 2)]),
					createVNode(unref(ReButton_default), {
						layout: "square",
						tip: "测试连接",
						icon: "Connection",
						"data-testid": "dsm-btn-test",
						disabled: !unref(source),
						onClick: testConnection
					}, null, 8, ["disabled"]),
					createVNode(unref(ReButton_default), {
						layout: "square",
						tip: "刷新",
						icon: "Refresh",
						"data-testid": "dsm-btn-refresh",
						onClick: refresh
					}),
					createVNode(unref(ReButton_default), {
						layout: "square",
						type: "primary",
						tip: useSql.value ? "SQL 查询" : "Flux 查询",
						icon: "Search",
						"data-testid": "dsm-btn-query",
						onClick: openQuery
					}, null, 8, ["tip"]),
					createVNode(unref(ReButton_default), {
						layout: "square",
						type: "primary",
						tip: databaseModel.value ? "新建数据库" : "新建 Bucket",
						icon: "Plus",
						"data-testid": "dsm-btn-create",
						disabled: !unref(source),
						loading: bucketSaving.value,
						onClick: openCreateBucket
					}, null, 8, [
						"tip",
						"disabled",
						"loading"
					]),
					createVNode(unref(ReButton_default), {
						layout: "square",
						tip: "写入数据",
						icon: "EditPen",
						"data-testid": "dsm-btn-write",
						disabled: !unref(source),
						loading: writeSaving.value,
						onClick: openWritePoint
					}, null, 8, ["disabled", "loading"])
				])]),
				createVNode(MiddlewareGap_default, {
					text: unref(gap),
					onRetry: refresh
				}, null, 8, ["text"]),
				createBaseVNode("div", _hoisted_7, [createBaseVNode("div", _hoisted_8, [createBaseVNode("div", _hoisted_9, [createBaseVNode("div", {
					class: "dsm-tree-node dsm-tree-root",
					onClick: _cache[2] || (_cache[2] = ($event) => toggleNode("root"))
				}, [
					createVNode(unref(component$1), {
						name: expandedNodes.value.has("root") ? "ArrowDown" : "ArrowRight",
						size: "12"
					}, null, 8, ["name"]),
					createVNode(unref(component$1), {
						name: "Coin",
						size: "14",
						class: "dsm-tree-icon dsm-influx-icon"
					}),
					createBaseVNode("span", _hoisted_10, toDisplayString(connectionName.value), 1)
				]), expandedNodes.value.has("root") ? (openBlock(), createElementBlock("div", _hoisted_11, [
					createBaseVNode("div", {
						class: "dsm-tree-node",
						onClick: _cache[3] || (_cache[3] = ($event) => toggleNode("buckets"))
					}, [
						createVNode(unref(component$1), {
							name: expandedNodes.value.has("buckets") ? "ArrowDown" : "ArrowRight",
							size: "12"
						}, null, 8, ["name"]),
						createVNode(unref(component$1), {
							name: "FolderOpened",
							size: "14",
							class: "dsm-tree-icon"
						}),
						createBaseVNode("span", _hoisted_12, toDisplayString(databaseModel.value ? "数据库 (Databases)" : "存储桶 (Buckets)"), 1),
						createBaseVNode("span", _hoisted_13, toDisplayString(buckets.value.length), 1)
					]),
					expandedNodes.value.has("buckets") ? (openBlock(), createElementBlock("div", _hoisted_14, [(openBlock(true), createElementBlock(Fragment, null, renderList(buckets.value, (bucket) => {
						return openBlock(), createElementBlock("div", {
							key: bucket.name,
							class: normalizeClass(["dsm-tree-node dsm-leaf-node", { active: activeBucket.value === bucket.name }]),
							onClick: ($event) => selectBucket(bucket.name),
							onContextmenu: withModifiers(($event) => onBucketContextMenu($event, bucket.name), ["prevent"])
						}, [createVNode(unref(component$1), {
							name: "Collection",
							size: "14",
							class: "dsm-tree-icon"
						}), createBaseVNode("span", _hoisted_16, toDisplayString(bucket.name), 1)], 42, _hoisted_15);
					}), 128))])) : createCommentVNode("", true),
					createBaseVNode("div", {
						class: "dsm-tree-node",
						onClick: _cache[4] || (_cache[4] = ($event) => toggleNode("measurements"))
					}, [
						createVNode(unref(component$1), {
							name: expandedNodes.value.has("measurements") ? "ArrowDown" : "ArrowRight",
							size: "12"
						}, null, 8, ["name"]),
						createVNode(unref(component$1), {
							name: "TrendCharts",
							size: "14",
							class: "dsm-tree-icon"
						}),
						_cache[24] || (_cache[24] = createBaseVNode("span", { class: "dsm-tree-label" }, "测量 (Measurements)", -1)),
						createBaseVNode("span", _hoisted_17, toDisplayString(measurements.value.length), 1)
					]),
					expandedNodes.value.has("measurements") ? (openBlock(), createElementBlock("div", _hoisted_18, [(openBlock(true), createElementBlock(Fragment, null, renderList(measurements.value, (m) => {
						return openBlock(), createElementBlock("div", {
							key: m.name,
							class: "dsm-tree-node dsm-leaf-node",
							onClick: ($event) => selectMeasurement(m.name),
							onContextmenu: withModifiers(($event) => onMeasurementContextMenu($event, m.name), ["prevent"])
						}, [createVNode(unref(component$1), {
							name: "DataLine",
							size: "14",
							class: "dsm-tree-icon"
						}), createBaseVNode("span", _hoisted_20, toDisplayString(m.name), 1)], 40, _hoisted_19);
					}), 128)), measurements.value.length === 0 ? (openBlock(), createElementBlock("div", _hoisted_21, [..._cache[25] || (_cache[25] = [createBaseVNode("span", { class: "dsm-tree-label" }, "暂无测量", -1)])])) : createCommentVNode("", true)])) : createCommentVNode("", true)
				])) : createCommentVNode("", true)])]), createBaseVNode("div", _hoisted_22, [
					createBaseVNode("div", _hoisted_23, [createBaseVNode("div", {
						class: normalizeClass(["dsm-tab", { active: activeWorkspaceTab.value === "overview" }]),
						onClick: _cache[5] || (_cache[5] = ($event) => activeWorkspaceTab.value = "overview")
					}, [createVNode(unref(component$1), {
						name: "Collection",
						size: "12"
					}), _cache[26] || (_cache[26] = createBaseVNode("span", { class: "dsm-tab-title" }, "总览", -1))], 2), (openBlock(true), createElementBlock(Fragment, null, renderList(queryTabs.value, (t) => {
						return openBlock(), createElementBlock("div", {
							key: t.id,
							class: normalizeClass(["dsm-tab", { active: activeWorkspaceTab.value === t.id }]),
							onClick: ($event) => activeWorkspaceTab.value = t.id
						}, [
							createVNode(unref(component$1), {
								name: "Edit",
								size: "12"
							}),
							createBaseVNode("span", _hoisted_25, toDisplayString(t.title), 1),
							createVNode(unref(component$1), {
								name: "Close",
								size: "12",
								class: "dsm-tab-close",
								onClick: withModifiers(($event) => closeQueryTab(t.id), ["stop"])
							}, null, 8, ["onClick"])
						], 10, _hoisted_24);
					}), 128))]),
					activeWorkspaceTab.value === "overview" ? (openBlock(), createElementBlock("div", _hoisted_26, [
						createBaseVNode("div", _hoisted_27, [_cache[27] || (_cache[27] = createBaseVNode("span", { class: "dsm-info-label" }, "数据源", -1)), createBaseVNode("span", _hoisted_28, toDisplayString(unref(source) ? unref(source).name : "未选择"), 1)]),
						createBaseVNode("div", _hoisted_29, [_cache[28] || (_cache[28] = createBaseVNode("span", { class: "dsm-info-label" }, "连接地址", -1)), createBaseVNode("span", _hoisted_30, toDisplayString(unref(source) ? `${unref(source).host}:${unref(source).port || 8086}` : "—"), 1)]),
						!isV3.value && !isV1.value ? (openBlock(), createElementBlock("div", _hoisted_31, [_cache[29] || (_cache[29] = createBaseVNode("span", { class: "dsm-info-label" }, "组织 (Org)", -1)), createBaseVNode("span", _hoisted_32, toDisplayString(orgInfo.value.orgName || unref(source)?.username || "自动探测"), 1)])) : createCommentVNode("", true),
						!isV3.value && !isV1.value ? (openBlock(), createElementBlock("div", _hoisted_33, [_cache[30] || (_cache[30] = createBaseVNode("span", { class: "dsm-info-label" }, "Org ID", -1)), createBaseVNode("span", _hoisted_34, toDisplayString(orgInfo.value.orgId || "—"), 1)])) : createCommentVNode("", true),
						createBaseVNode("div", _hoisted_35, [_cache[31] || (_cache[31] = createBaseVNode("span", { class: "dsm-info-label" }, "状态", -1)), createBaseVNode("div", _hoisted_36, [createVNode(unref(component$2), { type: unref(gap) ? "danger" : "success" }, {
							default: withCtx(() => [createTextVNode(toDisplayString(unref(gap) ? "读取失败" : "正常"), 1)]),
							_: 1
						}, 8, ["type"]), createBaseVNode("span", _hoisted_37, "服务版本 " + toDisplayString(influxVersion.value || "未探测"), 1)])])
					])) : createCommentVNode("", true),
					activeWorkspaceTab.value === "overview" ? (openBlock(), createElementBlock("div", _hoisted_38, [createBaseVNode("div", _hoisted_39, toDisplayString(databaseModel.value ? "数据库列表" : "存储桶列表"), 1), createVNode(unref(ReTable_default), {
						data: buckets.value,
						columns: bucketColumns,
						loading: loading.value,
						stripe: "",
						border: "",
						"layout-table": { height: "300px" },
						"context-menu": bucketTableMenu.value,
						onContextMenuSelect: onBucketTableMenuSelect
					}, {
						action: withCtx(({ row }) => [createBaseVNode("div", _hoisted_40, [createVNode(unref(ReButton_default), {
							icon: "EditPen",
							layout: "square",
							title: "编辑保留期",
							onClick: ($event) => openEditRetention(row)
						}, null, 8, ["onClick"]), createVNode(unref(ReButton_default), {
							icon: "Delete",
							layout: "square",
							type: "danger",
							title: "删除",
							onClick: ($event) => confirmDeleteBucket(row)
						}, null, 8, ["onClick"])])]),
						_: 1
					}, 8, [
						"data",
						"loading",
						"context-menu"
					])])) : createCommentVNode("", true),
					activeWorkspaceTab.value === "overview" && activeBucket.value ? (openBlock(), createElementBlock("div", _hoisted_41, [createBaseVNode("div", _hoisted_42, [
						createTextVNode(toDisplayString(activeBucket.value) + " - 测量列表 ", 1),
						createVNode(unref(ReButton_default), {
							text: "",
							onClick: loadMeasurements
						}, {
							icon: withCtx(() => [createVNode(unref(component$1), {
								name: "Refresh",
								size: "12"
							})]),
							default: withCtx(() => [_cache[32] || (_cache[32] = createTextVNode("刷新 ", -1))]),
							_: 1
						}),
						createBaseVNode("span", _hoisted_43, "点击行按该度量生成" + toDisplayString(useSql.value ? " SQL" : " Flux") + "查询", 1)
					]), createVNode(unref(ReTable_default), {
						data: measurements.value,
						columns: measurementColumns,
						loading: loading.value,
						stripe: "",
						border: "",
						"layout-table": { height: "220px" },
						onRowClick: onMeasurementRowClick
					}, null, 8, ["data", "loading"])])) : createCommentVNode("", true),
					activeWorkspaceTab.value === "overview" && activeBucket.value ? (openBlock(), createElementBlock("div", _hoisted_44, [createBaseVNode("div", _hoisted_45, [createTextVNode(toDisplayString(activeBucket.value) + " - 最近数据 ", 1), createVNode(unref(ReButton_default), {
						text: "",
						onClick: loadBucketData
					}, {
						icon: withCtx(() => [createVNode(unref(component$1), {
							name: "Refresh",
							size: "12"
						})]),
						default: withCtx(() => [_cache[33] || (_cache[33] = createTextVNode("刷新 ", -1))]),
						_: 1
					})]), createVNode(unref(ReTable_default), {
						data: recentData.value,
						columns: dataColumns.value,
						loading: dataLoading.value,
						stripe: "",
						border: "",
						"layout-table": { height: "250px" }
					}, null, 8, [
						"data",
						"columns",
						"loading"
					])])) : createCommentVNode("", true),
					activeWorkspaceTab.value === "overview" && !activeBucket.value && buckets.value.length === 0 ? (openBlock(), createElementBlock("div", _hoisted_46, [createVNode(unref(component$1), {
						name: "Collection",
						size: "48",
						class: "dsm-empty-icon"
					}), createBaseVNode("p", null, toDisplayString(unref(gap) ? databaseModel.value ? "未读取到真实数据库" : "未读取到真实存储桶" : databaseModel.value ? "暂无数据库，点击「刷新」重新加载" : "暂无存储桶，点击「刷新」重新加载"), 1)])) : createCommentVNode("", true),
					(openBlock(true), createElementBlock(Fragment, null, renderList(queryTabs.value, (t) => {
						return withDirectives((openBlock(), createElementBlock("div", {
							key: t.id,
							class: "dsm-query-area"
						}, [
							createBaseVNode("div", _hoisted_47, [
								createVNode(unref(ReButton_default), {
									layout: "square",
									type: "primary",
									icon: "VideoPlay",
									tip: "执行（Ctrl+Enter）",
									"data-testid": "dsm-btn-exec",
									loading: t.executing,
									onClick: ($event) => executeQuery(t)
								}, null, 8, ["loading", "onClick"]),
								createVNode(unref(ReButton_default), {
									layout: "square",
									icon: "Delete",
									tip: "清空编辑器",
									"data-testid": "dsm-btn-clear",
									onClick: ($event) => t.flux = ""
								}, null, 8, ["onClick"]),
								_cache[34] || (_cache[34] = createBaseVNode("span", { class: "dsm-spacer" }, null, -1)),
								createBaseVNode("span", _hoisted_48, toDisplayString(useSql.value ? isV3.value ? "表/列名与 SQL 关键字输入即提示" : "InfluxQL 语句，目标桶由当前选中的桶带入" : "桶/测量名与 Flux 函数输入即提示"), 1)
							]),
							createVNode(DbSqlEditor_default, {
								modelValue: t.flux,
								"onUpdate:modelValue": ($event) => t.flux = $event,
								language: useSql.value ? "sql" : "flux",
								keywords: useSql.value ? [] : fluxKeywords.value,
								tables: isV3.value && useSql.value ? sqlTables.value : void 0,
								"column-resolver": isV3.value && useSql.value ? unref(resolveSqlColumns) : void 0,
								"data-testid": "dsm-flux-editor",
								onExecute: ($event) => executeQuery(t)
							}, null, 8, [
								"modelValue",
								"onUpdate:modelValue",
								"language",
								"keywords",
								"tables",
								"column-resolver",
								"onExecute"
							]),
							createBaseVNode("div", _hoisted_49, [createBaseVNode("div", _hoisted_50, [_cache[35] || (_cache[35] = createTextVNode(" 查询结果 ", -1)), t.result.rows.length > 0 ? (openBlock(), createElementBlock("span", _hoisted_51, [createTextVNode(toDisplayString(t.result.rows.length) + " 行 · " + toDisplayString(t.elapsed) + " ms ", 1), t.truncated ? (openBlock(), createElementBlock("span", _hoisted_52, "已截断，服务端共 " + toDisplayString(t.totalRows) + " 行，请加 limit 或收窄时间窗", 1)) : createCommentVNode("", true)])) : createCommentVNode("", true)]), t.result.columns.length > 0 ? (openBlock(), createBlock(unref(ReTable_default), {
								key: 0,
								data: t.result.rows,
								columns: t.result.columns,
								stripe: "",
								border: "",
								"layout-table": { height: "360px" }
							}, null, 8, ["data", "columns"])) : (openBlock(), createBlock(unref(ReEmpty_default), {
								key: 1,
								description: "执行查询后显示结果"
							}))])
						])), [[vShow, activeWorkspaceTab.value === t.id]]);
					}), 128))
				])]),
				createVNode(unref(component), {
					modelValue: bucketDialogVisible.value,
					"onUpdate:modelValue": _cache[10] || (_cache[10] = ($event) => bucketDialogVisible.value = $event),
					title: bucketForm.value.id ? "编辑保留期" : isV3.value ? "新建数据库" : "新建 Bucket",
					width: "460px"
				}, {
					footer: withCtx(() => [createVNode(unref(ReButton_default), { onClick: _cache[9] || (_cache[9] = ($event) => bucketDialogVisible.value = false) }, {
						default: withCtx(() => [..._cache[37] || (_cache[37] = [createTextVNode("取消", -1)])]),
						_: 1
					}), createVNode(unref(ReButton_default), {
						type: "primary",
						loading: bucketSaving.value,
						onClick: submitBucket
					}, {
						icon: withCtx(() => [createVNode(unref(component$1), { name: "Check" })]),
						default: withCtx(() => [_cache[38] || (_cache[38] = createTextVNode("确定 ", -1))]),
						_: 1
					}, 8, ["loading"])]),
					default: withCtx(() => [createVNode(unref(ReForm_default), { "label-width": "110px" }, {
						default: withCtx(() => [
							createVNode(unref(ReFormItem), {
								label: databaseModel.value ? "数据库名称" : "Bucket 名称",
								required: ""
							}, {
								default: withCtx(() => [createVNode(unref(ReInput_default), {
									modelValue: bucketForm.value.name,
									"onUpdate:modelValue": _cache[6] || (_cache[6] = ($event) => bucketForm.value.name = $event),
									disabled: !!bucketForm.value.id,
									placeholder: "如 telemetry"
								}, null, 8, ["modelValue", "disabled"])]),
								_: 1
							}, 8, ["label"]),
							createVNode(unref(ReFormItem), { label: "保留时长(小时)" }, {
								default: withCtx(() => [createVNode(unref(ReInputNumber_default), {
									modelValue: bucketForm.value.retentionHours,
									"onUpdate:modelValue": _cache[7] || (_cache[7] = ($event) => bucketForm.value.retentionHours = $event),
									min: 0,
									step: 24,
									placeholder: "0 = 永久保留"
								}, null, 8, ["modelValue"]), _cache[36] || (_cache[36] = createBaseVNode("span", { class: "dsm-form-hint" }, "0 表示永久保留", -1))]),
								_: 1
							}),
							!bucketForm.value.id ? (openBlock(), createBlock(unref(ReFormItem), {
								key: 0,
								label: "描述"
							}, {
								default: withCtx(() => [createVNode(unref(ReInput_default), {
									modelValue: bucketForm.value.description,
									"onUpdate:modelValue": _cache[8] || (_cache[8] = ($event) => bucketForm.value.description = $event),
									type: "textarea",
									rows: 2,
									placeholder: "可选"
								}, null, 8, ["modelValue"])]),
								_: 1
							})) : createCommentVNode("", true)
						]),
						_: 1
					})]),
					_: 1
				}, 8, ["modelValue", "title"]),
				createVNode(unref(component), {
					modelValue: browserVisible.value,
					"onUpdate:modelValue": _cache[14] || (_cache[14] = ($event) => browserVisible.value = $event),
					title: `数据浏览 · ${browserMeasurement.value}`,
					width: "860px"
				}, {
					footer: withCtx(() => [createVNode(unref(ReButton_default), { onClick: _cache[13] || (_cache[13] = ($event) => browserVisible.value = false) }, {
						default: withCtx(() => [..._cache[40] || (_cache[40] = [createTextVNode("关闭", -1)])]),
						_: 1
					})]),
					default: withCtx(() => [createBaseVNode("div", _hoisted_53, [
						createVNode(unref(ReSelect_default), {
							modelValue: browserRange.value,
							"onUpdate:modelValue": _cache[11] || (_cache[11] = ($event) => browserRange.value = $event),
							style: { "width": "130px" },
							onChange: runBrowserQuery
						}, {
							default: withCtx(() => [
								createVNode(unref(ReOption), {
									label: "最近 1 小时",
									value: "-1h"
								}),
								createVNode(unref(ReOption), {
									label: "最近 6 小时",
									value: "-6h"
								}),
								createVNode(unref(ReOption), {
									label: "最近 24 小时",
									value: "-24h"
								}),
								createVNode(unref(ReOption), {
									label: "最近 7 天",
									value: "-7d"
								})
							]),
							_: 1
						}, 8, ["modelValue"]),
						createVNode(unref(ReSelect_default), {
							modelValue: browserField.value,
							"onUpdate:modelValue": _cache[12] || (_cache[12] = ($event) => browserField.value = $event),
							clearable: "",
							placeholder: "按 field 过滤",
							style: { "width": "160px" },
							onChange: runBrowserQuery
						}, {
							default: withCtx(() => [(openBlock(true), createElementBlock(Fragment, null, renderList(browserFields.value, (f) => {
								return openBlock(), createBlock(unref(ReOption), {
									key: f,
									label: f,
									value: f
								}, null, 8, ["label", "value"]);
							}), 128))]),
							_: 1
						}, 8, ["modelValue"]),
						createBaseVNode("span", _hoisted_54, toDisplayString(browserRows.value.length) + " 行", 1),
						createVNode(unref(ReButton_default), {
							text: "",
							onClick: runBrowserQuery
						}, {
							icon: withCtx(() => [createVNode(unref(component$1), {
								name: "Refresh",
								size: "12"
							})]),
							default: withCtx(() => [_cache[39] || (_cache[39] = createTextVNode("刷新 ", -1))]),
							_: 1
						})
					]), createVNode(unref(ReTable_default), {
						data: browserRows.value,
						columns: browserColumns.value,
						loading: browserLoading.value,
						stripe: "",
						border: "",
						"layout-table": { height: "360px" }
					}, null, 8, [
						"data",
						"columns",
						"loading"
					])]),
					_: 1
				}, 8, ["modelValue", "title"]),
				createVNode(unref(component), {
					modelValue: writeVisible.value,
					"onUpdate:modelValue": _cache[21] || (_cache[21] = ($event) => writeVisible.value = $event),
					title: "写入数据点",
					width: "560px"
				}, {
					footer: withCtx(() => [createVNode(unref(ReButton_default), { onClick: _cache[20] || (_cache[20] = ($event) => writeVisible.value = false) }, {
						default: withCtx(() => [..._cache[41] || (_cache[41] = [createTextVNode("取消", -1)])]),
						_: 1
					}), createVNode(unref(ReButton_default), {
						type: "primary",
						loading: writeSaving.value,
						onClick: submitWrite
					}, {
						icon: withCtx(() => [createVNode(unref(component$1), { name: "Check" })]),
						default: withCtx(() => [_cache[42] || (_cache[42] = createTextVNode("写入 ", -1))]),
						_: 1
					}, 8, ["loading"])]),
					default: withCtx(() => [createVNode(unref(ReForm_default), { "label-width": "110px" }, {
						default: withCtx(() => [
							createVNode(unref(ReFormItem), {
								label: databaseModel.value ? "数据库" : "Bucket",
								required: ""
							}, {
								default: withCtx(() => [createVNode(unref(ReInput_default), {
									modelValue: writeForm.value.bucket,
									"onUpdate:modelValue": _cache[15] || (_cache[15] = ($event) => writeForm.value.bucket = $event),
									disabled: !!activeBucket.value,
									placeholder: databaseModel.value ? "数据库名" : "Bucket 名"
								}, null, 8, [
									"modelValue",
									"disabled",
									"placeholder"
								])]),
								_: 1
							}, 8, ["label"]),
							createVNode(unref(ReFormItem), {
								label: "Measurement",
								required: ""
							}, {
								default: withCtx(() => [createVNode(unref(ReInput_default), {
									modelValue: writeForm.value.measurement,
									"onUpdate:modelValue": _cache[16] || (_cache[16] = ($event) => writeForm.value.measurement = $event),
									placeholder: "如 cpu"
								}, null, 8, ["modelValue"])]),
								_: 1
							}),
							createVNode(unref(ReFormItem), { label: "Tags" }, {
								default: withCtx(() => [createVNode(unref(ReInput_default), {
									modelValue: writeForm.value.tags,
									"onUpdate:modelValue": _cache[17] || (_cache[17] = ($event) => writeForm.value.tags = $event),
									type: "textarea",
									rows: 2,
									placeholder: "key=value 每行一个，如：\nhost=server01\nregion=cn"
								}, null, 8, ["modelValue"])]),
								_: 1
							}),
							createVNode(unref(ReFormItem), {
								label: "Fields",
								required: ""
							}, {
								default: withCtx(() => [createVNode(unref(ReInput_default), {
									modelValue: writeForm.value.fields,
									"onUpdate:modelValue": _cache[18] || (_cache[18] = ($event) => writeForm.value.fields = $event),
									type: "textarea",
									rows: 3,
									placeholder: "key=value 每行一个，值自动识别数字/字符串，如：\nusage=82.5\nunit=percent"
								}, null, 8, ["modelValue"])]),
								_: 1
							}),
							createVNode(unref(ReFormItem), { label: "时间戳" }, {
								default: withCtx(() => [createVNode(unref(ReInput_default), {
									modelValue: writeForm.value.timestamp,
									"onUpdate:modelValue": _cache[19] || (_cache[19] = ($event) => writeForm.value.timestamp = $event),
									placeholder: "留空 = 当前时间"
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
					"onUpdate:visible": _cache[22] || (_cache[22] = ($event) => sideMenu.visible = $event),
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
}), [["__scopeId", "data-v-1bfe1ee2"]]);
//#endregion
export { InfluxDBManageView_default as default };
