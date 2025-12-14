<script setup lang="ts">
import BaseSetting from './BaseSetting.vue';
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
const settingDecorations = computed<DecorationConfig[]>(() => {
  return getComponentDecorations(currentTheme.value, 'lay-setting');
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
  <div class="spring-festival-setting-wrapper">
    <BaseSetting />
    
    <!-- 主题装饰元素 -->
    <ThemeDecoration
      v-for="(decoration, index) in settingDecorations"
      :key="`setting-decoration-${index}`"
      :config="decoration"
      :index="index"
      :visible="true"
    />
  </div>
</template>

<style lang="scss" scoped>
.spring-festival-setting-wrapper {
  width: 100%;
  height: 100%;
  position: relative;
}
</style>

<style lang="scss">
// 先导入基础样式
@import './default.scss';
// 再导入春节主题覆盖样式
@import './spring-festival.scss';
</style>
