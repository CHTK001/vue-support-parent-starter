import { $n as normalizeClass, D as createVNode, E as createTextVNode, On as unref, St as resolveComponent, _ as createBaseVNode, b as createElementBlock, bt as renderList, ct as onMounted, ft as onUnmounted, g as computed, k as defineComponent, mt as openBlock, o as Fragment, qt as withCtx, rr as toDisplayString, v as createBlock, vn as ref, y as createCommentVNode } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { yt as message } from "./src-CEonioA3.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { C as handleAlarmEvent, n as alarmLevel, p as fetchAlarmEvents, w as isUnhandled } from "./monitorApi-CwY9j0MY.js";
import { t as useDialogPrerender } from "./dialogPrerender-D19FeHAd.js";
//#region src/views/AlarmsView.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1 = { class: "al tel-page" };
var _hoisted_2 = { class: "page-header" };
var _hoisted_3 = { class: "page-desc" };
var _hoisted_4 = { class: "live-clock" };
var _hoisted_5 = { class: "page-actions" };
var _hoisted_6 = {
	key: 0,
	class: "as-error"
};
var _hoisted_7 = { class: "kpi-row cols-5" };
var _hoisted_8 = { class: "kpi-head" };
var _hoisted_9 = { class: "kpi-label" };
var _hoisted_10 = { class: "kpi-value" };
var _hoisted_11 = { class: "kpi-sub" };
var _hoisted_12 = { class: "filter-panel" };
var _hoisted_13 = { class: "f-count" };
var _hoisted_14 = { class: "mono" };
var _hoisted_15 = { class: "mono" };
var _hoisted_16 = {
	key: 1,
	class: "dim"
};
var _hoisted_17 = {
	key: 0,
	class: "dlg-meta"
};
var _hoisted_18 = { class: "dim" };
//#endregion
//#region src/views/AlarmsView.vue
var AlarmsView_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	__name: "AlarmsView",
	setup(__props) {
		/**
		* 告警中心 —— 对齐 prototype §PAGE-ALARM（ReSectionHead + ReCard + ReTag + ReButton(square)）
		* @author CH
		* @since 4.0.0
		*/
		const loading = ref(false);
		const loadError = ref("");
		const events = ref([]);
		const LEVELS = [
			"P0",
			"P1",
			"P2",
			"P3",
			"P4"
		];
		/** 实时时钟 */
		const liveTime = ref("");
		let timer = null;
		function updateTime() {
			liveTime.value = (/* @__PURE__ */ new Date()).toTimeString().slice(0, 8);
		}
		onMounted(() => {
			updateTime();
			timer = setInterval(updateTime, 1e3);
		});
		onUnmounted(() => {
			if (timer) clearInterval(timer);
		});
		const LEVEL_LABELS = {
			P0: "严重",
			P1: "高",
			P2: "中",
			P3: "低",
			P4: "信息"
		};
		const filterLevel = ref("");
		const filterStatus = ref("");
		const keyword = ref("");
		const levelCounts = computed(() => {
			const m = {
				P0: 0,
				P1: 0,
				P2: 0,
				P3: 0,
				P4: 0
			};
			for (const e of events.value) m[alarmLevel(e)]++;
			return m;
		});
		const totalAlarms = computed(() => events.value.length);
		const unhandledCount = computed(() => events.value.filter(isUnhandled).length);
		const TONES = {
			P0: "red",
			P1: "red",
			P2: "amber",
			P3: "green",
			P4: "gray"
		};
		const SEV_HINTS = {
			P0: "立即响应",
			P1: "30 分钟",
			P2: "当班处理",
			P3: "计划内",
			P4: "通知"
		};
		/**
		* KPI 色条 tone 映射
		* @param lv 告警级别
		*/
		function kpiTone(lv) {
			return TONES[lv] ?? "gray";
		}
		/**
		* 级别标签映射
		* @param lv 告警级别
		*/
		function sevLabel(lv) {
			return SEV_HINTS[lv] ?? "";
		}
		/**
		* 级别处理建议提示
		* @param lv 告警级别
		*/
		function sevHint(lv) {
			return SEV_HINTS[lv] ?? "";
		}
		const filtered = computed(() => {
			let list = events.value;
			if (filterLevel.value) list = list.filter((e) => alarmLevel(e) === filterLevel.value);
			if (filterStatus.value) if (filterStatus.value === "NEW") list = list.filter(isUnhandled);
			else list = list.filter((e) => String(e.msMonitorAlarmEventStatus || "").toUpperCase() === filterStatus.value);
			if (keyword.value) {
				const k = keyword.value.toLowerCase();
				list = list.filter((e) => (e.msMonitorAlarmEventMonitorName || "").toLowerCase().includes(k) || (e.msMonitorAlarmEventMetricName || "").toLowerCase().includes(k));
			}
			return [...list].sort((a, b) => (b.msMonitorAlarmEventTriggerTime ?? "").localeCompare(a.msMonitorAlarmEventTriggerTime ?? ""));
		});
		/**
		* 告警状态中文标签
		* @param e 告警事件
		*/
		function statusLabel(e) {
			const s = String(e.msMonitorAlarmEventStatus || "").toUpperCase();
			if (s === "NEW") return "未处理";
			if (s === "FALSE" || s === "FALSE_ALARM") return "误报";
			if (s === "PROCESSED") return "已处理";
			return s || "—";
		}
		/** ReTable 列定义 */
		const alarmColumns = computed(() => [
			{
				prop: "timeText",
				label: "时间",
				width: 150,
				slot: "time"
			},
			{
				prop: "msMonitorAlarmEventLevel",
				label: "级别",
				width: 74,
				slot: "level"
			},
			{
				prop: "msMonitorAlarmEventMonitorName",
				label: "主机",
				minWidth: 130,
				showOverflowTooltip: true
			},
			{
				prop: "msMonitorAlarmEventMetricName",
				label: "指标",
				minWidth: 130,
				showOverflowTooltip: true
			},
			{
				prop: "valueText",
				label: "当前值 / 阈值",
				width: 118,
				slot: "value"
			},
			{
				prop: "msMonitorAlarmEventStatus",
				label: "状态",
				width: 84,
				slot: "status"
			},
			{
				prop: "id",
				label: "操作",
				width: 62,
				fixed: "right",
				align: "right",
				slot: "op"
			}
		]);
		/** 行级格式化辅助（供 slot 使用） */
		function timeText(e) {
			return (e.msMonitorAlarmEventTriggerTime || "").slice(0, 16);
		}
		/**
		* 当前值/阈值展示文本
		* @param e 告警事件
		*/
		function valueText(e) {
			return `${e.msMonitorAlarmEventAlarmValue} / ${e.msMonitorAlarmEventThreshold}`;
		}
		/**
		* 告警行样式类：级别色条 + P0/P1 高亮背景
		*/
		function rowClass(e) {
			const lv = alarmLevel(e);
			return {
				[`level-bar-${lv.toLowerCase()}`]: true,
				"row-critical": lv === "P0" || lv === "P1"
			};
		}
		async function fetchAll() {
			loading.value = true;
			loadError.value = "";
			try {
				events.value = await fetchAlarmEvents() ?? [];
			} catch (e) {
				loadError.value = String(e?.message ?? e);
			} finally {
				loading.value = false;
			}
		}
		const handleVisible = ref(false);
		useDialogPrerender(handleVisible);
		const handleTarget = ref(null);
		const handleRemark = ref("");
		const handleFalseAlarm = ref(false);
		const handleSubmitting = ref(false);
		/**
		* 打开告警处理弹窗
		* @param e 告警事件
		*/
		function openHandle(e) {
			handleTarget.value = e;
			handleRemark.value = "";
			handleFalseAlarm.value = false;
			handleVisible.value = true;
		}
		async function submitHandle() {
			if (!handleTarget.value) return;
			handleSubmitting.value = true;
			try {
				await handleAlarmEvent(handleTarget.value.id, handleRemark.value || (handleFalseAlarm.value ? "误报" : "已处理"), handleFalseAlarm.value);
				message.success("处理完成");
				handleVisible.value = false;
				await fetchAll();
			} catch (e) {
				message.error(String(e?.message ?? e));
			} finally {
				handleSubmitting.value = false;
			}
		}
		onMounted(fetchAll);
		return (_ctx, _cache) => {
			const _component_ReButton = resolveComponent("ReButton");
			const _component_ReInput = resolveComponent("ReInput");
			const _component_ReSelect = resolveComponent("ReSelect");
			const _component_ReTable = resolveComponent("ReTable");
			const _component_ReCard = resolveComponent("ReCard");
			const _component_ReTag = resolveComponent("ReTag");
			const _component_ReSwitch = resolveComponent("ReSwitch");
			const _component_ReDialog = resolveComponent("ReDialog");
			return openBlock(), createElementBlock("div", _hoisted_1, [
				createBaseVNode("div", _hoisted_2, [createBaseVNode("div", null, [_cache[10] || (_cache[10] = createBaseVNode("h1", { class: "page-title" }, "告警中心", -1)), createBaseVNode("p", _hoisted_3, [
					_cache[8] || (_cache[8] = createTextVNode(" 事件流 · 按级别响应 · 24h 触发 ", -1)),
					createBaseVNode("b", null, toDisplayString(totalAlarms.value), 1),
					_cache[9] || (_cache[9] = createTextVNode(" 次 · 未处理 ", -1)),
					createBaseVNode("b", null, toDisplayString(unhandledCount.value), 1),
					createBaseVNode("span", _hoisted_4, [_cache[7] || (_cache[7] = createBaseVNode("span", { class: "pulse-dot" }, null, -1)), createTextVNode(toDisplayString(liveTime.value), 1)])
				])]), createBaseVNode("div", _hoisted_5, [createVNode(_component_ReButton, {
					icon: "RefreshRight",
					"show-text": true,
					loading: loading.value,
					onClick: fetchAll
				}, {
					default: withCtx(() => [..._cache[11] || (_cache[11] = [createTextVNode("刷新", -1)])]),
					_: 1
				}, 8, ["loading"])])]),
				loadError.value ? (openBlock(), createElementBlock("div", _hoisted_6, [createBaseVNode("span", null, "数据加载失败：" + toDisplayString(loadError.value), 1), createVNode(_component_ReButton, {
					icon: "RefreshRight",
					type: "primary",
					"show-text": true,
					onClick: fetchAll
				}, {
					default: withCtx(() => [..._cache[12] || (_cache[12] = [createTextVNode("重试", -1)])]),
					_: 1
				})])) : createCommentVNode("", true),
				createBaseVNode("section", _hoisted_7, [(openBlock(), createElementBlock(Fragment, null, renderList(LEVELS, (lv) => {
					return createBaseVNode("div", {
						class: normalizeClass(["kpi", `c-${kpiTone(lv)}`]),
						key: lv
					}, [
						createBaseVNode("div", _hoisted_8, [
							createVNode(_component_ReButton, {
								icon: "Warning",
								layout: "square",
								decorative: ""
							}),
							createBaseVNode("span", _hoisted_9, toDisplayString(lv) + " " + toDisplayString(LEVEL_LABELS[lv]), 1),
							createBaseVNode("span", { class: normalizeClass(["tag", `sev-${lv}`]) }, toDisplayString(sevLabel(lv)), 3)
						]),
						createBaseVNode("div", _hoisted_10, toDisplayString(levelCounts.value[lv]), 1),
						createBaseVNode("div", _hoisted_11, toDisplayString(sevHint(lv)), 1)
					], 2);
				}), 64))]),
				createBaseVNode("div", _hoisted_12, [
					createVNode(_component_ReInput, {
						modelValue: keyword.value,
						"onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => keyword.value = $event),
						placeholder: "搜索主机 / 指标",
						clearable: "",
						class: "f-kw"
					}, null, 8, ["modelValue"]),
					createVNode(_component_ReSelect, {
						modelValue: filterLevel.value,
						"onUpdate:modelValue": _cache[1] || (_cache[1] = ($event) => filterLevel.value = $event),
						placeholder: "级别",
						clearable: "",
						class: "f-sel",
						options: LEVELS.map((lv) => ({
							label: lv + " " + LEVEL_LABELS[lv],
							value: lv
						}))
					}, null, 8, ["modelValue", "options"]),
					createVNode(_component_ReSelect, {
						modelValue: filterStatus.value,
						"onUpdate:modelValue": _cache[2] || (_cache[2] = ($event) => filterStatus.value = $event),
						placeholder: "状态",
						clearable: "",
						class: "f-sel",
						options: [
							{
								label: "未处理",
								value: "NEW"
							},
							{
								label: "已处理",
								value: "PROCESSED"
							},
							{
								label: "误报",
								value: "FALSE_ALARM"
							}
						]
					}, null, 8, ["modelValue"]),
					createBaseVNode("span", _hoisted_13, toDisplayString(filtered.value.length) + " 条", 1)
				]),
				createVNode(_component_ReCard, {
					radius: 12,
					shadow: "never"
				}, {
					default: withCtx(() => [createVNode(_component_ReTable, {
						data: filtered.value,
						pagination: false,
						columns: alarmColumns.value,
						loading: loading.value,
						border: false,
						"layout-switch": true,
						"empty-text": "暂无告警事件",
						"table-id": "monitor-alarms",
						"row-class": rowClass
					}, {
						"col-time": withCtx(({ row }) => [createBaseVNode("span", _hoisted_14, toDisplayString(timeText(row)), 1)]),
						"col-level": withCtx(({ row }) => [createBaseVNode("div", { class: normalizeClass(`level-indicator level-${unref(alarmLevel)(row).toLowerCase()}`) }, toDisplayString(unref(alarmLevel)(row)), 3)]),
						"col-value": withCtx(({ row }) => [createBaseVNode("span", _hoisted_15, toDisplayString(valueText(row)), 1)]),
						"col-status": withCtx(({ row }) => [createBaseVNode("span", { class: normalizeClass(["status-tag", { "is-unhandled": statusLabel(row) === "未处理" }]) }, toDisplayString(statusLabel(row)), 3)]),
						"col-op": withCtx(({ row }) => [unref(isUnhandled)(row) ? (openBlock(), createBlock(_component_ReButton, {
							key: 0,
							icon: "Check",
							layout: "square",
							type: "primary",
							onClick: ($event) => openHandle(row),
							title: "处理"
						}, null, 8, ["onClick"])) : (openBlock(), createElementBlock("span", _hoisted_16, "—"))]),
						_: 1
					}, 8, [
						"data",
						"columns",
						"loading"
					])]),
					_: 1
				}),
				createVNode(_component_ReDialog, {
					modelValue: handleVisible.value,
					"onUpdate:modelValue": _cache[6] || (_cache[6] = ($event) => handleVisible.value = $event),
					title: "处理告警事件",
					width: "440px"
				}, {
					footer: withCtx(() => [createVNode(_component_ReButton, { onClick: _cache[5] || (_cache[5] = ($event) => handleVisible.value = false) }, {
						default: withCtx(() => [..._cache[13] || (_cache[13] = [createTextVNode("取消", -1)])]),
						_: 1
					}), createVNode(_component_ReButton, {
						type: "primary",
						loading: handleSubmitting.value,
						onClick: submitHandle,
						icon: "Check",
						"show-text": true
					}, {
						default: withCtx(() => [..._cache[14] || (_cache[14] = [createTextVNode("确认处理", -1)])]),
						_: 1
					}, 8, ["loading"])]),
					default: withCtx(() => [
						handleTarget.value ? (openBlock(), createElementBlock("div", _hoisted_17, [
							createVNode(_component_ReTag, {
								type: unref(alarmLevel)(handleTarget.value) === "P0" || unref(alarmLevel)(handleTarget.value) === "P1" ? "danger" : "warning",
								effect: "dark"
							}, {
								default: withCtx(() => [createTextVNode(toDisplayString(unref(alarmLevel)(handleTarget.value)), 1)]),
								_: 1
							}, 8, ["type"]),
							createBaseVNode("b", null, toDisplayString(handleTarget.value.msMonitorAlarmEventMonitorName), 1),
							createBaseVNode("span", _hoisted_18, toDisplayString(handleTarget.value.msMonitorAlarmEventMetricName) + " = " + toDisplayString(handleTarget.value.msMonitorAlarmEventAlarmValue) + "（阈值 " + toDisplayString(handleTarget.value.msMonitorAlarmEventThreshold) + "）", 1)
						])) : createCommentVNode("", true),
						createVNode(_component_ReInput, {
							modelValue: handleRemark.value,
							"onUpdate:modelValue": _cache[3] || (_cache[3] = ($event) => handleRemark.value = $event),
							type: "textarea",
							rows: 3,
							placeholder: "处理备注（可留空）"
						}, null, 8, ["modelValue"]),
						createVNode(_component_ReSwitch, {
							modelValue: handleFalseAlarm.value,
							"onUpdate:modelValue": _cache[4] || (_cache[4] = ($event) => handleFalseAlarm.value = $event),
							"active-text": "误报",
							style: { "margin-top": "10px" }
						}, null, 8, ["modelValue"])
					]),
					_: 1
				}, 8, ["modelValue"])
			]);
		};
	}
}), [["__scopeId", "data-v-9e6bf0af"]]);
//#endregion
export { AlarmsView_default as default };
