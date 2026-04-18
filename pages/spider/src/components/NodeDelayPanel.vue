<template>
  <section class="node-panel-grid">
    <label>
      <span>延迟模式</span>
      <select :value="state.mode" @change="update('mode', ($event.target as HTMLSelectElement).value)">
        <option value="fixed">固定</option>
        <option value="random">随机</option>
        <option value="adaptive">自适应</option>
      </select>
    </label>
    <label>
      <span>固定延迟(ms)</span>
      <input
        type="number"
        min="0"
        :value="state.fixedDelayMs"
        @input="update('fixedDelayMs', Number(($event.target as HTMLInputElement).value || 0))"
      />
    </label>
    <label>
      <span>最小延迟(ms)</span>
      <input
        type="number"
        min="0"
        :value="state.minDelayMs"
        @input="update('minDelayMs', Number(($event.target as HTMLInputElement).value || 0))"
      />
    </label>
    <label>
      <span>最大延迟(ms)</span>
      <input
        type="number"
        min="0"
        :value="state.maxDelayMs"
        @input="update('maxDelayMs', Number(($event.target as HTMLInputElement).value || 0))"
      />
    </label>
  </section>
</template>

<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{ modelValue?: Record<string, any> }>();
const emit = defineEmits<{ (event: "update:modelValue", value: Record<string, any>): void }>();

const state = computed(() => ({
  mode: props.modelValue?.mode || "fixed",
  fixedDelayMs: props.modelValue?.fixedDelayMs ?? 1000,
  minDelayMs: props.modelValue?.minDelayMs ?? 300,
  maxDelayMs: props.modelValue?.maxDelayMs ?? 2000,
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
