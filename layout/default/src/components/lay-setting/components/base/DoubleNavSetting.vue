<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useGlobal } from "@pureadmin/utils";
import Segmented, { type OptionsType } from "@repo/components/ReSegmented";

const { t } = useI18n();
const { $storage } = useGlobal<GlobalPropertiesApi>();

const doubleNavEnabled = computed({
  get: () => $storage?.configure?.doubleNavEnabled ?? false,
  set: (value: boolean) => {
    $storage.configure.doubleNavEnabled = value;
  },
});

const doubleNavMode = computed({
  get: () => $storage?.configure?.doubleNavMode ?? "classic",
  set: (value: string) => {
    $storage.configure.doubleNavMode = value;
  },
});

const doubleNavEnabledOptions = computed<Array<OptionsType>>(() => [
  { label: "关闭", value: "off" },
  { label: "开启", value: "on" },
]);

const doubleNavModeOptions = computed<Array<OptionsType>>(() => [
  { label: "经典双栏", value: "classic" },
  { label: "紧凑双栏", value: "compact" },
]);

const handleEnabledChange = ({ option }: { option: OptionsType }) => {
  doubleNavEnabled.value = option.value === "on";
};

const handleModeChange = ({ option }: { option: OptionsType }) => {
  doubleNavMode.value = option.value as string;
};

const currentEnabledIndex = computed(() => {
  return doubleNavEnabled.value ? 1 : 0;
});

const currentModeIndex = computed(() => {
  const index = doubleNavModeOptions.value.findIndex(
    (opt) => opt.value === doubleNavMode.value,
  );
  return index >= 0 ? index : 0;
});
</script>

<template>
  <div class="setting-section">
    <div class="section-header">
      <IconifyIconOnline icon="ri:layout-column-line" class="section-icon" />
      <h3 class="section-title">双栏导航</h3>
    </div>
    <div class="setting-content">
      <div class="mb-4">
        <div class="text-sm text-gray-600 dark:text-gray-400 mb-2">
          是否启用
        </div>
        <Segmented
          resize
          class="select-none modern-segmented w-full"
          :modelValue="currentEnabledIndex"
          :options="doubleNavEnabledOptions"
          @change="handleEnabledChange"
        />
      </div>
      <div v-if="doubleNavEnabled" class="mt-4">
        <div class="text-sm text-gray-600 dark:text-gray-400 mb-2">
          导航样式
        </div>
        <Segmented
          resize
          class="select-none modern-segmented w-full"
          :modelValue="currentModeIndex"
          :options="doubleNavModeOptions"
          @change="handleModeChange"
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


