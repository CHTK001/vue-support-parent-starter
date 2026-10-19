<script setup lang="ts">
/**
 * 直链播放页 —— 输入/粘贴 URL 即时播放（第二版）
 *
 * 能力：
 *   - 支持 mp4/webm/ogg/mov 直链与 HLS(m3u8)（VdPlayer 内置 hls.js）
 *   - 历史记录（localStorage，最近 10 条，可回填/删除）
 *   - 站内跳转：支持 /watch/:id 内部地址
 * 交互：回车/按钮播放、加载状态、错误提示。
 */
import { message } from "@repo/core";
import { onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";

import { VideoCamera, Delete, Link } from "@element-plus/icons-vue";
import VdPlayer from "@/components/VdPlayer.vue";

const route = useRoute();
const router = useRouter();

const url = ref("");
const playing = ref(false);

const HISTORY_KEY = "vds-play-history";

/** 播放历史 */
const history = ref<string[]>([]);

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
    message.warning("请输入视频地址");
    return;
  }
  // 站内详情地址：直接路由
  const watchMatch = u.match(/(?:#|\/)watch\/([\w-]+)/);
  if (watchMatch) {
    void router.push({ name: "watch", params: { id: watchMatch[1] } });
    return;
  }
  if (!/^(https?:|blob:)/i.test(u)) {
    message.error("仅支持 http(s) 直链地址");
    return;
  }
  url.value = u;
  playing.value = true;
  saveHistory(u);
}

function onPlayerError(msg: string) {
  message.error(msg || "地址无法播放，请检查链接有效性、跨域限制或编码格式");
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
  <div class="vd-page vd-page--narrow">
    <header class="vd-header">
      <div>
        <h1>直链播放</h1>
        <p class="vd-subtitle">粘贴视频地址（mp4 / m3u8），回车即时播放</p>
      </div>
    </header>

    <!-- 地址输入 -->
    <div class="vd-panel vdp-url-bar">
      <el-input
        v-model="url"
        class="vdp-url-input"
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
    <section v-if="playing" class="vd-theater" aria-label="直链播放器">
      <VdPlayer :url="url" :autoplay="true" @error="onPlayerError" />
    </section>

    <!-- 未播放时的引导 -->
    <section v-else class="vdp-guide">
      <div class="vdp-guide-icon" aria-hidden="true">
        <el-icon :size="38"><VideoCamera /></el-icon>
      </div>
      <p class="vdp-guide-title">支持 mp4 / webm / m3u8(HLS) 直链</p>
      <p class="vdp-guide-sub">
        粘贴地址到上方输入框，或从下方历史记录快速回填；也可以粘贴站内播放页地址直达。
      </p>
    </section>

    <!-- 播放历史 -->
    <section v-if="history.length" class="vdp-history">
      <h3>最近播放</h3>
      <ul class="vdp-history-list">
        <li v-for="h in history" :key="h" class="vdp-history-item">
          <button type="button" class="vdp-history-link" :title="h" @click="play(h)">
            {{ h }}
          </button>
          <el-button :icon="Delete" text aria-label="删除记录" @click="removeHistory(h)" />
        </li>
      </ul>
    </section>
  </div>
</template>

<style scoped>
/* ── 地址输入条 ─────────────────────────── */
.vdp-url-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
  padding: 14px 16px;
}

.vdp-url-input {
  flex: 1;
}

.vdp-url-input :deep(.el-input__wrapper) {
  border-radius: var(--vd-radius-md);
  background: color-mix(in srgb, var(--vd-text) 6%, transparent);
  box-shadow: 0 0 0 1px var(--vd-border) inset;
}

.vdp-url-input :deep(.el-input__wrapper.is-focus) {
  box-shadow:
    0 0 0 1px var(--vd-primary) inset,
    0 0 18px color-mix(in srgb, var(--vd-primary) 20%, transparent);
}

/* ── 引导占位 ───────────────────────────── */
.vdp-guide {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 72px 20px;
  background: var(--vd-surface-card);
  border: 1px dashed var(--vd-border-strong);
  border-radius: var(--vd-radius-lg);
}

.vdp-guide-icon {
  width: 76px;
  height: 76px;
  border-radius: var(--vd-radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--vd-primary-strong);
  background: linear-gradient(
    160deg,
    color-mix(in srgb, var(--vd-primary) 20%, transparent),
    color-mix(in srgb, var(--vd-secondary) 14%, transparent)
  );
  margin-bottom: 8px;
}

.vdp-guide-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--vd-text);
}

.vdp-guide-sub {
  margin: 0;
  font-size: 13px;
  color: var(--vd-text-secondary);
  text-align: center;
  max-width: 440px;
  line-height: 1.75;
}

/* ── 历史 ───────────────────────────────── */
.vdp-history {
  margin-top: 28px;
}

.vdp-history h3 {
  margin: 0 0 12px;
  font-size: 15px;
  font-weight: 600;
  color: var(--vd-text);
}

.vdp-history-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.vdp-history-item {
  display: flex;
  align-items: center;
  gap: 6px;
  background: var(--vd-surface-card);
  border: 1px solid var(--vd-border);
  border-radius: var(--vd-radius-sm);
  padding: 4px 8px 4px 14px;
  transition: border-color var(--vd-fast) var(--vd-ease);
}

.vdp-history-item:hover {
  border-color: color-mix(in srgb, var(--vd-primary) 50%, transparent);
}

.vdp-history-link {
  flex: 1;
  min-width: 0;
  border: none;
  background: transparent;
  text-align: left;
  font-family: inherit;
  font-size: 13px;
  color: var(--vd-text);
  cursor: pointer;
  padding: 7px 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.vdp-history-link:hover {
  color: var(--vd-primary-strong);
}

.vdp-history-link:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--vd-primary-strong) 45%, transparent);
}

@media (max-width: 640px) {
  .vdp-url-bar {
    flex-direction: column;
    padding: 12px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .vdp-history-item,
  .vdp-history-link {
    transition: none;
  }
}
</style>
