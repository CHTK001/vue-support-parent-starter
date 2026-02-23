<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useDark, useGlobal } from "@pureadmin/utils";
import Segmented, { type OptionsType } from "@repo/components/ReSegmented";
import { useDataThemeChange } from "../../../../hooks/useDataThemeChange";
import { useThemeAnimation } from "../../../../hooks/useThemeAnimation";
import DayIcon from "@repo/assets/svg/day.svg?component";
import DarkIcon from "@repo/assets/svg/dark.svg?component";
import SystemIcon from "@repo/assets/svg/system.svg?component";

const { t } = useI18n();
const { isDark } = useDark();
const { $storage } = useGlobal<GlobalPropertiesApi>();

const {
  dataTheme,
  overallStyle,
  dataThemeChange,
} = useDataThemeChange();

// 判断当前是否为非默认主题（节日主题优先级高于页签风格和整体风格）
const isNonDefaultTheme = computed(() => {
  const currentTheme = $storage?.configure?.systemTheme || "default";
  return currentTheme !== "default";
});

const mediaQueryList = window.matchMedia("(prefers-color-scheme: dark)");

/** 根据操作系统主题设置平台整体风格 */
function updateTheme() {
  if (overallStyle.value !== "system") return;
  if (mediaQueryList.matches) {
    dataTheme.value = true;
  } else {
    dataTheme.value = false;
  }
  dataThemeChange(overallStyle.value);
}

function removeMatchMedia() {
  mediaQueryList.removeEventListener("change", updateTheme);
}

/** 监听操作系统主题改变 */
function watchSystemThemeChange() {
  updateTheme();
  removeMatchMedia();
  mediaQueryList.addEventListener("change", updateTheme);
}

const handleOverallStyleChange = (theme: any) => {
  useThemeAnimation(() => {
    theme.index === 1 && theme.index !== 2
      ? (dataTheme.value = true)
      : (dataTheme.value = false);
    overallStyle.value = theme.option.theme;
    dataThemeChange(theme.option.theme);
    theme.index === 2 && watchSystemThemeChange();
  });
};

const themeOptions = computed<Array<OptionsType>>(() => [
  {
    label: t("panel.pureOverallStyleLight"),
    value: 0,
    icon: DayIcon,
    theme: "light",
    tip: t("panel.pureOverallStyleLightTip"),
    iconAttrs: { fill: isDark.value ? "#fff" : "#000" },
  },
  {
    label: t("panel.pureOverallStyleDark"),
    value: 1,
    icon: DarkIcon,
    theme: "dark",
    tip: t("panel.pureOverallStyleDarkTip"),
    iconAttrs: { fill: isDark.value ? "#fff" : "#000" },
  },
  {
    label: t("panel.pureOverallStyleSystem"),
    value: 2,
    icon: SystemIcon,
    theme: "system",
    tip: t("panel.pureOverallStyleSystemTip"),
    iconAttrs: { fill: isDark.value ? "#fff" : "#000" },
  },
]);
</script>

<template>
  <div v-if="!isNonDefaultTheme" class="setting-section">
    <div class="section-header">
      <IconifyIconOnline icon="ri:palette-line" class="section-icon" />
      <h3 class="section-title">{{ t("panel.pureOverallStyle") }}</h3>
    </div>
    <div class="setting-content">
      <Segmented
        resize
        class="select-none modern-segmented"
        :modelValue="overallStyle === 'system' ? 2 : dataTheme ? 1 : 0"
        :options="themeOptions"
        @change="handleOverallStyleChange"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.setting-section {
  margin-bottom: 24px;
}

.section-header {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
}

.section-icon {
  margin-right: 8px;
  font-size: 20px;
  color: var(--el-color-primary);
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}
</style>

