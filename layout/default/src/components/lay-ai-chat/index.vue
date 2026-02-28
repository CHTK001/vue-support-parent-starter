<template>
  <div
    v-if="enabled"
    ref="containerRef"
    class="ai-chat-container"
    :class="[`position-${position}`, `theme-${theme}`, `appearance-${appearanceKey}`]"
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
import { emitter } from "@repo/core";
import RobotChat from "./components/RobotChat.vue";
import {
  normalizeAiAppearanceKey,
  resolveAiAppearanceComponent,
  type AiAppearanceKey,
} from "../lay-ai/appearance";
import type { AiChatVendor, ChatMessage } from "./types";
import { requestAiReply } from "./services/aiChatProvider";

const HISTORY_LIMIT = 10;

const UserIcon = { template: '<div class="skin-user">👤</div>' };

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

const enabled = computed(() => props.visible);
const position = computed(
  () => props.position || $storage?.configure?.aiChatPosition || "bottom-right",
);
const theme = computed(() => props.theme || $storage?.configure?.aiChatTheme || "default");

const apiKey = ref("");
const apiUrl = ref("");
const vendor = ref<AiChatVendor>("hf");
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
  apiKey.value = config?.aiChatApiKey ?? "";
  apiUrl.value = config?.aiChatApiUrl ?? "";
  vendor.value = (config?.aiChatVendor as AiChatVendor) ?? "hf";
  model.value = config?.aiChatModel ?? "Qwen/Qwen2.5-1.5B-Instruct";
  appearanceKey.value = normalizeAiAppearanceKey(config?.aiChatSkin);

  var headerKey = props.headers?.Authorization?.replace("Bearer ", "") ?? "";
  if (headerKey.trim().length > 0) {
    apiKey.value = headerKey;
  }
}

function handleAiChatSkinChange(value: string): void {
  appearanceKey.value = normalizeAiAppearanceKey(value);
}

function buildWelcomeMessage(): string {
  return (
    "你好！我是 AI 助手 🤖\n\n" +
    "我会优先使用 Hugging Face 的免费 AI 模型为你服务。\n\n" +
    "💡 使用提示：\n" +
    "- 首次使用时模型可能需要加载（约 20 秒）\n" +
    "- 可在系统设置中切换厂商与模型\n\n" +
    "有什么可以帮你的吗？"
  );
}

function toggleChat(): void {
  isOpen.value = !isOpen.value;
}

async function sendMessage(payload: string): Promise<void> {
  var content = payload.trim();
  if (content.length === 0 || isLoading.value) {
    return;
  }

  var history = messages.value.slice(-HISTORY_LIMIT);
  messages.value.push({ role: "user", content });
  inputMessage.value = "";
  isLoading.value = true;

  try {
    var assistant = await requestAiReply({
      vendor: vendor.value,
      apiKey: apiKey.value,
      apiUrl: apiUrl.value,
      model: model.value,
      userMessage: content,
      history,
    });

    messages.value.push({ role: "assistant", content: assistant });
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

    messages.value.push({
      role: "assistant",
      content:
        `❌ ${errorMessage}\n\n` +
        "💡 提示：\n" +
        "- 首次使用时模型可能需要加载（约 20 秒）\n" +
        "- 可以在系统设置中配置自定义 API URL\n" +
        "- 默认使用 Hugging Face 免费推理 API",
    });
  } finally {
    isLoading.value = false;
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
