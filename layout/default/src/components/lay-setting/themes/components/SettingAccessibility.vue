<script setup lang="ts">
import { onBeforeUnmount, watch } from "vue";
import { ScSwitch } from "@repo/components/ScSwitch";

interface Props {
  /** reactive 设置对象引用 */
  settings: Record<string, any>;
  /** 读屏优化模式变更 */
  screenReaderModeChange: (enabled: boolean) => void;
  /** 高对比度模式变更 */
  highContrastModeChange: (enabled: boolean) => void;
  /** 语音朗读开关变更 */
  voiceReadEnabledChange: (enabled: boolean) => void;
}

const props = defineProps<Props>();

/** 检测浏览器是否支持语音朗读 */
const speechSupported = "speechSynthesis" in window;

/** focus 事件处理器引用，用于挂载/卸载 */
let focusHandler: ((e: FocusEvent) => void) | null = null;

/** 获取元素的朗读文本 */
function getReadText(el: HTMLElement): string {
  return (
    el.getAttribute("aria-label") ||
    el.getAttribute("title") ||
    el.textContent?.trim().slice(0, 100) ||
    ""
  );
}

/** 挂载 focus 监听，开始语音朗读 */
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

/** 卸载 focus 监听，停止语音朗读 */
function detachVoiceRead() {
  if (focusHandler) {
    window.removeEventListener("focus", focusHandler, { capture: true });
    focusHandler = null;
  }
  window.speechSynthesis?.cancel();
}

/** 监听语音朗读开关，控制监听挂载/卸载 */
watch(
  () => props.settings.voiceReadEnabled,
  (active) => (active ? attachVoiceRead() : detachVoiceRead()),
  { immediate: true },
);

onBeforeUnmount(() => detachVoiceRead());
</script>

<template>
  <!-- 无障碍 -->
  <div class="setting-group">
    <h4 class="group-title">
      <IconifyIconOnline icon="ri:eye-2-line" class="group-icon" />
      无障碍
    </h4>
    <div class="switch-card-grid">
      <ScSwitch
        v-model="settings.screenReaderMode"
        layout="visual-card"
        size="small"
        label="读屏优化模式"
        description="为视障用户优化焦点高亮和可读性"
        active-icon="mdi:access-point"
        ribbon-color="var(--el-color-success)"
        @change="screenReaderModeChange"
      />
      <ScSwitch
        v-model="settings.highContrastMode"
        layout="visual-card"
        size="small"
        label="高对比度模式"
        description="提高文字与背景对比度，独立于深色模式"
        active-icon="mdi:contrast-circle"
        ribbon-color="var(--el-color-primary)"
        @change="highContrastModeChange"
      />
      <ScSwitch
        v-model="settings.voiceReadEnabled"
        layout="visual-card"
        size="small"
        label="语音朗读"
        :description="speechSupported ? '焦点移入元素时自动朗读内容' : '当前浏览器不支持语音朗读'"
        :disabled="!speechSupported"
        active-icon="ri:volume-up-line"
        ribbon-color="var(--el-color-warning)"
        @change="voiceReadEnabledChange"
      />
    </div>
  </div>
</template>
