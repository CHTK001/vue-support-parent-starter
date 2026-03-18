<script setup lang="ts">
/**
 * HeaderWrapper — 头部容器
 * 封装 fixed（吸顶）和 scroll（随页面滚动）两种模式
 */
defineProps<{
  /** 是否固定在顶部 */
  fixed?: boolean;
}>();
</script>

<template>
  <div class="header-wrapper" :class="{ 'is-fixed': fixed }">
    <slot />
  </div>
</template>

<style lang="scss" scoped>
.header-wrapper {
  position: relative;
  width: 100%;
  z-index: var(--layout-z-navbar, 101);
  background: transparent;
  transition: box-shadow var(--dt-transition-normal);

  // fixed 模式：吸顶 + 毛玻璃阴影
  &.is-fixed {
    position: sticky;
    top: 0;
    box-shadow: 0 1px 0 var(--dt-border-color), var(--dt-shadow-sm);
  }
}
</style>
