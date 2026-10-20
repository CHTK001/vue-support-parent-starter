import { $n as normalizeClass, D as createVNode, E as createTextVNode, On as unref, St as resolveComponent, _ as createBaseVNode, b as createElementBlock, ct as onMounted, g as computed, k as defineComponent, mt as openBlock, o as Fragment, qt as withCtx, rr as toDisplayString, un as isRef, vn as ref, y as createCommentVNode } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { w as withModifiers } from "./runtime-dom.esm-bundler-RRl39S3n.js";
import { yt as message } from "./src-CEonioA3.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { a as ScTsharkPacketPanel_default, c as sessionName, d as useTshark, i as ScTsharkStatsPanel_default, l as statusOf, n as ScTsharkPacketDetail_default, o as fmtDuration, r as ScTsharkFlowPanel_default, s as fmtSize, t as ScTsharkLifecycleDialog_default, u as timeRange } from "./tshark-Dzpos0lF.js";
//#region ../../pages/monitor/src/views/tshark/ScTsharkImportPanel.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1$1 = { class: "tshark-panel" };
var _hoisted_2$1 = { class: "tshark-panel__tools" };
var _hoisted_3$1 = { class: "tshark-dim import-summary" };
var _hoisted_4$1 = { class: "tshark-panel__body" };
var _hoisted_5$1 = ["title"];
var _hoisted_6$1 = {
	key: 0,
	class: "status-pulse"
};
var _hoisted_7$1 = { class: "import-num" };
var _hoisted_8$1 = { class: "tshark-mono tshark-dim" };
var _hoisted_9$1 = { class: "import-num" };
var _hoisted_10$1 = { class: "tshark-panel__foot" };
//#endregion
//#region ../../pages/monitor/src/views/tshark/ScTsharkImportPanel.vue
var ScTsharkImportPanel_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	__name: "ScTsharkImportPanel",
	props: {
		sessions: {},
		loading: { type: Boolean },
		keyword: {},
		page: {},
		pageSize: {},
		total: {},
		loadedCount: {},
		backendTotal: {},
		parsingCount: {},
		activeId: {}
	},
	emits: [
		"update:keyword",
		"page-change",
		"open",
		"download",
		"remove",
		"refresh"
	],
	setup(__props, { emit: __emit }) {
		function statusTagClass(row) {
			const type = statusOf(row).type;
			if (type === "warning") return "status-tag--parsing";
			if (type === "success") return "status-tag--done";
			if (type === "danger") return "status-tag--failed";
			return "";
		}
		const props = __props;
		const emit = __emit;
		const summaryText = computed(() => {
			const all = props.loadedCount;
			const capped = props.backendTotal > all ? `（已加载 ${all}/${props.backendTotal}）` : "";
			const parsing = props.parsingCount > 0 ? `，${props.parsingCount} 份解析中` : "";
			if (props.total === all) return `共 ${all} 份导入文件${parsing}${capped}`;
			return `筛选出 ${props.total} / ${all} 份${parsing}${capped}`;
		});
		const emptyText = computed(() => props.keyword.trim() ? "没有匹配的导入记录" : "还没有导入过 pcap —— 点上方「选择文件」，或直接把文件拖到页面上");
		function onKeyword(v) {
			emit("update:keyword", v === null || v === void 0 ? "" : String(v));
		}
		/** 整行点击 = 「看这个文件的报文」；ReTable 的 row-click 会多带列与事件两个参数，这里只取行 */
		function onRowClick(row) {
			emit("open", row.id, "packet");
		}
		return (_ctx, _cache) => {
			const _component_ReIcon = resolveComponent("ReIcon");
			const _component_ReInput = resolveComponent("ReInput");
			const _component_ReButton = resolveComponent("ReButton");
			const _component_ReTableColumn = resolveComponent("ReTableColumn");
			const _component_ReTag = resolveComponent("ReTag");
			const _component_ReTable = resolveComponent("ReTable");
			const _component_RePagination = resolveComponent("RePagination");
			return openBlock(), createElementBlock("div", _hoisted_1$1, [
				createBaseVNode("div", _hoisted_2$1, [
					createVNode(_component_ReInput, {
						class: "tshark-sessions-filter",
						"model-value": __props.keyword,
						placeholder: "搜索文件名 / 会话名",
						clearable: "",
						"onUpdate:modelValue": onKeyword
					}, {
						prefix: withCtx(() => [createVNode(_component_ReIcon, {
							name: "Search",
							size: 13
						})]),
						_: 1
					}, 8, ["model-value"]),
					_cache[2] || (_cache[2] = createBaseVNode("span", { class: "tshark-panel__spacer" }, null, -1)),
					createBaseVNode("span", _hoisted_3$1, toDisplayString(summaryText.value), 1),
					createVNode(_component_ReButton, {
						icon: "Refresh",
						layout: "square",
						tip: "刷新导入记录",
						onClick: _cache[0] || (_cache[0] = ($event) => emit("refresh"))
					})
				]),
				createBaseVNode("div", _hoisted_4$1, [createVNode(_component_ReTable, {
					class: "tshark-table",
					data: __props.sessions,
					loading: __props.loading,
					border: "",
					"row-key": "id",
					pagination: false,
					toolbar: false,
					"empty-text": emptyText.value,
					onRowClick
				}, {
					default: withCtx(() => [
						createVNode(_component_ReTableColumn, {
							label: "文件 / 会话名",
							"min-width": "220",
							"show-overflow-tooltip": ""
						}, {
							default: withCtx(({ row }) => [createBaseVNode("span", {
								class: normalizeClass(["tshark-mono import-name", { "is-active": row.id === __props.activeId }]),
								title: unref(sessionName)(row)
							}, toDisplayString(unref(sessionName)(row)), 11, _hoisted_5$1)]),
							_: 1
						}),
						createVNode(_component_ReTableColumn, {
							label: "状态",
							width: "100",
							align: "center"
						}, {
							default: withCtx(({ row }) => [createVNode(_component_ReTag, {
								type: unref(statusOf)(row).type,
								effect: "plain",
								class: normalizeClass(["status-tag", statusTagClass(row)])
							}, {
								default: withCtx(() => [unref(statusOf)(row).type === "warning" ? (openBlock(), createElementBlock("span", _hoisted_6$1)) : createCommentVNode("", true), createTextVNode(" " + toDisplayString(unref(statusOf)(row).text), 1)]),
								_: 2
							}, 1032, ["type", "class"])]),
							_: 1
						}),
						createVNode(_component_ReTableColumn, {
							label: "报文数",
							width: "104",
							align: "right"
						}, {
							default: withCtx(({ row }) => [createBaseVNode("span", _hoisted_7$1, toDisplayString(row.packetCount ?? 0), 1)]),
							_: 1
						}),
						createVNode(_component_ReTableColumn, {
							label: "报文时间范围",
							"min-width": "250"
						}, {
							default: withCtx(({ row }) => [createBaseVNode("span", _hoisted_8$1, toDisplayString(unref(timeRange)(row)), 1)]),
							_: 1
						}),
						createVNode(_component_ReTableColumn, {
							label: "时长",
							width: "96",
							align: "right"
						}, {
							default: withCtx(({ row }) => [createBaseVNode("span", _hoisted_9$1, toDisplayString(unref(fmtDuration)(row.captureDuration)), 1)]),
							_: 1
						}),
						createVNode(_component_ReTableColumn, {
							label: "操作",
							width: "248",
							align: "center",
							fixed: "right"
						}, {
							default: withCtx(({ row }) => [
								createVNode(_component_ReButton, {
									link: "",
									type: "primary",
									onClick: ($event) => emit("open", row.id, "packet")
								}, {
									default: withCtx(() => [..._cache[3] || (_cache[3] = [createTextVNode("报文", -1)])]),
									_: 1
								}, 8, ["onClick"]),
								createVNode(_component_ReButton, {
									link: "",
									type: "primary",
									onClick: ($event) => emit("open", row.id, "stats")
								}, {
									default: withCtx(() => [..._cache[4] || (_cache[4] = [createTextVNode("统计", -1)])]),
									_: 1
								}, 8, ["onClick"]),
								createVNode(_component_ReButton, {
									link: "",
									type: "primary",
									onClick: ($event) => emit("open", row.id, "flow")
								}, {
									default: withCtx(() => [..._cache[5] || (_cache[5] = [createTextVNode("会话流", -1)])]),
									_: 1
								}, 8, ["onClick"]),
								createVNode(_component_ReButton, {
									link: "",
									disabled: (row.packetCount ?? 0) === 0,
									tip: "下载原始 pcap（用 Wireshark 打开）",
									onClick: ($event) => emit("download", row.id, unref(sessionName)(row))
								}, {
									default: withCtx(() => [..._cache[6] || (_cache[6] = [createTextVNode("下载", -1)])]),
									_: 1
								}, 8, ["disabled", "onClick"]),
								createVNode(_component_ReButton, {
									link: "",
									type: "danger",
									onClick: ($event) => emit("remove", row.id)
								}, {
									default: withCtx(() => [..._cache[7] || (_cache[7] = [createTextVNode("删除", -1)])]),
									_: 1
								}, 8, ["onClick"])
							]),
							_: 1
						})
					]),
					_: 1
				}, 8, [
					"data",
					"loading",
					"empty-text"
				])]),
				createBaseVNode("div", _hoisted_10$1, [createVNode(_component_RePagination, {
					small: "",
					layout: "prev, pager, next",
					total: __props.total,
					"page-size": __props.pageSize,
					"current-page": __props.page,
					onCurrentChange: _cache[1] || (_cache[1] = (p) => emit("page-change", p))
				}, null, 8, [
					"total",
					"page-size",
					"current-page"
				])])
			]);
		};
	}
}), [["__scopeId", "data-v-094ee28b"]]);
//#endregion
//#region ../../pages/monitor/src/views/tshark/ScTsharkPcapAnalysis.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1 = { class: "tshark-bar" };
var _hoisted_2 = { class: "tshark-bar__group" };
var _hoisted_3 = { class: "tshark-bar__group" };
var _hoisted_4 = ["title"];
var _hoisted_5 = { class: "tshark-work" };
var _hoisted_6 = { class: "tshark-bar pcap-detail-bar" };
var _hoisted_7 = { class: "pcap-detail__title" };
var _hoisted_8 = ["title"];
var _hoisted_9 = {
	key: 0,
	class: "tshark-dim pcap-detail__parsing"
};
var _hoisted_10 = { class: "pcap-detail__meta" };
var _hoisted_11 = { class: "tshark-work" };
/**
* 上传上限，必须与后端 spring.servlet.multipart.max-file-size 一致。
*
* <p>前端这一道是「提前拦住」：超限时后端会在进 Controller 之前就抛
* MaxUploadSizeExceededException，前端只看到 500，看不出是文件太大了。</p>
*/
var MAX_UPLOAD_BYTES = 2147483648;
//#endregion
//#region ../../pages/monitor/src/views/tshark/ScTsharkPcapAnalysis.vue
var ScTsharkPcapAnalysis_default = /* @__PURE__ */ defineComponent({
	__name: "ScTsharkPcapAnalysis",
	setup(__props) {
		const { tsharkOk, importing, loadingSessions, sessions, sessionBackendTotal, sessionKeyword, sessionPage, activeSessionId, activeSession, filteredSessions, pagedSessions, runningCount: parsingCount, sessionPageSize, loadingPackets, packets, packetPage, packetTotal, packetKeyword, packetPageSize, protoStats, topFlows, statsVersion, detailOpen, packetDetail, init, loadSessions, selectSession, setSessionKeyword, clearActiveSession, loadPackets, setPacketKeyword, filterByProtocol, exportCsv, downloadPcap, deleteSession, openPacketDetail, openPacketDetailById, importPcap } = useTshark({
			source: "import",
			autoSelectFirst: false
		});
		/** 生命周期弹层：右键报文触发，与「抓包分析」页同一套组件 */
		const lifecycleVisible = ref(false);
		const lifecyclePacket = ref(null);
		function openLifecycle(row) {
			lifecyclePacket.value = row;
			lifecycleVisible.value = true;
		}
		/**
		* 详情里当前停在哪个标签。
		*
		* <p>只在详情里有意义（目录不渲染标签页），但状态放在页面上：从统计点某个协议要跳到报文，
		* 返回目录再进来也该从「报文」开始（用户点进来就是为了看报文）。</p>
		*/
		const activeTab = ref("packet");
		const fileInput = ref(null);
		const file = ref(null);
		const importName = ref("");
		const detailTabs = computed(() => [
			{
				name: "packet",
				label: "报文",
				icon: "Tickets",
				badge: packetTotal.value || null
			},
			{
				name: "stats",
				label: "统计",
				icon: "PieChart"
			},
			{
				name: "flow",
				label: "会话流",
				icon: "TrendCharts"
			}
		]);
		const detailName = computed(() => activeSession.value ? sessionName(activeSession.value) : `导入 ${activeSessionId.value}`);
		const detailStatus = computed(() => activeSession.value ? statusOf(activeSession.value) : {
			type: "info",
			text: "—"
		});
		const detailRange = computed(() => activeSession.value ? timeRange(activeSession.value) : "—");
		const detailDuration = computed(() => fmtDuration(activeSession.value?.captureDuration));
		const parsing = computed(() => activeSession.value?.captureStatus === 1);
		const packetEmptyText = computed(() => packetKeyword.value.trim() ? "没有匹配的报文，试试清空关键字" : "这条导入记录还没有解析出报文");
		const fileText = computed(() => file.value ? `${file.value.name}（${fmtSize(file.value.size)}）` : "未选择文件，也可直接拖入");
		/** tshark 是解析器：没有它，文件传上去也解析不出报文，所以一并卡住导入按钮 */
		const canImport = computed(() => !!file.value && tsharkOk.value && !importing.value);
		const importTip = computed(() => {
			if (!tsharkOk.value) return "tshark 未就绪，无法解析 pcap";
			if (!file.value) return "请先选择 pcap 文件";
			return "上传后在后台整份解析，报文数会陆续增长";
		});
		function chooseFile() {
			fileInput.value?.click();
		}
		function onPickFile(e) {
			const input = e.target;
			const picked = input.files?.[0] ?? null;
			if (picked) acceptFile(picked);
			input.value = "";
		}
		function onDrop(e) {
			const dropped = e.dataTransfer?.files?.[0] ?? null;
			if (dropped) acceptFile(dropped);
		}
		function acceptFile(f) {
			if (f.size === 0) {
				message.warning("这个文件是空的，换一个再试");
				return;
			}
			if (f.size > MAX_UPLOAD_BYTES) {
				message.warning(`文件 ${fmtSize(f.size)}，超过 2GB 上传上限`);
				return;
			}
			file.value = f;
		}
		async function onImport() {
			const f = file.value;
			if (!f) {
				message.warning("请先选择 pcap 文件");
				return;
			}
			if (!await importPcap(f, importName.value, false)) return;
			file.value = null;
			importName.value = "";
		}
		/** 进详情：目录里点某一行（或那一行的操作）时，默认停在用户点的那一页 */
		function openSessionTab(id, tab) {
			activeTab.value = tab;
			selectSession(id);
		}
		/** 回目录：清掉选中项即可（模板按 activeSessionId 两级切换） */
		function backToList() {
			clearActiveSession();
			activeTab.value = "packet";
		}
		/** 下载原件：只有真选中了一条才可用（模板 v-else 分支挡不住 TS 的 null 收窄） */
		function onDownload() {
			const id = activeSessionId.value;
			if (id == null) return;
			downloadPcap(id, detailName.value);
		}
		function onTabChange(name) {
			activeTab.value = name || "packet";
		}
		function onName(v) {
			importName.value = v === null || v === void 0 ? "" : String(v);
		}
		function setSessionPage(p) {
			sessionPage.value = p;
		}
		/** 统计面板点协议：填进报文关键字并切过去，省掉「记住协议名 → 回头手打」那一步 */
		function onPickProtocol(protocol) {
			filterByProtocol(protocol);
			activeTab.value = "packet";
		}
		onMounted(init);
		return (_ctx, _cache) => {
			const _component_ReInput = resolveComponent("ReInput");
			const _component_ReButton = resolveComponent("ReButton");
			const _component_ReTag = resolveComponent("ReTag");
			const _component_ReTab = resolveComponent("ReTab");
			return openBlock(), createElementBlock("div", {
				class: "tshark-page",
				onDragover: _cache[3] || (_cache[3] = withModifiers(() => {}, ["prevent"])),
				onDrop: withModifiers(onDrop, ["prevent"])
			}, [
				unref(activeSessionId) == null ? (openBlock(), createElementBlock(Fragment, { key: 0 }, [createBaseVNode("div", _hoisted_1, [
					createBaseVNode("div", _hoisted_2, [createBaseVNode("span", { class: normalizeClass(["tshark-status", unref(tsharkOk) ? "tshark-status--ok" : "tshark-status--bad"]) }, [_cache[4] || (_cache[4] = createBaseVNode("span", { class: "tshark-status__dot" }, null, -1)), createBaseVNode("span", null, toDisplayString(unref(tsharkOk) ? "TShark 可用" : "TShark 未就绪"), 1)], 2), _cache[5] || (_cache[5] = createBaseVNode("span", { class: "tshark-dim pcap-page__hint" }, "点任意一行查看它的报文 / 统计 / 会话流", -1))]),
					_cache[8] || (_cache[8] = createBaseVNode("span", { class: "tshark-bar__spacer" }, null, -1)),
					_cache[9] || (_cache[9] = createBaseVNode("span", { class: "tshark-bar__sep" }, null, -1)),
					createBaseVNode("div", _hoisted_3, [
						createVNode(_component_ReInput, {
							class: "tshark-bar__bpf",
							"model-value": importName.value,
							placeholder: "会话名（可空，默认用文件名）",
							clearable: "",
							"onUpdate:modelValue": onName
						}, null, 8, ["model-value"]),
						createBaseVNode("input", {
							ref_key: "fileInput",
							ref: fileInput,
							class: "pcap-file-input",
							type: "file",
							accept: ".pcap,.pcapng,.cap,.pcapng.gz,.pcap.gz",
							onChange: onPickFile
						}, null, 544),
						createVNode(_component_ReButton, {
							icon: "FolderOpened",
							"show-text": "",
							onClick: chooseFile
						}, {
							default: withCtx(() => [..._cache[6] || (_cache[6] = [createTextVNode("选择文件", -1)])]),
							_: 1
						}),
						createBaseVNode("span", {
							class: "tshark-dim pcap-file-hint",
							title: file.value?.name || ""
						}, toDisplayString(fileText.value), 9, _hoisted_4),
						createVNode(_component_ReButton, {
							type: "primary",
							icon: "Upload",
							"show-text": "",
							loading: unref(importing),
							disabled: !canImport.value,
							tip: importTip.value,
							onClick: onImport
						}, {
							default: withCtx(() => [..._cache[7] || (_cache[7] = [createTextVNode(" 导入并解析 ", -1)])]),
							_: 1
						}, 8, [
							"loading",
							"disabled",
							"tip"
						])
					])
				]), createBaseVNode("div", _hoisted_5, [createVNode(ScTsharkImportPanel_default, {
					sessions: unref(pagedSessions),
					loading: unref(loadingSessions),
					keyword: unref(sessionKeyword),
					page: unref(sessionPage),
					"page-size": unref(sessionPageSize),
					total: unref(filteredSessions).length,
					"backend-total": unref(sessionBackendTotal),
					"loaded-count": unref(sessions).length,
					"parsing-count": unref(parsingCount),
					"active-id": unref(activeSessionId),
					"onUpdate:keyword": unref(setSessionKeyword),
					onPageChange: setSessionPage,
					onOpen: openSessionTab,
					onDownload: unref(downloadPcap),
					onRemove: unref(deleteSession),
					onRefresh: _cache[0] || (_cache[0] = ($event) => unref(loadSessions)(false))
				}, null, 8, [
					"sessions",
					"loading",
					"keyword",
					"page",
					"page-size",
					"total",
					"backend-total",
					"loaded-count",
					"parsing-count",
					"active-id",
					"onUpdate:keyword",
					"onDownload",
					"onRemove"
				])])], 64)) : (openBlock(), createElementBlock(Fragment, { key: 1 }, [createBaseVNode("div", _hoisted_6, [
					createVNode(_component_ReButton, {
						class: "pcap-back",
						link: "",
						type: "primary",
						icon: "ArrowLeft",
						"show-text": "",
						onClick: backToList
					}, {
						default: withCtx(() => [..._cache[10] || (_cache[10] = [createTextVNode(" 返回导入记录 ", -1)])]),
						_: 1
					}),
					_cache[14] || (_cache[14] = createBaseVNode("span", { class: "tshark-bar__sep" }, null, -1)),
					createBaseVNode("div", _hoisted_7, [
						createBaseVNode("span", {
							class: "pcap-detail__name",
							title: detailName.value
						}, toDisplayString(detailName.value), 9, _hoisted_8),
						createVNode(_component_ReTag, {
							type: detailStatus.value.type,
							effect: "plain"
						}, {
							default: withCtx(() => [createTextVNode(toDisplayString(detailStatus.value.text), 1)]),
							_: 1
						}, 8, ["type"]),
						parsing.value ? (openBlock(), createElementBlock("span", _hoisted_9, "报文数会陆续增长")) : createCommentVNode("", true)
					]),
					_cache[15] || (_cache[15] = createBaseVNode("span", { class: "tshark-bar__spacer" }, null, -1)),
					createBaseVNode("div", _hoisted_10, [
						createBaseVNode("span", null, toDisplayString(unref(packetTotal)) + " 个报文", 1),
						_cache[11] || (_cache[11] = createBaseVNode("span", { class: "pcap-detail__dot" }, "·", -1)),
						createBaseVNode("span", null, toDisplayString(detailRange.value), 1),
						_cache[12] || (_cache[12] = createBaseVNode("span", { class: "pcap-detail__dot" }, "·", -1)),
						createBaseVNode("span", null, toDisplayString(detailDuration.value), 1)
					]),
					createVNode(_component_ReButton, {
						icon: "Download",
						"show-text": "",
						disabled: unref(packetTotal) === 0,
						tip: "下载原始 pcap（用 Wireshark 打开）",
						onClick: onDownload
					}, {
						default: withCtx(() => [..._cache[13] || (_cache[13] = [createTextVNode(" 下载原件 ", -1)])]),
						_: 1
					}, 8, ["disabled"])
				]), createBaseVNode("div", _hoisted_11, [createVNode(_component_ReTab, {
					variant: "underline",
					tabs: detailTabs.value,
					"model-value": activeTab.value,
					stretch: "",
					"onUpdate:modelValue": onTabChange
				}, {
					packet: withCtx(() => [createVNode(ScTsharkPacketPanel_default, {
						packets: unref(packets),
						loading: unref(loadingPackets),
						page: unref(packetPage),
						"page-size": unref(packetPageSize),
						total: unref(packetTotal),
						keyword: unref(packetKeyword),
						"empty-text": packetEmptyText.value,
						"onUpdate:keyword": unref(setPacketKeyword),
						onPageChange: unref(loadPackets),
						onOpenDetail: unref(openPacketDetail),
						onOpenLifecycle: openLifecycle,
						onExport: unref(exportCsv)
					}, null, 8, [
						"packets",
						"loading",
						"page",
						"page-size",
						"total",
						"keyword",
						"empty-text",
						"onUpdate:keyword",
						"onPageChange",
						"onOpenDetail",
						"onExport"
					])]),
					stats: withCtx(() => [createVNode(ScTsharkStatsPanel_default, {
						"proto-stats": unref(protoStats),
						"top-flows": unref(topFlows),
						"packet-total": unref(packetTotal),
						version: unref(statsVersion),
						onPickProtocol
					}, null, 8, [
						"proto-stats",
						"top-flows",
						"packet-total",
						"version"
					])]),
					flow: withCtx(() => [createVNode(ScTsharkFlowPanel_default, {
						"top-flows": unref(topFlows),
						"packet-total": unref(packetTotal),
						version: unref(statsVersion)
					}, null, 8, [
						"top-flows",
						"packet-total",
						"version"
					])]),
					_: 1
				}, 8, ["tabs", "model-value"])])], 64)),
				createVNode(ScTsharkPacketDetail_default, {
					modelValue: unref(detailOpen),
					"onUpdate:modelValue": _cache[1] || (_cache[1] = ($event) => isRef(detailOpen) ? detailOpen.value = $event : null),
					packet: unref(packetDetail)
				}, null, 8, ["modelValue", "packet"]),
				createVNode(ScTsharkLifecycleDialog_default, {
					modelValue: lifecycleVisible.value,
					"onUpdate:modelValue": _cache[2] || (_cache[2] = ($event) => lifecycleVisible.value = $event),
					packet: lifecyclePacket.value,
					onOpenDetail: unref(openPacketDetailById)
				}, null, 8, [
					"modelValue",
					"packet",
					"onOpenDetail"
				])
			], 32);
		};
	}
});
//#endregion
export { ScTsharkPcapAnalysis_default as default };
