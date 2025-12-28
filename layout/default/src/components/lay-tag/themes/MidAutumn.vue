<script setup lang="ts">
/**
 * 中秋主题标签页
 * 使用专属 MidAutumnTag 组件，不依赖 showModel
 */
import MidAutumnTag from './MidAutumnTag.vue';
</script>

<template>
  <div class="mid-autumn-tag-wrapper">
    <!-- 使用专属标签组件，不依赖 showModel -->
    <MidAutumnTag />
  </div>
</template>

<style lang="scss" scoped>
.mid-autumn-tag-wrapper {
  width: 100%;
}
</style>
