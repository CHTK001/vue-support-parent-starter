<template>
  <section class="node-panel-grid">
    <label>
      <span>条件类型</span>
      <select :value="state.conditionType" @change="update('conditionType', ($event.target as HTMLSelectElement).value)">
        <option value="field_compare">字段比较</option>
        <option value="status_code">状态码</option>
        <option value="regex_match">正则匹配</option>
        <option value="ai_classify">AI 分类</option>
      </select>
    </label>
    <label>
      <span>字段名</span>
      <input :value="state.field" @input="update('field', ($event.target as HTMLInputElement).value)" placeholder="price" />
    </label>
    <label>
      <span>操作符</span>
      <select :value="state.op" @change="update('op', ($event.target as HTMLSelectElement).value)">
        <option value="eq">等于</option>
        <option value="ne">不等于</option>
        <option value="gt">大于</option>
        <option value="gte">大于等于</option>
        <option value="lt">小于</option>
        <option value="lte">小于等于</option>
        <option value="contains">包含</option>
      </select>
    </label>
    <label>
      <span>比较值</span>
      <input :value="state.value" @input="update('value', ($event.target as HTMLInputElement).value)" placeholder="100" />
    </label>
    <label class="full">
      <span>正则表达式</span>
      <input :value="state.pattern" @input="update('pattern', ($event.target as HTMLInputElement).value)" placeholder="\\d+" />
    </label>
    <label class="full">
      <span>AI 分类提示词</span>
      <textarea
        :value="state.aiPrompt"
        rows="2"
        @input="update('aiPrompt', ($event.target as HTMLTextAreaElement).value)"
        placeholder="根据评论内容判断是正向还是负向"
      />
    </label>
  </section>
</template>

<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{ modelValue?: Record<string, any> }>();
const emit = defineEmits<{ (event: "update:modelValue", value: Record<string, any>): void }>();

const state = computed(() => ({
  conditionType: props.modelValue?.conditionType || "field_compare",
  field: props.modelValue?.field || "",
  op: props.modelValue?.op || "eq",
  value: props.modelValue?.value ?? "",
  pattern: props.modelValue?.pattern || "",
  aiPrompt: props.modelValue?.aiPrompt || "",
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
select,
textarea {
  width: 100%;
  border: 1px solid rgba(148, 163, 184, 0.35);
  border-radius: 10px;
  padding: 8px 10px;
  font: inherit;
}
</style>
