/**
 * ReProgress 任务管理器
 *
 * 响应式单例：所有组件共享同一份任务列表与设置。
 * - 持久化：localStorage 保留历史任务（仅 completed / failed / cancelled 上限 50 条）
 * - 实时任务只在内存中
 * - 自动过期：超过 lifetime 自动清理（lifetime=0 表示永久）
 */
import { reactive, watch, computed, ref } from "vue";
import type {
  ReProgressApi,
  ReProgressSettings,
  ReProgressSnapshot,
  ReProgressStatus,
  ReProgressTask,
  ReProgressTaskInput,
} from "../types";

const STORAGE_KEY = "re-progress-history";
const STORAGE_SETTINGS_KEY = "re-progress-settings";
const HISTORY_LIMIT = 50;

const DEFAULT_SETTINGS: ReProgressSettings = {
  displayMode: "compact",
  defaultColor: "primary",
  showSuccessMessage: true,
  showFailedMessage: true,
  lifetime: 24 * 60 * 60 * 1000, // 24h
  showHistoryPopover: true,
  multiTask: true,
  showPanelTitle: true,
  panelPosition: "bottom-right",
};

let _uid = 0;
const genId = (): string => `task-${Date.now().toString(36)}-${(_uid++).toString(36)}`;

const loadHistory = (): ReProgressTask[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw) as ReProgressTask[];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
};

const loadSettings = (): ReProgressSettings => {
  try {
    const raw = localStorage.getItem(STORAGE_SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
};

const saveHistory = (tasks: ReProgressTask[]): void => {
  try {
    const finished = tasks
      .filter((t) => t.status === "success" || t.status === "failed" || t.status === "cancelled")
      .slice(0, HISTORY_LIMIT);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(finished));
  } catch {
    // localStorage 可能超过配额，忽略
  }
};

const saveSettings = (settings: ReProgressSettings): void => {
  try {
    localStorage.setItem(STORAGE_SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // ignore
  }
};

const snapshot = (task: ReProgressTask, text?: string): ReProgressSnapshot => ({
  time: Date.now(),
  progress: task.progress,
  text: text ?? task.text,
  status: task.status,
});

function pushHistory(task: ReProgressTask, text?: string): void {
  task.history.push(snapshot(task, text));
  if (task.history.length > 200) task.history.shift();
}

/** 内部 reactive 单例 */
const state = reactive({
  tasks: [] as ReProgressTask[],
  settings: loadSettings(),
});

/** 标记首次 hydrate 完成（避免初始 store 覆盖 localStorage 中的历史） */
let hydrated = false;
state.tasks = loadHistory();

watch(
  () => state.tasks,
  (tasks) => {
    if (hydrated) saveHistory(tasks);
  },
  { deep: true },
);

watch(
  () => state.settings,
  (s) => saveSettings(s),
  { deep: true },
);

/** 暴露全局注入 mark */
setTimeout(() => {
  hydrated = true;
}, 0);

/** 触发一次性完成回调（toast） */
function notify(task: ReProgressTask, type: "success" | "failed"): void {
  if (typeof window === "undefined") return;
  const evt = new CustomEvent("re-progress:notify", { detail: { task, type } });
  window.dispatchEvent(evt);
}

const api: ReProgressApi = {
  get tasks() {
    return state.tasks;
  },
  get settings() {
    return state.settings;
  },
  create(input: ReProgressTaskInput): ReProgressTask {
    const id = input.id ?? genId();
    if (!state.settings.multiTask) {
      // 单任务模式：移除其他运行/挂起任务
      state.tasks = state.tasks.filter((t) => t.status === "running" || t.status === "pending");
    }
    const task: ReProgressTask = {
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
      hasHistory: input.hasHistory ?? true,
    };
    state.tasks = [task, ...state.tasks];
    pushHistory(task);
    return task;
  },
  start(id: string, text?: string): void {
    const t = state.tasks.find((x) => x.id === id);
    if (!t) return;
    t.status = "running";
    t.startedAt = Date.now();
    if (text) t.text = text;
    pushHistory(t, text);
  },
  update(id: string, progress: number, text?: string): void {
    const t = state.tasks.find((x) => x.id === id);
    if (!t) return;
    t.status = "running";
    t.progress = Math.max(0, Math.min(1, progress));
    if (text) t.text = text;
    pushHistory(t, text);
  },
  complete(id: string, text?: string): void {
    const t = state.tasks.find((x) => x.id === id);
    if (!t) return;
    t.status = "success";
    t.progress = 1;
    t.text = text ?? "已完成";
    t.finishedAt = Date.now();
    pushHistory(t, t.text);
    notify(t, "success");
  },
  fail(id: string, error: string, text?: string): void {
    const t = state.tasks.find((x) => x.id === id);
    if (!t) return;
    t.status = "failed";
    t.error = error;
    t.text = text ?? "失败";
    t.finishedAt = Date.now();
    pushHistory(t, t.text);
    notify(t, "failed");
  },
  cancel(id: string, text?: string): void {
    const t = state.tasks.find((x) => x.id === id);
    if (!t) return;
    t.status = "cancelled";
    t.text = text ?? "已取消";
    t.finishedAt = Date.now();
    pushHistory(t, t.text);
  },
  setProgress(id: string, progress: number, text?: string): void {
    const t = state.tasks.find((x) => x.id === id);
    if (!t) return;
    t.progress = Math.max(0, Math.min(1, progress));
    if (text) t.text = text;
    pushHistory(t, text);
  },
  reset(id: string): void {
    const t = state.tasks.find((x) => x.id === id);
    if (!t) return;
    t.status = "pending";
    t.progress = 0;
    t.text = undefined;
    t.error = undefined;
    t.startedAt = undefined;
    t.finishedAt = undefined;
    t.history = [];
    pushHistory(t);
  },
  remove(id: string): void {
    state.tasks = state.tasks.filter((x) => x.id !== id);
  },
  clearHistory(): void {
    state.tasks = state.tasks.filter((t) => t.status === "running" || t.status === "pending");
  },
  updateSettings(patch: Partial<ReProgressSettings>): void {
    state.settings = { ...state.settings, ...patch };
  },
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
}, 30 * 1000);

/** 计算派生：运行中的任务 */
const runningTasks = computed(() => state.tasks.filter((t) => t.status === "running" || t.status === "pending"));
const historyTasks = computed(() => state.tasks.filter((t) => t.status !== "running" && t.status !== "pending"));

export function useProgress() {
  return { api, state, runningTasks, historyTasks };
}

/** 公共 ready 标志（首屏 hydrate 完成） */
const ready = ref(false);
setTimeout(() => (ready.value = true), 0);

export const progressReady = ready;
