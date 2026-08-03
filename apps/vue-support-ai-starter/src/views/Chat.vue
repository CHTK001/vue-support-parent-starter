<template>
  <div class="chat-view">
    <el-card class="chat-header" shadow="never">
      <div class="chat-header__inner">
        <div>
          <h2 class="chat-title">AI 对话</h2>
          <p class="chat-sub">基于 spring-support-ai-starter 的对话通道</p>
        </div>
        <el-tag type="success" effect="plain">在线</el-tag>
      </div>
    </el-card>

    <el-card class="chat-body" shadow="never">
      <div ref="listRef" class="chat-messages">
        <div
          v-for="(m, i) in messages"
          :key="i"
          class="chat-message"
          :class="['chat-message--' + m.role]"
        >
          <div class="chat-message__avatar">{{ m.role === 'user' ? '我' : 'AI' }}</div>
          <div class="chat-message__bubble">{{ m.content }}</div>
        </div>
      </div>
    </el-card>

    <el-card class="chat-input" shadow="never">
      <el-input
        v-model="input"
        type="textarea"
        :rows="3"
        placeholder="说点什么..."
        @keydown.ctrl.enter="send"
      />
      <div class="chat-actions">
        <el-button @click="clear" plain>清空</el-button>
        <el-button type="primary" :loading="loading" @click="send">发送 (Ctrl+Enter)</el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { ElMessage } from "element-plus";
import { chatApi } from "../api/chat";

interface Msg { role: "user" | "assistant"; content: string }
const messages = ref<Msg[]>([
  { role: "assistant", content: "你好，我是 Vue Support AI。请告诉我你需要什么帮助。" },
]);
const input = ref("");
const loading = ref(false);
const listRef = ref<HTMLElement>();

const send = async () => {
  const text = input.value.trim();
  if (!text) return;
  messages.value.push({ role: "user", content: text });
  input.value = "";
  loading.value = true;
  try {
    const reply = await chatApi.send(text);
    messages.value.push({ role: "assistant", content: reply });
  } catch (e: any) {
    ElMessage.error("对话失败：" + (e?.message || e));
    messages.value.push({ role: "assistant", content: "（后端连接失败，请确认 spring-support-ai-starter 已启动在 :8080）" });
  } finally {
    loading.value = false;
    queueMicrotask(() => listRef.value?.scrollTo?.({ top: listRef.value.scrollHeight }));
  }
};

const clear = () => {
  messages.value = [{ role: "assistant", content: "对话已清空，请问还有什么可以帮你的？" }];
};
</script>

<style scoped>
.chat-view { display: flex; flex-direction: column; gap: 12px; height: 100%; }
.chat-header__inner { display: flex; justify-content: space-between; align-items: center; }
.chat-title { margin: 0; font-size: 16px; }
.chat-sub { margin: 4px 0 0; font-size: 12px; color: var(--el-text-color-secondary); }
.chat-body { flex: 1; overflow: hidden; }
.chat-messages { height: 100%; max-height: calc(100vh - 320px); overflow: auto; padding: 8px 4px; display: flex; flex-direction: column; gap: 12px; }
.chat-message { display: flex; gap: 8px; }
.chat-message--assistant { align-self: flex-start; }
.chat-message--user { align-self: flex-end; flex-direction: row-reverse; }
.chat-message__avatar {
  width: 32px; height: 32px; border-radius: 50%;
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
  display: flex; align-items: center; justify-content: center;
  font-size: 12px; font-weight: 600; flex-shrink: 0;
}
.chat-message--user .chat-message__avatar { background: var(--el-color-success-light-9); color: var(--el-color-success); }
.chat-message__bubble {
  padding: 10px 14px; border-radius: 8px; max-width: 70%;
  background: var(--el-fill-color-light); color: var(--el-text-color-primary);
  font-size: 14px; line-height: 1.6; white-space: pre-wrap; word-break: break-word;
}
.chat-message--user .chat-message__bubble { background: var(--el-color-primary-light-9); }
.chat-actions { margin-top: 8px; display: flex; justify-content: flex-end; gap: 8px; }
</style>
