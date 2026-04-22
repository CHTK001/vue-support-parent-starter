import { reactive } from "vue";
import type {
  TaskCenterPersistContext,
  TaskCenterStatus,
  TaskCenterTriggerPayload,
  TaskCenterTriggerType,
} from "./types";

const TASK_CENTER_PERSIST_KEY = "layout:task-center:trigger-records";
const TASK_CENTER_PERSIST_LIMIT = 300;

const readStorage = () => {
  if (typeof window === "undefined" || !window.localStorage) {
    return null;
  }
  return window.localStorage;
};

export interface TaskCenterPersistRecord {
  eventId: string;
  timestamp: number;
  type: TaskCenterTriggerType;
  taskId?: string;
  requestId?: string | number;
  persist: TaskCenterPersistContext;
  title?: string;
  description?: string;
  latestMessage?: string;
  status?: TaskCenterStatus;
  progress?: number | null;
}

const readPersistRecords = () => {
  try {
    const storage = readStorage();
    if (!storage) {
      return [];
    }
    const raw = storage.getItem(TASK_CENTER_PERSIST_KEY);
    const records = raw ? JSON.parse(raw) : [];
    return Array.isArray(records) ? records : [];
  } catch {
    return [];
  }
};

const persistState = reactive<{
  records: TaskCenterPersistRecord[];
}>({
  records: readPersistRecords(),
});

const flushPersistRecords = () => {
  const storage = readStorage();
  if (!storage) {
    return;
  }
  storage.setItem(TASK_CENTER_PERSIST_KEY, JSON.stringify(persistState.records));
};

const toPersistRecord = (
  payload: TaskCenterTriggerPayload,
): TaskCenterPersistRecord => ({
  eventId: payload.eventId,
  timestamp: payload.timestamp,
  type: payload.type,
  taskId: payload.taskId,
  requestId: payload.requestId,
  persist: payload.persist,
  title: payload.task?.title ?? payload.previousTask?.title,
  description: payload.task?.description ?? payload.previousTask?.description,
  latestMessage:
    payload.task?.latestMessage ??
    payload.previousTask?.latestMessage ??
    payload.task?.messages?.[payload.task.messages.length - 1]?.content ??
    payload.previousTask?.messages?.[
      (payload.previousTask.messages?.length || 1) - 1
    ]?.content,
  status: payload.task?.status ?? payload.previousTask?.status,
  progress: payload.task?.progress ?? payload.previousTask?.progress,
});

export const appendTaskCenterPersistRecord = (
  payload: TaskCenterTriggerPayload,
) => {
  persistState.records = [
    toPersistRecord(payload),
    ...persistState.records,
  ].slice(0, TASK_CENTER_PERSIST_LIMIT);
  flushPersistRecords();
};

export const clearTaskCenterPersistRecords = () => {
  persistState.records = [];
  flushPersistRecords();
};

export const useTaskCenterPersistState = () => ({
  state: persistState,
  storageKey: TASK_CENTER_PERSIST_KEY,
  limit: TASK_CENTER_PERSIST_LIMIT,
});

export const persistTaskCenterTrigger = (payload: TaskCenterTriggerPayload) => {
  appendTaskCenterPersistRecord(payload);
};
