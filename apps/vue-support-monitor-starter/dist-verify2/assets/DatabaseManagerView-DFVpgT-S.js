import { $ as mergeModels, $n as normalizeClass, Ct as resolveDirective, D as createVNode, E as createTextVNode, Ft as useModel, Ht as watch, On as unref, Yt as withDirectives, _ as createBaseVNode, b as createElementBlock, bt as renderList, ct as onMounted, et as mergeProps, g as computed, gn as reactive, it as onBeforeUnmount, k as defineComponent, mt as openBlock, nr as normalizeStyle, o as Fragment, qt as withCtx, rr as toDisplayString, tt as nextTick, u as Teleport, v as createBlock, vn as ref, w as createSlots, xt as renderSlot, y as createCommentVNode } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { C as withKeys, _ as vModelCheckbox, b as vModelSelect, w as withModifiers } from "./runtime-dom.esm-bundler-RRl39S3n.js";
import { t as ElMessageBox } from "./message-box-CXDJvJwn.js";
import { t as ReTable_default } from "./ReTable-BO1ac7-i.js";
import { yt as message } from "./src-CEonioA3.js";
import { w as unwrapResult, x as http } from "./src-DDwlSqPX.js";
import { i as useRoute } from "./vue-router-D43uXGPs.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { r as DatasourceSelect_default, u as fetchDataSources } from "./src-DW2Ffr17.js";
import { t as ReSelect_default } from "./ReSelect-C2rq-Voy.js";
import { t as ReButton_default } from "./ReButton-owxlNwDO.js";
import { t as component } from "./ReDialog-DZGeR3lw.js";
import { B as renameDbTable, C as fetchForeignKeys, F as fetchTableDdl, N as fetchTableColumns, P as fetchTableData, S as fetchErDiagram, V as requestDbText2Sql, b as fetchDbDatabases, c as dbFilterTakesMultipleValues, f as downloadDbDocument, g as executeDbSql, h as dropDbView, l as dbFilterTakesNoValue, m as dropDbTable, n as compareDbStructure, o as dbDocumentFormats, p as dropDbDatabase, r as createDbDatabase, s as dbFilterNeedsValue2, t as DB_FILTER_OPS, x as fetchDbTables, y as fetchDbAiStatus, z as previewDbDocument } from "./manageConsoles-BaCEHWGA.js";
import { f as ReOption, u as ReFormItem } from "./ReKit-CFSh6vls.js";
import { T as refresh_right_default, d as copy_document_default, f as delete_default, h as edit_pen_default } from "./dist-Axt1Prff.js";
import { t as ReEmpty_default } from "./ReEmpty-DzxmsI1k.js";
import { t as ReForm_default } from "./ReForm-BHwHC8j0.js";
import { t as component$1 } from "./ReIcon-By12b2Y9.js";
import { t as ReInput_default } from "./ReInput-CGHpe202.js";
import { t as ReInputNumber_default } from "./ReInputNumber-BOzz1hL8.js";
import { t as ReSwitch_default } from "./ReSwitch-B3yMYGw4.js";
import { a as UNSIGNED_ALLOWED, i as SIZE_REQUIRED, n as COLUMN_TYPE_GROUPS, r as SCALE_ALLOWED, t as CreateTableDialog_default } from "./CreateTableDialog-aKuT2MiB.js";
import { t as RePagination_default } from "./RePagination-CBtEQPGj.js";
import { t as component$2 } from "./ReRelationGraph-TK3CtGll.js";
import "./surface-Bdspw2jE.js";
import { t as DbSqlEditor_default } from "./DbSqlEditor-Byd806o1.js";
//#endregion
//#region ../../pages/datasource/src/components/console/ConsoleSwitch.vue
var ConsoleSwitch_default = /* @__PURE__ */ defineComponent({
	name: "ConsoleSwitch",
	inheritAttrs: false,
	__name: "ConsoleSwitch",
	props: /*@__PURE__*/ mergeModels({
		layout: { default: "radio" },
		radioOnLabel: { default: "是" },
		radioOffLabel: { default: "否" }
	}, {
		"modelValue": {
			type: [
				Boolean,
				String,
				Number
			],
			default: false
		},
		"modelModifiers": {}
	}),
	emits: ["update:modelValue"],
	setup(__props) {
		const props = __props;
		const modelValue = useModel(__props, "modelValue");
		return (_ctx, _cache) => {
			return openBlock(), createBlock(unref(ReSwitch_default), mergeProps({
				layout: props.layout,
				"radio-on-label": props.radioOnLabel,
				"radio-off-label": props.radioOffLabel,
				modelValue: modelValue.value,
				"onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => modelValue.value = $event)
			}, _ctx.$attrs), {
				default: withCtx(() => [renderSlot(_ctx.$slots, "default")]),
				_: 3
			}, 16, [
				"layout",
				"radio-on-label",
				"radio-off-label",
				"modelValue"
			]);
		};
	}
});
//#endregion
//#region ../../pages/datasource/src/api/dbManageApi.ts
/**
* 数据库 web 管理器 - 表级编辑增强 API
*
* 与 monitorApi 中既有的浏览/查询类端点互补，这里只封装新增的写操作端点：
* 单元格编辑 / 索引管理 / 清空表 / 表结构（列）编辑。
*
* @author CH
* @since 4.0.0
*/
var unwrap$1 = (res) => unwrapResult(res);
/**
* 更新单个单元格
* @param payload 更新请求
* @returns 影响行数
*/
var updateDbCell = (payload) => http().put(`/ms/monitor/db/table/${encodeURIComponent(payload.tableName)}/cell`).noToast(true).data(payload).then((r) => unwrap$1(r));
/**
* 获取表索引列表
* @param tableName 表名
* @param datasourceId 数据源 ID（可选）
* @param database 目标库（可选）
*/
var fetchDbIndexes = (tableName, datasourceId, database) => http().get(`/ms/monitor/db/table/${encodeURIComponent(tableName)}/indexes`).noToast(true).query({
	datasourceId,
	database
}).then((r) => unwrap$1(r));
/**
* 新建索引
* @param tableName 表名
* @param payload 索引定义
*/
var createDbIndex = (tableName, payload) => http().post(`/ms/monitor/db/table/${encodeURIComponent(tableName)}/index`).noToast(true).data(payload).then((r) => unwrap$1(r));
/**
* 删除索引
* @param tableName 表名
* @param indexName 索引名
* @param datasourceId 数据源 ID（可选）
* @param database 目标库（可选）
*/
var dropDbIndex = (tableName, indexName, datasourceId, database) => http().delete(`/ms/monitor/db/table/${encodeURIComponent(tableName)}/index/${encodeURIComponent(indexName)}`).noToast(true).query({
	datasourceId,
	database
}).then((r) => unwrap$1(r));
/**
* 清空表（TRUNCATE，不支持时后端退化为 DELETE）
* @param tableName 表名
* @param datasourceId 数据源 ID（可选）
* @param database 目标库（可选）
*/
var truncateDbTable = (tableName, datasourceId, database) => http().post(`/ms/monitor/db/table/${encodeURIComponent(tableName)}/truncate`).noToast(true).query({
	datasourceId,
	database
}).then((r) => unwrap$1(r));
/**
* 新增列
* @param tableName 表名
* @param payload 列定义
*/
var addDbColumn = (tableName, payload) => http().post(`/ms/monitor/db/table/${encodeURIComponent(tableName)}/column`).noToast(true).data(payload).then((r) => unwrap$1(r));
/**
* 修改列（MODIFY COLUMN）
* @param tableName 表名
* @param columnName 列名
* @param payload 列定义
*/
var modifyDbColumn = (tableName, columnName, payload) => http().put(`/ms/monitor/db/table/${encodeURIComponent(tableName)}/column/${encodeURIComponent(columnName)}`).noToast(true).data(payload).then((r) => unwrap$1(r));
/**
* 删除列
* @param tableName 表名
* @param columnName 列名
* @param datasourceId 数据源 ID（可选）
* @param database 目标库（可选）
*/
var dropDbColumn = (tableName, columnName, datasourceId, database) => http().delete(`/ms/monitor/db/table/${encodeURIComponent(tableName)}/column/${encodeURIComponent(columnName)}`).noToast(true).query({
	datasourceId,
	database
}).then((r) => unwrap$1(r));
/**
* 读取表属性。
* @param tableName 表名
* @param datasourceId 数据源 ID（可选）
* @param database 目标库（可选）
*/
var fetchDbTableOptions = (tableName, datasourceId, database) => http().get(`/ms/monitor/db/table/${encodeURIComponent(tableName)}/options`).noToast(true).query({
	datasourceId,
	database
}).then((r) => unwrap$1(r));
/**
* 修改表属性。
* @param tableName 表名
* @param payload 属性（未传字段不改）
*/
var updateDbTableOptions = (tableName, payload) => http().put(`/ms/monitor/db/table/${encodeURIComponent(tableName)}/options`).noToast(true).data(payload).then((r) => unwrap$1(r));
/**
* 列出内核支持的存储引擎与排序规则。
*
* <p>传 charset 则只返回该字符集下的排序规则（用于「字符集变了就刷新排序规则下拉」）。
*
* @param charset 限定字符集（可选）
* @param datasourceId 数据源 ID（可选）
* @param database 目标库（可选）
*/
var fetchDbTableOptionValues = (charset, datasourceId, database) => http().get("/ms/monitor/db/table-options/available").noToast(true).query({
	charset,
	datasourceId,
	database
}).then((r) => unwrap$1(r));
/**
* 设置主键（可改可加可清空）。
*
* <p>传空数组表示清除主键。后端会先 DROP 旧主键再 ADD 新的，
* 因此列序即复合主键的列序。
*
* @param tableName 表名
* @param columns 主键列（顺序即列序），空数组表示清除
* @param datasourceId 数据源 ID（可选）
* @param database 目标库（可选）
*/
var setDbTablePrimaryKey = (tableName, columns, datasourceId, database) => http().put(`/ms/monitor/db/table/${encodeURIComponent(tableName)}/primary-key`).noToast(true).data({
	columns,
	datasourceId,
	database
}).then((r) => unwrap$1(r));
/**
* 导入预览：解析文件回显列名与前若干行，**不写库**。
*
* 用于向导第一步确认「分隔符 / 编码 / 表头识别是否正确」，避免用户配好映射后才发现解析错了。
*
* @param file      上传的文件
* @param format    格式：auto / csv / tsv / json
* @param hasHeader 首行是否为表头
* @param encoding  字符集名，为空按 UTF-8
* @returns 预览结果
*/
var previewDbImport = (file, format, hasHeader, encoding) => {
	const form = new FormData();
	form.append("file", file, file.name);
	form.append("format", format);
	form.append("hasHeader", String(hasHeader));
	if (encoding) form.append("encoding", encoding);
	return http().post("/ms/monitor/db/import/preview").noToast(true).data(form).then((r) => unwrap$1(r));
};
/**
* 执行导入：按字段映射把文件写入目标表。
*
* @param file    上传的文件
* @param options 导入选项
* @returns 导入统计
*/
var importDbFile = (file, options) => {
	const form = new FormData();
	form.append("file", file, file.name);
	form.append("option", JSON.stringify(options));
	return http().post("/ms/monitor/db/import").noToast(true).data(form).then((r) => unwrap$1(r));
};
/**
* 导出表数据 / 结构。
*
* @param request 导出请求
* @returns 导出内容
*/
var exportDbTable = (request) => http().post("/ms/monitor/db/export").noToast(true).data(request).then((r) => unwrap$1(r));
/** 各类别在树上的展示名与图标 */
var DB_OBJECT_CATEGORIES = [
	{
		value: "procedure",
		label: "存储过程",
		icon: "Document"
	},
	{
		value: "function",
		label: "函数",
		icon: "SetUp"
	},
	{
		value: "trigger",
		label: "触发器",
		icon: "Lightning"
	},
	{
		value: "event",
		label: "事件",
		icon: "AlarmClock"
	}
];
/**
* 取各类对象的数量（树节点角标）。
*
* @param datasourceId 数据源 ID
* @param database 库名
*/
var fetchDbObjectSummary = (datasourceId, database) => http().get("/ms/monitor/db/objects/summary").noToast(true).query({
	datasourceId,
	database
}).then((r) => unwrap$1(r));
/**
* 列出某类对象。
*
* @param category 类别
* @param datasourceId 数据源 ID
* @param database 库名
*/
var fetchDbObjects = (category, datasourceId, database) => http().get(`/ms/monitor/db/objects/${category}`).noToast(true).query({
	datasourceId,
	database
}).then((r) => unwrap$1(r));
/**
* 读对象定义。
*
* @param category 类别
* @param name 对象名
* @param datasourceId 数据源 ID
* @param database 库名
*/
var fetchDbObjectDefinition = (category, name, datasourceId, database) => http().get(`/ms/monitor/db/objects/${category}/${encodeURIComponent(name)}/definition`).noToast(true).query({
	datasourceId,
	database
}).then((r) => unwrap$1(r));
/**
* 新建或整体替换对象。
*
* <p>{@code existOk=true} 时后端走「先删后建」实现改定义。</p>
*
* @param category 类别
* @param definition 完整 DDL
* @param options 数据源与目标库
* @param existOk 是否允许覆盖已存在的同名对象
*/
var saveDbObject = (category, definition, options, existOk = false) => http().post(`/ms/monitor/db/objects/${category}`).noToast(true).data({
	definition,
	existOk,
	...options
}).then((r) => unwrap$1(r));
/**
* 删除对象。
*
* @param category 类别
* @param name 对象名
* @param options 数据源与目标库
* @param ifExists 对象不存在时是否静默成功
*/
var dropDbObject = (category, name, options, ifExists = true) => http().delete(`/ms/monitor/db/objects/${category}/${encodeURIComponent(name)}`).noToast(true).query({
	...options,
	ifExists
}).then((r) => unwrap$1(r));
/**
* 新增外键。
*
* @param tableName 本表
* @param payload 外键定义
*/
var addDbForeignKey = (tableName, payload) => http().post(`/ms/monitor/db/table/${encodeURIComponent(tableName)}/foreign-key`).noToast(true).data(payload).then((r) => unwrap$1(r));
/**
* 删除外键。
*
* @param tableName 本表
* @param fkName 约束名
* @param datasourceId 数据源 ID
* @param database 库名
*/
var dropDbForeignKey = (tableName, fkName, datasourceId, database) => http().delete(`/ms/monitor/db/table/${encodeURIComponent(tableName)}/foreign-key/${encodeURIComponent(fkName)}`).noToast(true).query({
	datasourceId,
	database
}).then((r) => unwrap$1(r));
//#endregion
//#region ../../pages/datasource/src/api/dbViewPref.ts
/**
* 数据库管理器的本地偏好存储（F5）
*
* <p>两套作用域，刻意分开：</p>
* <ul>
*   <li><b>视图偏好</b>（表头模式 / 行模式 / 每页行数 / 统计总数 / ER 图设置 / 上次数据源）：
*       全局一份。这是「我怎么读表」的显示偏好，按表各存一份等于
*       要为每张表重设一遍。</li>
*   <li><b>每表查询偏好</b>（WHERE 快速筛选 + 高级筛选条件）：<b>按 {@code 库.表} 分键</b>。
*       这里不是洁癖：A 表的 {@code status = 1} 套到 B 表上会引用
*       B 表根本不存在的列，直接报错。E2 的列偏好已经踩过同一个坑 ——
*       用全局一份会让「在 A 表隐藏的列到 B 表也消失」。</li>
* </ul>
*
* <p>三条硬要求：</p>
* <ol>
*   <li><b>读到坏数据不崩</b>：localStorage 里的东西可能被别的代码、手改、
*       旧版本写坏。解析失败一律回落默认值 —— 偏好丢了不该导致表打不开。</li>
*   <li><b>逐字段校验</b>：整体 JSON 合法不代表字段合法（{@code pageSize: -1}
*       或 {@code headerMode: "xxx"}）。不合法的单个字段单独回落，不牵连其他字段。</li>
*   <li><b>容量有上限</b>：每表一份筛选条件，500 张表就能把 5MB 配额撑爆，
*       之后连写入都失败（静默丢偏好）。按最近使用时间淘汰。</li>
* </ol>
*
* @author CH
* @since 4.0.0
*/
/** 每表偏好最多保留多少条（超出按最近使用时间淘汰） */
var MAX_TABLE_PREFS = 120;
/** 视图偏好存储键 */
var VIEW_KEY = "dbm-view-pref";
/** 每表查询偏好存储键（内部按表再分一层） */
var TABLE_KEY = "dbm-table-pref";
/** 存储结构版本；结构不兼容时 +1，旧数据直接丢弃而不是尝试迁移 */
var SCHEMA_VERSION = 1;
/** 允许的表头模式 */
var HEADER_MODES = [
	"name",
	"comment",
	"both",
	"type"
];
/** 允许的行显示模式 */
var ROW_MODES = ["data", "data-comment"];
/** 允许的每页行数（与界面分页选项一致） */
var PAGE_SIZES = [
	20,
	50,
	100,
	200,
	500
];
/** 允许的 ER 图布局（非层级：树形布局在普通关系图上会抛 Tree structure not found） */
var ER_LAYOUTS = [
	"dagre",
	"antv-dagre",
	"force",
	"d3-force",
	"circular",
	"grid"
];
/** 默认视图偏好 */
var DEFAULT_VIEW_PREF = {
	headerMode: "name",
	rowMode: "data",
	pageSize: 50,
	showTotal: true,
	erLayout: "dagre",
	erShowLabels: true,
	erTableFilter: "",
	lastDatasourceId: 0
};
/**
* 从任意值里取第一个合法候选。
*
* <p>用来做**逐字段**回落：整体 JSON 能解析不代表每个字段都合法，
* 而一个非法字段不该把其余合法字段一起拖成默认值。</p>
*/
function pick(value, allowed, fallback) {
	return allowed.includes(value) ? value : fallback;
}
/** 读原始 JSON，坏数据返回空对象而不是抛错 */
function readBag(key) {
	try {
		const raw = localStorage.getItem(key);
		if (!raw) return {};
		const parsed = JSON.parse(raw);
		return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
	} catch {
		return {};
	}
}
/** 写 JSON；失败只警告一次，不打断使用 */
function writeBag(key, value) {
	try {
		localStorage.setItem(key, JSON.stringify(value));
	} catch {
		console.warn("[dbm] 本地偏好写入失败，本次设置不会保留");
	}
}
/**
* 读视图偏好，逐字段回落默认值。
*
* @returns 视图偏好
*/
function loadViewPref() {
	const bag = readBag(VIEW_KEY);
	if (bag.v !== SCHEMA_VERSION) return { ...DEFAULT_VIEW_PREF };
	const pageSizeRaw = Number(bag.pageSize);
	return {
		headerMode: pick(bag.headerMode, HEADER_MODES, DEFAULT_VIEW_PREF.headerMode),
		rowMode: pick(bag.rowMode, ROW_MODES, DEFAULT_VIEW_PREF.rowMode),
		pageSize: PAGE_SIZES.includes(pageSizeRaw) ? pageSizeRaw : DEFAULT_VIEW_PREF.pageSize,
		showTotal: typeof bag.showTotal === "boolean" ? bag.showTotal : DEFAULT_VIEW_PREF.showTotal,
		erLayout: pick(bag.erLayout, ER_LAYOUTS, DEFAULT_VIEW_PREF.erLayout),
		erShowLabels: typeof bag.erShowLabels === "boolean" ? bag.erShowLabels : DEFAULT_VIEW_PREF.erShowLabels,
		erTableFilter: typeof bag.erTableFilter === "string" ? bag.erTableFilter.slice(0, 200) : DEFAULT_VIEW_PREF.erTableFilter,
		lastDatasourceId: Number.isFinite(Number(bag.lastDatasourceId)) ? Number(bag.lastDatasourceId) : DEFAULT_VIEW_PREF.lastDatasourceId
	};
}
/**
* 保存视图偏好（合并式，只写传入的字段）。
*
* @param patch 要更新的字段
*/
function saveViewPref(patch) {
	writeBag(VIEW_KEY, {
		v: SCHEMA_VERSION,
		...loadViewPref(),
		...patch
	});
}
/**
* 读某张表的查询偏好。
*
* @param key {@code 库.表} 形式的键
* @returns 没有偏好时返回 null
*/
function loadTablePref(key) {
	if (!key) return null;
	const raw = readBag(TABLE_KEY)[key];
	if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
	const rec = raw;
	return {
		filterWhere: typeof rec.filterWhere === "string" ? rec.filterWhere : "",
		filters: sanitizeFilters(rec.filters),
		at: Number.isFinite(Number(rec.at)) ? Number(rec.at) : 0
	};
}
/**
* 保存某张表的查询偏好，并顺带做容量淘汰。
*
* @param key  {@code 库.表} 形式的键
* @param pref 偏好内容（{@code at} 由本函数写入）
*/
function saveTablePref(key, pref) {
	if (!key) return;
	const bag = readBag(TABLE_KEY);
	bag[key] = {
		...pref,
		at: Date.now()
	};
	const keys = Object.keys(bag);
	if (keys.length > MAX_TABLE_PREFS) {
		const at = (k) => {
			const v = bag[k];
			return v && typeof v === "object" ? Number(v.at) || 0 : 0;
		};
		const drop = keys.sort((a, b) => at(a) - at(b)).slice(0, keys.length - MAX_TABLE_PREFS);
		for (const k of drop) delete bag[k];
	}
	writeBag(TABLE_KEY, bag);
}
/**
* 清掉某张表的查询偏好。
*
* @param key {@code 库.表} 形式的键
*/
function clearTablePref(key) {
	if (!key) return;
	const bag = readBag(TABLE_KEY);
	if (!(key in bag)) return;
	delete bag[key];
	writeBag(TABLE_KEY, bag);
}
/**
* 清掉**不再存在**的表的偏好。
*
* <p>表被改名或删掉后，它的偏好会一直占着位置，把真正在用的挤出上限。
* 每次刷新时按「当前库里真实存在的表」对一遍。</p>
*
* @param existingKeys 当前仍然存在的 {@code 库.表} 键集合
* @returns 被清掉的条目数
*/
function pruneTablePrefs(existingKeys) {
	const bag = readBag(TABLE_KEY);
	const stale = Object.keys(bag).filter((k) => !existingKeys.has(k));
	if (stale.length === 0) return 0;
	for (const k of stale) delete bag[k];
	writeBag(TABLE_KEY, bag);
	return stale.length;
}
/**
* 清空全部偏好（界面上「恢复默认」用，也是验收脚本的复位入口）。
*/
function resetAllPrefs() {
	try {
		localStorage.removeItem(VIEW_KEY);
		localStorage.removeItem(TABLE_KEY);
	} catch {}
}
/**
* 过滤条件数组的清洗。
*
* <p>只保留「列名 + 运算符都是非空串」的项：半条条件（只有列没有运算符）
* 会被后端 `DbFilter` 判为参数错误，而报错发生在**加载数据时**，
* 用户只会看到「打开这张表就报错」，根本想不到是上次的筛选条件坏了。</p>
*/
function sanitizeFilters(raw) {
	if (!Array.isArray(raw)) return [];
	return raw.filter((f) => !!f && typeof f === "object").filter((f) => typeof f.column === "string" && f.column.trim() !== "").filter((f) => typeof f.op === "string" && f.op.trim() !== "").map((f) => ({
		column: String(f.column),
		op: String(f.op),
		value: typeof f.value === "string" ? f.value : String(f.value ?? ""),
		...typeof f.value2 === "string" && f.value2 !== "" ? { value2: f.value2 } : {}
	}));
}
//#endregion
//#region ../../pages/datasource/src/api/dbQueryApi.ts
/** 与 dbManageApi 同款解包：把 ReturnResult 的 data 取出来 */
var unwrap = (res) => unwrapResult(res);
/**
* 批量执行 SQL 脚本（逐条返回结果）
*
* <p>遇错默认停止；把 {@code stopOnError} 设为 false 则继续跑完，
* 失败的那条也占一个条目并带上原因。</p>
*
* @param sql 脚本原文
* @param datasourceId 数据源 ID（可选）
* @param database 目标库（可选）
* @param params {@code ${name}} 占位符取值（可选）
* @param stopOnError 遇错是否停止（默认 true）
* @param txId 显式事务 ID（可选）；传了就在该事务的连接上执行
* @param timeoutMs 请求超时毫秒（可选；第九批 8.1 执行超时可配）。
*                  不传用全局默认 10s；传 0 = 不设上限（axios 约定）
* @returns 批量执行结果
*/
var executeDbSqlBatch = (sql, datasourceId, database, params, stopOnError, txId, timeoutMs) => {
	const req = http().post("/ms/monitor/db/execute-batch").noToast(true).data({
		sql,
		datasourceId,
		database,
		params,
		stopOnError,
		txId
	});
	return (timeoutMs === void 0 ? req : req.timeout(timeoutMs)).then((r) => unwrap(r));
};
/**
* 开启显式事务。
*
* <p>返回的 txId 要一路带到后续执行/commit/rollback ——
* 后端把连接跨请求持有，靠的就是这个 ID 找到同一条连接。</p>
*
* @param datasourceId 数据源 ID（可选）
* @param database 目标库（可选）
* @returns 新建的事务标识与库
*/
var beginDbTx = (datasourceId, database) => http().post("/ms/monitor/db/tx/begin").noToast(true).data({
	datasourceId,
	database
}).then((r) => unwrap(r));
/**
* 提交事务。
* @param txId 事务标识
*/
var commitDbTx = (txId) => http().post("/ms/monitor/db/tx/commit").noToast(true).data({ txId }).then((r) => unwrap(r));
/**
* 回滚事务。
* @param txId 事务标识
*/
var rollbackDbTx = (txId) => http().post("/ms/monitor/db/tx/rollback").noToast(true).data({ txId }).then((r) => unwrap(r));
/**
* 查询未结束的事务。
*
* <p>用途是「界面显示开着事务，后端其实没有」的自检 ——
* 页面刷新后前端状态会丢，而后端那条连接还活着，
* 不查一次就会变成一个用户看不见、也关不掉的孤儿事务。</p>
*/
var fetchDbTxStatus = () => http().get("/ms/monitor/db/tx/status").noToast(true).then((r) => unwrap(r));
/**
* 扫描 SQL 里的 {@code ${name}} 占位符。
*
* <p>不连库、也不执行，纯文本扫描 —— 编辑器每次改动都问一次后端，
* 成本会体现在每次按键的延迟上，所以这个端点必须是纯扫描。</p>
*
* @param sql 待扫描 SQL
* @returns 按出现顺序去重的变量名
*/
var scanSqlParams = (sql) => http().post("/ms/monitor/db/scan-params").noToast(true).data({ sql }).then((r) => unwrap(r));
//#endregion
//#region ../../pages/datasource/src/views/console/DatabaseManagerView.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1 = { class: "dbm-toolbar re-surface re-surface--dense" };
var _hoisted_2 = {
	key: 0,
	class: "dbm-toolbar-left dbm-table-toolbar"
};
var _hoisted_3 = { class: "dbm-table-name" };
var _hoisted_4 = { class: "dbm-subtabs" };
var _hoisted_5 = ["onClick"];
var _hoisted_6 = { class: "dbm-subtabs" };
var _hoisted_7 = ["onClick"];
var _hoisted_8 = {
	key: 1,
	class: "dbm-toolbar-left"
};
var _hoisted_9 = { class: "dbm-toolbar-right" };
var _hoisted_10 = {
	key: 0,
	class: "dbm-pager-bar"
};
var _hoisted_11 = {
	key: 1,
	class: "dbm-simple-pager"
};
var _hoisted_12 = { class: "dbm-hint" };
var _hoisted_13 = { class: "dbm-switch" };
var _hoisted_14 = {
	key: 3,
	class: "dbm-ds-chip"
};
var _hoisted_15 = { class: "dbm-body" };
var _hoisted_16 = { class: "dbm-tree-label" };
var _hoisted_17 = ["onClick", "onContextmenu"];
var _hoisted_18 = { class: "dbm-tree-label" };
var _hoisted_19 = {
	key: 0,
	class: "dbm-tree-children"
};
var _hoisted_20 = ["onClick", "onContextmenu"];
var _hoisted_21 = ["title"];
var _hoisted_22 = {
	key: 0,
	class: "dbm-tree-remark"
};
var _hoisted_23 = {
	key: 0,
	class: "dbm-tree-children"
};
var _hoisted_24 = ["title"];
var _hoisted_25 = { class: "dbm-tree-type" };
var _hoisted_26 = ["onClick"];
var _hoisted_27 = { class: "dbm-tree-label" };
var _hoisted_28 = { class: "dbm-tree-remark" };
var _hoisted_29 = {
	key: 0,
	class: "dbm-tree-children"
};
var _hoisted_30 = {
	key: 0,
	class: "dbm-tree-hint"
};
var _hoisted_31 = ["onClick"];
var _hoisted_32 = ["title"];
var _hoisted_33 = {
	key: 0,
	class: "dbm-tree-remark"
};
var _hoisted_34 = {
	key: 1,
	class: "dbm-tree-remark"
};
var _hoisted_35 = ["onClick", "onContextmenu"];
var _hoisted_36 = ["title"];
var _hoisted_37 = {
	key: 0,
	class: "dbm-tree-remark"
};
var _hoisted_38 = {
	key: 0,
	class: "dbm-tree-children"
};
var _hoisted_39 = ["title"];
var _hoisted_40 = { class: "dbm-tree-type" };
var _hoisted_41 = { class: "dbm-content" };
var _hoisted_42 = ["onClick", "onContextmenu"];
var _hoisted_43 = { class: "dbm-tab-title" };
var _hoisted_44 = {
	key: 1,
	class: "dbm-table-view"
};
var _hoisted_45 = { class: "dbm-filter-bar" };
var _hoisted_46 = {
	key: 0,
	class: "dbm-filter-badge"
};
var _hoisted_47 = { class: "dbm-filter-input-wrap" };
var _hoisted_48 = {
	key: 0,
	class: "dbm-filter-badge"
};
var _hoisted_49 = {
	key: 2,
	class: "dbm-sel-count"
};
var _hoisted_50 = {
	key: 1,
	class: "dbm-cell-box"
};
var _hoisted_51 = ["aria-label", "onClick"];
var _hoisted_52 = { class: "dbm-cell-blob-text" };
var _hoisted_53 = {
	key: 2,
	class: "dbm-cell-box"
};
var _hoisted_54 = ["title", "onClick"];
var _hoisted_55 = {
	key: 0,
	class: "dbm-cell-comment"
};
var _hoisted_56 = {
	key: 2,
	class: "dbm-design-view"
};
var _hoisted_57 = { class: "dbm-design-toolbar" };
var _hoisted_58 = { class: "dbm-table-name" };
var _hoisted_59 = { class: "dbm-subtabs" };
var _hoisted_60 = { class: "dbm-col-actions" };
var _hoisted_61 = { class: "dbm-dgrid" };
var _hoisted_62 = { class: "dbm-dgrid-idx" };
var _hoisted_63 = { class: "dbm-dgrid-pk" };
var _hoisted_64 = { class: "dbm-dgrid-ops" };
var _hoisted_65 = {
	key: 3,
	class: "dbm-query-view"
};
var _hoisted_66 = { class: "dbm-query-editor" };
var _hoisted_67 = { class: "dbm-query-toolbar" };
var _hoisted_68 = { class: "dbm-query-result" };
var _hoisted_69 = {
	key: 0,
	class: "dbm-result-set-tabs"
};
var _hoisted_70 = ["onClick"];
var _hoisted_71 = { class: "dbm-result-header" };
var _hoisted_72 = {
	key: 0,
	class: "dbm-result-message"
};
var _hoisted_73 = {
	key: 1,
	class: "dbm-result-message"
};
var _hoisted_74 = {
	key: 2,
	class: "dbm-result-message"
};
var _hoisted_75 = {
	key: 2,
	class: "dbm-result-error"
};
var _hoisted_76 = { class: "dbm-result-error-title" };
var _hoisted_77 = { class: "dbm-result-error-body" };
var _hoisted_78 = {
	key: 3,
	class: "dbm-result-plain"
};
var _hoisted_79 = {
	key: 0,
	class: "dbm-history"
};
var _hoisted_80 = { class: "dbm-history-head" };
var _hoisted_81 = { class: "dbm-hint" };
var _hoisted_82 = { class: "dbm-history-list" };
var _hoisted_83 = ["title", "onClick"];
var _hoisted_84 = { class: "dbm-history-time" };
var _hoisted_85 = { class: "dbm-history-sql" };
var _hoisted_86 = { class: "dbm-history-meta" };
var _hoisted_87 = {
	key: 1,
	class: "dbm-history dbm-tpl-panel"
};
var _hoisted_88 = { class: "dbm-history-head" };
var _hoisted_89 = { class: "dbm-hint" };
var _hoisted_90 = { class: "dbm-history-list" };
var _hoisted_91 = ["title", "onClick"];
var _hoisted_92 = { class: "dbm-history-time" };
var _hoisted_93 = { class: "dbm-tpl-name" };
var _hoisted_94 = { class: "dbm-history-sql" };
var _hoisted_95 = {
	key: 4,
	class: "dbm-er-view"
};
var _hoisted_96 = { class: "dbm-er-toolbar" };
var _hoisted_97 = { class: "dbm-table-name" };
var _hoisted_98 = { class: "dbm-er-stat" };
var _hoisted_99 = {
	key: 0,
	class: "dbm-er-mask"
};
var _hoisted_100 = { class: "dbm-er-list" };
var _hoisted_101 = [
	"title",
	"onClick",
	"onDblclick"
];
var _hoisted_102 = { class: "dbm-er-list-name" };
var _hoisted_103 = { class: "dbm-er-list-deg" };
var _hoisted_104 = { class: "dbm-er-cols" };
var _hoisted_105 = { class: "dbm-er-col-name" };
var _hoisted_106 = { class: "dbm-er-col-type" };
var _hoisted_107 = { class: "dbm-er-col-flags" };
var _hoisted_108 = {
	key: 0,
	class: "dbm-er-flag pk"
};
var _hoisted_109 = {
	key: 1,
	class: "dbm-er-flag null"
};
var _hoisted_110 = {
	key: 5,
	class: "dbm-object-view"
};
var _hoisted_111 = { class: "dbm-object-toolbar" };
var _hoisted_112 = { class: "dbm-table-name" };
var _hoisted_113 = {
	key: 0,
	class: "dbm-import-preview-hint"
};
var _hoisted_114 = {
	key: 6,
	class: "dbm-empty"
};
var _hoisted_115 = { class: "dbm-sync" };
var _hoisted_116 = { class: "dbm-sync-bar" };
var _hoisted_117 = { class: "dbm-sync-side" };
var _hoisted_118 = { class: "dbm-sync-side" };
var _hoisted_119 = {
	key: 3,
	class: "dbm-sync-body"
};
var _hoisted_120 = { class: "dbm-sync-summary" };
var _hoisted_121 = { class: "dbm-sync-list" };
var _hoisted_122 = { class: "dbm-sync-kind" };
var _hoisted_123 = { class: "dbm-sync-obj" };
var _hoisted_124 = { class: "dbm-sync-detail" };
var _hoisted_125 = {
	key: 0,
	class: "dbm-sync-script-wrap"
};
var _hoisted_126 = { class: "dbm-sync-script-head" };
var _hoisted_127 = { class: "dbm-sync-script" };
var _hoisted_128 = { class: "dbm-doc-export" };
var _hoisted_129 = { class: "dbm-doc-row" };
var _hoisted_130 = { class: "dbm-doc-value" };
var _hoisted_131 = { class: "dbm-doc-row" };
var _hoisted_132 = ["value"];
var _hoisted_133 = { class: "dbm-doc-row" };
var _hoisted_134 = ["value"];
var _hoisted_135 = {
	key: 0,
	class: "dbm-doc-error"
};
var _hoisted_136 = { class: "dbm-doc-preview-wrap" };
var _hoisted_137 = {
	key: 0,
	class: "dbm-doc-preview-loading"
};
var _hoisted_138 = {
	key: 1,
	class: "dbm-doc-preview-error"
};
var _hoisted_139 = ["srcdoc"];
var _hoisted_140 = { class: "dbm-colset" };
var _hoisted_141 = { class: "dbm-colset-head" };
var _hoisted_142 = { class: "dbm-colset-list" };
var _hoisted_143 = ["onUpdate:modelValue", "aria-label"];
var _hoisted_144 = { class: "dbm-colset-name" };
var _hoisted_145 = [
	"disabled",
	"aria-label",
	"title",
	"onClick"
];
var _hoisted_146 = { class: "dbm-blob" };
var _hoisted_147 = { class: "dbm-blob-head" };
var _hoisted_148 = { class: "dbm-blob-meta" };
var _hoisted_149 = { class: "dbm-blob-tabs" };
var _hoisted_150 = ["onClick"];
var _hoisted_151 = { class: "dbm-switch" };
var _hoisted_152 = {
	key: 0,
	class: "dbm-blob-image"
};
var _hoisted_153 = ["src"];
var _hoisted_154 = {
	key: 2,
	class: "dbm-blob-hex"
};
var _hoisted_155 = { class: "dbm-filter-list" };
var _hoisted_156 = ["data-filter-row"];
var _hoisted_157 = {
	key: 0,
	class: "dbm-filter-novalue"
};
var _hoisted_158 = { class: "dbm-create-form" };
var _hoisted_159 = { class: "dbm-form-item" };
var _hoisted_160 = { class: "dbm-form-item" };
var _hoisted_161 = { class: "dbm-form-item" };
var _hoisted_162 = { class: "dbm-import" };
var _hoisted_163 = { class: "dbm-import-step" };
var _hoisted_164 = {
	key: 0,
	class: "dbm-import-file"
};
var _hoisted_165 = {
	key: 1,
	class: "dbm-hint"
};
var _hoisted_166 = { class: "dbm-import-params" };
var _hoisted_167 = { class: "dbm-form-item" };
var _hoisted_168 = { class: "dbm-form-item" };
var _hoisted_169 = { class: "dbm-form-item" };
var _hoisted_170 = { class: "dbm-import-params" };
var _hoisted_171 = { class: "dbm-form-item" };
var _hoisted_172 = { class: "dbm-hint" };
var _hoisted_173 = { class: "dbm-form-item" };
var _hoisted_174 = { class: "dbm-form-item" };
var _hoisted_175 = { class: "dbm-form-item" };
var _hoisted_176 = {
	key: 0,
	class: "dbm-danger-hint"
};
var _hoisted_177 = {
	key: 0,
	class: "dbm-import-preview-hint"
};
var _hoisted_178 = {
	key: 1,
	class: "dbm-import-preview"
};
var _hoisted_179 = { class: "dbm-import-preview-head" };
var _hoisted_180 = { class: "dbm-hint" };
var _hoisted_181 = { class: "dbm-mapping-cell" };
var _hoisted_182 = { class: "dbm-mapping-src" };
var _hoisted_183 = {
	key: 0,
	class: "dbm-danger-hint"
};
var _hoisted_184 = {
	key: 2,
	class: "dbm-import-result"
};
var _hoisted_185 = { class: "dbm-import-result-head" };
var _hoisted_186 = {
	key: 0,
	class: "dbm-import-errors"
};
var _hoisted_187 = { class: "dbm-create-form" };
var _hoisted_188 = { class: "dbm-form-item" };
var _hoisted_189 = { class: "dbm-form-item" };
var _hoisted_190 = { class: "dbm-form-item" };
var _hoisted_191 = {
	key: 0,
	class: "dbm-form-item"
};
var _hoisted_192 = {
	key: 1,
	class: "dbm-form-item"
};
var _hoisted_193 = {
	key: 2,
	class: "dbm-form-item"
};
var _hoisted_194 = {
	key: 3,
	class: "dbm-danger-hint"
};
var _hoisted_195 = { class: "dbm-create-form" };
var _hoisted_196 = { class: "dbm-form-item" };
var _hoisted_197 = { class: "dbm-form-item" };
var _hoisted_198 = { class: "dbm-form-item" };
var _hoisted_199 = { class: "dbm-form-item" };
var _hoisted_200 = { class: "dbm-form-item" };
var _hoisted_201 = { class: "dbm-form-item" };
var _hoisted_202 = {
	key: 0,
	class: "dbm-auto-hint"
};
var _hoisted_203 = { class: "dbm-create-form" };
var _hoisted_204 = { class: "dbm-form-item" };
var _hoisted_205 = { class: "dbm-form-item" };
var _hoisted_206 = {
	key: 0,
	class: "dbm-form-item"
};
var _hoisted_207 = {
	key: 1,
	class: "dbm-form-item"
};
var _hoisted_208 = {
	key: 2,
	class: "dbm-form-item"
};
var _hoisted_209 = {
	key: 3,
	class: "dbm-form-item"
};
var _hoisted_210 = {
	key: 4,
	class: "dbm-form-item"
};
var _hoisted_211 = { class: "dbm-form-item" };
var _hoisted_212 = { class: "dbm-form-item" };
var _hoisted_213 = { class: "dbm-form-item" };
var _hoisted_214 = {
	key: 6,
	class: "dbm-form-item"
};
var _hoisted_215 = { class: "dbm-form-item" };
var _hoisted_216 = {
	key: 7,
	class: "dbm-form-item"
};
var _hoisted_217 = { class: "dbm-form-item" };
var _hoisted_218 = { class: "dbm-create-form" };
var _hoisted_219 = {
	key: 0,
	class: "dbm-form-item"
};
var _hoisted_220 = { class: "dbm-form-item" };
var _hoisted_221 = { class: "dbm-form-item" };
var _hoisted_222 = { class: "dbm-idx-cols" };
var _hoisted_223 = {
	key: 0,
	class: "dbm-idx-order"
};
var _hoisted_224 = { class: "dbm-idx-order-no" };
var _hoisted_225 = ["disabled", "onClick"];
var _hoisted_226 = ["disabled", "onClick"];
var _hoisted_227 = {
	key: 1,
	class: "dbm-form-item"
};
var _hoisted_228 = { class: "dbm-idx-prefix" };
var _hoisted_229 = { class: "dbm-idx-order-no" };
var _hoisted_230 = { class: "dbm-mono dbm-idx-prefix-name" };
var _hoisted_231 = {
	key: 2,
	class: "dbm-form-item"
};
var _hoisted_232 = { class: "dbm-form-item" };
var _hoisted_233 = { class: "dbm-create-form" };
var _hoisted_234 = {
	key: 0,
	class: "dbm-hint"
};
var _hoisted_235 = ["data-param-name"];
var _hoisted_236 = { class: "dbm-ai-body" };
var _hoisted_237 = { class: "dbm-ai-hint" };
var _hoisted_238 = ["title"];
var _hoisted_239 = {
	key: 0,
	class: "dbm-ai-sql",
	"data-testid": "dbm-ai-sql"
};
var _hoisted_240 = { class: "dbm-create-form" };
var _hoisted_241 = { class: "dbm-form-item" };
var _hoisted_242 = { class: "dbm-form-item" };
var _hoisted_243 = { class: "dbm-form-item" };
var _hoisted_244 = { class: "dbm-form-item" };
var _hoisted_245 = { class: "dbm-form-item" };
var _hoisted_246 = {
	key: 0,
	class: "dbm-idx-order"
};
var _hoisted_247 = { class: "dbm-idx-order-no" };
var _hoisted_248 = ["disabled", "onClick"];
var _hoisted_249 = ["disabled", "onClick"];
var _hoisted_250 = { class: "dbm-create-form" };
var _hoisted_251 = ["value"];
/**
* 每张表的列偏好（隐藏哪些、固定哪些）。
*
* <p>按 `库.表` 存，**不是**全局一份 —— 宽表和大宽表的可见列集完全不同，
* 用全局一份会导致在 A 表隐藏的列到 B 表也消失，用户完全无法预期。</p>
*/
var COLUMN_PREF_KEY = "dbm-column-pref";
var HISTORY_KEY = "dbm-query-history";
/** 历史条数上限：再往上浏览器存储会被撑大，而 200 条已经远超日常回溯需要 */
var HISTORY_LIMIT = 200;
/**
* 从 localStorage 读历史。
*
* <p>存储损坏（被别的标签页写坏、手工改坏）时返回空数组而不是抛错 ——
* 历史是便利功能，不该因为它坏了就打不开查询页签。</p>
*/
var TPL_KEY = "dbm-sql-templates";
/** 模板条数上限：单条就是一段 SQL，100 个已远超日常需要 */
var TPL_LIMIT = 100;
/**
* 从 localStorage 读模板。
*
* <p>存储损坏时返回空数组而不是抛错 —— 模板是便利功能，
* 不该因为它坏了就打不开查询页签（与历史同一策略）。</p>
*
* @returns 模板列表
*/
var EXEC_TIMEOUT_KEY = "dbm-exec-timeout-sec";
//#endregion
//#region ../../pages/datasource/src/views/console/DatabaseManagerView.vue
var DatabaseManagerView_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	__name: "DatabaseManagerView",
	props: {
		datasourceId: { default: void 0 },
		embedded: {
			type: Boolean,
			default: false
		}
	},
	setup(__props) {
		/**
		* 数据库管理页
		*
		* 提供数据源/数据库/表/视图的浏览、SQL 查询执行、表结构查看与建表/删表操作。
		* @author CH
		* @since 4.0.0
		*/
		const route = useRoute();
		/**
		* 组件属性。
		*
		* <p>内嵌到数据源中心（{@link ScDataCenterView}）时由宿主传入 datasourceId，
		* 并跟随宿主左栏的选中项切换；独立路由（/db-manager）则回落到 URL 上的
		* datasourceId。两处都不传时用默认主数据源。</p>
		*/
		const props = __props;
		const { embedded } = props;
		/** 默认主数据源：后端把 datasourceId=0/null 解析为主数据源，这里把它显式作为下拉首项 */
		const DEFAULT_DATASOURCE = {
			id: 0,
			name: "默认主数据源",
			type: "master"
		};
		const datasources = ref([DEFAULT_DATASOURCE]);
		const currentDatasourceId = ref(DEFAULT_DATASOURCE.id ?? 0);
		const currentDatasourceName = computed(() => {
			const ds = datasources.value.find((d) => d.id === currentDatasourceId.value);
			return ds ? ds.name : DEFAULT_DATASOURCE.name;
		});
		/**
		* 数据源下拉选项。
		*
		* <p>副标题给类型与地址：台账里有十几项时，光看名字分不出是哪个库。</p>
		*/
		const datasourceOptions = computed(() => datasources.value.map((ds) => {
			const parts = [ds.type, ds.database || ds.host].filter(Boolean);
			return {
				value: String(ds.id ?? 0),
				label: ds.name,
				description: parts.length ? parts.join(" · ") : ""
			};
		}));
		/** 选中数据源：组件给的是字符串，这里转回 number —— 本页的 id 要直接喂给各 API */
		function onDatasourcePick(value) {
			currentDatasourceId.value = Number(value) || 0;
		}
		const databases = ref([]);
		/** 按库缓存表列表，避免展开第二个库时显示上一个库的表 */
		const tablesByDb = reactive({});
		/** 每个库的四类对象清单 */
		const objectsByDb = reactive({});
		/** 每个库的四类对象计数（树节点角标） */
		const objectCounts = reactive({});
		/** 某一类读不到时的原因（权限不足 / 内核无此概念），显示在节点上 */
		const objectErrors = reactive({});
		/** 拉取某库的对象清单与计数（展开分类节点时调用）。 */
		async function loadDbObjects(db) {
			if (!db) return;
			try {
				const summary = await fetchDbObjectSummary(currentDatasourceId.value, db);
				objectCounts[db] = summary.counts;
				objectErrors[db] = summary.errors ?? {};
			} catch (e) {
				objectCounts[db] = {
					procedure: 0,
					function: 0,
					trigger: 0,
					event: 0
				};
				objectErrors[db] = {};
			}
		}
		/** 拉取某库某一类的对象清单。 */
		async function loadDbObjectList(db, category) {
			if (!db) return;
			if (!objectsByDb[db]) objectsByDb[db] = {};
			try {
				objectsByDb[db][category] = await fetchDbObjects(category, currentDatasourceId.value, db);
			} catch (e) {
				objectsByDb[db][category] = [];
				const hint = String(e?.message ?? e);
				if (!objectErrors[db]) objectErrors[db] = {};
				objectErrors[db][category] = hint;
			}
		}
		/** 某库某一类的对象清单 */
		function objectsOf(db, category) {
			return objectsByDb[db]?.[category] ?? [];
		}
		/** 某库某一类的对象数（清单未拉时回落到计数接口的值） */
		function objectCountOf(db, category) {
			const loaded = objectsByDb[db]?.[category];
			if (loaded) return loaded.length;
			return objectCounts[db]?.[category] ?? 0;
		}
		/** 某库某一类的读取错误 */
		function objectErrorOf(db, category) {
			return objectErrors[db]?.[category] ?? "";
		}
		/** 分类节点的树 key */
		function objectNodeKey(db, category) {
			return `obj:${db}:${category}`;
		}
		/** 分类节点是否展开（用 dbm-tree 的箭头判断，避免与表节点状态混在一起） */
		function objectNodeExpanded(db, category) {
			return expandedObjects.value.has(objectNodeKey(db, category));
		}
		/** 已展开的对象分类节点 */
		const expandedObjects = ref(/* @__PURE__ */ new Set());
		/**
		* 展开/收起对象分类节点：展开时才拉清单（避免每个库都打 4 个请求）。
		*/
		async function toggleObjectNode(db, category) {
			const key = objectNodeKey(db, category);
			if (expandedObjects.value.has(key)) expandedObjects.value.delete(key);
			else {
				expandedObjects.value.add(key);
				await loadDbObjectList(db, category);
			}
			expandedObjects.value = new Set(expandedObjects.value);
		}
		/** 对象页签正在编辑的定义 */
		const objectDefinition = ref("");
		/** 对象定义是否已改动 */
		const objectDirty = ref(false);
		/** 读定义中 */
		const objectLoading = ref(false);
		/** 保存中 */
		const objectSaving = ref(false);
		ref("");
		/**
		* 打开对象定义页签。
		*
		* @param category 类别
		* @param name 对象名（新建时为空）
		* @param db 所属库
		*/
		async function openObjectDefinition(category, name, db) {
			const tab = {
				id: `${category}:${db}.${name}`,
				type: "object",
				title: name ? `${name}` : `新建${categoryLabel(category)}`,
				database: db,
				objectCategory: category,
				objectName: name
			};
			if (!tabs.value.find((t) => t.id === tab.id)) tabs.value.push(tab);
			activeTab.value = tab.id;
			objectDirty.value = false;
			if (name) {
				objectLoading.value = true;
				try {
					objectDefinition.value = await fetchDbObjectDefinition(category, name, currentDatasourceId.value, db);
				} catch (e) {
					message.error(`读取定义失败: ${String(e?.message ?? e)}`);
					objectDefinition.value = "";
				} finally {
					objectLoading.value = false;
				}
			} else objectDefinition.value = objectTemplateOf(category, db);
		}
		/** 类别中文名 */
		function categoryLabel(category) {
			return DB_OBJECT_CATEGORIES.find((c) => c.value === category)?.label ?? category;
		}
		/**
		* 对象页签的标题。
		*
		* <p>放computed 而不是写在模板表达式里：模板里既不能用 TypeScript 的非空断言
		* {@code !}，也不适合拼多段逻辑。vue-tsc 不报错但 Babel 会在编译期炸掉，
		* 表现为页面整块白屏、树节点一个都不渲染。</p>
		*/
		const objectTabTitle = computed(() => {
			const tab = activeTabObj.value;
			if (tab?.objectName) return `定义 ${tab.objectName}`;
			return `新建${tab?.objectCategory ? categoryLabel(tab.objectCategory) : "对象"}`;
		});
		/**
		* 新建对象的默认骨架。
		*
		* <p>两点必须注意：</p>
		* <ol>
		*   <li><b>反引号里只能包名字</b>：写成 {@code `db.p_new`} 会把点号写进对象名 ——
		*       内核会建出一个名字真叫 {@code db.p_new} 的对象。库由会话定位
		*       （保存请求已带 database，后端会先 USE）。</li>
		*   <li><b>不要拿占位词当库名</b>：早先写死字面量 {@code db}，用户直接保存会得到
		*       {@code Access denied … to database 'information_schema'} 这种与上下文无关的权限错误。</li>
		* </ol>
		*
		* @param category 类别
		* @param db 目标库名
		* @returns 完整 DDL 骨架
		*/
		function objectTemplateOf(category, db) {
			const quoted = (n) => `\`${n}\``;
			const table = tablesOf(db)[0]?.name;
			switch (category) {
				case "procedure": return `CREATE PROCEDURE ${quoted("p_new")}()\nBEGIN\n  SELECT 1;\nEND`;
				case "function": return `CREATE FUNCTION ${quoted("f_new")}(p INT) RETURNS INT DETERMINISTIC\nBEGIN\n  RETURN p;\nEND`;
				case "trigger": return table ? `-- 作用表：${table}\nCREATE TRIGGER ${quoted("tg_new")} BEFORE INSERT ON ${quoted(table)}\nFOR EACH ROW\nBEGIN\n  SET NEW.id = NEW.id;\nEND` : `-- 先在左侧展开本库，这里会自动填入第一张表名\nCREATE TRIGGER ${quoted("tg_new")} BEFORE INSERT ON ${quoted("your_table")}\nFOR EACH ROW\nBEGIN\nEND`;
				default: return `CREATE EVENT ${quoted("ev_new")} ON SCHEDULE EVERY 1 DAY\nDO\n  SELECT 1`;
			}
		}
		/**
		* 保存对象定义（存在同名则先删后建）。
		*/
		async function saveObjectDefinition() {
			const tab = activeTabObj.value;
			if (!tab || tab.type !== "object" || !tab.objectCategory) return;
			const definition = objectDefinition.value.trim();
			if (!definition) {
				message.warning("定义不能为空");
				return;
			}
			objectSaving.value = true;
			try {
				await saveDbObject(tab.objectCategory, definition, {
					datasourceId: currentDatasourceId.value,
					database: tab.database
				}, true);
				message.success("已保存");
				objectDirty.value = false;
				if (tab.database) {
					await loadDbObjects(tab.database);
					await loadDbObjectList(tab.database, tab.objectCategory);
				}
			} catch (e) {
				message.error(`保存失败: ${String(e?.message ?? e)}`);
			} finally {
				objectSaving.value = false;
			}
		}
		/**
		* 删除当前对象。
		*/
		async function deleteCurrentObject() {
			const tab = activeTabObj.value;
			if (!tab || tab.type !== "object" || !tab.objectCategory || !tab.objectName) return;
			try {
				await ElMessageBox.confirm(`确定删除 ${categoryLabel(tab.objectCategory)}「${tab.objectName}」？`, "确认删除", { type: "warning" });
			} catch {
				return;
			}
			try {
				await dropDbObject(tab.objectCategory, tab.objectName, {
					datasourceId: currentDatasourceId.value,
					database: tab.database
				}, true);
				message.success("已删除");
				if (tab.database) {
					await loadDbObjects(tab.database);
					await loadDbObjectList(tab.database, tab.objectCategory);
				}
				closeTab(tab.id);
			} catch (e) {
				message.error(`删除失败: ${String(e?.message ?? e)}`);
			}
		}
		/** 当前选中的库，跨库查看数据/执行 SQL 都以它为准 */
		const activeDatabase = ref("");
		const expandedNodes = ref(/* @__PURE__ */ new Set(["root"]));
		/** 已展开的表节点（db.table） */
		const expandedTables = ref(/* @__PURE__ */ new Set());
		/** 表字段缓存（展开表时懒加载） */
		const tableColumnsCache = reactive({});
		/**
		* 表节点 key
		* @param db 库名
		* @param table 表名
		*/
		function tableNodeKey(db, table) {
			return db + "." + table;
		}
		/**
		* 展开/收起表节点并懒加载字段
		* @param table 表名
		* @param db    库名
		*/
		async function toggleTable(table, db) {
			const key = tableNodeKey(db, table);
			if (expandedTables.value.has(key)) {
				expandedTables.value.delete(key);
				return;
			}
			expandedTables.value.add(key);
			if (!tableColumnsCache[key]) {
				tableColumnsCache[key] = [];
				try {
					tableColumnsCache[key] = await fetchTableColumns(table, currentDatasourceId.value, db);
				} catch (e) {
					message.error(`加载字段失败: ${String(e?.message ?? e)}`);
				}
			}
		}
		/**
		* 已加载的表字段
		* @param db    库名
		* @param table 表名
		*/
		function columnsOf(db, table) {
			return tableColumnsCache[tableNodeKey(db, table)] || [];
		}
		const activeTable = ref("");
		const tabs = ref([]);
		const activeTab = ref("");
		const activeTabObj = computed(() => tabs.value.find((t) => t.id === activeTab.value));
		/**
		* 当前查询标签的 SQL 绑定项。
		*
		* <p>{@link Tab#sql} 为可选字段，而 {@code DbSqlEditor} 的 v-model 契约为必填
		* {@code string}，此处以空串兜底并在写入时回填到当前标签，避免可选值直接参与双向绑定。
		*
		* @return 查询标签 SQL 的可读写计算属性
		*/
		const activeSqlModel = computed({
			get: () => activeTabObj.value?.sql ?? "",
			set: (v) => {
				const t = activeTabObj.value;
				if (t) t.sql = v;
			}
		});
		/**
		* 视图偏好（F5：从本地存储恢复，见 dbViewPref.ts）。
		*
		* <p>声明放在这里而不是紧贴使用处：{@code tableData.pageSize} 在下面就要用到它，
		* 放到使用处后面会变成「先用后声明」。</p>
		*
		* <p>整体读一次、各字段取用 —— 这样「某个字段被写坏」只影响那一个字段，
		* 不会把整份偏好一起拖成默认值。</p>
		*/
		const viewPref = loadViewPref();
		const tableData = reactive({
			columns: [],
			rows: [],
			total: 0,
			page: 1,
			pageSize: viewPref.pageSize
		});
		/** 表头显示模式 */
		const HEADER_MODES = [
			{
				label: "字段",
				value: "name"
			},
			{
				label: "注释",
				value: "comment"
			},
			{
				label: "字段+注释",
				value: "both"
			},
			{
				label: "类型",
				value: "type"
			}
		];
		const headerMode = ref(viewPref.headerMode);
		/**
		* 行显示模式。
		*
		* <p>只有两档：**数据 / 数据+注释**。三档（字段 / 注释 / 字段+注释）在
		* {@link HEADER_MODES}（表头显示模式）里，那是控制表头文字的；
		* 两者的 label 不要重名 —— {@code jdbc-workbench-acceptance.mjs} 用
		* {@code .dbm-subtab:has-text("字段")} 定位，重名后同一个选择器会命中两个元素，
		* {@code .first()} 拿到哪个取决于渲染顺序，断言就会变得不可预测。</p>
		*/
		const ROW_MODES = [{
			label: "数据",
			value: "data"
		}, {
			label: "数据+注释",
			value: "data-comment"
		}];
		const rowMode = ref(viewPref.rowMode);
		/** 是否统计总数（关闭后跳过 COUNT，走「上一页/下一页」模式） */
		const showTotal = ref(viewPref.showTotal);
		/** 列注释映射（表头/行显示模式） */
		const columnComments = reactive({});
		/** WHERE 过滤条件（已应用值） */
		const filterWhere = ref("");
		/**
		* WHERE 过滤条是否展开。
		*
		* <p>默认**折叠**：表页签一打开就是「干净的网格」，WHERE 那行只在需要时出现
		* （点条最左侧的箭头按钮展开）。真正生效的过滤条件会把 {@link filterActive}
		* 顶成 true，由下面的 watch 自动把条撑开——过滤是「改了就得看得见」的事，
		* 默认折叠不能变成「数据被过滤了却看不出为什么」。</p>
		*/
		const filterBarOpen = ref(false);
		/** 当前排序（服务器端） */
		const sortState = reactive({
			prop: "",
			order: ""
		});
		/**
		* 清空排序与过滤条件。
		*
		* <p>这三个是**共享状态**，不是页签私有：切表时若不清，会把上一张表的 {@code ORDER BY} 列名
		* 或高级筛选条件发给新表。新表没有该列时后端直接报错，而 {@code loadTableData} 的 catch
		* 只弹一条提示、**不会清空 {@code tableData}**，于是网格静默保留上一张表的列与数据——现象就是
		* 「页签已切到新表，表头却还是旧表的列」，并连带 {@code pkColumns} 也是旧的，
		* 造成「主键列不可编辑」误判。2026-10-02 JDBC 工作台验收实测复现（无主键表 + score 排序）。</p>
		*
		* <p><b>原实现漏了 {@code activeFilters}</b>（2026-10-05 F5 期间发现）：
		* 手动点「清除过滤」会清它，但切表这条路不会 ——
		* 于是给 A 表设了高级筛选后切到 B 表，B 表的加载请求带着 A 表的列名过去，
		* 必然报错且网格停在旧数据。{@link clearFilter} 的注释里已经写明
		* 「必须同时清掉 filterWhere 与 activeFilters」，这里就是漏了同一处。</p>
		*/
		function resetTableQueryState() {
			sortState.prop = "";
			sortState.order = "";
			filterWhere.value = "";
			activeFilters.value = [];
			filterDraft.value = [];
		}
		/** 当前选中的行 */
		const selection = ref([]);
		/**
		* 记录表格多选（批量删除用）
		* @param rows 选中行
		*/
		function onSelectionChange(rows) {
			selection.value = rows ?? [];
		}
		/**
		* 列头排序（服务器端）：切换升/降/取消并重载
		* @param payload ReTable 排序事件
		*/
		function onSortChange(payload) {
			if (!payload?.order) {
				sortState.prop = "";
				sortState.order = "";
			} else {
				sortState.prop = payload.prop;
				sortState.order = payload.order === "descending" ? "DESC" : "ASC";
			}
			const tab = activeTabObj.value;
			if (tab) {
				tableData.page = 1;
				loadTableData(tab, 1);
			}
		}
		/** 应用 WHERE 过滤（回到第一页） */
		function applyFilter() {
			const tab = activeTabObj.value;
			if (!tab) return;
			tableData.page = 1;
			persistTablePref();
			loadTableData(tab, 1);
		}
		/**
		* 清除过滤。
		*
		* <p>必须**同时**清掉 {@link filterWhere} 与 {@link activeFilters}：
		* 只清文本框的话，「清除过滤」清不掉高级筛选设的条件，
		* 而工具条上「N 个条件」标识还亮着 —— 按钮名与实际效果对不上。</p>
		*/
		function clearFilter() {
			filterWhere.value = "";
			activeFilters.value = [];
			filterDraft.value = [];
			applyFilter();
		}
		const filterDialogVisible = ref(false);
		/**
		* 已生效的结构化筛选条件。
		*
		* <p>与 {@link filterWhere}（自由文本）是**两套独立机制**，同时给出时按 AND 组合：
		* 前者的列名过标识符白名单、值走 PreparedStatement 绑定；
		* 后者只能靠「拒绝分隔符」的黑名单。两条路径各自的安全性不该互相依赖。</p>
		*/
		const activeFilters = ref([]);
		/**
		* 是否存在生效中的过滤（自由文本或结构化条件任一）。
		*
		* <p>两套机制独立（见上），但对「过滤条该不该自己弹开」这件事是一回事：
		* 只要数据被过滤了，条件就必须摆在明面上。</p>
		*/
		const filterActive = computed(() => filterWhere.value.trim() !== "" || activeFilters.value.length > 0);
		watch(filterActive, (active) => {
			if (active) filterBarOpen.value = true;
		});
		/** 弹窗里正在编辑的草稿（点「取消」不影响已生效的条件） */
		const filterDraft = ref([]);
		/**
		* 筛选面板的列候选。
		*
		* <p>刻意**不复用** `designColumns`：那个只在「设计视图」加载，
		* 在数据页签下是空的，于是筛选面板的列下拉会「能打开但一个选项都没有」——
		* 面板正常、点得开、就是没东西可选，从界面上完全看不出哪里错了。
		* 这里独立拉一次列，筛选与设计视图互不依赖。</p>
		*/
		const filterColumns = ref([]);
		/**
		* 加载筛选面板用的列候选。
		*
		* @param tab 当前表页签
		*/
		async function loadFilterColumns(tab) {
			if (!tab.tableName) return;
			try {
				const cols = await fetchTableColumns(tab.tableName, currentDatasourceId.value, tab.database);
				filterColumns.value = cols.map((c) => ({
					name: c.name,
					type: c.type,
					remark: c.remark
				}));
			} catch {
				filterColumns.value = [];
				message.error("加载列信息失败，筛选面板没有可选列");
			}
		}
		/**
		* 下拉里的列选项标签：带类型与注释，避免同名列（大小写不同）分不清。
		*
		* @param c 列
		* @returns 标签文本
		*/
		function columnOptionLabel(c) {
			const type = c.type ? `（${c.type}${c.remark ? " · " + c.remark : ""}）` : "";
			return `${c.name}${type}`;
		}
		/** 打开高级筛选：草稿初始化为已生效条件的副本 */
		function openFilterDialog() {
			const tab = activeTabObj.value;
			if (!tab?.tableName) {
				message.info("先打开一张表再用高级筛选");
				return;
			}
			loadFilterColumns(tab);
			filterDraft.value = activeFilters.value.map((f) => ({ ...f }));
			if (filterDraft.value.length === 0) filterDraft.value.push({
				column: "",
				op: "=",
				value: "",
				value2: ""
			});
			filterDialogVisible.value = true;
		}
		/**
		* 应用高级筛选。
		*
		* <p>无列名的行按「跳过」处理而不是拼进 SQL：用户在多行编辑时留一行空是常态，
		* 直接提交会让整条筛选失败并报「列名非法」，而界面上看不出是哪一行的问题。</p>
		*/
		function applyAdvancedFilter() {
			if (filterDraft.value.length > 0 && filterDraft.value.every((f) => !f.column.trim().length)) {
				message.warning("至少给一条条件选择列名");
				return;
			}
			const usable = filterDraft.value.filter((f) => f.column.trim().length > 0);
			const bad = usable.find((f) => !DB_FILTER_OPS.includes(f.op));
			if (bad) {
				message.warning(`运算符「${bad.op}」不可用`);
				return;
			}
			const missingValue = usable.find((f) => !dbFilterTakesNoValue(f.op) && (!f.value || !f.value.trim().length) && !(dbFilterTakesMultipleValues(f.op) && f.value));
			if (missingValue) {
				message.warning(`条件「${missingValue.column} ${missingValue.op}」还没填值`);
				return;
			}
			const betweenMissing = usable.find((f) => dbFilterNeedsValue2(f.op) && !(f.value2 || "").trim().length);
			if (betweenMissing) {
				message.warning(`区间条件「${betweenMissing.column}」缺上界`);
				return;
			}
			activeFilters.value = usable.map((f) => ({ ...f }));
			filterDialogVisible.value = false;
			const tab = activeTabObj.value;
			if (tab) {
				tableData.page = 1;
				persistTablePref();
				loadTableData(tab, 1);
			}
		}
		/** 批量删除选中行（按主键定位；无主键时按全列等值定位） */
		async function deleteSelectedRows() {
			const tab = activeTabObj.value;
			const rows = selection.value;
			if (!tab?.tableName || rows.length === 0) return;
			try {
				await ElMessageBox.confirm(`确定删除选中的 ${rows.length} 行吗？`, "批量删除确认", { type: "warning" });
			} catch {
				return;
			}
			try {
				let affected = 0;
				for (const row of rows) {
					const keys = Object.keys(row);
					if (keys.length === 0) continue;
					const wheres = keys.map((k) => sqlWhereEq(k, row[k])).join(" AND ");
					const res = await executeDbSql(`DELETE FROM ${tab.tableName} WHERE ${wheres}`, currentDatasourceId.value, tab.database);
					affected += typeof res?.affectedRows === "number" ? res.affectedRows : 0;
				}
				if (affected < rows.length) message.warning(`已删除 ${affected} 行；请求的 ${rows.length} 行中有 ${rows.length - affected} 行未命中（可能已被他人删除）`);
				else message.success(`已删除 ${affected} 行`);
				selection.value = [];
				await refreshTableData();
			} catch (e) {
				message.error(`批量删除失败: ${String(e?.message ?? e)}`);
			}
		}
		/**
		* 取列注释
		* @param col 列名
		*/
		function columnComment(col) {
			return columnComments[col] || "";
		}
		/**
		* 表头文案（按显示模式）。
		*
		* <p>「类型」档展示列数据库类型而非列名：宽表看类型分布、
		* 排查「为什么这列排不了序 / 存不进值」时一眼可辨。类型取自跟随
		* 数据一起加载的 {@link columnTypes}（loadPkInfo 写入），没拿到时退回列名。</p>
		*
		* @param col 列名
		*/
		function headerLabel(col) {
			if (headerMode.value === "type") return columnTypes.value.get(col) || col;
			const comment = columnComment(col);
			if (headerMode.value === "name" || !comment) return col;
			return headerMode.value === "comment" ? comment : `${col}（${comment}）`;
		}
		/**
		* 当前打开的是不是视图。
		*
		* <p>视图只能 SELECT：行级的编辑 / 删除 / INSERT / UPDATE / TRUNCATE / DROP TABLE
		* 打在它上面一律被内核拒绝。与其让用户逐个点出失败，不如按对象类型收菜单。</p>
		*/
		const activeIsView = computed(() => {
			const tab = activeTabObj.value;
			if (!tab?.tableName) return false;
			return (getTablesForDb(tab.database || activeDatabase.value).find((t) => t.name === tab.tableName)?.type || "TABLE").toUpperCase() === "VIEW";
		});
		/** 网格右键菜单（Navicat 风格：行操作 + 复制为 SQL + 表操作，替代操作列；icon 传组件） */
		const GRID_MENU_TABLE = [
			{
				key: "edit",
				label: "编辑该行",
				icon: edit_pen_default
			},
			{
				key: "duplicate",
				label: "复制该行（插入副本）",
				icon: copy_document_default
			},
			{
				key: "copy-insert",
				label: "复制为 INSERT 语句",
				icon: copy_document_default
			},
			{
				key: "copy-update",
				label: "复制为 UPDATE 语句",
				icon: copy_document_default
			},
			{
				key: "copy-json",
				label: "复制该行 JSON",
				icon: copy_document_default
			},
			{
				key: "delete",
				label: "删除该行",
				icon: delete_default,
				divided: true
			},
			{
				key: "refresh",
				label: "刷新",
				icon: refresh_right_default,
				divided: true
			},
			{
				key: "truncate",
				label: "清空表",
				icon: delete_default,
				divided: true
			},
			{
				key: "drop",
				label: "删除表",
				icon: delete_default
			}
		];
		/** 视图只读性实测（MariaDB，jdbc_acc，2026-10-12）：简单视图可 UPDATE/DELETE/INSERT，
		*  SELECT/SHOW CREATE/DESCRIBE 一律正常；真正会失败的是 TRUNCATE、DROP TABLE，
		*  以及 duplicateTable 的三条 CREATE TABLE 候选。所以这里只收起那几项，
		*  不把编辑/删除该行这类对简单视图能用的功能一起砍掉。 */
		const GRID_MENU_VIEW = [
			{
				key: "edit",
				label: "编辑该行",
				icon: edit_pen_default
			},
			{
				key: "duplicate",
				label: "复制该行（插入副本）",
				icon: copy_document_default
			},
			{
				key: "copy-insert",
				label: "复制为 INSERT 语句",
				icon: copy_document_default
			},
			{
				key: "copy-update",
				label: "复制为 UPDATE 语句",
				icon: copy_document_default
			},
			{
				key: "copy-select",
				label: "复制为 SELECT 语句",
				icon: copy_document_default
			},
			{
				key: "copy-json",
				label: "复制该行 JSON",
				icon: copy_document_default
			},
			{
				key: "delete",
				label: "删除该行",
				icon: delete_default,
				divided: true
			},
			{
				key: "refresh",
				label: "刷新",
				icon: refresh_right_default,
				divided: true
			},
			{
				key: "drop",
				label: "删除视图",
				icon: delete_default
			}
		];
		const gridMenuItems = computed(() => activeIsView.value ? GRID_MENU_VIEW : GRID_MENU_TABLE);
		/**
		* 生成 SELECT 语句（视图行唯一的复制形态：视图不可写，复制出来只能是查它的语句）
		* @param row 行数据
		*/
		function rowToSelect(row) {
			const tab = activeTabObj.value;
			if (!tab?.tableName) return "";
			const cols = tableData.columns.length ? tableData.columns : Object.keys(row);
			const where = cols.filter((c) => row[c] !== null && row[c] !== void 0 && row[c] !== "").map((c) => `\`${c}\` = ${sqlLiteral(row[c])}`).join(" AND ");
			const proj = cols.map((c) => `\`${c}\``).join(", ");
			return where ? `SELECT ${proj} FROM \`${tab.tableName}\` WHERE ${where};` : `SELECT ${proj} FROM \`${tab.tableName}\`;`;
		}
		/**
		* 生成 INSERT 语句（Navicat 式复制为 SQL）
		* @param row 行数据
		*/
		function rowToInsert(row) {
			const tab = activeTabObj.value;
			if (!tab?.tableName) return "";
			const cols = tableData.columns.length ? tableData.columns : Object.keys(row);
			const values = cols.map((c) => sqlLiteral(row[c])).join(", ");
			return `INSERT INTO ${tab.tableName} (${cols.map((c) => `\`${c}\``).join(", ")}) VALUES (${values});`;
		}
		/**
		* 生成 UPDATE 语句（无主键时按全列等值定位）
		* @param row 行数据
		*/
		function rowToUpdate(row) {
			const tab = activeTabObj.value;
			if (!tab?.tableName) return "";
			const cols = tableData.columns.length ? tableData.columns : Object.keys(row);
			const setCols = cols.filter((c) => !pkColumns.value.has(c));
			const whereCols = pkColumns.value.size ? cols.filter((c) => pkColumns.value.has(c)) : cols;
			const setSql = setCols.map((c) => `\`${c}\` = ${sqlLiteral(row[c])}`).join(", ");
			const whereSql = whereCols.map((c) => sqlWhereEq(c, row[c])).join(" AND ");
			return `UPDATE ${tab.tableName} SET ${setSql || "/* 无可更新列 */"} WHERE ${whereSql};`;
		}
		/**
		* 复制该行为新行（清掉自增列后插入）
		* @param row 行数据
		*/
		async function duplicateRow(row) {
			const tab = activeTabObj.value;
			if (!tab?.tableName) return;
			const cols = (tableData.columns.length ? tableData.columns : Object.keys(row)).filter((c) => !isAutoIncrement(c));
			const values = cols.map((c) => sqlLiteral(row[c])).join(", ");
			try {
				await executeDbSql(`INSERT INTO ${tab.tableName} (${cols.map((c) => `\`${c}\``).join(", ")}) VALUES (${values})`, currentDatasourceId.value, tab.database);
				message.success("已插入副本行");
				await refreshTableData();
			} catch (e) {
				message.error(`插入副本失败: ${String(e?.message ?? e)}`);
			}
		}
		/**
		* 处理网格右键菜单动作
		* @param item 菜单项
		* @param ctx  右键上下文（含行数据）
		*/
		function onGridMenuSelect(item, ctx) {
			const tab = activeTabObj.value;
			switch (item.key) {
				case "edit":
					openEditRowDialog(ctx.row);
					break;
				case "duplicate":
					duplicateRow(ctx.row);
					break;
				case "copy-insert":
					copyText(rowToInsert(ctx.row));
					break;
				case "copy-update":
					copyText(rowToUpdate(ctx.row));
					break;
				case "copy-json":
					copyText(JSON.stringify(ctx.row, null, 2));
					break;
				case "copy-select":
					copyText(rowToSelect(ctx.row));
					break;
				case "delete":
					deleteRow(ctx.row);
					break;
				case "refresh":
					refreshTableData();
					break;
				case "truncate":
					if (tab) confirmTruncate(tab.tableName, tab.database);
					break;
				case "drop": if (tab?.tableName) activeIsView.value ? deleteView(tab.tableName, tab.database) : deleteTable(tab.tableName, tab.database);
			}
		}
		const createDbVisible = ref(false);
		const newDbName = ref("");
		const newDbCharset = ref("utf8mb4");
		const newDbCollation = ref("utf8mb4_general_ci");
		const creatingDb = ref(false);
		const openCreateDatabase = () => {
			newDbName.value = "";
			createDbVisible.value = true;
		};
		/**
		* 切换字符集时同步默认排序规则建议
		*/
		const onCharsetChange = () => {
			newDbCollation.value = `${newDbCharset.value}_general_ci`;
		};
		const createDatabase = async () => {
			if (!newDbName.value.trim()) {
				message.warning("请输入数据库名称");
				return;
			}
			const name = newDbName.value.trim();
			if (!/^[A-Za-z_][A-Za-z0-9_]{0,63}$/.test(name)) {
				message.warning("数据库名只能由字母、数字和下划线组成，且不能以数字开头");
				return;
			}
			creatingDb.value = true;
			try {
				await createDbDatabase({
					name,
					datasourceId: currentDatasourceId.value,
					charset: newDbCharset.value || void 0,
					collation: newDbCollation.value || void 0
				});
				message.success("数据库创建成功");
				createDbVisible.value = false;
				await loadTree();
			} catch (e) {
				message.error(`创建失败: ${String(e?.message ?? e)}`);
			} finally {
				creatingDb.value = false;
			}
		};
		/**
		* 导入向导（对齐 Navicat）：选文件 → 预览解析结果 → 字段映射 → 执行 + 错误报告。
		*
		* <p>解析与写入都走后端 {@code /db/import}，前端**不再拼 SQL**：
		* 早期实现在前端逐条拼 INSERT 再调 {@code /db/execute}，既绕过了批量写入与
		* 类型转换，也让「一行坏数据」会中断整批，且 CSV 引号/换行解析不正确。</p>
		*/
		const importVisible = ref(false);
		const importTableName = ref("");
		const importDatabase = ref("");
		/** 选中的文件（原生 File，不落 base64，省内存） */
		const importFile = ref(null);
		/** 格式：auto 让后端按后缀与内容探测 */
		const importFormat = ref("auto");
		/** 首行是否为表头 */
		const importHasHeader = ref(true);
		/** 字符集，空表示 UTF-8 */
		const importEncoding = ref("");
		/** 预览结果（解析但不写库） */
		const importPreview = ref(null);
		/** 预览中（调后端解析） */
		const importPreviewing = ref(false);
		/**
		* 源列名 → 目标列名。
		*
		* <p>用 {@code ref} 包普通对象（而非 {@code reactive}）：预填时要**整体替换**这个对象，
		* {@code ref} 天然支持；改成 {@code reactive} 后逐键赋值不会让已渲染的下拉重算选中值。</p>
		*/
		const importMapping = ref({});
		/** 导入前清空目标表（破坏性） */
		const importTruncate = ref(false);
		/** 冲突策略 */
		const importConflict = ref("skip");
		/** 每批行数 */
		const importBatchSize = ref(500);
		/** 执行中 */
		const importing = ref(false);
		/** 导入结果（用于展示错误报告） */
		const importResult = ref(null);
		/** 原生 file input 的 DOM 引用 */
		const importFileInput = ref(null);
		/** 目标表的列（映射下拉候选），按「库.表」缓存 */
		const importColumns = ref([]);
		const importColumnsKey = ref("");
		const openImportData = async (tableName, database) => {
			const db = database || activeDatabase.value;
			if (!db) {
				message.warning("请先在左侧选择一个数据库");
				return;
			}
			importDatabase.value = db;
			if (!tablesByDb[db]?.length) await loadTables(db);
			const list = tablesByDb[db] || [];
			importTableName.value = tableName || list[0]?.name || "";
			importFormat.value = "auto";
			importFile.value = null;
			importPreview.value = null;
			importResult.value = null;
			importTruncate.value = false;
			importConflict.value = "skip";
			importBatchSize.value = 500;
			importVisible.value = true;
			await loadImportTargetColumns();
		};
		/**
		* 拉取目标表的列，作为字段映射的候选。
		*
		* <p>按「库.表」缓存，已缓存直接复用，避免每次开向导都打接口。</p>
		*/
		async function loadImportTargetColumns() {
			const db = importDatabase.value;
			const table = importTableName.value;
			if (!db || !table) return;
			const key = `${db}.${table}`;
			if (importColumnsKey.value === key && importColumns.value.length) return;
			try {
				importColumns.value = await fetchTableColumns(table, currentDatasourceId.value, db) || [];
				importColumnsKey.value = key;
			} catch (e) {
				importColumns.value = [];
				message.warning(`读取目标表结构失败：${String(e?.message ?? e)}`);
			}
		}
		/**
		* 「导入数据」通用入口。
		*
		* <p>三个右键入口共用它：表节点（带表名）、库节点（只带库名，表名留空由用户填）、
		* 空白处（两个都不带）。</p>
		*/
		const openImportDataFromToolbar = () => openImportData();
		/**
		* 右键菜单入口：针对某张表
		* @param tableName 表名，可为空
		* @param database 库名
		*/
		const openImportDataFor = (tableName, database) => openImportData(tableName || void 0, database);
		/**
		* 右键菜单入口：只针对某个库（表名留空，导入向导第一步让用户填）。
		*
		* @param database 库名
		*/
		const openImportDataForDb = (database) => openImportData(void 0, database);
		/**
		* 右键菜单入口：刷新某张表所在库的表清单。
		*
		* <p>表节点上的「刷新」刷的是**它所在的库**而不是单张表 —— 树是按库缓存表清单的
		* （`tablesByDb`），只刷一张表没有对应的数据源可刷。</p>
		*
		* @param database 库名
		*/
		function refreshTableInTree(database) {
			if (!database) {
				refreshTree();
				return;
			}
			loadTables(database);
		}
		/**
		* 目标表的列（映射下拉的候选）。
		*
		* <p>用 {@link loadImportTargetColumns} 主动拉的缓存，而不是树节点的展开缓存 ——
		* 后者只在用户展开过该表节点时有值，从右键入口进来时是空的。</p>
		*/
		const importTargetColumns = computed(() => importColumns.value.map((c) => c.name));
		/**
		* 是否允许提交导入。
		*
		* <p>SQL 脚本没有列概念，只要求「选了文件 + 选了表」；其余格式必须先解析出列，
		* 否则等于盲写。</p>
		*/
		const importReady = computed(() => {
			if (!importFile.value || !importTableName.value) return false;
			if (importFormat.value === "sql" || /\.sql$/i.test(importFile.value.name)) return true;
			return (importPreview.value?.columns.length ?? 0) > 0;
		});
		/** 映射里已选中的目标列（检测两个源列映射到同一目标列） */
		const importMappingConflict = computed(() => {
			const used = /* @__PURE__ */ new Map();
			for (const [source, target] of Object.entries(importMapping.value)) {
				if (!target) continue;
				if (used.has(target)) return `${used.get(target)} 与 ${source} 都映射到 ${target}`;
				used.set(target, source);
			}
			return "";
		});
		/**
		* 选中文件后自动触发一次预览（用户能立刻看到解析对不对）。
		* @param event input 的 change 事件
		*/
		function onImportFilePicked(event) {
			const input = event.target;
			importFile.value = input.files?.[0] ?? null;
			importPreview.value = null;
			importResult.value = null;
			if (importFile.value) runImportPreview();
		}
		/**
		* 请求后端解析文件（不写库），并按同名列自动预填字段映射。
		*/
		async function runImportPreview() {
			const file = importFile.value;
			if (!file) {
				message.warning("请先选择文件");
				return;
			}
			importPreviewing.value = true;
			try {
				const preview = await previewDbImport(file, importFormat.value, importHasHeader.value, importEncoding.value || void 0);
				importPreview.value = preview;
				const next = {};
				for (const col of preview.columns) next[col] = importTargetColumns.value.find((c) => c === col) ?? "";
				importMapping.value = next;
			} catch (e) {
				importPreview.value = null;
				message.error(`解析失败: ${String(e?.message ?? e)}`);
			} finally {
				importPreviewing.value = false;
			}
		}
		/**
		* 切换目标表后重跑映射预填（列集合变了）。
		*/
		/**
		* 目标表变了 → 拉新表结构并按同名重新预填映射。
		*/
		watch(importTableName, async () => {
			await loadImportTargetColumns();
			prefillImportMapping();
		});
		/** 切换数据源 → 重载树与库列表 */
		watch(currentDatasourceId, () => {
			onDatasourceChange();
		});
		/** 新建库对话框里选了字符集 → 刷新可选排序规则 */
		watch(newDbCharset, () => {
			onCharsetChange();
		});
		/**
		* 解析参数变了 → 自动重新解析。
		*
		* <p>用 watch 而不是模板上的 {@code @change}：{@code ReSelect} 只发
		* {@code update:modelValue}，**不发 {@code change}**（见 packages/ui 的 ReSelect
		* 两个 layout 都只 emit 了 update:modelValue）。挂 {@code @change} 会静默不触发，
		* 表现为「换了格式/字符集但预览不变」。</p>
		*/
		watch([importFormat, importEncoding], () => {
			if (importFile.value) runImportPreview();
		});
		/**
		* 预览结果或目标列变化时按同名预填映射。
		*
		* <p>必须双向兜底：选文件触发的 {@link runImportPreview} 与开向导时的
		* {@link loadImportTargetColumns} 是**并行**的，预览先回来时目标列还没到。
		* 只在预览里写一次映射会让下拉停在「不导入」——而后端会按同名列兜底，
		* 于是**界面显示不导入、实际却导入了**，属于误导性 UI。</p>
		*/
		watch([importPreview, importColumns], () => {
			prefillImportMapping();
		});
		/**
		* 按同名规则预填字段映射（已配置的不覆盖）。
		*
		* <p>用 {@code importMapping.value = next} **整体替换**而不是逐键赋值：映射对象是
		* {@code reactive} 的普通对象，键在渲染之后才动态加进来时，逐键赋值不会让已渲染的
		* {@code ReSelect} 重算选中值，表现为「下拉里有目标列、当前值却还停在「不导入」」。</p>
		*/
		function prefillImportMapping() {
			const preview = importPreview.value;
			if (!preview) return;
			const targets = importTargetColumns.value;
			const next = { ...importMapping.value };
			let changed = false;
			for (const col of preview.columns) {
				if (next[col]) continue;
				const hit = targets.find((c) => c === col);
				if (hit) {
					next[col] = hit;
					changed = true;
				}
			}
			if (changed) importMapping.value = next;
		}
		/**
		* 预览表格的数据：**一行一个源列**（左侧是映射下拉，右侧是该列在各预览行里的取值）。
		*
		* <p><b>不能直接渲染 {@code preview.rows}</b>：那些行是「数据行」，一行里含所有列，
		* 而字段映射是「一个源列 → 一个目标列」，粒度不同。直接渲染会让
		* {@code row.__src} 取到 undefined，映射全写到 {@code "undefined"} 键上，
		* 界面停在「不导入」而后端却按同名列兜底导入 —— 界面与实际行为不一致。</p>
		*/
		const importPreviewRows = computed(() => {
			const preview = importPreview.value;
			if (!preview) return [];
			const sample = preview.rows[0] ?? {};
			return preview.columns.map((column) => ({
				__src: column,
				__sample: sample[column] === null || sample[column] === void 0 ? "" : String(sample[column])
			}));
		});
		/** 预览表的列定义 */
		const importPreviewColumns = computed(() => [{
			prop: "__src",
			label: "源列 → 目标列",
			minWidth: 230,
			slot: "mapping",
			fixed: "left"
		}, {
			prop: "__sample",
			label: "示例值",
			minWidth: 180,
			showOverflowTooltip: true
		}]);
		/**
		* 执行导入。
		*/
		async function doImportData() {
			if (!importTableName.value) {
				message.warning("请选择目标表");
				return;
			}
			if (!importFile.value) {
				message.warning("请选择要导入的文件");
				return;
			}
			const isSqlScript = importFormat.value === "sql" || /\.sql$/i.test(importFile.value.name);
			const mapping = {};
			for (const [source, target] of Object.entries(importMapping.value)) if (target) mapping[source] = target;
			if (!isSqlScript) {
				if (Object.keys(mapping).length === 0) {
					message.warning("请至少配置一个字段映射");
					return;
				}
				if (importMappingConflict.value) {
					message.warning(`字段映射有冲突：${importMappingConflict.value}`);
					return;
				}
			}
			if (importTruncate.value) try {
				await ElMessageBox.confirm(`导入前会**清空目标表 ${importTableName.value} 的全部数据**，此操作不可撤销。确定继续？`, "确认清空并导入", {
					type: "warning",
					confirmButtonText: "清空并导入",
					cancelButtonText: "取消"
				});
			} catch {
				return;
			}
			importing.value = true;
			importResult.value = null;
			try {
				const result = await importDbFile(importFile.value, {
					fileName: importFile.value.name,
					format: importFormat.value,
					hasHeader: importHasHeader.value,
					encoding: importEncoding.value || void 0,
					database: importDatabase.value,
					tableName: importTableName.value,
					columnMapping: mapping,
					truncateFirst: importTruncate.value,
					onConflict: importConflict.value,
					batchSize: importBatchSize.value,
					datasourceId: currentDatasourceId.value
				});
				importResult.value = result;
				const done = result.inserted + result.replaced;
				if (result.skipped > 0) message.warning(`导入完成：成功 ${done} 行，跳过 ${result.skipped} 行（见下方错误报告）`);
				else message.success(`导入完成：成功 ${done} 行`);
				openTableData(importTableName.value, importDatabase.value);
			} catch (e) {
				message.error(`导入失败: ${String(e?.message ?? e)}`);
			} finally {
				importing.value = false;
			}
		}
		/** 关闭向导并清掉临时状态 */
		function closeImportWizard() {
			importVisible.value = false;
			resetImportWizard();
		}
		/**
		* 清空向导的临时状态。
		*
		* <p>不能挂在 ReDialog 的关闭事件上：该组件只发 {@code ok / cancel / update:modelValue /
		* close-fab / fullscreen-change}，**没有 {@code closed}**，挂上去不会触发。
		* 改为 watch 可见性，点右上角 ×、按 ESC、点遮罩都能清干净。</p>
		*/
		function resetImportWizard() {
			importFile.value = null;
			importPreview.value = null;
			importResult.value = null;
			if (importFileInput.value) importFileInput.value.value = "";
		}
		watch(importVisible, (visible) => {
			if (!visible) resetImportWizard();
		});
		/**
		* 导出对话框（对齐 Navicat）：格式 + 范围 + 过滤条件。
		*
		* <p>导出走后端 {@code /db/export}，不再受「当前页 1000 行」限制；
		* 早期实现只在前端把当前页拼成 CSV，右键导出的表数据实际只有第一页。</p>
		*/
		const exportVisible = ref(false);
		const exportTable = ref("");
		const exportDatabase = ref("");
		const exportFormat = ref("csv");
		const exportScope = ref("data");
		const exportWhere = ref("");
		const exportOrderBy = ref("");
		const exportOrderDir = ref("ASC");
		const exportLimit = ref(1e4);
		const exporting = ref(false);
		/** 从工具栏/右键打开导出对话框 */
		function openExportDialog(tableName, database) {
			if (!tableName) {
				message.warning("请先选择要导出的表");
				return;
			}
			exportTable.value = tableName;
			exportDatabase.value = database || activeDatabase.value;
			exportFormat.value = "csv";
			exportScope.value = "data";
			exportWhere.value = "";
			exportOrderBy.value = "";
			exportOrderDir.value = "ASC";
			exportLimit.value = 1e4;
			exportVisible.value = true;
		}
		/** 把后端返回的内容落盘为文件 */
		function downloadText(filename, content, mime) {
			const needsBom = mime.includes("csv");
			const blob = new Blob([needsBom ? "﻿" : "", content], { type: `${mime};charset=utf-8;` });
			const link = document.createElement("a");
			link.href = URL.createObjectURL(blob);
			link.download = filename;
			link.click();
			URL.revokeObjectURL(link.href);
		}
		/** 导出格式 → MIME 与是否结构化（结构化格式的 scope 强制为结构） */
		const EXPORT_MIME = {
			csv: "text/csv",
			tsv: "text/tab-separated-values",
			json: "application/json",
			xml: "application/xml",
			sql: "application/sql"
		};
		/**
		* 执行导出并下载。
		*/
		async function doExport() {
			if (!exportTable.value) return;
			exporting.value = true;
			try {
				const result = await exportDbTable({
					tableName: exportTable.value,
					format: exportFormat.value,
					scope: exportScope.value,
					database: exportDatabase.value,
					datasourceId: currentDatasourceId.value,
					limit: exportLimit.value,
					where: exportWhere.value || void 0,
					orderBy: exportOrderBy.value || void 0,
					orderDir: exportOrderDir.value
				});
				if (!result.content) {
					message.warning("没有可导出的内容");
					return;
				}
				downloadText(result.fileName || `${exportTable.value}.${exportFormat.value}`, result.content, EXPORT_MIME[exportFormat.value] ?? "text/plain");
				message.success(`已导出 ${result.rowCount} 行${result.truncated ? `（达到上限 ${exportLimit.value} 行，已截断）` : ""}`);
				exportVisible.value = false;
			} catch (e) {
				message.error(`导出失败: ${String(e?.message ?? e)}`);
			} finally {
				exporting.value = false;
			}
		}
		/** 值 → SQL 字面量：NULL 必须还原为 NULL 关键字，包成 'null' 会把字符串写进库 */
		const sqlLiteral = (v) => {
			if (v === null || v === void 0) return "NULL";
			if (typeof v === "number" || typeof v === "boolean") return String(v);
			return `'${String(v).replace(/'/g, "''")}'`;
		};
		/** 等值条件：NULL 只能用 IS NULL 比较，= 'null' 恒不成立 */
		const sqlWhereEq = (key, v) => v === null || v === void 0 ? `${key} IS NULL` : `${key} = ${sqlLiteral(v)}`;
		const rowDialogVisible = ref(false);
		const rowDialogMode = ref("add");
		const rowForm = ref({});
		const rowSaving = ref(false);
		const editingRow = ref(null);
		const openAddRowDialog = () => {
			rowDialogMode.value = "add";
			rowForm.value = {};
			tableData.columns.forEach((col) => {
				rowForm.value[col] = "";
			});
			editingRow.value = null;
			rowDialogVisible.value = true;
		};
		const openEditRowDialog = (row) => {
			rowDialogMode.value = "edit";
			rowForm.value = { ...row };
			editingRow.value = row;
			rowDialogVisible.value = true;
		};
		const saveRow = async () => {
			if (!activeTabObj.value) return;
			rowSaving.value = true;
			try {
				const tableName = activeTabObj.value.tableName;
				const database = activeTabObj.value.database || activeDatabase.value;
				if (rowDialogMode.value === "add") {
					const cols = Object.keys(rowForm.value).filter((k) => rowForm.value[k] !== "" && rowForm.value[k] != null);
					const vals = cols.map((c) => sqlLiteral(rowForm.value[c]));
					const sql = `INSERT INTO ${tableName} (${cols.join(", ")}) VALUES (${vals.join(", ")})`;
					await executeDbSql(sql, currentDatasourceId.value, database);
					message.success("新增行成功");
				} else {
					const sets = Object.keys(rowForm.value).map((k) => `${k} = ${sqlLiteral(rowForm.value[k])}`);
					const wheres = Object.keys(editingRow.value || {}).map((k) => sqlWhereEq(k, editingRow.value?.[k]));
					const sql = `UPDATE ${tableName} SET ${sets.join(", ")} WHERE ${wheres.join(" AND ")}`;
					if ((await executeDbSql(sql, currentDatasourceId.value, database))?.affectedRows === 0) message.warning("未匹配到任何行，数据可能已被其他会话修改，请刷新后重试");
					else message.success("更新行成功");
				}
				rowDialogVisible.value = false;
				await refreshTableData();
			} catch (e) {
				message.error(`保存失败: ${String(e?.message ?? e)}`);
			} finally {
				rowSaving.value = false;
			}
		};
		const deleteRow = async (row) => {
			if (!activeTabObj.value) return;
			try {
				await ElMessageBox.confirm("确定删除这一行吗？", "删除确认", { type: "warning" });
			} catch {
				return;
			}
			try {
				const tableName = activeTabObj.value.tableName;
				const keys = Object.keys(row);
				if (keys.length === 0) {
					message.warning("该行无可定位字段，已取消删除");
					return;
				}
				const sql = `DELETE FROM ${tableName} WHERE ${keys.map((k) => sqlWhereEq(k, row[k])).join(" AND ")}`;
				if ((await executeDbSql(sql, currentDatasourceId.value, activeTabObj.value.database || activeDatabase.value))?.affectedRows === 0) message.warning("未匹配到任何行，数据可能已被其他会话修改，请刷新后重试");
				else message.success("删除行成功");
				await refreshTableData();
			} catch (e) {
				message.error(`删除失败: ${String(e?.message ?? e)}`);
			}
		};
		const tableLoading = ref(false);
		/**
		* 表数据请求序号：只接受最后一次请求的结果。
		*
		* <p>切表/刷新的请求是并发的，先发的请求可能后到。没有这个护栏时，旧响应会把
		* {@code tableData}（列/行）写回上一张表，表现为「页签已切到新表、网格表头却还是旧表的列」，
		* 并且 {@code loadPkInfo} 也会把主键集合写成旧表的——直接导致「主键列不可编辑」误判。
		* 2026-10-02 验收复现。</p>
		*/
		const tableDataReqSeq = ref(0);
		/** 本地表格列定义（ReTable 的列结构） */
		const columnPrefs = ref({});
		/** 读列偏好；存储被写坏时降级为空对象而不是抛错（偏好丢了不该打不开表） */
		function loadColumnPrefs() {
			try {
				const raw = localStorage.getItem(COLUMN_PREF_KEY);
				if (!raw) return {};
				const parsed = JSON.parse(raw);
				return parsed && typeof parsed === "object" ? parsed : {};
			} catch {
				return {};
			}
		}
		columnPrefs.value = loadColumnPrefs();
		/** 当前表的偏好键 */
		function columnPrefKey() {
			const tab = activeTabObj.value;
			if (!tab?.tableName) return "";
			return `${tab.database || activeDatabase.value}.${tab.tableName}`;
		}
		/** 当前表的隐藏列集合 */
		const hiddenColumns = computed(() => {
			const key = columnPrefKey();
			return new Set(key ? columnPrefs.value[key]?.hidden || [] : []);
		});
		/** 当前表的固定列集合 */
		const pinnedColumns = computed(() => {
			const key = columnPrefKey();
			return new Set(key ? columnPrefs.value[key]?.pinned || [] : []);
		});
		/** 落盘列偏好 */
		function saveColumnPref(key, pref) {
			if (!key) return;
			columnPrefs.value = {
				...columnPrefs.value,
				[key]: pref
			};
			try {
				localStorage.setItem(COLUMN_PREF_KEY, JSON.stringify(columnPrefs.value));
			} catch {
				message.warning("列偏好无法持久化（浏览器存储不可用），本次会话内仍有效");
			}
		}
		const columnViewDialogVisible = ref(false);
		/** 弹窗草稿：勾选可见性与固定 */
		const columnViewDraft = ref([]);
		/** 打开列显示设置 */
		function openColumnViewDialog() {
			if (!activeTabObj.value?.tableName) {
				message.info("先打开一张表");
				return;
			}
			const hidden = hiddenColumns.value;
			const pinned = pinnedColumns.value;
			columnViewDraft.value = tableData.columns.map((c) => ({
				name: c,
				visible: !hidden.has(c),
				pinned: pinned.has(c) || pkColumns.value.has(c)
			}));
			columnViewDialogVisible.value = true;
		}
		/**
		* 应用列显示设置。
		*
		* <p>隐藏全部列会让网格变成空白且没有出口，所以**至少留一列**：
		* 用户「全不勾」时给提示，而不是让他面对一个空表还找不到恢复入口。</p>
		*/
		function applyColumnViewSettings() {
			const key = columnPrefKey();
			if (!key) return;
			if (columnViewDraft.value.filter((c) => c.visible).length === 0) {
				message.warning("至少保留一列，否则表格会变成空白且无法恢复");
				return;
			}
			saveColumnPref(key, {
				hidden: columnViewDraft.value.filter((c) => !c.visible).map((c) => c.name),
				pinned: columnViewDraft.value.filter((c) => c.pinned && c.visible).map((c) => c.name)
			});
			columnViewDialogVisible.value = false;
		}
		/** 全部显示 */
		function setAllColumnsVisible() {
			columnViewDraft.value = columnViewDraft.value.map((c) => ({
				...c,
				visible: true
			}));
		}
		/** 恢复默认（取消隐藏与固定） */
		function resetColumnViewSettings() {
			const key = columnPrefKey();
			if (key) saveColumnPref(key, {});
			columnViewDialogVisible.value = false;
		}
		const tableColumns = computed(() => {
			const hidden = hiddenColumns.value;
			const pinned = pinnedColumns.value;
			return tableData.columns.filter((c) => !hidden.has(c)).map((col) => ({
				prop: col,
				label: headerLabel(col) + sortMark(col),
				minWidth: 130,
				showOverflowTooltip: true,
				sortable: "custom",
				...pinned.has(col) ? { fixed: "left" } : {}
			})).sort((a, b) => Number(pinned.has(b.prop)) - Number(pinned.has(a.prop)));
		});
		/**
		* 当前排序列的表头标志（升 ▲ / 降 ▼）。
		*
		* @param col 列名
		* @returns 标志文本，不排序时是空串
		*/
		function sortMark(col) {
			if (sortState.prop !== col) return "";
			return sortState.order === "ASC" ? " ▲" : " ▼";
		}
		/**
		* 「列属性」弹窗的入参形状。
		*
		* <p>刻意用结构化窄类型而不是让 {@link DesignRow} `extends DbColumnInfo` ——
		* 两者对 `size` 的声明不一致（网格用 `number | null` 表示「无长度」，
		* 接口用 `number`），`extends` 会直接报 TS2430。
		* 这里只列弹窗真正要读的字段，于是 `DbColumnInfo`（接口层返回）与
		* `DesignRow`（网格行）都能满足同一个签名。</p>
		*/
		const designRows = ref([]);
		const designLoading = ref(false);
		/** 方言类型名 → 编辑用规范类型（H2 返回 CHARACTER VARYING 等） */
		const COLUMN_TYPE_ALIAS = {
			"CHARACTER VARYING": "VARCHAR",
			CHARACTER: "VARCHAR",
			INTEGER: "INT",
			NUMERIC: "DECIMAL",
			TIMESTAMP: "DATETIME",
			DATE: "DATETIME",
			TIME: "DATETIME",
			BOOL: "BOOLEAN",
			BIT: "BOOLEAN",
			REAL: "FLOAT",
			"DOUBLE PRECISION": "DOUBLE",
			CLOB: "TEXT",
			BINARY: "BLOB",
			VARBINARY: "BLOB"
		};
		/**
		* 归一化方言类型名到设计网格下拉项
		* @param type 元数据类型名
		*/
		function normalizeColumnType(type) {
			const raw = String(type ?? "").toUpperCase().trim();
			const mapped = COLUMN_TYPE_ALIAS[raw] ?? raw;
			return columnTypeOptions.includes(mapped) ? mapped : "VARCHAR";
		}
		/** 列结构（供索引弹窗 / 建表语句兜底） */
		const designColumns = computed(() => designRows.value.map((r) => ({
			name: r.name,
			type: r.type,
			size: r.size ?? void 0,
			nullable: r.nullable,
			isPrimaryKey: r.isPrimaryKey,
			default: r.defaultValue,
			remark: r.comment
		})));
		/**
		* 行是否有改动
		* @param row 设计行
		*/
		function isDesignDirty(row) {
			const o = row.origin;
			return row.name !== o.name || row.type !== o.type || (row.size ?? null) !== (o.size ?? null) || row.nullable !== o.nullable || row.defaultValue !== o.defaultValue || row.comment !== o.comment;
		}
		/** 脏行数量（保存按钮角标） */
		const designDirtyCount = computed(() => designRows.value.filter(isDesignDirty).length);
		/**
		* 组装列修改载荷
		* @param row 设计行
		*/
		function designPayload(row) {
			return {
				columnName: row.name,
				type: row.type,
				size: row.size ?? void 0,
				nullable: row.nullable,
				defaultValue: row.defaultValue,
				comment: row.comment,
				datasourceId: currentDatasourceId.value
			};
		}
		/**
		* 保存单个字段（单元格编辑后行内「保存」）
		* @param row 设计行
		*/
		async function saveDesignRow(row) {
			const tab = activeTabObj.value;
			if (!tab?.tableName || !isDesignDirty(row)) return;
			try {
				await modifyDbColumn(tab.tableName, row.originalName, {
					...designPayload(row),
					database: tab.database
				});
				message.success(`字段 ${row.name} 已保存`);
				await loadTableDesign(tab);
			} catch (e) {
				message.error(`保存失败: ${String(e?.message ?? e)}`);
			}
		}
		/** 保存全部改动字段 */
		async function saveDesignAll() {
			const tab = activeTabObj.value;
			if (!tab?.tableName) return;
			const dirty = designRows.value.filter(isDesignDirty);
			if (!dirty.length) return;
			designLoading.value = true;
			try {
				for (const row of dirty) await modifyDbColumn(tab.tableName, row.originalName, {
					...designPayload(row),
					database: tab.database
				});
				message.success(`已保存 ${dirty.length} 个字段变更`);
				await loadTableDesign(tab);
			} catch (e) {
				message.error(`保存失败: ${String(e?.message ?? e)}`);
			} finally {
				designLoading.value = false;
			}
		}
		const designSubTab = ref("columns");
		const indexes = ref([]);
		const indexLoading = ref(false);
		const indexColumnDefs = [
			{
				prop: "indexName",
				label: "索引名",
				minWidth: 160
			},
			{
				prop: "columnName",
				label: "列名",
				minWidth: 120
			},
			{
				prop: "nonUnique",
				label: "非唯一",
				width: 90,
				formatter: (r) => r.nonUnique ? "是" : "否"
			},
			{
				prop: "indexType",
				label: "类型",
				width: 80
			},
			{
				prop: "seqInIndex",
				label: "序号",
				width: 80
			},
			{
				prop: "__actions",
				label: "操作",
				width: 90,
				slot: "actions",
				fixed: "right"
			}
		];
		const foreignKeys = ref([]);
		const fkLoading = ref(false);
		const FOREIGN_KEY_RULE = {
			0: "CASCADE",
			1: "RESTRICT",
			2: "SET NULL",
			3: "NO ACTION",
			4: "SET DEFAULT"
		};
		const foreignKeyColumnDefs = [
			{
				prop: "fkName",
				label: "约束名",
				minWidth: 160
			},
			{
				prop: "columnName",
				label: "本表列",
				minWidth: 130
			},
			{
				prop: "refTable",
				label: "引用表",
				minWidth: 140
			},
			{
				prop: "refColumn",
				label: "引用列",
				minWidth: 130
			},
			{
				prop: "updateRule",
				label: "更新规则",
				width: 110,
				formatter: (r) => FOREIGN_KEY_RULE[r.updateRule] ?? r.updateRule ?? ""
			},
			{
				prop: "deleteRule",
				label: "删除规则",
				width: 110,
				formatter: (r) => FOREIGN_KEY_RULE[r.deleteRule] ?? r.deleteRule ?? ""
			},
			{
				prop: "__actions",
				label: "操作",
				width: 80,
				slot: "fk-actions",
				fixed: "right"
			}
		];
		/** 引用动作的可选项（与后端白名单一致） */
		const FK_ACTIONS = [
			"CASCADE",
			"RESTRICT",
			"SET NULL",
			"NO ACTION"
		];
		/** 新增外键弹窗 */
		const fkDialogVisible = ref(false);
		const fkSaving = ref(false);
		const fkForm = reactive({
			name: "",
			column: "",
			refTable: "",
			refColumn: "",
			onUpdate: "RESTRICT",
			onDelete: "RESTRICT"
		});
		/**
		* 当前表的列（新增外键时的本表列候选）。
		*
		* <p>先读树节点的展开缓存，取不到就退回设计页的列。
		* 树缓存只在**用户展开过该表节点**时才有值，而从工具栏/搜索进入设计视图时
		* 表节点未必展开过 —— 早先只读树缓存，导致「本表列」下拉是空的，用户没法建外键。</p>
		*/
		function designTableColumns() {
			const tab = activeTabObj.value;
			if (!tab?.tableName) return designColumns.value;
			const cached = columnsOf(tab.database ?? "", tab.tableName);
			return cached.length ? cached : designColumns.value;
		}
		/**
		* 打开新增外键弹窗，预填一个默认值。
		*/
		/**
		* 引用表的列（新增外键时的「引用列」候选）。
		*
		* <p><b>必须主动拉</b>：树缓存只在用户展开过该表节点时有值，而引用表往往是
		* 用户没展开过的另一张表；设计页兜底也只覆盖「引用表就是当前表」这一种情况。
		* 因此选了引用表就调一次接口，拿到后再渲染下拉。</p>
		*/
		const fkRefColumns = ref([]);
		/** 拉取引用表的列 */
		async function loadForeignKeyRefColumns(table) {
			const db = activeTabObj.value?.database ?? "";
			if (!db || !table) {
				fkRefColumns.value = [];
				return;
			}
			const cached = columnsOf(db, table);
			if (cached.length) {
				fkRefColumns.value = cached;
				return;
			}
			try {
				fkRefColumns.value = await fetchTableColumns(table, currentDatasourceId.value, db) || [];
			} catch (e) {
				fkRefColumns.value = [];
				message.warning(`读取引用表结构失败：${String(e?.message ?? e)}`);
			}
		}
		/** 切换引用表 → 重新加载其列，并清掉已选的引用列（不同表的列没有可比性） */
		watch(() => fkForm.refTable, (table) => {
			fkForm.refColumn = "";
			loadForeignKeyRefColumns(table);
		});
		/**
		* 打开新增外键弹窗，预填一个默认值。
		*/
		function openAddForeignKey() {
			const tab = activeTabObj.value;
			if (!tab?.tableName || !tab.database) return;
			const firstCol = designTableColumns()[0]?.name ?? "";
			const base = tab.tableName.replace(/[^A-Za-z0-9_]/g, "_");
			fkForm.name = `fk_${base}_1`;
			fkForm.column = firstCol;
			fkForm.refTable = tablesOf(tab.database).find((t) => t.name !== tab.tableName)?.name ?? "";
			fkForm.refColumn = "";
			fkForm.onUpdate = "RESTRICT";
			fkForm.onDelete = "RESTRICT";
			fkRefColumns.value = [];
			fkDialogVisible.value = true;
		}
		/**
		* 提交新增外键。
		*/
		async function submitAddForeignKey() {
			const tab = activeTabObj.value;
			if (!tab?.tableName || !tab.database) return;
			if (!fkForm.name || !fkForm.column || !fkForm.refTable || !fkForm.refColumn) {
				message.warning("请填写完整的约束名、本表列、引用表与引用列");
				return;
			}
			fkSaving.value = true;
			try {
				await addDbForeignKey(tab.tableName, {
					name: fkForm.name,
					columns: [fkForm.column],
					refTable: fkForm.refTable,
					refColumns: [fkForm.refColumn],
					onUpdate: fkForm.onUpdate,
					onDelete: fkForm.onDelete,
					datasourceId: currentDatasourceId.value,
					database: tab.database
				});
				message.success("外键已创建");
				fkDialogVisible.value = false;
				await loadForeignKeys();
			} catch (e) {
				message.error(`新增外键失败: ${String(e?.message ?? e)}`);
			} finally {
				fkSaving.value = false;
			}
		}
		/**
		* 删除一个外键。
		*
		* <p>必须先判 {@code row.fkName} 存在：内核对外键名缺失的行仍会返回一条记录，
		* 拿 undefined 去拼路径会退化成删「表名/foreign-key/undefined」，
		* 报一个与真实原因无关的 404。</p>
		*
		* @param row 外键行
		*/
		async function removeForeignKey(row) {
			const tab = activeTabObj.value;
			if (!tab?.tableName || !tab.database) return;
			if (!row.fkName) {
				message.warning("该外键没有名称，无法删除");
				return;
			}
			try {
				await ElMessageBox.confirm(`确定删除外键「${row.fkName}」？`, "确认删除", { type: "warning" });
			} catch {
				return;
			}
			try {
				await dropDbForeignKey(tab.tableName, row.fkName, currentDatasourceId.value, tab.database);
				message.success("已删除");
				await loadForeignKeys();
			} catch (e) {
				message.error(`删除外键失败: ${String(e?.message ?? e)}`);
			}
		}
		/** 打开外键页签并加载 */
		async function openForeignKeys() {
			designSubTab.value = "foreignKeys";
			await loadForeignKeys();
		}
		/** 加载当前表外键 */
		async function loadForeignKeys() {
			const tab = activeTabObj.value;
			if (!tab?.tableName) return;
			fkLoading.value = true;
			try {
				foreignKeys.value = await fetchForeignKeys(tab.tableName, currentDatasourceId.value, tab.database);
			} catch (e) {
				foreignKeys.value = [];
				message.error(`加载外键失败: ${String(e?.message ?? e)}`);
			} finally {
				fkLoading.value = false;
			}
		}
		const columnDialogVisible = ref(false);
		const columnDialogMode = ref("add");
		/**
		* 列类型全集的两个视图：扁平下拉项与分组下拉项。
		*
		* <p>类型表本身（{@link COLUMN_TYPE_GROUPS}）已抽到 `utils/columnTypes.ts` ——
		* 「设计表」建表对话框要与这里用同一份，否则下拉选项会各改各的。</p>
		*
		* <p>分组项刻意是计算属性而不是常量：`openColumnDialog` 遇到后端类型表以外的类型时
		* 会往分组里补一条「其他」，常量快照看不到补进去的项。</p>
		*/
		const columnTypeOptions = COLUMN_TYPE_GROUPS.flatMap((g) => g.types);
		const columnTypeSelectOptions = computed(() => COLUMN_TYPE_GROUPS.flatMap((g) => g.types.map((t) => ({
			label: t,
			value: t,
			group: g.label
		}))));
		/** ON UPDATE 下拉项 */
		const onUpdateOptions = [
			"",
			"CURRENT_TIMESTAMP",
			"NOW()",
			"CURRENT_TIMESTAMP(3)",
			"CURRENT_TIMESTAMP(6)"
		].map((v) => ({
			label: v || "不设置",
			value: v
		}));
		/** 索引类型下拉项（空 = 由内核决定） */
		const indexTypeOptions = [
			"",
			"BTREE",
			"HASH",
			"RTREE"
		].map((v) => ({
			label: v || "默认（内核决定）",
			value: v
		}));
		/** 存储引擎下拉项（内核下发） */
		const engineOptions = computed(() => tableOptionValues.value.engines.map((e) => ({
			label: e,
			value: e
		})));
		/** 设计视图的列候选（索引列 / 主键列共用） */
		const designColumnOptions = computed(() => designColumns.value.map((c) => ({
			label: c.name,
			value: c.name
		})));
		/** 列属性表单（对齐后端 DbColumnDef 的全部维度） */
		const columnForm = reactive({
			columnName: "",
			type: "VARCHAR",
			size: 255,
			scale: void 0,
			unsigned: false,
			zerofill: false,
			charset: "",
			collation: "",
			nullable: true,
			defaultValue: "",
			onUpdate: "",
			autoIncrement: false,
			/** ENUM / SET 取值：用换行分隔录入，避免为每个取值再做一个输入框 */
			enumValues: "",
			comment: ""
		});
		/** 当前正在编辑的列（弹窗打开期间持有；仅弹窗内部读，不参与脏检测） */
		const editingDesignColumn = ref(null);
		/** 当前列类型是否需要长度输入 */
		const columnNeedsSize = computed(() => SIZE_REQUIRED.has(columnForm.type));
		/** 当前列类型是否允许小数位 */
		const columnAllowsScale = computed(() => SCALE_ALLOWED.has(columnForm.type));
		/** 当前列类型是否允许 UNSIGNED */
		const columnAllowsUnsigned = computed(() => UNSIGNED_ALLOWED.has(columnForm.type));
		/** 当前列类型是否是枚举/集合（决定是否要展示取值列表） */
		const columnIsEnum = computed(() => columnForm.type === "ENUM" || columnForm.type === "SET");
		/** 当前列类型是否是字符类（决定是否展示字符集/排序规则） */
		const columnIsChar = computed(() => /CHAR|TEXT|ENUM|SET|JSON/.test(columnForm.type));
		/** 表属性 / 可选值（内核下发，不在前端硬编码） */
		const tableOptionValues = ref({
			engines: [],
			collations: []
		});
		/** 按当前列的字符集过滤后的排序规则 */
		const columnCollationOptions = computed(() => {
			const all = tableOptionValues.value.collations;
			if (!columnForm.charset) return all;
			return all.filter((c) => c.charset === columnForm.charset);
		});
		const indexDialogVisible = ref(false);
		const indexForm = reactive({
			indexName: "",
			columns: [],
			unique: false,
			indexType: "BTREE",
			/** 各列前缀长度，与 columns 同序；0 表示整列 */
			prefixes: [],
			primary: false
		});
		const optionsDialogVisible = ref(false);
		const optionsSaving = ref(false);
		const optionsForm = reactive({
			engine: "",
			charset: "",
			collation: "",
			comment: "",
			autoIncrement: void 0
		});
		const tableOptionOriginal = reactive({
			engine: "",
			charset: "",
			collation: "",
			comment: "",
			autoIncrement: void 0
		});
		/** 主键设置弹窗 */
		const pkDialogVisible = ref(false);
		const pkSaving = ref(false);
		/** 待设为主键的列（顺序即复合主键列序）；名字避开已有的 pkColumns（数据网格用的主键列集合） */
		const pkDialogColumns = ref([]);
		/** 表属性的排序规则候选（按当前所选字符集过滤） */
		const optionsCollationList = computed(() => {
			const all = tableOptionValues.value.collations;
			if (!optionsForm.charset) return all;
			return all.filter((c) => c.charset === optionsForm.charset);
		});
		/** 表属性的排序规则下拉项 */
		const optionsCollationOptions = computed(() => optionsCollationList.value.map((c) => ({
			label: c.collation,
			value: c.collation
		})));
		/**
		* 按字符集拉取可用的排序规则。
		*
		* <p>内核返回的排序规则有数百条，一次性塞进下拉既慢又难用；
		* 先按字符集筛一遍，选中字符集后再刷新。</p>
		*
		* @param charset 字符集，空表示全部
		*/
		async function loadTableOptionValues(charset) {
			const tab = activeTabObj.value;
			try {
				const data = await fetchDbTableOptionValues(charset, currentDatasourceId.value, tab?.database);
				if (data?.engines || data?.collations) tableOptionValues.value = {
					engines: data.engines ?? [],
					collations: data.collations ?? []
				};
			} catch {}
		}
		/**
		* 把 ENUM / SET 的文本录入解析成取值数组。
		*
		* <p>按逗号或换行分隔，并逐个 trim；空段直接丢弃（用户在末尾多打一个逗号是常态）。
		* 保留空格的取值（`ENUM('a b')` 是合法的），所以只在**首尾** trim。</p>
		*
		* @returns 取值数组
		*/
		function parseEnumValues() {
			return columnForm.enumValues.split(/[,\n]/).map((s) => s.trim()).filter((s) => s.length > 0);
		}
		const editingCell = ref(null);
		/**
		* 回写正在编辑的单元格文本。
		*
		* <p>模板内联箭头函数无法保留 {@code editingCell} 的非空收窄，统一收敛到此处判空后赋值。
		*
		* @param v 输入框回传的新值
		*/
		function setEditingCellValue(v) {
			if (editingCell.value) editingCell.value.value = v == null ? "" : String(v);
		}
		const pkColumns = ref(/* @__PURE__ */ new Set());
		const columnTypes = ref(/* @__PURE__ */ new Map());
		const longTextColumns = ref(/* @__PURE__ */ new Set());
		/**
		* 数据网格的 ReTable 持久化键：同一个 tableId 的列配置落在同一份存档里。
		*
		* <p>必须按「库.表」分键：DBM 是单 ReTable 实例复用、切表只换 props.columns；
		* 不传 tableId 时组件回落到路由 path（db-manager 路由），所有表的列序共用
		* 同一个存档 —— A 表拖完的顺序会把 B 表的覆盖掉，刷新就串。以前「表头列
		* 一动就丢失」的真因不是没落盘，是存档被别的表反复覆盖了。</p>
		*
		* @returns 数据源.库.表 三段键；切表时自动换键，组件的 tableId/columns
		* watcher 会重载对应存档（仅当季数据，无意义的顺序也被过滤）。
		*/
		const tableGridId = computed(() => {
			const tab = activeTabObj.value;
			if (!tab?.tableName) return "";
			return `dbm-grid:${currentDatasourceId.value}.${tab.database || activeDatabase.value}.${tab.tableName}`;
		});
		/**
		* ReTable 多选聚合键。 按 rowKey 字段聚合选中行，默认值是 id；被管理的库表未必有 id 列
		* （例如 MySQL 任意业务表），rowKey 取不到值时选中行会被聚合成空数组，
		* 表现为勾选框可选但「已选 N 行 / 删除选中」不出现。这里优先用真实主键列，
		* 无主键表退回首列，仍无列时回退组件默认值。</p>
		*/
		const gridRowKey = computed(() => {
			const pk = [...pkColumns.value][0];
			if (pk) return pk;
			return tableData.columns.length > 0 ? tableData.columns[0] : "id";
		});
		/** 拉取当前表的主键列与列类型元数据（单元格编辑/新增行按类型渲染依赖它） */
		async function loadPkInfo(tab) {
			if (!tab?.tableName) return;
			try {
				const cols = await fetchTableColumns(tab.tableName, currentDatasourceId.value, tab.database);
				if (activeTab.value !== tab.id) return;
				const pk = /* @__PURE__ */ new Set();
				const types = /* @__PURE__ */ new Map();
				const long = /* @__PURE__ */ new Set();
				cols.forEach((c) => {
					types.set(c.name, (c.type || "").toUpperCase());
					if (c.isPrimaryKey) pk.add(c.name);
					const t = (c.type || "").toUpperCase();
					if (t.includes("TEXT") || t.includes("BLOB") || t.includes("CLOB")) long.add(c.name);
				});
				pkColumns.value = pk;
				columnTypes.value = types;
				longTextColumns.value = long;
			} catch {}
		}
		/** 单元格值展示：null 显示为空 */
		function formatCellValue(v) {
			return v === null || v === void 0 ? "" : String(v);
		}
		/** 该列是不是二进制类型（值以 base64 下发，必须解成字节才看得出内容） */
		function isBinaryCol(col) {
			const t = (columnTypes.value.get(col) || "").toLowerCase();
			return t.includes("blob") || t.includes("binary") || t === "bytea";
		}
		/** 该列是不是长文本（值直接是文本，但太长不宜塞进格子） */
		function isLongTextCol(col) {
			return longTextColumns.value.has(col);
		}
		/** base64 解码成字节，失败返回空数组（宁可显示「无法解码」也不抛） */
		function base64ToBytes(b64) {
			try {
				const raw = atob((b64 || "").replace(/\s+/g, ""));
				const out = new Uint8Array(raw.length);
				for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
				return out;
			} catch {
				return /* @__PURE__ */ new Uint8Array(0);
			}
		}
		/** 字节的十六进制全文（连续大写） */
		function bytesToHex(bytes) {
			let s = "";
			for (const b of bytes) s += b.toString(16).padStart(2, "0").toUpperCase();
			return s;
		}
		/** 字节按 UTF-8 解码（不可解码的字节用替换符，不抛） */
		function bytesToText(bytes) {
			return new TextDecoder("utf-8", { fatal: false }).decode(bytes);
		}
		/** 按 MIME 魔数猜图片类型，不是图片返回空串 */
		function sniffImageMime(bytes) {
			if (bytes.length < 4) return "";
			const sig = (a, b, c, d) => bytes[0] === a && bytes[1] === b && bytes[2] === c && bytes[3] === d;
			if (sig(255, 216, 255, 224) || sig(255, 216, 255, 225)) return "image/jpeg";
			if (sig(137, 80, 78, 71)) return "image/png";
			if (sig(71, 73, 70, 56)) return "image/gif";
			if (sig(66, 77, 0, 0)) return "image/bmp";
			if (bytes[0] === 82 && bytes[1] === 73 && bytes[2] === 70 && bytes[3] === 70 && bytes[8] === 87 && bytes[9] === 69 && bytes[10] === 66 && bytes[11] === 80) return "image/webp";
			return "";
		}
		const BLOB_MODE_LABELS = {
			text: "文本",
			hex: "HEX",
			image: "图片"
		};
		const blobVisible = ref(false);
		const blobEditing = ref(false);
		const blobSaving = ref(false);
		const blobMode = ref("hex");
		const blobColumn = ref("");
		const blobBase64 = ref("");
		const blobText = ref("");
		const blobHex = ref("");
		const blobImageSrc = ref("");
		const blobIsBinary = ref(false);
		/** 当前查看器对应的行（保存时要靠它定位主键） */
		const blobRow = ref(null);
		const blobModes = computed(() => {
			const modes = [];
			if (!blobIsBinary.value) modes.push("text");
			modes.push("hex");
			if (blobImageSrc.value) modes.push("image");
			if (blobIsBinary.value && blobText.value && !/�/.test(blobText.value)) modes.unshift("text");
			return modes;
		});
		const blobTitle = computed(() => `内容查看器 · ${blobColumn.value}`);
		const blobMeta = computed(() => {
			const bytes = blobBase64.value ? base64ToBytes(blobBase64.value).length : 0;
			return blobIsBinary.value ? `二进制 · ${formatBytes(bytes)}` : `文本 · ${blobText.value.length} 字符`;
		});
		/** 人类可读的字节数 */
		function formatBytes(n) {
			if (n < 1024) return `${n} B`;
			if (n < 1048576) return `${(n / 1024).toFixed(1)} KB`;
			return `${(n / 1024 / 1024).toFixed(2)} MB`;
		}
		/** 格子里的摘要：一行就能看出「多大、什么类型」 */
		function blobSummary(col, value) {
			if (value === null || value === void 0 || value === "") return "(空)";
			if (!isBinaryCol(col)) return `${String(value).length} 字符`;
			const bytes = base64ToBytes(String(value)).length;
			const mime = sniffImageMime(base64ToBytes(String(value)));
			return `${formatBytes(bytes)}${mime ? " · 图片" : ""}`;
		}
		function blobIcon(col, value) {
			if (!isBinaryCol(col)) return "Document";
			if (value === null || value === void 0 || value === "") return "Document";
			return sniffImageMime(base64ToBytes(String(value))) ? "Picture" : "Coin";
		}
		/**
		* 打开内容查看器。
		*
		* @param row   当前行
		* @param col   列名
		* @param value 单元格原始值（二进制列是 base64 文本）
		*/
		function openBlobViewer(row, col, value) {
			blobRow.value = row;
			blobColumn.value = col;
			blobEditing.value = false;
			blobIsBinary.value = isBinaryCol(col);
			if (value === null || value === void 0) {
				blobBase64.value = "";
				blobText.value = "";
				blobHex.value = "";
				blobImageSrc.value = "";
			} else if (blobIsBinary.value) {
				blobBase64.value = String(value);
				const bytes = base64ToBytes(String(value));
				blobHex.value = bytesToHex(bytes);
				blobText.value = bytesToText(bytes);
				const mime = sniffImageMime(bytes);
				blobImageSrc.value = mime ? `data:${mime};base64,${String(value).replace(/\s+/g, "")}` : "";
			} else {
				blobText.value = String(value);
				blobBase64.value = btoa(String(value).split("").map((c) => c.charCodeAt(0) < 128 ? c : "%" + c.charCodeAt(0).toString(16).padStart(2, "0")).join(""));
				blobHex.value = bytesToHex(base64ToBytes(blobBase64.value));
				blobImageSrc.value = "";
			}
			blobMode.value = blobImageSrc.value ? "image" : blobIsBinary.value ? "hex" : "text";
			blobVisible.value = true;
		}
		/** 下载原始内容 */
		function downloadBlob() {
			const bytes = base64ToBytes(blobBase64.value);
			const mime = sniffImageMime(bytes) || "application/octet-stream";
			const url = URL.createObjectURL(new Blob([bytes.slice().buffer], { type: mime }));
			const a = document.createElement("a");
			a.href = url;
			a.download = `${blobColumn.value}.${mime.split("/")[1] || "bin"}`;
			a.click();
			URL.revokeObjectURL(url);
		}
		/**
		* 保存查看器里的编辑。
		*
		* <p>二进制列在文本视图里改完要**重新编码成 base64**；
		* 而后端会把 base64 解回字节再绑定（否则存进去的是 base64 的 ASCII 文本）。</p>
		*/
		async function saveBlob() {
			const row = blobRow.value;
			const tab = activeTabObj.value;
			if (!row || !tab?.tableName) return;
			const keys = Object.keys(row);
			const primaryKey = {};
			for (const k of pkColumns.value) if (keys.includes(k)) primaryKey[k] = row[k];
			if (Object.keys(primaryKey).length === 0) {
				message.error("该表没有主键，无法定位要修改的行");
				return;
			}
			const value = blobIsBinary.value ? bytesToBase64(new TextEncoder().encode(blobText.value)) : blobText.value;
			blobSaving.value = true;
			try {
				await updateDbCell({
					tableName: tab.tableName,
					column: blobColumn.value,
					newValue: value,
					primaryKey,
					database: tab.database || activeDatabase.value,
					datasourceId: currentDatasourceId.value
				});
				row[blobColumn.value] = value;
				blobEditing.value = false;
				blobBase64.value = value;
				if (blobIsBinary.value) {
					const bytes = base64ToBytes(String(value));
					blobHex.value = bytesToHex(bytes);
					const mime = sniffImageMime(bytes);
					blobImageSrc.value = mime ? `data:${mime};base64,${value}` : "";
				}
				message.success("已保存");
				loadTableData(tab);
			} catch (e) {
				message.error(`保存失败: ${String(e?.message ?? e)}`);
			} finally {
				blobSaving.value = false;
			}
		}
		/** 字节数组 → base64（分块喂给 btoa，避免超长参数爆栈） */
		function bytesToBase64(bytes) {
			let bin = "";
			const chunk = 32768;
			for (let i = 0; i < bytes.length; i += chunk) bin += String.fromCharCode(...bytes.subarray(i, i + chunk));
			return btoa(bin);
		}
		/** 按列类型决定提交值：数字列转 Number，空串转 null */
		function normalizeCellValue(col, raw) {
			if (raw === "") return null;
			const t = (columnTypes.value.get(col) || "").toUpperCase();
			if (/INT|DECIMAL|NUMERIC|FLOAT|DOUBLE/.test(t)) {
				const n = Number(raw);
				return Number.isFinite(n) ? n : raw;
			}
			return raw;
		}
		function isNumericCol(col) {
			return /INT|DECIMAL|NUMERIC|FLOAT|DOUBLE/.test(columnTypes.value.get(col) || "");
		}
		function isDateCol(col) {
			return /DATE|TIME|YEAR/.test(columnTypes.value.get(col) || "");
		}
		/** 自增主键：主键列且为整数类型，新增行时留空由数据库生成 */
		function isAutoIncrement(col) {
			return pkColumns.value.has(col) && /INT/.test(columnTypes.value.get(col) || "");
		}
		function startEditCell(row, col, value) {
			if (pkColumns.value.has(col)) {
				message.info("主键列不可编辑");
				return;
			}
			editingCell.value = {
				row,
				column: col,
				value: value === null || value === void 0 ? "" : String(value)
			};
		}
		function cancelCell() {
			editingCell.value = null;
		}
		async function saveCell(row, col) {
			const cell = editingCell.value;
			if (!cell) return;
			editingCell.value = null;
			const tab = activeTabObj.value;
			if (!tab?.tableName) return;
			const pk = {};
			pkColumns.value.forEach((k) => {
				pk[k] = row[k];
			});
			if (Object.keys(pk).length === 0) {
				message.warning("该表无主键，无法定位更新");
				return;
			}
			const newValue = normalizeCellValue(col, cell.value);
			try {
				const affected = await updateDbCell({
					tableName: tab.tableName,
					column: col,
					newValue,
					primaryKey: pk,
					database: tab.database || activeDatabase.value,
					datasourceId: currentDatasourceId.value
				});
				if (typeof affected === "number" && affected === 0) {
					message.warning(`未找到要更新的行（主键 ${JSON.stringify(pk)}），可能已被他人删除，请刷新后重试`);
					refreshTableData();
					return;
				}
				message.success(`已更新 ${col}`);
				row[col] = newValue;
				silentRefreshTableData(tab);
			} catch (e) {
				message.error(`保存失败: ${String(e?.message ?? e)}`);
				refreshTableData();
			}
		}
		/** 清空表：二次确认后 TRUNCATE/DELETE */
		async function confirmTruncate(tableName, database) {
			if (!tableName) {
				message.warning("请先选择一个表");
				return;
			}
			const db = database || activeDatabase.value;
			try {
				await ElMessageBox.confirm(`确定清空表 ${tableName} 吗？将删除全部数据且不可恢复！`, "清空表", {
					type: "warning",
					confirmButtonText: "清空",
					cancelButtonText: "取消",
					confirmButtonClass: "el-button--danger"
				});
			} catch {
				return;
			}
			try {
				await truncateDbTable(tableName, currentDatasourceId.value, db);
				message.success("表已清空");
				const tab = activeTabObj.value;
				if (tab?.type === "table" && tab.tableName === tableName) refreshTableData();
			} catch (e) {
				message.error(`清空失败: ${String(e?.message ?? e)}`);
			}
		}
		function openIndexes() {
			designSubTab.value = "indexes";
			loadIndexes();
		}
		async function loadIndexes() {
			const tab = activeTabObj.value;
			if (!tab?.tableName) return;
			indexLoading.value = true;
			try {
				indexes.value = await fetchDbIndexes(tab.tableName, currentDatasourceId.value, tab.database);
			} catch (e) {
				message.error(`加载索引失败: ${String(e?.message ?? e)}`);
			} finally {
				indexLoading.value = false;
			}
		}
		function reloadDesignArea() {
			if (designSubTab.value === "columns") {
				const tab = activeTabObj.value;
				if (tab) loadTableDesign(tab);
			} else if (designSubTab.value === "indexes") loadIndexes();
			else loadForeignKeys();
		}
		function openIndexDialog() {
			Object.assign(indexForm, {
				indexName: "",
				columns: [],
				unique: false,
				indexType: "BTREE",
				prefixes: [],
				primary: false
			});
			indexDialogVisible.value = true;
		}
		/**
		* 调整复合索引的列序。
		*
		* <p>索引列的顺序决定前缀能不能命中，改列序是复合索引最常做的调整，
		* 但下拉多选本身不提供排序控件，所以额外给上移/下移。
		* 后端按数组顺序原样建索引（不排序），因此这里的顺序就是最终列序。</p>
		*
		* @param index 当前列下标
		* @param delta 移动方向：-1 上移，1 下移
		*/
		function moveIndexColumn(index, delta) {
			const next = index + delta;
			if (next < 0 || next >= indexForm.columns.length) return;
			const cols = [...indexForm.columns];
			[cols[index], cols[next]] = [cols[next], cols[index]];
			indexForm.columns = cols;
			const prefixes = normalizePrefixes(cols, indexForm.prefixes);
			indexForm.prefixes = prefixes;
		}
		/**
		* 把前缀长度数组对齐到给定的列序列。
		*
		* <p>多选增删列会让 prefixes 与 columns 长度不一致，后端按下标取，
		* 对不齐就会把 A 列的前缀套到 B 列上 —— 这里统一按**当前列**重新排布，
		* 能按列名对上的沿用原值，对不上的置 0（整列）。</p>
		*
		* @param columns 当前列序列
		* @param previous 调整前的前缀数组（与旧列序列同序）
		* @returns 与 columns 等长的前缀数组
		*/
		function normalizePrefixes(columns, previous) {
			return columns.map((_, i) => {
				const value = previous[i];
				return typeof value === "number" && value > 0 ? value : 0;
			});
		}
		/**
		* 调整主键的列序。
		*
		* @param index 当前列下标
		* @param delta 移动方向：-1 上移，1 下移
		*/
		function movePkColumn(index, delta) {
			const next = index + delta;
			if (next < 0 || next >= pkDialogColumns.value.length) return;
			const cols = [...pkDialogColumns.value];
			[cols[index], cols[next]] = [cols[next], cols[index]];
			pkDialogColumns.value = cols;
		}
		/** 当前全部可选字符集（由内核下发） */
		const charsetOptions = computed(() => {
			const seen = /* @__PURE__ */ new Set();
			const list = [];
			for (const c of tableOptionValues.value.collations) {
				if (!c.charset || seen.has(c.charset)) continue;
				seen.add(c.charset);
				list.push({
					label: c.charset,
					value: c.charset
				});
			}
			return list;
		});
		/**
		* 列的字符集变了就刷新排序规则下拉，并清掉不属于新字符集的旧排序规则。
		*
		* <p>不清的话会把 utf8mb4_general_ci 提交到 latin1 列上，内核会报
		* "COLLATION 'utf8mb4_general_ci' is not valid for CHARACTER SET 'latin1'" ——
		* 用户只能从报错里反推哪里错了。</p>
		*
		* @param charset 新选的字符集
		*/
		function onColumnCharsetChange(charset) {
			if (typeof charset !== "string" || !charset) {
				columnForm.collation = "";
				return;
			}
			loadTableOptionValues(charset);
			if (!tableOptionValues.value.collations.some((c) => c.collation === columnForm.collation && c.charset === charset)) columnForm.collation = "";
		}
		/**
		* 表属性的字符集变了就清掉不匹配的排序规则（同 {@link onColumnCharsetChange}）。
		*
		* @param charset 新选的字符集
		*/
		function onOptionsCharsetChange(charset) {
			if (typeof charset !== "string" || !charset) return;
			loadTableOptionValues(charset);
			if (tableOptionValues.value.collations.length > 0) {
				if (!tableOptionValues.value.collations.some((c) => c.collation === optionsForm.collation && c.charset === charset)) optionsForm.collation = "";
			}
		}
		async function saveIndex() {
			const tab = activeTabObj.value;
			if (!tab?.tableName) return;
			if (!indexForm.primary && !indexForm.indexName.trim()) {
				message.warning("请输入索引名");
				return;
			}
			if (indexForm.columns.length === 0) {
				message.warning("请选择至少一列");
				return;
			}
			try {
				await createDbIndex(tab.tableName, {
					indexName: indexForm.indexName.trim(),
					columns: indexForm.columns,
					unique: indexForm.primary ? true : indexForm.unique,
					indexType: indexForm.indexType || void 0,
					prefixes: indexForm.prefixes.length > 0 ? indexForm.prefixes : void 0,
					primary: indexForm.primary,
					database: tab.database,
					datasourceId: currentDatasourceId.value
				});
				message.success(indexForm.primary ? "已设为主键" : "索引已创建");
				indexDialogVisible.value = false;
				await loadIndexes();
				await loadTableDesign(tab);
				loadPkInfo(tab);
			} catch (e) {
				message.error(`${indexForm.primary ? "设置主键" : "创建索引"}失败: ${String(e?.message ?? e)}`);
			}
		}
		/**
		* 打开表属性弹窗。
		*
		* <p>同时拉两样东西：当前表属性（回填表单）与内核可选值（引擎 / 排序规则下拉）。
		* 可选值必须由内核下发 —— 不同内核、不同版本可用的引擎与排序规则不同，
		* 前端硬编码会让用户选到内核不认的值。</p>
		*/
		async function openTableOptionsDialog() {
			const tab = activeTabObj.value;
			if (!tab?.tableName) return;
			await loadTableOptionValues();
			try {
				const data = await fetchDbTableOptions(tab.tableName, currentDatasourceId.value, tab.database);
				Object.assign(optionsForm, {
					engine: data?.engine ?? "",
					charset: data?.charset ?? "",
					collation: data?.collation ?? "",
					comment: data?.comment ?? "",
					autoIncrement: data?.autoIncrement ?? void 0
				});
				Object.assign(tableOptionOriginal, { ...optionsForm });
				optionsDialogVisible.value = true;
			} catch (e) {
				message.error(`读取表属性失败: ${String(e?.message ?? e)}`);
			}
		}
		/**
		* 保存表属性。
		*
		* <p>只提交**真正改动过的字段**：后端把「未传」理解为不改，
		* 若把整个表单原样回传，会把用户没碰过的字段也写一遍，
		* 在大表上是纯粹的锁竞争。</p>
		*/
		async function saveTableOptions() {
			const tab = activeTabObj.value;
			if (!tab?.tableName) return;
			const payload = {};
			if (optionsForm.engine !== tableOptionOriginal.engine) payload.engine = optionsForm.engine;
			if (optionsForm.charset !== tableOptionOriginal.charset) payload.charset = optionsForm.charset;
			if (optionsForm.collation !== tableOptionOriginal.collation) payload.collation = optionsForm.collation;
			if (optionsForm.comment !== tableOptionOriginal.comment) payload.comment = optionsForm.comment;
			if (optionsForm.autoIncrement !== tableOptionOriginal.autoIncrement) payload.autoIncrement = optionsForm.autoIncrement;
			if (Object.keys(payload).length === 0) {
				message.info("没有改动");
				optionsDialogVisible.value = false;
				return;
			}
			optionsSaving.value = true;
			try {
				await updateDbTableOptions(tab.tableName, {
					...payload,
					database: tab.database,
					datasourceId: currentDatasourceId.value
				});
				message.success("表属性已保存");
				optionsDialogVisible.value = false;
				await loadTableDesign(tab);
			} catch (e) {
				message.error(`保存表属性失败: ${String(e?.message ?? e)}`);
			} finally {
				optionsSaving.value = false;
			}
		}
		/** 打开主键设置弹窗，并回填当前主键（按列序，复合主键的顺序不能乱） */
		async function openPkDialog() {
			const tab = activeTabObj.value;
			if (!tab?.tableName) return;
			await loadPkInfo(tab);
			const ordered = designColumns.value.filter((c) => c.isPrimaryKey).map((c) => c.name);
			pkDialogColumns.value = ordered;
			pkDialogVisible.value = true;
		}
		/** 保存主键（不选任何列 = 清除主键） */
		async function savePrimaryKey() {
			const tab = activeTabObj.value;
			if (!tab?.tableName) return;
			const clearing = pkDialogColumns.value.length === 0;
			if (clearing) try {
				await ElMessageBox.confirm("清除主键后，该表将不再有唯一性约束与自增基准，确定吗？", "清除主键", { type: "warning" });
			} catch {
				return;
			}
			pkSaving.value = true;
			try {
				await setDbTablePrimaryKey(tab.tableName, pkDialogColumns.value, currentDatasourceId.value, tab.database);
				message.success(clearing ? "主键已清除" : "主键已保存");
				pkDialogVisible.value = false;
				await loadTableDesign(tab);
				loadPkInfo(tab);
			} catch (e) {
				message.error(`设置主键失败: ${String(e?.message ?? e)}`);
			} finally {
				pkSaving.value = false;
			}
		}
		async function removeIndex(row) {
			const tab = activeTabObj.value;
			if (!tab?.tableName) return;
			try {
				await ElMessageBox.confirm(`确定删除索引 ${row.indexName} 吗？`, "删除索引", { type: "warning" });
			} catch {
				return;
			}
			try {
				await dropDbIndex(tab.tableName, row.indexName, currentDatasourceId.value, tab.database);
				message.success("索引已删除");
				loadIndexes();
			} catch (e) {
				message.error(`删除索引失败: ${String(e?.message ?? e)}`);
			}
		}
		/**
		* 打开列编辑弹窗。
		*
		* <p>回填时优先用后端读出的 `baseType` / `unsigned` / `enumValues` 等属性 ——
		* 此前只从 `type` 文本里正则抠出类型名和长度，`int(10) unsigned` 会被当成 INT/10，
		* 无符号、字符集、自增、枚举取值全部丢失，用户一打开就是错的，再一点保存就把
		* 属性改没了。</p>
		*
		* @param mode add=新增 / edit=修改
		* @param row  被修改的列（add 时可空）
		*/
		async function openColumnDialog(mode, row) {
			columnDialogMode.value = mode;
			if (tableOptionValues.value.collations.length === 0) await loadTableOptionValues(row?.charset);
			if (mode === "edit" && row) {
				editingDesignColumn.value = row;
				const rawType = (row.type || "").toUpperCase();
				const m = /^([A-Z ]+?)\s*(?:\(\s*(\d+)\s*(?:,\s*(\d+)\s*)?\))?/.exec(rawType);
				const baseType = (row.baseType || m?.[1] || "VARCHAR").toUpperCase().replace(/\s+/g, " ");
				const known = columnTypeOptions.includes(baseType);
				if (!known) COLUMN_TYPE_GROUPS.push({
					label: "其他",
					types: [baseType]
				});
				const needsSizeByDefault = !known && (SIZE_REQUIRED.has(baseType) || /DATE|TIME/.test(baseType));
				Object.assign(columnForm, {
					columnName: row.name,
					type: baseType,
					size: m?.[2] ? Number(m[2]) : needsSizeByDefault ? 255 : void 0,
					scale: m?.[3] ? Number(m[3]) : row.scale || void 0,
					unsigned: row.unsigned === true,
					zerofill: row.zerofill === true,
					charset: row.charset ?? "",
					collation: row.collation ?? "",
					nullable: row.nullable !== false,
					defaultValue: row.default ?? "",
					onUpdate: "",
					autoIncrement: row.autoIncrement === true,
					enumValues: (row.enumValues ?? []).join("\n"),
					comment: row.remark ?? ""
				});
			} else {
				editingDesignColumn.value = null;
				Object.assign(columnForm, {
					columnName: "",
					type: "VARCHAR",
					size: 255,
					scale: void 0,
					unsigned: false,
					zerofill: false,
					charset: "",
					collation: "",
					nullable: true,
					defaultValue: "",
					onUpdate: "",
					autoIncrement: false,
					enumValues: "",
					comment: ""
				});
			}
			columnDialogVisible.value = true;
		}
		async function saveColumn() {
			const tab = activeTabObj.value;
			if (!tab?.tableName) return;
			if (!columnForm.columnName.trim()) {
				message.warning("请输入列名");
				return;
			}
			if (columnNeedsSize.value && !columnForm.size) {
				message.warning(`${columnForm.type} 必须指定长度`);
				return;
			}
			if (columnIsEnum.value && parseEnumValues().length === 0) {
				message.warning(`${columnForm.type} 必须至少配置一个取值`);
				return;
			}
			if (columnForm.autoIncrement && columnForm.nullable) {
				message.warning("自动递增的列不能可空");
				return;
			}
			if (columnForm.unsigned && !columnAllowsUnsigned.value) {
				message.warning(`${columnForm.type} 不支持无符号`);
				return;
			}
			const enumValues = columnIsEnum.value ? parseEnumValues() : void 0;
			const payload = {
				columnName: columnForm.columnName.trim(),
				type: columnForm.type,
				size: columnNeedsSize.value ? columnForm.size : void 0,
				scale: columnAllowsScale.value ? columnForm.scale : void 0,
				unsigned: columnAllowsUnsigned.value ? columnForm.unsigned : false,
				zerofill: columnForm.unsigned && columnForm.zerofill,
				charset: columnIsChar.value ? columnForm.charset || void 0 : void 0,
				collation: columnIsChar.value ? columnForm.collation || void 0 : void 0,
				nullable: columnForm.nullable,
				defaultValue: columnForm.defaultValue || void 0,
				onUpdate: columnForm.onUpdate || void 0,
				autoIncrement: columnForm.autoIncrement,
				enumValues,
				comment: columnForm.comment || void 0,
				database: tab.database,
				datasourceId: currentDatasourceId.value
			};
			try {
				if (columnDialogMode.value === "add") {
					await addDbColumn(tab.tableName, payload);
					message.success("列已新增");
				} else {
					await modifyDbColumn(tab.tableName, columnForm.columnName.trim(), payload);
					message.success("列已修改");
				}
				columnDialogVisible.value = false;
				await loadTableDesign(tab);
				loadPkInfo(tab);
				refreshTableData();
			} catch (e) {
				message.error(`保存列失败: ${String(e?.message ?? e)}`);
			}
		}
		async function removeColumn(row) {
			const tab = activeTabObj.value;
			if (!tab?.tableName) return;
			try {
				await ElMessageBox.confirm(`确定删除列 ${row.name} 吗？该列数据将一并删除！`, "删除列", { type: "warning" });
			} catch {
				return;
			}
			try {
				await dropDbColumn(tab.tableName, row.name, currentDatasourceId.value, tab.database);
				message.success("列已删除");
				await loadTableDesign(tab);
				refreshTableData();
			} catch (e) {
				message.error(`删除列失败: ${String(e?.message ?? e)}`);
			}
		}
		const queryResult = reactive({});
		/**
		* 多结果集（仅「执行脚本」会产生多条）。
		*
		* <p>单条执行**仍然只写 {@link queryResult}**，形状保持 `data.columns`/`data.rows` 不变 ——
		* 6 个既有 UI 验收套件按这个形状断言，改形状等于让它们的结论全部失效。</p>
		*/
		const resultSets = ref([]);
		/** 当前显示第几个结果集 */
		const activeResultSet = ref(0);
		/** 当前结果集是不是更新语句（无结果集，要给一句说明而不是空表格） */
		const activeResultIsUpdate = computed(() => {
			const r = resultSets.value[activeResultSet.value];
			return !!r && r.columns === void 0 && r.affectedRows !== void 0;
		});
		/** 当前结果集是不是失败的那条（有 message 但没有结果集） */
		const activeResultIsFailure = computed(() => {
			const r = resultSets.value[activeResultSet.value];
			return !!r && r.columns === void 0 && r.affectedRows === void 0 && !!r.message;
		});
		/** 「打开 SQL 文件」用的隐藏 file input */
		const sqlFileInputRef = ref(null);
		const queryColumns = computed(() => (queryResult.columns || []).map((col) => ({
			prop: col,
			label: col,
			minWidth: 120,
			showOverflowTooltip: true
		})));
		/**
		* 结果集页签文案：既标第几条，也标这条是查询还是更新。
		*
		* <p>只写「第 3 条」不够 —— 用户看到第 3 条是空的，得知道那是因为它是
		* `UPDATE` 而不是「查询没查到东西」。</p>
		*
		* @param r 结果集
		* @param i 下标
		* @returns 页签文案
		*/
		function resultSetLabel(r, i) {
			if (r.columns !== void 0) return `第 ${i + 1} 条 · 查询 · ${r.rowCount ?? 0} 行`;
			if (r.affectedRows !== void 0) return `第 ${i + 1} 条 · 更新 · 影响 ${r.affectedRows} 行`;
			if (r.message) return `第 ${i + 1} 条 · 失败`;
			return `第 ${i + 1} 条 · 无结果`;
		}
		/**
		* 切换当前显示的结果集。
		*
		* <p>必须经这个函数而不是直接改 {@link activeResultSet}：
		* 结果区只认 {@link queryResult}，只改下标的话表格内容纹丝不动，
		* 表现为「点页签没反应」。</p>
		*
		* @param i 结果集下标
		*/
		function selectResultSet(i) {
			activeResultSet.value = i;
			showResultSet(resultSets.value[i]);
		}
		/** 把某个结果集写进 {@link queryResult}（结果区只认这一个） */
		function showResultSet(r) {
			Object.assign(queryResult, {
				columns: r?.columns,
				rows: r?.rows,
				rowCount: r?.rowCount,
				truncated: r?.truncated,
				affectedRows: r?.affectedRows,
				message: r?.message
			});
		}
		function loadQueryHistory() {
			try {
				const raw = localStorage.getItem(HISTORY_KEY);
				if (!raw) return [];
				const parsed = JSON.parse(raw);
				return Array.isArray(parsed) ? parsed : [];
			} catch {
				return [];
			}
		}
		const queryHistory = ref(loadQueryHistory());
		const historyVisible = ref(false);
		/** 切换历史面板显示（与模板面板互斥，避免两个面板叠在一起） */
		function toggleHistory() {
			historyVisible.value = !historyVisible.value;
			if (historyVisible.value) templatesVisible.value = false;
		}
		/** 记一条执行历史（最新在前；同一段 SQL 不重复记） */
		function pushQueryHistory(sql, summary) {
			const text = sql.trim();
			if (!text) return;
			const at = (/* @__PURE__ */ new Date()).toLocaleTimeString("zh-CN", { hour12: false });
			const rest = queryHistory.value.filter((h) => h.sql !== text);
			queryHistory.value = [{
				at,
				sql: text,
				summary
			}, ...rest].slice(0, HISTORY_LIMIT);
			try {
				localStorage.setItem(HISTORY_KEY, JSON.stringify(queryHistory.value));
			} catch {
				message.warning("查询历史无法持久化（浏览器存储不可用），本次会话内仍可回看");
			}
		}
		/** 点历史条目把 SQL 回填编辑器 */
		function loadFromHistory(sql) {
			const tab = activeTabObj.value;
			if (!tab) return;
			tab.sql = sql;
			historyVisible.value = false;
		}
		/** 清空历史（localStorage 也要清，否则刷新后又回来） */
		function clearQueryHistory() {
			queryHistory.value = [];
			try {
				localStorage.removeItem(HISTORY_KEY);
			} catch {}
			message.success("查询历史已清空");
		}
		function loadSqlTemplates() {
			try {
				const raw = localStorage.getItem(TPL_KEY);
				if (!raw) return [];
				const parsed = JSON.parse(raw);
				return Array.isArray(parsed) ? parsed : [];
			} catch {
				return [];
			}
		}
		const sqlTemplates = ref(loadSqlTemplates());
		const templatesVisible = ref(false);
		/** 持久化模板（配额满 / 隐私模式降级为仅本次会话，与历史同策略） */
		function persistSqlTemplates() {
			try {
				localStorage.setItem(TPL_KEY, JSON.stringify(sqlTemplates.value));
			} catch {
				message.warning("SQL 模板无法持久化（浏览器存储不可用），本次会话内仍可使用");
			}
		}
		/** 切换模板面板显示（与查询历史互斥） */
		function toggleTemplates() {
			templatesVisible.value = !templatesVisible.value;
			if (templatesVisible.value) historyVisible.value = false;
		}
		/** 把当前编辑器 SQL 存为模板（同名覆盖，走 prompt 与重命名表同款归一化） */
		async function saveSqlTemplate() {
			const sql = (activeTabObj.value?.sql || "").trim();
			if (!sql) {
				message.warning("当前编辑器没有可保存的 SQL");
				return;
			}
			try {
				const name = promptValue(await ElMessageBox.prompt("模板名称（同名将覆盖）", "保存 SQL 模板", {
					inputValue: "",
					inputPlaceholder: "如：近 7 天订单汇总",
					inputValidator: (v) => v && v.trim() ? true : "请输入模板名称"
				}));
				if (!name) return;
				const at = (/* @__PURE__ */ new Date()).toLocaleString("zh-CN", { hour12: false });
				const rest = sqlTemplates.value.filter((t) => t.name !== name);
				sqlTemplates.value = [{
					name,
					sql,
					at
				}, ...rest].slice(0, TPL_LIMIT);
				persistSqlTemplates();
				message.success(`模板「${name}」已保存`);
			} catch {}
		}
		/** 点模板条目把 SQL 回填编辑器 */
		function loadSqlTemplate(t) {
			const tab = activeTabObj.value;
			if (!tab) return;
			tab.sql = t.sql;
			templatesVisible.value = false;
			message.success(`已载入模板「${t.name}」`);
		}
		/** 删一个模板（localStorage 同步清） */
		function removeSqlTemplate(name) {
			sqlTemplates.value = sqlTemplates.value.filter((t) => t.name !== name);
			persistSqlTemplates();
		}
		const execTimeoutOptions = [
			{
				label: "10s",
				value: 10
			},
			{
				label: "30s",
				value: 30
			},
			{
				label: "120s",
				value: 120
			},
			{
				label: "300s",
				value: 300
			},
			{
				label: "不限",
				value: 0
			}
		];
		function loadExecTimeout() {
			const raw = localStorage.getItem(EXEC_TIMEOUT_KEY);
			if (raw == null || raw === "") return 120;
			const n = Number(raw);
			return execTimeoutOptions.some((o) => o.value === n) ? n : 120;
		}
		const execTimeoutSec = ref(loadExecTimeout());
		watch(execTimeoutSec, (v) => {
			try {
				localStorage.setItem(EXEC_TIMEOUT_KEY, String(v));
			} catch {}
		});
		/**
		* 当前执行超时毫秒。
		*
		* @returns {number} >0 为毫秒数；0 = 不限（axios timeout 0 即不设上限）
		*/
		function execTimeoutMs() {
			return execTimeoutSec.value > 0 ? execTimeoutSec.value * 1e3 : 0;
		}
		const dbAi = ref({ available: false });
		const aiDialogVisible = ref(false);
		const aiPrompt = ref("");
		const aiSql = ref("");
		const aiBusy = ref(false);
		/** 结构上下文提示（展示截断，发送时用全量表清单） */
		const aiContextHint = computed(() => {
			const db = activeTabObj.value?.database || activeDatabase.value;
			const names = getTablesForDb(db).map((t) => t.name);
			if (!names.length) return "";
			return `${db}：${names.slice(0, 8).join(", ")}${names.length > 8 ? ` 等 ${names.length} 张表` : ""}`;
		});
		/** 探测 text2sql 可用性（fetchDbAiStatus 内部已兜底，失败即隐藏入口） */
		async function refreshAiStatus() {
			dbAi.value = await fetchDbAiStatus();
		}
		function openAiDialog() {
			aiPrompt.value = "";
			aiSql.value = "";
			aiDialogVisible.value = true;
		}
		/**
		* 生成 SQL（不执行）。
		*
		* <p>结构上下文取当前库已加载的表清单 —— 后端提示词要求「只用真实存在的
		* 表与列」，带上表名能显著减少虚构；没加载过表清单时留空由后端自行兜底。</p>
		*/
		async function generateAiSql() {
			const text = aiPrompt.value.trim();
			if (!text) {
				message.warning("请先输入查询需求");
				return;
			}
			aiBusy.value = true;
			try {
				const db = activeTabObj.value?.database || activeDatabase.value;
				const names = getTablesForDb(db).map((t) => t.name);
				const context = names.length ? `库 ${db} 的表：${names.join(", ")}` : void 0;
				const res = await requestDbText2Sql(text, context, currentDatasourceId.value);
				aiSql.value = res.sql;
			} catch (e) {
				message.error(e?.message || "AI 生成失败");
			} finally {
				aiBusy.value = false;
			}
		}
		/** 把生成结果填入编辑器（不执行；执行仍由用户 Ctrl+Enter / 点执行） */
		function applyAiSql() {
			const tab = activeTabObj.value;
			if (!tab || !aiSql.value) return;
			tab.sql = aiSql.value;
			aiDialogVisible.value = false;
			message.success("已填入编辑器（未执行，Ctrl+Enter 执行）");
		}
		const paramDialogVisible = ref(false);
		/** 脚本里用到的变量名（来自 /db/scan-params） */
		const paramNames = ref([]);
		/** 变量取值 */
		const paramValues = reactive({});
		/** 当前查询页签的目标库，批量/参数执行都要用它 */
		function queryTargetDatabase() {
			return activeTabObj.value?.database || activeDatabase.value || void 0;
		}
		/**
		* 打开参数弹窗：先扫描占位符，再带上历史取值。
		*
		* <p>扫描走纯文本端点、不执行 SQL —— 编辑器每次改动都问一次后端的话，
		* 成本会体现在每次按键的延迟上。</p>
		*/
		async function openParamDialog() {
			const sql = activeTabObj.value?.sql ?? "";
			if (!sql.trim()) {
				message.info("先写点 SQL 再填参数");
				return;
			}
			try {
				const names = await scanSqlParams(sql);
				paramNames.value = Array.isArray(names) ? names : [];
				for (const k of Object.keys(paramValues)) if (!paramNames.value.includes(k)) delete paramValues[k];
				for (const n of paramNames.value) if (paramValues[n] === void 0) paramValues[n] = "";
				paramDialogVisible.value = true;
			} catch (e) {
				message.error(`扫描参数失败: ${String(e?.message ?? e)}`);
			}
		}
		/** 填完参数直接执行（关弹窗） */
		async function runWithParams() {
			const missing = paramNames.value.filter((n) => paramValues[n] === void 0 || paramValues[n] === "");
			if (missing.length > 0) {
				message.warning(`请填写参数：${missing.join("、")}`);
				return;
			}
			paramDialogVisible.value = false;
			await executeScriptWithParams();
		}
		const contextMenu = reactive({
			visible: false,
			x: 0,
			y: 0,
			tableName: "",
			database: "",
			tabId: "",
			isView: false
		});
		const createTableVisible = ref(false);
		/** 新建表的目标库，来自左侧树选中节点 */
		const newTableDatabase = ref("");
		onMounted(async () => {
			await loadDatasources();
			refreshAiStatus();
		});
		/**
		* 当前应当生效的数据源 ID。
		*
		* <p>优先级：宿主的 datasourceId 属性 &gt; 路由 query &gt; 默认主数据源（0）。
		* 属性排在前面是因为内嵌模式下 URL 上根本没有这个参数，而且宿主的选中项
		* 才是用户当前真正在看的那一个。</p>
		*
		* @return 数据源 ID；无有效来源时为默认主数据源的 0
		*/
		function resolveDatasourceId() {
			if (Number.isFinite(props.datasourceId) && (props.datasourceId ?? 0) > 0) return props.datasourceId;
			const fromQuery = Number(route.query.datasourceId);
			if (Number.isFinite(fromQuery) && fromQuery > 0) return fromQuery;
			return DEFAULT_DATASOURCE.id ?? 0;
		}
		async function loadDatasources() {
			try {
				const jdbc = (await fetchDataSources()).filter((d) => d.type === "jdbc");
				datasources.value = [DEFAULT_DATASOURCE, ...jdbc];
				let requested = resolveDatasourceId();
				if (requested <= 0 && viewPref.lastDatasourceId > 0 && !embedded) requested = viewPref.lastDatasourceId;
				if (requested > 0) if (jdbc.some((d) => d.id === requested)) currentDatasourceId.value = requested;
				else {
					if (!embedded) message.warning(`数据源 #${requested} 未登记或不是 JDBC 类型，已改用默认主数据源`);
					currentDatasourceId.value = DEFAULT_DATASOURCE.id ?? 0;
				}
			} catch (e) {
				console.error("加载数据源失败", e);
				datasources.value = [DEFAULT_DATASOURCE];
			}
			await loadTree();
		}
		/**
		* 清掉「表已不存在」的每表偏好。
		*
		* <p>表改名或删掉后偏好会一直占着位置，把真正在用的挤出 120 条上限。
		* 这里按「当前库里真实存在的表」对一遍，而不是等上限触发 ——
		* 等上限触发时，被挤掉的往往是用户**最近还在用**的那几张。</p>
		*/
		async function pruneStaleTablePrefs() {
			const db = activeDatabase.value;
			if (!db) return;
			try {
				const tables = await fetchDbTables(currentDatasourceId.value, db);
				const exist = new Set((tables || []).map((t) => `${db}.${t.name}`));
				if (exist.size === 0) return;
				const removed = pruneTablePrefs(exist);
				if (removed > 0) console.info(`[dbm] 清理了 ${removed} 条已失效的表筛选偏好`);
			} catch {}
		}
		/** 数据源切换后：记住它，并清掉该数据源下已失效的每表筛选偏好 */
		watch(currentDatasourceId, (id) => {
			if (id > 0) saveViewPref({ lastDatasourceId: id });
			pruneStaleTablePrefs();
			refreshAiStatus();
		});
		/**
		* 宿主（左栏）切换了数据源时跟随切换。
		*
		* <p>独立路由下这个属性恒为 undefined，watch 不会触发，行为与改造前一致。</p>
		*/
		watch(() => props.datasourceId, async (id, old) => {
			if (id === old || !id || !embedded) return;
			Object.keys(tablesByDb).forEach((k) => delete tablesByDb[k]);
			Object.keys(tableColumnsCache).forEach((k) => delete tableColumnsCache[k]);
			expandedNodes.value = /* @__PURE__ */ new Set(["root"]);
			expandedTables.value = /* @__PURE__ */ new Set();
			activeDatabase.value = "";
			activeTable.value = "";
			tabs.value = [];
			activeTab.value = "";
			await loadDatasources();
		});
		async function onDatasourceChange() {
			Object.keys(tablesByDb).forEach((k) => delete tablesByDb[k]);
			activeDatabase.value = "";
			tabs.value = [];
			activeTab.value = "";
			await loadTree();
		}
		/** 树/下拉的展示名：文件库兜底出的空串库位显示「默认库」（值仍传 ""，链路不变） */
		function dbLabel(db) {
			return db || "默认库";
		}
		async function loadTree() {
			try {
				databases.value = await fetchDbDatabases(currentDatasourceId.value);
				if (!databases.value.length) databases.value = [""];
				if (databases.value.length > 0) {
					expandedNodes.value.add("db:" + databases.value[0]);
					await loadTables(databases.value[0]);
				}
			} catch (e) {
				message.error(`加载数据库树失败: ${String(e?.message ?? e)}`);
			}
		}
		async function loadTables(db) {
			try {
				tablesByDb[db] = await fetchDbTables(currentDatasourceId.value, db);
				activeDatabase.value = db;
			} catch (e) {
				message.error(`加载 ${db} 表列表失败: ${String(e?.message ?? e)}`);
			}
		}
		/**
		* 获取指定数据库已加载的表列表
		* @param db 数据库名
		*/
		function getTablesForDb(db) {
			return tablesByDb[db] || [];
		}
		/**
		* 指定库中的表（TABLE，排除视图），供树分组
		* @param db 数据库名
		*/
		function tablesOf(db) {
			return getTablesForDb(db).filter((t) => (t.type || "TABLE").toUpperCase() !== "VIEW");
		}
		/**
		* 指定库中的视图（VIEW），供树分组
		* @param db 数据库名
		*/
		function viewsOf(db) {
			return getTablesForDb(db).filter((t) => (t.type || "").toUpperCase() === "VIEW");
		}
		/**
		* 展开/收起侧栏树节点
		* @param key 节点键
		*/
		function toggleNode(key) {
			if (expandedNodes.value.has(key)) expandedNodes.value.delete(key);
			else {
				expandedNodes.value.add(key);
				if (key.startsWith("db:")) {
					const db = key.replace("db:", "");
					activeDatabase.value = db;
					activeTable.value = "";
					loadTables(db);
					loadDbObjects(db);
				}
			}
		}
		/**
		* 刷新数据源/数据库/表树
		*/
		function refreshTree() {
			loadTree();
		}
		/**
		* 选中表节点（展开结构）
		* @param tableName 表名
		* @param database 所属库
		*/
		function selectTable(tableName, database) {
			activeTable.value = tableName;
			activeDatabase.value = database;
			openTableData(tableName, database);
		}
		/**
		* 打开表数据页签
		* @param tableName 表名
		* @param database 所属库，缺省用当前选中库
		*/
		function openTableData(tableName, database = activeDatabase.value) {
			if (!tableName) {
				message.warning("请先在左侧选择一个表");
				return;
			}
			const id = "table-" + database + "." + tableName;
			let tab = tabs.value.find((t) => t.id === id);
			if (!tab) {
				tab = {
					id,
					type: "table",
					title: tabTitle(tableName, database),
					tableName,
					database
				};
				tabs.value.push(tab);
			}
			activeTab.value = id;
			resetTableQueryState();
			restoreTablePref(tab);
			tableData.page = 1;
			loadTableData(tab);
		}
		/**
		* 切换到指定页签：表数据与设计列是共享状态，换页签必须重新加载
		* @param id 页签 ID
		*/
		function selectTab(id) {
			activeTab.value = id;
			const tab = activeTabObj.value;
			if (tab?.type === "table") {
				resetTableQueryState();
				tableData.page = 1;
				loadTableData(tab);
			} else if (tab?.type === "design") loadTableDesign(tab);
		}
		/**
		* 打开表结构设计页签
		* @param tableName 表名
		* @param database 所属库，缺省用当前选中库
		*/
		function openTableDesign(tableName, database = activeDatabase.value) {
			if (!tableName) {
				message.warning("请先在左侧选择一个表");
				return;
			}
			designSubTab.value = "columns";
			const id = "design-" + database + "." + tableName;
			let tab = tabs.value.find((t) => t.id === id);
			if (!tab) {
				tab = {
					id,
					type: "design",
					title: tabTitle(tableName, database) + " - 设计",
					tableName,
					database
				};
				tabs.value.push(tab);
			}
			activeTab.value = id;
			loadTableDesign(tab);
		}
		/**
		* 页签标题：带库名前缀，避免同名表页签看不出区别
		* @param tableName 表名
		* @param database 所属库
		*/
		function tabTitle(tableName, database) {
			return database ? `${database}.${tableName}` : tableName;
		}
		/** 可选布局。刻意只给非层级布局：树形布局在普通关系图上会抛
		*  "Tree structure not found"（G6 内部异步抛出，组件侧 try/catch 拦不住）。 */
		const ER_LAYOUT_CHOICES = [
			{
				value: "dagre",
				label: "有向分层"
			},
			{
				value: "antv-dagre",
				label: "有向分层(antv)"
			},
			{
				value: "force",
				label: "力导向"
			},
			{
				value: "d3-force",
				label: "D3 力导向"
			},
			{
				value: "circular",
				label: "环形"
			},
			{
				value: "grid",
				label: "网格"
			}
		];
		const erLayout = ref("dagre");
		const erLoading = ref(false);
		const erError = ref("");
		const erTables = ref([]);
		const erRelations = ref([]);
		/** 表名过滤（LIKE 模式） */
		const erTableFilter = ref("");
		/** 是否在边上显示约束名 */
		const erShowLabels = ref(true);
		/** 列清单弹窗 */
		const erColumnsVisible = ref(false);
		const erPickedTable = ref("");
		const erPickedColumns = ref([]);
		/** 图上的节点 */
		const erNodes = computed(() => erTables.value.map((t) => ({
			id: t.name,
			label: t.comment ? `${t.name}\n${t.comment}` : t.name,
			type: "rect",
			size: [180, 52],
			style: {
				fill: erMissingTables.value.has(t.name) ? "var(--el-fill-color-dark)" : "var(--el-bg-color-overlay)",
				stroke: erMissingTables.value.has(t.name) ? "var(--el-color-warning)" : "var(--el-color-primary)",
				lineWidth: 1,
				radius: 6,
				labelFill: "var(--el-text-color-primary)",
				labelFontSize: 12,
				cursor: "pointer"
			},
			data: {
				tableName: t.name,
				missing: erMissingTables.value.has(t.name)
			}
		})));
		/** 只被外键引用、却不在表清单里的表（跨库外键等） */
		const erMissingTables = computed(() => new Set(erTables.value.filter((t) => t.comment?.startsWith("（")).map((t) => t.name)));
		/** 外键规则码 → 中文（JDBC 规范：0=RESTRICT 1=CASCADE 2=SET NULL 3=NO ACTION 4=SET DEFAULT） */
		function fkRuleText(code) {
			switch (code) {
				case 0: return "限制";
				case 1: return "级联";
				case 2: return "置空";
				case 3: return "无动作";
				case 4: return "设默认";
				default: return "";
			}
		}
		/** 图上的边：一条外键一条边，指向被引用的表 */
		const erEdges = computed(() => erRelations.value.map((r, i) => {
			const label = [
				r.fromColumn ? `${r.fromColumn} → ${r.toColumn ?? "?"}` : "",
				r.name ?? "",
				fkRuleText(r.deleteRule) ? `删除:${fkRuleText(r.deleteRule)}` : ""
			].filter(Boolean).join("  ");
			return {
				id: `fk-${i}-${r.fromTable}-${r.toTable}`,
				source: r.fromTable,
				target: r.toTable,
				label: erShowLabels.value ? label : void 0,
				type: "cubic-horizontal",
				directed: true,
				style: {
					stroke: "var(--el-color-primary-light-3)",
					lineWidth: 1.2,
					endArrow: true,
					labelFill: "var(--el-text-color-secondary)",
					labelFontSize: 10,
					labelBackground: true,
					labelBackgroundFill: "var(--el-bg-color-overlay)",
					labelBackgroundRadius: 2
				},
				data: r
			};
		}));
		/** 工具条右侧的统计文本 */
		const erStatText = computed(() => {
			if (erLoading.value) return "";
			return `${erTables.value.length} 张表 · ${erRelations.value.length} 条外键`;
		});
		/** 页签标题里的库名 */
		const qualifiedEr = computed(() => {
			const db = activeTabObj.value?.database || "";
			return db ? `${db} · ER 图` : "ER 图";
		});
		/**
		* 打开 ER 图页签。
		*
		* @param database 库名；缺省用当前选中库
		*/
		function openErDiagram(database = activeDatabase.value) {
			if (!database) {
				message.warning("请先在左侧选择一个库");
				return;
			}
			const id = "er-" + database;
			let tab = tabs.value.find((t) => t.id === id);
			if (!tab) {
				tab = {
					id,
					type: "er",
					title: tabTitle(database, "") + " - ER 图",
					database
				};
				tabs.value.push(tab);
			}
			activeTab.value = id;
			loadErDiagram();
		}
		/** 差异类别 → 中文 */
		const SYNC_KIND_LABELS = {
			MISSING_TABLE: "缺表",
			MISSING_COLUMN: "缺列",
			COLUMN_MISMATCH: "列不一致",
			MISSING_INDEX: "缺索引",
			INDEX_MISMATCH: "索引不一致",
			MISSING_FOREIGN_KEY: "缺外键",
			EXTRA_TABLE: "目标多表",
			EXTRA_COLUMN: "目标多列"
		};
		/** 只提示、不生成脚本的类别 */
		const SYNC_EXTRA_KINDS = /* @__PURE__ */ new Set(["EXTRA_TABLE", "EXTRA_COLUMN"]);
		const syncVisible = ref(false);
		const syncLoading = ref(false);
		const syncRan = ref(false);
		const syncDiffError = ref("");
		const syncSourceDb = ref("");
		const syncTargetDb = ref("");
		const syncTableFilter = ref("");
		const syncItems = ref([]);
		/** 需要同步的差异数（排除只提示的那些） */
		const syncActionableCount = computed(() => syncItems.value.filter((d) => !SYNC_EXTRA_KINDS.has(d.kind)).length);
		/** 目标多出来的差异数 */
		const syncExtraCount = computed(() => syncItems.value.filter((d) => SYNC_EXTRA_KINDS.has(d.kind)).length);
		/** 生成的脚本：只拼可执行的那些 */
		const syncScript = computed(() => syncItems.value.filter((d) => d.ddl).map((d) => d.ddl).join("\n"));
		/**
		* 打开结构同步弹窗。
		*
		* <p>默认把「当前库当源、第一个不是它的库当目标」——
		* 用户从某个库的右键点进来时，这个方向最可能是他要的。
		* 方向永远是用户显式选的：结构同步是单向操作，
		* 「以谁为准」不该由实现替用户定。</p>
		*
		* @param database 当前库，作为源
		*/
		function openStructureSync(database = activeDatabase.value) {
			if (!database) {
				message.warning("请先在左侧选择一个库");
				return;
			}
			syncSourceDb.value = database;
			syncTargetDb.value = databases.value.find((db) => db && db !== database) || "";
			syncTableFilter.value = "";
			syncItems.value = [];
			syncDiffError.value = "";
			syncRan.value = false;
			syncVisible.value = true;
		}
		const docExportVisible = ref(false);
		const docExportDatabase = ref("");
		const docExportFormat = ref("markdown");
		const docExportTemplate = ref("DEFAULT");
		const docExportFormats = ref([]);
		const docExportTemplates = ref([]);
		const docExportLoading = ref(false);
		const docExportFormatsError = ref("");
		const docPreviewVisible = ref(false);
		const docPreviewLoading = ref(false);
		const docPreviewContent = ref("");
		const docPreviewError = ref("");
		/** 格式中文名（渲染器名保持英文，与后端 SPI 名一致，便于对排查） */
		const DOC_FORMAT_LABELS = {
			markdown: "Markdown（.md，纯文本）",
			html: "HTML（.html，浏览器可预览）",
			word: "Word（.docx）",
			pdf: "PDF（.pdf）"
		};
		/**
		* 打开文档导出对话框。
		*
		* <p>可选格式来自后端 {@code /document/formats} 的实际探测，不是前端写死四项：
		* word/pdf 的渲染器分属独立模块，宿主没引就没有，硬编码会给出点了就报
		* 「未找到文档导出实现」的选择项。</p>
		*
		* @param database 目标库
		*/
		async function openDocumentExport(database = activeDatabase.value) {
			if (!database) {
				message.warning("请先在左侧选择一个库");
				return;
			}
			docExportDatabase.value = database;
			docExportFormat.value = "markdown";
			docExportTemplate.value = "DEFAULT";
			docExportFormatsError.value = "";
			docExportVisible.value = true;
			try {
				const caps = await dbDocumentFormats();
				docExportFormats.value = caps?.formats ?? [];
				docExportTemplates.value = caps?.templates ?? [];
				if (docExportFormats.value.length === 0) docExportFormatsError.value = "当前实例未装配任何文档导出渲染器";
				else if (!docExportFormats.value.some((f) => f.format === docExportFormat.value)) docExportFormat.value = docExportFormats.value[0].format;
			} catch (e) {
				docExportFormats.value = [];
				docExportFormatsError.value = `查询导出能力失败：${e.message}`;
			}
		}
		/**
		* 执行文档导出并落盘。
		*
		* <p>文件名取后端给的（它按文档标题生成），而不是前端拼一个：中文标题经
		* RFC 5987 编码后由后端给出，前端再拼一次容易出现两套命名。</p>
		*/
		async function doDocumentExport() {
			if (!docExportDatabase.value || docExportLoading.value) return;
			docExportLoading.value = true;
			try {
				const { blob, filename } = await downloadDbDocument({
					datasourceId: currentDatasourceId.value,
					database: docExportDatabase.value,
					format: docExportFormat.value,
					template: docExportTemplate.value
				});
				const url = URL.createObjectURL(blob);
				const link = document.createElement("a");
				link.href = url;
				link.download = filename;
				link.click();
				URL.revokeObjectURL(url);
				docExportVisible.value = false;
				message.success(`文档已导出：${filename}`);
			} catch (e) {
				message.error(`文档导出失败：${e.message}`);
			} finally {
				docExportLoading.value = false;
			}
		}
		/** 在线预览文档 */
		async function doDocumentPreview() {
			if (!docExportDatabase.value) return;
			docPreviewLoading.value = true;
			docPreviewError.value = "";
			docPreviewContent.value = "";
			try {
				docPreviewContent.value = await previewDbDocument({
					datasourceId: currentDatasourceId.value,
					database: docExportDatabase.value,
					format: docExportFormat.value,
					template: docExportTemplate.value
				});
				docPreviewVisible.value = true;
				docExportVisible.value = false;
			} catch (e) {
				docPreviewError.value = e.message || "预览失败";
			} finally {
				docPreviewLoading.value = false;
			}
		}
		/** 比较两个库 */
		async function runStructureDiff() {
			if (!syncSourceDb.value || !syncTargetDb.value) {
				message.warning("请同时选择源库与目标库");
				return;
			}
			if (syncSourceDb.value === syncTargetDb.value) {
				message.warning("源库与目标库相同，没有可比较的差异");
				return;
			}
			syncLoading.value = true;
			syncDiffError.value = "";
			try {
				syncItems.value = await compareDbStructure({
					sourceDatasourceId: currentDatasourceId.value,
					sourceDatabase: syncSourceDb.value,
					targetDatasourceId: currentDatasourceId.value,
					targetDatabase: syncTargetDb.value,
					tables: syncTableFilter.value.trim() || void 0
				});
				syncRan.value = true;
			} catch (e) {
				syncDiffError.value = `比较失败：${String(e?.message ?? e)}`;
				syncItems.value = [];
				syncRan.value = true;
			} finally {
				syncLoading.value = false;
			}
		}
		/**
		* 在目标库执行生成的脚本，然后重新比较一次。
		*
		* <p>执行前必须二次确认：脚本里含 {@code DROP INDEX} 与
		* {@code MODIFY COLUMN}，是不可逆的。用户看过脚本再点一次是有意义的，
		* 但不能靠「他应该看过了」。</p>
		*/
		async function runStructureScript() {
			const script = syncScript.value;
			if (!script) return;
			const lines = script.split("\n").filter(Boolean).length;
			try {
				await ElMessageBox.confirm(`将向目标库「${syncTargetDb.value}」执行 ${lines} 条语句，其中含不可逆的 DROP INDEX / MODIFY COLUMN。确定执行？`, "执行同步脚本", {
					type: "warning",
					confirmButtonText: "执行",
					cancelButtonText: "取消"
				});
			} catch {
				return;
			}
			syncLoading.value = true;
			try {
				const bad = ((await executeDbSqlBatch(script, currentDatasourceId.value, syncTargetDb.value)).results || []).filter((r) => !!r.message && r.columns === void 0 && r.affectedRows === void 0);
				if (bad.length > 0) message.error(`${bad.length}/${lines} 条语句失败：` + String(bad[0].message || "").slice(0, 120));
				else message.success(`已执行 ${lines} 条语句，正在重新比较`);
			} catch (e) {
				message.error(`执行失败: ${String(e?.message ?? e)}`);
			} finally {
				syncLoading.value = false;
			}
			await runStructureDiff();
		}
		/**
		* 读取并绘制 ER 图。
		*
		* <p>只在这一个页签需要时才拉数据：ER 图对大库是**一次性整体视图**，
		* 在每次切库/切页签时都重拉会让浏览树的过程明显变慢。</p>
		*/
		async function loadErDiagram() {
			const tab = activeTabObj.value;
			if (!tab || tab.type !== "er") return;
			erLoading.value = true;
			erError.value = "";
			try {
				const data = await fetchErDiagram(erTableFilter.value.trim() || void 0, currentDatasourceId.value, tab.database);
				erTables.value = data.tables || [];
				erRelations.value = data.relations || [];
				const names = new Set(erTables.value.map((t) => t.name));
				for (const r of erRelations.value) for (const n of [r.fromTable, r.toTable]) if (n && !names.has(n)) {
					names.add(n);
					erTables.value.push({
						name: n,
						comment: "（被外键引用，但不在当前库的表清单里）"
					});
				}
			} catch (e) {
				erError.value = `读取失败：${String(e?.message ?? e)}`;
				erTables.value = [];
				erRelations.value = [];
			} finally {
				erLoading.value = false;
			}
		}
		/** ER 图组件实例（用于从清单跳转时高亮/居中） */
		const erGraphRef = ref(null);
		/** 双击图上的节点：列出该表的列 */
		async function onErNodeDblClick(node) {
			await openErColumns(String(node?.id ?? ""));
		}
		/** 打开某张表的列清单 */
		async function openErColumns(name) {
			if (!name) return;
			erPickedTable.value = name;
			erColumnsVisible.value = true;
			erPickedColumns.value = [];
			try {
				const cols = await fetchTableColumns(name, currentDatasourceId.value, activeTabObj.value?.database);
				erPickedColumns.value = cols || [];
			} catch (e) {
				message.error(`读取列失败: ${String(e?.message ?? e)}`);
			}
		}
		/** 每张表参与的外键条数（清单上显示，一眼看出「这张表是孤立的」） */
		function erDegree(name) {
			return erRelations.value.filter((r) => r.fromTable === name || r.toTable === name).length;
		}
		/** 点清单里的一行：在图上高亮该节点并居中 */
		function highlightErNode(name) {
			const api = erGraphRef.value;
			api?.highlight?.([name]);
			api?.centerOn?.(name);
		}
		/** 从 ER 图打开该表的数据页签 */
		function openErTableData(tableName) {
			if (!tableName) return;
			erColumnsVisible.value = false;
			openTableData(tableName, activeTabObj.value?.database || activeDatabase.value);
		}
		/**
		* 导出为 Graphviz DOT。
		*
		* <p>不给 PNG 是因为那是**服务端渲染**，而这里只有浏览器 ——
		* 假装能导出图片、点下去给个空文件，比不给这个按钮更糟。
		* DOT 可以直接喂给本地 Graphviz 出图。</p>
		*/
		function exportErDot() {
			const q = (s) => `"${s.replace(/\\/g, "\\\\").replace(/"/g, "\\\"")}"`;
			const lines = [
				"digraph er {",
				"  rankdir=LR;",
				"  node [shape=record, fontsize=10];"
			];
			for (const t of erTables.value) {
				const label = t.comment ? `${t.name}\\n${t.comment}` : t.name;
				lines.push(`  ${q(t.name)} [label="${label}"];`);
			}
			for (const r of erRelations.value) lines.push(`  ${q(r.fromTable)} -> ${q(r.toTable)} [label="${r.fromColumn ?? ""}${r.name ? ` (${r.name})` : ""}"];`);
			lines.push("}");
			downloadText(`${activeTabObj.value?.database || "er"}-${Date.now()}.dot`, lines.join("\n"), "text/plain");
			message.success(`已导出 ${erRelations.value.length} 条关系`);
		}
		/**
		* 页签内显示的 库.表 全名
		* @param tab 当前页签
		*/
		function qualified(tab) {
			return tabTitle(tab.tableName || "", tab.database || "");
		}
		/**
		* 新建 SQL 查询页签
		*/
		function openNewQuery() {
			const id = "query-" + Date.now();
			const tab = {
				id,
				type: "query",
				title: "查询 " + (tabs.value.filter((t) => t.type === "query").length + 1),
				sql: "",
				database: activeDatabase.value
			};
			tabs.value.push(tab);
			activeTab.value = id;
		}
		/**
		* 关闭页签
		* @param id 页签 ID
		*/
		function closeTab(id) {
			const idx = tabs.value.findIndex((t) => t.id === id);
			if (idx >= 0) {
				tabs.value.splice(idx, 1);
				if (activeTab.value === id) {
					const next = tabs.value[Math.min(idx, tabs.value.length - 1)];
					if (next) selectTab(next.id);
					else activeTab.value = "";
				}
			}
		}
		/**
		* 当前表的查询偏好键（`库.表`）。
		*
		* <p>刻意按表分键：A 表的 `status = 1` 套到 B 表上会引用 B 表不存在的列，
		* 直接报错。E2 的列偏好已经踩过同一个坑（全局一份会让「在 A 表隐藏的列
		* 到 B 表也消失」）。</p>
		*/
		function tablePrefKey(tab) {
			const t = tab ?? activeTabObj.value;
			if (!t?.tableName) return "";
			return `${t.database || activeDatabase.value}.${t.tableName}`;
		}
		/**
		* 「正在恢复某张表的偏好」标志。
		*
		* <p>{@link restoreTablePref} 会先把旧条件清空再填新条件，这一帧不该被
		* 兜底落盘的 watch 看到 —— 否则会把**上一张表**的条件写进**这张表**的键，
		* 正好制造出「切表后刷新，A 表的条件跑到 B 表上」的故障。</p>
		*/
		let tabPrefRestoring = false;
		/**
		* 切到某张表时恢复它自己的筛选条件。
		*
		* <p>不恢复的话，用户为宽表配了 5 个条件、刷新一次就得重配一遍 ——
		* 而筛选条件往往是「排查了半小时才凑出来」的。</p>
		*/
		function restoreTablePref(tab) {
			const pref = loadTablePref(tablePrefKey(tab));
			tabPrefRestoring = true;
			try {
				filterWhere.value = pref?.filterWhere ?? "";
				activeFilters.value = (pref?.filters ?? []).map((f) => ({ ...f }));
			} finally {
				tabPrefRestoring = false;
			}
			if (pref && (pref.filterWhere || pref.filters.length > 0)) message.info(`已恢复该表的筛选条件（${pref.filters.length} 个条件）`);
		}
		/** 把当前表的筛选条件存进本地（筛选变更时调用） */
		function persistTablePref() {
			const key = tablePrefKey();
			if (!key) return;
			if (!filterWhere.value && activeFilters.value.length === 0) {
				clearTablePref(key);
				return;
			}
			saveTablePref(key, {
				filterWhere: filterWhere.value,
				filters: activeFilters.value.map((f) => ({ ...f }))
			});
		}
		async function loadTableData(tab, page) {
			if (!tab?.tableName) return;
			const seq = ++tableDataReqSeq.value;
			tableLoading.value = true;
			try {
				const result = await fetchTableData(tab.tableName, page ?? tableData.page ?? 1, tableData.pageSize, sortState.prop || void 0, sortState.order || void 0, currentDatasourceId.value, tab.database, showTotal.value, filterWhere.value || void 0, activeFilters.value.length > 0 ? activeFilters.value : void 0);
				if (seq !== tableDataReqSeq.value || activeTab.value !== tab.id) return;
				Object.assign(tableData, result);
				if (!showTotal.value) tableData.total = -1;
				loadColumnComments(tab);
				loadPkInfo(tab);
			} catch (e) {
				if (seq === tableDataReqSeq.value) message.error(`加载表数据失败: ${String(e?.message ?? e)}`);
			} finally {
				if (seq === tableDataReqSeq.value) tableLoading.value = false;
			}
		}
		/**
		* 加载列注释（表头/行「+注释」显示模式使用）
		* @param tab 当前表页签
		*/
		async function loadColumnComments(tab) {
			if (!tab?.tableName) return;
			try {
				const cols = await fetchTableColumns(tab.tableName, currentDatasourceId.value, tab.database);
				for (const c of cols) if (c.remark) columnComments[c.name] = c.remark;
			} catch {}
		}
		function onPageChange(page) {
			loadTableData(activeTabObj.value, page);
		}
		/** 换每页条数只能从第一页重新开始 */
		function onPageSizeChange(size) {
			tableData.pageSize = size;
			tableData.page = 1;
			loadTableData(activeTabObj.value, 1);
		}
		/**
		* 刷新当前表数据
		*/
		function refreshTableData() {
			const tab = activeTabObj.value;
			if (tab?.tableName) loadTableData(tab);
		}
		/**
		* 静默刷新的写回：保持 rows / columns 两个数组的引用不变。
		*
		* <p>vxe-table 对 data prop 的换引用与长度变化各管一个 watch
		* （vxe-table es table.js 14185-14198），命中即走内部
		* loadTableData —— 期间 reactData.isRowLoading 为 true，
		* 整表 loading 遮罩会亮数帧（3796 置位、3894 经三轮
		* nextTick 才复位）；columns prop 换引用同样会触发列重建
		* （isColLoading）。遮罩一闪正是「静默刷新」要消灭的闪烁，
		* 故同行数时逐行写回字段、列名列表内容不变时保留原数组，
		* 让 prop 引用纹丝不动，vxe 的两个 watch 都不触发。</p>
		*
		* @param cur 当前表数据（被原地写回）
		* @param next 接口返回的新数据
		*/
		function writeBackSilently(cur, next) {
			const rows = cur.rows;
			if (next.rows.length === rows.length) for (let i = 0; i < rows.length; i++) Object.assign(rows[i], next.rows[i]);
			else cur.rows = next.rows;
			if (next.columns.length !== cur.columns.length || next.columns.some((c, i) => c !== cur.columns[i])) cur.columns = next.columns;
			cur.total = next.total;
			cur.page = next.page;
			cur.pageSize = next.pageSize;
		}
		/**
		* 静默刷新当前表数据（单元格编辑保存后用）：与 {@link refreshTableData} 同一条
		* 数据链路，区别是**不打开 tableLoading 遮罩** —— 整页刷新那下闪烁太明显，
		* 用户会以为页面重载了一次。实现上直接调 fetchTableData 并写回 tableData，
		* 不经过 loadTableData（它第一件事就是把 loading 顶成 true）。
		*
		* <p>写回走 {@link writeBackSilently} 原地写回：不换 rows / columns
		* 数组引用，否则 vxe 检测到 prop 换引用会走内部重载、亮起整表
		* loading 遮罩数帧（isRowLoading / isColLoading），那一下闪烁
		* 正是本函数要避免的。</p>
		*
		* <p>列注释 / 类型 / 主键不随单元格保存变化，这里不再
		* loadColumnComments / loadPkInfo —— 它们会重算 tableColumns
		* 换掉 columns prop，同样触发 vxe 列重建遮罩；首次开表时
		* loadTableData 已载好。</p>
		*
		* <p>切表/换页签的竞态照抄 loadTableData 的序号守卫：静默刷新飞在路上时
		* 用户切了表，过期响应直接丢弃。</p>
		*
		* @param tab 当前表页签
		*/
		async function silentRefreshTableData(tab) {
			if (!tab?.tableName) return;
			const seq = ++tableDataReqSeq.value;
			try {
				const result = await fetchTableData(tab.tableName, tableData.page, tableData.pageSize, sortState.prop || void 0, sortState.order || void 0, currentDatasourceId.value, tab.database, showTotal.value, filterWhere.value || void 0, activeFilters.value.length > 0 ? activeFilters.value : void 0);
				if (seq !== tableDataReqSeq.value || activeTab.value !== tab.id) return;
				writeBackSilently(tableData, result);
				if (!showTotal.value) tableData.total = -1;
			} catch {}
		}
		async function loadTableDesign(tab) {
			if (!tab.tableName) return;
			designLoading.value = true;
			try {
				const cols = await fetchTableColumns(tab.tableName, currentDatasourceId.value, tab.database);
				designRows.value = cols.map((c) => {
					const origin = {
						name: c.name,
						type: normalizeColumnType(c.type),
						size: c.size ?? null,
						nullable: c.nullable !== false,
						defaultValue: c.default ?? "",
						comment: c.remark ?? ""
					};
					return {
						originalName: c.name,
						...origin,
						isPrimaryKey: !!c.isPrimaryKey,
						type: c.type || origin.type,
						remark: c.remark ?? "",
						default: c.default ?? "",
						baseType: c.baseType,
						unsigned: c.unsigned === true,
						zerofill: c.zerofill === true,
						autoIncrement: c.autoIncrement === true,
						charset: c.charset ?? "",
						collation: c.collation ?? "",
						enumValues: c.enumValues ?? [],
						scale: c.scale ?? 0,
						origin
					};
				});
			} catch (e) {
				message.error(`加载表结构失败: ${String(e?.message ?? e)}`);
			} finally {
				designLoading.value = false;
			}
		}
		async function executeQuery() {
			const tab = activeTabObj.value;
			if (!tab?.sql) return;
			Object.assign(queryResult, {
				columns: [],
				rows: [],
				rowCount: 0,
				truncated: false,
				affectedRows: void 0,
				message: void 0
			});
			resultSets.value = [];
			activeResultSet.value = 0;
			const started = Date.now();
			try {
				const tx = await ensureTx();
				const result = await executeDbSql(tab.sql, currentDatasourceId.value, queryTargetDatabase(), tx || void 0, execTimeoutMs());
				Object.assign(queryResult, result);
				resultSets.value = [{ ...result }];
				activeResultSet.value = 0;
				pushQueryHistory(tab.sql, describeResult(result));
			} catch (e) {
				const msg = "执行失败: " + String(e?.message ?? e);
				queryResult.message = msg;
				pushQueryHistory(tab.sql, "失败");
			}
			message.info(`耗时 ${Date.now() - started} ms`);
		}
		/**
		* 结果摘要（进查询历史）。
		*
		* @param r 单条结果
		* @returns 一行摘要
		*/
		function describeResult(r) {
			if (r.columns !== void 0) return `${r.rowCount ?? 0} 行`;
			if (r.affectedRows !== void 0) return `影响 ${r.affectedRows} 行`;
			return "失败";
		}
		/** 用户想要事务（工具条开关） */
		const txWanted = ref(false);
		/** 当前未提交事务的 ID，空串表示没有 */
		const txId = ref("");
		/** 事务绑定的库；改目标库后旧的 txId 就不再适用 */
		const txDatabase = ref("");
		/** 正在开启 / 提交 / 回滚 */
		const txBusy = ref(false);
		/** 正在接管孤儿事务（防止并发重复接管） */
		let adoptingTx = false;
		/**
		* 执行前确保事务已开启（若用户开了开关）。
		*
		* <p>懒开启而不是「开关一打开就开后端事务」：开关是意图，
		* 真正开事务的时机是第一次执行 —— 否则用户只是看一眼工具条
		* 就白白占住一条连接。</p>
		*
		* @returns 事务 ID；没开事务时返回空串
		*/
		async function ensureTx() {
			if (!txWanted.value) return "";
			const db = queryTargetDatabase();
			if (txId.value && txDatabase.value === db) return txId.value;
			if (txId.value) {
				try {
					await rollbackDbTx(txId.value);
					message.warning(`目标库已切换，原事务已回滚（改动在 ${txDatabase.value || "默认库"}）`);
				} catch {
					message.warning("目标库已切换，但原事务回滚失败，请刷新页面确认");
				}
				txId.value = "";
			}
			txBusy.value = true;
			try {
				const started = await beginDbTx(currentDatasourceId.value, db);
				txId.value = started.txId;
				txDatabase.value = started.database || db || "";
				message.success(`已开启事务（库：${txDatabase.value || "默认"}），执行后请提交或回滚`);
			} catch (e) {
				message.error(`开启事务失败: ${String(e?.message ?? e)}`);
			} finally {
				txBusy.value = false;
			}
			return txId.value;
		}
		/** 提交当前事务 */
		async function commitTx() {
			if (!txId.value) return;
			txBusy.value = true;
			try {
				await commitDbTx(txId.value);
				message.success("事务已提交");
				txId.value = "";
				txDatabase.value = "";
			} catch (e) {
				message.error(`提交失败: ${String(e?.message ?? e)}`);
			} finally {
				txBusy.value = false;
			}
		}
		/**
		* 回滚当前事务。
		*
		* <p>必须二次确认：回滚不可逆，而用户点它多半是「顺手点一下试试」，
		* 一屏改动的代价不该由误点承担。</p>
		*/
		async function rollbackTx() {
			if (!txId.value) return;
			try {
				await ElMessageBox.confirm("回滚会撤销本事务里的全部未提交改动，且不可恢复。确定回滚？", "回滚事务", {
					type: "warning",
					confirmButtonText: "回滚",
					cancelButtonText: "取消"
				});
			} catch {
				return;
			}
			txBusy.value = true;
			try {
				await rollbackDbTx(txId.value);
				message.success("事务已回滚");
				txId.value = "";
				txDatabase.value = "";
			} catch (e) {
				message.error(`回滚失败: ${String(e?.message ?? e)}`);
			} finally {
				txBusy.value = false;
			}
		}
		/**
		* 关闭页签 / 离开页面时兜底回滚。
		*
		* <p>没有这一步的话，用户开着事务直接关标签页，
		* 后端那条连接会一直挂着直到空闲超时（10 分钟）才被回收 ——
		* 而他根本不知道自己留了东西。</p>
		*/
		async function releaseTxOnUnmount() {
			const tx = txId.value;
			if (!tx) return;
			txId.value = "";
			txDatabase.value = "";
			try {
				await rollbackDbTx(tx);
			} catch {}
		}
		/**
		* 查一次后端有没有孤儿事务并接管。
		*
		* <p>前端状态在刷新后就没了，但后端那条连接还活着 —— 不查就会变成
		* 「用户看不见、也关不掉」的事务，白占一条连接直到空闲超时。</p>
		*
		* <p><b>只按数据源匹配，不按库匹配</b>：页面刷新后当前页签/库都没了，
		* 早先还拿 {@code queryTargetDatabase()} 去比，结果永远是匹配不上 ——
		* 功能看起来存在，实际一次都触发不了。</p>
		*
		* <p>同一数据源有多个未结束事务时只接管一个，并如实告知还剩几个：
		* 一次全接管会让用户面对一个说不清对应哪段操作的事务。
		* 每收掉一个，下次切数据源/刷新会再接管下一个。</p>
		*/
		async function adoptOrphanTx() {
			if (adoptingTx) return;
			adoptingTx = true;
			try {
				const list = await fetchDbTxStatus();
				if (!list || list.length === 0) return;
				const dsId = currentDatasourceId.value;
				const mine = list.find((s) => s.datasourceId === dsId);
				if (!mine) return;
				txId.value = mine.txId;
				txDatabase.value = mine.database || "";
				txWanted.value = true;
				const rest = list.filter((s) => s.datasourceId === dsId).length - 1;
				message.warning(rest > 0 ? `发现上次未结束的事务，已接管（另有 ${rest} 个待处理）` : "发现上次未结束的事务，已接管；请提交或回滚");
			} catch {} finally {
				adoptingTx = false;
			}
		}
		/**
		* 执行脚本：多条语句逐条出结果集。
		*
		* <p>默认「执行」按钮走单条端点、保持既有形状；这个入口是给多语句脚本用的，
		* 走 {@code /db/execute-batch}。两者共用同一套切分与参数替换规则
		* （在后端实现），所以同一条 SQL 在两条路径下行为一致。</p>
		*/
		async function executeScript() {
			const tab = activeTabObj.value;
			if (!tab?.sql?.trim()) return;
			Object.assign(queryResult, {
				columns: [],
				rows: [],
				rowCount: 0,
				truncated: false,
				affectedRows: void 0,
				message: void 0
			});
			resultSets.value = [];
			activeResultSet.value = 0;
			const started = Date.now();
			try {
				const tx = await ensureTx();
				const batch = await executeDbSqlBatch(tab.sql, currentDatasourceId.value, queryTargetDatabase(), void 0, void 0, tx || void 0, execTimeoutMs());
				applyBatchResult(batch);
				pushQueryHistory(tab.sql, describeBatch(batch));
			} catch (e) {
				queryResult.message = "执行失败: " + String(e?.message ?? e);
				pushQueryHistory(tab.sql, "失败");
			}
			message.info(`耗时 ${Date.now() - started} ms`);
		}
		/** 带参数执行脚本（参数弹窗的「执行」） */
		async function executeScriptWithParams() {
			const tab = activeTabObj.value;
			if (!tab?.sql?.trim()) return;
			const params = {};
			for (const n of paramNames.value) params[n] = paramValues[n];
			Object.assign(queryResult, {
				columns: [],
				rows: [],
				rowCount: 0,
				truncated: false,
				affectedRows: void 0,
				message: void 0
			});
			resultSets.value = [];
			activeResultSet.value = 0;
			const started = Date.now();
			try {
				const batch = await executeDbSqlBatch(tab.sql, currentDatasourceId.value, queryTargetDatabase(), params, void 0, void 0, execTimeoutMs());
				applyBatchResult(batch);
				pushQueryHistory(tab.sql, describeBatch(batch));
			} catch (e) {
				queryResult.message = "执行失败: " + String(e?.message ?? e);
				pushQueryHistory(tab.sql, "失败");
			}
			message.info(`耗时 ${Date.now() - started} ms`);
		}
		/**
		* 把批量结果铺到结果区。
		*
		* <p>有失败时**停在第一条失败的结果集上**：用户第一眼要看到的是「错在哪」，
		* 而不是脚本第一段的正常输出。</p>
		*
		* @param batch 批量结果
		*/
		function applyBatchResult(batch) {
			const sets = batch.results || [];
			const failedIndex = batch.failedIndex !== void 0 && batch.failedIndex >= 0 ? batch.failedIndex : -1;
			const all = failedIndex >= 0 && sets.length === failedIndex ? [...sets, { message: batch.message || "该语句执行失败" }] : sets;
			resultSets.value = all;
			const target = failedIndex >= 0 ? Math.min(failedIndex, all.length - 1) : 0;
			activeResultSet.value = Math.max(0, target);
			showResultSet(all[activeResultSet.value]);
			if (all.length === 0) queryResult.message = batch.message || "脚本里没有可执行的语句";
		}
		/** 批量结果摘要（进查询历史） */
		function describeBatch(batch) {
			const n = batch.statementCount ?? batch.results?.length ?? 0;
			if (batch.failedIndex !== void 0 && batch.failedIndex >= 0) return `${n} 条，第 ${batch.failedIndex + 1} 条失败`;
			return `${n} 条全部成功`;
		}
		/**
		* 执行计划（EXPLAIN）。
		*
		* <p>只在**单条**语句上有意义：EXPLAIN 后面跟多条语句时内核会报错，
		* 而报的是语法错误，看不出是「你选了多条」。所以这里先判一下并给明确提示。</p>
		*/
		async function executeExplain() {
			const sql = (activeTabObj.value?.sql ?? "").trim();
			if (!sql) {
				message.info("先写点 SQL 再看执行计划");
				return;
			}
			if (sql.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/--[^\n]*/g, " ").replace(/#[^\n]*/g, " ").trim().includes(";")) {
				message.warning("执行计划只支持单条语句：脚本含多条时，请先只选中要分析的那条");
				return;
			}
			const started = Date.now();
			try {
				const result = await executeDbSql(`EXPLAIN ${sql}`, currentDatasourceId.value, queryTargetDatabase(), void 0, execTimeoutMs());
				Object.assign(queryResult, result);
				resultSets.value = [{ ...result }];
				activeResultSet.value = 0;
				message.success(`执行计划已生成（${Date.now() - started} ms）`);
			} catch (e) {
				message.error(`生成执行计划失败: ${String(e?.message ?? e)}`);
			}
		}
		/** 下载当前编辑器内容为 .sql（UTF-8 无 BOM：BOM 会让部分客户端报语法错） */
		function saveSqlFile() {
			const sql = activeTabObj.value?.sql ?? "";
			if (!sql.trim()) {
				message.info("编辑器是空的，没什么可保存");
				return;
			}
			const db = queryTargetDatabase() || "sql";
			const stamp = (/* @__PURE__ */ new Date()).toISOString().replace(/[-:T]/g, "").slice(0, 14);
			const bytes = new TextEncoder().encode(sql);
			const url = URL.createObjectURL(new Blob([bytes], { type: "application/sql;charset=utf-8" }));
			const a = document.createElement("a");
			a.href = url;
			a.download = `${db}_${stamp}.sql`;
			a.click();
			URL.revokeObjectURL(url);
			message.success("已保存为 .sql 文件");
		}
		/** 触发隐藏的 file input */
		function openSqlFile() {
			sqlFileInputRef.value?.click();
		}
		/**
		* 读取用户选中的 .sql 并灌进编辑器。
		*
		* @param e input 的 change 事件
		*/
		async function onSqlFilePicked(e) {
			const input = e.target;
			const file = input.files?.[0];
			input.value = "";
			if (!file) return;
			const tab = activeTabObj.value;
			if (!tab) return;
			try {
				tab.sql = await file.text();
				message.success(`已打开 ${file.name}`);
			} catch (e) {
				message.error(`读取文件失败: ${String(e?.message ?? e)}`);
			}
		}
		/**
		* 格式化当前 SQL
		*/
		function formatSql() {
			if (activeTabObj.value?.sql) activeTabObj.value.sql = activeTabObj.value.sql.replace(/\s+/g, " ").replace(/\b(SELECT|FROM|WHERE|AND|OR|ORDER BY|GROUP BY|LIMIT|INSERT INTO|VALUES|UPDATE|SET|DELETE FROM|CREATE TABLE|ALTER TABLE|DROP TABLE)\b/gi, "\n$1");
		}
		/**
		* 表 / 视图节点右键。
		*
		* <p>视图节点与表节点共用这一个菜单，但两者能做的操作并不相同：视图不能
		* RENAME、不能 TRUNCATE、不能 INSERT 进去，也不能被 DROP TABLE 删掉 ——
		* 这些操作打在视图上只会被内核拒绝（「'x' is a view」之类），用户只会看到一个
		* 必然失败的菜单项。所以这里记下 isView，由菜单决定露出哪几项。</p>
		*
		* @param e 右键事件
		* @param tableName 对象名
		* @param database 库名
		* @param isView 是否为视图节点
		*/
		function onTableContextMenu(e, tableName, database, isView = false) {
			e.stopPropagation();
			contextMenu.visible = true;
			contextMenu.x = e.clientX;
			contextMenu.y = e.clientY;
			contextMenu.tableName = tableName;
			contextMenu.database = database;
			contextMenu.tabId = "";
			contextMenu.isView = isView;
			activeDatabase.value = database;
			clampContextMenuPosition();
		}
		/**
		* 数据库节点右键：只带库名，菜单里给库级动作
		* @param e 右键事件
		* @param database 库名
		*/
		function onDatabaseContextMenu(e, database) {
			e.stopPropagation();
			contextMenu.visible = true;
			contextMenu.x = e.clientX;
			contextMenu.y = e.clientY;
			contextMenu.tableName = "";
			contextMenu.database = database;
			contextMenu.tabId = "";
			contextMenu.isView = false;
			activeDatabase.value = database;
			clampContextMenuPosition();
		}
		function onSidebarContextMenu(e) {
			contextMenu.visible = true;
			contextMenu.x = e.clientX;
			contextMenu.y = e.clientY;
			contextMenu.tableName = "";
			contextMenu.database = "";
			contextMenu.tabId = "";
			contextMenu.isView = false;
			clampContextMenuPosition();
		}
		/**
		* 页签右键（第九批 item 7：顶部页签支持右键关闭）
		* @param e 右键事件
		* @param tabId 目标页签 ID
		*/
		function onTabContextMenu(e, tabId) {
			e.stopPropagation();
			contextMenu.visible = true;
			contextMenu.x = e.clientX;
			contextMenu.y = e.clientY;
			contextMenu.tableName = "";
			contextMenu.database = "";
			contextMenu.tabId = tabId;
			contextMenu.isView = false;
			clampContextMenuPosition();
		}
		/**
		* 关闭除指定页签外的全部页签，并把激活页签切到留下的那一个。
		* @param tabId 要保留的页签 ID
		*/
		function closeOtherTabs(tabId) {
			const keep = tabs.value.find((t) => t.id === tabId);
			tabs.value = tabs.value.filter((t) => t.id === tabId);
			if (keep) selectTab(keep.id);
			else activeTab.value = "";
		}
		/** 关闭全部页签（与逐个点 × 的终态一致：内容区回到空态） */
		function closeAllTabs() {
			tabs.value = [];
			activeTab.value = "";
		}
		function closeContextMenu() {
			contextMenu.visible = false;
		}
		/** 右键菜单估算高度（项高 32 + 上下内边距 + 按节点类型的分割线） */
		function menuEstimatedHeight() {
			const count = contextMenu.tableName ? contextMenu.isView ? 10 : 12 : contextMenu.database ? 8 : contextMenu.tabId ? 3 : 5;
			const dividers = contextMenu.tableName ? 3 : contextMenu.database ? 2 : 1;
			return count * 32 + dividers * 11 + 10;
		}
		/**
		* 菜单打开后用真实渲染尺寸二次夹取视口。
		* menuEstimatedHeight 的项数靠手维护，后续新增菜单项漏改就会低估 → 底部溢出。
		* 估算只影响首帧，这里在 nextTick 后按 getBoundingClientRect 校正 x/y，一劳永逸
		*/
		async function clampContextMenuPosition() {
			await nextTick();
			const el = document.querySelector(".dbm-context-menu");
			if (!el) return;
			const rect = el.getBoundingClientRect();
			const x = Math.min(Math.max(8, contextMenu.x), Math.max(8, window.innerWidth - rect.width - 8));
			const y = Math.min(Math.max(8, contextMenu.y), Math.max(8, window.innerHeight - rect.height - 8));
			if (x !== contextMenu.x) contextMenu.x = x;
			if (y !== contextMenu.y) contextMenu.y = y;
		}
		/**
		* 右键菜单位置（贴近光标，临近视口边缘时翻转，避免溢出屏外点不到）
		*/
		const contextMenuStyle = computed(() => {
			const width = 200;
			const height = menuEstimatedHeight();
			const maxX = Math.max(8, window.innerWidth - width - 8);
			const maxY = Math.max(8, window.innerHeight - height - 8);
			return {
				left: Math.min(Math.max(8, contextMenu.x), maxX) + "px",
				top: Math.min(Math.max(8, contextMenu.y), maxY) + "px"
			};
		});
		/** 打开新建表弹窗：只定目标库，表单与建表都在共享组件里 */
		function openCreateTable(database) {
			newTableDatabase.value = database || activeDatabase.value;
			if (!newTableDatabase.value) {
				message.warning("请先在左侧选择一个数据库");
				return;
			}
			createTableVisible.value = true;
		}
		/**
		* 删除视图。
		*
		* <p>与 {@link deleteTable} 分开：视图必须走 `DROP VIEW`，拿 `DROP TABLE` 去删
		* 会被内核拒绝成 `'x' is a view`（这正是原先视图删不掉的根因）。</p>
		*
		* @param viewName 视图名
		* @param database 库名
		*/
		async function deleteView(viewName, database) {
			const db = database || contextMenu.database || activeDatabase.value;
			try {
				await ElMessageBox.confirm(`确定要删除视图 ${db ? db + "." : ""}${viewName} 吗？此操作不可恢复！`, "删除确认", { type: "warning" });
			} catch {
				return;
			}
			try {
				await dropDbView(viewName, currentDatasourceId.value, db);
				message.success(`视图 ${viewName} 已删除`);
				if (db) await loadTables(db);
				else await refreshTree();
				tabs.value = tabs.value.filter((t) => !(t.tableName === viewName && (t.database || "") === (db || "")));
				if (!tabs.value.some((t) => t.id === activeTab.value)) activeTab.value = tabs.value[0]?.id || "";
			} catch (e) {
				message.error(`删除视图失败: ${String(e?.message ?? e)}`);
			}
		}
		async function deleteTable(tableName, database) {
			const db = database || contextMenu.database || activeDatabase.value;
			try {
				await ElMessageBox.confirm(`确定要删除表 ${db ? db + "." : ""}${tableName} 吗？此操作不可恢复！`, "删除确认", { type: "warning" });
			} catch {
				return;
			}
			try {
				await dropDbTable(tableName, currentDatasourceId.value, db);
				message.success(`表 ${tableName} 已删除`);
				if (db) await loadTables(db);
				else await refreshTree();
				tabs.value = tabs.value.filter((t) => !(t.tableName === tableName && (t.database || "") === (db || "")));
				if (!tabs.value.some((t) => t.id === activeTab.value)) activeTab.value = tabs.value[0]?.id || "";
			} catch (e) {
				message.error(`删除表失败: ${String(e?.message ?? e)}`);
			}
		}
		/**
		* 删除数据库：连带清掉该库的缓存表列表与页签
		* @param database 库名
		*/
		async function deleteDatabase(database) {
			try {
				await ElMessageBox.confirm(`确定要删除数据库 ${database} 吗？该库下的所有表都会被删除，此操作不可恢复！`, "删除确认", { type: "warning" });
			} catch {
				return;
			}
			try {
				await dropDbDatabase(database, currentDatasourceId.value);
				message.success(`数据库 ${database} 已删除`);
				delete tablesByDb[database];
				tabs.value = tabs.value.filter((t) => (t.database || "") !== database);
				if (!tabs.value.some((t) => t.id === activeTab.value)) activeTab.value = tabs.value[0]?.id || "";
				if (activeDatabase.value === database) {
					activeDatabase.value = "";
					activeTable.value = "";
				}
				await loadTree();
			} catch (e) {
				message.error(`删除数据库失败: ${String(e?.message ?? e)}`);
			}
		}
		/** 总数开关：切换后按新模式重载当前表 */
		watch(showTotal, (value) => {
			saveViewPref({ showTotal: value });
			const tab = activeTabObj.value;
			if (tab?.type === "table") {
				tableData.page = 1;
				loadTableData(tab, 1);
			}
		});
		/**
		* 视图偏好落盘（F5）。
		*
		* <p>表头/行模式、页大小、ER 图设置都是「刷新后应该还在」的东西。
		* 用一个 watcher 统一落，而不是在每个 setter 里各写一遍 ——
		* 各写一遍的必然结果是漏掉某个（早先 `dbm-show-total` 就是单独写的）。</p>
		*/
		watch([
			headerMode,
			rowMode,
			erLayout,
			erShowLabels,
			erTableFilter
		], () => {
			saveViewPref({
				headerMode: headerMode.value,
				rowMode: rowMode.value,
				erLayout: erLayout.value,
				erShowLabels: erShowLabels.value,
				erTableFilter: erTableFilter.value
			});
		}, { deep: true });
		/** 每页行数变化：落盘并回到第一页（否则第 N 页可能超出新页大小的范围） */
		watch(() => tableData.pageSize, (value) => {
			saveViewPref({ pageSize: value });
		});
		/**
		* 筛选条件变化的**兜底**落盘。
		*
		* <p>不靠「记得在每个改动点调用 persistTablePref()」——
		* F5 第一版就是这么写的，结果漏了高级筛选弹窗那条路径
		* （它不走 {@code applyFilter}），表现为「WHERE 能记住、高级筛选记不住」。
		* 两条路径、两个入口，靠人记必然漏。watch 挂在数据上就没有漏的可能。</p>
		*
		* <p>{@code restoreTablePref} 恢复时会触发它，那正是我们要的
		* （恢复后的条件同样该落盘，保证下次刷新还在）。</p>
		*/
		watch([filterWhere, activeFilters], () => {
			if (tabPrefRestoring) return;
			persistTablePref();
		}, { deep: true });
		/**
		* 恢复默认设置：视图偏好 + 各表筛选条件 + 列显示偏好全清。
		*
		* <p>必须有这个出口：偏好存在浏览器里，用户能改就一定能清。
		* 只让用户去清浏览器数据的话，一旦偏好写坏了（别的代码写坏、手改、
		* 旧版本结构变更）就**没有任何界面上的恢复路径**。</p>
		*/
		async function resetViewSettings() {
			try {
				await ElMessageBox.confirm("将清空本机保存的视图偏好（表头/行模式、每页行数、ER 图设置）与所有表的筛选条件。列显示偏好也会一并恢复默认。继续？", "恢复默认设置", {
					type: "warning",
					confirmButtonText: "恢复默认",
					cancelButtonText: "取消"
				});
			} catch {
				return;
			}
			resetAllPrefs();
			columnPrefs.value = {};
			headerMode.value = "name";
			rowMode.value = "data";
			showTotal.value = true;
			tableData.pageSize = 50;
			erLayout.value = "dagre";
			erShowLabels.value = true;
			erTableFilter.value = "";
			filterWhere.value = "";
			activeFilters.value = [];
			const tab = activeTabObj.value;
			if (tab?.type === "table") {
				tableData.page = 1;
				loadTableData(tab, 1);
			} else if (tab?.type === "er") loadErDiagram();
			message.success("已恢复默认设置");
		}
		/** SQL 编辑器补全字段缓存（库.表 → 字段名） */
		const sqlColumnCache = /* @__PURE__ */ new Map();
		/**
		* SQL 编辑器补全：解析指定表字段（带缓存）
		* @param table 表名
		*/
		async function resolveColumnsForTable(table) {
			const key = (activeDatabase.value + "." + table).toLowerCase();
			const cached = sqlColumnCache.get(key);
			if (cached) return cached;
			try {
				const names = (await fetchTableColumns(table, currentDatasourceId.value, activeDatabase.value)).map((c) => c.name);
				sqlColumnCache.set(key, names);
				return names;
			} catch {
				return [];
			}
		}
		/** 建表语句弹窗 */
		const ddlVisible = ref(false);
		const ddlText = ref("");
		/**
		* 归一化 ElMessageBox.prompt 的返回值。
		*
		* <p>Element Plus 不同版本 prompt 的 resolve 结果可能是字符串，也可能是
		* {@code { value, action }}；统一取出并 trim，避免 {@code .trim is not a function}。</p>
		*
		* @param res prompt 结果
		*/
		function promptValue(res) {
			const raw = typeof res === "string" ? res : res?.value;
			return raw == null ? "" : String(raw).trim();
		}
		/**
		* 复制文本到剪贴板。
		*
		* <p><b>必须有 execCommand 兜底</b>：{@code navigator.clipboard} 只在**安全上下文**
		* （HTTPS 或 localhost）存在。本控制台在生产里是通过局域网 IP 的**明文 HTTP**
		* 访问的（如 {@code http://192.168.50.101:8848}），此时 {@code navigator.clipboard}
		* 是 {@code undefined}，直接调用会抛 TypeError —— 表现为「复制表名 / 复制库名 /
		* 复制建表语句」永远提示「复制失败」，而浏览器控制台里什么异常都看不到。</p>
		*
		* @param text 文本
		*/
		async function copyText(text) {
			if (navigator.clipboard?.writeText) try {
				await navigator.clipboard.writeText(text);
				message.success("已复制");
				return;
			} catch {}
			if (legacyCopy(text)) {
				message.success("已复制");
				return;
			}
			message.warning("复制失败，请手动选中文本复制");
		}
		/**
		* 非安全上下文的复制兜底：用离屏 textarea + execCommand('copy')。
		*
		* <p>该命令虽然已废弃，但在明文 HTTP 下是唯一可行的路径，且各浏览器都还支持。
		* textarea 必须 {@code readonly} 且固定定位在视口内，否则移动端与
		* iOS Safari 会拒绝复制；复制完立刻移除，别留在 DOM 里。</p>
		*
		* @param text 文本
		* @returns 是否复制成功
		*/
		function legacyCopy(text) {
			const area = document.createElement("textarea");
			area.value = text;
			area.setAttribute("readonly", "true");
			area.style.position = "fixed";
			area.style.top = "0";
			area.style.left = "0";
			area.style.width = "1px";
			area.style.height = "1px";
			area.style.padding = "0";
			area.style.border = "none";
			area.style.outline = "none";
			area.style.boxShadow = "none";
			area.style.background = "transparent";
			area.style.opacity = "0";
			document.body.appendChild(area);
			try {
				area.select();
				area.setSelectionRange(0, area.value.length);
				return document.execCommand("copy");
			} catch {
				return false;
			} finally {
				document.body.removeChild(area);
			}
		}
		/**
		* 以指定 SQL 打开新查询页签
		* @param sql      初始 SQL
		* @param database 目标库
		*/
		function openQueryWithSql(sql, database) {
			const id = "query-" + Date.now();
			const tab = {
				id,
				type: "query",
				title: "查询 " + (tabs.value.filter((t) => t.type === "query").length + 1),
				sql,
				database: database || activeDatabase.value
			};
			tabs.value.push(tab);
			activeTab.value = id;
		}
		/**
		* 重命名表（ALTER TABLE ... RENAME TO）
		* @param tableName 表名
		* @param database  所属库
		*/
		async function renameTable(tableName, database) {
			const db = database || activeDatabase.value;
			let input = "";
			try {
				input = await ElMessageBox.prompt(`将表 ${tableName} 重命名为：`, "重命名表", {
					inputValue: tableName,
					confirmButtonText: "确定",
					cancelButtonText: "取消"
				});
			} catch {
				return;
			}
			const name = promptValue(input);
			if (!name || name === tableName) return;
			try {
				await renameDbTable(tableName, name, currentDatasourceId.value, db);
				message.success(`表已重命名为 ${name}`);
				tabs.value = tabs.value.filter((t) => !(t.tableName === tableName && (t.database || "") === (db || "")));
				if (!tabs.value.some((t) => t.id === activeTab.value)) activeTab.value = tabs.value[0]?.id || "";
				await loadTables(db);
			} catch (e) {
				message.error(`重命名失败: ${String(e?.message ?? e)}`);
			}
		}
		/**
		* 复制表（CREATE TABLE ... LIKE）
		* @param tableName 源表
		* @param database  所属库
		*/
		async function duplicateTable(tableName, database) {
			const db = database || activeDatabase.value;
			let input = "";
			try {
				input = await ElMessageBox.prompt(`复制表 ${tableName} 为：`, "复制表", {
					inputValue: `${tableName}_copy`,
					confirmButtonText: "确定",
					cancelButtonText: "取消"
				});
			} catch {
				return;
			}
			const name = promptValue(input);
			if (!name || name === tableName) return;
			const candidates = [
				`CREATE TABLE \`${name}\` LIKE \`${tableName}\``,
				`CREATE TABLE "${name}" AS SELECT * FROM "${tableName}" WHERE 1=0`,
				`SELECT TOP 0 * INTO ${name} FROM ${tableName}`
			];
			let lastError = null;
			for (const statement of candidates) try {
				await executeDbSql(statement, currentDatasourceId.value, db);
				lastError = null;
				break;
			} catch (e) {
				lastError = e;
			}
			if (lastError) {
				message.error(`复制表失败: ${String(lastError?.message ?? lastError)}`);
				return;
			}
			message.success(`已复制为 ${name}`);
			await loadTables(db);
		}
		/**
		* 查看建表语句（SHOW CREATE TABLE，失败时按列结构兜底拼 DDL）
		* @param tableName 表名
		* @param database  所属库
		*/
		async function showTableDdl(tableName, database) {
			const db = database || activeDatabase.value;
			try {
				ddlText.value = await fetchTableDdl(tableName, currentDatasourceId.value, db);
			} catch (e) {
				message.error(`获取建表语句失败: ${String(e?.message ?? e)}`);
				return;
			}
			ddlVisible.value = true;
		}
		/**
		* 查询结果的导出格式。
		*
		* <p>初值空串（显示 placeholder），而不是 {@code "csv"}：下拉选中项会直接导出，
		* 若初值就是 {@code "csv"}，用户选「导出 CSV」属于**同值**，
		* el-select 的 {@code change} 不会触发，表现为「点了没反应」。</p>
		*/
		const queryExportFormat = ref("");
		/**
		* 选中某个导出格式就立刻导出。
		*
		* <p>同样不能用 {@code @change}：{@code ReSelect} 不发该事件。</p>
		*/
		watch(queryExportFormat, (format) => {
			if (format) exportQueryCsv(format);
		});
		/** 查询结果变化时复位，让下一次选择一定触发 */
		watch(() => queryResult.columns, () => {
			queryExportFormat.value = "";
		});
		/**
		* 导出查询结果（客户端生成，结果集已在内存，无需回后端）。
		*
		* @param format 目标格式；SQL 格式对查询结果无意义，故不提供
		*/
		function exportQueryCsv(format = "csv") {
			const cols = queryResult.columns ?? [];
			const rows = queryResult.rows ?? [];
			if (!cols.length) {
				message.warning("没有可导出的查询结果");
				return;
			}
			const cell = (v) => {
				if (v === null || v === void 0) return "";
				if (v instanceof Date) return v.toISOString();
				if (typeof v === "object") return JSON.stringify(v);
				return String(v);
			};
			let content;
			if (format === "json") content = JSON.stringify(rows.map((row) => Object.fromEntries(cols.map((c) => [c, row[c] ?? null]))), null, 2);
			else if (format === "xml") {
				const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
				content = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<rows>\n" + rows.map((row) => `  <row>\n${cols.map((c) => `    <${c}>${esc(cell(row[c]))}</${c}>\n`).join("")}  </row>\n`).join("") + "</rows>\n";
			} else {
				const sep = format === "tsv" ? "	" : ",";
				const quote = (v) => format === "csv" && (v.includes(",") || v.includes("\"") || v.includes("\n") || v.trim() !== v) ? `"${v.replace(/"/g, "\"\"")}"` : v;
				content = [cols.join(sep)].concat(rows.map((row) => cols.map((c) => quote(cell(row[c]))).join(sep))).join("\n");
			}
			downloadText(`query-result-${Date.now()}.${format}`, content, EXPORT_MIME[format] ?? "text/plain");
			message.success(`已导出 ${rows.length} 行`);
			queryExportFormat.value = "";
		}
		onMounted(() => {
			document.addEventListener("click", closeContextMenu);
			adoptOrphanTx();
		});
		watch(currentDatasourceId, () => {
			if (!txId.value) adoptOrphanTx();
		});
		onBeforeUnmount(() => {
			document.removeEventListener("click", closeContextMenu);
			releaseTxOnUnmount();
		});
		return (_ctx, _cache) => {
			const _directive_loading = resolveDirective("loading");
			return openBlock(), createElementBlock(Fragment, null, [
				createBaseVNode("div", { class: normalizeClass(["dbm", { "is-embedded": unref(embedded) }]) }, [
					createBaseVNode("div", _hoisted_1, [activeTabObj.value && activeTabObj.value.type === "table" ? (openBlock(), createElementBlock("div", _hoisted_2, [
						createBaseVNode("span", _hoisted_3, toDisplayString(qualified(activeTabObj.value)), 1),
						createBaseVNode("div", _hoisted_4, [(openBlock(), createElementBlock(Fragment, null, renderList(HEADER_MODES, (m) => {
							return createBaseVNode("span", {
								key: m.value,
								class: normalizeClass(["dbm-subtab", { active: headerMode.value === m.value }]),
								onClick: ($event) => headerMode.value = m.value
							}, toDisplayString(m.label), 11, _hoisted_5);
						}), 64))]),
						createBaseVNode("div", _hoisted_6, [(openBlock(), createElementBlock(Fragment, null, renderList(ROW_MODES, (m) => {
							return createBaseVNode("span", {
								key: m.value,
								class: normalizeClass(["dbm-subtab", { active: rowMode.value === m.value }]),
								onClick: ($event) => rowMode.value = m.value
							}, toDisplayString(m.label), 11, _hoisted_7);
						}), 64))]),
						_cache[149] || (_cache[149] = createBaseVNode("span", { class: "dbm-spacer" }, null, -1)),
						createVNode(unref(ReButton_default), {
							layout: "square",
							type: "primary",
							icon: "Plus",
							tip: "新增行",
							onClick: openAddRowDialog
						}),
						createVNode(unref(ReButton_default), {
							layout: "square",
							icon: "Download",
							tip: "导出数据",
							onClick: _cache[0] || (_cache[0] = ($event) => openExportDialog(activeTabObj.value.tableName, activeTabObj.value.database))
						}),
						createVNode(unref(ReButton_default), {
							layout: "square",
							icon: "Refresh",
							tip: "刷新数据",
							onClick: refreshTableData
						}),
						createVNode(unref(ReButton_default), {
							layout: "square",
							type: "danger",
							plain: "",
							icon: "Delete",
							tip: "清空表",
							onClick: _cache[1] || (_cache[1] = ($event) => confirmTruncate(activeTabObj.value.tableName, activeTabObj.value.database))
						})
					])) : (openBlock(), createElementBlock("div", _hoisted_8, [..._cache[150] || (_cache[150] = [createBaseVNode("span", { class: "dbm-toolbar-hint" }, "右键表 / 库 / 空白处可执行新建、导入导出等操作", -1)])])), createBaseVNode("div", _hoisted_9, [
						createVNode(unref(ReButton_default), {
							layout: "square",
							icon: "Refresh",
							tip: "刷新连接树",
							"data-testid": "dsm-btn-refresh",
							onClick: refreshTree
						}),
						activeTabObj.value && activeTabObj.value.type === "table" ? (openBlock(), createElementBlock("div", _hoisted_10, [showTotal.value ? (openBlock(), createBlock(unref(RePagination_default), {
							key: 0,
							"current-page": tableData.page,
							"onUpdate:currentPage": _cache[2] || (_cache[2] = ($event) => tableData.page = $event),
							total: tableData.total,
							"page-size": tableData.pageSize,
							"page-sizes": [
								20,
								50,
								100,
								200,
								500
							],
							"pagination-layout": "total, sizes, prev, pager, next",
							onCurrentChange: onPageChange,
							"onUpdate:pageSize": onPageSizeChange
						}, null, 8, [
							"current-page",
							"total",
							"page-size"
						])) : (openBlock(), createElementBlock("span", _hoisted_11, [
							createVNode(unref(ReButton_default), {
								layout: "square",
								icon: "ArrowLeft",
								tip: "上一页",
								disabled: tableData.page <= 1,
								onClick: _cache[3] || (_cache[3] = ($event) => onPageChange(tableData.page - 1))
							}, null, 8, ["disabled"]),
							createBaseVNode("span", _hoisted_12, "第 " + toDisplayString(tableData.page) + " 页（未统计总数）", 1),
							createVNode(unref(ReButton_default), {
								layout: "square",
								icon: "ArrowRight",
								tip: "下一页",
								disabled: (tableData.rows?.length ?? 0) < tableData.pageSize,
								onClick: _cache[4] || (_cache[4] = ($event) => onPageChange(tableData.page + 1))
							}, null, 8, ["disabled"])
						]))])) : createCommentVNode("", true),
						activeTabObj.value && activeTabObj.value.type === "table" ? (openBlock(), createElementBlock(Fragment, { key: 1 }, [
							createBaseVNode("label", _hoisted_13, [createVNode(ConsoleSwitch_default, {
								modelValue: showTotal.value,
								"onUpdate:modelValue": _cache[5] || (_cache[5] = ($event) => showTotal.value = $event),
								"aria-label": "统计总数"
							}, null, 8, ["modelValue"]), _cache[151] || (_cache[151] = createBaseVNode("span", null, "统计总数", -1))]),
							createVNode(unref(ReButton_default), {
								layout: "square",
								icon: "Operation",
								tip: "列显示设置（显示 / 固定列）",
								onClick: openColumnViewDialog
							}),
							createVNode(unref(ReButton_default), {
								layout: "square",
								icon: "RefreshLeft",
								tip: "恢复默认设置（视图偏好与各表筛选条件）",
								onClick: resetViewSettings
							})
						], 64)) : createCommentVNode("", true),
						!unref(embedded) ? (openBlock(), createBlock(unref(DatasourceSelect_default), {
							key: 2,
							class: "dbm-ds-select",
							placeholder: "选择数据源",
							"model-value": String(currentDatasourceId.value),
							options: datasourceOptions.value,
							"onUpdate:modelValue": onDatasourcePick
						}, null, 8, ["model-value", "options"])) : (openBlock(), createElementBlock("span", _hoisted_14, [createVNode(unref(component$1), {
							name: "Coin",
							size: 13
						}), createTextVNode(" " + toDisplayString(currentDatasourceName.value), 1)]))
					])]),
					createBaseVNode("div", _hoisted_15, [createBaseVNode("div", {
						class: "dbm-sidebar",
						onContextmenu: withModifiers(onSidebarContextMenu, ["prevent"])
					}, [createBaseVNode("div", {
						class: "dbm-tree",
						onContextmenu: withModifiers(onSidebarContextMenu, ["prevent"])
					}, [createBaseVNode("div", {
						class: "dbm-tree-node dbm-tree-root",
						onClick: _cache[6] || (_cache[6] = ($event) => toggleNode("root"))
					}, [
						createVNode(unref(component$1), {
							name: expandedNodes.value.has("root") ? "ArrowDown" : "ArrowRight",
							size: 12,
							class: "dbm-arrow"
						}, null, 8, ["name"]),
						createVNode(unref(component$1), {
							name: "Connection",
							size: 15,
							class: "dbm-tree-icon dbm-root-icon"
						}),
						createBaseVNode("span", _hoisted_16, toDisplayString(currentDatasourceName.value), 1)
					]), expandedNodes.value.has("root") ? (openBlock(true), createElementBlock(Fragment, { key: 0 }, renderList(databases.value, (db) => {
						return openBlock(), createElementBlock("div", { key: db }, [createBaseVNode("div", {
							class: normalizeClass(["dbm-tree-node", { active: activeDatabase.value === db && !activeTable.value }]),
							onClick: ($event) => toggleNode("db:" + db),
							onContextmenu: withModifiers(($event) => onDatabaseContextMenu($event, db), ["prevent"])
						}, [
							createVNode(unref(component$1), {
								name: expandedNodes.value.has("db:" + db) ? "ArrowDown" : "ArrowRight",
								size: 12,
								class: "dbm-arrow"
							}, null, 8, ["name"]),
							createVNode(unref(component$1), {
								name: "Coin",
								size: 15,
								class: "dbm-tree-icon dbm-db-icon"
							}),
							createBaseVNode("span", _hoisted_18, toDisplayString(dbLabel(db)), 1)
						], 42, _hoisted_17), expandedNodes.value.has("db:" + db) ? (openBlock(), createElementBlock("div", _hoisted_19, [
							(openBlock(true), createElementBlock(Fragment, null, renderList(tablesOf(db), (table) => {
								return openBlock(), createElementBlock(Fragment, { key: db + ".T." + table.name }, [createBaseVNode("div", {
									class: normalizeClass(["dbm-tree-node dbm-table-node", { active: activeTable.value === table.name && activeDatabase.value === db }]),
									onClick: ($event) => selectTable(table.name, db),
									onContextmenu: withModifiers(($event) => onTableContextMenu($event, table.name, db), ["prevent"])
								}, [
									createVNode(unref(component$1), {
										name: expandedTables.value.has(db + "." + table.name) ? "ArrowDown" : "ArrowRight",
										size: 12,
										class: "dbm-arrow",
										onClick: withModifiers(($event) => toggleTable(table.name, db), ["stop"])
									}, null, 8, ["name", "onClick"]),
									createVNode(unref(component$1), {
										name: "Grid",
										size: 14,
										class: "dbm-tree-icon dbm-table-icon"
									}),
									createBaseVNode("span", {
										class: "dbm-tree-label",
										title: table.remark || table.name
									}, toDisplayString(table.name), 9, _hoisted_21),
									table.remark ? (openBlock(), createElementBlock("span", _hoisted_22, toDisplayString(table.remark), 1)) : createCommentVNode("", true)
								], 42, _hoisted_20), expandedTables.value.has(db + "." + table.name) ? (openBlock(), createElementBlock("div", _hoisted_23, [(openBlock(true), createElementBlock(Fragment, null, renderList(columnsOf(db, table.name), (col) => {
									return openBlock(), createElementBlock("div", {
										key: col.name,
										class: "dbm-tree-node dbm-column-node"
									}, [
										createVNode(unref(component$1), {
											name: col.isPrimaryKey ? "Key" : "Document",
											size: 13,
											class: normalizeClass(["dbm-tree-icon", col.isPrimaryKey ? "dbm-pk-icon" : "dbm-col-icon"])
										}, null, 8, ["name", "class"]),
										createBaseVNode("span", {
											class: "dbm-tree-label",
											title: col.remark || col.name
										}, toDisplayString(col.name), 9, _hoisted_24),
										createBaseVNode("span", _hoisted_25, toDisplayString(col.type), 1)
									]);
								}), 128))])) : createCommentVNode("", true)], 64);
							}), 128)),
							(openBlock(true), createElementBlock(Fragment, null, renderList(unref(DB_OBJECT_CATEGORIES), (cat) => {
								return openBlock(), createElementBlock(Fragment, { key: "cat:" + db + "." + cat.value }, [createBaseVNode("div", {
									class: normalizeClass(["dbm-tree-node dbm-tree-children", { active: expandedObjects.value.has("obj:" + db + ":" + cat.value) }]),
									onClick: ($event) => toggleObjectNode(db, cat.value)
								}, [
									createVNode(unref(component$1), {
										name: objectNodeExpanded(db, cat.value) ? "ArrowDown" : "ArrowRight",
										size: 12,
										class: "dbm-arrow"
									}, null, 8, ["name"]),
									createVNode(unref(component$1), {
										name: cat.icon,
										size: 14,
										class: "dbm-tree-icon dbm-col-icon"
									}, null, 8, ["name"]),
									createBaseVNode("span", _hoisted_27, toDisplayString(cat.label), 1),
									createBaseVNode("span", _hoisted_28, toDisplayString(objectCountOf(db, cat.value)), 1),
									createVNode(unref(component$1), {
										name: "Plus",
										size: 12,
										class: "dbm-tree-add",
										title: "新建",
										onClick: withModifiers(($event) => openObjectDefinition(cat.value, "", db), ["stop"])
									}, null, 8, ["onClick"])
								], 10, _hoisted_26), objectNodeExpanded(db, cat.value) ? (openBlock(), createElementBlock("div", _hoisted_29, [objectErrorOf(db, cat.value) ? (openBlock(), createElementBlock("div", _hoisted_30, toDisplayString(objectErrorOf(db, cat.value)), 1)) : !objectsOf(db, cat.value).length ? (openBlock(), createBlock(unref(ReEmpty_default), {
									key: 1,
									description: "无对象",
									"image-size": 24
								})) : createCommentVNode("", true), (openBlock(true), createElementBlock(Fragment, null, renderList(objectsOf(db, cat.value), (obj) => {
									return openBlock(), createElementBlock("div", {
										key: "obj:" + db + ":" + cat.value + ":" + obj.name,
										class: "dbm-tree-node dbm-table-node",
										onClick: ($event) => openObjectDefinition(cat.value, obj.name, db)
									}, [
										_cache[152] || (_cache[152] = createBaseVNode("span", { class: "dbm-arrow" }, null, -1)),
										createVNode(unref(component$1), {
											name: cat.icon,
											size: 13,
											class: "dbm-tree-icon dbm-col-icon"
										}, null, 8, ["name"]),
										createBaseVNode("span", {
											class: "dbm-tree-label",
											title: obj.definer ? `DEFINER=${obj.definer}` : obj.name
										}, toDisplayString(obj.name), 9, _hoisted_32),
										cat.value === "trigger" ? (openBlock(), createElementBlock("span", _hoisted_33, toDisplayString(obj.timing) + "·" + toDisplayString(obj.event), 1)) : cat.value === "event" && obj.status ? (openBlock(), createElementBlock("span", _hoisted_34, toDisplayString(obj.status), 1)) : createCommentVNode("", true)
									], 8, _hoisted_31);
								}), 128))])) : createCommentVNode("", true)], 64);
							}), 128)),
							(openBlock(true), createElementBlock(Fragment, null, renderList(viewsOf(db), (view) => {
								return openBlock(), createElementBlock(Fragment, { key: db + ".V." + view.name }, [createBaseVNode("div", {
									class: normalizeClass(["dbm-tree-node dbm-table-node", { active: activeTable.value === view.name && activeDatabase.value === db }]),
									onClick: ($event) => selectTable(view.name, db),
									onContextmenu: withModifiers(($event) => onTableContextMenu($event, view.name, db, true), ["prevent"])
								}, [
									createVNode(unref(component$1), {
										name: expandedTables.value.has(db + "." + view.name) ? "ArrowDown" : "ArrowRight",
										size: 12,
										class: "dbm-arrow",
										onClick: withModifiers(($event) => toggleTable(view.name, db), ["stop"])
									}, null, 8, ["name", "onClick"]),
									createVNode(unref(component$1), {
										name: "View",
										size: 14,
										class: "dbm-tree-icon dbm-view-icon"
									}),
									createBaseVNode("span", {
										class: "dbm-tree-label",
										title: view.remark || view.name
									}, toDisplayString(view.name), 9, _hoisted_36),
									view.remark ? (openBlock(), createElementBlock("span", _hoisted_37, toDisplayString(view.remark), 1)) : createCommentVNode("", true)
								], 42, _hoisted_35), expandedTables.value.has(db + "." + view.name) ? (openBlock(), createElementBlock("div", _hoisted_38, [(openBlock(true), createElementBlock(Fragment, null, renderList(columnsOf(db, view.name), (col) => {
									return openBlock(), createElementBlock("div", {
										key: col.name,
										class: "dbm-tree-node dbm-column-node"
									}, [
										createVNode(unref(component$1), {
											name: "Document",
											size: 13,
											class: "dbm-tree-icon dbm-col-icon"
										}),
										createBaseVNode("span", {
											class: "dbm-tree-label",
											title: col.remark || col.name
										}, toDisplayString(col.name), 9, _hoisted_39),
										createBaseVNode("span", _hoisted_40, toDisplayString(col.type), 1)
									]);
								}), 128))])) : createCommentVNode("", true)], 64);
							}), 128))
						])) : createCommentVNode("", true)]);
					}), 128)) : createCommentVNode("", true)], 32)], 32), createBaseVNode("div", _hoisted_41, [
						tabs.value.length > 0 ? (openBlock(), createElementBlock("div", {
							key: 0,
							class: "dbm-tabs",
							onContextmenu: _cache[7] || (_cache[7] = withModifiers(() => {}, ["prevent"]))
						}, [(openBlock(true), createElementBlock(Fragment, null, renderList(tabs.value, (tab) => {
							return openBlock(), createElementBlock("div", {
								key: tab.id,
								class: normalizeClass(["dbm-tab", { active: activeTab.value === tab.id }]),
								onClick: ($event) => selectTab(tab.id),
								onContextmenu: withModifiers(($event) => onTabContextMenu($event, tab.id), ["prevent"])
							}, [
								createVNode(unref(component$1), {
									name: tab.type === "query" ? "Edit" : tab.type === "object" ? unref(DB_OBJECT_CATEGORIES).find((c) => c.value === tab.objectCategory)?.icon ?? "Document" : "Grid",
									size: "12"
								}, null, 8, ["name"]),
								createBaseVNode("span", _hoisted_43, toDisplayString(tab.title), 1),
								createVNode(unref(component$1), {
									name: "Close",
									size: "12",
									class: "dbm-tab-close",
									onClick: withModifiers(($event) => closeTab(tab.id), ["stop"])
								}, null, 8, ["onClick"])
							], 42, _hoisted_42);
						}), 128))], 32)) : createCommentVNode("", true),
						activeTabObj.value && activeTabObj.value.type === "table" ? (openBlock(), createElementBlock("div", _hoisted_44, [createBaseVNode("div", _hoisted_45, [
							createVNode(unref(ReButton_default), {
								layout: "square",
								icon: filterBarOpen.value ? "ArrowUp" : "ArrowDown",
								tip: filterBarOpen.value ? "收起 WHERE 过滤" : "展开 WHERE 过滤",
								onClick: _cache[8] || (_cache[8] = ($event) => filterBarOpen.value = !filterBarOpen.value)
							}, null, 8, ["icon", "tip"]),
							!filterBarOpen.value && filterActive.value ? (openBlock(), createElementBlock("span", _hoisted_46, "过滤中")) : createCommentVNode("", true),
							filterBarOpen.value ? (openBlock(), createElementBlock(Fragment, { key: 1 }, [
								_cache[153] || (_cache[153] = createBaseVNode("span", { class: "dbm-filter-label" }, "WHERE", -1)),
								createBaseVNode("span", _hoisted_47, [createVNode(unref(ReInput_default), {
									modelValue: filterWhere.value,
									"onUpdate:modelValue": _cache[9] || (_cache[9] = ($event) => filterWhere.value = $event),
									class: "dbm-mono dbm-filter-input",
									placeholder: "例：status = 1 AND name LIKE 'a%'（留空不过滤）",
									clearable: "",
									onKeyup: withKeys(applyFilter, ["enter"])
								}, null, 8, ["modelValue"])]),
								createVNode(unref(ReButton_default), {
									layout: "square",
									type: "primary",
									icon: "Search",
									tip: "应用过滤（Enter）",
									onClick: applyFilter
								}),
								createVNode(unref(ReButton_default), {
									layout: "square",
									icon: "RefreshLeft",
									tip: "清除过滤",
									onClick: clearFilter
								}),
								createVNode(unref(ReButton_default), {
									layout: "square",
									icon: "Filter",
									tip: "高级筛选（列 + 运算符 + 值）",
									onClick: openFilterDialog
								}),
								activeFilters.value.length ? (openBlock(), createElementBlock("span", _hoisted_48, toDisplayString(activeFilters.value.length) + " 个条件", 1)) : createCommentVNode("", true)
							], 64)) : createCommentVNode("", true),
							_cache[154] || (_cache[154] = createBaseVNode("span", { class: "dbm-spacer" }, null, -1)),
							selection.value.length ? (openBlock(), createElementBlock("span", _hoisted_49, "已选 " + toDisplayString(selection.value.length) + " 行", 1)) : createCommentVNode("", true),
							selection.value.length ? (openBlock(), createBlock(unref(ReButton_default), {
								key: 3,
								layout: "square",
								type: "danger",
								plain: "",
								icon: "Delete",
								tip: `删除选中的 ${selection.value.length} 行`,
								onClick: deleteSelectedRows
							}, null, 8, ["tip"])) : createCommentVNode("", true)
						]), createVNode(unref(ReTable_default), {
							data: tableData.rows,
							columns: tableColumns.value,
							"row-key": gridRowKey.value,
							loading: tableLoading.value,
							pagination: false,
							border: true,
							"column-draggable": "",
							"table-id": tableGridId.value,
							"header-show-overflow-tooltip": true,
							"show-selection": "",
							stripe: "",
							height: "calc(100% - 56px)",
							"context-menu": gridMenuItems.value,
							onSelectionChange,
							onSortChange,
							onContextMenuSelect: onGridMenuSelect
						}, createSlots({ _: 2 }, [renderList(tableData.columns, (col) => {
							return {
								name: `col-${col}`,
								fn: withCtx(({ row, value }) => [editingCell.value && editingCell.value.row === row && editingCell.value.column === col ? (openBlock(), createElementBlock("div", {
									key: 0,
									class: "dbm-cell-edit",
									onClick: _cache[10] || (_cache[10] = withModifiers(() => {}, ["stop"]))
								}, [createVNode(unref(ReInput_default), {
									"model-value": editingCell.value.value,
									autofocus: "",
									type: longTextColumns.value.has(col) ? "textarea" : "text",
									"onUpdate:modelValue": setEditingCellValue,
									onKeyup: [withKeys(($event) => saveCell(row, col), ["enter"]), withKeys(cancelCell, ["esc"])],
									onBlur: ($event) => saveCell(row, col)
								}, null, 8, [
									"model-value",
									"type",
									"onKeyup",
									"onBlur"
								])])) : isBinaryCol(col) || isLongTextCol(col) ? (openBlock(), createElementBlock("div", _hoisted_50, [createBaseVNode("button", {
									type: "button",
									class: "dbm-cell-blob",
									"aria-label": `打开 ${col} 的内容查看器`,
									onClick: withModifiers(($event) => openBlobViewer(row, col, value), ["stop"])
								}, [createVNode(unref(component$1), {
									name: blobIcon(col, value),
									size: 12
								}, null, 8, ["name"]), createBaseVNode("span", _hoisted_52, toDisplayString(blobSummary(col, value)), 1)], 8, _hoisted_51)])) : (openBlock(), createElementBlock("div", _hoisted_53, [createBaseVNode("span", {
									class: normalizeClass(["dbm-cell-value", { "dbm-cell-pk": pkColumns.value.has(col) }]),
									title: pkColumns.value.has(col) ? "主键列不可编辑" : "点击编辑 / 右键更多操作",
									onClick: ($event) => startEditCell(row, col, value)
								}, toDisplayString(formatCellValue(value)), 11, _hoisted_54), rowMode.value === "data-comment" && columnComment(col) ? (openBlock(), createElementBlock("span", _hoisted_55, toDisplayString(columnComment(col)), 1)) : createCommentVNode("", true)]))])
							};
						})]), 1032, [
							"data",
							"columns",
							"row-key",
							"loading",
							"table-id",
							"context-menu"
						])])) : createCommentVNode("", true),
						activeTabObj.value && activeTabObj.value.type === "design" ? (openBlock(), createElementBlock("div", _hoisted_56, [createBaseVNode("div", _hoisted_57, [
							createBaseVNode("span", _hoisted_58, toDisplayString(qualified(activeTabObj.value)), 1),
							createBaseVNode("div", _hoisted_59, [
								createBaseVNode("span", {
									class: normalizeClass(["dbm-subtab", { active: designSubTab.value === "columns" }]),
									onClick: _cache[11] || (_cache[11] = ($event) => designSubTab.value = "columns")
								}, "表结构", 2),
								createBaseVNode("span", {
									class: normalizeClass(["dbm-subtab", { active: designSubTab.value === "indexes" }]),
									onClick: openIndexes
								}, "索引", 2),
								createBaseVNode("span", {
									class: normalizeClass(["dbm-subtab", { active: designSubTab.value === "foreignKeys" }]),
									onClick: openForeignKeys
								}, "外键", 2)
							]),
							createBaseVNode("div", _hoisted_60, [designSubTab.value === "columns" ? (openBlock(), createElementBlock(Fragment, { key: 0 }, [
								createVNode(unref(ReButton_default), {
									layout: "square",
									type: "primary",
									icon: "Plus",
									tip: "新增列",
									onClick: _cache[12] || (_cache[12] = ($event) => openColumnDialog("add"))
								}),
								createVNode(unref(ReButton_default), {
									layout: "square",
									type: "primary",
									plain: "",
									icon: "Check",
									tip: designDirtyCount.value > 0 ? `保存 ${designDirtyCount.value} 处改动` : "保存（无改动）",
									disabled: designDirtyCount.value === 0,
									onClick: saveDesignAll
								}, null, 8, ["tip", "disabled"]),
								createVNode(unref(ReButton_default), {
									layout: "square",
									icon: "Setting",
									tip: "表属性",
									onClick: openTableOptionsDialog
								}),
								createVNode(unref(ReButton_default), {
									layout: "square",
									icon: "Key",
									tip: "设置主键",
									onClick: openPkDialog
								})
							], 64)) : designSubTab.value === "indexes" ? (openBlock(), createBlock(unref(ReButton_default), {
								key: 1,
								layout: "square",
								type: "primary",
								icon: "Plus",
								tip: "新建索引",
								onClick: openIndexDialog
							})) : (openBlock(), createBlock(unref(ReButton_default), {
								key: 2,
								layout: "square",
								type: "primary",
								icon: "Plus",
								tip: "新增外键",
								onClick: openAddForeignKey
							})), createVNode(unref(ReButton_default), {
								layout: "square",
								icon: "Refresh",
								tip: "刷新",
								onClick: reloadDesignArea
							})])
						]), designSubTab.value === "columns" ? (openBlock(), createElementBlock(Fragment, { key: 0 }, [_cache[156] || (_cache[156] = createBaseVNode("div", { class: "dbm-col-hint" }, "单元格可直接编辑，改动行高亮，保存后生效", -1)), withDirectives((openBlock(), createElementBlock("div", _hoisted_61, [
							_cache[155] || (_cache[155] = createBaseVNode("div", { class: "dbm-dgrid-head" }, [
								createBaseVNode("span", null, "#"),
								createBaseVNode("span", null, "字段名"),
								createBaseVNode("span", null, "类型"),
								createBaseVNode("span", null, "长度"),
								createBaseVNode("span", null, "可空"),
								createBaseVNode("span", null, "主键"),
								createBaseVNode("span", null, "默认值"),
								createBaseVNode("span", null, "注释"),
								createBaseVNode("span", null, "操作")
							], -1)),
							(openBlock(true), createElementBlock(Fragment, null, renderList(designRows.value, (row, i) => {
								return openBlock(), createElementBlock("div", {
									key: row.originalName || row.name,
									class: normalizeClass(["dbm-dgrid-row", { dirty: isDesignDirty(row) }])
								}, [
									createBaseVNode("span", _hoisted_62, toDisplayString(i + 1), 1),
									createVNode(unref(ReInput_default), {
										modelValue: row.name,
										"onUpdate:modelValue": ($event) => row.name = $event,
										class: "dbm-mono",
										onDblclick: ($event) => openColumnDialog("edit", row)
									}, null, 8, [
										"modelValue",
										"onUpdate:modelValue",
										"onDblclick"
									]),
									createVNode(unref(ReSelect_default), {
										modelValue: row.type,
										"onUpdate:modelValue": ($event) => row.type = $event,
										options: unref(columnTypeOptions).map((t) => ({
											label: t,
											value: t
										}))
									}, null, 8, [
										"modelValue",
										"onUpdate:modelValue",
										"options"
									]),
									createVNode(unref(ReInputNumber_default), {
										"model-value": row.size ?? void 0,
										"onUpdate:modelValue": ($event) => row.size = $event ?? null,
										min: 1,
										max: 65535,
										"controls-position": "right",
										style: { "width": "100%" }
									}, null, 8, ["model-value", "onUpdate:modelValue"]),
									createVNode(ConsoleSwitch_default, {
										modelValue: row.nullable,
										"onUpdate:modelValue": ($event) => row.nullable = $event,
										size: "small",
										"aria-label": "允许为空"
									}, null, 8, ["modelValue", "onUpdate:modelValue"]),
									createBaseVNode("span", _hoisted_63, [row.isPrimaryKey ? (openBlock(), createBlock(unref(component$1), {
										key: 0,
										name: "Key",
										size: 13
									})) : createCommentVNode("", true)]),
									createVNode(unref(ReInput_default), {
										modelValue: row.defaultValue,
										"onUpdate:modelValue": ($event) => row.defaultValue = $event,
										class: "dbm-mono",
										placeholder: "默认值"
									}, null, 8, ["modelValue", "onUpdate:modelValue"]),
									createVNode(unref(ReInput_default), {
										modelValue: row.comment,
										"onUpdate:modelValue": ($event) => row.comment = $event,
										placeholder: "注释"
									}, null, 8, ["modelValue", "onUpdate:modelValue"]),
									createBaseVNode("span", _hoisted_64, [
										createVNode(unref(ReButton_default), {
											icon: "Setting",
											layout: "square",
											tip: "列属性",
											onClick: ($event) => openColumnDialog("edit", row)
										}, null, 8, ["onClick"]),
										createVNode(unref(ReButton_default), {
											icon: "Check",
											layout: "square",
											tip: "保存该行",
											disabled: !isDesignDirty(row),
											onClick: ($event) => saveDesignRow(row)
										}, null, 8, ["disabled", "onClick"]),
										createVNode(unref(ReButton_default), {
											icon: "Delete",
											layout: "square",
											type: "danger",
											tip: "删除列",
											onClick: ($event) => removeColumn(row)
										}, null, 8, ["onClick"])
									])
								], 2);
							}), 128)),
							designRows.value.length === 0 ? (openBlock(), createBlock(unref(ReEmpty_default), {
								key: 0,
								description: "暂无字段",
								"image-size": 40
							})) : createCommentVNode("", true)
						])), [[_directive_loading, designLoading.value]])], 64)) : designSubTab.value === "indexes" ? (openBlock(), createElementBlock(Fragment, { key: 1 }, [_cache[157] || (_cache[157] = createBaseVNode("div", { class: "dbm-col-hint" }, "索引与主键都是真实约束，创建后立即对写入与查询计划生效", -1)), createVNode(unref(ReTable_default), {
							data: indexes.value,
							columns: indexColumnDefs,
							loading: indexLoading.value,
							pagination: false,
							stripe: "",
							border: "",
							"column-draggable": "",
							height: "calc(100% - 70px)"
						}, {
							"col-actions": withCtx(({ row }) => [createVNode(unref(ReButton_default), {
								layout: "square",
								type: "danger",
								icon: "Delete",
								tip: "删除索引",
								onClick: ($event) => removeIndex(row)
							}, null, 8, ["onClick"])]),
							_: 1
						}, 8, ["data", "loading"])], 64)) : (openBlock(), createElementBlock(Fragment, { key: 2 }, [_cache[158] || (_cache[158] = createBaseVNode("div", { class: "dbm-col-hint" }, "外键是真实约束，新增后立即对写入生效", -1)), createVNode(unref(ReTable_default), {
							data: foreignKeys.value,
							columns: foreignKeyColumnDefs,
							loading: fkLoading.value,
							pagination: false,
							stripe: "",
							border: "",
							"column-draggable": "",
							height: "calc(100% - 70px)"
						}, {
							"col-fk-actions": withCtx(({ row }) => [createVNode(unref(ReButton_default), {
								layout: "square",
								type: "danger",
								icon: "Delete",
								tip: "删除外键",
								onClick: ($event) => removeForeignKey(row)
							}, null, 8, ["onClick"])]),
							_: 1
						}, 8, ["data", "loading"])], 64))])) : createCommentVNode("", true),
						activeTabObj.value && activeTabObj.value.type === "query" ? (openBlock(), createElementBlock("div", _hoisted_65, [
							createBaseVNode("div", _hoisted_66, [createBaseVNode("div", _hoisted_67, [
								createVNode(unref(ReButton_default), {
									layout: "square",
									type: "primary",
									icon: "VideoPlay",
									tip: "执行（Ctrl+Enter）",
									onClick: executeQuery
								}),
								createVNode(unref(ReButton_default), {
									layout: "square",
									icon: "Files",
									tip: "执行脚本（逐条出结果）",
									onClick: executeScript
								}),
								createVNode(unref(ReButton_default), {
									layout: "square",
									icon: "Tickets",
									tip: "执行计划",
									onClick: executeExplain
								}),
								createVNode(unref(ReButton_default), {
									layout: "square",
									icon: "Operation",
									tip: "查询参数",
									onClick: openParamDialog
								}),
								createBaseVNode("label", { class: normalizeClass(["dbm-switch dbm-tx-switch", { on: txWanted.value || !!txId.value }]) }, [createVNode(ConsoleSwitch_default, {
									modelValue: txWanted.value,
									"onUpdate:modelValue": _cache[13] || (_cache[13] = ($event) => txWanted.value = $event),
									"aria-label": "事务"
								}, null, 8, ["modelValue"]), _cache[159] || (_cache[159] = createBaseVNode("span", null, "事务", -1))], 2),
								txId.value ? (openBlock(), createElementBlock(Fragment, { key: 0 }, [createVNode(unref(ReButton_default), {
									layout: "square",
									type: "success",
									icon: "Select",
									tip: "提交事务",
									onClick: commitTx
								}), createVNode(unref(ReButton_default), {
									layout: "square",
									type: "danger",
									plain: "",
									icon: "CloseBold",
									tip: "回滚事务",
									onClick: rollbackTx
								})], 64)) : txBusy.value ? (openBlock(), createBlock(unref(ReButton_default), {
									key: 1,
									layout: "square",
									icon: "Loading",
									tip: "正在开启事务",
									disabled: ""
								})) : createCommentVNode("", true),
								_cache[160] || (_cache[160] = createBaseVNode("span", { class: "dbm-spacer" }, null, -1)),
								createVNode(unref(ReButton_default), {
									layout: "square",
									icon: "MagicStick",
									tip: "格式化 SQL",
									onClick: formatSql
								}),
								createVNode(unref(ReButton_default), {
									layout: "square",
									icon: "Download",
									tip: "保存为 SQL 文件",
									onClick: saveSqlFile
								}),
								createVNode(unref(ReButton_default), {
									layout: "square",
									icon: "Upload",
									tip: "打开 SQL 文件",
									onClick: openSqlFile
								}),
								createVNode(unref(ReButton_default), {
									layout: "square",
									icon: "Clock",
									tip: "查询历史",
									onClick: toggleHistory
								}),
								createVNode(unref(ReButton_default), {
									layout: "square",
									icon: "DocumentAdd",
									tip: "保存为 SQL 模板",
									onClick: saveSqlTemplate
								}),
								createVNode(unref(ReButton_default), {
									layout: "square",
									icon: "Collection",
									tip: "SQL 模板列表",
									onClick: toggleTemplates
								}),
								dbAi.value.available ? (openBlock(), createBlock(unref(ReButton_default), {
									key: 2,
									layout: "square",
									icon: "ChatDotSquare",
									tip: "AI 生成 SQL（text2sql）",
									onClick: openAiDialog
								})) : createCommentVNode("", true),
								createVNode(unref(ReSelect_default), {
									modelValue: execTimeoutSec.value,
									"onUpdate:modelValue": _cache[14] || (_cache[14] = ($event) => execTimeoutSec.value = $event),
									class: "dbm-timeout-select",
									style: { "width": "96px" }
								}, {
									default: withCtx(() => [(openBlock(), createElementBlock(Fragment, null, renderList(execTimeoutOptions, (opt) => {
										return createVNode(unref(ReOption), {
											key: opt.value,
											label: opt.label,
											value: opt.value
										}, null, 8, ["label", "value"]);
									}), 64))]),
									_: 1
								}, 8, ["modelValue"]),
								createVNode(unref(ReSelect_default), {
									modelValue: activeTabObj.value.database,
									"onUpdate:modelValue": _cache[15] || (_cache[15] = ($event) => activeTabObj.value.database = $event),
									placeholder: "目标库",
									style: { "width": "200px" }
								}, {
									default: withCtx(() => [(openBlock(true), createElementBlock(Fragment, null, renderList(databases.value, (db) => {
										return openBlock(), createBlock(unref(ReOption), {
											key: db,
											label: dbLabel(db),
											value: db
										}, null, 8, ["label", "value"]);
									}), 128))]),
									_: 1
								}, 8, ["modelValue"]),
								createBaseVNode("input", {
									ref_key: "sqlFileInputRef",
									ref: sqlFileInputRef,
									type: "file",
									accept: ".sql,text/plain",
									class: "dbm-hidden-input",
									onChange: onSqlFilePicked
								}, null, 544)
							]), createVNode(DbSqlEditor_default, {
								modelValue: activeSqlModel.value,
								"onUpdate:modelValue": _cache[16] || (_cache[16] = ($event) => activeSqlModel.value = $event),
								tables: getTablesForDb(activeTabObj.value.database || activeDatabase.value).map((t) => t.name),
								"column-resolver": resolveColumnsForTable,
								class: "dbm-sql-component",
								onExecute: executeQuery
							}, null, 8, ["modelValue", "tables"])]),
							createBaseVNode("div", _hoisted_68, [
								resultSets.value.length > 1 ? (openBlock(), createElementBlock("div", _hoisted_69, [(openBlock(true), createElementBlock(Fragment, null, renderList(resultSets.value, (r, i) => {
									return openBlock(), createElementBlock("button", {
										key: i,
										type: "button",
										class: normalizeClass(["dbm-result-set-tab", { active: activeResultSet.value === i }]),
										onClick: ($event) => selectResultSet(i)
									}, toDisplayString(resultSetLabel(r, i)), 11, _hoisted_70);
								}), 128))])) : createCommentVNode("", true),
								createBaseVNode("div", _hoisted_71, [
									queryResult.message ? (openBlock(), createElementBlock("span", _hoisted_72, toDisplayString(queryResult.message), 1)) : queryResult.rowCount !== void 0 ? (openBlock(), createElementBlock("span", _hoisted_73, "查询完成，共 " + toDisplayString(queryResult.rowCount) + " 行" + toDisplayString(queryResult.truncated ? "（已截断）" : ""), 1)) : queryResult.affectedRows !== void 0 ? (openBlock(), createElementBlock("span", _hoisted_74, "执行完成，影响 " + toDisplayString(queryResult.affectedRows) + " 行", 1)) : createCommentVNode("", true),
									_cache[161] || (_cache[161] = createBaseVNode("span", { class: "dbm-spacer" }, null, -1)),
									queryResult.columns && queryResult.columns.length > 0 ? (openBlock(), createBlock(unref(ReSelect_default), {
										key: 3,
										modelValue: queryExportFormat.value,
										"onUpdate:modelValue": _cache[17] || (_cache[17] = ($event) => queryExportFormat.value = $event),
										placeholder: "导出结果",
										style: { "width": "128px" }
									}, {
										default: withCtx(() => [
											createVNode(unref(ReOption), {
												label: "导出 CSV",
												value: "csv"
											}),
											createVNode(unref(ReOption), {
												label: "导出 TSV",
												value: "tsv"
											}),
											createVNode(unref(ReOption), {
												label: "导出 JSON",
												value: "json"
											}),
											createVNode(unref(ReOption), {
												label: "导出 XML",
												value: "xml"
											})
										]),
										_: 1
									}, 8, ["modelValue"])) : createCommentVNode("", true)
								]),
								queryResult.columns && queryResult.columns.length > 0 ? (openBlock(), createBlock(unref(ReTable_default), {
									key: 1,
									data: queryResult.rows || [],
									columns: queryColumns.value,
									pagination: false,
									stripe: "",
									border: "",
									"column-draggable": "",
									height: "calc(100% - 40px)"
								}, null, 8, ["data", "columns"])) : activeResultIsFailure.value ? (openBlock(), createElementBlock("div", _hoisted_75, [createBaseVNode("div", _hoisted_76, "第 " + toDisplayString(activeResultSet.value + 1) + " 条执行失败", 1), createBaseVNode("pre", _hoisted_77, toDisplayString(queryResult.message), 1)])) : activeResultIsUpdate.value ? (openBlock(), createElementBlock("div", _hoisted_78, " 第 " + toDisplayString(activeResultSet.value + 1) + " 条是更新语句，没有结果集（影响 " + toDisplayString(queryResult.affectedRows ?? 0) + " 行） ", 1)) : (openBlock(), createBlock(unref(ReEmpty_default), {
									key: 4,
									description: "执行 SQL 后显示结果"
								}))
							]),
							historyVisible.value ? (openBlock(), createElementBlock("div", _hoisted_79, [createBaseVNode("div", _hoisted_80, [
								createBaseVNode("span", _hoisted_81, "查询历史（" + toDisplayString(queryHistory.value.length) + " 条）", 1),
								_cache[162] || (_cache[162] = createBaseVNode("span", { class: "dbm-spacer" }, null, -1)),
								createVNode(unref(ReButton_default), {
									layout: "square",
									icon: "Delete",
									tip: "清空查询历史",
									onClick: clearQueryHistory
								}),
								createVNode(unref(ReButton_default), {
									layout: "square",
									icon: "Close",
									tip: "关闭查询历史",
									onClick: _cache[18] || (_cache[18] = ($event) => historyVisible.value = false)
								})
							]), createBaseVNode("div", _hoisted_82, [(openBlock(true), createElementBlock(Fragment, null, renderList(queryHistory.value, (h, i) => {
								return openBlock(), createElementBlock("div", {
									key: i,
									class: "dbm-history-item",
									title: h.sql,
									onClick: ($event) => loadFromHistory(h.sql)
								}, [
									createBaseVNode("span", _hoisted_84, toDisplayString(h.at), 1),
									createBaseVNode("span", _hoisted_85, toDisplayString(h.sql), 1),
									createBaseVNode("span", _hoisted_86, toDisplayString(h.summary), 1)
								], 8, _hoisted_83);
							}), 128)), queryHistory.value.length === 0 ? (openBlock(), createBlock(unref(ReEmpty_default), {
								key: 0,
								description: "还没有执行记录"
							})) : createCommentVNode("", true)])])) : createCommentVNode("", true),
							templatesVisible.value ? (openBlock(), createElementBlock("div", _hoisted_87, [createBaseVNode("div", _hoisted_88, [
								createBaseVNode("span", _hoisted_89, "SQL 模板（" + toDisplayString(sqlTemplates.value.length) + " 个）", 1),
								_cache[163] || (_cache[163] = createBaseVNode("span", { class: "dbm-spacer" }, null, -1)),
								createVNode(unref(ReButton_default), {
									layout: "square",
									icon: "Close",
									tip: "关闭模板列表",
									onClick: _cache[19] || (_cache[19] = ($event) => templatesVisible.value = false)
								})
							]), createBaseVNode("div", _hoisted_90, [(openBlock(true), createElementBlock(Fragment, null, renderList(sqlTemplates.value, (t) => {
								return openBlock(), createElementBlock("div", {
									key: t.name,
									class: "dbm-history-item dbm-tpl-item",
									title: t.sql,
									onClick: ($event) => loadSqlTemplate(t)
								}, [
									createBaseVNode("span", _hoisted_92, toDisplayString(t.at), 1),
									createBaseVNode("span", _hoisted_93, toDisplayString(t.name), 1),
									createBaseVNode("span", _hoisted_94, toDisplayString(t.sql), 1),
									createVNode(unref(component$1), {
										name: "Delete",
										size: "14",
										class: "dbm-tpl-del",
										onClick: withModifiers(($event) => removeSqlTemplate(t.name), ["stop"])
									}, null, 8, ["onClick"])
								], 8, _hoisted_91);
							}), 128)), sqlTemplates.value.length === 0 ? (openBlock(), createBlock(unref(ReEmpty_default), {
								key: 0,
								description: "还没有保存的模板"
							})) : createCommentVNode("", true)])])) : createCommentVNode("", true)
						])) : createCommentVNode("", true),
						activeTabObj.value && activeTabObj.value.type === "er" ? (openBlock(), createElementBlock("div", _hoisted_95, [
							createBaseVNode("div", _hoisted_96, [
								createBaseVNode("span", _hoisted_97, toDisplayString(qualifiedEr.value), 1),
								createVNode(unref(ReInput_default), {
									modelValue: erTableFilter.value,
									"onUpdate:modelValue": _cache[20] || (_cache[20] = ($event) => erTableFilter.value = $event),
									class: "dbm-mono dbm-er-filter",
									placeholder: "只画匹配这些表的图（支持 % 与 _，留空为全部）",
									clearable: "",
									onKeyup: withKeys(loadErDiagram, ["enter"])
								}, null, 8, ["modelValue"]),
								createVNode(unref(ReButton_default), {
									layout: "square",
									type: "primary",
									icon: "Search",
									tip: "按过滤条件重画",
									onClick: loadErDiagram
								}),
								_cache[164] || (_cache[164] = createBaseVNode("span", { class: "dbm-spacer" }, null, -1)),
								createBaseVNode("span", _hoisted_98, toDisplayString(erStatText.value), 1),
								createVNode(unref(ReSelect_default), {
									modelValue: erLayout.value,
									"onUpdate:modelValue": _cache[21] || (_cache[21] = ($event) => erLayout.value = $event),
									class: "dbm-er-layout",
									placeholder: "布局"
								}, {
									default: withCtx(() => [(openBlock(), createElementBlock(Fragment, null, renderList(ER_LAYOUT_CHOICES, (l) => {
										return createVNode(unref(ReOption), {
											key: l.value,
											label: l.label,
											value: l.value
										}, null, 8, ["label", "value"]);
									}), 64))]),
									_: 1
								}, 8, ["modelValue"]),
								createVNode(unref(ReButton_default), {
									layout: "square",
									type: erShowLabels.value ? "primary" : "",
									icon: "Label",
									tip: "显示 / 隐藏关系名",
									onClick: _cache[22] || (_cache[22] = ($event) => erShowLabels.value = !erShowLabels.value)
								}, null, 8, ["type"]),
								createVNode(unref(ReButton_default), {
									layout: "square",
									icon: "Refresh",
									tip: "重新读取元数据",
									onClick: loadErDiagram
								}),
								createVNode(unref(ReButton_default), {
									layout: "square",
									icon: "Download",
									tip: "导出为 DOT（Graphviz）",
									onClick: exportErDot
								})
							]),
							erLoading.value ? (openBlock(), createElementBlock("div", _hoisted_99, "正在读取表与外键…")) : erError.value ? (openBlock(), createBlock(unref(ReEmpty_default), {
								key: 1,
								class: "dbm-er-empty",
								description: erError.value
							}, null, 8, ["description"])) : erNodes.value.length === 0 ? (openBlock(), createBlock(unref(ReEmpty_default), {
								key: 2,
								class: "dbm-er-empty",
								description: erTableFilter.value ? "没有匹配的表" : "这个库里还没有表"
							}, null, 8, ["description"])) : (openBlock(), createBlock(unref(component$2), {
								key: 3,
								ref_key: "erGraphRef",
								ref: erGraphRef,
								class: "dbm-er-graph",
								nodes: erNodes.value,
								edges: erEdges.value,
								layout: erLayout.value,
								highlight: "adjacent",
								toolbar: true,
								minimap: true,
								onNodeDblclick: onErNodeDblClick
							}, null, 8, [
								"nodes",
								"edges",
								"layout"
							])),
							createBaseVNode("div", _hoisted_100, [(openBlock(true), createElementBlock(Fragment, null, renderList(erTables.value, (t) => {
								return openBlock(), createElementBlock("div", {
									key: t.name,
									class: normalizeClass(["dbm-er-list-row", { missing: erMissingTables.value.has(t.name) }]),
									title: t.comment || t.name,
									onClick: ($event) => highlightErNode(t.name),
									onDblclick: ($event) => openErColumns(t.name)
								}, [
									createBaseVNode("span", _hoisted_102, toDisplayString(t.name), 1),
									_cache[165] || (_cache[165] = createBaseVNode("span", { class: "dbm-spacer" }, null, -1)),
									createBaseVNode("span", _hoisted_103, toDisplayString(erDegree(t.name)), 1)
								], 42, _hoisted_101);
							}), 128))]),
							createVNode(unref(component), {
								modelValue: erColumnsVisible.value,
								"onUpdate:modelValue": _cache[25] || (_cache[25] = ($event) => erColumnsVisible.value = $event),
								title: `${erPickedTable.value} 的列`,
								width: "520px"
							}, {
								footer: withCtx(() => [createVNode(unref(ReButton_default), {
									type: "primary",
									onClick: _cache[23] || (_cache[23] = ($event) => openErTableData(erPickedTable.value))
								}, {
									default: withCtx(() => [..._cache[166] || (_cache[166] = [createTextVNode("打开该表数据", -1)])]),
									_: 1
								}), createVNode(unref(ReButton_default), { onClick: _cache[24] || (_cache[24] = ($event) => erColumnsVisible.value = false) }, {
									default: withCtx(() => [..._cache[167] || (_cache[167] = [createTextVNode("关闭", -1)])]),
									_: 1
								})]),
								default: withCtx(() => [createBaseVNode("div", _hoisted_104, [(openBlock(true), createElementBlock(Fragment, null, renderList(erPickedColumns.value, (c) => {
									return openBlock(), createElementBlock("div", {
										key: c.name,
										class: "dbm-er-col-row"
									}, [
										createBaseVNode("span", _hoisted_105, toDisplayString(c.name), 1),
										createBaseVNode("span", _hoisted_106, toDisplayString(c.type), 1),
										createBaseVNode("span", _hoisted_107, [c.isPrimaryKey ? (openBlock(), createElementBlock("span", _hoisted_108, "PK")) : createCommentVNode("", true), c.nullable ? (openBlock(), createElementBlock("span", _hoisted_109, "可空")) : createCommentVNode("", true)])
									]);
								}), 128)), erPickedColumns.value.length === 0 ? (openBlock(), createBlock(unref(ReEmpty_default), {
									key: 0,
									description: "没有列信息"
								})) : createCommentVNode("", true)])]),
								_: 1
							}, 8, ["modelValue", "title"])
						])) : createCommentVNode("", true),
						activeTabObj.value && activeTabObj.value.type === "object" ? (openBlock(), createElementBlock("div", _hoisted_110, [createBaseVNode("div", _hoisted_111, [
							createBaseVNode("span", _hoisted_112, toDisplayString(objectTabTitle.value), 1),
							_cache[168] || (_cache[168] = createBaseVNode("span", { class: "dbm-hint" }, "整段 DDL 直接交给数据库执行，保存即生效", -1)),
							_cache[169] || (_cache[169] = createBaseVNode("span", { class: "dbm-spacer" }, null, -1)),
							activeTabObj.value.objectName ? (openBlock(), createBlock(unref(ReButton_default), {
								key: 0,
								layout: "square",
								type: "danger",
								plain: "",
								icon: "Delete",
								tip: "删除该对象",
								onClick: deleteCurrentObject
							})) : createCommentVNode("", true),
							createVNode(unref(ReButton_default), {
								layout: "square",
								type: "primary",
								icon: "Check",
								tip: "保存定义",
								loading: objectSaving.value,
								onClick: saveObjectDefinition
							}, null, 8, ["loading"])
						]), objectLoading.value ? (openBlock(), createElementBlock("div", _hoisted_113, "正在读取定义…")) : (openBlock(), createBlock(unref(ReInput_default), {
							key: 1,
							modelValue: objectDefinition.value,
							"onUpdate:modelValue": _cache[26] || (_cache[26] = ($event) => objectDefinition.value = $event),
							type: "textarea",
							class: "dbm-mono dbm-object-editor",
							rows: 26,
							placeholder: "CREATE PROCEDURE / FUNCTION / TRIGGER / EVENT …"
						}, null, 8, ["modelValue"]))])) : createCommentVNode("", true),
						tabs.value.length === 0 ? (openBlock(), createElementBlock("div", _hoisted_114, [createVNode(unref(component$1), {
							name: "Grid",
							size: "64",
							class: "dbm-empty-icon"
						}), _cache[170] || (_cache[170] = createBaseVNode("p", { class: "dbm-empty-text" }, "从左侧选择表查看数据，或点击\"新建查询\"执行 SQL", -1))])) : createCommentVNode("", true)
					])]),
					(openBlock(), createBlock(Teleport, { to: "body" }, [contextMenu.visible ? (openBlock(), createElementBlock("div", {
						key: 0,
						class: "dbm-context-menu",
						style: normalizeStyle(contextMenuStyle.value),
						onClick: withModifiers(closeContextMenu, ["stop"])
					}, [contextMenu.tableName ? (openBlock(), createElementBlock(Fragment, { key: 0 }, [
						createBaseVNode("div", {
							class: "dbm-context-item",
							onClick: _cache[27] || (_cache[27] = ($event) => openTableData(contextMenu.tableName, contextMenu.database))
						}, [createVNode(unref(component$1), {
							name: "Grid",
							size: 14
						}), _cache[171] || (_cache[171] = createTextVNode("打开表 ", -1))]),
						createBaseVNode("div", {
							class: "dbm-context-item",
							onClick: _cache[28] || (_cache[28] = ($event) => openTableDesign(contextMenu.tableName, contextMenu.database))
						}, [createVNode(unref(component$1), {
							name: "Edit",
							size: 14
						}), _cache[172] || (_cache[172] = createTextVNode("设计表 ", -1))]),
						createBaseVNode("div", {
							class: "dbm-context-item",
							onClick: _cache[29] || (_cache[29] = ($event) => openQueryWithSql(`SELECT * FROM \`${contextMenu.tableName}\` LIMIT 100`, contextMenu.database))
						}, [createVNode(unref(component$1), {
							name: "EditPen",
							size: 14
						}), _cache[173] || (_cache[173] = createTextVNode("查询数据 ", -1))]),
						createBaseVNode("div", {
							class: "dbm-context-item",
							onClick: _cache[30] || (_cache[30] = ($event) => showTableDdl(contextMenu.tableName, contextMenu.database))
						}, [createVNode(unref(component$1), {
							name: "Document",
							size: 14
						}), _cache[174] || (_cache[174] = createTextVNode("查看建表语句 ", -1))]),
						_cache[184] || (_cache[184] = createBaseVNode("div", { class: "dbm-context-divider" }, null, -1)),
						createBaseVNode("div", {
							class: "dbm-context-item",
							onClick: _cache[31] || (_cache[31] = ($event) => renameTable(contextMenu.tableName, contextMenu.database))
						}, [createVNode(unref(component$1), {
							name: "EditPen",
							size: 14
						}), _cache[175] || (_cache[175] = createTextVNode("重命名表 ", -1))]),
						!contextMenu.isView ? (openBlock(), createElementBlock("div", {
							key: 0,
							class: "dbm-context-item",
							onClick: _cache[32] || (_cache[32] = ($event) => duplicateTable(contextMenu.tableName, contextMenu.database))
						}, [createVNode(unref(component$1), {
							name: "CopyDocument",
							size: 14
						}), _cache[176] || (_cache[176] = createTextVNode("复制表 ", -1))])) : createCommentVNode("", true),
						createBaseVNode("div", {
							class: "dbm-context-item",
							onClick: _cache[33] || (_cache[33] = ($event) => copyText(contextMenu.tableName))
						}, [createVNode(unref(component$1), {
							name: "CopyDocument",
							size: 14
						}), _cache[177] || (_cache[177] = createTextVNode("复制表名 ", -1))]),
						_cache[185] || (_cache[185] = createBaseVNode("div", { class: "dbm-context-divider" }, null, -1)),
						createBaseVNode("div", {
							class: "dbm-context-item",
							onClick: _cache[34] || (_cache[34] = ($event) => openImportDataFor(contextMenu.tableName, contextMenu.database))
						}, [createVNode(unref(component$1), {
							name: "Upload",
							size: 14
						}), _cache[178] || (_cache[178] = createTextVNode("导入数据 ", -1))]),
						createBaseVNode("div", {
							class: "dbm-context-item",
							onClick: _cache[35] || (_cache[35] = ($event) => openExportDialog(contextMenu.tableName, contextMenu.database))
						}, [createVNode(unref(component$1), {
							name: "Download",
							size: 14
						}), _cache[179] || (_cache[179] = createTextVNode("导出数据 ", -1))]),
						createBaseVNode("div", {
							class: "dbm-context-item",
							onClick: _cache[36] || (_cache[36] = ($event) => refreshTableInTree(contextMenu.database))
						}, [createVNode(unref(component$1), {
							name: "Refresh",
							size: 14
						}), _cache[180] || (_cache[180] = createTextVNode("刷新 ", -1))]),
						_cache[186] || (_cache[186] = createBaseVNode("div", { class: "dbm-context-divider" }, null, -1)),
						!contextMenu.isView ? (openBlock(), createElementBlock("div", {
							key: 1,
							class: "dbm-context-item dbm-danger",
							onClick: _cache[37] || (_cache[37] = ($event) => confirmTruncate(contextMenu.tableName, contextMenu.database))
						}, [createVNode(unref(component$1), {
							name: "Delete",
							size: 14
						}), _cache[181] || (_cache[181] = createTextVNode("清空表 ", -1))])) : createCommentVNode("", true),
						contextMenu.isView ? (openBlock(), createElementBlock("div", {
							key: 2,
							class: "dbm-context-item dbm-danger",
							onClick: _cache[38] || (_cache[38] = ($event) => deleteView(contextMenu.tableName, contextMenu.database))
						}, [createVNode(unref(component$1), {
							name: "Delete",
							size: 14
						}), _cache[182] || (_cache[182] = createTextVNode("删除视图 ", -1))])) : (openBlock(), createElementBlock("div", {
							key: 3,
							class: "dbm-context-item dbm-danger",
							onClick: _cache[39] || (_cache[39] = ($event) => deleteTable(contextMenu.tableName, contextMenu.database))
						}, [createVNode(unref(component$1), {
							name: "Delete",
							size: 14
						}), _cache[183] || (_cache[183] = createTextVNode("删除表 ", -1))]))
					], 64)) : contextMenu.database ? (openBlock(), createElementBlock(Fragment, { key: 1 }, [
						createBaseVNode("div", {
							class: "dbm-context-item",
							onClick: _cache[40] || (_cache[40] = ($event) => openCreateTable(contextMenu.database))
						}, [createVNode(unref(component$1), {
							name: "Plus",
							size: 14
						}), _cache[187] || (_cache[187] = createTextVNode("新建表 ", -1))]),
						createBaseVNode("div", {
							class: "dbm-context-item",
							onClick: _cache[41] || (_cache[41] = ($event) => openImportDataForDb(contextMenu.database))
						}, [createVNode(unref(component$1), {
							name: "Upload",
							size: 14
						}), _cache[188] || (_cache[188] = createTextVNode("导入数据到本库 ", -1))]),
						createBaseVNode("div", {
							class: "dbm-context-item",
							onClick: _cache[42] || (_cache[42] = ($event) => openQueryWithSql("", contextMenu.database))
						}, [createVNode(unref(component$1), {
							name: "EditPen",
							size: 14
						}), _cache[189] || (_cache[189] = createTextVNode("新建查询 ", -1))]),
						createBaseVNode("div", {
							class: "dbm-context-item",
							onClick: _cache[43] || (_cache[43] = ($event) => openErDiagram(contextMenu.database))
						}, [createVNode(unref(component$1), {
							name: "Share",
							size: 14
						}), _cache[190] || (_cache[190] = createTextVNode("ER 图（表关系） ", -1))]),
						createBaseVNode("div", {
							class: "dbm-context-item",
							onClick: _cache[44] || (_cache[44] = ($event) => openStructureSync(contextMenu.database))
						}, [createVNode(unref(component$1), {
							name: "Sort",
							size: 14
						}), _cache[191] || (_cache[191] = createTextVNode("结构同步（与目标库比较） ", -1))]),
						createBaseVNode("div", {
							class: "dbm-context-item",
							onClick: _cache[45] || (_cache[45] = ($event) => openDocumentExport(contextMenu.database))
						}, [createVNode(unref(component$1), {
							name: "Document",
							size: 14
						}), _cache[192] || (_cache[192] = createTextVNode("导出数据库文档 ", -1))]),
						createBaseVNode("div", {
							class: "dbm-context-item",
							onClick: _cache[46] || (_cache[46] = ($event) => copyText(contextMenu.database))
						}, [createVNode(unref(component$1), {
							name: "CopyDocument",
							size: 14
						}), _cache[193] || (_cache[193] = createTextVNode("复制库名 ", -1))]),
						_cache[196] || (_cache[196] = createBaseVNode("div", { class: "dbm-context-divider" }, null, -1)),
						createBaseVNode("div", {
							class: "dbm-context-item",
							onClick: _cache[47] || (_cache[47] = ($event) => loadTables(contextMenu.database))
						}, [createVNode(unref(component$1), {
							name: "Refresh",
							size: 14
						}), _cache[194] || (_cache[194] = createTextVNode("刷新 ", -1))]),
						_cache[197] || (_cache[197] = createBaseVNode("div", { class: "dbm-context-divider" }, null, -1)),
						createBaseVNode("div", {
							class: "dbm-context-item dbm-danger",
							onClick: _cache[48] || (_cache[48] = ($event) => deleteDatabase(contextMenu.database))
						}, [createVNode(unref(component$1), {
							name: "Delete",
							size: 14
						}), _cache[195] || (_cache[195] = createTextVNode("删除数据库 ", -1))])
					], 64)) : contextMenu.tabId ? (openBlock(), createElementBlock(Fragment, { key: 2 }, [
						createBaseVNode("div", {
							class: "dbm-context-item",
							onClick: _cache[49] || (_cache[49] = ($event) => closeTab(contextMenu.tabId))
						}, [createVNode(unref(component$1), {
							name: "Close",
							size: 14
						}), _cache[198] || (_cache[198] = createTextVNode("关闭当前 ", -1))]),
						createBaseVNode("div", {
							class: "dbm-context-item",
							onClick: _cache[50] || (_cache[50] = ($event) => closeOtherTabs(contextMenu.tabId))
						}, [createVNode(unref(component$1), {
							name: "CircleClose",
							size: 14
						}), _cache[199] || (_cache[199] = createTextVNode("关闭其他 ", -1))]),
						_cache[201] || (_cache[201] = createBaseVNode("div", { class: "dbm-context-divider" }, null, -1)),
						createBaseVNode("div", {
							class: "dbm-context-item dbm-danger",
							onClick: _cache[51] || (_cache[51] = ($event) => closeAllTabs())
						}, [createVNode(unref(component$1), {
							name: "Delete",
							size: 14
						}), _cache[200] || (_cache[200] = createTextVNode("关闭全部 ", -1))])
					], 64)) : (openBlock(), createElementBlock(Fragment, { key: 3 }, [
						createBaseVNode("div", {
							class: "dbm-context-item",
							onClick: openCreateDatabase
						}, [createVNode(unref(component$1), {
							name: "FolderAdd",
							size: 14
						}), _cache[202] || (_cache[202] = createTextVNode("新建数据库 ", -1))]),
						createBaseVNode("div", {
							class: "dbm-context-item",
							onClick: _cache[52] || (_cache[52] = ($event) => openCreateTable())
						}, [createVNode(unref(component$1), {
							name: "Plus",
							size: 14
						}), _cache[203] || (_cache[203] = createTextVNode("新建表 ", -1))]),
						createBaseVNode("div", {
							class: "dbm-context-item",
							onClick: openNewQuery
						}, [createVNode(unref(component$1), {
							name: "EditPen",
							size: 14
						}), _cache[204] || (_cache[204] = createTextVNode("新建查询 ", -1))]),
						createBaseVNode("div", {
							class: "dbm-context-item",
							onClick: openImportDataFromToolbar
						}, [createVNode(unref(component$1), {
							name: "Upload",
							size: 14
						}), _cache[205] || (_cache[205] = createTextVNode("导入数据 ", -1))]),
						_cache[207] || (_cache[207] = createBaseVNode("div", { class: "dbm-context-divider" }, null, -1)),
						createBaseVNode("div", {
							class: "dbm-context-item",
							onClick: refreshTree
						}, [createVNode(unref(component$1), {
							name: "Refresh",
							size: 14
						}), _cache[206] || (_cache[206] = createTextVNode("刷新 ", -1))])
					], 64))], 4)) : createCommentVNode("", true)])),
					createVNode(unref(component), {
						modelValue: syncVisible.value,
						"onUpdate:modelValue": _cache[58] || (_cache[58] = ($event) => syncVisible.value = $event),
						title: "结构同步",
						width: "900px"
					}, {
						footer: withCtx(() => [createVNode(unref(ReButton_default), { onClick: _cache[57] || (_cache[57] = ($event) => syncVisible.value = false) }, {
							default: withCtx(() => [..._cache[212] || (_cache[212] = [createTextVNode("关闭", -1)])]),
							_: 1
						})]),
						default: withCtx(() => [createBaseVNode("div", _hoisted_115, [createBaseVNode("div", _hoisted_116, [
							createBaseVNode("span", _hoisted_117, [_cache[208] || (_cache[208] = createTextVNode(" 源库 ", -1)), createVNode(unref(ReSelect_default), {
								modelValue: syncSourceDb.value,
								"onUpdate:modelValue": _cache[53] || (_cache[53] = ($event) => syncSourceDb.value = $event),
								placeholder: "源库",
								class: "dbm-sync-select"
							}, {
								default: withCtx(() => [(openBlock(true), createElementBlock(Fragment, null, renderList(databases.value, (db) => {
									return openBlock(), createBlock(unref(ReOption), {
										key: "s" + db,
										label: dbLabel(db),
										value: db
									}, null, 8, ["label", "value"]);
								}), 128))]),
								_: 1
							}, 8, ["modelValue"])]),
							createVNode(unref(component$1), {
								name: "Right",
								size: 16
							}),
							createBaseVNode("span", _hoisted_118, [_cache[209] || (_cache[209] = createTextVNode(" 目标库 ", -1)), createVNode(unref(ReSelect_default), {
								modelValue: syncTargetDb.value,
								"onUpdate:modelValue": _cache[54] || (_cache[54] = ($event) => syncTargetDb.value = $event),
								placeholder: "目标库",
								class: "dbm-sync-select"
							}, {
								default: withCtx(() => [(openBlock(true), createElementBlock(Fragment, null, renderList(databases.value, (db) => {
									return openBlock(), createBlock(unref(ReOption), {
										key: "t" + db,
										label: dbLabel(db),
										value: db
									}, null, 8, ["label", "value"]);
								}), 128))]),
								_: 1
							}, 8, ["modelValue"])]),
							createVNode(unref(ReInput_default), {
								modelValue: syncTableFilter.value,
								"onUpdate:modelValue": _cache[55] || (_cache[55] = ($event) => syncTableFilter.value = $event),
								class: "dbm-mono dbm-sync-filter",
								placeholder: "只比较匹配的表（支持 % 与 _，留空为全部）",
								clearable: ""
							}, null, 8, ["modelValue"]),
							createVNode(unref(ReButton_default), {
								layout: "square",
								type: "primary",
								icon: "Search",
								tip: "比较",
								loading: syncLoading.value,
								onClick: runStructureDiff
							}, null, 8, ["loading"])
						]), !syncLoading.value && !syncDiffError.value && !syncRan.value ? (openBlock(), createBlock(unref(ReEmpty_default), {
							key: 0,
							description: "选好源库与目标库后点「比较」"
						})) : syncDiffError.value ? (openBlock(), createBlock(unref(ReEmpty_default), {
							key: 1,
							description: syncDiffError.value
						}, null, 8, ["description"])) : syncItems.value.length === 0 ? (openBlock(), createBlock(unref(ReEmpty_default), {
							key: 2,
							description: "两个库的结构已经一致，没有需要同步的差异"
						})) : (openBlock(), createElementBlock("div", _hoisted_119, [
							createBaseVNode("div", _hoisted_120, toDisplayString(syncItems.value.length) + " 处差异 · " + toDisplayString(syncActionableCount.value) + " 处可直接同步 · " + toDisplayString(syncExtraCount.value) + " 处是目标多出来的（不会自动删除） ", 1),
							createBaseVNode("div", _hoisted_121, [(openBlock(true), createElementBlock(Fragment, null, renderList(syncItems.value, (d, i) => {
								return openBlock(), createElementBlock("div", {
									key: i,
									class: normalizeClass(["dbm-sync-row", d.kind])
								}, [
									createBaseVNode("span", _hoisted_122, toDisplayString(SYNC_KIND_LABELS[d.kind] || d.kind), 1),
									createBaseVNode("span", _hoisted_123, toDisplayString(d.table) + "." + toDisplayString(d.object), 1),
									createBaseVNode("span", _hoisted_124, toDisplayString(d.detail), 1)
								], 2);
							}), 128))]),
							syncScript.value ? (openBlock(), createElementBlock("div", _hoisted_125, [createBaseVNode("div", _hoisted_126, [
								_cache[210] || (_cache[210] = createBaseVNode("span", null, "生成的同步脚本（未执行）", -1)),
								_cache[211] || (_cache[211] = createBaseVNode("span", { class: "dbm-spacer" }, null, -1)),
								createVNode(unref(ReButton_default), {
									layout: "square",
									icon: "DocumentCopy",
									tip: "复制脚本",
									onClick: _cache[56] || (_cache[56] = ($event) => copyText(syncScript.value))
								}),
								createVNode(unref(ReButton_default), {
									layout: "square",
									type: "primary",
									icon: "VideoPlay",
									tip: "在目标库执行这段脚本",
									onClick: runStructureScript
								})
							]), createBaseVNode("pre", _hoisted_127, toDisplayString(syncScript.value), 1)])) : createCommentVNode("", true)
						]))])]),
						_: 1
					}, 8, ["modelValue"]),
					createVNode(unref(component), {
						modelValue: docExportVisible.value,
						"onUpdate:modelValue": _cache[62] || (_cache[62] = ($event) => docExportVisible.value = $event),
						title: "导出数据库文档",
						width: "520px"
					}, {
						footer: withCtx(() => [
							createVNode(unref(ReButton_default), { onClick: _cache[61] || (_cache[61] = ($event) => docExportVisible.value = false) }, {
								default: withCtx(() => [..._cache[217] || (_cache[217] = [createTextVNode("取消", -1)])]),
								_: 1
							}),
							createVNode(unref(ReButton_default), {
								type: "info",
								loading: docPreviewLoading.value,
								disabled: !docExportFormats.value.length,
								onClick: doDocumentPreview
							}, {
								default: withCtx(() => [..._cache[218] || (_cache[218] = [createTextVNode(" 在线查看 ", -1)])]),
								_: 1
							}, 8, ["loading", "disabled"]),
							createVNode(unref(ReButton_default), {
								type: "primary",
								loading: docExportLoading.value,
								disabled: !docExportFormats.value.length,
								onClick: doDocumentExport
							}, {
								default: withCtx(() => [..._cache[219] || (_cache[219] = [createTextVNode(" 导出 ", -1)])]),
								_: 1
							}, 8, ["loading", "disabled"])
						]),
						default: withCtx(() => [createBaseVNode("div", _hoisted_128, [
							createBaseVNode("div", _hoisted_129, [_cache[213] || (_cache[213] = createBaseVNode("span", { class: "dbm-doc-label" }, "目标库", -1)), createBaseVNode("span", _hoisted_130, toDisplayString(docExportDatabase.value), 1)]),
							createBaseVNode("div", _hoisted_131, [_cache[214] || (_cache[214] = createBaseVNode("span", { class: "dbm-doc-label" }, "文档格式", -1)), withDirectives(createBaseVNode("select", {
								"onUpdate:modelValue": _cache[59] || (_cache[59] = ($event) => docExportFormat.value = $event),
								class: "dbm-doc-select"
							}, [(openBlock(true), createElementBlock(Fragment, null, renderList(docExportFormats.value, (f) => {
								return openBlock(), createElementBlock("option", {
									key: f.format,
									value: f.format
								}, toDisplayString(DOC_FORMAT_LABELS[f.format] ?? f.format), 9, _hoisted_132);
							}), 128))], 512), [[vModelSelect, docExportFormat.value]])]),
							createBaseVNode("div", _hoisted_133, [_cache[215] || (_cache[215] = createBaseVNode("span", { class: "dbm-doc-label" }, "模板样式", -1)), withDirectives(createBaseVNode("select", {
								"onUpdate:modelValue": _cache[60] || (_cache[60] = ($event) => docExportTemplate.value = $event),
								class: "dbm-doc-select"
							}, [(openBlock(true), createElementBlock(Fragment, null, renderList(docExportTemplates.value, (t) => {
								return openBlock(), createElementBlock("option", {
									key: t,
									value: t
								}, toDisplayString(t), 9, _hoisted_134);
							}), 128))], 512), [[vModelSelect, docExportTemplate.value]])]),
							_cache[216] || (_cache[216] = createBaseVNode("p", { class: "dbm-doc-hint" }, [
								createTextVNode(" 导出内容为本库全部表与视图的字段、类型、主键与外键（不含数据行）。 "),
								createBaseVNode("br"),
								createTextVNode(" 格式由服务端已装配的渲染器决定；PDF 还需要服务端装有 wkhtmltopdf，否则会明确报错而不是给你一个空文件。 ")
							], -1)),
							docExportFormatsError.value ? (openBlock(), createElementBlock("p", _hoisted_135, toDisplayString(docExportFormatsError.value), 1)) : createCommentVNode("", true)
						])]),
						_: 1
					}, 8, ["modelValue"]),
					createVNode(unref(component), {
						modelValue: docPreviewVisible.value,
						"onUpdate:modelValue": _cache[63] || (_cache[63] = ($event) => docPreviewVisible.value = $event),
						title: "数据库文档预览",
						width: "90%",
						height: "85%"
					}, {
						default: withCtx(() => [createBaseVNode("div", _hoisted_136, [docPreviewLoading.value ? (openBlock(), createElementBlock("div", _hoisted_137, [..._cache[220] || (_cache[220] = [createBaseVNode("span", null, "正在渲染文档…", -1)])])) : docPreviewError.value ? (openBlock(), createElementBlock("div", _hoisted_138, [
							createBaseVNode("p", null, "预览失败：" + toDisplayString(docPreviewError.value), 1),
							_cache[222] || (_cache[222] = createBaseVNode("p", { class: "dbm-doc-preview-hint" }, "word/pdf 格式不支持在线预览，请点「导出」下载后查看。", -1)),
							createVNode(unref(ReButton_default), {
								type: "primary",
								onClick: doDocumentExport
							}, {
								default: withCtx(() => [..._cache[221] || (_cache[221] = [createTextVNode("下载文档", -1)])]),
								_: 1
							})
						])) : docPreviewContent.value ? (openBlock(), createElementBlock("iframe", {
							key: 2,
							srcdoc: docPreviewContent.value,
							class: "dbm-doc-preview-iframe",
							sandbox: "allow-same-origin",
							title: "数据库文档预览"
						}, null, 8, _hoisted_139)) : createCommentVNode("", true)])]),
						_: 1
					}, 8, ["modelValue"]),
					createVNode(unref(component), {
						modelValue: columnViewDialogVisible.value,
						"onUpdate:modelValue": _cache[65] || (_cache[65] = ($event) => columnViewDialogVisible.value = $event),
						title: "列显示设置",
						width: "440px"
					}, {
						footer: withCtx(() => [
							createVNode(unref(ReButton_default), {
								type: "danger",
								plain: "",
								onClick: resetColumnViewSettings
							}, {
								default: withCtx(() => [..._cache[227] || (_cache[227] = [createTextVNode("恢复默认", -1)])]),
								_: 1
							}),
							createVNode(unref(ReButton_default), { onClick: _cache[64] || (_cache[64] = ($event) => columnViewDialogVisible.value = false) }, {
								default: withCtx(() => [..._cache[228] || (_cache[228] = [createTextVNode("取消", -1)])]),
								_: 1
							}),
							createVNode(unref(ReButton_default), {
								type: "primary",
								onClick: applyColumnViewSettings
							}, {
								default: withCtx(() => [..._cache[229] || (_cache[229] = [createTextVNode("应用", -1)])]),
								_: 1
							})
						]),
						default: withCtx(() => [createBaseVNode("div", _hoisted_140, [createBaseVNode("div", _hoisted_141, [
							_cache[224] || (_cache[224] = createBaseVNode("span", { class: "dbm-colset-hint" }, " 勾选 = 显示，📌 = 固定在左侧。偏好按「库.表」保存，只影响这张表。 ", -1)),
							_cache[225] || (_cache[225] = createBaseVNode("span", { class: "dbm-spacer" }, null, -1)),
							createVNode(unref(ReButton_default), {
								size: "small",
								onClick: setAllColumnsVisible
							}, {
								default: withCtx(() => [..._cache[223] || (_cache[223] = [createTextVNode("全部显示", -1)])]),
								_: 1
							})
						]), createBaseVNode("div", _hoisted_142, [(openBlock(true), createElementBlock(Fragment, null, renderList(columnViewDraft.value, (c) => {
							return openBlock(), createElementBlock("label", {
								key: c.name,
								class: normalizeClass(["dbm-colset-row", { hidden: !c.visible }])
							}, [
								withDirectives(createBaseVNode("input", {
									"onUpdate:modelValue": ($event) => c.visible = $event,
									type: "checkbox",
									class: "dbm-colset-check",
									"aria-label": `显示列 ${c.name}`
								}, null, 8, _hoisted_143), [[vModelCheckbox, c.visible]]),
								createBaseVNode("span", _hoisted_144, toDisplayString(headerLabel(c.name)), 1),
								_cache[226] || (_cache[226] = createBaseVNode("span", { class: "dbm-spacer" }, null, -1)),
								createBaseVNode("button", {
									type: "button",
									class: normalizeClass(["dbm-colset-pin", { on: c.pinned && c.visible }]),
									disabled: !c.visible,
									"aria-label": `${c.pinned && c.visible ? "取消固定" : "固定"}列 ${c.name}`,
									title: c.pinned && c.visible ? "取消固定" : "固定在左侧",
									onClick: withModifiers(($event) => c.pinned = !c.pinned, ["prevent"])
								}, "📌", 10, _hoisted_145)
							], 2);
						}), 128))])])]),
						_: 1
					}, 8, ["modelValue"]),
					createVNode(unref(component), {
						modelValue: blobVisible.value,
						"onUpdate:modelValue": _cache[70] || (_cache[70] = ($event) => blobVisible.value = $event),
						title: blobTitle.value,
						width: "760px"
					}, {
						footer: withCtx(() => [createVNode(unref(ReButton_default), { onClick: _cache[69] || (_cache[69] = ($event) => blobVisible.value = false) }, {
							default: withCtx(() => [..._cache[233] || (_cache[233] = [createTextVNode("关闭", -1)])]),
							_: 1
						}), blobEditing.value ? (openBlock(), createBlock(unref(ReButton_default), {
							key: 0,
							type: "primary",
							loading: blobSaving.value,
							onClick: saveBlob
						}, {
							default: withCtx(() => [..._cache[234] || (_cache[234] = [createTextVNode("保存", -1)])]),
							_: 1
						}, 8, ["loading"])) : createCommentVNode("", true)]),
						default: withCtx(() => [createBaseVNode("div", _hoisted_146, [
							createBaseVNode("div", _hoisted_147, [
								createBaseVNode("span", _hoisted_148, toDisplayString(blobMeta.value), 1),
								_cache[230] || (_cache[230] = createBaseVNode("span", { class: "dbm-spacer" }, null, -1)),
								createVNode(unref(ReButton_default), {
									layout: "square",
									icon: "DocumentCopy",
									tip: "复制为 base64",
									onClick: _cache[66] || (_cache[66] = ($event) => copyText(blobBase64.value))
								}),
								blobImageSrc.value ? (openBlock(), createBlock(unref(ReButton_default), {
									key: 0,
									layout: "square",
									icon: "Download",
									tip: "下载原始文件",
									onClick: downloadBlob
								})) : createCommentVNode("", true)
							]),
							createBaseVNode("div", _hoisted_149, [
								(openBlock(true), createElementBlock(Fragment, null, renderList(blobModes.value, (m) => {
									return openBlock(), createElementBlock("button", {
										key: m,
										type: "button",
										class: normalizeClass(["dbm-blob-tab", { active: blobMode.value === m }]),
										onClick: ($event) => blobMode.value = m
									}, toDisplayString(BLOB_MODE_LABELS[m]), 11, _hoisted_150);
								}), 128)),
								_cache[232] || (_cache[232] = createBaseVNode("span", { class: "dbm-spacer" }, null, -1)),
								createBaseVNode("label", _hoisted_151, [createVNode(ConsoleSwitch_default, {
									modelValue: blobEditing.value,
									"onUpdate:modelValue": _cache[67] || (_cache[67] = ($event) => blobEditing.value = $event),
									"aria-label": "编辑二进制内容"
								}, null, 8, ["modelValue"]), _cache[231] || (_cache[231] = createBaseVNode("span", null, "编辑", -1))])
							]),
							blobMode.value === "image" ? (openBlock(), createElementBlock("div", _hoisted_152, [blobImageSrc.value ? (openBlock(), createElementBlock("img", {
								key: 0,
								src: blobImageSrc.value,
								alt: "二进制内容预览"
							}, null, 8, _hoisted_153)) : (openBlock(), createBlock(unref(ReEmpty_default), {
								key: 1,
								description: "不是可识别的图片格式"
							}))])) : blobMode.value === "text" ? (openBlock(), createBlock(unref(ReInput_default), {
								key: 1,
								modelValue: blobText.value,
								"onUpdate:modelValue": _cache[68] || (_cache[68] = ($event) => blobText.value = $event),
								type: "textarea",
								rows: 16,
								class: "dbm-mono dbm-blob-text",
								readonly: !blobEditing.value
							}, null, 8, ["modelValue", "readonly"])) : (openBlock(), createElementBlock("pre", _hoisted_154, toDisplayString(blobHex.value), 1))
						])]),
						_: 1
					}, 8, ["modelValue", "title"]),
					createVNode(unref(component), {
						modelValue: filterDialogVisible.value,
						"onUpdate:modelValue": _cache[73] || (_cache[73] = ($event) => filterDialogVisible.value = $event),
						title: "高级筛选",
						width: "720px"
					}, {
						footer: withCtx(() => [
							createVNode(unref(ReButton_default), {
								icon: "Plus",
								"show-text": true,
								onClick: _cache[71] || (_cache[71] = ($event) => filterDraft.value.push({
									column: "",
									op: "=",
									value: "",
									value2: ""
								}))
							}, {
								default: withCtx(() => [..._cache[235] || (_cache[235] = [createTextVNode("添加条件", -1)])]),
								_: 1
							}),
							createVNode(unref(ReButton_default), { onClick: _cache[72] || (_cache[72] = ($event) => filterDialogVisible.value = false) }, {
								default: withCtx(() => [..._cache[236] || (_cache[236] = [createTextVNode("取消", -1)])]),
								_: 1
							}),
							createVNode(unref(ReButton_default), {
								type: "primary",
								onClick: applyAdvancedFilter
							}, {
								default: withCtx(() => [..._cache[237] || (_cache[237] = [createTextVNode("应用筛选", -1)])]),
								_: 1
							})
						]),
						default: withCtx(() => [createBaseVNode("div", _hoisted_155, [(openBlock(true), createElementBlock(Fragment, null, renderList(filterDraft.value, (row, i) => {
							return openBlock(), createElementBlock("div", {
								key: i,
								class: "dbm-filter-row",
								"data-filter-row": i
							}, [
								createVNode(unref(ReSelect_default), {
									modelValue: row.column,
									"onUpdate:modelValue": ($event) => row.column = $event,
									placeholder: "列",
									style: { "width": "190px" },
									filterable: ""
								}, {
									default: withCtx(() => [(openBlock(true), createElementBlock(Fragment, null, renderList(filterColumns.value, (c) => {
										return openBlock(), createBlock(unref(ReOption), {
											key: c.name,
											label: columnOptionLabel(c),
											value: c.name
										}, null, 8, ["label", "value"]);
									}), 128))]),
									_: 1
								}, 8, ["modelValue", "onUpdate:modelValue"]),
								createVNode(unref(ReSelect_default), {
									modelValue: row.op,
									"onUpdate:modelValue": ($event) => row.op = $event,
									placeholder: "运算符",
									style: { "width": "140px" }
								}, {
									default: withCtx(() => [(openBlock(true), createElementBlock(Fragment, null, renderList(unref(DB_FILTER_OPS), (o) => {
										return openBlock(), createBlock(unref(ReOption), {
											key: o,
											label: o,
											value: o
										}, null, 8, ["label", "value"]);
									}), 128))]),
									_: 1
								}, 8, ["modelValue", "onUpdate:modelValue"]),
								unref(dbFilterTakesNoValue)(row.op) ? (openBlock(), createElementBlock("span", _hoisted_157, "该运算符不需要值")) : (openBlock(), createElementBlock(Fragment, { key: 1 }, [createVNode(unref(ReInput_default), {
									modelValue: row.value,
									"onUpdate:modelValue": ($event) => row.value = $event,
									placeholder: unref(dbFilterTakesMultipleValues)(row.op) ? "多个值用逗号分隔" : "值",
									class: "dbm-mono"
								}, null, 8, [
									"modelValue",
									"onUpdate:modelValue",
									"placeholder"
								]), unref(dbFilterNeedsValue2)(row.op) ? (openBlock(), createBlock(unref(ReInput_default), {
									key: 0,
									modelValue: row.value2,
									"onUpdate:modelValue": ($event) => row.value2 = $event,
									placeholder: "上界",
									class: "dbm-mono"
								}, null, 8, ["modelValue", "onUpdate:modelValue"])) : createCommentVNode("", true)], 64)),
								createVNode(unref(ReButton_default), {
									layout: "square",
									type: "danger",
									plain: "",
									icon: "Delete",
									tip: "删除这一条条件",
									onClick: ($event) => filterDraft.value.splice(i, 1)
								}, null, 8, ["onClick"])
							], 8, _hoisted_156);
						}), 128)), filterDraft.value.length === 0 ? (openBlock(), createBlock(unref(ReEmpty_default), {
							key: 0,
							description: "还没有条件，点「添加条件」开始"
						})) : createCommentVNode("", true)])]),
						_: 1
					}, 8, ["modelValue"]),
					createVNode(CreateTableDialog_default, {
						modelValue: createTableVisible.value,
						"onUpdate:modelValue": _cache[74] || (_cache[74] = ($event) => createTableVisible.value = $event),
						database: newTableDatabase.value,
						"datasource-id": currentDatasourceId.value,
						onCreated: _cache[75] || (_cache[75] = (db) => loadTables(db))
					}, null, 8, [
						"modelValue",
						"database",
						"datasource-id"
					]),
					createVNode(unref(component), {
						modelValue: createDbVisible.value,
						"onUpdate:modelValue": _cache[80] || (_cache[80] = ($event) => createDbVisible.value = $event),
						title: "新建数据库",
						width: "480px"
					}, {
						footer: withCtx(() => [createVNode(unref(ReButton_default), { onClick: _cache[79] || (_cache[79] = ($event) => createDbVisible.value = false) }, {
							default: withCtx(() => [..._cache[241] || (_cache[241] = [createTextVNode("取消", -1)])]),
							_: 1
						}), createVNode(unref(ReButton_default), {
							type: "primary",
							loading: creatingDb.value,
							onClick: createDatabase
						}, {
							default: withCtx(() => [..._cache[242] || (_cache[242] = [createTextVNode("创建", -1)])]),
							_: 1
						}, 8, ["loading"])]),
						default: withCtx(() => [createBaseVNode("div", _hoisted_158, [
							createBaseVNode("div", _hoisted_159, [_cache[238] || (_cache[238] = createBaseVNode("label", null, "数据库名", -1)), createVNode(unref(ReInput_default), {
								modelValue: newDbName.value,
								"onUpdate:modelValue": _cache[76] || (_cache[76] = ($event) => newDbName.value = $event),
								placeholder: "请输入数据库名"
							}, null, 8, ["modelValue"])]),
							createBaseVNode("div", _hoisted_160, [_cache[239] || (_cache[239] = createBaseVNode("label", null, "字符集", -1)), createVNode(unref(ReSelect_default), {
								modelValue: newDbCharset.value,
								"onUpdate:modelValue": _cache[77] || (_cache[77] = ($event) => newDbCharset.value = $event),
								style: { "width": "100%" }
							}, {
								default: withCtx(() => [
									createVNode(unref(ReOption), {
										label: "utf8mb4",
										value: "utf8mb4"
									}),
									createVNode(unref(ReOption), {
										label: "utf8",
										value: "utf8"
									}),
									createVNode(unref(ReOption), {
										label: "gbk",
										value: "gbk"
									}),
									createVNode(unref(ReOption), {
										label: "latin1",
										value: "latin1"
									})
								]),
								_: 1
							}, 8, ["modelValue"])]),
							createBaseVNode("div", _hoisted_161, [_cache[240] || (_cache[240] = createBaseVNode("label", null, "排序规则", -1)), createVNode(unref(ReInput_default), {
								modelValue: newDbCollation.value,
								"onUpdate:modelValue": _cache[78] || (_cache[78] = ($event) => newDbCollation.value = $event),
								placeholder: "如 utf8mb4_general_ci"
							}, null, 8, ["modelValue"])])
						])]),
						_: 1
					}, 8, ["modelValue"]),
					createVNode(unref(component), {
						modelValue: importVisible.value,
						"onUpdate:modelValue": _cache[89] || (_cache[89] = ($event) => importVisible.value = $event),
						title: "导入向导",
						width: "920px"
					}, {
						footer: withCtx(() => [createVNode(unref(ReButton_default), { onClick: closeImportWizard }, {
							default: withCtx(() => [..._cache[262] || (_cache[262] = [createTextVNode("关闭", -1)])]),
							_: 1
						}), createVNode(unref(ReButton_default), {
							type: "primary",
							loading: importing.value,
							disabled: !importReady.value,
							onClick: doImportData
						}, {
							default: withCtx(() => [..._cache[263] || (_cache[263] = [createTextVNode("开始导入", -1)])]),
							_: 1
						}, 8, ["loading", "disabled"])]),
						default: withCtx(() => [createBaseVNode("div", _hoisted_162, [
							createBaseVNode("div", _hoisted_163, [
								_cache[243] || (_cache[243] = createBaseVNode("span", { class: "dbm-import-step-no" }, "1", -1)),
								_cache[244] || (_cache[244] = createBaseVNode("span", { class: "dbm-import-step-title" }, "选择文件", -1)),
								createVNode(unref(ReButton_default), {
									layout: "square",
									icon: "Upload",
									tip: importFile.value ? "重新选择文件" : "选择文件",
									onClick: _cache[81] || (_cache[81] = ($event) => importFileInput.value?.click())
								}, null, 8, ["tip"]),
								createBaseVNode("input", {
									ref_key: "importFileInput",
									ref: importFileInput,
									type: "file",
									class: "dbm-file-input",
									accept: ".csv,.tsv,.tab,.json,.sql,.txt",
									onChange: onImportFilePicked
								}, null, 544),
								importFile.value ? (openBlock(), createElementBlock("span", _hoisted_164, [createTextVNode(toDisplayString(importFile.value.name) + " ", 1), createBaseVNode("em", null, "（" + toDisplayString(importFile.value.size) + " 字节）", 1)])) : (openBlock(), createElementBlock("span", _hoisted_165, "支持 CSV / TSV / JSON 数组 / SQL 脚本"))
							]),
							createBaseVNode("div", _hoisted_166, [
								createBaseVNode("div", _hoisted_167, [_cache[245] || (_cache[245] = createBaseVNode("label", null, "格式", -1)), createVNode(unref(ReSelect_default), {
									modelValue: importFormat.value,
									"onUpdate:modelValue": _cache[82] || (_cache[82] = ($event) => importFormat.value = $event),
									style: { "width": "150px" }
								}, {
									default: withCtx(() => [
										createVNode(unref(ReOption), {
											label: "自动识别",
											value: "auto"
										}),
										createVNode(unref(ReOption), {
											label: "CSV",
											value: "csv"
										}),
										createVNode(unref(ReOption), {
											label: "TSV",
											value: "tsv"
										}),
										createVNode(unref(ReOption), {
											label: "JSON 数组",
											value: "json"
										}),
										createVNode(unref(ReOption), {
											label: "SQL 脚本",
											value: "sql"
										})
									]),
									_: 1
								}, 8, ["modelValue"])]),
								createBaseVNode("div", _hoisted_168, [_cache[246] || (_cache[246] = createBaseVNode("label", null, "首行是表头", -1)), createVNode(ConsoleSwitch_default, {
									modelValue: importHasHeader.value,
									"onUpdate:modelValue": _cache[83] || (_cache[83] = ($event) => importHasHeader.value = $event),
									"aria-label": "首行是表头",
									onChange: runImportPreview
								}, null, 8, ["modelValue"])]),
								createBaseVNode("div", _hoisted_169, [_cache[247] || (_cache[247] = createBaseVNode("label", null, "字符集", -1)), createVNode(unref(ReSelect_default), {
									modelValue: importEncoding.value,
									"onUpdate:modelValue": _cache[84] || (_cache[84] = ($event) => importEncoding.value = $event),
									style: { "width": "150px" }
								}, {
									default: withCtx(() => [
										createVNode(unref(ReOption), {
											label: "UTF-8",
											value: ""
										}),
										createVNode(unref(ReOption), {
											label: "GBK",
											value: "GBK"
										}),
										createVNode(unref(ReOption), {
											label: "GB18030",
											value: "GB18030"
										}),
										createVNode(unref(ReOption), {
											label: "ISO-8859-1",
											value: "ISO-8859-1"
										})
									]),
									_: 1
								}, 8, ["modelValue"])])
							]),
							_cache[261] || (_cache[261] = createBaseVNode("div", { class: "dbm-import-step" }, [createBaseVNode("span", { class: "dbm-import-step-no" }, "2"), createBaseVNode("span", { class: "dbm-import-step-title" }, "目标与字段映射")], -1)),
							createBaseVNode("div", _hoisted_170, [
								createBaseVNode("div", _hoisted_171, [
									_cache[248] || (_cache[248] = createBaseVNode("label", null, "目标表", -1)),
									createVNode(unref(ReSelect_default), {
										modelValue: importTableName.value,
										"onUpdate:modelValue": _cache[85] || (_cache[85] = ($event) => importTableName.value = $event),
										filterable: "",
										placeholder: "选择表",
										style: { "width": "240px" }
									}, {
										default: withCtx(() => [(openBlock(true), createElementBlock(Fragment, null, renderList(getTablesForDb(importDatabase.value), (t) => {
											return openBlock(), createBlock(unref(ReOption), {
												key: t.name,
												label: t.name,
												value: t.name
											}, null, 8, ["label", "value"]);
										}), 128))]),
										_: 1
									}, 8, ["modelValue"]),
									createBaseVNode("span", _hoisted_172, "库：" + toDisplayString(importDatabase.value), 1)
								]),
								createBaseVNode("div", _hoisted_173, [_cache[249] || (_cache[249] = createBaseVNode("label", null, "冲突策略", -1)), createVNode(unref(ReSelect_default), {
									modelValue: importConflict.value,
									"onUpdate:modelValue": _cache[86] || (_cache[86] = ($event) => importConflict.value = $event),
									style: { "width": "190px" }
								}, {
									default: withCtx(() => [createVNode(unref(ReOption), {
										label: "跳过冲突行",
										value: "skip"
									}), createVNode(unref(ReOption), {
										label: "替换冲突行",
										value: "replace"
									})]),
									_: 1
								}, 8, ["modelValue"])]),
								createBaseVNode("div", _hoisted_174, [_cache[250] || (_cache[250] = createBaseVNode("label", null, "每批行数", -1)), createVNode(unref(ReInputNumber_default), {
									modelValue: importBatchSize.value,
									"onUpdate:modelValue": _cache[87] || (_cache[87] = ($event) => importBatchSize.value = $event),
									min: 1,
									max: 5e3,
									"controls-position": "right",
									style: { "width": "120px" }
								}, null, 8, ["modelValue"])]),
								createBaseVNode("div", _hoisted_175, [
									_cache[251] || (_cache[251] = createBaseVNode("label", null, "导入前清空表", -1)),
									createVNode(ConsoleSwitch_default, {
										modelValue: importTruncate.value,
										"onUpdate:modelValue": _cache[88] || (_cache[88] = ($event) => importTruncate.value = $event),
										"aria-label": "导入前清空表"
									}, null, 8, ["modelValue"]),
									importTruncate.value ? (openBlock(), createElementBlock("span", _hoisted_176, "会删除目标表全部现有数据")) : createCommentVNode("", true)
								])
							]),
							importPreviewing.value ? (openBlock(), createElementBlock("div", _hoisted_177, "正在解析文件…")) : importPreview.value && importPreview.value.columns.length ? (openBlock(), createElementBlock("div", _hoisted_178, [
								createBaseVNode("div", _hoisted_179, [
									_cache[252] || (_cache[252] = createTextVNode(" 已解析 ", -1)),
									createBaseVNode("strong", null, toDisplayString(importPreview.value.rowCount), 1),
									_cache[253] || (_cache[253] = createTextVNode(" 行、 ", -1)),
									createBaseVNode("strong", null, toDisplayString(importPreview.value.columns.length), 1),
									_cache[254] || (_cache[254] = createTextVNode(" 列 ", -1)),
									createBaseVNode("span", _hoisted_180, "下方逐列配置映射，示例值取自前 " + toDisplayString(importPreview.value.rows.length) + " 行", 1),
									createVNode(unref(ReButton_default), {
										layout: "square",
										icon: "Refresh",
										tip: "重新解析文件",
										onClick: runImportPreview
									})
								]),
								createVNode(unref(ReTable_default), {
									data: importPreviewRows.value,
									columns: importPreviewColumns.value,
									pagination: false,
									stripe: "",
									border: "",
									"column-draggable": "",
									height: "240px"
								}, {
									"col-mapping": withCtx(({ row }) => [createBaseVNode("div", _hoisted_181, [
										createBaseVNode("span", _hoisted_182, toDisplayString(row.__src), 1),
										_cache[255] || (_cache[255] = createBaseVNode("span", { class: "dbm-mapping-arrow" }, "→", -1)),
										createVNode(unref(ReSelect_default), {
											modelValue: importMapping.value[row.__src],
											"onUpdate:modelValue": ($event) => importMapping.value[row.__src] = $event,
											size: "small",
											placeholder: "不导入",
											style: { "width": "130px" }
										}, {
											default: withCtx(() => [createVNode(unref(ReOption), {
												label: "（不导入）",
												value: ""
											}), (openBlock(true), createElementBlock(Fragment, null, renderList(importTargetColumns.value, (c) => {
												return openBlock(), createBlock(unref(ReOption), {
													key: c,
													label: c,
													value: c
												}, null, 8, ["label", "value"]);
											}), 128))]),
											_: 1
										}, 8, ["modelValue", "onUpdate:modelValue"])
									])]),
									_: 1
								}, 8, ["data", "columns"]),
								importMappingConflict.value ? (openBlock(), createElementBlock("div", _hoisted_183, "映射冲突：" + toDisplayString(importMappingConflict.value), 1)) : createCommentVNode("", true)
							])) : createCommentVNode("", true),
							importResult.value ? (openBlock(), createElementBlock("div", _hoisted_184, [createBaseVNode("div", _hoisted_185, [
								_cache[256] || (_cache[256] = createTextVNode(" 总行数 ", -1)),
								createBaseVNode("strong", null, toDisplayString(importResult.value.totalRows), 1),
								_cache[257] || (_cache[257] = createTextVNode("， 新增 ", -1)),
								createBaseVNode("strong", null, toDisplayString(importResult.value.inserted), 1),
								_cache[258] || (_cache[258] = createTextVNode("， 替换 ", -1)),
								createBaseVNode("strong", null, toDisplayString(importResult.value.replaced), 1),
								_cache[259] || (_cache[259] = createTextVNode("， 跳过 ", -1)),
								createBaseVNode("strong", null, toDisplayString(importResult.value.skipped), 1)
							]), importResult.value.errors.length ? (openBlock(), createElementBlock("div", _hoisted_186, [_cache[260] || (_cache[260] = createBaseVNode("div", { class: "dbm-import-errors-title" }, "错误明细（最多 50 条）", -1)), (openBlock(true), createElementBlock(Fragment, null, renderList(importResult.value.errors, (err, i) => {
								return openBlock(), createElementBlock("div", {
									key: i,
									class: "dbm-import-error"
								}, toDisplayString(err), 1);
							}), 128))])) : createCommentVNode("", true)])) : createCommentVNode("", true)
						])]),
						_: 1
					}, 8, ["modelValue"]),
					createVNode(unref(component), {
						modelValue: exportVisible.value,
						"onUpdate:modelValue": _cache[97] || (_cache[97] = ($event) => exportVisible.value = $event),
						title: "导出向导",
						width: "560px"
					}, {
						footer: withCtx(() => [createVNode(unref(ReButton_default), { onClick: _cache[96] || (_cache[96] = ($event) => exportVisible.value = false) }, {
							default: withCtx(() => [..._cache[271] || (_cache[271] = [createTextVNode("取消", -1)])]),
							_: 1
						}), createVNode(unref(ReButton_default), {
							type: "primary",
							loading: exporting.value,
							onClick: doExport
						}, {
							default: withCtx(() => [..._cache[272] || (_cache[272] = [createTextVNode("导出并下载", -1)])]),
							_: 1
						}, 8, ["loading"])]),
						default: withCtx(() => [createBaseVNode("div", _hoisted_187, [
							createBaseVNode("div", _hoisted_188, [_cache[264] || (_cache[264] = createBaseVNode("label", null, "目标表", -1)), createVNode(unref(ReInput_default), {
								"model-value": `${exportDatabase.value}.${exportTable.value}`,
								disabled: ""
							}, null, 8, ["model-value"])]),
							createBaseVNode("div", _hoisted_189, [_cache[265] || (_cache[265] = createBaseVNode("label", null, "文件格式", -1)), createVNode(unref(ReSelect_default), {
								modelValue: exportFormat.value,
								"onUpdate:modelValue": _cache[90] || (_cache[90] = ($event) => exportFormat.value = $event),
								style: { "width": "100%" }
							}, {
								default: withCtx(() => [
									createVNode(unref(ReOption), {
										label: "CSV（逗号分隔，Excel 友好）",
										value: "csv"
									}),
									createVNode(unref(ReOption), {
										label: "TSV（制表符分隔）",
										value: "tsv"
									}),
									createVNode(unref(ReOption), {
										label: "JSON 数组",
										value: "json"
									}),
									createVNode(unref(ReOption), {
										label: "XML",
										value: "xml"
									}),
									createVNode(unref(ReOption), {
										label: "SQL 脚本（可回灌）",
										value: "sql"
									})
								]),
								_: 1
							}, 8, ["modelValue"])]),
							createBaseVNode("div", _hoisted_190, [_cache[266] || (_cache[266] = createBaseVNode("label", null, "导出范围", -1)), createVNode(unref(ReSelect_default), {
								modelValue: exportScope.value,
								"onUpdate:modelValue": _cache[91] || (_cache[91] = ($event) => exportScope.value = $event),
								style: { "width": "100%" }
							}, {
								default: withCtx(() => [
									createVNode(unref(ReOption), {
										label: "仅数据",
										value: "data"
									}),
									createVNode(unref(ReOption), {
										label: "仅结构（建表语句）",
										value: "structure"
									}),
									createVNode(unref(ReOption), {
										label: "结构 + 数据",
										value: "all"
									})
								]),
								_: 1
							}, 8, ["modelValue"])]),
							exportScope.value !== "structure" ? (openBlock(), createElementBlock("div", _hoisted_191, [
								_cache[267] || (_cache[267] = createBaseVNode("label", null, "行数上限", -1)),
								createVNode(unref(ReInputNumber_default), {
									modelValue: exportLimit.value,
									"onUpdate:modelValue": _cache[92] || (_cache[92] = ($event) => exportLimit.value = $event),
									min: 1,
									max: 2e5,
									"controls-position": "right",
									style: { "width": "160px" }
								}, null, 8, ["modelValue"]),
								_cache[268] || (_cache[268] = createBaseVNode("span", { class: "dbm-hint" }, "后端硬上限 200000", -1))
							])) : createCommentVNode("", true),
							exportScope.value !== "structure" ? (openBlock(), createElementBlock("div", _hoisted_192, [_cache[269] || (_cache[269] = createBaseVNode("label", null, "WHERE 过滤", -1)), createVNode(unref(ReInput_default), {
								modelValue: exportWhere.value,
								"onUpdate:modelValue": _cache[93] || (_cache[93] = ($event) => exportWhere.value = $event),
								class: "dbm-mono",
								placeholder: "留空导出全部；例：status = 1",
								clearable: ""
							}, null, 8, ["modelValue"])])) : createCommentVNode("", true),
							exportScope.value !== "structure" ? (openBlock(), createElementBlock("div", _hoisted_193, [
								_cache[270] || (_cache[270] = createBaseVNode("label", null, "排序", -1)),
								createVNode(unref(ReSelect_default), {
									modelValue: exportOrderBy.value,
									"onUpdate:modelValue": _cache[94] || (_cache[94] = ($event) => exportOrderBy.value = $event),
									filterable: "",
									clearable: "",
									placeholder: "不排序",
									style: { "width": "190px" }
								}, {
									default: withCtx(() => [(openBlock(true), createElementBlock(Fragment, null, renderList(importTargetColumns.value, (c) => {
										return openBlock(), createBlock(unref(ReOption), {
											key: c,
											label: c,
											value: c
										}, null, 8, ["label", "value"]);
									}), 128))]),
									_: 1
								}, 8, ["modelValue"]),
								createVNode(unref(ReSelect_default), {
									modelValue: exportOrderDir.value,
									"onUpdate:modelValue": _cache[95] || (_cache[95] = ($event) => exportOrderDir.value = $event),
									style: { "width": "100px" }
								}, {
									default: withCtx(() => [createVNode(unref(ReOption), {
										label: "升序",
										value: "ASC"
									}), createVNode(unref(ReOption), {
										label: "降序",
										value: "DESC"
									})]),
									_: 1
								}, 8, ["modelValue"])
							])) : createCommentVNode("", true),
							exportFormat.value !== "sql" && exportScope.value === "structure" ? (openBlock(), createElementBlock("div", _hoisted_194, " 结构只有建表语句，请选 SQL 格式 ")) : createCommentVNode("", true)
						])]),
						_: 1
					}, 8, ["modelValue"]),
					createVNode(unref(component), {
						modelValue: fkDialogVisible.value,
						"onUpdate:modelValue": _cache[105] || (_cache[105] = ($event) => fkDialogVisible.value = $event),
						title: "新增外键",
						width: "560px"
					}, {
						footer: withCtx(() => [createVNode(unref(ReButton_default), { onClick: _cache[104] || (_cache[104] = ($event) => fkDialogVisible.value = false) }, {
							default: withCtx(() => [..._cache[279] || (_cache[279] = [createTextVNode("取消", -1)])]),
							_: 1
						}), createVNode(unref(ReButton_default), {
							type: "primary",
							loading: fkSaving.value,
							onClick: submitAddForeignKey
						}, {
							default: withCtx(() => [..._cache[280] || (_cache[280] = [createTextVNode("创建", -1)])]),
							_: 1
						}, 8, ["loading"])]),
						default: withCtx(() => [createBaseVNode("div", _hoisted_195, [
							createBaseVNode("div", _hoisted_196, [_cache[273] || (_cache[273] = createBaseVNode("label", null, "约束名", -1)), createVNode(unref(ReInput_default), {
								modelValue: fkForm.name,
								"onUpdate:modelValue": _cache[98] || (_cache[98] = ($event) => fkForm.name = $event),
								class: "dbm-mono",
								placeholder: "例：fk_child_parent"
							}, null, 8, ["modelValue"])]),
							createBaseVNode("div", _hoisted_197, [_cache[274] || (_cache[274] = createBaseVNode("label", null, "本表列", -1)), createVNode(unref(ReSelect_default), {
								modelValue: fkForm.column,
								"onUpdate:modelValue": _cache[99] || (_cache[99] = ($event) => fkForm.column = $event),
								filterable: "",
								placeholder: "选择列",
								style: { "width": "100%" }
							}, {
								default: withCtx(() => [(openBlock(true), createElementBlock(Fragment, null, renderList(designTableColumns(), (c) => {
									return openBlock(), createBlock(unref(ReOption), {
										key: c.name,
										label: `${c.name} (${c.type})`,
										value: c.name
									}, null, 8, ["label", "value"]);
								}), 128))]),
								_: 1
							}, 8, ["modelValue"])]),
							createBaseVNode("div", _hoisted_198, [_cache[275] || (_cache[275] = createBaseVNode("label", null, "引用表", -1)), createVNode(unref(ReSelect_default), {
								modelValue: fkForm.refTable,
								"onUpdate:modelValue": _cache[100] || (_cache[100] = ($event) => fkForm.refTable = $event),
								filterable: "",
								placeholder: "选择表",
								style: { "width": "100%" }
							}, {
								default: withCtx(() => [(openBlock(true), createElementBlock(Fragment, null, renderList(tablesOf(activeTabObj.value?.database ?? ""), (t) => {
									return openBlock(), createBlock(unref(ReOption), {
										key: t.name,
										label: t.name,
										value: t.name
									}, null, 8, ["label", "value"]);
								}), 128))]),
								_: 1
							}, 8, ["modelValue"])]),
							createBaseVNode("div", _hoisted_199, [_cache[276] || (_cache[276] = createBaseVNode("label", null, "引用列", -1)), createVNode(unref(ReSelect_default), {
								modelValue: fkForm.refColumn,
								"onUpdate:modelValue": _cache[101] || (_cache[101] = ($event) => fkForm.refColumn = $event),
								filterable: "",
								placeholder: "选择列",
								style: { "width": "100%" }
							}, {
								default: withCtx(() => [(openBlock(true), createElementBlock(Fragment, null, renderList(fkRefColumns.value, (c) => {
									return openBlock(), createBlock(unref(ReOption), {
										key: c.name,
										label: `${c.name} (${c.type})`,
										value: c.name
									}, null, 8, ["label", "value"]);
								}), 128))]),
								_: 1
							}, 8, ["modelValue"])]),
							createBaseVNode("div", _hoisted_200, [_cache[277] || (_cache[277] = createBaseVNode("label", null, "ON UPDATE", -1)), createVNode(unref(ReSelect_default), {
								modelValue: fkForm.onUpdate,
								"onUpdate:modelValue": _cache[102] || (_cache[102] = ($event) => fkForm.onUpdate = $event),
								style: { "width": "100%" }
							}, {
								default: withCtx(() => [(openBlock(), createElementBlock(Fragment, null, renderList(FK_ACTIONS, (a) => {
									return createVNode(unref(ReOption), {
										key: "u" + a,
										label: a,
										value: a
									}, null, 8, ["label", "value"]);
								}), 64))]),
								_: 1
							}, 8, ["modelValue"])]),
							createBaseVNode("div", _hoisted_201, [_cache[278] || (_cache[278] = createBaseVNode("label", null, "ON DELETE", -1)), createVNode(unref(ReSelect_default), {
								modelValue: fkForm.onDelete,
								"onUpdate:modelValue": _cache[103] || (_cache[103] = ($event) => fkForm.onDelete = $event),
								style: { "width": "100%" }
							}, {
								default: withCtx(() => [(openBlock(), createElementBlock(Fragment, null, renderList(FK_ACTIONS, (a) => {
									return createVNode(unref(ReOption), {
										key: "d" + a,
										label: a,
										value: a
									}, null, 8, ["label", "value"]);
								}), 64))]),
								_: 1
							}, 8, ["modelValue"])])
						])]),
						_: 1
					}, 8, ["modelValue"])
				], 2),
				createVNode(unref(component), {
					modelValue: rowDialogVisible.value,
					"onUpdate:modelValue": _cache[107] || (_cache[107] = ($event) => rowDialogVisible.value = $event),
					title: rowDialogMode.value === "edit" ? "编辑行" : "新增行",
					width: "600px"
				}, {
					footer: withCtx(() => [createVNode(unref(ReButton_default), { onClick: _cache[106] || (_cache[106] = ($event) => rowDialogVisible.value = false) }, {
						default: withCtx(() => [..._cache[281] || (_cache[281] = [createTextVNode("取消", -1)])]),
						_: 1
					}), createVNode(unref(ReButton_default), {
						type: "primary",
						loading: rowSaving.value,
						onClick: saveRow
					}, {
						default: withCtx(() => [..._cache[282] || (_cache[282] = [createTextVNode("保存", -1)])]),
						_: 1
					}, 8, ["loading"])]),
					default: withCtx(() => [createVNode(unref(ReForm_default), { "label-width": "120px" }, {
						default: withCtx(() => [(openBlock(true), createElementBlock(Fragment, null, renderList(tableData.columns, (col) => {
							return openBlock(), createBlock(unref(ReFormItem), {
								key: col,
								label: col
							}, {
								default: withCtx(() => [rowDialogMode.value === "add" && isAutoIncrement(col) ? (openBlock(), createElementBlock("span", _hoisted_202, "自增，留空自动生成")) : isNumericCol(col) ? (openBlock(), createBlock(unref(ReInputNumber_default), {
									key: 1,
									modelValue: rowForm.value[col],
									"onUpdate:modelValue": ($event) => rowForm.value[col] = $event,
									placeholder: `输入 ${col}`,
									style: { "width": "100%" }
								}, null, 8, [
									"modelValue",
									"onUpdate:modelValue",
									"placeholder"
								])) : isDateCol(col) ? (openBlock(), createBlock(unref(ReInput_default), {
									key: 2,
									modelValue: rowForm.value[col],
									"onUpdate:modelValue": ($event) => rowForm.value[col] = $event,
									type: "date",
									placeholder: `输入 ${col}`
								}, null, 8, [
									"modelValue",
									"onUpdate:modelValue",
									"placeholder"
								])) : longTextColumns.value.has(col) ? (openBlock(), createBlock(unref(ReInput_default), {
									key: 3,
									modelValue: rowForm.value[col],
									"onUpdate:modelValue": ($event) => rowForm.value[col] = $event,
									type: "textarea",
									rows: 3,
									placeholder: `输入 ${col}`
								}, null, 8, [
									"modelValue",
									"onUpdate:modelValue",
									"placeholder"
								])) : (openBlock(), createBlock(unref(ReInput_default), {
									key: 4,
									modelValue: rowForm.value[col],
									"onUpdate:modelValue": ($event) => rowForm.value[col] = $event,
									placeholder: `输入 ${col}`
								}, null, 8, [
									"modelValue",
									"onUpdate:modelValue",
									"placeholder"
								]))]),
								_: 2
							}, 1032, ["label"]);
						}), 128))]),
						_: 1
					})]),
					_: 1
				}, 8, ["modelValue", "title"]),
				createVNode(unref(component), {
					modelValue: columnDialogVisible.value,
					"onUpdate:modelValue": _cache[123] || (_cache[123] = ($event) => columnDialogVisible.value = $event),
					title: columnDialogMode.value === "add" ? "新增列" : "修改列",
					width: "640px"
				}, {
					footer: withCtx(() => [createVNode(unref(ReButton_default), { onClick: _cache[122] || (_cache[122] = ($event) => columnDialogVisible.value = false) }, {
						default: withCtx(() => [..._cache[296] || (_cache[296] = [createTextVNode("取消", -1)])]),
						_: 1
					}), createVNode(unref(ReButton_default), {
						type: "primary",
						onClick: saveColumn
					}, {
						default: withCtx(() => [..._cache[297] || (_cache[297] = [createTextVNode("保存", -1)])]),
						_: 1
					})]),
					default: withCtx(() => [createBaseVNode("div", _hoisted_203, [
						createBaseVNode("div", _hoisted_204, [_cache[283] || (_cache[283] = createBaseVNode("label", null, "列名", -1)), createVNode(unref(ReInput_default), {
							modelValue: columnForm.columnName,
							"onUpdate:modelValue": _cache[108] || (_cache[108] = ($event) => columnForm.columnName = $event),
							disabled: columnDialogMode.value === "edit",
							placeholder: "请输入列名"
						}, null, 8, ["modelValue", "disabled"])]),
						createBaseVNode("div", _hoisted_205, [_cache[284] || (_cache[284] = createBaseVNode("label", null, "类型", -1)), createVNode(unref(ReSelect_default), {
							modelValue: columnForm.type,
							"onUpdate:modelValue": _cache[109] || (_cache[109] = ($event) => columnForm.type = $event),
							filterable: "",
							options: columnTypeSelectOptions.value
						}, null, 8, ["modelValue", "options"])]),
						columnNeedsSize.value ? (openBlock(), createElementBlock("div", _hoisted_206, [_cache[285] || (_cache[285] = createBaseVNode("label", null, "长度", -1)), createVNode(unref(ReInputNumber_default), {
							modelValue: columnForm.size,
							"onUpdate:modelValue": _cache[110] || (_cache[110] = ($event) => columnForm.size = $event),
							min: 1,
							max: 65535,
							"controls-position": "right"
						}, null, 8, ["modelValue"])])) : createCommentVNode("", true),
						columnAllowsScale.value ? (openBlock(), createElementBlock("div", _hoisted_207, [_cache[286] || (_cache[286] = createBaseVNode("label", null, "小数位", -1)), createVNode(unref(ReInputNumber_default), {
							modelValue: columnForm.scale,
							"onUpdate:modelValue": _cache[111] || (_cache[111] = ($event) => columnForm.scale = $event),
							min: 0,
							max: 30,
							"controls-position": "right"
						}, null, 8, ["modelValue"])])) : createCommentVNode("", true),
						columnAllowsUnsigned.value ? (openBlock(), createElementBlock("div", _hoisted_208, [_cache[287] || (_cache[287] = createBaseVNode("label", null, "无符号", -1)), createVNode(ConsoleSwitch_default, {
							modelValue: columnForm.unsigned,
							"onUpdate:modelValue": _cache[112] || (_cache[112] = ($event) => columnForm.unsigned = $event),
							"aria-label": "无符号"
						}, null, 8, ["modelValue"])])) : createCommentVNode("", true),
						columnForm.unsigned && columnForm.type !== "FLOAT" && columnForm.type !== "DOUBLE" ? (openBlock(), createElementBlock("div", _hoisted_209, [_cache[288] || (_cache[288] = createBaseVNode("label", null, "补零", -1)), createVNode(ConsoleSwitch_default, {
							modelValue: columnForm.zerofill,
							"onUpdate:modelValue": _cache[113] || (_cache[113] = ($event) => columnForm.zerofill = $event),
							"aria-label": "补零"
						}, null, 8, ["modelValue"])])) : createCommentVNode("", true),
						columnIsEnum.value ? (openBlock(), createElementBlock("div", _hoisted_210, [createBaseVNode("label", null, toDisplayString(columnForm.type === "SET" ? "集合取值" : "枚举取值"), 1), createVNode(unref(ReInput_default), {
							modelValue: columnForm.enumValues,
							"onUpdate:modelValue": _cache[114] || (_cache[114] = ($event) => columnForm.enumValues = $event),
							type: "textarea",
							rows: 3,
							placeholder: "每行一个取值，也可用逗号分隔。例：待审\n通过\n驳回"
						}, null, 8, ["modelValue"])])) : createCommentVNode("", true),
						columnIsChar.value ? (openBlock(), createElementBlock(Fragment, { key: 5 }, [createBaseVNode("div", _hoisted_211, [_cache[289] || (_cache[289] = createBaseVNode("label", null, "字符集", -1)), createVNode(unref(ReSelect_default), {
							modelValue: columnForm.charset,
							"onUpdate:modelValue": [_cache[115] || (_cache[115] = ($event) => columnForm.charset = $event), onColumnCharsetChange],
							filterable: "",
							clearable: "",
							placeholder: "留空则跟随表",
							options: charsetOptions.value
						}, null, 8, ["modelValue", "options"])]), createBaseVNode("div", _hoisted_212, [_cache[290] || (_cache[290] = createBaseVNode("label", null, "排序规则", -1)), createVNode(unref(ReSelect_default), {
							modelValue: columnForm.collation,
							"onUpdate:modelValue": _cache[116] || (_cache[116] = ($event) => columnForm.collation = $event),
							filterable: "",
							clearable: "",
							placeholder: "留空则跟随表",
							options: columnCollationOptions.value.map((c) => ({
								label: c.collation,
								value: c.collation
							}))
						}, null, 8, ["modelValue", "options"])])], 64)) : createCommentVNode("", true),
						createBaseVNode("div", _hoisted_213, [_cache[291] || (_cache[291] = createBaseVNode("label", null, "可空", -1)), createVNode(ConsoleSwitch_default, {
							modelValue: columnForm.nullable,
							"onUpdate:modelValue": _cache[117] || (_cache[117] = ($event) => columnForm.nullable = $event),
							"aria-label": "可空"
						}, null, 8, ["modelValue"])]),
						columnAllowsUnsigned.value ? (openBlock(), createElementBlock("div", _hoisted_214, [_cache[292] || (_cache[292] = createBaseVNode("label", null, "自动递增", -1)), createVNode(ConsoleSwitch_default, {
							modelValue: columnForm.autoIncrement,
							"onUpdate:modelValue": _cache[118] || (_cache[118] = ($event) => columnForm.autoIncrement = $event),
							"aria-label": "自动递增"
						}, null, 8, ["modelValue"])])) : createCommentVNode("", true),
						createBaseVNode("div", _hoisted_215, [_cache[293] || (_cache[293] = createBaseVNode("label", null, "默认值", -1)), createVNode(unref(ReInput_default), {
							modelValue: columnForm.defaultValue,
							"onUpdate:modelValue": _cache[119] || (_cache[119] = ($event) => columnForm.defaultValue = $event),
							placeholder: "留空则不设置默认值"
						}, null, 8, ["modelValue"])]),
						/DATE|TIME/.test(columnForm.type) ? (openBlock(), createElementBlock("div", _hoisted_216, [_cache[294] || (_cache[294] = createBaseVNode("label", null, "自动更新", -1)), createVNode(unref(ReSelect_default), {
							modelValue: columnForm.onUpdate,
							"onUpdate:modelValue": _cache[120] || (_cache[120] = ($event) => columnForm.onUpdate = $event),
							options: unref(onUpdateOptions)
						}, null, 8, ["modelValue", "options"])])) : createCommentVNode("", true),
						createBaseVNode("div", _hoisted_217, [_cache[295] || (_cache[295] = createBaseVNode("label", null, "注释", -1)), createVNode(unref(ReInput_default), {
							modelValue: columnForm.comment,
							"onUpdate:modelValue": _cache[121] || (_cache[121] = ($event) => columnForm.comment = $event),
							placeholder: "列注释（可选）"
						}, null, 8, ["modelValue"])])
					])]),
					_: 1
				}, 8, ["modelValue", "title"]),
				createVNode(unref(component), {
					modelValue: indexDialogVisible.value,
					"onUpdate:modelValue": _cache[130] || (_cache[130] = ($event) => indexDialogVisible.value = $event),
					title: "新建索引",
					width: "600px"
				}, {
					footer: withCtx(() => [createVNode(unref(ReButton_default), { onClick: _cache[129] || (_cache[129] = ($event) => indexDialogVisible.value = false) }, {
						default: withCtx(() => [..._cache[306] || (_cache[306] = [createTextVNode("取消", -1)])]),
						_: 1
					}), createVNode(unref(ReButton_default), {
						type: "primary",
						onClick: saveIndex
					}, {
						default: withCtx(() => [createTextVNode(toDisplayString(indexForm.primary ? "设为主键" : "创建"), 1)]),
						_: 1
					})]),
					default: withCtx(() => [createBaseVNode("div", _hoisted_218, [
						!indexForm.primary ? (openBlock(), createElementBlock("div", _hoisted_219, [_cache[298] || (_cache[298] = createBaseVNode("label", null, "索引名", -1)), createVNode(unref(ReInput_default), {
							modelValue: indexForm.indexName,
							"onUpdate:modelValue": _cache[124] || (_cache[124] = ($event) => indexForm.indexName = $event),
							placeholder: "请输入索引名"
						}, null, 8, ["modelValue"])])) : createCommentVNode("", true),
						createBaseVNode("div", _hoisted_220, [_cache[299] || (_cache[299] = createBaseVNode("label", null, "索引类型", -1)), createVNode(unref(ReSelect_default), {
							modelValue: indexForm.indexType,
							"onUpdate:modelValue": _cache[125] || (_cache[125] = ($event) => indexForm.indexType = $event),
							options: unref(indexTypeOptions)
						}, null, 8, ["modelValue", "options"])]),
						createBaseVNode("div", _hoisted_221, [_cache[301] || (_cache[301] = createBaseVNode("label", null, "索引列", -1)), createBaseVNode("div", _hoisted_222, [createVNode(unref(ReSelect_default), {
							modelValue: indexForm.columns,
							"onUpdate:modelValue": _cache[126] || (_cache[126] = ($event) => indexForm.columns = $event),
							multiple: "",
							placeholder: "可多选；选择顺序即复合索引的列序",
							options: designColumnOptions.value
						}, null, 8, ["modelValue", "options"]), indexForm.columns.length > 1 ? (openBlock(), createElementBlock("div", _hoisted_223, [_cache[300] || (_cache[300] = createBaseVNode("span", { class: "dbm-idx-order-label" }, "列序", -1)), (openBlock(true), createElementBlock(Fragment, null, renderList(indexForm.columns, (c, i) => {
							return openBlock(), createElementBlock("span", {
								key: c,
								class: "dbm-idx-order-item"
							}, [
								createBaseVNode("span", _hoisted_224, toDisplayString(i + 1), 1),
								createTextVNode(toDisplayString(c) + " ", 1),
								createBaseVNode("button", {
									type: "button",
									class: "dbm-idx-order-move",
									"aria-label": "把该列上移",
									disabled: i === 0,
									onClick: ($event) => moveIndexColumn(i, -1)
								}, [createVNode(unref(component$1), {
									name: "ArrowUp",
									size: 11
								})], 8, _hoisted_225),
								createBaseVNode("button", {
									type: "button",
									class: "dbm-idx-order-move",
									"aria-label": "把该列下移",
									disabled: i === indexForm.columns.length - 1,
									onClick: ($event) => moveIndexColumn(i, 1)
								}, [createVNode(unref(component$1), {
									name: "ArrowDown",
									size: 11
								})], 8, _hoisted_226)
							]);
						}), 128))])) : createCommentVNode("", true)])]),
						indexForm.columns.length > 0 ? (openBlock(), createElementBlock("div", _hoisted_227, [_cache[303] || (_cache[303] = createBaseVNode("label", null, "前缀长度", -1)), createBaseVNode("div", _hoisted_228, [(openBlock(true), createElementBlock(Fragment, null, renderList(indexForm.columns, (c, i) => {
							return openBlock(), createElementBlock("div", {
								key: c,
								class: "dbm-idx-prefix-row"
							}, [
								createBaseVNode("span", _hoisted_229, toDisplayString(i + 1), 1),
								createBaseVNode("span", _hoisted_230, toDisplayString(c), 1),
								createVNode(unref(ReInputNumber_default), {
									modelValue: indexForm.prefixes[i],
									"onUpdate:modelValue": ($event) => indexForm.prefixes[i] = $event,
									min: 0,
									max: 3072,
									size: "small",
									"controls-position": "right"
								}, null, 8, ["modelValue", "onUpdate:modelValue"])
							]);
						}), 128)), _cache[302] || (_cache[302] = createBaseVNode("span", { class: "dbm-hint" }, "0 表示整列（仅字符 / 二进制列可用前缀）", -1))])])) : createCommentVNode("", true),
						!indexForm.primary ? (openBlock(), createElementBlock("div", _hoisted_231, [_cache[304] || (_cache[304] = createBaseVNode("label", null, "唯一索引", -1)), createVNode(ConsoleSwitch_default, {
							modelValue: indexForm.unique,
							"onUpdate:modelValue": _cache[127] || (_cache[127] = ($event) => indexForm.unique = $event),
							"aria-label": "唯一索引"
						}, null, 8, ["modelValue"])])) : createCommentVNode("", true),
						createBaseVNode("div", _hoisted_232, [_cache[305] || (_cache[305] = createBaseVNode("label", null, "设为主键", -1)), createVNode(ConsoleSwitch_default, {
							modelValue: indexForm.primary,
							"onUpdate:modelValue": _cache[128] || (_cache[128] = ($event) => indexForm.primary = $event),
							"aria-label": "设为主键"
						}, null, 8, ["modelValue"])])
					])]),
					_: 1
				}, 8, ["modelValue"]),
				createVNode(unref(component), {
					modelValue: paramDialogVisible.value,
					"onUpdate:modelValue": _cache[132] || (_cache[132] = ($event) => paramDialogVisible.value = $event),
					title: "查询参数",
					width: "520px"
				}, {
					footer: withCtx(() => [createVNode(unref(ReButton_default), { onClick: _cache[131] || (_cache[131] = ($event) => paramDialogVisible.value = false) }, {
						default: withCtx(() => [..._cache[308] || (_cache[308] = [createTextVNode("取消", -1)])]),
						_: 1
					}), createVNode(unref(ReButton_default), {
						type: "primary",
						onClick: runWithParams
					}, {
						default: withCtx(() => [..._cache[309] || (_cache[309] = [createTextVNode("执行", -1)])]),
						_: 1
					})]),
					default: withCtx(() => [createBaseVNode("div", _hoisted_233, [paramNames.value.length === 0 ? (openBlock(), createElementBlock("div", _hoisted_234, [..._cache[307] || (_cache[307] = [
						createTextVNode(" 当前脚本里没有 ", -1),
						createBaseVNode("code", null, "${name}", -1),
						createTextVNode(" 形式的占位符，无需填参数。 ", -1)
					])])) : createCommentVNode("", true), (openBlock(true), createElementBlock(Fragment, null, renderList(paramNames.value, (name) => {
						return openBlock(), createElementBlock("div", {
							key: name,
							class: "dbm-form-item dbm-params-row",
							"data-param-name": name
						}, [createBaseVNode("label", null, toDisplayString(name), 1), createVNode(unref(ReInput_default), {
							modelValue: paramValues[name],
							"onUpdate:modelValue": ($event) => paramValues[name] = $event,
							placeholder: "${" + name + "}"
						}, null, 8, [
							"modelValue",
							"onUpdate:modelValue",
							"placeholder"
						])], 8, _hoisted_235);
					}), 128))])]),
					_: 1
				}, 8, ["modelValue"]),
				createVNode(unref(component), {
					modelValue: aiDialogVisible.value,
					"onUpdate:modelValue": _cache[135] || (_cache[135] = ($event) => aiDialogVisible.value = $event),
					title: "AI 生成 SQL",
					width: "640px"
				}, {
					footer: withCtx(() => [
						createVNode(unref(ReButton_default), {
							loading: aiBusy.value,
							type: "primary",
							onClick: generateAiSql
						}, {
							default: withCtx(() => [..._cache[310] || (_cache[310] = [createTextVNode("生成 SQL", -1)])]),
							_: 1
						}, 8, ["loading"]),
						aiSql.value ? (openBlock(), createBlock(unref(ReButton_default), {
							key: 0,
							type: "success",
							onClick: applyAiSql
						}, {
							default: withCtx(() => [..._cache[311] || (_cache[311] = [createTextVNode("应用到编辑器", -1)])]),
							_: 1
						})) : createCommentVNode("", true),
						createVNode(unref(ReButton_default), { onClick: _cache[134] || (_cache[134] = ($event) => aiDialogVisible.value = false) }, {
							default: withCtx(() => [..._cache[312] || (_cache[312] = [createTextVNode("关闭", -1)])]),
							_: 1
						})
					]),
					default: withCtx(() => [createBaseVNode("div", _hoisted_236, [
						createVNode(unref(ReInput_default), {
							modelValue: aiPrompt.value,
							"onUpdate:modelValue": _cache[133] || (_cache[133] = ($event) => aiPrompt.value = $event),
							type: "textarea",
							rows: 4,
							placeholder: "用自然语言描述要查的数据，例如：查每张表的行数"
						}, null, 8, ["modelValue"]),
						createBaseVNode("div", _hoisted_237, [createBaseVNode("span", null, "模型：" + toDisplayString(dbAi.value.model || "未识别"), 1), aiContextHint.value ? (openBlock(), createElementBlock("span", {
							key: 0,
							class: "dbm-ai-ctx",
							title: aiContextHint.value
						}, "结构上下文：" + toDisplayString(aiContextHint.value), 9, _hoisted_238)) : createCommentVNode("", true)]),
						aiSql.value ? (openBlock(), createElementBlock("pre", _hoisted_239, toDisplayString(aiSql.value), 1)) : createCommentVNode("", true)
					])]),
					_: 1
				}, 8, ["modelValue"]),
				createVNode(unref(component), {
					modelValue: optionsDialogVisible.value,
					"onUpdate:modelValue": _cache[142] || (_cache[142] = ($event) => optionsDialogVisible.value = $event),
					title: "表属性",
					width: "560px"
				}, {
					footer: withCtx(() => [createVNode(unref(ReButton_default), { onClick: _cache[141] || (_cache[141] = ($event) => optionsDialogVisible.value = false) }, {
						default: withCtx(() => [..._cache[318] || (_cache[318] = [createTextVNode("取消", -1)])]),
						_: 1
					}), createVNode(unref(ReButton_default), {
						type: "primary",
						loading: optionsSaving.value,
						onClick: saveTableOptions
					}, {
						default: withCtx(() => [..._cache[319] || (_cache[319] = [createTextVNode("保存", -1)])]),
						_: 1
					}, 8, ["loading"])]),
					default: withCtx(() => [createBaseVNode("div", _hoisted_240, [
						createBaseVNode("div", _hoisted_241, [_cache[313] || (_cache[313] = createBaseVNode("label", null, "存储引擎", -1)), createVNode(unref(ReSelect_default), {
							modelValue: optionsForm.engine,
							"onUpdate:modelValue": _cache[136] || (_cache[136] = ($event) => optionsForm.engine = $event),
							filterable: "",
							options: engineOptions.value
						}, null, 8, ["modelValue", "options"])]),
						createBaseVNode("div", _hoisted_242, [_cache[314] || (_cache[314] = createBaseVNode("label", null, "字符集", -1)), createVNode(unref(ReSelect_default), {
							modelValue: optionsForm.charset,
							"onUpdate:modelValue": [_cache[137] || (_cache[137] = ($event) => optionsForm.charset = $event), onOptionsCharsetChange],
							filterable: "",
							clearable: "",
							placeholder: "留空则不改",
							options: charsetOptions.value
						}, null, 8, ["modelValue", "options"])]),
						createBaseVNode("div", _hoisted_243, [_cache[315] || (_cache[315] = createBaseVNode("label", null, "排序规则", -1)), createVNode(unref(ReSelect_default), {
							modelValue: optionsForm.collation,
							"onUpdate:modelValue": _cache[138] || (_cache[138] = ($event) => optionsForm.collation = $event),
							filterable: "",
							clearable: "",
							placeholder: "留空则不改",
							options: optionsCollationOptions.value
						}, null, 8, ["modelValue", "options"])]),
						createBaseVNode("div", _hoisted_244, [_cache[316] || (_cache[316] = createBaseVNode("label", null, "自增起始", -1)), createVNode(unref(ReInputNumber_default), {
							modelValue: optionsForm.autoIncrement,
							"onUpdate:modelValue": _cache[139] || (_cache[139] = ($event) => optionsForm.autoIncrement = $event),
							min: 1,
							placeholder: "不设置则不改"
						}, null, 8, ["modelValue"])]),
						createBaseVNode("div", _hoisted_245, [_cache[317] || (_cache[317] = createBaseVNode("label", null, "表注释", -1)), createVNode(unref(ReInput_default), {
							modelValue: optionsForm.comment,
							"onUpdate:modelValue": _cache[140] || (_cache[140] = ($event) => optionsForm.comment = $event),
							type: "textarea",
							rows: 2,
							placeholder: "表注释（可选）"
						}, null, 8, ["modelValue"])])
					])]),
					_: 1
				}, 8, ["modelValue"]),
				createVNode(unref(component), {
					modelValue: pkDialogVisible.value,
					"onUpdate:modelValue": _cache[145] || (_cache[145] = ($event) => pkDialogVisible.value = $event),
					title: "设置主键",
					width: "520px"
				}, {
					footer: withCtx(() => [createVNode(unref(ReButton_default), { onClick: _cache[144] || (_cache[144] = ($event) => pkDialogVisible.value = false) }, {
						default: withCtx(() => [..._cache[321] || (_cache[321] = [createTextVNode("取消", -1)])]),
						_: 1
					}), createVNode(unref(ReButton_default), {
						type: "primary",
						loading: pkSaving.value,
						onClick: savePrimaryKey
					}, {
						default: withCtx(() => [createTextVNode(toDisplayString(pkDialogColumns.value.length === 0 ? "清除主键" : "保存主键"), 1)]),
						_: 1
					}, 8, ["loading"])]),
					default: withCtx(() => [
						_cache[322] || (_cache[322] = createBaseVNode("div", { class: "dbm-pk-hint" }, [
							createTextVNode(" 按住列名拖动可调整顺序，"),
							createBaseVNode("strong", null, "顺序即复合主键的列序"),
							createTextVNode("；不选任何列表示清除主键。 ")
						], -1)),
						createVNode(unref(ReSelect_default), {
							modelValue: pkDialogColumns.value,
							"onUpdate:modelValue": _cache[143] || (_cache[143] = ($event) => pkDialogColumns.value = $event),
							multiple: "",
							style: { "width": "100%" },
							placeholder: "选择构成主键的列",
							options: designColumns.value.map((c) => ({
								label: c.name,
								value: c.name
							}))
						}, null, 8, ["modelValue", "options"]),
						pkDialogColumns.value.length > 1 ? (openBlock(), createElementBlock("div", _hoisted_246, [_cache[320] || (_cache[320] = createBaseVNode("span", { class: "dbm-idx-order-label" }, "列序", -1)), (openBlock(true), createElementBlock(Fragment, null, renderList(pkDialogColumns.value, (c, i) => {
							return openBlock(), createElementBlock("span", {
								key: c,
								class: "dbm-idx-order-item"
							}, [
								createBaseVNode("span", _hoisted_247, toDisplayString(i + 1), 1),
								createTextVNode(toDisplayString(c) + " ", 1),
								createBaseVNode("button", {
									type: "button",
									class: "dbm-idx-order-move",
									"aria-label": "把该列上移",
									disabled: i === 0,
									onClick: ($event) => movePkColumn(i, -1)
								}, [createVNode(unref(component$1), {
									name: "ArrowUp",
									size: 11
								})], 8, _hoisted_248),
								createBaseVNode("button", {
									type: "button",
									class: "dbm-idx-order-move",
									"aria-label": "把该列下移",
									disabled: i === pkDialogColumns.value.length - 1,
									onClick: ($event) => movePkColumn(i, 1)
								}, [createVNode(unref(component$1), {
									name: "ArrowDown",
									size: 11
								})], 8, _hoisted_249)
							]);
						}), 128))])) : createCommentVNode("", true)
					]),
					_: 1
				}, 8, ["modelValue"]),
				createVNode(unref(component), {
					modelValue: ddlVisible.value,
					"onUpdate:modelValue": _cache[148] || (_cache[148] = ($event) => ddlVisible.value = $event),
					title: "建表语句",
					width: "680px"
				}, {
					footer: withCtx(() => [createVNode(unref(ReButton_default), { onClick: _cache[146] || (_cache[146] = ($event) => ddlVisible.value = false) }, {
						default: withCtx(() => [..._cache[323] || (_cache[323] = [createTextVNode("关闭", -1)])]),
						_: 1
					}), createVNode(unref(ReButton_default), {
						type: "primary",
						icon: "CopyDocument",
						"show-text": true,
						onClick: _cache[147] || (_cache[147] = ($event) => copyText(ddlText.value))
					}, {
						default: withCtx(() => [..._cache[324] || (_cache[324] = [createTextVNode("复制", -1)])]),
						_: 1
					})]),
					default: withCtx(() => [createBaseVNode("div", _hoisted_250, [createBaseVNode("textarea", {
						class: "dbm-sql-editor dbm-ddl",
						readonly: "",
						value: ddlText.value
					}, null, 8, _hoisted_251)])]),
					_: 1
				}, 8, ["modelValue"])
			], 64);
		};
	}
}), [["__scopeId", "data-v-16fb2d5e"]]);
//#endregion
export { DatabaseManagerView_default as default };
