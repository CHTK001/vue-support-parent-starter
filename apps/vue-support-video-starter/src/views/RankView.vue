<script setup lang="ts">
/**
 * 排行榜
 *
 * 数据取一次 `/video/list`（最多 60 条），排序在前端完成：
 *   评分榜 = 评分降序 → 年份降序
 *   最新榜 = 年份降序 → 评分降序
 */
import { computed, onMounted, ref } from "vue";

import { fetchVideoList } from "@/api/videoApi";
import type { VideoInfo } from "@/types/video";

type SortKey = "score" | "year";

const loading = ref(false);
const error = ref(false);
const items = ref<VideoInfo[]>([]);
const sort = ref<SortKey>("score");

const TABS: { key: SortKey; label: string; hint: string }[] = [
  { key: "score", label: "评分榜", hint: "按评分从高到低" },
  { key: "year", label: "最新榜", hint: "按上映年份从新到旧" },
];

const ranked = computed(() => {
  const list = [...items.value];
  if (sort.value === "score") {
    list.sort(
      (a, b) => (b.score ?? 0) - (a.score ?? 0) || Number(b.year ?? 0) - Number(a.year ?? 0),
    );
  } else {
    list.sort(
      (a, b) => Number(b.year ?? 0) - Number(a.year ?? 0) || (b.score ?? 0) - (a.score ?? 0),
    );
  }
  return list;
});

const activeHint = computed(() => TABS.find((t) => t.key === sort.value)?.hint ?? "");

function metaOf(item: VideoInfo): string {
  return [item.year, item.district, ...(item.tags ?? []).slice(0, 3)].filter(Boolean).join(" / ");
}

async function load() {
  loading.value = true;
  error.value = false;
  try {
    const result = await fetchVideoList({ page: 1, pageSize: 60 });
    items.value = result.list ?? [];
  } catch {
    items.value = [];
    error.value = true;
  } finally {
    loading.value = false;
  }
}

onMounted(load);
</script>

<template>
  <div class="vd-page">
    <header class="vdr-head">
      <h1 class="vdr-title">排行榜</h1>
      <p class="vdr-desc">{{ activeHint }}，共 {{ items.length }} 部。</p>
    </header>

    <div class="vd-tabs vdr-tabs">
      <button
        v-for="t in TABS"
        :key="t.key"
        type="button"
        class="vd-tab"
        :class="{ 'is-active': sort === t.key }"
        @click="sort = t.key"
      >
        {{ t.label }}
      </button>
    </div>

    <!-- 骨架 -->
    <div v-if="loading" class="vdr-list" aria-busy="true">
      <div v-for="i in 10" :key="i" class="vdr-row">
        <span class="vdr-no" />
        <div class="vd-poster-skeleton vdr-sk-poster" />
        <div class="vdr-body">
          <div class="vd-poster-skeleton vdr-sk-line" style="width: 40%" />
          <div class="vd-poster-skeleton vdr-sk-line" style="width: 62%" />
        </div>
      </div>
    </div>

    <div v-else-if="error" class="vd-empty">
      <p class="vdr-empty-title">排行榜加载失败</p>
      <p class="vdr-empty-desc">请确认后端服务已启动后重试。</p>
      <button type="button" class="vdr-retry" @click="load">重新加载</button>
    </div>

    <div v-else-if="!ranked.length" class="vd-empty">
      <p class="vdr-empty-title">暂无榜单数据</p>
    </div>

    <ol v-else class="vdr-list">
      <li v-for="(item, index) in ranked" :key="item.id" class="vdr-row">
        <span class="vdr-no" :class="{ 'is-top': index < 3 }">{{ index + 1 }}</span>
        <router-link class="vdr-link" :to="{ name: 'watch', params: { id: item.id } }">
          <div class="vdr-poster">
            <img v-if="item.cover" :src="item.cover" :alt="item.name" loading="lazy" />
            <div v-else class="vd-poster-fallback">暂无封面</div>
          </div>
          <div class="vdr-body">
            <h3 class="vdr-name">{{ item.name }}</h3>
            <p class="vdr-meta">{{ metaOf(item) }}</p>
            <p v-if="item.continueInfo" class="vdr-remark">{{ item.continueInfo }}</p>
          </div>
          <span class="vdr-score">{{ typeof item.score === "number" ? item.score.toFixed(1) : "—" }}</span>
        </router-link>
      </li>
    </ol>
  </div>
