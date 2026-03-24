<script setup lang="ts">
import BaseCustomHorizontal from './BaseCustomHorizontal.vue';
import DefaultCustomSidebarItem from '../../components/custom-menu/themes/DefaultCustomSidebarItem.vue';

// 引入默认主题弹出层样式
import '../../components/custom-menu/themes/default.scss';
</script>

<template>
  <BaseCustomHorizontal 
    theme-class="default-horizontal" 
    popper-class="default-custom-popper"
    :sidebar-item-component="DefaultCustomSidebarItem" 
  />
</template>

<style lang="scss" scoped>
// 默认主题特定样式
</style>
