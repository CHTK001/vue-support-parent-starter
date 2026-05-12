<template>
  <div class="video-result-page">
    <div class="page-header">
      <div class="header-content">
        <button class="back-btn" @click="goBack">
          <IconifyIconOnline icon="ep:arrow-left" />
        </button>
        <div class="header-text">
          <h1 class="header-title">搜索结果</h1>
          <p class="header-desc" v-if="!loading">共找到 {{ totalCount }} 条结果</p>
        </div>
      </div>
    </div>

    <main class="main-content">
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>正在搜索...</p>
      </div>

      <template v-else-if="results.length > 0">
        <transition-group name="list" tag="div" class="results-list">
          <div
            v-for="(item, index) in results"
            :key="item.id || index"
            class="result-card"
            @click="goToDetail(item)"
          >
            <div class="card-poster">
              <img
                :src="item.videoCover || '/placeholder.jpg'"
                :alt="item.videoTitle"
                loading="lazy"
                @error="handleImgError"
              />
              <div class="card-play-overlay">
                <IconifyIconOnline icon="ep:video-play" />
              </div>
            </div>
            <div class="card-body">
              <h3 class="card-title">{{ item.videoTitle || item.videoName }}</h3>
              <div class="card-meta">
                <span v-if="item.videoType" class="meta-tag">{{ item.videoType }}</span>
                <span v-if="item.year || item.videoYear" class="meta-year">{{ item.year || item.videoYear }}</span>
              </div>
              <p v-if="item.videoDescription" class="card-desc">{{ item.videoDescription }}</p>
              <div class="card-footer">
                <span class="card-rating" v-if="item.rating || item.videoScore">
                  <IconifyIconOnline icon="ep:star-filled" />
                  {{ item.rating || item.videoScore }}
                </span>
                <span class="card-views" v-if="item.views">{{ formatViews(item.views) }} 次播放</span>
              </div>
            </div>
          </div>
        </transition-group>

        <div v-if="totalPages > 1" class="pagination">
          <button class="page-btn" :disabled="currentPage <= 1" @click="changePage(currentPage - 1)">
            <IconifyIconOnline icon="ep:arrow-left" />
          </button>
          <button
            v-for="p in displayedPages"
            :key="p"
            :class="['page-btn', { active: p === currentPage }]"
            @click="changePage(p)"
          >
            {{ p }}
          </button>
          <button class="page-btn" :disabled="currentPage >= totalPages" @click="changePage(currentPage + 1)">
            <IconifyIconOnline icon="ep:arrow-right" />
          </button>
        </div>
      </template>

      <div v-else class="empty-state">
        <IconifyIconOnline icon="ep:search" class="empty-icon" />
        <h3>没有找到结果</h3>
        <p>试试其他关键词</p>
        <button class="retry-btn" @click="goBack">返回搜索</button>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";

interface VideoResult {
  id?: string;
  videoName?: string;
  videoTitle?: string;
  videoCover?: string;
  videoType?: string;
  videoYear?: number;
  year?: number;
  videoDescription?: string;
  videoPopularity?: number;
  views?: number;
  rating?: number;
  [key: string]: any;
}

const route = useRoute();
const router = useRouter();

const loading = ref(false);
const results = ref<VideoResult[]>([]);
const currentPage = ref(1);
const totalCount = ref(0);
const pageSize = 20;

const totalPages = computed(() => Math.max(1, Math.ceil(totalCount.value / pageSize)));

const displayedPages = computed(() => {
  const total = totalPages.value;
  const curr = currentPage.value;
  const pages: number[] = [];
  let start = Math.max(1, curr - 2);
  let end = Math.min(total, curr + 2);
  if (end - start < 4) {
    if (start === 1) end = Math.min(total, start + 4);
    else start = Math.max(1, end - 4);
  }
  for (let i = start; i <= end; i++) pages.push(i);
  return pages;
});

const searchKeyword = ref("");

const handleImgError = (e: Event) => {
  const img = e.target as HTMLImageElement;
  img.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="280" fill="%23eee"><rect width="200" height="280"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%23aaa" font-size="14">暂无封面</text></svg>';
};

