<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, computed, watch } from "vue";

// ── 全局类型声明（第13节）──────────────────────────────────────────
interface FlourishLiveInstance {
  update(opts: Record<string, unknown>): void;
  destroy?(): void;
  getState?(cb: (err: Error | null, state: unknown) => void): void;
}

declare global {
  interface Window {
    Flourish?: {
      Live: new (opts: Record<string, unknown>) => FlourishLiveInstance;
      loadEmbed?: (el: unknown) => void;
    };
  }
}

// ── Props / Emits（第4、5节）──────────────────────────────────────
interface Props {
  visualisationId?: string | number;
  apiKey?: string;
  template?: string;
  version?: string;
  data?: Record<string, unknown[]>;
  bindings?: Record<string, unknown>;
  state?: Record<string, unknown>;
  width?: string | number;
  height?: string | number;
  ariaLabel?: string;
}

const props = withDefaults(defineProps<Props>(), {
  width: "100%",
  ariaLabel: "Flourish 数据可视化",
});

const emit = defineEmits<{
  loaded: [];
  error: [err: Error];
}>();

// ── 脚本单例加载（第7.1节）────────────────────────────────────────
let embedScriptPromise: Promise<void> | null = null;
let apiScriptPromise: Promise<void> | null = null;

function loadScript(src: string, promiseRef: { value: Promise<void> | null }): Promise<void> {
  if (promiseRef.value) return promiseRef.value;
  if (document.querySelector(`script[src="${src}"]`)) {
    promiseRef.value = Promise.resolve();
    return promiseRef.value;
  }
  promiseRef.value = new Promise<void>((resolve, reject) => {
    const s = document.createElement("script");
    s.src = src;
    s.onload = () => resolve();
    s.onerror = () => {
      promiseRef.value = null;
      reject(new Error(`Flourish 脚本加载失败: ${src}`));
    };
    document.head.appendChild(s);
  });
  return promiseRef.value;
}

const embedScriptRef = { value: embedScriptPromise };
const apiScriptRef = { value: apiScriptPromise };

function loadEmbedScript() {
  return loadScript("https://public.flourish.studio/resources/embed.js", embedScriptRef);
}
function loadApiScript() {
  return loadScript("https://public.flourish.studio/resources/api.js", apiScriptRef);
}

// ── 状态机（第8节）────────────────────────────────────────────────
type Status = "idle" | "loading" | "ready" | "error";
const status = ref<Status>("idle");
const errorMessage = ref("");

// ── 模式判断 ──────────────────────────────────────────────────────
const mode = computed<"embed" | "live" | "none">(() => {
  if (props.visualisationId != null) return "embed";
  if (props.apiKey && props.template) return "live";
  return "none";
});

// ── 容器 ref ──────────────────────────────────────────────────────
const embedRef = ref<HTMLDivElement | null>(null);
const liveRef = ref<HTMLDivElement | null>(null);
let liveInstance: FlourishLiveInstance | null = null;

// ── 容器样式 ──────────────────────────────────────────────────────
const containerStyle = computed(() => ({
  width: typeof props.width === "number" ? `${props.width}px` : props.width,
  ...(props.height != null
    ? { height: typeof props.height === "number" ? `${props.height}px` : props.height }
    : {}),
}));

// ── normalised src ────────────────────────────────────────────────
const normalisedSrc = computed(() => {
  const id = props.visualisationId;
  if (id == null) return "";
  const s = String(id);
  return s.startsWith("visualisation/") ? s : `visualisation/${s}`;
});

// ── Public Embed 渲染（第7.2节）───────────────────────────────────
async function initEmbed() {
  status.value = "loading";
  errorMessage.value = "";
  try {
    await loadEmbedScript();
    // embed.js 内置 MutationObserver，DOM 已在 onMounted 后存在，自动渲染
    // 若 Flourish 暴露了手动触发方法则调用
    if (embedRef.value && window.Flourish?.loadEmbed) {
      window.Flourish.loadEmbed(embedRef.value);
    }
    status.value = "ready";
    emit("loaded");
  } catch (err) {
    const e = err instanceof Error ? err : new Error(String(err));
    status.value = "error";
    errorMessage.value = e.message;
    emit("error", e);
  }
}

// ── Live API 渲染（第7.3节）───────────────────────────────────────
async function initLive() {
  status.value = "loading";
  errorMessage.value = "";
  try {
    await loadApiScript();
    if (!liveRef.value) throw new Error("容器节点不存在");
    liveInstance = new window.Flourish!.Live({
      container: liveRef.value,
      api_key: props.apiKey,
      template: props.template,
      version: props.version,
      data: props.data,
      bindings: props.bindings,
      state: props.state,
      ...(props.width != null ? { width: props.width } : {}),
      ...(props.height != null ? { height: props.height } : {}),
    });
    status.value = "ready";
    emit("loaded");
  } catch (err) {
    const e = err instanceof Error ? err : new Error(String(err));
    status.value = "error";
    errorMessage.value = e.message;
    emit("error", e);
  }
}

