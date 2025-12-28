<script setup lang="ts">
/**
 * 圣诞主题标签页
 * 使用专属 ChristmasTag 组件，不依赖 showModel
 */
import ChristmasTag from './ChristmasTag.vue';
</script>

<template>
  <div class="christmas-tag-wrapper">
    <!-- 使用专属标签组件，不依赖 showModel -->
    <ChristmasTag />
  </div>
</template>

<style lang="scss" scoped>
.christmas-tag-wrapper {
  width: 100%;
}
</style>
