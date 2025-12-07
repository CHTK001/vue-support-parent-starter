<script setup lang="ts">
/**
 * AI 聊天机器人组件
 * 悬浮在页面右下角，点击展开聊天窗口
 * 支持多种皮肤主题，支持SSE流式对话
 * @author CH
 * @since 2024-12-07
 * @version 1.1.0
 */
import { fetchEventSource } from "@microsoft/fetch-event-source";
import { ref, nextTick, computed, onUnmounted } from "vue";

const props = defineProps({
  /**
   * 是否显示组件
   */
  visible: {
    type: Boolean,
    default: true,
  },
  /**
   * 机器人名称
   */
  botName: {
    type: String,
    default: "AI 助手",
  },
  /**
   * 欢迎消息
   */
  welcomeMessage: {
    type: String,
    default: "你好！我是智能助手，有什么可以帮您的吗？",
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
    validator: (val: string) =>
      ["default", "blue", "green", "orange", "pink", "dark"].includes(val),
  },
  /**
   * AI接口地址
   * 设置后将与后台进行SSE流式对话
   * 不设置则使用本地模拟回复
   */
  url: {
    type: String,
    default: "",
  },
  /**
   * 额外的请求参数
   * 会与用户消息一起发送到后台
   */
  requestParams: {
    type: Object,
    default: () => ({}),
  },
  /**
   * 请求头
   */
  headers: {
    type: Object,
    default: () => ({}),
  },
});

/**
 * 主题样式映射 - 每个主题有完全不同的角色形象和视觉风格
 */
const themeStyles = computed(() => {
  const themes = {
    // 默认 - 经典机器人
    default: {
      primary: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      primaryColor: "#667eea",
      shadow: "rgba(102, 126, 234, 0.4)",
      name: "小智",
      welcome: "你好！我是小智，有什么可以帮您的吗？",
      fabRadius: "50%",
      windowRadius: "16px",
      bubbleRadiusBot: "16px 16px 16px 4px",
      bubbleRadiusUser: "16px 16px 4px 16px",
    },
    // 蓝色 - 科技机器人 (R2风格)
    blue: {
      primary: "linear-gradient(135deg, #00c6fb 0%, #005bea 100%)",
      primaryColor: "#00c6fb",
      shadow: "rgba(0, 198, 251, 0.4)",
      name: "R2助手",
      welcome: "哔哔~我是R2智能助手，随时为您服务！",
      fabRadius: "12px",
      windowRadius: "8px",
      bubbleRadiusBot: "8px 8px 8px 2px",
      bubbleRadiusUser: "8px 8px 2px 8px",
    },
    // 绿色 - 小恐龙
    green: {
      primary: "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)",
      primaryColor: "#11998e",
      shadow: "rgba(17, 153, 142, 0.4)",
      name: "小龙龙",
      welcome: "嗷呜~我是小龙龙，很高兴认识你！",
      fabRadius: "30% 70% 70% 30% / 30% 30% 70% 70%",
      windowRadius: "24px",
      bubbleRadiusBot: "20px 20px 20px 8px",
      bubbleRadiusUser: "20px 20px 8px 20px",
    },
    // 橙色 - 小狐狸
    orange: {
      primary: "linear-gradient(135deg, #ff9500 0%, #ff5e3a 100%)",
      primaryColor: "#ff9500",
      shadow: "rgba(255, 149, 0, 0.4)",
      name: "小狐狸",
      welcome: "嘿嘿~我是小狐狸，让我帮你解决问题吧！",
      fabRadius: "50% 50% 50% 50% / 60% 60% 40% 40%",
      windowRadius: "20px",
      bubbleRadiusBot: "18px 18px 18px 6px",
      bubbleRadiusUser: "18px 18px 6px 18px",
    },
    // 粉色 - 史迪仔
    pink: {
      primary: "linear-gradient(135deg, #5B9BD5 0%, #2E75B6 100%)",
      primaryColor: "#5B9BD5",
      shadow: "rgba(91, 155, 213, 0.4)",
      name: "史迪仔",
      welcome: "Aloha！我是史迪仔626号，ohana！",
      fabRadius: "45% 55% 60% 40% / 55% 45% 55% 45%",
      windowRadius: "28px",
      bubbleRadiusBot: "24px 24px 24px 8px",
      bubbleRadiusUser: "24px 24px 8px 24px",
    },
    // 暗黑 - 赛博朋克机器人
    dark: {
      primary: "linear-gradient(135deg, #0f0f0f 0%, #1a1a2e 100%)",
      primaryColor: "#00ff88",
      shadow: "rgba(0, 255, 136, 0.3)",
      name: "CYBER-X",
      welcome: "[系统启动] CYBER-X 已上线，准备执行任务...",
      fabRadius: "8px",
      windowRadius: "4px",
      bubbleRadiusBot: "4px 4px 4px 0",
      bubbleRadiusUser: "4px 4px 0 4px",
    },
  };
  return themes[props.theme] || themes.default;
});

