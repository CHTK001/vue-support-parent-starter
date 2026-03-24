<template>
  <div class="ai-chat-window">
    <div class="ai-chat-header">
      <div class="ai-chat-title">
        <component :is="appearanceComponent" class="title-icon" />
        <span>AI 助手</span>
      </div>
      <div class="ai-chat-actions">
        <button class="action-btn" @click="$emit('toggle')">
          <IconifyIconOnline icon="ri:subtract-line" />
        </button>
      </div>
    </div>

    <div class="ai-chat-messages" ref="messagesContainerRef">
      <div
        v-for="(message, index) in messages"
        :key="index"
        class="message"
        :class="message.role"
      >
        <div class="message-avatar">
          <component
            :is="message.role === 'user' ? userIcon : appearanceComponent"
          />
        </div>
        <div class="message-content">
          {{ message.content }}
        </div>
      </div>
      <div v-if="isLoading" class="message assistant">
        <div class="message-avatar">
          <component :is="appearanceComponent" />
        </div>
        <div class="message-content loading">
          <span class="dot"></span>
          <span class="dot"></span>
          <span class="dot"></span>
        </div>
      </div>
    </div>

    <div class="ai-chat-input">
      <input
        v-model="innerInput"
        type="text"
        placeholder="输入消息..."
        @keyup.enter="handleSend"
      />
      <button
        class="send-btn"
        @click="handleSend"
        :disabled="!innerInput.trim()"
      >
        <IconifyIconOnline icon="ri:send-plane-fill" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { nextTick, ref, watch } from "vue";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const props = defineProps<{
  /** 当前外观组件 */
  appearanceComponent: any;
  /** 用户头像组件 */
  userIcon: any;
  /** 消息列表 */
  messages: Array<Message>;
  /** 输入框内容 */
  input: string;
  /** 是否加载中 */
  isLoading: boolean;
}>();

const emit = defineEmits<{
  (e: "update:input", value: string): void;
  (e: "send", value: string): void;
  (e: "toggle"): void;
}>();

const innerInput = ref(props.input);
const messagesContainerRef = ref<HTMLElement>();

watch(
  () => props.input,
  (val) => {
    innerInput.value = val;
  },
);

watch(
  () => props.messages.length,
  () => {
    nextTick(() => {
      if (messagesContainerRef.value) {
        messagesContainerRef.value.scrollTop =
          messagesContainerRef.value.scrollHeight;
      }
    });
  },
);

function handleSend(): void {
  const value = innerInput.value.trim();
  if (!value) {
    return;
  }
  emit("update:input", "");
  innerInput.value = "";
  emit("send", value);
}
</script>

<style scoped lang="scss">
.ai-chat-window {
  position: absolute;
  right: 0;
  bottom: 88px;
  width: 380px;
  max-height: 540px;
  display: flex;
  flex-direction: column;
  border-radius: 18px;
  background: radial-gradient(circle at top left, rgba(116, 127, 255, 0.14), transparent 55%),
    radial-gradient(circle at bottom right, rgba(56, 189, 248, 0.16), transparent 50%),
    rgba(17, 24, 39, 0.86);
  border: 1px solid rgba(148, 163, 184, 0.35);
  box-shadow:
    0 18px 60px rgba(15, 23, 42, 0.65),
    0 0 0 1px rgba(15, 23, 42, 0.9);
  backdrop-filter: blur(18px);
  overflow: hidden;
}

.ai-chat-header {
  padding: 14px 18px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #e5e7eb;
  border-bottom: 1px solid rgba(148, 163, 184, 0.35);
}

.ai-chat-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 600;
  font-size: 14px;
  letter-spacing: 0.02em;

  .title-icon {
    width: 28px;
    height: 28px;
    border-radius: 999px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: radial-gradient(circle at 30% 0, #a5b4fc, #6366f1);
    color: #0f172a;
    box-shadow: 0 0 0 1px rgba(129, 140, 248, 0.35);
  }
}

.ai-chat-actions {
  display: flex;
  gap: 6px;
}

.action-btn {
  width: 26px;
  height: 26px;
  border-radius: 999px;
  border: none;
  background: rgba(15, 23, 42, 0.7);
  color: #9ca3af;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.18s ease-out;

  &:hover {
    background: rgba(31, 41, 55, 0.95);
    color: #e5e7eb;
    transform: translateY(-0.5px);
  }
}

.ai-chat-messages {
  flex: 1;
  padding: 16px 16px 12px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.message {
  display: flex;
  gap: 10px;

  &.user {
    flex-direction: row-reverse;

    .message-content {
      background: linear-gradient(135deg, #4f46e5, #6366f1);
      color: white;
      box-shadow: 0 8px 20px rgba(79, 70, 229, 0.45);
    }
  }

  &.assistant {
    .message-content {
      background: rgba(15, 23, 42, 0.9);
      border: 1px solid rgba(148, 163, 184, 0.35);
      color: #e5e7eb;
    }
  }
}

.message-avatar {
  width: 32px;
  height: 32px;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.9);
  border: 1px solid rgba(148, 163, 184, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  flex-shrink: 0;
  box-shadow: 0 6px 18px rgba(15, 23, 42, 0.75);
}

.message-content {
  max-width: 76%;
  padding: 10px 14px;
  border-radius: 14px;
  font-size: 13px;
  line-height: 1.6;
  word-wrap: break-word;
  white-space: pre-wrap;

  &.loading {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 12px;
    background: rgba(15, 23, 42, 0.95);
    border: 1px solid rgba(148, 163, 184, 0.3);

    .dot {
      width: 6px;
      height: 6px;
      border-radius: 999px;
      background: #9ca3af;
      animation: bounce 1.2s ease-in-out infinite;

      &:nth-child(1) {
        animation-delay: 0s;
      }
      &:nth-child(2) {
        animation-delay: 0.18s;
      }
      &:nth-child(3) {
        animation-delay: 0.36s;
      }
    }
  }
}

.ai-chat-input {
  padding: 10px 12px 12px;
  border-top: 1px solid rgba(148, 163, 184, 0.35);
  display: flex;
  align-items: flex-end;
  gap: 10px;
  background: linear-gradient(to top, rgba(15, 23, 42, 0.96), rgba(15, 23, 42, 0.9));

  input {
    flex: 1;
    padding: 9px 12px;
    border-radius: 999px;
    border: 1px solid rgba(55, 65, 81, 0.8);
    background: rgba(15, 23, 42, 0.95);
    color: #e5e7eb;
    outline: none;
    font-size: 13px;
    transition: all 0.18s ease-out;

    &::placeholder {
      color: #6b7280;
    }

    &:focus {
      border-color: #6366f1;
      box-shadow: 0 0 0 1px rgba(99, 102, 241, 0.45);
    }
  }
}

.send-btn {
  width: 34px;
  height: 34px;
  border-radius: 999px;
  border: none;
  background: radial-gradient(circle at 30% 0, #a5b4fc, #6366f1);
  color: #0f172a;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 10px 25px rgba(79, 70, 229, 0.55);
  transition: all 0.18s ease-out;

  &:hover:not(:disabled) {
    transform: translateY(-1px) scale(1.03);
    box-shadow: 0 14px 30px rgba(79, 70, 229, 0.7);
  }

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
    box-shadow: none;
  }
}

@keyframes bounce {
  0%,
  80%,
  100% {
    transform: scale(0);
    opacity: 0.4;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}
</style>
