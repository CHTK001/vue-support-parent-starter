<template>
  <div
    class="spider-round-node"
    :class="[
      `is-${statusClass}`,
      { 'is-selected': selected },
    ]"
  >
    <Handle type="target" :position="Position.Top" class="spider-handle spider-handle--target" />
    <div class="spider-round-node__header">
      <span class="spider-round-node__icon" v-html="data.icon || '●'" />
      <span class="spider-round-node__title">{{ data.label }}</span>
    </div>
    <div v-if="data.typeLabel" class="spider-round-node__type">{{ data.typeLabel }}</div>
    <div class="spider-round-node__status-dot" />
    <Handle type="source" :position="Position.Bottom" class="spider-handle spider-handle--source" />
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { Handle, Position } from "@vue-flow/core";

defineOptions({ name: "RoundedRectangleNode" });

const props = defineProps<{
  id: string;
  data: {
    label: string;
    icon?: string;
    typeLabel?: string;
    runtimeStatus?: string;
    [key: string]: any;
  };
  selected?: boolean;
}>();

const statusClass = computed(() => {
  const s = props.data.runtimeStatus;
  if (!s) return "pending";
  switch (s) {
    case "RUNNING": return "running";
    case "SUCCESS": return "success";
    case "FAILED": return "failed";
    case "WAIT_MANUAL": return "wait-manual";
    default: return "pending";
  }
});
</script>

<style scoped>
.spider-round-node {
  position: relative;
  min-width: 160px;
  max-width: 240px;
  padding: 14px 18px;
  border-radius: 14px;
  border: 2px solid var(--spider-node-border, #d1d5db);
  background: var(--spider-node-bg, #ffffff);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
  transition: border-color 0.3s, box-shadow 0.3s;
  cursor: pointer;
}
.spider-round-node.is-selected {
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.25);
}
/* Status colors */
.spider-round-node.is-success {
  border-color: var(--spider-color-success, #22c55e);
  background: color-mix(in srgb, var(--spider-color-success, #22c55e) 6%, var(--spider-node-bg, #fff));
}
.spider-round-node.is-failed {
  border-color: var(--spider-color-error, #ef4444);
  background: color-mix(in srgb, var(--spider-color-error, #ef4444) 6%, var(--spider-node-bg, #fff));
}
.spider-round-node.is-wait-manual {
  border-color: var(--spider-color-warning, #eab308);
  background: color-mix(in srgb, var(--spider-color-warning, #eab308) 8%, var(--spider-node-bg, #fff));
  animation: spider-pulse-warning 2s ease-in-out infinite;
}
.spider-round-node.is-running {
  border-color: var(--spider-color-running, #3b82f6);
  background: color-mix(in srgb, var(--spider-color-running, #3b82f6) 6%, var(--spider-node-bg, #fff));
  animation: spider-pulse-running 1.5s ease-in-out infinite;
}
.spider-round-node.is-pending {
  border-color: var(--spider-node-border, #d1d5db);
  opacity: 0.7;
}

.spider-round-node__header {
  display: flex;
  align-items: center;
  gap: 8px;
}
.spider-round-node__icon {
  font-size: 18px;
  line-height: 1;
  color: var(--spider-text-secondary, #6b7280);
  flex-shrink: 0;
}
.spider-round-node__title {
  font-size: 14px;
  font-weight: 600;
  color: var(--spider-text-primary, #1f2937);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.spider-round-node__type {
  margin-top: 4px;
  font-size: 11px;
  color: var(--spider-text-tertiary, #9ca3af);
  line-height: 1.4;
}
.spider-round-node__status-dot {
  position: absolute;
  top: -5px;
  right: -5px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--spider-node-border, #d1d5db);
  border: 2px solid var(--spider-node-bg, #fff);
  transition: background 0.3s;
}
.is-success .spider-round-node__status-dot {
  background: var(--spider-color-success, #22c55e);
}
.is-failed .spider-round-node__status-dot {
  background: var(--spider-color-error, #ef4444);
}
.is-wait-manual .spider-round-node__status-dot {
  background: var(--spider-color-warning, #eab308);
}
.is-running .spider-round-node__status-dot {
  background: var(--spider-color-running, #3b82f6);
  animation: spider-dot-pulse 1.5s ease-in-out infinite;
}

.spider-handle {
  width: 10px;
  height: 10px;
  border: 2px solid var(--spider-node-border, #d1d5db);
  background: var(--spider-node-bg, #fff);
  border-radius: 50%;
  transition: background 0.3s, border-color 0.3s;
}
.spider-handle--target {
  top: -5px;
}
.spider-handle--source {
  bottom: -5px;
}
.is-success .spider-handle {
  border-color: var(--spider-color-success, #22c55e);
  background: var(--spider-color-success, #22c55e);
}
.is-failed .spider-handle {
  border-color: var(--spider-color-error, #ef4444);
  background: var(--spider-color-error, #ef4444);
}
.is-wait-manual .spider-handle {
  border-color: var(--spider-color-warning, #eab308);
  background: var(--spider-color-warning, #eab308);
}
.is-running .spider-handle {
  border-color: var(--spider-color-running, #3b82f6);
  background: var(--spider-color-running, #3b82f6);
  animation: spider-dot-pulse 1.5s ease-in-out infinite;
}

@keyframes spider-pulse-warning {
  0%, 100% { box-shadow: 0 0 0 0 rgba(234, 179, 8, 0.3); }
  50% { box-shadow: 0 0 0 6px rgba(234, 179, 8, 0); }
}
@keyframes spider-pulse-running {
  0%, 100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.3); }
  50% { box-shadow: 0 0 0 6px rgba(59, 130, 246, 0); }
}
@keyframes spider-dot-pulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.3); opacity: 0.7; }
}
</style>
