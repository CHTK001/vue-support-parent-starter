<template>
  <div class="re-chat" :class="{ 'is-streaming': isStreaming }">
    <!-- 顶部工具栏：模型选择、设置等 -->
    <div v-if="showHeader" class="re-chat__header">
      <div class="re-chat__header-left">
        <slot name="header">
          <el-select
            v-if="models.length > 0"
            v-model="selectedModel"
            class="re-chat__model-select"

            :disabled="isStreaming"
            @change="handleModelChange"
          >
            <template #prefix>
              <span class="re-chat__model-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M12 1v6m0 10v6M4.22 4.22l4.24 4.24m7.08 7.08l4.24 4.24M1 12h6m10 0h6M4.22 19.78l4.24-4.24m7.08-7.08l4.24-4.24" />
                </svg>
              </span>
            </template>
            <el-option
              v-for="m in models"
              :key="m.value"
              :label="m.label"
              :value="m.value"
            >
              <div class="re-chat__model-option">
                <span class="re-chat__model-label">{{ m.label }}</span>
                <span v-if="m.description" class="re-chat__model-desc">{{ m.description }}</span>
              </div>
            </el-option>
          </el-select>
        </slot>
      </div>
      <div class="re-chat__header-right">
        <slot name="header-extra">
          <el-button
            v-if="showClear"
            link
            type="info"

            :disabled="isStreaming || messages.length === 0"
            @click="handleClear"
          >
            清空
          </el-button>
          <el-button
            v-if="isStreaming"
            link
            type="danger"

            @click="stop"
          >
            停止
          </el-button>
        </slot>
      </div>
    </div>

    <div ref="messagesRef" class="re-chat__messages">
      <div
        v-for="(msg, index) in displayedMessages"
        :key="msg.id ?? index"
        class="re-chat__message"
        :class="[`re-chat__message--${msg.role}`, { 'is-streaming': isStreaming && msg.id === streamingId }]"
      >
        <div v-if="showAvatar" class="re-chat__avatar">
          <img v-if="getAvatar(msg)" :src="getAvatar(msg)" :alt="msg.sender" />
          <span v-else class="re-chat__avatar-text">{{ getAvatarText(msg) }}</span>
        </div>
        <div class="re-chat__bubble">
          <div v-if="msg.role === 'system'" class="re-chat__content re-chat__content--system">
            {{ msg.content }}
          </div>
          <template v-else>
            <div v-if="renderMarkdown" class="re-chat__content" v-html="renderContent(msg.content)" />
            <div v-else class="re-chat__content">{{ msg.content }}</div>
            <div v-if="msg.role === 'assistant' && isStreaming && msg.id === streamingId" class="re-chat__cursor" />
          </template>
        </div>
      </div>
      <div v-if="isEmpty && !isStreaming" class="re-chat__empty">
        <slot name="empty">{{ emptyText }}</slot>
      </div>
    </div>

    <div class="re-chat__input">
      <textarea
        ref="textareaRef"
        v-model="inputText"
        class="re-chat__textarea"
        :placeholder="placeholder"
        :disabled="isStreaming"
        rows="1"
        @keydown.enter.exact.prevent="handleSend"
        @input="autoResize"
      />
      <button
        class="re-chat__send"
        :disabled="!canSend"
        @click="handleSend"
      >
        <span v-if="isStreaming" class="re-chat__send-spinner" />
        <span v-else>{{ sendText }}</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * ReChat —— AI 对话组件
 *
 * 支持多模型切换（OpenAI / Claude / Gemini / 自定义），与后端 AI 服务集成。
 * 使用 @microsoft/fetch-event-source 实现流式响应。
 *
 *   <ReChat
 *     :url="'/v1/chat/completions'"
 *     :models="[
 *       { label: 'GPT-4', value: 'gpt-4', description: 'OpenAI' },
 *       { label: 'Claude', value: 'claude-3-sonnet', description: 'Anthropic' },
 *       { label: 'Gemini', value: 'gemini-pro', description: 'Google' }
 *     ]"
 *   />
 */
import { ref, computed, onMounted, nextTick, watch, shallowRef } from "vue";
import { ElMessage } from "element-plus";
import { createOpenAiSseClient, createSpringAiSseClient } from "@repo/utils/sse";
import type { SseClient, OpenAiChunk, SpringAiChunk } from "@repo/utils/types";

