import { $n as normalizeClass, Ct as resolveDirective, D as createVNode, E as createTextVNode, On as unref, St as resolveComponent, Yt as withDirectives, _ as createBaseVNode, b as createElementBlock, bt as renderList, ct as onMounted, g as computed, k as defineComponent, mt as openBlock, o as Fragment, qt as withCtx, rr as toDisplayString, v as createBlock, vn as ref, wt as resolveDynamicComponent, xt as renderSlot, y as createCommentVNode } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { t as ElInput } from "./input-Bbhiel27.js";
import { n as ElTabs, t as ElTabPane } from "./tabs-BrnjuAVT.js";
import { Bt as search_default, Nt as refresh_default, _ as check_default, dt as loading_default, lt as link_default, q as files_default, w as close_default } from "./dist-DogtK295.js";
import { t as ElIcon } from "./icon-CKvLDnIU.js";
import { t as ElButton } from "./button-CLXz94Uh.js";
import { t as ElMessageBox } from "./message-box-CXDJvJwn.js";
import { t as ElTag } from "./tag-CqzZCxmq.js";
import { t as ElCheckbox } from "./checkbox-FhkQL8S5.js";
import { t as ElLink } from "./link-DLxyI_rz.js";
import { t as ElPagination } from "./pagination-DeBPTRrN.js";
import { t as ReTable_default } from "./ReTable-BO1ac7-i.js";
import { in as http, yt as message } from "./src-CEonioA3.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { t as component } from "./ReDialog-DZGeR3lw.js";
import { t as ReCountup_default } from "./ReCountup-B5od-7Lk.js";
import { t as ReCardTextarea_default } from "./ReCardTextarea-BqLOQMc3.js";
import { t as ReUploadChunk_default } from "./ReUploadChunk-B9boXk8-.js";
//#region ../../packages/ui/src/components/ReRagManager/index.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1 = { class: "re-rag-manager" };
var _hoisted_2 = { class: "re-rag-manager__header" };
var _hoisted_3 = { class: "re-rag-manager__header-left" };
var _hoisted_4 = { class: "re-rag-manager__stat" };
var _hoisted_5 = { class: "re-rag-manager__stat" };
var _hoisted_6 = {
	key: 1,
	class: "re-rag-manager__stat-value"
};
var _hoisted_7 = { class: "re-rag-manager__stat" };
var _hoisted_8 = { class: "re-rag-manager__header-right" };
var _hoisted_9 = { class: "re-rag-manager__upload" };
var _hoisted_10 = { class: "re-rag-manager__upload-hint" };
var _hoisted_11 = { class: "re-rag-manager__url" };
var _hoisted_12 = { class: "re-rag-manager__url-actions" };
var _hoisted_13 = {
	key: 0,
	class: "re-rag-manager__url-results"
};
var _hoisted_14 = { class: "re-rag-manager__url-results-list" };
var _hoisted_15 = { class: "re-rag-manager__url-result-url" };
var _hoisted_16 = {
	key: 0,
	class: "re-rag-manager__url-result-msg"
};
var _hoisted_17 = { class: "re-rag-manager__toolbar" };
var _hoisted_18 = { class: "re-rag-manager__doc-name" };
var _hoisted_19 = ["title"];
var _hoisted_20 = { key: 0 };
var _hoisted_21 = { key: 1 };
var _hoisted_22 = { class: "re-rag-manager__pagination" };
var _hoisted_23 = { class: "re-rag-manager__preview" };
//#endregion
//#region ../../packages/ui/src/components/ReRagManager/index.vue
var ReRagManager_default$1 = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	__name: "index",
	props: {
		baseUrl: {},
		libraryId: {},
		headers: {},
		engine: {},
		maxRecursivePages: { default: 10 },
		storageType: { default: "local" },
		bucket: { default: "default" }
	},
	emits: [
		"change",
		"add",
		"remove"
	],
	setup(__props, { expose: __expose, emit: __emit }) {
		/**
		* ReRagManager —— RAG 知识库管理
		*
		* 适配后端 RAG 服务：
		*   GET    /v2/ai/rag/status
		*   GET    /v2/ai/rag/document/list
		*   POST   /v2/ai/rag/document/upload
		*   DELETE /v2/ai/rag/document/{id}
		*   GET    /v2/ai/rag/document/{id}/content
		*   POST   /v2/ai/rag/document/url  (约定：URL 抓取)
		*   GET    /v2/ai/rag/embedding-engines
		*
		*   <ReRagManager base-url="/v2/ai/rag" />
		*/
		const props = __props;
		const emit = __emit;
		const loading = ref(false);
		const activeTab = ref("upload");
		const documents = ref([]);
		const total = ref(0);
		const page = ref(1);
		const pageSize = ref(20);
		const searchText = ref("");
		const status = ref({
			engine: props.engine ?? "default",
			llmProvider: "",
			uploadDir: "",
			defaultTopK: 5,
			defaultSimilarityThreshold: .7,
			ragClientReady: false,
			documentCount: 0
		});
		const engines = ref(props.engine ? [{
			value: props.engine,
			label: props.engine
		}] : []);
		const enableEngineSwitch = computed(() => engines.value.length > 1);
		const currentEngine = ref(props.engine ?? "");
		const uploadedList = ref([]);
		const urlInput = ref("");
		const recursive = ref(false);
		const urlCrawling = ref(false);
		const crawlResults = ref([]);
		const previewVisible = ref(false);
		const previewTitle = ref("");
		const previewContent = ref("");
		const previewLoading = ref(false);
		const filteredDocuments = computed(() => {
			if (!searchText.value) return documents.value;
			const q = searchText.value.toLowerCase();
			return documents.value.filter((d) => d.name.toLowerCase().includes(q));
		});
		/**
		* 文档列表列配置：原 7 个 el-table-column 收敛到此处。
		*
		* <p>标题都是字面量（没有 {@code t(...)}），故用普通常量即可。7 列原来全部走
		* {@code <template #default>}，且大多没有 prop —— 各造一个稳定合成 prop（操作列为
		* {@code actions}），配上 {@code slot}，模板侧用 {@code #col-<prop>} 接回原内容。</p>
		*/
		const docColumns = [
			{
				prop: "name",
				label: "名称",
				minWidth: 200,
				slot: "name"
			},
			{
				prop: "source",
				label: "来源",
				width: 100,
				slot: "source"
			},
			{
				prop: "size",
				label: "大小",
				width: 100,
				slot: "size"
			},
			{
				prop: "chunkCount",
				label: "分片数",
				width: 80,
				slot: "chunkCount"
			},
			{
				prop: "status",
				label: "状态",
				width: 100,
				slot: "status"
			},
			{
				prop: "createdAt",
				label: "创建时间",
				width: 160,
				slot: "createdAt"
			},
			{
				prop: "actions",
				label: "操作",
				width: 160,
				fixed: "right",
				slot: "actions"
			}
		];
		const hasValidUrl = computed(() => {
			return parseUrls(urlInput.value).length > 0;
		});
		const parseUrls = (text) => {
			return text.split(/\s+/).map((s) => s.trim()).filter((s) => /^https?:\/\//i.test(s));
		};
		const fetchJson = async (url, init = {}) => {
			const method = (init.method ?? "GET").toUpperCase();
			const req = http()[method.toLowerCase()](url).headers(props.headers ?? {});
			if (typeof init.body === "string") req.data(JSON.parse(init.body));
			const { data } = await req;
			return data;
		};
		const unwrap = (res) => {
			if (res.code !== 200) throw new Error(res.message || "请求失败");
			return res.data;
		};
		const fetchStatus = async () => {
			try {
				const res = await fetchJson(`${props.baseUrl}/status`);
				status.value = unwrap(res);
			} catch (e) {
				console.error("fetch status failed", e);
			}
		};
		const fetchEngines = async () => {
			try {
				const res = await fetchJson(`${props.baseUrl}/embedding-engines`);
				engines.value = unwrap(res);
				if (engines.value.length && !currentEngine.value) currentEngine.value = engines.value[0].value;
			} catch (e) {
				console.error("fetch engines failed", e);
			}
		};
		const fetchDocuments = async () => {
			loading.value = true;
			try {
				const params = new URLSearchParams({
					page: String(page.value),
					pageSize: String(pageSize.value)
				});
				if (props.libraryId) params.set("libraryId", props.libraryId);
				const res = await fetchJson(`${props.baseUrl}/document/list?${params.toString()}`);
				const data = unwrap(res);
				documents.value = data.records || [];
				total.value = data.total || 0;
				emit("change", documents.value);
			} catch (e) {
				console.error("fetch documents failed", e);
				message.error("加载文档列表失败");
			} finally {
				loading.value = false;
			}
		};
		const handleUploadSuccess = (file) => {
			if (file.url) {
				message.success(`已上传：${file.name}`);
				emit("add", {
					id: file.uploadId ?? file.name,
					name: file.name,
					size: file.size,
					status: "INDEXING",
					source: "FILE",
					createdAt: Date.now()
				});
				activeTab.value = "documents";
				fetchDocuments();
			}
		};
		const handleUrlCrawl = async () => {
			const urls = parseUrls(urlInput.value);
			if (urls.length === 0) {
				message.warning("请输入有效的 URL");
				return;
			}
			urlCrawling.value = true;
			crawlResults.value = urls.map((url) => ({
				url,
				status: "pending"
			}));
			for (const item of crawlResults.value) try {
				const res = await fetchJson(`${props.baseUrl}/document/url`, {
					method: "POST",
					body: JSON.stringify({
						url: item.url,
						recursive: recursive.value,
						maxPages: props.maxRecursivePages,
						libraryId: props.libraryId
					})
				});
				const doc = unwrap(res);
				item.status = "success";
				item.message = "已加入索引";
				emit("add", {
					id: doc.id ?? item.url,
					name: doc.name ?? item.url,
					status: "INDEXING",
					source: "URL",
					sourceUrl: item.url,
					createdAt: Date.now()
				});
			} catch (e) {
				item.status = "fail";
				item.message = e.message || "抓取失败";
			}
			urlCrawling.value = false;
			fetchDocuments();
		};
		const handlePreview = async (doc) => {
			previewVisible.value = true;
			previewTitle.value = doc.name;
			previewContent.value = "";
			previewLoading.value = true;
			try {
				const res = await fetchJson(`${props.baseUrl}/document/${doc.id}/content`);
				previewContent.value = unwrap(res);
			} catch (e) {
				previewContent.value = `预览失败: ${e.message}`;
			} finally {
				previewLoading.value = false;
			}
		};
		const handleDelete = async (doc) => {
			try {
				await ElMessageBox.confirm(`确认删除文档 "${doc.name}" 吗？`, "提示", { type: "warning" });
			} catch {
				return;
			}
			try {
				const res = await fetchJson(`${props.baseUrl}/document/${doc.id}`, { method: "DELETE" });
				if (unwrap(res)) {
					message.success("删除成功");
					emit("remove", doc.id);
					fetchDocuments();
				}
			} catch (e) {
				message.error("删除失败");
			}
		};
		const handleEngineChange = (engine) => {
			message.info(`已切换到 ${engine} 引擎`);
		};
		const goToDocuments = () => {
			activeTab.value = "documents";
			fetchDocuments();
		};
		const sourceLabel = (source) => {
			switch (source) {
				case "FILE": return "文件";
				case "URL": return "网页";
				case "TEXT": return "文本";
				default: return source || "-";
			}
		};
		const statusLabel = (status) => {
			switch (status) {
				case "PENDING": return "等待";
				case "INDEXING": return "索引中";
				case "READY": return "就绪";
				case "FAILED": return "失败";
				default: return status;
			}
		};
		const statusTag = (status) => {
			switch (status) {
				case "READY": return "success";
				case "INDEXING": return "warning";
				case "FAILED": return "danger";
				default: return "info";
			}
		};
		const getDocumentIcon = (doc) => {
			if (doc.source === "URL") return link_default;
			return files_default;
		};
		const formatSize = (bytes) => {
			if (bytes < 1024) return `${bytes} B`;
			if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
			if (bytes < 1073741824) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
			return `${(bytes / 1024 / 1024 / 1024).toFixed(1)} GB`;
		};
		const formatDate = (ts) => {
			const d = new Date(ts);
			return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
		};
		onMounted(() => {
			fetchStatus();
			fetchEngines();
			fetchDocuments();
		});
		__expose({
			refresh: fetchDocuments,
			fetchStatus
		});
		return (_ctx, _cache) => {
			const _component_el_option = resolveComponent("el-option");
			const _component_el_select = resolveComponent("el-select");
			const _directive_loading = resolveDirective("loading");
			return openBlock(), createElementBlock("div", _hoisted_1, [
				createBaseVNode("div", _hoisted_2, [createBaseVNode("div", _hoisted_3, [
					createBaseVNode("div", _hoisted_4, [_cache[9] || (_cache[9] = createBaseVNode("span", { class: "re-rag-manager__stat-label" }, "文档总数", -1)), createVNode(ReCountup_default, {
						value: status.value.documentCount,
						class: "re-rag-manager__stat-value"
					}, null, 8, ["value"])]),
					createBaseVNode("div", _hoisted_5, [_cache[10] || (_cache[10] = createBaseVNode("span", { class: "re-rag-manager__stat-label" }, "嵌入引擎", -1)), enableEngineSwitch.value ? (openBlock(), createBlock(_component_el_select, {
						key: 0,
						modelValue: currentEngine.value,
						"onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => currentEngine.value = $event),
						style: { "width": "140px" },
						disabled: !status.value.ragClientReady,
						onChange: handleEngineChange
					}, {
						default: withCtx(() => [(openBlock(true), createElementBlock(Fragment, null, renderList(engines.value, (e) => {
							return openBlock(), createBlock(_component_el_option, {
								key: e.value,
								label: e.label,
								value: e.value
							}, null, 8, ["label", "value"]);
						}), 128))]),
						_: 1
					}, 8, ["modelValue", "disabled"])) : (openBlock(), createElementBlock("span", _hoisted_6, toDisplayString(status.value.engine), 1))]),
					createBaseVNode("div", _hoisted_7, [_cache[11] || (_cache[11] = createBaseVNode("span", { class: "re-rag-manager__stat-label" }, "状态", -1)), createVNode(unref(ElTag), {
						type: status.value.ragClientReady ? "success" : "danger",
						effect: "light"
					}, {
						default: withCtx(() => [createTextVNode(toDisplayString(status.value.ragClientReady ? "在线" : "离线"), 1)]),
						_: 1
					}, 8, ["type"])])
				]), createBaseVNode("div", _hoisted_8, [renderSlot(_ctx.$slots, "header-actions", {}, () => [createVNode(unref(ElButton), {
					loading: loading.value,
					onClick: fetchStatus
				}, {
					default: withCtx(() => [createVNode(unref(ElIcon), { style: { "margin-right": "4px" } }, {
						default: withCtx(() => [createVNode(unref(refresh_default))]),
						_: 1
					}), _cache[12] || (_cache[12] = createTextVNode(" 刷新 ", -1))]),
					_: 1
				}, 8, ["loading"])], true)])]),
				createVNode(unref(ElTabs), {
					modelValue: activeTab.value,
					"onUpdate:modelValue": _cache[7] || (_cache[7] = ($event) => activeTab.value = $event),
					class: "re-rag-manager__tabs"
				}, {
					default: withCtx(() => [
						createVNode(unref(ElTabPane), {
							label: "文件上传",
							name: "upload"
						}, {
							default: withCtx(() => [createBaseVNode("div", _hoisted_9, [createVNode(ReUploadChunk_default, {
								modelValue: uploadedList.value,
								"onUpdate:modelValue": _cache[1] || (_cache[1] = ($event) => uploadedList.value = $event),
								"base-url": __props.baseUrl,
								headers: __props.headers,
								"storage-type": __props.storageType,
								bucket: __props.bucket,
								"chunk-size": 5242880,
								drag: "",
								onSuccess: handleUploadSuccess
							}, null, 8, [
								"modelValue",
								"base-url",
								"headers",
								"storage-type",
								"bucket"
							]), createBaseVNode("div", _hoisted_10, [_cache[14] || (_cache[14] = createTextVNode(" 上传后会自动索引到知识库，", -1)), createVNode(unref(ElLink), {
								type: "primary",
								onClick: goToDocuments
							}, {
								default: withCtx(() => [..._cache[13] || (_cache[13] = [createTextVNode("前往文档列表", -1)])]),
								_: 1
							})])])]),
							_: 1
						}),
						createVNode(unref(ElTabPane), {
							label: "网页抓取",
							name: "url"
						}, {
							default: withCtx(() => [createBaseVNode("div", _hoisted_11, [
								createVNode(ReCardTextarea_default, {
									modelValue: urlInput.value,
									"onUpdate:modelValue": _cache[2] || (_cache[2] = ($event) => urlInput.value = $event),
									placeholder: "输入要学习的网页 URL（支持多个换行）",
									rows: 5,
									class: "re-rag-manager__url-input"
								}, null, 8, ["modelValue"]),
								createBaseVNode("div", _hoisted_12, [createVNode(unref(ElCheckbox), {
									modelValue: recursive.value,
									"onUpdate:modelValue": _cache[3] || (_cache[3] = ($event) => recursive.value = $event)
								}, {
									default: withCtx(() => [createTextVNode("抓取子链接（最多 " + toDisplayString(__props.maxRecursivePages) + " 页）", 1)]),
									_: 1
								}, 8, ["modelValue"]), createVNode(unref(ElButton), {
									type: "primary",
									loading: urlCrawling.value,
									disabled: !hasValidUrl.value,
									onClick: handleUrlCrawl
								}, {
									default: withCtx(() => [createVNode(unref(ElIcon), { style: { "margin-right": "4px" } }, {
										default: withCtx(() => [createVNode(unref(link_default))]),
										_: 1
									}), _cache[15] || (_cache[15] = createTextVNode(" 开始抓取 ", -1))]),
									_: 1
								}, 8, ["loading", "disabled"])]),
								crawlResults.value.length ? (openBlock(), createElementBlock("div", _hoisted_13, [_cache[16] || (_cache[16] = createBaseVNode("div", { class: "re-rag-manager__url-results-title" }, "抓取结果", -1)), createBaseVNode("ul", _hoisted_14, [(openBlock(true), createElementBlock(Fragment, null, renderList(crawlResults.value, (r) => {
									return openBlock(), createElementBlock("li", {
										key: r.url,
										class: normalizeClass(["re-rag-manager__url-result", `is-${r.status}`])
									}, [
										createVNode(unref(ElIcon), { class: "re-rag-manager__url-result-icon" }, {
											default: withCtx(() => [(openBlock(), createBlock(resolveDynamicComponent(r.status === "success" ? unref(check_default) : r.status === "fail" ? unref(close_default) : unref(loading_default))))]),
											_: 2
										}, 1024),
										createBaseVNode("span", _hoisted_15, toDisplayString(r.url), 1),
										r.message ? (openBlock(), createElementBlock("span", _hoisted_16, toDisplayString(r.message), 1)) : createCommentVNode("", true)
									], 2);
								}), 128))])])) : createCommentVNode("", true)
							])]),
							_: 1
						}),
						createVNode(unref(ElTabPane), {
							label: `文档列表 (${documents.value.length})`,
							name: "documents"
						}, {
							default: withCtx(() => [
								createBaseVNode("div", _hoisted_17, [createVNode(unref(ElInput), {
									modelValue: searchText.value,
									"onUpdate:modelValue": _cache[4] || (_cache[4] = ($event) => searchText.value = $event),
									placeholder: "搜索文档名",
									clearable: "",
									style: { "width": "240px" }
								}, {
									prefix: withCtx(() => [createVNode(unref(ElIcon), null, {
										default: withCtx(() => [createVNode(unref(search_default))]),
										_: 1
									})]),
									_: 1
								}, 8, ["modelValue"]), createVNode(unref(ElButton), {
									loading: loading.value,
									onClick: fetchDocuments
								}, {
									default: withCtx(() => [createVNode(unref(ElIcon), null, {
										default: withCtx(() => [createVNode(unref(refresh_default))]),
										_: 1
									}), _cache[17] || (_cache[17] = createTextVNode(" 刷新 ", -1))]),
									_: 1
								}, 8, ["loading"])]),
								createVNode(unref(ReTable_default), {
									loading: loading.value,
									data: filteredDocuments.value,
									columns: docColumns,
									stripe: "",
									"row-key": "id",
									engine: "element",
									pagination: false,
									toolbar: false,
									settings: { border: false },
									"layout-table": { minHeight: 0 }
								}, {
									"col-name": withCtx(({ row }) => [createBaseVNode("div", _hoisted_18, [createVNode(unref(ElIcon), { class: "re-rag-manager__doc-icon" }, {
										default: withCtx(() => [(openBlock(), createBlock(resolveDynamicComponent(getDocumentIcon(row))))]),
										_: 2
									}, 1024), createBaseVNode("span", { title: row.name }, toDisplayString(row.name), 9, _hoisted_19)])]),
									"col-source": withCtx(({ row }) => [createVNode(unref(ElTag), {
										type: row.source === "URL" ? "warning" : "info",
										effect: "plain"
									}, {
										default: withCtx(() => [createTextVNode(toDisplayString(sourceLabel(row.source)), 1)]),
										_: 2
									}, 1032, ["type"])]),
									"col-size": withCtx(({ row }) => [row.size ? (openBlock(), createElementBlock("span", _hoisted_20, toDisplayString(formatSize(row.size)), 1)) : (openBlock(), createElementBlock("span", _hoisted_21, "-"))]),
									"col-chunkCount": withCtx(({ row }) => [createTextVNode(toDisplayString(row.chunkCount ?? "-"), 1)]),
									"col-status": withCtx(({ row }) => [createVNode(unref(ElTag), {
										type: statusTag(row.status),
										effect: "light"
									}, {
										default: withCtx(() => [createTextVNode(toDisplayString(statusLabel(row.status)), 1)]),
										_: 2
									}, 1032, ["type"])]),
									"col-createdAt": withCtx(({ row }) => [createTextVNode(toDisplayString(row.createdAt ? formatDate(row.createdAt) : "-"), 1)]),
									"col-actions": withCtx(({ row }) => [createVNode(unref(ElButton), {
										link: "",
										type: "primary",
										onClick: ($event) => handlePreview(row)
									}, {
										default: withCtx(() => [..._cache[18] || (_cache[18] = [createTextVNode(" 预览 ", -1)])]),
										_: 1
									}, 8, ["onClick"]), createVNode(unref(ElButton), {
										link: "",
										type: "danger",
										onClick: ($event) => handleDelete(row)
									}, {
										default: withCtx(() => [..._cache[19] || (_cache[19] = [createTextVNode(" 删除 ", -1)])]),
										_: 1
									}, 8, ["onClick"])]),
									_: 1
								}, 8, ["loading", "data"]),
								createBaseVNode("div", _hoisted_22, [createVNode(unref(ElPagination), {
									"current-page": page.value,
									"onUpdate:currentPage": _cache[5] || (_cache[5] = ($event) => page.value = $event),
									"page-size": pageSize.value,
									"onUpdate:pageSize": _cache[6] || (_cache[6] = ($event) => pageSize.value = $event),
									total: total.value,
									"page-sizes": [
										10,
										20,
										50,
										100
									],
									layout: "total, sizes, prev, pager, next, jumper",
									small: "",
									onCurrentChange: fetchDocuments,
									onSizeChange: fetchDocuments
								}, null, 8, [
									"current-page",
									"page-size",
									"total"
								])])
							]),
							_: 1
						}, 8, ["label"])
					]),
					_: 1
				}, 8, ["modelValue"]),
				createVNode(unref(component), {
					modelValue: previewVisible.value,
					"onUpdate:modelValue": _cache[8] || (_cache[8] = ($event) => previewVisible.value = $event),
					title: previewTitle.value,
					width: "600px",
					"append-to-body": ""
				}, {
					default: withCtx(() => [withDirectives((openBlock(), createElementBlock("div", _hoisted_23, [createBaseVNode("pre", null, toDisplayString(previewContent.value), 1)])), [[_directive_loading, previewLoading.value]])]),
					_: 1
				}, 8, ["modelValue", "title"])
			]);
		};
	}
}), [["__scopeId", "data-v-7867892c"]]);
//#endregion
//#region ../../packages/ui/src/components/ReRagManager/index.ts
var plugin = { install(app) {
	app.component("ReRagManager", ReRagManager_default$1);
} };
var ReRagManager_default = ReRagManager_default$1;
//#endregion
export { ReRagManager_default as default, plugin as install };
