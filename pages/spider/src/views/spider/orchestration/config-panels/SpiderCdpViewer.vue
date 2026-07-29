<template>
  <div class="spider-cdp-viewer" :class="{ 'is-interactive': interactive }">
    <!-- 标题栏 -->
    <div class="spider-cdp-viewer__header">
      <div class="spider-cdp-viewer__header-left">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/></svg>
        <span>嵌入式浏览器</span>
      </div>
      <div class="spider-cdp-viewer__header-right">
        <span v-if="connectionStatus === 'connected'" class="spider-cdp-viewer__status is-connected">● 已连接</span>
        <span v-else-if="connectionStatus === 'connecting'" class="spider-cdp-viewer__status is-connecting">● 连接中</span>
        <span v-else class="spider-cdp-viewer__status is-disconnected">● 未连接</span>

        <button
          type="button"
          class="spider-cdp-viewer__btn is-toggle"
          :class="{ 'is-active': interactive }"
          :disabled="connectionStatus !== 'connected'"
          @click="toggleInteractive"
          :title="interactive ? '锁定交互' : '解锁交互'"
        >
          <svg v-if="interactive" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          <svg v-else width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          <span>{{ interactive ? '锁定' : '交互' }}</span>
        </button>

        <button
          type="button"
          class="spider-cdp-viewer__btn is-refresh"
          :disabled="connectionStatus !== 'connected'"
          @click="refreshScreenshot"
          title="刷新截图"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>
        </button>
      </div>
    </div>

    <!-- 浏览器视图 -->
    <div
      ref="viewerRef"
      class="spider-cdp-viewer__stage"
      :class="{
        'is-loading': connectionStatus === 'connecting',
        'is-interactive': interactive && connectionStatus === 'connected'
      }"
      @mousedown="onMouseDown"
      @mousemove="onMouseMove"
      @mouseup="onMouseUp"
      @mouseleave="onMouseUp"
      @wheel.prevent="onWheel"
    >
      <!-- 截图 -->
      <img
        v-if="screenshot"
        :src="screenshotUrl"
        class="spider-cdp-viewer__screenshot"
        :class="{ 'is-crosshair': interactive }"
        alt="浏览器画面"
        draggable="false"
        @load="screenshotLoaded = true"
        @dragstart.prevent
      />

      <!-- 占位 -->
      <div v-else class="spider-cdp-viewer__placeholder">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
        <span>{{ connectionStatus === 'connecting' ? '正在连接浏览器…' : '点击连接按钮启动浏览器视图' }}</span>
      </div>

      <!-- 连接失败提示 -->
      <div v-if="connectionStatus === 'disconnected' && errorMessage" class="spider-cdp-viewer__error">
        {{ errorMessage }}
        <button type="button" class="spider-cdp-viewer__retry-btn" @click="connect">重试连接</button>
      </div>

      <!-- 交互模式覆盖提示 -->
      <div v-if="interactive && connectionStatus === 'connected'" class="spider-cdp-viewer__interact-hint">
        交互模式已开启 — 点击/拖动操作将发送到浏览器
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";

const props = defineProps<{
  executionNo: string;
}>();

const emit = defineEmits<{
  (e: "cookies-extracted", cookies: unknown): void;
}>();

const connectionStatus = ref<"idle" | "connecting" | "connected" | "disconnected">("idle");
const interactive = ref(false);
const screenshot = ref("");
const screenshotLoaded = ref(false);
const errorMessage = ref("");
const viewerRef = ref<HTMLElement | null>(null);
const isDragging = ref(false);
const dragStart = ref({ x: 0, y: 0 });

const screenshotUrl = computed(() => {
  if (!screenshot.value) return "";
  return "data:image/png;base64," + screenshot.value;
});

let screenshotTimer: ReturnType<typeof setInterval> | null = null;

function startScreenshotPolling() {
  stopScreenshotPolling();
  screenshotTimer = setInterval(async () => {
    if (connectionStatus.value !== "connected") return;
    await refreshScreenshot();
  }, 2000);
}

function stopScreenshotPolling() {
  if (screenshotTimer !== null) {
    clearInterval(screenshotTimer);
    screenshotTimer = null;
  }
}

