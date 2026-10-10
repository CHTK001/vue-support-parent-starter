<script setup lang="ts">
/**
 * 视频播放页
 *
 * 结构：剧场模式播放器（VdPlayer，hls.js 支持 m3u8 + 原生 mp4）+
 *       线路切换 + 选集列表 + 详情信息（评分/标签/简介/下载）。
 * 交互：集数高亮、线路切换重置选集、加载骨架、错误空态、返回浏览页。
 * 数据：videoApi.fetchVideoDetail；后端未启动时降级演示数据。
 */
import { message } from "@repo/core";
import { computed, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ArrowLeft, Download } from "@element-plus/icons-vue";

import { fetchVideoDetail } from "@/api/videoApi";
import type { VideoDetail } from "@/types/video";
import VdPlayer from "@/components/VdPlayer.vue";

const route = useRoute();
const router = useRouter();

/* ── 状态 ─────────────────────────────────── */
const loading = ref(false);
const error = ref(false);
const lastError = ref("");
const detail = ref<VideoDetail | null>(null);
const activeLine = ref(0);
const activeEpisode = ref(0);

/** 当前线路的集数列表 */
const episodes = computed(() => detail.value?.playLines?.[activeLine.value]?.episodes ?? []);

/** 当前播放地址 */
const currentUrl = computed(() => episodes.value[activeEpisode.value]?.url ?? "");

/* ── 数据加载 ─────────────────────────────── */
async function load() {
  loading.value = true;
  error.value = false;
  try {
    detail.value = await fetchVideoDetail(String(route.params.id));
    activeLine.value = 0;
    activeEpisode.value = 0;
  } catch (e) {
    lastError.value = e instanceof Error ? e.message : "视频详情加载失败，请确认后端服务已启动";
    error.value = true;
    detail.value = null;
  } finally {
    loading.value = false;
  }
}

/** 切换线路时重置到第 1 集 */
watch(activeLine, () => {
  activeEpisode.value = 0;
});

/** 切换集数时提示以支持手动播放（自动播放可能被浏览器拦截） */
function playEpisode(index: number) {
  activeEpisode.value = index;
  if (!currentUrl.value) {
    message.info("该集暂无可播放的地址");
  }
}

function goBack() {
  void router.back();
}

/** 播放器错误提示（VdPlayer 已展示内嵌错误空态，这里补充轻提示） */
function onPlayerError(msg: string) {
  message.error(msg || "视频播放失败");
}

onMounted(() => void load());
</script>

