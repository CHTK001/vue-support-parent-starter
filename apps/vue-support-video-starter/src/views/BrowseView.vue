<script setup lang="ts">
/**
 * 视频资源浏览页
 *
 * 结构：渐变页头 + 筛选工具条 + 海报墙（网格卡片）+ 分页。
 * 交互：搜索防抖、类型筛选、卡片悬停上浮、加载骨架、空态。
 * 数据：videoApi.fetchVideoList（真实接口，失败时展示错误与重试）。
 */
import { computed, onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { Search, VideoCamera, Refresh } from "@element-plus/icons-vue";
import { fetchVideoList } from "@/api/videoApi";
import type { VideoInfo, VideoQuery } from "@/types/video";

const router = useRouter();

/* ── 状态 ─────────────────────────────────── */
const loading = ref(false);
const error = ref("");
const videos = ref<VideoInfo[]>([]);
const total = ref(0);
const keyword = ref("");
const activeType = ref("");
const page = ref(1);
const pageSize = 24;

/** 类型筛选项 */
const TYPE_OPTIONS = [
  { value: "", label: "全部" },
  { value: "movie", label: "电影" },
  { value: "tv", label: "剧集" },
  { value: "variety", label: "综艺" },
  { value: "anime", label: "动画" },
  { value: "documentary", label: "纪录片" },
] as const;

const typeLabel = computed(
  () => TYPE_OPTIONS.find((t) => t.value === activeType.value)?.label ?? "视频",
);

/* ── 数据加载 ─────────────────────────────── */
async function load() {
  loading.value = true;
  error.value = "";
  const query: VideoQuery = {
    keyword: keyword.value.trim() || undefined,
    videoType: activeType.value || undefined,
    page: page.value,
    pageSize,
  };
  try {
    const result = await fetchVideoList(query);
    videos.value = result.list ?? [];
    total.value = result.total ?? 0;
  } catch (e) {
    error.value = e instanceof Error ? e.message : "数据加载失败，请确认后端服务已启动";
    videos.value = [];
    total.value = 0;
  } finally {
    loading.value = false;
  }
}

/** 搜索防抖 */
let searchTimer: ReturnType<typeof setTimeout> | null = null;
watch(keyword, () => {
  if (searchTimer) clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    page.value = 1;
    void load();
  }, 350);
});

watch(activeType, () => {
  page.value = 1;
  void load();
});

watch(page, () => void load());

function onRetry() {
  void load();
}

function openVideo(item: VideoInfo) {
  void router.push({ name: "watch", params: { id: item.id } });
}

function coverUrl(item: VideoInfo): string {
  return item.cover || "";
}

onMounted(() => void load());
</script>

<template>
  <div class="vd-page">
    <!-- 页头 -->
    <header class="vd-header">
      <div>
        <h1>视频资源中心</h1>
        <p class="vd-subtitle">共 {{ total }} 部{{ typeLabel }} · 数据来自多源同步</p>
      </div>
      <el-button :icon="Refresh" circle aria-label="刷新列表" @click="onRetry" />
    </header>

    <!-- 筛选工具条 -->
    <div class="vd-toolbar">
      <el-input
        v-model="keyword"
        class="vd-search"
        :prefix-icon="Search"
        placeholder="搜索影片名称…"
        clearable
        size="large"
        aria-label="搜索影片"
      />
      <div class="vd-type-tabs" role="tablist" aria-label="视频类型筛选">
        <button
          v-for="t in TYPE_OPTIONS"
          :key="t.value"
          type="button"
          role="tab"
          class="vd-type-tab"
          :class="{ 'is-active': activeType === t.value }"
          :aria-selected="activeType === t.value"
          @click="activeType = t.value"
        >
          {{ t.label }}
        </button>
      </div>
    </div>

    <!-- 加载失败 -->
    <div v-if="error && !loading" class="vds-load-error">
      <el-empty :description="error">
        <el-button type="primary" @click="onRetry">重试</el-button>
      </el-empty>
    </div>

    <!-- 海报墙 -->
    <div v-else-if="loading" class="vd-grid" aria-busy="true">
      <div v-for="i in 12" :key="i" class="vd-card vd-poster-skeleton" style="aspect-ratio: 2/3" />
    </div>

    <template v-else>
      <div v-if="videos.length" class="vd-grid">
        <article
          v-for="item in videos"
          :key="item.id"
          class="vd-card"
          tabindex="0"
          role="button"
          :aria-label="`播放 ${item.name}`"
          @click="openVideo(item)"
          @keydown.enter="openVideo(item)"
        >
          <div class="vd-poster">
            <img
              v-if="coverUrl(item)"
              :src="coverUrl(item)"
              :alt="`${item.name} 封面`"
              loading="lazy"
            />
            <div v-else class="vd-poster-fallback" aria-hidden="true">
              <el-icon :size="42"><VideoCamera /></el-icon>
            </div>
            <span v-if="item.score" class="vd-score">{{ item.score.toFixed(1) }}</span>
            <span v-if="item.continueInfo" class="vd-continue">{{ item.continueInfo }}</span>
          </div>
          <div class="vd-card-body">
            <h3 class="vd-name" :title="item.name">{{ item.name }}</h3>
            <p class="vd-meta">
              <span v-if="item.year">{{ item.year }}</span>
              <span v-if="item.district">{{ item.district }}</span>
            </p>
            <div v-if="item.tags?.length" class="vd-tags">
              <span v-for="tag in item.tags.slice(0, 3)" :key="tag" class="vd-tag">{{ tag }}</span>
            </div>
          </div>
        </article>
      </div>

      <div v-else class="vd-empty">
        <el-empty description="没有找到匹配的影片，换个关键词试试">
          <el-button type="primary" @click="keyword = ''; activeType = ''">清空筛选</el-button>
        </el-empty>
      </div>

      <div v-if="total > pageSize" class="vd-pagination">
        <el-pagination
          v-model:current-page="page"
          :page-size="pageSize"
          :total="total"
          layout="prev, pager, next, jumper, total"
          background
        />
      </div>
    </template>
  </div>
