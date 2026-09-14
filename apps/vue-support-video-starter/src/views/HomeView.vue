<script setup lang="ts">
/**
 * 主页 —— 与市面视频网站一致的信息流
 *
 * 结构：热播 Hero（大图轮播式焦点区）+ 分类内容区（电影/剧集/动漫/综艺
 *       各一行横向海报墙）+ 热播榜网格。
 * 交互：Hero 轮播自动切换、分类区横向滚动、卡片悬停上浮。
 * 数据：datasearch-starter 多源 Provider 同步的库内数据；未接后端时演示数据。
 */
import { computed, onMounted, onUnmounted, ref } from "vue";
import { useRouter } from "vue-router";
import { fetchVideoList } from "@/api/videoApi";
import type { VideoInfo, VideoQuery } from "@/types/video";

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
    heroList.value = [...(hot.list ?? [])]
      .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
      .slice(0, 5);
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
    <section v-else-if="hero" class="vds-hero" :key="hero.id" aria-label="热播推荐">
      <div class="vds-hero-bg" :style="hero.cover ? { backgroundImage: `url(${hero.cover})` } : {}" />
      <div class="vds-hero-mask" />
      <div class="vds-hero-content">
        <span class="vds-hero-badge">热播</span>
        <h2 class="vds-hero-title">{{ hero.name }}</h2>
        <p class="vds-hero-meta">
          <span v-if="hero.score" class="vds-hero-score">{{ hero.score.toFixed(1) }} 分</span>
          <span v-if="hero.year">{{ hero.year }}</span>
          <span v-if="hero.district">{{ hero.district }}</span>
          <span v-for="tag in hero.tags?.slice(0, 2)" :key="tag">{{ tag }}</span>
        </p>
        <p class="vds-hero-remark">{{ hero.remark }}</p>
        <div class="vds-hero-actions">
          <el-button type="primary" size="large" round @click="goWatch(hero)">立即播放</el-button>
          <el-button size="large" round class="vds-hero-more" @click="goChannel(hero.videoType ?? 'movie')">
            查看同类
          </el-button>
        </div>
        <!-- 轮播指示点 -->
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
            @click="heroIndex = i"
          />
        </div>
      </div>
    </section>

    <!-- 骨架 -->
    <div v-if="loading" class="vds-hero vds-poster-skeleton" style="aspect-ratio: 21/9" aria-busy="true" />

    <!-- ── 分类内容区 ────────────────────────── -->
    <section
      v-for="s in sections"
      :key="s.key"
      class="vds-section"
      :aria-label="s.label"
    >
      <div class="vds-section-head">
        <h3 class="vds-section-title">
          <span class="vds-section-bar" aria-hidden="true" />
          {{ s.label }}
        </h3>
        <router-link :to="{ name: 'channel', params: { type: s.type } }" class="vds-section-more">
          更多 ›
        </router-link>
      </div>

      <div class="vds-rail">
        <article
          v-for="item in s.list"
          :key="item.id"
          class="vd-card vds-rail-card"
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
          </div>
          <div class="vd-card-body">
            <h4 class="vd-name" :title="item.name">{{ item.name }}</h4>
            <p class="vd-meta"><span v-if="item.year">{{ item.year }}</span></p>
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
  border-radius: var(--vd-radius-lg);
  overflow: hidden;
  min-height: 380px;
  display: flex;
  align-items: flex-end;
  box-shadow: var(--vd-shadow-lg);
  margin-bottom: 30px;
}

.vds-hero-bg {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center 20%;
  background-color: #0b3a5c;
  transform: scale(1.04);
}

.vds-hero-mask {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    180deg,
    rgba(11, 18, 32, 0.05) 0%,
    rgba(11, 18, 32, 0.55) 55%,
    rgba(11, 18, 32, 0.92) 100%
  );
}

.vds-hero-content {
  position: relative;
  padding: 34px 38px;
  max-width: 640px;
  animation: vds-hero-in 0.5s var(--vd-ease);
}

@keyframes vds-hero-in {
  from { opacity: 0; transform: translateY(14px); }
  to { opacity: 1; transform: translateY(0); }
}

.vds-hero-badge {
  display: inline-block;
  background: linear-gradient(135deg, var(--vd-primary), var(--vd-secondary));
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 4px;
  padding: 3px 12px;
  border-radius: var(--vd-radius-sm);
  margin-bottom: 12px;
}

.vds-hero-title {
  margin: 0 0 8px;
  font-size: 30px;
  font-weight: 800;
  color: #fff;
  text-shadow: 0 2px 12px rgba(0, 0, 0, 0.4);
}

.vds-hero-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0 0 10px;
  color: rgba(226, 243, 255, 0.85);
  font-size: 13px;
  flex-wrap: wrap;
}

.vds-hero-score {
  color: #fbbf24;
  font-weight: 700;
  font-size: 15px;
}

.vds-hero-remark {
  margin: 0 0 18px;
  color: rgba(226, 243, 255, 0.72);
  font-size: 13px;
  line-height: 1.7;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.vds-hero-actions {
  display: flex;
  gap: 10px;
}

.vds-hero-more {
  background: rgba(255, 255, 255, 0.14);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: #fff;
  backdrop-filter: blur(6px);
}

.vds-hero-more:hover {
  background: rgba(255, 255, 255, 0.24);
  border-color: rgba(255, 255, 255, 0.5);
  color: #fff;
}

/* 轮播指示点 */
.vds-hero-dots {
  position: absolute;
  right: 30px;
  bottom: 30px;
  display: flex;
  gap: 8px;
}

.vds-hero-dot {
  width: 22px;
  height: 4px;
  border: none;
  border-radius: 2px;
  background: rgba(255, 255, 255, 0.35);
  cursor: pointer;
  transition: all 0.25s var(--vd-ease);
  padding: 0;
}

.vds-hero-dot.is-active {
  background: var(--vd-secondary);
  width: 34px;
}

/* ── 分类内容区 ──────────────────────────── */
.vds-section {
  margin-bottom: 32px;
}

.vds-section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}

.vds-section-title {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: var(--vd-text);
  display: flex;
  align-items: center;
  gap: 10px;
}

.vds-section-bar {
  width: 4px;
  height: 18px;
  border-radius: 2px;
  background: linear-gradient(180deg, var(--vd-primary), var(--vd-secondary));
}

.vds-section-more {
  font-size: 13px;
  color: var(--vd-text-secondary);
  text-decoration: none;
  transition: color 0.2s var(--vd-ease);
}

.vds-section-more:hover {
  color: var(--vd-primary-strong);
}

/* 横向海报轨道 */
.vds-rail {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: 168px;
  gap: 14px;
  overflow-x: auto;
  padding-bottom: 8px;
  scroll-snap-type: x proximity;
  scrollbar-width: thin;
  scrollbar-color: #bae6fd transparent;
}

.vds-rail-card {
  scroll-snap-align: start;
}

.vds-fallback-name {
  font-size: 15px;
  font-weight: 600;
  color: #075985;
  text-align: center;
  padding: 0 8px;
}

@media (max-width: 640px) {
  .vds-hero {
    min-height: 300px;
  }
  .vds-hero-content {
    padding: 20px;
  }
  .vds-hero-title {
    font-size: 22px;
  }
  .vds-rail {
    grid-auto-columns: 132px;
  }
}
</style>
