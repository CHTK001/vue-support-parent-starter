<script setup lang="ts">
/**
 * VdPlayer —— 视频资源中心统一播放器
 *
 * 能力：
 *   - 协议自动检测：.m3u8 → hls.js（Chrome/Edge/Firefox 均可播放）；
 *     .mp4/.webm/.ogg/.mov → 原生 video；blob: → 原生。
 *   - HLS 错误自动恢复：网络错误自动重试、媒体错误自动 recoverMediaError。
 *   - 加载中（waiting/buffering）指示与错误空态。
 *   - url 变化时自动销毁旧 Hls 实例并重建，支持集/线路切换。
 * 事件：play（开始播放）、error（播放失败，返回错误信息）。
 */
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import Hls from "hls.js";
import { VideoCamera } from "@element-plus/icons-vue";

const props = withDefaults(
  defineProps<{
    /** 播放地址（m3u8 / mp4 / webm / ogg / blob:） */
    url: string;
    /** 海报地址 */
    poster?: string;
    /** 是否自动播放（浏览器可能拦截，被拦截时静默降级为点击播放） */
    autoplay?: boolean;
    /** 是否显示原生控制条 */
    controls?: boolean;
  }>(),
  {
    autoplay: false,
    controls: true,
  },
);

const emit = defineEmits<{
  (e: "play"): void;
  (e: "error", message: string): void;
}>();

const videoEl = ref<HTMLVideoElement | null>(null);
const loading = ref(false);
const error = ref("");

let hls: Hls | null = null;

/** 是否为 m3u8(HLS) 地址 */
function isHlsUrl(url: string): boolean {
  return /\.m3u8($|\?)/i.test(url);
}

/** 协议检测与播放 */
function load() {
  destroy();
  error.value = "";
  loading.value = true;

  const v = videoEl.value;
  if (!v || !props.url) {
    loading.value = false;
    return;
  }

  try {
    if (isHlsUrl(props.url)) {
      playHls(props.url);
    } else {
      playNative(props.url);
    }
    void autoPlay();
  } catch (e) {
    const msg = e instanceof Error ? e.message : "视频加载失败";
    fail(msg);
  } finally {
    loading.value = false;
  }
}

/** hls.js 播放 m3u8（不支持时回退 Safari 原生） */
function playHls(url: string) {
  const v = videoEl.value;
  if (!v) return;

  if (Hls.isSupported()) {
    hls = new Hls({ enableWorker: true, lowLatencyMode: true });
    hls.loadSource(url);
    hls.attachMedia(v);
    hls.on(Hls.Events.ERROR, (_e, data) => {
      if (!data.fatal) return;
      if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
        error.value = "网络异常，正在自动重试…";
        hls?.startLoad();
      } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
        error.value = "解码异常，正在自动恢复…";
        hls?.recoverMediaError();
      } else {
        fail("视频加载失败，请确认地址可用或检查跨域限制");
      }
    });
  } else if (v.canPlayType("application/vnd.apple.mpegurl")) {
    // Safari 原生支持 HLS
    v.src = url;
  } else {
    fail("当前浏览器不支持 HLS(m3u8) 播放，请更换浏览器或使用 mp4 直链");
  }
}

/** 原生播放 mp4/webm/ogg 等 */
function playNative(url: string) {
  const v = videoEl.value;
  if (!v) return;
  v.src = url;
}

/** 自动播放（被拦截时忽略，用户可手动点击） */
async function autoPlay() {
  const v = videoEl.value;
  if (!v || !props.autoplay) return;
  try {
    await v.play();
    emit("play");
  } catch {
    // 自动播放被浏览器拦截，保持静默，等用户手动触发
  }
}

/** 手动播放（供外部按钮调用） */
async function play() {
  const v = videoEl.value;
  if (!v || !v.src) return;
  try {
    await v.play();
    emit("play");
  } catch (e) {
    const msg = e instanceof Error ? e.message : "播放失败";
    fail(msg);
  }
}

/** 销毁 hls/flv 资源并重置 video */
function destroy() {
  if (hls) {
    try {
      hls.destroy();
    } catch {
      // ignore
    }
    hls = null;
  }
  const v = videoEl.value;
  if (v) {
    v.removeAttribute("src");
    try {
      v.load();
    } catch {
      // ignore
    }
  }
}