</template>

<style scoped>
/* ── 工具条 ─────────────────────────────── */
.vd-toolbar {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 22px;
  flex-wrap: wrap;
}

.vd-search {
  width: 320px;
  max-width: 100%;
}

.vd-search :deep(.el-input__wrapper) {
  border-radius: var(--vd-radius-md);
  box-shadow: 0 0 0 1px var(--vd-border) inset;
  transition: box-shadow 0.2s var(--vd-ease);
}

.vd-search :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 2px var(--vd-primary) inset;
}

/* 类型页签 */
.vd-type-tabs {
  display: flex;
  gap: 4px;
  background: var(--vd-surface-card);
  border: 1px solid var(--vd-border);
  border-radius: var(--vd-radius-md);
  padding: 4px;
}

.vd-type-tab {
  border: none;
  background: transparent;
  color: var(--vd-text-secondary);
  font-size: 13px;
  padding: 6px 14px;
  border-radius: var(--vd-radius-sm);
  cursor: pointer;
  transition: all 0.2s var(--vd-ease);
}

.vd-type-tab:hover {
  color: var(--vd-primary);
}

.vd-type-tab.is-active {
  background: linear-gradient(135deg, var(--vd-primary), var(--vd-secondary));
  color: #fff;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(14, 165, 233, 0.35);
}

.vd-type-tab:focus-visible {
  outline: 2px solid var(--vd-primary);
  outline-offset: 1px;
}

/* ── 海报墙 ─────────────────────────────── */
.vd-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 18px;
}

/* 海报区 */
.vd-poster {
  position: relative;
  aspect-ratio: 2 / 3;
  background: #dbeafe;
  overflow: hidden;
}

.vd-poster img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform 0.3s var(--vd-ease);
}

.vd-card:hover .vd-poster img {
  transform: scale(1.05);
}

.vd-poster-fallback {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #93c5fd;
  background: linear-gradient(160deg, #e0f2fe, #bae6fd);
}

/* 评分角标 */
.vd-score {
  position: absolute;
  top: 8px;
  left: 8px;
  background: rgba(12, 74, 110, 0.85);
  color: #fbbf24;
  font-size: 12px;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: var(--vd-radius-sm);
  backdrop-filter: blur(4px);
}

/* 更新状态角标 */
.vd-continue {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(transparent, rgba(11, 18, 32, 0.88));
  color: #e2f3ff;
  font-size: 12px;
  text-align: center;
  padding: 18px 8px 8px;
}

/* 卡片主体 */
.vd-card-body {
  padding: 10px 12px 12px;
}

.vd-name {
  margin: 0 0 4px;
  font-size: 14px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(--vd-text);
}

.vd-meta {
  margin: 0 0 6px;
  font-size: 12px;
  color: var(--vd-text-secondary);
  display: flex;
  gap: 8px;
}

.vd-tags {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.vd-tag {
  font-size: 11px;
  color: var(--vd-primary-strong);
  background: var(--vd-surface);
  border: 1px solid #bae6fd;
  border-radius: 999px;
  padding: 1px 8px;
}

/* ── 空态 / 分页 ─────────────────────────── */
.vd-empty {
  padding: 60px 0;
}

.vd-pagination {
  display: flex;
  justify-content: center;
  margin-top: 28px;
}

@media (max-width: 640px) {
  .vd-page {
    padding: 16px;
  }
  .vd-grid {
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 12px;
  }
  .vd-search {
    width: 100%;
  }
}
</style>
