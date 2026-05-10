<template>
  <div ref="llmContainerRef" class="llm-container system-container modern-bg">
    <div ref="chatHeaderRef" class="chat-like-header">
      <ScButton
        circle
        type="default"
        class="chat-like-header__back"
        @click="handleBackPage"
      >
        <IconifyIconOnline icon="ri:arrow-left-line" />
      </ScButton>
      <div class="chat-like-header__title-wrap">
        <span class="chat-like-header__title">AI 聊天</span>
        <span class="chat-like-header__subtitle">多模型会话与上下文连续对话</span>
      </div>
    </div>
    <div class="llm-main-container" :style="{ height: `${mainContainerHeight}px` }">
      <div class="chat-main">
        <ChatComponent
          :form="form"
          :env="env"
          ref="chatComponentRef"
        />
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.llm-container {
  --primary: var(--el-color-primary);
  --primary-dark: var(--el-color-primary-dark-2);
  --primary-light: var(--el-color-primary-light-9);
  --primary-50: rgba(var(--el-color-primary-rgb), 0.05);
  --primary-rgb: var(--el-color-primary-rgb);
  --transition: cubic-bezier(0.4, 0, 0.2, 1);

  @apply relative flex flex-col min-h-0;
  height: 100vh;
  background: linear-gradient(
    135deg,
    var(--el-bg-color) 0%,
    var(--el-fill-color-lighter) 100%
  );

}

.llm-main-container {
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  min-height: 0;
  overflow: hidden;
}

.llm-main-container > .chat-main {
  position: relative;
  display: flex;
  flex: 1 1 auto;
  min-height: 0;
  overflow: hidden;
  transition: all 0.4s var(--transition);
}

.llm-main-container > .chat-main .chat-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.llm-main-container > .chat-main .chat-placeholder h2 {
  @apply text-2xl font-bold text-gray-700 mb-4;
}

.llm-main-container > .chat-main .chat-placeholder p {
  @apply text-gray-500;
}

.chat-like-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px 8px;
  margin-bottom: 6px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(148, 163, 184, 0.18);
  backdrop-filter: blur(8px);
}

.chat-like-header__back {
  flex-shrink: 0;
}

.chat-like-header__title-wrap {
  min-width: 0;
  display: grid;
  gap: 2px;
}

.chat-like-header__title {
  font-size: 14px;
  font-weight: 700;
  color: var(--el-text-color-primary);
  line-height: 1.2;
}

.chat-like-header__subtitle {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  line-height: 1.2;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dark {
  .llm-container {
    background: linear-gradient(
      135deg,
      var(--el-bg-color) 0%,
      var(--el-fill-color-darker) 100%
    );

    .chat-main {
      display: flex;
      flex-direction: column;
      flex: 1;
      .chat-placeholder {
        h2 {
          @apply text-gray-300;
        }

        p {
          @apply text-gray-400;
        }
      }
    }
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(var(--el-color-primary-rgb), 0.4);
  }

  70% {
    box-shadow: 0 0 0 10px rgba(var(--el-color-primary-rgb), 0);
  }

  100% {
    box-shadow: 0 0 0 0 rgba(var(--el-color-primary-rgb), 0);
  }
}
</style>

<script setup>
import { ScButton } from "@repo/components/ScButton";
import { IconifyIconOnline } from "@repo/components/IconifyIconOnline";
import { defineAsyncComponent, nextTick, onBeforeUnmount, onMounted, reactive, ref, shallowRef } from "vue";
import { useRouter } from "vue-router";

const ChatComponent = defineAsyncComponent(
  () => import("./module/ChatComponent.vue"),
);

const form = reactive({
  model: "glm-4-6v-flash",
  think: false,
  sysAiModuleType: "LLM",
});
const chatComponentRef = shallowRef();
const env = {};
const router = useRouter();
const llmContainerRef = ref(null);
const chatHeaderRef = ref(null);
const mainContainerHeight = ref(0);
let headerResizeObserver = null;

const syncMainHeight = () => {
  const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0;
  const containerTop = llmContainerRef.value?.getBoundingClientRect?.().top || 0;
  const availableHeight = Math.max(0, viewportHeight - containerTop);
  const headerRect = chatHeaderRef.value?.getBoundingClientRect();
  const headerHeight = headerRect?.height || 0;
  const computed = Math.max(0, availableHeight - headerHeight - 6);
  mainContainerHeight.value = computed;
};

onMounted(() => {
  nextTick(() => {
    syncMainHeight();
    window.addEventListener("resize", syncMainHeight);
    if (chatHeaderRef.value && typeof ResizeObserver !== "undefined") {
      headerResizeObserver = new ResizeObserver(() => syncMainHeight());
      headerResizeObserver.observe(chatHeaderRef.value);
    }
  });
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", syncMainHeight);
  if (headerResizeObserver) {
    headerResizeObserver.disconnect();
    headerResizeObserver = null;
  }
});

const handleBackPage = () => {
  router.push("/ai/home");
};
</script>
