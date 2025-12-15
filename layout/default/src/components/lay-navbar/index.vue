<script setup lang="ts">
import { ref, onBeforeUnmount, watch, computed } from "vue";
import { useGlobal } from "@pureadmin/utils";
import { emitter } from "@repo/core";
import DefaultNavbar from "./themes/Default.vue";
import SpringFestivalNavbar from "./themes/SpringFestival.vue";
import CyberpunkNavbar from "./themes/Cyberpunk.vue";
import MidAutumnNavbar from "./themes/MidAutumn.vue";
import ChristmasNavbar from "./themes/Christmas.vue";

const { $storage } = useGlobal<any>();

// 使用 computed 来响应式读取 storage 中的主题值
const storageTheme = computed(() => $storage?.configure?.systemTheme || 'default');
const currentTheme = ref<string>(storageTheme.value);

console.log('🚀 lay-navbar 初始主题:', currentTheme.value);

const handleThemeChange = (themeKey: string) => {
  console.log('🎨 lay-navbar 收到主题变化:', themeKey);
  currentTheme.value = themeKey;
};

// 监听 emitter 事件
emitter.on("systemThemeChange", handleThemeChange);

// 同时监听 storage 变化作为备用机制，确保主题能实时更新
watch(storageTheme, (newTheme) => {
  if (newTheme && newTheme !== currentTheme.value) {
    console.log('🔄 lay-navbar 检测到 storage 主题变化:', newTheme);
    currentTheme.value = newTheme;
  }
}, { immediate: false });

// 监听 data-skin 属性变化作为最终保障
const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (mutation.type === 'attributes' && mutation.attributeName === 'data-skin') {
      const newTheme = document.documentElement.getAttribute('data-skin') || 'default';
      if (newTheme !== currentTheme.value) {
        console.log('🔄 lay-navbar 检测到 data-skin 属性变化:', newTheme);
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
  <DefaultNavbar v-if="currentTheme === 'default'" />
  <SpringFestivalNavbar v-else-if="currentTheme === 'spring-festival'" />
  <CyberpunkNavbar v-else-if="currentTheme === 'cyberpunk'" />
  <MidAutumnNavbar v-else-if="currentTheme === 'mid-autumn'" />
  <ChristmasNavbar v-else-if="currentTheme === 'christmas'" />
  <DefaultNavbar v-else />
</template>
