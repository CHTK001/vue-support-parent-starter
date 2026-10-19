<script setup lang="ts">
/**
 * 主页 —— 信息流首页（第二版）
 *
 * 结构：热播 Hero（大图轮播焦点区）+ 分类内容区（电影/剧集/动漫/综艺
 *       各一行横向海报墙）+ 评分角标卡片。
 * 交互：Hero 轮播自动切换、分类区横向滚动、卡片悬停上浮。
 * 数据：datasearch-starter 多源 Provider 同步的库内数据。
 */
import { computed, onMounted, onUnmounted, ref } from "vue";
import { useRouter } from "vue-router";
import { CaretRight } from "@element-plus/icons-vue";
import { fetchVideoList } from "@/api/videoApi";
import type { VideoInfo } from "@/types/video";

const router = useRouter();

/* ── 状态 ─────────────────────────────────── */
const loading = ref(true);
const error = ref("");
const heroList = ref<VideoInfo[]>([]);
const sections = ref<{ key: string; label: string; type: string; list: VideoInfo[] }[]>([]);
const heroIndex = ref(0);

const SECTIONS = [
  { key: "movie", label: "热门电影", type: "movie" },
  { key: "tv", label: "热门剧集", type: "tv" },
  { key: "anime", label: "人气动漫", type: "anime" },
  { key: "variety", label: "综艺娱乐", type: "variety" },
] as const;

let heroTimer: ReturnType<typeof setInterval> | null = null;

/** 当前 Hero 影片 */
const hero = computed(() => heroList.value[heroIndex.value]);

/* ── 数据加载 ─────────────────────────────── */
async function load() {
  loading.value = true;
  error.value = "";
  try {
    // 热播：取评分最高的前 5 部作为焦点区
    const hot = await fetchVideoList({ page: 1, pageSize: 5 });
    heroList.value = [...(hot.list ?? [])].sort((a, b) => (b.score ?? 0) - (a.score ?? 0)).slice(0, 5);
    // 分类区：每类取 12 部
    sections.value = await Promise.all(
      SECTIONS.map(async (s) => {
        const result = await fetchVideoList({ videoType: s.type, page: 1, pageSize: 12 });
        return { ...s, list: result.list ?? [] };
      }),
    );
  } catch (e) {
    error.value = e instanceof Error ? e.message : "数据加载失败，请确认后端服务已启动";
    heroList.value = [];
    sections.value = [];
  } finally {
    loading.value = false;
    startHeroLoop();
  }
}

function startHeroLoop() {
  stopHeroLoop();
  if (heroList.value.length <= 1) return;
  heroTimer = setInterval(() => {
    heroIndex.value = (heroIndex.value + 1) % heroList.value.length;
  }, 6000);
}

function stopHeroLoop() {
  if (heroTimer) {
    clearInterval(heroTimer);
    heroTimer = null;
  }
}

function selectHero(i: number) {
  heroIndex.value = i;
  startHeroLoop();
}

function goWatch(item: VideoInfo) {
  void router.push({ name: "watch", params: { id: item.id } });
}

function goChannel(type: string) {
  void router.push({ name: "channel", params: { type } });
}

onMounted(() => void load());
onUnmounted(stopHeroLoop);
</script>

