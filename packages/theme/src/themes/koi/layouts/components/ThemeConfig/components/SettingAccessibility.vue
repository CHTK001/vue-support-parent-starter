<script setup lang="ts">
/**
 * 无障碍设置组件
 *
 * 读屏优化 / 高对比度 / 语音朗读。
 * 设置项实时写入 appConfig.other.accessibility，由 config.ts 的 watch 自动持久化。
 */
import { computed, onBeforeUnmount, watch } from "vue";
import { getConfig } from "@repo/config";
import type { AccessibilityConfig } from "@repo/config";
import ReSwitch from "@repo/ui/re-switch";
import { View } from "@element-plus/icons-vue";

const appConfig = getConfig();
const accessibility = computed(() => appConfig.other.accessibility as AccessibilityConfig);

/** 检测浏览器是否支持语音朗读 */
const speechSupported = "speechSynthesis" in window;

// ==================== 语音朗读：focus 监听 ====================
let focusHandler: ((e: FocusEvent) => void) | null = null;

function getReadText(el: HTMLElement): string {
  return (
    el.getAttribute("aria-label") ||
    el.getAttribute("title") ||
    el.textContent?.trim().slice(0, 100) ||
    ""
  );
}

function attachVoiceRead() {
  if (focusHandler) return;
  focusHandler = (e: FocusEvent) => {
    const text = getReadText(e.target as HTMLElement);
    if (!text) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "zh-CN";
    window.speechSynthesis.speak(utter);
  };
  window.addEventListener("focus", focusHandler, { capture: true });
}

function detachVoiceRead() {
  if (focusHandler) {
    window.removeEventListener("focus", focusHandler, { capture: true });
    focusHandler = null;
  }
  window.speechSynthesis?.cancel();
}

/** 监听语音朗读开关 */
watch(
  () => accessibility.value.voiceReadEnabled,
  (active) => (active ? attachVoiceRead() : detachVoiceRead()),
  { immediate: true },
);

// ==================== 高对比度：CSS 类名切换 ====================
watch(
  () => accessibility.value.highContrastMode,
  (val) => {
    const html = document.documentElement;
    if (val) html.classList.add("html-high-contrast");
    else html.classList.remove("html-high-contrast");
  },
  { immediate: true },
);

// ==================== 读屏优化：aria 属性 ====================
watch(
  () => accessibility.value.screenReaderMode,
  (val) => {
    const html = document.documentElement;
    if (val) {
      html.setAttribute("data-screen-reader", "true");
    } else {
      html.removeAttribute("data-screen-reader");
    }
  },
  { immediate: true },
);

onBeforeUnmount(() => detachVoiceRead());
</script>

<template>
  <div v-if="accessibility.enable" class="config-section">
    <div class="section-header">
      <el-icon :size="18" class="section-icon"><View /></el-icon>
      <span class="section-title">无障碍</span>
    </div>

    <div class="section-card">
      <ReSwitch layout="card"
        title="读屏优化模式"
        sub="焦点高亮"
        tip="为视障用户优化焦点高亮和可读性"
        v-model="accessibility.screenReaderMode"
      />

      <ReSwitch layout="card"
        title="高对比度模式"
        sub="对比度增强"
        tip="提高文字与背景对比度，独立于深色模式"
        v-model="accessibility.highContrastMode"
      />

      <ReSwitch layout="card"
        title="语音朗读"
        sub="TTS"
        :tip="speechSupported ? '焦点移入元素时自动朗读内容' : '当前浏览器不支持语音朗读'"
        :disabled="!speechSupported"
        v-model="accessibility.voiceReadEnabled"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.section-card {
  :deep(.re-switch-card) {
    margin-top: 10px;
  }
}
</style>

<style lang="scss">
/* 高对比度：直接作用于 html 标签，scoped 无法匹配所以放全局 */
html.html-high-contrast {
  filter: contrast(1.5) saturate(1.2);
}

html.html-high-contrast * {
  color: #000 !important;
  background-color: transparent !important;
}

/* 读屏优化：聚焦高亮 + 加粗文字 */
html[data-screen-reader="true"] *:focus-visible {
  outline: 3px solid #2f8bf0 !important;
  outline-offset: 2px;
  background: rgba(47, 139, 240, 0.15) !important;
  border-radius: 4px;
}

html[data-screen-reader="true"] {
  font-weight: 600 !important;
  letter-spacing: 0.2px;
}

html[data-screen-reader="true"] a,
html[data-screen-reader="true"] button,
html[data-screen-reader="true"] [role="button"],
html[data-screen-reader="true"] [role="link"] {
  text-decoration: underline !important;
  text-decoration-thickness: 2px !important;
}
</style>