const searchVideos = async (page: number = 1) => {
  const keyword = route.query.keyword as string;
  if (!keyword) return;

  loading.value = true;
  searchKeyword.value = keyword;
  currentPage.value = page;

  try {
    const res = await fetch(
      `/api/video-test/search?keyword=${encodeURIComponent(keyword)}&type=MV&page=${page}&pageSize=${pageSize}`
    );
    const raw = await res.json();
    const data = raw?.data || {};
    results.value = data.list || [];
    totalCount.value = data.total || results.value.length;
  } catch (err) {
    console.error("搜索失败:", err);
    results.value = [];
    totalCount.value = 0;
  } finally {
    loading.value = false;
  }
};

const changePage = (page: number) => {
  if (page < 1 || page > totalPages.value) return;
  searchVideos(page);
  window.scrollTo({ top: 0, behavior: "smooth" });
};

const goToDetail = (item: VideoResult) => {
  const id = item.id || item.videoOriginId;
  if (id) router.push({ path: `/video/detail/${id}`, state: { item } });
};

const goBack = () => {
  router.push("/video/search");
};

const formatViews = (views: number) => {
  if (views >= 10000) return (views / 10000).toFixed(1) + "万";
  return views.toString();
};

watch(() => route.query.keyword, (kw) => {
  if (kw) searchVideos(1);
});

onMounted(() => {
  if (route.query.keyword) searchVideos(1);
});
</script>

<style scoped>
.video-result-page {
  width: 100%;
  min-height: 100vh;
  background: #08080f;
}

/* ── Header ── */
.page-header {
  background: rgba(255,255,255,.03);
  border-bottom: 1px solid rgba(255,255,255,.06);
  padding: 20px 32px;
  position: sticky; top: 0; z-index: 10;
  backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
}

.header-content {
  display: flex; align-items: center; gap: 16px;
}

.back-btn {
  width: 42px; height: 42px;
  border: 1px solid rgba(255,255,255,.08);
  border-radius: 14px;
  background: rgba(255,255,255,.04);
  color: rgba(255,255,255,.5);
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  font-size: 20px;
  transition: all .25s ease; flex-shrink: 0;
}
.back-btn:hover {
  background: rgba(99,102,241,.12);
  color: #a5b4fc; border-color: rgba(99,102,241,.3);
  transform: translateX(-2px);
}

.header-text { flex: 1; }
.header-title {
  font-size: 22px; font-weight: 700; color: #e0e7ff;
  margin: 0 0 4px;
}
.header-desc { font-size: 14px; color: rgba(255,255,255,.35); margin: 0; }

/* ── Main ── */
.main-content { padding: 32px 32px 60px; }

