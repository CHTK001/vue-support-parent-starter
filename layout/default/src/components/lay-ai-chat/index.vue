<template>
  <div
    v-if="enabled"
    ref="el"
    class="ai-chat-container"
    :class="[`position-${position}`, `theme-${theme}`, `skin-${skin}`]"
    :style="style"
  >
    <!-- AI 机器人图标 -->
    <div class="ai-bot-trigger" @click="toggleChat">
      <div class="ai-bot-icon">
        <component :is="currentSkinIcon" />
      </div>
      <div v-if="!isOpen" class="ai-bot-pulse"></div>
    </div>

    <!-- 聊天窗口 -->
    <transition name="chat-slide">
      <div v-if="isOpen" class="ai-chat-window">
        <div ref="handle" class="ai-chat-header">
          <div class="ai-chat-title">
            <component :is="currentSkinIcon" class="title-icon" />
            <span>AI 助手</span>
          </div>
          <div class="ai-chat-actions">
            <button class="action-btn" @click="toggleChat">
              <IconifyIconOnline icon="ri:subtract-line" />
            </button>
          </div>
        </div>

        <div class="ai-chat-messages" ref="messagesContainer">
          <div
            v-for="(message, index) in messages"
            :key="index"
            class="message"
            :class="message.role"
          >
            <div class="message-avatar">
              <component
                :is="message.role === 'user' ? UserIcon : currentSkinIcon"
              />
            </div>
            <div class="message-content">
              {{ message.content }}
            </div>
          </div>
          <div v-if="isLoading" class="message assistant">
            <div class="message-avatar">
              <component :is="currentSkinIcon" />
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
            v-model="inputMessage"
            type="text"
            placeholder="输入消息..."
            @keyup.enter="sendMessage"
          />
          <button
            class="send-btn"
            @click="sendMessage"
            :disabled="!inputMessage.trim()"
          >
            <IconifyIconOnline icon="ri:send-plane-fill" />
          </button>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, watch } from "vue";
import { useDraggable } from "@vueuse/core";
import { useGlobal } from "@pureadmin/utils";

// 皮肤图标组件
const RobotIcon = { template: '<div class="skin-robot">🤖</div>' };
const FoxIcon = { template: '<div class="skin-fox">🦊</div>' };
const CatIcon = { template: '<div class="skin-cat">🐱</div>' };
const BearIcon = { template: '<div class="skin-bear">🐻</div>' };
const PandaIcon = { template: '<div class="skin-panda">🐼</div>' };
const UserIcon = { template: '<div class="skin-user">👤</div>' };

const { $storage } = useGlobal<GlobalPropertiesApi>();

// 拖拽相关
const el = ref<HTMLElement | null>(null);
const handle = ref<HTMLElement | null>(null);
const { style } = useDraggable(el, {
  handle,
  preventDefault: true,
  stopPropagation: true,
});

const enabled = ref($storage?.configure?.aiChatEnabled ?? false);
const position = ref($storage?.configure?.aiChatPosition ?? "bottom-right");
const theme = ref($storage?.configure?.aiChatTheme ?? "default");
const skin = ref($storage?.configure?.aiChatSkin ?? "robot");
const apiKey = ref($storage?.configure?.aiChatApiKey ?? "");
const apiUrl = ref($storage?.configure?.aiChatApiUrl ?? "");

const isOpen = ref(false);
const inputMessage = ref("");
const messages = ref<Array<{ role: string; content: string }>>([
  {
    role: "assistant",
    content:
      "你好！我是 AI 助手 🤖\n\n我使用 Hugging Face 的免费 AI 模型为您服务。\n\n💡 使用提示：\n- 首次使用时模型需要加载（约 20 秒）\n- 无需 API Key 即可使用\n- 可在系统设置中自定义模型\n\n有什么可以帮助你的吗？",
  },
]);
const isLoading = ref(false);
const messagesContainer = ref<HTMLElement>();

const skinIcons = {
  robot: RobotIcon,
  fox: FoxIcon,
  cat: CatIcon,
  bear: BearIcon,
  panda: PandaIcon,
};

const currentSkinIcon = computed(() => skinIcons[skin.value] || RobotIcon);

