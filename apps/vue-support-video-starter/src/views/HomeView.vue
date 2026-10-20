<script setup lang="ts">
/**
 * 主页（第三版 · 参照站复刻）
 *
 * 参照站首页结构：`.slideBox`（左大图轮播 + 右缩略列表）+ 若干 `.wrap`
 * （h2 区块标题 + 6 列海报栅格）。
 *
 * 数据：datasearch-starter 多源 Provider 同步的库内数据。
 */
import { computed, onMounted, onUnmounted, ref } from "vue";
import { useRouter } from "vue-router";
import { fetchVideoList } from "@/api/videoApi";
import type { VideoInfo } from "@/types/video";
import VideoCard from "@/components/VideoCard.vue";

const router = useRouter();

/* ── 状态 ─────────────────────────────────── */
const loading = ref(true);
const error = ref("");
const heroList = ref<VideoInfo[]>([]);
const sections = ref<{ key: string; label: string; type: string; list: VideoInfo[] }[]>([]);
const heroIndex = ref(0);

/** 首页分类区（每区 12 部 = 6 列 × 2 行） */
const SECTIONS = [
  { key: "movie", label: "最近更新的电影", type: "movie" },
  { key: "tv", label: "最近更新的剧集", type: "tv" },
  { key: "anime", label: "人气动漫", type: "anime" },
  { key: "variety", label: "综艺娱乐", type: "variety" },
] as const;

let heroTimer: ReturnType<typeof setInterval> | null = null;

/** 当前 Hero 影片 */
const hero = computed(() => heroList.value[heroIndex.value] ?? null);

/** Hero 副标题（年份 · 地区 · 类型） */
const heroSub = computed(() => {
  const h = hero.value;
  if (!h) return "";
  return [h.year, h.district, ...(h.tags ?? []).slice(0, 2)].filter(Boolean).join(" · ");
});

