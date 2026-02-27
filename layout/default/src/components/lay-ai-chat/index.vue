<template>
  <div
    v-if="enabled"
    ref="containerRef"
    class="ai-chat-container"
    :class="[`position-${position}`, `theme-${theme}`, `skin-${skin.value}`]"
  >
    <!-- AI 机器人图标 -->
    <div ref="botTriggerRef" class="ai-bot-trigger" @click="toggleChat">
      <div class="ai-bot-icon">
        <component :is="currentSkinIcon" />
      </div>
      <!-- 关闭状态提示：五球悬挂碰撞（牛顿摆效果） -->
      <div v-if="!isOpen" class="ai-bot-cradle" aria-hidden="true">
        <span class="cradle-ball ball-1"></span>
        <span class="cradle-ball ball-2"></span>
        <span class="cradle-ball ball-3"></span>
        <span class="cradle-ball ball-4"></span>
        <span class="cradle-ball ball-5"></span>
      </div>
    </div>

    <!-- 聊天窗口 -->
    <transition name="chat-slide">
      <div v-if="isOpen" class="ai-chat-window">
        <div class="ai-chat-header">
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

// Props
interface Props {
  visible?: boolean;
  theme?: string;
  position?: string;
  headers?: Record<string, string>;
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  theme: "default",
  position: "bottom-right",
  headers: () => ({}),
});

const { $storage } = useGlobal<GlobalPropertiesApi>();

// 使用 props 或从 storage 读取配置
const enabled = computed(() => props.visible);
const position = computed(
  () => props.position || $storage?.configure?.aiChatPosition || "bottom-right",
);
const theme = computed(
  () => props.theme || $storage?.configure?.aiChatTheme || "default",
);
const skin = ref($storage?.configure?.aiChatSkin ?? "robot");
const apiKey = ref($storage?.configure?.aiChatApiKey ?? "");
const apiUrl = ref($storage?.configure?.aiChatApiUrl ?? "");
const vendor = ref($storage?.configure?.aiChatVendor ?? "hf");
const model = ref(
  $storage?.configure?.aiChatModel ?? "Qwen/Qwen2.5-1.5B-Instruct",
);

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
const containerRef = ref<HTMLElement | null>(null);
const botTriggerRef = ref<HTMLElement | null>(null);

const skinIcons = {
  robot: RobotIcon,
  fox: FoxIcon,
  cat: CatIcon,
  bear: BearIcon,
  panda: PandaIcon,
};

const currentSkinIcon = computed(() => skinIcons[skin.value] || RobotIcon);

// 机器人与聊天窗口整体拖拽
useDraggable(containerRef, {
  handle: botTriggerRef,
  preventDefault: true,
  stopPropagation: true,
});

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
    // 构建对话历史（只保留最近 10 条消息以节省 token）
    const conversationHistory = messages.value.slice(-10).map((msg) => ({
      role: msg.role === "user" ? "user" : "assistant",
      content: msg.content,
    }));

    // 根据厂商分发请求
    const currentVendor = vendor.value || "hf";

    if (currentVendor === "chrome") {
      await sendByChrome(userMessage, conversationHistory);
      return;
    }

    // 默认使用 Hugging Face 免费推理 API（小参数模型）
    const resolvedModel =
      model.value && model.value.trim().length > 0
        ? model.value.trim()
        : "Qwen/Qwen2.5-1.5B-Instruct";
    const defaultApiUrl = `https://api-inference.huggingface.co/models/${resolvedModel}`;
    const url = apiUrl.value || defaultApiUrl;

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
    } else if ((data as any).generated_text) {
      assistantMessage = (data as any).generated_text;
    } else if ((data as any).text) {
      assistantMessage = (data as any).text;
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
    console.error("[AI][聊天] 请求失败", error);

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

/**
 * 使用 Chrome 浏览器内置 AI 能力发送消息（实验性）
 */
const sendByChrome = async (
  userMessage: string,
  conversationHistory: Array<{ role: string; content: string }>,
) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const chromeAi = (window as any).ai;
  if (!chromeAi || !chromeAi.languageModel) {
    throw new Error("当前浏览器不支持 Chrome AI 能力，请切换到 Hugging Face 等厂商。");
  }

  const session = await chromeAi.languageModel.create({
    systemPrompt:
      "你是内嵌在管理后台中的中文 AI 助手，需要用简体中文回答问题。",
  });

  const historyText = conversationHistory
    .map((item) => `${item.role === "user" ? "用户" : "助手"}: ${item.content}`)
    .join("\n");

  const fullPrompt = `${historyText}\n用户: ${userMessage}\n助手:`;
  const result = await session.prompt(fullPrompt);

  messages.value.push({
    role: "assistant",
    content: String(result).trim(),
  });
};

// 监听配置变化
watch(
  () => $storage?.configure,
  (newConfig) => {
    skin.value = newConfig?.aiChatSkin ?? "robot";
    apiKey.value = newConfig?.aiChatApiKey ?? "";
    apiUrl.value = newConfig?.aiChatApiUrl ?? "";
    vendor.value = newConfig?.aiChatVendor ?? "hf";
    model.value =
      newConfig?.aiChatModel ?? "Qwen/Qwen2.5-1.5B-Instruct";
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

.ai-bot-cradle {
  position: absolute;
  left: 50%;
  bottom: 6px;
  width: 48px;
  height: 26px;
  transform: translateX(-50%);
  pointer-events: none;

  &::before {
    content: "";
    position: absolute;
    top: 2px;
    left: 0;
    right: 0;
    height: 2px;
    background: rgba(255, 255, 255, 0.55);
    border-radius: 2px;
  }
}

.cradle-ball {
  position: absolute;
  top: 4px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.18);
  transform-origin: 50% -12px;

  &::before {
    content: "";
    position: absolute;
    top: -14px;
    left: 50%;
    width: 1px;
    height: 14px;
    background: rgba(255, 255, 255, 0.55);
    transform: translateX(-50%);
  }

  &.ball-1 {
    left: 0;
    animation: cradle-left 1.6s ease-in-out infinite;
  }

  &.ball-2 {
    left: 10px;
  }

  &.ball-3 {
    left: 20px;
  }

  &.ball-4 {
    left: 30px;
  }

  &.ball-5 {
    left: 40px;
    animation: cradle-right 1.6s ease-in-out infinite;
  }
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

@keyframes cradle-left {
  0%,
  50%,
  100% {
    transform: rotate(0deg);
  }
  10% {
    transform: rotate(-32deg);
  }
  25% {
    transform: rotate(0deg);
  }
}

@keyframes cradle-right {
  0%,
  50%,
  100% {
    transform: rotate(0deg);
  }
  60% {
    transform: rotate(32deg);
  }
  75% {
    transform: rotate(0deg);
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
