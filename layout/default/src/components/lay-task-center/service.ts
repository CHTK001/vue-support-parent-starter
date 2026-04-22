import { computed, reactive } from "vue";
import {
  clearOverlayStack,
  configureOverlayStack,
  removeOverlayStackItemsBySource,
  upsertOverlayStackItem,
} from "../lay-overlay-stack/service";
import type { OverlayStackTone } from "../lay-overlay-stack/types";
import { ensureStandaloneOverlayHost } from "../../runtime/ensureStandaloneOverlayHost";
import type {
  TaskCenterMessage,
  TaskCenterMessageInput,
  TaskCenterPersistContext,
  TaskCenterState,
  TaskCenterStatus,
  TaskCenterTask,
  TaskCenterTriggerHandler,
  TaskCenterTriggerPayload,
  TaskCenterTriggerType,
  TaskCenterTaskInput,
} from "./types";

const ACTIVE_STATUSES = new Set<TaskCenterStatus>(["pending", "running"]);
const DEFAULT_POSITION = "bottom-right" as const;
const DEFAULT_MODE = "progress" as const;
const DEFAULT_AUTO_CLOSE_DELAY = 8000;
const DEFAULT_MAX_LOGS = 40;
const DEFAULT_MAX_VISIBLE = 5;
const DEFAULT_MAX_HISTORY = 80;
const TASK_CENTER_OVERLAY_SOURCE = "task-center";

const statusLabelMap = {
  pending: "等待中",
  running: "进行中",
  success: "已完成",
  error: "失败",
  warning: "警告",
} as const;

const statusToneMap: Record<TaskCenterStatus, OverlayStackTone> = {
  pending: "default",
  running: "info",
  success: "success",
  error: "error",
  warning: "warning",
};

const state = reactive<TaskCenterState>({
  panelVisible: false,
  selectedTaskId: null,
  maxVisible: DEFAULT_MAX_VISIBLE,
  maxHistory: DEFAULT_MAX_HISTORY,
  tasks: [],
});

const hooks = reactive<{
  onTriggers: Set<TaskCenterTriggerHandler>;
}>({
  onTriggers: new Set(),
});

const formatElapsed = (startedAt: number, endedAt?: number) => {
  const diff = Math.max(0, (endedAt ?? Date.now()) - startedAt);
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  if (hours > 0) return `${hours}h ${String(minutes % 60).padStart(2, "0")}m`;
  if (minutes > 0) {
    return `${minutes}m ${String(seconds % 60).padStart(2, "0")}s`;
  }
  return `${seconds}s`;
};

const getStepLabel = (task: TaskCenterTask) => {
  if (task.stageLabel) return task.stageLabel;
  if (
    typeof task.current === "number" &&
    typeof task.total === "number" &&
    task.total > 0
  ) {
    return `${task.current}/${task.total}`;
  }
  return task.latestMessage || "等待执行";
};

const syncTaskCenterOverlays = () => {
  const visibleTasks = [...state.tasks]
    .sort((left, right) => right.updatedAt - left.updatedAt)
    .filter((item) => item.overlayVisible);

  if (visibleTasks.length > 0) {
    ensureStandaloneOverlayHost();
  }

  visibleTasks.forEach((task) => {
    upsertOverlayStackItem({
      id: task.id,
      source: TASK_CENTER_OVERLAY_SOURCE,
      title: task.title,
      description: task.description,
      icon: task.icon || "mdi:lightning-bolt-outline",
      tone: statusToneMap[task.status],
      position: task.position,
      timestamp: task.updatedAt,
      createdAt: task.createdAt,
      latestMessage: task.latestMessage,
      summary:
        task.mode === "stream" && task.messages.length > 0
          ? `${task.messages.length} 条消息 · ${task.latestMessage || "等待执行"}`
          : `${statusLabelMap[task.status]} · ${getStepLabel(task)}`,
      messages: task.messages
        .slice(-Math.min(task.maxLogs, 6))
        .map((message) => ({
          id: message.id,
          content: message.content,
          level: message.level,
          timestamp: message.timestamp,
        })),
      progress: task.progress,
      progressLabel: getStepLabel(task),
      progressSecondary: formatElapsed(task.startedAt, task.endedAt),
      showPercent: task.showPercent,
      closeable: task.closeable,
      autoClose: task.autoClose,
      autoCloseDelay: task.autoCloseDelay,
      onOpen: () => {
        state.selectedTaskId = task.id;
        state.panelVisible = true;
      },
      onClose: () => dismissTaskCenterTask(task.id),
    });
  });

  removeOverlayStackItemsBySource(
    TASK_CENTER_OVERLAY_SOURCE,
    visibleTasks.map((task) => task.id),
  );
};

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

