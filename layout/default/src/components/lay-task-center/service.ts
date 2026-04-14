import { computed, reactive } from "vue";
import type {
  TaskCenterMessage,
  TaskCenterMessageInput,
  TaskCenterState,
  TaskCenterStatus,
  TaskCenterTask,
  TaskCenterTaskInput,
} from "./types";

const ACTIVE_STATUSES = new Set<TaskCenterStatus>(["pending", "running"]);
const DEFAULT_POSITION = "bottom-right" as const;
const DEFAULT_MODE = "progress" as const;
const DEFAULT_AUTO_CLOSE_DELAY = 8000;
const DEFAULT_MAX_LOGS = 40;
const DEFAULT_MAX_VISIBLE = 4;
const DEFAULT_MAX_HISTORY = 80;

const taskTimers = new Map<string, ReturnType<typeof setTimeout>>();

const state = reactive<TaskCenterState>({
  panelVisible: false,
  selectedTaskId: null,
  maxVisible: DEFAULT_MAX_VISIBLE,
  maxHistory: DEFAULT_MAX_HISTORY,
  tasks: [],
});

const clampProgress = (
  progress?: number | null,
  current?: number | null,
  total?: number | null,
) => {
  if (typeof progress === "number" && Number.isFinite(progress)) {
    return Math.max(0, Math.min(100, Math.round(progress)));
  }

  if (
    typeof current === "number" &&
    typeof total === "number" &&
    Number.isFinite(current) &&
    Number.isFinite(total) &&
    total > 0
  ) {
    return Math.max(0, Math.min(100, Math.round((current / total) * 100)));
  }

  return null;
};

const createId = () =>
  `task-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const createMessageId = () =>
  `task-log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const normalizeRequestId = (requestId?: string | number) => {
  if (requestId === null || requestId === undefined || requestId === "") {
    return undefined;
  }
  return String(requestId);
};

const findTaskByRequestId = (requestId?: string | number) => {
  const normalizedRequestId = normalizeRequestId(requestId);
  if (!normalizedRequestId) {
    return undefined;
  }
  return state.tasks.find(
    (task) => normalizeRequestId(task.requestId) === normalizedRequestId,
  );
};

const findTask = (input: { id?: string; requestId?: string | number }) => {
  if (input.id) {
    return state.tasks.find((task) => task.id === input.id) ?? undefined;
  }
  return findTaskByRequestId(input.requestId);
};

const normalizeMessage = (
  input: string | TaskCenterMessageInput,
): TaskCenterMessage => {
  if (typeof input === "string") {
    return {
      id: createMessageId(),
      content: input,
      level: "info",
      timestamp: Date.now(),
    };
  }

  return {
    id: createMessageId(),
    content: input.content,
    level: input.level ?? "info",
    timestamp: input.timestamp ?? Date.now(),
  };
};

const appendMessages = (
  base: TaskCenterMessage[],
  incoming: TaskCenterTaskInput,
  maxLogs: number,
) => {
  const next = [...base];
  const pushEntry = (entry: TaskCenterMessage) => {
    const last = next[next.length - 1];
    if (last && last.content === entry.content && last.level === entry.level) {
      next[next.length - 1] = {
        ...last,
        timestamp: entry.timestamp,
      };
      return;
    }
    next.push(entry);
  };

  if (incoming.message) {
    pushEntry(
      normalizeMessage({
        content: incoming.message,
        level:
          incoming.status === "error"
            ? "error"
            : incoming.status === "success"
              ? "success"
              : "info",
      }),
    );
  }

  incoming.messages?.forEach((item) => {
    pushEntry(normalizeMessage(item));
  });

  if (next.length <= maxLogs) {
    return next;
  }

  return next.slice(next.length - maxLogs);
};

const clearTaskTimer = (taskId: string) => {
  const timer = taskTimers.get(taskId);
  if (!timer) {
    return;
  }
  clearTimeout(timer);
  taskTimers.delete(taskId);
};

const removeTaskById = (taskId: string) => {
  clearTaskTimer(taskId);
  const index = state.tasks.findIndex((task) => task.id === taskId);
  if (index === -1) {
    return;
  }
  state.tasks.splice(index, 1);
  if (state.selectedTaskId === taskId) {
    state.selectedTaskId = state.tasks[0]?.id ?? null;
  }
};

const dismissTaskOverlayInternal = (
  taskId: string,
  dismissed: boolean = true,
) => {
  const task = state.tasks.find((item) => item.id === taskId);
  if (!task) {
    return;
  }
  task.overlayVisible = false;
  task.overlayDismissed = dismissed;
};

