<template>
  <div class="text-editor-contain">
    <div class="text-editor" ref="editor" @input="handleInput" contenteditable="true">9.11和9.8哪个大</div>
  </div>
</template>

<script setup lang="ts" name="DialogEditor">
import { message } from "@repo/utils";
import type { LLMDialog } from "../../llmDialog/llmDialog";
import emitter from "../../utils/emitter";
import { inject, nextTick, onUnmounted, ref } from "vue";

// 获取实例
const instance = inject<LLMDialog>("instance") as LLMDialog;

// 编辑器
const editor = ref<HTMLElement | null>();

const handleInput = () => {
  instance.editorText = editor.value?.innerText || "";
};

// 绑定输入框事件
emitter.on("input-editor-text", (text: string) => {
  nextTick(() => {
    if (editor.value) {
      message("请刷新后重试!", { type: "warning" });
      return;
    }
    //@ts-ignore
    editor.value!.innerText = text;
  });
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
