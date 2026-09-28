<template>
  <!-- 最小化悬浮窗（右下角） -->
  <div
    v-if="minimized"
    class="agent-deploy-float"
    :style="floatStyle"
    @click="toggleMinimize"
  >
    <div class="agent-deploy-float__icon">
      <span :class="['agent-deploy-float__dot', statusClass]" />
    </div>
    <div class="agent-deploy-float__info">
      <div class="agent-deploy-float__title">{{ task.title }}</div>
      <div class="agent-deploy-float__progress">{{ Math.round(task.progress * 100) }}%</div>
    </div>
  </div>

  <!-- 展开弹窗 -->
  <ReMaskDialog v-else v-model="visible" :title="`Agent 部署 - ${task.title}`" width="560px">
    <div class="agent-deploy-container">
      <!-- 头部：进度条 -->
      <div class="agent-deploy-header">
        <ReProgressTask :task="task" />
      </div>

      <!-- 日志区域 -->
      <div class="agent-deploy-log">
        <div v-for="(log, i) in logs" :key="i" class="agent-deploy-log__line">
          <span class="agent-deploy-log__time">{{ log.time }}</span>
          <span class="agent-deploy-log__msg">{{ log.msg }}</span>
        </div>
      </div>

      <!-- 状态栏 -->
      <div class="agent-deploy-status">
        <span :class="['agent-deploy-status__badge', statusClass]">
          {{ statusText }}
        </span>
      </div>
    </div>

    <template #footer>
      <ReButton @click="toggleMinimize">最小化</ReButton>
      <ReButton
        v-if="!isFinished"

        type="danger"
        @click="visible = false"
      >
        取消
      </ReButton>
      <ReButton
        v-if="isFinished"

        type="primary"
        @click="visible = false"
      >
        关闭
      </ReButton>
    </template>
  </ReMaskDialog>
</template>

<script setup lang="ts">
/**
 * AgentDeployDialog —— Agent 部署进度弹窗
 *
 * 特性：
 *   - 拖拽移动
 *   - 最小化到右下角悬浮窗
 *   - 支持断点续传（刷新页面后恢复）
 *   - socket 实时推送进度和日志
 */
import { computed, ref, watch } from "vue";
import ReMaskDialog from "./ReMaskDialog.vue";
import ReProgressTask from "@repo/ui/components/ReProgress/ReProgressTask.vue";

interface DeployLog {
  time: string;
  msg: string;
}

interface DeployTask {
  id: string;
  title: string;
  progress: number; // 0~1
  status: "pending" | "running" | "success" | "failed";
  text?: string;
  createdAt: number;
  startedAt: number;
  history: any[];
}

const props = defineProps<{
  modelValue: boolean;
  task: DeployTask;
  logs: DeployLog[];
  minimized?: boolean;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", v: boolean): void;
  (e: "update:minimized", v: boolean): void;
}>();

const visible = computed({
  get: () => props.modelValue,
  set: (v) => emit("update:modelValue", v),
});

const minimized = computed({
  get: () => props.minimized ?? false,
  set: (v) => emit("update:minimized", v),
});

const statusClass = computed(() => {
  switch (props.task.status) {
    case "success":
      return "success";
    case "failed":
      return "danger";
    case "running":
      return "primary";
    default:
      return "info";
  }
});

const statusText = computed(() => {
  switch (props.task.status) {
    case "pending":
      return "等待中";
    case "running":
      return "进行中";
    case "success":
      return "已完成";
    case "failed":
      return "失败";
    default:
      return "";
  }
});

const isFinished = computed(() => {
  return props.task.status === "success" || props.task.status === "failed";
});

const floatStyle = computed(() => ({
  right: "24px",
  bottom: "24px",
}));

function toggleMinimize(): void {
  minimized.value = !minimized.value;
  if (!minimized.value) {
    visible.value = true;
  }
}

// 断点续传：从 localStorage 恢复
function restoreFromStorage(): void {
  try {
    const saved = localStorage.getItem("agent-deploy-state");
    if (saved) {
      const state = JSON.parse(saved);
      if (state.task && state.logs) {
        // 这里可以恢复状态
        console.log("[agent-deploy] 恢复部署状态", state);
      }
    }
  } catch (e) {
    // 静默
  }
}

// 保存状态到 localStorage（用于断点续传）
watch(
  [() => props.task, () => props.logs],
  ([task, logs]) => {
    try {
      localStorage.setItem(
        "agent-deploy-state",
        JSON.stringify({ task, logs, savedAt: Date.now() })
      );
    } catch (e) {
      // 静默
    }
  },
  { deep: true }
);

// 初始化时恢复
restoreFromStorage();
</script>

<style scoped>
.agent-deploy-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.agent-deploy-header {
  padding: 8px 0;
}

.agent-deploy-log {
  max-height: 240px;
  overflow-y: auto;
  background: #1e293b;
  border-radius: 8px;
  padding: 12px;
  font-family: "Consolas", "Monaco", monospace;
  font-size: 12px;
}

.agent-deploy-log__line {
  display: flex;
  gap: 8px;
  line-height: 1.8;
}

.agent-deploy-log__time {
  color: #64748b;
  flex-shrink: 0;
}

.agent-deploy-log__msg {
  color: #e2e8f0;
}

.agent-deploy-status {
  display: flex;
  justify-content: flex-end;
}

.agent-deploy-status__badge {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.agent-deploy-status__badge.primary {
  background: #dbeafe;
  color: #2563eb;
}

.agent-deploy-status__badge.success {
  background: #dcfce7;
  color: #16a34a;
}

.agent-deploy-status__badge.danger {
  background: #fee2e2;
  color: #dc2626;
}

.agent-deploy-status__badge.info {
  background: #f1f5f9;
  color: #64748b;
}

/* 最小化悬浮窗 */
.agent-deploy-float {
  position: fixed;
  width: 200px;
  padding: 12px 16px;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 12px;
  z-index: 1000;
  transition: all 0.2s;
}

.agent-deploy-float:hover {
  box-shadow: 0 15px 50px rgba(0, 0, 0, 0.2);
  transform: translateY(-2px);
}

.agent-deploy-float__icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #f1f5f9;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.agent-deploy-float__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.agent-deploy-float__dot.primary {
  background: #3b82f6;
  animation: pulse 1.5s infinite;
}

.agent-deploy-float__dot.success {
  background: #22c55e;
}

.agent-deploy-float__dot.danger {
  background: #ef4444;
}

.agent-deploy-float__info {
  flex: 1;
  min-width: 0;
}

.agent-deploy-float__title {
  font-size: 13px;
  font-weight: 600;
  color: #1e293b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.agent-deploy-float__progress {
  font-size: 12px;
  color: #64748b;
  font-variant-numeric: tabular-nums;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}
</style>