const toggleChat = () => {
  isOpen.value = !isOpen.value;
  if (isOpen.value) {
    nextTick(() => {
      scrollToBottom();
    });
  }
};

const scrollToBottom = () => {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
  }
};

const sendMessage = async () => {
  if (!inputMessage.value.trim()) return;

  const userMessage = inputMessage.value.trim();
  messages.value.push({
    role: "user",
    content: userMessage,
  });

  inputMessage.value = "";
  isLoading.value = true;

  nextTick(() => {
    scrollToBottom();
  });

  try {
    // 默认使用 Hugging Face 免费推理 API
    const defaultApiUrl =
      "https://api-inference.huggingface.co/models/Qwen/Qwen2.5-7B-Instruct";
    const url = apiUrl.value || defaultApiUrl;

    // 构建对话历史（只保留最近 10 条消息以节省 token）
    const conversationHistory = messages.value.slice(-10).map((msg) => ({
      role: msg.role === "user" ? "user" : "assistant",
      content: msg.content,
    }));

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    // 如果配置了 API Key，则添加到请求头
    if (apiKey.value) {
      headers["Authorization"] = `Bearer ${apiKey.value}`;
    }

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({
        inputs: userMessage,
        parameters: {
          max_new_tokens: 512,
          temperature: 0.7,
          top_p: 0.95,
          return_full_text: false,
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));

      // 处理常见错误
      if (response.status === 503) {
        throw new Error("模型正在加载中，请稍后再试（约 20 秒）");
      } else if (response.status === 429) {
        throw new Error("请求过于频繁，请稍后再试");
      } else if (response.status === 401) {
        throw new Error("API Key 无效或已过期");
      } else {
        throw new Error(errorData.error || `请求失败: ${response.status}`);
      }
    }

    const data = await response.json();

    // 处理不同的响应格式
    let assistantMessage = "";
    if (Array.isArray(data) && data.length > 0) {
      assistantMessage =
        data[0].generated_text || data[0].text || "抱歉，我无法生成回复。";
    } else if (data.generated_text) {
      assistantMessage = data.generated_text;
    } else if (data.text) {
      assistantMessage = data.text;
    } else if (typeof data === "string") {
      assistantMessage = data;
    } else {
      assistantMessage = "抱歉，我无法理解服务器的响应。";
    }

    messages.value.push({
      role: "assistant",
      content: assistantMessage.trim(),
    });
  } catch (error) {
    console.error("AI Chat Error:", error);

    let errorMessage = "抱歉，发生了错误。";
    if (error instanceof Error) {
      errorMessage = error.message;
    }

    // 如果是网络错误，提供更友好的提示
    if (
      errorMessage.includes("Failed to fetch") ||
      errorMessage.includes("NetworkError")
    ) {
      errorMessage = "网络连接失败，请检查您的网络设置。";
    }

    messages.value.push({
      role: "assistant",
      content: `❌ ${errorMessage}\n\n💡 提示：\n- 首次使用时模型需要加载（约 20 秒）\n- 可以在系统设置中配置自定义 API URL\n- 默认使用 Hugging Face 免费推理 API`,
    });
  } finally {
    isLoading.value = false;
    nextTick(() => {
      scrollToBottom();
    });
  }
};

// 监听配置变化
watch(
  () => $storage?.configure,
  (newConfig) => {
    enabled.value = newConfig?.aiChatEnabled ?? false;
    position.value = newConfig?.aiChatPosition ?? "bottom-right";
    theme.value = newConfig?.aiChatTheme ?? "default";
    skin.value = newConfig?.aiChatSkin ?? "robot";
    apiKey.value = newConfig?.aiChatApiKey ?? "";
    apiUrl.value = newConfig?.aiChatApiUrl ?? "";
  },
  { deep: true },
);
</script>

<style scoped lang="scss">
.ai-chat-container {
  position: fixed;
  z-index: 9999;

  &.position-bottom-right {
    bottom: 24px;
    right: 24px;
  }

  &.position-bottom-left {
    bottom: 24px;
    left: 24px;
  }

  &.position-bottom-center {
    bottom: 24px;
    left: 50%;
    transform: translateX(-50%);
  }
}