/* ── 数据加载 ─────────────────────────────── */
async function load() {
  loading.value = true;
  error.value = "";
  try {
    // 焦点区：取评分最高的前 3 部（参照站右侧列表正好 3 项）
    const hot = await fetchVideoList({ page: 1, pageSize: 12 });
    heroList.value = [...(hot.list ?? [])]
      .filter((v) => v.cover)
      .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
      .slice(0, 3);
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

function heroMeta(item: VideoInfo) {
  return [item.year, item.district, ...(item.tags ?? []).slice(0, 3)].filter(Boolean).join(" / ");
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
    <div v-if="error && !loading" class="vd-empty">
      <el-empty :description="error">
        <el-button type="primary" @click="load">重试</el-button>
      </el-empty>
    </div>

    <template v-else>
      <!-- ── 焦点区：大图轮播 + 右侧缩略列表 ────── -->
      <section v-if="hero" class="vd-hero" aria-label="热播推荐">
        <div class="vd-hero-main">
          <div class="vd-hero-slide">
            <img class="vd-hero-img" :src="hero.cover" :alt="hero.name" />
            <div class="vd-hero-detail">
              <h2 class="vd-hero-title">
                <router-link :to="{ name: 'watch', params: { id: hero.id } }">
                  {{ hero.name }}
                </router-link>
              </h2>
              <div v-if="heroSub" class="vd-hero-name">{{ heroSub }}</div>
              <p v-if="hero.remark" class="vd-hero-info">{{ hero.remark }}</p>
            </div>
          </div>
        </div>

        <div class="vd-hero-aside">
          <ul>
            <li
              v-for="(item, i) in heroList"
              :key="item.id"
              :class="{ on: i === heroIndex }"
              @mouseenter="selectHero(i)"
            >
              <a href="#" @click.prevent="selectHero(i)">
                <div class="img">
                  <img v-if="item.cover" :src="item.cover" :alt="item.name" loading="lazy" />
                </div>
                <div class="detail">
                  <div class="title">{{ item.name }}</div>
                  <div class="info">{{ heroMeta(item) }}</div>
                  <div class="info">{{ item.continueInfo || item.remark }}</div>
                </div>
              </a>
            </li>
          </ul>
        </div>
      </section>

      <!-- ── 分类内容区 ───────────────────────── -->
      <section v-for="sec in sections" :key="sec.key" class="vd-section">
        <div class="vd-section-head">
          <h2 class="vd-section-title">{{ sec.label }}</h2>
          <a class="vd-section-more" href="#" @click.prevent="goChannel(sec.type)">更多 ❯</a>
        </div>

        <div v-if="sec.list.length" class="vd-grid">
          <VideoCard v-for="item in sec.list" :key="item.id" :item="item" />
        </div>
        <el-empty v-else description="暂无内容" :image-size="90" />
      </section>

      <!-- 骨架 -->
      <div v-if="loading" class="vd-grid vd-home-skeleton" aria-hidden="true">
        <div v-for="i in 6" :key="i" class="vd-skeleton-col">
          <div class="vd-poster-skeleton" />
        </div>
      </div>

      <div v-if="!loading && !heroList.length && !error" class="vd-empty">
        <el-empty description="暂无影片数据" />
      </div>
    </template>
  </div>
</template>

<style scoped>
/* ═══════════════════════════════════════════
   焦点区（对齐参照站 .slideBox：1385×475）
   ═══════════════════════════════════════════ */
.vd-hero {
  position: relative;
  height: 475px;
  margin-top: 0;
}

.vd-hero-main {
  position: absolute;
  inset: 0 435px 0 0;
  border-radius: 5px;
  overflow: hidden;
  background: var(--vd-surface);
}

.vd-hero-slide {
  position: relative;
  width: 100%;
  height: 100%;
}

.vd-hero-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

/* 底部压暗，保证白字可读 */
.vd-hero-main::after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to top,
    rgb(0 0 0 / 85%) 0%,
    rgb(0 0 0 / 45%) 32%,
    rgb(0 0 0 / 0%) 68%
  );
  pointer-events: none;
}

.vd-hero-detail {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  overflow: hidden;
}

.vd-hero-title {
  margin: 0;
  font-size: 24px;
  font-weight: 500;
  line-height: 36px;
}

.vd-hero-title a {
  color: #fff;
}

.vd-hero-title a:hover {
  color: #fff;
  text-decoration: underline;
}

.vd-hero-name {
  font-size: 16px;
  line-height: 24px;
  color: #e6e6e6;
}

.vd-hero-info {
  margin: 0;
  font-size: 16px;
  line-height: 24px;
  color: #e6e6e6;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

/* ── 右侧缩略列表（416 宽，每项 145 高） ── */
.vd-hero-aside {
  position: absolute;
  inset: 0 0 0 auto;
  width: 416px;
}

.vd-hero-aside ul {
  list-style: none;
  margin: 0;
  padding: 0;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.vd-hero-aside li {
  flex: 1;
  min-height: 0;
}

.vd-hero-aside li > a {
  display: flex;
  height: 100%;
  color: inherit;
}

.vd-hero-aside .img {
  flex-shrink: 0;
  width: 97px;
  background: var(--vd-surface);
  border-radius: 5px 0 0 5px;
  overflow: hidden;
}

.vd-hero-aside .img img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.vd-hero-aside .detail {
  flex: 1;
  min-width: 0;
  background: var(--vd-surface);
  border-radius: 0 5px 5px 0;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  overflow: hidden;
}

.vd-hero-aside .title {
  font-size: 16px;
  line-height: 24px;
  color: #000;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.vd-hero-aside .info {
  font-size: 13px;
  line-height: 19.5px;
  color: var(--vd-text-2);
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

/* 选中态：浅蓝底（参照站 --ebg） */
.vd-hero-aside li.on .img,
.vd-hero-aside li.on .detail {
  background: var(--vd-primary-soft);
}

.vd-hero-aside a:hover .title {
  color: var(--vd-primary);
}

/* ═══════════════════════════════════════════
   骨架
   ═══════════════════════════════════════════ */
.vd-home-skeleton {
  margin-top: 20px;
}

.vd-skeleton-col .vd-poster-skeleton {
  aspect-ratio: 2 / 3;
}

/* ═══════════════════════════════════════════
   响应式
   ═══════════════════════════════════════════ */
@media (max-width: 1100px) {
  .vd-hero {
    height: 400px;
  }
  .vd-hero-aside {
    width: 320px;
  }
  .vd-hero-main {
    inset: 0 340px 0 0;
  }
}

@media (max-width: 760px) {
  .vd-hero {
    height: auto;
  }
  .vd-hero-main {
    position: relative;
    inset: auto;
    height: 300px;
  }
  .vd-hero-aside {
    position: static;
    width: auto;
    margin-top: 12px;
  }
  .vd-hero-aside ul {
    gap: 10px;
  }
  .vd-hero-aside li {
    min-height: 96px;
  }
  .vd-hero-title {
    font-size: 19px;
    line-height: 28px;
  }
  .vd-hero-info {
    font-size: 14px;
    -webkit-line-clamp: 1;
  }
}

@media (max-width: 520px) {
  .vd-hero-aside .img {
    width: 70px;
  }
  .vd-hero-aside .detail {
    padding: 12px;
  }
}
</style>
