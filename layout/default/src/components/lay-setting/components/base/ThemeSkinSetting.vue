<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useGlobal } from "@pureadmin/utils";
import { ElMessage } from "element-plus";
import { emitter } from "@repo/core";
import { getConfig } from "@repo/config";
import { layoutThemes, detectFestivalTheme } from "../../../../themes";
import { useDataThemeChange } from "../../../../hooks/useDataThemeChange";
import ScSwitch from "@repo/components/ScSwitch/index.vue";
import LayThemeSwitcher from "../../../lay-theme-switcher/index.vue";
import { storageConfigureChange } from "../../composables/useSettings";

const { t } = useI18n();
const { $storage } = useGlobal<GlobalPropertiesApi>();
const { dataTheme, dataThemeChange } = useDataThemeChange();

const systemTheme = computed(() => $storage?.configure?.systemTheme || "default");

const enableFestivalTheme = computed({
  get: () =>
    $storage?.configure?.enableFestivalTheme ??
    getConfig().EnableFestivalTheme ??
    false,
  set: (value: boolean) => {
    festivalThemeChange(value);
  },
});

function switchSystemTheme(themeKey: string, showMessage: boolean = true): void {
  const currentTheme = $storage?.configure?.systemTheme || "default";
  if (currentTheme === themeKey) {
    return;
  }

  const htmlEl = document.documentElement;
  htmlEl.setAttribute("data-skin", themeKey);

  if (themeKey !== "default") {
    dataTheme.value = false;
    dataThemeChange("light");
  }

  storageConfigureChange("systemTheme", themeKey as any);

  emitter.emit("systemThemeChange", themeKey);

  if (showMessage) {
    const theme = (layoutThemes as any[]).find(
      (item) => item.key === themeKey || item.themeColor === themeKey,
    );
    const themeName =
      themeKey === "default" ? "默认" : theme?.name || themeKey;
    ElMessage.success(`已切换到${themeName}主题`);
  }
}

function festivalThemeChange(value: boolean): void {
  storageConfigureChange("enableFestivalTheme", value);

  if (value) {
    const festivalTheme = detectFestivalTheme();
    if (festivalTheme && typeof festivalTheme === "object" && "key" in festivalTheme) {
      switchSystemTheme((festivalTheme as any).key, true);
    } else {
      switchSystemTheme("default", true);
    }
  } else {
    ElMessage.success(t("panel.festivalThemeDisabled"));
  }
}

function handleThemeChange(themeKey: string): void {
  switchSystemTheme(themeKey, true);
}
</script>

<template>
  <div class="setting-section">
    <div class="section-header">
      <IconifyIconOnline icon="ri:shirt-line" class="section-icon" />
      <h3 class="section-title">主题皮肤</h3>
    </div>
    <div class="setting-content">
      <div class="mb-4">
        <ScSwitch
          v-model="enableFestivalTheme"
          layout="visual-card"
          size="small"
          label="节日自动主题"
          description="在节日期间自动切换到对应节日主题"
          active-icon="ri:calendar-event-line"
        />
      </div>

      <LayThemeSwitcher
        :model-value="systemTheme"
        :persist="false"
        :show-meta="true"
        @change="handleThemeChange"
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


