<template>
  <!-- 轨迹视图工具条：显示开关 + 概览指标 + 刷新 -->
  <div class="trace-toolbar">
    <div class="trace-stats">
      <span class="stat">
        <span class="stat-label">总耗时</span>
        <span class="stat-value">{{ formatDuration(totalMs) }}</span>
      </span>
      <span class="stat">
        <span class="stat-label">模型轮次</span>
        <span class="stat-value">{{ turnCount }}</span>
      </span>
      <span class="stat">
        <span class="stat-label">工具调用</span>
        <span class="stat-value">{{ callCount }}</span>
      </span>
    </div>

    <div class="trace-toggles">
      <!--
        运行选择器：轨迹表按会话累积，一次会话十几轮就铺成一根几十小时的轴。
        这里按 agent_start 把轨迹切成若干次运行，一次只看一段，默认最近一次。
      -->
      <div v-if="runCount > 1" class="trace-runs">
        <button
          type="button" class="trace-run-step" :disabled="runIndex >= runCount - 1"
          :aria-label="'更早的一次运行'" @click="$emit('pick-run', runIndex + 1)">‹</button>
        <span class="trace-run-label" :title="runTitle">
          第{{ runCount - runIndex }} / {{ runCount }} 次 · {{ runTitle }}
        </span>
        <button
          type="button" class="trace-run-step" :disabled="runIndex <= 0"
          :aria-label="'更新的一次运行'" @click="$emit('pick-run', runIndex - 1)">›</button>
      </div>
      <button
        v-for="item in toggles"
        :key="item.key"
        class="trace-toggle"
        :class="{ active: modelValue[item.key] }"
        type="button"
        :aria-pressed="modelValue[item.key]"
        @click="toggle(item.key)"
      >{{ item.label }}</button>

      <button
        class="trace-toggle trace-refresh"
        :class="{ 'is-loading': loading }"
        type="button"
        :disabled="loading"
        :aria-busy="loading"
        :title="loading ? '加载中…' : '重新加载'"
        @click="$emit('refresh')"
      >
        <svg class="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path
            d="M13.6 8a5.6 5.6 0 1 1-1.64-3.96M13.6 2.4V5.2H10.8"
            stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"
          />
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { formatDuration } from "./traceTypes";

type ToggleKey = "showDuration" | "showTurn" | "showCalls";

const props = defineProps<{
  modelValue: Record<ToggleKey, boolean>;
  totalMs: number;
  turnCount: number;
  callCount: number;
  loading: boolean;
  /**
   * 选中的运行下标，0 = 最近一次。
   *
   * 必填而非可选：模板里对它做算术（runIndex + 1 / runCount - runIndex），
   * 声明成可选会让这两处在严格模式下全部报「可能为 undefined」。
   * 唯一使用方 TracePanel 一直都有传（:run-index="runIndex"，那是 ref(0)，不会为 undefined），
   * 所以去掉问号是收窄契约、不改运行时行为，只是把「本来就一定传」这件事写进类型。
   */
  runIndex: number;
  /** 该会话共有几次运行 */
  runCount: number;
  /** 选中运行的起始墙钟时刻 */
  runTitle?: string;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: Record<ToggleKey, boolean>): void;
  (e: "refresh"): void;
  (e: "pick-run", index: number): void;
}>();

const toggles: ReadonlyArray<{ key: ToggleKey; label: string }> = [
  { key: "showDuration", label: "时长" },
  { key: "showTurn", label: "轮次" },
  { key: "showCalls", label: "调用" },
];

function toggle(key: ToggleKey) {
  emit("update:modelValue", { ...props.modelValue, [key]: !props.modelValue[key] });
}
</script>

<style scoped>
.trace-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 16px;
  border-bottom: 1px solid #e5e7eb;
}

.trace-stats {
  display: flex;
  align-items: baseline;
  gap: 16px;
}

.stat {
  display: inline-flex;
  align-items: baseline;
  gap: 6px;
}

.stat-label {
  color: #6b7280;
  font-size: 12px;
}

.stat-value {
  font-size: 13px;
  font-weight: 600;
  color: #111827;
  font-variant-numeric: tabular-nums;
}

.trace-toggles {
  display: flex;
  align-items: center;
  gap: 6px;
}

/* 运行切换：‹ 第2/4 次 · 22:25:27 › */
.trace-runs {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 0 2px;
  border: 1px solid #d1d5db;
  border-radius: 999px;
  background: #fff;
}

.trace-run-step {
  width: 20px;
  height: 20px;
  border: none;
  border-radius: 999px;
  background: transparent;
  color: #4b5563;
  font-size: 13px;
  line-height: 1;
  cursor: pointer;
}

.trace-run-step:hover:not(:disabled) {
  background: #f3f4f6;
}

.trace-run-step:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.trace-run-label {
  padding: 0 6px;
  font-size: 12px;
  color: #374151;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.trace-toggle {
  padding: 3px 10px;
  border: 1px solid #d1d5db;
  border-radius: 999px;
  background: #fff;
  color: #4b5563;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.trace-toggle:hover:not(:disabled) {
  border-color: #9ca3af;
}

.trace-toggle.active {
  background: #111827;
  border-color: #111827;
  color: #fff;
}

.trace-toggle:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.trace-refresh {
  display: inline-flex;
  align-items: center;
  padding: 4px 8px;
}

/* 加载中给图标加转圈：本机后端常在几十毫秒内返回，只靠置灰用户看不出在刷新 */
.trace-refresh.is-loading svg {
  animation: trace-spin 0.7s linear infinite;
}

@keyframes trace-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
