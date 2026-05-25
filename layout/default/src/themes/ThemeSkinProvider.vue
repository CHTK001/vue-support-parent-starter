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
  return themeKey;
};

const currentTheme = ref<string>(
  normalizeThemeKey($storage?.configure?.systemTheme),
);

const themeClasses = [
  "theme-default",
  "theme-tech",
];

/**
 * 计算动态样式
 */
const providerStyles = computed(() => {
  const isGlass = currentTheme.value === "glass";

  return {
    "--theme-transition": "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    "--glass-opacity": isGlass ? "0.7" : "1",
    "--glass-blur": isGlass ? "20px" : "0px",
    "--glass-border-color": isGlass
      ? "rgba(255, 255, 255, 0.18)"
      : "transparent",
    "--glass-shadow": isGlass ? "0 8px 32px 0 rgba(31, 38, 135, 0.37)" : "none",
  };
});

/**
 * 皮肤切换动画
 * 使用分帧处理，与主题色切换保持一致的体验
 */
const runInSkinSwitchFrame = async (
  fn: () => void,
  clearDelay = 120,
): Promise<void> => {
  const htmlEl = document.documentElement;
  htmlEl.classList.add("skin-switching");

  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => {
      fn();
      resolve();
    });
  });

  window.setTimeout(() => {
    htmlEl.classList.remove("skin-switching");
  }, clearDelay);
};

/**
 * 应用主题皮肤（带动画）
 * @param themeKey 主题键值
 */
const applyThemeSkin = (themeKey: string): void => {
  const normalizedTheme = normalizeThemeKey(themeKey);
  const htmlEl = document.documentElement;

  themeClasses.forEach((cls) => {
    htmlEl.classList.remove(cls);
  });

  htmlEl.classList.add(`theme-${normalizedTheme}`);
  if (htmlEl.getAttribute("data-skin") !== normalizedTheme) {
    htmlEl.setAttribute("data-skin", normalizedTheme);
  }
};

/**
 * 带动画的皮肤切换
 * @param themeKey 主题键值
 */
const applyThemeSkinWithAnimation = async (themeKey: string): Promise<void> => {
  await runInSkinSwitchFrame(() => {
    applyThemeSkin(themeKey);
  });
};

/**
 * 监听主题变化（带动画）
 */
watch(
  () => $storage?.configure?.systemTheme,
  (newTheme) => {
    if (newTheme) {
      const normalizedTheme = normalizeThemeKey(newTheme);
      currentTheme.value = normalizedTheme;
      applyThemeSkinWithAnimation(normalizedTheme);
    }
  },
);

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

}
</style>
