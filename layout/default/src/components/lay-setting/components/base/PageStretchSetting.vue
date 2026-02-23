<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useGlobal } from "@pureadmin/utils";
import Segmented, { type OptionsType } from "@repo/components/ReSegmented";

const { t } = useI18n();
const { $storage } = useGlobal<GlobalPropertiesApi>();

const pageWidthMode = computed({
  get: () => $storage?.configure?.pageWidthMode ?? "adaptive",
  set: (value: string) => {
    $storage.configure.pageWidthMode = value;
  },
});

const pageWidthModeOptions = computed<Array<OptionsType>>(() => [
  { label: "自适应宽度", value: "adaptive" },
  { label: "固定宽度", value: "fixed" },
  { label: "全宽铺满", value: "full" },
]);

const handlePageWidthModeChange = ({ option }: { option: OptionsType }) => {
  pageWidthMode.value = option.value as string;
};

const currentPageWidthModeIndex = computed(() => {
  const index = pageWidthModeOptions.value.findIndex(
    (opt) => opt.value === pageWidthMode.value,
  );
  return index >= 0 ? index : 0;
});
</script>

<template>
  <div class="setting-section">
    <div class="section-header">
      <IconifyIconOnline icon="ri:expand-horizontal-line" class="section-icon" />
      <h3 class="section-title">页面宽度</h3>
    </div>
    <div class="setting-content">
      <div class="mb-4">
        <div class="text-sm text-gray-600 dark:text-gray-400 mb-2">
          页面伸缩模式
        </div>
        <Segmented
          resize
          class="select-none modern-segmented w-full"
          :modelValue="currentPageWidthModeIndex"
          :options="pageWidthModeOptions"
          @change="handlePageWidthModeChange"
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


