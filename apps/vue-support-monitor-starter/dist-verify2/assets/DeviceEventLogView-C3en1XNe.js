import { D as createVNode, E as createTextVNode, On as unref, St as resolveComponent, _ as createBaseVNode, b as createElementBlock, bt as renderList, ct as onMounted, g as computed, gn as reactive, k as defineComponent, mt as openBlock, o as Fragment, qt as withCtx, rr as toDisplayString, v as createBlock, vn as ref, y as createCommentVNode } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { t as ElMessage } from "./message-BQI5cdKE.js";
import { t as ReTable_default } from "./ReTable-BO1ac7-i.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { t as ReSelect_default } from "./ReSelect-C2rq-Voy.js";
import { t as ReButton_default } from "./ReButton-owxlNwDO.js";
import { t as component } from "./ReStatCard-BGjVHdD2.js";
import { O as tickets_default, i as bell_default, u as connection_default, x as office_building_default } from "./dist-Axt1Prff.js";
import { t as component$1 } from "./ReTag-D5UpQULZ.js";
import { t as deviceApi } from "./deviceApi-Dqp1FtpS.js";
//#region ../../pages/device/src/views/DeviceEventLogView.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1 = { class: "del" };
var _hoisted_2 = { class: "del-kpis" };
var _hoisted_3 = { class: "del-filter" };
var _hoisted_4 = { class: "del-field del-field--device" };
var _hoisted_5 = { class: "del-field del-field--range" };
var _hoisted_6 = { class: "del-filter__meta" };
var _hoisted_7 = { class: "del-ops" };
var _hoisted_8 = { class: "del-panel del-panel--fill" };
var _hoisted_9 = { class: "del-panel__head" };
var _hoisted_10 = { class: "del-panel__count" };
var _hoisted_11 = { class: "del-panel__hint" };
var _hoisted_12 = {
	key: 0,
	class: "del-error"
};
var _hoisted_13 = { class: "del-mono" };
var _hoisted_14 = { class: "del-detail" };
var _hoisted_15 = { class: "del-device" };
var _hoisted_16 = {
	key: 2,
	class: "del-ghost"
};
var _hoisted_17 = { class: "del-ghost__icon" };
var _hoisted_18 = { class: "del-ghost__title" };
var _hoisted_19 = { class: "del-ghost__desc" };
//#endregion
//#region ../../pages/device/src/views/DeviceEventLogView.vue
var DeviceEventLogView_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	__name: "DeviceEventLogView",
	setup(__props) {
		/** 类型分片：事件类型是闭集，用分片挑；类型过滤在后端做，所以不带计数 */
		const typeSegments = [{
			label: "全部",
			value: "all"
		}, ...[
			{
				value: "MOTION",
				label: "移动侦测"
			},
			{
				value: "IO_ALARM",
				label: "IO 报警"
			},
			{
				value: "ACCESS",
				label: "门禁事件"
			},
			{
				value: "TEMP",
				label: "温度报警"
			},
			{
				value: "NETWORK",
				label: "网络异常"
			},
			{
				value: "OTHER",
				label: "其他"
			}
		]];
		const EVENT_TYPE_MAP = /* @__PURE__ */ new Map();
		EVENT_TYPE_MAP.set("MOTION", {
			label: "移动侦测",
			tag: "primary"
		});
		EVENT_TYPE_MAP.set("IO_ALARM", {
			label: "IO 报警",
			tag: "danger"
		});
		EVENT_TYPE_MAP.set("ACCESS", {
			label: "门禁事件",
			tag: "warning"
		});
		EVENT_TYPE_MAP.set("TEMP", {
			label: "温度报警",
			tag: "danger"
		});
		EVENT_TYPE_MAP.set("NETWORK", {
			label: "网络异常",
			tag: "warning"
		});
		EVENT_TYPE_MAP.set("OTHER", {
			label: "其他",
			tag: "info"
		});
		/** 时间快捷键：就近时段最常用 */
		const RANGE_SHORTCUTS = [
			{
				text: "近 1 小时",
				value: () => [/* @__PURE__ */ new Date(Date.now() - 36e5), /* @__PURE__ */ new Date()]
			},
			{
				text: "近 24 小时",
				value: () => [/* @__PURE__ */ new Date(Date.now() - 864e5), /* @__PURE__ */ new Date()]
			},
			{
				text: "近 7 天",
				value: () => [/* @__PURE__ */ new Date(Date.now() - 6048e5), /* @__PURE__ */ new Date()]
			}
		];
		const devices = ref([]);
		const events = ref([]);
		const loading = ref(false);
		const loadError = ref("");
		const lastQueryAt = ref("");
		const filters = reactive({
			deviceId: "",
			type: "all",
			range: null
		});
		const columns = [
			{
				prop: "deviceEventRecordOccurredAt",
				label: "发生时间",
				width: 190,
				slot: "time"
			},
			{
				prop: "deviceEventRecordChannelNo",
				label: "通道",
				width: 90,
				align: "center"
			},
			{
				prop: "deviceEventRecordEventType",
				label: "事件类型",
				width: 130,
				slot: "type"
			},
			{
				prop: "deviceEventRecordDetail",
				label: "详情",
				minWidth: 260,
				slot: "detail",
				showOverflowTooltip: true
			},
			{
				prop: "deviceEventRecordDeviceId",
				label: "设备",
				minWidth: 180,
				slot: "device"
			}
		];
		const deviceOptions = computed(() => devices.value.map((d) => ({
			value: d.deviceInfoId,
			label: `${d.deviceInfoName || d.deviceInfoId}${d.deviceInfoOnline ? "" : "（离线）"}`
		})));
		const currentDeviceName = computed(() => devices.value.find((d) => d.deviceInfoId === filters.deviceId)?.deviceInfoName || "未选择设备（事件按设备拉取）");
		const filteredRows = computed(() => events.value);
		const alarmCount = computed(() => events.value.filter((e) => [
			"IO_ALARM",
			"TEMP",
			"NETWORK"
		].includes(e.deviceEventRecordEventType || "")).length);
		const channelCount = computed(() => new Set(events.value.map((e) => e.deviceEventRecordChannelNo).filter((n) => n !== void 0)).size);
		const latestAt = computed(() => {
			const times = events.value.map((e) => new Date(e.deviceEventRecordOccurredAt || "").getTime()).filter((t) => !Number.isNaN(t));
			if (!times.length) return null;
			return new Date(Math.max(...times));
		});
		const kpis = computed(() => [
			{
				key: "total",
				title: "事件记录",
				value: events.value.length,
				desc: lastQueryAt.value ? `查询于 ${lastQueryAt.value}` : "尚未查询",
				icon: tickets_default,
				iconColor: "var(--el-color-primary)"
			},
			{
				key: "alarm",
				title: "告警事件",
				value: alarmCount.value,
				desc: "IO / 温度 / 网络",
				icon: bell_default,
				iconColor: "var(--el-color-danger)"
			},
			{
				key: "channel",
				title: "涉及通道",
				value: channelCount.value,
				desc: "去重后的通道数",
				icon: connection_default,
				iconColor: "var(--metric-disk, var(--el-color-warning))"
			},
			{
				key: "latest",
				title: "最新事件",
				value: latestAt.value ? latestAt.value.toLocaleDateString("zh-CN") : "—",
				desc: latestAt.value ? latestAt.value.toLocaleTimeString("zh-CN", { hour12: false }) : "暂无记录",
				icon: office_building_default,
				iconColor: "var(--el-color-info)"
			}
		]);
		function typeMeta(value) {
			return EVENT_TYPE_MAP.get(value || "") || {
				label: value || "—",
				tag: "info"
			};
		}
		function fmtTime(v) {
			if (!v) return "—";
			const d = new Date(v);
			return Number.isNaN(d.getTime()) ? v : d.toLocaleString("zh-CN", { hour12: false });
		}
		function deviceNameOf(id) {
			if (!id) return "—";
			return devices.value.find((d) => d.deviceInfoId === id)?.deviceInfoName || id;
		}
		async function fetchDevices() {
			try {
				devices.value = await deviceApi.list() || [];
			} catch (e) {
				devices.value = [];
				ElMessage.error(`设备清单加载失败：${errText(e)}`);
			}
		}
		async function query() {
			if (!filters.deviceId) {
				ElMessage.warning("请先选择设备");
				return;
			}
			loading.value = true;
			loadError.value = "";
			try {
				const params = { deviceId: filters.deviceId };
				if (filters.type && filters.type !== "all") params.type = filters.type;
				if (filters.range?.[0]) params.start = filters.range[0];
				if (filters.range?.[1]) params.end = filters.range[1];
				events.value = await deviceApi.queryEvents(params) || [];
				lastQueryAt.value = (/* @__PURE__ */ new Date()).toLocaleTimeString("zh-CN", { hour12: false });
			} catch (e) {
				events.value = [];
				loadError.value = errText(e);
				ElMessage.error(`事件加载失败：${loadError.value}`);
			} finally {
				loading.value = false;
			}
		}
		function onExport() {
			const csv = [[
				"发生时间",
				"通道",
				"事件类型",
				"详情",
				"设备"
			], ...filteredRows.value.map((e) => [
				fmtTime(e.deviceEventRecordOccurredAt),
				String(e.deviceEventRecordChannelNo ?? ""),
				typeMeta(e.deviceEventRecordEventType).label,
				e.deviceEventRecordDetail || "",
				deviceNameOf(e.deviceEventRecordDeviceId)
			])].map((line) => line.map((cell) => `"${String(cell).replace(/"/g, "\"\"")}"`).join(",")).join("\r\n");
			const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
			const url = URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = `设备事件-${currentDeviceName.value}-${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}.csv`;
			a.click();
			URL.revokeObjectURL(url);
		}
		function errText(e) {
			return e?.msg || (e instanceof Error ? e.message : String(e));
		}
		onMounted(fetchDevices);
		return (_ctx, _cache) => {
			const _component_el_segmented = resolveComponent("el-segmented");
			const _component_el_date_picker = resolveComponent("el-date-picker");
			const _component_el_icon = resolveComponent("el-icon");
			return openBlock(), createElementBlock("div", _hoisted_1, [
				createBaseVNode("section", _hoisted_2, [(openBlock(true), createElementBlock(Fragment, null, renderList(kpis.value, (k) => {
					return openBlock(), createBlock(unref(component), {
						key: k.key,
						size: "compact",
						title: k.title,
						value: k.value,
						desc: k.desc,
						icon: k.icon,
						"icon-color": k.iconColor
					}, null, 8, [
						"title",
						"value",
						"desc",
						"icon",
						"icon-color"
					]);
				}), 128))]),
				createBaseVNode("section", _hoisted_3, [
					createBaseVNode("div", _hoisted_4, [createVNode(unref(ReSelect_default), {
						modelValue: filters.deviceId,
						"onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => filters.deviceId = $event),
						placeholder: "选择设备（必选）",
						clearable: "",
						filterable: "",
						options: deviceOptions.value,
						onChange: query
					}, null, 8, ["modelValue", "options"])]),
					createVNode(_component_el_segmented, {
						modelValue: filters.type,
						"onUpdate:modelValue": _cache[1] || (_cache[1] = ($event) => filters.type = $event),
						options: typeSegments,
						class: "del-seg",
						onChange: query
					}, null, 8, ["modelValue"]),
					createBaseVNode("div", _hoisted_5, [createVNode(_component_el_date_picker, {
						modelValue: filters.range,
						"onUpdate:modelValue": _cache[2] || (_cache[2] = ($event) => filters.range = $event),
						type: "datetimerange",
						"range-separator": "至",
						"start-placeholder": "开始时间",
						"end-placeholder": "结束时间",
						"value-format": "YYYY-MM-DD HH:mm:ss",
						shortcuts: RANGE_SHORTCUTS,
						style: { "width": "100%" }
					}, null, 8, ["modelValue"])]),
					createBaseVNode("span", _hoisted_6, toDisplayString(filteredRows.value.length) + " / " + toDisplayString(events.value.length) + " 条", 1),
					createBaseVNode("div", _hoisted_7, [
						createVNode(unref(ReButton_default), {
							icon: "RefreshRight",
							layout: "square",
							tip: "重新拉取事件",
							loading: loading.value,
							disabled: !filters.deviceId,
							onClick: query
						}, null, 8, ["loading", "disabled"]),
						createVNode(unref(ReButton_default), {
							icon: "Download",
							"show-text": true,
							disabled: !filteredRows.value.length,
							onClick: onExport
						}, {
							default: withCtx(() => [..._cache[3] || (_cache[3] = [createTextVNode("导出 CSV", -1)])]),
							_: 1
						}, 8, ["disabled"]),
						createVNode(unref(ReButton_default), {
							icon: "Search",
							"show-text": true,
							type: "primary",
							disabled: !filters.deviceId,
							onClick: query
						}, {
							default: withCtx(() => [..._cache[4] || (_cache[4] = [createTextVNode(" 查询 ", -1)])]),
							_: 1
						}, 8, ["disabled"])
					])
				]),
				createBaseVNode("section", _hoisted_8, [
					createBaseVNode("header", _hoisted_9, [
						_cache[5] || (_cache[5] = createBaseVNode("span", { class: "del-panel__bar" }, null, -1)),
						_cache[6] || (_cache[6] = createBaseVNode("span", null, "设备事件", -1)),
						createBaseVNode("span", _hoisted_10, toDisplayString(filteredRows.value.length), 1),
						createBaseVNode("span", _hoisted_11, toDisplayString(currentDeviceName.value), 1)
					]),
					loadError.value ? (openBlock(), createElementBlock("div", _hoisted_12, [createBaseVNode("span", null, toDisplayString(loadError.value), 1), createVNode(unref(ReButton_default), {
						icon: "RefreshRight",
						layout: "square",
						tip: "重试",
						loading: loading.value,
						onClick: query
					}, null, 8, ["loading"])])) : createCommentVNode("", true),
					filteredRows.value.length ? (openBlock(), createBlock(unref(ReTable_default), {
						key: 1,
						data: filteredRows.value,
						columns,
						engine: "element",
						"table-id": "device-events",
						"row-key": "deviceEventRecordId",
						pagination: true,
						"page-size": 20,
						"page-sizes": [
							10,
							20,
							50,
							100
						],
						toolbar: false,
						"layout-table": { fill: "auto" },
						settings: { border: false },
						style: { "width": "100%" }
					}, {
						"col-time": withCtx(({ row }) => [createBaseVNode("span", _hoisted_13, toDisplayString(fmtTime(row.deviceEventRecordOccurredAt)), 1)]),
						"col-type": withCtx(({ row }) => [createVNode(unref(component$1), {
							type: typeMeta(row.deviceEventRecordEventType).tag,
							size: "small",
							effect: "plain"
						}, {
							default: withCtx(() => [createTextVNode(toDisplayString(typeMeta(row.deviceEventRecordEventType).label), 1)]),
							_: 2
						}, 1032, ["type"])]),
						"col-detail": withCtx(({ row }) => [createBaseVNode("span", _hoisted_14, toDisplayString(row.deviceEventRecordDetail || "—"), 1)]),
						"col-device": withCtx(({ row }) => [createBaseVNode("span", _hoisted_15, toDisplayString(deviceNameOf(row.deviceEventRecordDeviceId)), 1)]),
						_: 1
					}, 8, ["data"])) : (openBlock(), createElementBlock("article", _hoisted_16, [
						createBaseVNode("span", _hoisted_17, [createVNode(_component_el_icon, null, {
							default: withCtx(() => [createVNode(unref(tickets_default))]),
							_: 1
						})]),
						createBaseVNode("p", _hoisted_18, toDisplayString(filters.deviceId ? "该时段没有事件" : "先选择一台设备"), 1),
						createBaseVNode("p", _hoisted_19, toDisplayString(filters.deviceId ? "事件由设备侧实时返回，只回溯到设备本地存储上限；换个时间段或清空类型再查一次。" : "事件按设备拉取：选中设备并给出时间范围后查询。"), 1)
					]))
				])
			]);
		};
	}
}), [["__scopeId", "data-v-5afb96db"]]);
//#endregion
export { DeviceEventLogView_default as default };