// 兼容旧的 themeColors
const themeColors = themeStyles;

const emit = defineEmits(["send", "open", "close"]);

// 聊天窗口是否展开
const isOpen = ref(false);
// 输入的消息
const inputMessage = ref("");
// 消息列表
const messages = ref<
  Array<{
    id: number;
    type: "user" | "bot";
    content: string;
    time: Date;
    loading?: boolean;
  }>
>([]);
// 消息容器引用
const messagesRef = ref<HTMLElement | null>(null);
// 输入框引用
const inputRef = ref<HTMLInputElement | null>(null);
// 是否正在输入（机器人打字效果）
const isTyping = ref(false);
// 消息ID计数器
let messageId = 0;
// SSE控制器
let controller: AbortController | null = null;

/**
 * 组件卸载时清理
 */
onUnmounted(() => {
  if (controller) {
    controller.abort();
    controller = null;
  }
});

/**
 * 切换聊天窗口
 */
const toggleChat = () => {
  isOpen.value = !isOpen.value;
  if (isOpen.value) {
    emit("open");
    // 首次打开添加欢迎消息（使用主题特定欢迎语）
    if (messages.value.length === 0) {
      addBotMessage(themeStyles.value.welcome || props.welcomeMessage);
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
    time: new Date(),
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
    loading,
  };
  messages.value.push(msg);
  scrollToBottom();
  return msg.id;
};

/**
 * 更新机器人消息
 */
const updateBotMessage = (id: number, content: string, loading = false) => {
  const msg = messages.value.find((m) => m.id === id);
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

  // 添加机器人消息占位符
  isTyping.value = true;
  const loadingId = addBotMessage("", true);

  // 如果设置了url，使用SSE流式对话
  if (props.url) {
    await sendToAI(content, loadingId);
  } else {
    // 本地模拟回复
    await simulateReply(loadingId);
  }
};

/**
 * 使用SSE发送到AI后台
 * @param prompt 用户输入
 * @param messageId 消息ID
 */
const sendToAI = async (prompt: string, msgId: number) => {
  // 关闭之前的连接
  if (controller) {
    controller.abort();
  }

  controller = new AbortController();
  const signal = controller.signal;

  try {
    await fetchEventSource(props.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...props.headers,
      },
      signal: signal,
      body: JSON.stringify({
        message: prompt,
        ...props.requestParams,
      }),
      onmessage(event) {
        try {
          const data = JSON.parse(event.data);

          // 如果对话结束
          if (data.done) {
            isTyping.value = false;
            const msg = messages.value.find((m) => m.id === msgId);
            if (msg) {
              msg.loading = false;
            }
            scrollToBottom();
            return;
          }

          // 更新AI消息内容（支持output或content字段）
          const output = data.output || data.content || data.text || "";
          if (output) {
            const msg = messages.value.find((m) => m.id === msgId);
            if (msg) {
              msg.content += output;
              scrollToBottom();
            }
          }
        } catch (e) {
          // 如果不是JSON格式，直接追加文本
          const msg = messages.value.find((m) => m.id === msgId);
          if (msg && event.data) {
            msg.content += event.data;
            scrollToBottom();
          }
        }
      },
      onerror(error) {
        console.error("SSE连接错误:", error);

        // 检查是否是用户主动取消
        if (signal.aborted) {
          return;
        }

        isTyping.value = false;
        const msg = messages.value.find((m) => m.id === msgId);
        if (msg) {
          msg.loading = false;
          if (!msg.content) {
            msg.content = "抱歉，连接出现问题，请稍后重试。";
          }
        }
      },
      onclose() {
        isTyping.value = false;
        const msg = messages.value.find((m) => m.id === msgId);
        if (msg) {
          msg.loading = false;
        }
      },
    });
  } catch (error) {
    console.error("发送消息错误:", error);
    isTyping.value = false;
    const msg = messages.value.find((m) => m.id === msgId);
    if (msg) {
      msg.loading = false;
      if (!msg.content) {
        msg.content = "抱歉，发送失败，请检查网络后重试。";
      }
    }
  }
};

