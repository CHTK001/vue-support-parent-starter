<script setup lang="ts">
/**
 * AI 聊天机器人组件
 * 悬浮在页面右下角，点击展开聊天窗口
 * 支持多种皮肤主题
 * @author CH
 * @since 2024-12-07
 * @version 1.0.0
 */
import { ref, nextTick, computed } from "vue";

const props = defineProps({
  /**
   * 是否显示组件
   */
  visible: {
    type: Boolean,
    default: true
  },
  /**
   * 机器人名称
   */
  botName: {
    type: String,
    default: "AI 助手"
  },
  /**
   * 欢迎消息
   */
  welcomeMessage: {
    type: String,
    default: "你好！我是智能助手，有什么可以帮您的吗？"
  },
  /**
   * 皮肤主题
   * - default: 默认紫色渐变
   * - blue: 蓝色科技风
   * - green: 绿色清新风
   * - orange: 橙色活力风
   * - pink: 粉色可爱风
   * - dark: 暗黑酷炫风
   */
  theme: {
    type: String,
    default: "default",
    validator: (val: string) => ["default", "blue", "green", "orange", "pink", "dark"].includes(val)
  }
});

// 主题颜色映射
const themeColors = computed(() => {
  const themes = {
    default: {
      primary: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      primaryColor: "#667eea",
      shadow: "rgba(102, 126, 234, 0.4)"
    },
    blue: {
      primary: "linear-gradient(135deg, #00c6fb 0%, #005bea 100%)",
      primaryColor: "#00c6fb",
      shadow: "rgba(0, 198, 251, 0.4)"
    },
    green: {
      primary: "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)",
      primaryColor: "#11998e",
      shadow: "rgba(17, 153, 142, 0.4)"
    },
    orange: {
      primary: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
      primaryColor: "#f093fb",
      shadow: "rgba(240, 147, 251, 0.4)"
    },
    pink: {
      primary: "linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)",
      primaryColor: "#ff9a9e",
      shadow: "rgba(255, 154, 158, 0.4)"
    },
    dark: {
      primary: "linear-gradient(135deg, #434343 0%, #000000 100%)",
      primaryColor: "#434343",
      shadow: "rgba(67, 67, 67, 0.4)"
    }
  };
  return themes[props.theme] || themes.default;
});

const emit = defineEmits(["send", "open", "close"]);

// 聊天窗口是否展开
const isOpen = ref(false);
// 输入的消息
const inputMessage = ref("");
// 消息列表
const messages = ref<Array<{
  id: number;
  type: "user" | "bot";
  content: string;
  time: Date;
  loading?: boolean;
}>>([]);
// 消息容器引用
const messagesRef = ref<HTMLElement | null>(null);
// 输入框引用
const inputRef = ref<HTMLInputElement | null>(null);
// 是否正在输入（机器人打字效果）
const isTyping = ref(false);
// 消息ID计数器
let messageId = 0;

/**
 * 切换聊天窗口
 */
const toggleChat = () => {
  isOpen.value = !isOpen.value;
  if (isOpen.value) {
    emit("open");
    // 首次打开添加欢迎消息
    if (messages.value.length === 0) {
      addBotMessage(props.welcomeMessage);
    }
    // 聚焦输入框
    nextTick(() => {
      inputRef.value?.focus();
    });
  } else {
    emit("close");
  }
};

/**
 * 关闭聊天窗口
 */
const closeChat = () => {
  isOpen.value = false;
  emit("close");
};

/**
 * 添加用户消息
 */
const addUserMessage = (content: string) => {
  messages.value.push({
    id: ++messageId,
    type: "user",
    content,
    time: new Date()
  });
  scrollToBottom();
};

/**
 * 添加机器人消息
 */
const addBotMessage = (content: string, loading = false) => {
  const msg = {
    id: ++messageId,
    type: "bot" as const,
    content,
    time: new Date(),
    loading
  };
  messages.value.push(msg);
  scrollToBottom();
  return msg.id;
};

/**
 * 更新机器人消息
 */
