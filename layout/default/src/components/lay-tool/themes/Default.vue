<script setup lang="ts">
import BaseTool from './BaseTool.vue';
</script>

<template>
  <div class="default-tool-wrapper">
    <BaseTool theme-class="default-tool" />
  </div>
</template>

<style lang="scss" scoped>
.default-tool-wrapper {
  :deep(.default-tool) {
    // 默认主题使用基础样式，无需额外覆盖
  }
}

.dark .default-tool-wrapper {
  :deep(.default-tool) {
    // 暗色模式适配
  }
}
</style>
