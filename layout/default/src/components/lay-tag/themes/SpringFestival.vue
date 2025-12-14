<script setup lang="ts">
import BaseTag from './BaseTag.vue';
import ThemeDecoration from '../../ThemeDecoration.vue';
import { getComponentDecorations } from '../../../themes/decorations';
import type { DecorationConfig } from '../../../themes/decorations';
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
const tagDecorations = computed<DecorationConfig[]>(() => {
  return getComponentDecorations(currentTheme.value, 'lay-tag');
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
  <div class="spring-festival-tag-wrapper">
    <BaseTag theme-class="spring-festival-tag" />
    
    <!-- 主题装饰元素 -->
    <ThemeDecoration
      v-for="(decoration, index) in tagDecorations"
      :key="`tag-decoration-${index}`"
      :config="decoration"
      :index="index"
      :visible="true"
    />
  </div>
</template>

<style lang="scss" scoped>
.spring-festival-tag-wrapper {
  width: 100%;
  height: 100%;
}
</style>

<style lang="scss">
// 先导入基础样式
@import './default.scss';
// 再导入春节主题覆盖样式
@import './spring-festival.css';
</style>
