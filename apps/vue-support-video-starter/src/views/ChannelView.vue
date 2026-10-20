<script setup lang="ts">
/**
 * 频道页（第三版 · 参照站复刻）
 *
 * 参照站列表页结构：`.list-box > dl`（每行 48px 标签 + 换行标签组）
 * → `.sort`（左排序 / 右统计）→ `.wrap > ul.content-list`（6 列栅格）。
 *
 * 筛选与排序都在已取回的列表上完成（后端 /video/list 只接受
 * keyword/videoType/page/pageSize 等参数），因此分页也在本地切片。
 */
import { computed, onMounted, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { fetchVideoList } from "@/api/videoApi";
import type { VideoInfo } from "@/types/video";
import VideoCard from "@/components/VideoCard.vue";

const route = useRoute();

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
const page = ref(1);
const pageSize = 48;

/** 筛选条件（"" 表示全部） */
const filterDistrict = ref("");
const filterYear = ref("");
const filterTag = ref("");

const SORT_OPTIONS = [
  { value: "update", label: "最近更新" },
  { value: "score", label: "评分最高" },
  { value: "year", label: "年份最新" },
] as const;
const sort = ref<string>("update");

/* ── 数据加载 ─────────────────────────────── */
async function load() {
  loading.value = true;
  error.value = "";
  try {
    const result = await fetchVideoList({
      videoType: channelType.value,
      page: 1,
      pageSize: 200,
    });
    videos.value = result.list ?? [];
  } catch (e) {
    error.value = e instanceof Error ? e.message : "数据加载失败，请确认后端服务已启动";
    videos.value = [];
  } finally {
    loading.value = false;
  }
}

/** 筛选行取值来源：当前列表里实际出现的地区 / 年份 / 标签 */
const districts = computed(() =>
  [...new Set(videos.value.map((v) => v.district).filter(Boolean))].slice(0, 20) as string[],
);
const years = computed(() =>
  [...new Set(videos.value.map((v) => v.year).filter(Boolean))]
    .sort((a, b) => Number(b) - Number(a))
    .slice(0, 15) as string[],
);
const tags = computed(() => {
  const counter = new Map<string, number>();
  videos.value.forEach((v) => v.tags?.forEach((t) => counter.set(t, (counter.get(t) ?? 0) + 1)));
  return [...counter.entries()].sort((a, b) => b[1] - a[1]).slice(0, 18).map(([t]) => t);
});

/** 过滤 + 排序后的结果 */
const filtered = computed(() => {
  const list = videos.value.filter(
    (v) =>
      (!filterDistrict.value || v.district === filterDistrict.value) &&
      (!filterYear.value || v.year === filterYear.value) &&
      (!filterTag.value || v.tags?.includes(filterTag.value)),
  );
  if (sort.value === "score") return [...list].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  if (sort.value === "year") return [...list].sort((a, b) => Number(b.year ?? 0) - Number(a.year ?? 0));
  return list;
});

/** 当前页数据 */
const paged = computed(() => filtered.value.slice((page.value - 1) * pageSize, page.value * pageSize));

/** 清空筛选 */
function resetFilters() {
  filterDistrict.value = "";
  filterYear.value = "";
  filterTag.value = "";
  page.value = 1;
}

// 任一筛选条件变化都回到第 1 页
watch([filterDistrict, filterYear, filterTag, sort], () => {
  page.value = 1;
});

// 频道切换：重置筛选并滚回顶部
watch(channelType, () => {
  resetFilters();
  window.scrollTo({ top: 0, behavior: "smooth" });
  void load();
});

watch(page, () => window.scrollTo({ top: 0, behavior: "smooth" }));

onMounted(() => void load());
</script>

<template>
  <div class="vd-page">
    <!-- ── 筛选行（参照站 dl.c0 / c1 / c2） ───── -->
    <div class="vd-filter-rows">
      <div class="vd-filter-row">
        <span class="vd-filter-label">地区 :</span>
        <div class="vd-filter-values">
          <button type="button" class="vd-chip" :class="{ 'is-active': !filterDistrict }" @click="filterDistrict = ''">
            全部
          </button>
          <button
            v-for="d in districts"
            :key="d"
            type="button"
            class="vd-chip"
            :class="{ 'is-active': filterDistrict === d }"
            @click="filterDistrict = d"
          >
            {{ d }}
          </button>
        </div>
      </div>

      <div class="vd-filter-row">
        <span class="vd-filter-label">年份 :</span>
        <div class="vd-filter-values">
          <button type="button" class="vd-chip" :class="{ 'is-active': !filterYear }" @click="filterYear = ''">
            全部
          </button>
          <button
            v-for="y in years"
            :key="y"
            type="button"
            class="vd-chip"
            :class="{ 'is-active': filterYear === y }"
            @click="filterYear = y"
          >
            {{ y }}
          </button>
        </div>
      </div>

      <div class="vd-filter-row">
        <span class="vd-filter-label">标签 :</span>
        <div class="vd-filter-values">
          <button type="button" class="vd-chip" :class="{ 'is-active': !filterTag }" @click="filterTag = ''">
            全部
          </button>
          <button
            v-for="t in tags"
            :key="t"
            type="button"
            class="vd-chip"
            :class="{ 'is-active': filterTag === t }"
            @click="filterTag = t"
          >
            {{ t }}
          </button>
        </div>
      </div>
    </div>

    <!-- ── 排序 / 统计条（参照站 .sort） ─────── -->
    <div class="vd-sort">
      <div class="vd-sort-left">
        <div class="vd-sort-group">
          <span class="vd-sort-label">排序 :</span>
          <button
            v-for="opt in SORT_OPTIONS"
            :key="opt.value"
            type="button"
            class="vd-chip"
            :class="{ 'is-active': sort === opt.value }"
            @click="sort = opt.value"
          >
            {{ opt.label }}
          </button>
        </div>
      </div>
      <div class="vd-sort-right">{{ channel.label }} · 共 {{ filtered.length }} 部</div>
    </div>

    <!-- 加载失败 -->
    <div v-if="error && !loading" class="vd-empty">
      <el-empty :description="error">
        <el-button type="primary" @click="load">重试</el-button>
      </el-empty>
    </div>

    <!-- 骨架 -->
    <div v-else-if="loading" class="vd-grid" aria-busy="true">
      <div v-for="i in 12" :key="i" class="vd-poster-skeleton" style="aspect-ratio: 2 / 3" />
    </div>

    <template v-else>
      <div v-if="paged.length" class="vd-grid">
        <VideoCard v-for="item in paged" :key="item.id" :item="item" />
      </div>

      <div v-else class="vd-empty">
        <el-empty :description="videos.length ? '没有符合筛选条件的影片' : '该频道暂无内容'">
          <el-button v-if="videos.length" type="primary" @click="resetFilters">清空筛选</el-button>
        </el-empty>
      </div>

      <div v-if="filtered.length > pageSize" class="vd-pagination">
        <el-pagination
          v-model:current-page="page"
          :page-size="pageSize"
          :total="filtered.length"
          layout="prev, pager, next, jumper, total"
          background
        />
      </div>
    </template>
  </div>
</template>
