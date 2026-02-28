<template>
  <div class="ai-appearance-setting">
    <div class="ai-appearance-selector">
      <ScSelect
        v-model="innerValue"
        layout="dropdown"
        :options="options"
        width="220px"
        dropdown-title="选择外观样式"
        dropdown-placeholder="请选择外观"
        @change="handleChange"
      />
    </div>
    <div class="ai-appearance-preview">
      <div class="preview-label">预览</div>
      <component :is="currentAppearanceComponent" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import ScSelect from "@repo/components/ScSelect/index.vue";
import { resolveAiAppearanceComponent } from "../../../lay-ai/appearance";

interface OptionsType {
  label: string;
  value: string | number | boolean;
  tip?: string;
}

interface Props {
  modelValue: string;
  options: Array<OptionsType>;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
  (e: "change", value: string): void;
}>();

const innerValue = computed({
  get() {
    return props.modelValue;
  },
  set(value: string) {
    emit("update:modelValue", value);
  },
});

function handleChange(value: string) {
  emit("change", value);
}

const currentAppearanceComponent = computed(() =>
  resolveAiAppearanceComponent(innerValue.value),
);
</script>

<style scoped>
.ai-appearance-setting {
  display: flex;
  align-items: center;
  gap: 16px;
}

.ai-appearance-preview {
  display: flex;
  align-items: center;
  gap: 8px;
}

.preview-label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
</style>