function fail(msg: string) {
  error.value = msg;
  loading.value = false;
  emit("error", msg);
}

function onWaiting() {
  if (!error.value) loading.value = true;
}

function onPlaying() {
  loading.value = false;
  emit("play");
}

function onNativeError() {
  const v = videoEl.value;
  if (!v) return;
  // blob: 或原生地址加载失败
  if (!isHlsUrl(v.currentSrc || props.url)) {
    fail("视频加载失败，请确认地址可用或检查跨域限制");
  }
}

watch(() => props.url, load);

onMounted(load);
onBeforeUnmount(destroy);
</script>

<template>
  <div class="vd-player-wrap">
    <video
      ref="videoEl"
      class="vd-player-el"
      :controls="controls"
      :poster="poster || undefined"
      :playsinline="true"
      :preload="autoplay ? 'auto' : 'metadata'"
      @waiting="onWaiting"
      @playing="onPlaying"
      @play="onPlaying"
      @error="onNativeError"
    >
      <track kind="captions" />
    </video>

    <!-- 加载态 -->
    <div v-if="loading" class="vd-player-overlay vd-player-loading" aria-busy="true">
      <span class="vd-player-spinner" aria-hidden="true" />
      <span class="vd-player-hint-text">{{ error || "加载中…" }}</span>
    </div>

    <!-- 错误空态 -->
    <div v-else-if="error" class="vd-player-overlay vd-player-error">
      <el-icon :size="44" aria-hidden="true"><VideoCamera /></el-icon>
      <p class="vd-player-hint-text">{{ error }}</p>
    </div>

    <!-- 无地址占位 -->
    <div v-else-if="!url" class="vd-player-overlay vd-player-empty">
      <el-icon :size="48" aria-hidden="true"><VideoCamera /></el-icon>
      <p class="vd-player-hint-text">暂无可播放的地址</p>
    </div>

    <!-- 非自动播放时的播放按钮 -->
    <button
      v-else-if="!controls"
      type="button"
      class="vd-player-bigplay"
      aria-label="播放"
      @click="play"
    >
      <span aria-hidden="true">▶</span>
    </button>
  </div>
</template>

<style scoped>
.vd-player-wrap {
  position: relative;
  width: 100%;
  background: #000;
}

.vd-player-el {
  display: block;
  width: 100%;
  aspect-ratio: 16 / 9;
  background: #000;
}

/* ── 覆盖层 ─────────────────────────────── */
.vd-player-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  background: rgba(11, 18, 32, 0.92);
  color: #e2f3ff;
  pointer-events: none;
}

.vd-player-loading {
  background: rgba(11, 18, 32, 0.55);
}

.vd-player-error {
  pointer-events: auto;
  color: #fca5a5;
}

.vd-player-hint-text {
  margin: 0;
  font-size: 13px;
  line-height: 1.7;
  text-align: center;
  padding: 0 20px;
  max-width: 520px;
}

/* 加载圈 */
.vd-player-spinner {
  width: 38px;
  height: 38px;
  border: 3px solid rgba(56, 189, 248, 0.25);
  border-top-color: var(--vd-secondary, #38bdf8);
  border-radius: 50%;
  animation: vd-spin 0.8s linear infinite;
}

@keyframes vd-spin {
  to {
    transform: rotate(360deg);
  }
}

/* 大播放按钮（无原生控制条时） */
.vd-player-bigplay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 72px;
  height: 72px;
  border: none;
  border-radius: 50%;
  background: rgba(99, 102, 241, 0.9);
  color: #fff;
  font-size: 26px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s var(--vd-ease, ease), background 0.2s ease;
  box-shadow: 0 4px 24px rgba(99, 102, 241, 0.5);
}

.vd-player-bigplay:hover {
  background: var(--vd-primary, #6366f1);
  transform: translate(-50%, -50%) scale(1.06);
}

@media (prefers-reduced-motion: reduce) {
  .vd-player-spinner {
    animation-duration: 1.6s;
  }
}
</style>
