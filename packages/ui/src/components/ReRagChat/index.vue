<template>
  <div class="re-rag-chat">
    <div class="re-rag-chat__messages" ref="messagesRef">
      <div
        v-for="msg in messages"
        :key="msg.id"
        class="re-rag-chat__message"
        :class="[`is-${msg.role}`]"
      >
        <div class="re-rag-chat__message-avatar">
          <el-icon v-if="msg.role === 'assistant'"><ChatDotRound /></el-icon>
          <el-icon v-else><User /></el-icon>
        </div>
        <div class="re-rag-chat__message-body">
          <div class="re-rag-chat__message-content" v-html="formatMessage(msg.content)" />
          <div v-if="msg.sources && msg.sources.length > 0" class="re-rag-chat__sources">
            <el-collapse>
              <el-collapse-item :title="`引用 ${msg.sources.length} 个来源`" name="sources">
                <div
                  v-for="(src, i) in msg.sources"
                  :key="i"
                  class="re-rag-chat__source"
                >
                  <div class="re-rag-chat__source-score">
                    {{ (src.score * 100).toFixed(0) }}%
                  </div>
                  <div class="re-rag-chat__source-content">{{ src.content }}</div>
                </div>
              </el-collapse-item>
            </el-collapse>
          </div>
        </div>
      </div>
      <div v-if="isStreaming" class="re-rag-chat__message is-assistant">
        <div class="re-rag-chat__message-avatar">
          <el-icon><ChatDotRound /></el-icon>
        </div>
        <div class="re-rag-chat__message-body">
          <div class="re-rag-chat__typing">
            <span></span><span></span><span></span>
          </div>
        </div>
      </div>
      <div v-if="!messages.length && !isStreaming" class="re-rag-chat__empty">
        <el-empty description="请输入问题，我将基于知识库回答" />
      </div>
    </div>

    <div class="re-rag-chat__input">
      <div class="re-rag-chat__input-options">
        <el-input
          v-model="topK"
          type="number"

          style="width: 80px"
          placeholder="TopK"
        />
        <el-input
          v-model="threshold"
          type="number"

          style="width: 100px"
          placeholder="阈值"
          step="0.05"
        />
        <el-button

          :disabled="!libraryId"
          @click="handleClear"
        >
          <el-icon><Delete /></el-icon>
          清空
        </el-button>
      </div>
      <div class="re-rag-chat__input-row">
        <ReCardTextarea
          v-model="inputText"
          placeholder="输入问题..."
          :rows="2"
          :submit-on-keydown="true"
          @submit="handleSend"
        />
        <el-button
          type="primary"
          :loading="isStreaming"
          :disabled="!inputText.trim() || isStreaming"
          @click="handleSend"
        >
          <el-icon><Promotion /></el-icon>
          发送
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * ReRagChat —— RAG 问答组件
 *
 * 适配后端 RAG 接口 /v2/ai/rag/query
 *   <ReRagChat base-url="/v2/ai/rag" library-id="my-lib" />
 */
import { http } from "@repo/core";
import { ref, computed } from "vue";
import {
  ElInput,
  ElButton,
  ElIcon,
  ElEmpty,
  ElCollapse,
  ElCollapseItem,
} from "element-plus";
import { ChatDotRound, User, Delete, Promotion } from "@element-plus/icons-vue";
import ReCardTextarea from "../ReCardTextarea/index.vue";
import type { RagChatMessage, RagSource, RagQueryResponse } from "./types";

interface Props {
  baseUrl: string;
  libraryId?: string;
  defaultTopK?: number;
  defaultThreshold?: number;
  headers?: Record<string, string>;
  initialMessages?: RagChatMessage[];
}

const props = withDefaults(defineProps<Props>(), {
  defaultTopK: 5,
  defaultThreshold: 0.7,
});

const emit = defineEmits<{
  (e: "send", message: string): void;
  (e: "receive", message: RagChatMessage): void;
}>();

const messages = ref<RagChatMessage[]>(props.initialMessages ?? []);
const inputText = ref("");
const isStreaming = ref(false);
const messagesRef = ref<HTMLElement | null>(null);
const topK = ref(String(props.defaultTopK));
const threshold = ref(String(props.defaultThreshold));

let messageIdCounter = 0;

const generateId = () => `rag-${Date.now()}-${++messageIdCounter}`;

const formatMessage = (text: string): string => {
  return text.replace(/\n/g, "<br />");
};

const scrollToBottom = () => {
  requestAnimationFrame(() => {
    if (messagesRef.value) {
      messagesRef.value.scrollTop = messagesRef.value.scrollHeight;
    }
  });
};

