import { Kn as ref, U as computed, Wn as reactive, gn as watch } from "./vue.runtime.esm-bundler-BlWT4PH_.js";
import { i as getStorageKey } from "./src-CT6rpQSM.js";
import ReProgress from "D:/ch/project/vue-support-parent-starter/packages/ui/src/components/ReProgress/ReProgress.vue";
import ReProgressTask from "D:/ch/project/vue-support-parent-starter/packages/ui/src/components/ReProgress/ReProgressTask.vue";
import ReProgressPanel from "D:/ch/project/vue-support-parent-starter/packages/ui/src/components/ReProgress/ReProgressPanel.vue";
import ReProgressTimeline from "D:/ch/project/vue-support-parent-starter/packages/ui/src/components/ReProgress/ReProgressTimeline.vue";
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
//#region ../../packages/ui/src/components/ReProgress/index.ts
var components = {
	ReProgress,
	ReProgressTask,
	ReProgressPanel,
	ReProgressTimeline
};
var plugin = { install(app) {
	for (const [name, c] of Object.entries(components)) app.component(name, c);
} };
var ReProgress_default = ReProgress;
//#endregion
export { ReProgress, ReProgressPanel, ReProgressTask, ReProgressTimeline, ReProgress_default as default, plugin as install, useProgress };
