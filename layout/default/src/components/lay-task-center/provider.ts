import { inject, provide, type ComputedRef, type InjectionKey } from "vue";
import {
  appendTaskCenterMessage,
  closeTaskCenterPanel,
  dismissTaskCenterTask,
  failTaskCenterTask,
  finishTaskCenterTask,
  openTaskCenterPanel,
  removeTaskCenterTask,
  resolveTaskCenterTaskId,
  toggleTaskCenterPanel,
  upsertTaskCenterTask,
  useTaskCenterState,
} from "./service";
import type {
  TaskCenterMessageInput,
  TaskCenterTask,
  TaskCenterTaskInput,
} from "./types";

export type TaskCenterReference = string | number;

export interface TaskCenterTaskHandle {
  readonly taskId: string;
  readonly requestId?: string | number;
  open(): void;
  dismiss(): void;
  update(patch: Omit<TaskCenterTaskInput, "id">): string;
  progress(
    progress: number,
    patch?: Omit<TaskCenterTaskInput, "id" | "progress">,
  ): string;
  message(message: string | TaskCenterMessageInput): string;
  success(patch?: Omit<TaskCenterTaskInput, "id" | "status">): string;
  error(patch?: Omit<TaskCenterTaskInput, "id" | "status">): string;
  remove(): void;
}

export interface TaskCenterProvider {
  readonly state: ReturnType<typeof useTaskCenterState>;
  readonly selectedTask: ComputedRef<TaskCenterTask | null>;
  addTask(input: TaskCenterTaskInput): TaskCenterTaskHandle;
  getTask(ref: TaskCenterReference): TaskCenterTask | null;
  getTaskId(ref: TaskCenterReference): string | null;
  updateTask(
    ref: TaskCenterReference,
    patch: Omit<TaskCenterTaskInput, "id">,
  ): string;
  updateProgress(
    ref: TaskCenterReference,
    progress: number,
    patch?: Omit<TaskCenterTaskInput, "id" | "progress">,
  ): string;
  appendMessage(
    ref: TaskCenterReference,
    message: string | TaskCenterMessageInput,
  ): string;
  finishTask(
    ref: TaskCenterReference,
    patch?: Omit<TaskCenterTaskInput, "id" | "status">,
  ): string;
  failTask(
    ref: TaskCenterReference,
    patch?: Omit<TaskCenterTaskInput, "id" | "status">,
  ): string;
  removeTask(ref: TaskCenterReference): void;
  openPanel(): void;
  closePanel(): void;
  togglePanel(): void;
}

export const TaskCenterProviderKey: InjectionKey<TaskCenterProvider> =
  Symbol("TaskCenterProvider");

const taskCenterState = useTaskCenterState();

const getTaskId = (ref: TaskCenterReference): string | null =>
  resolveTaskCenterTaskId(ref);

const getTask = (ref: TaskCenterReference): TaskCenterTask | null => {
  const taskId = getTaskId(ref);
  if (!taskId) {
    return null;
  }
  return (
    taskCenterState.sortedTasks.value.find((task) => task.id === taskId) ?? null
  );
};

const resolveRefInput = (ref: TaskCenterReference) => {
  const taskId = getTaskId(ref);
  if (taskId) {
    return { id: taskId };
  }

  if (typeof ref === "number") {
    return { requestId: ref };
  }

  return { id: String(ref), requestId: ref };
};

const updateTask = (
  ref: TaskCenterReference,
  patch: Omit<TaskCenterTaskInput, "id">,
) => upsertTaskCenterTask({ ...patch, ...resolveRefInput(ref) });

const updateProgress = (
  ref: TaskCenterReference,
  progress: number,
  patch: Omit<TaskCenterTaskInput, "id" | "progress"> = {},
) =>
  updateTask(ref, {
    ...patch,
    progress,
    status: progress >= 100 ? "success" : (patch.status ?? "running"),
  });

const appendMessage = (
  ref: TaskCenterReference,
  message: string | TaskCenterMessageInput,
) => {
  const taskId = getTaskId(ref);
  if (taskId) {
    return appendTaskCenterMessage(taskId, message);
  }

  const messageInput =
    typeof message === "string" ? { content: message } : message;
  return upsertTaskCenterTask({
    ...resolveRefInput(ref),
    mode: "stream",
    messages: [messageInput],
  });
};

const finishTask = (
  ref: TaskCenterReference,
  patch: Omit<TaskCenterTaskInput, "id" | "status"> = {},
) => {
  const taskId = getTaskId(ref);
  if (taskId) {
    return finishTaskCenterTask(taskId, patch);
  }
  return upsertTaskCenterTask({
    ...patch,
    ...resolveRefInput(ref),
    status: "success",
    progress: patch.progress ?? 100,
  });
};

const failTask = (
  ref: TaskCenterReference,
  patch: Omit<TaskCenterTaskInput, "id" | "status"> = {},
) => {
  const taskId = getTaskId(ref);
  if (taskId) {
    return failTaskCenterTask(taskId, patch);
  }
  return upsertTaskCenterTask({
    ...patch,
    ...resolveRefInput(ref),
    status: "error",
    reopenOverlay: true,
  });
};

const removeTask = (ref: TaskCenterReference) => {
  const taskId = getTaskId(ref);
  if (taskId) {
    removeTaskCenterTask(taskId);
  }
};

const createTaskHandle = (taskId: string): TaskCenterTaskHandle => ({
  get taskId() {
    return taskId;
  },
  get requestId() {
    return getTask(taskId)?.requestId;
  },
  open() {
    openTaskCenterPanel();
  },
  dismiss() {
    dismissTaskCenterTask(taskId);
  },
  update(patch) {
    return updateTask(taskId, patch);
  },
  progress(progress, patch = {}) {
    return updateProgress(taskId, progress, patch);
  },
  message(message) {
    return appendMessage(taskId, message);
  },
  success(patch = {}) {
    return finishTask(taskId, patch);
  },
  error(patch = {}) {
    return failTask(taskId, patch);
  },
  remove() {
    removeTask(taskId);
  },
});

export const taskCenterProvider: TaskCenterProvider = {
  state: taskCenterState,
  selectedTask: taskCenterState.selectedTask,
  addTask(input) {
    const taskId = upsertTaskCenterTask(input);
    return createTaskHandle(taskId);
  },
  getTask,
  getTaskId,
  updateTask,
  updateProgress,
  appendMessage,
  finishTask,
  failTask,
  removeTask,
  openPanel: openTaskCenterPanel,
  closePanel: closeTaskCenterPanel,
  togglePanel: toggleTaskCenterPanel,
};

export const provideTaskCenter = () => {
  provide(TaskCenterProviderKey, taskCenterProvider);
  return taskCenterProvider;
};

export const useTaskCenter = () =>
  inject(TaskCenterProviderKey, taskCenterProvider);
