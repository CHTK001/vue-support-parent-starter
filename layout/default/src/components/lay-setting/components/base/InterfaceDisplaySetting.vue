<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useGlobal } from "@pureadmin/utils";
import Segmented, { type OptionsType } from "@repo/components/ReSegmented";

const { t } = useI18n();
const { $storage } = useGlobal<GlobalPropertiesApi>();

const showBreadcrumb = computed({
  get: () => $storage?.configure?.showBreadcrumb ?? true,
  set: (value: boolean) => {
    $storage.configure.showBreadcrumb = value;
  },
});

const showBreadcrumbIcon = computed({
  get: () => $storage?.configure?.showBreadcrumbIcon ?? true,
  set: (value: boolean) => {
    $storage.configure.showBreadcrumbIcon = value;
  },
});

const showTabs = computed({
  get: () => $storage?.configure?.showTabs ?? true,
  set: (value: boolean) => {
    $storage.configure.showTabs = value;
  },
});

const interfaceOptions = computed<Array<OptionsType>>(() => [
  { label: "显示", value: "show" },
  { label: "隐藏", value: "hide" },
]);

const toBoolean = (value: string) => value === "show";

const handleBreadcrumbChange = ({ option }: { option: OptionsType }) => {
  showBreadcrumb.value = toBoolean(option.value as string);
};

const handleBreadcrumbIconChange = ({ option }: { option: OptionsType }) => {
  showBreadcrumbIcon.value = toBoolean(option.value as string);
};

const handleTabsChange = ({ option }: { option: OptionsType }) => {
  showTabs.value = toBoolean(option.value as string);
};

const currentBreadcrumbIndex = computed(() =>
  showBreadcrumb.value ? 0 : 1,
);

const currentBreadcrumbIconIndex = computed(() =>
  showBreadcrumbIcon.value ? 0 : 1,
);

const currentTabsIndex = computed(() =>
  showTabs.value ? 0 : 1,
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
          :options="interfaceOptions"
          @change="handleBreadcrumbChange"
        />
      </div>
      <div class="mb-4">
        <div class="text-sm text-gray-600 dark:text-gray-400 mb-2">
          面包屑图标
        </div>
        <Segmented
          resize
          class="select-none modern-segmented w-full"
          :modelValue="currentBreadcrumbIconIndex"
          :options="interfaceOptions"
          @change="handleBreadcrumbIconChange"
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
          :options="interfaceOptions"
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


