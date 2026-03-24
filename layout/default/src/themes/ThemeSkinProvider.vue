<template>
  <div
    :class="['theme-skin-provider', `theme-${currentTheme}`]"
    :style="providerStyles"
  >
    <slot />
  </div>
</template>

<script setup lang="ts">
/**
 * 主题皮肤提供者组件 - 增强版
 * 支持动态 CSS 变量注入、Glassmorphism 效果和响应式主题切换
 */

import { computed, onMounted, ref, watch } from "vue";
import { useGlobal } from "@pureadmin/utils";

const { $storage } = useGlobal<GlobalPropertiesApi>();

/**
 * 主题 key 归一化（兼容旧值）
 * @param themeKey 原始主题 key
 */
const normalizeThemeKey = (themeKey?: string | null): string => {
  if (!themeKey) return "default";
  if (themeKey === "pixel-art" || themeKey === "8-bit") return "8bit";
  return themeKey;
};

const currentTheme = ref<string>(normalizeThemeKey($storage?.configure?.systemTheme));

/**
 * 计算动态样式
 */
const providerStyles = computed(() => {
  const isGlass = currentTheme.value === "glass";
  
  return {
    "--theme-transition": "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    "--glass-opacity": isGlass ? "0.7" : "1",
    "--glass-blur": isGlass ? "20px" : "0px",
    "--glass-border-color": isGlass ? "rgba(255, 255, 255, 0.18)" : "transparent",
    "--glass-shadow": isGlass ? "0 8px 32px 0 rgba(31, 38, 135, 0.37)" : "none",
  };
});

/**
 * 监听主题变化
 */
watch(
  () => $storage?.configure?.systemTheme,
  (newTheme) => {
    if (newTheme) {
      const normalizedTheme = normalizeThemeKey(newTheme);
      currentTheme.value = normalizedTheme;
      applyThemeSkin(normalizedTheme);
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
    "theme-halloween",
    "theme-8bit",
    "theme-future-tech",
  ];

  themeClasses.forEach((cls) => {
    htmlEl.classList.remove(cls);
  });

  // 添加新主题类
  if (themeKey !== "default") {
    htmlEl.classList.add(`theme-${themeKey}`);
  }
  
  // 设置 data-theme 属性，便于 CSS 选择器使用
  htmlEl.setAttribute("data-theme", themeKey);
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
  transition: var(--theme-transition);
  position: relative;
  
  // 基础背景色，可被主题覆盖
  background-color: var(--el-bg-color-page);
  color: var(--el-text-color-primary);
  
  // 确保子元素能够继承这些变量
  :deep(*) {
    transition: inherit;
  }
}
</style>
