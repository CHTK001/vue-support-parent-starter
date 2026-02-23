<script setup lang="ts">
import BaseSetting from './BaseSetting.vue';
</script>

<template>
  <div class="default-setting-wrapper">
    <BaseSetting />
  </div>
</template>

<style lang="scss">
html[data-skin="default"],
html.theme-default {
  .right-panel {
    // 默认主题保持原有样式，但确保所有功能都正常显示
    .setting-section {
      border-bottom: 1px solid var(--el-border-color-lighter);
      padding-bottom: 20px;
      margin-bottom: 20px;
    }
    
    .section-title {
      color: var(--el-text-color-primary);
    }
    
    .section-description {
      color: var(--el-text-color-regular);
    }
    
    .theme-color-item {
      border: 2px solid var(--el-border-color);
      transition: all 0.3s ease;
      
      &:hover {
        border-color: var(--el-color-primary);
        transform: scale(1.05);
      }
      
      &.is-selected {
        border-color: var(--el-color-primary);
        box-shadow: 0 0 0 2px var(--el-color-primary-light-9);
      }
    }
    
    .switch-card-item {
      border: 1px solid var(--el-border-color-lighter);
      transition: all 0.3s ease;
      
      &:hover {
        border-color: var(--el-color-primary);
        box-shadow: 0 2px 8px var(--el-color-primary-light-9);
      }
    }
  }
}
</style>
