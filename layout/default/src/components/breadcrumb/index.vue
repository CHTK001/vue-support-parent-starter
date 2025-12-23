<script setup lang="ts">
import { ref, onBeforeUnmount, watch, computed } from "vue";
import { useGlobal } from "@pureadmin/utils";
import { emitter } from "@repo/core";
import DefaultBreadcrumb from "./themes/Default.vue";
import SpringFestivalBreadcrumb from "./themes/SpringFestival.vue";
import CyberpunkBreadcrumb from "./themes/Cyberpunk.vue";
import MidAutumnBreadcrumb from "./themes/MidAutumn.vue";
import ChristmasBreadcrumb from "./themes/Christmas.vue";
import NewYearBreadcrumb from "./themes/NewYear.vue";

const { $storage } = useGlobal<any>();

// 使用 computed 来响应式读取 storage 中的主题值
const storageTheme = computed(() => $storage?.configure?.systemTheme || 'default');
const currentTheme = ref<string>(storageTheme.value);

console.log('🍞 breadcrumb 初始主题:', currentTheme.value);

const handleThemeChange = (themeKey: string) => {
  console.log('🎨 breadcrumb 收到主题变化:', themeKey);
  currentTheme.value = themeKey;
};

// 监听 emitter 事件
emitter.on("systemThemeChange", handleThemeChange);

// 同时监听 storage 变化作为备用机制
watch(storageTheme, (newTheme) => {
  if (newTheme && newTheme !== currentTheme.value) {
    console.log('🔄 breadcrumb 检测到 storage 主题变化:', newTheme);
    currentTheme.value = newTheme;
  }
}, { immediate: false });

// 监听 data-skin 属性变化作为最终保障
const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (mutation.type === 'attributes' && mutation.attributeName === 'data-skin') {
      const newTheme = document.documentElement.getAttribute('data-skin') || 'default';
      if (newTheme !== currentTheme.value) {
        console.log('🔄 breadcrumb 检测到 data-skin 属性变化:', newTheme);
        currentTheme.value = newTheme;
      }
    }
  });
});

observer.observe(document.documentElement, {
  attributes: true,
  attributeFilter: ['data-skin']
});

onBeforeUnmount(() => {
  emitter.off("systemThemeChange", handleThemeChange);
  observer.disconnect();
});
</script>

<template>
  <DefaultBreadcrumb v-if="currentTheme === 'default'" />
  <SpringFestivalBreadcrumb v-else-if="currentTheme === 'spring-festival'" />
  <CyberpunkBreadcrumb v-else-if="currentTheme === 'cyberpunk'" />
  <MidAutumnBreadcrumb v-else-if="currentTheme === 'mid-autumn'" />
  <ChristmasBreadcrumb v-else-if="currentTheme === 'christmas'" />
  <NewYearBreadcrumb v-else-if="currentTheme === 'new-year'" />
  <DefaultBreadcrumb v-else />
</template>

<style lang="scss" scoped>
// 主题切换入口组件，无需特殊样式
</style>
