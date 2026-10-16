<template>
  <!--
    AI 提供商管理（/edu/ai-provider）—— 内嵌 AI 控制台的模型/提供商页。

    不在本应用重做该页：组卷 / 阅卷用到的模型、ONNX 等统一由 AI 控制台维护
    （后端是 AI starter 的 /v2/manufacturer、/v2/models 等端点，eduai 后端并未注册），
    重做一份只会让两边配置口径分叉。

    但也不能用 meta.linkUrl 外链：那样点菜单会 window.open 弹出 AI 控制台自己的地址，
    用户就离开了本工作台。AI 控制台为此提供了**独立顶层嵌入路由** /models/embed
    （ModelEmbedPage：不带 MainLayout / 侧栏 / 页头，自带供应商选择与新增/模板库操作），
    专供宿主 iframe 嵌入，这里直接用它是唯一符合「pages/ai 已集成」的形态。

    地址取 VITE_AI_CONSOLE_URL（默认本机 AI 控制台 15689），与 AI 控制台自身部署同源。
    若目标站点了 X-Frame-Options / CSP frame-ancestors 拒绝被嵌，frame 会空白——
    故保留「新窗口打开」作为兜底出口，而不是让用户面对一片空白。
  -->
  <div class="ai-provider">
    <div class="ai-provider__bar">
      <span class="ai-provider__title">AI 提供商管理</span>
      <span class="ai-provider__hint">{{ consoleUrl }}</span>
      <span class="ai-provider__spacer" />
      <el-button size="small" :loading="loading" @click="reload">刷新</el-button>
      <el-button size="small" type="primary" plain @click="openExternal">新窗口打开</el-button>
    </div>
    <div class="ai-provider__stage">
      <iframe
        v-if="frameSrc"
        :key="frameKey"
        class="ai-provider__frame"
        :src="frameSrc"
        title="AI 提供商管理"
        referrerpolicy="no-referrer"
        allow="clipboard-read; clipboard-write"
        @load="loading = false"
      />
      <div v-else class="ai-provider__empty">
        未配置 AI 控制台地址（VITE_AI_CONSOLE_URL）。
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";

/**
 * AI 控制台地址：与 router 里此前的 linkUrl 同一环境变量口径，
 * 默认本机 dev 的 AI 控制台。末尾斜杠归一，避免拼出 //models/embed。
 */
const consoleBase = String(import.meta.env.VITE_AI_CONSOLE_URL ?? "http://localhost:15689").replace(/\/+$/, "");

/** 嵌入路由：AI 控制台为 iframe 宿主准备的独立顶层路由 */
const consoleUrl = computed(() => `${consoleBase}/models/embed`);

/** iframe 地址（刷新时用 frameKey 强制重新挂载，比改 src 更可靠） */
const frameSrc = computed(() => (consoleBase ? consoleUrl.value : ""));

/** 刷新用的 key：递增即重挂 iframe */
const frameKey = ref(0);

/** iframe 首帧加载中（@load 后置 false） */
const loading = ref(true);

/**
 * 重新加载嵌入页。
 */
function reload(): void {
  loading.value = true;
  frameKey.value += 1;
}

/**
 * 兜底出口：目标站点拒绝被嵌（X-Frame-Options / CSP）时，frame 会空白，
 * 此时用新窗口打开仍可完成配置，不至于被卡死。
 */
function openExternal(): void {
  window.open(consoleUrl.value, "_blank", "noopener");
}
</script>

<style scoped>
/* 整页吃满可用高度：与老师端一致，父链给到确定高度时由 flex 分配剩余空间 */
.ai-provider {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}

.ai-provider__bar {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 0 0 auto;
  margin-bottom: 12px;
}

.ai-provider__title {
  font-size: 16px;
  font-weight: 800;
  color: var(--el-text-color-primary);
}

.ai-provider__hint {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  font-family: monospace;
}

.ai-provider__spacer {
  flex: 1;
}

/* 嵌入区吃满剩余高度；iframe 撑满容器，内部自己滚动 */
.ai-provider__stage {
  flex: 1 1 auto;
  min-height: 0;
  position: relative;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-xl, 16px);
  overflow: hidden;
  background: var(--el-bg-color);
}

.ai-provider__frame {
  display: block;
  width: 100%;
  height: 100%;
  border: 0;
}

.ai-provider__empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}
</style>
