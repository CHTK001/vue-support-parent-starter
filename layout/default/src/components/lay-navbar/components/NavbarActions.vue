<script setup lang="ts">
import LayTool from "../../lay-tool/index.vue";
</script>

<template>
  <div class="navbar-actions">
    <slot name="prepend" />
    <LayTool />
    <slot name="append" />
  </div>
</template>

<style lang="scss" scoped>
.navbar-actions {
  display: flex;
  align-items: center;
  gap: var(--dt-space-1);
  margin-left: auto;
  padding-right: var(--dt-space-4);
  height: 100%;
  flex-shrink: 0;

  // 左侧分隔线
  &::before {
    content: "";
    width: 1px;
    height: 20px;
    background: var(--dt-border-color);
    margin-right: var(--dt-space-2);
    flex-shrink: 0;
  }
}
</style>