export interface ChatMessage {
  id?: string;
  role: "user" | "assistant" | "system";
  content: string;
  sender?: string;
  avatar?: string;
  timestamp?: number;
}

export interface ChatModel {
  label: string;
  value: string;
  description?: string;
  icon?: string;
}

interface Props {
  /** Spring AI/OpenAI 流式接口地址 */
  url: string;
  /** 协议格式 */
  protocol?: "openai" | "spring-ai";
  /** 初始消息列表 */
  messages?: ChatMessage[];
  /** 用户头像 */
  userAvatar?: string;
  /** AI 头像 */
  aiAvatar?: string;
  /** 占位符 */
  placeholder?: string;
  /** 发送按钮文字 */
  sendText?: string;
  /** 空状态文案 */
  emptyText?: string;
  /** 是否显示头像 */
  showAvatar?: boolean;
  /** 是否渲染 Markdown */
  renderMarkdown?: boolean;
  /** 请求头 */
  headers?: Record<string, string>;
  /** 上下文消息数（不包括 system） */
  contextSize?: number;
  /** 用户 ID */
  userId?: string;
  /** 会话 ID */
  conversationId?: string;
  /** Markdown 渲染器（可选外部传入） */
  markdownRenderer?: (text: string) => string;
  /** 当前模型 value */
  model?: string;
  /** 可用模型列表（包含 GPT-4 / Claude / Gemini / 自定义） */
  models?: ChatModel[];
  /** 是否显示顶部（模型切换） */
  showHeader?: boolean;
  /** 是否显示清空按钮 */
  showClear?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  protocol: "openai",
  messages: () => [],
  placeholder: "请输入消息...",
  sendText: "发送",
  emptyText: "开始对话吧",
  showAvatar: true,
  renderMarkdown: false,
  contextSize: 20,
  models: () => [],
  showHeader: true,
  showClear: true,
});

const emit = defineEmits<{
  (e: "send", message: ChatMessage): void;
  (e: "receive", content: string, fullContent: string): void;
  (e: "complete", message: ChatMessage): void;
  (e: "error", error: unknown): void;
  (e: "modelChange", model: string): void;
}>();

/**
 * 内部用 shallowRef 维护，通过 syncMessages 同步到 v-model
 */
const internalMessages = shallowRef<ChatMessage[]>([]);
watch(
  () => props.messages,
  (val) => {
    internalMessages.value = [...val];
  },
  { immediate: true, deep: true },
);

const inputText = ref("");
const isStreaming = ref(false);
const streamingId = ref<string | null>(null);
const selectedModel = ref(props.model ?? props.models[0]?.value ?? "");

const messagesRef = ref<HTMLDivElement | null>(null);
const textareaRef = ref<HTMLTextAreaElement | null>(null);
let sseClient: SseClient | null = null;
let currentAiId: string | null = null;

const displayedMessages = computed<ChatMessage[]>(() => internalMessages.value);
const isEmpty = computed(() => internalMessages.value.length === 0);
const canSend = computed(() => !isStreaming.value && inputText.value.trim().length > 0);

const getAvatar = (msg: ChatMessage): string | undefined => {
  if (msg.avatar) return msg.avatar;
  if (msg.role === "user") return props.userAvatar;
  if (msg.role === "assistant") return props.aiAvatar;
  return undefined;
};

const getAvatarText = (msg: ChatMessage): string => {
  if (msg.sender) return msg.sender.charAt(0).toUpperCase();
  if (msg.role === "user") return "U";
  if (msg.role === "assistant") return "AI";
  return "·";
};

const renderContent = (text: string): string => {
  if (props.markdownRenderer) return props.markdownRenderer(text);
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n/g, "<br/>");
};

const scrollToBottom = () => {
  nextTick(() => {
    if (messagesRef.value) {
      messagesRef.value.scrollTop = messagesRef.value.scrollHeight;
    }
  });
};

const autoResize = () => {
  if (!textareaRef.value) return;
  textareaRef.value.style.height = "auto";
  textareaRef.value.style.height = `${Math.min(textareaRef.value.scrollHeight, 160)}px`;
};

