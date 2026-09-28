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
  min-height: 420px;
  display: flex;
  align-items: flex-end;
  /* 深色影院主题用投影表达层次，与全局 .vd-theater / .vd-card 保持一致，故保留令牌投影 */
  box-shadow: var(--vd-shadow-lg);
  margin-bottom: 34px;
  border: 1px solid var(--vd-border);
}

.vds-hero-bg {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center 20%;
  /* 无封面时的兜底底色：取深色主题最深层令牌（原来写死 #0d1b2e） */
  background-color: var(--vd-bg-deep);
  transform: scale(1.04);
  /* 6s 是缓慢推近（Ken Burns），压成 0.2s 会变成抖动，故不套 -fast 档 */
  transition: transform 6s ease;
}

.vds-hero:hover .vds-hero-bg {
  transform: scale(1.08);
}

/* 遮罩原来写死 rgba(7,10,16,*)，而 #070a10 正是 --vd-bg-deep，改用 color-mix 取 alpha */
.vds-hero-mask {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    180deg,
    color-mix(in srgb, var(--vd-bg-deep) 10%, transparent) 0%,
    color-mix(in srgb, var(--vd-bg-deep) 60%, transparent) 55%,
    color-mix(in srgb, var(--vd-bg-deep) 96%, transparent) 100%
  );
}

.vds-hero-content {
  position: relative;
  padding: 38px 42px 40px;
  max-width: 680px;
  animation: vds-hero-in 0.55s var(--vd-ease);
}

@keyframes vds-hero-in {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.vds-hero-badge {
  display: inline-block;
  background: linear-gradient(135deg, var(--vd-primary), var(--vd-secondary));
  color: var(--vd-text);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 4px;
  padding: 4px 14px;
  border-radius: var(--vd-radius-sm);
  margin-bottom: 14px;
  /* 浮起反馈类投影：色值改为 --vd-primary 的 alpha，原 rgba(99,102,241,.4) */
  box-shadow: 0 4px 16px color-mix(in srgb, var(--vd-primary) 40%, transparent);
}

.vds-hero-title {
  margin: 0 0 10px;
  font-size: 32px;
  font-weight: 800;
  color: var(--vd-text);
  /* 文字投影属于海报之上的可读性保障，不受「卡片不加投影」约束 */
  text-shadow: 0 2px 16px color-mix(in srgb, var(--vd-bg-deep) 50%, transparent);
  line-height: 1.2;
}

.vds-hero-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0 0 10px;
  color: color-mix(in srgb, var(--vd-text) 85%, transparent);
  font-size: 13px;
  flex-wrap: wrap;
}

.vds-hero-score {
  color: var(--vd-gold);
  font-weight: 700;
  font-size: 15px;
}

.vds-hero-remark {
  margin: 0 0 20px;
  color: color-mix(in srgb, var(--vd-text) 70%, transparent);
  font-size: 13px;
  line-height: 1.8;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  max-width: 560px;
  overflow: hidden;
}

.vds-hero-actions {
  display: flex;
  gap: 10px;
}

.vds-hero-more {
  background: color-mix(in srgb, var(--vd-surface) 60%, transparent);
  border: 1px solid color-mix(in srgb, var(--vd-text) 22%, transparent);
  color: var(--vd-text);
  backdrop-filter: blur(8px);
}

.vds-hero-more:hover {
  background: color-mix(in srgb, var(--vd-surface) 80%, transparent);
  border-color: color-mix(in srgb, var(--vd-text) 40%, transparent);
  color: var(--vd-text);
}

/* 轮播指示点 */
.vds-hero-dots {
  position: absolute;
  right: 32px;
  bottom: 32px;
  display: flex;
  gap: 8px;
}

.vds-hero-dot {
  width: 24px;
  height: 4px;
  border: none;
  /* 原 2px（4px 高的条上即圆头），取胶囊档，渲染结果一致 */
  border-radius: var(--el-radius-full, 9999px);
  background: color-mix(in srgb, var(--vd-text) 30%, transparent);
  cursor: pointer;
  transition: all var(--el-transition-duration-fast, 0.2s) var(--vd-ease);
  padding: 0;
}

.vds-hero-dot:focus-visible {
  outline: none;
  /* 深底上 12% 的浅色环几乎不可见，改用主色 45% 的实心焦点环 */
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--vd-primary-strong) 45%, transparent);
}

.vds-hero-dot.is-active {
  background: linear-gradient(90deg, var(--vd-primary), var(--vd-secondary));
  width: 38px;
  box-shadow: 0 0 12px color-mix(in srgb, var(--vd-primary) 50%, transparent);
}

