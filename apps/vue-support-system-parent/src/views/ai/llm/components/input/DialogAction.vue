<template>
  <div class="action-box">
    <div class="left-area">
      <input type="file" multiple ref="fileInput" style="display: none" @change="handleAddFile" />
      <div class="btn-small" @click="$refs.fileInput?.click()" v-if="instance.getForm().sysAiModuleVlm == 1">
        <PaperClipIcon />
      </div>
      <div class="btn-small" @click="handleThemeChange">
        <MoonIcon />
      </div>
      <div class="btn-small" @click="clearMessage">
        <el-icon color="red">
          <component :is="useRenderIcon('mdi:delete')" />
        </el-icon>
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
import { defineProps, inject, nextTick, onMounted, onUnmounted } from "vue";
import PaperClipIcon from "../icons/PaperClipIcon.vue";
import PlayIcon from "../icons/PlayIcon.vue";
import emitter from "../../utils/emitter";
import StopIcon from "../icons/StopIcon.vue";
import MoonIcon from "../icons/MoonIcon.vue";
import { useEpThemeStoreHook } from "@repo/core";
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import { message } from "@repo/utils";

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

const clearMessage = () => {
  instance.clearMessage();
};
// 处理发送
const handleSend = () => {
  // 建立SSE连接
  if (!instance.getForm()?.sysProjectId) {
    message("请先选择项目", { type: "error" });
    return false;
  }

  if (!instance.getForm()?.model) {
    message("请先选择模型", { type: "error" });
    return false;
  }
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

onMounted(async () => {
  nextTick(() => {
    const html = document.documentElement;
    const _hook = useEpThemeStoreHook();
    html.setAttribute("ld-theme", _hook.epTheme == "default" ? "dark" : _hook.epTheme);
  });

  handleMountKeydown();
});

onUnmounted(async () => {
  handleUnmountKeydown();
});

const handleUnmountKeydown = () => {
  document.removeEventListener("keydown", handleKeydown);
};

const handleKeydown = (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    handleSend();
  }
};

const handleMountKeydown = () => {
  document.addEventListener("keydown", handleKeydown);
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
