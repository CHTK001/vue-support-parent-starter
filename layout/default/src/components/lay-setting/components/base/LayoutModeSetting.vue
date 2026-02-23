<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useGlobal } from "@pureadmin/utils";
import Segmented, { type OptionsType } from "@repo/components/ReSegmented";

const { t } = useI18n();
const { $storage } = useGlobal<GlobalPropertiesApi>();

const layoutMode = computed({
  get: () => $storage?.configure?.layoutMode ?? "side",
  set: (value: string) => {
    $storage.configure.layoutMode = value;
  },
});

const layoutModeOptions = computed<Array<OptionsType>>(() => [
  { label: "侧边菜单", value: "side" },
  { label: "顶部菜单", value: "top" },
  { label: "混合菜单", value: "mix" },
]);

const handleLayoutModeChange = ({ option }: { option: OptionsType }) => {
  layoutMode.value = option.value as string;
};

const currentLayoutModeIndex = computed(() => {
  const index = layoutModeOptions.value.findIndex(
    (opt) => opt.value === layoutMode.value,
  );
  return index >= 0 ? index : 0;
});
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
          菜单布局
        </div>
        <Segmented
          resize
          class="select-none modern-segmented w-full"
          :modelValue="currentLayoutModeIndex"
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


