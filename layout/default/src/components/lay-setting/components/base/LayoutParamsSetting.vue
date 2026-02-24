<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useGlobal } from "@pureadmin/utils";
import Segmented, { type OptionsType } from "@repo/components/ReSegmented";
import { storageConfigureChange } from "../../composables/useSettings";

const { t } = useI18n();
const { $storage } = useGlobal<GlobalPropertiesApi>();

const contentMargin = computed({
  get: () => $storage?.configure?.contentMargin ?? 16,
  set: (value: number) => {
    storageConfigureChange("contentMargin", value);
    document.body.style.setProperty("--contentMargin", value + "px");
  },
});

const layoutRadius = computed({
  get: () => $storage?.configure?.layoutRadius ?? 10,
  set: (value: number) => {
    storageConfigureChange("layoutRadius", value);
    document.body.style.setProperty("--layoutRadius", value + "px");
  },
});

const contentMarginOptions = computed<Array<OptionsType>>(() => [
  { label: "紧凑", value: 12 },
  { label: "适中", value: 16 },
  { label: "宽松", value: 24 },
]);

const layoutRadiusOptions = computed<Array<OptionsType>>(() => [
  { label: "直角", value: 0 },
  { label: "轻微圆角", value: 6 },
  { label: "中等圆角", value: 10 },
  { label: "大圆角", value: 14 },
]);

const handleContentMarginChange = ({ option }: { option: OptionsType }) => {
  contentMargin.value = option.value as number;
};

const handleLayoutRadiusChange = ({ option }: { option: OptionsType }) => {
  layoutRadius.value = option.value as number;
};

const currentContentMarginIndex = computed(() => {
  const index = contentMarginOptions.value.findIndex(
    (opt) => opt.value === contentMargin.value,
  );
  return index >= 0 ? index : 1;
});

const currentLayoutRadiusIndex = computed(() => {
  const index = layoutRadiusOptions.value.findIndex(
    (opt) => opt.value === layoutRadius.value,
  );
  return index >= 0 ? index : 1;
});
</script>

<template>
  <div class="setting-section">
    <div class="section-header">
      <IconifyIconOnline icon="ri:layout-4-line" class="section-icon" />
      <h3 class="section-title">布局参数</h3>
    </div>
    <div class="setting-content">
      <div class="mb-4">
        <div class="text-sm text-gray-600 dark:text-gray-400 mb-2">
          内容边距
        </div>
        <Segmented
          resize
          class="select-none modern-segmented w-full"
          :modelValue="currentContentMarginIndex"
          :options="contentMarginOptions"
          @change="handleContentMarginChange"
        />
      </div>
      <div class="mt-4">
        <div class="text-sm text-gray-600 dark:text-gray-400 mb-2">
          布局圆角
        </div>
        <Segmented
          resize
          class="select-none modern-segmented w-full"
          :modelValue="currentLayoutRadiusIndex"
          :options="layoutRadiusOptions"
          @change="handleLayoutRadiusChange"
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


