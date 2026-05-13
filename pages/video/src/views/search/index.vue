<template>
  <div class="video-search-page">
    <!-- Top Bar -->
    <header class="top-bar">
      <div class="top-bar-left">
        <div class="top-logo">
          <div class="top-logo-icon">
            <IconifyIconOnline icon="ri:video-fill" />
          </div>
          <span class="top-logo-text">影视搜索</span>
        </div>
        <div class="category-inline">
          <button
            v-for="cat in videoCategories"
            :key="cat.value"
            :class="['cat-tab', { active: currentCategory === cat.value }]"
            @click="switchCategory(cat.value)"
          >
            {{ cat.label }}
          </button>
        </div>
      </div>
      <div class="top-bar-right">
        <div class="search-inline">
          <IconifyIconOnline icon="ep:search" class="search-ico" />
          <input
            v-model="searchKeyword"
            type="text"
            class="search-input-inline"
            placeholder="搜索影视、演员..."
            @keyup.enter="handleSearch"
          />
          <button v-if="searchKeyword" class="clear-btn-sm" @click="searchKeyword = ''">
            <IconifyIconOnline icon="ep:close" />
          </button>
        </div>
        <button class="top-bar-btn" @click="goTaskManage" title="采集管理">
          <IconifyIconOnline icon="ep:clock" />
        </button>
        <button class="top-bar-btn" @click="goParse" title="视频解析">
          <IconifyIconOnline icon="ep:video-play" />
        </button>
      </div>
    </header>

    <!-- Enhanced Filter Bar -->
    <div class="filter-bar">
      <!-- Genre Pills -->
      <div class="filter-row">
        <span class="filter-label">
          <IconifyIconOnline icon="ep:film" />
          类型
        </span>
        <div class="filter-pills">
          <button
            v-for="g in genreOptions"
            :key="g.value"
            :class="['pill', { active: filterGenre === g.value }]"
            @click="filterGenre = filterGenre === g.value ? '' : g.value; handleSearch()"
          >
            {{ g.label }}
          </button>
        </div>
      </div>

      <!-- Year + Region + Sort + Status -->
      <div class="filter-row">
        <span class="filter-label">
          <IconifyIconOnline icon="ep:calendar" />
          年代
        </span>
        <div class="filter-pills">
          <button
            v-for="y in yearOptions.slice(0, 8)"
            :key="y.value"
            :class="['pill', { active: filterYear === y.value }]"
            @click="filterYear = filterYear === y.value ? '' : y.value; handleSearch()"
          >
            {{ y.label }}
          </button>
          <select v-model="filterYear" class="pill-select">
            <option value="">更多</option>
            <option v-for="y in yearOptions" :key="y.value" :value="y.value">{{ y.label }}</option>
          </select>
        </div>

        <span class="filter-label" style="margin-left:12px">
          <IconifyIconOnline icon="ep:map-location" />
          地区
        </span>
        <div class="filter-pills">
          <button
            v-for="r in regionOptions"
            :key="r.value"
            :class="['pill', { active: filterRegion === r.value }]"
            @click="filterRegion = filterRegion === r.value ? '' : r.value; handleSearch()"
          >
            {{ r.label }}
          </button>
        </div>
      </div>

      <!-- Sort + Status + Resolution + Search -->
      <div class="filter-row">
        <span class="filter-label">
          <IconifyIconOnline icon="ep:sort" />
          排序
        </span>
        <div class="filter-pills">
          <button
            v-for="s in sortOptions"
            :key="s.value"
            :class="['pill', { active: filterSort === s.value }]"
            @click="filterSort = filterSort === s.value ? '' : s.value; handleSearch()"
          >
            {{ s.label }}
          </button>
        </div>

        <span class="filter-label" style="margin-left:12px">
          <IconifyIconOnline icon="ep:monitor" />
          清晰度
        </span>
        <div class="filter-pills">
          <button
            v-for="r in resolutionOptions"
            :key="r.value"
            :class="['pill', { active: filterResolution === r.value }]"
            @click="filterResolution = filterResolution === r.value ? '' : r.value; handleSearch()"
          >
            {{ r.label }}
          </button>
        </div>

        <button class="search-btn-filter" @click="handleSearch" :disabled="loading">
          <IconifyIconOnline icon="ep:search" />
          {{ loading ? '搜索中' : '搜索' }}
        </button>
      </div>
    </div>

    <!-- Status Line -->
    <div class="status-bar" v-if="searched">
      <div class="status-left">
        <span class="status-label">
          共 <strong>{{ totalResults }}</strong> 条结果
          <span v-if="lastKeyword" class="status-kw">「{{ lastKeyword }}」</span>
        </span>
      </div>
    </div>

    <!-- Results -->
    <div class="results-section">
      <!-- Skeleton -->
      <div v-if="loading" class="results-grid">
        <div v-for="i in 12" :key="i" class="skeleton-card">
          <div class="skeleton-img"></div>
          <div class="skeleton-title"></div>
          <div class="skeleton-meta"></div>
        </div>
      </div>

      <!-- Grid -->
      <template v-else-if="results.length > 0">
        <div class="results-grid">
          <div
            v-for="(item, index) in results"
            :key="item.id || index"
            class="movie-card"
            :style="{ animationDelay: `${index * 0.04}s` }"
            @click="goToDetail(item)"
          >
            <div class="movie-poster">
              <img
                :src="item.videoCover || item.poster || '/placeholder.jpg'"
                :alt="item.videoTitle"
                loading="lazy"
                @error="handleImgError"
              />
              <div class="poster-overlay">
                <IconifyIconOnline icon="ep:video-play" class="overlay-icon" />
              </div>
              <span class="movie-year" v-if="item.year || item.videoYear">{{ item.year || item.videoYear }}</span>
            </div>
            <div class="movie-info">
              <h3 class="movie-name">{{ item.videoTitle || item.videoName }}</h3>
              <div class="movie-meta">
                <span v-if="item.videoType" class="movie-tag">{{ item.videoType.split(',').slice(0, 2).join('/') }}</span>
                <span v-if="item.rating || item.videoScore" class="movie-rating">
                  <IconifyIconOnline icon="ep:star-filled" />
                  {{ item.rating || item.videoScore }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Pagination -->
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

      <!-- Empty -->
      <div v-else-if="!loading" class="empty-state">
        <IconifyIconOnline icon="ep:search" class="empty-icon" />
        <p>{{ searched ? '没有找到相关影视' : '输入关键词开始搜索' }}</p>
        <span>{{ searched ? '试试其他关键词吧' : '支持影视名称、演员、导演搜索' }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { videoCategories, movieTypes, generateYearOptions } from "../../data/categories";

interface VideoResult {
  id: string;
  videoName?: string;
  videoTitle?: string;
  videoCover?: string;
  videoType?: string;
  videoYear?: number;
  videoDuration?: string;
  videoDescription?: string;
  poster?: string;
  rating?: number;
  year?: number;
  videoOriginId?: string;
  [key: string]: any;
}

const router = useRouter();

// State
const searchKeyword = ref("");
const loading = ref(false);
const searched = ref(false);
const lastKeyword = ref("");
const results = ref<VideoResult[]>([]);
const currentPage = ref(1);
const totalResults = ref(0);
const pageSize = 20;

const currentCategory = ref("");
const filterGenre = ref("");
const filterYear = ref("");
const filterRegion = ref("");
const filterSort = ref("");
const filterResolution = ref("");

const genreOptions = movieTypes;
const yearOptions = generateYearOptions();

const regionOptions = [
  { label: "全部", value: "" },
  { label: "中国大陆", value: "中国大陆" },
  { label: "中国香港", value: "中国香港" },
  { label: "中国台湾", value: "中国台湾" },
  { label: "美国", value: "美国" },
  { label: "韩国", value: "韩国" },
  { label: "日本", value: "日本" },
  { label: "英国", value: "英国" },
  { label: "法国", value: "法国" },
  { label: "其他", value: "其他" },
];

const sortOptions = [
  { label: "默认", value: "" },
  { label: "最新", value: "latest" },
  { label: "最热", value: "hot" },
  { label: "评分", value: "rating" },
];

const resolutionOptions = [
  { label: "全部", value: "" },
  { label: "高清", value: "HD" },
  { label: "超清", value: "FHD" },
  { label: "4K", value: "4K" },
];

const totalPages = computed(() => Math.max(1, Math.ceil(totalResults.value / pageSize)));

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

function handleImgError(e: Event) {
  const img = e.target as HTMLImageElement;
  img.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="280" fill="%23eee"><rect width="200" height="280"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%23aaa" font-size="14">暂无封面</text></svg>';
}

async function fetchVideos(page: number = 1) {
  loading.value = true;
  currentPage.value = page;
  searched.value = true;
  lastKeyword.value = searchKeyword.value.trim();

  try {
    const keyword = searchKeyword.value.trim();
    const cat = currentCategory.value;

    if (keyword) {
      // 全网搜索（数据库 + 所有外部Provider）
      const params = new URLSearchParams();
      params.set("keyword", keyword);
      if (cat) params.set("type", cat);
      if (filterGenre.value) params.set("videoType", filterGenre.value);
      if (filterYear.value) params.set("year", filterYear.value);
      if (filterRegion.value) params.set("district", filterRegion.value);
      params.set("page", String(page));
      params.set("pageSize", String(pageSize));

      const res = await fetch(`/api/v1/video/search-all?${params}`);
      const raw = await res.json();
      const d = raw?.data;
      const list = d?.data || d?.list || [];
      totalResults.value = d?.total || list.length;
      results.value = list;
    } else {
      // 数据库搜索（仅过滤条件）
      const body: Record<string, any> = { page, pageSize };
      if (cat) body.selectedType = cat;
      if (filterGenre.value) body.videoTypes = filterGenre.value;
      if (filterYear.value) body.years = filterYear.value;
      if (filterRegion.value) body.districts = filterRegion.value;
      if (filterSort.value) body.order = filterSort.value;

      const res = await fetch(`/api/v1/video/page`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const raw = await res.json();
      const d = raw?.data;
      const list = d?.data || d?.list || [];
      totalResults.value = d?.total || list.length;
      results.value = list;
    }
  } catch (err) {
    console.error("搜索失败:", err);
    results.value = [];
    totalResults.value = 0;
  } finally {
    loading.value = false;
  }
}

function switchCategory(cat: string) {
  currentCategory.value = cat;
  fetchVideos(1);
}

function handleSearch() {
  fetchVideos(1);
}

function changePage(page: number) {
  if (page < 1 || page > totalPages.value) return;
  fetchVideos(page);
  window.scrollTo({ top: 200, behavior: "smooth" });
}

function goToDetail(item: VideoResult) {
  const id = item.id || item.videoOriginId;
  if (id) router.push({ path: `/video/detail/${id}`, state: { item } });
}

function goTaskManage() {
  router.push("/video/manage/task");
}

function goParse() {
  router.push("/video/parse");
}

// Auto-load on mount
onMounted(() => {
  fetchVideos(1);
});
</script>

<style scoped>
.video-search-page {
  width: 100%;
  min-height: 100vh;
  background: #08080f;
}

/* ── Top Bar ── */
.top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 24px;
  background: rgba(255,255,255,.02);
  border-bottom: 1px solid rgba(255,255,255,.05);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  position: sticky; top: 0; z-index: 50;
  gap: 16px;
}

.top-bar-left {
  display: flex;
  align-items: center;
  gap: 20px;
  flex: 1;
  min-width: 0;
}

.top-logo {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}
.top-logo-icon {
  width: 32px; height: 32px;
  background: linear-gradient(135deg,#6366f1,#a855f7);
  border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  font-size: 18px; color: #fff;
}
.top-logo-text {
  font-size: 16px; font-weight: 700;
  background: linear-gradient(135deg,#e0e7ff,#a5b4fc);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* Categories inline */
.category-inline {
  display: flex;
  gap: 2px;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  flex: 1;
  min-width: 0;
}
.cat-tab {
  padding: 4px 12px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: rgba(255,255,255,.4);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  transition: all .2s ease;
}
.cat-tab:hover {
  color: rgba(255,255,255,.7);
  background: rgba(255,255,255,.04);
}
.cat-tab.active {
  color: #a5b4fc;
  background: rgba(99,102,241,.12);
}

.top-bar-right {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

/* Inline search */
.search-inline {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0 12px;
  height: 36px;
  width: 220px;
  background: rgba(255,255,255,.04);
  border: 1px solid rgba(255,255,255,.06);
  border-radius: 10px;
  transition: all .3s ease;
}
.search-inline:focus-within {
  border-color: rgba(99,102,241,.4);
  box-shadow: 0 0 0 1px rgba(99,102,241,.1);
  background: rgba(255,255,255,.06);
  width: 280px;
}
.search-ico { font-size: 15px; color: rgba(255,255,255,.25); flex-shrink: 0; }
.search-input-inline {
  flex: 1; height: 100%;
  border: none; outline: none;
  font-size: 13px; color: #fff;
  background: transparent;
  min-width: 0;
}
.search-input-inline::placeholder { color: rgba(255,255,255,.2); }

.clear-btn-sm {
  width: 20px; height: 20px;
  border: none; border-radius: 50%;
  background: rgba(255,255,255,.08);
  color: rgba(255,255,255,.35);
  cursor: pointer; font-size: 10px;
  display: flex; align-items: center; justify-content: center;
  transition: all .2s; flex-shrink: 0;
}
.clear-btn-sm:hover { background: rgba(255,255,255,.15); color: #fff; }

/* Task button */
.top-bar-btn {
  width: 36px; height: 36px;
  border: 1px solid rgba(255,255,255,.08);
  border-radius: 10px;
  background: rgba(255,255,255,.04);
  color: rgba(255,255,255,.45);
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  font-size: 18px;
  transition: all .25s ease;
}
.top-bar-btn:hover {
  background: rgba(99,102,241,.12);
  color: #a5b4fc;
  border-color: rgba(99,102,241,.25);
}

/* ── Filter Bar ── */
.filter-bar {
  padding: 12px 24px 4px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.filter-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.filter-label {
  font-size: 12px;
  font-weight: 600;
  color: rgba(255,255,255,.3);
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
  min-width: 48px;
}
.filter-label .iconify {
  font-size: 13px;
}

.filter-pills {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
  align-items: center;
}
.pill {
  padding: 4px 12px;
  border: 1px solid rgba(255,255,255,.06);
  border-radius: 6px;
  background: rgba(255,255,255,.02);
  color: rgba(255,255,255,.4);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  transition: all .2s ease;
}
.pill:hover {
  color: rgba(255,255,255,.65);
  background: rgba(255,255,255,.05);
  border-color: rgba(255,255,255,.1);
}
.pill.active {
  color: #a5b4fc;
  background: rgba(99,102,241,.12);
  border-color: rgba(99,102,241,.25);
}

.pill-select {
  padding: 3px 8px;
  border: 1px solid rgba(255,255,255,.06);
  border-radius: 6px;
  background: rgba(255,255,255,.02);
  color: rgba(255,255,255,.4);
  font-size: 12px;
  outline: none;
  cursor: pointer;
  transition: all .2s;
}
.pill-select:focus {
  border-color: rgba(99,102,241,.3);
}
.pill-select option { background: #1a1a2e; color: #fff; }

.search-btn-filter {
  height: 30px; padding: 0 16px;
  border: none; border-radius: 6px;
  font-size: 12px; font-weight: 600; color: #fff;
  background: linear-gradient(135deg,#6366f1,#a855f7);
  cursor: pointer;
  display: flex; align-items: center; gap: 4px;
  transition: all .3s ease;
  box-shadow: 0 2px 8px rgba(99,102,241,.2);
  flex-shrink: 0;
  margin-left: auto;
}
.search-btn-filter:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(99,102,241,.3);
}
.search-btn-filter:disabled { opacity: .5; cursor: not-allowed; }

/* ── Status ── */
.status-bar {
  padding: 0 24px 12px;
  display: flex; align-items: center;
}
.status-label {
  font-size: 13px; color: rgba(255,255,255,.35);
}
.status-label strong { color: rgba(255,255,255,.6); font-weight: 600; }
.status-kw { color: #a5b4fc; margin-left: 4px; }

/* ── Results ── */
.results-section { padding: 0 24px 60px; }

.results-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 16px;
}

/* Skeleton */
.skeleton-card {
  background: rgba(255,255,255,.02);
  border-radius: 12px; overflow: hidden;
  border: 1px solid rgba(255,255,255,.05);
}
.skeleton-img {
  width: 100%; padding-bottom: 140%;
  background: linear-gradient(90deg, rgba(255,255,255,.02) 25%, rgba(255,255,255,.06) 50%, rgba(255,255,255,.02) 75%);
  background-size: 200% 100%; animation: shimmer 1.8s ease-in-out infinite;
}
.skeleton-title {
  height: 12px; margin: 10px 10px 6px; border-radius: 4px;
  background: linear-gradient(90deg, rgba(255,255,255,.02) 25%, rgba(255,255,255,.06) 50%, rgba(255,255,255,.02) 75%);
  background-size: 200% 100%; animation: shimmer 1.8s ease-in-out infinite;
}
.skeleton-meta {
  height: 10px; margin: 0 10px 10px; border-radius: 4px; width: 40%;
  background: linear-gradient(90deg, rgba(255,255,255,.02) 25%, rgba(255,255,255,.06) 50%, rgba(255,255,255,.02) 75%);
  background-size: 200% 100%; animation: shimmer 1.8s ease-in-out infinite;
}
@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

/* Cards */
.movie-card {
  background: rgba(255,255,255,.02);
  border-radius: 12px; overflow: hidden;
  cursor: pointer;
  transition: all .35s cubic-bezier(.34,1.56,.64,1);
  border: 1px solid rgba(255,255,255,.06);
  animation: cardIn .5s ease both;
  position: relative;
}
.movie-card::after {
  content: '';
  position: absolute; inset: 0;
  border-radius: 12px; pointer-events: none;
  opacity: 0; transition: opacity .4s ease;
  box-shadow: 0 0 0 1px rgba(99,102,241,.3), 0 12px 48px rgba(99,102,241,.12);
}
.movie-card:hover::after { opacity: 1; }

@keyframes cardIn { from { opacity: 0; transform: translateY(16px) scale(.97); } to { opacity: 1; transform: translateY(0) scale(1); } }

.movie-card:hover {
  transform: translateY(-5px) scale(1.02);
  border-color: rgba(99,102,241,.2);
  background: rgba(255,255,255,.05);
}

.movie-poster {
  position: relative;
  width: 100%; padding-bottom: 140%;
  overflow: hidden;
  background: rgba(0,0,0,.3);
}
.movie-poster img {
  position: absolute; inset: 0;
  width: 100%; height: 100%;
  object-fit: cover;
  transition: transform .5s cubic-bezier(.34,1.56,.64,1);
}
.movie-card:hover .movie-poster img { transform: scale(1.1); }

.poster-overlay {
  position: absolute; inset: 0;
  background: linear-gradient(135deg,rgba(99,102,241,.5),rgba(168,85,247,.5));
  display: flex; align-items: center; justify-content: center;
  opacity: 0; transition: opacity .3s ease;
  backdrop-filter: blur(3px); -webkit-backdrop-filter: blur(3px);
}
.movie-card:hover .poster-overlay { opacity: 1; }

.overlay-icon {
  font-size: 36px; color: #fff;
  filter: drop-shadow(0 3px 12px rgba(0,0,0,.4));
  transform: scale(.8);
  transition: transform .3s cubic-bezier(.34,1.56,.64,1);
}
.movie-card:hover .overlay-icon { transform: scale(1); }

.movie-year {
  position: absolute; top: 6px; right: 6px;
  padding: 2px 7px;
  font-size: 10px; font-weight: 700; color: #fff;
  background: rgba(0,0,0,.55);
  backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px);
  border-radius: 5px;
}

.movie-info { padding: 10px; }
.movie-name {
  font-size: 13px; font-weight: 600; color: #e0e7ff;
  margin: 0 0 6px; line-height: 1.3;
  display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; overflow: hidden;
}
.movie-meta { display: flex; align-items: center; justify-content: space-between; gap: 4px; }
.movie-tag {
  font-size: 10px; color: rgba(255,255,255,.4);
  padding: 2px 7px; background: rgba(255,255,255,.05);
  border-radius: 4px; font-weight: 500;
}
.movie-rating {
  font-size: 11px; color: #fbbf24;
  display: flex; align-items: center; gap: 2px; font-weight: 600;
}

/* Pagination */
.pagination {
  display: flex; justify-content: center; align-items: center;
  gap: 6px; margin-top: 36px;
}
.page-btn {
  min-width: 36px; height: 36px; padding: 0 10px;
  border: 1px solid rgba(255,255,255,.08);
  border-radius: 10px;
  background: rgba(255,255,255,.03);
  color: rgba(255,255,255,.5);
  font-size: 13px; font-weight: 500;
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
  box-shadow: 0 3px 12px rgba(99,102,241,.3);
}
.page-btn:disabled { opacity: .25; cursor: not-allowed; }

/* Empty */
.empty-state { text-align: center; padding: 60px 20px; }
.empty-icon { font-size: 56px; color: rgba(255,255,255,.05); margin-bottom: 14px; }
.empty-state p { font-size: 15px; color: rgba(255,255,255,.4); margin: 0 0 4px; font-weight: 500; }
.empty-state span { font-size: 13px; color: rgba(255,255,255,.2); }

/* ── Responsive ── */
@media (max-width: 900px) {
  .top-bar { flex-wrap: wrap; padding: 10px 16px; gap: 10px; }
  .top-bar-left { flex: auto; width: 100%; }
  .top-bar-right { width: 100%; }
  .search-inline { flex: 1; width: auto; }
  .search-inline:focus-within { width: auto; }
}

@media (max-width: 768px) {
  .filter-bar { padding: 8px 16px 4px; }
  .filter-row { gap: 6px; }
  .filter-label { min-width: auto; font-size: 11px; }
  .pill { font-size: 11px; padding: 3px 8px; }
  .search-btn-filter { margin-left: 0; width: 100%; justify-content: center; }

  .results-section { padding: 0 16px 40px; }
  .results-grid { grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 10px; }
  .status-bar { padding: 0 16px 10px; }
}

@media (max-width: 480px) {
  .results-grid { grid-template-columns: repeat(2, 1fr); gap: 8px; }
  .results-section { padding: 0 12px 32px; }
}
</style>
