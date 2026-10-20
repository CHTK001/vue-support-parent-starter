import { D as createVNode, E as createTextVNode, On as unref, St as resolveComponent, _ as createBaseVNode, b as createElementBlock, bt as renderList, ct as onMounted, g as computed, gn as reactive, k as defineComponent, mt as openBlock, o as Fragment, qt as withCtx, rr as toDisplayString, v as createBlock, vn as ref, y as createCommentVNode } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { t as ElMessage } from "./message-BQI5cdKE.js";
import { t as ElMessageBox } from "./message-box-CXDJvJwn.js";
import { t as ReTable_default } from "./ReTable-BO1ac7-i.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { t as ReSelect_default } from "./ReSelect-C2rq-Voy.js";
import { t as ReButton_default } from "./ReButton-owxlNwDO.js";
import { t as component } from "./ReDialog-DZGeR3lw.js";
import { u as ReFormItem } from "./ReKit-CFSh6vls.js";
import { t as component$1 } from "./ReStatCard-BGjVHdD2.js";
import { O as tickets_default, g as grid_default, s as circle_check_default, u as connection_default } from "./dist-Axt1Prff.js";
import { t as ReInput_default } from "./ReInput-CGHpe202.js";
import { t as ReInputNumber_default } from "./ReInputNumber-BOzz1hL8.js";
import { t as component$2 } from "./ReTag-D5UpQULZ.js";
import { t as deviceApi } from "./deviceApi-Dqp1FtpS.js";
//#region ../../pages/device/src/views/DeviceChannelView.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1 = { class: "dcv" };
var _hoisted_2 = { class: "dcv-kpis" };
var _hoisted_3 = { class: "dcv-filter" };
var _hoisted_4 = { class: "dcv-field dcv-field--device" };
var _hoisted_5 = { class: "dcv-field dcv-field--search" };
var _hoisted_6 = { class: "dcv-filter__meta" };
var _hoisted_7 = { class: "dcv-ops" };
var _hoisted_8 = { class: "dcv-panel dcv-panel--fill" };
var _hoisted_9 = { class: "dcv-panel__head" };
var _hoisted_10 = { class: "dcv-panel__count" };
var _hoisted_11 = { class: "dcv-panel__hint" };
var _hoisted_12 = {
	key: 0,
	class: "dcv-error"
};
var _hoisted_13 = { class: "dcv-mono" };
var _hoisted_14 = { class: "dcv-acts" };
var _hoisted_15 = {
	key: 2,
	class: "dcv-ghost"
};
var _hoisted_16 = { class: "dcv-ghost__icon" };
var _hoisted_17 = { class: "dcv-ghost__title" };
var _hoisted_18 = { class: "dcv-ghost__desc" };
var _hoisted_19 = { class: "dcv-hint" };
var _hoisted_20 = {
	key: 0,
	class: "dcv-hint dcv-hint--bad"
};
var _hoisted_21 = {
	key: 1,
	class: "dcv-hint"
};
//#endregion
//#region ../../pages/device/src/views/DeviceChannelView.vue
var DeviceChannelView_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	__name: "DeviceChannelView",
	setup(__props) {
		/**
		* 通道管理 —— 设备下的通道台账与启停。
		*
		* 数据来自 device-starter 的 `/api/device/channel/*`：
		*   - GET    /channel/list?deviceId=  某设备的通道
		*   - POST   /channel                新增
		*   - PUT    /channel/{id}           更新
		*   - PUT    /channel/{id}/status    启停
		*   - DELETE /channel/{id}           删除
		*
		* 通道必须挂在设备下（deviceId 为必填），所以未选设备时不查、也不允许新增。
		*
		* @author CH
		* @since 4.0.0.42
		*/
		const STATUS_SEGMENTS = [{
			label: "启用",
			value: "enabled"
		}, {
			label: "禁用",
			value: "disabled"
		}];
		const devices = ref([]);
		const channels = ref([]);
		const loading = ref(false);
		const loadError = ref("");
		const filters = reactive({
			deviceId: "",
			status: "all",
			keyword: ""
		});
		const dialogVisible = ref(false);
		const dialogSaving = ref(false);
		const editingId = ref(null);
		const form = reactive({
			deviceChannelNo: 1,
			deviceChannelName: "",
			deviceChannelType: "main",
			deviceChannelSort: 1,
			deviceChannelStatus: "enabled"
		});
		const columns = [
			{
				prop: "deviceChannelNo",
				label: "通道号",
				width: 110,
				slot: "deviceChannelNo"
			},
			{
				prop: "deviceChannelName",
				label: "通道名称",
				minWidth: 180,
				showOverflowTooltip: true
			},
			{
				prop: "deviceChannelType",
				label: "类型",
				width: 120,
				showOverflowTooltip: true
			},
			{
				prop: "deviceChannelStatus",
				label: "状态",
				width: 110,
				slot: "deviceChannelStatus"
			},
			{
				prop: "deviceChannelSort",
				label: "排序",
				width: 90,
				align: "center"
			},
			{
				prop: "actions",
				label: "操作",
				width: 170,
				slot: "actions"
			}
		];
		const deviceOptions = computed(() => devices.value.map((d) => ({
			value: d.deviceInfoId,
			label: `${d.deviceInfoName || d.deviceInfoId}${d.deviceInfoOnline ? "" : "（离线）"}`
		})));
		const currentDeviceName = computed(() => devices.value.find((d) => d.deviceInfoId === filters.deviceId)?.deviceInfoName || "未选择设备");
		const enabledCount = computed(() => channels.value.filter((c) => c.deviceChannelStatus === "enabled").length);
		/** 状态筛选：分片（带计数） */
		const statusSegments = computed(() => [
			{
				label: `全部 ${channels.value.length}`,
				value: "all"
			},
			{
				label: `启用 ${enabledCount.value}`,
				value: "enabled"
			},
			{
				label: `禁用 ${channels.value.length - enabledCount.value}`,
				value: "disabled"
			}
		]);
		const filteredChannels = computed(() => {
			const kw = filters.keyword.trim().toLowerCase();
			return channels.value.filter((c) => {
				if (filters.status !== "all" && c.deviceChannelStatus !== filters.status) return false;
				if (!kw) return true;
				return `${c.deviceChannelName || ""} ${c.deviceChannelNo}`.toLowerCase().includes(kw);
			});
		});
		/** 已被其他通道占用的通道号（编辑时排除自身） */
		const usedNos = computed(() => new Set(channels.value.filter((c) => c.deviceChannelId !== editingId.value).map((c) => c.deviceChannelNo)));
		const noInvalid = computed(() => !form.deviceChannelNo || usedNos.value.has(form.deviceChannelNo));
		const formInvalid = computed(() => noInvalid.value || !form.deviceChannelName.trim());
		const kpis = computed(() => [
			{
				key: "total",
				title: "通道总数",
				value: channels.value.length,
				desc: currentDeviceName.value,
				icon: tickets_default,
				iconColor: "var(--el-color-primary)"
			},
			{
				key: "enabled",
				title: "已启用",
				value: enabledCount.value,
				desc: "可出流 / 可上报",
				icon: circle_check_default,
				iconColor: "var(--el-color-success)"
			},
			{
				key: "disabled",
				title: "已禁用",
				value: channels.value.length - enabledCount.value,
				desc: "不占用采集资源",
				icon: grid_default,
				iconColor: "var(--el-color-info)"
			},
			{
				key: "devices",
				title: "可选设备",
				value: devices.value.length,
				desc: "来自设备台账",
				icon: connection_default,
				iconColor: "var(--metric-disk, var(--el-color-warning))"
			}
		]);
		async function fetchDevices() {
			try {
				devices.value = await deviceApi.list() || [];
			} catch (e) {
				devices.value = [];
				ElMessage.error(`设备清单加载失败：${errText(e)}`);
			}
		}
		async function fetchChannels() {
			if (!filters.deviceId) {
				channels.value = [];
				loadError.value = "";
				return;
			}
			loading.value = true;
			loadError.value = "";
			try {
				channels.value = await deviceApi.listChannels(filters.deviceId) || [];
			} catch (e) {
				channels.value = [];
				loadError.value = errText(e);
				ElMessage.error(`通道加载失败：${loadError.value}`);
			} finally {
				loading.value = false;
			}
		}
		function openCreate() {
			if (!filters.deviceId) {
				ElMessage.warning("请先选择设备");
				return;
			}
			editingId.value = null;
			Object.assign(form, {
				deviceChannelNo: 1,
				deviceChannelName: "",
				deviceChannelType: "main",
				deviceChannelSort: channels.value.length + 1,
				deviceChannelStatus: "enabled"
			});
			dialogVisible.value = true;
		}
		function openEdit(row) {
			editingId.value = row.deviceChannelId;
			Object.assign(form, {
				deviceChannelNo: row.deviceChannelNo,
				deviceChannelName: row.deviceChannelName,
				deviceChannelType: row.deviceChannelType,
				deviceChannelSort: row.deviceChannelSort,
				deviceChannelStatus: row.deviceChannelStatus || "enabled"
			});
			dialogVisible.value = true;
		}
		async function onSubmit() {
			if (formInvalid.value) return;
			dialogSaving.value = true;
			try {
				const payload = {
					...form,
					deviceChannelDeviceId: filters.deviceId
				};
				if (editingId.value) {
					await deviceApi.updateChannel(editingId.value, payload);
					ElMessage.success("通道已更新");
				} else {
					await deviceApi.addChannel(payload);
					ElMessage.success("通道已新增");
				}
				dialogVisible.value = false;
				await fetchChannels();
			} catch (e) {
				ElMessage.error(`保存失败：${errText(e)}`);
			} finally {
				dialogSaving.value = false;
			}
		}
		async function onToggle(row) {
			const next = row.deviceChannelStatus === "enabled" ? "disabled" : "enabled";
			try {
				await deviceApi.toggleChannelStatus(row.deviceChannelId, next);
				ElMessage.success(next === "enabled" ? "已启用" : "已禁用");
				await fetchChannels();
			} catch (e) {
				ElMessage.error(`操作失败：${errText(e)}`);
			}
		}
		async function onDelete(row) {
			const label = row.deviceChannelName || `CH${row.deviceChannelNo}`;
			try {
				await ElMessageBox.confirm(`确认删除通道「${label}」？`, "删除确认", { type: "warning" });
			} catch {
				return;
			}
			try {
				await deviceApi.deleteChannel(row.deviceChannelId);
				ElMessage.success("通道已删除");
				await fetchChannels();
			} catch (e) {
				ElMessage.error(`删除失败：${errText(e)}`);
			}
		}
		function errText(e) {
			return e?.msg || (e instanceof Error ? e.message : String(e));
		}
		onMounted(fetchDevices);
		return (_ctx, _cache) => {
			const _component_el_segmented = resolveComponent("el-segmented");
			const _component_el_icon = resolveComponent("el-icon");
			const _component_el_form = resolveComponent("el-form");
			return openBlock(), createElementBlock("div", _hoisted_1, [
				createBaseVNode("section", _hoisted_2, [(openBlock(true), createElementBlock(Fragment, null, renderList(kpis.value, (k) => {
					return openBlock(), createBlock(unref(component$1), {
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
						onChange: fetchChannels
					}, null, 8, ["modelValue", "options"])]),
					createVNode(_component_el_segmented, {
						modelValue: filters.status,
						"onUpdate:modelValue": _cache[1] || (_cache[1] = ($event) => filters.status = $event),
						options: statusSegments.value,
						class: "dcv-seg"
					}, null, 8, ["modelValue", "options"]),
					createBaseVNode("div", _hoisted_5, [createVNode(unref(ReInput_default), {
						modelValue: filters.keyword,
						"onUpdate:modelValue": _cache[2] || (_cache[2] = ($event) => filters.keyword = $event),
						placeholder: "搜索通道名称 / 通道号",
						clearable: "",
						"prefix-icon": "Search"
					}, null, 8, ["modelValue"])]),
					createBaseVNode("span", _hoisted_6, toDisplayString(filteredChannels.value.length) + " / " + toDisplayString(channels.value.length) + " 个通道", 1),
					createBaseVNode("div", _hoisted_7, [createVNode(unref(ReButton_default), {
						icon: "RefreshRight",
						layout: "square",
						tip: "重新拉取通道",
						loading: loading.value,
						disabled: !filters.deviceId,
						onClick: fetchChannels
					}, null, 8, ["loading", "disabled"]), createVNode(unref(ReButton_default), {
						icon: "Plus",
						"show-text": true,
						type: "primary",
						disabled: !filters.deviceId,
						onClick: openCreate
					}, {
						default: withCtx(() => [..._cache[10] || (_cache[10] = [createTextVNode(" 新增通道 ", -1)])]),
						_: 1
					}, 8, ["disabled"])])
				]),
				createBaseVNode("section", _hoisted_8, [
					createBaseVNode("header", _hoisted_9, [
						_cache[11] || (_cache[11] = createBaseVNode("span", { class: "dcv-panel__bar" }, null, -1)),
						_cache[12] || (_cache[12] = createBaseVNode("span", null, "通道列表", -1)),
						createBaseVNode("span", _hoisted_10, toDisplayString(filteredChannels.value.length), 1),
						createBaseVNode("span", _hoisted_11, toDisplayString(currentDeviceName.value), 1)
					]),
					loadError.value ? (openBlock(), createElementBlock("div", _hoisted_12, [createBaseVNode("span", null, toDisplayString(loadError.value), 1), createVNode(unref(ReButton_default), {
						icon: "RefreshRight",
						layout: "square",
						tip: "重试",
						loading: loading.value,
						onClick: fetchChannels
					}, null, 8, ["loading"])])) : createCommentVNode("", true),
					filteredChannels.value.length ? (openBlock(), createBlock(unref(ReTable_default), {
						key: 1,
						data: filteredChannels.value,
						columns,
						engine: "element",
						"table-id": "device-channels",
						"row-key": "deviceChannelId",
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
						"col-deviceChannelNo": withCtx(({ row }) => [createBaseVNode("span", _hoisted_13, "CH" + toDisplayString(row.deviceChannelNo), 1)]),
						"col-deviceChannelStatus": withCtx(({ row }) => [createVNode(unref(component$2), {
							type: row.deviceChannelStatus === "enabled" ? "success" : "info",
							size: "small",
							effect: "plain"
						}, {
							default: withCtx(() => [createTextVNode(toDisplayString(row.deviceChannelStatus === "enabled" ? "启用" : "禁用"), 1)]),
							_: 2
						}, 1032, ["type"])]),
						"col-actions": withCtx(({ row }) => [createBaseVNode("div", _hoisted_14, [
							createVNode(unref(ReButton_default), {
								icon: "Edit",
								layout: "square",
								tip: "编辑通道",
								onClick: ($event) => openEdit(row)
							}, null, 8, ["onClick"]),
							createVNode(unref(ReButton_default), {
								icon: row.deviceChannelStatus === "enabled" ? "VideoPause" : "VideoPlay",
								layout: "square",
								tip: row.deviceChannelStatus === "enabled" ? "禁用通道" : "启用通道",
								onClick: ($event) => onToggle(row)
							}, null, 8, [
								"icon",
								"tip",
								"onClick"
							]),
							createVNode(unref(ReButton_default), {
								icon: "Delete",
								layout: "square",
								tip: "删除通道",
								type: "danger",
								onClick: ($event) => onDelete(row)
							}, null, 8, ["onClick"])
						])]),
						_: 1
					}, 8, ["data"])) : (openBlock(), createElementBlock("article", _hoisted_15, [
						createBaseVNode("span", _hoisted_16, [createVNode(_component_el_icon, null, {
							default: withCtx(() => [createVNode(unref(connection_default))]),
							_: 1
						})]),
						createBaseVNode("p", _hoisted_17, toDisplayString(filters.deviceId ? "该设备暂无通道" : "先选择一台设备"), 1),
						createBaseVNode("p", _hoisted_18, toDisplayString(filters.deviceId ? "通道由设备接入时同步，也可以在这里手动登记；登记后可单独启停、排序。" : "通道挂在设备下：选中设备后查看它的通道，再按需新增或启停。"), 1)
					]))
				]),
				createVNode(unref(component), {
					modelValue: dialogVisible.value,
					"onUpdate:modelValue": _cache[9] || (_cache[9] = ($event) => dialogVisible.value = $event),
					title: editingId.value ? "编辑通道" : "新增通道",
					width: "560px",
					"close-on-click-modal": false
				}, {
					footer: withCtx(() => [createVNode(unref(ReButton_default), { onClick: _cache[8] || (_cache[8] = ($event) => dialogVisible.value = false) }, {
						default: withCtx(() => [..._cache[13] || (_cache[13] = [createTextVNode("取消", -1)])]),
						_: 1
					}), createVNode(unref(ReButton_default), {
						type: "primary",
						loading: dialogSaving.value,
						disabled: formInvalid.value,
						onClick: onSubmit
					}, {
						default: withCtx(() => [..._cache[14] || (_cache[14] = [createTextVNode("保存", -1)])]),
						_: 1
					}, 8, ["loading", "disabled"])]),
					default: withCtx(() => [createVNode(_component_el_form, {
						"label-position": "top",
						class: "dcv-form"
					}, {
						default: withCtx(() => [
							createVNode(unref(ReFormItem), { label: "所属设备" }, {
								default: withCtx(() => [createBaseVNode("span", _hoisted_19, toDisplayString(currentDeviceName.value), 1)]),
								_: 1
							}),
							createVNode(unref(ReFormItem), {
								label: "通道号",
								required: ""
							}, {
								default: withCtx(() => [createVNode(unref(ReInputNumber_default), {
									modelValue: form.deviceChannelNo,
									"onUpdate:modelValue": _cache[3] || (_cache[3] = ($event) => form.deviceChannelNo = $event),
									min: 1,
									max: 512,
									style: { "width": "100%" }
								}, null, 8, ["modelValue"]), noInvalid.value ? (openBlock(), createElementBlock("span", _hoisted_20, "该通道号已被占用，请换一个")) : (openBlock(), createElementBlock("span", _hoisted_21, "设备侧的通道编号，同一设备内不可重复"))]),
								_: 1
							}),
							createVNode(unref(ReFormItem), {
								label: "通道名称",
								required: ""
							}, {
								default: withCtx(() => [createVNode(unref(ReInput_default), {
									modelValue: form.deviceChannelName,
									"onUpdate:modelValue": _cache[4] || (_cache[4] = ($event) => form.deviceChannelName = $event),
									placeholder: "如「东门枪机」"
								}, null, 8, ["modelValue"])]),
								_: 1
							}),
							createVNode(unref(ReFormItem), { label: "类型" }, {
								default: withCtx(() => [createVNode(unref(ReInput_default), {
									modelValue: form.deviceChannelType,
									"onUpdate:modelValue": _cache[5] || (_cache[5] = ($event) => form.deviceChannelType = $event),
									placeholder: "如：main / sub"
								}, null, 8, ["modelValue"])]),
								_: 1
							}),
							createVNode(unref(ReFormItem), { label: "排序" }, {
								default: withCtx(() => [createVNode(unref(ReInputNumber_default), {
									modelValue: form.deviceChannelSort,
									"onUpdate:modelValue": _cache[6] || (_cache[6] = ($event) => form.deviceChannelSort = $event),
									min: 0,
									max: 9999,
									style: { "width": "100%" }
								}, null, 8, ["modelValue"])]),
								_: 1
							}),
							createVNode(unref(ReFormItem), { label: "状态" }, {
								default: withCtx(() => [createVNode(_component_el_segmented, {
									modelValue: form.deviceChannelStatus,
									"onUpdate:modelValue": _cache[7] || (_cache[7] = ($event) => form.deviceChannelStatus = $event),
									options: STATUS_SEGMENTS
								}, null, 8, ["modelValue"])]),
								_: 1
							})
						]),
						_: 1
					})]),
					_: 1
				}, 8, ["modelValue", "title"])
			]);
		};
	}
}), [["__scopeId", "data-v-66a838d0"]]);
//#endregion
export { DeviceChannelView_default as default };
