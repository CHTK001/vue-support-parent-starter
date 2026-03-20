<template>
  <div class="ai-chat-window" :class="{ fullscreen: isFullscreen }">
    <div class="ai-chat-header">
      <div class="ai-chat-title">
        <span>AI 助手</span>
      </div>
      <div class="ai-chat-actions">
        <!-- 全屏/还原按钮 -->
        <button class="action-btn" :title="isFullscreen ? '还原' : '全屏'" @click="toggleFullscreen">
          <IconifyIconOnline :icon="isFullscreen ? 'ri:fullscreen-exit-line' : 'ri:fullscreen-line'" />
        </button>
        <button class="action-btn" @click="$emit('toggle')">
          <IconifyIconOnline icon="ri:subtract-line" />
        </button>
      </div>
    </div>

    <div class="ai-chat-messages" ref="messagesContainerRef">
      <div
        v-for="(message, index) in messages"
        v-show="!(message.role === 'assistant' && message.content === '')"
        :key="index"
        class="message"
        :class="message.role"
      >
        <div class="message-avatar">
          <!-- 用户消息：优先显示真实头像，无头像时降级为 emoji 组件 -->
          <template v-if="message.role === 'user'">
            <img v-if="userAvatar" :src="userAvatar" class="avatar-img" alt="用户头像" />
            <component v-else :is="userIcon" />
          </template>
          <component v-else :is="appearanceComponent" />
        </div>
        <div class="message-content">
          {{ message.content }}
        </div>
      </div>
      <!-- isLoading 用于 chrome/hf 非流式模式；vendor 流式模式用空占位消息表示 loading -->
      <div v-if="isLoading || (messages.at(-1)?.role === 'assistant' && messages.at(-1)?.content === '')" class="message assistant">
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
  /** 用户头像组件（降级用） */
  userIcon: any;
  /** 用户头像 URL（优先显示） */
  userAvatar?: string;
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
/** 全屏状态 */
const isFullscreen = ref(false);

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

function toggleFullscreen(): void {
  isFullscreen.value = !isFullscreen.value;
}
</script>

<style scoped lang="scss">
.ai-chat-window {
  position: absolute;
  right: 0;
  bottom: 88px;
  width: 400px;
  max-height: 580px;
  display: flex;
  flex-direction: column;
<<<<<<< HEAD
  border-radius: var(--stitch-radius-xl, 20px);
  background: radial-gradient(circle at top left, rgba(116, 127, 255, 0.12), transparent 60%),
    radial-gradient(circle at bottom right, rgba(56, 189, 248, 0.14), transparent 55%),
    rgba(17, 24, 39, 0.92);
  border: 1px solid rgba(148, 163, 184, 0.3);
=======
  border-radius: 18px;
  background:
    radial-gradient(
      circle at top left,
      rgba(116, 127, 255, 0.14),
      transparent 55%
    ),
    radial-gradient(
      circle at bottom right,
      rgba(56, 189, 248, 0.16),
      transparent 50%
    ),
    rgba(17, 24, 39, 0.86);
  border: 1px solid rgba(148, 163, 184, 0.35);
>>>>>>> 0b6528f1dfbf32db414a1a5d12846317583de126
  box-shadow:
    0 20px 70px rgba(15, 23, 42, 0.7),
    0 8px 32px rgba(15, 23, 42, 0.5),
    0 0 0 1px rgba(99, 102, 241, 0.1);
  backdrop-filter: blur(24px);
  overflow: hidden;
  transition: all var(--stitch-transition-base, 0.3s) ease;

  &:hover {
    box-shadow:
      0 24px 80px rgba(15, 23, 42, 0.8),
      0 12px 40px rgba(15, 23, 42, 0.6),
      0 0 0 1px rgba(99, 102, 241, 0.2);
  }

  &.fullscreen {
    position: fixed;
    inset: 0;
    right: 0;
    bottom: 0;
    width: 100vw;
    max-height: 100vh;
    border-radius: 0;
    z-index: 10000;
  }
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
  font-weight: 600;
  font-size: 14px;
  letter-spacing: 0.02em;
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
  animation: messageSlideIn 0.3s ease-out;

  &.user {
    flex-direction: row-reverse;

    .message-content {
      background: linear-gradient(135deg, #4f46e5 0%, #6366f1 50%, #818cf8 100%);
      color: white;
      box-shadow: 
        0 8px 20px rgba(79, 70, 229, 0.35),
        0 2px 8px rgba(79, 70, 229, 0.2);
      border: 1px solid rgba(255, 255, 255, 0.1);

      &:hover {
        box-shadow: 
          0 12px 28px rgba(79, 70, 229, 0.45),
          0 4px 12px rgba(79, 70, 229, 0.3);
        transform: translateY(-1px);
      }
    }
  }

  &.assistant {
    .message-content {
      background: linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.9) 100%);
      border: 1px solid rgba(148, 163, 184, 0.35);
      color: #e5e7eb;
      box-shadow: 
        0 4px 12px rgba(15, 23, 42, 0.4),
        0 2px 6px rgba(15, 23, 42, 0.2);

      &:hover {
        background: linear-gradient(135deg, rgba(30, 41, 59, 0.95) 0%, rgba(51, 65, 85, 0.9) 100%);
        border-color: rgba(148, 163, 184, 0.45);
        transform: translateY(-1px);
      }
    }
  }
}