/**
 * 同步消息列表到 v-model，并触发响应式更新
 */
const syncMessages = () => {
  const snapshot = [...internalMessages.value];
  internalMessages.value = snapshot;
  emit("update:modelValue", snapshot);
  emit("change", snapshot);
};

const buildOpenAiPayload = (userMessage: string) => {
  const context = internalMessages.value
    .slice(-props.contextSize)
    .filter((m) => m.role !== "system")
    .map((m) => ({
      role: m.role,
      content: m.content,
      name: m.sender,
    }));
  return {
    model: selectedModel.value || props.model,
    stream: true,
    messages: [...context, { role: "user", content: userMessage, name: "user" }],
    user: props.userId,
  };
};

const buildSpringAiPayload = (userMessage: string) => {
  const context = internalMessages.value
    .slice(-props.contextSize)
    .filter((m) => m.role !== "system")
    .map((m) => ({
      role: m.role,
      content: m.content,
      sender: m.sender,
    }));
  return {
    messages: [...context, { role: "user", content: userMessage }],
    userId: props.userId,
    conversationId: props.conversationId,
    model: selectedModel.value || props.model,
  };
};

const buildPayload = (userMessage: string) => {
  return props.protocol === "openai"
    ? buildOpenAiPayload(userMessage)
    : buildSpringAiPayload(userMessage);
};

const handleSend = () => {
  if (!canSend.value) return;
  const text = inputText.value.trim();
  const userMessage: ChatMessage = {
    id: `user-${Date.now()}`,
    role: "user",
    content: text,
    sender: "我",
    timestamp: Date.now(),
  };
  internalMessages.value = [...internalMessages.value, userMessage];
  syncMessages();
  emit("send", userMessage);
  inputText.value = "";
  autoResize();
  scrollToBottom();

  startStreaming(text);
};

const startStreaming = (text: string) => {
  if (sseClient) {
    sseClient.close();
    sseClient = null;
  }
  isStreaming.value = true;
  const aiId = `ai-${Date.now()}`;
  currentAiId = aiId;
  streamingId.value = aiId;
  const aiMessage: ChatMessage = {
    id: aiId,
    role: "assistant",
    content: "",
    sender: getCurrentModelLabel(),
    timestamp: Date.now(),
  };
  internalMessages.value = [...internalMessages.value, aiMessage];
  syncMessages();

  const payload = buildPayload(text);

  const handleChunk = (content: string) => {
    const target = internalMessages.value.find((m) => m.id === aiId);
    if (target && content) {
      target.content = (target.content || "") + content;
      emit("receive", content, target.content);
      internalMessages.value = [...internalMessages.value];
    }
    scrollToBottom();
  };

  const handleEnd = (fullContent: string) => {
    const target = internalMessages.value.find((m) => m.id === aiId);
    if (target) {
      target.content = fullContent;
      emit("complete", target);
    }
    isStreaming.value = false;
    streamingId.value = null;
    currentAiId = null;
    internalMessages.value = [...internalMessages.value];
  };

  const handleError = (err: unknown) => {
    const target = internalMessages.value.find((m) => m.id === aiId);
    if (target && !target.content) {
      target.content = "⚠️ 请求失败，请检查网络或后端服务";
    }
    emit("error", err);
    isStreaming.value = false;
    streamingId.value = null;
    currentAiId = null;
    internalMessages.value = [...internalMessages.value];
  };

  if (props.protocol === "openai") {
    sseClient = createOpenAiSseClient(props.url, {
      headers: props.headers,
      body: payload,
      onStart: () => scrollToBottom(),
      onChunk: (chunk: OpenAiChunk) => {
        const content = chunk.choices?.[0]?.delta?.content || "";
        if (content) handleChunk(content);
      },
      onEnd: handleEnd,
      onError: handleError,
    });
  } else {
    sseClient = createSpringAiSseClient(props.url, {
      headers: props.headers,
      body: payload,
      onStart: () => scrollToBottom(),
      onChunk: (chunk: SpringAiChunk) => {
        handleChunk(chunk.content || "");
      },
      onEnd: handleEnd,
      onError: handleError,
    });
  }
};

const getCurrentModelLabel = (): string => {
  const m = props.models.find((m) => m.value === selectedModel.value);
  return m?.label || "AI";
};