</template>

<style scoped>
.vdr-head {
  padding: 24px 0 0;
}

.vdr-title {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  line-height: 34px;
  color: var(--vd-text);
}

.vdr-desc {
  margin: 6px 0 0;
  font-size: 14px;
  line-height: 21px;
  color: var(--vd-text-2);
}

.vdr-tabs {
  margin: 18px 0 6px;
}

.vdr-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  column-gap: 44px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.vdr-row {
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 0;
  padding: 12px 0;
  border-bottom: 1px solid var(--vd-border);
}

.vdr-no {
  flex: 0 0 28px;
  width: 28px;
  text-align: center;
  font-size: 18px;
  font-weight: 700;
  color: var(--vd-text-3);
  font-variant-numeric: tabular-nums;
}

.vdr-no.is-top {
  color: var(--vd-primary);
  font-size: 21px;
}

.vdr-link {
  display: flex;
  flex: 1;
  min-width: 0;
  align-items: center;
  gap: 14px;
  color: inherit;
}

.vdr-poster {
  flex: 0 0 64px;
  width: 64px;
  aspect-ratio: 2 / 3;
  border-radius: 4px;
  overflow: hidden;
  background: var(--vd-surface);
}

.vdr-poster img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.vdr-poster .vd-poster-fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  font-size: 11px;
  color: var(--vd-text-3);
}

.vdr-body {
  flex: 1;
  min-width: 0;
}

.vdr-name {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
  line-height: 24px;
  color: var(--vd-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition: color var(--vd-fast) var(--vd-ease);
}

.vdr-link:hover .vdr-name {
  color: var(--vd-primary);
}

.vdr-meta,
.vdr-remark {
  margin: 2px 0 0;
  font-size: 13px;
  line-height: 19.5px;
  color: var(--vd-text-2);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.vdr-remark {
  color: var(--vd-text-3);
}

.vdr-score {
  flex: 0 0 auto;
  font-size: 18px;
  font-weight: 700;
  color: var(--vd-primary);
  font-variant-numeric: tabular-nums;
}

.vdr-sk-poster {
  flex: 0 0 64px;
  width: 64px;
  aspect-ratio: 2 / 3;
}

.vdr-sk-line {
  height: 12px;
  margin-bottom: 8px;
}

.vdr-empty-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--vd-text);
}

.vdr-empty-desc {
  margin: 8px 0 0;
  font-size: 14px;
  color: var(--vd-text-2);
}

.vdr-retry {
  margin-top: 16px;
  height: 32px;
  padding: 0 18px;
  border: 1px solid var(--vd-primary);
  border-radius: 5px;
  background: none;
  color: var(--vd-primary);
  font-family: inherit;
  font-size: 14px;
  cursor: pointer;
  transition: background var(--vd-fast) var(--vd-ease), color var(--vd-fast) var(--vd-ease);
}

.vdr-retry:hover {
  background: var(--vd-primary);
  color: #fff;
}

@media (max-width: 900px) {
  .vdr-head {
    padding-top: 18px;
  }
  .vdr-title {
    font-size: 21px;
    line-height: 30px;
  }
  .vdr-list {
    grid-template-columns: minmax(0, 1fr);
  }
  .vdr-row {
    padding: 10px 0;
  }
}

@media (max-width: 560px) {
  .vdr-row {
    gap: 10px;
  }
  .vdr-no {
    flex-basis: 22px;
    width: 22px;
    font-size: 16px;
  }
  .vdr-no.is-top {
    font-size: 18px;
  }
  .vdr-link {
    gap: 10px;
  }
  .vdr-poster {
    flex-basis: 54px;
    width: 54px;
  }
  .vdr-name {
    font-size: 15px;
    line-height: 22px;
  }
  .vdr-score {
    font-size: 16px;
  }
}
</style>