const scheduleAutoClose = (task: TaskCenterTask) => {
  clearTaskTimer(task.id);
  if (!task.autoClose || ACTIVE_STATUSES.has(task.status)) {
    return;
  }

  taskTimers.set(
    task.id,
    setTimeout(() => {
      if (task.retainHistory) {
        dismissTaskOverlayInternal(task.id, false);
      } else {
        removeTaskById(task.id);
      }
    }, task.autoCloseDelay),
  );
};

const trimHistory = () => {
  const removable = [...state.tasks]
    .filter((task) => !ACTIVE_STATUSES.has(task.status))
    .sort((a, b) => a.updatedAt - b.updatedAt);

  const overflow = removable.length - state.maxHistory;
  if (overflow <= 0) {
    return;
  }

  removable.slice(0, overflow).forEach((task) => {
    removeTaskById(task.id);
  });
};

const resolveStatus = (
  existing: TaskCenterTask | undefined,
  input: TaskCenterTaskInput,
  progress: number | null,
) => {
  if (input.status) {
    return input.status;
  }
  if (existing?.status) {
    return existing.status;
  }
  if (progress !== null && progress >= 100) {
    return "success" as const;
  }
  if (progress !== null && progress > 0) {
    return "running" as const;
  }
  return "pending" as const;
};

export const upsertTaskCenterTask = (input: TaskCenterTaskInput) => {
  const now = Date.now();
  const existing = findTask(input);
  const normalizedRequestId = normalizeRequestId(input.requestId);
  const taskId =
    input.id ??
    existing?.id ??
    (normalizedRequestId ? `task-request-${normalizedRequestId}` : createId());
  const progress = clampProgress(input.progress, input.current, input.total);
  const status = resolveStatus(existing, input, progress);
  const maxLogs = input.maxLogs ?? existing?.maxLogs ?? DEFAULT_MAX_LOGS;
  const shouldReopen =
    input.reopenOverlay === true ||
    (!existing?.overlayDismissed && ACTIVE_STATUSES.has(status)) ||
    status === "error";

  const nextTask: TaskCenterTask = {
    id: taskId,
    requestId: input.requestId ?? existing?.requestId,
    title: input.title ?? existing?.title ?? "未命名任务",
    description: input.description ?? existing?.description,
    icon: input.icon ?? existing?.icon,
    status,
    mode:
      input.mode ??
      existing?.mode ??
      (input.message || input.messages?.length ? "stream" : DEFAULT_MODE),
    progress:
      progress ??
      existing?.progress ??
      (status === "success" ? 100 : status === "pending" ? 0 : null),
    current: input.current ?? existing?.current ?? null,
    total: input.total ?? existing?.total ?? null,
    stageLabel: input.stageLabel ?? existing?.stageLabel,
    latestMessage: input.message ?? existing?.latestMessage,
    message: undefined,
    messages: appendMessages(existing?.messages ?? [], input, maxLogs),
    position: input.position ?? existing?.position ?? DEFAULT_POSITION,
    closeable: input.closeable ?? existing?.closeable ?? true,
    showPercent: input.showPercent ?? existing?.showPercent ?? true,
    autoClose: input.autoClose ?? existing?.autoClose ?? true,
    autoCloseDelay:
      input.autoCloseDelay ??
      existing?.autoCloseDelay ??
      DEFAULT_AUTO_CLOSE_DELAY,
    maxLogs,
    source: input.source ?? existing?.source ?? "manual",
    meta: {
      ...(existing?.meta ?? {}),
      ...(input.meta ?? {}),
    },
    retainHistory: input.retainHistory ?? existing?.retainHistory ?? true,
    overlayVisible:
      input.overlayVisible ??
      (shouldReopen ? true : (existing?.overlayVisible ?? true)),
    overlayDismissed: shouldReopen
      ? false
      : (existing?.overlayDismissed ?? false),
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    startedAt: existing?.startedAt ?? now,
    endedAt: ACTIVE_STATUSES.has(status)
      ? undefined
      : (existing?.endedAt ?? now),
  };

  if (!nextTask.latestMessage) {
    nextTask.latestMessage =
      nextTask.messages[nextTask.messages.length - 1]?.content;
  }

  if (existing) {
    Object.assign(existing, nextTask);
  } else {
    state.tasks.unshift(nextTask);
  }

  if (!state.selectedTaskId) {
    state.selectedTaskId = taskId;
  }

  if (!ACTIVE_STATUSES.has(status)) {
    scheduleAutoClose(existing ?? nextTask);
  } else {
    clearTaskTimer(taskId);
  }

  trimHistory();
  return taskId;
};