const handleModelChange = (model: string) => {
  emit("modelChange", model);
};

const handleClear = () => {
  internalMessages.value = [];
  syncMessages();
};

const stop = () => {
  if (sseClient) {
    sseClient.close();
    sseClient = null;
  }
  isStreaming.value = false;
  streamingId.value = null;
  currentAiId = null;
};

const rebuildChat = () => {
  // 模型切换时清空上下文（避免跨模型上下文污染）
  if (internalMessages.value.length > 0) {
    ElMessage.info("已切换模型，旧对话已清空");
    internalMessages.value = [];
    syncMessages();
  }
};

// 监听 model 变化
watch(
  () => props.model,
  (val) => {
    if (val && val !== selectedModel.value) {
      selectedModel.value = val;
    }
  },
);

watch(
  () => selectedModel.value,
  (newVal, oldVal) => {
    if (oldVal && newVal !== oldVal) {
      rebuildChat();
    }
  },
);

onMounted(() => {
  scrollToBottom();
});

defineExpose({ stop, clear: handleClear, scrollToBottom });
</script>

<style scoped>
.re-chat {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-border-radius-base);
  overflow: hidden;
}

.re-chat__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color);
  flex-shrink: 0;
}

.re-chat__header-left,
.re-chat__header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.re-chat__model-select {
  width: 200px;
}

.re-chat__model-icon {
  display: inline-flex;
  width: 14px;
  height: 14px;
  margin-right: 2px;
  color: var(--el-color-primary);
}

.re-chat__model-icon svg {
  width: 100%;
  height: 100%;
}

.re-chat__model-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.re-chat__model-label {
  font-size: 14px;
}

.re-chat__model-desc {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.re-chat__messages {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 0;
}

.re-chat__message {
  display: flex;
  gap: 8px;
  align-items: flex-start;
}

.re-chat__message--user {
  flex-direction: row-reverse;
}

.re-chat__avatar {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--el-fill-color);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  font-size: 12px;
  font-weight: 500;
  color: var(--el-text-color-secondary);
}

.re-chat__avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.re-chat__bubble {
  max-width: 70%;
  padding: 8px 12px;
  border-radius: 8px;
  background: var(--el-fill-color-light);
  color: var(--el-text-color-primary);
  font-size: 14px;
  line-height: 1.6;
  word-break: break-word;
  position: relative;
}

.re-chat__message--user .re-chat__bubble {
  background: var(--el-color-primary);
  color: #fff;
}

.re-chat__content {
  white-space: pre-wrap;
}

.re-chat__content--system {
  font-style: italic;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.re-chat__cursor {
  display: inline-block;
  width: 2px;
  height: 14px;
  background: var(--el-color-primary);
  margin-left: 2px;
  vertical-align: middle;
  animation: re-chat-blink 1s step-start infinite;
}

@keyframes re-chat-blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

.re-chat__input {
  display: flex;
  gap: 8px;
  padding: 12px;
  border-top: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color);
  flex-shrink: 0;
}

.re-chat__textarea {
  flex: 1;
  resize: none;
  border: 1px solid var(--el-border-color);
  border-radius: var(--el-border-radius-base);
  padding: 8px 12px;
  font-size: 14px;
  font-family: inherit;
  background: var(--el-bg-color);
  color: var(--el-text-color-primary);
  outline: none;
  transition: border-color 0.2s;
  min-height: 36px;
  max-height: 160px;
}

.re-chat__textarea:focus {
  border-color: var(--el-color-primary);
}

.re-chat__textarea:disabled {
  background: var(--el-fill-color-light);
  cursor: not-allowed;
}

.re-chat__send {
  flex-shrink: 0;
  padding: 0 16px;
  height: 36px;
  border: none;
  border-radius: var(--el-border-radius-base);
  background: var(--el-color-primary);
  color: #fff;
  font-size: 14px;
  cursor: pointer;
  transition: opacity 0.2s;
}

.re-chat__send:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.re-chat__send-spinner {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: re-chat-spin 0.8s linear infinite;
}

@keyframes re-chat-spin {
  to { transform: rotate(360deg); }
}

.re-chat__empty {
  margin: auto;
  color: var(--el-text-color-secondary);
  font-size: 14px;
}
</style>
