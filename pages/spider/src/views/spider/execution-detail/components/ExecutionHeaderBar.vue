<template>
  <header class="exec-header">
    <div class="exec-header__left">
      <button type="button" class="exec-header__back" title="返回" @click="$router.back()">
        <el-icon :size="16"><ArrowLeft /></el-icon>
      </button>
      <div class="exec-header__info">
        <h1 class="exec-header__title">{{ definitionName || "执行详情" }}</h1>
        <div class="exec-header__meta">
          <span class="exec-header__no">#{{ shortNo }}</span>
          <span class="exec-header__badge" :class="'is-' + statusClass">{{ statusLabel }}</span>
          <span class="exec-header__ts" v-if="startTime">开始 {{ startTime }}</span>
          <span class="exec-header__ts" v-if="duration">耗时 {{ duration }}</span>
        </div>
      </div>
    </div>
    <div class="exec-header__right">
      <div class="exec-header__progress" v-if="stepTotal > 0">
        <span class="exec-header__step-text">{{ stepDone }}/{{ stepTotal }} 已完成</span>
        <div class="exec-header__bar-track">
          <div class="exec-header__bar-fill" :style="{ width: progressPct + '%' }" />
        </div>
      </div>
      <label class="exec-header__debug-toggle" :class="{ 'is-active': modelValue }">
        <input type="checkbox" :checked="modelValue" @change="$emit('update:modelValue', ($event.target as HTMLInputElement).checked)" />
        <span class="exec-header__debug-track">
          <span class="exec-header__debug-dot" />
        </span>
        <span class="exec-header__debug-label">调试</span>
      </label>
      <button type="button" class="exec-header__refresh" @click="$emit('refresh')" title="刷新">
        <el-icon :size="16"><Refresh /></el-icon>
      </button>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ArrowLeft, Refresh } from "@element-plus/icons-vue";
import { computed } from "vue";

const props = defineProps<{
  definitionName?: string;
  executionNo?: string;
  status?: string;
  startTime?: string;
  duration?: string;
  stepDone?: number;
  stepTotal?: number;
  modelValue: boolean;
}>();

defineEmits<{
  (e: "update:modelValue", val: boolean): void;
  (e: "refresh"): void;
}>();

const shortNo = computed(() => props.executionNo ? "#" + props.executionNo.slice(-8) : "-");

const statusClass = computed(() => {
  switch (props.status) {
    case "RUNNING": return "running";
    case "SUCCESS": return "success";
    case "FAILED": return "failed";
    case "WAITING": return "waiting";
    default: return "unknown";
  }
});

const statusLabel = computed(() => {
  switch (props.status) {
    case "RUNNING": return "运行中";
    case "SUCCESS": return "已完成";
    case "FAILED": return "失败";
    case "WAITING": return "等待中";
    default: return props.status || "未知";
  }
});

const progressPct = computed(() => {
  if (props.stepTotal <= 0) return 0;
  return Math.round((props.stepDone / props.stepTotal) * 100);
});
</script>

<style scoped>
.exec-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 12px;
}
.exec-header__left {
  display: flex;
  align-items: center;
  gap: 12px;
}
.exec-header__back {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 8px;
  background: transparent;
  color: var(--el-text-color-secondary);
  cursor: pointer;
  transition: all 0.2s;
}
.exec-header__back:hover {
  border-color: rgba(34,211,238,0.2);
  color: var(--el-color-info);
}
.exec-header__info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.exec-header__title {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: var(--el-text-color-primary);
  letter-spacing: -0.02em;
}
.exec-header__meta {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.exec-header__no {
  font-size: 11px;
  font-weight: 600;
  color: var(--el-text-color-placeholder);
  font-family: "JetBrains Mono", "Fira Code", monospace;
}
.exec-header__badge {
  padding: 1px 10px;
  border-radius: 999px;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.3px;
  text-transform: uppercase;
}
.exec-header__badge.is-running {
  background: rgba(255,152,0,0.15);
  color: var(--el-color-warning);
  animation: badge-pulse 1.5s ease-in-out infinite;
}
.exec-header__badge.is-success {
  background: rgba(76,175,80,0.15);
  color: var(--el-color-success);
}
.exec-header__badge.is-failed {
  background: rgba(244,67,54,0.15);
  color: var(--el-color-danger);
}
.exec-header__badge.is-waiting {
  background: rgba(158,158,158,0.1);
  color: var(--el-text-color-secondary);
}
.exec-header__ts {
  font-size: 10px;
  color: var(--el-text-color-placeholder);
  font-variant-numeric: tabular-nums;
}
.exec-header__right {
  display: flex;
  align-items: center;
  gap: 16px;
}
.exec-header__progress {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 100px;
}
.exec-header__step-text {
  font-size: 10px;
  color: var(--el-text-color-secondary);
  font-weight: 500;
}
.exec-header__bar-track {
  height: 4px;
  border-radius: 2px;
  background: rgba(255,255,255,0.06);
  overflow: hidden;
}
.exec-header__bar-fill {
  height: 100%;
  border-radius: 2px;
  background: var(--el-color-info);
  transition: width 0.4s ease;
}
.exec-header__debug-toggle {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  user-select: none;
}
.exec-header__debug-toggle input {
  display: none;
}
.exec-header__debug-track {
  width: 36px;
  height: 20px;
  border-radius: 10px;
  background: rgba(255,255,255,0.08);
  position: relative;
  transition: background 0.2s;
  border: 1px solid rgba(255,255,255,0.06);
}
.exec-header__debug-toggle.is-active .exec-header__debug-track {
  background: rgba(34,211,238,0.2);
  border-color: rgba(34,211,238,0.3);
}
.exec-header__debug-dot {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: var(--el-text-color-placeholder);
  transition: all 0.2s;
}
.exec-header__debug-toggle.is-active .exec-header__debug-dot {
  left: 18px;
  background: var(--el-color-info);
  box-shadow: 0 0 6px rgba(34,211,238,0.5);
}
.exec-header__debug-label {
  font-size: 10px;
  font-weight: 600;
  color: var(--el-text-color-secondary);
  letter-spacing: 0.5px;
  text-transform: uppercase;
}
.exec-header__refresh {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 10px;
  background: transparent;
  color: var(--el-text-color-secondary);
  cursor: pointer;
  transition: all 0.2s;
}
.exec-header__refresh:hover {
  border-color: rgba(34,211,238,0.2);
  color: var(--el-color-info);
}
@keyframes badge-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}
</style>