.ai-bot-trigger {
  position: relative;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 4px 20px rgba(102, 126, 234, 0.4);
  transition: all 0.3s ease;

  &:hover {
    transform: scale(1.1);
    box-shadow: 0 6px 30px rgba(102, 126, 234, 0.6);
  }
}

.ai-bot-icon {
  font-size: 32px;
  animation: float 3s ease-in-out infinite;
}

.ai-bot-pulse {
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  border: 2px solid rgba(102, 126, 234, 0.6);
  animation: pulse 2s ease-out infinite;
}

.ai-chat-window {
  position: absolute;
  bottom: 80px;
  right: 0;
  width: 380px;
  height: 500px;
  background: var(--el-bg-color);
  border-radius: 16px;
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.12);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.ai-chat-header {
  padding: 16px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: move;
  user-select: none;
  touch-action: none;
}

.ai-chat-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;

  .title-icon {
    font-size: 24px;
  }
}

.ai-chat-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.3);
  }
}

.ai-chat-messages {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.message {
  display: flex;
  gap: 12px;

  &.user {
    flex-direction: row-reverse;

    .message-content {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }
  }

  &.assistant {
    .message-content {
      background: var(--el-fill-color-light);
      color: var(--el-text-color-primary);
    }
  }
}

.message-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--el-fill-color);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
}

.message-content {
  max-width: 70%;
  padding: 12px 16px;
  border-radius: 12px;
  word-wrap: break-word;

  &.loading {
    display: flex;
    gap: 4px;
    padding: 16px;

    .dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--el-text-color-secondary);
      animation: bounce 1.4s ease-in-out infinite;

      &:nth-child(1) {
        animation-delay: 0s;
      }
      &:nth-child(2) {
        animation-delay: 0.2s;
      }
      &:nth-child(3) {
        animation-delay: 0.4s;
      }
    }
  }
}

.ai-chat-input {
  padding: 16px 20px;
  border-top: 1px solid var(--el-border-color);
  display: flex;
  gap: 12px;

  input {
    flex: 1;
    padding: 10px 16px;
    border: 1px solid var(--el-border-color);
    border-radius: 8px;
    background: var(--el-fill-color-blank);
    color: var(--el-text-color-primary);
    outline: none;
    transition: all 0.2s;

    &:focus {
      border-color: var(--el-color-primary);
    }
  }
}

.send-btn {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    transform: scale(1.05);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.chat-slide-enter-active,
.chat-slide-leave-active {
  transition: all 0.3s ease;
}

.chat-slide-enter-from,
.chat-slide-leave-to {
  opacity: 0;
  transform: translateY(20px) scale(0.95);
}

@keyframes float {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

@keyframes pulse {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  100% {
    transform: scale(1.5);
    opacity: 0;
  }
}

@keyframes bounce {
  0%,
  80%,
  100% {
    transform: scale(0);
  }
  40% {
    transform: scale(1);
  }
}

// 主题样式
.theme-blue {
  .ai-bot-trigger {
    background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  }
  .ai-chat-header {
    background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  }
  .message.user .message-content {
    background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  }
  .send-btn {
    background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  }
}

.theme-green {
  .ai-bot-trigger {
    background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
  }
  .ai-chat-header {
    background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
  }
  .message.user .message-content {
    background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
  }
  .send-btn {
    background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
  }
}

.theme-orange {
  .ai-bot-trigger {
    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  }
  .ai-chat-header {
    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  }
  .message.user .message-content {
    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  }
  .send-btn {
    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  }
}

.theme-pink {
  .ai-bot-trigger {
    background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%);
  }
  .ai-chat-header {
    background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%);
  }
  .message.user .message-content {
    background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%);
  }
  .send-btn {
    background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%);
  }
}

.theme-dark {
  .ai-bot-trigger {
    background: linear-gradient(135deg, #434343 0%, #000000 100%);
  }
  .ai-chat-header {
    background: linear-gradient(135deg, #434343 0%, #000000 100%);
  }
  .message.user .message-content {
    background: linear-gradient(135deg, #434343 0%, #000000 100%);
  }
  .send-btn {
    background: linear-gradient(135deg, #434343 0%, #000000 100%);
  }
}
</style>
