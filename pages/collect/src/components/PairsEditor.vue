<!--
  可重复参数组编辑器。

  对应 DSL 里 "组名:键名" 形式的参数（header:User-Agent、cookie:SID、set:token、cell:title）。
  输入过程中只在失焦/增删行时提交，避免空键行被过滤后又被回写、打断正在输入的内容。
-->
<script setup lang="ts">
import { ref, watch } from "vue";
import ReButton from "@repo/ui/re-button";
import ReInput from "@repo/ui/re-input";
import type { ParamPair } from "../utils/dsl";

const props = withDefaults(
  defineProps<{
    modelValue: ParamPair[];
    keyPlaceholder?: string;
    valuePlaceholder?: string;
    keyWidth?: string;
  }>(),
  { keyPlaceholder: "名称", valuePlaceholder: "值", keyWidth: "38%" },
);

const emit = defineEmits<{ (event: "update:modelValue", value: ParamPair[]): void }>();

const rows = ref<ParamPair[]>([]);

watch(
  () => props.modelValue,
  value => {
    const incoming = (value ?? []).map(row => ({ key: row.key, value: row.value }));
    // 父级提交时会过滤空键行，回写不能把用户正在填的空行抹掉，故本地空行始终保留
    const drafts = rows.value.filter(row => row.key.trim() === "");
    rows.value = [...incoming, ...drafts];
  },
  { immediate: true },
);

function commit(): void {
  emit(
    "update:modelValue",
    rows.value.map(row => ({ key: row.key, value: row.value })),
  );
}

function addRow(): void {
  rows.value = [...rows.value, { key: "", value: "" }];
}

function removeRow(index: number): void {
  rows.value = rows.value.filter((_, i) => i !== index);
  commit();
}
</script>

<template>
  <div class="pair-editor" @focusout="commit">
    <div v-for="(row, index) in rows" :key="index" class="pair-row">
      <ReInput

        :placeholder="keyPlaceholder"
        :style="{ flex: `0 0 ${keyWidth}` }"
        :model-value="row.key"
        @update:model-value="(value: unknown) => (row.key = String(value ?? ''))"
      />
      <ReInput

        class="pair-value"
        :placeholder="valuePlaceholder"
        :model-value="row.value"
        @update:model-value="(value: unknown) => (row.value = String(value ?? ''))"
      />
      <ReButton text type="danger" icon="Delete" @click="removeRow(index)"/>
    </div>
    <ReButton plain icon="Plus" @click="addRow">添加一项</ReButton>
  </div>
</template>

<style scoped>
.pair-row {
  display: flex;
  gap: 5px;
  align-items: center;
  margin-bottom: 5px;
}

.pair-value {
  flex: 1 1 auto;
  min-width: 0;
}
</style>
