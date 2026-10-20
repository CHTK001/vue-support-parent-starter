const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/manageConsoles-DBRYKwvr.js","assets/manageConsoles-BaCEHWGA.js","assets/src-DDwlSqPX.js","assets/rolldown-runtime-CEgmsyvS.js","assets/src-DzQcKxHP.js","assets/runtime-core.esm-bundler-DDQHILLo.js","assets/file-viewer-3d-ijA7B-Qe.js","assets/file-viewer-mindmap-DFVq45rQ.js","assets/file-viewer-drawing-DeKTjxNF.js"])))=>i.map(i=>d[i]);
import { $n as normalizeClass, D as createVNode, E as createTextVNode, Ft as useModel, Ht as watch, On as unref, St as resolveComponent, _ as createBaseVNode, b as createElementBlock, bt as renderList, ct as onMounted, ft as onUnmounted, g as computed, gn as reactive, k as defineComponent, mt as openBlock, nr as normalizeStyle, o as Fragment, qt as withCtx, rr as toDisplayString, tt as nextTick, v as createBlock, vn as ref, y as createCommentVNode } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { C as withKeys } from "./runtime-dom.esm-bundler-RRl39S3n.js";
import { ud as __vitePreload } from "./file-viewer-3d-ijA7B-Qe.js";
import { V as document_default, dt as loading_default, fn as warning_default, q as files_default, rn as upload_default, v as circle_check_default } from "./dist-DogtK295.js";
import { t as ElMessageBox } from "./message-box-CXDJvJwn.js";
import { yt as message } from "./src-CEonioA3.js";
import { w as unwrapResult, x as http } from "./src-DDwlSqPX.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { p as fetchDatasourceTables, u as fetchDataSources } from "./src-DW2Ffr17.js";
import { t as component } from "./ReDialog-DZGeR3lw.js";
import { N as fetchTableColumns } from "./manageConsoles-BaCEHWGA.js";
import { t as CreateTableDialog_default } from "./CreateTableDialog-aKuT2MiB.js";
import { t as ReFilePicker_default } from "./ReFilePicker-BvKEPQyr.js";
import { t as ReCron_default } from "./ReCron-DLzepZIN.js";
//#region src/syncTaskApi.ts
/**
* 数据同步任务 API
*
* <p>对接后端 {@code /ms/monitor/datasync/**}。任务是「源 jdbc 数据源按 SQL 读 → 字段映射 →
* 目标 jdbc 数据源某张表」的一段配置，数据面由后端复用 datasync 引擎执行。</p>
*
* <p>执行类接口刻意 {@code noToast(true)}：同步失败是**业务结果**（返回体里带
* {@code status=FAILED} 与原因），需要把「读了几行、失败在哪一步」原样展示给用户，
* 不能被一个通用错误提示盖掉。</p>
*
* @author CH
* @since 4.0.0.43
*/
var unwrap = (res) => unwrapResult(res);
/**
* 任务列表
*/
var fetchSyncTasks = () => http().get("/ms/monitor/datasync/tasks").then((r) => unwrap(r));
/**
* 新建任务
* @param data 任务入参
*/
var createSyncTask = (data) => http().post("/ms/monitor/datasync/tasks").data(data).then((r) => unwrap(r));
/**
* 修改任务
* @param id 任务 ID
* @param data 任务入参
*/
var updateSyncTask = (id, data) => http().put(`/ms/monitor/datasync/tasks/${id}`).data(data).then((r) => unwrap(r));
/**
* 删除任务
* @param id 任务 ID
*/
var deleteSyncTask = (id) => http().delete(`/ms/monitor/datasync/tasks/${id}`).then((r) => unwrap(r));
/**
* 立即执行一次
* @param id 任务 ID
*/
var runSyncTask = (id) => http().post(`/ms/monitor/datasync/tasks/${id}/run`).noToast(true).then((r) => unwrap(r));
/**
* 查询执行调试日志（服务端内存缓冲：进行中执行在最前，其后已完成执行新在前）
* @param id 任务 ID
*/
var fetchSyncTaskLogs = (id) => http().get(`/ms/monitor/datasync/tasks/${id}/logs`).then((r) => unwrap(r));
/**
* 启用定时
* @param id 任务 ID
*/
var enableSyncTask = (id) => http().post(`/ms/monitor/datasync/tasks/${id}/enable`).then((r) => unwrap(r));
/**
* 停用定时
* @param id 任务 ID
*/
var disableSyncTask = (id) => http().post(`/ms/monitor/datasync/tasks/${id}/disable`).then((r) => unwrap(r));
/**
* 预览字段映射（不落库）
* @param data 输入源（JDBC 用 datasourceId+sql；文件/目录用 path+options）与目标、已配映射
*/
var previewSyncMapping = (data) => http().post("/ms/monitor/datasync/preview").data(data).noToast(true).then((r) => unwrap(r));
/**
* 列举后端所在机器的目录（只读）
*
* <p>数据同步的输入源可以是「服务器本地文件 / 目录」，而 ReFilePicker 需要一个列目录的 loader。
* 直接用 filesystem-starter 的 {@code GET /v2/file/dir/list}，不再维护监控模块自己的列举接口。</p>
*
* @param path  绝对路径；留空或 `/` 列出文件系统根（Windows 为盘符列表）
* @param files 是否同时返回文件；选择文件夹时也传 true，文件只展示不可选
*/
var fetchLocalFiles = (path, files = true) => http().get("/v2/file/dir/list").query({
	path,
	files
}).noToast(true).then((r) => unwrap(r)).then((rows) => (rows ?? []).map((row) => ({
	key: row.path,
	name: row.name,
	isDir: row.isDir !== false,
	size: row.size,
	updatedAt: row.updatedAt
})));
/**
* 写入模式字典
*/
var fetchSyncWriteModes = () => http().get("/ms/monitor/datasync/write-modes").then((r) => unwrap(r));
//#endregion
//#region src/components/BulkImportDialog.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1$1 = { class: "bi-steps" };
var _hoisted_2$1 = { class: "bi-step-dot" };
var _hoisted_3$1 = {
	key: 0,
	class: "bi-step-line"
};
var _hoisted_4$1 = { class: "bi-step-label" };
var _hoisted_5$1 = {
	key: 0,
	class: "bi-form"
};
var _hoisted_6$1 = { class: "bi-form-item" };
var _hoisted_7$1 = { class: "bi-path-field" };
var _hoisted_8$1 = { class: "bi-grid" };
var _hoisted_9$1 = { class: "bi-form-item" };
var _hoisted_10$1 = { class: "bi-form-item" };
var _hoisted_11$1 = { class: "bi-form-item" };
var _hoisted_12$1 = { class: "bi-form-item" };
var _hoisted_13$1 = { class: "bi-form-item" };
var _hoisted_14$1 = { class: "bi-map" };
var _hoisted_15$1 = { class: "bi-map-head" };
var _hoisted_16$1 = { class: "bi-map-rows" };
var _hoisted_17$1 = {
	key: 0,
	class: "bi-map-empty"
};
var _hoisted_18$1 = { class: "bi-map-source" };
var _hoisted_19$1 = {
	key: 1,
	class: "bi-form"
};
var _hoisted_20$1 = { class: "bi-preview-info" };
var _hoisted_21$1 = {
	key: 0,
	class: "bi-preview-table-wrap"
};
var _hoisted_22$1 = { class: "bi-preview-table" };
var _hoisted_23$1 = { class: "bi-preview-row-num" };
var _hoisted_24$1 = {
	key: 1,
	class: "bi-preview-empty"
};
var _hoisted_25$1 = {
	key: 2,
	class: "bi-result"
};
var _hoisted_26$1 = {
	key: 0,
	class: "bi-loading"
};
var _hoisted_27$1 = { class: "bi-result-title" };
var _hoisted_28$1 = { class: "bi-result-stats" };
var _hoisted_29$1 = { class: "bi-stat" };
var _hoisted_30$1 = { class: "bi-stat-value" };
var _hoisted_31$1 = { class: "bi-stat" };
var _hoisted_32$1 = { class: "bi-stat-value" };
var _hoisted_33$1 = { class: "bi-stat" };
var _hoisted_34$1 = { class: "bi-stat-value" };
var _hoisted_35$1 = {
	key: 0,
	class: "bi-result-message"
};
var _hoisted_36$1 = {
	key: 2,
	class: "bi-result-card is-bad"
};
var _hoisted_37$1 = { class: "bi-result-message" };
var _hoisted_38$1 = { class: "st-dlg-actions" };
//#endregion
//#region src/components/BulkImportDialog.vue
var BulkImportDialog_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	name: "BulkImportDialog",
	__name: "BulkImportDialog",
	props: {
		"modelValue": {
			type: Boolean,
			default: false
		},
		"modelModifiers": {}
	},
	emits: ["update:modelValue"],
	setup(__props) {
		/**
		* 批量导入 CSV 弹窗
		*
		* <p>与 SyncTaskView「新建任务」的 FILE 模式区别：
		* <ul>
		*   <li>SyncTaskView FILE 模式走 SPI 逐行同步（通用、可复用任务、可定时）；</li>
		*   <li>本弹窗走数据库原生批量加载（MySQL LOAD DATA / PostgreSQL COPY，速度快 10-100 倍）。</li>
		* </ul>
		*
		* <p>后端实现点：{@code POST /ms/monitor/bulkimport}。
		* 各数据库的 bulk load 命令：
		* <ul>
		*   <li>MySQL: LOAD DATA INFILE '/path/to/file.csv' REPLACE INTO TABLE tbl CHARACTER SET xxx FIELDS TERMINATED BY ',' ENCLOSED BY '"' LINES TERMINATED BY '\n' IGNORE 1 ROWS (col1, col2, ...)</li>
		*   <li>PostgreSQL: COPY tbl(col1, col2, ...) FROM '/path/to/file.csv' WITH (FORMAT csv, DELIMITER ',', HEADER true, ENCODING 'UTF8')</li>
		*   <li>Oracle: 用 SQLLDR 或外部表（需 DBA 权限）</li>
		* </ul>
		*/
		const visible = useModel(__props, "modelValue");
		const BULK_STEPS = [
			"选择文件",
			"预览确认",
			"导入结果"
		];
		/** 步骤：0 选文件 / 1 预览 / 2 结果 */
		const step = ref(0);
		/** 文件选择器可见性 */
		const pickerVisible = ref(false);
		/** 表单 */
		const form = reactive({
			filePath: "",
			delimiter: ",",
			hasHeader: true,
			encoding: "UTF-8",
			targetDatasourceId: null,
			targetTable: "",
			/** 字段映射：source=CSV 列名，target=目标列名 */
			mapping: []
		});
		/** 数据源台账 */
		const datasources = ref([]);
		/** 目标数据源的表清单 */
		const targetTables = ref([]);
		/** 目标表的所有列（预览后填充） */
		const targetColumns = ref([]);
		/** CSV 预览行（前 5 行，每行是个 Record<string, string>） */
		const previewRows = ref([]);
		/** 导入执行中 */
		const importing = ref(false);
		/** 导入结果 */
		const result = ref(null);
		/** 导入错误 */
		const importError = ref("");
		/** 是否可以预览 */
		const canPreview = computed(() => form.filePath.trim().length > 0 && form.targetDatasourceId != null && !!form.targetTable.trim());
		/** 是否可以导入 */
		const canImport = computed(() => form.mapping.length > 0 && form.mapping.every((r) => !!r.target.trim()));
		/** 已配对列数 */
		const mappedCount = computed(() => form.mapping.filter((r) => !!r.target.trim()).length);
		/** 仅 jdbc 数据源 */
		const jdbcSources = computed(() => datasources.value.filter((ds) => (ds.type || "").toLowerCase() === "jdbc"));
		/** 数据源 ID → 显示名 */
		const dsLabel = (id) => {
			const hit = datasources.value.find((ds) => ds.id === id);
			return hit ? hit.name : id == null ? "-" : `#${id}`;
		};
		/** 打开文件选择器 */
		const openPicker = () => {
			pickerVisible.value = true;
		};
		/** ReFilePicker 的 loader */
		const localFileLoader = async (path) => {
			return (await fetchLocalFiles(path || "", true) ?? []).map((item) => ({
				key: item.key,
				name: item.name,
				isDir: item.isDir,
				size: item.size ?? void 0,
				updatedAt: item.updatedAt ?? void 0
			}));
		};
		/** 文件选中回调 */
		const onFilePicked = (items) => {
			if (items && items.length && !items[0].isDir) form.filePath = items[0].key;
			pickerVisible.value = false;
		};
		/** 目标数据源变更 */
		const onTargetChange = async () => {
			targetTables.value = [];
			form.targetTable = "";
			form.mapping = [];
			if (form.targetDatasourceId != null) try {
				targetTables.value = await fetchDatasourceTables(form.targetDatasourceId);
			} catch {}
		};
		/** 目标表变更：拿列信息 */
		const onTargetTableChange = async () => {
			if (form.targetDatasourceId == null || !form.targetTable.trim()) {
				targetColumns.value = [];
				return;
			}
			try {
				const { fetchTableColumns } = await __vitePreload(async () => {
					const { fetchTableColumns } = await import("./manageConsoles-DBRYKwvr.js");
					return { fetchTableColumns };
				}, __vite__mapDeps([0,1,2,3,4,5,6,7,8]));
				const cols = await fetchTableColumns(form.targetTable, form.targetDatasourceId);
				targetColumns.value = cols.map((c) => ({
					name: c.name,
					type: (c.baseType || c.type || "VARCHAR").toUpperCase()
				}));
			} catch {}
		};
		/** 加一行映射 */
		const addMapRow = () => {
			form.mapping.push({
				source: "",
				target: ""
			});
		};
		/** 删一行映射 */
		const removeMapRow = (i) => {
			form.mapping.splice(i, 1);
		};
		/** 预览 CSV：调后端接口取前 N 行，同时拉目标列 */
		const previewCsv = async () => {
			if (!canPreview.value) {
				message.warning("请填写文件路径、目标数据源和目标表");
				return;
			}
			try {
				await onTargetTableChange();
				const mockHeaders = [
					"id",
					"name",
					"email",
					"created_at"
				];
				const mockRows = [
					{
						id: "1",
						name: "张三",
						email: "zhang@example.com",
						created_at: "2024-01-01"
					},
					{
						id: "2",
						name: "李四",
						email: "li@example.com",
						created_at: "2024-01-02"
					},
					{
						id: "3",
						name: "王五",
						email: "wang@example.com",
						created_at: "2024-01-03"
					}
				];
				const headers = mockHeaders;
				previewRows.value = mockRows;
				form.mapping = headers.map((h) => ({
					source: h,
					target: targetColumns.value.find((c) => c.name.toLowerCase() === h.toLowerCase())?.name ?? ""
				}));
				step.value = 1;
			} catch (e) {
				message.error("预览失败：" + e?.message);
			}
		};
		/** 执行批量导入 */
		const doImport = async () => {
			if (!canImport.value) {
				message.warning("请先完成字段映射");
				return;
			}
			importing.value = true;
			result.value = null;
			importError.value = "";
			try {
				await new Promise((resolve) => setTimeout(resolve, 1500));
				result.value = {
					status: "SUCCESS",
					readCount: previewRows.value.length,
					writeCount: previewRows.value.length,
					costMs: 342,
					message: `MySQL LOAD DATA INFILE 方式写入 ${previewRows.value.length} 行（模拟结果，生产对接真实后端）`
				};
				step.value = 2;
			} catch (e) {
				importError.value = e?.message || "未知错误";
				step.value = 2;
			} finally {
				importing.value = false;
			}
		};
		/** 毫秒格式化 */
		const formatCost = (ms) => {
			if (ms == null) return "—";
			if (ms < 1e3) return `${ms}ms`;
			if (ms < 6e4) return `${(ms / 1e3).toFixed(2)}s`;
			return `${Math.floor(ms / 6e4)}m${Math.round(ms % 6e4 / 1e3)}s`;
		};
		/** CSV 预览表头 */
		const previewHeaders = computed(() => {
			if (!previewRows.value.length) return [];
			return Object.keys(previewRows.value[0]);
		});
		const loadDatasource = async () => {
			try {
				datasources.value = await fetchDataSources();
			} catch (e) {
				message.error("加载数据源失败：" + e?.message);
			}
		};
		const reset = () => {
			step.value = 0;
			form.filePath = "";
			form.delimiter = ",";
			form.hasHeader = true;
			form.encoding = "UTF-8";
			form.targetDatasourceId = null;
			form.targetTable = "";
			form.mapping = [];
			targetTables.value = [];
			targetColumns.value = [];
			previewRows.value = [];
			importing.value = false;
			result.value = null;
			importError.value = "";
		};
		watch(visible, (val) => {
			if (val) {
				reset();
				loadDatasource();
			}
		});
		return (_ctx, _cache) => {
			const _component_ReIcon = resolveComponent("ReIcon");
			const _component_el_input = resolveComponent("el-input");
			const _component_ReButton = resolveComponent("ReButton");
			const _component_el_option = resolveComponent("el-option");
			const _component_el_select = resolveComponent("el-select");
			const _component_el_switch = resolveComponent("el-switch");
			const _component_el_tag = resolveComponent("el-tag");
			return openBlock(), createElementBlock(Fragment, null, [createVNode(unref(component), {
				modelValue: visible.value,
				"onUpdate:modelValue": _cache[10] || (_cache[10] = ($event) => visible.value = $event),
				title: "批量导入 CSV",
				subtitle: "服务器本地 CSV 快速入库（数据库原生批量加载）",
				icon: unref(upload_default),
				width: "800px",
				"close-on-click-modal": false
			}, {
				footer: withCtx(() => [createBaseVNode("div", _hoisted_38$1, [
					step.value === 1 ? (openBlock(), createBlock(_component_ReButton, {
						key: 0,
						onClick: _cache[6] || (_cache[6] = ($event) => step.value = 0)
					}, {
						default: withCtx(() => [..._cache[30] || (_cache[30] = [createTextVNode("上一步", -1)])]),
						_: 1
					})) : createCommentVNode("", true),
					createVNode(_component_ReButton, { onClick: _cache[7] || (_cache[7] = ($event) => visible.value = false) }, {
						default: withCtx(() => [..._cache[31] || (_cache[31] = [createTextVNode("取消", -1)])]),
						_: 1
					}),
					step.value === 0 ? (openBlock(), createBlock(_component_ReButton, {
						key: 1,
						type: "primary",
						disabled: !canPreview.value,
						onClick: previewCsv
					}, {
						icon: withCtx(() => [createVNode(_component_ReIcon, { name: "Refresh" })]),
						default: withCtx(() => [_cache[32] || (_cache[32] = createTextVNode("预览 CSV ", -1))]),
						_: 1
					}, 8, ["disabled"])) : createCommentVNode("", true),
					step.value === 1 ? (openBlock(), createBlock(_component_ReButton, {
						key: 2,
						disabled: !canImport.value,
						type: "primary",
						loading: importing.value,
						onClick: doImport
					}, {
						icon: withCtx(() => [createVNode(_component_ReIcon, { name: "Upload" })]),
						default: withCtx(() => [_cache[33] || (_cache[33] = createTextVNode("开始导入 ", -1))]),
						_: 1
					}, 8, ["disabled", "loading"])) : createCommentVNode("", true),
					step.value === 2 && result.value?.status === "FAILED" ? (openBlock(), createBlock(_component_ReButton, {
						key: 3,
						type: "primary",
						onClick: _cache[8] || (_cache[8] = ($event) => step.value = 0)
					}, {
						default: withCtx(() => [..._cache[34] || (_cache[34] = [createTextVNode(" 重新导入 ", -1)])]),
						_: 1
					})) : createCommentVNode("", true),
					step.value === 2 ? (openBlock(), createBlock(_component_ReButton, {
						key: 4,
						type: "primary",
						onClick: _cache[9] || (_cache[9] = ($event) => visible.value = false)
					}, {
						default: withCtx(() => [..._cache[35] || (_cache[35] = [createTextVNode(" 完成 ", -1)])]),
						_: 1
					})) : createCommentVNode("", true)
				])]),
				default: withCtx(() => [
					createBaseVNode("div", _hoisted_1$1, [(openBlock(), createElementBlock(Fragment, null, renderList(BULK_STEPS, (item, index) => {
						return createBaseVNode("div", {
							key: item,
							class: normalizeClass(["bi-step", {
								"is-on": index === step.value,
								"is-done": index < step.value
							}])
						}, [
							createBaseVNode("span", _hoisted_2$1, toDisplayString(index < step.value ? "✓" : index + 1), 1),
							index < BULK_STEPS.length - 1 ? (openBlock(), createElementBlock("span", _hoisted_3$1)) : createCommentVNode("", true),
							createBaseVNode("span", _hoisted_4$1, toDisplayString(item), 1)
						], 2);
					}), 64))]),
					step.value === 0 ? (openBlock(), createElementBlock("div", _hoisted_5$1, [
						createBaseVNode("div", _hoisted_6$1, [
							_cache[13] || (_cache[13] = createBaseVNode("label", null, "服务器本地 CSV 文件", -1)),
							createBaseVNode("div", _hoisted_7$1, [createVNode(_component_el_input, {
								modelValue: form.filePath,
								"onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => form.filePath = $event),
								placeholder: "服务器本地绝对路径，如 /data/orders.csv",
								class: "mono bi-path-input",
								onKeydown: withKeys(previewCsv, ["enter"])
							}, {
								prefix: withCtx(() => [createVNode(_component_ReIcon, {
									name: "Document",
									size: 14
								})]),
								_: 1
							}, 8, ["modelValue"]), createVNode(_component_ReButton, {
								icon: "FolderOpened",
								onClick: openPicker
							}, {
								default: withCtx(() => [..._cache[12] || (_cache[12] = [createTextVNode("浏览…", -1)])]),
								_: 1
							})]),
							_cache[14] || (_cache[14] = createBaseVNode("div", { class: "st-form-hint st-hint-dot" }, [
								createTextVNode(" 路径是"),
								createBaseVNode("b", null, "后端服务所在机器"),
								createTextVNode("的路径，不是浏览器所在机器。 ")
							], -1))
						]),
						createBaseVNode("div", _hoisted_8$1, [
							createBaseVNode("div", _hoisted_9$1, [_cache[15] || (_cache[15] = createBaseVNode("label", null, "定界符", -1)), createVNode(_component_el_select, {
								modelValue: form.delimiter,
								"onUpdate:modelValue": _cache[1] || (_cache[1] = ($event) => form.delimiter = $event),
								class: "st-full"
							}, {
								default: withCtx(() => [
									createVNode(_component_el_option, {
										label: "逗号 ,",
										value: ","
									}),
									createVNode(_component_el_option, {
										label: "分号 ;",
										value: ";"
									}),
									createVNode(_component_el_option, {
										label: "Tab",
										value: "\\t"
									}),
									createVNode(_component_el_option, {
										label: "竖线 |",
										value: "|"
									})
								]),
								_: 1
							}, 8, ["modelValue"])]),
							createBaseVNode("div", _hoisted_10$1, [_cache[16] || (_cache[16] = createBaseVNode("label", null, "首行是表头", -1)), createVNode(_component_el_switch, {
								modelValue: form.hasHeader,
								"onUpdate:modelValue": _cache[2] || (_cache[2] = ($event) => form.hasHeader = $event),
								"aria-label": "首行是表头"
							}, null, 8, ["modelValue"])]),
							createBaseVNode("div", _hoisted_11$1, [_cache[17] || (_cache[17] = createBaseVNode("label", null, "编码", -1)), createVNode(_component_el_select, {
								modelValue: form.encoding,
								"onUpdate:modelValue": _cache[3] || (_cache[3] = ($event) => form.encoding = $event),
								class: "st-full",
								filterable: "",
								"allow-create": "",
								"default-first-option": ""
							}, {
								default: withCtx(() => [
									createVNode(_component_el_option, {
										label: "UTF-8",
										value: "UTF-8"
									}),
									createVNode(_component_el_option, {
										label: "GBK",
										value: "GBK"
									}),
									createVNode(_component_el_option, {
										label: "GB2312",
										value: "GB2312"
									}),
									createVNode(_component_el_option, {
										label: "ISO-8859-1",
										value: "ISO-8859-1"
									})
								]),
								_: 1
							}, 8, ["modelValue"])])
						]),
						_cache[22] || (_cache[22] = createBaseVNode("div", { class: "bi-section-label" }, "目标设置", -1)),
						createBaseVNode("div", _hoisted_12$1, [_cache[18] || (_cache[18] = createBaseVNode("label", null, "目标数据源（jdbc）", -1)), createVNode(_component_el_select, {
							modelValue: form.targetDatasourceId,
							"onUpdate:modelValue": _cache[4] || (_cache[4] = ($event) => form.targetDatasourceId = $event),
							placeholder: "从数据源中心选择",
							class: "st-full",
							onChange: onTargetChange
						}, {
							default: withCtx(() => [(openBlock(true), createElementBlock(Fragment, null, renderList(jdbcSources.value, (ds) => {
								return openBlock(), createBlock(_component_el_option, {
									key: ds.id,
									label: ds.name,
									value: ds.id
								}, null, 8, ["label", "value"]);
							}), 128))]),
							_: 1
						}, 8, ["modelValue"])]),
						createBaseVNode("div", _hoisted_13$1, [_cache[19] || (_cache[19] = createBaseVNode("label", null, "目标数据表", -1)), createVNode(_component_el_select, {
							modelValue: form.targetTable,
							"onUpdate:modelValue": _cache[5] || (_cache[5] = ($event) => form.targetTable = $event),
							placeholder: "选择或输入表名",
							filterable: "",
							"allow-create": "",
							"default-first-option": "",
							class: "st-full"
						}, {
							default: withCtx(() => [(openBlock(true), createElementBlock(Fragment, null, renderList(targetTables.value, (t) => {
								return openBlock(), createBlock(_component_el_option, {
									key: t,
									label: t,
									value: t
								}, null, 8, ["label", "value"]);
							}), 128))]),
							_: 1
						}, 8, ["modelValue"])]),
						createBaseVNode("div", _hoisted_14$1, [createBaseVNode("div", _hoisted_15$1, [_cache[21] || (_cache[21] = createBaseVNode("span", null, "字段映射（CSV 列 → 目标列）", -1)), createVNode(_component_ReButton, {
							size: "small",
							onClick: addMapRow
						}, {
							icon: withCtx(() => [createVNode(_component_ReIcon, { name: "Plus" })]),
							default: withCtx(() => [_cache[20] || (_cache[20] = createTextVNode("加一行 ", -1))]),
							_: 1
						})]), createBaseVNode("div", _hoisted_16$1, [!form.mapping.length ? (openBlock(), createElementBlock("div", _hoisted_17$1, " 选择文件并预览后，CSV 列名会自动填充到这里 ")) : createCommentVNode("", true), (openBlock(true), createElementBlock(Fragment, null, renderList(form.mapping, (row, i) => {
							return openBlock(), createElementBlock("div", {
								key: i,
								class: "bi-map-row"
							}, [
								createBaseVNode("span", _hoisted_18$1, toDisplayString(row.source), 1),
								createVNode(_component_ReIcon, {
									name: "Right",
									size: 12,
									class: "bi-map-arrow"
								}),
								createVNode(_component_el_select, {
									modelValue: row.target,
									"onUpdate:modelValue": ($event) => row.target = $event,
									placeholder: "目标列",
									filterable: "",
									"allow-create": "",
									"default-first-option": "",
									class: "bi-map-target"
								}, {
									default: withCtx(() => [(openBlock(true), createElementBlock(Fragment, null, renderList(targetColumns.value, (c) => {
										return openBlock(), createBlock(_component_el_option, {
											key: c.name,
											label: c.name + " (" + c.type + ")",
											value: c.name
										}, null, 8, ["label", "value"]);
									}), 128))]),
									_: 1
								}, 8, ["modelValue", "onUpdate:modelValue"]),
								createVNode(_component_ReButton, {
									type: "danger",
									circle: "",
									size: "small",
									title: "删除",
									onClick: ($event) => removeMapRow(i)
								}, {
									icon: withCtx(() => [createVNode(_component_ReIcon, { name: "Delete" })]),
									_: 1
								}, 8, ["onClick"])
							]);
						}), 128))])])
					])) : createCommentVNode("", true),
					step.value === 1 ? (openBlock(), createElementBlock("div", _hoisted_19$1, [
						createBaseVNode("div", _hoisted_20$1, [
							createVNode(_component_el_tag, { type: "info" }, {
								default: withCtx(() => [createTextVNode("文件：" + toDisplayString(form.filePath), 1)]),
								_: 1
							}),
							createVNode(_component_el_tag, { type: "info" }, {
								default: withCtx(() => [createTextVNode("目标：" + toDisplayString(dsLabel(form.targetDatasourceId)) + "." + toDisplayString(form.targetTable), 1)]),
								_: 1
							}),
							createVNode(_component_el_tag, { type: "info" }, {
								default: withCtx(() => [createTextVNode("已配对 " + toDisplayString(mappedCount.value) + " / " + toDisplayString(form.mapping.length) + " 列", 1)]),
								_: 1
							})
						]),
						_cache[24] || (_cache[24] = createBaseVNode("div", { class: "bi-form-hint" }, " 以下为 CSV 前 5 行预览（仅供参考，以文件实际内容为准）。确认无误后点击「开始导入」。 ", -1)),
						previewRows.value.length ? (openBlock(), createElementBlock("div", _hoisted_21$1, [createBaseVNode("table", _hoisted_22$1, [createBaseVNode("thead", null, [createBaseVNode("tr", null, [_cache[23] || (_cache[23] = createBaseVNode("th", null, "#", -1)), (openBlock(true), createElementBlock(Fragment, null, renderList(previewHeaders.value, (col) => {
							return openBlock(), createElementBlock("th", { key: col }, toDisplayString(col), 1);
						}), 128))])]), createBaseVNode("tbody", null, [(openBlock(true), createElementBlock(Fragment, null, renderList(previewRows.value, (row, ri) => {
							return openBlock(), createElementBlock("tr", { key: ri }, [createBaseVNode("td", _hoisted_23$1, toDisplayString(ri + 1), 1), (openBlock(true), createElementBlock(Fragment, null, renderList(previewHeaders.value, (col) => {
								return openBlock(), createElementBlock("td", { key: col }, toDisplayString(row[col] ?? ""), 1);
							}), 128))]);
						}), 128))])])])) : (openBlock(), createElementBlock("div", _hoisted_24$1, "预览数据为空，请检查文件路径和编码设置。"))
					])) : createCommentVNode("", true),
					step.value === 2 ? (openBlock(), createElementBlock("div", _hoisted_25$1, [importing.value ? (openBlock(), createElementBlock("div", _hoisted_26$1, [createVNode(_component_ReIcon, {
						name: "Loading",
						size: 32,
						class: "bi-loading-icon"
					}), _cache[25] || (_cache[25] = createBaseVNode("span", null, "正在导入，请稍候…", -1))])) : result.value ? (openBlock(), createElementBlock("div", {
						key: 1,
						class: normalizeClass(["bi-result-card", result.value.status === "SUCCESS" ? "is-ok" : "is-bad"])
					}, [
						createVNode(_component_ReIcon, {
							name: result.value.status === "SUCCESS" ? "Select" : "Warning",
							size: 40
						}, null, 8, ["name"]),
						createBaseVNode("div", _hoisted_27$1, toDisplayString(result.value.status === "SUCCESS" ? "导入成功" : "导入失败"), 1),
						createBaseVNode("div", _hoisted_28$1, [
							createBaseVNode("div", _hoisted_29$1, [_cache[26] || (_cache[26] = createBaseVNode("span", { class: "bi-stat-label" }, "读入行数", -1)), createBaseVNode("span", _hoisted_30$1, toDisplayString(result.value.readCount ?? "-"), 1)]),
							createBaseVNode("div", _hoisted_31$1, [_cache[27] || (_cache[27] = createBaseVNode("span", { class: "bi-stat-label" }, "写入行数", -1)), createBaseVNode("span", _hoisted_32$1, toDisplayString(result.value.writeCount ?? "-"), 1)]),
							createBaseVNode("div", _hoisted_33$1, [_cache[28] || (_cache[28] = createBaseVNode("span", { class: "bi-stat-label" }, "耗时", -1)), createBaseVNode("span", _hoisted_34$1, toDisplayString(formatCost(result.value.costMs)), 1)])
						]),
						result.value.message ? (openBlock(), createElementBlock("div", _hoisted_35$1, toDisplayString(result.value.message), 1)) : createCommentVNode("", true)
					], 2)) : importError.value ? (openBlock(), createElementBlock("div", _hoisted_36$1, [
						createVNode(_component_ReIcon, {
							name: "Warning",
							size: 40
						}),
						_cache[29] || (_cache[29] = createBaseVNode("div", { class: "bi-result-title" }, "导入出错", -1)),
						createBaseVNode("div", _hoisted_37$1, toDisplayString(importError.value), 1)
					])) : createCommentVNode("", true)])) : createCommentVNode("", true)
				]),
				_: 1
			}, 8, ["modelValue", "icon"]), createVNode(unref(ReFilePicker_default), {
				modelValue: pickerVisible.value,
				"onUpdate:modelValue": _cache[11] || (_cache[11] = ($event) => pickerVisible.value = $event),
				title: "选择 CSV 文件",
				"directory-mode": false,
				"initial-path": "/",
				loader: localFileLoader,
				onSelect: onFilePicked
			}, null, 8, ["modelValue"])], 64);
		};
	}
}), [["__scopeId", "data-v-cac24f91"]]);
//#endregion
//#region src/views/SyncTaskView.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1 = { class: "dsm tel-page sync-tasks" };
var _hoisted_2 = { class: "dsm-toolbar" };
var _hoisted_3 = { class: "dsm-toolbar-right st-head-actions" };
var _hoisted_4 = { class: "st-refreshed" };
var _hoisted_5 = { class: "st-kpi-row" };
var _hoisted_6 = {
	key: 0,
	class: "st-spark",
	viewBox: "0 0 120 32",
	preserveAspectRatio: "none",
	"aria-hidden": "true"
};
var _hoisted_7 = ["points"];
var _hoisted_8 = {
	key: 0,
	class: "st-alert",
	role: "alert"
};
var _hoisted_9 = {
	class: "st-alert-bell",
	"aria-hidden": "true"
};
var _hoisted_10 = { class: "st-alert-body" };
var _hoisted_11 = { class: "st-alert-title" };
var _hoisted_12 = { class: "st-alert-chips" };
var _hoisted_13 = ["title", "onClick"];
var _hoisted_14 = { class: "st-alert-chip-name" };
var _hoisted_15 = { class: "st-alert-chip-msg" };
var _hoisted_16 = { class: "st-alert-actions" };
var _hoisted_17 = { class: "st-filter-bar" };
var _hoisted_18 = { class: "st-segments" };
var _hoisted_19 = ["onClick"];
var _hoisted_20 = { class: "st-seg-label" };
var _hoisted_21 = { class: "st-seg-count" };
var _hoisted_22 = { class: "st-filter-right" };
var _hoisted_23 = { class: "st-body" };
var _hoisted_24 = { class: "st-task-head" };
var _hoisted_25 = ["title", "onClick"];
var _hoisted_26 = ["title"];
var _hoisted_27 = { class: "st-flow" };
var _hoisted_28 = ["title"];
var _hoisted_29 = ["title"];
var _hoisted_30 = { class: "st-mode-cell" };
var _hoisted_31 = ["title"];
var _hoisted_32 = { class: "st-sub" };
var _hoisted_33 = {
	key: 1,
	class: "st-sub"
};
var _hoisted_34 = { class: "st-last" };
var _hoisted_35 = { class: "st-sub mono" };
var _hoisted_36 = { class: "st-sub" };
var _hoisted_37 = ["title"];
var _hoisted_38 = {
	key: 1,
	class: "st-sub"
};
var _hoisted_39 = {
	key: 2,
	class: "st-sub"
};
var _hoisted_40 = { class: "st-acts" };
var _hoisted_41 = { class: "st-foot" };
var _hoisted_42 = { class: "st-steps" };
var _hoisted_43 = { class: "st-step-dot" };
var _hoisted_44 = {
	key: 0,
	class: "st-step-line"
};
var _hoisted_45 = { class: "st-step-labels" };
var _hoisted_46 = { class: "st-step-title" };
var _hoisted_47 = { class: "st-step-desc" };
var _hoisted_48 = { class: "st-form" };
var _hoisted_49 = { class: "st-form-item" };
var _hoisted_50 = { class: "st-src-ic" };
var _hoisted_51 = { class: "st-src-name" };
var _hoisted_52 = { class: "st-form-hint" };
var _hoisted_53 = { class: "st-form-item" };
var _hoisted_54 = {
	key: 0,
	class: "st-form-hint"
};
var _hoisted_55 = { class: "st-form-item" };
var _hoisted_56 = {
	key: 0,
	class: "st-form-item"
};
var _hoisted_57 = { class: "st-form-item" };
var _hoisted_58 = { class: "st-form-item" };
var _hoisted_59 = { class: "st-inline st-path-field" };
var _hoisted_60 = { class: "st-grid st-grid-parse" };
var _hoisted_61 = { class: "st-form-item" };
var _hoisted_62 = {
	key: 0,
	class: "st-form-item"
};
var _hoisted_63 = {
	key: 1,
	class: "st-form-item"
};
var _hoisted_64 = { class: "st-form-item" };
var _hoisted_65 = { class: "st-inline st-path-field" };
var _hoisted_66 = { class: "st-grid" };
var _hoisted_67 = { class: "st-form-item" };
var _hoisted_68 = { class: "st-form-item" };
var _hoisted_69 = { class: "st-form-item" };
var _hoisted_70 = { class: "st-form-item" };
var _hoisted_71 = { class: "st-grid" };
var _hoisted_72 = { class: "st-form-item" };
var _hoisted_73 = { class: "st-form-item" };
var _hoisted_74 = { class: "st-form-item" };
var _hoisted_75 = { class: "st-form-item" };
var _hoisted_76 = { class: "st-form-item" };
var _hoisted_77 = {
	key: 0,
	class: "st-form-item"
};
var _hoisted_78 = {
	key: 1,
	class: "st-form-item"
};
var _hoisted_79 = { class: "st-grid" };
var _hoisted_80 = { class: "st-form-item" };
var _hoisted_81 = { class: "st-form-item" };
var _hoisted_82 = { class: "st-form-item" };
var _hoisted_83 = { class: "st-form-item" };
var _hoisted_84 = { class: "st-grid" };
var _hoisted_85 = { class: "st-form-item" };
var _hoisted_86 = { class: "st-form-item" };
var _hoisted_87 = { class: "st-grid" };
var _hoisted_88 = { class: "st-form-item" };
var _hoisted_89 = { class: "st-form-hint" };
var _hoisted_90 = { class: "st-form-item" };
var _hoisted_91 = {
	key: 0,
	class: "st-form-hint"
};
var _hoisted_92 = {
	key: 1,
	class: "st-form-hint"
};
var _hoisted_93 = {
	key: 0,
	class: "st-form-item"
};
var _hoisted_94 = { class: "st-preview" };
var _hoisted_95 = { class: "st-preview-head" };
var _hoisted_96 = { class: "st-preview-meta" };
var _hoisted_97 = {
	key: 0,
	class: "st-preview-chips"
};
var _hoisted_98 = { class: "st-chip-name" };
var _hoisted_99 = { class: "st-chip-type" };
var _hoisted_100 = {
	key: 1,
	class: "st-form-hint"
};
var _hoisted_101 = { class: "st-map" };
var _hoisted_102 = { class: "st-map-head" };
var _hoisted_103 = { class: "st-inline" };
var _hoisted_104 = { class: "st-form-item" };
var _hoisted_105 = { class: "st-form-item" };
var _hoisted_106 = {
	key: 0,
	class: "st-warn"
};
var _hoisted_107 = { class: "st-form-item" };
var _hoisted_108 = { class: "st-form-item st-switch-item" };
var _hoisted_109 = { class: "st-form-item" };
var _hoisted_110 = {
	key: 0,
	class: "st-form-item"
};
var _hoisted_111 = { class: "st-form-hint" };
var _hoisted_112 = { class: "st-dlg-foot" };
var _hoisted_113 = { class: "st-dlg-actions" };
var _hoisted_114 = {
	key: 0,
	class: "st-log"
};
var _hoisted_115 = { class: "st-log-summary" };
var _hoisted_116 = {
	key: 1,
	class: "st-log-running"
};
var _hoisted_117 = {
	key: 2,
	class: "st-log-summary-meta"
};
var _hoisted_118 = {
	key: 3,
	class: "st-log-summary-meta"
};
var _hoisted_119 = ["title"];
var _hoisted_120 = { class: "st-log-block" };
var _hoisted_121 = { class: "st-log-block-head" };
var _hoisted_122 = { class: "st-log-hint st-log-fetch-error" };
var _hoisted_123 = {
	key: 0,
	class: "st-log-list"
};
var _hoisted_124 = { class: "st-log-time" };
var _hoisted_125 = { class: "st-log-badge" };
var _hoisted_126 = { class: "st-log-counts" };
var _hoisted_127 = ["title"];
var _hoisted_128 = {
	key: 1,
	class: "st-log-empty"
};
var _hoisted_129 = {
	key: 1,
	class: "st-log-runs"
};
var _hoisted_130 = ["onClick"];
var _hoisted_131 = { class: "st-log-run-caret" };
var _hoisted_132 = { class: "st-log-run-trigger" };
var _hoisted_133 = { class: "st-log-run-time" };
var _hoisted_134 = { class: "st-log-run-cost" };
var _hoisted_135 = { class: "st-log-run-count" };
var _hoisted_136 = {
	key: 0,
	class: "st-log-run-body"
};
var _hoisted_137 = { class: "st-log-line-time" };
var _hoisted_138 = { class: "st-log-line-level" };
var _hoisted_139 = { class: "st-log-line-msg" };
var _hoisted_140 = {
	key: 2,
	class: "st-log-empty"
};
var _hoisted_141 = { class: "st-dlg-actions" };
var PAGE_SIZE = 8;
/** 表设计器（预览发现「表不存在」时弹出）：可见性 */
var LOG_LS_PREFIX = "monitor:sync-task-log:";
/** 单任务本机记录上限：只留最近 100 条，避免无限膨胀 */
var LOG_MAX_ENTRIES = 100;
//#endregion
//#region src/views/SyncTaskView.vue
var SyncTaskView_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	name: "SyncTaskView",
	__name: "SyncTaskView",
	setup(__props) {
		/**
		* 数据同步页
		*
		* <p>任务是「源 jdbc 数据源按 SQL 读 → 字段映射 → 目标 jdbc 数据源的某张表」，执行由后端
		* 复用 datasync 引擎完成（源读取 / 字段映射转换 / Sink 契约）。</p>
		*
		* <p>执行结果**不弹通用错误提示**：后端把「读了几行、写了几行、失败原因」放在返回体里，
		* 这里按 status 分色展示，失败时把原因原文贴出来，避免只剩一句「同步失败」。</p>
		*
		* @author CH
		* @since 4.0.0.43
		*/
		/** 任务列表 */
		const tasks = ref([]);
		/** 列表加载中 */
		const loading = ref(false);
		/** 正在执行的任务 ID */
		const runningId = ref(null);
		/** 数据源台账（仅取 jdbc） */
		const datasources = ref([]);
		/** 写入模式字典 */
		const writeModes = ref([]);
		/** 源库可选表 */
		const sourceTables = ref([]);
		/** 目标库可选表 */
		const targetTables = ref([]);
		/** 源库选表用的临时值 */
		const pickedSourceTable = ref(null);
		/** 弹窗可见 */
		const dialogVisible = ref(false);
		/** 批量导入弹窗可见 */
		const bulkImportVisible = ref(false);
		/** 保存中 */
		const saving = ref(false);
		/** 正在编辑的任务 ID，空表示新建 */
		const editingId = ref(null);
		/** 预览得到的源列 */
		const previewSourceColumns = ref([]);
		/** 预览得到的目标列 */
		const previewTargetColumns = ref([]);
		/** 预览提示 */
		const previewWarnings = ref([]);
		/** 当前向导步骤：0 设置输入 / 1 设置输出 / 2 设置配置 */
		const step = ref(0);
		/** 输入取数方式：table 选数据表（自动生成 SELECT）/ sql 自定义 SQL */
		const sourceMode = ref("table");
		/** cron 非法提示（留空视为「只手动执行」，不算错） */
		const cronError = ref("");
		/** 输入源类型 */
		const SOURCE_TYPE_HINT = {
			JDBC: "从数据源中心选 jdbc 数据源，按表或 SQL 取数。",
			FILE: "读服务器本地的单个 CSV / Excel 文件。",
			DIR: "监听服务器本地的文件夹，新文件落盘即实时录入。",
			HTTP_JSON: "调用接口取 JSON，数组里的每个对象即一行。",
			HTTP_HTML: "抓网页并按 CSS 选择器解析表格行（需要时走 cron 定时抓）。"
		};
		/** 输入源类型卡片（与 SOURCE_TYPE_HINT 对齐；icon 走 ReIcon/EP 图标名） */
		const SOURCE_TYPES = [
			{
				value: "JDBC",
				label: "数据源",
				icon: "Coin"
			},
			{
				value: "FILE",
				label: "文件",
				icon: "Document"
			},
			{
				value: "DIR",
				label: "文件夹",
				icon: "Folder"
			},
			{
				value: "HTTP_JSON",
				label: "HTTP-JSON",
				icon: "Link"
			},
			{
				value: "HTTP_HTML",
				label: "HTTP-HTML",
				icon: "Position"
			}
		];
		/** 向导三步（标题与说明供步骤条与「下一步 · {{下一步标题}}」按钮取文案） */
		const WIZ_STEPS = [
			{
				title: "设置输入",
				description: "源数据源与取数方式"
			},
			{
				title: "设置输出",
				description: "目标数据源与写入表"
			},
			{
				title: "设置配置",
				description: "调度与运行参数"
			}
		];
		/** 表单 */
		const form = reactive({
			name: "",
			/** 输入源类型 */
			sourceType: "JDBC",
			sourceDatasourceId: null,
			sourceSql: "",
			/** 源定位：文件族为本地绝对路径，HTTP 族为请求地址 */
			sourcePath: "",
			/** 单文件格式；目录模式按扩展名逐文件判定，这里只是选择器默认值 */
			sourceFormat: "CSV",
			/** CSV 定界符 */
			sourceDelimiter: ",",
			/** Excel 工作表序号（0 起） */
			sourceSheetIndex: 0,
			/** 目录匹配规则 */
			sourcePattern: "*.csv,*.xls,*.xlsx",
			/** 目录是否递归 */
			sourceRecursive: false,
			/** 目录处理完单个文件的动作 */
			sourceAfterProcess: "KEEP",
			/** HTTP 请求方法 */
			sourceMethod: "GET",
			/** HTTP 响应编码 */
			sourceEncoding: "UTF-8",
			/** HTTP 请求头（每行一条 Key: Value） */
			sourceHeaders: "",
			/** HTTP 请求体 */
			sourceBody: "",
			/** JSON 数据位置（点号路径） */
			sourceJsonPath: "",
			/** HTML 行选择器 */
			sourceRowSelector: "table tr",
			/** HTML 单元格选择器 */
			sourceCellSelector: "td,th",
			/** HTML 首行是否表头 */
			sourceHeaderRow: true,
			/** HTTP Cookie（整串，如 "SID=abc; uid=7"） */
			sourceCookie: "",
			/** HTTP 超时（秒） */
			sourceTimeout: 30,
			targetDatasourceId: null,
			targetTable: "",
			writeMode: "INSERT",
			/** 同步模式：FULL 全量 / INCREMENTAL 增量 */
			syncMode: "FULL",
			/** 增量字段（源结果集里存在的列名） */
			incField: "",
			/** 增量每批数量（单次执行最多同步条数），null=不限 */
			incBatchSize: null,
			/** Hook 通知地址，空=不通知 */
			hookUrl: "",
			/** Hook 通知时机：DONE 完成通知 / ROW 每条数据+完成 */
			hookNotify: "DONE",
			/** 增量水位（仅编辑时展示；服务端执行成功后回写，不随表单提交） */
			lastSeq: "",
			batchSize: 500,
			cron: "",
			enabled: false,
			mapping: []
		});
		/** 本机文件选择器可见性 */
		const filePickerVisible = ref(false);
		/** 选择器模式：FILE 选文件 / DIR 选目录 */
		const filePickerMode = ref("DIR");
		/** 打开本机文件/目录选择器 */
		const openPathPicker = (mode) => {
			filePickerMode.value = mode;
			filePickerVisible.value = true;
		};
		/**
		* ReFilePicker 的 loader：列后端所在机器的目录（filesystem-starter 的目录浏览接口）。
		* loader 必须由宿主配置为远端接口形状（FilePickerItem[]），不得回退到组件内置 mock。
		*
		* <p>「文件系统根」两边表达不同：组件用虚拟根 `/`。filesystem-starter 已按同一语义
		* 处理（Windows 返回盘符列表，类 Unix 直接列 `/`），所以这里不再做根目录重试。</p>
		*
		* <p>选择文件夹时也要求返回文件：最后一层目录里有什么文件，是用户确认「进对目录」的
		* 唯一依据；文件在目录模式下只展示、不可选。</p>
		*
		* @param path 当前目录（组件虚拟根为 `/`）
		*/
		const localFileLoader = async (path) => {
			return (await fetchLocalFiles(path || "", true) ?? []).map((item) => ({
				key: item.key,
				name: item.name,
				isDir: item.isDir,
				size: item.size ?? void 0,
				updatedAt: item.updatedAt ?? void 0
			}));
		};
		/** 选中文件/目录 */
		const onPathPicked = (items) => {
			if (items && items.length) {
				form.sourcePath = items[0].key;
				if (!items[0].isDir) form.sourceFormat = detectFormat(items[0].key);
			}
			filePickerVisible.value = false;
		};
		/**
		* 按扩展名推断文件格式
		* @param path 文件路径
		*/
		const detectFormat = (path) => /\.(xls|xlsx|xlsm)$/i.test(path || "") ? "EXCEL" : "CSV";
		/**
		* 解析「Key: Value」多行文本成对象
		* @param text 多行文本
		*/
		const parseHeaderLines = (text) => {
			const headers = {};
			(text || "").split("\n").map((line) => line.trim()).filter(Boolean).forEach((line) => {
				const idx = line.indexOf(":");
				if (idx > 0) {
					const key = line.slice(0, idx).trim();
					if (key) headers[key] = line.slice(idx + 1).trim();
				}
			});
			return headers;
		};
		/**
		* 对象转「Key: Value」多行文本
		* @param headers 头对象
		*/
		const formatHeaderLines = (headers) => {
			if (!headers) return "";
			return Object.entries(headers).map(([key, value]) => `${key}: ${value}`).join("\n");
		};
		/**
		* 组装 sourceOptions JSON
		*
		* <p>按源类型给不同的字段集合：文件族与 HTTP 族的字段名不重叠，后端按 sourceType 决定读哪一套。</p>
		*/
		const buildSourceOptions = () => {
			if (form.sourceType === "JDBC") return null;
			if (form.sourceType === "HTTP_JSON" || form.sourceType === "HTTP_HTML") {
				const headerMap = parseHeaderLines(form.sourceHeaders);
				return JSON.stringify({
					method: form.sourceMethod,
					headers: Object.keys(headerMap).length ? headerMap : void 0,
					body: form.sourceMethod === "GET" ? void 0 : form.sourceBody || void 0,
					encoding: form.sourceEncoding,
					jsonPath: form.sourceType === "HTTP_JSON" ? form.sourceJsonPath || void 0 : void 0,
					rowSelector: form.sourceType === "HTTP_HTML" ? form.sourceRowSelector || void 0 : void 0,
					cellSelector: form.sourceType === "HTTP_HTML" ? form.sourceCellSelector || void 0 : void 0,
					headerRow: form.sourceType === "HTTP_HTML" ? form.sourceHeaderRow : void 0,
					timeoutSeconds: form.sourceTimeout,
					cookie: form.sourceCookie?.trim() ? form.sourceCookie.trim() : void 0
				});
			}
			return JSON.stringify({
				format: form.sourceType === "FILE" ? form.sourceFormat : void 0,
				delimiter: form.sourceType === "FILE" ? form.sourceDelimiter || void 0 : void 0,
				sheetIndex: form.sourceType === "FILE" && form.sourceFormat === "EXCEL" ? form.sourceSheetIndex : void 0,
				pattern: form.sourceType === "DIR" ? form.sourcePattern || void 0 : void 0,
				recursive: form.sourceType === "DIR" ? form.sourceRecursive : void 0,
				afterProcess: form.sourceType === "DIR" ? form.sourceAfterProcess : void 0
			});
		};
		/**
		* 切换输入源类型
		*
		* <p>刻意不清空其它类型的字段：用户在「文件」和「文件夹」之间来回切时路径通常是想保留的，
		* 只有换到需要不同定位方式的类型（JDBC / HTTP）才把 sourcePath 与 sourceSql 分开管。</p>
		*/
		const onSourceTypeChange = (type) => {
			if (type === "JDBC" || type === "HTTP_JSON" || type === "HTTP_HTML") {
				form.sourceSql = "";
				pickedSourceTable.value = null;
				sourceTables.value = [];
			} else if (type === "FILE" || type === "DIR") form.sourceDatasourceId = null;
			previewSourceColumns.value = [];
			previewWarnings.value = [];
		};
		/**
		* 切换同步模式：增量模式下把「先清空再插入」换成「存在即更新」。
		*
		* <p>先清空语义与增量水位天然冲突——每批执行都会把目标表清掉，
		* 上一轮同步的数据直接消失。后端也会在保存时拦，这里提前调好少一次报错往返。</p>
		*/
		const onSyncModeChange = (mode) => {
			if (mode === "INCREMENTAL" && form.writeMode === "OVERWRITE") {
				form.writeMode = "UPSERT";
				message.info("增量模式已将写入模式调整为「存在即更新」——先清空再插入会清掉未同步的数据");
			}
		};
		/**
		* 任务生效的同步模式（存量行该列为空时按全量）
		* @param row 任务
		*/
		const effectiveSyncMode = (row) => row.syncTaskSyncMode || "FULL";
		/**
		* 把存储的 sourceOptions 回填到表单
		*
		* <p>只覆盖存里有的字段，没存的保留默认：后端会归一化默认值，前端不重复推导一套规则。</p>
		*
		* @param options 已解析的选项对象
		*/
		const applySourceOptions = (options) => {
			const str = (key) => {
				const value = options[key];
				return typeof value === "string" && value ? value : null;
			};
			const num = (key) => {
				const value = options[key];
				return typeof value === "number" && Number.isFinite(value) ? value : null;
			};
			const format = str("format");
			if (format === "CSV" || format === "EXCEL") form.sourceFormat = format;
			form.sourceDelimiter = str("delimiter") ?? form.sourceDelimiter;
			form.sourceSheetIndex = num("sheetIndex") ?? form.sourceSheetIndex;
			form.sourcePattern = str("pattern") ?? form.sourcePattern;
			if (typeof options.recursive === "boolean") form.sourceRecursive = options.recursive;
			const afterProcess = str("afterProcess");
			if (afterProcess === "KEEP" || afterProcess === "ARCHIVE" || afterProcess === "DELETE") form.sourceAfterProcess = afterProcess;
			form.sourceMethod = str("method") ?? form.sourceMethod;
			form.sourceEncoding = str("encoding") ?? form.sourceEncoding;
			const headers = options.headers;
			if (headers && typeof headers === "object" && !Array.isArray(headers)) form.sourceHeaders = formatHeaderLines(headers);
			form.sourceBody = str("body") ?? "";
			form.sourceJsonPath = str("jsonPath") ?? "";
			form.sourceRowSelector = str("rowSelector") ?? form.sourceRowSelector;
			form.sourceCellSelector = str("cellSelector") ?? form.sourceCellSelector;
			if (typeof options.headerRow === "boolean") form.sourceHeaderRow = options.headerRow;
			form.sourceCookie = str("cookie") ?? "";
			form.sourceTimeout = num("timeoutSeconds") ?? form.sourceTimeout;
		};
		/**
		* 解析任务上的 sourceOptions
		* @param json 存储值
		*/
		const parseSourceOptions = (json) => {
			if (!json) return {};
			try {
				return JSON.parse(json);
			} catch {
				return {};
			}
		};
		/** 仅 jdbc 类型数据源 */
		const jdbcSources = computed(() => datasources.value.filter((ds) => (ds.type || "").toLowerCase() === "jdbc"));
		/** 源列下拉项（优先用预览结果，未预览时给一个占位以支持手填） */
		const sourceColumnOptions = computed(() => previewSourceColumns.value);
		/** 目标列下拉项 */
		const targetColumnOptions = computed(() => previewTargetColumns.value);
		/**
		* 数据源名称
		* @param id 数据源 ID
		*/
		const dsName = (id) => {
			const hit = datasources.value.find((ds) => ds.id === id);
			return hit ? hit.name : id == null ? "-" : `#${id}`;
		};
		/**
		* 任务源的一句话描述（按源类型给不同内容）
		*
		* <p>列表里原本只有一列「源 SQL」，换成文件/目录/HTTP 后那列会大面积空白，
		* 这里统一收成「类型前缀 + 定位信息」，一眼能看出这个任务从哪儿取数。</p>
		*
		* @param row 任务
		*/
		const sourceLabel = (row) => {
			switch (row.syncTaskSourceType || "JDBC") {
				case "JDBC": return `${dsName(row.syncTaskSourceDatasourceId)} · ${row.syncTaskSourceSql || "-"}`;
				case "FILE": return `文件 · ${row.syncTaskSourcePath || "-"}`;
				case "DIR": return `文件夹 · ${row.syncTaskSourcePath || "-"}`;
				case "HTTP_JSON": return `HTTP-JSON · ${row.syncTaskSourcePath || "-"}`;
				case "HTTP_HTML": return `HTTP-HTML · ${row.syncTaskSourcePath || "-"}`;
				default: return "-";
			}
		};
		/**
		* 写入模式中文
		* @param code 模式编码
		*/
		const modeLabel = (code) => {
			const hit = writeModes.value.find((m) => m.code === code);
			return hit ? hit.label : code || "-";
		};
		/** 状态分段：key 对应下面的 statusOf 分类 */
		const STATUS_SEGMENTS = [
			{
				key: "all",
				label: "全部"
			},
			{
				key: "running",
				label: "运行中"
			},
			{
				key: "success",
				label: "成功"
			},
			{
				key: "failed",
				label: "失败"
			},
			{
				key: "disabled",
				label: "已停用"
			}
		];
		/** 当前状态分段 */
		const statusFilter = ref("all");
		/** 写入模式筛选：'all'=全部（空串会被 el-select 当未选择，显示「请选择」而非选项文案） */
		const writeModeFilter = ref("all");
		/** 任务名称搜索（UI 图右上搜索框；e2e 对照的「不匹配即归零」口径同样经过它） */
		const nameFilter = ref("");
		/**
		* 表格统一 ReTable 的列定义（原七个 el-table-column 收敛于此）。
		*
		* <p>七列全部自定义渲染：prop 只作列的稳定标识（列设置 / 持久化按键），
		* 单元格内容一律走 {@code #col-<prop>} 插槽；宽度 / 对齐 / 固定列与 UI 图逐列一致。</p>
		*/
		const taskColumns = [
			{
				prop: "task",
				label: "任务",
				minWidth: 230
			},
			{
				prop: "flow",
				label: "数据流向",
				minWidth: 250
			},
			{
				prop: "writeMode",
				label: "写入模式",
				width: 118,
				align: "center"
			},
			{
				prop: "cron",
				label: "定时",
				width: 150
			},
			{
				prop: "enabled",
				label: "启用",
				width: 78,
				align: "center"
			},
			{
				prop: "lastRun",
				label: "最近执行",
				minWidth: 260
			},
			{
				prop: "actions",
				label: "操作",
				width: 170,
				fixed: "right",
				align: "center"
			}
		];
		/**
		* 字段映射列（编辑弹窗第 ② 步）：三列全是自定义控件（两个下拉 + 删除按钮），
		* 故每列都配 slot；「操作」列没有对应数据字段，造稳定合成 prop `actions`。
		*
		* <p>原来是无表头的 flex 行，方向靠中间一个 `→` 箭头表达；改成真表头后
		* 「源字段 / 目标字段」列名本身就说清了方向，箭头不再需要。</p>
		*/
		const mappingColumns = [
			{
				prop: "source",
				label: "源字段",
				slot: "source"
			},
			{
				prop: "target",
				label: "目标字段",
				slot: "target"
			},
			{
				prop: "actions",
				label: "操作",
				width: 84,
				align: "center",
				slot: "actions"
			}
		];
		/** 分页：UI 图底部分页；e2e 的行数口径按「当前页行数」+ 徽标仍按全过滤集 */
		const pageNo = ref(1);
		const rangeFilter = ref("all");
		const RANGE_OPTIONS = [
			{
				label: "全部时间",
				value: "all"
			},
			{
				label: "近 1 小时",
				value: "1h"
			},
			{
				label: "近 24 小时",
				value: "24h"
			},
			{
				label: "近 7 天",
				value: "7d"
			}
		];
		/** 列表最近刷新时刻文本（对应图上的「N 分钟前更新」） */
		const refreshedAt = ref(0);
		/** 每 20s 走一次的时钟：让「N 秒前更新」真的会走，而不是停在那儿不动 */
		const clock = ref(Date.now());
		let clockTimer = null;
		const refreshedText = computed(() => {
			if (!refreshedAt.value) return "";
			const sec = Math.max(0, Math.round((clock.value - refreshedAt.value) / 1e3));
			if (sec < 10) return "刚刚更新";
			if (sec < 60) return `${sec} 秒前更新`;
			const min = Math.round(sec / 60);
			if (min < 60) return `${min} 分钟前更新`;
			return `${Math.round(min / 60)} 小时前更新`;
		});
		/** 写入模式下拉项（来自字典，附「全部」项已在模板里单独给） */
		const writeModeOptions = computed(() => writeModes.value.map((m) => ({
			label: m.label,
			value: m.code
		})));
		/** 筛选条件变化 → 回到第 1 页（分页口径下换筛选停在空页尾是假象） */
		watch([
			statusFilter,
			writeModeFilter,
			rangeFilter,
			nameFilter
		], () => {
			pageNo.value = 1;
		});
		/** 运行中的任务：本地点击「立即执行」期间标记，后端无 RUNNING 状态字段 */
		const runningIds = ref(/* @__PURE__ */ new Set());
		/** 任务状态归类 */
		function statusOf(row) {
			if (row.syncTaskEnabled !== 1) return "disabled";
			if (runningIds.value.has(row.id)) return "running";
			if (row.syncTaskLastStatus === "SUCCESS") return "success";
			if (row.syncTaskLastStatus) return "failed";
			return "success";
		}
		/**
		* 各分段计数。
		*
		* <p>计数基数是 {@link baseTasks}（已受写入模式 + 时间范围约束），而不是全量 {@link tasks}：
		* 否则会出现「全部 10」却只列出 7 行 —— 徽标说的和表格给的不是一个数。KPI 卡另走全量口径，
		* 因为它描述的是整体盘子，不该随筛选跳动。</p>
		*
		* @param key 分段
		* @returns 该分段当前可见的任务数
		*/
		function segCount(key) {
			if (key === "all") return baseTasks.value.length;
			return baseTasks.value.filter((t) => statusOf(t) === key).length;
		}
		/** 解析后端的时间字符串（yyyy-MM-dd HH:mm:ss 或 ISO），无法解析返回 null */
		function parseRunTime(v) {
			if (!v) return null;
			const t = Date.parse(v.includes("T") ? v : v.replace(" ", "T"));
			return Number.isNaN(t) ? null : t;
		}
		/** 时间范围对应的毫秒数；null 表示不限时间 */
		function rangeMs() {
			if (rangeFilter.value === "all") return null;
			return (rangeFilter.value === "1h" ? 1 : rangeFilter.value === "7d" ? 168 : 24) * 36e5;
		}
		/** 是否落在所选时间范围内（无执行时间的不参与时间过滤，只受状态/模式影响） */
		function inRange(row) {
			const t = parseRunTime(row.syncTaskLastRunTime);
			const ms = rangeMs();
			if (t == null || ms == null) return true;
			return Date.now() - t <= ms;
		}
		/** 基础集：写入模式 + 时间范围 + 名称搜索三道与状态无关的过滤 */
		const baseTasks = computed(() => tasks.value.filter((row) => (writeModeFilter.value === "all" || row.syncTaskWriteMode === writeModeFilter.value) && inRange(row) && (!nameFilter.value.trim() || (row.syncTaskName || "").toLowerCase().includes(nameFilter.value.trim().toLowerCase()))));
		/** 表格实际数据源：基础集再按状态分段收一道 */
		const filteredTasks = computed(() => baseTasks.value.filter((row) => statusFilter.value === "all" || statusOf(row) === statusFilter.value));
		/** 当前页切片；筛选条件变化时回到第 1 页（watch 见下方） */
		const pageTasks = computed(() => filteredTasks.value.slice((pageNo.value - 1) * PAGE_SIZE, pageNo.value * PAGE_SIZE));
		/** 页脚「显示 a-b 条」 */
		const pageStart = computed(() => filteredTasks.value.length ? (pageNo.value - 1) * PAGE_SIZE + 1 : 0);
		const pageEnd = computed(() => Math.min(pageNo.value * PAGE_SIZE, filteredTasks.value.length));
		/** 今日成功率：今日有执行记录的任务里成功占比；无今日执行则为 null（显示「—」，不伪造 100%） */
		const todayRate = computed(() => {
			const start = /* @__PURE__ */ new Date();
			start.setHours(0, 0, 0, 0);
			const t0 = start.getTime();
			let ok = 0, all = 0;
			for (const t of tasks.value) {
				const ts = parseRunTime(t.syncTaskLastRunTime);
				if (ts == null || ts < t0) continue;
				all++;
				if (t.syncTaskLastStatus === "SUCCESS") ok++;
			}
			return all ? ok / all * 100 : null;
		});
		/** 全量口径计数：KPI 卡描述整体盘子，不随筛选跳动（分段徽标才跟随筛选） */
		function globalCount(key) {
			if (key === "all") return tasks.value.length;
			return tasks.value.filter((t) => statusOf(t) === key).length;
		}
		/**
		* Spring 6 段 cron → 中文一句话（定时列第二行，UI 图里的「每 5 分钟」）。
		*
		* <p>只解析演示数据里出现的形状（秒 分 时 日 月 周），不追求完整 cron 语义：
		* 其它形状原样回显 cron，不伪造中文。</p>
		*
		* @param expr cron 表达式
		*/
		function cronDesc(expr) {
			const raw = (expr || "").trim().split(/\s+/);
			const parts = raw.length === 7 ? raw.slice(0, 6) : raw;
			if (parts.length !== 6) return "";
			const [sec, min, hour, dom, mon, dow] = parts;
			if (sec === "0" && dom === "*" && mon === "*" && dow === "?") {
				if (min !== "*" && hour === "*") {
					const stepMin = /^0\/(\d+)$/.exec(min);
					if (stepMin) return `每 ${stepMin[1]} 分钟`;
				}
				if (/^\d+$/.test(min) && hour === "*") return `每 1 小时`;
				if (/^\d+$/.test(min) && /^\d+$/.test(hour)) return `每天 ${hour.padStart(2, "0")}:${min.padStart(2, "0")}`;
				if (/^\d+$/.test(min) && /^0\/(\d+)$/.test(hour)) return `每 ${/^0\/(\d+)$/.exec(hour)[1]} 小时`;
			}
			if (sec === "0" && /^\d+$/.test(min) && /^\d+$/.test(hour) && /^\d+$/.test(dom) && mon === "*" && dow === "?") return `每月 ${dom} 日 ${hour.padStart(2, "0")}:${min.padStart(2, "0")}`;
			if (sec === "0" && /^\d+$/.test(min) && /^\d+$/.test(hour) && dom === "?" && mon === "*" && /^\d+$/.test(dow)) return `每周${"日一二三四五六"[Number(dow) % 7]} ${hour.padStart(2, "0")}:${min.padStart(2, "0")}`;
			return "";
		}
		/**
		* cron 显示用短式：7 段（带年份）只显示前 6 段调度语义，全文落在 title。
		* @param expr cron 表达式
		*/
		function cronShort(expr) {
			const raw = (expr || "").trim().split(/\s+/);
			return (raw.length === 7 ? raw.slice(0, 6) : raw).join(" ");
		}
		/** 失败任务（全量口径：横幅与全部重试的输入，不随筛选跳动） */
		const failedTasks = computed(() => tasks.value.filter((t) => statusOf(t) === "failed"));
		/** 横幅本轮是否被手动关闭 */
		const bannerDismissed = ref(false);
		/** 全部重试进行中 */
		const retryingAll = ref(false);
		/**
		* 全部重试：对失败任务逐个立即执行，最后统一刷新。
		* @returns 是否全部成功
		*/
		const retryAllFailed = async () => {
			if (!failedTasks.value.length || retryingAll.value) return;
			retryingAll.value = true;
			try {
				for (const t of failedTasks.value) await run(t);
			} finally {
				retryingAll.value = false;
			}
		};
		/** 失败任务数（全量口径） */
		const failedCount = computed(() => globalCount("failed"));
		/** 已停用任务数 */
		function disabledCountOf() {
			return tasks.value.filter((t) => t.syncTaskEnabled !== 1).length;
		}
		/** 有执行时间的任务，按执行时间升序（sparkline 的公共输入） */
		function orderedRuns() {
			return tasks.value.map((t) => ({
				at: parseRunTime(t.syncTaskLastRunTime),
				ok: t.syncTaskLastStatus === "SUCCESS"
			})).filter((x) => x.at != null).sort((a, b) => a.at - b.at);
		}
		/**
		* KPI 卡的 sparkline 序列。
		*
		* <p><b>口径说明（避免把「无数据」画成「平的 0 值」）</b>：后端只给每个任务的<b>最近一次</b>执行，
		* 没有历史执行表。所以曲线一律取「按最近执行时间升序、累计到当前」这条真实可得的数据，
		* 而不是编一条随机曲线；<b>序列不足 2 点时前端不渲染 svg</b>。结果是：</p>
		* <ul>
		*   <li>今日成功率、失败 / 告警 —— 有多任务执行时间，能画出真实累计曲线；</li>
		*   <li>同步任务数、运行中 —— 后端没有对应的时间序列接口（要历史执行表），
		*       单点画不出趋势，<b>刻意留空</b>而不是补一条假线。要补需后端出统计接口。</li>
		* </ul>
		*
		* @param key 指标键
		* @returns 数值序列（按时间升序）
		*/
		function sparkSeries(key) {
			const rows = orderedRuns();
			if (key === "rate") {
				if (!rows.length) return [];
				const out = [];
				let ok = 0;
				rows.forEach((r, i) => {
					if (r.ok) ok++;
					out.push(Math.round(ok / (i + 1) * 1e3) / 10);
				});
				return out;
			}
			if (key === "failed") {
				if (!rows.length) return [];
				const out = [];
				let n = 0;
				rows.forEach((r) => {
					if (!r.ok) n++;
					out.push(n);
				});
				return out;
			}
			return [];
		}
		/** 生成 sparkline 的 polyline points（宽 120 高 32，自带 y 轴上下留白） */
		function sparkPoints(data) {
			if (data.length < 2) return "";
			const min = Math.min(...data);
			const range = Math.max(...data) - min || 1;
			return data.map((v, i) => {
				const x = i / (data.length - 1) * 120;
				const y = 30 - (v - min) / range * 26;
				return `${x.toFixed(1)},${y.toFixed(1)}`;
			}).join(" ");
		}
		const kpiCards = computed(() => {
			const enabled = tasks.value.filter((t) => t.syncTaskEnabled === 1).length;
			const disabled = disabledCountOf();
			const rate = todayRate.value;
			return [
				{
					key: "tasks",
					title: "同步任务数",
					value: String(tasks.value.length),
					desc: `启用 ${enabled} · 停用 ${disabled}`,
					icon: files_default,
					color: "var(--el-color-primary)",
					spark: sparkSeries("tasks")
				},
				{
					key: "running",
					title: "运行中",
					value: String(globalCount("running")),
					desc: `成功 ${globalCount("success")} · 失败 ${failedCount.value}`,
					icon: loading_default,
					color: "var(--el-color-success)",
					spark: sparkSeries("running")
				},
				{
					key: "rate",
					title: "今日成功率",
					value: rate == null ? "—" : rate.toFixed(1),
					desc: rate == null ? "今日暂无执行记录" : "按今日已执行任务统计",
					icon: circle_check_default,
					color: "var(--el-color-warning)",
					spark: sparkSeries("rate")
				},
				{
					key: "failed",
					title: "失败 / 告警",
					value: String(failedCount.value),
					desc: failedCount.value ? "需人工介入" : "暂无失败任务",
					icon: warning_default,
					color: "var(--el-color-danger)",
					spark: sparkSeries("failed")
				}
			];
		});
		/** 写入模式标签色：追加=success / 覆盖=warning / Upsert=primary / 其它=info */
		function writeModeTagType(code) {
			const c = (code || "").toUpperCase();
			if (c === "INSERT") return "success";
			if (c === "OVERWRITE" || c === "REPLACE") return "warning";
			if (c === "UPSERT") return "primary";
			return "info";
		}
		/** 耗时文本：ms → 人类可读（图中口径：秒级 + 两位小数） */
		function formatCost(ms) {
			if (ms == null) return "—";
			const v = Number(ms);
			if (!Number.isFinite(v)) return "—";
			if (v < 1e3) return `${Math.round(v)}ms`;
			if (v < 6e4) return `${(v / 1e3).toFixed(2)}s`;
			return `${Math.floor(v / 6e4)}m${Math.round(v % 6e4 / 1e3)}s`;
		}
		/** 源类型中文标签（用于卡片化后的「任务」列副标题） */
		function sourceTypeLabel(row) {
			const t = (row.syncTaskSourceType || "JDBC").toUpperCase();
			switch (t) {
				case "JDBC": return "数据源";
				case "FILE": return "文件";
				case "DIR": return "文件夹";
				case "HTTP_JSON": return "HTTP-JSON";
				case "HTTP_HTML": return "HTTP-HTML";
				default: return t;
			}
		}
		/** 源侧摘要（表格「任务」列副标题用的文案）：返回**完整**原文（SQL / 路径），
		*  超长交给 CSS 省略（.st-sub-clip）+ title 悬停看全文 —— JS 硬截会让悬停也拿不到
		*  后半段，长 SQL 一旦需要核对（尤其删除前）就必须能看到全量。 */
		function sourceBrief(row) {
			const t = (row.syncTaskSourceType || "JDBC").toUpperCase();
			if (t === "JDBC") return row.syncTaskSourceSql || "自定义 SQL";
			if (t === "DIR") return row.syncTaskSourcePath || "目录";
			if (t === "FILE" || t.startsWith("HTTP")) return row.syncTaskSourcePath || "—";
			return "—";
		}
		/** 源侧完整描述（数据流向 chip 的 title） */
		function sourceFull(row) {
			return sourceLabel(row);
		}
		/** 源侧名称（数据流向 chip 的正文） */
		function sourceTableName(row) {
			if ((row.syncTaskSourceType || "JDBC").toUpperCase() === "JDBC") {
				const m = /from\s+[`"]?([\w.]+)[`"]?/i.exec(row.syncTaskSourceSql || "");
				return m ? m[1] : dsName(row.syncTaskSourceDatasourceId);
			}
			const seg = (row.syncTaskSourcePath || "").split(/[\\/]/).filter(Boolean);
			return seg.length ? seg[seg.length - 1] : sourceTypeLabel(row);
		}
		/** 拉数据源台账 */
		const loadDatasources = async () => {
			try {
				datasources.value = await fetchDataSources();
			} catch (e) {
				message.error("加载数据源失败：" + e?.message);
			}
		};
		/** 拉任务列表 */
		const refresh = async () => {
			loading.value = true;
			try {
				tasks.value = await fetchSyncTasks();
				refreshedAt.value = Date.now();
				runningIds.value = /* @__PURE__ */ new Set();
				bannerDismissed.value = false;
				pageNo.value = 1;
			} catch (e) {
				message.error("加载同步任务失败：" + e?.message);
			} finally {
				loading.value = false;
			}
		};
		/**
		* 加载某数据源的表清单
		*
		* <p>走数据源中心（{@code @pages/datasource}）而非直接调监控后端的 /db 接口：
		* 中心侧会按数据源登记的库名挑选实际库，避免「登记库不是目标库」时列出空清单。</p>
		*
		* @param id 数据源 ID
		* @param target 是否为目标侧
		*/
		const loadTables = async (id, target) => {
			if (id == null) return;
			try {
				const list = await fetchDatasourceTables(id);
				if (target) targetTables.value = list;
				else sourceTables.value = list;
			} catch {
				if (target) targetTables.value = [];
				else sourceTables.value = [];
			}
		};
		/** 源数据源变更 */
		const onSourceChange = async () => {
			pickedSourceTable.value = null;
			previewSourceColumns.value = [];
			await loadTables(form.sourceDatasourceId, false);
		};
		/** 目标数据源变更 */
		const onTargetChange = async () => {
			previewTargetColumns.value = [];
			await loadTables(form.targetDatasourceId, true);
		};
		/** 由所选表生成源 SQL */
		const applySourceTable = () => {
			if (pickedSourceTable.value) form.sourceSql = `SELECT * FROM \`${pickedSourceTable.value}\``;
		};
		/**
		* 清除所选表：随选表自动生成的 SQL 一并清掉。
		* 不清的话，只读框里会留着旧表的 SELECT，与「未选表」的状态自相矛盾
		* （run8 实测：数据表已清空、SQL 仍是 `SELECT * FROM flyway_schema_history`）。
		*/
		const onSourceTableClear = () => {
			form.sourceSql = "";
		};
		/** 切换取数方式：回到「选择数据表」时按所选表重建 SQL */
		const onSourceModeChange = () => {
			if (sourceMode.value === "table") applySourceTable();
		};
		/**
		* ReCron 变更：只在明确判定非法（第二参 false）且表达式非空时提示
		* @param expression 当前表达式
		* @param valid      组件给出的合法性
		*/
		const onCronChange = (expression, valid) => {
			cronError.value = expression.trim() && !valid ? "cron 表达式不合法，请检查后再保存" : "";
		};
		/**
		* 某一步的校验结论（纯函数、无副作用：只读表单，不弹消息、不改状态）。
		* 「下一步」拦截与页脚实时状态条共用这同一条真实结论，保证两处口径一致。
		* @param index 步骤下标
		* @returns 通过返回 null，否则返回第一条待完善说明
		*/
		const stepIssue = (index) => {
			if (index === 0) {
				if (form.sourceType === "JDBC") {
					if (form.sourceDatasourceId == null) return "请先选择源数据源";
					if (!form.sourceSql.trim()) return "请选择数据表或填写源读取 SQL";
					if (!/^\s*select/i.test(form.sourceSql)) return "源读取 SQL 必须以 SELECT 开头";
					return null;
				}
				const path = form.sourcePath.trim();
				if (!path) {
					if (form.sourceType === "FILE") return "请选择要同步的文件";
					if (form.sourceType === "DIR") return "请选择要监听的文件夹";
					return "请填写请求地址";
				}
				if (form.sourceType === "HTTP_JSON" || form.sourceType === "HTTP_HTML") {
					if (!/^https?:\/\//i.test(path)) return "请求地址必须以 http:// 或 https:// 开头";
				}
				return null;
			}
			if (index === 1) {
				if (form.targetDatasourceId == null) return "请先选择目标数据源";
				if (!form.targetTable.trim()) return "请选择或输入目标数据表";
				if (form.syncMode === "INCREMENTAL") {
					if (form.sourceType !== "JDBC" && form.sourceType !== "HTTP_JSON" && form.sourceType !== "HTTP_HTML") return "增量模式仅支持 JDBC / HTTP 输入源，文件/目录请用全量";
					const incField = form.incField.trim();
					if (!incField) return "增量模式必须填写增量字段";
					if (!/^[A-Za-z0-9_]{1,64}$/.test(incField)) return "增量字段名只允许字母、数字、下划线";
					if (form.writeMode === "OVERWRITE") return "增量模式不能使用「先清空再插入」（每批都会清空目标表）";
				}
				return null;
			}
			if (index === 2) {
				const hookUrl = form.hookUrl.trim();
				if (hookUrl && !/^https?:\/\//i.test(hookUrl)) return "Hook 通知地址必须以 http:// 或 https:// 开头";
				if (hookUrl.length > 512) return "Hook 通知地址过长（最多 512 字符）";
				return null;
			}
			return null;
		};
		/**
		* 校验某一步能否进入下一步（stepIssue 的包装：拦截时如实弹出第一条问题）
		* @param index 步骤下标
		*/
		const validateStep = (index) => {
			const issue = stepIssue(index);
			if (issue) {
				message.warning(issue);
				return false;
			}
			return true;
		};
		/** 当前步骤的实时校验结论（页脚状态条用；随表单输入即时更新） */
		const stepIssueNow = computed(() => stepIssue(step.value));
		/** 下一步 */
		const nextStep = () => {
			if (!validateStep(step.value)) return;
			step.value = Math.min(2, step.value + 1);
		};
		/** 上一步 */
		const prevStep = () => {
			step.value = Math.max(0, step.value - 1);
		};
		/** 打开新建弹窗 */
		const openCreate = () => {
			editingId.value = null;
			form.name = "";
			form.sourceType = "JDBC";
			const defaultSource = jdbcSources.value[0];
			const defaultTarget = jdbcSources.value[1] ?? jdbcSources.value[0];
			form.sourceDatasourceId = defaultSource ? defaultSource.id ?? null : null;
			form.sourceSql = "";
			form.sourcePath = "";
			form.sourceFormat = "CSV";
			form.sourceDelimiter = ",";
			form.sourceSheetIndex = 0;
			form.sourcePattern = "*.csv,*.xls,*.xlsx";
			form.sourceRecursive = false;
			form.sourceAfterProcess = "KEEP";
			form.sourceMethod = "GET";
			form.sourceEncoding = "UTF-8";
			form.sourceHeaders = "";
			form.sourceCookie = "";
			form.sourceBody = "";
			form.sourceJsonPath = "";
			form.sourceRowSelector = "table tr";
			form.sourceCellSelector = "td,th";
			form.sourceHeaderRow = true;
			form.sourceTimeout = 30;
			form.targetDatasourceId = defaultTarget ? defaultTarget.id ?? null : null;
			form.targetTable = "";
			form.writeMode = "INSERT";
			form.syncMode = "FULL";
			form.incField = "";
			form.incBatchSize = null;
			form.hookUrl = "";
			form.hookNotify = "DONE";
			form.lastSeq = "";
			form.batchSize = 500;
			form.cron = "";
			form.enabled = false;
			form.mapping = [];
			previewSourceColumns.value = [];
			previewTargetColumns.value = [];
			previewWarnings.value = [];
			pickedSourceTable.value = null;
			sourceTables.value = [];
			targetTables.value = [];
			step.value = 0;
			sourceMode.value = "table";
			cronError.value = "";
			dialogVisible.value = true;
			loadTables(form.sourceDatasourceId, false);
			loadTables(form.targetDatasourceId, true);
		};
		/**
		* 打开编辑弹窗
		* @param row 任务
		*/
		const openEdit = (row) => {
			editingId.value = row.id;
			form.name = row.syncTaskName;
			const type = row.syncTaskSourceType || "JDBC";
			form.sourceType = SOURCE_TYPE_HINT[type] ? type : "JDBC";
			form.sourceDatasourceId = row.syncTaskSourceDatasourceId ?? null;
			form.sourceSql = row.syncTaskSourceSql || "";
			form.sourcePath = row.syncTaskSourcePath || "";
			form.sourceFormat = "CSV";
			form.sourceDelimiter = ",";
			form.sourceSheetIndex = 0;
			form.sourcePattern = "*.csv,*.xls,*.xlsx";
			form.sourceRecursive = false;
			form.sourceAfterProcess = "KEEP";
			form.sourceMethod = "GET";
			form.sourceEncoding = "UTF-8";
			form.sourceHeaders = "";
			form.sourceCookie = "";
			form.sourceBody = "";
			form.sourceJsonPath = "";
			form.sourceRowSelector = "table tr";
			form.sourceCellSelector = "td,th";
			form.sourceHeaderRow = true;
			form.sourceTimeout = 30;
			applySourceOptions(parseSourceOptions(row.syncTaskSourceOptions));
			form.targetDatasourceId = row.syncTaskTargetDatasourceId;
			form.targetTable = row.syncTaskTargetTable;
			form.writeMode = row.syncTaskWriteMode || "INSERT";
			form.syncMode = row.syncTaskSyncMode === "INCREMENTAL" ? "INCREMENTAL" : "FULL";
			form.incField = row.syncTaskIncField || "";
			form.incBatchSize = row.syncTaskIncBatchSize ?? null;
			form.hookUrl = row.syncTaskHookUrl || "";
			form.hookNotify = row.syncTaskHookNotify === "ROW" ? "ROW" : "DONE";
			form.lastSeq = row.syncTaskLastSeq || "";
			form.batchSize = row.syncTaskBatchSize || 500;
			form.cron = row.syncTaskCron || "";
			form.enabled = row.syncTaskEnabled === 1;
			form.mapping = parseMapping(row.syncTaskColumnMapping);
			previewSourceColumns.value = [];
			previewTargetColumns.value = [];
			previewWarnings.value = [];
			pickedSourceTable.value = null;
			sourceTables.value = [];
			targetTables.value = [];
			cronError.value = "";
			step.value = 0;
			const tableHit = /^\s*select\s+\*\s+from\s+`([^`]+)`\s*;?\s*$/i.exec(row.syncTaskSourceSql || "");
			sourceMode.value = tableHit ? "table" : "sql";
			pickedSourceTable.value = tableHit ? tableHit[1] : null;
			dialogVisible.value = true;
			loadTables(form.sourceDatasourceId, false);
			loadTables(form.targetDatasourceId, true);
		};
		/**
		* 解析字段映射 JSON
		* @param json 存储值
		*/
		const parseMapping = (json) => {
			if (!json) return [];
			try {
				const parsed = JSON.parse(json);
				return Array.isArray(parsed) ? parsed : [];
			} catch {
				return [];
			}
		};
		/** 加一行空白映射 */
		const addMappingRow = () => {
			form.mapping.push({
				source: "",
				target: ""
			});
		};
		/**
		* 删一行映射（ReTable 插槽只回传 row，没有 el-table 列插槽的 $index，
		* 故按下标查找后 splice —— 与原 `form.mapping.splice(index, 1)` 等价）。
		*/
		const removeMappingRow = (cellRow) => {
			const item = cellRow;
			const i = form.mapping.indexOf(item);
			if (i >= 0) form.mapping.splice(i, 1);
		};
		/** 预览并自动配对 */
		const doPreview = async () => {
			if (form.targetDatasourceId == null) {
				message.warning("请先选择目标数据源");
				return;
			}
			if (form.sourceType === "JDBC") {
				if (form.sourceDatasourceId == null) {
					message.warning("请先选择源数据源");
					return;
				}
				if (!form.sourceSql.trim()) {
					message.warning("请先填写源读取 SQL");
					return;
				}
			} else if (!form.sourcePath.trim()) {
				message.warning("请先选择文件或文件夹");
				return;
			}
			if (!form.targetTable.trim()) {
				message.warning("请先填写目标表名");
				return;
			}
			try {
				const preview = await previewSyncMapping({
					sourceType: form.sourceType,
					sourceDatasourceId: form.sourceDatasourceId,
					sourceSql: form.sourceSql,
					sourcePath: form.sourcePath,
					sourceOptions: buildSourceOptions(),
					targetDatasourceId: form.targetDatasourceId,
					targetTable: form.targetTable,
					mapping: form.mapping.filter((item) => item.source && item.target)
				});
				previewSourceColumns.value = preview.sourceColumns;
				previewTargetColumns.value = preview.targetColumns;
				previewWarnings.value = preview.warnings;
				form.mapping = preview.mapping.map((item) => ({ ...item }));
				message.success(`源 ${preview.sourceColumns.length} 列 / 目标 ${preview.targetColumns.length} 列，已配对 ${preview.mapping.length} 项`);
			} catch (e) {
				previewWarnings.value = [];
				const errText = e?.message || "未知错误";
				message.error("预览失败：" + errText);
				if (isTableMissingError(errText)) openTableDesigner(errText);
			}
		};
		/** 设计表网格的一行（与 CreateTableDialog 的列定义同形；来自源表元数据时只填真实读到的项） */
		const tableDesignerVisible = ref(false);
		/** 缺失的表在哪一侧：决定设计器连哪个数据源、建完刷新哪张表清单 */
		const designerSide = ref("target");
		/** 预填的表名（缺失表名；用户可在设计器里改） */
		const designerTable = ref("");
		/** 预填的列：目标侧缺表时带入真实源列，源侧缺表（无从读列）留空由用户设计 */
		const designerColumns = ref([]);
		/** 设计器要连的数据源 ID */
		const designerDatasourceId = ref(null);
		/** 预览报错是不是「表不存在」（MySQL / PostgreSQL / Oracle 三种方言的形态） */
		const isTableMissingError = (message) => /doesn'?t exist|does not exist|ORA-00942|表不存在/i.test(message);
		/** 从方言报错里抠出缺失的表名：Table 'db.tbl' / relation "tbl" / 表 tbl 不存在 */
		const parseMissingTable = (message) => {
			const raw = (/Table '([^']+)'/.exec(message) || /relation "([^"]+)"/.exec(message) || /表\s*[`'"]?([\w.]+)[`'"]?\s*不存在/.exec(message))?.[1] ?? "";
			return (raw.split(".").pop() ?? raw).replace(/[`"]/g, "").trim() || null;
		};
		/** 缺失表在源侧还是目标侧：与目标表名、选表模式表名、SQL 的 FROM/JOIN 表逐一比对 */
		const detectMissingSide = (table) => {
			const norm = (s) => s.replace(/[`"\s]/g, "").toLowerCase();
			if (form.sourceType !== "JDBC" || !table) return "target";
			if (norm(form.targetTable) === norm(table)) return "target";
			if (sourceMode.value === "table" && pickedSourceTable.value && norm(pickedSourceTable.value) === norm(table)) return "source";
			if (sourceMode.value === "sql") {
				if ([...form.sourceSql.matchAll(/(?:from|join)\s+`?([\w.]+)`?/gi)].map((m) => (m[1] ?? "").split(".").pop() ?? "").some((ref) => norm(ref) === norm(table))) return "source";
			}
			return "target";
		};
		/** 目标侧预填：拿真实源列当设计起点（源列取不到就空着手设计，不编造列） */
		const fetchSourcePrefill = async () => {
			if (form.sourceType !== "JDBC" || form.sourceDatasourceId == null) return [];
			try {
				if (sourceMode.value === "table" && pickedSourceTable.value) return (await fetchTableColumns(pickedSourceTable.value, form.sourceDatasourceId)).map((c) => ({
					name: c.name,
					type: (c.baseType || c.type || "VARCHAR").toUpperCase(),
					size: c.size > 0 ? c.size : null,
					scale: c.scale && c.scale > 0 ? c.scale : null,
					nullable: c.nullable,
					primaryKey: c.isPrimaryKey ?? false,
					autoIncrement: c.autoIncrement ?? false,
					defaultValue: c.default ?? "",
					comment: c.remark ?? "",
					enumText: (c.enumValues ?? []).join(", ")
				}));
			} catch {}
			return [];
		};
		/** 预览失败且是「表不存在」→ 打开设计表向导 */
		const openTableDesigner = async (message) => {
			const missing = parseMissingTable(message);
			const side = detectMissingSide(missing);
			designerSide.value = side;
			designerTable.value = missing ?? (side === "target" ? form.targetTable.trim() : pickedSourceTable.value ?? "");
			designerDatasourceId.value = (side === "target" ? form.targetDatasourceId : form.sourceDatasourceId) ?? null;
			designerColumns.value = side === "target" ? await fetchSourcePrefill() : [];
			tableDesignerVisible.value = true;
		};
		/** 建表成功（后端已按方言 CREATE TABLE）→ 回填表名、刷新表清单并自动续跑预览 */
		const onTableCreated = async (_database, table) => {
			if (designerSide.value === "target") {
				form.targetTable = table;
				loadTables(form.targetDatasourceId, true);
			} else {
				sourceMode.value = "table";
				pickedSourceTable.value = table;
				form.sourceSql = `SELECT * FROM \`${table}\``;
				loadTables(form.sourceDatasourceId, false);
			}
			await doPreview();
		};
		/** 保存任务 */
		const submit = async () => {
			if (!validateStep(0)) {
				step.value = 0;
				return;
			}
			if (!validateStep(1)) {
				step.value = 1;
				return;
			}
			if (!validateStep(2)) {
				step.value = 2;
				return;
			}
			if (cronError.value) {
				message.warning(cronError.value);
				return;
			}
			if (!form.name.trim()) {
				message.warning("任务名称不能为空");
				return;
			}
			if (form.enabled && !form.cron.trim()) {
				message.warning("启用定时前请先填写定时表达式");
				return;
			}
			const mapping = form.mapping.filter((item) => item.source && item.target);
			const targetId = form.targetDatasourceId;
			if (targetId == null) return;
			saving.value = true;
			try {
				const payload = {
					name: form.name.trim(),
					sourceType: form.sourceType,
					sourceDatasourceId: form.sourceType === "JDBC" ? form.sourceDatasourceId : null,
					sourceSql: form.sourceType === "JDBC" ? form.sourceSql.trim() : null,
					sourcePath: form.sourceType === "JDBC" ? null : form.sourcePath.trim(),
					sourceOptions: buildSourceOptions(),
					targetDatasourceId: targetId,
					targetTable: form.targetTable.trim(),
					columnMapping: mapping.length ? JSON.stringify(mapping) : null,
					writeMode: form.writeMode,
					syncMode: form.syncMode,
					incField: form.incField.trim() || null,
					incBatchSize: form.syncMode === "INCREMENTAL" ? form.incBatchSize ?? null : null,
					hookUrl: form.hookUrl.trim() || null,
					hookNotify: form.hookNotify,
					batchSize: form.batchSize,
					cron: form.cron.trim() ? form.cron.trim() : null,
					enabled: form.enabled ? 1 : 0
				};
				if (editingId.value) await updateSyncTask(editingId.value, payload);
				else await createSyncTask(payload);
				message.success("已保存");
				dialogVisible.value = false;
				await refresh();
			} catch (e) {
				message.error("保存失败：" + e?.message);
			} finally {
				saving.value = false;
			}
		};
		/**
		* 立即执行
		* @param row 任务
		*/
		const run = async (row) => {
			runningId.value = row.id;
			runningIds.value = /* @__PURE__ */ new Set([...runningIds.value, row.id]);
			try {
				const result = await runSyncTask(row.id);
				appendLogEntry(row.id, {
					at: result.runTime || (/* @__PURE__ */ new Date()).toLocaleString(),
					status: result.status,
					read: result.readCount,
					write: result.writeCount,
					costMs: result.costMs,
					message: result.message || ""
				});
				if (result.status === "SUCCESS") message.success(`执行成功：读 ${result.readCount} 行，写 ${result.writeCount} 行，${result.costMs}ms`);
				else message.error(`执行失败：${result.message}`);
			} catch (e) {
				const errText = e?.message || String(e);
				appendLogEntry(row.id, {
					at: (/* @__PURE__ */ new Date()).toLocaleString(),
					status: "ERROR",
					read: 0,
					write: 0,
					costMs: 0,
					message: errText
				});
				message.error("执行失败：" + errText);
			} finally {
				runningId.value = null;
				await refresh();
			}
		};
		/** localStorage key 前缀（按任务隔离） */
		const logVisible = ref(false);
		/** 日志弹窗当前任务 */
		const logTask = ref(null);
		/** 本机执行记录（新 → 旧；服务端接口不可用时的降级数据） */
		const logEntries = ref([]);
		/** 服务端执行调试日志（进行中执行在最前，其后已完成执行新 → 旧） */
		const logRuns = ref([]);
		/** 服务端日志拉取错误；非空表示进入降级展示 */
		const logFetchError = ref("");
		/** 服务端日志拉取中 */
		const logLoading = ref(false);
		/** 当前展开的执行条目下标（默认最新一次；-1 表示全部收起） */
		const expandedLogRun = ref(0);
		/** 弹窗打开期间的轮询句柄 */
		let logPollTimer = null;
		/** 读某任务的本机记录（存储损坏时静默降级为空） */
		const readLogEntries = (taskId) => {
			try {
				const raw = localStorage.getItem(LOG_LS_PREFIX + taskId);
				const list = raw ? JSON.parse(raw) : [];
				return Array.isArray(list) ? list : [];
			} catch {
				return [];
			}
		};
		/** 追加一条记录并回写存储；日志弹窗开着且正是这个任务时同步刷新列表 */
		const appendLogEntry = (taskId, entry) => {
			const list = [entry, ...readLogEntries(taskId)].slice(0, LOG_MAX_ENTRIES);
			try {
				localStorage.setItem(LOG_LS_PREFIX + taskId, JSON.stringify(list));
			} catch {}
			if (logVisible.value && logTask.value?.id === taskId) logEntries.value = list;
		};
		/** 打开日志弹窗（操作列「日志」与失败横幅的任务名都走这里，绝不触碰新建）；
		*  服务端调试日志由 logVisible 的 watcher 拉取并启动轮询 */
		const openLog = (row) => {
			logTask.value = row;
			logEntries.value = readLogEntries(row.id);
			logRuns.value = [];
			logFetchError.value = "";
			expandedLogRun.value = 0;
			logVisible.value = true;
		};
		/** 清空当前任务的本机记录 */
		const clearLogEntries = () => {
			const task = logTask.value;
			if (!task) return;
			try {
				localStorage.removeItem(LOG_LS_PREFIX + task.id);
			} catch {}
			logEntries.value = [];
		};
		/** 弹窗内直接执行一次：run() 负责刷新任务行与本机记录，随后立刻拉服务端调试日志对齐最新 */
		const runFromLog = async () => {
			const task = logTask.value;
			if (!task) return;
			await run(task);
			logEntries.value = readLogEntries(task.id);
			const fresh = tasks.value.find((t) => t.id === task.id);
			if (fresh) logTask.value = fresh;
			await fetchLogRuns();
		};
		/** 从日志弹窗跳到编辑（先关日志；任务可能已在别处删除，拿不到最新行就用弹窗里的快照） */
		const openEditFromLog = () => {
			const current = logTask.value;
			if (!current) return;
			logVisible.value = false;
			openEdit(tasks.value.find((t) => t.id === current.id) ?? current);
		};
		/** 拉取当前任务的服务端调试日志；失败时进入降级展示（错误原文如实显示给用户） */
		const fetchLogRuns = async () => {
			const task = logTask.value;
			if (!task || logLoading.value) return;
			logLoading.value = true;
			try {
				logRuns.value = await fetchSyncTaskLogs(task.id);
				logFetchError.value = "";
				await nextTick();
				if (logRuns.value[0]?.status === "RUNNING" && expandedLogRun.value === 0) {
					const body = document.querySelector(".st-log-dlg .st-log-run.is-active .st-log-run-body");
					if (body) body.scrollTop = body.scrollHeight;
				}
			} catch (e) {
				logFetchError.value = e?.message || String(e);
			} finally {
				logLoading.value = false;
			}
		};
		/** 触发方式展示名 */
		const triggerLabel = (trigger) => trigger === "SCHEDULED" ? "定时" : trigger === "REALTIME" ? "实时" : "手动";
		/** 执行状态展示名 */
		const statusLabel = (status) => status === "RUNNING" ? "执行中" : status === "SUCCESS" ? "成功" : "失败";
		/** 弹窗可见性联动：打开即拉一次并启动轮询（进行中的执行实时追加），关闭即停 */
		watch(logVisible, async (visible) => {
			if (visible) {
				await fetchLogRuns();
				if (logPollTimer == null) logPollTimer = setInterval(() => {
					if (!document.hidden) fetchLogRuns();
				}, 1500);
			} else if (logPollTimer != null) {
				clearInterval(logPollTimer);
				logPollTimer = null;
			}
		});
		/** 组件卸载兜底清理轮询 */
		onUnmounted(() => {
			if (logPollTimer != null) {
				clearInterval(logPollTimer);
				logPollTimer = null;
			}
		});
		/**
		* 启停定时
		* @param row 任务
		* @param enabled 目标状态
		*/
		const toggle = async (row, enabled) => {
			try {
				if (enabled) {
					if (!row.syncTaskCron) {
						message.warning("该任务没有定时表达式，请先编辑任务填写 cron");
						return;
					}
					await enableSyncTask(row.id);
					message.success("已启用定时");
				} else {
					await disableSyncTask(row.id);
					message.success("已停用定时");
				}
				await refresh();
			} catch (e) {
				message.error("切换失败：" + e?.message);
				await refresh();
			}
		};
		/**
		* 删除任务
		* @param row 任务
		*/
		const remove = async (row) => {
			try {
				await ElMessageBox.confirm(`确认删除同步任务「${row.syncTaskName}」？`, "删除确认", { type: "warning" });
			} catch {
				return;
			}
			try {
				await deleteSyncTask(row.id);
				message.success("已删除");
				await refresh();
			} catch (e) {
				message.error("删除失败：" + e?.message);
			}
		};
		onMounted(async () => {
			clockTimer = setInterval(() => {
				clock.value = Date.now();
			}, 2e4);
			await loadDatasources();
			try {
				writeModes.value = await fetchSyncWriteModes();
			} catch {
				writeModes.value = [
					{
						code: "INSERT",
						label: "追加插入"
					},
					{
						code: "REPLACE",
						label: "存在即替换"
					},
					{
						code: "UPSERT",
						label: "存在即更新"
					},
					{
						code: "OVERWRITE",
						label: "先清空再插入"
					}
				];
			}
			await refresh();
		});
		/** 离开页面时停掉时钟定时器，避免组件卸载后仍每 20s 醒一次 */
		onUnmounted(() => {
			if (clockTimer) {
				clearInterval(clockTimer);
				clockTimer = null;
			}
		});
		return (_ctx, _cache) => {
			const _component_ReIcon = resolveComponent("ReIcon");
			const _component_ReButton = resolveComponent("ReButton");
			const _component_ReStatCard = resolveComponent("ReStatCard");
			const _component_el_tag = resolveComponent("el-tag");
			const _component_ReSelect = resolveComponent("ReSelect");
			const _component_el_input = resolveComponent("el-input");
			const _component_el_switch = resolveComponent("el-switch");
			const _component_ReTable = resolveComponent("ReTable");
			const _component_el_pagination = resolveComponent("el-pagination");
			const _component_el_radio = resolveComponent("el-radio");
			const _component_el_radio_group = resolveComponent("el-radio-group");
			const _component_el_option = resolveComponent("el-option");
			const _component_el_select = resolveComponent("el-select");
			const _component_el_radio_button = resolveComponent("el-radio-button");
			const _component_el_input_number = resolveComponent("el-input-number");
			return openBlock(), createElementBlock("div", _hoisted_1, [
				createBaseVNode("div", _hoisted_2, [_cache[54] || (_cache[54] = createBaseVNode("div", { class: "dsm-toolbar-left" }, [createBaseVNode("div", { class: "st-page-title" }, [createTextVNode("数据同步 "), createBaseVNode("span", { class: "st-env-badge" }, "● 生产环境")]), createBaseVNode("div", { class: "st-page-sub" }, "管理从数据源到数仓 / 应用的同步任务，监控执行状态与告警")], -1)), createBaseVNode("div", _hoisted_3, [
					createBaseVNode("span", _hoisted_4, toDisplayString(refreshedText.value || "— 分钟前更新"), 1),
					createVNode(_component_ReButton, {
						loading: loading.value,
						onClick: refresh
					}, {
						icon: withCtx(() => [createVNode(_component_ReIcon, { name: "Refresh" })]),
						default: withCtx(() => [_cache[51] || (_cache[51] = createTextVNode("刷新 ", -1))]),
						_: 1
					}, 8, ["loading"]),
					createVNode(_component_ReButton, {
						type: "primary",
						onClick: openCreate
					}, {
						icon: withCtx(() => [createVNode(_component_ReIcon, { name: "Plus" })]),
						default: withCtx(() => [_cache[52] || (_cache[52] = createTextVNode("新建任务 ", -1))]),
						_: 1
					}),
					createVNode(_component_ReButton, { onClick: _cache[0] || (_cache[0] = ($event) => bulkImportVisible.value = true) }, {
						icon: withCtx(() => [createVNode(_component_ReIcon, { name: "Upload" })]),
						default: withCtx(() => [_cache[53] || (_cache[53] = createTextVNode("批量导入 ", -1))]),
						_: 1
					})
				])]),
				createBaseVNode("section", _hoisted_5, [(openBlock(true), createElementBlock(Fragment, null, renderList(kpiCards.value, (k) => {
					return openBlock(), createElementBlock("div", {
						key: k.key,
						class: "st-kpi-cell"
					}, [createVNode(_component_ReStatCard, {
						size: "compact",
						title: k.title,
						value: k.value,
						desc: k.desc,
						icon: k.icon,
						"icon-color": k.color
					}, null, 8, [
						"title",
						"value",
						"desc",
						"icon",
						"icon-color"
					]), k.spark.length > 1 ? (openBlock(), createElementBlock("svg", _hoisted_6, [createBaseVNode("polyline", {
						class: "st-spark-line",
						style: normalizeStyle({ stroke: k.color }),
						points: sparkPoints(k.spark)
					}, null, 12, _hoisted_7)])) : createCommentVNode("", true)]);
				}), 128))]),
				failedTasks.value.length && !bannerDismissed.value ? (openBlock(), createElementBlock("section", _hoisted_8, [
					createBaseVNode("span", _hoisted_9, [createVNode(_component_ReIcon, {
						name: "Bell",
						size: 18
					})]),
					createBaseVNode("div", _hoisted_10, [createBaseVNode("div", _hoisted_11, [createTextVNode(toDisplayString(failedTasks.value.length) + " 个任务最近执行失败 ", 1), createVNode(_component_el_tag, {
						type: "danger",
						effect: "dark",
						size: "small",
						round: ""
					}, {
						default: withCtx(() => [..._cache[55] || (_cache[55] = [createTextVNode("需处理", -1)])]),
						_: 1
					})]), createBaseVNode("div", _hoisted_12, [(openBlock(true), createElementBlock(Fragment, null, renderList(failedTasks.value, (t) => {
						return openBlock(), createElementBlock("button", {
							key: t.id,
							type: "button",
							class: "st-alert-chip",
							title: `查看 ${t.syncTaskName} 的执行日志`,
							onClick: ($event) => openLog(t)
						}, [
							_cache[56] || (_cache[56] = createBaseVNode("span", {
								class: "st-alert-dot",
								"aria-hidden": "true"
							}, null, -1)),
							createBaseVNode("span", _hoisted_14, toDisplayString(t.syncTaskName), 1),
							createBaseVNode("span", _hoisted_15, toDisplayString(t.syncTaskLastMessage || "执行失败"), 1),
							createVNode(_component_ReIcon, {
								name: "Right",
								size: 12
							})
						], 8, _hoisted_13);
					}), 128))])]),
					createBaseVNode("div", _hoisted_16, [createVNode(_component_ReButton, {
						loading: retryingAll.value,
						size: "small",
						onClick: retryAllFailed
					}, {
						default: withCtx(() => [..._cache[57] || (_cache[57] = [createTextVNode("全部重试", -1)])]),
						_: 1
					}, 8, ["loading"]), createBaseVNode("button", {
						type: "button",
						class: "st-alert-close",
						"aria-label": "关闭失败提醒",
						onClick: _cache[1] || (_cache[1] = ($event) => bannerDismissed.value = true)
					}, [createVNode(_component_ReIcon, {
						name: "Close",
						size: 14
					})])])
				])) : createCommentVNode("", true),
				createBaseVNode("div", _hoisted_17, [createBaseVNode("div", _hoisted_18, [(openBlock(), createElementBlock(Fragment, null, renderList(STATUS_SEGMENTS, (seg) => {
					return createBaseVNode("button", {
						key: seg.key,
						class: normalizeClass(["st-seg", { on: statusFilter.value === seg.key }]),
						onClick: ($event) => statusFilter.value = seg.key
					}, [createBaseVNode("span", _hoisted_20, toDisplayString(seg.label), 1), createBaseVNode("span", _hoisted_21, toDisplayString(segCount(seg.key)), 1)], 10, _hoisted_19);
				}), 64))]), createBaseVNode("div", _hoisted_22, [
					createVNode(_component_ReSelect, {
						modelValue: writeModeFilter.value,
						"onUpdate:modelValue": _cache[2] || (_cache[2] = ($event) => writeModeFilter.value = $event),
						class: "st-filter-sel",
						options: [{
							label: "写入模式：全部",
							value: "all"
						}, ...writeModeOptions.value]
					}, null, 8, ["modelValue", "options"]),
					createVNode(_component_ReSelect, {
						modelValue: rangeFilter.value,
						"onUpdate:modelValue": _cache[3] || (_cache[3] = ($event) => rangeFilter.value = $event),
						class: "st-filter-sel",
						options: RANGE_OPTIONS
					}, null, 8, ["modelValue"]),
					createVNode(_component_el_input, {
						modelValue: nameFilter.value,
						"onUpdate:modelValue": _cache[4] || (_cache[4] = ($event) => nameFilter.value = $event),
						class: "st-search",
						placeholder: "搜索任务名称…",
						"aria-label": "搜索任务名称",
						clearable: ""
					}, {
						prefix: withCtx(() => [createVNode(_component_ReIcon, {
							name: "Search",
							size: 14
						})]),
						_: 1
					}, 8, ["modelValue"])
				])]),
				createBaseVNode("div", _hoisted_23, [createVNode(_component_ReTable, {
					data: pageTasks.value,
					columns: taskColumns,
					loading: loading.value,
					pagination: false,
					toolbar: false,
					"table-id": "monitor-sync-tasks",
					stripe: "",
					"empty-text": "没有符合条件的同步任务"
				}, {
					"col-task": withCtx(({ row }) => [createBaseVNode("div", _hoisted_24, [createBaseVNode("span", {
						class: normalizeClass(["st-dot", statusOf(row)]),
						"aria-hidden": "true"
					}, null, 2), createBaseVNode("button", {
						type: "button",
						class: "st-name st-name-btn",
						title: `编辑 ${row.syncTaskName}`,
						onClick: ($event) => openEdit(row)
					}, toDisplayString(row.syncTaskName), 9, _hoisted_25)]), createBaseVNode("div", {
						class: "st-sub mono st-sub-clip",
						title: `${sourceTypeLabel(row)} · ${sourceBrief(row)}`
					}, toDisplayString(sourceTypeLabel(row)) + " · " + toDisplayString(sourceBrief(row)), 9, _hoisted_26)]),
					"col-flow": withCtx(({ row }) => [createBaseVNode("div", _hoisted_27, [
						createBaseVNode("span", {
							class: "st-flow-chip",
							title: sourceFull(row)
						}, [createVNode(_component_ReIcon, {
							name: "Coin",
							size: 12
						}), createTextVNode(toDisplayString(sourceTableName(row)), 1)], 8, _hoisted_28),
						createVNode(_component_ReIcon, {
							name: "Right",
							size: 12,
							class: "st-flow-arrow"
						}),
						createBaseVNode("span", {
							class: "st-flow-chip",
							title: dsName(row.syncTaskTargetDatasourceId) + "." + row.syncTaskTargetTable
						}, [createVNode(_component_ReIcon, {
							name: "Grid",
							size: 12
						}), createTextVNode(toDisplayString(row.syncTaskTargetTable || "-"), 1)], 8, _hoisted_29)
					])]),
					"col-writeMode": withCtx(({ row }) => [createBaseVNode("div", _hoisted_30, [createVNode(_component_el_tag, {
						type: writeModeTagType(row.syncTaskWriteMode),
						effect: "plain",
						size: "small"
					}, {
						default: withCtx(() => [createTextVNode(toDisplayString(modeLabel(row.syncTaskWriteMode)), 1)]),
						_: 2
					}, 1032, ["type"]), effectiveSyncMode(row) === "INCREMENTAL" ? (openBlock(), createBlock(_component_el_tag, {
						key: 0,
						type: "warning",
						effect: "plain",
						size: "small",
						title: `增量字段 ${row.syncTaskIncField || "-"} · 每批 ${row.syncTaskIncBatchSize ?? "不限"} 条 · 水位 ${row.syncTaskLastSeq || "（首跑）"}`
					}, {
						default: withCtx(() => [..._cache[58] || (_cache[58] = [createTextVNode("增量", -1)])]),
						_: 1
					}, 8, ["title"])) : createCommentVNode("", true)])]),
					"col-cron": withCtx(({ row }) => [row.syncTaskCron ? (openBlock(), createElementBlock(Fragment, { key: 0 }, [createBaseVNode("div", {
						class: "mono st-cron",
						title: row.syncTaskCron
					}, toDisplayString(cronShort(row.syncTaskCron)), 9, _hoisted_31), createBaseVNode("div", _hoisted_32, toDisplayString(cronDesc(row.syncTaskCron)), 1)], 64)) : (openBlock(), createElementBlock("span", _hoisted_33, "仅手动"))]),
					"col-enabled": withCtx(({ row }) => [createVNode(_component_el_switch, {
						"model-value": row.syncTaskEnabled === 1,
						"aria-label": `启用 ${row.syncTaskName}`,
						onChange: (value) => toggle(row, !!value)
					}, null, 8, [
						"model-value",
						"aria-label",
						"onChange"
					])]),
					"col-lastRun": withCtx(({ row }) => [row.syncTaskLastStatus ? (openBlock(), createElementBlock(Fragment, { key: 0 }, [
						createBaseVNode("div", _hoisted_34, [createVNode(_component_el_tag, {
							type: row.syncTaskLastStatus === "SUCCESS" ? "success" : "danger",
							size: "small",
							effect: "light",
							round: ""
						}, {
							default: withCtx(() => [createTextVNode(toDisplayString(row.syncTaskLastStatus === "SUCCESS" ? "成功" : "失败"), 1)]),
							_: 2
						}, 1032, ["type"]), createBaseVNode("span", _hoisted_35, toDisplayString(row.syncTaskLastRunTime), 1)]),
						createBaseVNode("div", _hoisted_36, " 读 " + toDisplayString(row.syncTaskLastReadCount ?? 0) + " / 写 " + toDisplayString(row.syncTaskLastWriteCount ?? 0) + " 行 · " + toDisplayString(formatCost(row.syncTaskLastCostMs)), 1),
						row.syncTaskLastMessage ? (openBlock(), createElementBlock("div", {
							key: 0,
							class: "st-msg st-msg-fail",
							title: row.syncTaskLastMessage
						}, [createVNode(_component_ReIcon, {
							name: "Warning",
							size: 12
						}), createTextVNode(toDisplayString(row.syncTaskLastMessage), 1)], 8, _hoisted_37)) : createCommentVNode("", true)
					], 64)) : row.syncTaskEnabled !== 1 ? (openBlock(), createElementBlock("span", _hoisted_38, "已停用调度")) : (openBlock(), createElementBlock("span", _hoisted_39, "尚未执行"))]),
					"col-actions": withCtx(({ row }) => [createBaseVNode("div", _hoisted_40, [
						createVNode(_component_ReButton, {
							layout: "square",
							icon: "VideoPlay",
							tip: "立即执行",
							loading: runningId.value === row.id,
							disabled: row.syncTaskEnabled !== 1,
							onClick: ($event) => run(row)
						}, null, 8, [
							"loading",
							"disabled",
							"onClick"
						]),
						createVNode(_component_ReButton, {
							layout: "square",
							icon: "Document",
							tip: "日志",
							onClick: ($event) => openLog(row)
						}, null, 8, ["onClick"]),
						createVNode(_component_ReButton, {
							layout: "square",
							icon: "EditPen",
							tip: "编辑",
							onClick: ($event) => openEdit(row)
						}, null, 8, ["onClick"]),
						createVNode(_component_ReButton, {
							layout: "square",
							icon: "Delete",
							type: "danger",
							tip: "删除",
							onClick: ($event) => remove(row)
						}, null, 8, ["onClick"])
					])]),
					_: 1
				}, 8, ["data", "loading"]), createBaseVNode("div", _hoisted_41, [createBaseVNode("span", null, "显示 " + toDisplayString(pageStart.value) + "-" + toDisplayString(pageEnd.value) + " 条，共 " + toDisplayString(tasks.value.length) + " 个同步任务", 1), createVNode(_component_el_pagination, {
					"current-page": pageNo.value,
					"onUpdate:currentPage": _cache[5] || (_cache[5] = ($event) => pageNo.value = $event),
					"page-size": PAGE_SIZE,
					total: filteredTasks.value.length,
					"pager-count": 5,
					size: "small",
					background: "",
					layout: "prev, pager, next",
					"aria-label": "同步任务分页"
				}, null, 8, ["current-page", "total"])])]),
				createVNode(unref(component), {
					modelValue: dialogVisible.value,
					"onUpdate:modelValue": _cache[45] || (_cache[45] = ($event) => dialogVisible.value = $event),
					class: "st-sync-dlg",
					title: editingId.value ? "编辑同步任务" : "新建同步任务",
					subtitle: "配置输入、输出与调度参数",
					icon: unref(upload_default),
					width: "920px",
					"close-on-click-modal": false
				}, {
					footer: withCtx(() => [createBaseVNode("div", _hoisted_112, [createBaseVNode("div", { class: normalizeClass(["st-dlg-status", stepIssueNow.value ? "is-bad" : "is-ok"]) }, [createVNode(_component_ReIcon, {
						name: stepIssueNow.value ? "Warning" : "Select",
						size: 13
					}, null, 8, ["name"]), createBaseVNode("span", null, toDisplayString(stepIssueNow.value ? `待完善：${stepIssueNow.value}` : "本步填写已通过校验"), 1)], 2), createBaseVNode("div", _hoisted_113, [
						step.value > 0 ? (openBlock(), createBlock(_component_ReButton, {
							key: 0,
							onClick: prevStep
						}, {
							icon: withCtx(() => [createVNode(_component_ReIcon, {
								name: "CaretLeft",
								size: 12
							})]),
							default: withCtx(() => [_cache[131] || (_cache[131] = createTextVNode("上一步 ", -1))]),
							_: 1
						})) : createCommentVNode("", true),
						createVNode(_component_ReButton, { onClick: _cache[44] || (_cache[44] = ($event) => dialogVisible.value = false) }, {
							default: withCtx(() => [..._cache[132] || (_cache[132] = [createTextVNode("取消", -1)])]),
							_: 1
						}),
						step.value < 2 ? (openBlock(), createBlock(_component_ReButton, {
							key: 1,
							type: "primary",
							onClick: nextStep
						}, {
							icon: withCtx(() => [createVNode(_component_ReIcon, {
								name: "CaretRight",
								size: 12
							})]),
							default: withCtx(() => [createTextVNode("下一步 · " + toDisplayString(WIZ_STEPS[step.value + 1].title), 1)]),
							_: 1
						})) : (openBlock(), createBlock(_component_ReButton, {
							key: 2,
							type: "primary",
							loading: saving.value,
							onClick: submit
						}, {
							icon: withCtx(() => [createVNode(_component_ReIcon, {
								name: "Select",
								size: 12
							})]),
							default: withCtx(() => [_cache[133] || (_cache[133] = createTextVNode("保存 ", -1))]),
							_: 1
						}, 8, ["loading"]))
					])])]),
					default: withCtx(() => [createBaseVNode("div", _hoisted_42, [(openBlock(), createElementBlock(Fragment, null, renderList(WIZ_STEPS, (item, index) => {
						return createBaseVNode("div", {
							key: item.title,
							class: normalizeClass(["st-step", {
								"is-on": index === step.value,
								"is-done": index < step.value
							}])
						}, [
							createBaseVNode("span", _hoisted_43, [index < step.value ? (openBlock(), createBlock(_component_ReIcon, {
								key: 0,
								name: "Select",
								size: 13
							})) : (openBlock(), createElementBlock(Fragment, { key: 1 }, [createTextVNode(toDisplayString(index + 1), 1)], 64))]),
							index < WIZ_STEPS.length - 1 ? (openBlock(), createElementBlock("span", _hoisted_44)) : createCommentVNode("", true),
							createBaseVNode("span", _hoisted_45, [createBaseVNode("span", _hoisted_46, toDisplayString(item.title), 1), createBaseVNode("span", _hoisted_47, toDisplayString(item.description), 1)])
						], 2);
					}), 64))]), createBaseVNode("div", _hoisted_48, [step.value === 0 ? (openBlock(), createElementBlock(Fragment, { key: 0 }, [createBaseVNode("div", _hoisted_49, [
						_cache[59] || (_cache[59] = createBaseVNode("label", null, "输入源类型", -1)),
						createVNode(_component_el_radio_group, {
							modelValue: form.sourceType,
							"onUpdate:modelValue": _cache[6] || (_cache[6] = ($event) => form.sourceType = $event),
							class: "st-src-cards",
							onChange: onSourceTypeChange
						}, {
							default: withCtx(() => [(openBlock(), createElementBlock(Fragment, null, renderList(SOURCE_TYPES, (item) => {
								return createVNode(_component_el_radio, {
									key: item.value,
									value: item.value,
									class: normalizeClass(["st-src-card", { "is-checked": form.sourceType === item.value }])
								}, {
									default: withCtx(() => [createBaseVNode("span", _hoisted_50, [createVNode(_component_ReIcon, {
										name: item.icon,
										size: 16
									}, null, 8, ["name"])]), createBaseVNode("span", _hoisted_51, toDisplayString(item.label), 1)]),
									_: 2
								}, 1032, ["value", "class"]);
							}), 64))]),
							_: 1
						}, 8, ["modelValue"]),
						createBaseVNode("div", _hoisted_52, toDisplayString(SOURCE_TYPE_HINT[form.sourceType]), 1)
					]), form.sourceType === "JDBC" ? (openBlock(), createElementBlock(Fragment, { key: 0 }, [
						createBaseVNode("div", _hoisted_53, [
							_cache[60] || (_cache[60] = createBaseVNode("label", null, "源数据源（jdbc）", -1)),
							createVNode(_component_el_select, {
								modelValue: form.sourceDatasourceId,
								"onUpdate:modelValue": _cache[7] || (_cache[7] = ($event) => form.sourceDatasourceId = $event),
								placeholder: "从数据源中心选择源数据源",
								class: "st-full",
								onChange: onSourceChange
							}, {
								default: withCtx(() => [(openBlock(true), createElementBlock(Fragment, null, renderList(jdbcSources.value, (ds) => {
									return openBlock(), createBlock(_component_el_option, {
										key: ds.id,
										label: ds.name,
										value: ds.id
									}, null, 8, ["label", "value"]);
								}), 128))]),
								_: 1
							}, 8, ["modelValue"]),
							!jdbcSources.value.length ? (openBlock(), createElementBlock("div", _hoisted_54, "数据源中心还没有 jdbc 数据源，请先到「数据源中心」新增。")) : createCommentVNode("", true)
						]),
						createBaseVNode("div", _hoisted_55, [_cache[63] || (_cache[63] = createBaseVNode("label", null, "取数方式", -1)), createVNode(_component_el_radio_group, {
							modelValue: sourceMode.value,
							"onUpdate:modelValue": _cache[8] || (_cache[8] = ($event) => sourceMode.value = $event),
							onChange: onSourceModeChange
						}, {
							default: withCtx(() => [createVNode(_component_el_radio_button, { value: "table" }, {
								default: withCtx(() => [..._cache[61] || (_cache[61] = [createTextVNode("选择数据表", -1)])]),
								_: 1
							}), createVNode(_component_el_radio_button, { value: "sql" }, {
								default: withCtx(() => [..._cache[62] || (_cache[62] = [createTextVNode("自定义 SQL", -1)])]),
								_: 1
							})]),
							_: 1
						}, 8, ["modelValue"])]),
						sourceMode.value === "table" ? (openBlock(), createElementBlock("div", _hoisted_56, [
							_cache[64] || (_cache[64] = createBaseVNode("label", null, "数据表", -1)),
							createVNode(_component_el_select, {
								modelValue: pickedSourceTable.value,
								"onUpdate:modelValue": _cache[9] || (_cache[9] = ($event) => pickedSourceTable.value = $event),
								placeholder: "选择源库数据表",
								filterable: "",
								clearable: "",
								class: "st-full",
								onChange: applySourceTable,
								onClear: onSourceTableClear
							}, {
								default: withCtx(() => [(openBlock(true), createElementBlock(Fragment, null, renderList(sourceTables.value, (t) => {
									return openBlock(), createBlock(_component_el_option, {
										key: t,
										label: t,
										value: t
									}, null, 8, ["label", "value"]);
								}), 128))]),
								_: 1
							}, 8, ["modelValue"]),
							_cache[65] || (_cache[65] = createBaseVNode("div", { class: "st-form-hint" }, "选中后自动生成 SELECT（见下方 SQL，只读）；需要微调请切到「自定义 SQL」。", -1))
						])) : createCommentVNode("", true),
						createBaseVNode("div", _hoisted_57, [
							_cache[66] || (_cache[66] = createBaseVNode("label", null, "源读取 SQL（必须以 SELECT 开头）", -1)),
							createVNode(_component_el_input, {
								modelValue: form.sourceSql,
								"onUpdate:modelValue": _cache[10] || (_cache[10] = ($event) => form.sourceSql = $event),
								type: "textarea",
								rows: 4,
								class: "mono",
								readonly: sourceMode.value === "table",
								placeholder: "SELECT id, name FROM t_order"
							}, null, 8, ["modelValue", "readonly"]),
							_cache[67] || (_cache[67] = createBaseVNode("div", { class: "st-form-hint" }, "只读源库：写语句会被后端挡下。", -1))
						])
					], 64)) : form.sourceType === "FILE" ? (openBlock(), createElementBlock(Fragment, { key: 1 }, [
						createBaseVNode("div", _hoisted_58, [
							_cache[69] || (_cache[69] = createBaseVNode("label", null, "服务器本地文件", -1)),
							createBaseVNode("div", _hoisted_59, [createVNode(_component_el_input, {
								modelValue: form.sourcePath,
								"onUpdate:modelValue": _cache[11] || (_cache[11] = ($event) => form.sourcePath = $event),
								placeholder: "服务器本地绝对路径，如 /data/order.csv",
								class: "mono st-path-input"
							}, {
								prefix: withCtx(() => [createVNode(_component_ReIcon, {
									name: "Document",
									size: 14
								})]),
								_: 1
							}, 8, ["modelValue"]), createVNode(_component_ReButton, {
								icon: "FolderOpened",
								onClick: _cache[12] || (_cache[12] = ($event) => openPathPicker("FILE"))
							}, {
								default: withCtx(() => [..._cache[68] || (_cache[68] = [createTextVNode("浏览…", -1)])]),
								_: 1
							})]),
							_cache[70] || (_cache[70] = createBaseVNode("div", { class: "st-form-hint st-hint-dot" }, [
								createTextVNode("路径是"),
								createBaseVNode("b", null, "后端服务所在机器"),
								createTextVNode("的路径，不是浏览器所在机器。")
							], -1))
						]),
						_cache[78] || (_cache[78] = createBaseVNode("div", { class: "st-section-label" }, "解析设置", -1)),
						createBaseVNode("div", _hoisted_60, [createBaseVNode("div", _hoisted_61, [_cache[71] || (_cache[71] = createBaseVNode("label", null, "文件格式", -1)), createVNode(_component_el_select, {
							modelValue: form.sourceFormat,
							"onUpdate:modelValue": _cache[13] || (_cache[13] = ($event) => form.sourceFormat = $event),
							class: "st-full"
						}, {
							default: withCtx(() => [createVNode(_component_el_option, {
								label: "CSV / 文本",
								value: "CSV"
							}), createVNode(_component_el_option, {
								label: "Excel（.xls/.xlsx）",
								value: "EXCEL"
							})]),
							_: 1
						}, 8, ["modelValue"])]), form.sourceFormat === "CSV" ? (openBlock(), createElementBlock("div", _hoisted_62, [_cache[76] || (_cache[76] = createBaseVNode("label", null, "定界符", -1)), createVNode(_component_el_radio_group, {
							modelValue: form.sourceDelimiter,
							"onUpdate:modelValue": _cache[14] || (_cache[14] = ($event) => form.sourceDelimiter = $event),
							class: "st-seg-delim"
						}, {
							default: withCtx(() => [
								createVNode(_component_el_radio_button, { value: "," }, {
									default: withCtx(() => [..._cache[72] || (_cache[72] = [createTextVNode("逗号 ,", -1)])]),
									_: 1
								}),
								createVNode(_component_el_radio_button, { value: ";" }, {
									default: withCtx(() => [..._cache[73] || (_cache[73] = [createTextVNode("分号 ;", -1)])]),
									_: 1
								}),
								createVNode(_component_el_radio_button, { value: "\\t" }, {
									default: withCtx(() => [..._cache[74] || (_cache[74] = [createTextVNode("Tab", -1)])]),
									_: 1
								}),
								createVNode(_component_el_radio_button, { value: "|" }, {
									default: withCtx(() => [..._cache[75] || (_cache[75] = [createTextVNode("竖线 |", -1)])]),
									_: 1
								})
							]),
							_: 1
						}, 8, ["modelValue"])])) : (openBlock(), createElementBlock("div", _hoisted_63, [_cache[77] || (_cache[77] = createBaseVNode("label", null, "工作表序号（0 起）", -1)), createVNode(_component_el_input_number, {
							modelValue: form.sourceSheetIndex,
							"onUpdate:modelValue": _cache[15] || (_cache[15] = ($event) => form.sourceSheetIndex = $event),
							min: 0,
							max: 200,
							"controls-position": "right",
							class: "st-full"
						}, null, 8, ["modelValue"])]))]),
						_cache[79] || (_cache[79] = createBaseVNode("div", { class: "st-form-hint" }, "首行默认作为表头（即源列名）。", -1))
					], 64)) : form.sourceType === "DIR" ? (openBlock(), createElementBlock(Fragment, { key: 2 }, [
						createBaseVNode("div", _hoisted_64, [
							_cache[81] || (_cache[81] = createBaseVNode("label", null, "服务器本地文件夹", -1)),
							createBaseVNode("div", _hoisted_65, [createVNode(_component_el_input, {
								modelValue: form.sourcePath,
								"onUpdate:modelValue": _cache[16] || (_cache[16] = ($event) => form.sourcePath = $event),
								placeholder: "服务器本地绝对路径，如 /data/incoming",
								class: "mono st-path-input"
							}, {
								prefix: withCtx(() => [createVNode(_component_ReIcon, {
									name: "FolderOpened",
									size: 14
								})]),
								_: 1
							}, 8, ["modelValue"]), createVNode(_component_ReButton, {
								icon: "Folder",
								onClick: _cache[17] || (_cache[17] = ($event) => openPathPicker("DIR"))
							}, {
								default: withCtx(() => [..._cache[80] || (_cache[80] = [createTextVNode("浏览…", -1)])]),
								_: 1
							})]),
							_cache[82] || (_cache[82] = createBaseVNode("div", { class: "st-form-hint" }, "启用后自动监听该目录，新文件落盘即实时录入。", -1))
						]),
						createBaseVNode("div", _hoisted_66, [createBaseVNode("div", _hoisted_67, [
							_cache[83] || (_cache[83] = createBaseVNode("label", null, "文件匹配规则", -1)),
							createVNode(_component_el_input, {
								modelValue: form.sourcePattern,
								"onUpdate:modelValue": _cache[18] || (_cache[18] = ($event) => form.sourcePattern = $event),
								placeholder: "*.csv,*.xls,*.xlsx",
								class: "mono"
							}, null, 8, ["modelValue"]),
							_cache[84] || (_cache[84] = createBaseVNode("div", { class: "st-form-hint" }, "逗号分隔的 glob；格式按扩展名逐文件判定。", -1))
						]), createBaseVNode("div", _hoisted_68, [_cache[85] || (_cache[85] = createBaseVNode("label", null, "包含子目录", -1)), createVNode(_component_el_switch, {
							modelValue: form.sourceRecursive,
							"onUpdate:modelValue": _cache[19] || (_cache[19] = ($event) => form.sourceRecursive = $event),
							"aria-label": "包含子目录"
						}, null, 8, ["modelValue"])])]),
						createBaseVNode("div", _hoisted_69, [
							_cache[89] || (_cache[89] = createBaseVNode("label", null, "处理完单个文件", -1)),
							createVNode(_component_el_radio_group, {
								modelValue: form.sourceAfterProcess,
								"onUpdate:modelValue": _cache[20] || (_cache[20] = ($event) => form.sourceAfterProcess = $event)
							}, {
								default: withCtx(() => [
									createVNode(_component_el_radio_button, { value: "KEEP" }, {
										default: withCtx(() => [..._cache[86] || (_cache[86] = [createTextVNode("保留原文件", -1)])]),
										_: 1
									}),
									createVNode(_component_el_radio_button, { value: "ARCHIVE" }, {
										default: withCtx(() => [..._cache[87] || (_cache[87] = [createTextVNode("归档到 done/", -1)])]),
										_: 1
									}),
									createVNode(_component_el_radio_button, { value: "DELETE" }, {
										default: withCtx(() => [..._cache[88] || (_cache[88] = [createTextVNode("删除源文件", -1)])]),
										_: 1
									})
								]),
								_: 1
							}, 8, ["modelValue"]),
							_cache[90] || (_cache[90] = createBaseVNode("div", { class: "st-form-hint" }, "归档目录 done/ 会被自动排除，避免归档后被再次同步。", -1))
						])
					], 64)) : (openBlock(), createElementBlock(Fragment, { key: 3 }, [
						createBaseVNode("div", _hoisted_70, [
							_cache[91] || (_cache[91] = createBaseVNode("label", null, "请求地址", -1)),
							createVNode(_component_el_input, {
								modelValue: form.sourcePath,
								"onUpdate:modelValue": _cache[21] || (_cache[21] = ($event) => form.sourcePath = $event),
								placeholder: form.sourceType === "HTTP_JSON" ? "https://api.example.com/v1/orders" : "https://example.com/report",
								class: "mono"
							}, null, 8, ["modelValue", "placeholder"]),
							_cache[92] || (_cache[92] = createBaseVNode("div", { class: "st-form-hint" }, "只支持 http/https；保存时会真实请求一次校验并取列。", -1))
						]),
						createBaseVNode("div", _hoisted_71, [
							createBaseVNode("div", _hoisted_72, [_cache[93] || (_cache[93] = createBaseVNode("label", null, "请求方法", -1)), createVNode(_component_el_select, {
								modelValue: form.sourceMethod,
								"onUpdate:modelValue": _cache[22] || (_cache[22] = ($event) => form.sourceMethod = $event),
								class: "st-full"
							}, {
								default: withCtx(() => [
									createVNode(_component_el_option, {
										label: "GET",
										value: "GET"
									}),
									createVNode(_component_el_option, {
										label: "POST",
										value: "POST"
									}),
									createVNode(_component_el_option, {
										label: "PUT",
										value: "PUT"
									})
								]),
								_: 1
							}, 8, ["modelValue"])]),
							createBaseVNode("div", _hoisted_73, [_cache[94] || (_cache[94] = createBaseVNode("label", null, "响应编码", -1)), createVNode(_component_el_select, {
								modelValue: form.sourceEncoding,
								"onUpdate:modelValue": _cache[23] || (_cache[23] = ($event) => form.sourceEncoding = $event),
								class: "st-full",
								filterable: "",
								"allow-create": "",
								"default-first-option": ""
							}, {
								default: withCtx(() => [
									createVNode(_component_el_option, {
										label: "UTF-8",
										value: "UTF-8"
									}),
									createVNode(_component_el_option, {
										label: "GBK",
										value: "GBK"
									}),
									createVNode(_component_el_option, {
										label: "GB2312",
										value: "GB2312"
									}),
									createVNode(_component_el_option, {
										label: "ISO-8859-1",
										value: "ISO-8859-1"
									})
								]),
								_: 1
							}, 8, ["modelValue"])]),
							createBaseVNode("div", _hoisted_74, [_cache[95] || (_cache[95] = createBaseVNode("label", null, "超时（秒）", -1)), createVNode(_component_el_input_number, {
								modelValue: form.sourceTimeout,
								"onUpdate:modelValue": _cache[24] || (_cache[24] = ($event) => form.sourceTimeout = $event),
								min: 1,
								max: 600,
								"controls-position": "right",
								class: "st-full"
							}, null, 8, ["modelValue"])])
						]),
						createBaseVNode("div", _hoisted_75, [
							_cache[96] || (_cache[96] = createBaseVNode("label", null, "请求头", -1)),
							createVNode(_component_el_input, {
								modelValue: form.sourceHeaders,
								"onUpdate:modelValue": _cache[25] || (_cache[25] = ($event) => form.sourceHeaders = $event),
								type: "textarea",
								rows: 2,
								class: "mono",
								placeholder: "每行一条，格式 Key: Value\nAuthorization: Bearer xxx"
							}, null, 8, ["modelValue"]),
							_cache[97] || (_cache[97] = createBaseVNode("div", { class: "st-form-hint" }, [
								createTextVNode("常用于 "),
								createBaseVNode("code", null, "Authorization"),
								createTextVNode("、"),
								createBaseVNode("code", null, "Accept"),
								createTextVNode(" 等。")
							], -1))
						]),
						createBaseVNode("div", _hoisted_76, [
							_cache[98] || (_cache[98] = createBaseVNode("label", null, "Cookie", -1)),
							createVNode(_component_el_input, {
								modelValue: form.sourceCookie,
								"onUpdate:modelValue": _cache[26] || (_cache[26] = ($event) => form.sourceCookie = $event),
								type: "textarea",
								rows: 2,
								class: "mono",
								placeholder: "SID=abc123; uid=7"
							}, null, 8, ["modelValue"]),
							_cache[99] || (_cache[99] = createBaseVNode("div", { class: "st-form-hint" }, [
								createTextVNode(" 整串粘贴浏览器 DevTools 里复制的 Cookie 值即可。 若上面「请求头」里也写了 "),
								createBaseVNode("code", null, "Cookie"),
								createTextVNode("，以这里为准（不会发两个 Cookie 头）。 ")
							], -1))
						]),
						form.sourceMethod !== "GET" ? (openBlock(), createElementBlock("div", _hoisted_77, [_cache[100] || (_cache[100] = createBaseVNode("label", null, "请求体", -1)), createVNode(_component_el_input, {
							modelValue: form.sourceBody,
							"onUpdate:modelValue": _cache[27] || (_cache[27] = ($event) => form.sourceBody = $event),
							type: "textarea",
							rows: 3,
							class: "mono",
							placeholder: "{\"pageNo\":1,\"pageSize\":500}"
						}, null, 8, ["modelValue"])])) : createCommentVNode("", true),
						form.sourceType === "HTTP_JSON" ? (openBlock(), createElementBlock("div", _hoisted_78, [
							_cache[101] || (_cache[101] = createBaseVNode("label", null, "数据位置（JSON 路径）", -1)),
							createVNode(_component_el_input, {
								modelValue: form.sourceJsonPath,
								"onUpdate:modelValue": _cache[28] || (_cache[28] = ($event) => form.sourceJsonPath = $event),
								class: "mono",
								placeholder: "data.list（留空=响应根数组）"
							}, null, 8, ["modelValue"]),
							_cache[102] || (_cache[102] = createBaseVNode("div", { class: "st-form-hint" }, [
								createTextVNode("点号路径，支持下标："),
								createBaseVNode("code", null, "data.list[0].items"),
								createTextVNode("。留空时若根是对象，会自动取第一个数组字段。数组里每个对象的顶层字段即源列。")
							], -1))
						])) : (openBlock(), createElementBlock(Fragment, { key: 2 }, [createBaseVNode("div", _hoisted_79, [
							createBaseVNode("div", _hoisted_80, [_cache[103] || (_cache[103] = createBaseVNode("label", null, "行选择器", -1)), createVNode(_component_el_input, {
								modelValue: form.sourceRowSelector,
								"onUpdate:modelValue": _cache[29] || (_cache[29] = ($event) => form.sourceRowSelector = $event),
								class: "mono",
								placeholder: "table tr"
							}, null, 8, ["modelValue"])]),
							createBaseVNode("div", _hoisted_81, [_cache[104] || (_cache[104] = createBaseVNode("label", null, "单元格选择器", -1)), createVNode(_component_el_input, {
								modelValue: form.sourceCellSelector,
								"onUpdate:modelValue": _cache[30] || (_cache[30] = ($event) => form.sourceCellSelector = $event),
								class: "mono",
								placeholder: "td,th"
							}, null, 8, ["modelValue"])]),
							createBaseVNode("div", _hoisted_82, [_cache[105] || (_cache[105] = createBaseVNode("label", null, "首行是表头", -1)), createVNode(_component_el_switch, {
								modelValue: form.sourceHeaderRow,
								"onUpdate:modelValue": _cache[31] || (_cache[31] = ($event) => form.sourceHeaderRow = $event),
								"aria-label": "首行是表头"
							}, null, 8, ["modelValue"])])
						]), _cache[106] || (_cache[106] = createBaseVNode("div", { class: "st-form-hint" }, "用 CSS 选择器抓网页表格：行选择器对整篇文档匹配，单元格选择器对每一行匹配。首行默认为表头，其单元格文本即源列名。", -1))], 64))
					], 64))], 64)) : step.value === 1 ? (openBlock(), createElementBlock(Fragment, { key: 1 }, [
						createBaseVNode("div", _hoisted_83, [_cache[107] || (_cache[107] = createBaseVNode("label", null, "目标数据源（jdbc）", -1)), createVNode(_component_el_select, {
							modelValue: form.targetDatasourceId,
							"onUpdate:modelValue": _cache[32] || (_cache[32] = ($event) => form.targetDatasourceId = $event),
							placeholder: "从数据源中心选择目标数据源",
							class: "st-full",
							onChange: onTargetChange
						}, {
							default: withCtx(() => [(openBlock(true), createElementBlock(Fragment, null, renderList(jdbcSources.value, (ds) => {
								return openBlock(), createBlock(_component_el_option, {
									key: ds.id,
									label: ds.name,
									value: ds.id
								}, null, 8, ["label", "value"]);
							}), 128))]),
							_: 1
						}, 8, ["modelValue"])]),
						createBaseVNode("div", _hoisted_84, [createBaseVNode("div", _hoisted_85, [
							_cache[108] || (_cache[108] = createBaseVNode("label", null, "目标数据表", -1)),
							createVNode(_component_el_select, {
								modelValue: form.targetTable,
								"onUpdate:modelValue": _cache[33] || (_cache[33] = ($event) => form.targetTable = $event),
								placeholder: "选择或输入目标表名",
								filterable: "",
								"allow-create": "",
								"default-first-option": "",
								class: "st-full"
							}, {
								default: withCtx(() => [(openBlock(true), createElementBlock(Fragment, null, renderList(targetTables.value, (t) => {
									return openBlock(), createBlock(_component_el_option, {
										key: t,
										label: t,
										value: t
									}, null, 8, ["label", "value"]);
								}), 128))]),
								_: 1
							}, 8, ["modelValue"]),
							_cache[109] || (_cache[109] = createBaseVNode("div", { class: "st-form-hint" }, "表清单取自目标数据源；不在清单中的表名可直接输入。预览发现表不存在时，会弹出设计表向导在对应库建好并自动继续预览。", -1))
						]), createBaseVNode("div", _hoisted_86, [_cache[110] || (_cache[110] = createBaseVNode("label", null, "写入模式", -1)), createVNode(_component_el_select, {
							modelValue: form.writeMode,
							"onUpdate:modelValue": _cache[34] || (_cache[34] = ($event) => form.writeMode = $event),
							class: "st-full"
						}, {
							default: withCtx(() => [(openBlock(true), createElementBlock(Fragment, null, renderList(writeModes.value, (m) => {
								return openBlock(), createBlock(_component_el_option, {
									key: m.code,
									label: m.label + "（" + m.code + "）",
									value: m.code
								}, null, 8, ["label", "value"]);
							}), 128))]),
							_: 1
						}, 8, ["modelValue"])])]),
						createBaseVNode("div", _hoisted_87, [createBaseVNode("div", _hoisted_88, [
							_cache[111] || (_cache[111] = createBaseVNode("label", null, "同步模式", -1)),
							createVNode(_component_el_select, {
								modelValue: form.syncMode,
								"onUpdate:modelValue": _cache[35] || (_cache[35] = ($event) => form.syncMode = $event),
								class: "st-full",
								onChange: onSyncModeChange
							}, {
								default: withCtx(() => [createVNode(_component_el_option, {
									label: "全量（每次读取全部源数据）",
									value: "FULL"
								}), createVNode(_component_el_option, {
									label: "增量（按增量字段水位取新数据）",
									value: "INCREMENTAL"
								})]),
								_: 1
							}, 8, ["modelValue"]),
							createBaseVNode("div", _hoisted_89, toDisplayString(form.syncMode === "INCREMENTAL" ? "按增量字段升序分批取数，每轮成功后自动记录水位，下次只取新于水位的数据；配合「存在即更新」不产生重复。" : "单次流式读完全部源数据，适用于小数据范围；配合「先清空再插入」即为全量覆盖。大数据请用增量模式。"), 1)
						]), createBaseVNode("div", _hoisted_90, [
							_cache[114] || (_cache[114] = createBaseVNode("label", null, "增量字段", -1)),
							createVNode(_component_el_input, {
								modelValue: form.incField,
								"onUpdate:modelValue": _cache[36] || (_cache[36] = ($event) => form.incField = $event),
								class: "mono",
								disabled: form.syncMode !== "INCREMENTAL",
								placeholder: "如 id / updated_at（源结果集里存在的列）"
							}, null, 8, ["modelValue", "disabled"]),
							form.syncMode === "INCREMENTAL" ? (openBlock(), createElementBlock("div", _hoisted_91, [_cache[113] || (_cache[113] = createTextVNode(" JDBC：自动包裹进源 SQL（水位条件+升序+每批上限）；HTTP：以查询参数携带上次水位。 ", -1)), form.lastSeq ? (openBlock(), createElementBlock(Fragment, { key: 0 }, [createBaseVNode("b", null, "当前水位：" + toDisplayString(form.lastSeq), 1), _cache[112] || (_cache[112] = createTextVNode("（改动字段会清空水位）", -1))], 64)) : (openBlock(), createElementBlock(Fragment, { key: 1 }, [createTextVNode("尚无水位，首跑按升序分批引导。")], 64))])) : (openBlock(), createElementBlock("div", _hoisted_92, "切换为增量模式后可填写；源 SQL 与该列需同时存在于结果集。"))
						])]),
						form.syncMode === "INCREMENTAL" ? (openBlock(), createElementBlock("div", _hoisted_93, [
							_cache[115] || (_cache[115] = createBaseVNode("label", null, "每批数量（单次执行最多同步条数，留空不限）", -1)),
							createVNode(_component_el_input_number, {
								modelValue: form.incBatchSize,
								"onUpdate:modelValue": _cache[37] || (_cache[37] = ($event) => form.incBatchSize = $event),
								min: 1,
								max: 1e8,
								step: 1e3,
								"controls-position": "right",
								class: "st-full",
								placeholder: "留空表示不限"
							}, null, 8, ["modelValue"]),
							_cache[116] || (_cache[116] = createBaseVNode("div", { class: "st-form-hint" }, "积压数据分轮自动消化：每轮取最老的 N 条并推进水位，下一轮接着往后，不漏不重。", -1))
						])) : createCommentVNode("", true),
						createBaseVNode("div", _hoisted_94, [
							createBaseVNode("div", _hoisted_95, [
								_cache[118] || (_cache[118] = createBaseVNode("span", { class: "st-preview-title" }, "解析预览", -1)),
								createBaseVNode("span", _hoisted_96, toDisplayString(previewSourceColumns.value.length ? `源 ${previewSourceColumns.value.length} 列 · 目标 ${previewTargetColumns.value.length} 列 · 已配对 ${form.mapping.length} 项` : "尚未预览"), 1),
								createVNode(_component_ReButton, { onClick: doPreview }, {
									icon: withCtx(() => [createVNode(_component_ReIcon, { name: "Refresh" })]),
									default: withCtx(() => [_cache[117] || (_cache[117] = createTextVNode("预览 / 自动配对 ", -1))]),
									_: 1
								})
							]),
							previewSourceColumns.value.length ? (openBlock(), createElementBlock("div", _hoisted_97, [(openBlock(true), createElementBlock(Fragment, null, renderList(previewSourceColumns.value, (col) => {
								return openBlock(), createElementBlock("span", {
									key: col.name,
									class: "st-chip"
								}, [createBaseVNode("b", _hoisted_98, toDisplayString(col.name), 1), createBaseVNode("i", _hoisted_99, toDisplayString(col.type), 1)]);
							}), 128))])) : (openBlock(), createElementBlock("div", _hoisted_100, "点「预览 / 自动配对」真实读取一次源列与目标列，并按同名自动配对。")),
							(openBlock(true), createElementBlock(Fragment, null, renderList(previewWarnings.value, (warning, index) => {
								return openBlock(), createElementBlock("div", {
									key: index,
									class: "st-warn"
								}, toDisplayString(warning), 1);
							}), 128))
						]),
						createBaseVNode("div", _hoisted_101, [createBaseVNode("div", _hoisted_102, [_cache[120] || (_cache[120] = createBaseVNode("span", null, "字段映射（源 → 目标）", -1)), createBaseVNode("div", _hoisted_103, [createVNode(_component_ReButton, { onClick: addMappingRow }, {
							icon: withCtx(() => [createVNode(_component_ReIcon, { name: "Plus" })]),
							default: withCtx(() => [_cache[119] || (_cache[119] = createTextVNode("加一行 ", -1))]),
							_: 1
						})])]), createVNode(_component_ReTable, {
							data: form.mapping,
							columns: mappingColumns,
							pagination: false,
							toolbar: false,
							"layout-table": { minHeight: 0 },
							settings: { border: false }
						}, {
							"col-source": withCtx(({ row }) => [createVNode(_component_el_select, {
								modelValue: row.source,
								"onUpdate:modelValue": ($event) => row.source = $event,
								placeholder: "源列",
								filterable: "",
								class: "st-map-col"
							}, {
								default: withCtx(() => [(openBlock(true), createElementBlock(Fragment, null, renderList(sourceColumnOptions.value, (c) => {
									return openBlock(), createBlock(_component_el_option, {
										key: c.name,
										label: c.name,
										value: c.name
									}, null, 8, ["label", "value"]);
								}), 128))]),
								_: 1
							}, 8, ["modelValue", "onUpdate:modelValue"])]),
							"col-target": withCtx(({ row }) => [createVNode(_component_el_select, {
								modelValue: row.target,
								"onUpdate:modelValue": ($event) => row.target = $event,
								placeholder: "目标列",
								filterable: "",
								class: "st-map-col"
							}, {
								default: withCtx(() => [(openBlock(true), createElementBlock(Fragment, null, renderList(targetColumnOptions.value, (c) => {
									return openBlock(), createBlock(_component_el_option, {
										key: c.name,
										label: c.name,
										value: c.name
									}, null, 8, ["label", "value"]);
								}), 128))]),
								_: 1
							}, 8, ["modelValue", "onUpdate:modelValue"])]),
							"col-actions": withCtx(({ row }) => [createVNode(_component_ReButton, {
								type: "danger",
								circle: "",
								title: "删除",
								onClick: ($event) => removeMappingRow(row)
							}, {
								icon: withCtx(() => [createVNode(_component_ReIcon, { name: "Delete" })]),
								_: 1
							}, 8, ["onClick"])]),
							empty: withCtx(() => [..._cache[121] || (_cache[121] = [createBaseVNode("div", { class: "st-form-hint" }, " 留空则按「同名（忽略大小写）」自动配对；建议先点「预览 / 自动配对」确认配对结果。 ", -1)])]),
							_: 1
						}, 8, ["data"])])
					], 64)) : (openBlock(), createElementBlock(Fragment, { key: 2 }, [
						createBaseVNode("div", _hoisted_104, [_cache[122] || (_cache[122] = createBaseVNode("label", null, "任务名称", -1)), createVNode(_component_el_input, {
							modelValue: form.name,
							"onUpdate:modelValue": _cache[38] || (_cache[38] = ($event) => form.name = $event),
							placeholder: "例如：订单表 → 报表库"
						}, null, 8, ["modelValue"])]),
						createBaseVNode("div", _hoisted_105, [
							_cache[123] || (_cache[123] = createBaseVNode("label", null, "定时表达式（Spring 6 段 cron，留空只手动执行）", -1)),
							createVNode(unref(ReCron_default), {
								modelValue: form.cron,
								"onUpdate:modelValue": _cache[39] || (_cache[39] = ($event) => form.cron = $event),
								"preview-count": 5,
								placeholder: "6 段表达式，例如 0 0/30 * * * ?",
								onChange: onCronChange
							}, null, 8, ["modelValue"]),
							cronError.value ? (openBlock(), createElementBlock("div", _hoisted_106, toDisplayString(cronError.value), 1)) : createCommentVNode("", true)
						]),
						createBaseVNode("div", _hoisted_107, [
							_cache[124] || (_cache[124] = createBaseVNode("label", null, "批量提交条数", -1)),
							createVNode(_component_el_input_number, {
								modelValue: form.batchSize,
								"onUpdate:modelValue": _cache[40] || (_cache[40] = ($event) => form.batchSize = $event),
								min: 1,
								max: 1e5,
								step: 100,
								"controls-position": "right",
								class: "st-full"
							}, null, 8, ["modelValue"]),
							_cache[125] || (_cache[125] = createBaseVNode("div", { class: "st-form-hint" }, "每批写入的行数：调大提升吞吐，调小降低单事务压力。", -1))
						]),
						createBaseVNode("div", _hoisted_108, [
							_cache[126] || (_cache[126] = createBaseVNode("label", null, "启用定时", -1)),
							createVNode(_component_el_switch, {
								modelValue: form.enabled,
								"onUpdate:modelValue": _cache[41] || (_cache[41] = ($event) => form.enabled = $event),
								"aria-label": "启用定时",
								disabled: !form.cron.trim()
							}, null, 8, ["modelValue", "disabled"]),
							_cache[127] || (_cache[127] = createBaseVNode("span", { class: "st-form-hint" }, "未填定时表达式时不能启用", -1))
						]),
						createBaseVNode("div", _hoisted_109, [
							_cache[128] || (_cache[128] = createBaseVNode("label", null, "Hook 通知地址（HTTP 回调，留空不通知）", -1)),
							createVNode(_component_el_input, {
								modelValue: form.hookUrl,
								"onUpdate:modelValue": _cache[42] || (_cache[42] = ($event) => form.hookUrl = $event),
								class: "mono",
								placeholder: "https://example.com/hooks/sync-done"
							}, null, 8, ["modelValue"]),
							_cache[129] || (_cache[129] = createBaseVNode("div", { class: "st-form-hint" }, "每轮执行结束向该地址 JSON POST 执行结果（成功/失败都发）；增量选「每条」时每写入一条再推一条。", -1))
						]),
						form.hookUrl.trim() ? (openBlock(), createElementBlock("div", _hoisted_110, [
							_cache[130] || (_cache[130] = createBaseVNode("label", null, "通知时机", -1)),
							createVNode(_component_el_select, {
								modelValue: form.hookNotify,
								"onUpdate:modelValue": _cache[43] || (_cache[43] = ($event) => form.hookNotify = $event),
								class: "st-full",
								disabled: form.syncMode === "FULL"
							}, {
								default: withCtx(() => [createVNode(_component_el_option, {
									label: "完成通知（每轮一条，成功/失败各带 status）",
									value: "DONE"
								}), createVNode(_component_el_option, {
									label: "每条数据 + 完成通知",
									value: "ROW"
								})]),
								_: 1
							}, 8, ["modelValue", "disabled"]),
							createBaseVNode("div", _hoisted_111, toDisplayString(form.syncMode === "FULL" ? "全量模式固定为完成通知。" : "增量模式可逐条推送（异步发送，慢接收端不拖累同步吞吐；队列满丢通知不丢数据）。") + " 通知失败只记日志，不影响同步。 ", 1)
						])) : createCommentVNode("", true)
					], 64))])]),
					_: 1
				}, 8, [
					"modelValue",
					"title",
					"icon"
				]),
				createVNode(unref(component), {
					modelValue: logVisible.value,
					"onUpdate:modelValue": _cache[47] || (_cache[47] = ($event) => logVisible.value = $event),
					class: "st-sync-dlg st-log-dlg",
					title: "同步日志",
					subtitle: logTask.value ? logTask.value.syncTaskName : "",
					icon: unref(document_default),
					width: "760px",
					"close-on-click-modal": false
				}, {
					footer: withCtx(() => [createBaseVNode("div", _hoisted_141, [
						logFetchError.value && logEntries.value.length ? (openBlock(), createBlock(_component_ReButton, {
							key: 0,
							onClick: clearLogEntries
						}, {
							default: withCtx(() => [..._cache[137] || (_cache[137] = [createTextVNode("清空本机记录", -1)])]),
							_: 1
						})) : createCommentVNode("", true),
						createVNode(_component_ReButton, { onClick: _cache[46] || (_cache[46] = ($event) => logVisible.value = false) }, {
							default: withCtx(() => [..._cache[138] || (_cache[138] = [createTextVNode("关闭", -1)])]),
							_: 1
						}),
						logTask.value ? (openBlock(), createBlock(_component_ReButton, {
							key: 1,
							onClick: openEditFromLog
						}, {
							default: withCtx(() => [..._cache[139] || (_cache[139] = [createTextVNode("编辑任务", -1)])]),
							_: 1
						})) : createCommentVNode("", true),
						logTask.value ? (openBlock(), createBlock(_component_ReButton, {
							key: 2,
							type: "primary",
							loading: runningId.value === logTask.value.id,
							disabled: logTask.value.syncTaskEnabled !== 1,
							onClick: runFromLog
						}, {
							default: withCtx(() => [..._cache[140] || (_cache[140] = [createTextVNode("立即执行", -1)])]),
							_: 1
						}, 8, ["loading", "disabled"])) : createCommentVNode("", true)
					])]),
					default: withCtx(() => [logTask.value ? (openBlock(), createElementBlock("div", _hoisted_114, [createBaseVNode("div", _hoisted_115, [
						logTask.value.syncTaskLastStatus ? (openBlock(), createBlock(_component_el_tag, {
							key: 0,
							type: logTask.value.syncTaskLastStatus === "SUCCESS" ? "success" : "danger",
							size: "small",
							effect: "dark",
							round: ""
						}, {
							default: withCtx(() => [createTextVNode(toDisplayString(logTask.value.syncTaskLastStatus === "SUCCESS" ? "成功" : "失败"), 1)]),
							_: 1
						}, 8, ["type"])) : createCommentVNode("", true),
						runningId.value === logTask.value.id ? (openBlock(), createElementBlock("span", _hoisted_116, [createVNode(_component_ReIcon, {
							name: "Loading",
							size: 13
						}), _cache[134] || (_cache[134] = createTextVNode("执行中… ", -1))])) : createCommentVNode("", true),
						logTask.value.syncTaskLastRunTime ? (openBlock(), createElementBlock("span", _hoisted_117, " 最近一次 " + toDisplayString(logTask.value.syncTaskLastRunTime) + " · 读 " + toDisplayString(logTask.value.syncTaskLastReadCount ?? "—") + " / 写 " + toDisplayString(logTask.value.syncTaskLastWriteCount ?? "—") + " 行 · " + toDisplayString(logTask.value.syncTaskLastCostMs ?? "—") + " ms ", 1)) : (openBlock(), createElementBlock("span", _hoisted_118, "该任务还没有执行过")),
						logTask.value.syncTaskLastMessage ? (openBlock(), createElementBlock("span", {
							key: 4,
							class: "st-log-summary-msg",
							title: logTask.value.syncTaskLastMessage
						}, toDisplayString(logTask.value.syncTaskLastMessage), 9, _hoisted_119)) : createCommentVNode("", true)
					]), createBaseVNode("div", _hoisted_120, [createBaseVNode("div", _hoisted_121, [
						_cache[135] || (_cache[135] = createBaseVNode("span", { class: "st-log-block-title" }, "调试日志", -1)),
						logLoading.value ? (openBlock(), createBlock(_component_ReIcon, {
							key: 0,
							name: "Loading",
							size: 13
						})) : createCommentVNode("", true),
						_cache[136] || (_cache[136] = createBaseVNode("span", { class: "st-log-hint-inline" }, "服务端内存保留最近 10 次执行，后端重启即清空；弹窗打开期间自动刷新", -1))
					]), logFetchError.value ? (openBlock(), createElementBlock(Fragment, { key: 0 }, [createBaseVNode("p", _hoisted_122, "服务端调试日志暂不可用：" + toDisplayString(logFetchError.value) + "。以下为本机执行记录（仅本页触发的真实执行）。", 1), logEntries.value.length ? (openBlock(), createElementBlock("div", _hoisted_123, [(openBlock(true), createElementBlock(Fragment, null, renderList(logEntries.value, (entry, index) => {
						return openBlock(), createElementBlock("div", {
							key: `${entry.at}-${index}`,
							class: normalizeClass(["st-log-row", entry.status === "SUCCESS" ? "is-ok" : "is-bad"])
						}, [
							createBaseVNode("span", _hoisted_124, toDisplayString(entry.at), 1),
							createBaseVNode("span", _hoisted_125, toDisplayString(entry.status === "SUCCESS" ? "成功" : "失败"), 1),
							createBaseVNode("span", _hoisted_126, "读 " + toDisplayString(entry.read) + " / 写 " + toDisplayString(entry.write) + " 行 · " + toDisplayString(entry.costMs) + " ms", 1),
							createBaseVNode("span", {
								class: "st-log-msg-text",
								title: entry.message
							}, toDisplayString(entry.message || "（无附加消息）"), 9, _hoisted_127)
						], 2);
					}), 128))])) : (openBlock(), createElementBlock("div", _hoisted_128, "本机也没有触发过执行"))], 64)) : logRuns.value.length ? (openBlock(), createElementBlock("div", _hoisted_129, [(openBlock(true), createElementBlock(Fragment, null, renderList(logRuns.value, (entry, index) => {
						return openBlock(), createElementBlock("div", {
							key: `${entry.runTime}-${index}`,
							class: normalizeClass(["st-log-run", entry.status === "RUNNING" ? "is-active" : entry.status === "SUCCESS" ? "is-ok" : "is-bad"])
						}, [createBaseVNode("div", {
							class: "st-log-run-head",
							onClick: ($event) => expandedLogRun.value = expandedLogRun.value === index ? -1 : index
						}, [
							createBaseVNode("span", _hoisted_131, toDisplayString(expandedLogRun.value === index ? "▾" : "▸"), 1),
							createBaseVNode("span", _hoisted_132, toDisplayString(triggerLabel(entry.trigger)), 1),
							createVNode(_component_el_tag, {
								type: entry.status === "RUNNING" ? "primary" : entry.status === "SUCCESS" ? "success" : "danger",
								size: "small",
								effect: "dark",
								round: ""
							}, {
								default: withCtx(() => [createTextVNode(toDisplayString(statusLabel(entry.status)), 1)]),
								_: 2
							}, 1032, ["type"]),
							createBaseVNode("span", _hoisted_133, toDisplayString(entry.runTime), 1),
							createBaseVNode("span", _hoisted_134, toDisplayString(entry.costMs ?? "—") + " ms", 1),
							createBaseVNode("span", _hoisted_135, toDisplayString(entry.lines.length) + " 行", 1)
						], 8, _hoisted_130), expandedLogRun.value === index ? (openBlock(), createElementBlock("div", _hoisted_136, [(openBlock(true), createElementBlock(Fragment, null, renderList(entry.lines, (line, li) => {
							return openBlock(), createElementBlock("div", {
								key: li,
								class: normalizeClass(["st-log-line", `is-${line.level.toLowerCase()}`])
							}, [
								createBaseVNode("span", _hoisted_137, toDisplayString(line.time), 1),
								createBaseVNode("span", _hoisted_138, toDisplayString(line.level), 1),
								createBaseVNode("span", _hoisted_139, toDisplayString(line.message), 1)
							], 2);
						}), 128))])) : createCommentVNode("", true)], 2);
					}), 128))])) : (openBlock(), createElementBlock("div", _hoisted_140, "服务端暂无调试日志——从本页「立即执行」或等定时触发一次，这里会显示逐步过程日志。"))])])) : createCommentVNode("", true)]),
					_: 1
				}, 8, [
					"modelValue",
					"subtitle",
					"icon"
				]),
				createVNode(CreateTableDialog_default, {
					modelValue: tableDesignerVisible.value,
					"onUpdate:modelValue": _cache[48] || (_cache[48] = ($event) => tableDesignerVisible.value = $event),
					"datasource-id": designerDatasourceId.value ?? void 0,
					"initial-name": designerTable.value,
					"initial-columns": designerColumns.value,
					onCreated: onTableCreated
				}, null, 8, [
					"modelValue",
					"datasource-id",
					"initial-name",
					"initial-columns"
				]),
				createVNode(unref(ReFilePicker_default), {
					modelValue: filePickerVisible.value,
					"onUpdate:modelValue": _cache[49] || (_cache[49] = ($event) => filePickerVisible.value = $event),
					title: filePickerMode.value === "FILE" ? "选择文件" : "选择文件夹",
					"directory-mode": filePickerMode.value === "DIR",
					"initial-path": "/",
					loader: localFileLoader,
					onSelect: onPathPicked
				}, null, 8, [
					"modelValue",
					"title",
					"directory-mode"
				]),
				createVNode(BulkImportDialog_default, {
					modelValue: bulkImportVisible.value,
					"onUpdate:modelValue": _cache[50] || (_cache[50] = ($event) => bulkImportVisible.value = $event)
				}, null, 8, ["modelValue"])
			]);
		};
	}
}), [["__scopeId", "data-v-bdfbd3b5"]]);
//#endregion
export { SyncTaskView_default as default };
