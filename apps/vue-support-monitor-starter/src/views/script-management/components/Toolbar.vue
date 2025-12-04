<template>
  <div class="toolbar">
    <div class="toolbar-left">
      <slot name="left" />
    </div>
    <div class="toolbar-right">
      <slot name="right" />
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 通用工具条组�?
 * 插槽：left/right
 */
</script>

<style scoped lang="scss">
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 14px;
  border: 1px solid rgba(226, 232, 240, 0.7);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.85), rgba(255, 255, 255, 0.75));
  backdrop-filter: blur(12px);
  box-shadow: 0 6px 20px rgba(15, 23, 42, 0.06);

  .toolbar-left,
  .toolbar-right {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  :deep(.el-button) {
    border-radius: 10px;
    font-weight: 500;
  }
}
</style>

