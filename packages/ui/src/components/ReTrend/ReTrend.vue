<template>
  <span class="re-trend" :class="[colorClass, { 're-trend--up': isUp, 're-trend--down': isDown }]">
    <svg width="12" height="12" viewBox="0 0 12 12" class="re-trend__arrow">
      <polygon v-if="isUp" points="6,1 11,10 1,10" />
      <polygon v-if="isDown" points="6,11 1,2 11,2" />
    </svg>
    <span class="re-trend__label">{{ formatted }}%</span>
  </span>
</template>

<script setup lang="ts">
import { computed } from "vue";

interface Props {
  value: number;
  reverseColor?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  reverseColor: false,
});

const isUp = computed(() => props.value >= 0);
const isDown = computed(() => props.value < 0);

const formatted = computed(() => {
  const abs = Math.abs(props.value);
  return abs.toFixed(1);
});

const colorClass = computed(() => {
  if (props.value >= 0) {
    return props.reverseColor ? "color-down" : "color-up";
  }
  return props.reverseColor ? "color-up" : "color-down";
});
</script>

<style scoped>
.re-trend {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  font-size: 12px;
  font-weight: 500;
  line-height: 1;
}
.re-trend__arrow {
  flex-shrink: 0;
}
.re-trend.color-up {
  color: var(--el-color-success);
}
.re-trend.color-up .re-trend__arrow polygon {
  fill: var(--el-color-success);
}
.re-trend.color-down {
  color: var(--el-color-danger);
}
.re-trend.color-down .re-trend__arrow polygon {
  fill: var(--el-color-danger);
}
</style>
