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
    <!-- 表头：说清左列是键、右列是值，避免用户不知道每列填什么 -->
    <div v-if="rows.length" class="pair-head">
      <span class="pair-head-key" :style="{ flex: `0 0 ${keyWidth}` }">{{ keyPlaceholder || "名称" }}</span>
      <span class="pair-head-value">{{ valuePlaceholder || "值" }}</span>
      <span class="pair-head-op"></span>
    </div>

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
      <ReButton text type="danger" icon="Delete" :show-text="false" :icon-size="28" tip="删除这一项" @click="removeRow(index)"/>
    </div>

    <!-- 空态：说清这是什么、怎么写，并给一个具体例子（契约 §4.2） -->
    <div v-if="!rows.length" class="pair-empty">
      <div class="pair-empty-title">还没有配置</div>
      <div class="pair-empty-tip">
        点下面的「添加一项」开始：左列填名称（键），右列填值。
        右列可直接写常量，也可写 ${表达式} 引用上游变量，例：token ← ${resp.selector('.token').text()}。
      </div>
    </div>

    <ReButton plain icon="Plus" @click="addRow">添加一项</ReButton>
  </div>
</template>

<style scoped>
/* 一项一行，行间统一 8px 竖向节奏（契约 §2 间距阶梯） */
.pair-editor {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.pair-head,
.pair-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 表头标签：小号灰字，与值列的输入框左边缘对齐 */
.pair-head-key,
.pair-head-value,
.pair-head-op {
  overflow: hidden;
  font-size: 11px;
  line-height: 1.45;
  color: var(--el-text-color-secondary);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pair-head-value {
  flex: 1 1 auto;
  min-width: 0;
}

/* 占位与删除按钮同宽，保证表头与行的值列对齐 */
.pair-head-op {
  flex: 0 0 28px;
}

/* ReInput 根节点是 display:contents，宽度必须落在内层 el-input 上 */
.pair-row :deep(.el-input) {
  min-width: 0;
}

.pair-value {
  flex: 1 1 auto;
  min-width: 0;
}

/* 空态：给出下一步动作与示例 */
.pair-empty {
  padding: 16px;
  text-align: center;
  background: var(--el-fill-color-lighter);
  border: 1px dashed var(--el-border-color);
  border-radius: var(--el-radius-md, 8px);
}

.pair-empty-title {
  font-size: 13px;
  color: var(--el-text-color-regular);
}

.pair-empty-tip {
  margin-top: 4px;
  font-size: 12px;
  line-height: 1.45;
  color: var(--el-text-color-secondary);
}
</style>
