<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue";
import { useGlobal } from "@pureadmin/utils";
import { emitter, MonitorTopics, useConfigStore } from "@repo/core";
import {
  appendTaskCenterMessage,
  clearTaskCenterHistory,
  closeTaskCenterPanel,
  configureTaskCenter,
  dismissTaskCenterTask,
  finishTaskCenterTask,
  openTaskCenterPanel,
  removeTaskCenterTask,
  selectTaskCenterTask,
  upsertTaskCenterTask,
  useTaskCenterState,
} from "./service";
import type {
  TaskCenterMode,
  TaskCenterPosition,
  TaskCenterTaskInput,
} from "./types";

const POSITIONS: TaskCenterPosition[] = [
  "top-left",
  "top-center",
  "top-right",
  "left-center",
  "right-center",
  "bottom-left",
  "bottom-center",
  "bottom-right",
];

const statusLabelMap = {
  pending: "等待中",
  running: "进行中",
  success: "已完成",
  error: "失败",
  warning: "警告",
} as const;

const { $storage } = useGlobal<GlobalPropertiesApi>();
const configStore = useConfigStore();
const { state, sortedTasks, activeTasks, historyTasks, selectedTask } =
  useTaskCenterState();

const showTaskCenter = ref($storage?.configure?.showTaskCenter ?? true);
const activeSection = ref<"active" | "history">("active");

const panelTasks = computed(() =>
  activeSection.value === "active" ? activeTasks.value : historyTasks.value,
);

const summary = computed(() => ({
  running: activeTasks.value.length,
  total: sortedTasks.value.length,
  success: historyTasks.value.filter((item) => item.status === "success")
    .length,
  error: historyTasks.value.filter((item) => item.status === "error").length,
}));

const overlayTasksByPosition = computed(() =>
  POSITIONS.reduce<Record<TaskCenterPosition, typeof sortedTasks.value>>(
    (acc, position) => {
      acc[position] = sortedTasks.value
        .filter((item) => item.overlayVisible && item.position === position)
        .slice(0, state.maxVisible);
      return acc;
    },
    {
      "top-left": [],
      "top-center": [],
      "top-right": [],
      "left-center": [],
      "right-center": [],
      "bottom-left": [],
      "bottom-center": [],
      "bottom-right": [],
    },
  ),
);