const updateBotMessage = (id: number, content: string, loading = false) => {
  const msg = messages.value.find(m => m.id === id);
  if (msg) {
    msg.content = content;
    msg.loading = loading;
  }
};

/**
 * 滚动到底部
 */
const scrollToBottom = () => {
  nextTick(() => {
    if (messagesRef.value) {
      messagesRef.value.scrollTop = messagesRef.value.scrollHeight;
    }
  });
};

/**
 * 发送消息
 */
const sendMessage = async () => {
  const content = inputMessage.value.trim();
  if (!content || isTyping.value) return;
  
  // 添加用户消息
  addUserMessage(content);
  inputMessage.value = "";
  
  // 触发发送事件（用于外部处理）
  emit("send", content);
  
  // 模拟机器人回复（后续可替换为真实API调用）
  isTyping.value = true;
  const loadingId = addBotMessage("", true);
  
  // 模拟打字延迟
  await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 800));
  
  // 模拟回复（后续替换为真实API）
  const replies = [
    "这是一个很好的问题！让我想想...",
    "我理解您的需求，请稍等我为您处理。",
    "感谢您的提问！这个功能正在开发中，敬请期待。",
    "您好！我是AI助手，目前正在学习中，后续会更加智能哦~",
    "收到！我会尽力帮助您解决问题。"
  ];
  const reply = replies[Math.floor(Math.random() * replies.length)];
  
  // 打字效果
  let displayText = "";
  for (let i = 0; i < reply.length; i++) {
    displayText += reply[i];
    updateBotMessage(loadingId, displayText, true);
    await new Promise(resolve => setTimeout(resolve, 25 + Math.random() * 25));
  }
  
  updateBotMessage(loadingId, reply, false);
  isTyping.value = false;
};

/**
 * 处理键盘事件
 */
const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
};

/**
 * 格式化时间
 */
const formatTime = (date: Date) => {
  return date.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });
};

/**
 * 清空聊天记录
 */
const clearMessages = () => {
  messages.value = [];
  addBotMessage(props.welcomeMessage);
};

// 暴露方法供外部调用
defineExpose({
  toggleChat,
  closeChat,
  addBotMessage,
  clearMessages,
  isOpen
});
</script>

<template>
  <div 
    v-if="visible" 
    class="ai-chat-wrapper"
    :style="{
      '--ai-primary': themeColors.primary,
      '--ai-primary-color': themeColors.primaryColor,
      '--ai-shadow': themeColors.shadow
    }"
  >
    <!-- 悬浮按钮 -->
    <Transition name="bounce">
      <button 
        v-show="!isOpen" 
        class="ai-fab"
        @click="toggleChat"
        title="AI 助手"
      >
        <div class="ai-fab__icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z"/>
            <circle cx="7.5" cy="14.5" r="1.5"/>
            <circle cx="16.5" cy="14.5" r="1.5"/>
          </svg>
        </div>
        <div class="ai-fab__pulse"></div>
        <div class="ai-fab__pulse ai-fab__pulse--delay"></div>
      </button>
    </Transition>

    <!-- 聊天窗口 -->
    <Transition name="slide-up">
      <div v-show="isOpen" class="ai-chat-window">
        <!-- 头部 -->
        <div class="ai-chat-header">
          <div class="ai-chat-header__info">
            <div class="ai-avatar">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z"/>
                <circle cx="7.5" cy="14.5" r="1.5"/>
                <circle cx="16.5" cy="14.5" r="1.5"/>
              </svg>
            </div>
            <div class="ai-chat-header__text">
              <span class="ai-chat-header__name">{{ botName }}</span>
              <span class="ai-chat-header__status">
                <i class="status-dot"></i>
                在线
              </span>
            </div>
          </div>
          <div class="ai-chat-header__actions">
            <button class="header-btn" @click="clearMessages" title="清空记录">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              </svg>
            </button>
            <button class="header-btn" @click="closeChat" title="关闭">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- 消息列表 -->
        <div ref="messagesRef" class="ai-chat-messages">
          <TransitionGroup name="message">
            <div 
              v-for="msg in messages" 
              :key="msg.id"
              class="message"
              :class="[`message--${msg.type}`]"
            >
              <div v-if="msg.type === 'bot'" class="message__avatar">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z"/>
                  <circle cx="7.5" cy="14.5" r="1.5"/>
                  <circle cx="16.5" cy="14.5" r="1.5"/>
                </svg>
              </div>
              <div class="message__content">
                <div class="message__bubble">
                  <span v-if="msg.loading && !msg.content" class="typing-indicator">
                    <i></i><i></i><i></i>
                  </span>
                  <span v-else>{{ msg.content }}</span>
                  <span v-if="msg.loading && msg.content" class="typing-cursor">|</span>
                </div>
                <div class="message__time">{{ formatTime(msg.time) }}</div>
              </div>
            </div>
          </TransitionGroup>
        </div>

        <!-- 输入区域 -->
        <div class="ai-chat-input">
          <input
            ref="inputRef"
            v-model="inputMessage"
            type="text"
            placeholder="输入消息..."
            :disabled="isTyping"
            @keydown="handleKeydown"
          />
          <button 
            class="send-btn" 
            :disabled="!inputMessage.trim() || isTyping"
            @click="sendMessage"
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
            </svg>
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style lang="scss" scoped>
.ai-chat-wrapper {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 2000;
}

