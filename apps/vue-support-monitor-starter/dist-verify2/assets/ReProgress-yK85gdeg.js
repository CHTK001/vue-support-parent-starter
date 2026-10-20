import { $n as normalizeClass, D as createVNode, E as createTextVNode, Ht as watch, On as unref, St as resolveComponent, _ as createBaseVNode, b as createElementBlock, bt as renderList, ct as onMounted, et as mergeProps, ft as onUnmounted, g as computed, gn as reactive, k as defineComponent, mt as openBlock, o as Fragment, qt as withCtx, rr as toDisplayString, v as createBlock, vn as ref, y as createCommentVNode } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { w as withModifiers } from "./runtime-dom.esm-bundler-RRl39S3n.js";
import { u as getStorageKey } from "./src-DzQcKxHP.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
/* empty css                     */
import { t as ReSelect_default } from "./ReSelect-BrUGYrlz.js";
import { n as ReProgress_default, t as ReProgressTask_default } from "./ReProgressTask-BaF_rmdP.js";
//#region ../../packages/ui/src/components/ReProgress/ReProgressTimeline.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1$3 = { class: "re-progress-timeline__icon" };
var _hoisted_2$2 = { key: 0 };
var _hoisted_3$2 = { key: 1 };
var _hoisted_4$2 = { key: 2 };
var _hoisted_5$2 = { key: 3 };
var _hoisted_6$2 = { class: "re-progress-timeline__main" };
var _hoisted_7$2 = { class: "re-progress-timeline__title-row" };
var _hoisted_8$2 = { class: "re-progress-timeline__title" };
var _hoisted_9$2 = { class: "re-progress-timeline__time" };
var _hoisted_10$2 = { class: "re-progress-timeline__meta" };
var _hoisted_11$1 = { class: "re-progress-timeline__popover" };
var _hoisted_12$1 = { class: "re-progress-timeline__popover-head" };
var _hoisted_13$1 = { class: "re-progress-timeline__popover-title" };
var _hoisted_14$1 = { class: "re-progress-timeline__popover-count" };
var _hoisted_15$1 = { class: "re-progress-timeline__popover-list" };
var _hoisted_16$1 = { class: "re-progress-timeline__snap-body" };
var _hoisted_17$1 = { class: "re-progress-timeline__snap-row" };
var _hoisted_18$1 = { class: "re-progress-timeline__snap-time" };
var _hoisted_19 = { class: "re-progress-timeline__snap-status" };
var _hoisted_20 = {
	key: 0,
	class: "re-progress-timeline__snap-text"
};
//#endregion
//#region ../../packages/ui/src/components/ReProgress/ReProgressTimeline.vue
var ReProgressTimeline_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	name: "ReProgressTimeline",
	inheritAttrs: true,
	__name: "ReProgressTimeline",
	props: { task: {} },
	emits: ["remove", "retry"],
	setup(__props, { emit: __emit }) {
		/**
		* ReProgressTimeline —— 历史任务行（带 popover 时间轴）
		*
		* - 鼠标悬停整行 → popover 显示详细信息时间轴
		* - 点击整行 → 同样切换 popover
		*/
		const props = __props;
		const emit = __emit;
		const popoverVisible = ref(false);
		function onHoverShow() {
			popoverVisible.value = true;
		}
		function onHoverHide() {
			popoverVisible.value = false;
		}
		function onClickRow(e) {
			if (e.target.closest(".re-progress-timeline__btn")) return;
			popoverVisible.value = !popoverVisible.value;
		}
		function onRemove() {
			emit("remove", props.task.id);
		}
		function onRetry() {
			emit("retry", props.task.id);
		}
		function formatTime(ts) {
			const d = new Date(ts);
			const pad = (n) => String(n).padStart(2, "0");
			return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
		}
		function snapLabel(snap) {
			return `${new Date(snap.time).toLocaleTimeString()} · ${Math.round(snap.progress * 100)}%`;
		}
		const statusText = (s) => {
			switch (s) {
				case "pending": return "等待";
				case "running": return "进行";
				case "success": return "完成";
				case "failed": return "失败";
				case "cancelled": return "取消";
				default: return s;
			}
		};
		return (_ctx, _cache) => {
			const _component_el_popover = resolveComponent("el-popover");
			return openBlock(), createElementBlock("div", mergeProps({ class: ["re-progress-timeline", `re-progress-timeline--status-${__props.task.status}`] }, _ctx.$attrs, {
				onMouseenter: onHoverShow,
				onMouseleave: onHoverHide
			}), [createBaseVNode("div", {
				class: "re-progress-timeline__head",
				onClick: onClickRow
			}, [
				createBaseVNode("span", _hoisted_1$3, [__props.task.status === "success" ? (openBlock(), createElementBlock("span", _hoisted_2$2, "✓")) : __props.task.status === "failed" ? (openBlock(), createElementBlock("span", _hoisted_3$2, "✕")) : __props.task.status === "cancelled" ? (openBlock(), createElementBlock("span", _hoisted_4$2, "–")) : (openBlock(), createElementBlock("span", _hoisted_5$2, "•"))]),
				createBaseVNode("div", _hoisted_6$2, [
					createBaseVNode("div", _hoisted_7$2, [createBaseVNode("span", _hoisted_8$2, toDisplayString(__props.task.title), 1), createBaseVNode("span", _hoisted_9$2, toDisplayString(formatTime(__props.task.finishedAt ?? __props.task.createdAt)), 1)]),
					createVNode(ReProgress_default, {
						progress: __props.task.progress,
						color: __props.task.status === "success" ? "success" : __props.task.status === "failed" ? "danger" : "info",
						status: __props.task.status,
						stripe: false,
						height: 4
					}, null, 8, [
						"progress",
						"color",
						"status"
					]),
					createBaseVNode("div", _hoisted_10$2, [createBaseVNode("span", null, toDisplayString(__props.task.text || __props.task.error || "—"), 1)])
				]),
				createBaseVNode("div", {
					class: "re-progress-timeline__actions",
					onClick: _cache[0] || (_cache[0] = withModifiers(() => {}, ["stop"]))
				}, [__props.task.status === "failed" ? (openBlock(), createElementBlock("button", {
					key: 0,
					class: "re-progress-timeline__btn",
					type: "button",
					title: "重试",
					onClick: onRetry
				}, [..._cache[2] || (_cache[2] = [createBaseVNode("svg", {
					viewBox: "0 0 24 24",
					fill: "none",
					stroke: "currentColor",
					"stroke-width": "2",
					"stroke-linecap": "round",
					"stroke-linejoin": "round"
				}, [createBaseVNode("path", { d: "M3 12a9 9 0 1 0 3-6.7L3 8" }), createBaseVNode("path", { d: "M3 3v5h5" })], -1)])])) : createCommentVNode("", true), createBaseVNode("button", {
					class: "re-progress-timeline__btn",
					type: "button",
					title: "关闭",
					onClick: onRemove
				}, [..._cache[3] || (_cache[3] = [createBaseVNode("svg", {
					viewBox: "0 0 24 24",
					fill: "none",
					stroke: "currentColor",
					"stroke-width": "2",
					"stroke-linecap": "round",
					"stroke-linejoin": "round"
				}, [createBaseVNode("path", { d: "M18 6L6 18M6 6l12 12" })], -1)])])])
			]), __props.task.history.length > 1 ? (openBlock(), createBlock(_component_el_popover, {
				key: 0,
				visible: popoverVisible.value,
				placement: "left-end",
				width: 320,
				trigger: "manual",
				"show-arrow": true,
				"onUpdate:visible": _cache[1] || (_cache[1] = (v) => popoverVisible.value = v)
			}, {
				reference: withCtx(() => [..._cache[4] || (_cache[4] = [createBaseVNode("span", { class: "re-progress-timeline__hover-area" }, null, -1)])]),
				default: withCtx(() => [createBaseVNode("div", _hoisted_11$1, [createBaseVNode("div", _hoisted_12$1, [createBaseVNode("span", _hoisted_13$1, toDisplayString(__props.task.title), 1), createBaseVNode("span", _hoisted_14$1, toDisplayString(__props.task.history.length) + " 条", 1)]), createBaseVNode("div", _hoisted_15$1, [(openBlock(true), createElementBlock(Fragment, null, renderList(__props.task.history.slice().reverse(), (snap, idx) => {
					return openBlock(), createElementBlock("div", {
						key: idx,
						class: "re-progress-timeline__snap"
					}, [createBaseVNode("div", { class: normalizeClass(["re-progress-timeline__snap-dot", `re-progress-timeline__snap-dot--${snap.status}`]) }, null, 2), createBaseVNode("div", _hoisted_16$1, [createBaseVNode("div", _hoisted_17$1, [createBaseVNode("span", _hoisted_18$1, toDisplayString(snapLabel(snap)), 1), createBaseVNode("span", _hoisted_19, toDisplayString(statusText(snap.status)), 1)]), snap.text ? (openBlock(), createElementBlock("div", _hoisted_20, toDisplayString(snap.text), 1)) : createCommentVNode("", true)])]);
				}), 128))])])]),
				_: 1
			}, 8, ["visible"])) : createCommentVNode("", true)], 16);
		};
	}
}), [["__scopeId", "data-v-25cf2fff"]]);
//#endregion
//#region ../../packages/ui/src/components/ReProgress/composables/useTasks.ts
/**
* ReProgress 任务管理器
*
* 响应式单例：所有组件共享同一份任务列表与设置。
* - 持久化：localStorage 保留历史任务（仅 completed / failed / cancelled 上限 50 条）
* - 实时任务只在内存中
* - 自动过期：超过 lifetime 自动清理（lifetime=0 表示永久）
*/
var STORAGE_KEY = getStorageKey("re-progress-history");
var STORAGE_SETTINGS_KEY = getStorageKey("re-progress-settings");
var HISTORY_LIMIT = 50;
var DEFAULT_SETTINGS = {
	displayMode: "compact",
	defaultColor: "primary",
	showSuccessMessage: true,
	showFailedMessage: true,
	lifetime: 864e5,
	showHistoryPopover: true,
	multiTask: true,
	showPanelTitle: true,
	panelPosition: "bottom-right"
};
var _uid = 0;
var genId = () => `task-${Date.now().toString(36)}-${(_uid++).toString(36)}`;
var loadHistory = () => {
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return [];
		const list = JSON.parse(raw);
		return Array.isArray(list) ? list : [];
	} catch {
		return [];
	}
};
var loadSettings = () => {
	try {
		const raw = localStorage.getItem(STORAGE_SETTINGS_KEY);
		if (!raw) return { ...DEFAULT_SETTINGS };
		return {
			...DEFAULT_SETTINGS,
			...JSON.parse(raw)
		};
	} catch {
		return { ...DEFAULT_SETTINGS };
	}
};
var saveHistory = (tasks) => {
	try {
		const finished = tasks.filter((t) => t.status === "success" || t.status === "failed" || t.status === "cancelled").slice(0, HISTORY_LIMIT);
		localStorage.setItem(STORAGE_KEY, JSON.stringify(finished));
	} catch {}
};
var saveSettings = (settings) => {
	try {
		localStorage.setItem(STORAGE_SETTINGS_KEY, JSON.stringify(settings));
	} catch {}
};
var snapshot = (task, text) => ({
	time: Date.now(),
	progress: task.progress,
	text: text ?? task.text,
	status: task.status
});
function pushHistory(task, text) {
	task.history.push(snapshot(task, text));
	if (task.history.length > 200) task.history.shift();
}
/** 内部 reactive 单例 */
var state = reactive({
	tasks: [],
	settings: loadSettings()
});
/** 标记首次 hydrate 完成（避免初始 store 覆盖 localStorage 中的历史） */
var hydrated = false;
state.tasks = loadHistory();
watch(() => state.tasks, (tasks) => {
	if (hydrated) saveHistory(tasks);
}, { deep: true });
watch(() => state.settings, (s) => saveSettings(s), { deep: true });
/** 暴露全局注入 mark */
setTimeout(() => {
	hydrated = true;
}, 0);
/** 触发一次性完成回调（toast） */
function notify(task, type) {
	if (typeof window === "undefined") return;
	const evt = new CustomEvent("re-progress:notify", { detail: {
		task,
		type
	} });
	window.dispatchEvent(evt);
}
var api = {
	get tasks() {
		return state.tasks;
	},
	get settings() {
		return state.settings;
	},
	create(input) {
		const id = input.id ?? genId();
		if (!state.settings.multiTask) state.tasks = state.tasks.filter((t) => t.status === "running" || t.status === "pending");
		const task = {
			id,
			title: input.title,
			description: input.description,
			category: input.category ?? "other",
			color: input.color ?? state.settings.defaultColor,
			status: input.initialStatus ?? "pending",
			progress: input.initialProgress ?? 0,
			text: input.text,
			history: [],
			createdAt: Date.now(),
			closable: input.closable ?? true,
			icon: input.icon,
			hasHistory: input.hasHistory ?? true
		};
		state.tasks = [task, ...state.tasks];
		pushHistory(task);
		return task;
	},
	start(id, text) {
		const t = state.tasks.find((x) => x.id === id);
		if (!t) return;
		t.status = "running";
		t.startedAt = Date.now();
		if (text) t.text = text;
		pushHistory(t, text);
	},
	update(id, progress, text) {
		const t = state.tasks.find((x) => x.id === id);
		if (!t) return;
		t.status = "running";
		t.progress = Math.max(0, Math.min(1, progress));
		if (text) t.text = text;
		pushHistory(t, text);
	},
	complete(id, text) {
		const t = state.tasks.find((x) => x.id === id);
		if (!t) return;
		t.status = "success";
		t.progress = 1;
		t.text = text ?? "已完成";
		t.finishedAt = Date.now();
		pushHistory(t, t.text);
		notify(t, "success");
	},
	fail(id, error, text) {
		const t = state.tasks.find((x) => x.id === id);
		if (!t) return;
		t.status = "failed";
		t.error = error;
		t.text = text ?? "失败";
		t.finishedAt = Date.now();
		pushHistory(t, t.text);
		notify(t, "failed");
	},
	cancel(id, text) {
		const t = state.tasks.find((x) => x.id === id);
		if (!t) return;
		t.status = "cancelled";
		t.text = text ?? "已取消";
		t.finishedAt = Date.now();
		pushHistory(t, t.text);
	},
	setProgress(id, progress, text) {
		const t = state.tasks.find((x) => x.id === id);
		if (!t) return;
		t.progress = Math.max(0, Math.min(1, progress));
		if (text) t.text = text;
		pushHistory(t, text);
	},
	reset(id) {
		const t = state.tasks.find((x) => x.id === id);
		if (!t) return;
		t.status = "pending";
		t.progress = 0;
		t.text = void 0;
		t.error = void 0;
		t.startedAt = void 0;
		t.finishedAt = void 0;
		t.history = [];
		pushHistory(t);
	},
	remove(id) {
		state.tasks = state.tasks.filter((x) => x.id !== id);
	},
	clearHistory() {
		state.tasks = state.tasks.filter((t) => t.status === "running" || t.status === "pending");
	},
	updateSettings(patch) {
		state.settings = {
			...state.settings,
			...patch
		};
	}
};
/** 定时清理过期任务 */
setInterval(() => {
	if (state.settings.lifetime <= 0) return;
	const now = Date.now();
	state.tasks = state.tasks.filter((t) => {
		if (t.status === "running" || t.status === "pending") return true;
		if (!t.finishedAt) return true;
		return now - t.finishedAt < state.settings.lifetime;
	});
}, 3e4);
/** 计算派生：运行中的任务 */
var runningTasks = computed(() => state.tasks.filter((t) => t.status === "running" || t.status === "pending"));
var historyTasks = computed(() => state.tasks.filter((t) => t.status !== "running" && t.status !== "pending"));
function useProgress() {
	return {
		api,
		state,
		runningTasks,
		historyTasks
	};
}
/** 公共 ready 标志（首屏 hydrate 完成） */
var ready = ref(false);
setTimeout(() => ready.value = true, 0);
//#endregion
//#region ../../packages/ui/src/components/ReProgress/settings/ReProgressSettings.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1$2 = { class: "re-progress-settings" };
var _hoisted_2$1 = { class: "re-progress-settings__grid" };
var _hoisted_3$1 = { class: "re-progress-settings__row" };
var _hoisted_4$1 = { class: "re-progress-settings__row" };
var _hoisted_5$1 = { class: "re-progress-settings__row" };
var _hoisted_6$1 = { class: "re-progress-settings__row" };
var _hoisted_7$1 = { class: "re-progress-settings__row" };
var _hoisted_8$1 = { class: "re-progress-settings__switch" };
var _hoisted_9$1 = ["checked"];
var _hoisted_10$1 = { class: "re-progress-settings__row" };
var _hoisted_11 = { class: "re-progress-settings__switch" };
var _hoisted_12 = ["checked"];
var _hoisted_13 = { class: "re-progress-settings__row" };
var _hoisted_14 = { class: "re-progress-settings__switch" };
var _hoisted_15 = ["checked"];
var _hoisted_16 = { class: "re-progress-settings__row" };
var _hoisted_17 = { class: "re-progress-settings__switch" };
var _hoisted_18 = ["checked"];
//#endregion
//#region ../../packages/ui/src/components/ReProgress/settings/ReProgressSettings.vue
var ReProgressSettings_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	name: "ReProgressSettings",
	__name: "ReProgressSettings",
	setup(__props) {
		/**
		* ReProgressSettings —— 系统设置面板
		*
		* - 显示模式：折叠 / 展开
		* - 默认颜色
		* - 完成后提示 / 失败后提示
		* - 存在时间（自动过期）
		* - 是否多任务并存
		* - 是否历史 popover
		* - 面板位置
		*/
		const { state, api } = useProgress();
		const LIFETIME_OPTIONS = [
			{
				label: "永不过期",
				value: 0
			},
			{
				label: "1 小时",
				value: 36e5
			},
			{
				label: "24 小时",
				value: 864e5
			},
			{
				label: "7 天",
				value: 6048e5
			}
		];
		const COLOR_OPTIONS = [
			{
				label: "主色",
				value: "primary"
			},
			{
				label: "成功",
				value: "success"
			},
			{
				label: "警告",
				value: "warning"
			},
			{
				label: "危险",
				value: "danger"
			},
			{
				label: "信息",
				value: "info"
			}
		];
		const POSITION_OPTIONS = [
			{
				label: "右上",
				value: "top-right"
			},
			{
				label: "左上",
				value: "top-left"
			},
			{
				label: "右下",
				value: "bottom-right"
			},
			{
				label: "左下",
				value: "bottom-left"
			}
		];
		const MODE_OPTIONS = [{
			label: "折叠（仅进度条）",
			value: "compact"
		}, {
			label: "展开（含概要信息）",
			value: "expanded"
		}];
		const lifetimeValue = computed({
			get: () => state.settings.lifetime,
			set: (v) => api.updateSettings({ lifetime: v })
		});
		const displayMode = computed({
			get: () => state.settings.displayMode,
			set: (v) => api.updateSettings({ displayMode: v })
		});
		const defaultColor = computed({
			get: () => state.settings.defaultColor,
			set: (v) => api.updateSettings({ defaultColor: v })
		});
		const panelPosition = computed({
			get: () => state.settings.panelPosition,
			set: (v) => api.updateSettings({ panelPosition: v })
		});
		function onClearHistory() {
			api.clearHistory();
		}
		return (_ctx, _cache) => {
			return openBlock(), createElementBlock("div", _hoisted_1$2, [createBaseVNode("div", { class: "re-progress-settings__head" }, [_cache[8] || (_cache[8] = createBaseVNode("span", { class: "re-progress-settings__title" }, "系统设置", -1)), createBaseVNode("button", {
				class: "re-progress-settings__clear",
				type: "button",
				onClick: onClearHistory
			}, "清空历史")]), createBaseVNode("div", _hoisted_2$1, [
				createBaseVNode("div", _hoisted_3$1, [_cache[9] || (_cache[9] = createBaseVNode("span", { class: "re-progress-settings__label" }, "显示模式", -1)), createVNode(ReSelect_default, {
					layout: "default",
					options: MODE_OPTIONS,
					"model-value": displayMode.value,
					"onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => displayMode.value = $event),
					class: "re-progress-settings__control"
				}, null, 8, ["options", "model-value"])]),
				createBaseVNode("div", _hoisted_4$1, [_cache[10] || (_cache[10] = createBaseVNode("span", { class: "re-progress-settings__label" }, "默认颜色", -1)), createVNode(ReSelect_default, {
					layout: "default",
					options: COLOR_OPTIONS,
					"model-value": defaultColor.value,
					"onUpdate:modelValue": _cache[1] || (_cache[1] = ($event) => defaultColor.value = $event),
					class: "re-progress-settings__control"
				}, null, 8, ["options", "model-value"])]),
				createBaseVNode("div", _hoisted_5$1, [_cache[11] || (_cache[11] = createBaseVNode("span", { class: "re-progress-settings__label" }, "面板位置", -1)), createVNode(ReSelect_default, {
					layout: "default",
					options: POSITION_OPTIONS,
					"model-value": panelPosition.value,
					"onUpdate:modelValue": _cache[2] || (_cache[2] = ($event) => panelPosition.value = $event),
					class: "re-progress-settings__control"
				}, null, 8, ["options", "model-value"])]),
				createBaseVNode("div", _hoisted_6$1, [_cache[12] || (_cache[12] = createBaseVNode("span", { class: "re-progress-settings__label" }, "存在时间", -1)), createVNode(ReSelect_default, {
					layout: "default",
					options: LIFETIME_OPTIONS,
					"model-value": lifetimeValue.value,
					"onUpdate:modelValue": _cache[3] || (_cache[3] = ($event) => lifetimeValue.value = $event),
					class: "re-progress-settings__control"
				}, null, 8, ["options", "model-value"])]),
				createBaseVNode("div", _hoisted_7$1, [_cache[14] || (_cache[14] = createBaseVNode("span", { class: "re-progress-settings__label" }, "完成后提示", -1)), createBaseVNode("label", _hoisted_8$1, [createBaseVNode("input", {
					type: "checkbox",
					checked: unref(state).settings.showSuccessMessage,
					onChange: _cache[4] || (_cache[4] = ($event) => unref(api).updateSettings({ showSuccessMessage: $event.target.checked }))
				}, null, 40, _hoisted_9$1), _cache[13] || (_cache[13] = createBaseVNode("span", { class: "re-progress-settings__switch-track" }, [createBaseVNode("span", { class: "re-progress-settings__switch-thumb" })], -1))])]),
				createBaseVNode("div", _hoisted_10$1, [_cache[16] || (_cache[16] = createBaseVNode("span", { class: "re-progress-settings__label" }, "失败后提示", -1)), createBaseVNode("label", _hoisted_11, [createBaseVNode("input", {
					type: "checkbox",
					checked: unref(state).settings.showFailedMessage,
					onChange: _cache[5] || (_cache[5] = ($event) => unref(api).updateSettings({ showFailedMessage: $event.target.checked }))
				}, null, 40, _hoisted_12), _cache[15] || (_cache[15] = createBaseVNode("span", { class: "re-progress-settings__switch-track" }, [createBaseVNode("span", { class: "re-progress-settings__switch-thumb" })], -1))])]),
				createBaseVNode("div", _hoisted_13, [_cache[18] || (_cache[18] = createBaseVNode("span", { class: "re-progress-settings__label" }, "多任务并存", -1)), createBaseVNode("label", _hoisted_14, [createBaseVNode("input", {
					type: "checkbox",
					checked: unref(state).settings.multiTask,
					onChange: _cache[6] || (_cache[6] = ($event) => unref(api).updateSettings({ multiTask: $event.target.checked }))
				}, null, 40, _hoisted_15), _cache[17] || (_cache[17] = createBaseVNode("span", { class: "re-progress-settings__switch-track" }, [createBaseVNode("span", { class: "re-progress-settings__switch-thumb" })], -1))])]),
				createBaseVNode("div", _hoisted_16, [_cache[20] || (_cache[20] = createBaseVNode("span", { class: "re-progress-settings__label" }, "历史 Popover", -1)), createBaseVNode("label", _hoisted_17, [createBaseVNode("input", {
					type: "checkbox",
					checked: unref(state).settings.showHistoryPopover,
					onChange: _cache[7] || (_cache[7] = ($event) => unref(api).updateSettings({ showHistoryPopover: $event.target.checked }))
				}, null, 40, _hoisted_18), _cache[19] || (_cache[19] = createBaseVNode("span", { class: "re-progress-settings__switch-track" }, [createBaseVNode("span", { class: "re-progress-settings__switch-thumb" })], -1))])])
			])]);
		};
	}
}), [["__scopeId", "data-v-390ca848"]]);
//#endregion
//#region ../../packages/ui/src/components/ReProgress/ReProgressPanelBody.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1$1 = { class: "re-progress-panel__inner" };
var _hoisted_2 = { class: "re-progress-panel__head" };
var _hoisted_3 = { class: "re-progress-panel__tabs" };
var _hoisted_4 = {
	key: 0,
	class: "re-progress-panel__tab-count"
};
var _hoisted_5 = {
	key: 0,
	class: "re-progress-panel__tab-count"
};
var _hoisted_6 = { class: "re-progress-panel__head-actions" };
var _hoisted_7 = {
	key: 1,
	class: "re-progress-panel__empty"
};
var _hoisted_8 = { class: "re-progress-panel__empty-icon" };
var _hoisted_9 = { class: "re-progress-panel__empty-text" };
var _hoisted_10 = {
	key: 2,
	class: "re-progress-panel__list"
};
//#endregion
//#region ../../packages/ui/src/components/ReProgress/ReProgressPanelBody.vue
var ReProgressPanelBody_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	name: "ReProgressPanelBody",
	__name: "ReProgressPanelBody",
	props: {
		mode: {
			type: String,
			required: true
		},
		visibleTasks: {
			type: Array,
			required: true
		},
		offlineCount: {
			type: Number,
			required: true
		},
		showSettings: {
			type: Boolean,
			required: true
		}
	},
	emits: [
		"switch-mode",
		"toggle-settings",
		"remove",
		"retry"
	],
	setup(__props) {
		/**
		* ReProgressPanelBody —— 面板内部（Tab + 列表 + 设置），被 inline 与 floating 共用
		*/
		const { state } = useProgress();
		return (_ctx, _cache) => {
			return openBlock(), createElementBlock("div", _hoisted_1$1, [
				createBaseVNode("div", _hoisted_2, [createBaseVNode("div", _hoisted_3, [createBaseVNode("button", {
					type: "button",
					class: normalizeClass(["re-progress-panel__tab", { "re-progress-panel__tab--active": __props.mode === "realtime" }]),
					onClick: _cache[0] || (_cache[0] = ($event) => _ctx.$emit("switch-mode", "realtime"))
				}, [
					_cache[7] || (_cache[7] = createBaseVNode("span", { class: "re-progress-panel__tab-dot re-progress-panel__tab-dot--active" }, null, -1)),
					_cache[8] || (_cache[8] = createTextVNode(" 实时 ", -1)),
					__props.visibleTasks.length > 0 && __props.mode === "realtime" ? (openBlock(), createElementBlock("span", _hoisted_4, toDisplayString(__props.visibleTasks.length), 1)) : createCommentVNode("", true)
				], 2), createBaseVNode("button", {
					type: "button",
					class: normalizeClass(["re-progress-panel__tab", { "re-progress-panel__tab--active": __props.mode === "history" }]),
					onClick: _cache[1] || (_cache[1] = ($event) => _ctx.$emit("switch-mode", "history"))
				}, [
					_cache[9] || (_cache[9] = createBaseVNode("span", { class: "re-progress-panel__tab-dot" }, null, -1)),
					_cache[10] || (_cache[10] = createTextVNode(" 历史 ", -1)),
					__props.offlineCount > 0 ? (openBlock(), createElementBlock("span", _hoisted_5, toDisplayString(__props.offlineCount), 1)) : createCommentVNode("", true)
				], 2)]), createBaseVNode("div", _hoisted_6, [createBaseVNode("button", {
					type: "button",
					class: normalizeClass(["re-progress-panel__icon-btn", { "is-active": __props.showSettings }]),
					title: "系统设置",
					onClick: _cache[2] || (_cache[2] = ($event) => _ctx.$emit("toggle-settings"))
				}, [..._cache[11] || (_cache[11] = [createBaseVNode("svg", {
					viewBox: "0 0 24 24",
					fill: "none",
					stroke: "currentColor",
					"stroke-width": "2",
					"stroke-linecap": "round",
					"stroke-linejoin": "round"
				}, [createBaseVNode("circle", {
					cx: "12",
					cy: "12",
					r: "3"
				}), createBaseVNode("path", { d: "M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.06a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h.06a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.06a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" })], -1)])], 2)])]),
				__props.showSettings ? (openBlock(), createBlock(ReProgressSettings_default, { key: 0 })) : createCommentVNode("", true),
				__props.visibleTasks.length === 0 ? (openBlock(), createElementBlock("div", _hoisted_7, [createBaseVNode("div", _hoisted_8, toDisplayString(__props.mode === "realtime" ? "✓" : "○"), 1), createBaseVNode("div", _hoisted_9, toDisplayString(__props.mode === "realtime" ? "当前没有正在进行的任务" : "暂无历史任务"), 1)])) : (openBlock(), createElementBlock("div", _hoisted_10, [__props.mode === "realtime" ? (openBlock(true), createElementBlock(Fragment, { key: 0 }, renderList(__props.visibleTasks, (task) => {
					return openBlock(), createBlock(ReProgressTask_default, {
						key: task.id,
						task,
						collapsed: unref(state).settings.displayMode === "compact",
						onRemove: _cache[3] || (_cache[3] = (id) => _ctx.$emit("remove", id)),
						onRetry: _cache[4] || (_cache[4] = (id) => _ctx.$emit("retry", id))
					}, null, 8, ["task", "collapsed"]);
				}), 128)) : (openBlock(true), createElementBlock(Fragment, { key: 1 }, renderList(__props.visibleTasks, (task) => {
					return openBlock(), createBlock(ReProgressTimeline_default, {
						key: task.id,
						task,
						onRemove: _cache[5] || (_cache[5] = (id) => _ctx.$emit("remove", id)),
						onRetry: _cache[6] || (_cache[6] = (id) => _ctx.$emit("retry", id))
					}, null, 8, ["task"]);
				}), 128))]))
			]);
		};
	}
}), [["__scopeId", "data-v-2949a99d"]]);
//#endregion
//#region ../../packages/ui/src/components/ReProgress/ReProgressPanel.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1 = { class: "re-progress-panel__shell" };
//#endregion
//#region ../../packages/ui/src/components/ReProgress/ReProgressPanel.vue
var ReProgressPanel_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	name: "ReProgressPanel",
	inheritAttrs: true,
	__name: "ReProgressPanel",
	props: {
		floating: {
			type: Boolean,
			default: true
		},
		position: { default: void 0 }
	},
	setup(__props) {
		/**
		* ReProgressPanel —— 任务进度面板
		*
		* 两种模式：
		*   - 实时：显示当前 running / pending 任务（默认）
		*   - 历史：点击历史图标切换，显示已完成 / 失败 / 取消的任务
		*
		* 实时模式鼠标悬停历史 popover 显示详细信息时间轴
		* 系统设置：显示模式、颜色、提示、存在时间
		* 现代化扁平化：玻璃质感 + 渐变 + 阴影
		*/
		const props = __props;
		const { api, state, runningTasks, historyTasks } = useProgress();
		const mode = ref("realtime");
		const showSettings = ref(false);
		const finalPosition = computed(() => props.position ?? state.settings.panelPosition);
		const visibleTasks = computed(() => {
			if (mode.value === "realtime") return runningTasks.value;
			return historyTasks.value;
		});
		const offlineCount = computed(() => historyTasks.value.length);
		function onRemove(id) {
			api.remove(id);
		}
		function onRetry(id) {
			if (!state.tasks.find((x) => x.id === id)) return;
			api.reset(id);
			api.start(id, "已重试");
		}
		const floatingStyle = computed(() => {
			if (!props.floating) return void 0;
			const pos = finalPosition.value;
			const map = {
				"top-right": {
					top: "16px",
					right: "16px"
				},
				"top-left": {
					top: "16px",
					left: "16px"
				},
				"bottom-right": {
					bottom: "16px",
					right: "16px"
				},
				"bottom-left": {
					bottom: "16px",
					left: "16px"
				}
			};
			return {
				position: "fixed",
				zIndex: 1e3,
				...map[pos] ?? map["bottom-right"]
			};
		});
		/** 监听完成 / 失败 toast 通知 */
		function onNotify(e) {
			const { task, type } = e.detail;
			if (type === "success" && !state.settings.showSuccessMessage) return;
			if (type === "failed" && !state.settings.showFailedMessage) return;
			console.log(`[ReProgress] ${type === "success" ? "✓" : "✕"} ${task.title}: ${task.text ?? ""}`);
		}
		onMounted(() => {
			window.addEventListener("re-progress:notify", onNotify);
		});
		onUnmounted(() => {
			window.removeEventListener("re-progress:notify", onNotify);
		});
		return (_ctx, _cache) => {
			return __props.floating ? (openBlock(), createElementBlock("div", mergeProps({
				key: 0,
				class: [
					"re-progress-panel",
					"re-progress-panel--floating",
					`re-progress-panel--${finalPosition.value}`
				],
				style: floatingStyle.value
			}, _ctx.$attrs), [createBaseVNode("div", _hoisted_1, [createVNode(ReProgressPanelBody_default, {
				mode: mode.value,
				"visible-tasks": visibleTasks.value,
				"offline-count": offlineCount.value,
				"show-settings": showSettings.value,
				onSwitchMode: _cache[0] || (_cache[0] = ($event) => mode.value = $event),
				onToggleSettings: _cache[1] || (_cache[1] = ($event) => showSettings.value = !showSettings.value),
				onRemove,
				onRetry
			}, null, 8, [
				"mode",
				"visible-tasks",
				"offline-count",
				"show-settings"
			])])], 16)) : (openBlock(), createElementBlock("div", mergeProps({
				key: 1,
				class: "re-progress-panel re-progress-panel--inline"
			}, _ctx.$attrs), [createVNode(ReProgressPanelBody_default, {
				mode: mode.value,
				"visible-tasks": visibleTasks.value,
				"offline-count": offlineCount.value,
				"show-settings": showSettings.value,
				onSwitchMode: _cache[2] || (_cache[2] = ($event) => mode.value = $event),
				onToggleSettings: _cache[3] || (_cache[3] = ($event) => showSettings.value = !showSettings.value),
				onRemove,
				onRetry
			}, null, 8, [
				"mode",
				"visible-tasks",
				"offline-count",
				"show-settings"
			])], 16));
		};
	}
}), [["__scopeId", "data-v-8e313991"]]);
//#endregion
//#region ../../packages/ui/src/components/ReProgress/index.ts
var components = {
	ReProgress: ReProgress_default,
	ReProgressTask: ReProgressTask_default,
	ReProgressPanel: ReProgressPanel_default,
	ReProgressTimeline: ReProgressTimeline_default
};
var plugin = { install(app) {
	for (const [name, c] of Object.entries(components)) app.component(name, c);
} };
var ReProgress_default$1 = ReProgress_default;
//#endregion
export { ReProgress_default as ReProgress, ReProgressPanel_default as ReProgressPanel, ReProgressTask_default as ReProgressTask, ReProgressTimeline_default as ReProgressTimeline, ReProgress_default$1 as default, plugin as install, useProgress };
