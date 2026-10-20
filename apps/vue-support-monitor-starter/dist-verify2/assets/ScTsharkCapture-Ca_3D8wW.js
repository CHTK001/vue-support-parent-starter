import { $n as normalizeClass, D as createVNode, E as createTextVNode, Ht as watch, On as unref, _ as createBaseVNode, b as createElementBlock, ct as onMounted, g as computed, k as defineComponent, mt as openBlock, o as Fragment, qt as withCtx, rr as toDisplayString, un as isRef, v as createBlock, vn as ref, xt as renderSlot, y as createCommentVNode } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { t as ReTable_default } from "./ReTable-BO1ac7-i.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { t as ReSelect_default } from "./ReSelect-C2rq-Voy.js";
import { t as ReButton_default } from "./ReButton-owxlNwDO.js";
import { t as component } from "./ReDialog-DZGeR3lw.js";
import { t as ReEmpty_default } from "./ReEmpty-DzxmsI1k.js";
import { t as ReInput_default } from "./ReInput-CGHpe202.js";
import { t as ReInputNumber_default } from "./ReInputNumber-BOzz1hL8.js";
import { t as ReTab_default } from "./ReTab-y-lcvWJm.js";
import { t as component$1 } from "./ReTag-D5UpQULZ.js";
import { a as ScTsharkPacketPanel_default, d as useTshark, i as ScTsharkStatsPanel_default, n as ScTsharkPacketDetail_default, o as fmtDuration, r as ScTsharkFlowPanel_default, t as ScTsharkLifecycleDialog_default } from "./tshark-Dzpos0lF.js";
//#region ../../pages/monitor/src/views/tshark/ScTsharkCreateDialog.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1$2 = { class: "create-form" };
var _hoisted_2$2 = { class: "create-row" };
var _hoisted_3$2 = { class: "create-row" };
var _hoisted_4$2 = { class: "create-row" };
var _hoisted_5$2 = { class: "create-row" };
var _hoisted_6$2 = { class: "create-hint" };
var _hoisted_7$1 = { class: "create-row" };
var _hoisted_8$1 = { class: "create-row" };
var _hoisted_9$1 = {
	key: 0,
	class: "create-warn"
};
//#endregion
//#region ../../pages/monitor/src/views/tshark/ScTsharkCreateDialog.vue
var ScTsharkCreateDialog_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	__name: "ScTsharkCreateDialog",
	props: {
		modelValue: { type: Boolean },
		tsharkOk: { type: Boolean },
		ifaceOptions: {},
		iface: {},
		filter: {},
		filterType: {},
		captureName: {},
		count: {},
		timeout: {},
		starting: { type: Boolean }
	},
	emits: [
		"update:modelValue",
		"update:iface",
		"update:filter",
		"update:filterType",
		"update:captureName",
		"update:count",
		"update:timeout",
		"start"
	],
	setup(__props, { emit: __emit }) {
		const props = __props;
		const emit = __emit;
		const FILTER_TYPES = [
			{
				label: "自动识别（推荐）",
				value: "auto"
			},
			{
				label: "捕获过滤（BPF）",
				value: "bpf"
			},
			{
				label: "显示过滤（自动转 BPF）",
				value: "display"
			}
		];
		const filterPlaceholder = computed(() => {
			if (props.filterType === "bpf") return "如 tcp port 8080 / host 10.0.0.1";
			if (props.filterType === "display") return "如 http / http.request.method == \"GET\" / dns";
			return "如 http、dns 或 tcp port 8080";
		});
		const filterHint = computed(() => {
			if (props.filterType === "bpf") return "捕获过滤只认 tcp / udp / port / host 这类语法；直接写 http 会启动失败。";
			if (props.filterType === "display") return "实时抓包本身不支持显示过滤（tshark 抓包写文件时不能用 -Y），这里会尽量翻译成等价 BPF：http → tcp 80/8080/8000/8888，dns → port 53。翻译不了的表达式会被拒绝。";
			return "自动识别：协议名（http / dns / tls）与带 ==、字段点号的表达式按显示过滤处理并翻译成 BPF；tcp port 8080 这类直接按捕获过滤执行。";
		});
		function onOpenChange(v) {
			emit("update:modelValue", !!v);
		}
		function onName(v) {
			emit("update:captureName", v == null ? "" : String(v));
		}
		function onIface(v) {
			emit("update:iface", v == null ? "" : String(v));
		}
		function onFilter(v) {
			emit("update:filter", v == null ? "" : String(v));
		}
		function onFilterType(v) {
			emit("update:filterType", v == null ? "auto" : String(v));
		}
		function onCount(v) {
			emit("update:count", v == null || v === "" ? 0 : Number(v));
		}
		function onTimeout(v) {
			emit("update:timeout", v == null || v === "" ? 0 : Number(v));
		}
		return (_ctx, _cache) => {
			return openBlock(), createBlock(unref(component), {
				"model-value": __props.modelValue,
				title: "新增抓包会话",
				width: "560px",
				top: "10vh",
				"onUpdate:modelValue": onOpenChange
			}, {
				footer: withCtx(() => [createVNode(unref(ReButton_default), { onClick: _cache[0] || (_cache[0] = ($event) => emit("update:modelValue", false)) }, {
					default: withCtx(() => [..._cache[8] || (_cache[8] = [createTextVNode("取消", -1)])]),
					_: 1
				}), createVNode(unref(ReButton_default), {
					type: "primary",
					icon: "VideoPlay",
					loading: __props.starting,
					disabled: !__props.tsharkOk,
					onClick: _cache[1] || (_cache[1] = ($event) => emit("start"))
				}, {
					default: withCtx(() => [..._cache[9] || (_cache[9] = [createTextVNode(" 开始抓包 ", -1)])]),
					_: 1
				}, 8, ["loading", "disabled"])]),
				default: withCtx(() => [createBaseVNode("div", _hoisted_1$2, [
					createBaseVNode("div", _hoisted_2$2, [_cache[2] || (_cache[2] = createBaseVNode("span", { class: "create-label" }, "会话名称", -1)), createVNode(unref(ReInput_default), {
						"model-value": __props.captureName,
						placeholder: "可空，默认按网卡与时间生成",
						clearable: "",
						"onUpdate:modelValue": onName
					}, null, 8, ["model-value"])]),
					createBaseVNode("div", _hoisted_3$2, [_cache[3] || (_cache[3] = createBaseVNode("span", { class: "create-label" }, "网卡", -1)), createVNode(unref(ReSelect_default), {
						"model-value": __props.iface,
						data: __props.ifaceOptions,
						placeholder: "选择要抓包的网卡",
						filterable: "",
						clearable: "",
						"onUpdate:modelValue": onIface
					}, null, 8, ["model-value", "data"])]),
					createBaseVNode("div", _hoisted_4$2, [_cache[4] || (_cache[4] = createBaseVNode("span", { class: "create-label" }, "过滤语法", -1)), createVNode(unref(ReSelect_default), {
						"model-value": __props.filterType,
						data: FILTER_TYPES,
						"onUpdate:modelValue": onFilterType
					}, null, 8, ["model-value"])]),
					createBaseVNode("div", _hoisted_5$2, [_cache[5] || (_cache[5] = createBaseVNode("span", { class: "create-label" }, "过滤表达式", -1)), createVNode(unref(ReInput_default), {
						"model-value": __props.filter,
						placeholder: filterPlaceholder.value,
						clearable: "",
						"onUpdate:modelValue": onFilter
					}, null, 8, ["model-value", "placeholder"])]),
					createBaseVNode("p", _hoisted_6$2, toDisplayString(filterHint.value), 1),
					createBaseVNode("div", _hoisted_7$1, [_cache[6] || (_cache[6] = createBaseVNode("span", { class: "create-label" }, "包数上限", -1)), createVNode(unref(ReInputNumber_default), {
						"model-value": __props.count,
						min: 0,
						max: 1e6,
						placeholder: "0 = 不限",
						"onUpdate:modelValue": onCount
					}, null, 8, ["model-value"])]),
					createBaseVNode("div", _hoisted_8$1, [_cache[7] || (_cache[7] = createBaseVNode("span", { class: "create-label" }, "时长上限", -1)), createVNode(unref(ReInputNumber_default), {
						"model-value": __props.timeout,
						min: 0,
						max: 86400,
						placeholder: "秒，0 = 不限",
						"onUpdate:modelValue": onTimeout
					}, null, 8, ["model-value"])]),
					!__props.tsharkOk ? (openBlock(), createElementBlock("p", _hoisted_9$1, " tshark 未就绪（未安装或不在 PATH 中），暂时无法抓包。 ")) : createCommentVNode("", true)
				])]),
				_: 1
			}, 8, ["model-value"]);
		};
	}
}), [["__scopeId", "data-v-6c9a5376"]]);
//#endregion
//#region ../../pages/monitor/src/views/tshark/ScTsharkSessionDetailDialog.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1$1 = { class: "detail-shell" };
var _hoisted_2$1 = { class: "detail-head" };
var _hoisted_3$1 = ["title"];
var _hoisted_4$1 = { class: "detail-meta" };
var _hoisted_5$1 = { class: "detail-meta" };
var _hoisted_6$1 = { class: "detail-meta" };
//#endregion
//#region ../../pages/monitor/src/views/tshark/ScTsharkSessionDetailDialog.vue
var ScTsharkSessionDetailDialog_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	__name: "ScTsharkSessionDetailDialog",
	props: {
		modelValue: { type: Boolean },
		session: {},
		initialTab: {},
		liveConnected: { type: Boolean },
		liveCount: {}
	},
	emits: ["update:modelValue"],
	setup(__props, { emit: __emit }) {
		const props = __props;
		const emit = __emit;
		const tab = ref("packet");
		const tabs = computed(() => [
			{
				name: "packet",
				label: "报文",
				icon: "Tickets"
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
		const title = computed(() => `会话详情 · ${props.session?.sessionName || ""}`);
		watch(() => [props.modelValue, props.initialTab], ([visible, initial]) => {
			if (visible) tab.value = initial || "packet";
		}, { immediate: true });
		function onOpenChange(v) {
			emit("update:modelValue", !!v);
		}
		function onTabChange(name) {
			tab.value = name || "packet";
		}
		return (_ctx, _cache) => {
			return openBlock(), createBlock(unref(component), {
				"model-value": __props.modelValue,
				title: title.value,
				width: "92%",
				top: "4vh",
				"footer-hidden": "",
				"onUpdate:modelValue": onOpenChange
			}, {
				default: withCtx(() => [createBaseVNode("div", _hoisted_1$1, [createBaseVNode("div", _hoisted_2$1, [
					createBaseVNode("span", {
						class: "detail-name",
						title: __props.session?.sessionName || ""
					}, toDisplayString(__props.session?.sessionName || "未命名会话"), 9, _hoisted_3$1),
					createVNode(unref(component$1), {
						type: __props.session?.captureStatus === 1 ? "success" : "info",
						effect: "plain"
					}, {
						default: withCtx(() => [createTextVNode(toDisplayString(__props.session?.captureStatus === 1 ? "抓包中" : "已停止"), 1)]),
						_: 1
					}, 8, ["type"]),
					createBaseVNode("span", _hoisted_4$1, toDisplayString(__props.session?.captureInterface || "—"), 1),
					createBaseVNode("span", _hoisted_5$1, toDisplayString(__props.session?.packetCount ?? 0) + " 包", 1),
					createBaseVNode("span", _hoisted_6$1, toDisplayString(__props.session?.startTime || "—"), 1),
					_cache[0] || (_cache[0] = createBaseVNode("span", { class: "detail-spacer" }, null, -1)),
					createBaseVNode("span", { class: normalizeClass(["detail-live", { "is-on": __props.liveConnected }]) }, toDisplayString(__props.liveConnected ? `实时推送 +${__props.liveCount}` : "推送未连接"), 3)
				]), createVNode(unref(ReTab_default), {
					class: "detail-tabs",
					variant: "underline",
					tabs: tabs.value,
					"model-value": tab.value,
					stretch: "",
					"onUpdate:modelValue": onTabChange
				}, {
					packet: withCtx(() => [renderSlot(_ctx.$slots, "packet", {}, void 0, true)]),
					stats: withCtx(() => [renderSlot(_ctx.$slots, "stats", {}, void 0, true)]),
					flow: withCtx(() => [renderSlot(_ctx.$slots, "flow", {}, void 0, true)]),
					_: 3
				}, 8, ["tabs", "model-value"])])]),
				_: 3
			}, 8, ["model-value", "title"]);
		};
	}
}), [["__scopeId", "data-v-809f0314"]]);
//#endregion
//#region ../../pages/monitor/src/views/tshark/ScTsharkCapture.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1 = { class: "tshark-page capture-page" };
var _hoisted_2 = { class: "tshark-bar" };
var _hoisted_3 = { class: "tshark-bar__group" };
var _hoisted_4 = { class: "tshark-dim capture-summary" };
var _hoisted_5 = { class: "tshark-work" };
var _hoisted_6 = { class: "session-name" };
var _hoisted_7 = ["title"];
var _hoisted_8 = { class: "tshark-mono" };
var _hoisted_9 = { class: "capture-ops" };
var _hoisted_10 = {
	key: 1,
	class: "tshark-panel__empty"
};
var _hoisted_11 = {
	key: 1,
	class: "tshark-panel__empty"
};
var _hoisted_12 = {
	key: 1,
	class: "tshark-panel__empty"
};
//#endregion
//#region ../../pages/monitor/src/views/tshark/ScTsharkCapture.vue
var ScTsharkCapture_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	__name: "ScTsharkCapture",
	setup(__props) {
		const { tsharkOk, ifaceOptions, iface, filter, filterType, captureName, count, timeout, starting, loadingSessions, filteredSessions, runningCount, sessionPage, sessionPageSize, activeSessionId, activeSession, loadingPackets, packets, packetPage, packetTotal, packetKeyword, packetPageSize, protoStats, topFlows, statsVersion, liveConnected, liveCount, detailOpen, packetDetail, init, loadSessions, selectSession, clearActiveSession, loadPackets, setPacketKeyword, filterByProtocol, refresh, exportCsv, downloadPcap, startCapture, stopSession, deleteSession, openPacketDetail, openPacketDetailById } = useTshark({
			source: "live",
			autoSelectFirst: false
		});
		const createVisible = ref(false);
		const detailVisible = ref(false);
		const detailTab = ref("packet");
		const lifecycleVisible = ref(false);
		const lifecyclePacket = ref(null);
		const packetEmptyText = computed(() => packetKeyword.value.trim() ? "没有匹配的数据包，试试清空关键字" : "该会话还没有抓到的数据包");
		const columns = computed(() => [
			{
				prop: "sessionName",
				label: "会话",
				minWidth: 200,
				slot: "name",
				showOverflowTooltip: true
			},
			{
				prop: "captureInterface",
				label: "网卡",
				minWidth: 160,
				showOverflowTooltip: true
			},
			{
				prop: "captureStatus",
				label: "状态",
				width: 96,
				slot: "status",
				align: "center"
			},
			{
				prop: "packetCount",
				label: "报文数",
				width: 96,
				align: "right"
			},
			{
				prop: "startTime",
				label: "开始时间",
				width: 176
			},
			{
				prop: "endTime",
				label: "结束时间",
				width: 176
			},
			{
				prop: "captureDuration",
				label: "时长",
				width: 96,
				slot: "duration",
				align: "right"
			},
			{
				prop: "action",
				label: "操作",
				width: 330,
				slot: "action",
				fixed: "right"
			}
		]);
		/**
		* 新增会话：启动成功才关弹层；失败（过滤器语法错等）留在弹层里改参数。
		*/
		async function onCreate() {
			if (await startCapture()) createVisible.value = false;
		}
		/** 打开某会话的详情，并默认停在用户点的那一页 */
		function openDetail(row, tab) {
			detailTab.value = tab;
			detailVisible.value = true;
			selectSession(row.id);
		}
		/**
		* 关闭详情：清掉选中会话，顺带断开 SSE。
		* 生命周期 / 报文详情是叠在详情上的弹层，一并收掉，避免下次打开残留上一条会话的数据。
		*/
		watch(detailVisible, (visible) => {
			if (visible) return;
			lifecycleVisible.value = false;
			detailOpen.value = false;
			clearActiveSession();
		});
		/** 统计页点协议：切回报文页并按协议过滤 */
		function onPickProtocol(protocol) {
			filterByProtocol(protocol);
			detailTab.value = "packet";
		}
		function openLifecycle(row) {
			lifecyclePacket.value = row;
			lifecycleVisible.value = true;
		}
		onMounted(init);
		return (_ctx, _cache) => {
			return openBlock(), createElementBlock("div", _hoisted_1, [
				createBaseVNode("div", _hoisted_2, [
					createBaseVNode("div", _hoisted_3, [createBaseVNode("span", { class: normalizeClass(["tshark-status", unref(tsharkOk) ? "tshark-status--ok" : "tshark-status--bad"]) }, [_cache[13] || (_cache[13] = createBaseVNode("span", { class: "tshark-status__dot" }, null, -1)), createBaseVNode("span", null, toDisplayString(unref(tsharkOk) ? "TShark 可用" : "TShark 未就绪"), 1)], 2), createBaseVNode("span", _hoisted_4, [createTextVNode(" 共 " + toDisplayString(unref(filteredSessions).length) + " 个会话", 1), unref(runningCount) ? (openBlock(), createElementBlock(Fragment, { key: 0 }, [createTextVNode(" · " + toDisplayString(unref(runningCount)) + " 个抓包中", 1)], 64)) : createCommentVNode("", true)])]),
					_cache[15] || (_cache[15] = createBaseVNode("span", { class: "tshark-bar__spacer" }, null, -1)),
					createVNode(unref(ReButton_default), {
						icon: "Refresh",
						layout: "square",
						tip: "刷新会话列表",
						onClick: unref(refresh)
					}, null, 8, ["onClick"]),
					createVNode(unref(ReButton_default), {
						type: "primary",
						icon: "Plus",
						disabled: !unref(tsharkOk),
						onClick: _cache[0] || (_cache[0] = ($event) => createVisible.value = true)
					}, {
						default: withCtx(() => [..._cache[14] || (_cache[14] = [createTextVNode(" 新增会话 ", -1)])]),
						_: 1
					}, 8, ["disabled"])
				]),
				createBaseVNode("div", _hoisted_5, [createVNode(unref(ReTable_default), {
					class: "tshark-table capture-table",
					data: unref(filteredSessions),
					columns: columns.value,
					loading: unref(loadingSessions),
					pagination: true,
					"page-sizes": [
						10,
						20,
						50
					],
					page: unref(sessionPage),
					"onUpdate:page": _cache[1] || (_cache[1] = ($event) => isRef(sessionPage) ? sessionPage.value = $event : null),
					"page-size": unref(sessionPageSize),
					"onUpdate:pageSize": _cache[2] || (_cache[2] = ($event) => isRef(sessionPageSize) ? sessionPageSize.value = $event : null),
					toolbar: false,
					"row-key": "id",
					stripe: "",
					"empty-text": "还没有抓包会话，点右上角「新增会话」选择网卡开始"
				}, {
					name: withCtx(({ row }) => [createBaseVNode("div", _hoisted_6, [createBaseVNode("span", { class: normalizeClass(["session-name__dot", row.captureStatus === 1 ? "is-run" : "is-stop"]) }, null, 2), createBaseVNode("span", {
						class: "session-name__text",
						title: row.sessionName
					}, toDisplayString(row.sessionName || `会话 ${row.id}`), 9, _hoisted_7)])]),
					status: withCtx(({ row }) => [createVNode(unref(component$1), {
						type: row.captureStatus === 1 ? "success" : "info",
						effect: "plain"
					}, {
						default: withCtx(() => [createTextVNode(toDisplayString(row.captureStatus === 1 ? "抓包中" : "已停止"), 1)]),
						_: 2
					}, 1032, ["type"])]),
					duration: withCtx(({ row }) => [createBaseVNode("span", _hoisted_8, toDisplayString(unref(fmtDuration)(row.captureDuration)), 1)]),
					action: withCtx(({ row }) => [createBaseVNode("div", _hoisted_9, [
						createVNode(unref(ReButton_default), {
							link: "",
							type: "primary",
							onClick: ($event) => openDetail(row, "packet")
						}, {
							default: withCtx(() => [..._cache[16] || (_cache[16] = [createTextVNode("报文", -1)])]),
							_: 1
						}, 8, ["onClick"]),
						createVNode(unref(ReButton_default), {
							link: "",
							type: "primary",
							onClick: ($event) => openDetail(row, "stats")
						}, {
							default: withCtx(() => [..._cache[17] || (_cache[17] = [createTextVNode("统计", -1)])]),
							_: 1
						}, 8, ["onClick"]),
						createVNode(unref(ReButton_default), {
							link: "",
							type: "primary",
							onClick: ($event) => openDetail(row, "flow")
						}, {
							default: withCtx(() => [..._cache[18] || (_cache[18] = [createTextVNode("会话流", -1)])]),
							_: 1
						}, 8, ["onClick"]),
						_cache[19] || (_cache[19] = createBaseVNode("span", { class: "capture-ops__sep" }, null, -1)),
						row.captureStatus === 1 ? (openBlock(), createBlock(unref(ReButton_default), {
							key: 0,
							icon: "VideoPause",
							layout: "square",
							tip: "停止抓包",
							onClick: ($event) => unref(stopSession)(row.id)
						}, null, 8, ["onClick"])) : createCommentVNode("", true),
						createVNode(unref(ReButton_default), {
							icon: "Download",
							layout: "square",
							tip: "下载原始 pcap（用 Wireshark 打开）",
							onClick: ($event) => unref(downloadPcap)(row.id, row.sessionName)
						}, null, 8, ["onClick"]),
						createVNode(unref(ReButton_default), {
							icon: "Delete",
							type: "danger",
							layout: "square",
							tip: "删除会话及其报文",
							onClick: ($event) => unref(deleteSession)(row.id)
						}, null, 8, ["onClick"])
					])]),
					_: 1
				}, 8, [
					"data",
					"columns",
					"loading",
					"page",
					"page-size"
				])]),
				createVNode(ScTsharkCreateDialog_default, {
					modelValue: createVisible.value,
					"onUpdate:modelValue": _cache[3] || (_cache[3] = ($event) => createVisible.value = $event),
					iface: unref(iface),
					"onUpdate:iface": _cache[4] || (_cache[4] = ($event) => isRef(iface) ? iface.value = $event : null),
					filter: unref(filter),
					"onUpdate:filter": _cache[5] || (_cache[5] = ($event) => isRef(filter) ? filter.value = $event : null),
					"filter-type": unref(filterType),
					"onUpdate:filterType": _cache[6] || (_cache[6] = ($event) => isRef(filterType) ? filterType.value = $event : null),
					"capture-name": unref(captureName),
					"onUpdate:captureName": _cache[7] || (_cache[7] = ($event) => isRef(captureName) ? captureName.value = $event : null),
					count: unref(count),
					"onUpdate:count": _cache[8] || (_cache[8] = ($event) => isRef(count) ? count.value = $event : null),
					timeout: unref(timeout),
					"onUpdate:timeout": _cache[9] || (_cache[9] = ($event) => isRef(timeout) ? timeout.value = $event : null),
					"tshark-ok": unref(tsharkOk),
					"iface-options": unref(ifaceOptions),
					starting: unref(starting),
					onStart: onCreate
				}, null, 8, [
					"modelValue",
					"iface",
					"filter",
					"filter-type",
					"capture-name",
					"count",
					"timeout",
					"tshark-ok",
					"iface-options",
					"starting"
				]),
				createVNode(ScTsharkSessionDetailDialog_default, {
					modelValue: detailVisible.value,
					"onUpdate:modelValue": _cache[10] || (_cache[10] = ($event) => detailVisible.value = $event),
					session: unref(activeSession),
					"initial-tab": detailTab.value,
					"live-connected": unref(liveConnected),
					"live-count": unref(liveCount)
				}, {
					packet: withCtx(() => [unref(activeSessionId) != null ? (openBlock(), createBlock(ScTsharkPacketPanel_default, {
						key: 0,
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
					])) : (openBlock(), createElementBlock("div", _hoisted_10, [createVNode(unref(ReEmpty_default), {
						description: "选择一个抓包会话后查看报文",
						layout: "modern"
					})]))]),
					stats: withCtx(() => [unref(activeSessionId) != null ? (openBlock(), createBlock(ScTsharkStatsPanel_default, {
						key: 0,
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
					])) : (openBlock(), createElementBlock("div", _hoisted_11, [createVNode(unref(ReEmpty_default), {
						description: "选择一个抓包会话后查看统计",
						layout: "modern"
					})]))]),
					flow: withCtx(() => [unref(activeSessionId) != null ? (openBlock(), createBlock(ScTsharkFlowPanel_default, {
						key: 0,
						"top-flows": unref(topFlows),
						"packet-total": unref(packetTotal),
						version: unref(statsVersion)
					}, null, 8, [
						"top-flows",
						"packet-total",
						"version"
					])) : (openBlock(), createElementBlock("div", _hoisted_12, [createVNode(unref(ReEmpty_default), {
						description: "选择一个抓包会话后查看会话流",
						layout: "modern"
					})]))]),
					_: 1
				}, 8, [
					"modelValue",
					"session",
					"initial-tab",
					"live-connected",
					"live-count"
				]),
				createVNode(ScTsharkPacketDetail_default, {
					modelValue: unref(detailOpen),
					"onUpdate:modelValue": _cache[11] || (_cache[11] = ($event) => isRef(detailOpen) ? detailOpen.value = $event : null),
					packet: unref(packetDetail)
				}, null, 8, ["modelValue", "packet"]),
				createVNode(ScTsharkLifecycleDialog_default, {
					modelValue: lifecycleVisible.value,
					"onUpdate:modelValue": _cache[12] || (_cache[12] = ($event) => lifecycleVisible.value = $event),
					packet: lifecyclePacket.value,
					onOpenDetail: unref(openPacketDetailById)
				}, null, 8, [
					"modelValue",
					"packet",
					"onOpenDetail"
				])
			]);
		};
	}
}), [["__scopeId", "data-v-165f6776"]]);
//#endregion
export { ScTsharkCapture_default as default };
