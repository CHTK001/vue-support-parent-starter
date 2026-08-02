<script setup lang="ts">
/**
 * ReStatusIndicator —— 状态指示器（圆点 + 脉冲动画）
 *
 * 来源：整合自 scStatusIndicator。
 *  - 颜色映射 Element Plus 状态色（primary / success / warning / danger / info）
 *  - pulse=true 时开启扩散波纹动画（用于「加载中」/「运行中」等动态状态）
 */
withDefaults(
  defineProps<{
    /** 颜色类型，对应 Element Plus 主色系 */
    type?: "primary" | "success" | "warning" | "danger" | "info";
    /** 是否开启脉冲动画 */
    pulse?: boolean;
  }>(),
  {
    type: "primary",
    pulse: false,
  },
);

defineOptions({ name: "ReStatusIndicator", inheritAttrs: true });
</script>

<template>
  <span
    class="re-status"
    :class="[
      { 're-status--pulse': pulse },
      `re-status--${type}`,
    ]"
  />
</template>

<style scoped>
.re-status {
  display: inline-block;
  background: var(--el-text-color-primary);
  width: 8px;
  height: 8px;
  border-radius: 50%;
  vertical-align: middle;
}
.re-status--pulse {
  position: relative;
}
.re-status--pulse::after {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: inherit;
  content: "";
  animation: re-status-warn 1.2s ease-in-out infinite;
}
.re-status--primary { background: var(--el-color-primary); }
.re-status--success { background: var(--el-color-success); }
.re-status--warning { background: var(--el-color-warning); }
.re-status--danger  { background: var(--el-color-danger); }
.re-status--info    { background: var(--el-color-info); }

@keyframes re-status-warn {
  0% {
    transform: scale(0.5);
    opacity: 1;
  }
  30% {
    opacity: 0.7;
  }
  100% {
    transform: scale(2.5);
    opacity: 0;
  }
}
</style>