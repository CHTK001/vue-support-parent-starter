<template>
  <div class="action-box">
    <div class="left-area">
      <input type="file" multiple ref="fileInput" style="display: none" @change="handleAddFile" />
      <div class="btn-small" @click="$refs.fileInput.click()">
        <PaperClipIcon />
      </div>
      <div class="btn-small" @click="handleThemeChange">
        <MoonIcon />
      </div>
    </div>
    <div class="right-area">
      <div class="btn-small" @click="handleSend" v-show="!instance.isSending">
        <PlayIcon />
      </div>
      <div class="btn-small" @click="handleStopSend" v-show="instance.isSending">
        <StopIcon />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts" name="DialogAction">
import type { LLMDialog } from "../../llmDialog/llmDialog";
import { inject } from "vue";
import PaperClipIcon from "../../components/icons/PaperClipIcon.vue";
import PlayIcon from "../../components/icons/PlayIcon.vue";
import emitter from "../../utils/emitter";
import StopIcon from "../icons/StopIcon.vue";
import MoonIcon from "../icons/MoonIcon.vue";

const instance = inject<LLMDialog>("instance") as LLMDialog;

// 处理添加文件
const handleAddFile = (event: Event) => {
  if (!event.target) return;
  const files = (event.target as HTMLInputElement).files;
  if (!files) return;
  for (let i = 0; i < files.length; i++) {
    instance.uploadFile(files[i]);
  }
};

// 处理发送
const handleSend = () => {
  // 清空页面输入框消息
  emitter.emit("clear-editor-text");
  // 发送消息
  instance.sendMessage();
};

// 处理停止发送
const handleStopSend = () => {
  instance.stopSend();
};

// 处理主题切换
const handleThemeChange = () => {
  const html = document.documentElement;
  const current = html.getAttribute("ld-theme") || "light";
  const newTheme = current === "light" ? "dark" : "light";
  html.setAttribute("ld-theme", newTheme);
};
</script>

<style scoped>
.action-box {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
}
.left-area,
.right-area {
  display: flex;
  gap: 10px;
}
.btn-small {
  width: 36px;
  height: 36px;
  background-color: var(--ld-color-btn);
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  transition: all 0.3s;
}
.btn-small:hover {
  background-color: var(--ld-color-btn-hover);
}
</style>
