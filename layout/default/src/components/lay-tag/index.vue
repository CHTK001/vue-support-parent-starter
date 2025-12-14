<script setup lang="ts">
import { defineAsyncComponent } from "vue";
import { localStorageProxy } from "@repo/utils";
import type { StorageConfigs } from "@repo/config";
import { responsiveStorageNameSpace } from "@repo/config";

// 动态加载主题组件
function useThemeComponent() {
  const systemTheme = localStorageProxy().getItem<StorageConfigs>(
    `${responsiveStorageNameSpace()}configure`
  )?.systemTheme || 'default';
  
  const themeMap: Record<string, any> = {
    'spring-festival': defineAsyncComponent(() => import('./themes/SpringFestival.vue')),
    'default': defineAsyncComponent(() => import('./themes/Default.vue')),
  };
  
  return themeMap[systemTheme] || themeMap['default'];
}

const TagThemeComponent = useThemeComponent();

</script>

<template>
  <component :is="TagThemeComponent" />
</template>
