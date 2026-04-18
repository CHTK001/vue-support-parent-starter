<template>
  <section class="brain-panel-grid">
    <label>
      <span>启用 AI</span>
      <select :value="String(state.enabled)" @change="update('enabled', ($event.target as HTMLSelectElement).value === 'true')">
        <option value="true">是</option>
        <option value="false">否</option>
      </select>
    </label>
    <label>
      <span>Provider</span>
      <select :value="state.provider" @change="update('provider', ($event.target as HTMLSelectElement).value)">
        <option v-for="provider in providers" :key="provider" :value="provider">{{ provider }}</option>
      </select>
    </label>
    <label>
      <span>Model</span>
      <input :value="state.model" @input="update('model', ($event.target as HTMLInputElement).value)" />
    </label>
    <label>
      <span>Session ID</span>
      <input :value="state.sessionId" @input="update('sessionId', ($event.target as HTMLInputElement).value)" />
    </label>
    <label class="full">
      <span>API Key</span>
      <input type="password" :value="state.apiKey" @input="update('apiKey', ($event.target as HTMLInputElement).value)" />
    </label>
    <label class="full">
      <span>System Prompt</span>
      <textarea :value="state.systemPrompt" rows="3" @input="update('systemPrompt', ($event.target as HTMLTextAreaElement).value)" />
    </label>
    <label>
      <span>Temperature</span>
      <input
        type="number"
        step="0.1"
        min="0"
        max="2"
        :value="state.temperature"
        @input="update('temperature', Number(($event.target as HTMLInputElement).value || 0))"
      />
    </label>
    <label>
      <span>Context Window</span>
      <input
        type="number"
        min="1024"
        :value="state.contextWindow"
        @input="update('contextWindow', Number(($event.target as HTMLInputElement).value || 0))"
      />
    </label>
    <button type="button" class="test-btn" @click="$emit('test')">测试连通性</button>
  </section>
</template>

<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
  modelValue?: Record<string, any>;
  providers?: string[];
}>();
const emit = defineEmits<{
  (event: "test"): void;
  (event: "update:modelValue", value: Record<string, any>): void;
}>();

const state = computed(() => ({
  enabled: props.modelValue?.enabled ?? true,
  provider: props.modelValue?.provider || "deepseek",
  model: props.modelValue?.model || "deepseek-chat",
  apiKey: props.modelValue?.apiKey || "",
  systemPrompt: props.modelValue?.systemPrompt || "",
  sessionId: props.modelValue?.sessionId || "",
  temperature: props.modelValue?.temperature ?? 0.7,
  contextWindow: props.modelValue?.contextWindow ?? 8192,
}));

const update = (key: string, value: any) => {
  emit("update:modelValue", {
    ...(props.modelValue || {}),
    [key]: value,
  });
};
</script>

<style scoped lang="scss">
.brain-panel-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

label {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

label.full {
  grid-column: 1 / -1;
}

span {
  font-size: 12px;
  color: #516071;
}

input,
select,
textarea {
  width: 100%;
  border: 1px solid rgba(148, 163, 184, 0.35);
  border-radius: 10px;
  padding: 8px 10px;
  font: inherit;
}

.test-btn {
  grid-column: 1 / -1;
  border: 0;
  border-radius: 10px;
  background: linear-gradient(135deg, #0f766e, #0b605a);
  color: #fff;
  padding: 10px 12px;
  cursor: pointer;
}
</style>
