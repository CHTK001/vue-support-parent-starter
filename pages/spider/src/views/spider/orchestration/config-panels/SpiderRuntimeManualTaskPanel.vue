<template>
  <div class="spider-node-panel">
    <div class="spider-node-panel__section">
      <div class="spider-node-panel__section-head">
        <strong>人工处理</strong>
        <span>{{ task.spiderTaskStatus }}</span>
      </div>

      <div class="spider-generic-config__item">
        <span>任务标题</span>
        <div class="spider-runtime-manual__text">{{ payload.taskTitle || task.spiderTaskType }}</div>
      </div>

      <div class="spider-generic-config__item">
        <span>处理说明</span>
        <div class="spider-runtime-manual__text">
          {{ payload.taskGuide || payload.taskPrompt || "请按要求填写并提交人工结果。" }}
        </div>
      </div>

      <label
        v-for="field in payload.formFields"
        :key="field.fieldKey"
        class="spider-generic-config__item"
      >
        <span>{{ field.label }}</span>
        <input
          :value="modelValue[field.fieldKey] || ''"
          :type="field.component === 'password' ? 'password' : 'text'"
          :placeholder="field.placeholder || ''"
          @input="emit('update-field', field.fieldKey, ($event.target as HTMLInputElement).value)"
        />
      </label>
    </div>

    <div class="spider-node-panel__footer">
      <button type="button" class="spider-toolbar-btn is-secondary" @click="emit('submit', false)">
        提交
      </button>
      <button type="button" class="spider-toolbar-btn spider-toolbar-btn--primary" @click="emit('submit', true)">
        提交并继续
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { SpiderManualTaskView } from "../../../types/orchestration";

defineOptions({ name: "SpiderRuntimeManualTaskPanel" });

const props = defineProps<{
  task: SpiderManualTaskView;
  modelValue: Record<string, string>;
}>();

const emit = defineEmits<{
  (e: "update-field", fieldKey: string, value: string): void;
  (e: "submit", continueAfter: boolean): void;
}>();

const payload = computed(() => {
  try {
    const parsed = JSON.parse(props.task.spiderTaskPayload || "{}");
    return {
      ...parsed,
      formFields: Array.isArray(parsed.formFields) ? parsed.formFields : [],
    };
  } catch {
    return {
      taskTitle: props.task.spiderTaskType,
      taskPrompt: "",
      taskGuide: "",
      formFields: [],
    };
  }
});
</script>

<style scoped lang="scss">
.spider-runtime-manual__text {
  padding: 12px 14px;
  border-radius: 12px;
  border: 1px solid color-mix(in srgb, var(--lay-border) 86%, transparent);
  background: color-mix(in srgb, #facc15 6%, var(--lay-bg));
  color: var(--lay-text-primary);
  line-height: 1.6;
}
</style>
