<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useGlobal } from "@pureadmin/utils";
import Segmented, { type OptionsType } from "@repo/components/ReSegmented";
import { storageConfigureChange } from "../../composables/useSettings";

const { t } = useI18n();
const { $storage } = useGlobal<GlobalPropertiesApi>();

const stretch = computed({
  get: () => Boolean($storage?.configure?.stretch),
  set: (value: boolean) => {
    storageConfigureChange("stretch", value);
  },
});

const stretchOptions = computed<Array<OptionsType>>(() => [
  { label: "默认", value: "off" },
  { label: "拉伸", value: "on" },
]);

const handleStretchChange = ({ option }: { option: OptionsType }) => {
  stretch.value = (option.value as string) === "on";
};

const currentStretchIndex = computed(() => (stretch.value ? 1 : 0));
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
          内容宽度
        </div>
        <Segmented
          resize
          class="select-none modern-segmented w-full"
          :modelValue="currentStretchIndex"
          :options="stretchOptions"
          @change="handleStretchChange"
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


