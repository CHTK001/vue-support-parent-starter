<template>
  <div class="text-editor-contain">
    <div class="text-editor" ref="editor" @input="handleInput" contenteditable="true">详细说明i5-12600 i17-12650那个性能强，用表格呈现</div>
  </div>
</template>

<script setup lang="ts" name="DialogEditor">
import type { LLMDialog } from "../../llmDialog/llmDialog";
import emitter from "../../utils/emitter";
import { inject, onUnmounted, ref } from "vue";

// 获取实例
const instance = inject<LLMDialog>("instance") as LLMDialog;

// 编辑器
const editor = ref<HTMLElement | null>();

const handleInput = () => {
  instance.editorText = editor.value?.innerText || "";
};

// 绑定输入框事件
emitter.on("input-editor-text", (text: string) => {
  editor.value!.innerText = text;
});
// 绑定清空输入框事件
emitter.on("clear-editor-text", () => {
  editor.value!.innerText = "";
});

// 组件卸载
onUnmounted(() => {
  // 移除清空输入框事件
  emitter.off("clear-editor-text");
});
</script>

<style scoped>
.text-editor-contain {
  max-height: 160px;
  min-height: 50px;
  overflow: auto;
}
.text-editor {
  color: var(--ld-color-text);
  max-height: fit-content;
  min-height: inherit;
  user-select: text;
  white-space: pre-wrap;
  word-break: break-word;
  outline: none;
}
</style>
