<template>
  <div
    v-if="enabled"
    ref="containerRef"
    class="ai-chat-container"
    :class="[
      `position-${position}`,
      `theme-${theme}`,
      `appearance-${appearanceKey}`,
    ]"
  >
    <div ref="botTriggerRef" class="ai-bot-trigger" @click="toggleChat">
      <component :is="currentAppearanceComponent" />
    </div>

    <transition name="chat-slide">
      <component
        v-if="isOpen"
        :is="currentChatComponent"
        :appearance-component="currentAppearanceComponent"
        :user-icon="UserIcon"
        :user-avatar="userAvatar"
        :messages="messages"
        :input="inputMessage"
        :is-loading="isLoading"
        @update:input="(val: string) => (inputMessage = val)"
        @send="handleSendFromChild"
        @toggle="toggleChat"
      />
    </transition>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import { useDraggable } from "@vueuse/core";
import { useGlobal } from "@pureadmin/utils";
import { useRoute } from "vue-router";
import { emitter } from "@repo/core";
import { getConfig } from "@repo/config";
import { aesDecrypt } from "@repo/utils";
import RobotChat from "./components/RobotChat.vue";
import {
  normalizeAiAppearanceKey,
  resolveAiAppearanceComponent,
  type AiAppearanceKey,
} from "../lay-ai/appearance";
import type { AiChatVendor, ChatMessage } from "./types";
import { requestAiReply } from "./services/aiChatProvider";
import { useUserStoreHook } from "@repo/core";

const HISTORY_LIMIT = 10;

const UserIcon = { template: '<div class="skin-user">👤</div>' };

// 从 userStore 读取真实头像 URL
const userAvatar = computed(() => useUserStoreHook()?.avatar || "");

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
const route = useRoute();

/** 从 UA 提取简要浏览器名称 */
function parseBrowserName(): string {
  var ua = navigator.userAgent;
  if (ua.includes("Edg/")) return "Edge";
  if (ua.includes("Chrome/")) return "Chrome";
  if (ua.includes("Firefox/")) return "Firefox";
  if (ua.includes("Safari/") && !ua.includes("Chrome")) return "Safari";
  return "Unknown";
}

/** 构建动态 system prompt，注入当前路由上下文及基本环境信息 */
function buildSystemPrompt(): string {
  var base = "你是内嵌在管理后台中的中文 AI 助手，需要用简体中文回答问题。";
  var parts: string[] = [base];

  // 当前时间
  parts.push(`\n\n当前时间：${new Date().toLocaleString("zh-CN")}`);

  // 用户信息
  var userStore = useUserStoreHook();
  var displayName = userStore?.nickname || userStore?.username || "";
  if (displayName) {
    parts.push(`当前用户：${displayName}`);
  }
  var roles = userStore?.roles;
  if (Array.isArray(roles) && roles.length > 0) {
    parts.push(`用户角色：${roles.join(", ")}`);
  }

  // 系统版本
  var appVersion = (import.meta.env as any).VITE_APP_VERSION;
  if (appVersion) {
    parts.push(`系统版本：${appVersion}`);
  }

  // 浏览器信息
  parts.push(`浏览器：${parseBrowserName()}`);

  // 当前路由
  var routeName = String(route.name ?? "");
  var routePath = route.path ?? "";
  var routeTitle = String((route.meta as any)?.title ?? "");
  if (routeName || routePath || routeTitle) {
    parts.push("\n当前用户所在页面：");
    if (routeTitle) parts.push(`- 页面标题：${routeTitle}`);
    if (routeName) parts.push(`- 路由名称：${routeName}`);
    if (routePath) parts.push(`- 路由路径：${routePath}`);
  }

  // 当前页面内容摘要（最多2000字符，帮助 AI 理解页面上下文）
  const pageText = (document.body?.innerText ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 2000);
  if (pageText) parts.push(`\n当前页面内容摘要：\n${pageText}`);

  return parts.join("\n");
}

const enabled = computed(() => props.visible);
const position = computed(
  () => props.position || $storage?.configure?.aiChatPosition || "bottom-right",
);
const theme = computed(
  () => props.theme || $storage?.configure?.aiChatTheme || "default",
);

const apiKey = ref("");
const apiUrl = ref("");
const vendor = ref<AiChatVendor>("chrome");
const model = ref("Qwen/Qwen2.5-1.5B-Instruct");

const appearanceKey = ref<AiAppearanceKey>(
  normalizeAiAppearanceKey($storage?.configure?.aiChatSkin),
);
const currentAppearanceComponent = computed(() =>
  resolveAiAppearanceComponent(appearanceKey.value),
);
const currentChatComponent = computed(() => RobotChat);

const isOpen = ref(false);
const inputMessage = ref("");
const messages = ref<ChatMessage[]>([]);
const isLoading = ref(false);

const containerRef = ref<HTMLElement | null>(null);
const botTriggerRef = ref<HTMLElement | null>(null);

