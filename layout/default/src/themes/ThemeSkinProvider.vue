<template>
  <div :class="['theme-skin-provider', `theme-${currentTheme}`]">
    <slot />
  </div>
</template>

<script setup lang="ts">
/**
 * 主题皮肤提供者组件
 * @author CH
 * @date 2025-12-12
 * @version 1.0.0
 */

import { computed, onMounted, ref, watch } from "vue";
import { useGlobal } from "@pureadmin/utils";

//@ts-ignore
const { $storage } = useGlobal<GlobalPropertiesApi>();

/**
 * 当前主题皮肤
 */
const currentTheme = ref<string>($storage?.configure?.systemTheme ?? "default");

/**
 * 监听主题变化
 */
watch(
  () => $storage?.configure?.systemTheme,
  (newTheme) => {
    if (newTheme) {
      currentTheme.value = newTheme;
      applyThemeSkin(newTheme);
    }
  }
);

/**
 * 应用主题皮肤
 * @param themeKey 主题键值
 */
const applyThemeSkin = (themeKey: string): void => {
  const htmlEl = document.documentElement;

  // 移除所有主题类
  const themeClasses = [
    "theme-christmas",
    "theme-spring-festival",
    "theme-valentines-day",
    "theme-mid-autumn",
    "theme-national-day",
    "theme-new-year",
  ];

  themeClasses.forEach((cls) => {
    htmlEl.classList.remove(cls);
  });

  // 添加新主题类
  if (themeKey !== "default") {
    htmlEl.classList.add(`theme-${themeKey}`);
  }
};

/**
 * 初始化主题皮肤
 */
onMounted(() => {
  applyThemeSkin(currentTheme.value);
});
</script>

<style scoped lang="scss">
.theme-skin-provider {
  width: 100%;
  height: 100%;
}
</style>
