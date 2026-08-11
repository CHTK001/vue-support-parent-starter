<!--
  ReStateDot —— 状态圆点（连接 / 加载 / 错误 / 离线）
  设计风格：低饱和度语义色 · ElPlus CSS 变量驱动
  Props:
    - state: connected | connecting | error | disconnected | idle
    - pulse: 是否脉冲动画（连接中提示）
-->
<template>
  <span
    class="re-state-dot"
    :class="[`re-state-dot--${state}`, { 're-state-dot--pulse': pulse }]"
    role="status"
    :aria-label="ariaLabel"
  />
</template>

<script setup lang="ts">
import { computed } from "vue";

type State = "connected" | "connecting" | "error" | "disconnected" | "idle";

const props = withDefaults(
  defineProps<{
    state: State;
    pulse?: boolean;
  }>(),
  { pulse: false },
);

const ariaLabel = computed(() => {
  switch (props.state) {
    case "connected": return "已连接";
    case "connecting": return "连接中";
    case "error": return "错误";
    case "disconnected": return "未连接";
    default: return "空闲";
  }
});

defineOptions({ name: "ReStateDot", inheritAttrs: true });
</script>

<style scoped>
.re-state-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--el-text-color-placeholder);
  vertical-align: middle;
  flex-shrink: 0;
}

.re-state-dot--connected {
  background: var(--el-color-success);
}

.re-state-dot--connecting {
  background: var(--el-color-warning);
}

.re-state-dot--error {
  background: var(--el-color-danger);
}

.re-state-dot--pulse {
  animation: re-state-dot-pulse 1.6s ease-in-out infinite;
}

@keyframes re-state-dot-pulse {
  0%, 100% {
    box-shadow: 0 0 0 0 var(--el-color-warning-light-9);
    opacity: 1;
  }
  50% {
    box-shadow: 0 0 0 6px transparent;
    opacity: 0.7;
  }
}

@media (prefers-reduced-motion: reduce) {
  .re-state-dot--pulse {
    animation: none;
  }
}
</style>