@keyframes messageSlideIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.message-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(15, 23, 42, 0.9);
  border: 2px solid rgba(148, 163, 184, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  flex-shrink: 0;
  box-shadow: 0 6px 18px rgba(15, 23, 42, 0.6);
  overflow: hidden;
  transition: all var(--stitch-transition-base, 0.3s) ease;
  position: relative;

  // 用户头像样式增强
  .message.user & {
    border-color: rgba(99, 102, 241, 0.5);
    box-shadow: 
      0 6px 18px rgba(79, 70, 229, 0.4),
      0 0 0 3px rgba(99, 102, 241, 0.1);

    &:hover {
      transform: scale(1.05);
      box-shadow: 
        0 8px 24px rgba(79, 70, 229, 0.5),
        0 0 0 4px rgba(99, 102, 241, 0.15);
    }
  }

  // AI 头像样式增强
  .message.assistant & {
    background: linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(139, 92, 246, 0.1) 100%);
    border-color: rgba(99, 102, 241, 0.3);
    box-shadow: 
      0 6px 18px rgba(15, 23, 42, 0.6),
      0 0 0 3px rgba(99, 102, 241, 0.05);

    &:hover {
      transform: scale(1.05) rotate(5deg);
      box-shadow: 
        0 8px 24px rgba(99, 102, 241, 0.4),
        0 0 0 4px rgba(99, 102, 241, 0.1);
    }
  }

  .avatar-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 50%;
  }
}

.message-content {
  max-width: 76%;
  padding: 12px 16px;
  border-radius: var(--stitch-radius-lg, 16px);
  font-size: 13px;
  line-height: 1.6;
  word-wrap: break-word;
  white-space: pre-wrap;
  position: relative;
  transition: all var(--stitch-transition-base, 0.3s) ease;

  // 用户消息气泡尾巴（右侧）
  .message.user & {
    border-top-right-radius: var(--stitch-radius-sm, 4px);
    
    &::after {
      content: '';
      position: absolute;
      top: 0;
      right: -6px;
      width: 0;
      height: 0;
      border-style: solid;
      border-width: 0 0 12px 12px;
      border-color: transparent transparent transparent #4f46e5;
    }
  }

  // AI 消息气泡尾巴（左侧）
  .message.assistant & {
    border-top-left-radius: var(--stitch-radius-sm, 4px);
    
    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: -6px;
      width: 0;
      height: 0;
      border-style: solid;
      border-width: 0 12px 12px 0;
      border-color: transparent rgba(15, 23, 42, 0.9) transparent transparent;
    }
  }

  &.loading {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 10px 14px;
    background: rgba(15, 23, 42, 0.95);
    border: 1px solid rgba(148, 163, 184, 0.3);
    border-radius: var(--stitch-radius-lg, 16px);

    .dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: linear-gradient(135deg, #6366f1, #a5b4fc);
      animation: bounce 1.2s ease-in-out infinite;
      box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3);

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
  background: linear-gradient(
    to top,
    rgba(15, 23, 42, 0.96),
    rgba(15, 23, 42, 0.9)
  );

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
