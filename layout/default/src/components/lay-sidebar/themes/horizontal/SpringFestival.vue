<script setup lang="ts">
import BaseHorizontal from './BaseHorizontal.vue';
import ThemeDecoration from '../../../ThemeDecoration.vue';
import { getComponentDecorations } from '../../../../themes/decorations';
import type { DecorationConfig } from '../../../../themes/decorations';
import { computed, ref, onMounted, onBeforeUnmount } from 'vue';
import { emitter } from '@repo/core';
import { localStorageProxy } from '@repo/utils';
import type { StorageConfigs } from '@repo/config';
import { responsiveStorageNameSpace } from '@repo/config';

// 当前主题
const currentTheme = ref<string>(
  localStorageProxy().getItem<StorageConfigs>(
    `${responsiveStorageNameSpace()}configure`
  )?.systemTheme || 'default'
);

// 获取装饰配置
const horizontalDecorations = computed<DecorationConfig[]>(() => {
  return getComponentDecorations(currentTheme.value, 'lay-sidebar');
});

onMounted(() => {
  emitter.on("systemThemeChange", (themeKey: string) => {
    currentTheme.value = themeKey;
  });
});

onBeforeUnmount(() => {
  emitter.off("systemThemeChange");
});
</script>

<template>
  <div class="spring-festival-horizontal-wrapper">
    <BaseHorizontal theme-class="spring-festival-horizontal" />
    
    <!-- 主题装饰元素 -->
    <ThemeDecoration
      v-for="(decoration, index) in horizontalDecorations"
      :key="`horizontal-decoration-${index}`"
      :config="decoration"
      :index="index"
      :visible="true"
    />
  </div>
</template>

<style lang="scss" scoped>
.spring-festival-horizontal-wrapper {
  width: 100%;
  height: 100%;
  position: relative;
}
</style>

<style lang="scss">
// 春节主题水平导航样式
html[data-skin="spring-festival"] {
  .spring-festival-horizontal {
    background: linear-gradient(180deg, #DC143C, #B22222) !important;
    border-bottom: 2px solid rgba(255, 215, 0, 0.3) !important;
    
    .horizontal-header-left {
      span {
        color: #FFD700 !important;
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
      }
    }
    
    .horizontal-header-menu {
      background: transparent !important;
      
      .el-menu-item,
      .el-sub-menu__title {
        color: rgba(255, 255, 255, 0.9) !important;
        
        &:hover {
          background: rgba(255, 215, 0, 0.15) !important;
          color: #FFD700 !important;
        }
        
        &.is-active {
          background: rgba(255, 215, 0, 0.2) !important;
          color: #FFD700 !important;
          border-bottom: 2px solid #FFD700;
        }
      }
    }
    
    .horizontal-header-right {
      color: rgba(255, 255, 255, 0.9);
    }
  }
}
</style>