const formatTime = (value?: number) =>
  value
    ? new Date(value).toLocaleTimeString("zh-CN", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    : "--";

const formatDateTime = (value?: number) =>
  value ? new Date(value).toLocaleString("zh-CN", { hour12: false }) : "--";

const formatElapsed = (startedAt: number, endedAt?: number) => {
  const diff = Math.max(0, (endedAt ?? Date.now()) - startedAt);
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  if (hours > 0) return `${hours}h ${String(minutes % 60).padStart(2, "0")}m`;
  if (minutes > 0)
    return `${minutes}m ${String(seconds % 60).padStart(2, "0")}s`;
  return `${seconds}s`;
};

const getStepLabel = (task: (typeof sortedTasks.value)[number]) => {
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

const getProgressWidth = (task: (typeof sortedTasks.value)[number]) =>
  `${Math.max(0, Math.min(100, task.progress ?? 0))}%`;

const openTask = (taskId: string) => {
  selectTaskCenterTask(taskId);
  openTaskCenterPanel();
};

const normalizeOperationTask = (
  payload: Record<string, any>,
): TaskCenterTaskInput => ({
  id: String(
    payload.operationId ??
      payload.taskId ??
      payload.id ??
      `${payload.title ?? payload.name ?? "task"}-${payload.type ?? "op"}`,
  ),
  requestId: payload.requestId ?? payload.reqId ?? payload.data?.requestId,
  title: payload.title ?? payload.name ?? "系统任务",
  description: payload.description ?? payload.type,
  message: payload.message ?? payload.error ?? payload.statusText,
  mode: (payload.message ? "stream" : "progress") as TaskCenterMode,
  progress: payload.progress ?? payload.percentage,
  current: payload.step,
  total: payload.total,
  stageLabel: payload.stageLabel,
  source: "socket" as const,
  meta: payload,
});

const bindSocketTopics = () => {
  const socket = configStore.getSocket();
  if (!socket) return () => undefined;

  const listeners: Array<[string, (payload: any) => void]> = [
    [
      MonitorTopics.OPERATION.PROGRESS,
      (payload) =>
        upsertTaskCenterTask({
          ...normalizeOperationTask(payload),
          status: "running",
          reopenOverlay: true,
        }),
    ],
    [
      MonitorTopics.OPERATION.UPDATE,
      (payload) =>
        upsertTaskCenterTask({
          ...normalizeOperationTask(payload),
          status: "running",
          mode: "stream",
          reopenOverlay: true,
        }),
    ],
    [
      MonitorTopics.OPERATION.COMPLETE,
      (payload) =>
        finishTaskCenterTask(
          String(payload.operationId ?? payload.taskId ?? payload.id),
          {
            title: payload.title ?? payload.name ?? "系统任务",
            message: payload.message ?? "任务执行完成",
            source: "socket",
            meta: payload,
          },
        ),
    ],
    [
      MonitorTopics.OPERATION.ERROR,
      (payload) =>
        upsertTaskCenterTask({
          ...normalizeOperationTask(payload),
          status: "error",
          mode: "stream",
          reopenOverlay: true,
        }),
    ],
    [
      MonitorTopics.DOCKER.START,
      (payload) =>
        upsertTaskCenterTask({
          id: `docker-${payload.operation ?? "task"}-${payload.imageName ?? payload.id ?? "unknown"}`,
          title: payload.title ?? `Docker ${payload.operation ?? "任务"}`,
          description: payload.imageName ?? payload.imageId,
          message: payload.message ?? "任务已开始",
          mode: "stream",
          status: "running",
          icon: "ri:box-3-line",
          source: "socket",
          meta: payload,
        }),
    ],
    [
      MonitorTopics.DOCKER.PROGRESS,
      (payload) =>
        upsertTaskCenterTask({
          id: `docker-${payload.operation ?? "task"}-${payload.imageName ?? payload.id ?? "unknown"}`,
          title: payload.title ?? `Docker ${payload.operation ?? "任务"}`,
          description: payload.imageName ?? payload.imageId,
          message: payload.status
            ? `${payload.status}${payload.progress ? ` · ${payload.progress}` : ""}`
            : payload.message,
          progress: payload.percentage,
          mode: "stream",
          status: "running",
          icon: "ri:box-3-line",
          source: "socket",
          meta: payload,
        }),
    ],
    [
      MonitorTopics.DOCKER.IMAGE_PULL_PROGRESS,
      (payload) =>
        upsertTaskCenterTask({
          id: `docker-pull-${payload.imageName ?? payload.imageId ?? payload.id ?? "unknown"}`,
          title:
            `拉取镜像 ${payload.imageName ?? payload.imageId ?? ""}`.trim(),
          description: payload.imageId,
          message: payload.message ?? "镜像拉取中",
          progress: payload.progress ?? payload.percentage,
          mode: "stream",
          status: "running",
          icon: "ri:download-cloud-line",
          source: "socket",
          meta: payload,
        }),
    ],
    [
      MonitorTopics.DOCKER.COMPLETE,
      (payload) =>
        finishTaskCenterTask(
          `docker-${payload.operation ?? "task"}-${payload.imageName ?? payload.id ?? "unknown"}`,
          {
            title: payload.title ?? `Docker ${payload.operation ?? "任务"}`,
            description: payload.imageName ?? payload.imageId,
            message: payload.message ?? "Docker 任务完成",
            icon: "ri:box-3-line",
            source: "socket",
            meta: payload,
          },
        ),
    ],
    [
      MonitorTopics.DOCKER.ERROR,
      (payload) =>
        upsertTaskCenterTask({
          id: `docker-${payload.operation ?? "task"}-${payload.imageName ?? payload.id ?? "unknown"}`,
          title: payload.title ?? `Docker ${payload.operation ?? "任务"}`,
          description: payload.imageName ?? payload.imageId,
          message: payload.errorMessage ?? payload.message ?? "Docker 任务失败",
          mode: "stream",
          status: "error",
          reopenOverlay: true,
          icon: "ri:box-3-line",
          source: "socket",
          meta: payload,
        }),
    ],
  ];

  listeners.forEach(([topic, handler]) => socket.on(topic, handler));
  return () => listeners.forEach(([topic]) => socket.off(topic));
};

const handleTaskCenterPush = (payload: TaskCenterTaskInput) => {
  const taskId = upsertTaskCenterTask(payload);
  if (!state.selectedTaskId) selectTaskCenterTask(taskId);
};

const handleTaskCenterChange = (value: boolean) => {
  showTaskCenter.value = value;
  if (!value) closeTaskCenterPanel();
};

const handleTaskCenterMessage = (payload: {
  taskId: string;
  message: string;
  level?: "info" | "success" | "warning" | "error";
}) => {
  appendTaskCenterMessage(payload.taskId, {
    content: payload.message,
    level: payload.level,
  });
};

let cleanupSocketListeners: (() => void) | undefined;

onMounted(() => {
  configureTaskCenter({ maxVisible: 4, maxHistory: 80 });
  emitter.on("showTaskCenterChange", handleTaskCenterChange);
  emitter.on("taskCenterPush", handleTaskCenterPush);
  emitter.on("taskCenterMessage", handleTaskCenterMessage);
  emitter.on("taskCenterRemove", removeTaskCenterTask);
  emitter.on("taskCenterOpen", openTaskCenterPanel);
  emitter.on("taskCenterClose", closeTaskCenterPanel);
  cleanupSocketListeners = bindSocketTopics();
});

onUnmounted(() => {
  emitter.off("showTaskCenterChange", handleTaskCenterChange);
  emitter.off("taskCenterPush", handleTaskCenterPush);
  emitter.off("taskCenterMessage", handleTaskCenterMessage);
  emitter.off("taskCenterRemove", removeTaskCenterTask);
  emitter.off("taskCenterOpen", openTaskCenterPanel);
  emitter.off("taskCenterClose", closeTaskCenterPanel);
  cleanupSocketListeners?.();
});
</script>

<template>
  <Teleport to="body">
    <div
      v-if="state.panelVisible && showTaskCenter"
      class="task-center-backdrop"
      @click="closeTaskCenterPanel"
    />

    <div v-if="showTaskCenter" class="task-center-overlay-root">
      <div
        v-for="position in POSITIONS"
        :key="position"
        class="task-center-stack"
        :class="`is-${position}`"
      >
        <TransitionGroup name="task-center-item">
          <article
            v-for="task in overlayTasksByPosition[position]"
            :key="task.id"
            class="task-center-card"
            :class="`is-${task.status}`"
            role="button"
            tabindex="0"
            @click="openTask(task.id)"
            @keydown.enter="openTask(task.id)"
            @keydown.space.prevent="openTask(task.id)"
          >
            <div class="task-center-card-top">
              <span class="task-center-card-title">
                <IconifyIconOnline
                  :icon="task.icon || 'mdi:lightning-bolt-outline'"
                />
                {{ task.title }}
              </span>
              <button
                v-if="task.closeable"
                class="task-center-icon-btn"
                type="button"
                @click.stop="dismissTaskCenterTask(task.id)"
              >
                <IconifyIconOnline icon="ri:close-line" />
              </button>
            </div>
            <div class="task-center-card-meta">
              <span>{{ statusLabelMap[task.status] }}</span>
              <span>{{ formatTime(task.updatedAt) }}</span>
            </div>
            <div class="task-center-progress">
              <div class="task-center-progress-track">
                <div
                  class="task-center-progress-fill"
                  :class="{
                    'is-indeterminate':
                      task.progress === null && task.status === 'running',
                  }"
                  :style="{ width: getProgressWidth(task) }"
                />
              </div>
              <span v-if="task.showPercent">{{
                task.progress === null ? "--" : `${task.progress}%`
              }}</span>
            </div>
            <div class="task-center-card-meta">
              <span>{{ getStepLabel(task) }}</span>
              <span>{{ formatElapsed(task.startedAt, task.endedAt) }}</span>
            </div>
            <div
              v-if="task.mode === 'stream' && task.messages.length > 0"
              class="task-center-log-list"
            >
              <div
                v-for="message in task.messages.slice(-3)"
                :key="message.id"
                class="task-center-log-row"
              >
                <span
                  class="task-center-log-dot"
                  :class="`is-${message.level}`"
                />
                <span>{{ message.content }}</span>
              </div>
            </div>
          </article>
        </TransitionGroup>
      </div>
    </div>

    <aside
      v-if="showTaskCenter"
      class="task-center-panel"
      :class="{ 'is-open': state.panelVisible }"
    >
      <div class="task-center-panel-header">
        <div>
          <div class="task-center-eyebrow">Task Center</div>
          <h3>统一任务中心</h3>
          <p>纯进度、消息流、自动叠放、自动关闭和 Socket 汇聚都在这里。</p>
        </div>
        <button
          class="task-center-icon-btn"
          type="button"
          @click="closeTaskCenterPanel"
        >
          <IconifyIconOnline icon="ri:close-line" />
        </button>
      </div>

      <div class="task-center-summary">
        <div class="task-center-summary-item">
          <span>运行中</span>
          <strong>{{ summary.running }}</strong>
        </div>
        <div class="task-center-summary-item">
          <span>失败</span>
          <strong>{{ summary.error }}</strong>
        </div>
        <div class="task-center-summary-item">
          <span>完成</span>
          <strong>{{ summary.success }}</strong>
        </div>
        <div class="task-center-summary-item">
          <span>总数</span>
          <strong>{{ summary.total }}</strong>
        </div>
      </div>

      <div class="task-center-panel-toolbar">
        <div class="task-center-tabs">
          <button
            class="task-center-tab"
            :class="{ 'is-active': activeSection === 'active' }"
            type="button"
            @click="activeSection = 'active'"
          >
            活跃任务
          </button>
          <button
            class="task-center-tab"
            :class="{ 'is-active': activeSection === 'history' }"
            type="button"
            @click="activeSection = 'history'"
          >
            历史记录
          </button>
        </div>
        <button
          v-if="historyTasks.length > 0"
          class="task-center-ghost-btn"
          type="button"
          @click="clearTaskCenterHistory"
        >
          清理历史
        </button>
      </div>

      <div v-if="panelTasks.length === 0" class="task-center-empty">
        <IconifyIconOnline icon="ri:inbox-archive-line" />
        <span>{{
          activeSection === "active" ? "当前没有活跃任务" : "暂时没有历史记录"
        }}</span>
      </div>

      <div v-else class="task-center-panel-body">
        <article
          v-for="task in panelTasks"
          :key="task.id"
          class="task-center-detail-card"
          :class="[
            `is-${task.status}`,
            { 'is-selected': task.id === selectedTask?.id },
          ]"
          @click="selectTaskCenterTask(task.id)"
        >
          <div class="task-center-card-top">
            <span class="task-center-card-title">
              <IconifyIconOnline
                :icon="task.icon || 'mdi:lightning-bolt-outline'"
              />
              {{ task.title }}
            </span>
            <div class="task-center-actions">
              <button
                class="task-center-icon-btn"
                type="button"
                @click.stop="dismissTaskCenterTask(task.id)"
              >
                <IconifyIconOnline icon="ri:eye-off-line" />
              </button>
              <button
                class="task-center-icon-btn"
                type="button"
                @click.stop="removeTaskCenterTask(task.id)"
              >
                <IconifyIconOnline icon="ri:delete-bin-7-line" />
              </button>
            </div>
          </div>
          <div class="task-center-card-meta">
            <span>{{ statusLabelMap[task.status] }}</span>
            <span>{{ formatDateTime(task.updatedAt) }}</span>
            <span>{{ formatElapsed(task.startedAt, task.endedAt) }}</span>
          </div>
          <p v-if="task.description" class="task-center-description">
            {{ task.description }}
          </p>
          <div class="task-center-progress">
            <div class="task-center-progress-track">
              <div
                class="task-center-progress-fill"
                :class="{
                  'is-indeterminate':
                    task.progress === null && task.status === 'running',
                }"
                :style="{ width: getProgressWidth(task) }"
              />
            </div>
            <span>{{
              task.progress === null ? "--" : `${task.progress}%`
            }}</span>
          </div>
          <div class="task-center-card-meta">
            <span>{{ getStepLabel(task) }}</span>
            <span>{{ task.position }}</span>
          </div>
          <div v-if="task.messages.length > 0" class="task-center-log-list">
            <div
              v-for="message in task.messages.slice(-Math.min(task.maxLogs, 8))"
              :key="message.id"
              class="task-center-log-row"
            >
              <span
                class="task-center-log-dot"
                :class="`is-${message.level}`"
              />
              <span class="task-center-log-time">{{
                formatTime(message.timestamp)
              }}</span>
              <span>{{ message.content }}</span>
            </div>
          </div>
        </article>
      </div>
    </aside>
  </Teleport>
