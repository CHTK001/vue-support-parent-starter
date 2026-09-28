<script setup lang="ts">
/**
 * 直链播放页 —— 输入/粘贴 URL 即时播放
 *
 * 能力：
 *   - 支持 mp4/webm/ogg/mov 直链与 HLS(m3u8)（VdPlayer 内置 hls.js，
 *     Chrome/Edge/Firefox 均可播放 m3u8，不再依赖 Safari）
 *   - 历史记录（localStorage，最近 10 条，可回填/删除）
 *   - 站内跳转：支持 /watch/:id 内部地址，直接路由到播放页
 * 交互：回车/按钮播放、加载状态、错误提示、默认示例链接。
 */
import { onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElMessage } from "element-plus";
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
  url.value = u;
  playing.value = true;
  saveHistory(u);
}

function onPlayerError(msg: string) {
  ElMessage.error(msg || "地址无法播放，请检查链接有效性、跨域限制或编码格式");
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
      <VdPlayer :url="url" :autoplay="true" @error="onPlayerError" />
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
  /* 原 20px，取最近档 xl(16px) */
  border-radius: var(--el-radius-xl, 16px);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--vd-primary-strong);
  background: linear-gradient(
    160deg,
    color-mix(in srgb, var(--vd-primary) 20%, transparent),
    color-mix(in srgb, var(--vd-secondary) 12%, transparent)
  );
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
.vds-theater {
  border-radius: var(--vd-radius-lg);
  overflow: hidden;
  /* 深色影院主题用投影表达层次，与全局 .vd-theater 保持一致，故保留令牌投影 */
  box-shadow: var(--vd-shadow-lg);
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
  transition: border-color var(--el-transition-duration-fast, 0.2s) var(--vd-ease);
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

.vds-history-link:focus-visible {
  outline: none;
  /* 深底上 12% 的浅色环几乎不可见，改用主色 45% 的实心焦点环 */
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--vd-primary-strong) 45%, transparent);
}

@media (max-width: 640px) {
  .vds-url-bar {
    flex-direction: column;
  }
}

/* 尊重系统「减少动态效果」偏好 */
@media (prefers-reduced-motion: reduce) {
  .vds-history-item,
  .vds-history-link {
    transition: none;
  }
}
</style>
