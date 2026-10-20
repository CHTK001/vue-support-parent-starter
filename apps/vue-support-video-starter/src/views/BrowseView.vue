<script setup lang="ts">
/**
 * 检索结果页（第三版 · 参照站复刻）
 *
 * 参照站 /search 结构：`.search_head`（灰底圆角条：左侧类型标签、
 * 右侧辅助信息）+ `.sr_lists`（每行 = 140×200 海报 + 多行文字，
 * 标题 18px/700 蓝色，下面依次是 类型/地区/标签、简介、评分、导演、主演）。
 */
import { computed, onMounted, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { fetchVideoList } from "@/api/videoApi";
import type { VideoInfo, VideoQuery } from "@/types/video";

const route = useRoute();

/* ── 状态 ─────────────────────────────────── */
const loading = ref(false);
const error = ref("");
const videos = ref<VideoInfo[]>([]);
const total = ref(0);
const activeType = ref("");

/** 关键词跟随路由（顶部搜索框跳转到本页时带 keyword） */
const keyword = computed(() => String(route.query.keyword ?? ""));

/** 类型标签（参照站 .l 区） */
const TYPE_OPTIONS = [
  { value: "", label: "全部" },
  { value: "movie", label: "电影" },
  { value: "tv", label: "剧集" },
  { value: "anime", label: "动漫" },
  { value: "variety", label: "综艺" },
  { value: "documentary", label: "纪录片" },
] as const;

/* ── 数据加载 ─────────────────────────────── */
async function load() {
  loading.value = true;
  error.value = "";
  const query: VideoQuery = {
    keyword: keyword.value.trim() || undefined,
    videoType: activeType.value || undefined,
    page: 1,
    pageSize: 100,
  };
  try {
    const result = await fetchVideoList(query);
    videos.value = result.list ?? [];
    total.value = result.total ?? videos.value.length;
  } catch (e) {
    error.value = e instanceof Error ? e.message : "数据加载失败，请确认后端服务已启动";
    videos.value = [];
    total.value = 0;
  } finally {
    loading.value = false;
  }
}

/** 每行的第二行文字：类型 / 地区 / 年份 / 标签 */
function lineMeta(item: VideoInfo) {
  const typeLabel =
    TYPE_OPTIONS.find((t) => t.value === item.videoType)?.label ?? item.videoType ?? "";
  return [typeLabel, item.district, item.year, ...(item.tags ?? [])].filter(Boolean).join(" / ");
}

watch(keyword, () => {
  activeType.value = "";
  void load();
});

watch(activeType, () => void load());

onMounted(() => void load());
</script>

<template>
  <div class="vd-page">
    <!-- ── 检索头（参照站 .search_head） ─────── -->
    <div class="vdsr-head">
      <div class="vdsr-head-l">
        <button
          v-for="t in TYPE_OPTIONS"
          :key="t.value"
          type="button"
          class="vdsr-tab"
          :class="{ 'is-active': activeType === t.value }"
          @click="activeType = t.value"
        >
          {{ t.label }}
        </button>
      </div>

      <div class="vdsr-head-r">
        <span class="vdsr-tip">
          <template v-if="keyword">「{{ keyword }}」</template>
          <template v-else>全部资源</template>
          共 {{ total }} 条
        </span>
      </div>
    </div>

    <!-- 加载失败 -->
    <div v-if="error && !loading" class="vd-empty">
      <el-empty :description="error">
        <el-button type="primary" @click="load">重试</el-button>
      </el-empty>
    </div>

    <!-- 骨架 -->
    <div v-else-if="loading" class="vdsr-lists" aria-busy="true">
      <div v-for="i in 6" :key="i" class="vdsr-row">
        <div class="vdsr-img vd-poster-skeleton" />
        <div class="vdsr-text">
          <div class="vd-poster-skeleton vdsr-sk-line" style="width: 40%" />
          <div class="vd-poster-skeleton vdsr-sk-line" style="width: 80%" />
          <div class="vd-poster-skeleton vdsr-sk-line" style="width: 65%" />
        </div>
      </div>
    </div>

    <template v-else>
      <!-- ── 结果列表（参照站 .sr_lists > .v5d） ── -->
      <div v-if="videos.length" class="vdsr-lists">
        <div v-for="item in videos" :key="item.id" class="vdsr-row">
          <div class="vdsr-img">
            <router-link :to="{ name: 'watch', params: { id: item.id } }">
              <img v-if="item.cover" :src="item.cover" :alt="item.name" loading="lazy" />
              <div v-else class="vdsr-img-fallback">暂无封面</div>
            </router-link>
          </div>

          <div class="vdsr-text">
            <h3 class="vdsr-title">
              <router-link :to="{ name: 'watch', params: { id: item.id } }">
                {{ item.name }}<template v-if="item.year"> ({{ item.year }})</template>
              </router-link>
            </h3>
            <p v-if="lineMeta(item)" class="vdsr-line">{{ lineMeta(item) }}</p>
            <p v-if="item.remark" class="vdsr-line">{{ item.remark }}</p>
            <p v-if="item.score" class="vdsr-line">评分： {{ item.score.toFixed(1) }}</p>
            <p v-if="item.director" class="vdsr-line">导演： {{ item.director }}</p>
            <p v-if="item.continueInfo" class="vdsr-line">状态： {{ item.continueInfo }}</p>
          </div>
        </div>
      </div>

      <div v-else class="vd-empty">
        <el-empty :description="keyword ? `没有找到「${keyword}」相关的影片` : '暂无影片数据'" />
      </div>
    </template>
  </div>
</template>

<style scoped>
/* ═══════════════════════════════════════════
   检索头（灰底圆角条）
   ═══════════════════════════════════════════ */
.vdsr-head {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 16px;
  margin: 16px 0;
  background: var(--vd-surface);
  border: 1px solid var(--vd-border);
  border-radius: 8px;
  flex-wrap: wrap;
}

.vdsr-head-l {
  display: flex;
  flex-direction: row;
  gap: 4px;
  flex-wrap: wrap;
}

.vdsr-tab {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 4px;
  padding: 6px 14px;
  border: none;
  background: none;
  border-radius: 6px;
  font-family: inherit;
  font-size: 16px;
  font-weight: 500;
  line-height: 24px;
  color: var(--vd-text);
  cursor: pointer;
  transition:
    background var(--vd-fast) var(--vd-ease),
    color var(--vd-fast) var(--vd-ease);
}

.vdsr-tab:hover {
  color: var(--vd-primary);
}

.vdsr-tab:focus-visible {
  outline: 2px solid var(--vd-primary);
  outline-offset: 1px;
}

.vdsr-tab.is-active {
  background: var(--vd-primary);
  color: #fff;
  font-weight: 600;
}

.vdsr-head-r {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;
  padding-left: 16px;
  margin-left: 16px;
  border-left: 1px solid var(--vd-border);
}

.vdsr-tip {
  font-size: 14px;
  line-height: 21px;
  color: var(--vd-text-2);
}

/* ═══════════════════════════════════════════
   结果列表
   ═══════════════════════════════════════════ */
.vdsr-lists {
  padding: 20px 0 0;
}

.vdsr-row {
  display: flex;
  flex-direction: row;
  gap: 0;
  margin: 0 0 20px;
}

.vdsr-img {
  width: 140px;
  height: 200px;
  flex-shrink: 0;
  margin-right: 20px;
  background: var(--vd-surface);
  border-radius: 5px;
  overflow: hidden;
}

.vdsr-img img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.vdsr-img-fallback {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  color: var(--vd-text-2);
  background: var(--vd-surface);
}

.vdsr-text {
  flex: 1;
  min-width: 0;
}

.vdsr-title {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  line-height: 27px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.vdsr-title a {
  color: var(--vd-link);
}

.vdsr-title a:hover {
  color: var(--vd-primary);
}

.vdsr-line {
  margin: 10px 0 0;
  font-size: 16px;
  line-height: 24px;
  color: var(--vd-text);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* ── 骨架 ── */
.vdsr-sk-line {
  height: 18px;
  margin-bottom: 12px;
  border-radius: 4px;
}

@media (max-width: 760px) {
  .vdsr-head-r {
    padding-left: 0;
    margin-left: 0;
    border-left: none;
  }
  .vdsr-img {
    width: 100px;
    height: 143px;
    margin-right: 12px;
  }
  .vdsr-title {
    font-size: 16px;
    line-height: 24px;
  }
  .vdsr-line {
    font-size: 14px;
    line-height: 21px;
    margin-top: 6px;
    -webkit-line-clamp: 1;
  }
}

@media (prefers-reduced-motion: reduce) {
  .vdsr-tab {
    transition: none;
  }
}
</style>