</template>

<style scoped lang="scss">
.task-center-backdrop {
  position: fixed;
  inset: 0;
  z-index: 4990;
  background: rgba(8, 15, 26, 0.22);
  backdrop-filter: blur(4px);
}
.task-center-overlay-root {
  position: fixed;
  inset: 0;
  z-index: 4980;
  pointer-events: none;
}
.task-center-stack {
  position: fixed;
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: min(360px, calc(100vw - 28px));
  pointer-events: none;
}
.task-center-stack.is-top-left {
  top: 72px;
  left: 14px;
}
.task-center-stack.is-top-center {
  top: 72px;
  left: 50%;
  transform: translateX(-50%);
}
.task-center-stack.is-top-right {
  top: 72px;
  right: 14px;
}
.task-center-stack.is-left-center {
  top: 50%;
  left: 14px;
  transform: translateY(-50%);
}
.task-center-stack.is-right-center {
  top: 50%;
  right: 14px;
  transform: translateY(-50%);
}
.task-center-stack.is-bottom-left {
  left: 14px;
  bottom: 18px;
}
.task-center-stack.is-bottom-center {
  left: 50%;
  bottom: 18px;
  transform: translateX(-50%);
}
.task-center-stack.is-bottom-right {
  right: 14px;
  bottom: 18px;
}
.task-center-card,
.task-center-detail-card {
  border: 1px solid rgba(122, 142, 170, 0.18);
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 18px 38px rgba(20, 31, 51, 0.16);
  text-align: left;
}
.task-center-card {
  padding: 14px;
  pointer-events: auto;
  backdrop-filter: blur(18px);
}
.task-center-detail-card {
  padding: 14px;
  cursor: pointer;
}
.task-center-card.is-running,
.task-center-detail-card.is-running {
  --task-accent: #0f92ff;
}
.task-center-card.is-success,
.task-center-detail-card.is-success {
  --task-accent: #16a34a;
}
.task-center-card.is-error,
.task-center-detail-card.is-error {
  --task-accent: #dc2626;
}
.task-center-card.is-warning,
.task-center-detail-card.is-warning {
  --task-accent: #d97706;
}
.task-center-card.is-pending,
.task-center-detail-card.is-pending {
  --task-accent: #64748b;
}
.task-center-card.is-selected,
.task-center-detail-card.is-selected {
  border-color: color-mix(
    in srgb,
    var(--task-accent) 36%,
    rgba(122, 142, 170, 0.18)
  );
}
.task-center-card-top,
.task-center-card-meta,
.task-center-progress,
.task-center-panel-toolbar,
.task-center-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}
.task-center-card-title,
.task-center-tabs {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.task-center-card-title {
  font-weight: 700;
  color: #101828;
}
.task-center-card-meta,
.task-center-description,
.task-center-log-row,
.task-center-eyebrow,
.task-center-panel-header p {
  font-size: 12px;
  color: rgba(42, 58, 79, 0.78);
}
.task-center-card-meta {
  margin-top: 8px;
}
.task-center-progress {
  margin-top: 12px;
}
.task-center-progress span,
.task-center-log-time {
  font-size: 11px;
  color: rgba(42, 58, 79, 0.72);
}
.task-center-progress-track {
  position: relative;
  overflow: hidden;
  flex: 1;
  height: 8px;
  border-radius: 999px;
  background: rgba(148, 163, 184, 0.18);
}
.task-center-progress-fill {
  position: absolute;
  inset: 0 auto 0 0;
  border-radius: inherit;
  background: linear-gradient(
    90deg,
    color-mix(in srgb, var(--task-accent) 85%, white 15%),
    var(--task-accent)
  );
}
.task-center-progress-fill.is-indeterminate {
  width: 42% !important;
  animation: task-center-indeterminate 1.2s ease-in-out infinite;
}
.task-center-icon-btn,
.task-center-tab,
.task-center-ghost-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(120, 136, 160, 0.18);
  background: rgba(255, 255, 255, 0.72);
  color: rgba(33, 46, 62, 0.72);
}
.task-center-icon-btn {
  width: 30px;
  height: 30px;
  border-radius: 10px;
}
.task-center-tab,
.task-center-ghost-btn {
  padding: 8px 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
}
.task-center-tab.is-active {
  background: #fff;
  color: #0f172a;
  box-shadow: 0 10px 18px rgba(15, 23, 42, 0.08);
}
.task-center-log-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid rgba(148, 163, 184, 0.14);
}
.task-center-log-row {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 8px;
  align-items: flex-start;
}
.task-center-log-time + .task-center-log-time {
  display: none;
}
.task-center-detail-card .task-center-log-row {
  grid-template-columns: auto auto minmax(0, 1fr);
}
.task-center-log-dot {
  width: 7px;
  height: 7px;
  margin-top: 6px;
  border-radius: 50%;
  background: rgba(100, 116, 139, 0.48);
}
.task-center-log-dot.is-info {
  background: #0f92ff;
}
.task-center-log-dot.is-success {
  background: #16a34a;
}
.task-center-log-dot.is-warning {
  background: #d97706;
}
.task-center-log-dot.is-error {
  background: #dc2626;
}
.task-center-panel {
  position: fixed;
  top: 12px;
  right: 12px;
  bottom: 12px;
  width: min(440px, calc(100vw - 24px));
  z-index: 5000;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 18px;
  border: 1px solid rgba(148, 163, 184, 0.16);
  border-radius: 28px;
  background: rgba(248, 250, 252, 0.96);
  box-shadow: 0 28px 60px rgba(15, 23, 42, 0.24);
  backdrop-filter: blur(24px);
  transform: translateX(calc(100% + 20px));
  transition: transform 0.28s ease;
}
.task-center-panel.is-open {
  transform: translateX(0);
}
.task-center-panel-header h3 {
  margin: 6px 0 4px;
  font-size: 20px;
  color: #0f172a;
}
.task-center-eyebrow {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: rgba(15, 146, 255, 0.82);
}
.task-center-summary {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}
.task-center-summary-item {
  padding: 12px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.78);
  border: 1px solid rgba(148, 163, 184, 0.14);
}
.task-center-summary-item span {
  display: block;
  font-size: 11px;
  color: rgba(71, 85, 105, 0.72);
}
.task-center-summary-item strong {
  display: block;
  margin-top: 6px;
  font-size: 18px;
  color: #0f172a;
}
.task-center-tabs {
  padding: 4px;
  border-radius: 999px;
  background: rgba(148, 163, 184, 0.12);
}
.task-center-panel-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow: auto;
}
.task-center-empty {
  display: flex;
  min-height: 180px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  border: 1px dashed rgba(148, 163, 184, 0.3);
  border-radius: 22px;
  color: rgba(71, 85, 105, 0.78);
}
.task-center-item-enter-active,
.task-center-item-leave-active {
  transition: all 0.24s ease;
}
.task-center-item-enter-from,
.task-center-item-leave-to {
  opacity: 0;
  transform: translateY(8px) scale(0.98);
}