/**
 * 模拟本地回复（无url时使用）
 * @param msgId 消息ID
 */
const simulateReply = async (msgId: number) => {
  // 模拟打字延迟
  await new Promise((resolve) =>
    setTimeout(resolve, 800 + Math.random() * 800)
  );

  // 模拟回复
  const replies = [
    "这是一个很好的问题！让我想想...",
    "我理解您的需求，请稍等我为您处理。",
    "感谢您的提问！这个功能正在开发中，敬请期待。",
    "您好！我是AI助手，目前正在学习中，后续会更加智能哦~",
    "收到！我会尽力帮助您解决问题。",
  ];
  const reply = replies[Math.floor(Math.random() * replies.length)];

  // 打字效果
  let displayText = "";
  for (let i = 0; i < reply.length; i++) {
    displayText += reply[i];
    updateBotMessage(msgId, displayText, true);
    await new Promise((resolve) =>
      setTimeout(resolve, 25 + Math.random() * 25)
    );
  }

  updateBotMessage(msgId, reply, false);
  isTyping.value = false;
};

/**
 * 停止生成
 */
const stopGeneration = () => {
  if (controller) {
    controller.abort();
    controller = null;
  }
  isTyping.value = false;
  // 标记最后一条消息为完成
  const lastBotMsg = [...messages.value]
    .reverse()
    .find((m) => m.type === "bot");
  if (lastBotMsg) {
    lastBotMsg.loading = false;
  }
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
  return date.toLocaleTimeString("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

/**
 * 清空聊天记录
 */
const clearMessages = () => {
  messages.value = [];
  addBotMessage(themeStyles.value.welcome || props.welcomeMessage);
};

// 暴露方法供外部调用
defineExpose({
  toggleChat,
  closeChat,
  addBotMessage,
  clearMessages,
  stopGeneration,
  isOpen,
  isTyping,
});
</script>

<template>
  <div
    v-if="visible"
    class="ai-chat-wrapper"
    :class="[`theme-${theme}`]"
    :style="{
      '--ai-primary': themeStyles.primary,
      '--ai-primary-color': themeStyles.primaryColor,
      '--ai-shadow': themeStyles.shadow,
      '--ai-fab-radius': themeStyles.fabRadius,
      '--ai-window-radius': themeStyles.windowRadius,
      '--ai-bubble-bot': themeStyles.bubbleRadiusBot,
      '--ai-bubble-user': themeStyles.bubbleRadiusUser,
    }"
  >
    <!-- 悬浮按钮 -->
    <Transition name="bounce">
      <button
        v-show="!isOpen"
        class="ai-fab"
        @click="toggleChat"
        :title="themeStyles.name"
      >
        <div class="ai-fab__icon">
          <!-- 默认 - 经典机器人 -->
          <svg
            v-if="theme === 'default'"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path
              d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z"
            />
            <circle cx="7.5" cy="14.5" r="1.5" fill="currentColor" />
            <circle cx="16.5" cy="14.5" r="1.5" fill="currentColor" />
          </svg>
          <!-- 蓝色 - R2D2 科技机器人 -->
          <svg
            v-else-if="theme === 'blue'"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <ellipse cx="12" cy="8" rx="6" ry="7" />
            <rect x="8" y="14" width="8" height="8" rx="2" />
            <circle cx="12" cy="6" r="2" fill="#00c6fb" />
            <rect x="10" y="8" width="4" height="2" rx="1" fill="#005bea" />
            <circle cx="9" cy="18" r="1.5" />
            <circle cx="15" cy="18" r="1.5" />
            <rect x="6" y="16" width="2" height="4" rx="1" />
            <rect x="16" y="16" width="2" height="4" rx="1" />
          </svg>
          <!-- 绿色 - 小恐龙 -->
          <svg
            v-else-if="theme === 'green'"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path
              d="M20 10c0-4-3-7-7-7-1 0-2 .2-3 .5C9 2 7 2 6 3c-1.5 1.5-1 4 0 5-2 1-3 3-3 5 0 4 4 8 9 8s9-4 9-8c0-1-.3-2-.8-3h-.2z"
            />
            <circle cx="9" cy="11" r="2" fill="#fff" />
            <circle cx="15" cy="11" r="2" fill="#fff" />
            <circle cx="9.5" cy="11.5" r="1" fill="#333" />
            <circle cx="15.5" cy="11.5" r="1" fill="#333" />
            <path
              d="M10 16c0 0 1 1.5 2 1.5s2-1.5 2-1.5"
              fill="none"
              stroke="#fff"
              stroke-width="1.5"
              stroke-linecap="round"
            />
            <path
              d="M4 5l2-2M6 4l-1 2M20 5l-2-2M18 4l1 2"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
            />
          </svg>
          <!-- 橙色 - 小狐狸 -->
          <svg
            v-else-if="theme === 'orange'"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path
              d="M12 22c-4 0-8-3-8-7 0-2 1-4 2-5l-2-7 5 3c1-.5 2-.5 3-.5s2 0 3 .5l5-3-2 7c1 1 2 3 2 5 0 4-4 7-8 7z"
            />
            <path d="M4 10l2-7 3 4z" fill="#ff5e3a" />
            <path d="M20 10l-2-7-3 4z" fill="#ff5e3a" />
            <circle cx="9" cy="18" r="1.5" />
            <circle cx="15" cy="18" r="1.5" />
            <circle cx="9" cy="18" r="0.8" fill="#333" />
            <circle cx="15" cy="18" r="0.8" fill="#333" />
            <ellipse cx="12" cy="17" rx="1.5" ry="1" fill="#333" />
            <path
              d="M10.5 17.5c.5.5 1 .8 1.5.8s1-.3 1.5-.8"
              fill="none"
              stroke="#333"
              stroke-width="0.8"
            />
          </svg>
          <!-- 粉色 - 史迪仔 -->
          <svg
            v-else-if="theme === 'pink'"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <ellipse cx="12" cy="14" rx="9" ry="8" />
            <ellipse cx="5" cy="6" rx="3" ry="5" transform="rotate(-20 5 6)" />
            <ellipse cx="19" cy="6" rx="3" ry="5" transform="rotate(20 19 6)" />
            <ellipse cx="5" cy="7" rx="1.5" ry="2.5" fill="#fff" />
            <ellipse cx="19" cy="7" rx="1.5" ry="2.5" fill="#fff" />
            <ellipse cx="8" cy="13" rx="2.5" ry="3" fill="#1a1a2e" />
            <ellipse cx="16" cy="13" rx="2.5" ry="3" fill="#1a1a2e" />
            <circle cx="7.5" cy="12.5" r="1" fill="#fff" />
            <circle cx="15.5" cy="12.5" r="1" fill="#fff" />
            <ellipse cx="12" cy="17" rx="2" ry="1.2" fill="#2E75B6" />
            <path
              d="M10 18.5c.8.8 1.3 1 2 1s1.2-.2 2-1"
              fill="none"
              stroke="#fff"
              stroke-width="0.8"
            />
            <circle cx="6" cy="17" r="1.5" fill="#ffc0cb" opacity="0.6" />
            <circle cx="18" cy="17" r="1.5" fill="#ffc0cb" opacity="0.6" />
          </svg>
          <!-- 暗黑 - 赛博朋克 -->
          <svg
            v-else-if="theme === 'dark'"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
          >
            <rect x="5" y="6" width="14" height="12" rx="2" fill="#1a1a2e" />
            <line x1="5" y1="10" x2="19" y2="10" stroke="#00ff88" />
            <line
              x1="5"
              y1="14"
              x2="19"
              y2="14"
              stroke="#00ff88"
              opacity="0.5"
            />
            <rect x="7" y="12" width="3" height="2" fill="#00ff88" />
            <rect x="14" y="12" width="3" height="2" fill="#ff0055" />
            <path d="M12 2v4M8 3l1 3M16 3l-1 3" stroke="#00ff88" />
            <rect x="9" y="18" width="6" height="3" fill="#1a1a2e" />
            <line x1="10" y1="19" x2="14" y2="19" stroke="#00ff88" />
            <line
              x1="10"
              y1="20"
              x2="14"
              y2="20"
              stroke="#ff0055"
              opacity="0.5"
            />
          </svg>
        </div>
        <div class="ai-fab__pulse"></div>
        <div class="ai-fab__pulse ai-fab__pulse--delay"></div>
        <!-- 史迪仔耳朵装饰 -->
        <div v-if="theme === 'pink'" class="stitch-ear stitch-ear--left"></div>
        <div v-if="theme === 'pink'" class="stitch-ear stitch-ear--right"></div>
        <!-- 赛博朋克扫描线 -->
        <div v-if="theme === 'dark'" class="cyber-scanline"></div>
      </button>
    </Transition>

    <!-- 聊天窗口 -->
    <Transition name="slide-up">
      <div v-show="isOpen" class="ai-chat-window">
        <!-- 头部 -->
        <div class="ai-chat-header">
          <div class="ai-chat-header__info">
            <div class="ai-avatar">
              <!-- 默认机器人 -->
              <svg
                v-if="theme === 'default'"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path
                  d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z"
                />
                <circle cx="7.5" cy="14.5" r="1.5" />
                <circle cx="16.5" cy="14.5" r="1.5" />
              </svg>
              <!-- R2D2 -->
              <svg
                v-else-if="theme === 'blue'"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <ellipse cx="12" cy="8" rx="6" ry="7" />
                <rect x="8" y="14" width="8" height="8" rx="2" />
                <circle cx="12" cy="6" r="2" fill="#00c6fb" />
              </svg>
              <!-- 小恐龙 -->
              <svg
                v-else-if="theme === 'green'"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path
                  d="M20 10c0-4-3-7-7-7-1 0-2 .2-3 .5C9 2 7 2 6 3c-1.5 1.5-1 4 0 5-2 1-3 3-3 5 0 4 4 8 9 8s9-4 9-8c0-1-.3-2-.8-3h-.2z"
                />
                <circle cx="9" cy="11" r="1.5" fill="#fff" />
                <circle cx="15" cy="11" r="1.5" fill="#fff" />
              </svg>
              <!-- 小狐狸 -->
              <svg
                v-else-if="theme === 'orange'"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path
                  d="M12 22c-4 0-8-3-8-7 0-2 1-4 2-5l-2-7 5 3c1-.5 2-.5 3-.5s2 0 3 .5l5-3-2 7c1 1 2 3 2 5 0 4-4 7-8 7z"
                />
                <circle cx="9" cy="14" r="1" fill="#fff" />
                <circle cx="15" cy="14" r="1" fill="#fff" />
              </svg>
              <!-- 史迪仔 -->
              <svg
                v-else-if="theme === 'pink'"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <ellipse cx="12" cy="14" rx="9" ry="8" />
                <ellipse
                  cx="5"
                  cy="6"
                  rx="3"
                  ry="5"
                  transform="rotate(-20 5 6)"
                />
                <ellipse
                  cx="19"
                  cy="6"
                  rx="3"
                  ry="5"
                  transform="rotate(20 19 6)"
                />
                <ellipse cx="8" cy="13" rx="2" ry="2.5" fill="#1a1a2e" />
                <ellipse cx="16" cy="13" rx="2" ry="2.5" fill="#1a1a2e" />
              </svg>
              <!-- 赛博朋克 -->
              <svg
                v-else-if="theme === 'dark'"
                viewBox="0 0 24 24"
                fill="#1a1a2e"
                stroke="#00ff88"
                stroke-width="1.5"
              >
                <rect x="5" y="6" width="14" height="12" rx="2" />
                <rect
                  x="7"
                  y="11"
                  width="3"
                  height="2"
                  fill="#00ff88"
                  stroke="none"
                />
                <rect
                  x="14"
                  y="11"
                  width="3"
                  height="2"
                  fill="#ff0055"
                  stroke="none"
                />
              </svg>
            </div>
            <div class="ai-chat-header__text">
              <span class="ai-chat-header__name">{{ themeStyles.name }}</span>
              <span class="ai-chat-header__status">
                <i class="status-dot"></i>
                {{ theme === "dark" ? "在线中" : "在线" }}
              </span>
            </div>
          </div>
          <div class="ai-chat-header__actions">
            <button class="header-btn" @click="clearMessages" title="清空记录">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path
                  d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
                />
              </svg>
            </button>
            <button class="header-btn" @click="closeChat" title="关闭">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path d="M18 6L6 18M6 6l12 12" />
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
                <!-- 根据主题显示不同头像 -->
                <svg
                  v-if="theme === 'default'"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path
                    d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z"
                  />
                  <circle cx="7.5" cy="14.5" r="1.5" />
                  <circle cx="16.5" cy="14.5" r="1.5" />
                </svg>
                <svg
                  v-else-if="theme === 'blue'"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <ellipse cx="12" cy="10" rx="5" ry="6" />
                  <circle cx="12" cy="8" r="1.5" fill="#00c6fb" />
                </svg>
                <svg
                  v-else-if="theme === 'green'"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <circle cx="12" cy="12" r="10" />
                  <circle cx="8" cy="10" r="1.5" fill="#fff" />
                  <circle cx="16" cy="10" r="1.5" fill="#fff" />
                </svg>
                <svg
                  v-else-if="theme === 'orange'"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path
                    d="M12 20c-3 0-6-2-6-5s2-4 2-4l-1-5 4 2c.5-.3 1-.3 1-.3h0c0 0 .5 0 1 .3l4-2-1 5s2 1 2 4-3 5-6 5z"
                  />
                </svg>
                <svg
                  v-else-if="theme === 'pink'"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <ellipse cx="12" cy="12" rx="8" ry="7" />
                  <ellipse
                    cx="6"
                    cy="6"
                    rx="2"
                    ry="4"
                    transform="rotate(-15 6 6)"
                  />
                  <ellipse
                    cx="18"
                    cy="6"
                    rx="2"
                    ry="4"
                    transform="rotate(15 18 6)"
                  />
                </svg>
                <svg
                  v-else-if="theme === 'dark'"
                  viewBox="0 0 24 24"
                  fill="#1a1a2e"
                  stroke="#00ff88"
                >
                  <rect x="6" y="6" width="12" height="10" rx="2" />
                  <rect
                    x="8"
                    y="10"
                    width="2"
                    height="2"
                    fill="#00ff88"
                    stroke="none"
                  />
                  <rect
                    x="14"
                    y="10"
                    width="2"
                    height="2"
                    fill="#ff0055"
                    stroke="none"
                  />
                </svg>
              </div>
              <div class="message__content">
                <div class="message__bubble">
                  <span
                    v-if="msg.loading && !msg.content"
                    class="typing-indicator"
                  >
                    <i></i><i></i><i></i>
                  </span>
                  <span v-else>{{ msg.content }}</span>
                  <span v-if="msg.loading && msg.content" class="typing-cursor"
                    >|</span
                  >
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
          <!-- 停止按钮 -->
          <button
            v-if="isTyping"
            class="send-btn stop-btn"
            @click="stopGeneration"
            title="停止生成"
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="6" width="12" height="12" rx="2" />
            </svg>
          </button>
          <!-- 发送按钮 -->
          <button
            v-else
            class="send-btn"
            :disabled="!inputMessage.trim()"
            @click="sendMessage"
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
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
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-4px);
  }
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
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
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

    &:nth-child(2) {
      animation-delay: 0.2s;
    }
    &:nth-child(3) {
      animation-delay: 0.4s;
    }
  }
}

