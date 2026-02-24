<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useGlobal } from "@pureadmin/utils";
import Segmented, { type OptionsType } from "@repo/components/ReSegmented";
import ScSwitch from "@repo/components/ScSwitch/index.vue";
import { useSettings } from "../../composables/useSettings";

const { t } = useI18n();
const { $storage } = useGlobal<GlobalPropertiesApi>();
const { saveToStorage } = useSettings();
const doubleNavExpandMode = computed({
  get: () => $storage?.configure?.doubleNavExpandMode ?? "auto",
  set: (value: string) => {
    saveToStorage("doubleNavExpandMode", value);
  },
});

const doubleNavAutoExpandAll = computed({
  get: () => $storage?.configure?.doubleNavAutoExpandAll ?? true,
  set: (value: boolean) => {
    saveToStorage("doubleNavAutoExpandAll", value);
  },
});

const expandModeOptions = computed<Array<OptionsType>>(() => [
  { label: "自动展开", value: "auto" },
  { label: "手动控制", value: "manual" },
]);

const handleExpandModeChange = ({ option }: { option: OptionsType }) => {
  doubleNavExpandMode.value = option.value as string;
};

const currentExpandModeIndex = computed(() => {
  const index = expandModeOptions.value.findIndex(
    (opt) => opt.value === doubleNavExpandMode.value,
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
          展开策略
        </div>
        <Segmented
          resize
          class="select-none modern-segmented w-full"
          :modelValue="currentExpandModeIndex"
          :options="expandModeOptions"
          @change="handleExpandModeChange"
        />
      </div>
      <div
        v-if="doubleNavExpandMode === 'manual'"
        class="mt-4 pl-3 border-l-2 border-[var(--el-border-color-lighter)]"
      >
        <ScSwitch
          v-model="doubleNavAutoExpandAll"
          layout="visual-card"
          size="small"
          label="自动展开全部"
          description="手动模式下是否自动展开所有一级菜单"
          active-icon="ri:arrow-down-s-line"
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