html.dark {
  .task-center-backdrop {
    background: rgba(2, 8, 23, 0.42);
  }

  .task-center-card,
  .task-center-detail-card,
  .task-center-panel {
    background: rgba(15, 23, 42, 0.9);
    border-color: rgba(148, 163, 184, 0.18);
    box-shadow: 0 24px 48px rgba(2, 8, 23, 0.42);
  }

  .task-center-card-title,
  .task-center-panel-header h3,
  .task-center-summary-item strong {
    color: #f8fafc;
  }

  .task-center-card-meta,
  .task-center-description,
  .task-center-log-row,
  .task-center-eyebrow,
  .task-center-panel-header p,
  .task-center-progress span,
  .task-center-log-time,
  .task-center-empty {
    color: #94a3b8;
  }

  .task-center-tabs {
    background: rgba(30, 41, 59, 0.88);
  }

  .task-center-tab {
    color: #94a3b8;
  }

  .task-center-tab.is-active {
    color: #f8fafc;
    background: rgba(var(--el-color-primary-rgb), 0.22);
  }

  .task-center-progress-track {
    background: rgba(71, 85, 105, 0.42);
  }

  .task-center-empty {
    border-color: rgba(148, 163, 184, 0.2);
  }
}

@keyframes task-center-indeterminate {
  0% {
    transform: translateX(-120%);
  }
  100% {
    transform: translateX(260%);
  }
}
@media (max-width: 768px) {
  .task-center-panel {
    top: 6px;
    right: 6px;
    bottom: 6px;
    width: calc(100vw - 12px);
  }
  .task-center-summary {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .task-center-stack {
    width: calc(100vw - 20px);
  }
  .task-center-stack.is-top-left,
  .task-center-stack.is-top-center,
  .task-center-stack.is-top-right {
    top: 64px;
    left: 10px;
    right: 10px;
    transform: none;
  }
  .task-center-stack.is-bottom-left,
  .task-center-stack.is-bottom-center,
  .task-center-stack.is-bottom-right,
  .task-center-stack.is-left-center,
  .task-center-stack.is-right-center {
    bottom: 10px;
    left: 10px;
    right: 10px;
    top: auto;
    transform: none;
  }
}
</style>