const handleSend = async () => {
  const query = inputText.value.trim();
  if (!query || isStreaming.value) return;

  const userMsg: RagChatMessage = {
    id: generateId(),
    role: "user",
    content: query,
    timestamp: Date.now(),
  };
  messages.value.push(userMsg);
  inputText.value = "";
  scrollToBottom();
  emit("send", query);

  isStreaming.value = true;
  try {
    const { data } = await http()
      .post(`${props.baseUrl}/query`)
      .headers(props.headers ?? {})
      .data({ query, topK: parseInt(topK.value) || props.defaultTopK, threshold: parseFloat(threshold.value) || props.defaultThreshold, libraryId: props.libraryId });
    if (data.code !== 200) {
      throw new Error(data.message || "问答失败");
    }
    const payload = data.data as RagQueryResponse;
    const assistantMsg: RagChatMessage = {
      id: generateId(),
      role: "assistant",
      content: payload.answer,
      sources: payload.sources,
      timestamp: Date.now(),
    };
    messages.value.push(assistantMsg);
    scrollToBottom();
    emit("receive", assistantMsg);
  } catch (e) {
    const errorMsg: RagChatMessage = {
      id: generateId(),
      role: "assistant",
      content: `问答失败: ${(e as Error).message}`,
      timestamp: Date.now(),
    };
    messages.value.push(errorMsg);
    scrollToBottom();
  } finally {
    isStreaming.value = false;
  }
};

const handleClear = () => {
  messages.value = [];
};

defineExpose({ clear: handleClear, send: handleSend });
</script>

<style scoped>
.re-rag-chat {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-border-radius-base);
  overflow: hidden;
}

.re-rag-chat__messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.re-rag-chat__empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.re-rag-chat__message {
  display: flex;
  gap: 12px;
  max-width: 85%;
}

.re-rag-chat__message.is-user {
  align-self: flex-end;
  flex-direction: row-reverse;
}

.re-rag-chat__message-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--el-fill-color-light);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 18px;
  color: var(--el-text-color-secondary);
}

.re-rag-chat__message.is-user .re-rag-chat__message-avatar {
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
}

.re-rag-chat__message-body {
  flex: 1;
  min-width: 0;
}

.re-rag-chat__message-content {
  padding: 10px 14px;
  background: var(--el-fill-color-light);
  border-radius: 12px;
  font-size: 14px;
  line-height: 1.6;
  color: var(--el-text-color-primary);
  word-break: break-word;
}

.re-rag-chat__message.is-user .re-rag-chat__message-content {
  background: var(--el-color-primary-light-9);
}

.re-rag-chat__sources {
  margin-top: 8px;
}

.re-rag-chat__sources :deep(.el-collapse-item__header) {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  height: 32px;
}

.re-rag-chat__sources :deep(.el-collapse-item__content) {
  padding: 4px 0;
}

.re-rag-chat__source {
  display: flex;
  gap: 12px;
  padding: 6px 0;
  border-bottom: 1px solid var(--el-border-color-lighter);
  font-size: 12px;
}

.re-rag-chat__source:last-child {
  border-bottom: none;
}

.re-rag-chat__source-score {
  flex-shrink: 0;
  font-weight: 600;
  color: var(--el-color-success);
  min-width: 44px;
}

.re-rag-chat__source-content {
  flex: 1;
  color: var(--el-text-color-regular);
  word-break: break-word;
}

.re-rag-chat__typing {
  display: flex;
  gap: 4px;
  padding: 10px 14px;
  background: var(--el-fill-color-light);
  border-radius: 12px;
}

.re-rag-chat__typing span {
  width: 8px;
  height: 8px;
  background: var(--el-text-color-placeholder);
  border-radius: 50%;
  animation: re-rag-typing 1.2s infinite ease-in-out;
}

.re-rag-chat__typing span:nth-child(2) { animation-delay: 0.2s; }
.re-rag-chat__typing span:nth-child(3) { animation-delay: 0.4s; }

@keyframes re-rag-typing {
  0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
  30% { transform: translateY(-8px); opacity: 1; }
}

.re-rag-chat__input {
  border-top: 1px solid var(--el-border-color-lighter);
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.re-rag-chat__input-options {
  display: flex;
  gap: 8px;
  align-items: center;
}

.re-rag-chat__input-row {
  display: flex;
  gap: 8px;
  align-items: flex-end;
}

.re-rag-chat__input-row .el-textarea {
  flex: 1;
}

.re-rag-chat__input-row .el-button {
  flex-shrink: 0;
  height: 40px;
}
</style>