@keyframes typing-dot {
  0%,
  60%,
  100% {
    transform: translateY(0);
  }
  30% {
    transform: translateY(-6px);
  }
}

// 打字光标
.typing-cursor {
  animation: cursor-blink 0.8s step-end infinite;
  margin-left: 2px;
}

@keyframes cursor-blink {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0;
  }
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

  // 停止按钮样式
  &.stop-btn {
    background: #ef4444;
    animation: stop-pulse 1s ease-in-out infinite;

    &:hover {
      background: #dc2626;
      box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4);
    }
  }
}

@keyframes stop-pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.8;
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

// ==================== 主题特定样式 ====================

// 应用CSS变量到各元素
.ai-fab {
  border-radius: var(--ai-fab-radius) !important;
}

.ai-chat-window {
  border-radius: var(--ai-window-radius) !important;
}

.message--user .message__bubble {
  border-radius: var(--ai-bubble-user) !important;
}

.message--bot .message__bubble {
  border-radius: var(--ai-bubble-bot) !important;
}

// ==================== 蓝色科技风主题 ====================
.theme-blue {
  .ai-fab {
    border: 2px solid rgba(0, 198, 251, 0.5);

    &::before {
      content: "";
      position: absolute;
      inset: -4px;
      border-radius: inherit;
      border: 1px solid rgba(0, 198, 251, 0.3);
      animation: tech-glow 2s ease-in-out infinite;
    }
  }

  .ai-chat-window {
    border: 1px solid rgba(0, 198, 251, 0.3);

    &::before {
      content: "";
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 2px;
      background: linear-gradient(90deg, transparent, #00c6fb, transparent);
      animation: scan-line 3s linear infinite;
    }
  }

  .ai-chat-header {
    border-bottom: 1px solid rgba(0, 198, 251, 0.3);
  }

  .message__avatar {
    border-radius: 8px;
  }
}

@keyframes tech-glow {
  0%,
  100% {
    opacity: 0.5;
  }
  50% {
    opacity: 1;
  }
}

@keyframes scan-line {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

// ==================== 绿色恐龙主题 ====================
.theme-green {
  .ai-fab {
    &__icon {
      animation: dino-bounce 1s ease-in-out infinite;
    }
  }

  .ai-chat-window {
    border: 3px solid rgba(56, 239, 125, 0.3);
  }

  .ai-avatar {
    border-radius: 50%;
  }

  .message__avatar {
    border-radius: 50%;
    animation: dino-wiggle 2s ease-in-out infinite;
  }
}

@keyframes dino-bounce {
  0%,
  100% {
    transform: translateY(0) rotate(-5deg);
  }
  50% {
    transform: translateY(-6px) rotate(5deg);
  }
}

@keyframes dino-wiggle {
  0%,
  100% {
    transform: rotate(0deg);
  }
  25% {
    transform: rotate(-3deg);
  }
  75% {
    transform: rotate(3deg);
  }
}

// ==================== 橙色狐狸主题 ====================
.theme-orange {
  .ai-fab {
    overflow: visible;

    // 狐狸耳朵装饰
    &::before,
    &::after {
      content: "";
      position: absolute;
      top: -8px;
      width: 12px;
      height: 16px;
      background: linear-gradient(135deg, #ff9500 0%, #ff5e3a 100%);
      border-radius: 50% 50% 0 0;
    }

    &::before {
      left: 6px;
      transform: rotate(-15deg);
    }

    &::after {
      right: 6px;
      transform: rotate(15deg);
    }

    &__icon {
      animation: fox-sway 2s ease-in-out infinite;
    }
  }

  .ai-chat-window {
    border: 2px solid rgba(255, 149, 0, 0.3);
  }

  .ai-avatar {
    border-radius: 50% 50% 40% 40%;
  }
}

@keyframes fox-sway {
  0%,
  100% {
    transform: rotate(-3deg);
  }
  50% {
    transform: rotate(3deg);
  }
}

// ==================== 粉色史迪仔主题 ====================
.theme-pink {
  .ai-fab {
    overflow: visible;
  }

  // 史迪仔耳朵
  .stitch-ear {
    position: absolute;
    width: 20px;
    height: 35px;
    background: linear-gradient(135deg, #5b9bd5 0%, #2e75b6 100%);
    border-radius: 50% 50% 40% 40%;
    top: -20px;
    z-index: -1;

    &::after {
      content: "";
      position: absolute;
      width: 10px;
      height: 18px;
      background: #ffc0cb;
      border-radius: 50%;
      top: 8px;
      left: 50%;
      transform: translateX(-50%);
    }

    &--left {
      left: 2px;
      transform: rotate(-25deg);
    }

    &--right {
      right: 2px;
      transform: rotate(25deg);
    }
  }

  .ai-fab__icon {
    animation: stitch-shake 0.5s ease-in-out infinite;
  }

  .ai-chat-window {
    border: 3px solid rgba(91, 155, 213, 0.4);
    box-shadow: 0 10px 40px rgba(91, 155, 213, 0.2);
  }

  .ai-avatar {
    border-radius: 45% 55% 50% 50%;
  }

  .message__avatar {
    border-radius: 40% 60% 50% 50%;
  }

  // 添加腮红效果
  .ai-chat-header::after {
    content: "";
    position: absolute;
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
    background:
      radial-gradient(
        circle at 20% 70%,
        rgba(255, 192, 203, 0.3) 0%,
        transparent 30%
      ),
      radial-gradient(
        circle at 80% 70%,
        rgba(255, 192, 203, 0.3) 0%,
        transparent 30%
      );
    pointer-events: none;
  }
}

@keyframes stitch-shake {
  0%,
  100% {
    transform: translateY(0);
  }
  25% {
    transform: translateY(-2px) rotate(-2deg);
  }
  75% {
    transform: translateY(-2px) rotate(2deg);
  }
}

// ==================== 暗黑赛博朋克主题 ====================
.theme-dark {
  .ai-fab {
    border: 1px solid #00ff88;
    background: linear-gradient(135deg, #0f0f0f 0%, #1a1a2e 100%) !important;

    &::before {
      content: "";
      position: absolute;
      inset: 0;
      border-radius: inherit;
      box-shadow:
        0 0 15px #00ff88,
        inset 0 0 10px rgba(0, 255, 136, 0.2);
      animation: neon-pulse 1.5s ease-in-out infinite;
    }
  }

  // 赛博朋克扫描线
  .cyber-scanline {
    position: absolute;
    width: 100%;
    height: 2px;
    background: linear-gradient(90deg, transparent, #00ff88, transparent);
    top: 0;
    left: 0;
    animation: cyber-scan 2s linear infinite;
    opacity: 0.8;
  }

  .ai-chat-window {
    border: 1px solid #00ff88;
    box-shadow: 0 0 20px rgba(0, 255, 136, 0.2);

    &::before {
      content: "";
      position: absolute;
      inset: 0;
      background: repeating-linear-gradient(
        0deg,
        transparent,
        transparent 2px,
        rgba(0, 255, 136, 0.03) 2px,
        rgba(0, 255, 136, 0.03) 4px
      );
      pointer-events: none;
      z-index: 1000;
    }
  }

  .ai-chat-header {
    border-bottom: 1px solid #00ff88;

    .status-dot {
      background: #00ff88 !important;
      box-shadow: 0 0 8px #00ff88;
    }
  }

  .ai-avatar {
    border: 1px solid #00ff88;
    border-radius: 4px;
  }

  .message__avatar {
    border: 1px solid #00ff88;
    border-radius: 4px;
  }

  .message--user .message__bubble {
    border: 1px solid #ff0055;
    background: linear-gradient(135deg, #0f0f0f 0%, #1a1a2e 100%) !important;
    box-shadow: 0 0 10px rgba(255, 0, 85, 0.3);
  }

  .message--bot .message__bubble {
    border: 1px solid #00ff88;
    background: rgba(0, 255, 136, 0.1) !important;
  }

  .ai-chat-input {
    border-top: 1px solid #00ff88;

    input {
      border: 1px solid #00ff88;
      background: rgba(0, 255, 136, 0.05) !important;
      color: #00ff88 !important;
      border-radius: 4px;

      &::placeholder {
        color: rgba(0, 255, 136, 0.5);
      }
    }
  }

  .send-btn {
    border: 1px solid #00ff88;
    background: transparent !important;
    color: #00ff88 !important;
    border-radius: 4px;

    &:hover:not(:disabled) {
      background: rgba(0, 255, 136, 0.2) !important;
      box-shadow: 0 0 15px rgba(0, 255, 136, 0.5);
    }
  }

  // 打字指示器赛博风格
  .typing-indicator i {
    background: #00ff88 !important;
    box-shadow: 0 0 5px #00ff88;
  }
}

@keyframes neon-pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
}

@keyframes cyber-scan {
  0% {
    top: 0;
    opacity: 1;
  }
  100% {
    top: 100%;
    opacity: 0;
  }
}
</style>