const createTriggerEventId = () =>
  `task-event-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

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

const cloneTaskSnapshot = (task?: TaskCenterTask | null) =>
  task ? (JSON.parse(JSON.stringify(task)) as TaskCenterTask) : null;

const resolvePersistContext = (
  input?: Partial<TaskCenterTaskInput> | null,
  existing?: TaskCenterTask | null,
): TaskCenterPersistContext => {
  const meta = input?.meta && typeof input.meta === "object" ? input.meta : {};
  const fallbackMeta =
    existing?.meta && typeof existing.meta === "object" ? existing.meta : {};

  return {
    bizType:
      input?.bizType ??
      existing?.bizType ??
      (meta.bizType as string | undefined) ??
      (fallbackMeta.bizType as string | undefined),
    bizId:
      input?.bizId ??
      existing?.bizId ??
      (meta.bizId as string | number | undefined) ??
      (fallbackMeta.bizId as string | number | undefined),
    operator:
      input?.operator ??
      existing?.operator ??
      (meta.operator as string | undefined) ??
      (fallbackMeta.operator as string | undefined),
    traceId:
      input?.traceId ??
      existing?.traceId ??
      (meta.traceId as string | undefined) ??
      (fallbackMeta.traceId as string | undefined),
    persistKey:
      input?.persistKey ??
      existing?.persistKey ??
      (meta.persistKey as string | undefined) ??
      (fallbackMeta.persistKey as string | undefined),
  };
};

const notifyTaskTrigger = ({
  type,
  task,
  previousTask,
  tasks,
  patch,
}: {
  type: TaskCenterTriggerType;
  task?: TaskCenterTask | null;
  previousTask?: TaskCenterTask | null;
  tasks?: TaskCenterTask[];
  patch?: Partial<TaskCenterTaskInput>;
}) => {
  const payload: TaskCenterTriggerPayload = {
    type,
    timestamp: Date.now(),
    eventId: createTriggerEventId(),
    taskId: task?.id ?? previousTask?.id,
    requestId: task?.requestId ?? previousTask?.requestId,
    persist: resolvePersistContext(task ?? patch ?? null, previousTask),
    task: cloneTaskSnapshot(task),
    previousTask: cloneTaskSnapshot(previousTask),
    tasks: tasks?.map((item) => cloneTaskSnapshot(item)!).filter(Boolean),
    patch,
  };
  hooks.onTriggers.forEach((handler) => handler(payload));
};

export const registerTaskCenterTriggerHandler = (
  handler: TaskCenterTriggerHandler,
) => {
  hooks.onTriggers.add(handler);
};

export const unregisterTaskCenterTriggerHandler = (
  handler: TaskCenterTriggerHandler,
) => {
  hooks.onTriggers.delete(handler);
};

export const clearTaskCenterTriggerHandlers = () => {
  hooks.onTriggers.clear();
};

const removeTaskById = (taskId: string) => {
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

export const upsertTaskCenterTask = (
  input: TaskCenterTaskInput,
  triggerType?: TaskCenterTriggerType,
) => {
  const now = Date.now();
  const existing = findTask(input);
  const previousTask = cloneTaskSnapshot(existing);
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
    ...resolvePersistContext(input, existing),
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
    autoClose: input.autoClose ?? existing?.autoClose ?? false,
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

  trimHistory();
  syncTaskCenterOverlays();
  notifyTaskTrigger({
    type: triggerType ?? (previousTask ? "update" : "add"),
    task: existing ?? nextTask,
    previousTask,
    patch: input,
  });
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
  const nextTaskId = upsertTaskCenterTask(
    {
    id: taskId,
    title: task?.title,
    mode: task?.mode ?? "stream",
    messages: [message],
    reopenOverlay: ACTIVE_STATUSES.has(task?.status ?? "pending"),
    },
    "message",
  );
  return nextTaskId;
};

export const finishTaskCenterTask = (
  taskId: string,
  patch: Omit<TaskCenterTaskInput, "id" | "status"> = {},
) => {
  const previousTask = getTaskCenterTask(taskId);
  const nextTaskId = upsertTaskCenterTask({
    ...patch,
    id: taskId,
    status: "success",
    progress: patch.progress ?? 100,
  }, "success");
  return nextTaskId;
};

export const failTaskCenterTask = (
  taskId: string,
  patch: Omit<TaskCenterTaskInput, "id" | "status"> = {},
) => {
  const previousTask = getTaskCenterTask(taskId);
  const nextTaskId = upsertTaskCenterTask({
    ...patch,
    id: taskId,
    status: "error",
    reopenOverlay: true,
  }, "error");
  return nextTaskId;
};

export const removeTaskCenterTask = (taskId: string) => {
  const task = getTaskCenterTask(taskId);
  removeTaskById(taskId);
  syncTaskCenterOverlays();
  notifyTaskTrigger({
    type: "remove",
    task: null,
    previousTask: task,
  });
};

export const dismissTaskCenterTask = (taskId: string) => {
  const previousTask = getTaskCenterTask(taskId);
  dismissTaskOverlayInternal(taskId);
  syncTaskCenterOverlays();
  notifyTaskTrigger({
    type: "dismiss",
    task: getTaskCenterTask(taskId),
    previousTask,
  });
};

export const clearTaskCenterHistory = () => {
  const removedTasks = [...state.tasks]
    .filter((task) => !ACTIVE_STATUSES.has(task.status))
  removedTasks.forEach((task) => removeTaskById(task.id));
  syncTaskCenterOverlays();
  notifyTaskTrigger({
    type: "clear-history",
    task: null,
    tasks: removedTasks,
  });
};

export const clearTaskCenter = () => {
  const tasks = [...state.tasks];
  state.tasks = [];
  state.selectedTaskId = null;
  clearOverlayStack(TASK_CENTER_OVERLAY_SOURCE);
  notifyTaskTrigger({
    type: "clear",
    task: null,
    tasks,
  });
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
  payload: Partial<
    Pick<TaskCenterState, "maxVisible" | "maxHistory"> & {
      onTrigger: TaskCenterTriggerHandler;
    }
  >,
) => {
  if (typeof payload.maxVisible === "number" && payload.maxVisible > 0) {
    state.maxVisible = Math.round(payload.maxVisible);
    configureOverlayStack({ maxVisible: state.maxVisible });
  }
  if (typeof payload.maxHistory === "number" && payload.maxHistory > 0) {
    state.maxHistory = Math.round(payload.maxHistory);
    trimHistory();
  }
  if (typeof payload.onTrigger === "function") {
    registerTaskCenterTriggerHandler(payload.onTrigger);
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
