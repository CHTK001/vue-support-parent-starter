<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useGlobal } from "@pureadmin/utils";
import Segmented, { type OptionsType } from "@repo/components/ReSegmented";
import { useAppStoreHook } from "@repo/core";
import { useDataThemeChange } from "../../../../hooks/useDataThemeChange";

const { t } = useI18n();
const { $storage } = useGlobal<GlobalPropertiesApi>();

const { layoutTheme } = useDataThemeChange();

type LayoutType = "vertical" | "horizontal" | "mix" | "hover" | "double" | "mobile";

const layoutMode = computed<LayoutType>(() => {
  return (layoutTheme.value?.layout as LayoutType) || "vertical";
});

const layoutModeOptions = computed<Array<OptionsType>>(() => [
  { label: "侧边导航", value: "vertical" },
  { label: "顶部导航", value: "horizontal" },
  { label: "混合导航", value: "mix" },
  { label: "悬停导航", value: "hover" },
  { label: "双栏导航", value: "double" },
  { label: "移动端", value: "mobile" },
]);

function setLayoutMode(layout: LayoutType): void {
  const fallbackLayout: LayoutType = "vertical";
  const validLayouts: LayoutType[] = ["vertical", "horizontal", "mix", "hover", "double", "mobile"];
  const targetLayout = validLayouts.includes(layout) ? layout : fallbackLayout;

  if (!$storage?.layout) {
    return;
  }

  window.document.body.setAttribute("layout", targetLayout);
  $storage.layout = {
    ...$storage.layout,
    layout: targetLayout,
  };
  useAppStoreHook().setLayout(targetLayout);
}

const handleLayoutModeChange = ({ option }: { option: OptionsType }) => {
  setLayoutMode(option.value as LayoutType);
};

const currentLayoutModeValue = computed(() => layoutMode.value);
</script>

<template>
  <div class="setting-section">
    <div class="section-header">
      <IconifyIconOnline icon="ri:layout-4-line" class="section-icon" />
      <h3 class="section-title">布局模式</h3>
    </div>
    <div class="setting-content">
      <div class="mb-4">
        <div class="text-sm text-gray-600 dark:text-gray-400 mb-2">
          导航布局
        </div>
        <Segmented
          resize
          class="select-none modern-segmented w-full"
          :modelValue="currentLayoutModeValue"
          :options="layoutModeOptions"
          @change="handleLayoutModeChange"
        />
      </div>
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


