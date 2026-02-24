<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useDark, useGlobal } from "@pureadmin/utils";
import { useDataThemeChange } from "../../../../hooks/useDataThemeChange";
import { useThemeAnimation } from "../../../../hooks/useThemeAnimation";

const { t } = useI18n();
const { isDark } = useDark();
const { $storage } = useGlobal<GlobalPropertiesApi>();

const { themeColors, layoutTheme, setLayoutThemeColor } = useDataThemeChange();

// 判断当前是否为非默认主题（节日主题优先级高于整体/页签风格）
const isNonDefaultTheme = computed(() => {
  const currentTheme = $storage?.configure?.systemTheme || "default";
  return currentTheme !== "default";
});

// 当网页整体为暗色风格时不显示亮白色主题配色切换选项
const showThemeColors = computed(() => {
  return (themeColor: string) => {
    return themeColor === "light" && isDark.value ? false : true;
  };
});

// 主题色样式
const getThemeColorStyle = computed(() => {
  return (color: string) => {
    return { background: color };
  };
});

// 主题色激活边框颜色
const getThemeColor = computed(() => {
  return (current: string) => {
    if (!layoutTheme.value?.theme) {
      return "transparent";
    }
    if (current === layoutTheme.value.theme && layoutTheme.value.theme !== "light") {
      return "#fff";
    } else if (current === layoutTheme.value.theme && layoutTheme.value.theme === "light") {
      return "#1d2b45";
    } else {
      return "transparent";
    }
  };
});

const handleSetLayoutThemeColor = (themeKey: string, event: MouseEvent) => {
  useThemeAnimation(() => {
    setLayoutThemeColor(themeKey);
  }, event);
};
</script>

<template>
  <div v-if="!isNonDefaultTheme" class="setting-section">
    <div class="section-header">
      <IconifyIconOnline icon="ri:contrast-drop-2-line" class="section-icon" />
      <h3 class="section-title">
        {{ t("panel.pureThemeColor") }}
      </h3>
    </div>
    <div class="setting-content">
      <div class="theme-color-grid">
        <div
          v-for="item in themeColors"
          :key="item?.themeColor"
          v-if="item && item.themeColor && showThemeColors(item.themeColor)"
          class="theme-color-item"
          :style="getThemeColorStyle(item.color)"
          :class="{ 'is-selected': layoutTheme?.theme === item.themeColor }"
          @click="handleSetLayoutThemeColor(item.themeColor, $event)"
        >
          <div
            class="theme-color-indicator"
            :style="{ borderColor: getThemeColor(item.themeColor) }"
          />
        </div>
      </div>
    </div>
  </div>
</template>