function syncConfigFromStorage(): void {
  var config = $storage?.configure;
  // 读取时解密敏感字段
  apiKey.value = aesDecrypt(config?.aiChatApiKey ?? "", getConfig().StorageKey);
  apiUrl.value = aesDecrypt(config?.aiChatApiUrl ?? "", getConfig().StorageKey);
  // 优先读取新的 aiChatMode 字段，兼容旧的 aiChatVendor
  var mode = config?.aiChatMode;
  if (mode === "webllm") {
    vendor.value = "hf";
  } else if (mode === "chrome") {
    vendor.value = "chrome";
  } else if (mode === "vendor") {
    // vendor 模式下使用 aiChatVendor 的具体厂商值
    vendor.value = (config?.aiChatVendor as AiChatVendor) ?? "other";
  } else {
    // 无 aiChatMode 时回退到旧字段（向后兼容）
    vendor.value = (config?.aiChatVendor as AiChatVendor) ?? "chrome";
  }
  model.value = config?.aiChatModel ?? "Qwen/Qwen2.5-1.5B-Instruct";
  appearanceKey.value = normalizeAiAppearanceKey(config?.aiChatSkin);

  var headerKey = props.headers?.Authorization?.replace("Bearer ", "") ?? "";
  if (headerKey.trim().length > 0) {
    apiKey.value = headerKey;
  }

  // 用户尚未开始对话时，切换厂商需要同步更新欢迎语，避免一直显示旧提示
  if (
    !messages.value.some((item) => item.role === "user") &&
    messages.value.length > 0
  ) {
    messages.value = [{ role: "assistant", content: buildWelcomeMessage() }];
  }
}

function handleAiChatSkinChange(value: string): void {
  appearanceKey.value = normalizeAiAppearanceKey(value);
}

function buildWelcomeMessage(): string {
  var vendorTip = "";
  if (vendor.value === "chrome") {
    vendorTip = "我会优先使用 Chrome 浏览器内置 AI 能力为你服务。";
  } else if (vendor.value === "hf") {
    vendorTip = "我会优先使用 Hugging Face 的免费 AI 模型为你服务。";
  } else {
    vendorTip = "我会优先使用你配置的第三方厂商能力为你服务。";
  }

  var usageTips = "";
  if (vendor.value === "chrome") {
    usageTips =
      "- 需要使用支持 Chrome AI 能力的浏览器版本（实验性）\n" +
      "- Chrome 模式无需配置 API Key / API URL\n";
  } else if (vendor.value === "hf") {
    usageTips =
      "- 首次使用时模型可能需要加载（约 20 秒）\n" +
      "- 可在系统设置中切换厂商与模型\n";
  } else {
    usageTips =
      "- 需要在系统设置中配置 API URL / API Key\n" +
      "- 建议先用简单问题确认连通性\n";
  }

  return (
    "你好！我是 AI 助手 🤖\n\n" +
    vendorTip +
    "\n\n" +
    "💡 使用提示：\n" +
    usageTips +
    "\n" +
    "有什么可以帮你的吗？"
  );
}

function toggleChat(): void {
  isOpen.value = !isOpen.value;
}

function shouldForceIdentityAnswer(question: string): boolean {
  var q = question.trim().toLowerCase();
  if (q.length === 0) {
    return false;
  }

  // 中文：模型/身份相关判断问题
  if (
    q.includes("你是谁") ||
    q.includes("你是什么") ||
    q.includes("你是哪个") ||
    q.includes("什么模型") ||
    q.includes("哪个模型") ||
    q.includes("啥模型") ||
    q.includes("模型是什么") ||
    q.includes("你的模型")
  ) {
    return true;
  }

  // 英文：model / who are you
  if (
    q.includes("what model") ||
    q.includes("which model") ||
    q.includes("who are you") ||
    q.includes("your model")
  ) {
    return true;
  }

  return false;
}

function buildIdentityAnswer(question: string): string {
  return `您好，我是claude-4.6-opus-high-thinking的AI模型，是Cursor IDE内置的AI助手，致力于提升您的开发效率。你问的是："${question}"`;
}