// ── 初始化入口 ────────────────────────────────────────────────────
function init() {
  if (mode.value === "embed") initEmbed();
  else if (mode.value === "live") initLive();
}

// ── watch（第11节）────────────────────────────────────────────────
watch(() => props.visualisationId, (val, old) => {
  if (mode.value === "embed" && val !== old) initEmbed();
});

watch(
  [() => props.data, () => props.state],
  () => {
    if (mode.value === "live" && liveInstance) {
      liveInstance.update({
        data: props.data ?? null,
        state: props.state ?? null,
      });
    }
  },
  { deep: true },
);

// ── 生命周期（第12节）────────────────────────────────────────────
onMounted(() => { init(); });

onBeforeUnmount(() => {
  liveInstance?.destroy?.();
  liveInstance = null;
});

// ── defineExpose（第6节）─────────────────────────────────────────
defineExpose({
  update(opts: Partial<Props>) {
    liveInstance?.update(opts as Record<string, unknown>);
  },
});
</script>

<template>
  <div class="sc-flourish-embed" :style="containerStyle">

    <!-- loading 骨架屏（第9节）-->
    <div v-if="status === 'loading'" class="sc-flourish-skeleton" aria-busy="true" aria-label="加载中">
      <div class="sc-flourish-skeleton__shimmer" />
      <div class="sc-flourish-skeleton__label">
        <span class="sc-flourish-skeleton__dot" />
        <span class="sc-flourish-skeleton__dot" />
        <span class="sc-flourish-skeleton__dot" />
      </div>
    </div>

    <!-- 错误状态（第9节）-->
    <div v-else-if="status === 'error'" class="sc-flourish-error" role="alert">
      <div class="sc-flourish-error__icon">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>
      <p class="sc-flourish-error__title">加载失败</p>
      <p class="sc-flourish-error__msg">{{ errorMessage }}</p>
    </div>

    <!-- Public Embed 容器（visibility 控制，保证 MutationObserver 可见）-->
    <div
      v-if="mode === 'embed'"
      ref="embedRef"
      class="flourish-embed sc-flourish-inner"
      :data-src="normalisedSrc"
      :aria-label="ariaLabel"
      :style="{ visibility: status === 'ready' ? 'visible' : 'hidden', position: status === 'ready' ? 'static' : 'absolute' }"
    />

    <!-- Live API 容器 -->
    <div
      v-if="mode === 'live'"
      ref="liveRef"
      class="sc-flourish-inner"
      :aria-label="ariaLabel"
      :style="{ visibility: status === 'ready' ? 'visible' : 'hidden', position: status === 'ready' ? 'static' : 'absolute' }"
    />

  </div>
</template>

<style scoped>
/* ── 容器（第10节）────────────────────────────────────────────── */
.sc-flourish-embed {
  position: relative;
  width: 100%;
  min-height: 200px;
  overflow: hidden;
  border-radius: 8px;
  background: #f8f9fa;
}

.sc-flourish-inner {
  width: 100%;
}

/* ── 骨架屏 shimmer ──────────────────────────────────────────── */
.sc-flourish-skeleton {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  border-radius: 8px;
  overflow: hidden;
}

.sc-flourish-skeleton__shimmer {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    90deg,
    #f0f2f5 0%,
    #e4e8ed 40%,
    #edf0f4 60%,
    #f0f2f5 100%
  );
  background-size: 200% 100%;
  animation: sc-flourish-shimmer 1.6s ease-in-out infinite;
}

@keyframes sc-flourish-shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.sc-flourish-skeleton__label {
  position: relative;
  display: flex;
  gap: 6px;
  z-index: 1;
}

.sc-flourish-skeleton__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.15);
  animation: sc-flourish-bounce 1.2s ease-in-out infinite;
}

.sc-flourish-skeleton__dot:nth-child(2) { animation-delay: 0.2s; }
.sc-flourish-skeleton__dot:nth-child(3) { animation-delay: 0.4s; }

@keyframes sc-flourish-bounce {
  0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
  40%           { transform: translateY(-6px); opacity: 1; }
}

/* ── 错误状态 ────────────────────────────────────────────────── */
.sc-flourish-error {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 24px;
  background: rgba(255, 59, 48, 0.04);
  border: 1px solid rgba(255, 59, 48, 0.18);
  border-radius: 8px;
}

.sc-flourish-error__icon {
  color: #ff3b30;
  opacity: 0.85;
}

.sc-flourish-error__title {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: #1a1a1a;
  letter-spacing: -0.01em;
}

.sc-flourish-error__msg {
  margin: 0;
  font-size: 13px;
  color: #888;
  text-align: center;
  max-width: 320px;
  line-height: 1.5;
}
</style>