<template>
  <div class="vd-page vd-home">
    <!-- 加载失败 -->
    <div v-if="error && !loading" class="vds-load-error">
      <el-empty :description="error">
        <el-button type="primary" @click="load">重试</el-button>
      </el-empty>
    </div>

    <!-- ── 热播 Hero ─────────────────────────── -->
    <section v-else-if="hero" :key="hero.id" class="vds-hero" aria-label="热播推荐">
      <div
        class="vds-hero-bg"
        :style="hero.cover ? { backgroundImage: `url(${hero.cover})` } : {}"
        aria-hidden="true"
      />
      <div class="vds-hero-mask" aria-hidden="true" />
      <div class="vds-hero-content">
        <span class="vds-hero-badge">热播推荐</span>
        <h2 class="vds-hero-title">{{ hero.name }}</h2>
        <p class="vds-hero-meta">
          <span v-if="hero.score" class="vds-hero-score">{{ hero.score.toFixed(1) }}</span>
          <span v-if="hero.year">{{ hero.year }}</span>
          <span v-if="hero.district">{{ hero.district }}</span>
          <span v-for="tag in hero.tags?.slice(0, 2)" :key="tag">{{ tag }}</span>
        </p>
        <p v-if="hero.remark" class="vds-hero-remark">{{ hero.remark }}</p>
        <div class="vds-hero-actions">
          <el-button type="primary" size="large" round @click="goWatch(hero)">
            <el-icon class="vds-hero-play"><CaretRight /></el-icon>
            立即播放
          </el-button>
          <el-button size="large" round class="vds-hero-more" @click="goChannel(hero.videoType ?? 'movie')">
            查看同类
          </el-button>
        </div>
      </div>

      <!-- 轮播指示 -->
      <div v-if="heroList.length > 1" class="vds-hero-dots" role="tablist" aria-label="热播切换">
        <button
          v-for="(h, i) in heroList"
          :key="h.id"
          type="button"
          role="tab"
          class="vds-hero-dot"
          :class="{ 'is-active': heroIndex === i }"
          :aria-selected="heroIndex === i"
          :aria-label="h.name"
          @click="selectHero(i)"
        />
      </div>
    </section>

    <!-- 骨架 -->
    <div v-if="loading" class="vds-hero vd-poster-skeleton" aria-busy="true" />

    <!-- ── 分类内容区 ────────────────────────── -->
    <section v-for="s in sections" :key="s.key" class="vd-section" :aria-label="s.label">
      <div class="vd-section-head">
        <h3 class="vd-section-title">
          <span class="vd-section-bar" aria-hidden="true" />
          {{ s.label }}
        </h3>
        <router-link :to="{ name: 'channel', params: { type: s.type } }" class="vd-section-more">
          更多 ›
        </router-link>
      </div>

      <div class="vd-rail">
        <article
          v-for="item in s.list"
          :key="item.id"
          class="vd-card"
          tabindex="0"
          role="button"
          :aria-label="`播放 ${item.name}`"
          @click="goWatch(item)"
          @keydown.enter="goWatch(item)"
        >
          <div class="vd-poster">
            <img v-if="item.cover" :src="item.cover" :alt="`${item.name} 封面`" loading="lazy" />
            <div v-else class="vd-poster-fallback" aria-hidden="true">
              <span class="vds-fallback-name">{{ item.name.slice(0, 4) }}</span>
            </div>
            <span v-if="item.score" class="vd-score">{{ item.score.toFixed(1) }}</span>
            <span v-if="item.year" class="vd-year">{{ item.year }}</span>
          </div>
          <div class="vd-card-body">
            <h4 class="vd-name" :title="item.name">{{ item.name }}</h4>
            <p class="vd-meta"><span v-if="item.district">{{ item.district }}</span></p>
          </div>
        </article>
      </div>
    </section>
  </div>
</template>

<style scoped>
/* ── Hero 焦点区 ─────────────────────────── */
.vds-hero {
  position: relative;
  border-radius: var(--vd-radius-xl);
  overflow: hidden;
  min-height: 460px;
  display: flex;
  align-items: flex-end;
  box-shadow: var(--vd-shadow-lg);
  margin-bottom: 40px;
  border: 1px solid var(--vd-border);
  animation: vds-hero-fade 0.5s var(--vd-ease);
}

@keyframes vds-hero-fade {
  from {
    opacity: 0.6;
  }
  to {
    opacity: 1;
  }
}

.vds-hero-bg {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center 22%;
  background-color: var(--vd-bg-deep);
  transform: scale(1.03);
  transition: transform 7s ease;
}

.vds-hero:hover .vds-hero-bg {
  transform: scale(1.08);
}

