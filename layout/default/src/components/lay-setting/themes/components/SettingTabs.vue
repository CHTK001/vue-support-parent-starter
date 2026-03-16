<script setup lang="ts">
import { useI18n } from "vue-i18n";
import Segmented, {
  type OptionsType,
} from "@repo/components/ReSegmented/index";

const { t } = useI18n();

// ---- Props 定义 ----
const props = defineProps<{
  /** reactive 设置对象引用，子组件可直接修改 */
  settings: Record<string, any>;
  isNonDefaultTheme: boolean;
  markValue: string;
  markOptions: Array<OptionsType>;
  onChange: (val: { option: OptionsType }) => void;
  tagsChange: () => void;
  multiTagsCacheChange: () => void;
}>();
</script>

<template>
  <!-- 标签页样式设置区域（非默认主题下隐藏） -->
  <div v-if="!isNonDefaultTheme" class="setting-section">
    <div class="section-header">
      <IconifyIconOnline icon="ri:price-tag-3-line" class="section-icon" />
      <h3 class="section-title">{{ t("panel.pureTagsStyle") }}</h3>
    </div>
    <div class="setting-content">
      <Segmented
        resize
        class="select-none modern-segmented"
        :modelValue="
          markValue === 'smart'
            ? 0
            : markValue === 'card'
              ? 1
              : markValue === 'chrome'
                ? 2
                : markValue === 'modern'
                  ? 3
                  : markValue === 'glass'
                    ? 4
                    : 0
        "
        :options="markOptions"
        @change="onChange"
      />
    </div>
  </div>
</template>