/* ── Loading ── */
.loading-state {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  padding: 100px 20px;
  color: rgba(255,255,255,.35);
}
.spinner {
  width: 40px; height: 40px;
  border: 3px solid rgba(99,102,241,.12);
  border-top-color: #6366f1;
  border-radius: 50%;
  animation: spin .8s linear infinite;
  margin-bottom: 16px;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ── Results list ── */
.results-list {
  display: flex; flex-direction: column; gap: 16px;
}

.list-enter-active { transition: all .4s ease; }
.list-enter-from { opacity: 0; transform: translateX(-24px); }

.result-card {
  display: flex; gap: 24px;
  padding: 20px;
  background: rgba(255,255,255,.02);
  border-radius: 16px;
  border: 1px solid rgba(255,255,255,.06);
  cursor: pointer;
  transition: all .35s cubic-bezier(.34,1.56,.64,1);
}
.result-card:hover {
  background: rgba(255,255,255,.05);
  border-color: rgba(99,102,241,.2);
  transform: translateY(-3px);
  box-shadow: 0 12px 40px rgba(0,0,0,.2);
}

.card-poster {
  width: 160px; height: 224px;
  border-radius: 12px;
  overflow: hidden; flex-shrink: 0;
  position: relative;
  background: rgba(0,0,0,.3);
}
.card-poster img {
  width: 100%; height: 100%;
  object-fit: cover;
  transition: transform .5s ease;
}
.result-card:hover .card-poster img { transform: scale(1.08); }

.card-play-overlay {
  position: absolute; inset: 0;
  background: rgba(0,0,0,.35);
  display: flex; align-items: center; justify-content: center;
  opacity: 0; transition: opacity .3s ease;
  font-size: 36px; color: #fff;
  backdrop-filter: blur(2px); -webkit-backdrop-filter: blur(2px);
}
.result-card:hover .card-play-overlay { opacity: 1; }

.card-body {
  flex: 1; min-width: 0;
  display: flex; flex-direction: column; gap: 10px;
}
.card-title {
  font-size: 20px; font-weight: 600; color: #e0e7ff;
  margin: 0; line-height: 1.3;
  transition: color .2s;
}
.result-card:hover .card-title { color: #a5b4fc; }

.card-meta { display: flex; gap: 8px; flex-wrap: wrap; }
.meta-tag, .meta-year {
  font-size: 12px; padding: 4px 12px;
  border-radius: 8px;
  color: rgba(255,255,255,.45);
  background: rgba(255,255,255,.05);
  font-weight: 500;
}

.card-desc {
  font-size: 14px; color: rgba(255,255,255,.3);
  margin: 0; line-height: 1.6;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
}

.card-footer {
  display: flex; align-items: center; gap: 20px;
  margin-top: auto;
}
.card-rating {
  font-size: 14px; color: #fbbf24;
  display: flex; align-items: center; gap: 4px;
  font-weight: 600;
}
.card-views { font-size: 13px; color: rgba(255,255,255,.25); }

/* ── Pagination ── */
.pagination {
  display: flex; justify-content: center; align-items: center;
  gap: 8px; margin-top: 48px;
}
.page-btn {
  min-width: 40px; height: 40px; padding: 0 12px;
  border: 1px solid rgba(255,255,255,.08);
  border-radius: 12px;
  background: rgba(255,255,255,.03);
  color: rgba(255,255,255,.5);
  font-size: 14px; font-weight: 500;
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: all .25s ease;
}
.page-btn:hover:not(:disabled):not(.active) {
  background: rgba(255,255,255,.08);
  color: #a5b4fc; border-color: rgba(99,102,241,.3);
  transform: translateY(-1px);
}
.page-btn.active {
  background: linear-gradient(135deg,#6366f1,#a855f7);
  color: #fff; border-color: transparent;
  box-shadow: 0 4px 16px rgba(99,102,241,.3);
}
.page-btn:disabled { opacity: .25; cursor: not-allowed; }

/* ── Empty ── */
.empty-state { text-align: center; padding: 100px 20px; }
.empty-icon { font-size: 72px; color: rgba(255,255,255,.06); margin-bottom: 20px; }
.empty-state h3 { font-size: 18px; color: rgba(255,255,255,.4); margin: 0 0 8px; font-weight: 600; }
.empty-state p { font-size: 14px; color: rgba(255,255,255,.2); margin: 0 0 28px; }
.retry-btn {
  padding: 12px 32px;
  border: none; border-radius: 12px;
  background: linear-gradient(135deg,#6366f1,#a855f7);
  color: #fff; font-size: 14px; font-weight: 600;
  cursor: pointer;
  transition: all .3s ease;
  box-shadow: 0 4px 16px rgba(99,102,241,.3);
}
.retry-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 28px rgba(99,102,241,.4);
}

/* ── Responsive ── */
@media (max-width: 768px) {
  .page-header { padding: 16px 20px; }
  .header-title { font-size: 18px; }
  .main-content { padding: 20px 20px 40px; }

  .result-card { flex-direction: column; padding: 14px; gap: 14px; }
  .card-poster { width: 100%; height: 200px; }
  .card-title { font-size: 17px; }

  .pagination { gap: 6px; }
  .page-btn { min-width: 36px; height: 36px; font-size: 13px; }
}
</style>
