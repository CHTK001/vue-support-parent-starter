<script setup lang="ts">
/**
 * 直链播放页（第三版 · 参照站复刻）
 *
 * 参照站「解析」页结构：`.hdfgh`（解析接口下拉）+ `.searchs > .from`
 * （地址输入 + 按钮）+ `#ckplays`（600px 高的播放区）+ `.tips` 说明。
 *
 * 差异说明：本项目直接播放直链（VdPlayer + hls.js），不经过第三方解析
 * 接口，因此不提供接口下拉，其余版式保持一致。
 *
 * 能力：
 *   - 支持 mp4/webm/ogg/mov 直链与 HLS(m3u8)（VdPlayer 内置 hls.js）
 *   - 历史记录（localStorage，最近 10 条，可回填/删除）
 *   - 站内跳转：支持 /watch/:id 内部地址
 */
import { message } from "@repo/core";
import { onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";

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

/** 清空地址并回到引导态 */
function clearUrl() {
  url.value = "";
  playing.value = false;
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
  <div class="vd-page">
    <h2 class="vdp-h2">直链解析播放</h2>

    <!-- 地址输入（参照站 .searchs > .from） -->
    <div class="vdp-from">
      <input
        v-model="url"
        class="vdp-input"
        type="text"
        placeholder="粘贴视频地址，如：https://example.com/video.mp4"
        autocomplete="off"
        aria-label="视频地址"
        @keyup.enter="play()"
      />
      <button type="button" class="vdp-button" @click="play()">开始播放</button>
      <button type="button" class="vdp-button2" @click="clearUrl">清空</button>
    </div>

    <!-- 播放区（参照站 #ckplays，高 600px） -->
    <div class="vdp-stage">
      <VdPlayer v-if="playing" :url="url" :autoplay="true" @error="onPlayerError" />
      <div v-else class="vdp-placeholder">
        <p class="vdp-placeholder-title">支持 mp4 / webm / m3u8(HLS) 直链</p>
        <p class="vdp-placeholder-sub">
          粘贴地址到上方输入框并回车即可播放；也可粘贴站内播放页地址，直达详情。
        </p>
      </div>
    </div>

    <p class="vdp-tips">
      说明：浏览器可能因跨域或编码格式限制无法播放部分地址；若长时间无画面，请尝试更换源地址。
    </p>

    <!-- 播放历史 -->
    <section v-if="history.length" class="vdp-history">
      <h2 class="vdp-h2">最近播放</h2>
      <ul class="vdp-history-list">
        <li v-for="h in history" :key="h" class="vdp-history-item">
          <button type="button" class="vdp-history-link" :title="h" @click="play(h)">
            {{ h }}
          </button>
          <button
            type="button"
            class="vdp-history-del"
            aria-label="删除记录"
            @click="removeHistory(h)"
          >
            ×
          </button>
        </li>
      </ul>
    </section>
  </div>
</template>

<style scoped>
.vdp-h2 {
  margin: 20px 0;
  font-size: 20px;
  font-weight: 400;
  line-height: 20px;
  color: var(--vd-text);
}

/* ── 输入行（参照站 .from） ─────────────── */
.vdp-from {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.vdp-input {
  flex: 1;
  min-width: 240px;
  height: 40px;
  padding: 0 12px;
  border: 1px solid var(--vd-border-input);
  border-radius: var(--vd-radius);
  background: var(--vd-bg);
  font-family: inherit;
  font-size: 16px;
  color: var(--vd-text);
  outline: none;
  box-sizing: border-box;
  transition: border-color var(--vd-fast) var(--vd-ease);
}

.vdp-input:focus {
  border-color: var(--vd-primary);
}

.vdp-input::placeholder {
  color: var(--vd-text-3);
}

.vdp-button,
.vdp-button2 {
  height: 40px;
  padding: 0 20px;
  border: none;
  border-radius: var(--vd-radius);
  font-family: inherit;
  font-size: 16px;
  cursor: pointer;
  white-space: nowrap;
  transition: background var(--vd-fast) var(--vd-ease);
}

.vdp-button {
  background: var(--vd-primary);
  color: #fff;
}

.vdp-button:hover {
  background: var(--vd-primary-dark);
}

.vdp-button2 {
  background: var(--vd-chip);
  color: var(--vd-text);
}

.vdp-button2:hover {
  background: var(--vd-border-2);
}

/* ── 播放区（600px 高黑底） ─────────────── */
.vdp-stage {
  height: var(--vd-player-h);
  background: #000;
  border-radius: var(--vd-radius);
  overflow: hidden;
}

.vdp-placeholder {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 0 20px;
  text-align: center;
}

.vdp-placeholder-title {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
  color: rgb(255 255 255 / 85%);
}

.vdp-placeholder-sub {
  margin: 0;
  font-size: 14px;
  line-height: 24px;
  color: rgb(255 255 255 / 55%);
  max-width: 520px;
}

.vdp-tips {
  margin: 12px 0 0;
  font-size: 14px;
  line-height: 24px;
  color: var(--vd-text-2);
}

/* ── 历史 ───────────────────────────────── */
.vdp-history-list {
  list-style: none;
  margin: 0;
  padding: 0;
  border-top: 1px solid var(--vd-border);
}

.vdp-history-item {
  display: flex;
  align-items: center;
  gap: 8px;
  border-bottom: 1px solid var(--vd-border);
}

.vdp-history-link {
  flex: 1;
  min-width: 0;
  border: none;
  background: transparent;
  text-align: left;
  font-family: inherit;
  font-size: 14px;
  color: var(--vd-link);
  cursor: pointer;
  padding: 10px 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.vdp-history-link:hover {
  color: var(--vd-primary);
}

.vdp-history-del {
  border: none;
  background: transparent;
  color: var(--vd-text-2);
  font-size: 18px;
  line-height: 1;
  padding: 4px 8px;
  cursor: pointer;
}

.vdp-history-del:hover {
  color: var(--vd-primary);
}

@media (max-width: 640px) {
  .vdp-input {
    min-width: 0;
    width: 100%;
    flex: none;
  }
  .vdp-stage {
    height: 260px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .vdp-input,
  .vdp-button,
  .vdp-button2 {
    transition: none;
  }
}
</style>
