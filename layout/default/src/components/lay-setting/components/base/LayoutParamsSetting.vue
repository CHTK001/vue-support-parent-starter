<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useGlobal } from "@pureadmin/utils";
import Segmented, { type OptionsType } from "@repo/components/ReSegmented";

const { t } = useI18n();
const { $storage } = useGlobal<GlobalPropertiesApi>();

const contentPadding = computed({
  get: () => $storage?.configure?.contentPadding ?? "medium",
  set: (value: string) => {
    $storage.configure.contentPadding = value;
  },
});

const pageRadius = computed({
  get: () => $storage?.configure?.pageRadius ?? "medium",
  set: (value: string) => {
    $storage.configure.pageRadius = value;
  },
});

const contentPaddingOptions = computed<Array<OptionsType>>(() => [
  { label: "紧凑", value: "small" },
  { label: "适中", value: "medium" },
  { label: "宽松", value: "large" },
]);

const pageRadiusOptions = computed<Array<OptionsType>>(() => [
  { label: "直角", value: "none" },
  { label: "轻微圆角", value: "small" },
  { label: "中等圆角", value: "medium" },
  { label: "大圆角", value: "large" },
]);

const handleContentPaddingChange = ({ option }: { option: OptionsType }) => {
  contentPadding.value = option.value as string;
};

const handlePageRadiusChange = ({ option }: { option: OptionsType }) => {
  pageRadius.value = option.value as string;
};

const currentContentPaddingIndex = computed(() => {
  const index = contentPaddingOptions.value.findIndex(
    (opt) => opt.value === contentPadding.value,
  );
  return index >= 0 ? index : 1;
});

const currentPageRadiusIndex = computed(() => {
  const index = pageRadiusOptions.value.findIndex(
    (opt) => opt.value === pageRadius.value,
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
          内容内边距
        </div>
        <Segmented
          resize
          class="select-none modern-segmented w-full"
          :modelValue="currentContentPaddingIndex"
          :options="contentPaddingOptions"
          @change="handleContentPaddingChange"
        />
      </div>
      <div class="mt-4">
        <div class="text-sm text-gray-600 dark:text-gray-400 mb-2">
          页面圆角
        </div>
        <Segmented
          resize
          class="select-none modern-segmented w-full"
          :modelValue="currentPageRadiusIndex"
          :options="pageRadiusOptions"
          @change="handlePageRadiusChange"
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