<template>
  <div class="vd-page vd-watch-page">
    <!-- 返回 -->
    <div class="vd-watch-topbar">
      <el-button :icon="ArrowLeft" text bg aria-label="返回浏览页" @click="goBack">返回</el-button>
    </div>

    <!-- 加载骨架 -->
    <div v-if="loading" class="vd-theater vd-poster-skeleton" style="aspect-ratio: 16/9" aria-busy="true" />

    <!-- 错误空态 -->
    <div v-else-if="error || !detail" class="vd-empty">
      <el-empty :description="lastError || '视频详情加载失败'">
        <el-button type="primary" @click="load">重试</el-button>
      </el-empty>
    </div>

    <template v-else>
      <!-- 剧场模式播放器 -->
      <section class="vd-theater" aria-label="视频播放器">
        <VdPlayer
          :url="currentUrl"
          :poster="detail.cover"
          :autoplay="true"
          @error="onPlayerError"
        />
      </section>

      <!-- 信息区 -->
      <section class="vd-detail">
        <!-- 标题行 -->
        <div class="vd-detail-head">
          <div class="vd-detail-title">
            <h2>{{ detail.name }}</h2>
            <span v-if="detail.score" class="vd-score-lg">{{ detail.score.toFixed(1) }} 分</span>
            <span v-if="detail.continueInfo" class="vd-continue-pill">{{ detail.continueInfo }}</span>
          </div>
          <p class="vd-detail-meta">
            <span v-if="detail.year">{{ detail.year }}</span>
            <span v-if="detail.district">{{ detail.district }}</span>
            <span v-if="detail.director">导演：{{ detail.director }}</span>
          </p>
          <div v-if="detail.tags?.length" class="vd-tags">
            <span v-for="tag in detail.tags" :key="tag" class="vd-tag">{{ tag }}</span>
          </div>
          <p v-if="detail.remark" class="vd-remark">{{ detail.remark }}</p>
        </div>

        <!-- 线路 + 选集 -->
        <div v-if="episodes.length" class="vd-episodes">
          <div class="vd-episodes-head">
            <h3>选集</h3>
            <div v-if="(detail.playLines?.length ?? 0) > 1" class="vd-lines" role="tablist" aria-label="播放线路">
              <button
                v-for="(line, li) in detail.playLines"
                :key="line.line"
                type="button"
                role="tab"
                class="vd-line-btn"
                :class="{ 'is-active': activeLine === li }"
                :aria-selected="activeLine === li"
                @click="activeLine = li"
              >
                {{ line.line }}
              </button>
            </div>
          </div>
          <div class="vd-episode-grid" role="listbox" aria-label="剧集列表">
            <button
              v-for="ep in episodes"
              :key="ep.index"
              type="button"
              role="option"
              class="vd-episode"
              :class="{ 'is-active': activeEpisode === ep.index - 1 }"
              :aria-selected="activeEpisode === ep.index - 1"
              @click="playEpisode(ep.index - 1)"
            >
              {{ ep.name || `第 ${ep.index} 集` }}
            </button>
          </div>
        </div>

        <!-- 下载 -->
        <div v-if="detail.downloads?.length" class="vd-downloads">
          <h3><el-icon aria-hidden="true"><Download /></el-icon> 下载资源</h3>
          <ul class="vd-download-list">
            <li v-for="(dl, i) in detail.downloads" :key="i" class="vd-download-item">
              <span class="vd-download-type" :class="`is-${dl.type}`">
                {{ dl.type === "pan" ? "网盘" : "直链" }}
              </span>
              <span class="vd-download-name">{{ dl.name || dl.url }}</span>
              <span v-if="dl.password" class="vd-download-pwd">提取码 {{ dl.password }}</span>
            </li>
          </ul>
        </div>
      </section>
    </template>
  </div>
</template>

<style scoped>
.vd-watch-page {
  max-width: 1120px;
}

.vd-watch-topbar {
  margin-bottom: 14px;
}

/* ── 剧场播放器 ─────────────────────────── */
.vd-theater {
  position: relative;
}

/* ── 信息区 ─────────────────────────────── */
.vd-detail {
  margin-top: 22px;
  background: var(--vd-surface-card);
  border: 1px solid var(--vd-border);
  border-radius: var(--vd-radius-lg);
  padding: 22px 24px;
  /* 深色影院主题用投影表达层次，与全局 .vd-card 保持一致，故保留令牌投影 */
  box-shadow: var(--vd-shadow-sm);
}

.vd-detail-title {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.vd-detail-title h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: var(--vd-text);
}

.vd-score-lg {
  background: linear-gradient(135deg, var(--vd-primary), var(--vd-secondary));
  color: var(--vd-text);
  font-weight: 700;
  font-size: 13px;
  padding: 2px 10px;
  border-radius: var(--el-radius-full, 9999px);
}

.vd-continue-pill {
  font-size: 12px;
  color: var(--vd-primary-strong);
  background: color-mix(in srgb, var(--vd-primary) 12%, transparent);
  border: 1px solid color-mix(in srgb, var(--vd-primary) 30%, transparent);
  border-radius: var(--el-radius-full, 9999px);
  padding: 2px 10px;
}

.vd-detail-meta {
  margin: 8px 0 10px;
  font-size: 13px;
  color: var(--vd-text-secondary);
  display: flex;
  gap: 14px;
  flex-wrap: wrap;
}

.vd-remark {
  margin: 12px 0 0;
  font-size: 14px;
  line-height: 1.8;
  color: var(--vd-text);
}

/* ── 选集 ───────────────────────────────── */
.vd-episodes {
  margin-top: 22px;
}

