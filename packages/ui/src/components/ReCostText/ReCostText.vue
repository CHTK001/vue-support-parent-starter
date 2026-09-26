<script setup lang="ts">
/**
 * ReCostText —— 请求耗时展示组件
 *
 * 按耗时阈值着色，便于在日志列表快速识别慢请求：
 *   - 绿色（快）：cost < fast（默认 300ms）
 *   - 黄色（中）：fast ≤ cost < slow（默认 1000ms）
 *   - 红色（慢）：cost ≥ slow
 *
 * 用法：
 *   <ReCostText :cost="row.sysLogCost" />
 *   <ReCostText :cost="c" :fast="200" :slow="800" />
 */
import { computed } from "vue";

const props = withDefaults(
  defineProps<{
    /** 耗时（毫秒），null/undefined 显示占位符 */
    cost?: number | null;
    /** 绿色上限：小于该值为绿色 */
    fast?: number;
    /** 红色下限：大于等于该值为红色，介于 fast~slow 为黄色 */
    slow?: number;
    /** 是否显示 ms 单位 */
    unit?: boolean;
  }>(),
  {
    cost: null,
    fast: 300,
    slow: 1000,
    unit: true,
  },
);

const level = computed(() => {
  if (props.cost === null || props.cost === undefined) return "";
  const c = Number(props.cost);
  if (Number.isNaN(c)) return "";
  if (c < props.fast) return "re-cost-text--fast";
  if (c < props.slow) return "re-cost-text--mid";
  return "re-cost-text--slow";
});
</script>

<template>
  <span class="re-cost-text" :class="level">
    <slot>
      <template v-if="cost === null || cost === undefined">-</template>
      <template v-else>{{ cost }}<small v-if="unit">ms</small></template>
    </slot>
  </span>
</template>

<style scoped>
.re-cost-text {
  font-variant-numeric: tabular-nums;
  font-weight: 600;
  font-size: 12px;
  white-space: nowrap;
}

.re-cost-text small {
  margin-left: 1px;
  font-weight: 500;
  opacity: 0.8;
}

.re-cost-text--fast {
  color: var(--el-color-success);
}

.re-cost-text--mid {
  color: var(--el-color-warning);
}

.re-cost-text--slow {
  color: var(--el-color-danger);
}
</style>