async function connect() {
  if (connectionStatus.value === "connecting") return;
  connectionStatus.value = "connecting";
  errorMessage.value = "";
  try {
    const resp = await fetch(`/spider/cdp/interact/${props.executionNo}/connect`, {
      method: "POST"
    });
    const data = await resp.json();
    if (data.code === 200 || data.code === "00000") {
      connectionStatus.value = "connected";
      await refreshScreenshot();
      startScreenshotPolling();
    } else {
      connectionStatus.value = "disconnected";
      errorMessage.value = data.msg || "连接失败";
    }
  } catch (e: unknown) {
    connectionStatus.value = "disconnected";
    errorMessage.value = "网络错误: " + ((e as Error).message || "未知");
  }
}

async function disconnect() {
  stopScreenshotPolling();
  try {
    await fetch(`/spider/cdp/interact/${props.executionNo}/disconnect`, { method: "POST" });
  } catch {
    // ignore
  }
  connectionStatus.value = "idle";
  interactive.value = false;
  screenshot.value = "";
}

async function refreshScreenshot() {
  if (connectionStatus.value !== "connected") return;
  try {
    const resp = await fetch(`/spider/cdp/interact/${props.executionNo}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "screenshot" })
    });
    const data = await resp.json();
    if ((data.code === 200 || data.code === "00000") && data.data?.screenshot) {
      screenshot.value = data.data.screenshot;
      screenshotLoaded.value = false;
    }
  } catch {
    // ignore
  }
}

async function sendInteraction(eventType: string, x: number, y: number, extra: Record<string, unknown> = {}) {
  if (connectionStatus.value !== "connected") return;
  try {
    const resp = await fetch(`/spider/cdp/interact/${props.executionNo}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: eventType, x: Math.round(x), y: Math.round(y), ...extra })
    });
    const data = await resp.json();
    if ((data.code === 200 || data.code === "00000") && data.data?.screenshot) {
      screenshot.value = data.data.screenshot;
    }
  } catch {
    // ignore
  }
}

function getRelativePos(event: MouseEvent) {
  const stage = viewerRef.value;
  if (!stage) return null;
  const img = stage.querySelector("img");
  if (!img) return null;
  const rect = img.getBoundingClientRect();
  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top
  };
}

function onMouseDown(event: MouseEvent) {
  if (!interactive.value || connectionStatus.value !== "connected") return;
  const pos = getRelativePos(event);
  if (!pos) return;
  isDragging.value = true;
  dragStart.value = { x: pos.x, y: pos.y };
  sendInteraction("mousedown", pos.x, pos.y, {
    button: "left",
    clickCount: event.detail > 1 ? 2 : 1
  });
}

function onMouseMove(event: MouseEvent) {
  if (!interactive.value || connectionStatus.value !== "connected") return;
  if (!isDragging.value) return;
  const pos = getRelativePos(event);
  if (!pos) return;
  sendInteraction("mousemove", pos.x, pos.y);
}

function onMouseUp(event: MouseEvent) {
  if (!interactive.value || connectionStatus.value !== "connected") return;
  if (!isDragging.value) return;
  isDragging.value = false;
  const pos = getRelativePos(event);
  if (!pos) return;
  sendInteraction("mouseup", pos.x, pos.y, { button: "left" });
}

function onWheel(event: WheelEvent) {
  if (!interactive.value || connectionStatus.value !== "connected") return;
  const pos = getRelativePos(event);
  if (!pos) return;
  sendInteraction("wheel", pos.x, pos.y, { deltaY: event.deltaY });
}

function toggleInteractive() {
  if (connectionStatus.value !== "connected") return;
  interactive.value = !interactive.value;
  if (interactive.value && screenshot.value) {
    screenshotLoaded.value = true;
  }
}

async function extractCookies() {
  try {
    const resp = await fetch(`/spider/cdp/interact/${props.executionNo}/cookies`, {
      method: "POST"
    });
    const data = await resp.json();
    if ((data.code === 200 || data.code === "00000") && data.data?.cookies) {
      emit("cookies-extracted", data.data.cookies);
      return data.data.cookies;
    }
  } catch {
    // ignore
  }
  return null;
}

onMounted(() => {
  connect();
});

onUnmounted(() => {
  disconnect();
});

defineExpose({
  connect,
  disconnect,
  refreshScreenshot,
  extractCookies,
  screenshot,
  connectionStatus
});
</script>

<style scoped>
.spider-cdp-viewer {
  border-radius: 12px;
  border: 1px solid color-mix(in srgb, var(--el-border-color) 86%, transparent);
  background: color-mix(in srgb, var(--el-bg-color) 96%, transparent);
  overflow: hidden;
  margin-bottom: 12px;
}

.spider-cdp-viewer.is-interactive {
  border-color: color-mix(in srgb, var(--el-color-success) 30%, transparent);
  box-shadow: 0 0 0 1px color-mix(in srgb, var(--el-color-success) 10%, transparent);
}