.vd-episodes-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}

.vd-episodes-head h3,
.vd-downloads h3 {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: var(--vd-text);
  display: flex;
  align-items: center;
  gap: 6px;
}

.vd-lines {
  display: flex;
  gap: 4px;
  background: var(--vd-surface);
  border: 1px solid var(--vd-border);
  border-radius: var(--vd-radius-md);
  padding: 4px;
}

.vd-line-btn {
  border: none;
  background: transparent;
  color: var(--vd-text-secondary);
  font-size: 13px;
  padding: 5px 14px;
  border-radius: var(--vd-radius-sm);
  cursor: pointer;
  transition: all var(--el-transition-duration-fast, 0.2s) var(--vd-ease);
  font-weight: 500;
}

.vd-line-btn:hover {
  color: var(--vd-text);
  /* #94a3b8 正是 --vd-text-secondary */
  background: color-mix(in srgb, var(--vd-text-secondary) 12%, transparent);
}

.vd-line-btn:focus-visible {
  outline: none;
  /* 深底上 12% 的浅色环几乎不可见，改用主色 45% 的实心焦点环 */
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--vd-primary-strong) 45%, transparent);
}

.vd-line-btn.is-active {
  background: linear-gradient(135deg, var(--vd-primary), var(--vd-secondary));
  color: var(--vd-text);
  font-weight: 600;
  box-shadow: 0 4px 16px color-mix(in srgb, var(--vd-primary) 40%, transparent);
}

.vd-episode-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(96px, 1fr));
  gap: 8px;
}

.vd-episode {
  border: 1px solid var(--vd-border);
  background: var(--vd-surface-card);
  color: var(--vd-text);
  font-size: 13px;
  padding: 8px 6px;
  border-radius: var(--vd-radius-sm);
  cursor: pointer;
  transition: all var(--el-transition-duration-fast, 0.2s) var(--vd-ease);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.vd-episode:hover {
  border-color: var(--vd-secondary);
  color: var(--vd-primary-strong);
  transform: translateY(-1px);
  box-shadow: 0 0 12px color-mix(in srgb, var(--vd-primary) 20%, transparent);
}

.vd-episode.is-active {
  background: linear-gradient(135deg, var(--vd-primary), var(--vd-secondary));
  border-color: transparent;
  color: var(--vd-text);
  font-weight: 600;
  box-shadow: 0 4px 16px color-mix(in srgb, var(--vd-primary) 40%, transparent);
}

/* 焦点轮廓已由下方 :focus-visible 的 2px 实线 + 1px 偏移提供，可见性达标，不再覆盖 */
.vd-episode:focus-visible {
  outline: 2px solid var(--vd-primary);
  outline-offset: 1px;
}

/* ── 下载 ───────────────────────────────── */
.vd-downloads {
  margin-top: 22px;
}

.vd-download-list {
  list-style: none;
  margin: 12px 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.vd-download-item {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  padding: 10px 12px;
  background: var(--vd-surface);
  border-radius: var(--vd-radius-sm);
}

.vd-download-type {
  flex-shrink: 0;
  font-size: 11px;
  font-weight: 600;
  color: var(--vd-text);
  border-radius: var(--el-radius-xs, 4px);
  padding: 2px 8px;
}

.vd-download-type.is-pan {
  /* 网盘入口用告警语义色，与直链的主色区分 */
  background: var(--el-color-warning);
}

.vd-download-type.is-cl {
  background: var(--vd-primary);
}

.vd-download-name {
  color: var(--vd-text);
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.vd-download-pwd {
  color: var(--vd-text-secondary);
  font-size: 12px;
}

@media (max-width: 640px) {
  .vd-detail {
    padding: 16px;
  }
  .vd-episode-grid {
    grid-template-columns: repeat(auto-fill, minmax(76px, 1fr));
  }
}

/* 尊重系统「减少动态效果」偏好 */
@media (prefers-reduced-motion: reduce) {
  .vd-line-btn,
  .vd-episode,
  .vd-episode:hover {
    transition: none;
    transform: none;
  }
}
</style>
