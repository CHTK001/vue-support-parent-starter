<script setup lang="ts">
import BaseHover from './BaseHover.vue';
</script>

<template>
  <div class="halloween-hover-wrapper">
    <BaseHover theme-class="halloween-hover" />
  </div>
</template>

<style lang="scss" scoped>
.halloween-hover-wrapper {
  height: 100%;
  width: 100%;
  
  :deep(.halloween-hover) {
    // 覆盖 BaseHover 中的样式 (如果有必要)
    // 大部分样式通过 CSS 变量在 hover-navigation-themes.scss 中定义
    
    // 可以在这里添加一些特殊的万圣节装饰效果
    position: relative;
    
    &::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 0;
      width: 100%;
      height: 2px;
      background: linear-gradient(90deg, #2c003e, #ff7518, #2c003e);
      z-index: 10;
    }
  }
}
</style>