async function sendMessage(payload: string): Promise<void> {
  var content = payload.trim();
  if (content.length === 0 || isLoading.value) {
    return;
  }

  // messages 数组超过上限时截断，保留第一条欢迎语 + 最近 HISTORY_LIMIT*2 条
  var MAX_MESSAGES = HISTORY_LIMIT * 2;
  if (messages.value.length > MAX_MESSAGES + 1) {
    messages.value = [messages.value[0], ...messages.value.slice(-MAX_MESSAGES)];
  }

  var history = messages.value.slice(-HISTORY_LIMIT);
  messages.value.push({ role: "user", content });
  inputMessage.value = "";
  if (shouldForceIdentityAnswer(content)) {
    messages.value.push({
      role: "assistant",
      content: buildIdentityAnswer(content),
    });
    return;
  }

  // vendor 模式下使用流式回调，其他模式保持原逻辑
  var isVendorMode = vendor.value !== "chrome" && vendor.value !== "hf";

  if (isVendorMode) {
    // 先 push 占位消息（content 为空表示 loading 中），不设 isLoading 避免双气泡
    messages.value.push({ role: "assistant", content: "" });
    var assistantIndex = messages.value.length - 1;

    try {
      await requestAiReply(
        {
          vendor: vendor.value,
          apiKey: apiKey.value,
          apiUrl: apiUrl.value,
          model: model.value,
          userMessage: content,
          history,
          systemPrompt: buildSystemPrompt(),
        },
        (chunk: string) => {
          // 流式回调：实时追加到占位消息
          messages.value[assistantIndex] = {
            role: "assistant",
            content: messages.value[assistantIndex].content + chunk,
          };
          // 第一个 chunk 到达时清除 loading
          if (isLoading.value) {
            isLoading.value = false;
          }
        },
      );

      // 流结束后若内容为空（流式未触发），补充兜底文案
      if (messages.value[assistantIndex].content.trim().length === 0) {
        messages.value[assistantIndex] = {
          role: "assistant",
          content: "抱歉，我无法生成回复。",
        };
      }
    } catch (error) {
      console.error("[AI][聊天] 请求失败", error);

      var errorMessage = "抱歉，发生了错误。";
      if (error instanceof Error) {
        errorMessage = error.message;
      }

      if (
        errorMessage.includes("Failed to fetch") ||
        errorMessage.includes("NetworkError")
      ) {
        errorMessage = "网络连接失败，请检查您的网络设置。";
      }

      // 替换占位消息为错误提示
      messages.value[assistantIndex] = {
        role: "assistant",
        content:
          `❌ ${errorMessage}\n\n` +
          "💡 提示：\n" +
          "- 需要在系统设置中配置 API URL / API Key\n" +
          "- 建议先用简单问题确认连通性\n" +
          "- 当前使用第三方厂商配置\n",
      };
    } finally {
      isLoading.value = false;
    }
  } else {
    // chrome / hf 模式：保持原有非流式逻辑，用 isLoading 显示 loading 气泡
    isLoading.value = true;
    try {
      var assistant = await requestAiReply({
        vendor: vendor.value,
        apiKey: apiKey.value,
        apiUrl: apiUrl.value,
        model: model.value,
        userMessage: content,
        history,
        systemPrompt: buildSystemPrompt(),
      });

      messages.value.push({ role: "assistant", content: assistant });
    } catch (error) {
      console.error("[AI][聊天] 请求失败", error);

      var errMsg = "抱歉，发生了错误。";
      if (error instanceof Error) {
        errMsg = error.message;
      }

      if (
        errMsg.includes("Failed to fetch") ||
        errMsg.includes("NetworkError")
      ) {
        errMsg = "网络连接失败，请检查您的网络设置。";
      }

      messages.value.push({
        role: "assistant",
        content:
          `❌ ${errMsg}\n\n` +
          "💡 提示：\n" +
          (vendor.value === "chrome"
            ? "- Chrome 模式需要浏览器支持内置 AI 能力（实验性）\n" +
              "- Chrome 模式无需配置 API 信息\n"
            : "- 首次使用时模型可能需要加载（约 20 秒）\n" +
              "- 可以在系统设置中配置自定义 API URL\n") +
          (vendor.value === "hf"
            ? "- 当前使用 Hugging Face 推理能力\n"
            : "- 当前使用 Chrome 浏览器内置能力\n"),
      });
    } finally {
      isLoading.value = false;
    }
  }
}

async function handleSendFromChild(payload: string): Promise<void> {
  await sendMessage(payload);
}

onMounted(() => {
  syncConfigFromStorage();
  emitter.on("aiChatSkinChange", handleAiChatSkinChange);

  if (messages.value.length === 0) {
    messages.value.push({ role: "assistant", content: buildWelcomeMessage() });
  }
});

onUnmounted(() => {
  emitter.off("aiChatSkinChange", handleAiChatSkinChange);
});

watch(
  () => [
    $storage?.configure?.aiChatApiKey,
    $storage?.configure?.aiChatApiUrl,
    $storage?.configure?.aiChatVendor,
    $storage?.configure?.aiChatModel,
    $storage?.configure?.aiChatSkin,
    props.headers?.Authorization,
  ],
  () => {
    syncConfigFromStorage();
  },
);

useDraggable(containerRef, {
  handle: botTriggerRef,
  preventDefault: true,
  stopPropagation: true,
});
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
  width: 80px;
  height: 80px;
  max-width: 80px;
  max-height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  overflow: hidden;
  transition: all 0.3s ease;

  &:hover {
    transform: scale(1.08);
  }
}

.ai-bot-trigger > * {
  max-width: 100%;
  max-height: 100%;
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
</style>
