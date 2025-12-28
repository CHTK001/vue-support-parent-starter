<script setup lang="ts">
/**
 * 春节主题标签页
 * 支持根据当前主题动态应用不同样式
 */
import SpringFestivalTag from './SpringFestivalTag.vue';
import MidAutumnTag from './MidAutumnTag.vue';
import ChristmasTag from './ChristmasTag.vue';
import NewYearTag from './NewYearTag.vue';
import BaseTag from './BaseTag.vue';
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

// 根据主题获取对应的 Tag 组件
const tagComponent = computed(() => {
  switch (currentTheme.value) {
    case 'spring-festival':
      return SpringFestivalTag;
    case 'mid-autumn':
      return MidAutumnTag;
    case 'christmas':
      return ChristmasTag;
    case 'new-year':
      return NewYearTag;
    default:
      return BaseTag;
  }
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
    <!-- 根据当前主题动态选择标签组件 -->
    <component :is="tagComponent" />
  </div>
</template>

<style lang="scss" scoped>
.spring-festival-tag-wrapper {
  width: 100%;
}
</style>
