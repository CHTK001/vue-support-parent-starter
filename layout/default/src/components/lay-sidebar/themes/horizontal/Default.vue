<script setup lang="ts">
import BaseHorizontal from './BaseHorizontal.vue';
import DefaultSidebarItem from '../../components/themes/DefaultSidebarItem.vue';
</script>

<template>
  <BaseHorizontal 
    theme-class="default-horizontal" 
    :sidebar-item-component="DefaultSidebarItem" 
  />
</template>

<style lang="scss" scoped>
// 默认主题特定样式（如果需要）
</style>
