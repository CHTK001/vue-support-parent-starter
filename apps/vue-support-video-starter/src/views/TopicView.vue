<script setup lang="ts">
/**
 * 专题
 *
 * 不做人工运营后台，按「题材 / 地区 / 年份 / 口碑」从片库里实时归类，
 * 一个片单就是一个筛选条件，数据全部来自 /video/list。
 */
import { computed, onMounted, ref } from "vue";
import type { RouteLocationRaw } from "vue-router";

import { fetchVideoList } from "@/api/videoApi";
import type { VideoInfo } from "@/types/video";
import VideoCard from "@/components/VideoCard.vue";

interface Topic {
  key: string;
  title: string;
  desc: string;
  test: (v: VideoInfo) => boolean;
  more?: RouteLocationRaw;
}

/** 有标签交集即命中 */
function hasTag(v: VideoInfo, tags: string[]): boolean {
  return (v.tags ?? []).some((t) => tags.includes(t));
}

const TOPICS: Topic[] = [
  {
    key: "top",
    title: "高分必看",
    desc: "评分 9.3 以上，口碑最稳的一批",
    test: (v) => (v.score ?? 0) >= 9.3,
    more: { name: "rank" },
  },
  {
    key: "doc",
    title: "纪录片精选",
    desc: "自然、人文与历史纪实",
    test: (v) => v.videoType === "documentary",
    more: { name: "channel", params: { type: "documentary" } },
  },
  {
    key: "crime",
    title: "悬疑推理",
    desc: "悬疑 / 犯罪 / 权谋，一口气看完",
    test: (v) => hasTag(v, ["悬疑", "犯罪", "权谋"]),
  },
  {
    key: "scifi",
    title: "科幻宇宙",
    desc: "科幻 / 奇幻 / 冒险",
    test: (v) => hasTag(v, ["科幻", "奇幻", "冒险"]),
  },
  {
    key: "anime",
    title: "热血动漫",
    desc: "热血 / 战斗 / 国创",
    test: (v) => v.videoType === "anime",
    more: { name: "channel", params: { type: "anime" } },
  },
  {
    key: "cn",
    title: "国产剧集",
    desc: "中国出品的剧集与综艺",
    test: (v) =>
      v.district === "中国" && (v.videoType === "tv" || v.videoType === "variety"),
    more: { name: "channel", params: { type: "tv" } },
  },
  {
    key: "classic",
    title: "经典重温",
    desc: "2000 年以前上映的老片",
    test: (v) => Number(v.year) < 2000,
  },
];

const loading = ref(false);
const error = ref(false);
const all = ref<VideoInfo[]>([]);

const sections = computed(() =>
  TOPICS.map((topic) => ({ ...topic, items: all.value.filter(topic.test) })).filter(
    (topic) => topic.items.length > 0,
  ),
);

async function load() {
  loading.value = true;
  error.value = false;
  try {
    const result = await fetchVideoList({ page: 1, pageSize: 60 });
    all.value = result.list ?? [];
  } catch {
    all.value = [];
    error.value = true;
  } finally {
    loading.value = false;
  }
}

onMounted(load);
</script>

<template>
  <div class="vd-page">
    <header class="vdt-head">
      <h1 class="vdt-title">专题</h1>
      <p class="vdt-lead">
        按题材、地区与口碑从片库实时归类，共 {{ sections.length }} 个片单；同一部片可以出现在多个专题里。
      </p>
    </header>

    <!-- 骨架 -->
    <template v-if="loading">
      <section v-for="n in 2" :key="n" class="vd-section">
        <div class="vd-section-head">
          <div class="vd-poster-skeleton vdt-sk-title" />
        </div>
        <div class="vd-grid">
          <div v-for="i in 6" :key="i" class="vd-poster-skeleton vdt-sk-card" />
        </div>
      </section>
    </template>

    <div v-else-if="error" class="vd-empty">
      <p class="vdt-empty-title">专题加载失败</p>
      <p class="vdt-empty-desc">请确认后端服务已启动后重试。</p>
      <button type="button" class="vdt-retry" @click="load">重新加载</button>
    </div>

    <div v-else-if="!sections.length" class="vd-empty">
      <p class="vdt-empty-title">片库暂无内容</p>
    </div>

    <template v-else>
      <section v-for="topic in sections" :key="topic.key" class="vd-section">
        <div class="vd-section-head">
          <div class="vdt-section-titles">
            <h2 class="vd-section-title">{{ topic.title }}</h2>
            <span class="vdt-desc">{{ topic.desc }} · {{ topic.items.length }} 部</span>
          </div>
          <router-link v-if="topic.more" class="vd-section-more" :to="topic.more">
            更多 ›
          </router-link>
        </div>
        <div class="vd-grid">
          <VideoCard v-for="item in topic.items" :key="item.id" :item="item" />
        </div>
      </section>
    </template>
  </div>
</template>

<style scoped>
.vdt-head {
  padding: 24px 0 0;
}

.vdt-title {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  line-height: 34px;
  color: var(--vd-text);
}

.vdt-lead {
  margin: 6px 0 0;
  font-size: 14px;
  line-height: 21px;
  color: var(--vd-text-2);
}

.vdt-section-titles {
  display: flex;
  align-items: baseline;
  gap: 10px;
  flex-wrap: wrap;
  min-width: 0;
}

.vdt-desc {
  font-size: 13px;
  line-height: 19.5px;
  color: var(--vd-text-2);
}

.vdt-sk-title {
  width: 160px;
  height: 20px;
}

.vdt-sk-card {
  aspect-ratio: 2 / 3;
}

.vdt-empty-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--vd-text);
}

.vdt-empty-desc {
  margin: 8px 0 0;
  font-size: 14px;
  color: var(--vd-text-2);
}

.vdt-retry {
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

.vdt-retry:hover {
  background: var(--vd-primary);
  color: #fff;
}

@media (max-width: 900px) {
  .vdt-head {
    padding-top: 18px;
  }
  .vdt-title {
    font-size: 21px;
    line-height: 30px;
  }
}
</style>
