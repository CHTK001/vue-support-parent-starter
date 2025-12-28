<script setup lang="ts">
/**
 * 新年主题 - 轻量版本
 * 使用 BaseTag + 背景插槽，代码复用度高
 */
import BaseTag from './BaseTag.vue';
import FireworksBackground from '../components/FireworksBackground.vue';
</script>

<template>
  <BaseTag 
    theme-class="new-year-lite-tag" 
    :use-custom-background="true"
  >
    <template #background>
      <FireworksBackground 
        :count="25" 
        :colors="['#4169E1', '#6495ED', '#87CEEB', '#FFD700', '#9370DB']" 
      />
    </template>
  </BaseTag>
</template>

<style lang="scss">
@use './default.scss';

// 新年主题特定样式覆盖
.new-year-lite-tag {
  background: linear-gradient(180deg, 
    rgba(65, 105, 225, 0.08) 0%, 
    rgba(100, 149, 237, 0.05) 100%) !important;
  border-top: 2px solid rgba(65, 105, 225, 0.3) !important;
}
</style>
