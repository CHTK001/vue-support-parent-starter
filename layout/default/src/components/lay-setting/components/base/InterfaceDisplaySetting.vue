<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useGlobal } from "@pureadmin/utils";
import Segmented, { type OptionsType } from "@repo/components/ReSegmented";
import { useSettings } from "../../composables/useSettings";

const { t } = useI18n();
const { $storage } = useGlobal<GlobalPropertiesApi>();
const { saveToStorage } = useSettings();
const showBreadcrumb = computed({
  get: () => $storage?.configure?.showBreadcrumb ?? true,
  set: (value: boolean) => {
    saveToStorage("showBreadcrumb", value);
  },
});

const breadcrumbIconOnly = computed({
  get: () => $storage?.configure?.breadcrumbIconOnly ?? false,
  set: (value: boolean) => {
    saveToStorage("breadcrumbIconOnly", value);
  },
});

const hideTabs = computed({
  get: () => $storage?.configure?.hideTabs ?? false,
  set: (value: boolean) => {
    saveToStorage("hideTabs", value);
  },
});

const displayOptions = computed<Array<OptionsType>>(() => [
  { label: "显示", value: "show" },
  { label: "隐藏", value: "hide" },
]);

const breadcrumbIconOptions = computed<Array<OptionsType>>(() => [
  { label: "图标+文字", value: "icon-text" },
  { label: "仅图标", value: "icon" },
]);

const toBoolean = (value: string) => value === "show";

const handleBreadcrumbChange = ({ option }: { option: OptionsType }) => {
  showBreadcrumb.value = toBoolean(option.value as string);
};

const handleBreadcrumbIconOnlyChange = ({ option }: { option: OptionsType }) => {
  breadcrumbIconOnly.value = (option.value as string) === "icon";
};

const handleTabsChange = ({ option }: { option: OptionsType }) => {
  hideTabs.value = (option.value as string) === "hide";
};

const currentBreadcrumbIndex = computed(() =>
  showBreadcrumb.value ? 0 : 1,
);

const currentBreadcrumbIconOnlyIndex = computed(() =>
  breadcrumbIconOnly.value ? 1 : 0,
);

const currentTabsIndex = computed(() =>
  hideTabs.value ? 1 : 0,
);
</script>

<template>
  <div class="setting-section">
    <div class="section-header">
      <IconifyIconOnline icon="ri:layout-row-line" class="section-icon" />
      <h3 class="section-title">界面显示</h3>
    </div>
    <div class="setting-content">
      <div class="mb-4">
        <div class="text-sm text-gray-600 dark:text-gray-400 mb-2">
          面包屑
        </div>
        <Segmented
          resize
          class="select-none modern-segmented w-full"
          :modelValue="currentBreadcrumbIndex"
          :options="displayOptions"
          @change="handleBreadcrumbChange"
        />
      </div>
      <div class="mb-4">
        <div class="text-sm text-gray-600 dark:text-gray-400 mb-2">
          面包屑显示方式
        </div>
        <Segmented
          resize
          class="select-none modern-segmented w-full"
          :modelValue="currentBreadcrumbIconOnlyIndex"
          :options="breadcrumbIconOptions"
          @change="handleBreadcrumbIconOnlyChange"
        />
      </div>
      <div class="mb-4">
        <div class="text-sm text-gray-600 dark:text-gray-400 mb-2">
          标签栏
        </div>
        <Segmented
          resize
          class="select-none modern-segmented w-full"
          :modelValue="currentTabsIndex"
          :options="displayOptions"
          @change="handleTabsChange"
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


