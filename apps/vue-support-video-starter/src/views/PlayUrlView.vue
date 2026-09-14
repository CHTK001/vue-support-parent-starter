<script setup lang="ts">
/**
 * 直链播放页 —— 输入/粘贴 URL 即时播放
 *
 * 能力：
 *   - 支持 mp4/webm/ogg 直链与 HLS(m3u8)（检测浏览器原生支持，
 *     不支持时提示并保留占位，不引入额外运行时依赖）
 *   - 历史记录（localStorage，最近 10 条，可回填/删除）
 *   - 站内跳转：支持 /watch/:id 内部地址，直接路由到播放页
 * 交互：回车/按钮播放、加载状态、错误提示、默认示例链接。
 */
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import { VideoCamera, Delete, Link } from "@element-plus/icons-vue";

const route = useRoute();
const router = useRouter();

const url = ref("");
const playing = ref(false);
const loadError = ref(false);
const videoEl = ref<HTMLVideoElement | null>(null);

const HISTORY_KEY = "vds-play-history";

/** 播放历史 */
const history = ref<string[]>([]);

/** 浏览器是否原生支持 HLS（Safari 支持，Chrome 需扩展/库） */
const isM3u8 = (u: string) => /\.m3u8($|\?)/i.test(u);
const hlsSupported = computed(
  () =>
    typeof document !== "undefined" &&
    document.createElement("video").canPlayType("application/vnd.apple.mpegurl") !== "",
);

/** 是否为可原生播放的地址 */
const playable = computed(() => {
  const u = url.value.trim();
  if (!u) return false;
  if (isM3u8(u)) return hlsSupported.value;
  return /\.(mp4|webm|ogg|mov)($|\?)/i.test(u) || u.startsWith("blob:");
});

function loadHistory() {
  try {
    history.value = JSON.parse(localStorage.getItem(HISTORY_KEY) ?? "[]") as string[];
  } catch {
    history.value = [];
  }
}

function saveHistory(u: string) {
  const next = [u, ...history.value.filter((h) => h !== u)].slice(0, 10);
  history.value = next;
  localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
}

function removeHistory(u: string) {
  history.value = history.value.filter((h) => h !== u);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history.value));
}