// ==================== 悬浮按钮 ====================
.ai-fab {
  position: relative;
  width: 56px;
  height: 56px;
  border: none;
  border-radius: 50%;
  background: var(--ai-primary);
  color: white;
  cursor: pointer;
  box-shadow: 0 4px 20px var(--ai-shadow);
  transition: all 0.3s ease;
  
  &:hover {
    transform: scale(1.1);
    box-shadow: 0 6px 30px var(--ai-shadow);
  }
  
  &:active {
    transform: scale(0.95);
  }
  
  &__icon {
    position: relative;
    z-index: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    animation: float 3s ease-in-out infinite;
    
    svg {
      width: 28px;
      height: 28px;
    }
  }
  
  &__pulse {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background: inherit;
    opacity: 0;
    animation: pulse-ring 2s ease-out infinite;
    
    &--delay {
      animation-delay: 1s;
    }
  }
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
}

@keyframes pulse-ring {
  0% {
    transform: scale(1);
    opacity: 0.5;
  }
  100% {
    transform: scale(1.8);
    opacity: 0;
  }
}

// ==================== 聊天窗口 ====================
.ai-chat-window {
  position: absolute;
  bottom: 70px;
  right: 0;
  width: 360px;
  height: 500px;
  background: var(--el-bg-color, #fff);
  border-radius: 16px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid var(--el-border-color-lighter, #ebeef5);
  
  :global(.dark) & {
    background: var(--el-bg-color-overlay, #1d1e1f);
    border-color: var(--el-border-color, #4c4d4f);
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4);
  }
}

// ==================== 头部 ====================
.ai-chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  background: var(--ai-primary);
  color: white;
  
  &__info {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  
  &__text {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  
  &__name {
    font-size: 15px;
    font-weight: 600;
  }
  
  &__status {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    opacity: 0.9;
    
    .status-dot {
      width: 8px;
      height: 8px;
      background: #4ade80;
      border-radius: 50%;
      animation: status-pulse 2s ease-in-out infinite;
    }
  }
  
  &__actions {
    display: flex;
    gap: 8px;
  }
}

.ai-avatar {
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  
  svg {
    width: 24px;
    height: 24px;
  }
}

.header-btn {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.15);
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
  
  &:hover {
    background: rgba(255, 255, 255, 0.25);
  }
  
  svg {
    width: 16px;
    height: 16px;
  }
}

@keyframes status-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

// ==================== 消息列表 ====================
.ai-chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  
  &::-webkit-scrollbar {
    width: 4px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: var(--el-border-color, #dcdfe6);
    border-radius: 2px;
  }
}

.message {
  display: flex;
  gap: 10px;
  max-width: 85%;
  animation: message-in 0.3s ease;
  
  &--user {
    flex-direction: row-reverse;
    align-self: flex-end;
    
    .message__bubble {
      background: var(--ai-primary);
      color: white;
      border-radius: 16px 16px 4px 16px;
    }
    
    .message__time {
      text-align: right;
    }
  }
  
  &--bot {
    align-self: flex-start;
    
    .message__bubble {
      background: var(--el-fill-color-light, #f4f4f5);
      color: var(--el-text-color-primary, #303133);
      border-radius: 16px 16px 16px 4px;
      
      :global(.dark) & {
        background: var(--el-fill-color, #303133);
        color: var(--el-text-color-primary, #e5eaf3);
      }
    }
  }
  
  &__avatar {
    width: 32px;
    height: 32px;
    min-width: 32px;
    background: var(--ai-primary);
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    
    svg {
      width: 18px;
      height: 18px;
    }
  }
  
  &__content {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  
  &__bubble {
    padding: 10px 14px;
    font-size: 14px;
    line-height: 1.5;
    word-break: break-word;
  }
  
  &__time {
    font-size: 11px;
    color: var(--el-text-color-secondary, #909399);
    padding: 0 4px;
  }
}

@keyframes message-in {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

// 打字指示器
.typing-indicator {
  display: inline-flex;
  gap: 4px;
  padding: 4px 0;
  
  i {
    width: 6px;
    height: 6px;
    background: var(--el-text-color-secondary, #909399);
    border-radius: 50%;
    animation: typing-dot 1.4s ease-in-out infinite;
    
    &:nth-child(2) { animation-delay: 0.2s; }
    &:nth-child(3) { animation-delay: 0.4s; }
  }
}

@keyframes typing-dot {
  0%, 60%, 100% { transform: translateY(0); }
  30% { transform: translateY(-6px); }
}

// 打字光标
.typing-cursor {
  animation: cursor-blink 0.8s step-end infinite;
  margin-left: 2px;
}

@keyframes cursor-blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

// ==================== 输入区域 ====================
.ai-chat-input {
  display: flex;
  gap: 10px;
  padding: 12px 16px;
  border-top: 1px solid var(--el-border-color-lighter, #ebeef5);
  background: var(--el-bg-color, #fff);
  
  :global(.dark) & {
    background: var(--el-bg-color-overlay, #1d1e1f);
    border-color: var(--el-border-color, #4c4d4f);
  }
  
  input {
    flex: 1;
    padding: 10px 14px;
    border: 1px solid var(--el-border-color, #dcdfe6);
    border-radius: 20px;
    font-size: 14px;
    outline: none;
    background: var(--el-fill-color-blank, #fff);
    color: var(--el-text-color-primary, #303133);
    transition: border-color 0.2s;
    
    &:focus {
      border-color: var(--ai-primary-color);
    }
    
    &::placeholder {
      color: var(--el-text-color-placeholder, #a8abb2);
    }
    
    &:disabled {
      background: var(--el-fill-color-light, #f5f7fa);
      cursor: not-allowed;
    }
    
    :global(.dark) & {
      background: var(--el-fill-color, #303133);
      border-color: var(--el-border-color, #4c4d4f);
      
      &:disabled {
        background: var(--el-fill-color-dark, #262727);
      }
    }
  }
}

.send-btn {
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 50%;
  background: var(--ai-primary);
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  
  &:hover:not(:disabled) {
    transform: scale(1.05);
    box-shadow: 0 4px 12px var(--ai-shadow);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  svg {
    width: 18px;
    height: 18px;
  }
}

// ==================== 过渡动画 ====================
.bounce-enter-active {
  animation: bounce-in 0.5s;
}

.bounce-leave-active {
  animation: bounce-in 0.3s reverse;
}

@keyframes bounce-in {
  0% {
    transform: scale(0);
    opacity: 0;
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.slide-up-enter-active {
  animation: slide-up-in 0.3s ease;
}

.slide-up-leave-active {
  animation: slide-up-in 0.2s ease reverse;
}

@keyframes slide-up-in {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.message-enter-active {
  animation: message-in 0.3s ease;
}

.message-leave-active {
  animation: message-in 0.2s ease reverse;
}
</style>