/* 标题栏 */
.spider-cdp-viewer__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  border-bottom: 1px solid color-mix(in srgb, var(--el-border-color) 86%, transparent);
  background: color-mix(in srgb, var(--el-bg-color) 92%, transparent);
}

.spider-cdp-viewer__header-left {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}

.spider-cdp-viewer__header-left svg {
  color: var(--el-color-primary);
}

.spider-cdp-viewer__header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 状态指示 */
.spider-cdp-viewer__status {
  font-size: 11px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 999px;
}

.spider-cdp-viewer__status.is-connected {
  color: var(--el-color-success);
  background: color-mix(in srgb, var(--el-color-success) 12%, transparent);
}

.spider-cdp-viewer__status.is-connecting {
  color: var(--el-color-warning);
  background: color-mix(in srgb, var(--el-color-warning) 12%, transparent);
  animation: spider-pulse 1.5s ease-in-out infinite;
}

.spider-cdp-viewer__status.is-disconnected {
  color: var(--el-color-danger);
  background: color-mix(in srgb, var(--el-color-danger) 12%, transparent);
}

@keyframes spider-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

/* 按钮 */
.spider-cdp-viewer__btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  height: 28px;
  padding: 0 10px;
  border-radius: 6px;
  border: 1px solid color-mix(in srgb, var(--el-border-color) 86%, transparent);
  background: var(--el-bg-color);
  color: var(--el-text-color-secondary);
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  line-height: 1;
  white-space: nowrap;
}

.spider-cdp-viewer__btn:hover {
  border-color: color-mix(in srgb, var(--el-color-primary) 24%, transparent);
  color: var(--el-color-primary);
}

.spider-cdp-viewer__btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.spider-cdp-viewer__btn.is-toggle.is-active {
  border-color: var(--el-color-success);
  background: color-mix(in srgb, var(--el-color-success) 10%, transparent);
  color: var(--el-color-success);
}

.spider-cdp-viewer__btn.is-toggle:hover {
  border-color: var(--el-color-success);
  color: var(--el-color-success);
}

/* 浏览器舞台 */
.spider-cdp-viewer__stage {
  position: relative;
  min-height: 200px;
  max-height: 500px;
  overflow: hidden;
  cursor: default;
  background: color-mix(in srgb, var(--el-text-color-primary) 4%, var(--el-bg-color));
}

.spider-cdp-viewer__stage.is-interactive {
  cursor: crosshair;
}

.spider-cdp-viewer__stage.is-loading {
  opacity: 0.6;
}

/* 截图 */
.spider-cdp-viewer__screenshot {
  display: block;
  width: 100%;
  height: auto;
  user-select: none;
  -webkit-user-drag: none;
}

.spider-cdp-viewer__screenshot.is-crosshair {
  cursor: crosshair;
}

/* 占位 */
.spider-cdp-viewer__placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  min-height: 200px;
  color: var(--el-text-color-placeholder);
  font-size: 13px;
}

.spider-cdp-viewer__placeholder svg {
  opacity: 0.3;
}

/* 错误提示 */
.spider-cdp-viewer__error {
  position: absolute;
  bottom: 12px;
  left: 12px;
  right: 12px;
  padding: 10px 14px;
  border-radius: 8px;
  background: color-mix(in srgb, var(--el-color-danger) 12%, transparent);
  border: 1px solid color-mix(in srgb, var(--el-color-danger) 20%, transparent);
  color: var(--el-color-danger);
  font-size: 12px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.spider-cdp-viewer__retry-btn {
  flex-shrink: 0;
  padding: 4px 12px;
  border-radius: 6px;
  border: 1px solid color-mix(in srgb, var(--el-color-danger) 30%, transparent);
  background: color-mix(in srgb, var(--el-color-danger) 8%, transparent);
  color: var(--el-color-danger);
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
}

.spider-cdp-viewer__retry-btn:hover {
  background: var(--el-color-danger);
  color: var(--el-bg-color);
}

/* 交互提示 */
.spider-cdp-viewer__interact-hint {
  position: absolute;
  top: 8px;
  left: 50%;
  transform: translateX(-50%);
  padding: 4px 12px;
  border-radius: 6px;
  background: color-mix(in srgb, var(--el-color-success) 85%, transparent);
  color: var(--el-bg-color);
  font-size: 11px;
  font-weight: 700;
  pointer-events: none;
  white-space: nowrap;
  backdrop-filter: blur(4px);
}
</style>