export const updateTaskCenterTask = (
  taskId: string,
  patch: Omit<TaskCenterTaskInput, "id">,
) => upsertTaskCenterTask({ ...patch, id: taskId });

export const getTaskCenterTask = (taskOrRequestId: string | number) => {
  if (typeof taskOrRequestId === "string") {
    return (
      findTask({ id: taskOrRequestId }) ??
      findTask({ requestId: taskOrRequestId }) ??
      null
    );
  }

  return findTask({ requestId: taskOrRequestId }) ?? null;
};

export const getTaskCenterTaskByRequestId = (requestId: string | number) =>
  findTaskByRequestId(requestId) ?? null;

export const resolveTaskCenterTaskId = (
  taskOrRequestId: string | number,
): string | null => getTaskCenterTask(taskOrRequestId)?.id ?? null;

export const appendTaskCenterMessage = (
  taskId: string,
  message: string | TaskCenterMessageInput,
) => {
  const task = state.tasks.find((item) => item.id === taskId);
  return upsertTaskCenterTask({
    id: taskId,
    title: task?.title,
    mode: task?.mode ?? "stream",
    messages: [message],
    reopenOverlay: ACTIVE_STATUSES.has(task?.status ?? "pending"),
  });
};

export const finishTaskCenterTask = (
  taskId: string,
  patch: Omit<TaskCenterTaskInput, "id" | "status"> = {},
) =>
  upsertTaskCenterTask({
    ...patch,
    id: taskId,
    status: "success",
    progress: patch.progress ?? 100,
  });

export const failTaskCenterTask = (
  taskId: string,
  patch: Omit<TaskCenterTaskInput, "id" | "status"> = {},
) =>
  upsertTaskCenterTask({
    ...patch,
    id: taskId,
    status: "error",
    reopenOverlay: true,
  });

export const removeTaskCenterTask = (taskId: string) => {
  removeTaskById(taskId);
};

export const dismissTaskCenterTask = (taskId: string) => {
  clearTaskTimer(taskId);
  dismissTaskOverlayInternal(taskId);
};

export const clearTaskCenterHistory = () => {
  [...state.tasks]
    .filter((task) => !ACTIVE_STATUSES.has(task.status))
    .forEach((task) => removeTaskById(task.id));
};

export const clearTaskCenter = () => {
  [...state.tasks].forEach((task) => clearTaskTimer(task.id));
  state.tasks = [];
  state.selectedTaskId = null;
};

export const openTaskCenterPanel = () => {
  state.panelVisible = true;
};

export const closeTaskCenterPanel = () => {
  state.panelVisible = false;
};

export const toggleTaskCenterPanel = () => {
  state.panelVisible = !state.panelVisible;
};

export const selectTaskCenterTask = (taskId: string | null) => {
  state.selectedTaskId = taskId;
};

export const configureTaskCenter = (
  payload: Partial<Pick<TaskCenterState, "maxVisible" | "maxHistory">>,
) => {
  if (typeof payload.maxVisible === "number" && payload.maxVisible > 0) {
    state.maxVisible = Math.round(payload.maxVisible);
  }
  if (typeof payload.maxHistory === "number" && payload.maxHistory > 0) {
    state.maxHistory = Math.round(payload.maxHistory);
    trimHistory();
  }
};

const sortedTasks = computed(() =>
  [...state.tasks].sort((left, right) => {
    const leftRank = ACTIVE_STATUSES.has(left.status) ? 0 : 1;
    const rightRank = ACTIVE_STATUSES.has(right.status) ? 0 : 1;
    if (leftRank !== rightRank) {
      return leftRank - rightRank;
    }
    return right.updatedAt - left.updatedAt;
  }),
);

const activeTasks = computed(() =>
  sortedTasks.value.filter((task) => ACTIVE_STATUSES.has(task.status)),
);

const historyTasks = computed(() =>
  sortedTasks.value.filter((task) => !ACTIVE_STATUSES.has(task.status)),
);

const selectedTask = computed(
  () =>
    sortedTasks.value.find((task) => task.id === state.selectedTaskId) ??
    sortedTasks.value[0] ??
    null,
);

export const useTaskCenterState = () => ({
  state,
  sortedTasks,
  activeTasks,
  historyTasks,
  activeTaskCount: computed(() => activeTasks.value.length),
  selectedTask,
});
