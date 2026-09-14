<script setup lang="ts">
/**
 * 频道页 —— 电影/电视剧/动漫/综艺等分类浏览
 *
 * 结构：频道标题 + 排序筛选 + 海报墙网格 + 分页（复用 vd-card 卡片体系）。
 * 交互：路由参数驱动（/channel/:type）、排序切换、分页、滚动到顶部。
 * 数据：videoApi.fetchVideoList；未接后端时降级演示数据。
 */
import { computed, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { fetchVideoList } from "@/api/videoApi";
import type { VideoInfo } from "@/types/video";

const route = useRoute();
const router = useRouter();

/* ── 频道定义 ─────────────────────────────── */
const CHANNELS: Record<string, { label: string; desc: string }> = {
  movie: { label: "电影", desc: "院线新片与经典佳作" },
  tv: { label: "电视剧", desc: "热播剧集与精品短剧" },
  anime: { label: "动漫", desc: "番剧、剧场版与国创" },
  variety: { label: "综艺", desc: "热门综艺与选秀现场" },
  documentary: { label: "纪录片", desc: "人文自然与科技纪实" },
};

const channelType = computed(() => String(route.params.type ?? "movie"));
const channel = computed(
  () => CHANNELS[channelType.value] ?? { label: "全部影片", desc: "多源聚合的视频资源库" },
);

/* ── 状态 ─────────────────────────────────── */
const loading = ref(true);
const error = ref("");
const videos = ref<VideoInfo[]>([]);
const total = ref(0);
const page = ref(1);
const sort = ref("update");
const pageSize = 30;

const SORT_OPTIONS = [
  { value: "update", label: "最近更新" },
  { value: "score", label: "评分最高" },
  { value: "year", label: "年份最新" },
] as const;

/* ── 数据加载 ─────────────────────────────── */
async function load() {
  loading.value = true;
  error.value = "";
  try {
    const result = await fetchVideoList({
      videoType: channelType.value,
      page: page.value,
      pageSize,
      // sort 由后端可选支持；当前版本前端兜底排序
    });
    let list = result.list ?? [];
    if (sort.value === "score") {
      list = [...list].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
    } else if (sort.value === "year") {
      list = [...list].sort((a, b) => (b.year ?? "").localeCompare(a.year ?? ""));
    }
    videos.value = list;
    total.value = result.total ?? list.length;
  } catch (e) {
    error.value = e instanceof Error ? e.message : "数据加载失败，请确认后端服务已启动";
    videos.value = [];
    total.value = 0;
  } finally {
    loading.value = false;
  }
}

// 频道切换：重置分页并滚回顶部
watch(channelType, () => {
  page.value = 1;
  window.scrollTo({ top: 0, behavior: "smooth" });
  void load();
});

watch(sort, () => {
  page.value = 1;
  void load();
});

watch(page, () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
  void load();
});

function goWatch(item: VideoInfo) {
  void router.push({ name: "watch", params: { id: item.id } });
}

onMounted(() => void load());
</script>

<template>
  <div class="vd-page">
    <!-- 频道头 -->
    <header class="vd-header">
      <div>
        <h1>{{ channel.label }}</h1>
        <p class="vd-subtitle">{{ channel.desc }} · 共 {{ total }} 部</p>
      </div>
      <div class="vds-sort" role="radiogroup" aria-label="排序方式">
        <button
          v-for="opt in SORT_OPTIONS"
          :key="opt.value"
          type="button"
          role="radio"
          class="vds-sort-btn"
          :class="{ 'is-active': sort === opt.value }"
          :aria-checked="sort === opt.value"
          @click="sort = opt.value"
        >
          {{ opt.label }}
        </button>
      </div>
    </header>

    <!-- 加载失败 -->
    <div v-if="error && !loading" class="vds-load-error">
      <el-empty :description="error">
        <el-button type="primary" @click="load">重试</el-button>
      </el-empty>
    </div>

    <!-- 海报墙 -->
    <div v-else-if="loading" class="vds-channel-grid" aria-busy="true">
      <div v-for="i in 12" :key="i" class="vd-card vd-poster-skeleton" style="aspect-ratio: 2/3" />
    </div>

    <template v-else>
      <div v-if="videos.length" class="vds-channel-grid">
        <article
          v-for="item in videos"
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
        <el-empty description="该频道暂无内容" />
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
/* ── 排序 ─────────────────────────────────── */
.vds-sort {
  display: flex;
  gap: 4px;
  background: var(--vd-surface-card);
  border: 1px solid var(--vd-border);
  border-radius: var(--vd-radius-md);
  padding: 4px;
}

.vds-sort-btn {
  border: none;
  background: transparent;
  color: var(--vd-text-secondary);
  font-size: 13px;
  padding: 6px 14px;
  border-radius: var(--vd-radius-sm);
  cursor: pointer;
  transition: all 0.2s var(--vd-ease);
}

.vds-sort-btn:hover {
  color: var(--vd-primary);
}

.vds-sort-btn.is-active {
  background: linear-gradient(135deg, var(--vd-primary), var(--vd-secondary));
  color: #fff;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(14, 165, 233, 0.35);
}

.vds-sort-btn:focus-visible {
  outline: 2px solid var(--vd-primary);
  outline-offset: 1px;
}

/* ── 频道海报墙（网格，比首页轨道更密） ───── */
.vds-channel-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(168px, 1fr));
  gap: 18px;
}

.vds-fallback-name {
  font-size: 15px;
  font-weight: 600;
  color: #075985;
  text-align: center;
  padding: 0 8px;
}

.vd-empty {
  padding: 60px 0;
}

.vd-pagination {
  display: flex;
  justify-content: center;
  margin-top: 28px;
}

@media (max-width: 640px) {
  .vds-channel-grid {
    grid-template-columns: repeat(auto-fill, minmax(128px, 1fr));
    gap: 12px;
  }
}
</style>