.vds-hero-mask {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(
      90deg,
      color-mix(in srgb, var(--vd-bg-deep) 94%, transparent) 0%,
      color-mix(in srgb, var(--vd-bg-deep) 62%, transparent) 46%,
      transparent 78%
    ),
    linear-gradient(
      180deg,
      transparent 42%,
      color-mix(in srgb, var(--vd-bg-deep) 88%, transparent) 100%
    );
}

.vds-hero-content {
  position: relative;
  padding: 44px 48px 46px;
  max-width: 660px;
}

.vds-hero-badge {
  display: inline-block;
  background: linear-gradient(135deg, var(--vd-primary-strong), var(--vd-secondary));
  color: #1a1206;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 3px;
  padding: 5px 14px;
  border-radius: 999px;
  margin-bottom: 16px;
  box-shadow: 0 6px 20px color-mix(in srgb, var(--vd-primary) 40%, transparent);
}

.vds-hero-title {
  margin: 0 0 12px;
  font-size: 38px;
  font-weight: 800;
  color: var(--vd-text);
  line-height: 1.16;
  letter-spacing: 0.5px;
  text-shadow: 0 2px 24px color-mix(in srgb, var(--vd-bg-deep) 70%, transparent);
}

.vds-hero-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 0 0 12px;
  color: color-mix(in srgb, var(--vd-text) 85%, transparent);
  font-size: 13px;
  flex-wrap: wrap;
}

.vds-hero-score {
  color: var(--vd-gold);
  font-weight: 800;
  font-size: 16px;
}

.vds-hero-remark {
  margin: 0 0 22px;
  color: color-mix(in srgb, var(--vd-text) 72%, transparent);
  font-size: 13.5px;
  line-height: 1.8;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  max-width: 540px;
  overflow: hidden;
}

.vds-hero-actions {
  display: flex;
  gap: 12px;
}

.vds-hero-play {
  margin-right: 6px;
}

.vds-hero-more {
  background: color-mix(in srgb, var(--vd-text) 8%, transparent);
  border: 1px solid color-mix(in srgb, var(--vd-text) 24%, transparent);
  color: var(--vd-text);
  backdrop-filter: blur(8px);
}

.vds-hero-more:hover {
  background: color-mix(in srgb, var(--vd-text) 14%, transparent);
  border-color: color-mix(in srgb, var(--vd-text) 44%, transparent);
  color: var(--vd-text);
}

/* 轮播指示点 */
.vds-hero-dots {
  position: absolute;
  right: 36px;
  bottom: 36px;
  display: flex;
  gap: 8px;
}

.vds-hero-dot {
  width: 22px;
  height: 4px;
  border: none;
  border-radius: 999px;
  background: color-mix(in srgb, var(--vd-text) 32%, transparent);
  cursor: pointer;
  padding: 0;
  transition: all var(--vd-fast) var(--vd-ease);
}

.vds-hero-dot:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--vd-primary-strong) 45%, transparent);
}

.vds-hero-dot.is-active {
  background: linear-gradient(90deg, var(--vd-primary-strong), var(--vd-secondary));
  width: 40px;
  box-shadow: 0 0 12px color-mix(in srgb, var(--vd-primary) 60%, transparent);
}

.vds-fallback-name {
  font-size: 15px;
  font-weight: 600;
  color: var(--vd-primary-strong);
  text-align: center;
  padding: 0 8px;
}

@media (max-width: 640px) {
  .vds-hero {
    min-height: 340px;
  }
  .vds-hero-content {
    padding: 24px 22px 26px;
  }
  .vds-hero-title {
    font-size: 25px;
  }
  .vds-hero-dots {
    right: 20px;
    bottom: 20px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .vds-hero,
  .vds-hero-bg,
  .vds-hero:hover .vds-hero-bg,
  .vds-hero-dot {
    transition: none;
    animation: none;
    transform: none;
  }
}
</style>
