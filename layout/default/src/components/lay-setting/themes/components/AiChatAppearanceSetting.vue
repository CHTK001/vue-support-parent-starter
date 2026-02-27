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
      <div class="preview-body" :class="`preview-${innerValue}`">
        <div class="preview-bubble"></div>
        <div class="preview-bot"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import ScSelect from "@repo/components/ScSelect/index.vue";

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

.preview-body {
  position: relative;
  width: 80px;
  height: 48px;
  border-radius: 999px;
  background: var(--el-bg-color-page);
  display: flex;
  align-items: center;
  padding: 0 12px;
  box-shadow: 0 0 0 1px var(--el-border-color-lighter);
  overflow: hidden;
}

.preview-bubble {
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 10% 20%, rgba(255, 255, 255, 0.18), transparent 55%),
    radial-gradient(circle at 80% 0, rgba(255, 255, 255, 0.16), transparent 45%);
}

.preview-bot {
  position: relative;
  width: 22px;
  height: 22px;
  border-radius: 999px;
  background: linear-gradient(135deg, #ffffff, #f4f6fb);
  box-shadow: 0 4px 10px rgba(15, 23, 42, 0.18);
}

.preview-robot .preview-bot {
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
}

.preview-fox .preview-bot {
  background: linear-gradient(135deg, #fb923c, #f97316);
}

.preview-cat .preview-bot {
  background: linear-gradient(135deg, #38bdf8, #06b6d4);
}

.preview-bear .preview-bot {
  background: linear-gradient(135deg, #f97373, #ef4444);
}
</style>


