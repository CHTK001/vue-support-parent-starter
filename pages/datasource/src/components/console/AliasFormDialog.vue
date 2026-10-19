<script setup lang="ts">
import { computed, ref } from "vue";

const props = defineProps<{
  indexOptions: { label: string; value: string }[];
}>();

const emit = defineEmits<{
  submit: [alias: string, index: string];
  cancel: [];
}>();

const aliasName = ref("");
const targetIndex = ref(props.indexOptions[0]?.value ?? "");

const canSubmit = computed(() => !!aliasName.value.trim());

function onConfirm() {
  if (!canSubmit.value) return;
  emit("submit", aliasName.value.trim(), targetIndex.value);
}
</script>

<template>
  <div class="alias-form">
    <div class="alias-form-field">
      <label class="alias-label">别名名称</label>
      <ReInput
        v-model="aliasName"
        placeholder="请输入别名"
        autofocus
        @keyup.enter="onConfirm"
      />
    </div>
    <div class="alias-form-field">
      <label class="alias-label">指向索引</label>
      <ReSelect
        v-model="targetIndex"
        :options="indexOptions"
        placeholder="选择一个索引"
      />
    </div>
  </div>
</template>

<style scoped>
.alias-form { display: flex; flex-direction: column; gap: 12px; min-width: 320px; }
.alias-form-field { display: flex; flex-direction: column; gap: 6px; }
.alias-label {
  font-size: 13px;
  color: var(--el-text-color-regular);
  font-weight: 500;
}
</style>