/* ── 分类内容区 ──────────────────────────── */
.vds-section {
  margin-bottom: 36px;
}

.vds-section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.vds-section-title {
  margin: 0;
  font-size: 19px;
  font-weight: 700;
  color: var(--vd-text);
  display: flex;
  align-items: center;
  gap: 10px;
}

.vds-section-bar {
  width: 4px;
  height: 20px;
  /* 原 2px（4px 宽的竖条上即圆头），取胶囊档，渲染结果一致 */
  border-radius: var(--el-radius-full, 9999px);
  background: linear-gradient(180deg, var(--vd-primary), var(--vd-secondary));
  box-shadow: 0 0 10px color-mix(in srgb, var(--vd-primary) 50%, transparent);
}

.vds-section-more {
  font-size: 13px;
  color: var(--vd-text-secondary);
  text-decoration: none;
  cursor: pointer;
  border-radius: var(--el-radius-xs, 4px);
  transition:
    color var(--el-transition-duration-fast, 0.2s) var(--vd-ease),
    box-shadow var(--el-transition-duration-fast, 0.2s) var(--vd-ease);
}

.vds-section-more:hover {
  color: var(--vd-primary-strong);
}

/* router-link 渲染出的 <a>：键盘可达，补实心焦点环 */
.vds-section-more:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--vd-primary-strong) 45%, transparent);
}

/* 横向海报轨道 */
.vds-rail {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: 172px;
  gap: 16px;
  overflow-x: auto;
  padding-bottom: 12px;
  scroll-snap-type: x proximity;
  scrollbar-width: thin;
}

.vds-rail-card {
  scroll-snap-align: start;
  /* 焦点轮廓由全局 .vd-card:focus-visible 提供（2px 实心 + 2px 偏移），
     可见性已达标，这里不覆盖，避免把可见焦点环换成弱化的浅色环 */
}

.vds-rail-card:hover {
  transform: translateY(-6px);
}

.vds-fallback-name {
  font-size: 15px;
  font-weight: 600;
  color: var(--vd-primary-strong);
  text-align: center;
  padding: 0 8px;
}

/* 海报渐变底 + 评分角标 */
.vds-rail-card :deep(.vd-poster) {
  background: linear-gradient(160deg, var(--vd-surface-card), var(--vd-surface));
}

/* 缩放与淡出是同一次微交互，原 0.35s/0.3s 统一收敛到 -fast 档 */
.vds-rail-card :deep(.vd-poster img) {
  transition:
    transform var(--el-transition-duration-fast, 0.2s) var(--vd-ease),
    opacity var(--el-transition-duration-fast, 0.2s) var(--vd-ease);
}

.vds-rail-card:hover :deep(.vd-poster img) {
  transform: scale(1.06);
}

.vds-rail-card :deep(.vd-score) {
  position: absolute;
  top: 8px;
  left: 8px;
  background: color-mix(in srgb, var(--vd-bg-deep) 82%, transparent);
  color: var(--vd-gold);
  font-size: 12px;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: var(--vd-radius-sm);
  backdrop-filter: blur(6px);
  /* #fbbf24 正是 --vd-gold */
  border: 1px solid color-mix(in srgb, var(--vd-gold) 25%, transparent);
}

.vds-rail-card :deep(.vd-card-body) {
  padding: 12px 14px 14px;
}

.vds-rail-card :deep(.vd-name) {
  margin: 0 0 5px;
  font-size: 14px;
  font-weight: 600;
  color: var(--vd-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.vds-rail-card :deep(.vd-meta) {
  margin: 0;
  font-size: 12px;
  color: var(--vd-text-secondary);
}

@media (max-width: 640px) {
  .vds-hero {
    min-height: 320px;
  }
  .vds-hero-content {
    padding: 22px;
  }
  .vds-hero-title {
    font-size: 24px;
  }
  .vds-rail {
    grid-auto-columns: 136px;
  }
}

/* 尊重系统「减少动态效果」偏好 */
@media (prefers-reduced-motion: reduce) {
  .vds-hero-bg,
  .vds-hero-content,
  .vds-hero-dot,
  .vds-section-more,
  .vds-rail-card,
  .vds-rail-card :deep(.vd-poster img) {
    transition: none;
    animation: none;
  }
  /* 关掉动画后这些 transform 只会造成位移动差，没有唯一视觉反馈承载，一并复位 */
  .vds-hero-bg,
  .vds-rail-card:hover,
  .vds-rail-card:hover :deep(.vd-poster img) {
    transform: none;
  }
}
</style>
