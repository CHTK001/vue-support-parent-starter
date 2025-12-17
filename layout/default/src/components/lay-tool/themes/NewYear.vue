<script setup lang="ts">
import BaseTool from './BaseTool.vue';
</script>

<template>
  <div class="new-year-tool-wrapper">
    <BaseTool theme-class="new-year-tool" />
  </div>
</template>

<style lang="scss" scoped>
$ny-blue: #1890ff;
$ny-purple: #722ed1;
$ny-gold: #ffd700;

.new-year-tool-wrapper {
  :deep(.new-year-tool) {
    // 工具栏按钮样式
    .tool-btn, .el-button {
      color: #fff;
      
      &:hover {
        color: $ny-gold;
        background: rgba(255, 255, 255, 0.1);
      }
    }
    
    // 下拉菜单样式
    .el-dropdown {
      color: #fff;
    }
  }
}
</style>
