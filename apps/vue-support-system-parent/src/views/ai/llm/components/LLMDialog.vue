<template>
  <div v-show="instance.isVisible" class="llm-dialog-page">
    <div class="llm-dialog-box">
      <div ref="scrollContainer" class="llm-dialog-scroll-container">
        <div class="llm-dialog-content">
          <DialogMessage />
          <DialogInput :form="instance.form" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts" name="LLMDialog">
import DialogMessage from "./DialogMessage.vue";
import DialogInput from "./DialogInput.vue";
import { provide } from "vue";
import useLoadTheme from "../hooks/useLoadTheme";
import useScrollToBottom from "../hooks/useScrollToBottom";

const props = defineProps<{ instance: any }>();
const instance = props.instance;

// 使用主题加载器钩子
useLoadTheme();

// 解构出滚动容器，使 hook 里可以访问 DOM 元素
const { scrollContainer } = useScrollToBottom();

// 向子组件提供实例
provide("instance", instance);
</script>

<style>
:root {
  /* 变量 */
  --ld-color-white: #fff;
  --ld-color-black: #000;
  --ld-transition-duration: 0.3s;
  --ld-message-gap: 20px;
  /* 白天模式默认变量 */
  --ld-color-primary: #fff;
  --ld-color-btn: #f7f7f7;
  --ld-color-btn-hover: #eaeaea;
  --ld-color-background: #f7f7f7;
  --ld-color-code-bg: #f7f7f7;
  --ld-color-text: #333333;
}

[ld-theme="dark"] {
  /* 黑夜模式变量 */
  --ld-color-primary: #414345;
  --ld-color-btn: #232526;
  --ld-color-btn-hover: #3a3b3c;
  --ld-color-background: #232526;
  --ld-color-code-bg: #232526;
  --ld-color-text: #e0e0e0;
}

.ld-svg-icon {
  fill: var(--ld-color-text);
  transition: fill var(--ld-transition-duration) ease;
}

.llm-dialog-page {
  display: flex;
  height: 100%;
  flex-direction: column;
  background-color: var(--ld-color-background);
  transition:
    background-color var(--ld-transition-duration),
    color var(--ld-transition-duration);
}

.llm-dialog-page ::-webkit-scrollbar {
  width: 6px !important;
  height: 6px !important;
}

.llm-dialog-page ::-webkit-scrollbar-thumb {
  border-radius: 3px !important;
  background: #c1c1c1 !important;
}

.llm-dialog-box {
  flex-grow: 1;
  position: relative;
}

.llm-dialog-scroll-container {
  min-height: 100%;
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  overflow: auto;
  scroll-behavior: smooth;
}

.llm-dialog-content {
  display: flex;
  flex-direction: column;
  position: relative;
  height: 100%;
}
</style>