/** 开始播放 */
function play(target?: string) {
  const u = (target ?? url.value).trim();
  if (!u) {
    ElMessage.warning("请输入视频地址");
    return;
  }
  // 站内详情地址：直接路由
  const watchMatch = u.match(/(?:#|\/)watch\/([\w-]+)/);
  if (watchMatch) {
    void router.push({ name: "watch", params: { id: watchMatch[1] } });
    return;
  }
  if (!/^(https?:|blob:)/i.test(u)) {
    ElMessage.error("仅支持 http(s) 直链地址");
    return;
  }
  if (isM3u8(u) && !hlsSupported.value) {
    ElMessage.warning("当前浏览器不支持原生 HLS(m3u8) 播放，请使用 Safari 或改用 mp4 直链");
  }
  url.value = u;
  playing.value = true;
  loadError.value = false;
  saveHistory(u);
}

function onPlay() {
  loadError.value = false;
}

function onError() {
  loadError.value = true;
}

onMounted(() => {
  loadHistory();
  // 支持直接带 ?url= 打开
  const q = route.query.url;
  if (typeof q === "string" && q) {
    play(q);
  }
});
</script>

<template>
  <div class="vd-page vd-play-page">
    <header class="vd-header">
      <div>
        <h1>直链播放</h1>
        <p class="vd-subtitle">粘贴视频地址（mp4 / m3u8），回车即时播放</p>
      </div>
    </header>

    <!-- 地址输入 -->
    <div class="vds-url-bar">
      <el-input
        v-model="url"
        class="vds-url-input"
        placeholder="https://example.com/video.mp4"
        clearable
        size="large"
        aria-label="视频地址"
        @keyup.enter="play()"
      >
        <template #prefix>
          <el-icon><Link /></el-icon>
        </template>
      </el-input>
      <el-button type="primary" size="large" :disabled="!url.trim()" @click="play()">
        播放
      </el-button>
    </div>

    <!-- 播放器 -->
    <section v-if="playing" class="vds-theater" aria-label="直链播放器">
      <video
        ref="videoEl"
        class="vd-player"
        controls
        autoplay
        :src="url"
        @play="onPlay"
        @error="onError"
      >
        <track kind="captions" />
      </video>
      <div v-if="loadError" class="vds-player-hint vds-player-error">
        <el-icon :size="44" aria-hidden="true"><VideoCamera /></el-icon>
        <p>地址无法播放：请检查链接有效性、跨域限制或编码格式</p>
        <el-button size="small" @click="playing = false">重置</el-button>
      </div>
    </section>

    <!-- 未播放时的引导 -->
    <section v-else class="vds-url-guide">
      <div class="vds-guide-icon" aria-hidden="true">
        <el-icon :size="40"><VideoCamera /></el-icon>
      </div>
      <p class="vds-guide-title">支持 mp4 / webm / m3u8(HLS) 直链</p>
      <p class="vds-guide-sub">
        粘贴地址到上方输入框，或从下方历史记录快速回填；也可以粘贴站内播放页地址直达。
      </p>
    </section>

    <!-- 播放历史 -->
    <section v-if="history.length" class="vds-history">
      <h3>最近播放</h3>
      <ul class="vds-history-list">
        <li v-for="h in history" :key="h" class="vds-history-item">
          <button type="button" class="vds-history-link" :title="h" @click="play(h)">
            {{ h }}
          </button>
          <el-button
            :icon="Delete"
            text
            size="small"
            aria-label="删除记录"
            @click="removeHistory(h)"
          />
        </li>
      </ul>
    </section>
  </div>
</template>

<style scoped>
.vd-play-page {
  max-width: 1120px;
}

/* ── 地址输入条 ─────────────────────────── */
.vds-url-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
}

.vds-url-input {
  flex: 1;
}

.vds-url-input :deep(.el-input__wrapper) {
  border-radius: var(--vd-radius-md);
}

/* ── 引导占位 ───────────────────────────── */
.vds-url-guide {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 70px 20px;
  background: var(--vd-surface-card);
  border: 1px dashed var(--vd-border);
  border-radius: var(--vd-radius-lg);
}

.vds-guide-icon {
  width: 72px;
  height: 72px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--vd-primary);
  background: linear-gradient(160deg, #e0f2fe, #bae6fd);
  margin-bottom: 6px;
}

.vds-guide-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--vd-text);
}

.vds-guide-sub {
  margin: 0;
  font-size: 13px;
  color: var(--vd-text-secondary);
  text-align: center;
  max-width: 420px;
  line-height: 1.7;
}

/* ── 播放器 ─────────────────────────────── */
.vd-player {
  display: block;
  width: 100%;
  aspect-ratio: 16 / 9;
  background: #000;
}

.vds-player-hint {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: #94a3b8;
  background: rgba(11, 18, 32, 0.9);
  pointer-events: auto;
}

.vds-player-error p {
  margin: 0;
  font-size: 14px;
}

/* ── 历史 ───────────────────────────────── */
.vds-history {
  margin-top: 26px;
}

.vds-history h3 {
  margin: 0 0 10px;
  font-size: 15px;
  font-weight: 600;
  color: var(--vd-text);
}

.vds-history-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.vds-history-item {
  display: flex;
  align-items: center;
  gap: 6px;
  background: var(--vd-surface-card);
  border: 1px solid var(--vd-border);
  border-radius: var(--vd-radius-sm);
  padding: 4px 8px 4px 12px;
  transition: border-color 0.2s var(--vd-ease);
}

.vds-history-item:hover {
  border-color: var(--vd-secondary);
}

.vds-history-link {
  flex: 1;
  min-width: 0;
  border: none;
  background: transparent;
  text-align: left;
  font-size: 13px;
  color: var(--vd-text);
  cursor: pointer;
  padding: 6px 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.vds-history-link:hover {
  color: var(--vd-primary-strong);
}

@media (max-width: 640px) {
  .vds-url-bar {
    flex-direction: column;
  }
}
</style>
