<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useGlobal } from "@pureadmin/utils";
import Segmented, { type OptionsType } from "@repo/components/ReSegmented";
import { useSettings } from "../../composables/useSettings";

const { t } = useI18n();
const { $storage } = useGlobal<GlobalPropertiesApi>();
const { saveToStorage } = useSettings();
const tagsStyle = computed({
  get: () => $storage?.configure?.tagsStyle ?? "rounded",
  set: (value: string) => {
    saveToStorage("tagsStyle", value);
  },
});

const tagsEffect = computed({
  get: () => $storage?.configure?.tagsEffect ?? "plain",
  set: (value: string) => {
    saveToStorage("tagsEffect", value);
  },
});

const tagsStyleOptions = computed<Array<OptionsType>>(() => [
  { label: "圆角", value: "rounded" },
  { label: "方形", value: "square" },
  { label: "胶囊", value: "capsule" },
]);

const tagsEffectOptions = computed<Array<OptionsType>>(() => [
  { label: "线框", value: "plain" },
  { label: "填充", value: "filled" },
  { label: "描边", value: "outlined" },
]);

const handleTagsStyleChange = ({ option }: { option: OptionsType }) => {
  tagsStyle.value = option.value as string;
};

const handleTagsEffectChange = ({ option }: { option: OptionsType }) => {
  tagsEffect.value = option.value as string;
};

const currentTagsStyleIndex = computed(() => {
  const index = tagsStyleOptions.value.findIndex(
    (opt) => opt.value === tagsStyle.value,
  );
  return index >= 0 ? index : 0;
});

const currentTagsEffectIndex = computed(() => {
  const index = tagsEffectOptions.value.findIndex(
    (opt) => opt.value === tagsEffect.value,
  );
  return index >= 0 ? index : 0;
});
</script>

<template>
  <div class="setting-section">
    <div class="section-header">
      <IconifyIconOnline icon="ri:price-tag-3-line" class="section-icon" />
      <h3 class="section-title">标签页样式</h3>
    </div>
    <div class="setting-content">
      <div class="mb-4">
        <div class="text-sm text-gray-600 dark:text-gray-400 mb-2">
          标签形状
        </div>
        <Segmented
          resize
          class="select-none modern-segmented w-full"
          :modelValue="currentTagsStyleIndex"
          :options="tagsStyleOptions"
          @change="handleTagsStyleChange"
        />
      </div>
      <div class="mt-4">
        <div class="text-sm text-gray-600 dark:text-gray-400 mb-2">
          标签效果
        </div>
        <Segmented
          resize
          class="select-none modern-segmented w-full"
          :modelValue="currentTagsEffectIndex"
          :options="tagsEffectOptions"
          @change="handleTagsEffectChange"
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


