<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useGlobal } from "@pureadmin/utils";
import Segmented, { type OptionsType } from "@repo/components/ReSegmented";
import { useSettings } from "../../composables/useSettings";

const { t } = useI18n();
const { $storage } = useGlobal<GlobalPropertiesApi>();
const { saveToStorage } = useSettings();
const mobileNavMode = computed({
  get: () => $storage?.configure?.mobileNavMode ?? "drawer",
  set: (value: string) => {
    saveToStorage("mobileNavMode", value);
  },
});

const mobileNavPosition = computed({
  get: () => $storage?.configure?.mobileNavPosition ?? "left",
  set: (value: string) => {
    saveToStorage("mobileNavPosition", value);
  },
});

const mobileNavModeOptions = computed<Array<OptionsType>>(() => [
  { label: "抽屉导航", value: "drawer" },
  { label: "底部栏", value: "bottom-bar" },
  { label: "侧边栏", value: "sidebar" },
]);

const mobileNavPositionOptions = computed<Array<OptionsType>>(() => [
  { label: "左侧", value: "left" },
  { label: "右侧", value: "right" },
  { label: "底部", value: "bottom" },
]);

const handleModeChange = ({ option }: { option: OptionsType }) => {
  mobileNavMode.value = option.value as string;
};

const handlePositionChange = ({ option }: { option: OptionsType }) => {
  mobileNavPosition.value = option.value as string;
};

const currentModeIndex = computed(() => {
  const index = mobileNavModeOptions.value.findIndex(
    (opt) => opt.value === mobileNavMode.value,
  );
  return index >= 0 ? index : 0;
});

const currentPositionIndex = computed(() => {
  const index = mobileNavPositionOptions.value.findIndex(
    (opt) => opt.value === mobileNavPosition.value,
  );
  return index >= 0 ? index : 0;
});
</script>

<template>
  <div class="setting-section">
    <div class="section-header">
      <IconifyIconOnline icon="ri:smartphone-line" class="section-icon" />
      <h3 class="section-title">移动端导航</h3>
    </div>
    <div class="setting-content">
      <div class="mb-4">
        <div class="text-sm text-gray-600 dark:text-gray-400 mb-2">
          导航样式
        </div>
        <Segmented
          resize
          class="select-none modern-segmented w-full"
          :modelValue="currentModeIndex"
          :options="mobileNavModeOptions"
          @change="handleModeChange"
        />
      </div>
      <div class="mt-4">
        <div class="text-sm text-gray-600 dark:text-gray-400 mb-2">
          导航位置
        </div>
        <Segmented
          resize
          class="select-none modern-segmented w-full"
          :modelValue="currentPositionIndex"
          :options="mobileNavPositionOptions"
          @change="handlePositionChange"
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


