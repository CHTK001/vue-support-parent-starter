<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useGlobal } from "@pureadmin/utils";
import Segmented, { type OptionsType } from "@repo/components/ReSegmented";

const { t } = useI18n();
const { $storage } = useGlobal<GlobalPropertiesApi>();

// 从 storage 读取设置，仅作为计算属性使用，写入通过专门方法处理，避免响应式递归
const themeAnimationMode = computed(() => {
  return $storage?.configure?.themeAnimationMode ?? "fixed";
});

const themeAnimationDirection = computed(() => {
  return $storage?.configure?.themeAnimationDirection ?? "top-right";
});

// 主题动画模式选项
const themeAnimationModeOptions = computed<Array<OptionsType>>(() => [
  { label: "随机", value: "random" },
  { label: "固定", value: "fixed" },
  { label: "禁用", value: "disabled" },
]);

// 主题动画方向选项
const themeAnimationDirectionOptions = computed<Array<OptionsType>>(() => [
  { label: "右上角", value: "top-right" },
  { label: "左上角", value: "top-left" },
  { label: "右下角", value: "bottom-right" },
  { label: "左下角", value: "bottom-left" },
  { label: "顶部居中", value: "top-center" },
  { label: "底部居中", value: "bottom-center" },
  { label: "左侧居中", value: "left-center" },
  { label: "右侧居中", value: "right-center" },
  { label: "中心", value: "center" },
  { label: "从左到右", value: "left" },
  { label: "从右到左", value: "right" },
  { label: "从上到下", value: "top" },
  { label: "从下到上", value: "bottom" },
  { label: "跟随鼠标", value: "cursor" },
]);

// 处理动画模式变化
const handleModeChange = ({ option }: { option: OptionsType }) => {
  $storage.configure.themeAnimationMode = option.value as string;
};

// 处理动画方向变化
const handleDirectionChange = ({ option }: { option: OptionsType }) => {
  $storage.configure.themeAnimationDirection = option.value as string;
};

// 计算当前模式索引
const currentModeIndex = computed(() => {
  if (themeAnimationMode.value === "random") return 0;
  if (themeAnimationMode.value === "fixed") return 1;
  return 2;
});

// 计算当前方向索引
const currentDirectionIndex = computed(() => {
  const index = themeAnimationDirectionOptions.value.findIndex(
    (opt) => opt.value === themeAnimationDirection.value
  );
  return index >= 0 ? index : 0;
});
</script>

<template>
  <div class="setting-section">
    <div class="section-header">
      <IconifyIconOnline icon="ri:movie-2-line" class="section-icon" />
      <h3 class="section-title">主题切换动画</h3>
    </div>
    <div class="setting-content">
      <div class="mb-4">
        <div class="text-sm text-gray-600 dark:text-gray-400 mb-2">动画模式</div>
        <Segmented
          resize
          class="select-none modern-segmented w-full"
          :modelValue="currentModeIndex"
          :options="themeAnimationModeOptions"
          @change="handleModeChange"
        />
      </div>
      <div v-if="themeAnimationMode === 'fixed'" class="mt-4">
        <div class="text-sm text-gray-600 dark:text-gray-400 mb-2">动画方向</div>
        <Segmented
          resize
          class="select-none modern-segmented w-full"
          :modelValue="currentDirectionIndex"
          :options="themeAnimationDirectionOptions"
          @change="handleDirectionChange"
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

