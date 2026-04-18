<template>
  <section class="node-panel-grid">
    <label>
      <span>异常策略</span>
      <select :value="state.strategy" @change="update('strategy', ($event.target as HTMLSelectElement).value)">
        <option value="retry">重试</option>
        <option value="skip">跳过</option>
        <option value="log_and_continue">记录并继续</option>
        <option value="fail">直接失败</option>
      </select>
    </label>
    <label>
      <span>最大重试次数</span>
      <input
        type="number"
        min="0"
        :value="state.maxRetries"
        @input="update('maxRetries', Number(($event.target as HTMLInputElement).value || 0))"
      />
    </label>
    <label class="full">
      <span>重试间隔(ms)</span>
      <input
        type="number"
        min="0"
        :value="state.retryIntervalMs"
        @input="update('retryIntervalMs', Number(($event.target as HTMLInputElement).value || 0))"
      />
    </label>
  </section>
</template>

<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{ modelValue?: Record<string, any> }>();
const emit = defineEmits<{ (event: "update:modelValue", value: Record<string, any>): void }>();

const state = computed(() => ({
  strategy: props.modelValue?.strategy || "retry",
  maxRetries: props.modelValue?.maxRetries ?? 3,
  retryIntervalMs: props.modelValue?.retryIntervalMs ?? 2000,
}));

const update = (key: string, value: any) => {
  emit("update:modelValue", {
    ...(props.modelValue || {}),
    [key]: value,
  });
};
</script>

<style scoped lang="scss">
.node-panel-grid {
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
select {
  width: 100%;
  border: 1px solid rgba(148, 163, 184, 0.35);
  border-radius: 10px;
  padding: 8px 10px;
  font: inherit;
}
</style>
