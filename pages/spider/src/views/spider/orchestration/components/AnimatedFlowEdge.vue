<template>
  <path
    v-if="visible"
    :d="path"
    class="spider-animated-edge"
    :class="[`is-${statusClass}`, { 'is-traversed': isTraversed }]"
    fill="none"
    :stroke-width="isTraversed ? 2.5 : 1.5"
    stroke-linecap="round"
  />
</template>

<script setup lang="ts">
import { computed } from "vue";
import { getBezierPath, Position } from "@vue-flow/core";

const props = defineProps<{
  id: string;
  source: string;
  target: string;
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  sourcePosition?: Position;
  targetPosition?: Position;
  data?: {
    runtimeStatus?: string;
    visited?: boolean;
    [key: string]: any;
  };
  selected?: boolean;
}>();

const path = computed(() => {
  const [p] = getBezierPath({
    sourceX: props.sourceX,
    sourceY: props.sourceY,
    sourcePosition: props.sourcePosition || Position.Bottom,
    targetX: props.targetX,
    targetY: props.targetY,
    targetPosition: props.targetPosition || Position.Top,
  });
  return p;
});

const isTraversed = computed(() => props.data?.visited === true);

const statusClass = computed(() => {
  const s = props.data?.runtimeStatus;
  if (!s) return "default";
  switch (s) {
    case "RUNNING": return "running";
    case "SUCCESS": return "success";
    case "FAILED": return "failed";
    case "WAIT_MANUAL": return "wait-manual";
    default: return "default";
  }
});

const visible = computed(() => true);
</script>

<style scoped>
.spider-animated-edge {
  stroke: var(--spider-edge-color, #94a3b8);
  transition: stroke 0.3s;
}
/* Traversed edges (executed flow) */
.spider-animated-edge.is-traversed {
  stroke: var(--spider-edge-traversed, #6366f1);
  stroke-dasharray: 8 4;
  animation: spider-edge-flow 0.8s linear infinite;
}
/* Status-based coloring for traversed edges */
.spider-animated-edge.is-traversed.is-success {
  stroke: var(--spider-color-success, #22c55e);
}
.spider-animated-edge.is-traversed.is-failed {
  stroke: var(--spider-color-error, #ef4444);
}
.spider-animated-edge.is-traversed.is-wait-manual {
  stroke: var(--spider-color-warning, #eab308);
}
.spider-animated-edge.is-traversed.is-running {
  stroke: var(--spider-color-running, #3b82f6);
  stroke-dasharray: 10 6;
  animation: spider-edge-flow 0.6s linear infinite;
}

@keyframes spider-edge-flow {
  0% { stroke-dashoffset: 24; }
  100% { stroke-dashoffset: 0; }
}
</style>
